# Progress — Baton 2.0

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
