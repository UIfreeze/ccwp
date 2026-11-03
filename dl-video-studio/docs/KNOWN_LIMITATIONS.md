# Known limitations (as of Milestone 2)

- **Not built yet (placeholders in the sidebar):** Live preview (M3), Review Studio (M4–5), Asset library (M6), Knowledge base (M7).
- **Brand:** the colours and system fonts are placeholders, not DL's approved brand.
- **Accounts:** there's no password reset, self-service password change, email invites or account deactivation UI. Admins manage accounts via scripts.
- **Sessions:** the login rate limit is in memory, so it resets on restart. Expired sessions are deleted lazily.
- **`node:sqlite`** is experimental in Node 22. The API could change in a future Node release.
- **Single process / single machine.** No backups yet. Backup and restore get documented and tested in Milestone 8.
- **HTTPS:** none locally. Set `DLVS_SECURE_COOKIES=1` when running behind HTTPS.
- **Projects can't be deleted.** Only archived, by design for now, to protect the audit trail.
- **Timeline editor:** DaVinci Resolve (user-confirmed). Edition (free or Studio) and version still unknown; that decides whether direct scripting is possible or handoff stays file-based.
- **Workspace:** there's no per-item version history yet; the activity log records who changed what, but not the old text. Storyboard frames are text descriptions, with image frames arriving with the media pipeline (M6). There's no export of the script or shot list as a document yet. Two people editing the same item at once: the last save wins.
- **Spoken-length estimate** assumes ~150 words per minute. Real voiceover pace varies, so treat it as a guide and confirm with a timed read.
