"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/types";

const DEFAULT_ZONES = "Registration\nMain hall\nGate 3\nFood court";

export default function NewEventPage() {
  const [name, setName] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    eventId: string;
    organizerKey: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ eventId: string; organizerKey: string }>(
        "/api/events",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            organizerName,
            zones: zones
              .split("\n")
              .map((z) => z.trim())
              .filter(Boolean),
          }),
        },
      );
      setCreated(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const link = `${window.location.origin}/enter/${created.eventId}?k=${created.organizerKey}`;
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center p-6">
        <span className="grid size-10 place-items-center rounded-full bg-done-soft text-done">
          <Check className="size-5" aria-hidden />
        </span>
        <h1 className="font-serif font-normal tracking-[-0.025em] mt-4 text-[38px] leading-[1.02] sm:text-5xl">
          Your event is live
        </h1>
        <p className="mt-2 text-sm text-text-2">
          Save this private organizer link — it&apos;s how you get back to the
          board from any device. Anyone with it can manage the event.
        </p>
        <button
          onClick={() =>
            navigator.clipboard?.writeText(link).then(() => setCopied(true))
          }
          className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-left font-mono text-xs text-text-2"
        >
          <span className="flex-1 break-all">{link}</span>
          {copied ? (
            <Check className="size-4 text-done" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
        <div className="mt-6 flex gap-2">
          <Link
            href={`/o/${created.eventId}`}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-ink"
          >
            Open the board
          </Link>
          <Link
            href={`/o/${created.eventId}/share`}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-border bg-surface text-sm font-medium"
          >
            Print QR codes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center p-6">
      <Link
        href="/"
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink"
      >
        Baton
      </Link>
      <h1 className="font-serif font-normal tracking-[-0.025em] mt-1 text-[38px] leading-[1.02] sm:text-5xl">
        Set up your event
      </h1>
      <p className="mt-1 text-sm text-text-2">
        Two minutes. Your crew joins by QR code; attendees report issues from
        posters.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Event name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="TechFest 2026"
            required
            minLength={2}
            maxLength={64}
          />
        </Field>
        <Field label="Your name" hint="You're added as the first crew lead.">
          <input
            className={inputClass}
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            required
            maxLength={40}
          />
        </Field>
        <Field
          label="Locations"
          hint="One per line. Each gets its own attendee QR poster so reports arrive with a location."
        >
          <textarea
            className={`${inputClass} h-32 py-2`}
            value={zones}
            onChange={(e) => setZones(e.target.value)}
          />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full cursor-pointer"
          busy={busy}
        >
          Create event
        </Button>
      </form>
    </main>
  );
}
