# Decisions

## D-001 — Separate `dl-video-studio/` folder inside the existing repo (2026-11-03)
The repo already holds a GitHub Copilot course template, and the handbook says to keep existing work. A self-contained folder avoids clobbering the template's README or setting off its workflows, which only watch specific files on `main`.

## D-002 — Zero third-party runtime dependencies for the foundation (2026-11-03)
I used Node 22's built-in `node:http`, `node:sqlite` and `node:crypto` and a vanilla ES-module front end with no build step. Reasons: nothing to install or approve, no supply-chain or licence risk, and it starts in one command. Trade-offs: `node:sqlite` is still flagged experimental in Node 22 (warning suppressed via `--disable-warning`), and hand-rolled routing is fine at this size. If the UI grows complex (Review Studio annotations, comparison), switching to React or Vite is a reasonable future decision. It would need an install approval.

## D-003 — Relational data model in SQLite, media on disk (2026-11-03)
This follows the handbook data model: users, projects, memberships, audit events, and later assets, versions, comments, annotations, tasks and approvals. Video binaries will never be stored in database rows. For production use, a move to Postgres and object storage is part of the Milestone 10 deployment proposal.

## D-004 — Authorization returns 404 for inaccessible projects (2026-11-03)
A project someone can't access looks exactly like one that doesn't exist, which stops ID probing (IDOR). A role that's too low on a project you *can* see returns 403 with a clear message.

## D-005 — Admin-created accounts only (2026-11-03)
There's no self-signup and no email invites yet, so no email provider is needed (an approval gate). Owners can add existing accounts to projects.

## D-006 — Handbook and private reference links stay out of the public repo (2026-11-03)
The repo is public. The handbook (pricing, internal plans) and the Drive, Docs and Notion URLs are kept local in the git-ignored `docs/private/`. Public YouTube and Instagram URLs are listed in the reference register.

## D-007 — DaVinci Resolve is the primary timeline editor (2026-11-03)
The user confirmed DaVinci Resolve is installed on their machine. Resolve is the professional timeline for full edit, colour, audio and finishing. Remotion stays the live preview for code-built scenes, and DL Review Studio handles review and approval. The handoff plan is to export an organised media package plus a timeline interchange file (FCPXML/EDL/OTIO) that Resolve imports; both the free and Studio editions support this. Driving Resolve directly through its scripting API depends on the edition and settings, so that waits until the edition and version are confirmed. Nothing is installed or purchased.

## D-008 — One schema-driven table for the production workspace (2026-11-03)
Concepts, scenes, shots, prompts, assets and checklist items share one `workspace_items` table, keyed by `kind`, with fields stored as JSON. They're validated against `server/workspace-schema.js`, which the browser also uses to build its forms. This keeps the six sections consistent and makes adding a field a one-line change. The trade-off: fields aren't separate SQL columns, so cross-section queries use `json_extract`. That's fine at this scale and can be split into dedicated tables if a section needs heavy querying.

## D-009 — Linked items can't be deleted (2026-11-03)
Deleting a scene used by a shot (or a shot used by a prompt or asset) is refused with a clear message instead of silently leaving broken links. This follows the handbook's rule never to silently lose data.
