# Baton — implementation plan, 11 → 22 Nov 2026

The submission deadline is **22 Nov 2026, 23:59 AoE**. We submit on **21 Nov** to keep a day of buffer. This file replaces the dated milestones in `PLAN.md`, which were written on 28 Oct; that file stays as history.

Owner key: **You** means it needs your account, money, people or judgement. **Claude** means engineering in this repository.

## Where we are (verified on 11 Nov)

| Area | State | Evidence |
|---|---|---|
| Core loop: report → merge → claim → fix → reporter told | Works with live Nexconn | Browser runs this session; `incidents.test.ts`, `projection.test.ts` |
| Chat message becomes a claimable request | Works through the manual button. The webhook path is unit-tested only. | `chat-intake.test.ts`; webhook needs a public URL |
| Incident detail, activity timeline, assignment | Works | Browser and tests |
| Organizer ↔ volunteer direct messages and inbox | Works live, with a fallback for the 35011 channel list | Two-session browser test |
| Command centre (KPIs, filters, crew load, inbox) | Works | Browser |
| Landing page (13 sections), attendee form fix | Done | Checked at 375 px and desktop |
| Impact report | Works, real data only | `impact.test.ts`, browser |
| Deployed HTTPS URL | **Not done.** Needs your authorisation and a host account. | — |
| Real users / pilots | **None recorded in this repository** | — |
| Growth Credit enrolment screenshot | **Not recorded** | — |

## P0: without these we cannot place

| # | Task | Owner | By | Notes |
|---|---|---|---|---|
| P0-1 | Choose a host and authorise deployment | You | 13 Nov | Free option: Render web service plus Neon Postgres. A serverless host needs the worker loops moved to cron (ARCHITECTURE §2). Give the go-ahead and create the accounts; Claude cannot. |
| P0-2 | Deploy, run migrations, set `PUBLIC_BASE_URL`, `/api/health` green | Claude | 14 Nov | After P0-1 |
| P0-3 | Console: webhook URL with `message:send`, domain allowlist | You | 14 Nov | Then Claude proves the webhook path live (the chat → card demo moment) |
| P0-4 | Enrol in Chat Growth Credit and screenshot the MAU/PCC entitlement | You | 13 Nov | Qualification evidence |
| P0-5 | At least one real event or rehearsal with real people on the deployed URL | You, with Claude on call | 18 Nov | See TRACTION_PLAN. A rehearsal with your club counts if it is described honestly as a rehearsal. |
| P0-6 | Demo video, 2:30–3:00 | You record, Claude scripts | 20 Nov | DEMO_SCRIPT.md |
| P0-7 | Write-up and README with screenshots, architecture and an honest Nexconn feature table | Claude | 20 Nov | — |
| P0-8 | Make the repository public and submit | You | 21 Nov | Rule: Claude never pushes or adds a remote |

## P1: clear score gains, if P0 is on track

| # | Task | Owner | Why it matters |
|---|---|---|---|
| P1-1 | End-to-end browser test of the three-role loop against the deployed URL | Claude | Reliability is half the score. It catches regressions after freeze. |
| P1-2 | "Signed in on another device" (31010) screen, token refresh and an offline banner | Claude | Judges open many tabs. A silent disconnect looks broken. |
| P1-3 | Organizer feedback link on the impact report: five questions, stored in our DB, consent checkbox | Claude | Makes the feedback loop in TRACTION_PLAN real instead of a Google Form |
| P1-4 | Demo events auto-end after 2 h; delete the `evlocal` seed | Claude | A clean judge sandbox |
| P1-5 | Presence dots on the crew list via `subscribeEvent`, behind a runtime check | Claude | Only if the Console enables online status. Otherwise skip; no fake presence. |
| P1-6 | Real favicon and Open Graph image | Claude | `src/app/favicon.ico` is currently deleted in the working tree (not by Claude). Needs your call: replace it or restore it. |

## P2: only if everything above is done

- Crew Web Push alerts (PWA, service worker, VAPID).
- An attendee "known issues near you" view, to dedupe before a report is sent.
- A 1:1 audio "Call owner" button. **Blocked:** it needs the Console audio/video switch and a card. No simulated call.

## Freeze and buffer

- **18 Nov:** feature freeze; only fixes after this.
- **19–20 Nov:** video, write-up, final browser pass on real phones.
- **21 Nov:** submit. **22 Nov:** re-check every link while logged out.
- **23–27 Nov:** judging. No deploys unless something is broken.
