"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorNote, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/types";

export function JoinForm({ code, eventName, zones, defaultName, isDemo }: { code: string; eventName: string; zones: { id: string; name: string }[]; defaultName: string; isDemo: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [zoneId, setZoneId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { eventId } = await api<{ eventId: string }>("/api/join", { method: "POST", body: JSON.stringify({ code, name, zoneId: zoneId || null }) });
      router.push(`/c/${eventId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center p-6">
      <p className="text-sm font-medium text-accent">Baton {isDemo && "· Demo"}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Join the {eventName} crew</h1>
      <p className="mt-1 text-sm text-text-2">No app, no account. You&apos;ll see requests as live cards and can claim them.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Your name" hint="Shown to the crew and to attendees whose request you take.">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} autoComplete="given-name" autoFocus />
        </Field>
        {zones.length > 0 && (
          <Field label="Your area (optional)">
            <select className={inputClass} value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              <option value="">Anywhere</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" variant="primary" size="lg" className="w-full" busy={busy}>
          Join crew
        </Button>
      </form>
    </main>
  );
}
