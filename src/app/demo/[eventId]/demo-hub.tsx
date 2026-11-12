"use client";

import { Check, ExternalLink, FlaskConical, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, cx, ErrorNote, useOrigin } from "@/components/ui";
import { api, type EventState } from "@/lib/types";

type Step = {
  title: string;
  todo: string;
  nexconn: string;
  path: string;
  linkLabel: string;
  done: (s: EventState) => boolean;
};

/**
 * Judge-facing guided demo of one private demo event. Each step ticks itself off from the event's real state
 * (polled with the organizer session this browser got when the demo was created), so nothing here is scripted.
 */
export function DemoHub({ eventId, crewCode, slug }: { eventId: string; crewCode: string; slug: string }) {
  const origin = useOrigin();
  const [state, setState] = useState<EventState | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      if (document.visibilityState !== "visible") return;
      try {
        const s = await api<EventState>(`/api/events/${eventId}/state`);
        if (!stop) setState(s);
      } catch {
        // The next poll retries; the steps simply stay as they were.
      }
    }
    load();
    const t = setInterval(load, 3000);
    document.addEventListener("visibilitychange", load);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", load);
    };
  }, [eventId]);

  const real = (s: EventState) => s.crew.some((m) => m.role === "volunteer" && !m.isSimulated);
  const steps: Step[] = [
    {
      title: "Join the crew as Riya",
      todo: "Opens the volunteer invite with the name filled in. Tap Join.",
      nexconn: "Baton's server registers Riya as a Nexconn user and adds her to the event's crew group; her browser connects with the Chat SDK.",
      path: `/join/${crewCode}?name=Riya`,
      linkLabel: "Open volunteer view",
      done: real,
    },
    {
      title: "Report a problem as an attendee",
      todo: "No app, no account: pick “Water & supplies”, type “no water at Gate 3” and send.",
      nexconn: "Baton's bot posts the incident card into the crew group as a Nexconn message. Watch it appear in Riya's tab.",
      path: `/e/${slug}?z=gate-3`,
      linkLabel: "Open attendee view",
      done: (s) => s.incidents.some((i) => i.origin === "report"),
    },
    {
      title: "Claim it as Riya",
      todo: "In Riya's tab, tap “I'll take it”. The attendee's page now says who is on it.",
      nexconn: "The claim updates the card message's metadata, so every open screen redraws the card without a reload.",
      path: `/c/${eventId}`,
      linkLabel: "Back to Riya",
      done: (s) => s.incidents.some((i) => i.ownerMemberId !== null),
    },
    {
      title: "Ask for help in crew chat",
      todo: "In Riya's crew chat, type “mic not working in Hall B”. A new card marked “From chat” appears.",
      nexconn: "Nexconn's message:send webhook hands the chat line to Baton, which turns it into a request.",
      path: `/c/${eventId}`,
      linkLabel: "Back to Riya",
      done: (s) => s.incidents.some((i) => i.origin === "chat"),
    },
    {
      title: "Mark one fixed",
      todo: "Riya taps “Mark fixed”. If it was the attendee's report, their page shows it as fixed.",
      nexconn: "Another metadata update on the same card message; the organizer board moves it to Fixed live.",
      path: `/c/${eventId}`,
      linkLabel: "Back to Riya",
      done: (s) => s.incidents.some((i) => i.status === "resolved"),
    },
  ];
  const doneCount = state ? steps.filter((s) => s.done(state)).length : 0;
  const nextIndex = state ? steps.findIndex((s) => !s.done(state)) : 0;

  const phones = [
    { title: "Attendee", path: `/e/${slug}?z=gate-3` },
    { title: "Volunteer", path: `/join/${crewCode}?name=Riya` },
    { title: "Organizer board", path: `/o/${eventId}` },
  ];

  async function simulate() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ results: { outcome: string; reportCount: number }[] }>(`/api/demo/${eventId}/simulate`, {
        method: "POST",
        body: JSON.stringify({
          zone: "gate-3",
          category: "supplies",
          texts: ["No drinking water at Gate 3", "water dispenser empty near entrance"],
        }),
      });
      const last = r.results.at(-1);
      setNote(last ? `Added 2 simulated reports. The card now shows ${last.reportCount} reports.` : "Done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink">Baton · Live demo</p>
      <h1 className="mt-1 font-serif text-[34px] font-normal leading-[1.02] tracking-tight sm:text-5xl">
        Five steps, about two minutes
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-text-2">
        A private demo event on the real product and real Nexconn messaging. Each link opens a new tab; keep this page
        open and the steps tick themselves off as they really happen. The{" "}
        <a href={`${origin}/o/${eventId}`} target="_blank" rel="noopener" className="font-medium text-brand-ink underline underline-offset-2">
          organizer board
        </a>{" "}
        shows everything live in a third tab.
      </p>

      <div className="mt-5 flex items-center gap-3" aria-live="polite">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-done transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
        <p className="text-sm tabular-nums text-text-2">
          {state ? `${doneCount} of ${steps.length} done` : "Checking…"}
        </p>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((s, idx) => {
          const done = state ? s.done(state) : false;
          const current = idx === nextIndex;
          return (
            <li
              key={s.title}
              className={cx(
                "rounded-xl border bg-surface p-4 sm:p-5",
                current ? "border-brand shadow-sm" : "border-border",
              )}
            >
              <div className="flex gap-3">
                <span
                  className={cx(
                    "grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold",
                    done ? "bg-done text-white" : current ? "bg-brand text-white" : "bg-surface-2 text-text-2",
                  )}
                  aria-hidden
                >
                  {done ? <Check className="size-4" /> : idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">
                    {s.title}
                    {done && <span className="sr-only"> (done)</span>}
                  </h2>
                  <p className="mt-0.5 text-sm text-text-2">{s.todo}</p>
                  <p className="mt-2 text-xs text-text-3">
                    <span className="font-semibold text-text-2">Nexconn:</span> {s.nexconn}
                  </p>
                </div>
                <a
                  href={`${origin}${s.path}`}
                  target="_blank"
                  rel="noopener"
                  className={cx(
                    "hidden h-9 shrink-0 items-center gap-1.5 self-center rounded-full px-4 text-sm font-medium sm:inline-flex",
                    current ? "bg-accent text-accent-ink" : "border border-border text-text",
                  )}
                >
                  {s.linkLabel} <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
              <a
                href={`${origin}${s.path}`}
                target="_blank"
                rel="noopener"
                className={cx(
                  "mt-3 flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium sm:hidden",
                  current ? "bg-accent text-accent-ink" : "border border-border text-text",
                )}
              >
                {s.linkLabel} <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </li>
          );
        })}
      </ol>

      {state && doneCount === steps.length && (
        <p className="mt-4 rounded-xl bg-done/10 p-4 text-sm text-text">
          That&apos;s the loop: every request got an owner, the reporter was told, and nothing was lost in the chat. Try{" "}
          <strong>Pass</strong> on a claimed card next: Riya stays the owner until the teammate accepts.
        </p>
      )}

      <section className="mt-8 rounded-xl border border-border p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Smartphone className="size-4" aria-hidden /> On phones instead
        </h2>
        <p className="mt-1 text-sm text-text-2">Scan each code with a different phone to see the views on separate devices.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {phones.map((p) => (
            <figure key={p.path} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr?path=${encodeURIComponent(p.path)}`} alt={`QR code for the ${p.title} view`} className="mx-auto size-28 sm:size-36" />
              <figcaption className="mt-1 text-xs text-text-2">{p.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-dashed border-border-strong p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <FlaskConical className="size-4" aria-hidden /> Simulate more attendees (labelled, demo only)
        </h2>
        <p className="mt-1 text-sm text-text-2">
          After the first water report, add two more from simulated attendees at Gate 3. They join the same card instead
          of creating new ones. Simulated people are never counted as real users.
        </p>
        <Button className="mt-3" variant="secondary" busy={busy} onClick={simulate}>
          Add 2 simulated reports at Gate 3
        </Button>
        {note && <p className="mt-2 text-sm text-done">{note}</p>}
        {error && (
          <div className="mt-2">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </section>
    </main>
  );
}
