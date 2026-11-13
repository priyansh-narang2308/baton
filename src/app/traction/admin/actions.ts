"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db/client";
import { events, members, attendees, tractionConsoleSnapshots, tractionExclusions, tractionFeedback, tractionPilots } from "@/server/db/schema";
import { DomainError } from "@/server/domain/incidents";
import { clientIp, rateLimit } from "@/server/http";
import { randomId } from "@/server/ids";
import { adminEnabled, endAdminSession, isAdmin, startAdminSession, tokenMatches } from "@/server/traction-admin";

const ADMIN = "/traction/admin";

async function requireAdmin() {
  if (!adminEnabled()) notFound();
  if (!(await isAdmin())) redirect(ADMIN);
}

function done(section: string) {
  revalidatePath(ADMIN);
  revalidatePath("/traction");
  redirect(`${ADMIN}?ok=${section}#${section}`);
}

/** Validates a form; on failure, returns to the section with a readable message instead of an error page. */
function parse<T>(schema: z.ZodType<T>, data: unknown, section: string): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const i = r.error.issues[0];
    redirect(`${ADMIN}?error=${encodeURIComponent(`${i.path.join(".")}: ${i.message}`)}#${section}`);
  }
  return r.data;
}

const fd = (f: FormData) => Object.fromEntries([...f.entries()].map(([k, v]) => [k, typeof v === "string" ? v.trim() : ""]));
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date");
const at = (d: string, end = false) => new Date(`${d}T${end ? "23:59:59" : "00:00:00"}Z`);

export async function login(form: FormData) {
  if (!adminEnabled()) notFound();
  try {
    rateLimit(`traction-admin:${clientIp(new Request("http://x", { headers: await headers() }))}`, 5, 15 * 60_000);
  } catch (e) {
    if (e instanceof DomainError) redirect(`${ADMIN}?error=rate`);
    throw e;
  }
  if (!tokenMatches(String(form.get("token") ?? ""))) redirect(`${ADMIN}?error=token`);
  await startAdminSession();
  redirect(ADMIN);
}

export async function logout() {
  await endAdminSession();
  redirect(ADMIN);
}

// ── Nexconn Console snapshots ────────────────────────────────────────────────────────────────────────────────────

const Snapshot = z.object({
  metric: z.enum(["mau", "dau", "messages"]),
  value: z.coerce.number().int().min(0).max(100_000_000),
  periodStart: day,
  periodEnd: day,
  consolePath: z.string().min(3).max(200),
  capturedOn: day,
});

export async function addSnapshot(form: FormData) {
  await requireAdmin();
  const s = parse(Snapshot, fd(form), "console");
  if (s.periodEnd < s.periodStart) redirect(`${ADMIN}?error=period#console`);
  await db().insert(tractionConsoleSnapshots).values({
    id: `cs${randomId(14)}`,
    metric: s.metric,
    value: s.value,
    periodStart: at(s.periodStart),
    periodEnd: at(s.periodEnd, true),
    consolePath: s.consolePath,
    capturedAt: at(s.capturedOn),
  });
  done("console");
}

export async function deleteSnapshot(form: FormData) {
  await requireAdmin();
  await db().delete(tractionConsoleSnapshots).where(eq(tractionConsoleSnapshots.id, String(form.get("id"))));
  done("console");
}

// ── Pilot verification ───────────────────────────────────────────────────────────────────────────────────────────

const Pilot = z.object({
  eventId: z.string().min(1).max(64),
  kind: z.enum(["pilot", "rehearsal"]),
  publicName: z.string().min(2).max(80),
  publicContext: z.string().max(120).default(""),
  startsOn: day,
  endsOn: day,
  verificationNote: z.string().min(10, "Say how the organizer confirmed the event").max(500),
});

export async function verifyPilot(form: FormData) {
  await requireAdmin();
  const p = parse(Pilot, fd(form), "pilots");
  const [ev] = await db().select({ isDemo: events.isDemo }).from(events).where(eq(events.id, p.eventId));
  if (!ev || ev.isDemo) redirect(`${ADMIN}?error=demo#pilots`); // demo events can never become traction
  await db()
    .insert(tractionPilots)
    .values({ eventId: p.eventId, kind: p.kind, publicName: p.publicName, publicContext: p.publicContext, startsAt: at(p.startsOn), endsAt: at(p.endsOn, true), verificationNote: p.verificationNote })
    .onConflictDoUpdate({
      target: tractionPilots.eventId,
      set: { kind: p.kind, publicName: p.publicName, publicContext: p.publicContext, startsAt: at(p.startsOn), endsAt: at(p.endsOn, true), verificationNote: p.verificationNote },
    });
  done("pilots");
}

export async function unverifyPilot(form: FormData) {
  await requireAdmin();
  await db().delete(tractionPilots).where(eq(tractionPilots.eventId, String(form.get("eventId"))));
  done("pilots");
}

// ── Exclusions (the team's own identities inside a pilot) ────────────────────────────────────────────────────────

export async function setExclusion(form: FormData) {
  await requireAdmin();
  const { nexconnUserId, exclude, reason } = parse(
    z.object({ nexconnUserId: z.string().min(1).max(64), exclude: z.enum(["1", "0"]), reason: z.string().max(120).default("") }),
    fd(form),
    "people",
  );
  // Only identities that belong to a verified pilot can be toggled here.
  const inPilot =
    (await db().select({ id: members.id }).from(members).innerJoin(tractionPilots, eq(tractionPilots.eventId, members.eventId)).where(eq(members.nexconnUserId, nexconnUserId))).length +
    (await db().select({ id: attendees.id }).from(attendees).innerJoin(tractionPilots, eq(tractionPilots.eventId, attendees.eventId)).where(eq(attendees.nexconnUserId, nexconnUserId))).length;
  if (!inPilot) redirect(`${ADMIN}?error=identity#people`);
  if (exclude === "1") {
    await db()
      .insert(tractionExclusions)
      .values({ nexconnUserId, reason: reason || "Baton team or test device" })
      .onConflictDoNothing();
  } else {
    await db().delete(tractionExclusions).where(eq(tractionExclusions.nexconnUserId, nexconnUserId));
  }
  done("people");
}

// ── Feedback ─────────────────────────────────────────────────────────────────────────────────────────────────────

const Feedback = z.object({
  eventId: z.string().max(64).default(""),
  role: z.enum(["organizer", "lead", "volunteer", "attendee"]),
  quote: z.string().min(5).max(280),
  rating: z.string().default(""),
  attribution: z.enum(["anonymous", "role", "name"]),
  attributionName: z.string().max(60).default(""),
  permissionNote: z.string().min(10, "Record how permission was given").max(300),
  collectedOn: day,
  published: z.string().optional(),
});

export async function addFeedback(form: FormData) {
  await requireAdmin();
  const f = parse(Feedback, fd(form), "feedback");
  if (f.attribution === "name" && !f.attributionName) redirect(`${ADMIN}?error=name#feedback`);
  const rating = f.rating ? parse(z.coerce.number().int().min(1).max(5), f.rating, "feedback") : null;
  if (f.eventId) {
    const [p] = await db().select({ id: tractionPilots.eventId }).from(tractionPilots).where(eq(tractionPilots.eventId, f.eventId));
    if (!p) redirect(`${ADMIN}?error=pilot#feedback`);
  }
  await db()
    .insert(tractionFeedback)
    .values({
      id: `fb${randomId(14)}`,
      eventId: f.eventId || null,
      role: f.role,
      quote: f.quote,
      rating,
      attribution: f.attribution,
      attributionName: f.attribution === "name" ? f.attributionName : null,
      permissionNote: f.permissionNote,
      published: f.published === "on",
      collectedAt: at(f.collectedOn),
    });
  done("feedback");
}

export async function setFeedbackPublished(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  await db().update(tractionFeedback).set({ published: form.get("published") === "1" }).where(eq(tractionFeedback.id, id));
  done("feedback");
}

export async function deleteFeedback(form: FormData) {
  await requireAdmin();
  await db().delete(tractionFeedback).where(eq(tractionFeedback.id, String(form.get("id"))));
  done("feedback");
}
