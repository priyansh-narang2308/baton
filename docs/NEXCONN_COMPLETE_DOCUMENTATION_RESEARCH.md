# Nexconn documentation research — what exists, what Baton uses, and why

Last updated **12 Nov 2026**. This is the entry point. It sits on top of three other files and does not repeat them:

| File | What it holds |
|---|---|
| [`NEXCONN_PAGE_INVENTORY.md`](NEXCONN_PAGE_INVENTORY.md) | All **869** documentation pages: title, URL path, how closely each was read, byte size in our download, and which Baton feature it backs. |
| [`NEXCONN_DOCS_AUDIT.md`](NEXCONN_DOCS_AUDIT.md) | Capability-by-capability decisions, rate limits, live findings (35011, metadata behaviour), owner Console actions. |
| [`NEXCONN_RESEARCH.md`](NEXCONN_RESEARCH.md) §2–3 | Competition rules as published, and the long-form 28 Oct research. |

## 0. Method and honest coverage

- **Source.** `https://docs.nexconn.ai/llms.txt`, the official index, which links every page as raw Markdown. All 869 pages were downloaded on 11 Nov 2026 with no failures (6.3 MB).
- **Freshness check, 12 Nov.** The index was fetched again: the same 869 paths, nothing added or removed. The Call SDK for Web quick start is byte-identical to the 11 Nov copy.
- **Official skill.** `nexconn-chat` from `NexconnAI-Dev/nexconn-skills` is installed in `.claude/skills/nexconn-chat` (pinned in `skills-lock.json`). It was loaded in this session. It routes Direct and Group to Chat UI by default, and it treats calls as out of scope for Chat (a separate product, Nexconn Call).
- **Coverage, by page count** (detail per page in the inventory):

| Coverage | Pages | Which |
|---|---:|---|
| Read in full | 148 | Guides, Chat SDK Web, Chat UI Web, Call SDK Web, Server Call API, Console API, index |
| Read closely | 63 | Platform Chat API pages Baton depends on: auth and signing, users and tokens, groups, message send, metadata, webhooks, limits, status codes |
| Endpoint, limits and errors extracted | 157 | The rest of the Platform Chat API |
| Title compared with Web only | 501 | Android, iOS and Flutter SDKs and UI kits. Baton is a Web app; these were compared with Web only to find features Web lacks |

- **Not accessible:**
  - **The Console**, which sits behind the owner's login. We cannot see which services are enabled, the plan or MAU.
  - **The generated TypeDoc API reference** (`/apidoc/...`). We used the installed `node_modules/@nexconn/*/dist/index.d.ts` typings instead.
  - **One iOS page** (`chatsdk-ios/message/sync-across-devices`), which is nearly empty upstream.

We do **not** claim that every one of the 869 pages was read line by line. The table above is what happened.

## A. Chat SDK for Web (`@nexconn/engine` + `@nexconn/chat`, pinned 26.2.1)

| Area | What the docs give | Limits and gotchas | Baton | Status |
|---|---|---|---|---|
| Import and initialise | npm only (no CDN); `NCEngine.initialize({appKey, …})` once, handlers registered before `connect` | Re-initialising with another App Key can clear session data | `src/lib/nexconn-client.ts` initialises once per page | **Used, live** |
| Connection | `NCEngine.connect({token})`; auto-reconnect; status events | After a connection-error callback the SDK leaves its reconnect loop. Kick by another device is code **31010**, with no automatic reconnect | Connection banner with retry; "Use here" on 31010 | **Used, live** |
| Users and profiles | The app owns profiles; Nexconn user ids come from server-issued tokens | Login and sign-up are application-layer | `/api/session/token` issues a token per (role, event) after the signed cookie checks out | **Used, live** |
| Group channels | Server-created groups; members see messages sent after they join unless "pre-join history" is on | That history switch is a Console setting | One crew group per event. Open requests are pinned from the database, so late joiners see them either way | **Used, live** |
| Direct channels | `DirectChannel(userId)`; created by the first message | The Web channel list comes from the server. **For our App Key `createChannelsQuery` returns 35011** | Organizer ↔ volunteer DMs; reporter status updates. Inbox falls back to per-peer history | **Used, live** |
| Open channels | Online-only; auto-destroyed after 60 min idle; one per user | No offline messages | Considered for an attendee "known issues" board; rejected because attendees need delivery after they leave | Not used |
| Community channels | Sub-channels for large organisations | Pro-gated | Multi-team festivals could use them later; one group per event covers 10–150 volunteers | Not used |
| Message operations | Send, history (≤100 per page, always remote on Web), custom types, **metadata** with `onMessageMetadataUpdated` | Metadata writes share the 20/s group-send quota. The server can only set metadata on a message that was sent with metadata | **The incident card's live state is message metadata.** `st, v, n, own, ownN, pass, passN, sug, inc, num` | **Core, live** |
| Targeted group messages | `directedUserIds` (client) / `toUserIds` ≤10 (server) | Cannot carry metadata | Private alerts inside the crew room: assignment, escalation, **Baton Pass** offer and answer | **Used, live (12 Nov pass test)** |
| Mentions | `mentionedInfo` | — | Could mention the owner from the organizer; not needed, since a targeted alert reaches only them | Not used |
| Read receipts | Direct: response or push. Group: per-message query | Group receipts are a query per message, too chatty for a crew room | Candidate: "seen" on organizer → owner DMs | Not used (P2) |
| Unread counts | `getTotalUnreadCount`, `channel.unreadCount` | Relies on the channel list (35011 for us) | Local read marker as the fallback | Partly used |
| Typing | Direct channels only on Web | Groups don't send typing | — | Not used |
| Online status | `subscribeEvent` ONLINE_STATUS | "May require" Console enablement; listed as unavailable on Starter | Would show presence on the crew list; we show nothing rather than guess | Not used |
| Push | **"Web clients do not support local message storage or push notifications."** | A closed tab hears nothing | Biggest platform gap for a phone-first product; see §I | Not available |
| Moderation, translation | Server-side or billed add-ons | Plan- or price-gated | Not part of the core loop | Not used |
| Status codes | Published per platform | — | Mapped in the client: 31010, 35011 | Used |

## B. Chat UI for Web (`@nexconn/chatui`)

**What it is.** Lit Web Components (`nc-` tags, root `nc-chat-ui-app-provider`) on top of the Chat SDK. It provides a ready-made inbox and conversation view for Direct, Group and System channels. Data comes from `ServiceHooks`, and it can be extended with custom messages, menus, events and a push hook.

**What decides it for Baton**, quoted from the current pages:
1. Feature matrix: **"Message metadata: No"** for rendering. Since 26.2.4, `MESSAGE_WILL_SEND` lets you *attach* metadata on send, but the UI does not re-render from `onMessageMetadataUpdated`. Our incident card *is* metadata.
2. Quick start: **"Only Chrome, Safari, and Edge are supported. Portrait mobile browsers are not a supported target for the UI today."** Volunteers use Baton on phones held upright.
3. The Chat UI inbox depends on the server channel list. We first saw **35011** there. **Update 12 Nov:** traced in the installed engine, 35011 is returned only until the post-connect sync sets `ugSynced`. Retried a second later, the list returns code 0 on our App Key. This is no longer a blocker.

**The one place it could fit** is the organizer's desktop inbox for direct messages. Chat UI uses the same `NCEngine` connection (the quickstart says to initialise `NCEngine` first and that it owns the connection), so it can sit beside our custom views. Costs: bumping all three packages to 26.2.5, and our `BTN:*` incident cards rendering as unknown messages in its group view.

**Decision: not used yet.** A half-day isolated spike for the desktop Messages pane (DMs only) is scheduled after deployment. Phones keep the custom SDK views. We will not build a look-alike and call it Chat UI.

## C. Call SDK for Web (`@nexconn/call`) and Server Call API

**What exists (read in full):**
- `npm install @nexconn/engine @nexconn/chat @nexconn/call`, then `NCCallEngine.install()` and `initialize`. Calls reuse the Chat connection and token.
- Prerequisites: HTTPS or `localhost`, microphone permission, and **"Enable the audio and video calling service"** in the Console.
- 1:1 calls: `startCall({calleeIds, callType: SINGLE, mediaType: AUDIO})`, `acceptCall`, `endCall`; events `onCallReceived`, `onCallConnected`, `onCallEnded(reason)`, `onRemoteUserStateChanged`.
- Group calls are documented. One active call per user, and no hold. Call logs (`onLocalCallLogReceived`) exist for 1:1 calls only.
- **Server Call API** is webhooks only: `room:created` and `room:destroyed`, `member:joined` and `member:exited`, `user:offline` and `user:online`, plus call lifecycle events (initiated, invited, ringing, answered, hangup, ended). It uses the same envelope, signing and retries as Chat webhooks, under a separate URL. No REST endpoints to start or end calls are documented.

**The design we would build** is the "escalation huddle":
1. On an urgent incident, the organizer taps **Start huddle**, which starts a group audio call with the owner and the zone lead (`callType` group, `mediaType` AUDIO).
2. Volunteers get an incoming-call sheet in the crew app.
3. A Call webhook (`call` lifecycle plus `member:joined/exited`) writes "Huddle started / Riya joined / ended after 2m 10s" into the incident's activity log. The same verified, deduplicated webhook handler pattern as Chat applies.

**Why it is not built:**
- The Console calling service is **not visible to us and not confirmed enabled**.
- Per the hackathon FAQ, the free minutes need a **card** on the account. Both are the owner's call.
- Building call code we cannot run once end to end would break the rule against unreliable features.
- Separately, Web has no push, so a call only rings if the crew tab is open. A huddle complements alerts; it can't replace them.

**Status: not built, no button in the UI, nothing simulated.**

**Unlock steps (owner, about 15 minutes):**
1. Console → the app → enable **audio and video calling**, and claim the free minutes if you accept the card requirement.
2. Tell Claude. The build is about a day: the huddle button, incoming-call sheet, call webhook route and activity entries, tested in two browsers on `localhost`, which is allowed without HTTPS.
3. At deploy time, set the **Call webhook URL** (separate from the Chat one).

## D. Platform Chat API (server)

| Topic | Facts | Baton |
|---|---|---|
| Auth | Headers `App-Key, Nonce, Timestamp, Signature = sha1(AppSecret+Nonce+Timestamp)` | `src/server/nexconn/sign.ts`, server-only, tested in `sign.test.ts` |
| Base URLs | Per data centre, with a backup domain | Primary `api.sg-light-api.com`, fails over to backup with a 5 s timeout (`api.ts`) |
| Users and tokens | `POST /v4/auth/access-token/issue`, 200 req/s | Token per (role, event), cached in `nexconn_tokens` |
| Groups | Create (≤30 invitees per call), join (≤100 per call) | Group per event at creation; members added on QR join |
| Group messages | 20/s; `toUserIds` ≤10 for targeted sends | Cards, nudges, Baton Pass alerts |
| Direct messages | 6,000/min | Status updates to every reporter, deduplicated in `notifications` |
| Metadata | Set and delete share the group-send quota | Coalesced, serialised per incident (`projection.ts`) |
| System messages | Exist server-side; shown by Chat UI's System channel | Not used: reporter updates are direct messages, which work in our custom attendee page |
| Moderation, push config | Available | Not used: no user-generated public content beyond short reports |
| Errors | HTTP 429 on rate limit; **sending to a non-existent group returns success** (seen live) | Reconcile loop re-reads the database state rather than trusting a send result |

## E. Chat webhooks

- Configured in the Console: one URL, with events chosen individually.
- Envelope `{type, id, time, data[]}`.
- Signature = `sha1(AppSecret+Nonce+Timestamp)`. **The body is not signed.**
- Any 2xx counts as success; otherwise 2 more attempts are made and then the event is dropped. A circuit breaker opens after repeated failures.

Baton (`src/app/api/nexconn/webhook/route.ts`, `src/server/domain/webhooks.ts`):
- Verifies the signature and rejects timestamps outside ±5 minutes.
- Deduplicates on the envelope id (`webhook_events`).
- Treats the body as a hint: the sender must be a crew member of the event that owns the group.
- Answers within the request and does the work in `after()`.
- Intake is idempotent on `source_message_id`.

**Not yet exercised live:** it needs a public HTTPS URL, so deployment first.

## F. Console API

- Organisation-level only: members, Access Keys, subscriptions, and **operation logs for the last 90 days** (`Authorization: Bearer {accessKey}`).
- It cannot read MAU or message statistics.

**Decision: not used.** An organisation Access Key in a public app would be a liability, and audit logs don't help an event crew. Traction evidence comes from the Console UI (screenshots by the owner) and Baton's own impact report.

## G. Guides read for context

- Chat glossary and Call glossary.
- Channel feature matrix (`im-feature-basic`).
- Pricing plans: Free is Chat only, 2,000 MAU, about 100 concurrent connections, with no overage. Chat Growth Credit gives 10K MAU for a year.
- Data centres, privacy policy, SDK library overviews.
- RTC "livestream-meeting" introduction: out of scope.

## H. Channel architecture chosen

| Need | Channel | Why this one |
|---|---|---|
| Crew room per event, live cards | **Group** | Persistent, offline-delivered, metadata-capable, ≤3,000 members |
| Private alerts (assignment, escalation, Baton Pass) | **Targeted message inside the group** | Lands in the context the volunteer already watches; other members' unread counts are untouched |
| Organizer ↔ volunteer conversation | **Direct** | Private, typing and receipts available |
| Status back to every reporter | **Direct** (bot → attendee) | Persists after the attendee leaves the page, unlike Open |
| Attendee public board | Open, **rejected** | Online-only, and auto-destroyed after 60 min idle |
| Multi-team organisations | Community, **deferred** | Pro-gated; one group per event is enough at 10–150 volunteers |

## I. Gaps the docs confirm we cannot close inside Nexconn on Web

1. **No Web push.** A closed tab misses alerts. Only our own Web Push (service worker plus VAPID) can fill this, and that sits outside Nexconn.
2. ~~Channel list 35011~~: **resolved 12 Nov.** It was a timing condition right after connect, now retried (see §B).
3. **Calls need the owner's Console action**, plus a card on hackathon terms.
