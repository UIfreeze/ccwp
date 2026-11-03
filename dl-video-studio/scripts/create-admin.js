// Usage: npm run create-admin -- email "Full Name" [--member]
// Prompts for a password (or reads DLVS_PASSWORD for non-interactive use). Never pass passwords as arguments.
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { openDatabase } from '../server/db.js';
import { createUser } from '../server/auth.js';

const [email, name, flag] = process.argv.slice(2);
if (!email || !name) {
  console.error('Usage: npm run create-admin -- email "Full Name" [--member]');
  process.exit(1);
}
let password = process.env.DLVS_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('Password (min 10 characters): ');
  rl.close();
}
if (!password || password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}
const db = openDatabase(process.env.DLVS_DB || fileURLToPath(new URL('../data/studio.sqlite', import.meta.url)));
try {
  createUser(db, { email, name, password, systemRole: flag === '--member' ? 'member' : 'admin' });
  console.log(`Created ${flag === '--member' ? 'member' : 'admin'} account for ${email}.`);
} catch (err) {
  console.error(String(err.message).includes('UNIQUE') ? 'An account with that email already exists.' : err.message);
  process.exit(1);
}
