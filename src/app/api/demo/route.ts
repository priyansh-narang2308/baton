import { NextResponse } from "next/server";
import { clientIp, handle, rateLimit } from "@/server/http";
import { createEvent, eventById, joinCrew } from "@/server/services";
import { setSession } from "@/server/session";

/** "Try Baton live": a private, clearly-labelled demo event using the real product end to end. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(`demo:${clientIp(req)}`, 5, 60 * 60_000);
    const ev = await createEvent({ name: "Demo TechFest", zones: ["Gate 3", "Hall B", "Registration"], isDemo: true });
    const full = await eventById(ev.id);
    const { memberId } = await joinCrew({ crewCode: full!.crewCode, name: "You (organizer)", zoneId: null, role: "lead" });
    await setSession({ role: "organizer", id: memberId, eventId: ev.id });
    return NextResponse.json({ eventId: ev.id }, { status: 201 });
  });
}
