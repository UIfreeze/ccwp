# DL Video Studio

Internal, local-first video-production workspace for Deciphering Logic (DL). It takes a video from brief to delivery and will include the in-house **DL Review Studio** module for review and approval.

> **Status: Milestone 1 (local foundation) complete.** The project dashboard, guided brief intake, project roles, server-side permissions and activity log work and are tested. Everything else in the sidebar is marked with the milestone it's planned for. See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

## What works today

- Sign-in with hashed passwords and HttpOnly session cookies. Admins create accounts; there's no public sign-up.
- A **projects dashboard** with stage counts. Each person sees only the projects they're a member of (admins see all).
- A **guided intake/brief** covering objective, audience, core message, CTA, platforms, aspect ratios (4:5, 9:16, 16:9, 1:1), duration, due date, approver, constraints and references.
- **Production stages:** Brief → Concept → Script → Storyboard → Production → In review → Approved → Delivered (plus Archived).
- **Project roles:** owner, editor, reviewer and viewer. The server checks every request.
- An **activity log** recording creation, edits, stage changes and membership changes.

## Requirements

- Node.js **22.5 or newer**. The app uses Node's built-in `node:sqlite`, so it needs **no npm dependencies** and there's nothing to `npm install`.
- FFmpeg is only needed from Milestone 6 onwards.

## Run it

```bash
cd dl-video-studio
npm run create-admin -- you@yourcompany.com "Your Name"   # asks for a password (min 10 chars)
npm start                                                  # http://127.0.0.1:4310
```

To explore with **synthetic demo data** instead (only works on an empty database):

```bash
npm run seed     # accounts: admin@ / editor@ / reviewer@ / outsider@demo.local, password demo-password-123
npm start
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the automated tests (auth, CSRF, access isolation, roles, validation, audit trail) |
| `npm run dev` | Starts the server and restarts it automatically when files change |
| `npm run create-admin -- email "Name" --member` | Creates a non-admin account |

Environment variables: `PORT` (default 4310), `HOST` (default 127.0.0.1), `DLVS_DB` (default `data/studio.sqlite`), `DLVS_SECURE_COOKIES=1` (set this behind HTTPS).

## Layout

```
server/        HTTP router, auth, validation, project service, SQLite migrations
public/        Browser UI (vanilla ES modules, no build step), design tokens
scripts/       create-admin, seed-demo
tests/         node:test suites
docs/          decisions, limitations, security, learning log, reference register, discovery report
data/          local database (git-ignored)
exports/       local render staging (git-ignored)
sample-assets/ synthetic demo media only
```

## Roadmap

| Milestone | Scope | State |
| --- | --- | --- |
| 0 Discovery | Environment report and plan | Done — [docs/DISCOVERY_REPORT.md](docs/DISCOVERY_REPORT.md) |
| 1 Local foundation | App shell, auth, dashboard, intake, roles, audit log, tests | **Done** |
| 2 Production workspace | Concepts, script, storyboard, shot list, prompt builder, asset register, checklist | Next |
| 3 Remotion preview | Live browser preview with 4:5 and 9:16 templates | Waiting on your approval (licence and install) |
| 4 DL Review Studio MVP | Player with timecode, timestamped comments, replies, immutable versions, approvals | Planned |
| 5 Advanced review | Annotations, version comparison, revision tasks, notifications, review report | Planned |
| 6 Media pipeline | Safe uploads, FFmpeg metadata and thumbnails, editor handoff | Planned |
| 7 Learning knowledge base | Reference register, technique cards, experiments, weekly report | Planned |
| 8–10 | Security QA, private pilot, deployment *proposal* (no deployment without approval) | Planned |
