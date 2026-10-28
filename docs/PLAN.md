# Baton — task plan to submission (28 Oct → 22 Nov 2026)

The single source of truth for **what to do next**. Strategy and reasoning live in `docs/NEXCONN_RESEARCH.md` (§9 tiers, §14 roadmap, §17 submission); this file is the task list. Status: `[ ]` todo · `[~]` in progress · `[x]` done (verified) · `[!]` blocked.

Owner: **You** = needs your account, money, people or judgement · **Claude** = engineering in this repo.

## How we win (where the points are)
| Criterion | Weight | What actually moves it | Our lever |
|---|---|---|---|
| Completeness & UX | **50%** | Judges open the live URL and the loop works first time, on a phone, with no setup | Live Nexconn proven, deployed, zero-setup demo, mobile polish, reliability under refresh/offline |
| Innovation | 30% | Something they haven't seen in 40 other chat apps | One issue, many reporters (dedupe + closed loop to every reporter); chat messages that become claimable in place; named escalation instead of @everyone |
| Business | 20% | Real users on our App Key, a believable buyer and price | 2–3 real pilot events in **November** (MAU is counted per calendar month), consented quotes, Event Pass pricing |

The biggest risk is not code. It is (1) the live Nexconn behaviour not yet observed, and (2) zero real users. Both start **today**.

## Milestones
| Date | Gate |
|---|---|
| **30 Oct** | Live Nexconn spike done → real GO / ADAPT recorded |
| **3 Nov** | Deployed on HTTPS; full loop on 3 real devices on the live URL |
| **9 Nov** | Pilot #0 run with ≥10 real users |
| **12 Nov** | Differentiators done (in-place detection, push alerts, report) |
| **16 Nov** | Pilots #1–#2 done; polish done |
| **18 Nov** | **Feature freeze** — only fixes after this |
| **21 Nov** | **Submitted** (1-day buffer) |
| 23–27 Nov | Judging — no deploys |

---

## Stage A — prove Nexconn live (now → 30 Oct)
- [~] **A1 You** — Create Nexconn account + app (data center SG), enrol in **Chat Growth Credit**, screenshot the MAU/PCC entitlement.
- [x] **A2 You** — Paste App Key / App Secret into `.env.local`.
- [ ] **A3 You** — Register team on Reskilll, pick **Workplace & Collaboration** track.
- [ ] **A4 You** — Console: enable group *pre-join history for new members*; add `localhost:3000` (and later the deploy domain) to the Web domain allowlist.
- [ ] **A5 Claude** — Run `node scripts/nexconn-spike.mjs` (B1–B4, B13 server side).
- [~] **A6 Claude** — Live client checks B5–B10, B14–B16 in two independent browsers; **B5 metadata propagation is the gate**. *28 Oct: B1, B2, B5 (2 users), B8, B9, B16 (2 of 3) PASS live — see VALIDATION_RESULTS.*
- [x] **A7 Claude** — Not needed so far (B5 passed live). If B5 fails: implement `BTN:Update` fallback projection (clients reduce by version). Record the decision in `VALIDATION_RESULTS.md`.
- [ ] **A8 Claude** — Prove a Web Push notification reaches a locked Android phone and an iOS home-screen PWA (small prototype).

## Stage B — real, deployed, reliable (31 Oct → 3 Nov)
- [ ] **B1 You** — Pick host (recommended: Railway or Render for the always-on Node server + Neon Postgres). Free tiers are enough; confirm no card surprises.
- [ ] **B2 Claude** — Deploy: env vars, migrations on boot, `/api/health` monitored, HTTPS URL; set `PUBLIC_BASE_URL`.
- [ ] **B3 You** — Console webhook URL → `https://<host>/api/nexconn/webhook`, event `message:send`. Claude verifies B11/B12.
- [ ] **B4 Claude** — Playwright E2E: organizer + volunteer + attendee contexts, real Nexconn, against the deployed URL (create → report → dedupe → claim race → resolve → attendee sees it).
- [ ] **B5 Claude** — Delete `evlocal` seed; demo sandbox reset/expiry (demo events auto-end after 2 h).
- [x] **B7 Claude** — *Done 28 Oct (10–30 ms responses live).* Run Nexconn projection after the response (`after()`), so a slow Nexconn never delays attendees or claims.
- [ ] **B6 Claude** — Kicked-by-other-device (31010) "Use here" screen; token refresh (B15); offline banner + state re-read (B10).

## Stage C — the "never seen that before" layer (4 → 12 Nov)
Ordered by points per hour.
- [x] **C1 Claude** — **Chat → card in place.** *Done 28 Oct: rules + tests, webhook path, "Make it a request" fallback, "Not a request" undo; verified live via the manual path. Webhook path awaits a public URL (B3/B11).* A volunteer types "need 2 more chairs at Hall B" in plain chat; the server (webhook) recognises a request deterministically (keywords + zone names), and the same bubble gains a claim bar marked *detected*, editable or dismissable. Optional async AI refinement later, never in the claim path.
- [ ] **C2 Claude** — **Crew push alerts:** installable PWA, service worker, VAPID Web Push for urgent incidents and named escalations; Screen Wake Lock while on duty; iOS "Add to Home Screen" prompt.
- [x] **C3 Claude** — **Live impact report** *Done 28 Oct: `/o/:eventId/report`, real data only, simulated activity excluded and disclosed.* per event (real data only): incidents, reports merged ("41 reports → 12 issues"), median time-to-claim / to-fix, unclaimed count, per-zone heat. This is the screenshot for the PDF and the business story.
- [ ] **C4 Claude** — **Attendee live board** (open channel): "Known issues near you" — when an attendee is about to report something already being handled, show it and let them +1 instead ("Riya is already on it"). Dedupe *before* the report, not just after.
- [ ] **C5 Claude** — Presence on the crew list (on duty / online) and per-zone coverage gaps on the board ("Gate 3: nobody on duty").
- [ ] **C6 Claude** — Debug drawer for the video: live log of `onMessageReceived` / `onMessageMetadataUpdated` / webhook events (proves real Nexconn use to judges).

## Stage D — pilots and traction (start today, runs to 16 Nov)
- [ ] **D1 You — today** — Send the outreach message in `docs/TRACTION_PLAN.md` to 15+ organisers (college fests, GDG/DevFest, meetups, hackathons, NGO drives, sports days happening 8–20 Nov). Goal: 3 yes.
- [ ] **D2 You** — Book Pilot #0 for 8–9 Nov (friendly: your club/college event, ≥10 crew).
- [ ] **D3 Claude** — Pilot kit: one-page organiser guide, printable QR posters per zone, consent line on join, feedback form link.
- [ ] **D4 You** — Run pilots #1–#2 (14–16 Nov). Collect: Console MAU screenshot, impact report, photos (with consent), 2–3 quotes.
- [ ] **D5 Claude** — Fix everything pilot #0 surfaces before pilot #1.

## Stage E — polish and proof (13 → 18 Nov)
- [ ] **E1 Claude** — Visual polish pass on all screens (mobile first), empty/loading/error states, motion that explains the state change.
- [ ] **E2 Claude** — Accessibility: Lighthouse a11y ≥ 95, contrast, focus, screen-reader labels, large-text attendee mode.
- [ ] **E3 Claude** — Load test: 150 concurrent clients, 20 claims/s; chaos: network kill mid-claim, webhook replay, Nexconn API failure → reconciliation repairs.
- [ ] **E4 Claude** — Security pass: gitleaks clean, rate limits, headers, no secret in client bundle (verify built JS).
- [ ] **E5 Claude** — Replace boilerplate `public/*.svg`; real favicon, OG image, MIT licence.
- [ ] **E6 — 18 Nov** — Freeze.

## Stage F — submission (19 → 21 Nov)
- [ ] **F1 You + Claude** — Video 2:30–3:00 per `NEXCONN_RESEARCH.md` §17.1 (Claude writes the script and shot list; you record voice-over).
- [ ] **F2 Claude** — PDF write-up (problem, product, Nexconn features table, architecture, reliability results, traction, business, App Key).
- [ ] **F3 Claude** — README final: demo GIF, architecture diagram, setup, tests, "built entirely during the challenge".
- [ ] **F4 You** — Make GitHub repo public and push (we are only committing locally until then).
- [ ] **F5 You** — Submit on Reskilll by **21 Nov**; re-verify every link logged out on 22 Nov.

---

## Explicitly not doing (scope discipline)
Call SDK, native apps, multi-event orgs/billing, SSO, translation, WhatsApp bridge. Revisit only if Stage C is done by 12 Nov.

## Today's next three actions
1. **You:** A1 + A2 (Nexconn app, Growth Credit, keys) — unblocks everything else.
2. **You:** D1 outreach — pilots are the only way to earn the Business 20% and real MAU.
3. **Claude:** while waiting on keys, start C1/C3 groundwork that doesn't need Nexconn (detection rules + tests, impact-report queries + page).
