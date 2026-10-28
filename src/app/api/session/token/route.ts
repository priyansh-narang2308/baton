import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db/client";
import { attendees, members } from "@/server/db/schema";
import { DomainError } from "@/server/domain/incidents";
import { nexconnConfig } from "@/server/env";
import { fail, handle } from "@/server/http";
import { accessToken } from "@/server/services";
import { getSession, type Role } from "@/server/session";

/** Returns the Nexconn App Key (public) and the caller's own access token. Never returns the App Secret. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const eventId = req.nextUrl.searchParams.get("event") ?? "";
    const role = (req.nextUrl.searchParams.get("role") ?? "member") as Role;
    const refresh = req.nextUrl.searchParams.get("refresh") === "1";
    const cfg = nexconnConfig();
    if (!cfg) return fail(503, "nexconn_not_configured", "Messaging is not configured on this server yet.");
    // The organizer is also a lead crew member: their organizer session can open the crew view.
    const session = (await getSession(role, eventId)) ?? (role === "member" ? await getSession("organizer", eventId) : null);
    if (!session) throw new DomainError("forbidden", "No session for this event");

    let userId: string;
    let name: string;
    if (role === "attendee") {
      const [a] = await db().select().from(attendees).where(eq(attendees.id, session.id));
      if (!a) throw new DomainError("forbidden", "Session expired");
      userId = a.nexconnUserId;
      name = "Attendee";
    } else {
      const [m] = await db().select().from(members).where(eq(members.id, session.id));
      if (!m || m.removedAt) throw new DomainError("forbidden", "You were removed from this crew");
      userId = m.nexconnUserId;
      name = m.name;
    }
    const token = await accessToken(userId, name, { refresh });
    return NextResponse.json({ appKey: cfg.appKey, dataCenter: cfg.dataCenter, userId, token }, { headers: { "Cache-Control": "no-store" } });
  });
}
