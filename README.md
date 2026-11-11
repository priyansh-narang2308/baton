# Baton

**Real-time incident coordination for event crews.** Every report gets acknowledged, every incident gets an owner, and every action has a visible outcome. Built on Nexconn Chat.

- Volunteers join by QR (no app, no account). Attendees report issues from location posters.
- Reports become **live incident cards** in the crew chat; **duplicate reports merge** into one card ("3 reports").
- One tap — **I'll take it** — flips the card on every device; **everyone who reported it** is told who's on it and when it's fixed.
- Unclaimed incidents notify a **named** lead, not the whole group.
- Organizers run a **command centre**: what needs an owner, longest wait, crew load, incident history, assignment and direct messages with volunteers.

Docs: [implementation plan](docs/IMPLEMENTATION_PLAN.md) · [architecture](docs/ARCHITECTURE.md) · [product audit](docs/PRODUCT_AUDIT.md) · [Nexconn docs audit](docs/NEXCONN_DOCS_AUDIT.md) · [traction kit](docs/TRACTION_PLAN.md) · [demo script](docs/DEMO_SCRIPT.md) · [submission checklist](docs/SUBMISSION_CHECKLIST.md) · [validation](docs/VALIDATION_RESULTS.md) · [product spec](docs/PRODUCT_SPEC.md) · [research](docs/NEXCONN_RESEARCH.md) · [28 Oct plan](docs/PLAN.md)

## Run locally
Requires Node 22+ and a Postgres binary (Homebrew `postgresql@16` works).

```bash
npm install
npm run db:start          # project-local Postgres on :54329 (data in .pgdata/)
npm run db:migrate
cp .env.example .env.local # then fill in SESSION_SECRET and the Nexconn keys
npm run dev
```

`/api/health` reports exactly which configuration is missing.

## Nexconn setup
1. Create an app in the [Nexconn Console](https://console.nexconn.ai) and enrol it in Chat Growth Credit.
2. Copy **App Key** (public, sent to browsers) and **App Secret** (server only) into `.env.local`; set `NEXCONN_DATA_CENTER`.
3. Chat settings: enable *pre-join history access by new member* for groups; add the domain allowlist for Web clients.
4. Webhooks (optional for the MVP): URL `https://<your-host>/api/nexconn/webhook`, event `message:send`.
5. Check the integration: `node scripts/nexconn-spike.mjs`.

## Nexconn features used
| Feature | Where |
|---|---|
| Chat SDK for Web (`@nexconn/chat` 26.2.1): init, connect, reconnect states, custom messages, group send, history, `onMessageReceived`, `onMessageMetadataUpdated` | `src/lib/nexconn-client.ts` |
| Server API: token issue, group create/join, group send with `hasMetadata`, metadata set, targeted group messages, direct messages | `src/server/nexconn/api.ts` |
| Message metadata as the live incident state on each card | `src/server/domain/projection.ts` |
| Webhooks with signature + freshness check and idempotent recording | `src/app/api/nexconn/webhook/route.ts` |

## Scripts
`npm test` (unit + real-Postgres integration; uses the `baton_test` DB — run `npm run db:migrate:test` once) · `npm run typecheck` · `npm run lint` · `npm run build`

## Security notes
App Secret, session secret and DB URL are server-only. Crew/attendee identities are HMAC-signed, per-event, per-role cookies; organizer access is a rotatable capability link. Claims, merges and resolutions are authorised and decided server-side in database transactions; Nexconn metadata is a projection, never the source of truth. Webhook signatures don't cover the body, so payloads are treated as hints and deduped by event id.
