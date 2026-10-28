import "server-only";
import { after, NextResponse } from "next/server";
import { db } from "./db/client";
import { ZodError, type ZodType } from "zod";
import { DomainError, type Effect } from "./domain/incidents";
import { applyEffects } from "./domain/projection";
import { NexconnApiError } from "./nexconn/api";
import { nexconnApi } from "./services";
import { getSession } from "./session";

export type ApiErrorBody = { error: { code: string; message: string; details?: Record<string, unknown> } };

export function fail(status: number, code: string, message: string, details?: Record<string, unknown>) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

const STATUS: Record<DomainError["code"], number> = { not_found: 404, forbidden: 403, conflict: 409, invalid: 400, event_ended: 410, rate_limited: 429 };

/** Wraps a route body: consistent JSON errors, never a silent failure. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof DomainError) return fail(STATUS[err.code], err.code, err.message, err.details);
    if (err instanceof ZodError) return fail(400, "invalid", err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));
    if (err instanceof NexconnApiError) {
      console.error(err);
      return fail(502, "nexconn_error", "The messaging service rejected the request. Please try again.", { path: err.path, code: err.code });
    }
    console.error(err);
    return fail(500, "internal", "Something went wrong on our side. Please try again.");
  }
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const json = await req.json().catch(() => {
    throw new DomainError("invalid", "Request body must be JSON");
  });
  return schema.parse(json);
}

/**
 * Crew actions come from a crew member session or the organizer (who is a lead member). One browser can hold both
 * (demo: board and volunteer side by side), so the board asks for `?as=organizer`; everything else prefers the member.
 */
export async function crewActor(eventId: string, req?: Request): Promise<string> {
  const asOrganizer = req ? new URL(req.url).searchParams.get("as") === "organizer" : false;
  const order = asOrganizer ? (["organizer", "member"] as const) : (["member", "organizer"] as const);
  const session = (await getSession(order[0], eventId)) ?? (await getSession(order[1], eventId));
  if (!session) throw new DomainError("forbidden", "Join this event's crew first");
  return session.id;
}

// Simple fixed-window limiter (single instance). Good enough for anonymous report intake abuse control.
const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (++b.count > limit) throw new DomainError("rate_limited", "Too many requests — please wait a minute and try again", { retryAfterMs: b.resetAt - now });
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "local";
}

/**
 * Projects committed changes onto Nexconn after the response is sent: the database already decided the outcome,
 * so a slow Nexconn call must never delay the person who tapped. Failures are repaired by reconciliation.
 */
export function projectLater(effects: Effect[]): "queued" | "not_configured" | "none" {
  if (effects.length === 0) return "none";
  const api = nexconnApi();
  if (!api) return "not_configured";
  after(() => applyEffects(db(), api, effects));
  return "queued";
}
