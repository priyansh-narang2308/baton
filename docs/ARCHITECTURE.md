# Baton — Architecture

## Layers and sources of truth
| Concern | Owner |
|---|---|
| Business state (events, members, incidents, reports, ownership, audit) | **PostgreSQL** (authoritative) |
| Message transport (crew chat, incident cards, status DMs, escalation nudges) | **Nexconn Chat** (group + direct channels) |
| Real-time projection of incident state | **Nexconn message metadata** on the incident card (server-written only); fallback: `BTN:Update` custom messages if metadata events prove unreliable |
| Background alerts when the tab is closed | Web Push (our server) — Nexconn Web SDK has no push |
| UI state | React |

## Runtime
- **One Next.js 16 app (App Router, TypeScript)** run as a long-running Node server (`next start`) — webhooks must answer < 5 s and the escalation worker needs a persistent loop. Deploy target: Railway/Render/Fly + managed Postgres (Neon/Supabase).
- **Data access:** Drizzle ORM + `postgres` driver; SQL migrations in `drizzle/`.
- **Local dev:** a project-local Postgres cluster (`.pgdata/`, port 54329, trust auth) started by `npm run db:start` — no shared DB credentials needed.
- **Nexconn Server API:** small hand-written signed client (`src/server/nexconn/api.ts`) — `Signature = sha1(AppSecret + Nonce + Timestamp)`, primary/backup domain failover, 5 s timeout. (The official Node SDK is v0.1.2, git-installed only.)
- **Client SDK:** `@nexconn/engine` + `@nexconn/chat` pinned to 26.2.1; one `NexconnProvider` initialises once, registers handlers, connects once.

## Trust boundaries
- Browser: App Key (public by design) + its own access token only.
- Server env: `NEXCONN_APP_SECRET`, `DATABASE_URL`, `SESSION_SECRET`, `VAPID_PRIVATE_KEY`, optional `ANTHROPIC_API_KEY`.
- Webhooks: untrusted until signature + timestamp window (±5 min) + event-id dedupe pass. Note the signature does **not** cover the body → payloads are hints; we re-read DB state and only act on messages in channels we own.

## Identity
- Organizers: creating an event issues a secret **organizer link** (capability URL, rotatable) that sets a signed HTTP-only cookie — same zero-account model as crew QR codes, no email provider needed for the MVP. Email delivery of the link is a later convenience.
- Crew & attendees: HMAC-signed cookie `{memberId|attendeeId, eventId, role}` issued on QR join. Possession of the QR is the credential; leads can remove members and rotate the crew code.
- Nexconn user id = random `c_<id>` (crew), `a_<id>` (attendee), `o_<id>` (organizer), `bot_<eventId>` (desk/escalation bot). Never sequential.

## Data model (Postgres)
`organizers` · `events(id, slug, name, crew_code, nexconn_group_id, bot_user_id, settings)` · `zones(id, event_id, name, slug, lead_member_id)` · `members(id, event_id, role[lead|volunteer], name, zone_id, on_duty, nexconn_user_id)` · `attendees(id, event_id, nexconn_user_id)` · `incidents(id, event_id, number, zone_id, category, priority, status[open|claimed|resolved|withdrawn], owner_member_id, card_message_id, report_count, created_at, claimed_at, resolved_at, escalation_level, next_escalation_at, version)` · `reports(id, event_id, incident_id, source[attendee|crew], attendee_id, member_id, category, zone_id, text, structured bool, origin_message_id, created_at)` · `merge_suggestions(id, report_id, candidate_incident_id, score, status)` · `incident_events(id, incident_id, actor, type, payload, at)` (audit) · `notifications(incident_id, recipient, state, PRIMARY KEY(incident_id, recipient, state))` (fan-out dedupe) · `webhook_events(event_id PK)` · `push_subscriptions` · `nexconn_tokens`.

## Core flows
1. **Report (attendee):** POST `/api/e/:slug/reports` → rate-limit → consolidation decision in one transaction (attach / suggest / new) → if new: server sends `BTN:Incident` custom message to crew group with `hasMetadata:true` and stores `card_message_id`; if attached: bump `report_count` + `version`, set card metadata → server DM to the attendee from the bot ("Sent to crew" / "Already reported by 2 others").
2. **Claim:** POST `/api/incidents/:id/claim {version}` → `UPDATE incidents SET status='claimed', owner=…, version=version+1 WHERE id=… AND status='open'` → 0 rows ⇒ 409 with current owner → else metadata set `{st, own, ownN, v, n}` → status DM to each reporter where `INSERT … notifications ON CONFLICT DO NOTHING` succeeded → audit.
3. **Resolve / release / merge / split:** same pattern (conditional update on `version`, projection, deduped fan-out, audit).
4. **Clients:** render cards from metadata, but on connect/reconnect and on any metadata `v` gap, re-read `/api/events/:id/incidents` (DB truth). Ignore metadata with lower `v`.
5. **Escalation worker** (every 10 s, `FOR UPDATE SKIP LOCKED`): open incident past `next_escalation_at` → pick on-duty zone lead (fallback event lead) → targeted group message (`toUserIds`, no metadata allowed) + Web Push → bump level.
6. **Webhooks** `/api/nexconn/webhook`: verify, dedupe on `id`, handle `message:send` (crew free-text detection later), ack fast (< 1 s), work asynchronously.
7. **Reconciliation** (every 60 s): re-push metadata for incidents whose last projection failed (`projection_ok=false`).

## Nexconn rate budget (verified)
Group send 20/s and metadata ops share it (docs "known issues"); direct send 6,000/min; token issue 200/s. Projection writes are queued per event and coalesced.

## Console settings required
Enable: webhook URL + `message:send`; "Include Server API Messaging in post-event webhooks" (only if we need bot messages in webhooks — default off); group pre-join history; domain allowlist for Web clients. Confirm Growth Credit entitlements (MAU/PCC).
