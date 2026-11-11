# Baton — traction kit (11 → 21 Nov 2026)

**Honest status on 11 Nov:** this repository records no real pilot, user or feedback yet. Everything below is a plan and a set of tools. Nothing in it may be presented as a result until it has happened.

The judges count active users on our Nexconn app. MAU is counted per calendar month, so **November usage is what counts**. Demo and simulated users are flagged (`is_simulated`, demo events) and must be excluded from every number we report.

---

## 1. Who to ask (in order of likely yes)

1. **Your own college or club:** a fest committee, coding club, NSS or volunteer cell, department event. You can be in the room.
2. **Friends who volunteer:** each crew lead is a warm introduction.
3. **Community events in 14–20 Nov:** GDG / DevFest chapters, meetups (Luma, Meetup, Commudle), hackathons (Devfolio, Unstop, MLH), NGO drives, sports days.
4. **Fallback that still counts honestly:** a **rehearsal** with 10+ real people (your class or club) running a 20-minute mock event. Report it as a rehearsal, not an event.

A good fit has 10–150 volunteers, more than one physical location, and a lead who currently coordinates in WhatsApp.

## 2. Outreach messages (copy, then personalise the brackets)

**Cold message (email or DM)**
> Hi [name], I'm building Baton, a free tool for event crews. Volunteers join by QR code with no app; attendees report problems by scanning a poster; duplicate reports merge into one task; and everyone can see who is handling it, including the person who reported it. Could I set it up for [event] on [date]? It takes about 10 minutes, runs alongside your WhatsApp group, and I'll be on call during the event. All I'd ask is 5 minutes of feedback afterwards.

**Warm message (someone you know)**
> Hey! You're running [event], right? I built a tool for exactly the "who's handling Gate 3?" chaos. Can I set it up for your volunteers? It's free, they just scan a QR. I'll be around on the day to help.

**Follow-up (3 days later, once only)**
> Following up on Baton for [event]. Happy to do a 5-minute demo on a call, or just send you the link to try it yourself: [demo link]. No worries if the timing doesn't work.

**Rehearsal invite (club or class)**
> Need 15 people for 20 minutes on [day]: we're stress-testing an event coordination app. You'll play volunteers and attendees on your own phone. No install.

## 3. Discovery questionnaire (10 minutes, before the event)

Ask these on the setup call. Write down their words, not your summary.

1. How many volunteers, and how many locations or zones?
2. How do volunteers get requests today? (WhatsApp group, radio, calls, in person)
3. Tell me about the last time something went wrong at an event. How long until someone handled it?
4. How do you know who is handling what right now?
5. Do attendees have a way to report problems? What happens to those reports?
6. Who are the leads, and who should be alerted if something sits unhandled?
7. What would make you stop using a tool halfway through the event?
8. After the event, what would you want to know?

## 4. Pilot guide

**Before the event (day −2 to −1)**
- [ ] Create the event together on the deployed URL; add the zones they named.
- [ ] Organizer saves the organizer link (it restores access on another device).
- [ ] Print one attendee poster per zone from the QR page; share the crew QR in their volunteer group.
- [ ] 2-minute volunteer briefing: "Scan, type your name. When you see a card, tap *I'll take it*. When it's done, tap *Mark fixed*."
- [ ] One test request during the briefing, end to end.
- [ ] Confirm consent wording: volunteers' first names are visible to the crew; attendees are anonymous.

**During the event**
- [ ] Keep the command centre open; watch "Needs an owner" and "Longest wait".
- [ ] Note every confusion or bug with the time (a phone note is fine). Do not hot-fix production during the event unless it is broken.
- [ ] Photograph posters in place, only with the organizer's permission and with no faces unless consented.

**After the event (within 48 h)**
- [ ] Export the impact report (screenshot or print).
- [ ] Organizer feedback (section 5); volunteer feedback from 3–5 people.
- [ ] Write the changelog entries that came from their feedback, with dates.
- [ ] Ask for a quote **and** explicit permission to use it with name, role and event.

## 5. Feedback flow

Until the in-app form is built (IMPLEMENTATION_PLAN P1-3), use a short form or a voice call. Keep the questions identical across events so the answers are comparable.

**Organizer (5 questions)**
1. On a scale of 1–5, how useful was Baton during the event?
2. What is one thing that worked better than your usual way?
3. What is one thing that got in the way?
4. Would you use it at your next event? (Yes / Maybe / No, and why)
5. May we quote you? (Name / role only / anonymous / no)

**Volunteer (2 questions)**
1. Was it clear which requests were yours? (Yes / Mostly / No)
2. What confused you, if anything?

Consent rule: no quote, name, photo or logo is used publicly without a written yes that names exactly what will be used.

## 6. Testing checklist for each pilot (run on the deployed URL the day before)

- [ ] Event creation and organizer link on a second browser.
- [ ] Crew join by QR on an Android phone and an iPhone.
- [ ] Attendee report by poster QR, with no account, on both phones.
- [ ] Two reports at the same zone and category merge into one card ("2 reports").
- [ ] Two volunteers tap *I'll take it* together: one wins, the other sees who.
- [ ] *Mark fixed*: the attendee's page shows "Fixed".
- [ ] Crew chat "need water at Gate 3": becomes a request (webhook path).
- [ ] Assign from the command centre: the assignee sees the alert.
- [ ] Organizer ↔ volunteer message both ways.
- [ ] Phone locked for 2 minutes, then unlocked: the state is correct.
- [ ] Impact report loads and excludes simulated activity.

## 7. Evidence plan (what goes in the submission)

For each real event or rehearsal, collect only what actually happened:

| Evidence | Source |
|---|---|
| Date, type, real vs rehearsal | Your notes |
| Volunteers joined, reports, incidents, duplicates merged, median time to owner and to fix | Impact report (simulated activity is excluded automatically) |
| Platform-side active users | Dated Nexconn Console MAU screenshot, shown next to our own count with the difference explained |
| Screenshots of the command centre during the event | Your screen |
| Organizer confirmation (email or message) that the event used Baton | Organizer |
| Quotes | Only with written consent |
| Product changes made from feedback | Git log plus a changelog line linking the feedback |

If there is no real event by 18 Nov, the write-up says so plainly and shows the rehearsal and the pilot pipeline (who was asked and who said yes for which date). A credible pipeline beats an invented number, which can disqualify us.

## 8. Metrics we report (definitions fixed in advance)

| Metric | Definition |
|---|---|
| Activated event | An event with ≥5 real volunteers joined and ≥10 incidents resolved |
| Active volunteer | Claimed or resolved at least one incident |
| Active attendee | Submitted at least one report |
| Closed loop | An incident resolved whose reporters were all told "fixed" (`notifications` rows) |
| Time to owner / time to fix | Median and p90 from `incidents.claimed_at` / `resolved_at`, from the impact report |
| Duplicates absorbed | Reports minus incidents, for real reports only |

## 9. Calendar

| Date | Action | Owner |
|---|---|---|
| 11–12 Nov | Send 15 messages (section 2); book the rehearsal | You |
| 13–14 Nov | Deploy (IMPLEMENTATION_PLAN P0-1/2); run the section 6 checklist on the deployed URL | You + Claude |
| 15–16 Nov | Rehearsal with 10+ real people; fix what breaks | You + Claude |
| 17–20 Nov | Real event(s) if confirmed; collect evidence | You |
| 20 Nov | Assemble evidence (section 7) into the write-up | Claude |
