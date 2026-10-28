import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { CATEGORIES } from "@/server/db/schema";
import { submitReport } from "@/server/domain/incidents";
import { applyEffects } from "@/server/domain/projection";
import { body, crewActor, handle } from "@/server/http";
import { nexconnApi } from "@/server/services";

const CrewReport = z.object({
  category: z.enum(CATEGORIES),
  zoneId: z.string().max(40).nullable(),
  text: z.string().trim().max(500).default(""),
  urgent: z.boolean().default(false),
});

/** A crew member raises an incident directly ("+ Request" composer). */
export async function POST(req: Request, ctx: RouteContext<"/api/events/[eventId]/reports">) {
  return handle(async () => {
    const { eventId } = await ctx.params;
    const memberId = await crewActor(eventId);
    const input = await body(req, CrewReport);
    const r = await submitReport(db(), {
      eventId,
      source: "crew",
      memberId,
      zoneId: input.zoneId,
      category: input.category,
      text: input.text,
      structured: Boolean(input.zoneId),
      priority: input.urgent ? "urgent" : undefined,
    });
    const projection = await applyEffects(db(), nexconnApi(), r.effects);
    return NextResponse.json({ ...r, effects: undefined, projected: projection.ok }, { status: 201 });
  });
}
