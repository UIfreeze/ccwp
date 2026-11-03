// Entry point: `npm start`. Binds to localhost by default — the app is private and local-first.
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { openDatabase } from './db.js';
import { createApp } from './app.js';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4310);
const DB_FILE = process.env.DLVS_DB || fileURLToPath(new URL('../data/studio.sqlite', import.meta.url));

const db = openDatabase(DB_FILE);
const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
const server = createServer(createApp({ db, secureCookies: process.env.DLVS_SECURE_COOKIES === '1' }));

server.listen(PORT, HOST, () => {
  console.log(`DL Video Studio running at http://${HOST}:${PORT}`);
  if (!users) console.log('No accounts yet. Create one with:  npm run create-admin -- you@example.com "Your Name"');
});

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => { db.close(); process.exit(0); }));
