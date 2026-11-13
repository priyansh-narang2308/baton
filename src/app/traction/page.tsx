import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { db } from "@/server/db/client";
import { resolveRange, RANGE_KEYS, type TractionResult } from "@/server/domain/traction";
import { loadTraction } from "@/server/domain/traction-data";
import { sampleDataAllowed, sampleTraction } from "@/server/domain/traction-sample";
import { BucketBars, PrintButton, SegmentBar, TimeChart } from "./charts";
import { fmtDate, fmtDateTime, fmtDuration, fmtInt, pct } from "./format";

const LIVE_APP = "https://baton.priyanshnarang.in";
const DEMO_VIDEO = "https://youtu.be/Cyq-dWpizs0";
const NEXCONN_DOCS = "https://docs.nexconn.ai/";

const C = { coral: "#c8664f", blue: "#2f4fb8", green: "#15803d", amber: "#b45309", gray: "#a8a29e" };

const DESCRIPTION = "Baton's public impact report: verified pilot usage, Nexconn messaging activity and incident outcomes, measured from real records.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_BASE_URL || LIVE_APP),
  title: "Baton Impact · Real-time coordination. Measurable outcomes.",
  description: DESCRIPTION,
  alternates: { canonical: "/traction" },
  openGraph: { title: "Baton Impact", description: DESCRIPTION, type: "website", url: "/traction", siteName: "Baton" },
  twitter: { card: "summary_large_image", title: "Baton Impact", description: DESCRIPTION },
};

type Search = { range?: string; sample?: string };

export default async function TractionPage({ searchParams }: { searchParams: Promise<Search> }) {
  await connection();
  const sp = await searchParams;
  const now = new Date();
  const range = resolveRange(sp.range, now);
  const sample = sp.sample === "1" && sampleDataAllowed();

  let data: TractionResult | null = null;
  try {
    data = sample ? sampleTraction(range, now) : await loadTraction(db(), range, now);
  } catch (err) {
    console.error("Traction metrics failed to load", err);
  }

  return (
    <div className="traction min-h-screen bg-bg text-text">
      {sample && (
        <>
          <div role="alert" className="bg-[#7c2d12] px-4 py-2.5 text-center text-[13px] font-semibold tracking-wide text-white">
            SAMPLE DATA — NOT REAL TRACTION. Development preview only; nothing on this page is real usage.
          </div>
          <div aria-hidden className="fixed right-4 bottom-4 z-40 rounded-full bg-[#7c2d12] px-3 py-1.5 text-[11px] font-bold tracking-wider text-white">SAMPLE DATA — NOT REAL TRACTION</div>
        </>
      )}
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <Header data={data} rangeLabel={range.label} />
        <RangeFilter current={range.key} sample={sample} />
        {!data ? (
          <Unavailable />
        ) : (
          <>
            {data.pilots.length === 0 && <NoPilotYet />}
            <KeyMetrics d={data} />
            <Activity d={data} />
            <Impact d={data} />
            <Pilots d={data} />
            <Feedback d={data} />
          </>
        )}
        <Methodology d={data} />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-[13px] text-text-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Baton · Built for the Nexconn Build Challenge 2026</p>
          <p className="flex gap-5">
            <a className="hover:text-text" href={LIVE_APP}>Live app</a>
            <a className="hover:text-text" href={DEMO_VIDEO}>Demo video</a>
            <a className="hover:text-text" href={NEXCONN_DOCS}>Nexconn</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Chrome ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <nav className="no-print border-b border-border/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="size-2 rounded-full bg-brand" aria-hidden />
          Baton
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <a href={DEMO_VIDEO} className="hidden h-9 items-center rounded-full px-3 text-[13px] text-text-2 hover:bg-surface-2 hover:text-text sm:inline-flex">
            Demo video
          </a>
          <a href={LIVE_APP} className="hidden h-9 items-center rounded-full px-3 text-[13px] text-text-2 hover:bg-surface-2 hover:text-text sm:inline-flex">
            Live app
          </a>
          <PrintButton />
        </div>
      </div>
    </nav>
  );
}

function Header({ data, rangeLabel }: { data: TractionResult | null; rangeLabel: string }) {
  return (
    <header className="pt-14 pb-8 sm:pt-20">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-brand-ink">Public impact report · Nexconn Build Challenge 2026</p>
      <h1 className="mt-4 font-serif text-[56px] leading-[0.95] tracking-[-0.01em] sm:text-[80px]">Baton Impact</h1>
      <p className="mt-4 max-w-2xl text-[19px] leading-snug text-text-2 sm:text-[22px]">Real-time coordination. Measurable outcomes.</p>
      <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-text-2 [text-wrap:pretty]">
        This page reports actual product usage. Every figure is counted from Baton&rsquo;s production records or copied from the Nexconn Console, and each one names its source. Demo events, simulated identities and our own test accounts are excluded.
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-4 border-t border-border pt-6 text-[13px] sm:grid-cols-3">
        <Meta label="Reporting period">
          {rangeLabel}
          {data && <span className="block text-text-3">{fmtDate(data.range.start)} – {fmtDate(data.range.end)}</span>}
        </Meta>
        <Meta label="Last updated">{data ? fmtDateTime(data.generatedAt) : "—"}</Meta>
        <Meta label="Latest recorded activity">{data?.dataThrough ? fmtDateTime(data.dataThrough) : "None yet"}</Meta>
      </dl>
    </header>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-text-3">{label}</dt>
      <dd className="mt-1 font-medium text-text">{children}</dd>
    </div>
  );
}

function RangeFilter({ current, sample }: { current: string; sample: boolean }) {
  const labels: Record<string, string> = { challenge: "Challenge to date", "30d": "Last 30 days", "7d": "Last 7 days" };
  return (
    <div className="no-print sticky top-0 z-20 -mx-4 mb-10 border-b border-border/70 bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div role="group" aria-label="Reporting period" className="inline-flex rounded-full border border-border bg-surface p-1">
        {RANGE_KEYS.map((k) => {
          const href = `/traction?${new URLSearchParams({ ...(k !== "challenge" ? { range: k } : {}), ...(sample ? { sample: "1" } : {}) })}`;
          const active = k === current;
          return (
            <Link
              key={k}
              href={href}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${active ? "bg-accent text-accent-ink" : "text-text-2 hover:text-text"}`}
            >
              {labels[k]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── States ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function NoPilotYet() {
  return (
    <section className="mb-12 rounded-2xl border border-border bg-surface px-6 py-6 sm:px-8">
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">Status</p>
      <h2 className="mt-2 font-serif text-[28px] leading-tight">No verified pilot yet</h2>
      <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-text-2 [text-wrap:pretty]">
        Baton counts usage only from events that real organizers ran with real crews, and only after we have verified them with the organizer. No pilot has been verified yet, so the product figures below are zero by design rather than filled in with demo or test activity. This page updates automatically as pilots happen.
      </p>
    </section>
  );
}

function Unavailable() {
  return (
    <section className="mb-12 rounded-2xl border border-border bg-surface px-6 py-10 text-center">
      <h2 className="font-serif text-[28px]">Figures are temporarily unavailable</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-text-2">We couldn&rsquo;t reach the analytics database just now. Nothing is shown rather than a stale or estimated number. Please refresh in a minute.</p>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong/70 bg-bg/60 px-6 text-center">
      <svg width="44" height="24" viewBox="0 0 44 24" aria-hidden className="mb-3 text-border-strong">
        <path d="M2 20 L12 14 L20 17 L30 7 L42 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" />
      </svg>
      <p className="max-w-xs text-[13px] leading-relaxed text-text-3">{children}</p>
    </div>
  );
}

// ── Sections ───────────────────────────────────────────────────────────────────────────────────────────────────────

type Source = "console" | "baton" | "webhook" | "feedback";
const SOURCE: Record<Source, { label: string; dot: string }> = {
  console: { label: "Nexconn Console", dot: C.blue },
  webhook: { label: "Nexconn webhooks", dot: C.coral },
  baton: { label: "Baton records", dot: C.green },
  feedback: { label: "Participant feedback", dot: C.amber },
};

function SourceTag({ source }: { source: Source }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-bg px-2 py-0.5 text-[11px] font-medium text-text-2">
      <span className="size-1.5 rounded-full" style={{ background: SOURCE[source].dot }} aria-hidden />
      {SOURCE[source].label}
    </span>
  );
}

function SectionHead({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="section-head mb-6 max-w-3xl">
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">{eyebrow}</p>
      <h2 id={id} className="mt-2 font-serif text-[34px] leading-[1.05] sm:text-[40px]">{title}</h2>
      {children && <p className="mt-3 text-[15px] leading-relaxed text-text-2 [text-wrap:pretty]">{children}</p>}
    </div>
  );
}

function Delta({ d }: { d: TractionResult["headline"]["activeParticipantsDelta"] }) {
  if (!d) return null;
  const up = d.change >= 0;
  return (
    <span className={`text-[12px] font-medium ${up ? "text-done" : "text-text-2"}`}>
      {up ? "▲" : "▼"} {Math.abs(d.change)} vs previous period ({d.previous})
    </span>
  );
}

function Metric({ label, value, source, note, extra, empty }: { label: string; value: string; source: Source; note: ReactNode; extra?: ReactNode; empty?: boolean }) {
  return (
    <div className="metric flex flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[13px] font-medium leading-snug text-text-2">{label}</h3>
        <SourceTag source={source} />
      </div>
      <p className={`mt-5 text-[44px] font-semibold leading-none tracking-[-0.03em] ${empty ? "text-text-3" : "text-text"}`}>{value}</p>
      <div className="mt-3 min-h-5">{extra}</div>
      <p className="mt-auto pt-4 text-[12px] leading-relaxed text-text-3 [text-wrap:pretty]">{note}</p>
    </div>
  );
}

function KeyMetrics({ d }: { d: TractionResult }) {
  const h = d.headline;
  const mau = d.console.mau;
  return (
    <section aria-labelledby="key-metrics" className="mb-20">
      <h2 id="key-metrics" className="sr-only">Key metrics</h2>
      <div className="print-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Nexconn monthly active users"
          source="console"
          value={mau ? fmtInt(mau.value) : "Pending"}
          empty={!mau}
          extra={mau && <span className="text-[12px] font-medium text-text-2">Period {fmtDate(mau.periodStart.getTime())} – {fmtDate(mau.periodEnd.getTime())}</span>}
          note={mau ? `As reported by the Nexconn Console, captured ${fmtDate(mau.capturedAt.getTime())}. Counts every user of our Nexconn app, including our own test identities.` : "Awaiting a dated snapshot from the Nexconn Console. We never estimate this figure ourselves."}
        />
        <Metric
          label="Verified external active participants"
          source="baton"
          value={fmtInt(h.activeParticipants)}
          empty={!h.activeParticipants}
          extra={h.activeParticipantsDelta ? <Delta d={h.activeParticipantsDelta} /> : h.activeParticipants ? <span className="text-[12px] text-text-2">{h.crew} crew · {h.attendees} attendees</span> : null}
          note="Distinct real people in verified pilots who sent a message, reported, acted on a request or connected during the period."
        />
        <Metric
          label="Nexconn messages sent by participants"
          source="webhook"
          value={fmtInt(h.userMessages)}
          empty={!h.userMessages}
          extra={h.userMessagesDelta ? <Delta d={h.userMessagesDelta} /> : h.systemMessages ? <span className="text-[12px] text-text-2">+ {fmtInt(h.systemMessages)} sent by Baton</span> : null}
          note="Unique Nexconn message ids from the message webhook, in pilot crew chats and direct chats. Baton’s automated messages are listed separately."
        />
        <Metric
          label="Pilot events"
          source="baton"
          value={fmtInt(h.pilotEvents)}
          empty={!h.pilotEvents}
          extra={h.rehearsals || h.activeEvents ? <span className="text-[12px] text-text-2">{h.activeEvents} active in period{h.rehearsals ? ` · ${h.rehearsals} rehearsal${h.rehearsals > 1 ? "s" : ""}` : ""}</span> : null}
          note="Events run by real organizers and verified by the Baton team. Rehearsals with real people are counted and labelled separately."
        />
        <Metric label="Incidents reported" source="baton" value={fmtInt(h.incidentsReported)} empty={!h.incidentsReported} note="Requests from pilot participants that became tracked incidents, after duplicate reports were merged." />
        <Metric
          label="Incidents resolved"
          source="baton"
          value={fmtInt(h.incidentsResolved)}
          empty={!h.incidentsResolved}
          extra={h.incidentsReported ? <span className="text-[12px] text-text-2">{pct(h.incidentsResolved, h.incidentsReported)} of reported</span> : null}
          note="Incidents marked fixed by their owner, which also closes the loop with the person who reported them."
        />
      </div>
    </section>
  );
}

function ChartCard({ title, subtitle, source, children, className = "" }: { title: string; subtitle: string; source: Source; children: ReactNode; className?: string }) {
  return (
    <figure className={`chart rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      <figcaption className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <p className="mt-0.5 text-[13px] text-text-3">{subtitle}</p>
        </div>
        <SourceTag source={source} />
      </figcaption>
      {children}
    </figure>
  );
}

function Activity({ d }: { d: TractionResult }) {
  const has = d.daily.length > 0;
  const lc = d.lifecycle;
  const lcTotal = lc.open + lc.claimed + lc.resolved + lc.withdrawn;
  const anyTimes = d.impact.timeToClaim.samples + d.impact.timeToResolve.samples > 0;
  const noData = "No verified pilot activity in this period yet.";
  return (
    <section aria-labelledby="activity" className="print-break mb-20">
      <SectionHead id="activity" eyebrow="Activity" title="How Baton is being used">
        Daily figures in UTC, from verified pilot events only.
      </SectionHead>
      <div className="print-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Daily active participants" subtitle="Distinct people active each day" source="baton">
          {has ? <TimeChart data={d.daily} series={[{ key: "active", label: "Active participants", color: C.coral, kind: "area" }]} unit="people" /> : <Empty>{noData}</Empty>}
        </ChartCard>
        <ChartCard title="Nexconn messages" subtitle="Messages sent by participants each day" source="webhook">
          {has ? <TimeChart data={d.daily} series={[{ key: "messages", label: "Messages", color: C.blue, kind: "bar" }]} unit="messages" /> : <Empty>{noData}</Empty>}
        </ChartCard>
        <ChartCard title="Reported and resolved" subtitle="Incidents opened and fixed each day" source="baton">
          {has ? (
            <TimeChart
              data={d.daily}
              series={[
                { key: "reported", label: "Reported", color: C.coral, kind: "bar" },
                { key: "resolved", label: "Resolved", color: C.green, kind: "bar" },
              ]}
              unit="incidents"
            />
          ) : (
            <Empty>{noData}</Empty>
          )}
        </ChartCard>
        <ChartCard title="Baton Pass handovers" subtitle="Ownership handed over and accepted each day" source="baton">
          {has && d.impact.handoversOffered > 0 ? <TimeChart data={d.daily} series={[{ key: "passes", label: "Handovers accepted", color: C.blue, kind: "bar" }]} unit="handovers" /> : <Empty>No handovers recorded in this period yet.</Empty>}
        </ChartCard>
        <ChartCard title="Incident lifecycle" subtitle="Where this period’s incidents stand now" source="baton">
          {lcTotal ? (
            <div className="pt-2">
              <SegmentBar
                parts={[
                  { label: "Resolved", value: lc.resolved, color: C.green, ink: "#fff" },
                  { label: "Claimed", value: lc.claimed, color: C.blue, ink: "#fff" },
                  { label: "Open", value: lc.open, color: C.amber, ink: "#fff" },
                  { label: "Withdrawn", value: lc.withdrawn, color: C.gray, ink: "#0a0a0a" },
                ]}
              />
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border pt-6">
                <Stat label="Got an owner" value={pct(lc.claimed + lc.resolved, lcTotal - lc.withdrawn)} />
                <Stat label="Fixed" value={pct(lc.resolved, lcTotal - lc.withdrawn)} />
                <Stat label="Still waiting for an owner" value={fmtInt(lc.open)} />
                <Stat label="Median time to fix" value={fmtDuration(d.impact.timeToResolve.medianSec)} />
              </dl>
            </div>
          ) : (
            <Empty>{noData}</Empty>
          )}
        </ChartCard>
        <ChartCard title="Response and resolution times" subtitle="Incidents by time from report to claim, and to fix" source="baton">
          {anyTimes ? (
            <BucketBars rows={d.responseBuckets.map((r) => ({ label: r.label, a: r.claim, b: r.resolve }))} a={{ label: "Time to claim", color: C.blue }} b={{ label: "Time to resolve", color: C.green }} />
          ) : (
            <Empty>{noData}</Empty>
          )}
        </ChartCard>
      </div>
    </section>
  );
}

const plural = (n: number, one: string, many = `${one}s`) => `${fmtInt(n)} ${n === 1 ? one : many}`;

function Impact({ d }: { d: TractionResult }) {
  const i = d.impact;
  const rows: { label: string; value: string; detail: string }[] = [
    { label: "Requests received", value: fmtInt(i.requests), detail: "Every report and chat request from pilot participants, duplicates included." },
    { label: "Requests claimed", value: fmtInt(i.claimed), detail: i.incidents ? `${pct(i.claimed, i.incidents)} of incidents got an owner.` : "Incidents that got exactly one owner." },
    { label: "Requests resolved", value: fmtInt(i.resolved), detail: i.incidents ? `${pct(i.resolved, i.incidents)} of incidents were marked fixed.` : "Incidents marked fixed by their owner." },
    { label: "Duplicate reports consolidated", value: fmtInt(i.duplicatesConsolidated), detail: "Reports attached to an existing incident instead of creating a new one." },
    { label: "Ownership handovers", value: fmtInt(i.handoversAccepted), detail: i.handoversOffered ? `${plural(i.handoversOffered, "Baton Pass", "Baton Passes")} offered, ${pct(i.handoversAccepted, i.handoversOffered)} accepted.` : "Baton Passes accepted by a teammate." },
    { label: "Median time to claim", value: fmtDuration(i.timeToClaim.medianSec), detail: i.timeToClaim.samples ? `From ${plural(i.timeToClaim.samples, "claimed incident")}. 90th percentile ${fmtDuration(i.timeToClaim.p90Sec)}.` : "From report to the first owner." },
    { label: "Median time to resolution", value: fmtDuration(i.timeToResolve.medianSec), detail: i.timeToResolve.samples ? `From ${plural(i.timeToResolve.samples, "resolved incident")}. 90th percentile ${fmtDuration(i.timeToResolve.p90Sec)}.` : "From report to marked fixed." },
  ];
  return (
    <section aria-labelledby="impact" className="print-break mb-20">
      <SectionHead id="impact" eyebrow="Product impact" title="Outcomes, not activity">
        What happened to the requests people raised. Calculated from Baton&rsquo;s incident records and audit timeline; incidents created in the selected period.
      </SectionHead>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <dl className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="impact-row grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 px-5 py-4 sm:grid-cols-[minmax(0,260px)_140px_1fr] sm:px-6">
              <dt className="text-[14px] font-medium">{r.label}</dt>
              <dd className="text-right text-[24px] font-semibold tracking-[-0.02em] tabular-nums sm:text-left">{r.value}</dd>
              <dd className="col-span-2 text-[13px] text-text-3 sm:col-span-1">{r.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Pilots({ d }: { d: TractionResult }) {
  return (
    <section aria-labelledby="pilots" className="mb-20">
      <SectionHead id="pilots" eyebrow="Pilot activity" title="Real events, verified">
        Each card is an event run by a real organizer. Names and details appear only as the organizer agreed; figures cover the whole event.
      </SectionHead>
      {d.pilots.length === 0 ? (
        <Empty>No verified pilot events yet. Pilots appear here once they have run and the organizer has confirmed them.</Empty>
      ) : (
        <div className="print-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          {d.pilots.map((p) => (
            <article key={`${p.name}-${p.startsAt}`} className="pilot rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-[26px] leading-tight">{p.name}</h3>
                  <p className="mt-1 text-[13px] text-text-3">
                    {fmtDate(p.startsAt)}
                    {fmtDate(p.endsAt) !== fmtDate(p.startsAt) ? ` – ${fmtDate(p.endsAt)}` : ""}
                    {p.context ? ` · ${p.context}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${p.kind === "pilot" ? "bg-done-soft text-done" : "bg-open-soft text-open"}`}>{p.kind}</span>
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-y-5 border-t border-border pt-5">
                <Stat label="Crew" value={fmtInt(p.crew)} />
                <Stat label="Attendee reporters" value={fmtInt(p.attendees)} />
                <Stat label="Messages" value={fmtInt(p.userMessages)} />
                <Stat label="Incidents" value={fmtInt(p.incidents)} />
                <Stat label="Resolved" value={fmtInt(p.resolved)} />
                <Stat label="Median claim" value={fmtDuration(p.medianClaimSec)} />
              </dl>
              {p.feedbackCount > 0 && <p className="mt-5 text-[12px] text-text-3">{p.feedbackCount} published feedback {p.feedbackCount === 1 ? "quote" : "quotes"} below.</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-text-3">{label}</dt>
      <dd className="mt-1 text-[20px] font-semibold tabular-nums tracking-[-0.01em]">{value}</dd>
    </div>
  );
}

function Feedback({ d }: { d: TractionResult }) {
  return (
    <section aria-labelledby="feedback" className="mb-20">
      <SectionHead id="feedback" eyebrow="User feedback" title="In their words">
        Published only with the participant&rsquo;s permission, and attributed only as they chose.
      </SectionHead>
      {d.feedback.length === 0 ? (
        <Empty>No published feedback yet. Quotes appear after a pilot, once the participant has agreed to be quoted.</Empty>
      ) : (
        <div className="print-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          {d.feedback.map((f) => (
            <blockquote key={f.id} className="quote flex flex-col rounded-2xl border border-border bg-surface p-6">
              <p className="font-serif text-[22px] leading-snug [text-wrap:pretty]">&ldquo;{f.quote}&rdquo;</p>
              <footer className="mt-auto pt-5 text-[13px] text-text-2">
                <span className="font-medium text-text">{f.who}</span>
                {f.pilot ? ` · ${f.pilot}` : ""} · {fmtDate(f.collectedAt)}
                {f.rating !== null && <span className="ml-2 text-text-3">Rated {f.rating}/5</span>}
              </footer>
            </blockquote>
          ))}
        </div>
      )}
    </section>
  );
}

function Methodology({ d }: { d: TractionResult | null }) {
  const cols: { source: Source; title: string; body: string }[] = [
    { source: "console", title: "Nexconn analytics", body: "Monthly active users come only from the Nexconn Console, copied with the exact reporting period and capture date. Nexconn counts every identity that connects to our app, so this figure includes our own development and test users; it is never replaced by an estimate of ours." },
    { source: "baton", title: "Baton application analytics", body: "Participants, incidents, timings and handovers are calculated from Baton’s production database and audit timeline. Only events we have verified as real pilots count. Demo events, simulated identities, Baton’s bot and the team’s own accounts are excluded." },
    { source: "webhook", title: "Nexconn message events", body: "Message counts come from Nexconn’s signed message webhook. Each message is counted once by its Nexconn message id, however many times it was delivered. Message text is never read for this page." },
    { source: "feedback", title: "Pilot feedback", body: "Quotes are collected after a pilot with the same short questionnaire. They are published only with permission, anonymised unless the person chose to be named, and kept short." },
  ];
  return (
    <section aria-labelledby="method" className="print-break method mb-8 border-t border-border pt-16">
      <SectionHead id="method" eyebrow="Methodology" title="How Baton measures impact">
        Accuracy matters more than impressive numbers. Every figure on this page is labelled with its source, and nothing is estimated, projected or filled in.
      </SectionHead>
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
        {cols.map((c) => (
          <div key={c.title}>
            <SourceTag source={c.source} />
            <h3 className="mt-3 text-[15px] font-semibold">{c.title}</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-text-2 [text-wrap:pretty]">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="print-2 mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h3 className="text-[15px] font-semibold">Definitions</h3>
          <dl className="mt-3 space-y-3 text-[14px] leading-relaxed text-text-2">
            <Def term="Active participant">A real person in a verified pilot who, in the period, sent a Nexconn message, submitted a report, claimed, handed over or resolved a request, or connected to Nexconn.</Def>
            <Def term="Incident">A tracked request with one owner. Several reports of the same problem merge into one incident.</Def>
            <Def term="Time to claim / resolve">Seconds from the incident&rsquo;s first report to its first owner, or to being marked fixed. Medians and 90th percentiles; withdrawn incidents are left out.</Def>
            <Def term="Days">Calendar days in UTC.</Def>
          </dl>
        </div>
        <div>
          <h3 className="text-[15px] font-semibold">Nexconn Console snapshots</h3>
          {d && d.console.history.length > 0 ? (
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-2 text-text-2">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Metric</th>
                    <th scope="col" className="px-3 py-2 font-medium">Value</th>
                    <th scope="col" className="px-3 py-2 font-medium">Period</th>
                    <th scope="col" className="px-3 py-2 font-medium">Captured</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {d.console.history.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-3 py-2">{s.metric === "mau" ? "Monthly active users" : s.metric === "dau" ? "Daily active users" : "Messages"}</td>
                      <td className="px-3 py-2 font-semibold">{fmtInt(s.value)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{fmtDate(s.periodStart.getTime())} – {fmtDate(s.periodEnd.getTime())}</td>
                      <td className="whitespace-nowrap px-3 py-2">{fmtDate(s.capturedAt.getTime())}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-[14px] text-text-3">No snapshot recorded yet.</p>
          )}
          <p className="mt-6 text-[14px] text-text-2">
            See it working: <a className="font-medium text-text underline decoration-border-strong underline-offset-4 hover:decoration-text" href={LIVE_APP}>live app</a> ·{" "}
            <a className="font-medium text-text underline decoration-border-strong underline-offset-4 hover:decoration-text" href={DEMO_VIDEO}>demo video</a>
          </p>
        </div>
      </div>
    </section>
  );
}

function Def({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-text">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
