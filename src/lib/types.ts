export type IncidentStatus = "open" | "claimed" | "resolved" | "withdrawn";

export type IncidentView = {
  id: string;
  number: number;
  title: string;
  origin: "report" | "chat";
  category: string;
  priority: "normal" | "urgent";
  status: IncidentStatus;
  zoneId: string | null;
  zoneName: string | null;
  ownerMemberId: string | null;
  ownerName: string | null;
  reportCount: number;
  version: number;
  cardMessageId: string | null;
  escalationLevel: number;
  createdAt: number;
  claimedAt: number | null;
  resolvedAt: number | null;
  suggestion: { candidateIncidentId: string; candidateNumber: number | null; score: number } | null;
};

export type CrewMemberView = { id: string; name: string; role: "lead" | "volunteer"; zoneId: string | null; onDuty: boolean; nexconnUserId: string; isSimulated: boolean };

export type EventState = {
  event: { id: string; name: string; slug: string; status: string; groupId: string; botUserId: string; isDemo: boolean };
  me: { id: string; name: string; role: "lead" | "volunteer"; zoneId: string | null; nexconnUserId: string } | null;
  crew: CrewMemberView[];
  zones: { id: string; name: string; slug: string }[];
  incidents: IncidentView[];
  serverTime: number;
};

export const CATEGORY_LABEL: Record<string, string> = {
  supplies: "Water & supplies",
  cleanliness: "Cleanliness",
  directions: "Directions & info",
  tech: "Tech / AV",
  lost_found: "Lost & found",
  medical: "Medical",
  safety: "Safety",
  other: "Other",
};

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error?.message ?? `Request failed (${res.status})`) as Error & { code?: string; details?: Record<string, unknown>; status?: number };
    err.code = json?.error?.code;
    err.details = json?.error?.details;
    err.status = res.status;
    throw err;
  }
  return json as T;
}
