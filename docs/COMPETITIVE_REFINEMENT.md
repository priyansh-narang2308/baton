# Competitive refinement — Baton 2.0

Timeboxed review, 28 Oct 2026. Builds on `docs/NEXCONN_RESEARCH.md` (§9.5 teardown). Vendor claims are taken from their own marketing pages and are marked as such.

## 1. Verified competitor capabilities

| Capability | Quick Team Connect | Tapsy | Atlassian Assist (Slack/Teams) | Evalu-8 (stadium safety) | E4Many / 247 Software / teamSOS | WhatsApp group |
|---|---|---|---|---|---|---|
| QR join, no app, no account | **Yes** ("scan a QR code to join the session") | Guest QR/NFC for feedback, not team join | No (workspace accounts) | Reporter side only | No (staff accounts) | Invite link |
| Temporary / ad-hoc teams | **Yes** (frontline, event volunteers, ad-hoc) | No | No | No | Partly (event staff) | Yes |
| Real-time issue reporting | **Yes** (members report, staff "Receive Reports") | "Issue reporting" via feedback flow | Yes (from channel messages) | **Yes** (attendees via browser) | Yes (staff) | Free text |
| Request ownership / claiming | Not mentioned | Not mentioned | Assign in Jira; no native claim-in-chat found | **Case assignment** | **Assign team members** | No |
| Escalation | Not mentioned | Not mentioned | Via JSM automation | Not detailed | Chain of command (manual) | No |
| Message → task | Not mentioned | No | **Yes** (🎫 reaction or auto-create from messages) | Form → case | Form → incident | No |
| Live status sync | "track progress in real-time" | Real-time dashboards (feedback) | Ticket status in Jira | Not detailed | Yes (ops view) | No |
| **Duplicate report consolidation** | Not mentioned | "theme grouping" of ideas (analytics, not live) | Not found | Not found | Not found | No |
| Attendee ↔ crew loop (reporter sees who is coming) | No | No | Requester gets ticket updates (employees only) | Not detailed | No | No |
| Automatic routing | Not mentioned | Not mentioned | JSM rules | "right people notified" | Manual | No |
| Price signal | Free account, pricing unpublished | €99/mo + €10/point | JSM per-agent | ~£120/mo (vendor listing) | Enterprise | Free |

Sources: quickteamconnect.com (read in browser), tapsy.ai, Atlassian Community threads (May 2026, Mar 2025), evalu-8.com product pages (via search), E4Many App Store listing, 247software.com, teamsos.co.uk.

## 2. Actual overlap with Baton 1.0
- **QR onboarding of temporary crews:** Quick Team Connect already does this. **Not a differentiator.**
- **Attendee QR incident reporting with staff assignment:** Evalu-8 (stadiums), EHS tools (VelocityEHS, Dakota). **Not a differentiator.**
- **Message → task:** Atlassian Assist does it for Slack/Teams. **Not a differentiator.**
- "Volunteers claim tasks generated from messages" alone is **insufficient**, as feared.

## 3. Where none of them go: one issue, many people
At a real event the same problem is reported many times ("water empty at Gate 3" ×3) and nobody tells the reporters what happened. Every tool above treats reports as independent rows; the crew sees duplicates, two volunteers walk to the same spot, and reporters never hear back. No reviewed product shows live consolidation of duplicate reports with status fanned back out to every reporter.

**Baton's defensible interaction — Conversation → Coordination:**
1. Reports (from attendees *or* crew chat) become **one live incident card** in the crew conversation.
2. Further reports of the same issue **attach to that card** (counter ticks up live, "3 people reported this") instead of creating new cards — automatically only when structured signals agree, otherwise as a one-tap suggestion.
3. One volunteer claims; the card flips on every crew device; **every reporter** gets "Riya is on it", then "Fixed", once.
4. Unclaimed incidents nudge a **named** lead, scaled by how many people are affected.

Why it's hard to copy through their current interfaces: it needs the reporting surface, the crew chat and the live message state in one system. QTC has reports but no ownership; Evalu-8 has cases but no crew chat or consolidation; Assist has message→ticket but no public reporters and no shared live card.

## 4. Evaluation of the proposed consolidation feature
| Question | Answer |
|---|---|
| Meaningful differentiation? | **Yes** — the only capability none of the reviewed tools claim; it changes the crew's unit of work from "message" to "issue". |
| Common enough? | Yes — physical issues (supplies, queues, facilities, AV) are seen by many attendees at once; the more attendees, the more duplicates. We will measure the duplicate rate in pilots rather than assert it. |
| Immediately understandable? | Yes — a live "3 reports" counter on one card is self-explanatory. |
| Reliable by deadline? | Yes if deterministic first (see rules). Merge/split are DB operations; the card is one message whose metadata updates. |
| Expensive/slow dependencies? | None required. AI is an optional tie-breaker later. |
| Wrong merges? | Auto-attach only when zone (from the QR poster) **and** category match within 20 min and the category is not sensitive; everything else is a suggestion a human confirms. Medical, safety, lost-person and harassment reports are **never** auto-merged. One-tap **Split** restores a report to its own incident. Original reports are never edited or deleted. |
| Repeated notifications? | DB-enforced unique `(incident, recipient, state)` notification key; attaching a report updates the existing card (metadata) instead of posting a new one. |
| Disconnected users? | State is in Postgres; attendee page and crew app re-read on reconnect; DM history holds status messages. |
| Works without AI? | Yes — zone + category + time + normalised-keyword overlap. |
| Worth the demo time? | Yes — it is the 10-second "oh" after the core claim loop; two extra attendee tabs are enough to show it. |

## 5. Weaknesses we accept and how we handle them
- QTC/Evalu-8 can add ownership — our moat in the hackathon is execution + the consolidated, closed loop; commercially it's the crew+public combination.
- Web SDK has no push (research §3.10 #1) → PWA + Web Push in the MVP.
- Traction depends on pilots → outreach starts now (`docs/TRACTION_PLAN.md`).

## 6. Final product decision
**GO with Baton 2.0.** Signature feature: **incident consolidation with closed-loop status to every reporter**, built deterministic-first with suggest-and-confirm. In-chat request conversion (crew free text → card) stays, but as the secondary beat. No pivot.
