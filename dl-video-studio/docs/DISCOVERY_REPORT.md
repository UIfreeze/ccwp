# Milestone 0 — Discovery report (2026-11-03)

Inspected in the Claude Code cloud session, not on your own computer. The checks on installed editors only cover this container.

## What already exists

- Repository `UIfreeze/ccwp` is **public**. It held GitHub's “Code with GitHub Copilot” course template: `README.md`, `LICENSE` (MIT), `.github/steps` and five workflows that run only on pushes to `main`.
- There was no application code, no DL assets and no prior DL Video Studio project.
- The course template is left untouched. DL Video Studio lives in its own folder, `dl-video-studio/`.

## Environment

| Item | Found |
| --- | --- |
| OS | Linux x86_64 (ephemeral cloud container: 4 CPU, 15 GB RAM) |
| Node.js / npm | v22.23.4 / 10.9.9 (built-in `node:sqlite` available) |
| Git | Yes, branch `claude/new-session-8nz7ax` |
| FFmpeg / FFprobe | Installed (`/usr/bin`) |
| Browser | Headless Chromium + Playwright (used for UI checks) |
| DaVinci Resolve / Premiere Pro / After Effects / Blender | **Not found here.** Your own machine still needs checking. |
| Artlist, ElevenLabs, Canva, Figma connectors | Show up as available in this session. Not used, and no credits spent. |

## Decisions and approvals needed

1. **Repo visibility.** The repo is public, so the handbook isn't committed: it contains DL pricing, plans and private Drive/Docs/Notion links. Keep it at `docs/private/` (git-ignored), or make the repo private.
2. **Remotion licence (Milestone 3).** Remotion is free for individuals and companies of up to three people. Larger companies need a paid company licence. Please confirm DL's size and approve installing it.
3. **Timeline editor:** answered — DaVinci Resolve (see DECISIONS D-007). Edition and version still to confirm.
4. **Brand:** official logo received (mark plus light-background lockup). Brand fonts and an SVG or reversed lockup are still needed.
5. **Private references.** Drive, Docs and Notion links need an authorised connector or exported copies.

## Safe next milestone

Milestone 2 (production workspace) is local, reversible and needs no approvals.
