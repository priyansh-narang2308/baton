"use client";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";

/** Keeps a live event's report current without a full reload. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

export function PrintButton() {
  return (
    <Button size="sm" variant="secondary" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden /> Print / save PDF
    </Button>
  );
}

type Bucket = { start: number; reports: number; resolved: number };

const noop = () => () => {};
/** Clock times are formatted in the viewer's time zone and locale, so only after hydration. */
function useTimeFormatter() {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  return (t: number) => (hydrated ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
}

/** Reports vs fixed per interval: paired bars on one axis, legend + hover tooltip + table view. */
export function ActivityChart({ buckets }: { buckets: Bucket[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const fmtTime = useTimeFormatter();
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.reports, b.resolved)));
  const H = 140;
  const W = 640;
  const slot = W / buckets.length;
  const bar = Math.max(3, Math.min(14, slot / 2 - 3));
  const h = (v: number) => (v / max) * (H - 4);
  const ticks = [0, Math.round(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);
  const hb = hover !== null ? buckets[hover] : null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-4 text-xs text-text-2" aria-hidden>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-chart-1" /> Reports in
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-chart-2" /> Fixed
        </span>
      </div>
      <div className="relative mt-2">
        <svg viewBox={`0 0 ${W + 28} ${H + 22}`} className="h-auto w-full" role="img" aria-label="Reports received and issues fixed over time" onMouseLeave={() => setHover(null)}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={28} x2={W + 28} y1={H - h(v)} y2={H - h(v)} stroke="var(--border)" strokeWidth={1} />
              <text x={22} y={H - h(v) + 3} textAnchor="end" fontSize={10} fill="var(--text-3)">
                {v}
              </text>
            </g>
          ))}
          {buckets.map((b, i) => {
            const x = 28 + i * slot + slot / 2;
            return (
              <g key={b.start} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${fmtTime(b.start)}: ${b.reports} reports, ${b.resolved} fixed`}>
                <rect x={28 + i * slot} y={0} width={slot} height={H} fill={hover === i ? "var(--surface-2)" : "transparent"} />
                {b.reports > 0 && <rect x={x - bar - 1} y={H - h(b.reports)} width={bar} height={h(b.reports)} rx={2} fill="var(--chart-1)" />}
                {b.resolved > 0 && <rect x={x + 1} y={H - h(b.resolved)} width={bar} height={h(b.resolved)} rx={2} fill="var(--chart-2)" />}
              </g>
            );
          })}
          <text x={28} y={H + 16} fontSize={10} fill="var(--text-3)">
            {fmtTime(buckets[0].start)}
          </text>
          <text x={W + 28} y={H + 16} fontSize={10} textAnchor="end" fill="var(--text-3)">
            {fmtTime(buckets[buckets.length - 1].start)}
          </text>
        </svg>
        {hb && (
          <div className="pointer-events-none absolute top-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs shadow-pop" style={{ left: `${((hover! + 0.5) / buckets.length) * 100}%`, transform: "translateX(-50%)" }}>
            <p className="font-medium">{fmtTime(hb.start)}</p>
            <p className="text-text-2">
              {hb.reports} reports in · {hb.resolved} fixed
            </p>
          </div>
        )}
      </div>
      <details className="mt-2 text-xs text-text-2 print:hidden">
        <summary className="cursor-pointer">Show as table</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left text-text-3">
              <th className="font-medium">From</th>
              <th className="text-right font-medium">Reports in</th>
              <th className="text-right font-medium">Fixed</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.start}>
                <td>{fmtTime(b.start)}</td>
                <td className="text-right tabular-nums">{b.reports}</td>
                <td className="text-right tabular-nums">{b.resolved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
