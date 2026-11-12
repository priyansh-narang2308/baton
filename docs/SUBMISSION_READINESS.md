# Baton — submission readiness

Deadline: **22 Nov 2026, 23:59 AoE**. Target: submit **21 Nov**. Requirements are from the challenge page as recorded in `NEXCONN_RESEARCH.md` §2.4: write-up PDF with the App Key and the Nexconn features used, a public demo video, a public GitHub repository, and the App Key in the form.

Status on 12 Nov 2026: `[x]` done and verified · `[ ]` to do · `[!]` blocked on you.

## Qualification (missing any of these risks disqualification)

- [x] Uses the Nexconn Chat SDK as the core transport: group channel, direct channels, custom messages, message metadata, targeted messages (verified live in the browser).
- [ ] [!] Team registered; **Workplace & Collaboration** track chosen on Reskilll. **You** (do not change it without deciding first).
- [ ] [!] Chat Growth Credit enrolled; dated screenshot of MAU/PCC. **You**
- [ ] The App Key in the form matches the key in the deployed bundle (check the built JS after deploying).
- [ ] [!] Public GitHub repository. **You** make it public and push; Claude does not push or add remotes.
- [ ] [!] Video public to anyone with the link, tested logged out. **You** record (JUDGE_DEMO_SCRIPT.md).
- [ ] Write-up PDF including the **App Key** and the Nexconn features table. Claude drafts; you review.

## Traction bonus (genuine use only)

- [ ] [!] At least one real event or a clearly labelled rehearsal on the deployed URL (TRACTION_PLAN §1, §4). **You** run it.
- [ ] Impact report screenshot from that event (real activity only; simulated is excluded by the code).
- [ ] Console MAU screenshot for November, dated, from the same App Key as the write-up.
- [ ] Organizer feedback in their own words, with permission to quote (TRACTION_PLAN §5). No paraphrased or invented quotes.
- [ ] Every number in the write-up and video traces to one of the three items above.

## Live app

- [ ] [!] Deployed on HTTPS, always on (IMPLEMENTATION_PLAN P0-1/2). Needs your go-ahead and host account.
- [ ] `/api/health` returns 200 on the deployed URL.
- [ ] Console: webhook URL with `message:send`; domain allowlist includes the deployed origin.
- [ ] "Try Baton live" works logged out on Android, iPhone and desktop.
- [ ] Testing checklist in TRACTION_PLAN §6 passes on the deployed URL.
- [ ] No console errors on landing, demo hub, crew, attendee, command centre, impact report.
- [ ] No secrets in the client bundle (`grep` the build for the App Secret and `DATABASE_URL`).

## Repository

- [x] Tests (95), typecheck, lint and build pass on 12 Nov (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`); re-run before submitting.
- [ ] `npm run build` passes on a clean checkout.
- [ ] README: problem, screenshots or GIF, live URL, judge walkthrough (JUDGE_DEMO_SCRIPT §B), architecture, Nexconn features, setup, environment variable names, tests.
- [ ] Licence file (MIT unless you prefer otherwise). **You** decide.
- [ ] `.env.local` is git-ignored, and no secret appears in history (`git log -p | grep` for the key prefixes).
- [ ] Favicon: currently deleted in the working tree, not by Claude. Restore or replace it.
- [ ] Statement that the project was built during the challenge window, with git history as evidence.

## Write-up PDF outline

1. Problem and who has it (event crews coordinating in group chats).
2. The product, with screenshots of the attendee, volunteer, command centre and incident detail views.
3. **Nexconn features used** and where:

   | Feature | Where |
   |---|---|
   | Group channel per event | The crew chat |
   | Custom messages `BTN:Incident`, `BTN:Status`, `BTN:Nudge` | Cards, status updates and alerts |
   | Message metadata | Live card state |
   | Targeted group messages | Assignment and escalation |
   | Direct channels | Organizer ↔ volunteer |
   | Server API with signature | Server-side sends |
   | Webhook `message:send` | Chat → request |
   | Tokens issued server-side | Sign-in to Nexconn |

4. Architecture and reliability: database as the source of truth, version-checked claims, idempotent webhooks, a repair loop. Also the known limits: the 35011 channel list, and no push when the tab is closed.
5. Testing: unit and integration counts, and the browser scenarios run.
6. Traction: **only real evidence** (TRACTION_PLAN §7). Real and simulated are separated.
7. Business: who pays (event organizers), the pilot-first plan, what is next.
8. Appendix: App Key, links, team.

## Final day

- [ ] Submitted by 21 Nov.
- [ ] 22 Nov: every link re-checked in a logged-out browser on a phone.
- [ ] 23–27 Nov: no deploys unless something is broken.

## Not part of this submission's requirements

The brief that asked for this file also mentioned "five case studies and a template". None exist for this hackathon in the workspace: the only such set is `../tata-elxsi/Case Studies And Template/` (Tata Elxsi, unrelated). The Nexconn write-up has no published template that we know of (NEXCONN_RESEARCH §2.4). If the organisers publish one, follow it.
