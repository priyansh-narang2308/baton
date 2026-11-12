"use client";

import { Loader2, WifiOff } from "lucide-react";
import { useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { ConnectionState } from "@/lib/nexconn-client";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "claim" | "done"; size?: "sm" | "md" | "lg"; busy?: boolean };

export function Button({ variant = "secondary", size = "md", busy, className, children, disabled, ...rest }: ButtonProps) {
  // Icon-only buttons pass their own width and px-0; don't let the size padding fight it.
  const iconOnly = /(^|\s)px-0(\s|$)/.test(className ?? "");
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cx(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full [&>svg]:shrink-0 font-medium transition-[background,color,box-shadow,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && cx("h-8 text-[13px]", !iconOnly && "px-3.5"),
        size === "md" && cx("h-10 text-sm", !iconOnly && "px-5"),
        size === "lg" && cx("h-12 text-[15px] font-semibold", !iconOnly && "px-7"),
        variant === "primary" && "bg-accent text-accent-ink hover:opacity-85",
        variant === "secondary" && "border border-border-strong/70 bg-surface text-text hover:border-text/40",
        variant === "ghost" && "text-text-2 hover:bg-surface-2 hover:text-text",
        variant === "claim" && "bg-accent text-accent-ink hover:opacity-85",
        variant === "done" && "bg-accent text-accent-ink hover:opacity-85",
        className,
      )}
    >
      {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-border bg-surface", className)}>{children}</div>;
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
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] text-text placeholder:text-text-3 focus:border-text/50 focus:outline-none focus:ring-4 focus:ring-brand/15";

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
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
