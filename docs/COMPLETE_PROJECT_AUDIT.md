# Baton — complete project audit (12 Nov 2026)

Written as a skeptical judge. Tags:
- **[run]** done in the browser today.
- **[live]** done against the real Nexconn service.
- **[test]** automated test.
- **[read]** code read only.

Earlier audits are `PRODUCT_AUDIT.md` (11 Nov) and `NEXCONN_DOCS_AUDIT.md`. This file supersedes their status columns.

## 1. Competition, as published (not inferred)

Source: `NEXCONN_RESEARCH.md` §2, taken from reskilll.com/hack/nexconn.

- **Deadline:** 22 Nov 2026, 23:59 AoE (23 Nov, 17:29 IST). Judging runs 23–27 Nov; results on 1 Dec. There is no qualifying round.
- **Weights:** Completeness & UX 50%, Innovation & scenario value 30%, Business & growth 20%.
- **Mandatory:** a write-up PDF with the **App Key** and the Nexconn features used; a public demo video; a live public URL; a public GitHub repository; the App Key in the form.
- **Chat SDK is mandatory**, and "Chat UI counts as Chat SDK usage". The Call SDK is optional.
- **Bonus:** proof of real users. "Judges count the active users on your Nexconn app."
- **Tracks are framing, not separate prizes:** "Use the other tracks as ideas, not as limits."
- **Case studies and template:** the brief refers to "five case studies and the provided template". **None exist for this hackathon in the workspace.** The only such set on this machine is `../tata-elxsi/Case Studies And Template/`, which belongs to the Tata Elxsi hackathon (predictive maintenance, battery systems and so on). Comparing Baton against those would be meaningless, so this audit does not.

### Track: Workplace & Collaboration

| Track | Fit | Why / why not |
|---|---|---|
| **Workplace & Collaboration** | **Strongest** | The organisers' own example is a **"shift handover channel"**, which is literally the Baton Pass. Frontline crew coordination with team threads and DMs is the core of the product. |
| Humanitarian & Social Good | Good runner-up | "Volunteer dispatch rooms" fits. But NGO pilots are slower to land in November, and the framing invites "accessibility" expectations Baton doesn't target. |
| Marketplace & Support | Weak | The "human agent dispatch center" is about customers and agents. Our requesters are attendees with no account, and there is no commerce. |
| Social, Gaming, Open | Poor | No social graph or live stream. Open Innovation dilutes the story. |

The team leader selects the track on Reskilll. **Registration is unchanged.**

## 2. Implementation audit

| Area | Current status | Evidence | Missing work | Priority |
|---|---|---|---|---|
| Authentication | **Works.** No accounts by design: an HMAC-signed, HTTP-only cookie per role and event. Organizer capability link to restore access. Crew join by QR code. Attendees anonymous. | `src/server/session.ts`, `src/server/http.ts` (`crewActor`, checks every route against the event in the URL) [read] [run] | No recovery if the organizer loses both the cookie and the link (documented on the creation page). | P2 |
| Incident reporting | **Works** from the attendee QR page, the crew composer, and crew chat (manual "Make it a request", plus detection rules). | `submitReport` in `incidents.ts`; `/api/e/[slug]/reports`; `chat-intake.ts`; `detection.test.ts` [test] [run 12 Nov] | Chat detection from the webhook is not live until deployed. | P0 (deploy) |
| Deduplication | **Works.** Auto-attach only when zone + category + 20-min window match and the category isn't sensitive. Otherwise a suggestion a human confirms; medical and safety are never auto-merged; Split undoes. | `consolidation.ts`, `consolidation.test.ts`, `incidents.test.ts` "suggests (never auto-merges) medical" [test] [live 11 Nov] | No fuzzy text match across zones (deliberate). | — |
| Ownership and claims | **Works.** Claim is one conditional `UPDATE … WHERE status='open'`; the loser gets "X got it first". Lead assignment is version-checked. **Baton Pass added 12 Nov:** owner offers with a note; the teammate accepts atomically; it is never ownerless. Decline, cancel, and void on release, fix or assign. | `claimIncident`, `assignIncident`, `offerPass`, `acceptPass`, `endPass`; 6 new pass tests including a 5-round accept-vs-release race [test]; organizer → Riya pass across two sessions [run] [live 12 Nov] | Passes don't expire on their own (the owner keeps it, so nothing is lost). | P2 |
| Nexconn Chat SDK | **Real and central.** Init and connect once, token from server, group history, custom types, `onMessageMetadataUpdated`, direct channels, targeted messages. | `src/lib/nexconn-client.ts`; the pass offer reached Riya's tab without reload as a targeted `BTN:Nudge`, and the card updated from metadata [live 12 Nov] | Channel list returns 35011 (fallback in place). No Web push (platform limit). | P1 (ask Nexconn) |
| Nexconn Chat UI | **Not used, deliberately.** It doesn't render message metadata, and "Portrait mobile browsers are not a supported target". | NEXCONN_COMPLETE_DOCUMENTATION_RESEARCH §B | Only revisit for the desktop inbox if 35011 is resolved. | P3 |
| Nexconn Call SDK | **Not built; no button in the UI.** The Console calling service is not confirmed on, and the free minutes need a card. | Research §C (design and unlock steps) | Owner enables the service, then about a day of work. | Owner decision |
| Chat Server API | **Works.** Signed client with failover; token issue; group create and join; group send with metadata; metadata set; targeted sends; direct sends. | `src/server/nexconn/api.ts`, `sign.test.ts`, `projection.test.ts` [test] [live] | — | — |
| Webhooks | **Implemented, not live.** Signature, ±5 min freshness, envelope dedupe, sender membership check, `after()`. | `webhook/route.ts`, `webhooks.test.ts` [test] | Needs a public HTTPS URL and the Console webhook setting. | P0 (deploy) |
| Database synchronisation | **Works.** Postgres decides; projection runs after the response, serialised per incident; a 60 s repair loop; clients ignore stale metadata versions. | `projection.ts`, `worker.ts`, `use-event-state.ts` [test] [live] | — | — |
| Escalation | **Works.** Unclaimed incidents alert the zone lead, then event leads, via targeted messages; urgent escalates sooner. | `takeDueEscalations` test [test] | — | — |
| Responsive UI | **Works** at 375 px and desktop: no horizontal overflow on any page (checked 11 Nov); landing motion re-checked 12 Nov. Light "sunset coral" theme across all pages, at the owner's request (11 Nov). | Browser checks [run] | See §4 on "dark interface". | — |
| Deployment | **Not done.** No host chosen; no Dockerfile or host config in the repo. Needs a long-lived Node process (worker loops) and Postgres. | `ls` shows no deploy files | Owner authorises a host and creates accounts; then about 2 hours of work. **Without a URL the submission is incomplete.** | **P0** |
| Traction | **Zero real users recorded.** Demo and simulated users are flagged and excluded by the code. | `TRACTION_PLAN.md`; impact report filters `is_simulated` | Pilots or a labelled rehearsal before about 18 Nov. | **P0** |

### Prior claims re-verified on 12 Nov

| Claim | Result |
|---|---|
| "82 passing tests" | Was 89 before today; **95/95 now**, including the new pass tests [run] |
| Two-session real-time sync | Re-proved today with a different flow: an organizer-to-volunteer pass offer and acceptance, live in both tabs [live] |
| Duplicate-report protection, atomic claims | Covered by tests that run against real Postgres [test] |

## 3. Product re-evaluation

**What competitors already do** (`COMPETITIVE_REFINEMENT.md`):
- QR onboarding of temporary teams: Quick Team Connect.
- Attendee incident forms with case assignment: Evalu-8.
- Message → ticket: Atlassian Assist.

None of these alone is a differentiator.

**What Baton does that they don't, in one object.** One Nexconn message *is* the incident:
- duplicate reports merge into it;
- one claim flips it on every phone;
- it can be **passed** with a note and is never ownerless;
- every reporter is told who has it and when it's fixed.

**Why an organizer would switch from WhatsApp.** They don't switch: Baton runs next to the WhatsApp group and takes the operational requests out of it. There is no install and no accounts, and setup takes minutes.

**Why Nexconn is essential, not replaceable by a database and polling:**
- message metadata gives live card state on every phone without our own socket layer;
- targeted group messages give private alerts in the room volunteers already watch;
- direct channels reach attendees after they leave the page.

**The WOW test (30 seconds).** "Three people report the same empty water station; one card says '3 reports'. Riya taps 'I'll take it' and all three reporters see 'Riya is on it'. Riya's shift ends, she passes it with a note, and Arjun takes the baton." A judge understands that in one watch. The name now *means* something in the product.

**What we deliberately did not build:**
- AI deduplication: rules are explainable and testable.
- A Chat UI wrapper: it can't render our state on phones.
- A fake call button.
- Dashboards without data.
- Five more features.

## 4. Brief items that conflict with earlier decisions

1. **"Professional dark interface".** On 11 Nov you asked for every page to match the light sunset-coral landing page, and that was done and committed (6ef16f1). Switching to dark now would undo a fresh decision of yours and cost a day for no scoring gain we can show. **I have not changed the theme.** If you want dark mode, it is a token swap in `globals.css`, but it's your call.
2. **"Implement Call SDK voice huddles".** Blocked on your Console and card decision (research §C). I won't ship call code we can't run once.
3. **"Use Chat UI wherever valuable".** No place passes the bar today (research §B).
4. **New files the brief named:** `JUDGE_DEMO_SCRIPT.md` and `SUBMISSION_READINESS.md` are the old `DEMO_SCRIPT.md` and `SUBMISSION_CHECKLIST.md`, renamed and updated, so the repository doesn't carry two diverging copies.

## 5. Judge evaluation (our estimate, not the organisers')

Scored on what a judge could **see today**, and then as it would stand with the P0 owner actions done.

| Criterion | Weight | Today | With P0 done | Evidence | Remaining weakness |
|---|---:|---:|---:|---|---|
| Completeness & UX | 50% | **4** | **8** | The full loop works live: report → merge → claim → pass → fix → reporter told. 95 tests; responsive; no console errors | **No public URL**, so a judge cannot run anything today. No push when the tab is closed. |
| Innovation & scenario value | 30% | **7.5** | **8** | One live message *is* the incident; consolidation plus the closed loop to reporters; Baton Pass matches the organisers' "shift handover" example | The individual parts exist elsewhere; the combination is what's new. |
| Business & growth | 20% | **2** | **6** | Clear customer (fest and community organizers); zero-install wedge; pilot kit ready | **Zero real users**; no pricing validated. |
| **Weighted** | | **4.8** | **7.6** | | |

### The 13 questions

1. **Differentiated?** Yes, as a combination: consolidation, a closed loop to reporters, and never-ownerless handover on one live message. No single part is unique.
2. **Nexconn central?** Yes. Every live update on every phone travels over Nexconn (metadata, targeted, group and direct).
3. **Chat SDK real and demonstrable?** Yes, live in two sessions today.
4. **Chat UI integrated?** No, deliberately, with cited reasons.
5. **Call SDK integrated?** No. Blocked on the owner's Console and card decision.
6. **Backend APIs and webhooks correct?** The Server API is proven live. Webhooks are correct in tests but not yet live.
7. **Works end to end?** Locally, yes. Publicly, **no**: it isn't deployed.
8. **Commercially credible look?** Yes: a consistent theme across pages and a polished landing page.
9. **Exceptional UX?** Good on phones; the incident detail is strong. Not "exceptional" while a closed tab misses alerts.
10. **Genuine traction?** **None yet.**
11. **What would make a judge reject it?** A dead URL or no URL, a private repository, a video that isn't public, or an App Key mismatch.
12. **Single biggest weakness?** **It isn't deployed**, and with no URL, zero users follows.
13. **Fix immediately:** authorise a host so we can deploy (half a day), then enrol Growth Credit and book one real event or a labelled rehearsal before 18 Nov.
