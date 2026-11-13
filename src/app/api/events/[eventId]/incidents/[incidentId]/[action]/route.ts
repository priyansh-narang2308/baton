import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import {
  acceptPass,
  assignIncident,
  claimIncident,
  dismissDetection,
  dismissSuggestion,
  DomainError,
  endPass,
  logHuddle,
  mergeIncidents,
  offerPass,
  releaseIncident,
  resolveIncident,
  type Effect,
} from "@/server/domain/incidents";
import { body, crewActor, handle, projectLater } from "@/server/http";

const Merge = z.object({ targetIncidentId: z.string().min(1).max(40) });
const Assign = z.object({ memberId: z.string().min(1).max(40) });
const Huddle = z.object({
  callId: z.string().min(1).max(128),
  withMemberId: z.string().min(1).max(40),
  outcome: z.enum(["connected", "no_answer", "declined", "cancelled", "failed"]),
  durationSec: z.number().min(0).max(86400),
  video: z.boolean().default(false),
});
const Pass = z.object({ memberId: z.string().min(1).max(40), note: z.string().max(280).default("") });

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/events/[eventId]/incidents/[incidentId]/[action]">,
) {
  return handle(async () => {
    const { eventId, incidentId, action } = await ctx.params;
    const memberId = await crewActor(eventId, req);
    let effects: Effect[];
    let payload: Record<string, unknown> = {};
    switch (action) {
      case "claim": {
        const r = await claimIncident(db(), eventId, incidentId, memberId);
        effects = r.effects;
        payload = {
          status: r.incident.status,
          version: r.incident.version,
          alreadyYours: r.alreadyYours,
        };
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
      case "assign": {
        const { memberId: assigneeId } = await body(req, Assign);
        const r = await assignIncident(
          db(),
          eventId,
          incidentId,
          memberId,
          assigneeId,
        );
        effects = r.effects;
        payload = {
          status: r.incident.status,
          version: r.incident.version,
          ownerMemberId: r.incident.ownerMemberId,
          unchanged: r.unchanged,
        };
        break;
      }
      case "pass": {
        const { memberId: toId, note } = await body(req, Pass);
        const r = await offerPass(db(), eventId, incidentId, memberId, toId, note);
        effects = r.effects;
        payload = { status: r.incident.status, version: r.incident.version, passToMemberId: r.incident.passToMemberId };
        break;
      }
      case "accept-pass": {
        const r = await acceptPass(db(), eventId, incidentId, memberId);
        effects = r.effects;
        payload = { status: r.incident.status, version: r.incident.version, ownerMemberId: r.incident.ownerMemberId, alreadyYours: r.alreadyYours };
        break;
      }
      case "decline-pass":
      case "cancel-pass": {
        const r = await endPass(db(), eventId, incidentId, memberId, action === "decline-pass" ? "declined" : "cancelled");
        effects = r.effects;
        payload = { status: r.incident.status, version: r.incident.version };
        break;
      }
      case "merge": {
        const { targetIncidentId } = await body(req, Merge);
        const r = await mergeIncidents(
          db(),
          eventId,
          incidentId,
          targetIncidentId,
          memberId,
        );
        effects = r.effects;
        payload = { targetIncidentId: r.targetId };
        break;
      }
      case "huddle": {
        // A Nexconn Call voice or video huddle ended; the timeline gets one line. Nothing to project to the crew group.
        const input = await body(req, Huddle);
        payload = await logHuddle(db(), eventId, incidentId, memberId, input);
        effects = [];
        break;
      }
      case "dismiss-detection": {
        effects = (await dismissDetection(db(), eventId, incidentId, memberId))
          .effects;
        break;
      }
      case "dismiss-suggestion": {
        effects = (await dismissSuggestion(db(), eventId, incidentId, memberId))
          .effects;
        break;
      }
      default:
        throw new DomainError("not_found", `Unknown action "${action}"`);
    }
    // DB is already committed; Nexconn catches up after the response (reconciliation repairs failures).
    return NextResponse.json({
      ok: true,
      ...payload,
      projection: projectLater(effects),
    });
  });
}
