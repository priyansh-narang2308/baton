# Traction outreach: from zero to a verifiable pilot

**Status on 13 Nov 2026:**
- No external pilot, user or feedback exists.
- The `/traction` page is built and honestly shows zero external usage.
- The challenge window closes on **22 Nov 2026**, so there are about 9 days left.

This guide covers getting real pilots that will show up on the page, and getting them recorded correctly. `docs/TRACTION_PLAN.md` has the long-form outreach messages and the pilot guide; this document is the short operating version tied to the page.

Nothing below may be presented as a result until it has happened and been verified.

## 1. The target, stated honestly

| What | Minimum worth showing | Good |
|---|---|---|
| Verified pilot events | 1 real event | 2–3 events |
| Verified external active participants | 10 | 30+ |
| Incidents resolved in a pilot | 5 | 20+ |
| Published feedback quotes | 1 organizer | 1 organizer + 2 volunteers |
| Nexconn Console MAU snapshot | 1, captured after the pilot | 1 per share |

A labelled **rehearsal** with 10–15 real people (a class or a club, playing a 20-minute mock event) is the fallback. Rehearsals are allowed on the page but always shown as "rehearsal".

## 2. Who to ask, in order

1. **Your own college or club:** a fest committee, coding club, NSS or volunteer cell, department event.
2. **Friends who lead or volunteer at an event between 14 and 21 Nov.**
3. **Community events in that week:**
   - GDG and DevFest chapters
   - meetups listed on Luma, Meetup or Commudle
   - hackathons on Devfolio or Unstop
   - NGO drives
   - sports days
4. **Fallback:** a rehearsal with your class or club.

A good fit has 10–150 volunteers and more than one location, plus a lead who currently coordinates in WhatsApp.

## 3. Messages

Personalise the brackets. Send each message yourself; do not bulk-message.

**Warm (someone you know)**
> Hey! You're running [event] on [date], right? I built a free tool for the "who's handling Gate 3?" chaos: volunteers join by QR, attendees report from a poster, and everyone sees who owns each request. Can I set it up for your crew? It takes 10 minutes, runs next to your WhatsApp group, and I'll be on call on the day. All I'd ask is 5 minutes of feedback after.

**Cold (email or DM)**
> Hi [name], I'm building Baton, a free coordination tool for event crews, for the Nexconn Build Challenge. Volunteers join by QR code with no app; attendees report problems by scanning a poster; duplicate reports merge; and the reporter sees when it's fixed. Could I set it up for [event]? Setup is about 10 minutes and I'll support you on the day. Here's a 2-minute demo: https://youtu.be/Cyq-dWpizs0

**Rehearsal invite**
> Need 15 people for 20 minutes on [day] to stress-test an event coordination app. You'll play volunteers and attendees on your own phone. No install. [time, place]

**One follow-up, three days later**
> Following up on Baton for [event]. Happy to do a 5-minute call, or you can try it yourself: https://baton.priyanshnarang.in. No worries if the timing doesn't work.

## 4. Consent: say this before the event

Read this to the organizer, and get a "yes" in writing (a chat message is fine):

> Baton records the requests, who claimed them and when, and counts chat messages (not their content) to measure how it helped. Volunteers' first names are visible to the crew. Attendees stay anonymous. After the event I'd like to show anonymous totals on a public page, describe the event as "[proposed public name]", and, only if you agree, quote your feedback. Is that OK?

Keep the reply. It backs the verification note and the permission note you enter in the admin area.

## 5. On the day

- Use the **production** app: https://baton.priyanshnarang.in. Only production counts.
- Create a normal event. Do **not** use "Try the demo": demo events never count.
- If you join the crew yourself, note which device you used so you can exclude it afterwards.
- Do not create test reports in the pilot event during the live event. If you must test during the briefing, use your own excluded phone and say so.
- Note the event's start and end times.

## 6. After the event (within 48 hours)

1. **Feedback.** Ask the questions below. Write down their exact words.
   - Organizer:
     - "How useful was Baton during the event, from 1 to 5?"
     - "What is one thing that worked better than your usual way?"
     - "What is one thing that got in the way?"
     - "Would you use it again?"
     - "May we quote you: by name, by role only, anonymously, or not at all?"
   - Volunteers (3–5 of them):
     - "Was it clear which requests were yours?"
     - "What confused you, if anything?"
     - "May we quote you anonymously?"
2. **Verify the pilot** in `/traction/admin` → *Verified pilots*. Use the public name the organizer agreed to, and write a verification note: who confirmed it, how and when.
3. **Exclude your own identities** in *Identities in verified pilots*.
4. **Add feedback** with the attribution each person chose. Publish only quotes with explicit permission.
5. **Record a Nexconn Console snapshot** (MAU, with the Console's period) the day you share the page. See `docs/TRACTION_METHODOLOGY.md` §5.
6. **Check the page.** Open `/traction` and compare the pilot card with what you saw on the day. If a number looks wrong, investigate before you share it.

## 7. Before sharing `/traction` with judges

- [ ] Run `drizzle/0005_traction.sql` against the production database (`npm run db:migrate` with the production URL). Without it the page shows "temporarily unavailable".
- [ ] Deploy the build that contains `/traction`.
- [ ] Set `TRACTION_ADMIN_TOKEN` in the production environment (32+ random characters, never committed). Leave `TRACTION_SAMPLE_DATA` unset.
- [ ] Record at least one Nexconn Console MAU snapshot with its exact period.
- [ ] Verify each real pilot and exclude the team's identities.
- [ ] Open `/traction` signed out, on a phone and on a laptop. Make sure no names, ids or message text appear and that the "Last updated" time is current.
- [ ] Use "Save as PDF" once and check the printout.
- [ ] Make the GitHub repository public (it currently returns 404 to anonymous visitors).
- [ ] If there is still no pilot, share the page anyway. It shows zero honestly, which is better than a claim judges cannot verify.

## 8. Never

- Never create Nexconn users or send messages to raise numbers.
- Never count invitations, sign-ups or page views as active users.
- Never verify a demo event, a rehearsal as a pilot, or an event you ran with your own test devices.
- Never publish a quote without permission, or a name the person did not agree to.
- Never show an internal estimate in place of the Console MAU figure.
