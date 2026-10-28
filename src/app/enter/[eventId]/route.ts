import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db/client";
import { members } from "@/server/db/schema";
import { eventById } from "@/server/services";
import { setSession } from "@/server/session";

/** Organizer capability link: /enter/<eventId>?k=<organizerKey> → sets the organizer cookie and opens the board. */
export async function GET(req: NextRequest, ctx: RouteContext<"/enter/[eventId]">) {
  const { eventId } = await ctx.params;
  const key = req.nextUrl.searchParams.get("k");
  const ev = await eventById(eventId);
  if (!ev || !key || key !== ev.organizerToken) {
    return NextResponse.redirect(new URL("/?error=invalid-organizer-link", req.url));
  }
  const [lead] = await db().select().from(members).where(and(eq(members.eventId, ev.id), eq(members.role, "lead"))).orderBy(members.createdAt).limit(1);
  if (!lead) return NextResponse.redirect(new URL("/?error=event-has-no-lead", req.url));
  await setSession({ role: "organizer", id: lead.id, eventId: ev.id });
  return NextResponse.redirect(new URL(`/o/${ev.id}`, req.url));
}
