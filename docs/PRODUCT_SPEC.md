# Baton 2.0 — Product spec (MVP lock, 28 Oct 2026)

## Identity
- **Name:** Baton (working name; trademark check before launch)
- **Positioning:** *The group chat where every request gets an owner.*
- **Audience:** organising teams of college fests, hackathons, meetups/DevFests and small conferences (20–300 crew); their attendees.
- **Problem:** temporary crews coordinate in WhatsApp. Requests scroll away, the same issue arrives five times, two volunteers go while another issue is ignored, and the people who reported it never hear back.
- **Value:** set up in 2 minutes with QR codes; every issue becomes one owned, live card; everyone who reported it is told when it's handled.
- **Three differentiators**
  1. **One issue, many reporters** — duplicate reports consolidate into one incident; status fans out to every reporter exactly once.
  2. **State lives on the message** — the card in the crew chat *is* the incident, updated live on every device (Nexconn message metadata).
  3. **Named escalation** — unclaimed incidents ping a specific on-duty lead, not the whole group (Markey 2000 bystander research).

## Vocabulary
- **Report** — one submission by one person (attendee help page, or a crew message turned into a request). Never edited or deleted.
- **Incident** — the claimable unit. Has ≥1 report, a zone, a category, a priority, a status and an owner.
- **Zone** — a named place (Gate 3, Hall B). Attendee QR posters encode a zone.

## Roles & journeys
**Organizer (desktop-first):** sign in → create event (name, dates, zones) → get crew QR + one attendee QR per zone (printable) → board shows Open / Claimed / Done incidents with report counts, ages, owners; crew list with presence → merge/split, reassign, resolve → end event → summary (real counts).

**Volunteer (mobile web / PWA):** scan crew QR → name, zone, on-duty → crew stream (chat + incident cards) → tap **I'll take it** → card flips everywhere → message reporters from the card → **Mark fixed** → reporters notified. Enable alerts (Web Push) during onboarding.

**Attendee (mobile web, no account):** scan zone QR → pick a chip (Water & supplies, Cleanliness, Directions, Tech/AV, Lost & found, Medical*, Other) + optional text → status timeline: *Sent → Seen → Riya is on it → Fixed* → optional 👍/👎. "N others reported this too" shown when attached. *Medical/safety chips show "For emergencies call 112" first.

## Signature demo (three devices, ~30 s)
1. Attendee phone A (Gate 3 QR): "Water" + "dispenser empty". Crew phone + organizer board: new card **Water & supplies · Gate 3 · 1 report** with **I'll take it**.
2. Attendee B and C (same QR) report "no drinking water". The **same card** ticks to **3 reports**; no new cards, no extra buzz on crew phones (auto-attach: same zone + category + 20 min, non-sensitive).
3. Volunteer taps **I'll take it** → card turns blue "Riya · on it" on every crew device and the board; A, B and C all see "Riya from the crew is on it".
4. Riya taps **Mark fixed** → all three attendee screens show "Fixed".
5. Second beat: a free-text attendee report from another zone ("water near entrance") shows a **"Same issue as #12? Merge / Keep separate"** suggestion on the card — a human decides.
6. Third beat: an urgent incident nobody claims → only the named lead's phone is notified after the timer.

## MVP scope (must work, 10/10 runs)
1. Organizer auth; event + zones; crew & zone QR codes; rotate crew join code.
2. Crew join via QR (signed cookie identity) → Nexconn token → connect; crew group channel.
3. Crew stream: text messages, history, incident cards rendered from metadata, connection banner, reconnect handling.
4. Attendee help page: chips + text + zone → report → incident (new or attached) → live status page.
5. Claim / release / resolve with DB-atomic ownership; metadata projection; status messages to every reporter (deduped).
6. Consolidation v1 (deterministic): auto-attach rule + suggestion with Merge / Keep separate; Split.
7. Organizer board (incidents, counts, owners, ages, crew presence).
8. Named escalation worker (unclaimed past threshold → targeted group message + Web Push to the lead).
9. PWA + Web Push for crew (urgent incidents, escalations).
10. "Try Baton live" sandbox: private event, three role links + QR codes; optional clearly-labelled simulated reporters.

## Differentiating (after MVP is solid)
- Crew free-text → incident ("make this a request" one tap; optional AI suggestion).
- Optional AI tie-breaker for consolidation suggestions (never auto-merge on AI alone).
- Attendee live board (open channel announcements).
- Event summary page (median time-to-claim/fix, duplicates absorbed — real data only).

## Deferred (not in submission unless everything above is done)
Call SDK; native/Flutter apps; translation; multi-event org billing; zone-specific sub-channels; SSO; exports beyond CSV; pre-messaging webhook.

## Consolidation rules v1 (deterministic)
Candidates: incidents in the **same event**, status `open` or `claimed`, created ≤ 30 min ago.
- `zone`: same zone +0.45; unknown 0; different −1 (blocks).
- `category`: same +0.30; different −1 (blocks).
- `text`: Jaccard overlap of normalised keywords (lower-case, stop-words removed, small synonym map e.g. *drinking/dispenser/bottle → water*) × 0.20.
- `time`: ≤10 min +0.05, linear to 0 at 30 min.
- **Auto-attach** if score ≥ 0.75 **and** zone + category came from structured input **and** the incident is ≤ 20 min old **and** category ∉ {medical, safety, lost_person, harassment}.
- **Suggest** if 0.45 ≤ score < 0.75 (or sensitive) — shown on the new card; Merge / Keep separate.
- Otherwise new incident.
- Every merge/split writes an audit event; Split moves a report to a new incident and notifies only that reporter.

## Success metrics (pilots)
Reports submitted, duplicate rate, incidents claimed, median time-to-claim, median time-to-fix, % reporters notified of fix, unclaimed escalations, volunteer/organizer feedback.
