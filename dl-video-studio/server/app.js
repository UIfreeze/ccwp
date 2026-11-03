// Request router. createApp() returns a plain (req, res) handler so tests can mount it on any port.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  HttpError, sendJson, readJson, parseCookies, sessionCookie, serveStatic, SECURITY_HEADERS,
} from './http.js';
import {
  SESSION_COOKIE, createSession, getSession, destroySession, verifyPassword, safeEqual, createRateLimiter,
} from './auth.js';
import { audit } from './db.js';
import {
  listProjects, createProject, getProject, updateProject, listActivity, addMember, removeMember,
} from './projects.js';
import {
  validateProject, validateMemberInput, PROJECT_STATUSES, PLATFORMS, ASPECT_RATIOS, PROJECT_ROLES,
} from './validate.js';
import { WORKSPACE } from './workspace-schema.js';
import {
  getWorkspace, createItem, updateItem, deleteItem, moveItem, addDefaultChecklist,
} from './workspace.js';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
// A fixed dummy hash keeps login timing similar whether or not the email exists.
const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

export function createApp({ db, secureCookies = false, version = '0.1.0' }) {
  const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60_000 });

  const routes = [
    ['GET', /^\/api\/health$/, () => ({ ok: true, version })],
    ['GET', /^\/api\/options$/, () => ({
      statuses: PROJECT_STATUSES, platforms: PLATFORMS, aspectRatios: ASPECT_RATIOS, roles: PROJECT_ROLES,
    })],
    ['GET', /^\/api\/session$/, ({ session }) => ({ user: requireUser(session), csrf: session.csrf })],
    ['POST', /^\/api\/login$/, login, { public: true }],
    ['POST', /^\/api\/logout$/, logout],
    ['GET', /^\/api\/projects$/, ({ user }) => ({ projects: listProjects(db, user) })],
    ['POST', /^\/api\/projects$/, async ({ user, req }) => ({ project: createProject(db, user, validateProject(await readJson(req))) }), { status: 201 }],
    ['GET', /^\/api\/projects\/([\w-]+)$/, ({ user, params }) => ({ project: getProject(db, user, params[0]) })],
    ['PATCH', /^\/api\/projects\/([\w-]+)$/, async ({ user, req, params }) => ({
      project: updateProject(db, user, params[0], validateProject(await readJson(req), { partial: true })),
    })],
    ['GET', /^\/api\/projects\/([\w-]+)\/activity$/, ({ user, params }) => ({ events: listActivity(db, user, params[0]) })],
    ['POST', /^\/api\/projects\/([\w-]+)\/members$/, async ({ user, req, params }) => ({
      project: addMember(db, user, params[0], validateMemberInput(await readJson(req))),
    })],
    ['DELETE', /^\/api\/projects\/([\w-]+)\/members\/([\w-]+)$/, ({ user, params }) => ({
      project: removeMember(db, user, params[0], params[1]),
    })],
    ['GET', /^\/api\/workspace-schema$/, () => ({ schema: WORKSPACE })],
    ['GET', /^\/api\/projects\/([\w-]+)\/workspace$/, ({ user, params }) => ({ items: getWorkspace(db, user, params[0]) })],
    ['POST', /^\/api\/projects\/([\w-]+)\/workspace\/checklist\/defaults$/, ({ user, params }) => ({
      items: addDefaultChecklist(db, user, params[0]),
    })],
    ['POST', /^\/api\/projects\/([\w-]+)\/workspace\/(\w+)$/, async ({ user, req, params }) => ({
      item: createItem(db, user, params[0], params[1], await readJson(req)),
    }), { status: 201 }],
    ['PATCH', /^\/api\/projects\/([\w-]+)\/workspace\/(\w+)\/([\w-]+)$/, async ({ user, req, params }) => ({
      item: updateItem(db, user, params[0], params[1], params[2], await readJson(req)),
    })],
    ['DELETE', /^\/api\/projects\/([\w-]+)\/workspace\/(\w+)\/([\w-]+)$/, ({ user, params }) => deleteItem(db, user, params[0], params[1], params[2])],
    ['POST', /^\/api\/projects\/([\w-]+)\/workspace\/(\w+)\/([\w-]+)\/move$/, async ({ user, req, params }) => ({
      items: moveItem(db, user, params[0], params[1], params[2], (await readJson(req)).direction),
    })],
  ];

  function requireUser(session) {
    if (!session) throw new HttpError(401, 'Please sign in.');
    return session.user;
  }

  async function login({ req, res }) {
    const ip = req.socket.remoteAddress || 'unknown';
    if (!loginLimiter.check(ip)) throw new HttpError(429, 'Too many sign-in attempts. Try again in a few minutes.');
    const body = await readJson(req);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const row = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email);
    const ok = verifyPassword(password, row?.password_hash ?? DUMMY_HASH) && Boolean(row);
    if (!ok) throw new HttpError(401, 'Email or password is incorrect.');
    loginLimiter.reset(ip);
    const s = createSession(db, row.id);
    audit(db, { actorId: row.id, action: 'auth.login', targetType: 'user', targetId: row.id });
    res.setHeader('Set-Cookie', sessionCookie(SESSION_COOKIE, s.token, { maxAge: s.maxAge, secure: secureCookies }));
    const session = getSession(db, s.token);
    return { user: session.user, csrf: session.csrf };
  }

  function logout({ session, res }) {
    destroySession(db, session.tokenHash);
    res.setHeader('Set-Cookie', sessionCookie(SESSION_COOKIE, '', { maxAge: 0, secure: secureCookies }));
    return { ok: true };
  }

  return async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
        if (await serveStatic(res, PUBLIC_DIR, url.pathname)) return;
        // Single-page app: unknown non-API paths fall back to the shell.
        if (await serveStatic(res, PUBLIC_DIR, '/index.html')) return;
        throw new HttpError(404, 'Not found.');
      }

      let matched = null;
      let methodMismatch = false;
      for (const [method, pattern, fn, opts = {}] of routes) {
        const m = url.pathname.match(pattern);
        if (!m) continue;
        if (method !== req.method) { methodMismatch = true; continue; }
        matched = { fn, opts, params: m.slice(1) };
        break;
      }
      if (!matched) throw new HttpError(methodMismatch ? 405 : 404, methodMismatch ? 'Method not allowed.' : 'Not found.');

      const session = getSession(db, parseCookies(req.headers.cookie)[SESSION_COOKIE]);
      const isPublic = matched.opts.public || url.pathname === '/api/health' || url.pathname === '/api/options';
      if (!isPublic && url.pathname !== '/api/session') requireUser(session);
      if (MUTATING.has(req.method) && !matched.opts.public) {
        // CSRF: mutating requests must echo the per-session token (in addition to SameSite=Strict cookies).
        if (!safeEqual(req.headers['x-csrf-token'], session.csrf)) throw new HttpError(403, 'Security token missing or expired. Reload the page.');
      }

      const result = await matched.fn({ req, res, session, user: session?.user, params: matched.params, url });
      sendJson(res, matched.opts.status || 200, result);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      if (!url.pathname.startsWith('/api/') && status === 404) {
        res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
      sendJson(res, status, { error: status === 500 ? 'Something went wrong on the server.' : err.message, ...(err.extra || {}) });
    }
  };
}
