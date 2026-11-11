import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { incidentDetail } from "@/server/domain/incidents";
import { crewActor, handle } from "@/server/http";

/** Full history of one incident (reports behind it + audit trail). Crew and organizer only. */
export async function GET(req: Request, ctx: RouteContext<"/api/events/[eventId]/incidents/[incidentId]">) {
  return handle(async () => {
    const { eventId, incidentId } = await ctx.params;
    await crewActor(eventId, req);
    return NextResponse.json(await incidentDetail(db(), eventId, incidentId), { headers: { "Cache-Control": "no-store" } });
  });
}
