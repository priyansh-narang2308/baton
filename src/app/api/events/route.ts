import { NextResponse } from "next/server";
import { z } from "zod";
import { body, handle } from "@/server/http";
import { createEvent, eventById, joinCrew } from "@/server/services";
import { setSession } from "@/server/session";

const CreateEvent = z.object({
  name: z.string().trim().min(2).max(64),
  organizerName: z.string().trim().min(1).max(40),
  zones: z.array(z.string().trim().min(1).max(40)).min(1).max(30),
});

export async function POST(req: Request) {
  return handle(async () => {
    const input = await body(req, CreateEvent);
    const ev = await createEvent({ name: input.name, zones: input.zones });
    const full = await eventById(ev.id);
    // The organizer is also the first crew lead, so they can claim/merge from the board.
    const { memberId } = await joinCrew({ crewCode: full!.crewCode, name: input.organizerName, zoneId: null, role: "lead" });
    await setSession({ role: "organizer", id: memberId, eventId: ev.id });
    return NextResponse.json({ eventId: ev.id, slug: ev.slug, organizerKey: ev.organizerToken }, { status: 201 });
  });
}
