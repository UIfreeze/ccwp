# Changelog

## 0.2.0 — 2026-11-03 — Milestone 2: production workspace

### Added
- A production workspace in each project, with tabs for concepts, script & storyboard, shot list, prompts, assets and checklist.
- One field schema (`server/workspace-schema.js`) drives both the server validation and the browser forms.
- Links between items (shot → scene, prompt → shot, asset → shot) are checked to belong to the same project and the right section. Items still linked from elsewhere can't be deleted (409 with an explanation).
- Reordering, read-only view for reviewers/viewers, and workspace actions recorded in the activity log.
- Script timing: spoken-length estimate per scene and in total, compared with the brief's target duration.
- Prompt builder: structured fields combined into a copyable prompt, with the paid-generation approval reminder.
- A standard 18-item DL checklist from the handbook's QA and delivery sections.
- Synthetic sample workspace content (`npm run seed-workspace`; also included in `npm run seed`).
- Database migration 2 (`workspace_items`), applied automatically on start. Existing data is kept.
- 9 new tests (28 total).

### Fixed
- Elements marked hidden could still show when a CSS class set their display (reviewers saw an "Add" button they couldn't use).
- The page scrolled sideways on phones when a wide element stretched the layout.

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
