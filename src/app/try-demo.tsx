"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { api } from "@/lib/types";

export function TryDemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="primary"
        size="lg"
        busy={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const { eventId } = await api<{ eventId: string }>("/api/demo", { method: "POST" });
            router.push(`/demo/${eventId}`);
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        Try Baton live
      </Button>
      {error && (
        <p role="alert" className="mt-2 max-w-sm text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
