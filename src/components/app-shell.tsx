"use client";

import Link from "next/link";
import {
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";
import { cx } from "./ui";

/** One section of an app screen, shown in the laptop sidebar and the phone bottom tabs. */
export type ShellSection<K extends string> = {
  key: K;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  /** One line under the section title on laptops. */
  hint: string;
  count?: number;
  /** "alert" counts (unread) are filled black and also show on the phone tab. */
  countTone?: "alert" | "task" | "plain";
};

const DESKTOP = "(min-width: 1024px)";
/** True at the `lg` breakpoint and up, where the app screens use their laptop layout. */
export function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(DESKTOP);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}

/** Baton's striped half-sun, the same mark as the landing page. */
export function BatonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" aria-hidden className={className}>
      <clipPath id="baton-mark-bands">
        <rect width="28" height="9" />
        <rect y="11" width="28" height="3" />
        <rect y="16" width="28" height="2" />
      </clipPath>
      <circle
        cx="14"
        cy="18"
        r="13"
        clipPath="url(#baton-mark-bands)"
        fill="currentColor"
      />
    </svg>
  );
}

/** Laptop sidebar: brand, event, section nav, then whatever the screen puts in the footer. */
export function Sidebar<K extends string>({
  label,
  eyebrow,
  title,
  sections,
  current,
  onSelect,
  links,
  footer,
}: {
  label: string;
  eyebrow: string;
  title: string;
  sections: ShellSection<K>[];
  current: K;
  onSelect: (k: K) => void;
  links?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <aside
      className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex"
      aria-label={label}
    >
      <div className="border-b border-border p-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text"
          aria-label="Baton home"
        >
          <BatonMark className="h-[15px] w-[21px]" />
          <span className="font-serif text-[22px] leading-none tracking-[-0.02em]">
            Baton
          </span>
        </Link>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
          {eyebrow}
        </p>
        <p className="mt-1 font-serif text-[24px] leading-[1.1] tracking-[-0.02em]">
          {title}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-0.5" aria-label="Sections">
          {sections.map(({ key, Icon, label, count, countTone }) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-current={current === key ? "page" : undefined}
              className={cx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                current === key
                  ? "bg-surface-2 font-medium text-text"
                  : "text-text-2 hover:bg-surface-2/60 hover:text-text",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              <span className="flex-1">{label}</span>
              {!!count && (
                <span
                  className={cx(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
                    countTone === "alert"
                      ? "bg-accent text-accent-ink"
                      : current === key
                        ? "bg-bg text-text-2"
                        : "bg-surface-2 text-text-2",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>
        {links && (
          <div className="mt-4 space-y-0.5 border-t border-border pt-4">
            {links}
          </div>
        )}
      </div>
      {footer && (
        <div className="space-y-3 border-t border-border p-4">{footer}</div>
      )}
    </aside>
  );
}

/** A secondary link in the sidebar (another page of the same event). */
export function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-2 transition-colors hover:bg-surface-2/60 hover:text-text"
    >
      {icon}
      {children}
    </Link>
  );
}

/** Who is signed in on this screen, with the live connection state. */
export function SignedInAs({
  name,
  role,
  connected,
  liveLabel,
}: {
  name: string;
  role: string;
  connected: boolean;
  liveLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="flex items-center gap-1.5 text-xs text-text-3">
          <span
            className={cx(
              "size-1.5 rounded-full",
              connected ? "bg-done" : "bg-open",
            )}
            aria-hidden
          />
          {role} · {liveLabel}
        </p>
      </div>
    </div>
  );
}

/** Laptop: the current section's title. */
export function SectionHeader({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children?: ReactNode;
}) {
  return (
    <header className="hidden items-end gap-4 border-b border-border px-8 pb-5 pt-7 lg:flex">
      <div className="min-w-0 flex-1">
        <h1 className="font-serif text-[34px] font-normal leading-none tracking-[-0.025em]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-text-3">{hint}</p>
      </div>
      {children}
    </header>
  );
}

/** Phone: bottom tabs. */
export function BottomTabs<K extends string>({
  sections,
  current,
  onSelect,
}: {
  sections: ShellSection<K>[];
  current: K;
  onSelect: (k: K) => void;
}) {
  return (
    <nav
      className="grid border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{
        gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))`,
      }}
      aria-label="Sections"
    >
      {sections.map(({ key, Icon, label, count, countTone }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          aria-current={current === key ? "page" : undefined}
          className={cx(
            "relative flex flex-col items-center gap-1 pb-2 pt-1.5 text-[11px]",
            current === key ? "font-medium text-text" : "text-text-3",
          )}
        >
          <span
            className={cx(
              "grid h-7 w-12 place-items-center rounded-full transition-colors",
              current === key && "bg-surface-2",
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
          </span>
          {label}
          {!!count && countTone && countTone !== "plain" && (
            <span
              className={cx(
                "absolute left-1/2 top-1 ml-3 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold",
                countTone === "alert"
                  ? "bg-accent text-accent-ink"
                  : "bg-claimed text-white",
              )}
              aria-label={`${count} ${countTone === "alert" ? "unread" : "items"}`}
            >
              {count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

export function liveLabelFor(state: string) {
  return state === "connected"
    ? "Live"
    : state === "connecting" || state === "idle"
      ? "Connecting…"
      : "Offline";
}

/** Green when Nexconn reports the person connected; nothing at all when presence isn't tracked yet. */
export function PresenceDot({
  online,
  className,
}: {
  online: boolean | null | undefined;
  className?: string;
}) {
  if (online === null || online === undefined) return null;
  return (
    <span
      className={cx(
        "inline-block size-2 shrink-0 rounded-full",
        online ? "bg-done" : "bg-border-strong",
        className,
      )}
      title={online ? "Online now" : "Offline"}
      aria-label={online ? "Online now" : "Offline"}
      role="img"
    />
  );
}
