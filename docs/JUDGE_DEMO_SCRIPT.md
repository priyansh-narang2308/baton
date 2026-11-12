# Baton — judge demo script

Two deliverables share this script:

- **A. The submission video**, 2:30–3:00.
- **B. A live walkthrough** a judge can repeat alone from the landing page.

Every shot shows the real app on the deployed URL, never mock-ups. The hero picture on the landing page is labelled as an illustration; do not use it as proof.

## Setup before recording

- Three screens:
  - Laptop: **command centre**, `/o/:eventId`.
  - Phone 1: **volunteer "Riya"**, `/c/:eventId`.
  - Phone 2: **attendee**, the Gate 3 poster QR.
- Use a fresh demo event from "Try Baton live". Give each screen a small on-screen label ("Organizer", "Volunteer", "Attendee").
- Phone notifications off; battery and clock tidy; screen recording on both phones (screen mirroring is fine).
- Pre-write the crew chat line: `need 2 chairs at Hall B`.

## A. Video (target 2:45)

| Time | Beat | What happens on screen | Voice-over (draft) |
|---|---|---|---|
| 0:00–0:15 | Problem | A crew group chat scrolling past a request (a recreated chat with fictional names, labelled "recreation") | "At an event, requests arrive in a group chat, scroll away, and nobody knows who's on it." |
| 0:15–0:22 | One line | Landing hero | "Baton: every report acknowledged, every incident owned." |
| 0:22–0:45 | Report and merge | Attendee scans the Gate 3 poster, taps "Water & supplies", sends. The card appears on the command centre and Riya's phone. A second report, from the simulate button and **labelled as simulated**, makes the card read "2 reports". | "Attendees scan a poster. No app. Two people, one problem: one card." |
| 0:45–1:00 | Ownership | Riya taps "I'll take it". The card flips to "On it · Riya" on the laptop live. The attendee's page shows "Riya from the crew is on it." | "One tap and everyone sees who owns it, including the person who reported it." |
| 1:00–1:25 | **Baton Pass** | The organizer claims an urgent card, then hits **Pass**, picks Riya and types a handover note ("Two cases ordered, collect at Hall B"). Riya's phone: private alert plus the card reads "Organizer wants to pass this to you" with the note. She taps **Take the baton**; the laptop's timeline adds "Riya took the baton from Organizer". | "Shift changes are where requests get dropped. In Baton you hand over, with a note, and it stays yours until someone accepts. Never ownerless." |
| 1:25–1:40 | Chat becomes work | Riya types `need 2 chairs at Hall B` in the crew chat; the message becomes a claimable request in place (manual button, or the webhook once deployed). | "Plain chat becomes a task, with transparent rules, and it's undoable." |
| 1:40–1:55 | Command centre | KPI strip (Needs an owner, Longest wait). Incident detail: reports, time to owner, activity timeline. Assign the chairs request; Riya's phone shows "Organizer assigned you #3". | "The organizer sees what's waiting and for how long, and can hand work to a person, privately." |
| 1:55–2:05 | Direct message | From the incident, "Message Riya": a prefilled "Re #3" message. Riya replies; the unread count updates live. | "Conversations happen on the incident, not in a separate app." |
| 2:05–2:15 | Closed loop | Riya marks #1 fixed. The attendee page shows "Fixed". | "And the reporter hears back. Once." |
| 2:15–2:30 | Proof it's real Nexconn | A 5-second architecture slide: Postgres decides, Nexconn messages and metadata carry it live. Then browser devtools on the network or WebSocket tab showing the Nexconn connection. | "The database is the source of truth; Nexconn group, direct and targeted messages make it live on every phone." |
| 2:30–2:40 | Real use | **Only what happened**: the rehearsal or event, dated, with the impact report screenshot and the Console MAU screenshot. If nothing has happened yet, show the pilot pipeline honestly. | "[Exactly what happened, or: we are piloting with … on …]" |
| 2:40–2:45 | Close | URL and Nexconn App Key on screen | "Baton. Nothing falls through." |

**Do not show or say:**
- An "AI" badge.
- Push notifications to a locked phone (not built).
- Calls or "voice huddles" (not built; the Console calling service is not enabled; see NEXCONN_COMPLETE_DOCUMENTATION_RESEARCH §C).
- Any user number that isn't in the impact report or the Console.

## B. Live walkthrough for judges (in the README and the write-up)

1. Open the landing page and press **Try Baton live**. This creates a private demo event; no sign-up.
2. The demo hub shows three panes: attendee, volunteer and organizer. Use the QR codes to open the attendee or volunteer view on your own phone.
3. As the attendee, report "Water & supplies" at Gate 3. Watch the card appear in the volunteer and organizer views.
4. Press **Simulate more attendees** (clearly labelled as demo only). The card now says "3 reports", not three cards.
5. As the volunteer, tap **I'll take it**. The attendee view changes to "on it".
6. In the organizer view, click the card's **Details**: reports, times and activity. Assign it, or message the owner.
7. **Baton Pass:** in the organizer view, claim a card, press **Pass**, choose the volunteer and add a note. The volunteer view shows the offer with **Take the baton** / **Can't right now**; the organizer stays the owner until they answer. The timeline records the handover.
8. Mark it fixed. The attendee view shows "Fixed", and the impact report (`Impact` in the header) updates. Simulated activity is excluded and disclosed.

## Recording checklist

- [ ] Deployed URL, not localhost (localhost only as a fallback, and say so)
- [ ] Captions burned in
- [ ] No secrets on screen (`.env.local`, Console secret, tokens in devtools)
- [ ] Simulated reports visibly labelled
- [ ] Video public to anyone with the link; tested in a logged-out browser
