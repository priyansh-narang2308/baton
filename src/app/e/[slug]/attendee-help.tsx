"use client";

import { Check, CircleDot, MapPin, Phone, UserCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, ConnectionBanner, cx, ErrorNote, inputClass } from "@/components/ui";
import { connect, onMessage, useNexconn } from "@/lib/nexconn-client";
import { api } from "@/lib/types";

// Medical sits first and full width (the one that can't wait); the other six fill three even rows.
const CHIPS = [
  { key: "medical", label: "Medical" },
  { key: "supplies", label: "Water & supplies" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "directions", label: "Directions & info" },
  { key: "tech", label: "Tech / AV" },
  { key: "lost_found", label: "Lost & found" },
  { key: "other", label: "Something else" },
] as const;

type MyReport = { reportId: string; incidentId: string; number: number; status: string; title: string; reportCount: number; ownerName: string | null; createdAt: number; claimedAt: number | null; resolvedAt: number | null };

export function AttendeeHelp({ slug, eventId, eventName, zone, ended, isDemo }: { slug: string; eventId: string; eventName: string; zone: { slug: string; name: string } | null; ended: boolean; isDemo: boolean }) {
  const [category, setCategory] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<MyReport[] | null>(null);
  const [composing, setComposing] = useState(false);
  // Attendees connect to messaging only once they have a report to follow.
  const conn = useNexconn(eventId, "attendee", Boolean(reports?.length));

  const load = useCallback(() => {
    return api<{ reports: MyReport[] }>(`/api/e/${slug}/reports`).then(
      (r) => setReports(r.reports),
      (e: Error) => setError(e.message),
    );
  }, [slug]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    // Status DMs from the crew bot trigger a re-read of the authoritative status.
    return onMessage((m) => {
      if (m.messageType === "BTN:Status") load();
    });
  }, [load]);

  useEffect(() => {
    if (conn.state !== "connected") return;
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [conn.state, load]);

  async function submit() {
    if (!category) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/e/${slug}/reports`, { method: "POST", body: JSON.stringify({ category, zone: zone?.slug ?? null, text: text.trim() }) });
      setText("");
      setCategory(null);
      setComposing(false);
      await load();
      connect(eventId, "attendee").catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const showForm = composing || (reports !== null && reports.length === 0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {reports && reports.length > 0 && <ConnectionBanner state={conn.state === "not_configured" ? "not_configured" : conn.state === "connected" || conn.state === "idle" ? "idle" : conn.state} />}
      <div className="flex-1 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
          {eventName}
          {isDemo && " · Demo"}
        </p>
        <h1 className="font-serif font-normal tracking-[-0.025em] mt-1 text-[38px]">{showForm ? "What do you need?" : "Your requests"}</h1>
        {zone && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[13px] text-text-2">
            <MapPin className="size-3.5" aria-hidden /> {zone.name}
          </p>
        )}

        {ended && <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-text-2">This event has ended. Thanks for helping make it better.</p>}

        {!ended && showForm && (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="What is it about?">
              {CHIPS.map((c) => (
                <button
                  key={c.key}
                  role="radio"
                  aria-checked={category === c.key}
                  onClick={() => setCategory(c.key)}
                  className={cx(
                    "min-h-14 rounded-2xl border px-3.5 py-3 text-left text-[15px] font-medium transition-colors",
                    category === c.key
                      ? c.key === "medical"
                        ? "border-urgent bg-urgent-soft text-urgent"
                        : "border-accent bg-accent-soft text-accent"
                      : c.key === "medical"
                        ? "border-urgent/40 bg-surface text-urgent hover:bg-urgent-soft"
                        : "border-border bg-surface text-text hover:bg-surface-2",
                    c.key === "medical" && "col-span-2",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {category === "medical" && (
              <a href="tel:112" className="flex items-center gap-2 rounded-xl border border-urgent/40 bg-urgent-soft px-4 py-3 text-[15px] font-medium text-urgent">
                <Phone className="size-4" aria-hidden /> Emergency? Call 112 now
              </a>
            )}
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500} placeholder="Add details (optional) — e.g. “water dispenser empty”" className={cx(inputClass, "h-auto py-2.5")} aria-label="Details" />
            {error && <ErrorNote>{error}</ErrorNote>}
            <Button variant="primary" size="lg" className="w-full" disabled={!category} busy={busy} onClick={submit}>
              Send to the crew
            </Button>
            <p className="text-center text-xs text-text-3">Anonymous. No app or account needed.</p>
          </div>
        )}

        {!showForm && reports && (
          <div className="mt-6 space-y-3">
            {reports.map((r) => (
              <StatusCard key={r.reportId} r={r} />
            ))}
            {!ended && (
              <Button variant="secondary" className="w-full" onClick={() => setComposing(true)}>
                Report something else
              </Button>
            )}
          </div>
        )}
        {reports === null && !error && <p className="mt-8 text-sm text-text-3">Loading…</p>}
      </div>
      <footer className="p-4 text-center text-xs text-text-3">Powered by Baton</footer>
    </main>
  );
}

function StatusCard({ r }: { r: MyReport }) {
  const steps = [
    { key: "sent", label: "Sent to the crew", done: true, icon: CircleDot },
    { key: "claimed", label: r.ownerName ? `${r.ownerName} from the crew is on it` : "A crew member is on it", done: r.status === "claimed" || r.status === "resolved", icon: UserCheck },
    { key: "resolved", label: "Fixed", done: r.status === "resolved", icon: Check },
  ];
  const others = r.reportCount - 1;
  return (
    <article aria-live="polite" className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-text-3">Request #{r.number}</p>
      <h2 className="mt-0.5 font-semibold">{r.title}</h2>
      {others > 0 && <p className="mt-1 text-[13px] text-text-2">{others === 1 ? "1 other person" : `${others} other people`} reported this too — the crew is handling it once.</p>}
      <ol className="mt-4 space-y-3">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            <span className={cx("grid size-7 place-items-center rounded-full", s.done ? (s.key === "resolved" ? "bg-done text-white" : s.key === "claimed" ? "bg-claimed text-white" : "bg-accent text-accent-ink") : "border border-border text-text-3")}>
              <s.icon className="size-3.5" aria-hidden />
            </span>
            <span className={cx("text-[15px]", s.done ? "text-text" : "text-text-3")}>{s.label}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
