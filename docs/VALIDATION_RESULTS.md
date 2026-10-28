# Validation results

Last run: **28 Oct 2026**. Legend: **PASS** = executed and observed · **FAIL** = executed, did not behave · **BLOCKED** = not executed (reason given). Nothing is marked passed without being run.

**Current blocker:** no Nexconn credentials on this machine (`NEXCONN_APP_KEY` / `NEXCONN_APP_SECRET` absent). Every experiment that needs the live Nexconn service is BLOCKED, not passed. Creating the Nexconn account is the owner's step (account creation and secrets are not something the assistant does).

## A. Executed locally (real Postgres, real HTTP server, no mocks of our own code)

| # | Test | SDK/API | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| A1 | Consolidation rules (11 cases: same zone+category attach, cross-zone/category block, sensitive → suggest only, age limits, best candidate) | — | Per `docs/PRODUCT_SPEC.md` rules | As expected | PASS | `npx vitest run src/server/domain/consolidation.test.ts` — 11/11 |
| A2 | Report intake attaches 3 structured duplicates to one incident; every original report kept | Postgres tx + `SELECT … FOR UPDATE` on event | 1 incident, 3 reports | 1 incident, 3 report rows | PASS | `incidents.test.ts` |
| A3 | Concurrent intake numbers incidents 1..5 without gaps/duplicates | Postgres | numbers [1..5] | [1..5] | PASS | `incidents.test.ts` |
| A4 | **Five simultaneous claims → exactly one owner**; four get `conflict` naming the owner; one audit row | Conditional `UPDATE … WHERE status='open'` | 1 winner | 1 winner, 4 conflicts with ownerName | PASS | `incidents.test.ts` |
| A5 | Repeated claim by owner is idempotent (no effects) | — | `alreadyYours: true` | as expected | PASS | `incidents.test.ts` |
| A6 | Non-crew claim rejected; only owner/lead can release/resolve | — | 403 | 403 | PASS | `incidents.test.ts` |
| A7 | Merge suggested incident, then split the report back out | — | counts 2 → 1, report moves to new incident | as expected | PASS | `incidents.test.ts` |
| A8 | Escalation taken once (concurrent workers), level 1 → 2 → stop | `FOR UPDATE SKIP LOCKED` | 1, then 0, then level 2, then none | as expected | PASS | `incidents.test.ts` |
| A9 | Webhook id processed once; 3 deliveries counted; concurrent duplicates → 1 | `ON CONFLICT DO NOTHING` | 1 fresh | 1 fresh, deliveries=3 | PASS | `webhooks.test.ts` |
| A10 | Webhook signature `sha1(secret+nonce+timestamp)` matches an independently computed SHA-1; bad sig / stale (>5 min) / wrong app / missing headers rejected | — | as documented | as expected | PASS | `sign.test.ts` (reference hash from `shasum`) |
| A11 | HTTP: attendee report → new; duplicate → attached (count 2); free-text without zone → `new_with_suggestion` | `/api/e/:slug/reports` | as rules | as rules | PASS | curl run 28 Oct (see PROGRESS.md) |
| A12 | HTTP: two simultaneous claims from organizer + volunteer | `/api/events/:id/incidents/:id/claim` | one 200, one 409 with owner name | 200 + 409 `ownerName: "Asha"` | PASS | curl run |
| A13 | HTTP: tampered session cookie, wrong organizer key, attendee reading the board | — | 403 / redirect with error / 403 | as expected | PASS | curl run |
| A14 | HTTP: merge → third attendee's status follows the merged, claimed incident | — | attendee sees #1 claimed, 3 reports, owner | `(1, 'claimed', 3, 'Asha')` | PASS | curl run |
| A15 | Without credentials the app fails loudly, never fakes: `/api/health` 503 naming missing vars; demo refuses; webhook 503; board shows "Messaging isn't configured"; responses carry `projected:false` | — | explicit errors | as expected | PASS | curl + browser text |
| A16 | Production build, typecheck, lint | Next 16.4.3 | clean | clean | PASS | `npm run build`, `npm run typecheck`, `npm run lint` |
| A17 | Board renders DB truth (merged incident, 3 reports, owner, metrics) | — | correct | correct (after dev compile on first load) | PASS | browser `innerText` |

## B. Nexconn integration spike — BLOCKED until credentials exist

Server-side steps are automated in `scripts/nexconn-spike.mjs` (prints PASS/FAIL per step). Client-side steps are run in the real app.

| # | Test | SDK/API | Expected | Result | Reproduction |
|---|---|---|---|---|---|
| B1 | Issue tokens for bot + 2 users | `POST /v4/auth/access-token/issue` | code 0 | BLOCKED | `node scripts/nexconn-spike.mjs` |
| B2 | Create group (bot owner), join 2 users | `/v4/group-channel/create`, `/join` | code 0 | BLOCKED | spike script |
| B3 | Send `BTN:Incident` with `hasMetadata:true` + initial metadata | `/v4/group-channel/message/send` | messageId returned | BLOCKED | spike script |
| B4 | Server metadata set returns 0 **and** reads back | `/v4/channel-type/message/metadata/set`, `/list` | values updated | BLOCKED | spike script |
| B5 | **Other Web clients receive `onMessageMetadataUpdated` with the new values** (the critical test) | `MessageHandler.onMessageMetadataUpdated` | card flips on 2 independent browsers within ~1 s | BLOCKED | Demo → open crew view in 2 browsers (or 1 normal + 1 private window) → claim |
| B6 | Two clients connect, same group, text delivered both ways | `NCEngine.connect`, `GroupChannel.sendMessage`, `onMessageReceived` | delivered | BLOCKED | crew view ×2 |
| B7 | Custom message registration decodes `BTN:*` on Web (`isPersisted` per typings; docs say `isPersited`) | `NCEngine.registerCustomMessages` | card renders | BLOCKED | crew view |
| B8 | Client-sent text with `metadata:{b:'1'}` accepts later server metadata | client `SendMessageParams.metadata` + server set | server set code 0 | BLOCKED | crew message, then server set via spike variant |
| B9 | Refresh both clients → history + state consistent | `createMessagesQuery` + `/api/events/:id/state` | identical | BLOCKED | refresh during demo |
| B10 | Disconnect / reconnect (airplane mode 30 s) | `ConnectionStatusHandler` | banner, auto-recover, state re-read | BLOCKED | DevTools offline |
| B11 | Webhook `message:send` arrives at deployed URL, signature verifies | Console webhook config | 200 + row in `webhook_events` | BLOCKED (also needs a public HTTPS URL — deploy or `ngrok http 3000`) | send crew message |
| B12 | Webhook replay → `duplicate:true` | — | dedupe | BLOCKED (logic PASS in A9) | re-POST captured payload |
| B13 | Targeted nudge reaches only the named lead | `toUserIds` | only lead sees banner | BLOCKED | unclaimed urgent incident in demo |
| B14 | Status DM reaches attendee (bot → attendee) and refreshes their timeline | direct send + `onMessageReceived` | "Riya is on it" | BLOCKED | demo |
| B15 | Invalid/expired token → refresh once → connect | `connect` code 31004 | recovers | BLOCKED | expire via `/v4/auth/access-token/expire` |
| B16 | Three role tabs in one browser (separate Nexconn users, same origin) | SDK session storage | all three connect | BLOCKED — **risk to verify**; fallback: private window / phone QR | demo hub |
| B17 | Metadata-set failure → card lags, reconciliation repairs ≤ 60 s | reconcile loop | repaired | BLOCKED (logic in place) | revoke network to Nexconn briefly |

## C. Decision gate
**Status: provisional GO** — everything that can be proven without Nexconn credentials passes; the Nexconn-dependent path is implemented against verified docs and typings but **not yet observed**. The gate becomes a real GO / ADAPT after B1–B9 run:
- B5 fails → ADAPT: project state with server-sent `BTN:Update` custom messages (documented `message/send`), clients reduce by `v`; DB stays authoritative.
- B11 fails → ADAPT: fix Console config; webhooks are not on the critical path for the MVP (intake is via our API).
- B6/B7 fail → investigate with Nexconn support (GitHub issue, 12 h SLA) before any pivot; PIVOT to Hallway only if real-time group messaging itself can't work.
