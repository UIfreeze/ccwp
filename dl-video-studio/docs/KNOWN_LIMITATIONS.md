# Known limitations (as of Milestone 1)

- **Not built yet (placeholders in the sidebar):** Live preview (M3), Review Studio (M4–5), Asset library (M6), Knowledge base (M7). The project page also says the production workspace (concept, script, storyboard, shot list, prompts) arrives in M2.
- **Brand:** the colours and system fonts are placeholders, not DL's approved brand.
- **Accounts:** there's no password reset, self-service password change, email invites or account deactivation UI. Admins manage accounts via scripts.
- **Sessions:** the login rate limit is in memory, so it resets on restart. Expired sessions are deleted lazily.
- **`node:sqlite`** is experimental in Node 22. The API could change in a future Node release.
- **Single process / single machine.** No backups yet. Backup and restore get documented and tested in Milestone 8.
- **HTTPS:** none locally. Set `DLVS_SECURE_COOKIES=1` when running behind HTTPS.
- **Projects can't be deleted.** Only archived, by design for now, to protect the audit trail.
- **Installed editors** were checked only in the cloud container, not on your machine.
