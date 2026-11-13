# Baton: Every request has an owner.

**Nexconn Build Challenge 2026 · Project write-up · Workplace & Collaboration track**

| | |
|---|---|
| Live app | https://baton.priyanshnarang.in |
| Nexconn App Key | `e5t4ouvpen0va` |
| Source code | https://github.com/priyansh-narang2308/baton |
| Demo video | https://youtu.be/Cyq-dWpizs0 |

---

## 1. Executive overview

**Baton is a real-time operations coordination platform for event teams.**

1. Attendees report problems by scanning a QR poster.
2. Each report becomes an incident with exactly one owner, visible live on the organizer's board and on every volunteer's phone.
3. Volunteers coordinate in a crew chat. They hand work over with an explicit **Baton Pass**, and can start a voice call from the incident.
4. The person who reported the problem sees who is on it and when it is fixed.

Chat, live updates, private alerts and calls all run on Nexconn.

- **The problem.** In an event group chat, everyone sees a request and nobody owns it. Duplicates pile up, handovers are silent, and the person who asked never hears back.
- **What Baton does.** Each request gets one owner, chosen atomically. Duplicate reports merge. A handover only happens when the next person accepts. Every step is timed and logged.
- **Built on Nexconn.** Group and direct channels, custom message types, message metadata, targeted messages, message and presence webhooks, and 1:1 voice calls with the Call SDK.

## 2. Problem and why we built it

Campus fests, hackathons and meetups are run by small crews of volunteers. On the day, requests come from everywhere: an attendee at a gate, a speaker backstage, another volunteer. Most of it lands in one busy chat group. That group is good at spreading information and bad at getting work done:

- **No owner.** Many people read a request, and each assumes someone else has it.
- **Duplicates.** The same issue arrives five times from five people.
- **Silent handovers.** A volunteer leaves, and the job quietly drops.
- **No closure.** The reporter never learns whether anyone came.

> **Representative scenario (illustrative, not measured data or user research).**
> The water station at Gate 3 runs dry. An attendee tells a volunteer, another posts in the crew group, and a third asks at the help desk. That is three messages about one problem. Two volunteers each think the other is going. Twenty minutes later the station is still empty and the attendee has walked away.

**Why we built it.** Ticketing and helpdesk tools solve ownership, but they are built for support teams at desks, not volunteers walking a venue on their phones. Crews will not install an app or create accounts for a one-day event, and attendees certainly will not. We wanted the speed of a chat group with the accountability of a ticket queue: every request has exactly one owner, and everyone can see who.

**Design principles**
- **No accounts on the day.** Volunteers join by QR code; attendees report from a poster.
- **One owner, never zero.** A request is claimed atomically and stays owned during a handover.
- **Chat stays chat.** A request typed in chat becomes a tracked incident.
- **Close the loop.** The reporter sees "Sent", then who is on it, then "Fixed".
- **Coordination, not dispatch.** Baton handles operational requests. It is not an emergency or safety-critical dispatch system.

**Who it is for**
- Organizers and ops leads, who set up the event and watch the board.
- Volunteers, who work from their phones.
- Attendees, who report with no account and no install.

## 3. Solution and workflow

1. **Set up the event.** The organizer adds locations. Baton creates a Nexconn crew group and prints a crew QR code plus one report poster per location.
2. **Crew joins by QR.** Volunteers scan, type a name, and are in the crew chat.
3. **Attendee reports.** Scanning a poster opens a short form, and the attendee gets a private status thread.
4. **It becomes an incident.** A numbered card appears on the board and every crew phone. A request typed in crew chat becomes one too.
5. **Duplicates merge.** Matching uses deterministic rules: same location, same category, overlapping words, and close in time. No AI is involved.
6. **Someone takes it.** One tap claims the incident. Under simultaneous taps, exactly one person wins.
7. **Baton Pass.** The owner offers the incident with a note and stays the owner until it is accepted.
8. **Call, fix, close the loop.** A volunteer can call from the incident. When the incident is fixed, the reporter sees "Fixed" and the timeline keeps the record.

**Interfaces:**
- Organizer board (desktop).
- Volunteer view (phone).
- Attendee report page (phone).
- QR and poster pages.

All of these are custom React screens. The Nexconn Chat UI kit is not used.

## 4. Nexconn SDK integration and architecture

Baton uses four Nexconn pieces:
- The **Nexconn Chat SDK** (`@nexconn/chat` 26.2.1), with its own React interface.
- The **Nexconn Server API**, from the backend.
- **Webhooks**, for messages and presence.
- The **Nexconn Call SDK** (`@nexconn/call`), for voice.

The App Secret stays on the server. Browsers only receive short-lived access tokens.

| Baton feature | Nexconn capability | Implementation role | Evidence |
|---|---|---|---|
| Sign-in without accounts | Server API `/v4/auth/access-token/issue` | Token per volunteer and per anonymous attendee; refetched on expiry | Live |
| Crew chat | Group channel create/join, `GroupChannel.sendMessage`, history query | One group per event; custom React chat UI | Live, check 8 |
| Incident cards in chat | Custom message types `BTN:Incident`, `BTN:Status`, `BTN:Nudge` | Registered with `NCEngine.registerCustomMessages`; bot posts via Server API | Live, check 7 |
| Live owner and status | Message metadata (`message/metadata/set`, `onMessageMetadataUpdated`) | Card state rides on the message; clients apply only newer versions | Live, checks 12, 16 |
| Chat line → request | Webhook `message:send` | Signature and freshness checked, deduplicated, rule-based detection | Live, check 9 |
| Private Baton Pass alert | Group message with `toUserIds` | Only the recipient receives the offer | Live, check 14 |
| Reporter updates | Direct channel message (Server API) | "Sent", "<name> is on it", "Fixed", once each | Live, checks 13, 17, 26 |
| Crew online count | Webhook `user:connection_status` | Presence per member; client IP dropped | Live |
| Resilient connection | Connection status handler, `NCEngine.connect` | Reconnecting state, retry with a fresh token | Code |
| Voice huddle | Call SDK `startCall`, `acceptCall`, `enableMicrophone`, `endCall` | 1:1 audio from an incident; duration logged | Live, checks 20–24 |

**Architecture**

```
Organizer / Volunteers / Attendees
        │ HTTPS
        ▼
Baton web app (Next.js on Vercel)
  React UI ── Chat SDK client ⇄ Nexconn Chat (groups, direct, custom messages, metadata)
           └─ Call SDK        ⇄ Nexconn Call (WebRTC audio)
  Baton API ── signed Server API calls ─► Nexconn Server API
            ◄── webhooks (message:send, user:connection_status)
  Postgres (incidents, reports, audit timeline)
```

Baton's database is the source of truth for ownership. Nexconn carries every change to every screen.

**What Nexconn replaces.** Without Nexconn, Baton would need its own WebSocket fleet, message history, offline delivery, push, presence and WebRTC stack.

## 5. Innovation, implementation and reliability

**What is different**
- **Baton Pass.** A two-step offer and accept. The current owner keeps the incident until the recipient accepts, and both steps are written to the audit timeline.
- **Chat as an intake channel.** A message webhook turns requests typed in chat into incidents.
- **Live cards.** Each incident is a custom Nexconn message whose metadata holds owner and status.
- **The reporter is in the loop.** Anonymous attendees get a Nexconn identity and direct-message status updates.
- **A call that belongs to the incident.** The call is started from the request and logged against it.

**Correctness**
- **Atomic claim.** A conditional database update; five simultaneous claims produce one owner (unit-tested).
- **Transactional pass.** Accept checks the named recipient and the claimed status in one transaction.
- **Versioned metadata.** Clients ignore older states.
- **Webhooks.** SHA-1 signature, timestamp window, envelope deduplication, and a unique key on the source message.
- **Escalation.** The worker uses row locks, so alerts are never duplicated.
- **Recovery.** Quiet retries, and reconnection with a fresh token.

**Verification**
- **28 / 28 checks passed** in a recorded end-to-end run on the live site, with five browser identities.
- **102 automated tests** pass in 9 files. Typecheck, lint and build are clean.
- **Two-way audio** was confirmed in the recorded Nexconn call.
- The recorded fixed incident shows two merged reports, a time to owner of 57 s, and a time to fix of 2 m 48 s.

**Known limitations**
- Some actions take several seconds because of database round trips across regions.
- Calls are 1:1 audio only.
- Rule-based matching can miss duplicates that are worded very differently. Sensitive categories are only ever suggested as merges.
- No read receipts or typing indicators.

## 6. Business, traction and submission details

**Who pays, who uses.** The buyer is the organizer or ops lead. The users are volunteers, plus anonymous attendees. Only the organizer needs an account.

**Pricing hypothesis** (to be tested in pilots, not validated):
- A free tier for small events.
- A per-event plan.
- An annual plan for institutions that run many events.

**Go-to-market plan**
1. Start with student-run events of 10–150 volunteers.
2. Offer free, assisted pilots.
3. Measure time to owner, time to fix, unowned requests and duplicates.
4. If no live event is available in time, run a rehearsal and label it as one.

**Traction: honest status.** Baton has **no external users, pilots or customer feedback yet**. All Nexconn users so far are our own development and demo identities.

**Built during the challenge.** Everything was built during the challenge window (23 Oct – 22 Nov 2026). The first commit, a Next.js scaffold, was made on 28 Oct 2026, and there are 69 commits up to 12 Nov. There was no earlier version.

Third-party building blocks:
- Next.js, React, Postgres with Drizzle ORM, Framer Motion, Radix UI and Lucide.
- The landing hero is adapted from an Originkit block, and the footer from Watermelon's footer-29.

The demo narration is synthetic (TTS). The two voices in the recorded call are synthetic test voices sent through a real Nexconn call.

**Submission details**
- **Nexconn App Key:** `e5t4ouvpen0va`. The App Secret and all tokens are server-side only and are not included.
- **Track:** Workplace & Collaboration (team messaging, shift handover).
- **Live app:** https://baton.priyanshnarang.in
- **Source:** https://github.com/priyansh-narang2308/baton
- **Demo video:** https://youtu.be/Cyq-dWpizs0
- **Docs:** https://docs.nexconn.ai/
- **Try it:** Open the live app, choose "Set up your event", then open the crew and report QR links on a phone.
