# Security notes

Implemented in Milestone 1 and covered by tests in `tests/`:

- Passwords hashed with scrypt and a per-user salt. Never stored or logged in plaintext. `create-admin` reads the password from a prompt or env var, never from command-line arguments.
- Session tokens are random 256-bit values. Only their SHA-256 hash is stored. Cookies are `HttpOnly; SameSite=Strict` (plus `Secure` with `DLVS_SECURE_COOKIES=1`). Sessions expire after 7 days.
- CSRF: every mutating request must send the per-session `X-CSRF-Token`, and JSON content-type is enforced.
- Authorization is checked on the server for every project route. Inaccessible projects return 404.
- Generic login error and constant-work password check whether or not the email exists. 10 attempts per 15 minutes per IP.
- Strict Content-Security-Policy (no inline scripts or styles), `nosniff`, `frame-ancestors 'none'`, no referrer.
- The UI never injects user text as HTML (`textContent` only).
- Static file serving is confined to `public/`.
- JSON bodies limited to 256 KB. Text fields have length limits.
- The server binds to `127.0.0.1` by default.

Still to do: upload validation (M6), media access control (M4), backups and restore (M8), dependency review when packages are introduced, and HTTPS deployment (M10, only with approval).

Never commit secrets, client media or the private handbook. `.gitignore` excludes `data/`, `exports/`, `.env`, video and audio files, and `docs/private/`.
