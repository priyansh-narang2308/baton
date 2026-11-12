# Baton — deployment guide

**Status:** prepared locally, **not deployed.** Deploying needs your go-ahead and your host account.

## What Baton needs from a host

- **One always-on Node 22 process.** `src/instrumentation.ts` starts the escalation and projection worker inside the server. Serverless or scale-to-zero hosts would stop escalations, so don't use them.
- **Postgres 16.** Migrations run automatically on boot (`scripts/migrate.mjs`, idempotent).
- **Public HTTPS,** for QR links, the Nexconn webhook and judges.

**Recommended host: Railway.** It runs the Dockerfile as a long-lived service, with managed Postgres in the same project. Any Docker host with Postgres works the same way (Render, Fly.io).

## Files in the repository

- `Dockerfile`: builds with `npm ci && npm run build`. At start it runs the migrations, then `next start` on `$PORT`. No secrets are baked into the image.
- `.dockerignore`: keeps `.env*`, `.pgdata`, `.git` and docs out of the image.

**Verified locally on 12 Nov:**
- `npm run build`, then `next start` on a free port.
- `/api/health` returned `{"ok":true}` for config, database and Nexconn (SG).
- The landing page returned 200.
- The worker logged "escalation + reconciliation loops started".

The Docker image itself has not been built yet. Railway builds it on its side.

## Steps for you (about 20 minutes)

| # | Where | What to do | Why | How to check |
|---|---|---|---|---|
| 1 | railway.com | Sign in. Create a project, then **Deploy from GitHub repo** (the repository must be pushed first; see 7), or **Empty project → Deploy from local directory** with the CLI (`railway up`) | Hosts the app | The service shows "Building" |
| 2 | Project → **New → Database → PostgreSQL** | Add Postgres | Baton's source of truth | A Postgres service appears |
| 3 | App service → **Variables** | Add `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway's reference syntax), `SESSION_SECRET` = 48+ random characters (`openssl rand -base64 48` in your terminal), `NEXCONN_APP_KEY`, `NEXCONN_APP_SECRET`, `NEXCONN_DATA_CENTER=SG` | Server configuration. **Type the values into Railway yourself. Never paste them into chat.** | The variables are listed (values hidden) |
| 4 | App service → **Settings → Networking → Generate domain** | Create the public URL, then set `PUBLIC_BASE_URL` to it (for example `https://baton-production.up.railway.app`) | QR codes and links use it | `https://<domain>/api/health` returns `"ok":true` |
| 5 | Nexconn Console → your app → **Chat settings** | Add `<domain>` to the Web client domain allowlist (if your plan shows one) | Browsers connect from the new origin | The crew page shows "Live" |
| 6 | Nexconn Console → **Webhooks** | URL `https://<domain>/api/nexconn/webhook`, event `message:send` | Crew chat messages can become requests automatically | Send "water empty at Gate 3" in crew chat; a card appears |
| 7 | GitHub | Only when you authorise it: create the public repository and push | Needed for submission, and for option 1 | The repository opens logged out |

**Billing:**
- Railway's free trial credit covers this for the judging window.
- If it asks for a card, that is your decision. **I won't enter payment details.**

## After deployment (me, about 1 hour)

1. Run `node scripts/e2e-scenario.mjs https://<domain>`: the full organizer → 2 volunteers → 2 attendees scenario with separate sessions.
2. Do the two-phone test: claim, pass, accept and fix, checking that the reporter sees each status.
3. Turn on error visibility: Railway's log view plus `/api/health` as the healthcheck path (Settings → Healthcheck path `/api/health`).
4. Update `SUBMISSION_READINESS.md` with the URL and the evidence.
