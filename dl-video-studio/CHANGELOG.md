# Changelog

## 0.1.0 — 2026-11-03 — Milestone 1: local foundation

### Added
- Zero-dependency Node.js server (`node:http`, `node:sqlite`, `node:crypto`) bound to localhost.
- SQLite schema with ordered migrations: users, sessions, projects, memberships and audit events.
- Authentication: scrypt password hashing, hashed session tokens, HttpOnly SameSite=Strict cookies, per-session CSRF token, and a login rate limit.
- Project service with server-side role checks (owner, editor, reviewer, viewer, plus system admin). Projects you can't access return 404, so IDs can't be probed.
- Guided project intake and brief editing with field-level validation.
- Projects dashboard, project overview with stage pipeline, team management and activity log.
- Design tokens with light and dark themes, responsive layout, strict Content-Security-Policy.
- `create-admin` and synthetic `seed` scripts.
- 19 automated tests.
- Docs: discovery report, decisions, known limitations, security, learning log, reference register.
