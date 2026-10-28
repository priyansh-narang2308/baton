# Nexconn Build Challenge 2026 — Research, Selection & Build Plan

**Prepared:** 28 Oct 2026 · **Submission deadline:** 22 Nov 2026, 23:59 AoE (25 days away)
**Status:** Research & planning only. No code, no Console changes, no installs were made.

Evidence labels used throughout:
- **[V]** Verified on an official source (URL given in the Source Ledger, §19)
- **[I]** Supported inference from verified facts
- **[A]** Working assumption that must be validated
- **[?]** Unresolved — could not be verified

---

## SECTION 1 — Executive Verdict

| | |
|---|---|
| **Product** | **Baton** — *the group chat where every request gets an owner* |
| **Track** | Workplace & Collaboration (expansion story into Humanitarian: volunteer/relief crews) |
| **Core concept** | A zero-install, real-time coordination app for **temporary frontline crews** (event volunteers, fest/conference staff, relief teams). People keep typing like they do in WhatsApp; Baton turns any message that is a request into a **live, claimable card in place** — the same message object on every phone flips from *Open* → *Claimed by Riya* → *Done* in real time. Attendees can raise requests from a venue QR code without installing anything and watch the status live. Unclaimed urgent requests escalate to a **named** on-duty lead, not the whole group. |
| **Target users** | Beachhead: organisers and volunteer leads of college fests, tech meetups/DevFests, hackathons and conferences (20–300 crew, one-day to one-week lifetimes). Later: venues, campus security, NGOs and disaster-relief crews. |
| **Why selected** | Highest estimated rubric score of 48 candidates (§7); the only finalist where Nexconn's distinctive primitives (message metadata as live state, server webhooks, targeted group messages, presence, open-channel KV) are *the product mechanism* rather than a chat window; produces a 20-second, multi-device "wow" moment; and has a realistic route to **real November MAU** — which judges explicitly count. |
| **Principal differentiator** | Structure *emerges from ordinary messages* (no forms, no ticket tool) and ownership state lives **on the message itself**, synced to every device; escalation targets a named person, which research shows removes the online bystander effect (Markey 2000, §16). |
| **Biggest risk** | (1) Message-metadata update events and webhook→server-metadata round trip must behave as documented on Web — validated in a 48-hour spike before UI work (§14 Stage A). (2) Traction depends on landing 2–3 real pilot events in November. |
| **Estimated score** | **84 / 100** (UX 42/50 · Innovation 25/30 · Business 17/20) — *our estimate, not an organiser score*; after the hostile audit (§18) **82–86** depending on pilot traction. |

**Runner-ups:** (2) **Hallway** — live audience Q&A/backchannel with AI question clustering on Open Channels (safest build, strongest raw traction, weaker innovation). (3) **Clearline** — buyer–seller chat with pre-delivery scam interception using the pre-messaging webhook (most novel platform use, weakest traction path).

---

## SECTION 2 — Hackathon Intelligence

### 2.1 Pages visited
| Page | Result |
|---|---|
| https://reskilll.com/hack/nexconn | Client-rendered. Plain HTTP fetch returned only the title; fully read via rendered browser. |
| https://reskilll.com/hack/nexconn/rules | Read in full, including all 12 FAQ answers (expanded via DOM). |
| https://reskilll.com/hack/nexconn/terms | Read in full. |
| https://reskilll.com/hack/nexconn/privacy | Not read (not decision-relevant). |
| /dashboard, /login, /signup | Not accessed (require registration — we did not register). |
| https://www.nexconn.ai/free-chat-api | Read (Chat Growth Credit offer); 2 of 4 FAQ answers captured. |
| https://github.com/NexconnAI-Dev/hackathon | Support repo — **empty**, no issues yet (checked 28 Oct). |

### 2.2 Verified rules [V]
- **Chat SDK integration is mandatory.** "Your submission must be a functional app or website that uses the Nexconn Chat SDK. Chat UI counts as Chat SDK usage. The app must show real, measurable SDK usage." Projects without Chat SDK are disqualified.
- **Call SDK is optional** ("Use it if your app needs voice or video calls").
- **Platforms:** Web, iOS, Android, Flutter only. Any language/framework on those.
- **AI coding tools are welcome.**
- **Team size 1–4.** Solo = team of one. Only the **team leader** can select the track and submit.
- **Existing projects allowed** if a real Nexconn integration is added during the challenge; must disclose what pre-existed.
- **Code of conduct:** harassment, plagiarism, cheating or interfering with the site/teams → disqualification.
- **Eligibility:** anyone except residents of Mainland China (registrations refused). Online and free.
- **IP:** you keep it; Nexconn gets a non-exclusive, royalty-free licence to exhibit/promote name, description, screenshots.
- **Judging decisions are final.** Rule/date changes will be posted on the site and emailed.

### 2.3 Timeline [V]
| Date | Event |
|---|---|
| 23 Oct 2026 | Registration and submissions open (same day) |
| 23 Oct – 22 Nov | Build & submit; **submission editable until the deadline** |
| 22 Nov, 23:59 AoE | Deadline (= Mon 23 Nov, 17:29 IST) |
| 23 – 27 Nov | Judging — "Nexconn judges score each complete submission" |
| 1 Dec | Results on site and by email |

**There is no preliminary or qualifying round.** One submission, one judging phase. [V]

### 2.4 Submission requirements [V]
| Deliverable | Required? | Published detail | Not specified |
|---|---|---|---|
| Project write-up (PDF) | Required | Why you built it, problem solved, **which features use the Nexconn SDK**, **include your Nexconn App Key** | Page limit, template |
| Demo video | Required | Shows main features working; YouTube, Vimeo, Loom or Google Drive; public to anyone with link | **Length not specified** |
| Runnable app | Required | Live URL (web) or direct download link (app) | Uptime period |
| Source code | Required | **Public** GitHub repository | Licence, README format |
| User traction proof | **Bonus** | "Proof that real people use your app… Traction gives a significant bonus in judging." | Format |
| App Key | Required | In write-up **and** submission form; "Judges use it to verify your SDK usage" | — |

### 2.5 Judging rubric [V] — weights confirmed
| Criterion | Weight | Official wording (paraphrased closely) | Our practical interpretation [I] |
|---|---:|---|---|
| Completeness & UX | **50%** | The demo works fully and runs smoothly; the interface is clean; the interaction is clear and easy to understand. | End-to-end flow with no dead ends; works on a judge's own device without hand-holding; obvious first action; zero visible errors; mobile-first polish. |
| Innovation & scenario value | **30%** | How new the idea is; whether it solves a real communication problem **or** adds a new, interesting interaction. | A named communication failure + a mechanism that couldn't exist without real-time messaging. |
| Business & growth potential | **20%** | Traction and viability; **"They count early users as active users on Nexconn"**; whether the app can become a real product. | Real MAU on our App Key during judging + credible ICP/pricing. |

**FAQ [V]:** "How do judges measure traction? Judges count the active users on your Nexconn app. They also look at any proof that you give, for example analytics screenshots or user feedback."

### 2.6 Prizes [V]
1st $2,000 · 2nd $1,250 · 3rd $750 · 4th $500 · 5th $500 (5 winners, $5,000 cash). Every winning team: +1 extra year of the Free Chat Plan (2 years total, "worth $20,640", usable only for the challenge project) and 1 year discounted AWS or Alibaba Cloud for a new email. **No per-track prizes are published** — tracks are idea framing ("Use the other tracks as ideas, not as limits"). [V]

### 2.7 Tracks as published [V]
| Track | Tagline | Example ideas listed by organisers |
|---|---|---|
| Social & Community | Group messaging and topic-based channels | Watch-party live room; interest group chat; creator fan channel |
| Gaming & Live Streams | Squad chat and live-stream chatroom | Squad chat room; in-match quick chat; spectator chat overlay |
| Workplace & Collaboration | DMs and team project threads | Team DMs; project threads; **shift handover channel** |
| Marketplace & Support | Buyer-seller chat and customer service | 1-on-1 buyer-seller; **human agent dispatch center**; multi-language translated chat |
| Humanitarian & Social Good | Accessible text chat for seniors and communities | Large-font & voice-to-text chat; **volunteer dispatch rooms**; peer-support check-ins |
| Open Innovation | Any interactive chat idea | — |

The rules intro also suggests "a social app, a support bot that uses AI or a shared workspace" — **these exact examples will be the most common submissions.** [I]

### 2.8 Sponsor & organiser analysis
- **Who Nexconn is.** The site footer reads "Copyright 2026 RCLOUD GLOBAL PTE. LTD." and every built-in message type uses the `RC:` prefix (`RC:TxtMsg`, `RC:StreamMsg`…); the Server API docs still link to `github.com/rongcloud/server-sdk-*`. [V] → Nexconn is the international brand of RongCloud's IM/RTC stack (mature server infrastructure, very new Web SDK packaging — `@nexconn/chat` v26.2.0 released 15 Apr 2026). [I]
- **Why they run this.** The challenge is a developer-acquisition campaign attached to the **Chat Growth Credit** (10K MAU free for a year). UTM-tagged links everywhere, "Install skills", "star its repo". [V for the links; I for motive]
- **What they want to see.** [I] (not official criteria): (a) apps that keep running on Nexconn after the challenge — winners' plan is "to keep its app running"; (b) **real MAU on their platform** (explicitly counted); (c) showcase-able scenarios for marketing (they reserve the right to promote submissions); (d) use beyond a quickstart — custom messages, metadata, webhooks, streaming, open/community channels.
- **Judges are Nexconn staff** [V: "Nexconn judges score…"]. [I] They know which APIs are hard and which are the 5-line quickstart; deep, correct use of the platform will be legible to them.

### 2.9 Technical constraints relevant to every project
- HTTPS required for Call SDK pages; Web SDK keeps **no local message storage** (history always fetched from server). [V]
- Client send rate limit: **5 messages/second across all channels**. [V]
- Web multi-device: up to **10 simultaneous Web connections per user** (each tab = 1). [V]
- Free/Growth plan specifics: see §3.6.

### 2.10 Disqualification & failure risks
| Risk | Mitigation |
|---|---|
| No visible/measurable Chat SDK use | SDK is the core transport; App Key in PDF + form; judges see MAU/messages in our app's stats. |
| App link down during 23–27 Nov (free hosts sleep) | Use an always-on instance; uptime monitor; freeze deploys after 22 Nov. |
| Video not publicly viewable | Test link in a logged-out browser. |
| Repo private or leaking App Secret | Public repo, `.env.example` only, secret scanning (gitleaks) before publishing. |
| App on the standard 1-month Free plan expires / 2K MAU cap | Enrol the app in Chat Growth Credit immediately (§3.6). |
| Submitting a different App Key than the deployed app uses | One app, one key; verify in the deployed bundle. |
| Plagiarism (copying samples verbatim) | Original code; credit official samples where adapted. |
| Leader-only submission | Leader account created and verified on day 1. |

### 2.11 Known uncertainties
Video length · PDF length/template · whether judges will open the app on their own devices (assume yes) · whether MAU is read for November only (MAU is a **calendar-month** metric [V], judging is 23–27 Nov → **November users are what judges will see** [I]) · whether dev vs prod App Keys differ (the Call doc says "each app has two separate App Keys, development and production"; the Chat quickstart says "Each app has one App Key" — **contradiction [?]**, verify in Console).

---

## SECTION 3 — Nexconn Technical Intelligence

### 3.1 Documentation inventory & coverage
The docs publish a machine index at `docs.nexconn.ai/llms.txt` (160 KB; every page also available as raw `.md`). [V]

**Coverage correction (28 Oct, second pass).** The first pass read ~60 pages in depth. A second pass downloaded **all 846 pages listed in the index (6.1 MB, 0 failures)** and covered them as follows:

| Doc area | Pages | Coverage |
|---|---:|---|
| Guides | 15 | **Read in full** (incl. Realtime chat intro, Basic features, Chat glossary, Data centers, Pricing, SDK overviews, Call glossary, RTC intro, Privacy policy key sections) |
| Chat SDK for Web | 81 | **Read in full** (every page; code examples condensed) |
| Chat UI SDK for Web | 28 | **Read** — all pages, extracted for limits/notes/APIs |
| Call SDK for Web | 8 | **Read** — all pages, extracted for limits/notes/APIs |
| Platform Chat API | 221 | **All pages digested** (endpoint, rate limit, limits, notes); ~110 pages relevant to Baton read closely (messages, metadata, groups, open channels, users, push, webhooks, limits, status codes); community-channel, friends, blocklist, tags, open-channel priority pages read at title/limit level |
| Server Call API | 6 | Read (overview + webhooks) |
| Console API | 3 | Read (org-level audit logs; not relevant) |
| Android / iOS / Flutter SDK & UI | ~460 | **Scanned for capabilities missing on Web** (page-title diff); not read page by page — Web is the chosen platform |
| GitHub & npm | — | As before (repos, READMEs, `@nexconn/chat` typings) |

No page was unavailable.

### 3.2 Architecture of Nexconn (as documented) [V]
1. **Client authenticates with an access token**, never with credentials. The client SDK has *no* token API.
2. **Our backend issues tokens** via `POST /v4/auth/access-token/issue` (`userId`, `name`, optional `avatarUrl`), signed with headers `App-Key`, `Nonce`, `Timestamp`, `Signature = sha1(AppSecret + Nonce + Timestamp)`. Rate limit 200 req/s. Tokens valid indefinitely by default; refreshing the App Secret invalidates all tokens.
3. **Client init once:** `NCEngine.initialize({ appKey, areaCode })` (default `AreaCode.SG`), register handlers, then `NCEngine.connect({ token })` **once per app lifecycle** — built-in reconnection retries every 5 s; heartbeat-based.
4. **Messages** travel client → Nexconn → recipients over the SDK's persistent connection; offline recipients get missed messages on reconnect (cached **7 days** by default for direct/group/system). Cloud history retention: 180 days (Growth Credit page) for direct/group.
5. **Nexconn stores:** messages/history, channels, group membership, message metadata, open-channel KV, user profiles (optional), friend graph. **Nexconn does not manage app user information** — identity, roles, and business state are ours.
6. **Events to our server:** one webhook URL, selected events, POST JSON envelope `{type, id, time, data[]}`, 5 s timeout, 2 retries, circuit breaker.
7. **Calls** use the Chat connection as signalling (Call SDK depends on `@nexconn/engine` + `@nexconn/chat`), separate Call Server for state.
8. **Data centres:** Singapore (default), North America, Saudi Arabia (+ BJ/OM area codes in SDK); API base `api.sg-light-api.com` with backup `api-b.sg-light-api.com` — **implement failover**.

### 3.3 Verified SDK capability matrix (Web)
| Capability | API (verified in docs and/or `index.d.ts`) | Notes |
|---|---|---|
| Init / connect / disconnect | `NCEngine.initialize`, `NCEngine.connect`, `NCEngine.disconnect` | Register handlers before connect. |
| Connection status | `ConnectionStatusHandler.onConnectionStatusChanged({status, code})` | Code **31010** = kicked by another device login. |
| Channel classes | `DirectChannel`, `GroupChannel`, `OpenChannel`, `CommunityChannel`, `CommunitySubChannel`, `SystemChannel` | |
| Send text / media / custom | `channel.sendMessage(SendTextMessageParams)`, `sendMediaMessage(Helper.createSend…Params(file))`, `SendMessageParams<T>(content, 'App:Type')` | Upload progress callbacks for media. |
| Custom message types | `NCEngine.registerCustomMessages([{messageType, isPersited, isCounted, isStatusMessage?}])` — **before connect** | Note SDK spelling `isPersited`. Avoid `RC:`/`NC:` prefixes. |
| Message metadata (live per-message state) | `SendMessageParams.metadata?: Record<string,string>`; `message.setMetadata()`, `message.deleteMetadata()`; `MessageHandler.onMessageMetadataUpdated / onMessageMetadataDeleted` | Server API: direct/group/system only (**not open channels**); community has its own API. Server set: ≤100 KV per request, ≤300 per message; key ≤32 chars, value ≤4,096. Original message must be sent with metadata enabled. |
| Edit message | `BaseChannel.updateMessage({messageId, channelIdentifier, content})`; `onMessagesUpdated` | Direct, group, community. |
| Delete / recall | delete-for-me, delete-for-all; `onMessageDeleted` | |
| Read receipts | `channel.sendReadReceiptResponse(ids)`; `onMessageReceiptResponse`; group: `createMessagesReadReceiptUsersQuery` | Send with `needReceipt`. |
| Typing | `ChannelHandler.onTypingStatusChanged` | ChatUI: direct only. |
| History | `BaseChannel.createMessagesQuery({channelIdentifier, startTime, pageSize ≤100, isAscending}).loadNextPage()` | Always remote on Web — cache in app state. |
| Streaming messages (receive) | `onStreamMessageRequestInit / Delta / Complete` | **Sent from server** (`RC:StreamMsg`, direct/group/system; ≤128 KB total; `text`/`markdown`/`html`). |
| Targeted group messages | `SendMessageParams.directedUserIds` | Server: `toUserIds` ≤10. |
| @mentions | `MentionedInfo` | |
| Presence | `NCEngine.userModule.subscribeEvent({userIds, subscribeType: ONLINE_STATUS})`; `UserHandler.onSubscriptionChanged` | "May require Console enablement"; client presence is listed as supported on Free/Pro, **not Starter**. |
| Open channels | `OpenChannel` join/leave, `OpenChannelHandler.onParticipantChanged({participantCount})`, metadata `setMetadata/getMetadata/deleteMetadata` + `onMetadataChanged` | No persistent membership, **no offline messages**, history only with retention service; ≤100 KV per channel; auto-destroy mechanism. |
| Groups | `GroupChannel`, create/manage/members/roles; `GroupChannelHandler` | 300 members default. |
| Community channels | subchannels, private subchannels, user groups | 10K members; Free/Pro only. |
| Moderation | profanity filter (free), automatic moderation (billed separately, card required), `onMessageBlocked` | |
| Translation / speech-to-text | `TranslateModule`, `TranslateHandler`, `message.requestSpeechToText()` **exist in typings and v26.2.0 release notes ("Built-in Translation")** | **No usage docs found [?]** — likely a Console-enabled/paid add-on. Do not depend on it. |
| Multi-device | sync on by default; 1 mobile + 10 Web connections | |

### 3.4 Server API & Webhooks — what must live on our backend [V]
| Operation | Endpoint (all `POST`, signed) | Why server-side |
|---|---|---|
| Issue token | `/v4/auth/access-token/issue` | Requires App Secret |
| Create group / add / remove members | group-channel management endpoints | Authorisation is ours |
| Send group/direct/system messages as a bot | send-group, send-private, system | Bot identities, server-originated cards |
| **Set/delete message metadata** | `/v4/channel-type/message/metadata/set` (`messageId, userId, channelType 1|3, channelId, metadata, isEchoToSender`) | Authoritative state changes (e.g. claim) — 100 req/s, **group metadata 20 req/s** |
| Streaming message | `/v4/group-channel/message/stream/send` | AI summaries streamed into a channel |
| Open channel create/destroy/KV | open-channel endpoints | Event live board |
| Mute/ban/freeze | moderation endpoints | Crew safety |
| Check online status | user online status endpoint | Escalation targeting |

**Webhook events [V]:** `user:connection_status` (offline detected within 5 min when no clean disconnect), `user:delete_state`, `user:profile_update`, `user:friendship`, `message:send`, `message:delete`, `{direct|group|open|community}_channel:pre_messaging`, `message_moderation:block|suspected`, `group_channel:changed|operation`, `open_channel:operation|metadata_update`.

**Pre-messaging hook [V]** — synchronous; Nexconn waits ≤5 s for `{pass: 0|1|2, replaceContent, replacePushContent, replaceDisablePush, replacePushConfig, replaceMetadata, extra}`. `pass:0` blocks and returns `extra` to the sender's interception callback. Times out 3× → **delivers original unchanged (fail-open)**. Available on **Free and Pro, not Starter**.

**Delivery semantics [V]:** 5 s timeout, 2 retries (3 attempts), any 2xx = success, no further retry after 3 failures, circuit breaker pauses 1 min if 30 events in 1 min all fail. → **At-least-once with possible loss; we must dedupe on `id` and reconcile.** [I]

**Signature caveat [V→I]:** webhook `Signature = sha1(AppSecret + Nonce + Timestamp)` — it **does not cover the request body**. So the signature authenticates freshness, not payload integrity. Mitigate: reject stale timestamps (>5 min), dedupe event ids, HTTPS only, optional IP allowlist (Nexconn publishes webhook source IPs per region), and treat webhook payloads as hints — re-read authoritative data where it matters.

### 3.5 Chat SDK vs Chat UI (Web)
| | Chat SDK (`@nexconn/chat`) | Chat UI (`@nexconn/chatui`, Lit Web Components, Apache-2.0) |
|---|---|---|
| Channel types | All | **Direct, group, system only** (no open/community) |
| Message metadata | Yes | **No** |
| Message search | Yes | No |
| Typing indicator | Yes | Direct only |
| Voice message send | Yes | Not supported |
| Custom messages | Yes | Yes (`registerCustomMessages` + Web Component renderer) |
| Styling | Total control | Config objects, bubbles, menus; outer chrome is yours |
| Framework fit | Any | Web Components in React needs `isCustomElement` handling |
**Verdict:** Chat UI would speed up a WhatsApp-like inbox but **cannot render live metadata state** — the core of our product. Build on Chat SDK with our own React components. [I]

### 3.6 Pricing & plan contradictions — resolved
| Offer | Terms [V] | Source |
|---|---|---|
| **Standard Free plan** | Auto-created app; **valid one month**, no card; Chat only; **2,000 MAU**; PCC = 5% of tier (**100**); 500 MB storage/upload; no overage — new connections fail when exceeded; 50 concurrent open channels; pre-messaging webhooks **supported** | pricing-plans |
| **Chat Growth Credit** (the "Free Chat Plan" the hackathon refers to) | "Full Chat Pro capabilities", **10K MAU free for one year** (hackathon page), unlimited messages, 10 GB storage/upload, 180-day history; **one app per organisation, cannot be changed later**; **unlock by completing SDK integration and sending one message**; outside Mainland China. Beyond quota: without a card, "related features return errors and stop"; with a card, billed at standard rates. Call, moderation and add-ons billed separately. | free-chat-api, hackathon FAQ |
| **Hackathon winners** | +1 year (2 years total) | rules page |
| **Call SDK** | Optional; **add a credit card to claim 10,000 free minutes**; service must be enabled in Console; group-call billing starts on creation | hackathon FAQ, call docs |
| **Auto moderation** | Card required; first 10K text/image checks + 10K media minutes free, then $1/1K texts etc. | pricing-plans |
| **Paid Pro list price** | 10K MAU tier $860/mo; MAU overage $0.12 (preferential) | pricing-plans |

**Resolution:** the "10,000 MAU" and "2,000 MAU / one month" numbers describe **two different things** — the standard Free plan every new app starts on, and the Growth Credit campaign that must be explicitly joined. [I] **Action:** in Stage A, confirm in the Console that our app shows the Growth Credit / Pro-equivalent entitlement (MAU 10K, and its PCC allowance — likely 5% of 10K = 500 [I], **verify**), otherwise a busy pilot event could hit a 100-connection ceiling.

### 3.7 AI dev tooling
- **`nexconn-chat` skill** (`npx skills add https://github.com/NexconnAI-Dev/nexconn-skills.git --skill nexconn-chat`): routes an AI assistant to the right docs, enforces "App Key on client, App Secret/token on server", channel-type selection. Useful; its own README says "verify the exact APIs against the installed SDK" — do that against `index.d.ts`. [V]
- **Console MCP server** (`https://console-mcp.nexconn.ai/mcp/v1/endpoint`, Authorization = Console Access Key): fetch user tokens, query/update Console settings. Optional. The Access Key is privileged — keep it in the local environment only, never in the repo. [V] Recommendation: install the skill; **skip the MCP** unless Console toggling becomes a bottleneck (it widens the blast radius of a leaked key).
- **Node Server SDK** (`@nexconn/server-sdk` v0.1.2, OpenAPI-generated, installed from git tag, not on npm) — very young. [V] Recommendation: write a ~60-line typed signed-fetch client with primary/backup failover; optionally use the SDK's generated types for reference. [I]

### 3.8 Capability → product opportunity map
| Nexconn capability | Verified behaviour | Product advantage most teams will miss | Track | Complexity |
|---|---|---|---|---|
| Message metadata + update events | KV on a sent message, pushed to all participants | **A message becomes a live object** (claimable task, order status, poll, gift) — no separate state sync layer | Workplace, Marketplace, Social | Medium |
| Pre-messaging webhook | Sync rewrite/block/annotate before delivery, fail-open | **Server-side policy before anyone sees it** — fraud/PII interception, instant classification | Marketplace, Humanitarian | Medium-High (5 s budget) |
| `message:send` webhook + server metadata set | Post-delivery server reaction | Async AI enrichment that visibly "materialises" on every device | Any | Medium |
| Server streaming messages | Typewriter delivery into group/direct | AI summaries/briefings streamed live into a channel, persisted | Workplace, Support | Low-Medium |
| Targeted group messages | Only listed members receive | Private nudges/escalations inside a shared room without a new channel | Workplace, Gaming | Low |
| Open channels + KV | Unlimited participants, shared state, participant counts | Live audience state (polls, scores, "queue: long") without our own WebSocket server | Social, Gaming | Low-Medium |
| `user:connection_status` webhook + presence | Online/offline (offline within 5 min) | Liveness signals (who's actually on shift; elder check-in passive signal) | Workplace, Humanitarian | Low |
| Community channels | 10K members, subchannels, private subchannels, user groups | Discord-style structure with role-scoped rooms | Social | High |
| Call SDK | 1:1 & ≤16-party video, upgrade 1:1→group, call logs | One-tap escalation from text to voice | Support, Humanitarian | High (card + permissions) |

### 3.9 Integration risks
1. **Web SDK is six months old** (first release 15 Apr 2026; one patch). Expect rough edges — validate every API we rely on in Stage A. [V/I]
2. **Docs/typings drift** (`isPersited` spelling; translation in typings but undocumented). [V]
3. **Metadata from a client-sent message**: server set requires the message to have metadata enabled → always send crew messages with an initial `metadata` field. [V→I] Verify that `onMessageMetadataUpdated` fires on *other* clients for server-set metadata (`isEchoToSender` only concerns the operator). [A]
4. **Group metadata rate 20 req/s** — fine for us (a busy event is <1/s). [V/I]
5. **Webhooks are at-least-once and can drop** after 3 failures → reconciliation job + idempotency. [V/I]
6. **Pre-messaging plan gating / Console setup** — treat as optional enhancement. [V]
7. **PCC limit** on whatever plan is active (§3.6). [V/A]

### 3.10 New facts from the full documentation pass, and what they change for Baton
| # | Verified fact [V] | Source page | Impact on Baton |
|---|---|---|---|
| 1 | **Web clients get no push notifications and keep no local storage** ("Web does not receive push notifications directly"; "Web clients do not support local message storage or push notifications"). | message types; DND overview (Web) | **Biggest gap.** A volunteer with a locked phone or a closed tab receives nothing until they reopen the page. **Change:** make the crew app an installable PWA and send our own Web Push notifications (service worker + VAPID) for new urgent requests and escalations; use the Screen Wake Lock API while "on duty". iOS only delivers Web Push to PWAs added to the home screen (iOS 16.4+) — onboarding must prompt "Add to Home Screen". Native/Flutter app with Nexconn push stays Tier 3. |
| 2 | Group channels: **new members only see messages sent after they join**, unless "Enable pre-join history access by new member" is turned on in Console. | Basic features; group overview | Turn the setting on in Stage A. Late-joining volunteers must still see open requests — the board already loads open requests from our API, which covers this either way. |
| 3 | **Open channels auto-destroy after 60 min of inactivity** by default (configurable 60–10,080 min, or keep-alive). Users are auto-removed ~30 s after going offline. A user can be in **one open channel at a time** by default. On join, the last **50 messages** are delivered. Messages beyond **40 per 200 ms per channel** can be dropped. | open-channel overview, destroy-about, service config, priority pages | Create the attendee live board with schedule-based destroy (event length) or keep-alive; the live board page must re-`enterChannel` on reconnect; announcements are low volume, so the drop limit is irrelevant. |
| 4 | Messages sent through the Server API are **not** delivered to post-event webhooks unless "Include Server API Messaging in post-event webhooks" is enabled, and are **not** moderated unless "Moderate messages sent by server API" is enabled. Server-sent messages are **not** echoed to the sender unless `isEchoToSender=1`. | endpoint list, message service config, sync-to-sender | Keep the webhook handler from relying on our own bot messages; set `isEchoToSender` deliberately. |
| 5 | **Metadata set/delete consume the Send-group-message quota (20/s)**; the docs warn against rapid metadata changes right after sending group messages. | rate limits (known issues) | Queue server-side metadata writes per event and coalesce (e.g. claim + owner in one call). Fine at event volumes; must be load-tested. |
| 6 | Server **message update only within 24 h** (direct/group). | modify-group, modify-private | Use metadata (not content edits) for request state — already the design. |
| 7 | Server group create: ≤30 invitees per request, default `joinPerm` = owner approval; join API ≤100 users per request; ≤10 admins per group. Client `join()` works only if "allow anyone to join". | create-group, join-group, admins | Server adds members on QR join (bypasses approval); leads ≤10 → use our own roles, not Nexconn admins. |
| 8 | System broadcasts are slow and scarce: broadcast-all **2/hour, 3/day**, delivered by **polling within 3 min**; broadcast-online also polled. | broadcast pages | Never use broadcasts for event announcements; use the crew group + attendee open channel. |
| 9 | Typing indicators: automatic only in direct channels; **group channels don't send them automatically**. | transient message format; typing page | Drop "typing" from the crew stream (it was nice-to-have). |
| 10 | Status codes: `30004` rate limit, `31004` token invalid/expired, `31010` kicked, `33007` auto-reconnect exceeded → **manual reconnect required**, `34006` invalid App Key. | Web status codes | Add explicit handling for 33007 (show "Reconnect" button) alongside 31004/31010. |
| 11 | **Chat UI for Web officially supports only Chrome/Safari/Edge and is "not tuned for portrait H5 mobile layouts"**; Web SDKs ship **only via npm** (no CDN). | Chat UI quickstart | Confirms our custom mobile-first UI on the raw Chat SDK. |
| 12 | Community channels: Web needs Community cloud retention enabled; quick-start states the Pro plan is required (Growth Credit provides Pro features). Default retention 7 days. | community quickstart/service config | Not used by Baton — no impact. |
| 13 | Pre-messaging rules can be **filtered by sender, receiver, channel type or message type**. | Chat glossary | If we use pre-messaging (Tier 2), scope it to crew text messages only, so other traffic never waits on our server. |
| 14 | Call SDK (Web): must set the local video view before placing/answering; one active call per user; no call hold; call logs via `onLocalCallLogReceived` only for 1-to-1; default capture 640×480 at 15 fps. | Call SDK pages | Reinforces keeping calls out of the MVP. |
| 15 | Mobile SDKs have features Web lacks: local message search, insert local messages, push (APNs/FCM/Huawei), local DB. | title diff across platforms | Message search is not available to us on Web; build request search on our own DB. |

---

## SECTION 4 — Historical Winner Research

### 4.1 Sample
Target was 100; **52 winning or placed projects across 12 competitions were verified** from official announcements or reputable reporting. Where only a secondary summary was available it is marked (s). We did **not** find any published Nexconn or prior Reskilll SDK-sponsor results, and Agora's RTE2020 blog page now redirects to its blog index (winners taken from a summary). We make **no claims about judges' private reasoning** beyond quoted text.

| Competition (year) | Project — award | What it is | Source |
|---|---|---|---|
| Gemini API Dev Competition (2024) | **Jayu** — Best Overall | AI assistant acting across browser, editor, games; real-time translation | Google Developers Blog |
| | **Vite Vere** — Most Impactful + People's Choice | Step-by-step visual guidance for people with cognitive disabilities | same |
| | **Outdraw AI** — Most Creative | Party game: draw what humans recognise but AI can't | same |
| | **Prospera** — Most Useful + Best Flutter | Real-time AI sales coach on live conversations | same |
| | **Gaze Link** — Best Android | Eye-tracking + sentence prediction for ALS patients | same |
| | Trippy — Best Firebase · Viddyscribe — Best Web · Pen Apple — Best Game · Everies — Best ARCore | Travel planner · auto audio-description · AI deck-builder · animated objects | same |
| Twilio × DEV (2020, 200+ entries) | **HomeBound** — COVID-19 Comms | Self-isolation app: activity tracker, chatbot, contact tracker | DEV, Twilio blog |
| | **Stream My PC** — Engaging Engagements | Social/educational screen streaming | same |
| | **Trello + Twilio** — Interesting Integrations | Customer conversations inside an existing workflow tool | same |
| | **Hypothetitech** — X-Factor | Record stories for loved ones | same |
| | 9 runners-up incl. VolunteerME, Curb Run (grocery-slot alerts), SMS Postcards for Grandparents, Teachingo, emergency-contact info, COVID help-matching | | DEV |
| DEV × Twilio AI Challenge (2024) | **HealthLingo** — Overall | Doctor–patient chat across language barriers | DEV (s) |
| | Recyclability checker · multi-channel personal finance app · AI dungeon master | category winners | DEV (s) |
| Supabase LW12 (2024) | **Whisker Jam** — Best Overall | Real-time cat rock band: host on a TV, join from phones | Supabase blog |
| | Spiceblow, SupExplain, Breaking Bad, Minecraft stats, Orora, supagen, GitHub RAG, Today I Learned, Aura | category winners/runners-up | same |
| Supabase LW5 (2022) | Supabase Cache Helpers — Best Overall · **RepoWatch** — Best Realtime · That Hot Dog Game | | Supabase blog (s) |
| Supabase Holiday Hackdays (2021) | **rtPoll** — Best Realtime | Live polls | Supabase blog (s) |
| Agora RTE2020 | **MixPose** — 1st · Transtreaming · Rogue Bots Lite · Lyricist (audience fav.) | Live yoga streaming · live transcription+translation · shooter · sheet-music sharing | Agora (s) |
| TreeHacks (2025, 1,000+ students) | **Hawkwatch** — Grand Prize ($11K) | Real-time alerts for crime/life-threatening events, dismiss or escalate to security | Stanford Daily |
| | OmNom — Most Creative · BlinkAI — Best Beginner · HiveMind — Education | | same |
| TreeHacks (2026) | **Shepherd** smart cane — Grand Prize | | Stanford Daily (s) |
| Imagine Cup (2025) | **Argus** — World Champion · HairMatch · **Signvrse** (real-time sign translation) | | Microsoft Tech Community |
| Hack Western 11 (2024) | **BravoDispatch** — 1st | Computer-aided dispatch for emergency operators | Ivey/UWO |
| Berkeley AI Hackathon | **Dispatch AI** — Grand Prize | Hand-off of non-emergency calls between operators and AI | (s) |
| ElevenLabs Global Hackathon | **Lifeline** — 3rd overall | AI emergency-call dispatcher with severity assessment | (s) |
| Axon Vietnam hackathon | **Virtual Incident Commander** — winner | Bot that joins incident channels and acts as IC | (s) |
| Stream "Build Vikings" (2022) | Chat apps with custom stickers/animations — winners | Sponsor-SDK chat build | Stream/plushcap (s) |

### 4.2 Winning Project Pattern Library (applied to a 50/30/20 rubric)
| # | Pattern observed | Evidence | Rule for us |
|---|---|---|---|
| P1 | **Named, specific user with a concrete job** beats "everyone" | Gaze Link (ALS), Vite Vere, Prospera (sales reps), BravoDispatch (operators) | Name the ICP in the first 5 seconds of the video. |
| P2 | **Time-critical coordination/dispatch is over-represented among winners** | Hawkwatch, BravoDispatch, Dispatch AI, Lifeline, Virtual IC | Real-time + consequence = instantly legible value. But: it's also where other teams will go → need a distinctive wedge. |
| P3 | **Multi-device "join from your phone" moments are memorable** | Whisker Jam (TV + phones), Outdraw, rtPoll, MixPose | Demo on 3 visible screens; let judges join with a QR. |
| P4 | **Sponsor tech is the mechanism, not decoration** | Gaze Link uses Gemini for prediction; Trello+Twilio puts comms inside a workflow | Every "wow" beat must be a Nexconn event (message, metadata update, webhook). |
| P5 | **Integrate into an existing habit** rather than demand a new one | Trello+Twilio, Prospera (on live calls) | Keep chat behaviour; add structure underneath it. |
| P6 | **Accessibility / dignity themes win "impact" prizes** | Vite Vere, Gaze Link, Argus, Signvrse, Viddyscribe | Large-tap, readable, screen-reader-friendly attendee flow is cheap credibility. |
| P7 | **Ambition helps when the core loop is finished**; complexity hurts when demo breaks | Whisker Jam is technically simple but complete | Freeze scope; polish the one loop. |
| P8 | **Playful novelty wins "creative" awards, not overall** | Outdraw, Whisker Jam (exception), Rogue Bots | Don't build a toy for a 30%-innovation, 20%-business rubric. |
| P9 | Winners demonstrate **before/after** | Hawkwatch alert vs missed incident; HealthLingo language gap | Open with the WhatsApp chaos; close with zero dropped requests. |
| P10 | Business credibility comes from **an obvious buyer** | Prospera (sales orgs), BravoDispatch (dispatch centres) | Organisers and venue ops pay; volunteers don't. |

---

## SECTION 5 — Six-Track Deep Analysis

### 5.1 Track-level matrix (1–5, higher = better for us)
| Track | Real pain | Hackathon saturation risk (5 = least saturated) | Nexconn depth possible | Feasibility by 22 Nov | 20-s demo | Business | Traction in Nov | **Total /35** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Social & Community | 3 | 2 | 4 | 5 | 4 | 3 | **5** | 26 |
| Gaming & Live | 2 | 3 | 4 | 3 | 4 | 2 | 3 | 21 |
| **Workplace & Collaboration** | **5** | 3 | **5** | 4 | **5** | **4** | 4 | **30** |
| Marketplace & Support | 4 | **1** (AI support bots everywhere) | 5 | 4 | 4 | 4 | 2 | 24 |
| Humanitarian & Social Good | 5 | 3 | 4 | 4 | 4 | 2 | 2 | 24 |
| Open Innovation | 3 | 3 | 4 | 4 | 3 | 3 | 3 | 23 |

### 5.2 Track notes
**Social & Community.** Existing: WhatsApp Communities, Discord, Telegram, Slido/Mentimeter for live events. Watch-party and interest-group chats are the organisers' own examples → heavy duplication. Under-served niche: *live audiences at physical events* (one QR scan = a real Nexconn user → excellent MAU). Best Nexconn fit: Open Channels + KV. Weakness: Slido/Mentimeter are mature (Slido Engage $17.50/mo, Professional $75/mo per Capterra), so novelty must come from the interaction.

**Gaming & Live Streams.** Existing: Discord, in-game chat, Twitch chat + extensions (Twitch runs its own extension hackathons). Real communication problems are weaker (social, not operational); building a game *and* chat in 25 days splits effort; business is creator-monetisation (hard). Interesting niche: **tournament operations** (check-ins, disputes, referee dispatch).

**Workplace & Collaboration.** Existing: Slack (+Halp ticketing via 🎫 emoji), Teams, Connecteam ($29/mo per Capterra), Beekeeper ($9/user/mo Premium), Zello ($8/user/mo PTT), event-ops suites (247 Software, teamSOS, Ticket Fairy). Generic Slack clones are the most saturated idea in the whole hackathon, *but* the frontline/temporary-crew niche is poorly served: those tools assume permanent accounts, admin onboarding and app installs, so **one-day crews default to WhatsApp groups**, which have no ownership, no status, and bury requests. Highest-value, best-demo, deepest Nexconn use (groups + metadata + webhooks + presence + targeted messages + open channel). Shift handover is an organiser example → expect some entries.

**Marketplace & Support.** "Support bot that uses AI" is literally suggested in the rules intro → **most saturated**. Under-served angle: *trust & safety inside buyer–seller chat* (off-platform payment requests, fake payment links) — a perfect fit for the pre-messaging hook. Problem: no marketplace of our own → traction requires a partner or a campus marketplace.

**Humanitarian & Social Good.** Strong pain (documented WhatsApp-based coordination in Chennai floods 2015 — volunteers split work across multiple WhatsApp groups plus a Google Sheet; "resources were often redirected to a different request"). Emotionally compelling, but **no disaster to pilot during the window** → demo feels staged, traction weak, business model (NGOs) thin. Elder check-ins: real, but competitors exist and per-family MAU is tiny.

**Open Innovation.** Catch-all; judged on the same rubric. Good for developer-tool ideas (e.g., a "stateful messages" kit) but those demo poorly to a UX-heavy rubric.

**Summary.** Strongest opportunities: Workplace (temporary frontline crews), Social (live event audiences). Most saturated: AI support bots, translated chat, Slack/Discord/WhatsApp clones, watch parties. Hardest integrations: Call SDK, community channels, pre-messaging in a 5-s budget. Best SDK showcases: message metadata + webhooks (Workplace), open channel KV (Social/Gaming), pre-messaging (Marketplace). Most realistic: Workplace and Social.

---

## SECTION 6 — Idea Portfolio (48 concepts)

Columns: **Diff** = build difficulty (L/M/H) · **Biz** = commercial potential (L/M/H) · **Sat** = likelihood other teams build something equivalent (L/M/H). Call SDK use noted where meaningful; otherwise "—".

### Social & Community
| # | Name | Problem & user | Concept & what's new | Essential Nexconn | Call SDK | Demo moment | Diff | Weakness | Biz | Sat |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | Couchsync | Remote friends watching together | Watch-party room with timestamped reactions | Open channel, KV | Voice room | Reactions burst on all screens | M | Organiser example; video sync rights | L | H |
| S2 | Kindred | Finding interest groups | AI-matched interest circles | Groups, presence | — | Match → join → chat | M | Generic social app | L | H |
| S3 | Backstage | Creators engaging fans | Tiered fan channels + live drops | Community channel, subchannels | AMA calls | Fan joins tier, sees drop | H | Discord/Patreon own it | M | H |
| S4 | Society Desk | Apartment residents' requests lost in RWA WhatsApp | Requests become trackable tickets per tower | Groups, metadata, webhooks | — | Plumbing request claimed | M | MyGate/NoBrokerHood exist | M | M |
| S5 | **Hallway** | Speakers can't use the audience backchannel | QR-join live Q&A; AI clusters duplicate questions; confusion meter | Open channel + KV, server streaming | — | 200 phones → 5 themed questions | L-M | Slido/Mentimeter mature | M | M |
| S6 | Focus Rooms | Students procrastinate alone | Presence-based co-study rooms with check-ins | Presence, groups | Optional audio | Friend goes online → nudged | L | Low value per user | L | M |
| S7 | Campus Swap | Student resale scams | Campus-verified marketplace chat | Direct, metadata | — | Offer card accepted | M | Two-sided cold start | L | M |
| S8 | Margins | Book clubs | Chapter-anchored discussion threads | Groups, metadata | — | Spoiler-gated thread | L | Niche | L | L |

### Gaming & Live Streams
| # | Name | Problem & user | Concept & what's new | Essential Nexconn | Call SDK | Demo moment | Diff | Weakness | Biz | Sat |
|---|---|---|---|---|---|---|---|---|---|---|
| G1 | Squadline | Squads coordinating in-match | Quick-chat wheel + squad chat | Groups, typing | Squad voice | Ping lands on teammates | M | Games already have it | L | H |
| G2 | Overcall | Passive spectators | Live predictions/scores overlay for cricket/esports | Open channel KV | — | Wicket → 300 predictions resolve | M | Rights/data feeds | M | M |
| G3 | Crowdplay | Viewers want agency | Audience chat commands steer a game | Open channel, custom msgs | — | Chat votes move the boss | M | Toy | L | L |
| G4 | Bracket Ops | Tournament admins drowning in Discord DMs | Check-ins, disputes, referee dispatch as claimable cards | Groups, metadata, webhooks | Ref calls | Dispute claimed by ref | M | Small market | M | L |
| G5 | Duo Finder | Finding teammates | LFG with chat → voice handoff | Direct, presence | 1:1 voice | Match → call | H | Saturated LFG apps | L | H |
| G6 | Clipcast | Moments missed in streams | Chat-spike triggered highlight markers | Open channel, webhooks | — | Chat spike → clip marker | H | Needs video infra | M | L |
| G7 | Buzzer | Live quiz nights | HQ-style trivia on open channels | Open channel KV, streaming | Host audio | 100 phones answer, leaderboard | M | Kahoot exists | M | M |
| G8 | Ludo Talk | Casual board games | Moves as custom messages in chat | Custom msgs, metadata | — | Move renders in chat | M | Toy | L | L |

### Workplace & Collaboration
| # | Name | Problem & user | Concept & what's new | Essential Nexconn | Call SDK | Demo moment | Diff | Weakness | Biz | Sat |
|---|---|---|---|---|---|---|---|---|---|---|
| W1 | Teamchat | Team DMs | Slack clone | Groups | Calls | — | M | Pure clone | L | **H** |
| W2 | **Handoff** | Info lost at shift change (nursing, security, ops) | Structured SBAR handover; incoming shift must acknowledge each item | Groups, read receipts, metadata | — | Unacked item blocks shift close | M | Regulated; pilot access hard | M | M (organiser example) |
| W3 | Warroom | On-call incidents | Alert auto-creates room, assigns roles, streams timeline summary | Groups, server streaming, webhooks | Bridge call | Alert → room assembled | M-H | incident.io/Rootly/PagerDuty | M | M |
| W4 | **Baton** | Temporary crews lose requests in WhatsApp groups | Messages become live claimable cards; attendee QR requests; named escalation | Groups, **metadata**, webhooks, targeted msgs, presence, open channel | Optional one-tap call | Attendee asks → card on all phones → claimed → attendee sees "on the way" | M | Needs pilots for traction | **M-H** | L-M |
| W5 | Standup Stream | Async standups | AI-streamed digest of team threads | Server streaming | — | Digest types itself | L | Crowded AI digest tools | M | H |
| W6 | Fieldline | Field techs ↔ dispatcher | Job cards with status in chat | Direct, metadata | Tech call | Job card status flips | M | ServiceTitan et al. | M | L |
| W7 | Wardboard | Nurse requests in wards | Patient/nurse requests as claimable tasks | Groups, metadata | — | Request claimed | M | PHI/regulatory | M | L |
| W8 | Quorum | Decisions stall in chat | Proposal cards with deadline votes | Groups, metadata | — | Vote closes, decision posted | L-M | Loomio/Slack polls | L | M |

### Marketplace & Support
| # | Name | Problem & user | Concept & what's new | Essential Nexconn | Call SDK | Demo moment | Diff | Weakness | Biz | Sat |
|---|---|---|---|---|---|---|---|---|---|---|
| M1 | Helpbot | Support volume | AI support bot + human handoff | Direct, streaming | Escalate to call | Bot → human | M | **Most common entry** | M | **H** |
| M2 | **Clearline** | Marketplace scams via chat (UPI requests, fake links, off-platform pulls) | Pre-delivery interception: warn/block/redact before the buyer sees it | **Pre-messaging hook**, direct, metadata | — | Scam message blocked with explanation | M | No marketplace to pilot on | M-H | L |
| M3 | Babel Desk | Cross-language support | Translated chat | Direct | — | Hindi ↔ English | L | Organiser example | M | **H** |
| M4 | Dispatch Desk | Agent routing | Queue + SLAs + routing | Groups, webhooks | Calls | Ticket routed | M-H | Zendesk/Freshdesk | M | M |
| M5 | Haggle | Price negotiation in chat is messy | Offer/counter/accept cards with live state | Direct, metadata | — | Offer accepted, both update | M | Feature, not product | M | L |
| M6 | Drop Room | Live shopping | Host + open channel + timed drops | Open channel KV | Host video | Drop sells out live | H | Needs inventory | M | M |
| M7 | Shoplink | Local shops take orders on WhatsApp | Web chat link with order cards | Direct, custom msgs | — | Order card confirmed | M | WhatsApp Business free | M | M |
| M8 | Viewing | Rental viewings coordination | Tenant–agent–owner group with slot cards | Groups, metadata | Video tour | Slot booked | M | Niche | M | L |

### Humanitarian & Social Good
| # | Name | Problem & user | Concept & what's new | Essential Nexconn | Call SDK | Demo moment | Diff | Weakness | Biz | Sat |
|---|---|---|---|---|---|---|---|---|---|---|
| H1 | Bigtalk | Seniors struggle with chat UIs | Large-font, voice-first chat | Direct, voice msgs | Big call button | Voice note → text | M | Organiser example; STT undocumented | L | H |
| H2 | **Okay** | Elders living alone | Daily one-tap check-in; family escalation if silent | Direct, groups, `connection_status` webhook | Auto-call | Missed check-in escalates | L-M | Snug Safety-type apps exist; small MAU | L-M | M |
| H3 | Reliefline | Disaster volunteer chaos | Requests as claimable cards for relief crews | Groups, metadata, webhooks | — | Request claimed | M | No disaster to pilot | L | M (organiser example) |
| H4 | Bloodline | Stale forwarded blood requests | Requests with live status/expiry, donor claims | Groups, metadata, open channel | Donor call | "Fulfilled" propagates to all | M | Medical sensitivity | L | L |
| H5 | Checkin | Peer-support groups | Scheduled check-ins + crisis escalation | Groups, presence | Crisis call | Missed check-in → buddy | M | Safety-critical liability | L | M |
| H6 | Signbridge | Deaf–hearing conversation | Live STT relay | Direct, streaming | Video | Speech → captions | H | Accuracy, scope | M | M |
| H7 | Surplus | Food waste | Restaurants post surplus; NGOs claim | Groups, metadata | — | Batch claimed | M | Existing apps; logistics | L | L |
| H8 | Amber | Community alerts | Verified local alerts with confirmation | Broadcast, groups | — | Alert confirmed | M | Misinformation risk | L | L |

### Open Innovation
| # | Name | Problem & user | Concept & what's new | Essential Nexconn | Call SDK | Demo moment | Diff | Weakness | Biz | Sat |
|---|---|---|---|---|---|---|---|---|---|---|
| O1 | Livecards Kit | Devs want stateful messages | Open-source kit for metadata-driven cards on Nexconn | Metadata, custom msgs | — | Same card in 3 apps | M | Dev tool demos poorly | L-M | L |
| O2 | **Raise** | Lecturers can't see confusion | Anonymous "lost me" signals + doubt queue | Open channel KV, groups | — | 60 students → spike at slide 12 | L-M | Overlaps Hallway | M | M |
| O3 | Mentor Queue | Hackathon participants wait for mentors | Help requests claimed by mentors | Groups, metadata | Mentor call | Request claimed | L-M | Subset of Baton | L | M |
| O4 | Tripboard | Group trip decisions | Decision cards + split | Groups, metadata | — | Vote → itinerary | M | Splitwise/WhatsApp | L | H |
| O5 | Pairroom | Interviews | Chat + code + call | Direct | Video | Live interview | H | CoderPad | M | M |
| O6 | Copilot-in-group | Teams want AI in chat | AI agent participant with streaming | Streaming, webhooks | — | @ai summarises | M | Everyone builds this | M | **H** |
| O7 | Approvals | SMB approvals in WhatsApp | Approve/reject cards | Direct, metadata | — | Card approved | L | Thin | M | M |
| O8 | Crewtalk | Crews prefer voice | Async push-to-talk with transcripts | Voice msgs, STT | PTT | Voice → text card | H | Zello; STT undocumented | M | L |

**Clone filter applied:** W1, M1, M3, O6, S1, S2, G1, G5, H1 are effectively familiar patterns (clone/organiser example/AI wrapper) and were not shortlisted unless a genuinely new workflow emerged.

---

## SECTION 7 — Finalist Rankings

### 7.1 Top 15 (shortlist)
W4 Baton · S5 Hallway · M2 Clearline · W2 Handoff · H2 Okay · O2 Raise · G4 Bracket Ops · S4 Society Desk · M5 Haggle · G7 Buzzer · H4 Bloodline · W3 Warroom · G2 Overcall · H3 Reliefline · O3 Mentor Queue.

**Merged:** H3 Reliefline and O3 Mentor Queue are verticals of the Baton mechanism → folded into Baton's expansion story. O2 Raise overlaps Hallway → Hallway kept (bigger audience, better traction).
**Eliminated from 15 → 5 and why:**
- G4 Bracket Ops, S4 Society Desk, M5 Haggle — good mechanics, smaller/slower markets; they're Baton's mechanism with weaker pilots.
- G7 Buzzer, G2 Overcall — fun, but entertainment (P8) and data-rights risk for G2.
- H4 Bloodline — medical sensitivity; can't ethically fake urgency in a demo; pilots slow.
- W3 Warroom — crowded paid market (incident.io, Rootly, PagerDuty), hard to show real traction.

### 7.2 Final five — estimated judge scores (ours, not the organisers')
| Project | Track | UX /50 | Innovation /30 | Business /20 | **Total** | Major risk | Verdict |
|---|---|---:|---:|---:|---:|---|---|
| **Baton** | Workplace | 42 | 25 | 17 | **84** | Metadata/webhook round-trip; pilot access | **Winner** |
| **Hallway** | Social | 44 | 19 | 16 | **79** | "Slido clone" perception | Backup #1 |
| **Clearline** | Marketplace | 40 | 24 | 13 | **77** | No traction path; pre-messaging plan gating | Backup #2 |
| Handoff | Workplace | 41 | 21 | 13 | 75 | Regulated users, organiser example | Out |
| Okay | Humanitarian | 43 | 18 | 12 | 73 | Low novelty, tiny MAU per family | Out |

**Justification of key scores.**
- *UX:* Hallway is the simplest loop (join → ask → upvote) → highest completeness odds (44). Baton has three roles (ops, crew, attendee) → more surface to polish (42) but each role has one primary action. Clearline needs a believable marketplace shell (40).
- *Innovation:* Baton combines an evidence-backed insight (bystander effect + temporary crews) with a platform-native mechanism (message-as-live-object); 25. Clearline's pre-delivery interception is equally novel technically but the scenario is narrower to demo; 24. Hallway's AI clustering is incremental over Slido; 19.
- *Business:* Baton has a clear buyer (organisers/venues), comparable paid tools ($8–29/user/mo) and a realistic November pilot channel (fests, DevFests, meetups, hackathons) → 17. Hallway has the best traction mechanics but a commoditised market → 16. Clearline needs B2B marketplace sales → 13.

### 7.3 Risk register for the top three
| Risk | Baton | Hallway | Clearline |
|---|---|---|---|
| SDK integration | M (metadata events, webhooks) | L (open channel + KV) | M-H (pre-messaging, 5-s budget) |
| Time-to-build | M | L | M |
| Dependency (LLM etc.) | L (AI optional) | M (AI clustering central) | M (classifier central) |
| Demo failure | M (3 devices) | L | M |
| Saturation | L-M | M | L |
| Data availability | Pilot data | Pilot data | Needs realistic scam corpus |
| Regulatory | L (avoid medical claims) | L | M (payments/fraud claims) |
| Operational complexity | M (escalation worker) | L | M |
| Requirement ambiguity | L | L | L |
| Incomplete submission | M | L | M |

---

## SECTION 8 — Five-Judge Adversarial Review (top three)

### Judge 1 — Product & UX
- **Baton:** Strong if each role has exactly one primary action (Crew: "I'll take it"; Attendee: "What do you need?"; Ops: watch the board). Danger: three apps-in-one feel. Requires a judge-solo "Try a live demo" that opens three linked views. Onboarding by QR in <15 s is a real UX advantage. **7.5/10**
- **Hallway:** Cleanest loop; very hard to break. Speaker view must be beautiful. **8.5/10**
- **Clearline:** Marketplace shell is filler judges will scrutinise; the interception moment is great. **7/10**

### Judge 2 — Innovation
- **Baton:** The "message becomes a live, owned object" interaction is new for chat apps; named escalation grounded in research is a genuine insight, not a feature list. Risk: judges map it to "Trello in chat" unless the demo shows *zero* forms. **8.5/10**
- **Hallway:** Clustering + confusion meter is incremental over Slido/Mentimeter. **6/10**
- **Clearline:** Using the pre-delivery hook as a trust layer is the most technically surprising use of Nexconn. **8/10**

### Judge 3 — Business
- **Baton:** Clear payer (organisers, venues, NGOs), proven willingness to pay in adjacent tools, natural expansion (venues → campus security → relief). Unit economics depend on attendee MAU (§16.6). Traction contingent on pilots. **7.5/10**
- **Hallway:** Easy MAU; crowded, cheap market. **6.5/10**
- **Clearline:** Strong B2B pain but long sales cycle; no pilot in 25 days. **5.5/10**

### Judge 4 — Technical Architecture
- **Baton:** Correct pattern: authoritative state in Postgres, Nexconn metadata as the real-time projection, server-arbitrated claims (no double-claims), idempotent webhooks, reconciliation. Needs a long-running process for escalations. Moderate complexity, well-understood. **8/10**
- **Hallway:** Trivial architecture; AI clustering latency is the only risk. **8.5/10**
- **Clearline:** The 5-s synchronous budget with an LLM in the path is fragile; fail-open means scams leak during outages. **6.5/10**

### Judge 5 — Hostile Skeptic (Baton)
| Attack | Answer | Residual risk |
|---|---|---|
| "Why not WhatsApp + a Google Sheet?" | That's exactly what crews do today — two tools, manual copying, no live status; the Chennai flood volunteers needed three WhatsApp groups plus a sheet. Baton collapses it into the chat they already type in. | Must *show* the side-by-side in the video. |
| "Why not Slack + Halp?" | Requires accounts, workspace invites, app install and training — impossible for a crew that exists for one day; attendees can't participate at all. | Slack could add it; we win on zero-install temporary crews. |
| "Another team can build this." | The organisers literally list "volunteer dispatch rooms" and "shift handover". Ours is distinguished by (1) structure inferred from free text in place, (2) state on the message object, (3) attendee-side requests with live status, (4) named escalation. | Medium — execution quality is the moat in a hackathon. |
| "Is Nexconn essential?" | Remove it and you lose: real-time delivery to 300 phones, offline catch-up, live per-message state sync, targeted escalation messages, presence, the attendee live board. We'd have to rebuild a messaging backend. | Low. |
| "Is the AI fake?" | AI only *suggests* structure; claiming works without AI; every AI field is editable; card shows "Auto-detected" label. | Low. |
| "What if the network drops?" | SDK auto-reconnects every 5 s; missed messages delivered on reconnect; our UI shows a connection banner and re-fetches open requests from our API on reconnect. | Low-medium; tested in matrix. |
| "Refresh mid-claim?" | Claim is a server transaction; state is re-hydrated from API + history; metadata reflects truth. | Low. |
| "Two people tap claim at once?" | Postgres conditional update; loser sees "Riya took this 0.3 s earlier". | Low. |
| "Business numbers invented?" | We present only sourced comparables and our own measured pilot data; every assumption is labelled. | — |
| "Is it functional beyond the demo?" | Judges can create their own event and invite themselves via QR from two devices. | Must be true on 23 Nov. |

**Final selection review.** Hallway wins on safety, Clearline on technical surprise, **Baton on the weighted total**: it is the only candidate strong on all three criteria at once, and its weakest point (traction) is addressable with work we control (pilots), whereas Hallway's weakest point (novelty) and Clearline's (traction) are structural. No forced consensus: Judge 1 and Judge 4 would pick Hallway as the "lowest-risk" entry — accepted by keeping Hallway as the explicit fallback if Stage A fails (§14).

**Why Baton beats both alternatives.** vs Hallway: +6 innovation points for a non-commoditised mechanism; comparable traction potential (crew + attendees). vs Clearline: realistic pilots in November and a far more demonstrable end-to-end product, without putting an LLM in a synchronous 5-s path.

---

## SECTION 9 — Final Project Blueprint: **Baton**

### 9.1 Identity
- **Name:** Baton *(working name — run a trademark/domain check; several unrelated companies use "Baton")*
- **One-liner:** *The group chat where every request gets an owner.*
- **Track:** Workplace & Collaboration
- **Problem statement:** Event and frontline crews are assembled for days, not years. They coordinate in WhatsApp groups because nothing else can be set up in minutes. In a busy group, requests scroll away, nobody knows if anyone is handling them, and the more people are in the group the less likely any one person responds — the online bystander effect (Markey, 2000: help in chat groups slowed as group size grew; naming a specific person "virtually eliminated" the effect).
- **Target audience (ICP):** Student/volunteer organising teams of college fests, GDG DevFests, meetups, hackathons and small conferences (20–300 crew; 200–5,000 attendees), in India first. Buyer: the event lead/ops head. Users: volunteers (mobile web), attendees (QR).
- **Core differentiator:** Structure emerges from normal messages; the state of each request lives on the message itself, live on every device; escalation goes to a named person.
- **UVP:** "Set up your crew's coordination channel in 2 minutes with a QR code. Every request gets an owner, every attendee sees who's coming, and nothing falls through."
- **Vision:** The coordination layer for any temporary team — events, venues, campus security, disaster-relief volunteers.
- **Primary journey:** Lead creates event → prints crew QR + attendee QR → volunteers join in 10 s → requests arrive (from crew chat or attendees) → claimed → resolved → post-event report.

### 9.2 The extraordinary moment (fully real)
1. **Situation:** Three screens visible: the ops lead's laptop board, a volunteer's phone, an attendee's phone. The crew stream shows normal chatter.
2. **Objective:** An attendee needs help *now*.
3. **Trigger:** The attendee scans the venue QR (no app, no sign-up) and types "water dispenser in Hall B is empty and there's a long queue".
4. **Real-time interaction:** Within ~1–2 s, a card appears on every crew phone and the board: **Supplies · Hall B · Water · Normal priority — "I'll take it"**. The volunteer taps. Instantly the card on *every* device flips to **Claimed by Riya · 0:04**, and the attendee's screen updates: **"Riya from the crew is on it — claimed 4 s after you asked."**
5. **Nexconn's role:** attendee → desk bot direct message; `message:send` webhook to our server; server posts a request card into the crew group (custom message with metadata); claim → server sets message metadata → `onMessageMetadataUpdated` on all clients; server sends a status message into the attendee's direct channel.
6. **Result:** Resolved in minutes, owner known, attendee reassured, ops lead sees response time.
7. **Second beat (10 s):** A volunteer types in the crew chat "need 2 more people at gate 3 now" — the *same message bubble* gains a claim bar seconds later (AI detected a request). Nobody takes it; after the configured window (60 s in demo) Baton sends a **targeted** nudge only to the named zone lead ("Arjun, Gate 3 request unclaimed for 60 s") — show the group's other phones stay quiet.
8. **Why superior:** In WhatsApp the attendee has no channel at all, and the volunteer message would have been one bubble among hundreds with no owner and no follow-up.

### 9.3 Feature tiers
**Tier 1 — mandatory (the demo and the product depend on these)**
1. Organiser sign-in; create event (name, dates, zones); crew QR/invite link; attendee QR.
2. Crew join via QR: name + zone + on-duty toggle → guest identity → Nexconn token → connect.
3. Crew stream (group channel): text, images, mentions, history, unread, typing, connection banner.
4. Request cards: (a) "New request" composer (title, zone, priority) — **no AI dependency**; (b) attendee requests from the desk.
5. Claim / release / resolve with server arbitration and live metadata state on every device.
6. Attendee help page: free text + quick chips, live status stream from the crew, "resolved" confirmation, optional rating.
7. Ops board (desktop): Open / Claimed / Resolved columns, ages, owners, crew roster with presence.
8. Named escalation for unclaimed requests (per-priority timers) via targeted group message + mention.
9. Reliability basics: reconnect handling, idempotent webhooks, reconciliation, clear errors.
10. **Judge-solo demo sandbox:** one click creates a private event and gives three labelled links (Ops / Crew / Attendee) to open in tabs or on phones.
11. **Background alerts for crew (added after the full docs pass, §3.10 #1):** installable PWA + our own Web Push (service worker, VAPID keys) for urgent requests and named escalations, because the Nexconn Web SDK delivers nothing while the tab is closed or the phone is locked; Screen Wake Lock while on duty; "Add to Home Screen" prompt on iOS.

**Tier 2 — differentiators (build after Tier 1 is solid)**
1. **AI request detection in place**: crew free-text messages classified asynchronously; detected requests gain a claim bar + extracted fields, marked "auto-detected", editable/dismissable.
2. Pre-messaging fast path (if enabled on our plan): instant deterministic tagging (urgent keywords) before delivery; AI refines after.
3. Attendee live board (open channel): announcements + KV status (e.g., "Registration queue: short"), participant count.
4. Post-event report: requests, median time-to-claim, time-to-resolve, unclaimed incidents — **from real data only**.
5. Streaming shift briefing: server streams an AI summary of open items into the crew channel at handover.
6. Accessibility mode for attendee page (large text, high contrast).

**Tier 3 — roadmap (do not build before submission)**
Call SDK one-tap "call requester/lead" · native apps & push · multi-event orgs and billing · zones as separate group channels · radio/PTT voice notes with transcription · SSO · analytics exports · offline-first PWA · multilingual attendee UI (translation module once documented) · integrations (Google Sheets export, WhatsApp bridge).

**Call SDK decision:** excluded from MVP. It needs a credit card, Console enablement, media permissions and a full incoming/outgoing lifecycle test across devices — high demo-failure risk for little added value over a `tel:` link. Revisit only if Tier 2 is done by 16 Nov.

### 9.4 User journeys
**A. Organiser (Ops lead), first visit**
1. Landing → "Create an event" (or "Try a live demo").
2. Sign in (Google OAuth; email magic link optional).
3. Wizard: event name, date, venue zones (chips: Registration, Hall A, Food court…), escalation timers (defaults pre-filled).
4. Done screen: crew QR + link, attendee QR + printable poster PDF, "Open board".
5. Board: empty state explains "Requests will appear here. Ask a volunteer to scan the crew QR."
6. During event: watches board; reassigns or resolves; posts announcements.
7. After: report page. Return visit: event list; duplicate last event as template.

**B. Volunteer**
1. Scans crew QR → `/join/{code}` → name, zone, on-duty → enters crew stream (≤15 s).
2. Sees stream; request cards stand out; taps "I'll take it" → card shows "You · 0:00"; card pinned in "My tasks".
3. Chats in the card's thread with the requester (attendee messages relayed by the desk).
4. "Done" → optional note → card collapses to resolved on all devices.
5. Refresh/return: session cookie restores identity; history re-fetched.
6. Kicked by another device (code 31010) → "You opened Baton on another device" with "Use here" button.

**C. Attendee**
1. Scans venue QR → `/e/{slug}/help` → "What do you need?" + chips (Water/Supplies, Lost & found, Directions, Medical*, Other) + zone selector (pre-filled from QR location if the poster encodes it).
2. Sends → status timeline: Sent → Seen by crew → **Riya is on it** → Resolved. Can add details/photo.
3. Leaves the page → returns later via the same link (cookie) → status preserved.
*Medical chip always shows "For emergencies call 112" first — Baton is not an emergency service.

**D. Error & recovery states** — connection lost banner with countdown; send failure with retry; claim conflict ("Already taken by Riya"); request withdrawn by attendee; token expired → silent re-issue; event ended → read-only.

### 9.5 Competitive teardown
| Alternative | Does well | Lacks for temporary crews | Baton is better at | Hard to defend |
|---|---|---|---|---|
| WhatsApp groups (+ Sheets) | Zero training, everyone has it | No ownership/status, phone numbers exposed, requests scroll away, attendees excluded | Ownership, status, attendee side, escalation | WhatsApp is free and universal |
| Slack + Halp (🎫 ticketing) | Tickets from messages, assignment | Accounts, workspace invites, install; no public/attendee side | Zero-install, QR onboarding, attendee requests | Slack could ship similar |
| Zello (PTT, ~$8/user/mo) | Radio-like voice, dispatch queue | Voice-first, no structured ownership in text | Structured cards, async, searchable | Voice is faster in loud venues |
| Connecteam / Beekeeper | Shift scheduling, comms for permanent staff | Heavy onboarding, per-seat pricing for long-term staff | Day-one setup for one-off crews | They could add "event mode" |
| 247 Software, teamSOS, Ticket Fairy event OS | Incident logging, radio replacement | Enterprise/festival focus, not for student/volunteer crews; no in-chat claiming | Price, simplicity, chat-native | Mature compliance features |
| Whova / event apps | Attendee engagement | Crew coordination is not the job | Crew-first ops | Bundled with ticketing |

**Genuinely new:** request structure inferred *inside* the chat stream; ownership state on the message object synced live; attendee → crew → attendee loop with live status without an app; named escalation by design. **Implementation choices (not moats):** web stack, LLM vendor, Postgres.

---

## SECTION 10 — Nexconn Integration Strategy

| Feature | Why required | SDK / API (verified) | Docs | Implementation | Test |
|---|---|---|---|---|---|
| Token issuance | Every role connects as a distinct user | `POST /v4/auth/access-token/issue` | platform-chat-api/user/register | `/api/nexconn/token` checks our session, issues/caches token; random non-sequential user IDs (`u_…`, `g_…` for guests) | Unit + E2E: new user connects; App Secret absent from client bundle |
| Init/connect + status | Real-time transport | `NCEngine.initialize`, `connect`, `ConnectionStatusHandler` | chatsdk-web/init, connect, reconnect-kick | Singleton `NexconnProvider` (React context); register handlers → connect once | Kill network 30 s → banner → recovers |
| Crew channel | Shared stream | `GroupChannel`; server create group + add members | group-channel/*; create-group | Server creates group on event creation; adds member on join | Join → appears in member list; history loads |
| Request card message | The live object | `registerCustomMessages([{messageType:'BTN:Request', isPersited:true, isCounted:true}])`; `SendMessageParams` with `metadata` | message/customize | Server sends attendee-originated cards via `POST /v4/group-channel/message/send` with `hasMetadata:true, metadata:{…}` [V]; crew composer sends via client; metadata keys: `st` (open/claimed/done/withdrawn), `own`, `ownN`, `ca`, `ra`, `pri`, `v` (version) | Card renders identically on 3 clients |
| Live state | Claim/resolve visible everywhere | Server `/v4/channel-type/message/metadata/set` (`isEchoToSender:1`); client `onMessageMetadataUpdated` | message/set-expansion | Server is the only writer of `st/own/v`; clients render from metadata, fall back to API | Concurrent claim test; out-of-order updates resolved by `v` |
| Free-text crew messages | AI detection base | `SendTextMessageParams` + `metadata:{b:'1'}` (enables later server metadata) | message/send | Every crew message sent with initial metadata | Server can annotate a client message |
| `message:send` webhook | Server learns of every message | Console Webhooks → `message:send` | webhook/message/send | Verify signature + timestamp; dedupe by `id`; enqueue classification; for desk DMs create request | Replay same event 3× → one request |
| Pre-messaging (Tier 2) | Instant tagging before delivery | `group_channel:pre_messaging` → `{pass:1, replaceMetadata}` | webhook/message/pre-messaging | Deterministic classifier only (<100 ms); **never** call an LLM synchronously; return `pass:1` on any error | Hook down → messages still delivered |
| Attendee desk | Attendee ↔ crew loop | `DirectChannel(deskBotId)`; server send-private as desk bot | message/send-private | Attendee messages to desk bot → webhook → request; crew replies relayed into attendee DM by server | Attendee sees status within 2 s |
| Status timeline to attendee | Reassurance | Custom `BTN:Status` messages + metadata on the attendee's card | customize, set-expansion | Server posts on claim/resolve | Refresh keeps timeline (history) |
| Named escalation | Bystander-effect fix | Server group message with `toUserIds:[leadId]` (targeted) + `mentionedInfo` | group-channel/direct, groupat | Escalation worker: unclaimed past threshold → nudge on-duty zone lead → then event lead. `POST /v4/group-channel/message/send` with `toUserIds` (targeted messages **cannot** carry metadata — fine for nudges); group send limit 20 msg/s [V] | Others don't receive; lead does |
| Presence / on-duty | Route to people actually online | `userModule.subscribeEvent(ONLINE_STATUS)`; `user:connection_status` webhook | user/subscribe_online; webhook/user | Escalation picks on-duty + online lead | Close tab → offline within SLA |
| Attendee live board (Tier 2) | Announcements to everyone | `OpenChannel` + `setMetadata` (KV) + `onParticipantChanged` | open-channel/* | Server writes KV; attendees read-only | 3 viewers see KV change |
| AI shift brief (Tier 2) | Handover summary | Server `/v4/group-channel/message/stream/send` (`RC:StreamMsg`) | send-group-stream | Stream LLM output chunks (`seq` +1) | Streams on all clients; persists |
| Read receipts | "Seen by crew" for attendee | `needReceipt`, `sendReadReceiptResponse` | message/read-receipt | Desk relay marks seen when first crew member opens card | Attendee sees "Seen" |

**Domain allowlist:** enable "Domain allowlist for Web clients" in the Console so our App Key can't be used from other origins (protects our MAU numbers and quota). [V: feature listed in plan comparison]

---

## SECTION 11 — Architecture

### 11.1 Stack (chosen for reliability, not novelty)
| Layer | Choice | Why |
|---|---|---|
| Client | Next.js (App Router) + React + TypeScript, Tailwind CSS, Radix primitives | Fast, typed, mobile-web; no app store |
| Realtime | `@nexconn/engine` + `@nexconn/chat` 26.2.1 (pinned) | Required; covers all realtime needs |
| Server | Same Next.js app running as a **long-running Node server** (Railway / Render / Fly) — not serverless | Webhooks must answer in <5 s reliably; escalation worker needs a persistent loop |
| DB | Postgres (Neon or Supabase) + Drizzle ORM | Transactions for claim arbitration; audit log |
| Auth | Auth.js (Google OAuth) for organisers; signed HTTP-only cookie identities for crew/guests | Minimal friction for temporary users |
| AI (Tier 2) | Anthropic API, `claude-opus-5-5` at `effort: "low"` with structured output for extraction, async only; `claude-haiku-5-5` is the cheaper/faster option if you choose to trade quality for cost | Off the critical path; failures degrade gracefully |
| Monitoring | Sentry (errors), UptimeRobot/Better Stack (uptime) | Judging-week uptime |
| Not used | Chat UI (no metadata support), Call SDK (risk), Redis/queues (Postgres is enough), Nexconn Node Server SDK v0.1.2 (young; hand-rolled signed client instead) | Fewer moving parts |

### 11.2 Diagram
```
 Attendee phone (QR)      Volunteer phones          Ops lead laptop
   /e/{slug}/help         /c/{event}/stream          /o/{event}/board
        │  Nexconn Web SDK (token)  │                        │
        └──────────────┬────────────┴────────────┬───────────┘
                       │ WebSocket (SDK)          │ HTTPS (our API: claim, resolve,
                       ▼                          ▼  create event, token)
             ┌──────────────────┐        ┌───────────────────────────────┐
             │  Nexconn Chat     │◀──────│  Baton server (Next.js, Node) │
             │  (group, direct,  │ Server│  • token issuer (App Secret)  │
             │   open channels,  │  API  │  • claim/resolve transactions │
             │   metadata, KV)   │ signed│  • webhook receiver           │
             └────────┬─────────┘        │  • escalation worker (10 s)   │
                      │ webhooks          │  • reconciliation (60 s)      │
                      │ message:send,     │  • AI enrichment (async)      │
                      │ pre_messaging,    └───────┬───────────────┬───────┘
                      │ connection_status         │               │
                      └──────────────────────────▶│          Anthropic API
                                                  ▼            (Tier 2)
                                             Postgres
```
**Trust boundaries:** browsers hold only App Key + their own token; App Secret, Anthropic key and DB credentials exist only on the server; webhooks are untrusted input until signature + freshness + dedupe pass.

### 11.3 Core data flows
1. **Join:** `/join/{code}` → POST `/api/crew/join` (name, zone) → create `member`, add to Nexconn group (server API) → issue token → client connects.
2. **Attendee request:** attendee DM to `desk_{event}` → `message:send` webhook → insert `request` (source=attendee) → server sends `BTN:Request` to crew group with metadata `st=open` → store returned `messageId` → server posts `BTN:Status` "Sent to crew" to attendee.
3. **Claim:** POST `/api/requests/{id}/claim {expectedVersion}` → `UPDATE requests SET status='claimed', owner=$u, version=version+1 WHERE id=$id AND status='open' RETURNING *` → if 0 rows → 409 with current owner → else set Nexconn metadata (`st, own, ownN, ca, v`) → status message to attendee → audit row. Client shows optimistic "Claiming…" ≤300 ms then reconciles.
4. **Crew free-text → request (Tier 2):** client sends text with `metadata:{b:'1'}` → webhook → classifier (LLM, 3 s timeout) → if `isRequest` with confidence ≥ threshold → insert request linked to the original `messageId` → set metadata `kind=req, st=open, title, zone, pri, ai=1` → clients re-render that bubble as a card.
5. **Escalation:** worker every 10 s: `SELECT … WHERE status='open' AND next_escalation_at <= now() FOR UPDATE SKIP LOCKED` → pick on-duty, online zone lead → targeted group message → bump `escalation_level`, schedule next → audit.
6. **Reconciliation:** every 60 s and on client reconnect, compare open requests' DB state with metadata; re-push metadata if a set failed.

### 11.4 Data model (Postgres)
| Table | Key columns | Notes |
|---|---|---|
| `organizers` | id, email, name | Auth.js |
| `events` | id, slug, name, starts_at, ends_at, status, crew_join_code, nexconn_group_id, open_channel_id, desk_bot_user_id, settings(json: timers) | |
| `zones` | id, event_id, name, lead_member_id | |
| `members` | id, event_id, role (lead/volunteer), display_name, zone_id, on_duty, nexconn_user_id, created_at | Guest identity via signed cookie |
| `attendees` | id, event_id, nexconn_user_id, display_name?, created_at | No PII required |
| `requests` | id, event_id, source (crew/attendee/composer), origin_message_id, card_message_id, attendee_id?, title, details, zone_id, priority, status, owner_member_id, created_at, claimed_at, resolved_at, escalation_level, next_escalation_at, ai_detected bool, ai_confidence, **version** | Authoritative state |
| `request_events` | id, request_id, actor, type, payload, at | Audit trail & report |
| `webhook_events` | event_id (PK), type, received_at, processed_at | Idempotency |
| `nexconn_tokens` | nexconn_user_id (PK), token (encrypted), issued_at | Re-use tokens |
| `traction_log` | event_id, real_user flag counts per day | Honest traction reporting (separates test vs pilot users) |

**Stored in Nexconn, not duplicated:** message bodies & history (we keep only request-relevant text), group membership (mirrored minimally), metadata (projection of `requests`). **Retention:** delete attendee records and request details 30 days after event end (configurable); Nexconn history retention per plan.

### 11.5 Authentication & authorisation
- Organisers: Auth.js session. Crew/attendees: HMAC-signed, HTTP-only, SameSite=Lax cookie containing member/attendee id + event id (no passwords; possession of the event QR is the credential — appropriate for temporary crews; leads can revoke members).
- Nexconn identity = our generated `nexconn_user_id` (random, ≤64 bytes, letters/digits only per API rules).
- Every API route checks role + event membership. Claim/resolve only by crew of that event; reassign only by leads.
- Tokens: issued server-side, returned once per session, cached in memory on client; on connect error codes indicating invalid token → call `/api/nexconn/token?refresh=1`.
- Lead can rotate the crew join code (kills old QR).

### 11.6 Reliability plan
| Failure | Handling | User sees |
|---|---|---|
| Missing env/credentials | Boot-time config validation; `/api/health` reports which | Organiser banner "Server misconfigured" (never silent) |
| Invalid/expired token | Re-issue once; then sign-out flow | "Reconnecting…" then prompt |
| Connection drop | SDK auto-reconnect; our banner with status; on reconnect re-fetch open requests from API | Amber banner "Offline — reconnecting" |
| Kicked (31010) | Stop, show "Opened elsewhere" with "Use here" | Modal |
| Duplicate webhook | `webhook_events` PK insert-or-ignore | — |
| Lost webhook (after 3 failures) | Reconciliation compares group history (server-side poll of recent messages if available) / client "report" fallback: client posts new desk messages to `/api/desk/ingest` as a backup path | Requests still appear |
| Metadata set fails | Retry with backoff; reconciliation; clients poll `/api/requests?event` on reconnect | Card may lag ≤60 s |
| Concurrent claims | DB conditional update | "Already taken by Riya" |
| Browser refresh / multiple tabs | Identity cookie; Web allows 10 connections per user; UI state from API + history | Seamless |
| Backend down | Chat still works (SDK direct to Nexconn); claim buttons disabled with "Server unavailable" | Explicit |
| AI timeout/error | Message stays plain text; manual "Make this a request" action | No AI badge |
| Pre-messaging hook slow | Always respond `pass:1` within 1 s; Nexconn fails open anyway | — |
| PCC/MAU limit hit | Detect connection error codes; show "Event is at capacity" | Explicit |
| Deployment misconfig | Smoke test script post-deploy (token → connect → send → receive → claim) | — |

### 11.7 Security
- App Secret, Anthropic key, DB URL, cookie secret: server env only; `.env.example` in repo; gitleaks pre-push; no secrets in logs.
- **App Key is not a secret** — it ships in the client bundle by design and is required in the submission; the **App Secret** and Console Access Keys are secrets. [V]
- Webhook: verify `sha1(AppSecret+Nonce+Timestamp)`, reject |now − Timestamp| > 5 min, dedupe `id`, HTTPS, optional source-IP allowlist (Nexconn publishes IPs); treat payload as untrusted (validate with Zod).
- Input validation (Zod) on every route; rate limit join/request endpoints per IP/cookie; max request length; image upload limits.
- Abuse: leads can mute/remove members (server API mute/kick); attendee requests rate-limited; profanity filter enabled in Console (free).
- Privacy: attendees anonymous by default; no phone numbers (a stated advantage over WhatsApp); data deletion after event; privacy page.
- Public repo safety: seed data contains no real people; demo sandbox uses obviously fictional names.

### 11.8 Third-party dependencies
| Dependency | Necessity | Cost | Failure mode | Fallback |
|---|---|---|---|---|
| Nexconn Chat | Required | Growth Credit (free ≤10K MAU, 1 yr) | Outage | Banner; API-driven board still reads DB |
| Hosting (Railway/Render/Fly) | Required | Hobby tier (verify current pricing) | Sleep/outage | Paid always-on instance during 20–27 Nov; second region not needed |
| Postgres (Neon/Supabase) | Required | Free tier | Outage | Daily backup; retry |
| Google OAuth | Organiser login | Free | Misconfig | Magic link / demo sandbox needs no login |
| Anthropic API | Tier 2 only | Pay-as-you-go (Opus 5.5: $4/$20 per MTok; Haiku 5.5: $0.10/$0.50) | Timeout | Manual request creation |
| Sentry, uptime monitor | Ops | Free tiers | — | — |

---

## SECTION 12 — UI/UX Blueprint

### 12.1 Visual direction — "calm operations"
- **Feel:** a control room that never shouts until it must. Neutral surfaces, generous whitespace, one brand accent, and **status colour reserved for state** so urgency reads instantly.
- **Type:** Inter or Geist; tabular numerals for timers; 15–16 px body on mobile; attendee page 18 px base.
- **Colour tokens:** neutral 50–950 greys; accent (deep indigo) for brand/actions; semantic: Open = amber, Claimed = blue, Done = green, Urgent = red, Offline = slate. Light and dark themes; all pairs ≥ 4.5:1 contrast.
- **Shape & depth:** 10–12 px radius cards, 1 px borders, no glassmorphism, no decorative gradients, shadows only on floating elements.
- **Motion:** 150–200 ms ease-out; the *only* expressive animation is the claim flip (card border colour + owner chip slide-in) — that is the product's signature. Respect `prefers-reduced-motion`.
- **Icons:** Lucide, 1.5 px stroke.

### 12.2 Information architecture & navigation
```
Public:   /  ·  /demo  ·  /privacy
Organiser (desktop-first):  /events  ·  /events/new  ·  /o/{event}/board  ·  /o/{event}/crew  ·  /o/{event}/announce  ·  /o/{event}/report  ·  /o/{event}/settings
Crew (mobile-first):        /join/{code}  ·  /c/{event} (Stream | My tasks | Crew)  ·  /c/{event}/r/{id}
Attendee (mobile, no login): /e/{slug}/help  ·  /e/{slug}/help/{requestId}  ·  /e/{slug}/live
```
Crew app = bottom tab bar (Stream · My tasks · Crew). Organiser = left rail (Board · Crew · Announcements · Report · Settings). Attendee = single-purpose pages, no navigation chrome.

### 12.3 Screen inventory
| # | Screen | Purpose | Key states |
|---|---|---|---|
| 1 | Landing | Explain in one sentence + 12-s looping product clip; "Try a live demo" / "Create an event" | — |
| 2 | Demo sandbox | One click → private event with 3 labelled links + QR codes, "Simulated teammate" toggle (clearly labelled) | creating, ready |
| 3 | Sign-in | Google OAuth | error |
| 4 | Event list | Organiser's events | empty: "Create your first event" |
| 5 | New event wizard (3 steps) | Name/date → zones → timers | validation |
| 6 | Event ready | Crew QR, attendee QR, printable posters | — |
| 7 | **Ops board** | Columns Open/Claimed/Done; age timers; filters by zone/priority; crew roster with presence; live activity feed | empty, live, offline, ended |
| 8 | Request drawer (ops) | Timeline, reassign, resolve, notes | conflict |
| 9 | Crew roster | Members, zone, on-duty, online; remove/mute | — |
| 10 | Announcements | Compose → attendee live board + crew stream | sending, sent |
| 11 | Report | Real counts and medians; export CSV | no data |
| 12 | Settings | Zones, timers, rotate join code, end event | — |
| 13 | Join (crew) | Name, zone, on-duty | invalid/rotated code |
| 14 | **Crew stream** | Chat + inline request cards + composer with "+ Request" | connecting, offline, kicked |
| 15 | My tasks | Claimed by me, oldest first | empty |
| 16 | Request thread | Card + thread with requester | done |
| 17 | **Attendee help** | "What do you need?", chips, zone, send | sending, rate-limited |
| 18 | Attendee status | Timeline: Sent → Seen → Riya is on it → Resolved; add detail; rate | withdrawn, event ended |
| 19 | Attendee live board | Announcements + status KV | connecting |
| 20 | Errors | 404 event, capacity reached, server misconfigured | — |

### 12.4 Real-time interaction states (request card)
`open` (amber edge, age ticking, "I'll take it") → `claiming` (button spinner ≤300 ms, optimistic) → `claimed` (blue, owner avatar + "0:12 ago", owner sees "Mark done"/"Release") → `done` (collapses to one line, green tick) · `conflict` (toast "Riya took it first") · `escalated` (red "Unclaimed 2:00 — Arjun notified") · `withdrawn` (struck through) · `stale` (no connection: grey overlay "Reconnecting — showing last known state").

### 12.5 Loading, empty, error
- Skeletons for stream and board (never blank). Connection banner tied to `ConnectionStatusHandler`.
- Empty states teach the next action (board: "Share the crew QR"; My tasks: "Claimed requests show up here").
- Errors are specific and actionable, never codes alone ("Couldn't claim — you're offline. We'll retry when you reconnect.").

### 12.6 Responsive & accessibility
- Crew & attendee: designed at 360–430 px first; thumb-reachable primary buttons ≥ 48 px; bottom sheet composer.
- Board: ≥1024 px three columns; tablet two columns + tabs; phone collapses to filtered list.
- WCAG 2.2 AA: semantic HTML, focus rings, `aria-live="polite"` region announcing new requests and claim changes (screen-reader users get "Request claimed by Riya"), colour never the only signal (icons + text), keyboard shortcuts on board (J/K, C to claim, D done).

### 12.7 Component hierarchy (React)
```
<NexconnProvider>                 // init once, handlers, connection state, token refresh
  <EventProvider>                 // event, member, permissions (from our API)
    CrewApp
      ConnectionBanner
      StreamView → MessageList → (TextBubble | RequestCard | SystemNote) ; Composer → RequestComposerSheet
      MyTasksView → RequestCard[]
    OpsBoard → BoardColumn[] → RequestTile ; RequestDrawer ; CrewRoster ; ActivityFeed
    AttendeeHelp → NeedChips ; ZonePicker ; StatusTimeline
shared: RequestCard (single source of truth for rendering metadata state), Timer, Avatar, PresenceDot, Toast
```

### 12.8 Demo-specific UX
- Demo sandbox labels each window ("Ops · Crew (Riya) · Attendee") with a coloured ribbon visible in the recording.
- "Simulated teammate" (optional, labelled) makes a bot crew member claim after N seconds so a solo judge can see the loop — **off by default in real events** and never counted as traction.
- A discreet "Nexconn events" developer drawer (toggle with `?debug=1`) shows the live event log (message received, metadata updated, webhook processed) — great for the technical-proof part of the video.

---

## SECTION 13 — MVP & Feature Prioritisation (cut lines)

| Priority | Feature | Must be done by | Cut if late? |
|---|---|---|---|
| P0 | Token + connect + crew group + stream | 2 Nov | Never |
| P0 | Request card (composer) + claim/resolve with metadata sync | 5 Nov | Never |
| P0 | Attendee help → crew card → live status back | 7 Nov | Never |
| P0 | Ops board + presence | 9 Nov | Never |
| P0 | Named escalation | 10 Nov | Simplify to single-tier |
| P0 | Demo sandbox | 12 Nov | Never (judges) |
| P1 | AI in-place request detection | 13 Nov | Yes → keep manual composer |
| P1 | Attendee live board (open channel + KV) | 14 Nov | Yes |
| P1 | Report page | 15 Nov | Reduce to 4 numbers |
| P2 | Pre-messaging fast path | 15 Nov | Yes |
| P2 | Streaming shift brief | 16 Nov | Yes |
| P3 | Call SDK, native apps, translation | — | Not in submission |

**Feature freeze: 18 Nov 23:59 IST.** After that, bugs, polish, docs, video only.

---

## SECTION 14 — Development Roadmap (28 Oct → 22 Nov)

Assumes one strong full-stack developer working most days; with 2–4 people, parallelise as noted.

| Dates | Stage | Deliverables | Exit gate |
|---|---|---|---|
| **28–30 Oct** | **A. Technical validation spike** | Nexconn account, app, **enrol Chat Growth Credit** and confirm MAU/PCC entitlements in Console; register team on Reskilll (leader); minimal Next.js + Node server deployed on HTTPS; token endpoint; two browsers connect; group create via Server API; send/receive text; register `BTN:Request`; send with `metadata`; **server sets metadata → other client receives `onMessageMetadataUpdated`**; webhook `message:send` reaches deployed server with valid signature; targeted group message; presence subscription; open channel + KV (with schedule/keep-alive destroy type); try pre-messaging config; turn on group pre-join history; **prove a Web Push notification reaches a locked Android phone and an iOS home-screen PWA** | **Go/No-go 30 Oct:** if server-set metadata does not propagate to other Web clients → switch the "live state" mechanism to server-sent `BTN:Update` custom messages (documented, slightly less elegant) — still Baton. If webhooks can't be delivered at all → fall back to **Hallway** (needs only open channels + KV). |
| 31 Oct – 7 Nov | B. Core product | Data model + migrations; organiser auth; event wizard; crew join; crew stream UI; request composer; claim/release/resolve transactions + metadata; attendee help + desk relay + status timeline; reconnect handling | Full loop on 3 devices on the deployed URL |
| 8 – 9 Nov (weekend) | **Pilot #0** (friendly) | Run with a real crew rehearsal (club meeting / small meetup); collect feedback & bugs | ≥10 real users |
| 8 – 12 Nov | C. Differentiation | Ops board polish, presence, named escalation worker, demo sandbox, AI detection (async) | Escalation demo reliable 10/10 runs |
| 13 – 16 Nov | D. UX & reliability | Visual polish, accessibility pass, mobile QA, error states, report page, live board; **Pilot #1–#2 on 14–16 Nov** | Lighthouse a11y ≥ 95; no P0 bugs |
| 17 – 18 Nov | E. Testing | Full matrix (§15), load test 150 concurrent clients, chaos (network kill, webhook replay), cross-browser | All P0/P1 tests pass; **freeze 18 Nov** |
| 19 – 21 Nov | F. Submission | Record & edit video, write PDF, README with architecture + setup + "what existed before" (nothing), traction evidence, final deploy, uptime monitor, submit **by 21 Nov** | Submitted with 1-day buffer |
| 22 Nov | Buffer | Only critical fixes; re-verify links logged-out | — |
| 23 – 27 Nov | Judging | **No deploys**; monitor uptime; answer emails | — |

**Team split (if 3–4 people):** (1) realtime/back-end (Nexconn, webhooks, worker), (2) front-end crew + attendee, (3) ops board + design system, (4) pilots, traction, video, PDF. The pilot/traction role starts **today** — outreach to fest/DevFest/meetup organisers can't wait for the build.

---

## SECTION 15 — Testing & Risk Mitigation

### 15.1 Test matrix
| # | Test | Method | Pass criteria |
|---|---|---|---|
| 1 | Organiser sign-up | E2E (Playwright) | Event list shown |
| 2 | Organiser login/logout | E2E | Session persists/clears |
| 3 | Nexconn auth | E2E + unit | `connect` isOk; token never in client bundle with secret |
| 4 | Send message | E2E 2 contexts | Appears on sender optimistically, server-confirmed |
| 5 | Receive message | E2E 2 contexts | <1 s p50 delivery |
| 6 | Multiple active users | k6/Playwright 50–150 clients | No dropped messages; UI responsive |
| 7 | Reconnection | Toggle offline 30 s | Banner, recovery, missed messages shown |
| 8 | Page refresh | Refresh mid-stream & mid-claim | State identical after reload |
| 9 | Message ordering | Burst 20 msgs (≤5/s client limit) | Ordered by `sentTime` |
| 10 | Duplicate prevention | Replay webhook 3×; double-tap claim | One request; one claim |
| 11 | Permission enforcement | Attendee calls claim API; volunteer of another event | 403 |
| 12 | Workflow completion | Attendee → claim → resolve | All 3 views consistent |
| 13 | Data consistency | Kill server during metadata set | Reconciliation fixes ≤60 s |
| 14 | Mobile layouts | iPhone SE/14, Pixel 7 (real + emulated) | No overflow, tap targets ≥48 px |
| 15 | Desktop layouts | 1280/1440/1920 | Board readable |
| 16 | Error states | Simulate each in §11.6 | Specific message, no silent failure |
| 17 | Deployment | Post-deploy smoke script | All green |
| 18 | Public accessibility | Logged-out browser, other network | App, video, repo reachable |
| 19 | SDK usage verification | Console stats show connections/messages for App Key | Visible |
| 20 | Demo reproduction | Run the scripted demo 10× fresh | 10/10 |
| 21 | Concurrent claim race | 5 clients claim same request within 50 ms | Exactly one owner |
| 22 | Escalation timing | Unclaimed urgent request | Lead nudged at T±10 s; others not |
| 23 | Targeted message privacy | Non-target member | Doesn't receive nudge |
| 24 | Metadata out-of-order | Inject stale version | Client ignores lower `v` |
| 25 | Multi-tab same user | 3 tabs | All in sync; ≤10 Web connections |
| 26 | Kicked by device | Same user on 2nd device (if policy) | 31010 UX shown |
| 27 | Attendee rate limit | 20 requests/min | Throttled with message |
| 28 | AI failure | Block Anthropic | Plain message + manual action |
| 29 | Webhook signature | Bad/old signature | 401, nothing processed |
| 30 | Accessibility | axe + VoiceOver/TalkBack spot check | No critical issues |

### 15.2 Risk register
| Risk | Likelihood | Impact | Mitigation / trigger |
|---|---|---|---|
| Metadata events don't propagate as documented | M | H | Stage A gate; fallback `BTN:Update` messages |
| Webhook delivery unreliable | L-M | H | Reconciliation + client ingest backup; Hallway fallback |
| Growth Credit not applied → 2K MAU / 100 PCC | M | H | Verify day 1; email hackathon@nexconn.ai / open GitHub issue |
| No pilot events secured | M | M (business 20%) | Start outreach now; 6–10 organisers contacted; run own mini-event if needed |
| Scope creep | H | H | Cut lines §13; freeze 18 Nov |
| Free host sleeps during judging | M | H | Paid always-on 20–27 Nov; uptime alerts |
| LLM latency/cost | L | L | Async, optional, cached prompt |
| Web SDK bugs (new SDK) | M | M | Pin 26.2.1; reproduce minimal case; GitHub issue (12-h SLA) |
| Demo device/network failure while recording | M | M | Record segments; wired network; local backup take |
| Volunteer's phone locked → misses escalation (Web SDK has no push) | H | H | PWA + Web Push for urgent/escalations; Wake Lock while on duty; test on iOS (home-screen PWA) and Android Chrome |
| Open channel auto-destroyed mid-event (60-min inactivity default) | M | M | Create with schedule-based destroy or keep-alive; re-enter on reconnect |
| Judge can't test multi-user alone | H | H | Demo sandbox with 3 links + optional labelled simulated teammate |
| Misleading traction claims | — | Severe | Separate test vs pilot users; screenshots + consented quotes only |

---

## SECTION 16 — Business & Growth

### 16.1 ICP
Primary: **organising committees of student-run and community events in India** (college fests, GDG DevFests, hackathons, meetups, small conferences) with 20–300 volunteers. They already coordinate on WhatsApp, run multiple events a year, and have a sponsor/ticket budget. Secondary (expansion): venue operators, event-management agencies, campus security, NGOs and relief volunteer networks.

### 16.2 Problem evidence (sourced, no invented statistics)
- **Diffusion of responsibility in chat groups:** Markey (2000), *Computers in Human Behavior* 16(2):183–188 — field study across ~400 chat groups (~5,000 participants, per secondary source): time to receive help increased with group size; naming a specific person "virtually eliminated" the effect.
- **WhatsApp-run coordination at scale fails in specific ways:** Chennai floods 2015 — volunteer groups used separate WhatsApp groups for verification, data entry into Google Sheets and reporting; volunteers reported resources "redirected to a different request" (Scroll.in; Bhuvana & Arul Aram, JPMTR 2017).
- **Vendor-reported field issues** (directional, not independent): group chats expose every member's number, rosters get buried, broadcast lists fail silently (imbee guide); confirmation-and-escalate loops close information gaps (Telerivet); festival crews cite no-shows and last-minute changes (Ticket Fairy).
- **Willingness to pay exists in adjacent categories:** Zello ~$8/user/mo; Beekeeper Premium $9/user/mo; Connecteam from $29/mo; Slido Engage $17.50/mo, Professional $75/mo (Capterra listings, 2026; verify on vendor sites).

### 16.3 Competition — see §9.5.

### 16.4 Monetisation (primary model: **per-event pass**)
| Plan | Price (proposed, to validate) | For |
|---|---|---|
| Free | ≤15 crew, ≤100 attendee requests, 1 event at a time | Clubs, meetups — acquisition |
| **Event Pass** | ~$39–79 per event (or ₹2,999–5,999) scaled by crew size | Fests, DevFests, conferences |
| Venue/Org | ~$99–199 / month, unlimited events | Venues, agencies, campuses |
Why they'd pay: an ops lead's reputation depends on the event running smoothly; a single unanswered medical/crowd issue is far costlier than the pass; sponsors can cover it. **All prices are hypotheses** to test in pilot interviews (Van Westendorp questions).

### 16.5 Acquisition & retention
- **Acquisition:** direct outreach to fest committees/GDG organisers; "Powered by Baton" on attendee help pages (every attendee sees it — the product markets itself to future organisers among the audience); templates; volunteer word-of-mouth (volunteers become next year's organisers).
- **Retention:** events recur (annual fests, monthly meetups); duplicate-last-event; post-event report becomes the organiser's debrief artefact; crew rosters carry over.
- **Expansion:** venues and agencies (multi-event), campus security desks, NGOs (relief volunteer dispatch — the Humanitarian story), hospitality floors.

### 16.6 Unit economics (sourced inputs; outputs are estimates)
| Cost driver | Source figure | Per typical event (100 crew + 400 attendees who open help/live board) |
|---|---|---|
| Nexconn MAU | Free under Growth Credit ≤10K MAU (yr 1); after: Pro 10K tier $860/mo (~$0.086/MAU at full use) or overage $0.12/MAU | Yr 1: $0; later ≈ 500 MAU × $0.086–0.12 = **$43–60** |
| Nexconn storage/PCC | 10 GB included (Growth Credit); PCC 5% of tier | Within allowance |
| LLM (Tier 2) | Opus 5.5 $4/$20 per MTok; Haiku 5.5 $0.10/$0.50 | ~1,500 crew messages × ~400 in/80 out tokens ≈ $4 (Opus) or ≈ $0.10 (Haiku) |
| Hosting + DB | Hobby tiers | ~$10–30/month total, amortised |
**Insight:** attendee MAU is the dominant post-year-one cost. Design consequence: attendees connect to Nexconn only when they actually open Help or the Live board (not on poster scan landing), and pricing scales with attendee volume. At ~$59/event the gross margin is thin on large events after the free year → the Venue/Org plan and attendee-tier pricing matter. [I]

### 16.7 Assumptions to validate (with pilots)
1. Organisers will run a new tool on event day if setup takes <5 min. 2. Volunteers will claim instead of just replying. 3. Attendees will use a QR help page (expected adoption % unknown). 4. Price point. 5. AI detection precision good enough (target ≥90% on pilot messages).

### 16.8 Ethical traction plan
- **Targets (honest, achievable):** 2–3 real events, 60–300 real Nexconn MAU in November, ≥30 real requests handled, ≥8 organiser/volunteer feedback responses.
- **Pipeline:** list 20 events happening 8–21 Nov (college fests, GDG DevFests, meetups, hackathons) → message organisers offering free use + on-site support → confirm 3 → rehearsal with each crew.
- **Evidence to submit:** Console MAU screenshot (dated), anonymised `traction_log` export distinguishing test vs pilot users, before/after metric per event (median time-to-claim), photos of QR posters in use (with permission), consented written quotes, organiser email confirming use.
- **Never:** fake users, bot-inflated MAU, invented testimonials, or counting the simulated teammate.

---

## SECTION 17 — Demo & Submission Strategy

### 17.1 Video
Length is **not specified** by organisers. **Recommendation: 2:30–3:00** (long enough for proof, short enough to be watched fully). Screen + phone captures with a clean voice-over; captions burned in.

| Time | Beat | On screen |
|---|---|---|
| 0:00–0:15 | **Problem** | Real (blurred) WhatsApp crew chat scrolling: "anyone at gate 3??", "who's handling water?", 47 unread. Title: *"In a 120-person crew chat, who's handling this?"* |
| 0:15–0:25 | **One sentence** | "Baton is the group chat where every request gets an owner." |
| 0:25–1:05 | **Signature loop** | 3 labelled screens: attendee scans QR → asks → card appears on board + phones → Riya claims → every card flips → attendee sees "Riya is on it". Timer overlay shows seconds. |
| 1:05–1:30 | **In-place structure** | Volunteer types plain text → same bubble becomes a claimable card (AI badge) → no one claims → named lead nudged; other phones stay silent (show them). |
| 1:30–1:55 | **Technical proof** | Debug drawer: `onMessageReceived`, `onMessageMetadataUpdated`, webhook processed; architecture diagram 5 s; two devices on different networks; airplane-mode → reconnect → state correct; refresh mid-claim. |
| 1:55–2:20 | **Real use** | Pilot footage/photos, Console MAU screenshot, numbers: requests handled, median time-to-claim, one quote. |
| 2:20–2:40 | **Business** | ICP, Event Pass pricing, expansion to venues & relief crews. |
| 2:40–2:55 | **Close** | "Nothing falls through." Links + App Key shown on screen. |

### 17.2 Write-up PDF (8–10 pages recommended; no limit published)
1. Problem & insight (bystander effect, temporary crews) · 2. Product & screenshots · 3. **Nexconn features used** (table from §10 — this is explicitly requested) · 4. Architecture & security · 5. Reliability & testing results · 6. Traction evidence · 7. Business model · 8. What's next · Appendix: **Nexconn App Key**, links, team, statement that the project was built entirely during the challenge.

### 17.3 Live-app checklist for judges
"Try a live demo" on the landing page; works without login; QR codes for phones; seeded but clearly fictional sandbox; reset button; uptime monitored; no console errors.

### 17.4 Submission checklist
- [ ] Team registered; leader selects **Workplace & Collaboration** track
- [ ] Live URL (always-on, HTTPS) tested logged-out on mobile + desktop
- [ ] Public GitHub repo: README (problem, demo GIF, architecture, Nexconn features, setup, env vars, tests), MIT licence, no secrets (gitleaks clean)
- [ ] Video public on YouTube (unlisted is fine if "anyone with link") and tested logged-out
- [ ] PDF with App Key, Nexconn feature list, traction appendix
- [ ] App Key in form matches the deployed bundle
- [ ] Growth Credit active; domain allowlist set; Console stats visible
- [ ] Traction evidence attached; test vs real users separated
- [ ] Submitted by **21 Nov**; re-verified 22 Nov; no deploys 23–27 Nov

---

## SECTION 18 — Final Scoring & Winnability Audit

### 18.1 Ten hostile questions
| # | Question | Verdict |
|---|---|---|
| 1 | Is the problem important? | Yes — operational, recurring, evidence-backed; moderate stakes (events), high stakes in expansion (relief). |
| 2 | Meaningfully different? | Yes vs chat apps; partially vs ticketing tools — the in-chat, zero-install, attendee loop is the difference. |
| 3 | Nexconn essential? | Yes — transport, offline catch-up, per-message live state, targeted messages, presence, open channel. |
| 4 | Finishable by deadline? | Yes with cut lines; Tier 1 is ~2 weeks of focused work. |
| 5 | Reliable main workflow? | Likely, if Stage A passes; server-arbitrated design is robust. |
| 6 | Value understood immediately? | Yes — the claim flip across 3 screens is self-explanatory. |
| 7 | Professional interface? | Depends on execution; design system defined. |
| 8 | Sound architecture? | Yes — authoritative DB + realtime projection, idempotency, reconciliation. |
| 9 | Commercial potential? | Credible niche; unit economics need attendee-aware pricing. |
| 10 | Why choose it over another excellent submission? | Real users during judging + a platform-native mechanism Nexconn's own engineers will recognise as using their SDK the way it was designed to be used. |

### 18.2 Weakest three aspects → improvements
1. **"Isn't this a ticketing tool?" perception** → never show a form in the hero flow; lead with the free-text bubble becoming a card; name it "requests", not "tickets".
2. **Traction uncertainty** → outreach starts today; Pilot #0 on 8–9 Nov; fallback: run Baton at your own college club event or a hackathon you attend; publish honest numbers even if small.
3. **Three-role complexity for a solo judge** → demo sandbox with three links and QR codes; 20-second guided tour overlay on first open.

### 18.3 Rescored (estimate, not inflated)
| Criterion | Before | After improvements | Range driver |
|---|---:|---:|---|
| Completeness & UX (50) | 42 | 43 | Execution quality, demo sandbox |
| Innovation & scenario (30) | 25 | 25 | — |
| Business & growth (20) | 17 | 15–18 | 0 pilots → 14; 2–3 pilots with ≥100 MAU → 18 |
| **Total** | **84** | **82–86** | |

The project is not fundamentally weak; the runner-up (Hallway) remains the switch-over if the Stage A gate fails.

---

## SECTION 19 — Outstanding Uncertainties & Source Ledger

### 19.1 Classification
**Verified facts:** rubric weights and wording; timeline; no qualifying round; deliverables; App Key requirement; traction counted as active users on Nexconn; team 1–4; eligibility; prize split; Chat SDK mandatory / Call optional; Web SDK APIs listed in §3.3; webhook semantics; pricing tables; Growth Credit terms as published.
**Supported inferences:** Nexconn = RongCloud international brand; judges will see November MAU; Chat UI unsuitable for metadata-driven UI; most entries will be AI support bots / translated chat / social clones; webhook signature doesn't protect body integrity.
**Working assumptions:** server-set metadata reaches all Web clients via `onMessageMetadataUpdated`; Growth Credit PCC ≈ 500; pilots obtainable in November; organisers will pay per event; AI detection precision ≥90%.
**Unresolved:** video length; PDF length; whether judges test with multiple devices; one vs two App Keys (dev/prod) per app; documentation for translation/speech-to-text; pre-messaging availability on our exact plan; exact PCC under Growth Credit; whether Server API provides group history retrieval for reconciliation; Credit-card FAQ answer on the Growth Credit page (not captured).

### 19.2 Source ledger (accessed 28 Oct 2026)
**Competition**
- Rules, FAQ, rubric, timeline, prizes, deliverables: https://reskilll.com/hack/nexconn/rules
- Landing: https://reskilll.com/hack/nexconn · Terms: https://reskilll.com/hack/nexconn/terms
- Support repo (empty): https://github.com/NexconnAI-Dev/hackathon · Contact: hackathon@nexconn.ai
- Growth Credit: https://www.nexconn.ai/free-chat-api

**Nexconn docs** (all at `https://docs.nexconn.ai/<path>.md`)
- Index: `/llms.txt` · Web quickstart `/chatsdk-web` · import `/chatsdk-web/import` · init `/chatsdk-web/init` · handlers `/chatsdk-web/listener` · custom messages `/chatsdk-web/message/customize` · send `/chatsdk-web/message/send` · streaming `/chatsdk-web/message/stream-msg` · read receipts `/chatsdk-web/message/read-receipt` · history `/chatsdk-web/message/get-history` · update `/chatsdk-web/message/modify-message` · community metadata `/chatsdk-web/community-channel/expand-message` · open channels `/chatsdk-web/open-channel/overview`, `/chatsdk-web/open-channel/open-channel-kv` · connect `/chatsdk-web/connection/connect` · reconnect `/chatsdk-web/connection/reconnect-kick` · presence `/chatsdk-web/user/subscribe_online` · multi-device `/chatsdk-web/user/multiple-platform` · release notes `/chatsdk-web/release-notes`, `/callsdk-web/release-notes` · AI tooling `/chatsdk-web/build-with-ai`, `/chatsdk-web/build-with-ai/configure-mcp-server`
- Chat UI: `/chatui-web`, `/chatui-web/quickstart`, `/chatui-web/chat/register-message`
- Call: `/callsdk-web`, `/callsdk-web/integrate-with-chat`, `/callsdk-web/group-call`, `/callsdk-web/one-to-one-call`, `/guides/sdk-libraries/client-sdks/callSDK`, `/guides/calls/overview`
- Server: `/platform-chat-api`, `/platform-chat-api/prepare-to-use-api/auth`, `/base-url`, `/limits`, `/platform-chat-api/user/register`, `/platform-chat-api/message/message-about/about-message-types`, `/platform-chat-api/message/send-group`, `/platform-chat-api/message/send-group-stream`, `/platform-chat-api/message/expansion-about`, `/platform-chat-api/message/set-expansion`, `/platform-chat-api/message/service-config`, `/platform-chat-api/group-channel/managing-channels/create-group`
- Webhooks: `/platform-chat-api/webhook/overview`, `/platform-chat-api/webhook/message/send`, `/platform-chat-api/webhook/message/pre-messaging`, `/server-call-api/webhook/overview`
- Pricing: `/guides/realtime-chat/intro-chat/pricing-plans`
- Packages: npm `@nexconn/engine`, `@nexconn/chat` (typings `https://unpkg.com/@nexconn/chat@26.2.1/index.d.ts`), `@nexconn/call`, `@nexconn/chatui`
- GitHub: https://github.com/NexconnAI-Dev (repo list), `/nexconn-skills`, `/nexconn-server-sdk-node`, `/nexconn-chat-sample-web`

**Winners**
- Gemini API Developer Competition: https://developers.googleblog.com/en/announcing-the-winners-of-the-gemini-api-developer-competition/
- Twilio × DEV 2020: https://dev.to/devteam/announcing-the-twilio-hackathon-winners-1lp4 · https://www.twilio.com/en-us/blog/announcing-dev-hack-winners-april
- DEV × Twilio Challenge 2024: https://dev.to/devteam/congrats-to-the-twilio-challenge-winners-2b1n
- Supabase LW12: https://supabase.com/blog/lw12-hackathon-winners · LW5: https://supabase.com/blog/launch-week-5-hackathon-winners · Holiday Hackdays: https://supabase.com/blog/holiday-hackdays-winners-2021
- Agora RTE2020 (summary): https://plushcap.com/analysis/agora/congratulations-to-the-winners-of-the-rte2020-hackathon
- TreeHacks 2025: https://stanforddaily.com/2025/02/18/treehacks-awards-200000-in-prizes-to-students-from-around-the-world/ · 2026: https://stanforddaily.com/2026/02/15/12th-annual-treehacks/
- Imagine Cup 2025: https://techcommunity.microsoft.com/blog/studentdeveloperblog/announcing-the-2025-imagine-cup-world-champion/4414342
- Hack Western 11: https://www.ivey.uwo.ca/scotiabank-digital-banking-lab/news/2024/11/hack-western-11-where-ideas-took-flight/
- Stream Build Vikings (summary): https://www.plushcap.com/content/stream/blog/stream-build-vikings-feb-2022-winners

**Market & research**
- Markey (2000): https://scilit.com/publications/e07b3cc936f7f6f15e97c89b0f3b457c
- Chennai floods & WhatsApp: https://jpmtr.org/index.php/journal/article/view/98 · https://scroll.in/magazine/905808/scroll_in
- Volunteer coordination (vendor): https://www.imbee.io/resource/volunteer-management-whatsapp-hong-kong-ngos-2026 · https://www.telerivet.com/blog/civic-observation-sms-field-coordination · https://www.ticketfairy.com/blog/festival-crew-management-tech-streamlining-volunteer-scheduling-and-communication
- Event ops tools: https://247software.com/operations-management-software-suite-for-event-ops · https://teamsos.co.uk/events-security-facilities-management/
- Pricing comparables: https://capterra.com/p/198898/Zello/ · https://www.capterra.com/p/156917/Beekeeper/pricing/ · https://www.capterra.com/p/154051/Slido/pricing/ · https://us.fitgap.com/search/frontline-worker-communication-platforms-software/free?page=1
- Halp ticket emoji: https://plz.halp.com/article/lva4e36oi5-how-to-create-a-ticket-with-an-emoji-reaction-in-slack

---

## SECTION 20 — Final Recommendation

# THE PROJECT WE SHOULD BUILD: **Baton** — the group chat where every request gets an owner

1. **Why this project.** It scored highest of 48 concepts on the published 50/30/20 rubric because it is strong on all three criteria at once: a complete, polishable loop (UX), a genuinely new chat interaction grounded in research (innovation), and a payer plus a route to real November users (business).
2. **Why this track.** Workplace & Collaboration rewards operational problems with obvious buyers; the frontline/temporary-crew niche is under-served by Slack-style tools and will be under-represented among entries that default to Slack clones and AI bots.
3. **Why this problem.** Requests disappearing in big group chats is frequent, costly on event day, and documented: help slows as groups grow, and naming an owner fixes it (Markey 2000). Crews already live in chat; Baton adds ownership without asking them to leave it.
4. **Why Nexconn is essential.** The product *is* real-time state on messages: group delivery to hundreds of phones, offline catch-up, message metadata synced live, server-side webhooks, targeted escalation messages, presence and open-channel broadcast. Remove Nexconn and there is no product, only a database.
5. **Why it can outperform other submissions.** Most teams will ship a chat window with AI attached. Baton shows a new interaction (a message becoming a live, owned object) that Nexconn's engineers will recognise as using their platform at its depth — and it arrives with real users in their own MAU dashboard.
6. **What makes the demo memorable.** One attendee message, three screens, one tap — every card flips to "Claimed by Riya", and the attendee's phone says "Riya is on it, 4 seconds after you asked". Then a plain-text message silently becomes a claimable card, and only the named lead's phone buzzes.
7. **Why it's achievable.** Every mechanism uses documented APIs verified in the docs and SDK typings; AI and pre-messaging are optional layers; the core is a well-understood transactional backend plus the Chat SDK; strict cut lines and an 18 Nov freeze.
8. **Genuine business value.** Clear ICP (event organising committees → venues → relief networks), per-event pricing comparable to tools organisers already buy, built-in distribution through attendee-facing pages, and a cost model whose main driver (MAU) is known and free for year one.
9. **What could make it lose.** Server-set metadata not propagating on Web (caught by the 30 Oct gate); zero pilot events (business score drops ~4 points); polish slipping because scope grew; app down during judging week; being read as "a ticketing tool".
10. **Next engineering milestone (start now, finish by 30 Oct):** *Stage A spike* — create the Nexconn app and enrol it in Chat Growth Credit; deploy a minimal HTTPS Node/Next.js service with the token endpoint and a signed webhook receiver; prove, between two browsers, that (a) a `BTN:Request` custom message sent with `metadata` arrives, (b) a **server-side metadata set triggers `onMessageMetadataUpdated` on the other client**, (c) `message:send` webhooks arrive and verify, and (d) a targeted group message reaches only its target. Pass → build Baton. Fail on (b) → switch live state to server-sent update messages. Fail on (c) → build Hallway.

*Parallel non-engineering milestone (today):* register the team, and send pilot invitations to 15–20 event organisers running events between 8 and 21 November.
