"use client";

import { ExternalLink, FlaskConical } from "lucide-react";
import { useState } from "react";
import { Button, ErrorNote, useOrigin } from "@/components/ui";
import { api } from "@/lib/types";

/** Judge-facing hub: three real role views of one private demo event, plus clearly-labelled simulated reporters. */
export function DemoHub({
  eventId,
  crewCode,
  slug,
}: {
  eventId: string;
  crewCode: string;
  slug: string;
}) {
  const origin = useOrigin();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roles = [
    {
      title: "1 · Attendee at Gate 3",
      body: "Report a problem the way an attendee would — no app, no account.",
      path: `/e/${slug}?z=gate-3`,
    },
    {
      title: "2 · Volunteer",
      body: "Joins by QR, sees the live incident card, claims it.",
      path: `/join/${crewCode}?name=Riya`,
    },
    {
      title: "3 · Organizer board",
      body: "Everything that needs an owner, who has it, and what changed.",
      path: `/o/${eventId}`,
    },
  ];

  async function simulate() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{
        results: { outcome: string; reportCount: number }[];
      }>(`/api/demo/${eventId}/simulate`, {
        method: "POST",
        body: JSON.stringify({
          zone: "gate-3",
          category: "supplies",
          texts: [
            "No drinking water at Gate 3",
            "water dispenser empty near entrance",
          ],
        }),
      });
      const last = r.results.at(-1);
      setNote(
        last
          ? `Added 2 simulated reports — the card now shows ${last.reportCount} reports.`
          : "Done",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
        Baton · Live demo
      </p>
      <h1 className="font-serif font-normal tracking-tight mt-1 text-[38px] leading-[1.02] sm:text-5xl">
        Open the three views side by side
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-text-2">
        This is a private demo event running on the real product and real
        Nexconn messaging. Open each view in its own window — or scan the codes
        with phones — then report “water” as the attendee and claim it as the
        volunteer.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {roles.map((r) => (
          <section
            key={r.path}
            className="flex flex-col rounded-xl border border-border bg-surface p-5"
          >
            <h2 className="font-semibold">{r.title}</h2>
            <p className="mt-1 flex-1 text-sm text-text-2">{r.body}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr?path=${encodeURIComponent(r.path)}`}
              alt={`QR code for ${r.title}`}
              className="mx-auto my-4 size-36"
            />
            <a
              href={`${origin}${r.path}`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-medium text-accent-ink"
            >
              Open <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-xl border border-dashed border-border-strong p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <FlaskConical className="size-4" aria-hidden /> Simulate more
          attendees (labelled, demo only)
        </h2>
        <p className="mt-1 text-sm text-text-2">
          After the first water report, add two more reports from simulated
          attendees at Gate 3. Watch them join the same card instead of creating
          new ones. Simulated people are never counted as real users.
        </p>
        <Button
          className="mt-3"
          variant="secondary"
          busy={busy}
          onClick={simulate}
        >
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
