// Seeds clearly-labelled SYNTHETIC demo data for local exploration. Refuses to run on a non-empty database.
// All demo accounts share the password in DLVS_DEMO_PASSWORD (default: "demo-password-123").
import { openDatabase } from '../server/db.js';
import { createUser } from '../server/auth.js';
import { createProject, addMember, updateProject } from '../server/projects.js';

const db = openDatabase(process.env.DLVS_DB || new URL('../data/studio.sqlite', import.meta.url).pathname);
if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n) {
  console.error('Database already has accounts; demo seed skipped so nothing is overwritten.');
  process.exit(1);
}
const password = process.env.DLVS_DEMO_PASSWORD || 'demo-password-123';
const mk = (email, name, systemRole) => {
  const id = createUser(db, { email, name, password, systemRole });
  return { id, email, name, systemRole };
};
const admin = mk('admin@demo.local', 'Demo Admin', 'admin');
const editor = mk('editor@demo.local', 'Demo Editor', 'member');
mk('reviewer@demo.local', 'Demo Reviewer', 'member');
mk('outsider@demo.local', 'Demo Outsider (no projects)', 'member');

const p1 = createProject(db, editor, {
  name: '[DEMO] Founder idea-to-plan explainer',
  description: 'Synthetic sample project. Vertical editorial motion-graphics piece about turning a raw product idea into a plan.',
  objective: 'Help a founder understand what a structured discovery phase produces before they commit to a build.',
  audience: 'Pre-seed and seed founders evaluating a product engineering partner.',
  core_message: 'Clarity before code saves months.',
  cta: 'Book a discovery call',
  platforms: ['linkedin', 'instagram'],
  aspect_ratios: ['4:5', '9:16'],
  duration_seconds: 45,
  constraints: 'All offer, pricing and company claims are placeholders and must be verified before any public use.',
  approver: 'Demo Admin',
});
addMember(db, editor, p1.id, { email: 'reviewer@demo.local', role: 'reviewer' });
updateProject(db, editor, p1.id, { status: 'script' });

createProject(db, admin, {
  name: '[DEMO] Product UI walkthrough — template test',
  description: 'Synthetic sample used to test 16:9 and 1:1 templates.',
  platforms: ['youtube', 'website'],
  aspect_ratios: ['16:9', '1:1'],
  duration_seconds: 90,
});
console.log('Seeded synthetic demo data. Sign in as admin@demo.local, editor@demo.local, reviewer@demo.local or outsider@demo.local.');
