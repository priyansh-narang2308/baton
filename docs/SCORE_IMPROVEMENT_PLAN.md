# Baton — score improvement plan (12 Nov 2026)

These are **our estimates, not the judges'.** Scores count only what a judge can open and check. The rubric is the published one: Completeness & UX 50%, Innovation & scenario value 30%, Business & growth 20%, plus the documented bonus for real users. Source: `NEXCONN_RESEARCH.md` §2.

| | Today | With P0 done (earlier audit) | Stretch target |
|---|---:|---:|---:|
| Completeness & UX | 4 | 8 | 9.3 |
| Innovation & scenario value | 7.5 | 8 | 9.0 |
| Business & growth | 2 | 6 | 9.0 |
| **Weighted** | **4.8** | **7.6** | **9.15** |

**Can 9+ be reached?**
- Engineering alone gets Completeness to about 8.5–9 and Innovation to about 8.5.
- **Business 9 needs real pilots with recorded use.** Without at least one real event, Business stays at 6 or below, and the weighted score cannot pass about 8.2.
- 9+ is possible only if the pilot happens. That depends on you, not the code.

## 1. Why each category is stuck below 9

"You?" means the step needs your action: an account, a decision or outreach.

### Completeness & UX (50%)

| # | Problem | Where | Judge impact | Fix | Effort | Verify | You? |
|---|---|---|---|---|---|---|---|
| C1 | **Not deployed.** No URL, so a judge can run nothing. | No host config existed before today | Fatal: "live public URL" is mandatory | `Dockerfile`, `.dockerignore` and `docs/DEPLOYMENT.md` added today. Railway fits: long-lived Node worker plus Postgres. | 2 h after go-ahead | `/api/health` returns ok on the public URL; full scenario on 2 phones | **Yes:** authorise the host, create the account, paste the secrets into the host (not chat) |
| C2 | The demo needs an operator. A judge has to create an event and juggle sessions. | `src/app/demo/[eventId]/demo-hub.tsx` exists | A judge who gets lost scores UX low | Make the landing page "Try the live demo" go straight to the demo hub, with the organizer, volunteer and attendee views one click apart. Label it "Demo" everywhere (already done in the UI). | 2 h | A fresh browser profile reaches a claimed incident in under 60 s | No |
| C3 | No alert when the tab is closed (Nexconn Web has no push). | Platform limit, research §I | A volunteer misses an assignment | Leave the limit as is. Optional: a Web Notification while the tab is in the background. Document the limit honestly. | 3 h (optional) | Background tab receives the Notification | No |
| C4 | The direct-message inbox fell back to N history queries because the channel list "returned 35011". **Fixed today:** 35011 was a timing race in our code, not an App Key restriction (see §3). | `src/lib/nexconn-client.ts` `listDirectThreads` | Server-backed unread counts now work; the fallback remains | Done | — | `createChannelsQuery` returned code 0 live (12 Nov) | No |
| C5 | Laptop screens looked like a phone app. **Fixed today:** shared app shell for the crew app and the command centre. | `src/components/app-shell.tsx` | "Cheap" impression removed | Done | — | 1440×900 and 375×812 checks | No |
| C6 | No end-to-end proof with separate identities in one run. | Tests are per-function | A claim we can't show | `scripts/e2e-scenario.mjs`: separate cookie jars for the organizer, 2 volunteers and 2 attendees, run against the real server | 2 h | Script exits 0 and prints each step | No |

### Innovation & scenario value (30%)

| # | Problem | Where | Judge impact | Fix | Effort | Verify | You? |
|---|---|---|---|---|---|---|---|
| I1 | The parts exist elsewhere (QR team join, ticket from message). Only the combination is new. | `COMPLETE_PROJECT_AUDIT.md` §3 | Reads as "a nice ticketing app" | Lead every surface with the **closed loop**: the reporter is told who has it and when it's fixed, and Baton Pass is never ownerless. Show both in the first 30 s of the video. | Copy plus video | Can a stranger restate the idea after 30 s? | Record video |
| I2 | Calling isn't built. An escalation voice huddle is the obvious "wow". | Research §C | The optional SDK goes unused | Real 1:1 audio from the incident detail, once the Console calling service is on. **Blocked:** service plus card. | 1 day after unblock | Two devices in a real call; the call is logged in the incident timeline | **Yes:** Console switch; no payment by us |
| I3 | Metadata-driven live cards are invisible as "Nexconn". | Projection | Judges may think it's our own websocket | A one-line "Live via Nexconn" footnote on the card detail plus a write-up diagram (exists in ARCHITECTURE) | 30 min | Visible in the UI | No |

### Business & growth (20%)

| # | Problem | Where | Judge impact | Fix | Effort | Verify | You? |
|---|---|---|---|---|---|---|---|
| B1 | **Zero real users.** "Judges count the active users on your Nexconn app." | Impact report filters `is_simulated` | The largest single gap: about 3 points of Business | Book one real event or rehearsal (college fest desk, hackathon, meetup) between 15 and 19 Nov. The kit is in `TRACTION_PLAN.md`. | Your outreach, 1 evening | Impact report on the real event; Nexconn Console user count | **Yes** |
| B2 | No pricing or willingness-to-pay evidence | — | "Who pays?" goes unanswered | Ask the 3 pricing questions in the pilot debrief (TRACTION_PLAN §5) and report the answers verbatim | 10 min per pilot | Written answers | **Yes** |
| B3 | The pilot needs deployment first | C1 | Blocks B1 | Deploy first | — | — | Yes |

## 2. What we will not do (it wouldn't move the score)

- **Dark theme.** It conflicts with your 11 Nov light-theme choice.
- **Video calling.** No user need for it.
- **AI deduplication.** Rules are explainable and tested.
- **Fake analytics or testimonials.**
- **Using every Nexconn API.** Read receipts and typing indicators add nothing for crews acting on cards.

## 3. Nexconn findings from today

- **35011 explained** (verified in the installed `@nexconn/engine` 26.2.1):
  - The engine refuses conversation-list calls with `METHOD_NOT_AVAILABLE` while two app config bits are on and its post-connect sync (`markOnline` → `ugSynced`) hasn't finished.
  - We called it once, right after connecting, and then disabled it for the whole session.
  - We now retry up to 3 times at 1 s intervals.
  - Live result on 12 Nov: code 0, with the channel returned.
  - **The ask to Nexconn support is no longer needed.**
- **Chat UI (`@nexconn/chatui` 26.2.5, Lit web components):**
  - It reuses the same `NCEngine` connection; the quickstart says to initialise `NCEngine` first and that it owns the connection. So it can coexist with our custom views.
  - Costs: a version bump of all three packages to 26.2.5; our `BTN:*` incident cards would show as unknown messages inside its group view; and "portrait mobile browsers are not a supported target".
  - **Decision:** a half-day isolated spike for the **desktop Messages pane only** (DMs), after deployment. Phones keep our SDK views.
- **Call:** unchanged. `@nexconn/call` 26.2.1 exists. Enabling the calling service and the free minutes need your Console and card decision (research §C).

## 4. Order of work (10 days)

| Day | Engineering (me) | You |
|---|---|---|
| 12 Nov | Score plan, 35011 fix, deploy config, e2e scenario script, laptop layouts ✅ | Decide the host; start outreach (3 messages) |
| 13 Nov | Judge entry path (C2), "Live via Nexconn" cue (I3); Chat UI spike if time allows | Create the host account, add the secrets, say "deploy" |
| 14 Nov | Deploy; run the e2e script against the public URL; 2-phone test | Console: webhook URL and domain allowlist (steps in DEPLOYMENT.md) |
| 15–17 Nov | Call MVP if the Console is enabled; fix findings | **Run the pilot** |
| 18–19 Nov | Fix pilot findings; impact report on real data | Collect feedback and permission to quote |
| 20–21 Nov | Video, write-up PDF, repository cleanup, submission audit | Record the video; make the repository public |
| 22 Nov | Buffer only | Submit |

## 5. Evidence a 9 would need (none of it exists yet)

1. A public URL that a judge opens on a phone and reaches a claimed incident in under a minute.
2. One real event: the impact report shows non-simulated reports, the median time to an owner, and the number of Nexconn users. The Console active-user count matches.
3. A pilot organizer's own words, quoted with permission, plus at least one change we made because of them.
4. A 3-minute public video showing two real devices.
5. (Stretch) A real voice huddle from an incident.
