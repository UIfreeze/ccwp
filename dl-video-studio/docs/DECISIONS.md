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

## D-010 — Remotion in its own `remotion/` package; only the core packages (2026-11-03)
The user approved installing Remotion. Only what the preview needs was installed: `remotion`, `@remotion/cli`, `@remotion/zod-types` and `zod`, plus the scaffold's dev tools. Not every Remotion repo or package: most are examples or optional features, and the handbook warns against blanket installs. More packages (captions, transitions, media, fonts) get added when a video actually needs them. The preview lives in its own folder with its own `package.json`, so the main app keeps zero dependencies.

## D-011 — Pin to releases at least two weeks old (2026-11-03)
Remotion 4.0.540 was released the day before install, so 4.0.537 (2026-10-19) was pinned instead, and React 19.2.9 likewise. Brand-new releases are more likely to be pulled or patched. Exception: `zod` 4.6.7 is forced via `overrides` to close a high-severity advisory. That's the same version Remotion 4.0.540 adopted, so it's a known-good combination. Plan: move to Remotion ≥4.0.540 after 2026-11-16.

## D-012 — Vendored official Remotion Agent Skills (2026-11-03)
Remotion's official skills were cloned from remotion-dev/skills, reviewed (markdown instructions and example code; nothing runs on its own), and copied into `.claude/skills/`. That way Claude Code follows Remotion's best practices in any session in this repo, on the cloud or on the user's machine. The third-party `npx skills` installer wasn't used.

## D-013 — Using a third-party video as a style reference (2026-11-03)
The user supplied a 35s cinematic ad for another brand and asked for something new in that style. Following the handbook, we reproduced the visual grammar (palette, glass materials, camera energy, the chaos → core → order → logo structure and the sound arc) and none of the expression. No footage, logo, tagline, icons, third-party app logos or music were reused, and DL's own message drives the story. The reference file isn't committed to the public repo. Its opening shot (a person at a desk) is AI-generated video; recreating that kind of shot would need a paid generation with individual approval, so the piece opens on abstract 3D instead.

## D-014 — Procedural, original sound instead of library music (2026-11-03)
For the sound, a dependency-free generator synthesises every effect, so there are no licensing questions and no credits spent. The audio file is regenerated on demand and not stored in git. Licensed music or SFX can replace it later through the normal approval gate.

## D-015 — How the official logo is used (2026-11-03)
The user supplied two official files. Following the handbook rule never to regenerate the logo, both are used exactly as supplied. The dark-tile mark appears in dark scenes. The full lockup, which has dark-green elements on a transparent background, appears only on white, where it's legible as designed, rather than being recoloured for a dark background. Particle effects only *approach* the logo's shape and then hand over to the real file. Brand colours were read from the files: crimson #c93a5f and dark green #182420. The logo files are committed to this public repo because they're DL's public identity; tell me if that should change.

## D-016 — Library SFX instead of synthesis (2026-11-03)
The user rejected the procedural sound as unprofessional. Free CC0 sources (Openverse, Freesound, Sonniss) and Artlist's audio hosts are blocked by this cloud environment's network policy, so the sound is a cue sheet of Artlist catalog SFX (included in the user's plan, no AI credits) that plays whatever files are present. Licensed files are never committed (public repo, licence terms). Picks are based on catalog descriptions and label reputation until someone can listen to them.
