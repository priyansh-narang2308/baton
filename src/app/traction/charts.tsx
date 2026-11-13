"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { fmtDay, fmtInt } from "./format";

/*
 * Hand-built SVG charts for /traction. Specs follow the dataviz rules: columns ≤ 24px with 4px rounded data ends,
 * 2px lines, hairline recessive grid, one y-axis, a crosshair/hover readout that is also keyboard reachable, and
 * a table view so no value depends on hovering. Text always uses text tokens, never the series colour.
 */

export type Series = { key: string; label: string; color: string; kind: "bar" | "area" };
type Point = Record<string, number> & { day: number };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Whole-number tick step so that four steps cover the largest value (counts are never fractional). */
function niceStep(v: number) {
  const raw = Math.max(1, v / 4);
  const pow = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * pow >= raw) return Math.max(1, m * pow);
  return 10 * pow;
}

/** Rounded-top column path: 4px radius at the data end, square at the baseline. */
function colPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  if (h <= 0) return "";
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export function TimeChart({ data, series, height = 220, unit }: { data: Point[]; series: Series[]; height?: number; unit: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();
  const m = { l: 34, r: 8, t: 14, b: 28 };
  const iw = width - m.l - m.r;
  const ih = height - m.t - m.b;
  const n = data.length;
  const band = iw / Math.max(1, n);
  const step = niceStep(Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key] ?? 0))));
  const max = step * 4;
  const y = (v: number) => m.t + ih - (v / max) * ih;
  const ticks = [0, step, step * 2, step * 3, max];
  const bars = series.filter((s) => s.kind === "bar" || n < 3);
  const areas = series.filter((s) => s.kind === "area" && n >= 3);
  const gap = 2;
  const bw = Math.max(2, Math.min(24, (band * 0.62 - gap * (bars.length - 1)) / Math.max(1, bars.length)));
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  const cx = (i: number) => m.l + band * i + band / 2;

  const move = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left - m.l) / band);
    setHover(i >= 0 && i < n ? i : null);
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  };
  const hp = hover !== null ? data[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(cx(hover) - 80, 0), width - 160) : 0;

  return (
    <div ref={ref} className="relative">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${series.map((s) => s.label).join(" and ")} per day, ${n} days. Use the arrow keys to read each day; the table below lists every value.`}
        aria-describedby={tableId}
        tabIndex={0}
        onPointerMove={move}
        onPointerLeave={() => setHover(null)}
        onKeyDown={key}
        onBlur={() => setHover(null)}
        className="block touch-pan-y outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-text-3 text-[11px] tabular-nums">
              {fmtInt(t)}
            </text>
          </g>
        ))}
        {hover !== null && <rect x={m.l + band * hover} y={m.t} width={band} height={ih} fill="var(--surface-2)" opacity={0.7} />}
        {areas.map((s) => {
          const pts = data.map((d, i) => [cx(i), y(d[s.key] ?? 0)] as const);
          const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join(" ");
          const area = `${line} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z`;
          return (
            <g key={s.key}>
              <path d={area} fill={s.color} opacity={0.1} />
              <path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {hover !== null && <circle cx={pts[hover][0]} cy={pts[hover][1]} r={4.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />}
            </g>
          );
        })}
        {data.map((d, i) =>
          bars.map((s, k) => {
            const v = d[s.key] ?? 0;
            const x0 = cx(i) - (bars.length * bw + (bars.length - 1) * gap) / 2 + k * (bw + gap);
            return <path key={`${i}-${s.key}`} d={colPath(x0, y(v), bw, y(0) - y(v))} fill={s.color} opacity={hover === null || hover === i ? 1 : 0.55} />;
          }),
        )}
        <line x1={m.l} x2={width - m.r} y1={y(0)} y2={y(0)} stroke="var(--border-strong)" strokeWidth={1} />
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.day} x={cx(i)} y={height - 8} textAnchor="middle" className="fill-text-3 text-[11px]">
              {fmtDay(d.day)}
            </text>
          ) : null,
        )}
      </svg>
      {hp && (
        <div role="status" className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-border bg-surface px-3 py-2.5 text-[12px] shadow-[0_8px_24px_-12px_rgb(10_10_10/0.25)]" style={{ left: tipLeft }}>
          <p className="mb-1.5 font-medium text-text-2">{fmtDay(hp.day)}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden />
              <span className="font-semibold tabular-nums text-text">{fmtInt(hp[s.key] ?? 0)}</span>
              <span className="truncate text-text-3">{s.label.toLowerCase()}</span>
            </p>
          ))}
        </div>
      )}
      {series.length > 1 && <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />}
      <TableView id={tableId} caption={`${series.map((s) => s.label).join(", ")} per day (${unit})`} head={["Day (UTC)", ...series.map((s) => s.label)]} rows={data.map((d) => [fmtDay(d.day), ...series.map((s) => fmtInt(d[s.key] ?? 0))])} />
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-text-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px]" style={{ background: it.color }} aria-hidden />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export function TableView({ id, caption, head, rows }: { id?: string; caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details id={id} className="tv mt-3 text-[12px] text-text-2">
      <summary className="no-print inline-flex cursor-pointer select-none items-center gap-1 rounded-full text-text-3 hover:text-text">View as table</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-surface-2 text-text-2">
            <tr>
              {head.map((h) => (
                <th key={h} scope="col" className="px-3 py-1.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => (
                  <td key={j} className="px-3 py-1.5">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** One whole split into parts (incident lifecycle). Tall segmented bar, 28px, labels inside only when they fit. */
export function SegmentBar({ parts }: { parts: { label: string; value: number; color: string; ink: string }[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const total = parts.reduce((s, p) => s + p.value, 0);
  const visible = parts.filter((p) => p.value > 0);
  const gap = 2;
  const usable = width - gap * Math.max(0, visible.length - 1);
  const widths = visible.map((p) => Math.max(3, (p.value / Math.max(1, total)) * usable));
  const lefts = widths.map((_, i) => widths.slice(0, i).reduce((a, w) => a + w + gap, 0));
  return (
    <div ref={ref}>
      <div className="relative h-7" role="img" aria-label={parts.map((p) => `${p.label}: ${p.value} (${total ? Math.round((p.value / total) * 100) : 0}%)`).join(", ")}>
        {visible.map((p, i) => {
          const w = widths[i];
          const left = lefts[i];
          const share = `${Math.round((p.value / total) * 100)}%`;
          const fits = w > share.length * 7 + 16;
          return (
            <div
              key={p.label}
              tabIndex={0}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="absolute top-0 flex h-7 items-center rounded-[4px] px-2 text-[12px] font-semibold outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-text"
              style={{ left, width: w, background: p.color, color: p.ink, opacity: hover === null || hover === i ? 1 : 0.6 }}
              aria-label={`${p.label}: ${p.value}, ${share}`}
            >
              {fits ? share : ""}
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-text-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} aria-hidden />
            {p.label}
            <span className="font-semibold tabular-nums text-text">{fmtInt(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal paired bars per bucket (time to claim vs time to resolve). */
export function BucketBars({ rows, a, b }: { rows: { label: string; a: number; b: number }[]; a: { label: string; color: string }; b: { label: string; color: string } }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.a, r.b]));
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.label}
            tabIndex={0}
            onPointerEnter={() => setHover(r.label)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(r.label)}
            onBlur={() => setHover(null)}
            className="grid grid-cols-[88px_1fr] items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-text sm:grid-cols-[104px_1fr]"
            aria-label={`${r.label}: ${a.label} ${r.a}, ${b.label} ${r.b}`}
          >
            <span className="text-[12px] text-text-2">{r.label}</span>
            <div className={`space-y-[2px] transition-opacity ${hover && hover !== r.label ? "opacity-55" : ""}`}>
              {([[r.a, a.color], [r.b, b.color]] as const).map(([v, c], k) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="h-2.5 rounded-r-[4px]" style={{ width: `calc(${(v / max) * 100}% * 0.86)`, minWidth: v ? 3 : 0, background: c }} />
                  <span className="text-[11px] font-medium tabular-nums text-text-2">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Legend items={[a, b]} />
    </div>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-2 rounded-full border border-border-strong/70 bg-surface px-4 text-[13px] font-medium text-text transition-colors hover:border-text/40">
      Save as PDF
    </button>
  );
}
