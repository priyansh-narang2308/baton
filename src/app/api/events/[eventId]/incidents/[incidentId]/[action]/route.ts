import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { claimIncident, dismissDetection, dismissSuggestion, DomainError, mergeIncidents, releaseIncident, resolveIncident, type Effect } from "@/server/domain/incidents";
import { applyEffects } from "@/server/domain/projection";
import { body, crewActor, handle } from "@/server/http";
import { nexconnApi } from "@/server/services";

const Merge = z.object({ targetIncidentId: z.string().min(1).max(40) });

export async function POST(req: Request, ctx: RouteContext<"/api/events/[eventId]/incidents/[incidentId]/[action]">) {
  return handle(async () => {
    const { eventId, incidentId, action } = await ctx.params;
    const memberId = await crewActor(eventId);
    let effects: Effect[];
    let payload: Record<string, unknown> = {};
    switch (action) {
      case "claim": {
        const r = await claimIncident(db(), eventId, incidentId, memberId);
        effects = r.effects;
        payload = { status: r.incident.status, version: r.incident.version, alreadyYours: r.alreadyYours };
        break;
      }
      case "release": {
        const r = await releaseIncident(db(), eventId, incidentId, memberId);
        effects = r.effects;
        payload = { status: r.incident.status, version: r.incident.version };
        break;
      }
      case "resolve": {
        const r = await resolveIncident(db(), eventId, incidentId, memberId);
        effects = r.effects;
        payload = { status: r.incident.status, version: r.incident.version };
        break;
      }
      case "merge": {
        const { targetIncidentId } = await body(req, Merge);
        const r = await mergeIncidents(db(), eventId, incidentId, targetIncidentId, memberId);
        effects = r.effects;
        payload = { targetIncidentId: r.targetId };
        break;
      }
      case "dismiss-detection": {
        effects = (await dismissDetection(db(), eventId, incidentId, memberId)).effects;
        break;
      }
      case "dismiss-suggestion": {
        effects = (await dismissSuggestion(db(), eventId, incidentId, memberId)).effects;
        break;
      }
      default:
        throw new DomainError("not_found", `Unknown action "${action}"`);
    }
    // DB is already committed; projection failures are logged and repaired by reconciliation.
    const projection = await applyEffects(db(), nexconnApi(), effects);
    return NextResponse.json({ ok: true, ...payload, projected: projection.ok });
  });
}
