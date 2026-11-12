import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/server/db/client";
import { eventImpact, type Duration } from "@/server/domain/impact";
import { getSession } from "@/server/session";
import { CATEGORY_LABEL } from "@/lib/types";
import { ActivityChart, AutoRefresh, PrintButton } from "./client";

export const metadata = { title: "Impact report — Baton" };

function fmtDuration(sec: number | null) {
  if (sec === null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ${String(sec % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** Post-event (and live) impact report: what the crew handled, how fast, and who was told. Real data only. */
export default async function ReportPage(props: PageProps<"/o/[eventId]/report">) {
  const { eventId } = await props.params;
  const session = await getSession("organizer", eventId);
  const data = session ? await eventImpact(db(), eventId) : null;
  if (!data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 p-6 text-center">
        <h1 className="font-serif font-normal tracking-[-0.025em] text-[30px] leading-[1.05]">Open your organizer link</h1>
        <p className="text-sm text-text-2">The impact report is private to the organizer.</p>
      </main>
    );
  }
  const { event, impact: r } = data;
  const t = r.totals;
  const generatedAt = new Date();

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 print:px-0">
      <AutoRefresh seconds={30} />
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <Link href={`/o/${event.id}`} className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text">
          <ArrowLeft className="size-4" aria-hidden /> Board
        </Link>
        <span className="flex-1" />
        <PrintButton />
      </div>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
          Baton · Impact report{event.isDemo && " · Demo event"}
        </p>
        <h1 className="font-serif font-normal tracking-[-0.025em] mt-1 text-[38px] leading-[1.02] sm:text-5xl">{event.name}</h1>
      </header>

      {t.reports === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">No real reports yet</p>
          <p className="mt-1 text-sm text-text-2">This report fills in as attendees and crew raise issues. It only ever counts recorded activity.</p>
        </section>
      ) : (
        <>
          <section className="mt-6 rounded-[2rem] bg-[linear-gradient(160deg,#FBE6DF_0%,#F7D3C8_45%,#F4A493_100%)] p-8 sm:p-10 print:bg-none print:border print:border-border" aria-label="Headline">
            <p className="font-serif text-5xl font-normal leading-none tracking-[-0.03em] tabular-nums sm:text-7xl">
              {t.reports} {t.reports === 1 ? "report" : "reports"} <span className="text-text-3">→</span> {t.incidents} {t.incidents === 1 ? "issue" : "issues"}
            </p>
            <p className="mt-2 text-[15px] text-text-2">
              {t.duplicatesAbsorbed > 0
                ? `${t.duplicatesAbsorbed} duplicate ${t.duplicatesAbsorbed === 1 ? "report was" : "reports were"} folded into existing issues, so nobody worked the same problem twice.`
                : "Every report was a distinct issue."}{" "}
              {t.resolved} fixed, {t.claimed} in progress, {t.open} waiting.
            </p>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Key numbers">
            <Stat label="Time to an owner" value={fmtDuration(r.timeToClaim.medianSec)} note={durNote(r.timeToClaim)} />
            <Stat label="Time to fixed" value={fmtDuration(r.timeToFix.medianSec)} note={durNote(r.timeToFix)} />
            <Stat
              label="Reporters told it was fixed"
              value={t.attendeeReporters ? `${t.attendeesClosedLoop} of ${t.attendeeReporters}` : "—"}
              note={t.attendeeReporters ? `${t.attendeesNotified} received live updates` : "No attendee reports yet"}
            />
            <Stat label="Waiting for an owner" value={String(t.open)} note={r.oldestOpenSec !== null ? `Oldest: ${fmtDuration(r.oldestOpenSec)}` : "Nothing waiting"} tone={t.open ? "open" : undefined} />
          </section>
          <p className="mt-3 text-[13px] text-text-2">
            {t.fromChat > 0 && <>{t.fromChat} raised straight from crew chat. </>}
            {t.escalated > 0 ? <>{t.escalated} needed a nudge to a named lead.</> : <>No issue needed escalating to a lead.</>}
          </p>

          {r.timeline.length > 1 && (
            <section className="mt-6 rounded-xl border border-border bg-surface p-5" aria-labelledby="activity">
              <h2 id="activity" className="text-sm font-semibold">
                Activity
              </h2>
              <ActivityChart buckets={r.timeline} />
            </section>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-border bg-surface p-5" aria-labelledby="zones">
              <h2 id="zones" className="text-sm font-semibold">
                By location
              </h2>
              <Bars rows={r.byZone.map((z) => ({ key: z.zoneId ?? "none", label: z.name, value: z.reports, detail: `${z.incidents} ${z.incidents === 1 ? "issue" : "issues"}${z.open ? ` · ${z.open} waiting` : ""} · owner in ${fmtDuration(z.timeToClaim.medianSec)}` }))} unit="reports" />
            </section>
            <section className="rounded-xl border border-border bg-surface p-5" aria-labelledby="categories">
              <h2 id="categories" className="text-sm font-semibold">
                By type
              </h2>
              <Bars rows={r.byCategory.map((c) => ({ key: c.category, label: CATEGORY_LABEL[c.category] ?? c.category, value: c.reports, detail: `${c.incidents} ${c.incidents === 1 ? "issue" : "issues"}` }))} unit="reports" />
            </section>
          </div>

          {r.responders.length > 0 && (
            <section className="mt-4 rounded-xl border border-border bg-surface p-5" aria-labelledby="crew">
              <h2 id="crew" className="text-sm font-semibold">
                Crew
              </h2>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-3">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 text-right font-medium">Took on</th>
                    <th className="pb-2 text-right font-medium">Fixed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {r.responders.map((p) => (
                    <tr key={p.memberId}>
                      <td className="py-2">
                        {p.name}
                        {p.simulated && <span className="text-text-3"> · simulated</span>}
                      </td>
                      <td className="py-2 text-right tabular-nums">{p.claimed}</td>
                      <td className="py-2 text-right tabular-nums">{p.resolved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}

      <footer className="mt-8 space-y-1 text-xs text-text-3">
        <p>
          Computed from recorded activity at {generatedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC. Times are medians; p90 shown beneath.
        </p>
        {r.simulated.reports > 0 && (
          <p>
            Excludes {r.simulated.reports} simulated demo {r.simulated.reports === 1 ? "report" : "reports"} ({Math.round(r.simulated.share * 100)}% of all reports). Simulated activity is never counted as real use.
          </p>
        )}
      </footer>
    </main>
  );
}

function durNote(d: Duration) {
  return d.samples ? `p90 ${fmtDuration(d.p90Sec)} · ${d.samples} ${d.samples === 1 ? "issue" : "issues"}` : "No data yet";
}

function Stat({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "open" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-text-2">{label}</p>
      <p className={tone === "open" ? "mt-1.5 font-serif text-[34px] leading-none tabular-nums text-open" : "mt-1.5 font-serif text-[34px] leading-none tabular-nums"}>{value}</p>
      <p className="mt-0.5 text-xs text-text-3">{note}</p>
    </div>
  );
}

/** Single-series magnitude bars: one hue, value labelled in text ink, detail line beneath. */
function Bars({ rows, unit }: { rows: { key: string; label: string; value: number; detail: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="mt-3 space-y-3">
      {rows.map((r) => (
        <li key={r.key} title={`${r.label}: ${r.value} ${unit} · ${r.detail}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="tabular-nums text-text-2">{r.value}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-surface-2">
            <div className="h-2 rounded-full bg-chart-1" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <p className="mt-0.5 text-xs text-text-3">{r.detail}</p>
        </li>
      ))}
    </ul>
  );
}
