import type { Category } from "../db/schema";

/** Categories that are never auto-merged: a wrong merge here could hide a person in trouble. */
export const SENSITIVE_CATEGORIES: ReadonlySet<Category> = new Set<Category>(["medical", "safety", "lost_found"]);

export const CANDIDATE_WINDOW_MIN = 30;
export const AUTO_ATTACH_MAX_AGE_MIN = 20;
export const AUTO_THRESHOLD = 0.75;
export const SUGGEST_THRESHOLD = 0.45;

const STOP_WORDS = new Set(
  "a an the is are was were be been at in on near by of to for from and or but it its this that there here no not any some please help need needs we i my our there's is'nt isnt very too all out of".split(" "),
);

// Small, hand-curated synonym map — event-floor vocabulary only. Extend from pilot data, never guess broadly.
const SYNONYMS: Record<string, string> = {
  drinking: "water", dispenser: "water", bottle: "water", bottles: "water", cooler: "water", refill: "water",
  bin: "trash", bins: "trash", dustbin: "trash", garbage: "trash", rubbish: "trash", litter: "trash",
  toilet: "restroom", toilets: "restroom", washroom: "restroom", washrooms: "restroom", bathroom: "restroom", loo: "restroom",
  mic: "microphone", mike: "microphone", projector: "screen", display: "screen",
  wifi: "internet", "wi-fi": "internet", network: "internet",
  queue: "line", crowd: "line", crowded: "line",
  empty: "empty", finished: "empty", over: "empty", ran: "empty",
  entrance: "gate", entry: "gate",
};

export function keywords(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().normalize("NFKD").split(/[^a-z0-9-]+/)) {
    if (raw.length < 2 || STOP_WORDS.has(raw)) continue;
    out.add(SYNONYMS[raw] ?? raw);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export type NewReport = { zoneId: string | null; category: Category; text: string; structured: boolean; at: Date };
export type Candidate = { incidentId: string; zoneId: string | null; category: Category; texts: string[]; createdAt: Date; status: string };

export type MatchScore = { incidentId: string; score: number; blocked: boolean };

export function scoreCandidate(report: NewReport, c: Candidate): MatchScore {
  const ageMin = (report.at.getTime() - c.createdAt.getTime()) / 60_000;
  if (ageMin < 0 || ageMin > CANDIDATE_WINDOW_MIN || (c.status !== "open" && c.status !== "claimed")) {
    return { incidentId: c.incidentId, score: 0, blocked: true };
  }
  // Different known zones or different categories are hard blocks — never merge across them.
  if (report.zoneId && c.zoneId && report.zoneId !== c.zoneId) return { incidentId: c.incidentId, score: 0, blocked: true };
  if (report.category !== c.category) return { incidentId: c.incidentId, score: 0, blocked: true };

  let score = 0.3; // same category
  if (report.zoneId && c.zoneId) score += 0.45; // same known zone
  const kw = keywords(report.text);
  const best = c.texts.reduce((m, t) => Math.max(m, jaccard(kw, keywords(t))), 0);
  score += best * 0.2;
  score += ageMin <= 10 ? 0.05 : Math.max(0, 0.05 * (1 - (ageMin - 10) / (CANDIDATE_WINDOW_MIN - 10)));
  return { incidentId: c.incidentId, score: Math.round(score * 1000) / 1000, blocked: false };
}

export type Decision =
  | { kind: "new" }
  | { kind: "attach"; incidentId: string; score: number }
  | { kind: "suggest"; incidentId: string; score: number };

/**
 * Deterministic consolidation. Auto-attach requires structured zone+category (from the QR poster and a chip),
 * a young incident and a non-sensitive category; anything weaker becomes a suggestion for a human to confirm.
 */
export function decide(report: NewReport, candidates: Candidate[]): Decision {
  const scored = candidates.map((c) => ({ c, s: scoreCandidate(report, c) })).filter((x) => !x.s.blocked);
  if (scored.length === 0) return { kind: "new" };
  scored.sort((a, b) => b.s.score - a.s.score || b.c.createdAt.getTime() - a.c.createdAt.getTime());
  const { c, s } = scored[0];
  const ageMin = (report.at.getTime() - c.createdAt.getTime()) / 60_000;
  const canAuto =
    report.structured && Boolean(report.zoneId) && Boolean(c.zoneId) && ageMin <= AUTO_ATTACH_MAX_AGE_MIN && !SENSITIVE_CATEGORIES.has(report.category);
  if (s.score >= AUTO_THRESHOLD && canAuto) return { kind: "attach", incidentId: c.incidentId, score: s.score };
  if (s.score >= SUGGEST_THRESHOLD) return { kind: "suggest", incidentId: c.incidentId, score: s.score };
  return { kind: "new" };
}
