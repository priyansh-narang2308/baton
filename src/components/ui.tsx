"use client";

import { Loader2, WifiOff } from "lucide-react";
import { useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { ConnectionState } from "@/lib/nexconn-client";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "claim" | "done"; size?: "sm" | "md" | "lg"; busy?: boolean };

export function Button({ variant = "secondary", size = "md", busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background,color,box-shadow,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-[15px]",
        variant === "primary" && "bg-accent text-accent-ink hover:brightness-110",
        variant === "secondary" && "border border-border bg-surface text-text hover:bg-surface-2",
        variant === "ghost" && "text-text-2 hover:bg-surface-2 hover:text-text",
        variant === "claim" && "bg-claimed text-white hover:brightness-110",
        variant === "done" && "bg-done text-white hover:brightness-110",
        className,
      )}
    >
      {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-xl border border-border bg-surface", className)}>{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-text">{label}</span>
      {children}
      {hint && <span className="block text-xs text-text-3">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-lg border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

const CONNECTION_COPY: Partial<Record<ConnectionState, { text: string; tone: "warn" | "bad" }>> = {
  connecting: { text: "Connecting to live updates…", tone: "warn" },
  reconnecting: { text: "Connection lost — reconnecting…", tone: "warn" },
  offline: { text: "You're offline. We'll reconnect automatically.", tone: "warn" },
  kicked: { text: "You opened Baton on another device with this identity. This tab stopped receiving updates.", tone: "bad" },
  needs_reconnect: { text: "Live updates stopped after several retries.", tone: "bad" },
  not_configured: { text: "Messaging isn't configured on this server yet (missing Nexconn credentials).", tone: "bad" },
  error: { text: "Couldn't connect to live updates.", tone: "bad" },
};

export function ConnectionBanner({ state, error, onRetry }: { state: ConnectionState; error?: string | null; onRetry?: () => void }) {
  const copy = CONNECTION_COPY[state];
  if (!copy && !error) return null;
  const bad = error || copy?.tone === "bad";
  return (
    <div role="status" aria-live="polite" className={cx("flex items-center gap-2 px-4 py-2 text-[13px]", bad ? "bg-danger/10 text-danger" : "bg-open-soft text-open")}>
      {state === "connecting" || state === "reconnecting" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
      <span className="flex-1">{error ?? copy?.text}</span>
      {onRetry && (bad || state === "needs_reconnect") && (
        <button onClick={onRetry} className="font-medium underline underline-offset-2">
          Reconnect
        </button>
      )}
    </div>
  );
}

export function timeAgo(ts: number, now: number) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const noopSubscribe = () => () => {};
/** window.location.origin on the client, "" during server rendering (no hydration mismatch). */
export function useOrigin() {
  return useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
}
