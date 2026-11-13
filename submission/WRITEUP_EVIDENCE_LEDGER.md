# Write-up evidence ledger

Built on 12 Nov 2026 at commit `c4965c5`. The brief named `cff4ec0`, but `c4965c5` is the current `HEAD`.

Every claim in `BATON_PROJECT_WRITEUP.pdf` is listed here with its source.

**States:**
- **Live:** observed on the production site.
- **Code:** implemented and unit-tested.
- **Doc:** an official Nexconn capability.
- **Hyp.:** a business hypothesis.
- **Plan:** planned, not done.

**Live take G:** the automated recording run of 12 Nov 2026 against https://baton.priyanshnarang.in. It used five separate browser identities and passed 28 checks, listed in `artifacts/raw-v2/checks.json`. Each check waited for the real result on another user's screen.

## Requirements and facts

| Claim | Evidence | State | In PDF |
|---|---|---|---|
| Write-up must say why we built it, the problem, the Nexconn features, and the App Key | https://reskilll.com/hack/nexconn/rules, read 12 Nov 2026 | Doc | Yes |
| Judging: 50% completeness and UX, 30% innovation, 20% business; traction is a bonus counted as Nexconn active users | Same page, "Judging" and FAQ | Doc | Yes |
| Existing projects must disclose what existed before | Same page, FAQ | Doc | Yes |
| Challenge window 23 Oct – 22 Nov 2026 | Same page | Doc | Yes |
| Nexconn App Key `e5t4ouvpen0va` is the key production uses | Production SDK requests in take logs carry `appkey=e5t4ouvpen0va`; local `NEXCONN_APP_KEY` compared equal without printing it | Live | Yes |
| Live app https://baton.priyanshnarang.in | Vercel deployment Ready, `/api/health` 200, 12 Nov 2026 | Live | Yes |
| The GitHub repository is public | `origin` = github.com/priyansh-narang2308/baton, but anonymous `GET` returns **404** | **Not met** | Flagged |
| Demo video URL | https://youtu.be/Cyq-dWpizs0 (YouTube) | Live | Yes |

## Product functionality

| Claim | Code | State |
|---|---|---|
| Organizer creates an event (name, locations); QR codes for crew and per-location posters | `src/app/new`, `api/events`, QR routes | Live (check 1, 2) |
| Volunteers join from the crew QR link, with no account | `api/join` | Live (check 3) |
| Attendee reports from a location poster, anonymously, with no app | `src/app/e/[slug]`, `api/e/[slug]/reports` | Live (check 5) |
| Report becomes a numbered, categorised incident on the board without a reload | `domain/incidents.ts`, `projection.ts` | Live (check 6) |
| Duplicate report attached to the existing incident; both reports kept; marked "merged automatically" | `domain/consolidation.ts` (deterministic: zone and category hard rules, keyword overlap, recency), 11 unit tests | Live (check 10, 11) |
| Duplicate matching is rule-based, not AI | Header comment and code in `consolidation.ts`, `detection.ts` | Code |
| Claim: exactly one owner under concurrent claims | Conditional `UPDATE … WHERE status='open'`; test: 5 simultaneous claims → 1 winner | Code, Live (check 12) |
| Baton Pass: offer with note; owner keeps it until accept; accept transfers atomically; timeline entries | `offerPass`, `acceptPass` in `incidents.ts`; audit `pass.offered`, … | Live (checks 14–19) |
| Reporter sees "Sent → <name> is on it → Fixed" | `attendee-help.tsx`, `BTN:Status` direct messages | Live (checks 13, 17, 26) |
| Incident timeline (activity) records chat detection and the call | `incident_events` table; screenshot | Live (check 24, 28) |
| Time to owner and time to fix shown per incident | Incident sheet screenshot | Live |
| Board metrics (needs owner, urgent, longest wait, median time to owner) | Board screenshot | Live |
| Escalation worker re-alerts unowned incidents | `worker.ts`, tests | Code (not in PDF as a headline) |

## Nexconn integration

| Baton feature | Nexconn capability | Where | State |
|---|---|---|---|
| Server issues per-user access tokens | Server API `/v4/auth/access-token/issue` | `server/nexconn/api.ts`, `api/session/token` | Live |
| One crew group per event; members join | `/v4/group-channel/create`, `/join`, `/leave` | `api.ts` | Live |
| Crew chat (custom React UI) | Chat SDK `GroupChannel.sendMessage`, message handler | `lib/nexconn-client.ts` | Live (check 8) |
| Incident cards as messages | Custom message types `BTN:Incident`, `BTN:Status`, `BTN:Nudge` via `NCEngine.registerCustomMessages`; bot sends with `/v4/group-channel/message/send` | `nexconn-client.ts`, `projection.ts` | Live (check 7) |
| Live card state on every screen | Message metadata: server `/v4/channel-type/message/metadata/set`; clients `onMessageMetadataUpdated` with a version check | `projection.ts`, `use-event-state.ts` | Live (checks 12, 16) |
| Chat line becomes a request | Webhook `message:send`; signature verified, deduplicated by envelope id; unique `source_message_id` | `api/nexconn/webhook`, `chat-intake.ts`, `webhooks.ts` | Live (check 9) |
| Crew online status | Webhook `user:connection_status` (client IP dropped before storage) | `presence.ts` | Live (board "2 online") |
| Private Baton Pass alert | Targeted group message (`toUserIds`) to the recipient only | `projection.ts` `notifyPass` | Live (check 14) |
| Reporter status updates | Direct channel message `/v4/direct-channel/message/send` (`BTN:Status`) | `projection.ts` | Live (checks 13, 17) |
| Private 1:1 crew messages | Chat SDK `DirectChannel` send and history | `nexconn-client.ts` | Code (UI shown in screenshot) |
| Chat history, late joiners | `BaseChannel.createMessagesQuery` | `nexconn-client.ts` | Code |
| Connection, reconnect, token refresh | `NCEngine.connect`, connection status handler, refetch token on expiry | `nexconn-client.ts` | Code |
| Voice huddle | Call SDK `NCCallEngine` `startCall`, `acceptCall`, `enableMicrophone`, `endCall`; logged in the timeline | `lib/nexconn-call.ts`, `call-dock.tsx` | Live: two-way audio (WebRTC inbound audio energy 0.67 and 0.72 on the two sides) |
| Chat UI package | Not used: Baton's own React interface on the Chat SDK | — | Stated as not used |
| Read receipts, typing | Not implemented | — | Not claimed |

## Quality

| Claim | Evidence | State |
|---|---|---|
| 102 automated tests pass in 9 files | `npx vitest run`, 12 Nov 2026 | Code |
| Typecheck, lint and production build pass | `tsc --noEmit`, `eslint .`, `npm run build`, 12 Nov 2026 | Code |
| Webhook signature check and freshness window | `sign.test.ts` | Code |
| Known limitation: some actions take several seconds | Browser timings in take G (create event 4.8 s, reports up to 15.2 s) | Live |

## Business and traction

| Claim | Evidence | State |
|---|---|---|
| No external users, pilots or feedback yet | `docs/TRACTION_PLAN.md` (11 Nov 2026); no other records | Stated honestly |
| All Nexconn users so far are development and demo identities | Takes and rehearsals | Stated |
| Buyer: organizer or ops lead; per-event plan plus annual plan for institutions | Reasoning only | Hyp. |
| Pilot audience: college fests, hackathons, meetups, 10–150 volunteers | `TRACTION_PLAN.md` | Plan |

## Existing versus new work

| Claim | Evidence |
|---|---|
| Baton was built during the challenge. First commit 28 Oct 2026 (Next.js scaffold); 69 commits up to 12 Nov. The challenge opened 23 Oct. | `git log` |
| Third-party UI used and adapted: Originkit hero-57 layout, Watermelon footer-29, Radix dropdown, lucide icons | Commits `1d059c7`, `c4965c5`, `06e2242` |

## Not claimed

- Chat UI.
- Group calls or video.
- Read receipts.
- AI matching.
- User numbers, testimonials or partnerships.
- Safety-critical dispatch.
