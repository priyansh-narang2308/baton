"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { api } from "@/lib/types";

/**
 * Creates a private demo event and opens its hub. With `className` it renders a bare button in the caller's style
 * (the landing page's pill buttons); otherwise the app's primary button.
 */
export function TryDemoButton({ className, children, errorClassName }: { className?: string; children?: ReactNode; errorClassName?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const { eventId } = await api<{ eventId: string }>("/api/demo", { method: "POST" });
      router.push(`/demo/${eventId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      {className ? (
        <button type="button" className={className} onClick={start} disabled={busy} aria-busy={busy}>
          {busy ? "Opening the demo…" : (children ?? "Try Baton live")}
        </button>
      ) : (
        <Button variant="primary" size="lg" busy={busy} onClick={start}>
          {children ?? "Try Baton live"}
        </Button>
      )}
      {error && (
        <p role="alert" className={errorClassName ?? "mt-2 max-w-sm text-sm text-danger"}>
          {error}
        </p>
      )}
    </div>
  );
}
