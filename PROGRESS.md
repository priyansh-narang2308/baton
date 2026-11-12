# Progress — Baton 2.0

## 12 Nov 2026 — Baton Pass, documentation research, landing motion (session 4)
- **Baton Pass:** the owner offers an incident to a teammate with a handover note; ownership moves only when they accept (one conditional `UPDATE`), so it is never ownerless. Decline, cancel, and void on release, fix or assign. Migration `0003_baton_pass`; card metadata `pass` / `passN`; targeted `BTN:Nudge` alerts. 6 new tests, including an accept-vs-release race; verified live organizer → volunteer in two sessions.
- **Docs:** `COMPLETE_PROJECT_AUDIT.md` (status table, track, judge score), `NEXCONN_COMPLETE_DOCUMENTATION_RESEARCH.md` plus a generated 869-row `NEXCONN_PAGE_INVENTORY.md`. Chat UI and Call SDK decisions re-checked against the current pages. `DEMO_SCRIPT` → `JUDGE_DEMO_SCRIPT` (Baton Pass beat); `SUBMISSION_CHECKLIST` → `SUBMISSION_READINESS` (traction bonus).
- **Landing:** Framer Motion entrance, scroll reveals, floating section nav, smooth anchor scrolling (dff5f96).
- **Still the owner's:** deploy authorisation and host, Console calling service and card (for huddles), Growth Credit, pilots, video, public repository.

## 10–11 Nov 2026 — audit, command centre, landing (session 3)
- **Audits:** `docs/PRODUCT_AUDIT.md` (claims re-verified, defects D1–D9, judge panel, track and positioning) and `docs/NEXCONN_DOCS_AUDIT.md` (869 doc pages; Call SDK blocked on Console and card; live SDK findings in §10).
- **Fixed:** every QR code returned 500 when `PUBLIC_BASE_URL` was blank (D1).
- **Incident detail and assignment:** reports, facts and an activity timeline from `incident_events`; leads assign, and the assignee gets a private targeted alert (D2, D3).
- **Direct messages:** organizer ↔ volunteer over Nexconn direct channels; inbox with unread counts. The SDK channel list returns 35011 on our key, so the inbox falls back to per-peer history (D4).
- **Command centre:** KPI strip, filters, crew load, inbox, invite links. The demo organizer is now "Organizer" (D7).
- **Landing page:** 13 sections with no invented logos, numbers or quotes (D5). Attendee category grid fixed (D6).
- **Docs:** ARCHITECTURE rewritten against the code (removed claims about Web Push and an AI key that were never built); new IMPLEMENTATION_PLAN, DEMO_SCRIPT, SUBMISSION_CHECKLIST; TRACTION_PLAN rewritten as a kit.
- **Not done, needs the owner:** deploy authorisation and host account, Growth Credit screenshot, pilots, video, making the repository public.

## 28 Oct 2026 — session 2 (C1 + C3, first live Nexconn run)
- **C1 chat → request in place:** deterministic detector (`src/server/domain/detection.ts`), chat intake from `message:send` webhooks (`chat-intake.ts`, idempotent per message id), "Make it a request" fallback API, "Not a request" undo, claim bar rendered under the original chat bubble. Migration `0002_chat_origin`.
- **C3 impact report:** `src/server/domain/impact.ts` + `/o/:eventId/report` (headline reports → issues, time to owner/fixed with p90, closed-loop count, by location/type, crew, activity chart). Simulated activity excluded and disclosed.
- **Live Nexconn (keys added by owner):** B1, B2, B5 (1 receiving client), B8, B9 PASS — see `docs/VALIDATION_RESULTS.md`. Fixed: organizer couldn't open the crew view.
- Tests 80/80; typecheck, lint, build clean.
- Next: two-browser B5/B6, deploy for the webhook (B3/B11), `after()` projection (B7).

## 28 Oct 2026 — session 1

### Completed
- Timeboxed competitor check → `docs/COMPETITIVE_REFINEMENT.md`. Decision: **GO**, signature feature = duplicate-report consolidation with closed-loop status to every reporter.
- MVP lock → `docs/PRODUCT_SPEC.md`; architecture → `docs/ARCHITECTURE.md`; traction → `docs/TRACTION_PLAN.md`; research moved to `docs/NEXCONN_RESEARCH.md`.
- Official `nexconn-chat` skill installed at `.claude/skills/nexconn-chat` and reviewed (decision recorded: Chat SDK, not Chat UI — Chat UI can't render message metadata and isn't built for portrait mobile).
- App scaffolded: Next.js 16.4.3, React 19.3, TypeScript, Tailwind 4, Drizzle + Postgres, `@nexconn/engine` / `@nexconn/chat` **26.2.1 pinned**.
- Project-local Postgres (`npm run db:start`, port 54329) + migrations (`drizzle/`).
- Server: env validation, signed Nexconn Server API client with domain failover, webhook verification (freshness window, constant-time compare), signed per-role cookies, consolidation engine, transactional incident domain (report/attach/suggest, claim/release/resolve, merge/dismiss/split, escalation), projection to Nexconn (card + metadata + deduped reporter DMs), reconciliation and escalation worker, idempotent webhook recording, health endpoint, QR endpoint.
- UI (first vertical slice): landing + "Try Baton live" demo hub, event creation, organizer capability link, ops board, printable QR sheet, crew join, crew stream (chat + live incident cards + request composer + My tasks + Crew), attendee help page with live status timeline.

### Verified (executed)
- `npm test` → **31/31** (consolidation rules, real-Postgres transactions incl. 5-way concurrent claim, merge/split, escalation, webhook dedupe, signature).
- `npm run typecheck`, `npm run lint`, `npm run build` → clean.
- HTTP flows with curl against the dev server: intake → attach → suggest; concurrent claim 200/409 with owner name; permission and tamper rejections; merge updates the attendee's status. Board renders DB truth.
- Missing credentials are reported explicitly everywhere (`projected:false`, health 503, UI banner). No mocked Nexconn results anywhere.

### Current blocker
**Nexconn credentials.** Needed in `.env.local`: `NEXCONN_APP_KEY`, `NEXCONN_APP_SECRET`, `NEXCONN_DATA_CENTER`. Also enrol the app in **Chat Growth Credit** and check its MAU/PCC in the Console. For webhooks: a public HTTPS URL (deploy, or `ngrok http 3000`) configured under Chat → Chat settings → Webhooks.

### Next task
Full dated task list: **`docs/PLAN.md`**. Immediate:
1. With credentials: `node scripts/nexconn-spike.mjs`, then run B5–B17 in `docs/VALIDATION_RESULTS.md` (critical: B5 metadata propagation to other Web clients; B16 three role tabs in one browser).
2. Make the GO/ADAPT call; record it.
3. Playwright E2E for the three-device loop (real Nexconn, two browser contexts).
4. PWA + Web Push for crew alerts (Tier 1 #9).
5. Deploy (Railway/Render/Fly + Neon) and start pilot outreach (see traction plan).

### Outstanding risks
- Metadata update events on Web not yet observed live (fallback designed: `BTN:Update` messages).
- Multiple Nexconn users in one browser (demo tabs) unverified.
- Growth Credit / PCC entitlements unverified.
- Web Push on iOS requires home-screen PWA.
- Dev DB contains a seeded test event `evlocal` (fake Nexconn ids, `is_demo=true`) used for UI checks — delete before any real use: `psql -h /tmp -p 54329 -U baton -d baton -c "delete from events where id='evlocal'"`.
