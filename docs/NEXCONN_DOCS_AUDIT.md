# Nexconn documentation audit — what Baton uses, avoids, and why

Last updated: **11 Nov 2026**. Source: the full documentation export (`https://docs.nexconn.ai/llms.txt`, every page as raw Markdown). This document holds the **decisions**; the long-form research it builds on is in `docs/NEXCONN_RESEARCH.md` §3, and what was proven against the live service is in `docs/VALIDATION_RESULTS.md`.

Legend: **[V]** verified in the docs · **[L]** verified live against our App Key · **[T]** verified in the installed SDK typings (`node_modules/@nexconn/*/dist/index.d.ts`) · **[?]** stated but not verifiable by us.

## 1. Coverage — what was read

The 11 Nov pass downloaded **869 pages** (no download failures). This includes 23 pages published since the 28 Oct pass, which counted 846.

| Area | Pages | How it was covered |
|---|---:|---|
| Guides (pricing, data centres, glossaries, calls overview, privacy) | 15 | Read in full |
| Chat SDK for Web | 87 | Read in full. The pages the product depends on were re-read on 11 Nov: connection, reconnection/kick, group channel, targeted messages, @mentions, read receipts, unread, typing, online status, channel overview, metadata, history and status codes |
| Chat UI for Web | 28 | Read in full (quick start, components, push hook, events, limits) |
| Call SDK for Web | 8 | Read in full on 11 Nov (quick start, 1-to-1, group, chat integration, push config, status codes, MFA, release notes) |
| Platform Chat API (server) | 220 | All pages digested for endpoint, rate limit and limits. The webhook overview, all 12 webhook event pages, message metadata, group management, send-group/private and limits were read closely |
| Server Call API | 6 | Read |
| Console API | 3 | Read (organisation audit logs; not relevant) |
| Android / iOS / Flutter SDKs and UI kits | ~500 | Not read page by page. Titles were diffed against Web to find features that Web lacks |

**Not accessible to us:**
- **Console** (behind the account login). We cannot see whether Growth Credit, online-status subscription, pre-join history or the audio/video calling service are enabled.
- **Typedoc API reference** (`docs.nexconn.ai/apidoc/nexconnchat-web/...`). Not crawled. We used the installed `index.d.ts` typings instead.
- **Billing pages for calls.** Not in the docs. The only call terms we know come from the hackathon FAQ.

## 2. Chat SDK for Web (`@nexconn/chat` 26.2.1) — capability by capability

| Capability | API | Status for Baton | Implication / restriction |
|---|---|---|---|
| Init + connect once, auto-reconnect every 5 s | `NCEngine.initialize`, `NCEngine.connect({token})` | **Used [L]** | Register handlers before connecting. After a connection-error callback the SDK leaves its reconnect loop, so the app must handle that code. |
| Kicked by another device | `ConnectionStatus.DISCONNECTED` + code `31010` | **Used** | The SDK does not reconnect after a kick. The crew app shows a "Use here" screen. |
| Group channel (crew room) | `GroupChannel`, server-created | **Used [L]** | New members see only messages sent after they join, unless the Console setting "pre-join history" is on. Baton pins open requests from the database, so it works either way [L]. |
| Message metadata as live state | `metadata` on send; `onMessageMetadataUpdated` | **Core [L]** | The server can set metadata on a message a client sent, but only if that message was sent with metadata. Crew messages are therefore sent with `{b:"1"}` [L]. Metadata writes **share the 20/s send-group quota** [V], so writes are serialised per incident. |
| Direct channel (1:1) | `DirectChannel('<userId>')` | **To use (P1)**: organiser ↔ assigned volunteer, opened from an incident | The channel is created by the first message. On Web the channel list is fetched from the server. |
| Targeted group messages | `params.directedUserIds` | Available | Only the listed members receive the message, and other members' unread counts are untouched. Fits private nudges inside the crew room. Server equivalent: `toUserIds` (≤10). |
| @mentions | `mentionedInfo {type, userIdList}`; `msg.isMentioned` | **To use (P1)**: mention the owner when an organiser messages about an incident | Works with "mentions only" Do Not Disturb. |
| Read receipts | Direct: `sendReadReceiptResponse(ids)` / `onMessageReceiptResponse`. Group: `createMessagesReadReceiptUsersQuery` | **To use (P1)** for "seen by owner" in the direct channel | In groups this is a per-message query, not a push, so it is too chatty for the crew room. |
| Unread counts | `BaseChannel.getTotalUnreadCount()`; `channel.unreadCount` | **To use (P1)**: badge on the Messages tab | Fetched from the server on Web. |
| Typing | `sendTypingStatus('RC:TxtMsg')`; `onTypingStatusChanged` | Direct channels only | Groups don't send typing automatically [V]. Not used in the crew room. |
| Online status | `userModule.subscribeEvent({userIds, subscribeType: ONLINE_STATUS})`; `onSubscriptionChanged` | **Optional (P1)**, behind a runtime check | The docs say it "may require" Console enablement and that the subscription count is capped. It is listed as unavailable on Starter. If the call fails, show nothing rather than wrong presence. |
| History | `createMessagesQuery({pageSize ≤ 100}).loadNextPage()` | **Used [L]** | Always remote on Web, with no local DB. |
| Web push | none | **Not available [V]** | "Web clients do not support local message storage or push notifications." A closed tab hears nothing. This gap can only be filled by our own Web Push (service worker + VAPID), which is outside Nexconn. |
| Custom message types | `registerCustomMessages` before connect | Not needed | Metadata on text messages covers our state. |
| Streaming messages | server `stream/send` | Not used | No AI in the claim path, by design. |
| Open channels | `OpenChannel` | Deferred (attendee live board) | No offline messages, auto-destroy after 60 min of inactivity by default, and one open channel per user. |
| Community channels, translation, moderation add-ons | — | **Avoid** | Pro-gated, billed separately or undocumented on Web. They do not serve the core loop. |

## 3. Chat UI for Web (`@nexconn/chatui`) — decision

**Decision: do not use it. Build on the raw Chat SDK with our own React components.**

Reasons [V]:
1. Chat UI has **no message metadata support**, and metadata is our live incident state.
2. It is "not tuned for portrait H5 mobile layouts", while volunteers are on phones.
3. It is built as Lit Web Components, which brings React interop friction.
4. It supports direct, group and system channels only.

What we lose: a ready-made inbox. Mitigation: the direct-message view we need is small, with one thread per incident owner.

## 4. Call SDK for Web (`@nexconn/call`)

| Fact | Source |
|---|---|
| Install `@nexconn/engine @nexconn/chat @nexconn/call`. `NCCallEngine.install()` then `initialize({})`. Calls reuse the Chat connection, so the same token works. | Quick start [V] |
| **The "audio and video calling" service is off by default and must be enabled in the Console.** | Calls overview, quick start [V] |
| The page must be served over **HTTPS or `localhost`**, and the user must grant microphone permission. | Quick start [V] |
| 1-to-1 call: `startCall({calleeIds:[id], callType: SINGLE, mediaType: AUDIO, extra, pushConfig})` returns `{code, callId}`. The callee uses `acceptCall({callId})`; either side uses `endCall()`. Events: `onCallReceived`, `onCallConnected`, `onCallEnded(reason)`, `onRemoteUserStateChanged`. | 1-to-1 page [V] |
| One active call per user and no hold. A call log (`onLocalCallLogReceived`) is produced for 1-to-1 calls only, and is re-delivered after the next connect if the user was offline. | 1-to-1, chat integration [V] |
| **Hackathon terms: "add a credit card to claim 10,000 free minutes".** The standard Free plan is "Nexconn Chat only". | Hackathon FAQ, pricing page [V] |

**Decision: Calls are blocked on the owner's account, so they are not built yet and nothing simulates them.**
- Enabling calls needs a Console action, and per the hackathon terms a **credit card**. Both are the owner's decision; our rules forbid paid services without approval.
- There is a second limit: Web has no push. A volunteer only hears the call if the crew tab is open, so a call cannot replace an alert to a closed phone.
- The value is real but narrow: the organiser calls the assigned owner of an urgent incident with one tap.
- If the owner enables the service, the build is about a day: a "Call owner" button on the incident detail for organisers, an incoming-call sheet in the crew app, and the call outcome written to the incident activity log from `onCallEnded`.
- Until then the UI shows no call button. A dead button would break the "no fake controls" rule.

## 5. Server API (`api.sg-light-api.com`, backup `api-b.sg-light-api.com`)

| Topic | Fact | What Baton does |
|---|---|---|
| Auth | Every request signs `sha1(AppSecret + Nonce + Timestamp)` in headers. | Signed only in `src/server/nexconn/`; the secret never leaves the server. |
| Tokens | `POST /v4/auth/access-token/issue`, 200 req/s. | Issued per (role, event) session. |
| Rate limits | 100 req/s by default. **Send-group 20/s; metadata set/delete consume that same quota.** HTTP 429 when exceeded. | Metadata writes are serialised per incident and coalesced into one write per change. |
| Group create / join | ≤30 invitees per create; join adds ≤100 users per call. | The server adds a member when they join by QR code, so no approval step is needed. |
| Message update | Within 24 h only. | We use metadata, not content edits. |
| Quirk found live | Sending to a **non-existent group returns success** [L]. | The reconcile loop re-reads state; we don't trust a send result alone. |
| Server-sent messages | Excluded from `message:send` webhooks unless the Console option is on, and not echoed to the sender unless `isEchoToSender=1`. | The webhook handler ignores server-originated messages. |

## 6. Webhooks

| Fact [V] | Implication |
|---|---|
| One URL, configured in the Console under Chat → Chat settings → Webhooks. Events are selected individually. | We need `message:send` only. `user:connection_status` is optional for presence. |
| Envelope `{type, id, time, data[]}`. `data` can be batched in future revisions. | Iterate `data[]`; dedupe on envelope `id` plus `messageId`. |
| Signature = `sha1(AppSecret + Nonce + Timestamp)` in headers. **The body is not signed.** | Verify the signature, reject stale timestamps, dedupe, and **treat the body as a hint**: re-check the sender's membership in our DB. |
| Any 2xx counts as success. On a timeout or non-2xx, **2 more attempts**, then the event is dropped. A circuit breaker opens after repeated failures. | Delivery is at least once and can still lose events, so we answer fast (work runs in `after()`), keep intake idempotent, and keep a manual "Make it a request" fallback. |
| Pre-messaging (synchronous, ≤5 s, fails open) exists on Free and Pro, **not Starter**. | Not used: it would put our server on the delivery path. |
| Source IPs are published per region. | Optional allowlist at the host. |

**Live status:** the webhook path has unit tests (signature, idempotency, detection) but has **not been exercised live**, because it needs a public HTTPS URL and we may not deploy yet. Every other path was proven live through the manual "Make it a request" route, which calls the same intake.

## 7. Pricing and Growth Credit

| Plan | Terms [V] | Status for us |
|---|---|---|
| Standard Free (every new app) | One month, no card, **Chat only**, 2,000 MAU, PCC 5% (≈100 concurrent), no overage: new connections fail when exceeded | Active by default **[?]** — Console not visible to us |
| Chat Growth Credit | Pro features, 10K MAU for a year (2 years for winners), one app per organisation, unlocked by integrating the SDK and sending one message | **Not confirmed.** The owner must enrol and screenshot the entitlement |
| Call | Card required to claim 10,000 free minutes | Not enabled |
| MAU definition | Unique user IDs that connect in a calendar month (UTC) | Every volunteer and attendee who opens a chat page counts. Pilots in **November** count towards November MAU |

**Risk:** on the standard Free plan, a busy event could pass about 100 concurrent connections, and new connections then **fail**. Baton keeps working from the database (reports, claims, board), but chat and live cards stop for late joiners. Enrolling in Growth Credit before any pilot removes the risk.

## 8. Features to avoid, and why

- **Broadcasts.** 2 per hour and 3 per day, delivered by polling within 3 minutes. Far too slow for operations.
- **Pre-messaging hooks.** They put our server on the delivery path and are plan-gated.
- **Chat UI.** No metadata support, and not mobile-portrait friendly.
- **Community channels.** Pro-gated and more structure than an event needs.
- **Built-in translation and auto moderation.** Undocumented or billed separately, and not part of the core loop.
- **Group read-receipt queries for the crew room.** Each one is a per-message server query.

## 9. Owner actions that unlock features (Console, cannot be done from code)

1. **Enrol in Chat Growth Credit** and screenshot the MAU/PCC entitlement. This is the qualification evidence and removes the 100-connection risk.
2. **Enable "pre-join history for new members"** on groups. This gives late joiners the full chat context; the open requests are already pinned.
3. **Optional: enable online-status subscription** to get presence on the crew list.
4. **Optional, needs a card: enable audio/video calling** to unlock one-tap "Call owner".
5. **At deploy time (not yet authorised): set the webhook URL** for `message:send`, so detection from plain chat runs without the manual button.
