import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { db } from "@/server/db/client";
import { attendees, events, incidents, members, tractionConsoleSnapshots, tractionExclusions, tractionFeedback, tractionPilots } from "@/server/db/schema";
import { adminEnabled, isAdmin } from "@/server/traction-admin";
import { fmtDate } from "../format";
import { addFeedback, addSnapshot, deleteFeedback, deleteSnapshot, login, logout, setExclusion, setFeedbackPublished, unverifyPilot, verifyPilot } from "./actions";

export const metadata: Metadata = { title: "Traction admin · Baton", robots: { index: false, follow: false } };

const input = "h-10 w-full rounded-xl border border-border bg-surface px-3 text-[14px] focus:border-text/50 focus:outline-none focus:ring-4 focus:ring-brand/15";
const btn = "inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-[13px] font-medium text-accent-ink hover:opacity-85";
const btnGhost = "inline-flex h-8 items-center rounded-full border border-border-strong/70 bg-surface px-3 text-[12px] font-medium hover:border-text/40";
const iso = (d: Date) => d.toISOString().slice(0, 10);

const ERRORS: Record<string, string> = {
  token: "That token is not correct.",
  rate: "Too many attempts. Wait 15 minutes and try again.",
  period: "The period must end on or after its start.",
  demo: "Demo events can never be verified as pilots.",
  identity: "That identity is not part of a verified pilot.",
  name: "Add the name the person agreed to be quoted with.",
  pilot: "Feedback can only be linked to a verified pilot.",
};

export default async function TractionAdmin({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  await connection();
  if (!adminEnabled()) notFound();
  const sp = await searchParams;
  const error = sp.error ? (ERRORS[sp.error] ?? sp.error) : null;

  if (!(await isAdmin())) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <h1 className="font-serif text-[36px]">Traction admin</h1>
        <p className="mt-2 text-[14px] text-text-2">Records Nexconn Console snapshots, pilot verification and feedback for the public /traction page.</p>
        <form action={login} className="mt-6 space-y-3">
          <label className="block text-[13px] font-medium">
            Admin token
            <input name="token" type="password" autoComplete="current-password" required className={`${input} mt-1.5`} />
          </label>
          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
          <button className={btn}>Sign in</button>
        </form>
      </main>
    );
  }

  const d = db();
  const [snapshots, pilots, exclusions, feedback, candidates] = await Promise.all([
    d.select().from(tractionConsoleSnapshots).orderBy(desc(tractionConsoleSnapshots.capturedAt)),
    d.select({ p: tractionPilots, name: events.name }).from(tractionPilots).innerJoin(events, eq(events.id, tractionPilots.eventId)).orderBy(desc(tractionPilots.startsAt)),
    d.select().from(tractionExclusions),
    d.select().from(tractionFeedback).orderBy(desc(tractionFeedback.collectedAt)),
    d
      .select({ id: events.id, name: events.name, createdAt: events.createdAt, incidents: count(incidents.id) })
      .from(events)
      .leftJoin(incidents, eq(incidents.eventId, events.id))
      .where(eq(events.isDemo, false))
      .groupBy(events.id)
      .orderBy(desc(events.createdAt))
      .limit(50),
  ]);
  const pilotIds = pilots.map((p) => p.p.eventId);
  const [crew, atts] = pilotIds.length
    ? await Promise.all([
        d.select({ eventId: members.eventId, name: members.name, role: members.role, nexconnUserId: members.nexconnUserId, isSimulated: members.isSimulated }).from(members).where(inArray(members.eventId, pilotIds)),
        d.select({ eventId: attendees.eventId, nexconnUserId: attendees.nexconnUserId, isSimulated: attendees.isSimulated, createdAt: attendees.createdAt }).from(attendees).where(and(inArray(attendees.eventId, pilotIds))),
      ])
    : [[], []];
  const excluded = new Map(exclusions.map((e) => [e.nexconnUserId, e.reason]));
  const verified = new Set(pilotIds);
  const today = iso(new Date());

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-danger">Admin only · not linked publicly</p>
          <h1 className="mt-1 font-serif text-[40px] leading-tight">Traction admin</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/traction" className={btnGhost}>View public page</Link>
          <form action={logout}>
            <button className={btnGhost}>Sign out</button>
          </form>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-[14px] text-text-2">
        Record only what you can prove. Copy Console figures exactly, with their period; verify a pilot only after the organizer confirms it ran; publish a quote only with permission. Everything here appears on the public page except verification notes, permission notes and names of crew.
      </p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-[14px] text-danger">{error}</p>}
      {sp.ok && <p role="status" className="mt-4 rounded-xl border border-done/25 bg-done-soft px-4 py-3 text-[14px] text-done">Saved.</p>}

      <Section id="console" title="Nexconn Console snapshots" hint="The Nexconn Server API has no analytics endpoint, so MAU is copied by hand from the Console. Use the Console's own period (for MAU, the calendar month).">
        <form action={addSnapshot} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <L label="Metric">
            <select name="metric" className={input} defaultValue="mau">
              <option value="mau">Monthly active users</option>
              <option value="dau">Daily active users</option>
              <option value="messages">Messages</option>
            </select>
          </L>
          <L label="Value (exactly as shown)"><input name="value" type="number" min={0} required className={input} /></L>
          <L label="Captured on"><input name="capturedOn" type="date" defaultValue={today} required className={input} /></L>
          <L label="Period start"><input name="periodStart" type="date" required className={input} /></L>
          <L label="Period end"><input name="periodEnd" type="date" required className={input} /></L>
          <L label="Where in the Console"><input name="consolePath" required placeholder="e.g. Console → Data statistics → MAU" className={input} /></L>
          <div className="sm:col-span-3"><button className={btn}>Record snapshot</button></div>
        </form>
        <Table head={["Metric", "Value", "Period", "Captured", "Console path", ""]}>
          {snapshots.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <Td>{s.metric}</Td>
              <Td><b>{s.value}</b></Td>
              <Td>{fmtDate(s.periodStart.getTime())} – {fmtDate(s.periodEnd.getTime())}</Td>
              <Td>{fmtDate(s.capturedAt.getTime())}</Td>
              <Td>{s.consolePath}</Td>
              <Td>
                <form action={deleteSnapshot}><input type="hidden" name="id" value={s.id} /><button className={btnGhost}>Delete</button></form>
              </Td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section id="pilots" title="Verified pilots" hint="Only verified events count on the public page. Pick a real (non-demo) event; the public name is what the organizer agreed to show.">
        <form action={verifyPilot} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <L label="Event" wide>
            <select name="eventId" required className={input}>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {verified.has(c.id) ? "✓ " : ""}{c.name} · created {fmtDate(c.createdAt.getTime())} · {c.incidents} incidents
                </option>
              ))}
            </select>
          </L>
          <L label="Kind">
            <select name="kind" className={input}>
              <option value="pilot">Pilot (a real event)</option>
              <option value="rehearsal">Rehearsal (real people, mock event)</option>
            </select>
          </L>
          <L label="Public name"><input name="publicName" required maxLength={80} placeholder="e.g. College tech fest" className={input} /></L>
          <L label="Public context (optional)"><input name="publicContext" maxLength={120} placeholder="e.g. Delhi · 40 volunteers" className={input} /></L>
          <L label="Starts on"><input name="startsOn" type="date" required className={input} /></L>
          <L label="Ends on"><input name="endsOn" type="date" required className={input} /></L>
          <L label="How it was verified (private)" wide><input name="verificationNote" required minLength={10} placeholder="Who confirmed, how, when" className={input} /></L>
          <div className="sm:col-span-3"><button className={btn}>Verify event</button></div>
        </form>
        <Table head={["Event", "Public name", "Kind", "Dates", "Verification note", ""]}>
          {pilots.map(({ p, name }) => (
            <tr key={p.eventId} className="border-t border-border">
              <Td>{name}</Td>
              <Td>{p.publicName}{p.publicContext ? ` · ${p.publicContext}` : ""}</Td>
              <Td>{p.kind}</Td>
              <Td>{fmtDate(p.startsAt.getTime())} – {fmtDate(p.endsAt.getTime())}</Td>
              <Td>{p.verificationNote}</Td>
              <Td>
                <form action={unverifyPilot}><input type="hidden" name="eventId" value={p.eventId} /><button className={btnGhost}>Unverify</button></form>
              </Td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section id="people" title="Identities in verified pilots" hint="Exclude the team's own phones and any test device. Simulated identities are always excluded automatically.">
        <Table head={["Event", "Who", "Status", ""]}>
          {[...crew.map((m) => ({ ...m, who: `${m.name} (${m.role})` })), ...atts.map((a) => ({ ...a, who: `Attendee, joined ${fmtDate(a.createdAt.getTime())}` }))].map((x) => {
            const ex = excluded.get(x.nexconnUserId);
            return (
              <tr key={x.nexconnUserId} className="border-t border-border">
                <Td>{pilots.find((p) => p.p.eventId === x.eventId)?.p.publicName}</Td>
                <Td>{x.who}</Td>
                <Td>{x.isSimulated ? "Simulated, excluded" : ex ? `Excluded: ${ex}` : "Counted"}</Td>
                <Td>
                  {!x.isSimulated && (
                    <form action={setExclusion} className="flex gap-2">
                      <input type="hidden" name="nexconnUserId" value={x.nexconnUserId} />
                      <input type="hidden" name="exclude" value={ex ? "0" : "1"} />
                      {!ex && <input name="reason" placeholder="Reason" className="h-8 w-40 rounded-full border border-border px-3 text-[12px]" />}
                      <button className={btnGhost}>{ex ? "Count again" : "Exclude"}</button>
                    </form>
                  )}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Section>

      <Section id="feedback" title="Feedback" hint="Short quotes, collected after a pilot. Publish only with permission; attribution follows what the person chose.">
        <form action={addFeedback} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <L label="Quote (max 280 characters)" wide>
            <textarea name="quote" required maxLength={280} rows={2} className={`${input} h-auto py-2`} />
          </L>
          <L label="Pilot">
            <select name="eventId" className={input}>
              <option value="">Not linked to a pilot</option>
              {pilots.map(({ p }) => <option key={p.eventId} value={p.eventId}>{p.publicName}</option>)}
            </select>
          </L>
          <L label="Role">
            <select name="role" className={input}>
              <option value="organizer">Organizer</option>
              <option value="lead">Crew lead</option>
              <option value="volunteer">Volunteer</option>
              <option value="attendee">Attendee</option>
            </select>
          </L>
          <L label="Rating 1–5 (optional)"><input name="rating" type="number" min={1} max={5} className={input} /></L>
          <L label="Attribution">
            <select name="attribution" className={input}>
              <option value="anonymous">Anonymous</option>
              <option value="role">Role only</option>
              <option value="name">Name and role</option>
            </select>
          </L>
          <L label="Name (only if they agreed)"><input name="attributionName" maxLength={60} className={input} /></L>
          <L label="Collected on"><input name="collectedOn" type="date" defaultValue={today} required className={input} /></L>
          <L label="How permission was given (private)" wide><input name="permissionNote" required minLength={10} className={input} /></L>
          <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="published" /> Publish now</label>
          <div className="sm:col-span-3"><button className={btn}>Add feedback</button></div>
        </form>
        <Table head={["Quote", "Attribution", "Collected", "Status", ""]}>
          {feedback.map((f) => (
            <tr key={f.id} className="border-t border-border align-top">
              <Td>&ldquo;{f.quote}&rdquo;<span className="block text-text-3">{f.permissionNote}</span></Td>
              <Td>{f.attribution}{f.attributionName ? `: ${f.attributionName}` : ""} · {f.role}</Td>
              <Td>{fmtDate(f.collectedAt.getTime())}</Td>
              <Td>{f.published ? "Published" : "Hidden"}</Td>
              <Td>
                <div className="flex gap-2">
                  <form action={setFeedbackPublished}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="published" value={f.published ? "0" : "1"} /><button className={btnGhost}>{f.published ? "Hide" : "Publish"}</button></form>
                  <form action={deleteFeedback}><input type="hidden" name="id" value={f.id} /><button className={btnGhost}>Delete</button></form>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Section>
    </main>
  );
}

function Section({ id, title, hint, children }: { id: string; title: string; hint: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-[18px] font-semibold">{title}</h2>
      <p className="mt-1 mb-5 text-[13px] text-text-2">{hint}</p>
      {children}
    </section>
  );
}

function L({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`block text-[12px] font-medium text-text-2 ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode[] }) {
  if (children.length === 0) return <p className="mt-5 text-[13px] text-text-3">Nothing recorded yet.</p>;
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-surface-2 text-text-2">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children }: { children?: ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}
