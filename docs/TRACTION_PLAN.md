# Traction plan (starts now, runs in parallel with the build)

Judges "count the active users on your Nexconn app" (MAU is per calendar month → **November usage is what counts**). Never fabricate; keep demo/test users separate.

## 1. Ideal pilot
A student-run or community event between **8 and 21 Nov 2026** with 15–150 volunteers and a lead who already runs coordination in WhatsApp: college tech fests, GDG DevFests, hackathons, meetups, club events.

## 2. Where to recruit
- Your own college: tech/cultural fest committees, coding club, NSS/volunteer cells.
- GDG chapters running DevFest (Oct–Dec season) — organiser contacts on gdg.community.dev event pages.
- Hackathons on Devfolio / Unstop / Reskilll / MLH in the window — organiser emails on event pages.
- Local meetup groups (Meetup, Luma, Commudle), community Discords/WhatsApp groups where organisers gather.
- Friends who volunteer at events (each volunteer lead = warm intro).

## 3. Why an organiser says yes
Free, set up in 2 minutes, no app for volunteers or attendees, works alongside WhatsApp (not instead of it for day 1), you get a post-event summary of what went wrong and how fast it was handled, and we offer to be on call during the event.

## 4. Outreach message (copy-paste)
> Hi <name> — I'm building **Baton**, a free tool for event crews: volunteers join by QR (no app), attendees report issues by scanning a poster, duplicate reports merge into one task, and whoever claims it is visible to everyone — including the attendee who reported it. I'd love to set it up for <event> on <date>. It takes 2 minutes, runs next to your WhatsApp group, and I'll be on call during the event. In return I'd ask for 5 minutes of feedback afterwards. Interested?

## 5. Onboarding (≤ 15 min of their time)
1. 10-min call or chat: create the event together, add 4–8 zones.
2. Print zone posters (PDF from the app) and share the crew QR in their volunteer WhatsApp group.
3. 2-min volunteer briefing script + 1 test request during the briefing.
4. We monitor live on event day; fix anything within minutes.

## 6. Feedback collection
- In-app: 1-tap rating on attendee "Fixed" screen; volunteer end-of-shift 2-question prompt.
- Organizer: 5-question form within 48 h (what worked, what failed, would you use it again, would you pay, quote permission).
- Consent: explicit checkbox before any quote/name/logo is used publicly.

## 7. Activation metrics
Organizer: event created + ≥5 volunteers joined. Volunteer: claimed ≥1 incident. Attendee: submitted a report and stayed for the status. Event "activated" = ≥10 incidents handled end-to-end.

## 8. Pilot success criteria (internal targets, not promises)
2–3 real events · 20–30 testers · 50+ completed incident workflows · 10+ feedback responses · ≥3 product changes shipped from feedback · ≥1 organiser willing to be quoted.

## 9. Privacy-conscious analytics
- Our DB only: counts and timings per event (`traction_log`), no third-party tracking, no attendee PII (attendees are anonymous unless they type a name).
- Every user record carries `is_demo`/`is_internal` flags; demo sandbox users are excluded from all reported numbers.
- Nexconn Console MAU screenshot (dated) as the platform-side number, explained alongside our internal split.

## 10. Evidence pack for the submission
Per event: date, type, #volunteers, #reports, #incidents, duplicates absorbed, median time-to-claim/fix, screenshots, photo of posters (with permission), organiser confirmation email, consented quotes, and the changelog entries that came from their feedback.

## Week-by-week
- **28–31 Oct:** list 20 candidate events; send 15 messages; book 3 calls.
- **1–7 Nov:** confirm 2–3 events; dry run with a club meeting (Pilot #0).
- **8–21 Nov:** run pilots; ship fixes within 48 h; collect evidence.
