# Traction methodology

How the public page at `/traction` ("Baton Impact") counts usage, and how to keep it truthful.

The page is a public proof page for the Nexconn Build Challenge judges. Accuracy matters more than impressive numbers. Every figure on the page names its source, and nothing is estimated, projected or filled in.

## 1. The three sources

| Source | What it gives | How it reaches the page | Shown as |
|---|---|---|---|
| **Nexconn Console** | Monthly active users (MAU) for our Nexconn app, as Nexconn counts them | Copied by hand into the admin form, with the Console's own period and the capture date | "Nexconn Console" tag |
| **Baton production records** | Participants, incidents, reports, claims, Baton Passes, timings | Read from the production Postgres database and the `incident_events` audit timeline | "Baton records" tag |
| **Nexconn webhooks** | Messages sent in pilot crew chats and direct chats | The signed `message:send` webhook, stored in `webhook_events` | "Nexconn webhooks" tag |

A fourth input, **participant feedback**, is entered by hand after a pilot and published only with permission.

### Why MAU is copied by hand

The Nexconn Server API has no analytics or MAU endpoint. Our documentation research found none, and we do not scrape the Console. MAU is therefore recorded as a dated **snapshot** in the protected admin area (section 5). The page always shows the latest snapshot as it is, with its period and capture date. It never replaces it with a number of our own.

Nexconn's MAU counts **every** identity that connects to our app. That includes our development, demo and automated test identities. The page says this next to the figure. Use the separate "Verified external active participants" figure for external usage.

## 2. What counts as external traction

An event counts **only** when an admin has verified it in `traction_pilots`. Nothing counts by default.

- **Verify an event only after** its real organizer confirms it ran and agrees to how it is named publicly. The verification note records who confirmed it and how. The note is private.
- **Demo events can never count.** The admin form refuses them, and the calculation drops them even if one were verified.
- **Rehearsals** (real people, mock event) are allowed but labelled "rehearsal" and counted separately from pilots.

Within a verified event, these identities are always excluded:

- Simulated identities (`members.is_simulated`, `attendees.is_simulated`).
- The event's Baton bot (`events.bot_user_id`).
- Identities on the exclusion list (`traction_exclusions`). Add the team's own phones and test devices here.

Development and production are never mixed. The page reads only the database of the deployment it runs on.

## 3. Definitions

All days are calendar days in **UTC**. The default reporting period is the challenge window from 23 Oct 2026 to today; the page also offers the last 30 and last 7 days.

| Metric | Definition |
|---|---|
| **Verified external active participant** | A counted person (section 2) who, in the period, did at least one of the following: sent a Nexconn message (webhook), submitted a report, acted on an incident (claim, Baton Pass, resolve, as recorded in the audit timeline), or connected to Nexconn (`user:connection_status`, status 0). Counted once per Nexconn user id. |
| **Nexconn messages sent by participants** | Distinct Nexconn `messageId`s from `message:send` webhooks, in a verified event's crew group (channel type 3) or in a direct chat (channel type 1) involving a counted person, sent by a counted person. |
| **Messages sent by Baton** | The same, but sent by the server (`os = "Server"`) or the event bot: incident cards, status updates and Baton Pass alerts. Shown separately and never added to the participant figure. |
| **Pilot events** | Verified events of kind `pilot`. "Active in period" means at least one counted participant was active in the period. |
| **Requests received** | Reports (attendee reports and chat requests) from counted people, on incidents created in the period, duplicates included. |
| **Incidents reported** | Incidents created in the period that a counted person reported, excluding withdrawn ones. One incident can hold several reports. |
| **Requests claimed / resolved** | Incidents with a `claimed_at` time, or with status `resolved`. |
| **Duplicate reports consolidated** | Reports attached to an existing incident (`attached_by` is `auto` or `merge`) instead of creating a new one. |
| **Ownership handovers** | `pass.accepted` audit entries in the period. "Offered" counts `pass.offered`. |
| **Time to claim / resolve** | Seconds from the incident's creation (its first report) to `claimed_at` or `resolved_at`. The page shows the median and the 90th percentile (nearest-rank). Withdrawn incidents are left out. |
| **Trend** | Shown only for the 7-day and 30-day views, and only when the previous window of the same length had data. |

Pilot cards cover each whole event, not the selected period, so a pilot is always reported as it happened.

## 4. Integrity safeguards

- **Duplicate webhook deliveries.** `webhook_events` is keyed by the Nexconn envelope id (`recordWebhook`). The traction calculation additionally counts each `messageId` once, so a message that arrives in two different envelopes is still counted once. This is tested in `src/server/domain/traction.test.ts`.
- **No message text.** The loader reduces webhook payloads in SQL to the message id, sender, channel, channel type, origin and time. Message content is never read for this page.
- **Nothing private on the page.** No email addresses, Nexconn user ids, member names, message text, verification notes or permission notes are rendered. Pilot names and context come only from the public fields the organizer agreed to. A test asserts that the computed result contains neither message text nor user ids.
- **Empty states, not fake numbers.** With no verified pilot the page says so, and every product figure is zero by design. Charts show an empty state instead of a flat line. If the database cannot be reached, the page shows "temporarily unavailable" rather than old or estimated figures.
- **Sample data is walled off.** `?sample=1` works only when `TRACTION_SAMPLE_DATA=1` is set and the deployment is not Vercel production. Sample data is generated in memory, never stored, and the page then carries a banner and a fixed badge reading "SAMPLE DATA — NOT REAL TRACTION".
- **Incident functionality is untouched.** The feature adds four tables (`traction_pilots`, `traction_exclusions`, `traction_console_snapshots`, `traction_feedback`). It only reads the existing incident tables.

## 5. Admin workflow (protected)

The admin area at `/traction/admin` is:

- **Disabled** (404) unless `TRACTION_ADMIN_TOKEN` is set to 32 or more random characters.
- **Not linked** from anywhere public, and marked `noindex`.
- **Protected** by an HMAC-signed, `httpOnly`, `SameSite=Strict` cookie scoped to `/traction/admin`. The cookie expires after 12 hours and is invalidated when the token rotates.
- **Rate-limited** to 5 sign-in attempts per 15 minutes per IP.

Every write is a server action that re-checks the admin session.

**Recording a Nexconn Console snapshot**

1. Sign in to the Nexconn Console for the production app (App Key `e5t4ouvpen0va`).
2. Open the page that shows monthly active users for the app. Write down the exact navigation path you used. The Nexconn docs do not document this page, so record what you actually see.
3. In `/traction/admin` → *Nexconn Console snapshots*, enter:
   - **metric:** MAU
   - **value:** exactly as shown
   - **period:** the Console's own period (for MAU, the calendar month)
   - **capture date**
   - **Console path**
4. Take a dated screenshot of the Console page and keep it privately as evidence. Do not publish it if it shows anything sensitive.
5. Record a new snapshot whenever you share the page. Never edit an old one; delete it only if it was entered wrongly.

**Verifying a pilot**

1. After the event, confirm with the organizer that it ran. Agree the public name and context, for example "College tech fest, Delhi".
2. In *Verified pilots*, pick the event and enter the kind, public name, dates and a private verification note.
3. In *Identities in verified pilots*, exclude every identity that belongs to the Baton team or a test device.

**Adding feedback**

Collect feedback with the questionnaire in `docs/TRACTION_OUTREACH.md`. Then:

1. Enter the quote: 280 characters at most, verbatim, trimmed only with the person's agreement.
2. Choose the attribution the person agreed to: anonymous, role only, or name and role.
3. Record how permission was given.
4. Publish only when permission is explicit.

## 6. Configuration

| Variable | Purpose |
|---|---|
| `TRACTION_ADMIN_TOKEN` | Enables `/traction/admin`. 32+ random characters, e.g. `openssl rand -base64 36`. Set it only where you need the admin area; never commit it. |
| `TRACTION_SAMPLE_DATA` | `1` allows `?sample=1` previews outside Vercel production. Leave it unset in production. |

The four new tables are created by the migration `drizzle/0005_traction.sql`. Run `npm run db:migrate` against production before the page is first used there.

## 7. Verification

- `npx vitest run src/server/domain/traction.test.ts` runs 9 tests covering:
  - exclusion of demo, unverified, simulated, bot and excluded identities
  - message deduplication across redeliveries and envelopes
  - server messages kept separate
  - medians and percentiles
  - the daily series
  - empty states
  - trend gating
  - the latest Console snapshot
  - feedback publication and attribution
  - a database round trip through real webhook storage
- A local end-to-end check (13 Nov 2026) verified a dev event as a test rehearsal through the admin form. The page's figures were compared with direct SQL and matched:
  - 3 requests
  - 2 incidents, both claimed
  - 1 resolved
  - 1 duplicate
  - 1 handover

  The test records were then removed.
