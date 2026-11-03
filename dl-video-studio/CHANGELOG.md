# Changelog

## 0.6.0 — 2026-11-03 — Professional sound design (library SFX)

### Changed
- "Deciphered" now defaults to `sound: "library"`: 16 licensed Artlist SFX on a frame-accurate cue sheet (`src/Decipher/sound.ts`), with volume envelopes, cut fades, an optional auto-ducking music bed, and a Studio warning when files are missing. The synthesised track is kept as `sound: "synth"`.
- `npm run render:deciphered` now masters the audio after rendering (two-pass loudnorm to −14 LUFS / −1.5 dBTP, video stream copied, faststart), using Remotion's bundled FFmpeg.
- Licensed audio in `public/sfx/` is git-ignored. See `docs/SFX_CUE_SHEET.md`.
- Verified cue timing with placeholder tones (deleted afterwards).

## 0.5.0 — 2026-11-03 — Official DL logo and brand colours

### Changed
- Added the official DL logo files supplied by the user (`remotion/public/brand/`), byte-identical to what was sent and never redrawn or recoloured.
- "Deciphered": particles converge on points sampled from the official mark, then the official mark is revealed on the reflective floor, followed by a new white end card (2.5s) with the full official lockup. Now 37.5s. The placeholder monogram and notice are gone, and the warm accent is now DL crimson.
- "IdeaToPlan": the CTA shows the official mark, and colours switched to DL crimson #c93a5f and dark green #182420.
- App design tokens and favicon now use the brand colours.
- Sound extended for the end card (bloom riser and soft chime).

## 0.4.0 — 2026-11-03 — "Deciphered" style piece

### Added
- "Deciphered": an original 35s cinematic piece (16:9, 4:5, 9:16) styled after a user-supplied reference. Built entirely in code with no paid generation: a 3D-projected fragment orbit and vortex, logic core with shockwave and sparks, light-speed streaks and light trail, a CSS-3D deliverables grid with scan beam, a fly-through card tunnel, a glass blueprint hero, and particles forming the mark on a reflective floor with fog.
- Original procedural sound design (`npm run sound`), timed to the picture and following the reference's dynamic arc.
- Editable captions, deliverables, tagline, brand name, colours and toggles in Studio.

## 0.3.0 — 2026-11-03 — Milestone 3: Remotion live preview

### Added
- `remotion/`: a Remotion Studio project scaffolded with the official `create-video` tool, with versions pinned (Remotion 4.0.537, React 19.2.9).
- An original 22-second sample, "IdeaToPlan" (hook → questions → plan → CTA), with layouts adapted to 4:5, 9:16, 1:1 and 16:9.
- Editable fields in the Studio sidebar (text, list items, colours, safe-area toggle), with default values inline so edits save back to code.
- A safe-area overlay, including the 9:16 zones covered by platform buttons.
- `npm run render:test` for a half-size test MP4. Verified: H.264, 30fps, 22.0s.
- The app's "Live preview" page now has launch steps, a format list, export and licence notes.
- The 13 official Remotion Agent Skills, copied into `.claude/skills/` (from remotion-dev/skills).

### Security
- `zod` forced to 4.6.7 to fix GHSA-mrhx-c7xc-m3w5 in the zod bundled with Remotion 4.0.537. The packages the preview runs on now report 0 known vulnerabilities.

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
