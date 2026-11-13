// Formatting shared by the server-rendered page and the client charts. All dates are shown in UTC.

const nf = new Intl.NumberFormat("en-US");

export function fmtInt(n: number): string {
  if (n >= 10_000) return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  return nf.format(n);
}

const NB = "\u00a0"; // keeps "3 m 12 s" on one line

export function fmtDuration(sec: number | null): string {
  if (sec === null) return "—";
  return fmtDurationRaw(sec).replace(/ /g, NB);
}

function fmtDurationRaw(sec: number): string {
  if (sec < 60) return `${sec} s`;
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? `${m} m ${s} s` : `${m} m`;
  }
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m ? `${h} h ${m} m` : `${h} h`;
}

export function fmtDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function fmtDateTime(ms: number): string {
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${date}, ${time} UTC`;
}

export function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}
