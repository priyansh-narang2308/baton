# Baton — product and technical audit (11 Nov 2026)

This audit is written as a skeptical judge, not as the builder. Each claim is marked with how it was checked: **[run]** run in the browser today, **[test]** covered by an automated test, **[live]** proven against the real Nexconn service, **[read]** read in code only.

## 1. Verdict in one paragraph

The core loop is real and works. An attendee scans a QR code and reports. Duplicates merge into one card. A volunteer claims it on their phone. The organizer board and every crew phone update through Nexconn message metadata. The attendee sees "on it", then "fixed". That loop is uncommon in a chat-app hackathon.

What would cost points today is everything around the loop:
- a landing page that undersells the product;
- no incident detail or history view, even though the data is all recorded;
- the organizer can only claim a request, not assign it to someone;
- organizer and volunteer cannot talk to each other inside the product;
- zero real users.

Each of these is fixable before the deadline, apart from traction, which depends on the owner running pilots.

## 2. Prior claims, re-verified

| Claim | Result | How |
|---|---|---|
| 82 tests pass, typecheck, lint, build | ✅ 82/82, 0 TS errors, lint clean, build OK | [run] 11 Nov |
| Database is the source of truth for incidents | ✅ All state changes are conditional `UPDATE`s in Postgres; Nexconn metadata is written afterwards as a projection | [read] [test] |
| Projection runs after the response and doesn't block | ✅ `after()`. Responses took 10–30 ms live on 28 Oct | [live] |
| No duplicate cards under concurrency | ✅ Writes are serialised per incident. The regression test fails without the fix | [test] |
| Duplicate reports merge | ✅ Three Gate 3 water reports became one card showing "3 reports" | [run] [live] |
| Two-tab real-time sync | ✅ A claim in one tab flipped the board in another (`onMessageMetadataUpdated`) | [live] 28 Oct |
| Identity fix (board and crew in one browser) | ✅ `?as=organizer` keeps the actors apart | [run] |
| Late joiners see open requests | ✅ "Earlier requests still open" appeared for a volunteer who joined after the report | [run] [live] 11 Nov |
| Webhook path (`message:send` → card) | ⚠️ Unit-tested only. Proving it live needs a public HTTPS URL, and deploying is not yet authorised | [test] |
| Push to a locked phone | ❌ Not built. Web has no Nexconn push | [read] docs |

## 3. Defects found in this audit

| # | Severity | Defect | Status |
|---|---|---|---|
| D1 | **P0** | Every QR code on the demo hub and share page returned **HTTP 500**: a blank `PUBLIC_BASE_URL=` was read raw and became `new URL(path, "")`. Judges scanning with phones would hit a broken image. | **Fixed**: now uses the normalised `env()` |
| D2 | P0 | No incident detail. The full history (`incident_events`), every report, reporter source, times and escalation are stored but never shown. | **Fixed**: incident detail sheet with reports, facts and an activity timeline (verified in the browser) |
| D3 | P0 | The organizer cannot assign a request to a specific volunteer, only claim it themselves. A command centre without assignment is not credible. | **Fixed**: leads assign from the incident detail; the assignee gets a private alert (unit-tested and verified in the browser) |
| D4 | P1 | There is no organizer ↔ volunteer conversation, so follow-up happens in WhatsApp. Nexconn direct channels solve this natively. | **Fixed**: direct messages from the crew list and "Message owner" on an incident; inbox with unread counts (verified live in two sessions; channel list falls back, see NEXCONN_DOCS_AUDIT §10) |
| D5 | P1 | The landing page is one hero and four tiles. It does not explain the problem, the proof or Nexconn's role. | **Fixed**: 13-section page with no invented logos, numbers or quotes (checked at 375 px and desktop) |
| D6 | P2 | The attendee category grid leaves orphan tiles ("Lost & found" alone, "Medical" full width). | **Fixed**: Medical leads full width; six tiles in three even rows |
| D7 | P2 | The crew list on the board shows the organizer as "You (organizer)" alongside volunteers. | **Fixed**: the crew list hides the viewer; the demo organizer is named "Organizer" |
| D8 | P2 | If the organizer cookie is lost (new browser), the board says "open your organizer link". The link exists only at creation time. | Documented; the creation page tells the organizer to save it |
| D9 | P2 | The demo `simulate` route projects synchronously while every other route projects in the background. | Low impact (demo only) |

## 4. Judge panel (simulated, skeptical)

These are our own estimates, not the organisers'. Our scores out of 10:

| Lens | Now | After P0/P1 | Strongest objection |
|---|---:|---:|---|
| Completeness & UX (50%) | 6 | 8 | "Can I see what happened to an incident? Can I assign it? Why is the landing page so thin?" |
| Innovation (30%) | 7 | 8 | "Isn't this a Trello board with a chat box?" Answer: no. The chat message itself becomes the claimable card (metadata), and every reporter is closed-looped. |
| Business (20%) | 3 | 3–6 | "Zero users." Only pilots move this, and only the owner can run them. |

**How it compares:**
- **WhatsApp groups** (what crews actually use): instant and free, but requests scroll away, nobody knows who took what, the same issue is reported five times, and attendees never hear back. Baton keeps the chat and adds ownership.
- **Slack + ticketing (Halp and similar):** strong for office teams, but requires accounts. Temporary volunteers will not install Slack for a one-day fest.
- **Event-ops suites (Connecteam, Beekeeper, 247 Software):** per-seat pricing, onboarding and training, built for permanent staff.
- **Task tools (Trello, Asana):** no real-time chat context, no attendee intake, no closed loop.

Baton's wedge: **zero-install, minutes to set up, temporary crews, and attendees in the loop.**

## 5. Track recommendation

**Workplace & Collaboration.** The organisers' own example is a "shift handover channel". This is frontline crew coordination with DMs and threads, and it scored 30/35 in our six-track analysis (`NEXCONN_RESEARCH.md` §5).

Runner-up: Humanitarian & Social Good, since "volunteer dispatch rooms" is an organiser example. It has a weaker traction story in November. Tracks carry no separate prizes, so the track is only framing. **Registration is unchanged.**

## 6. Positioning

> **Baton — real-time incident coordination for event crews. Every report gets acknowledged. Every incident gets an owner. Every action has a visible outcome.**

For whom: organizers of college fests, DevFests, hackathons, meetups and community events who run 10–150 volunteers through WhatsApp today.

## 7. The differentiator (one, cohesive)

**The closed loop on a live chat message.** One Nexconn message is the incident:
- reports merge into it;
- the claim flips it on every phone;
- the organizer sees its full history;
- the people who reported it are told who is on it and when it is fixed.

This is not a feature list. It is one object moving through states, visible to everyone who cares about it. Message metadata is what makes it possible without a separate sync layer.

## 8. Biggest qualification risks

1. **Zero real users.** The Business score (20%) and the traction bonus depend on pilots and Console MAU. *Owner action.*
2. **Growth Credit not confirmed.** On the standard Free plan new connections fail beyond about 100 concurrent users. *Owner action: enrol and screenshot.*
3. **Not deployed.** Judges need a public URL. Deploying is currently forbidden; it must be authorised before about 18 Nov.
4. **Webhook path not proven live.** It depends on deploying.
5. **The video and write-up are not produced yet.**
