import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { requestFromChat } from "@/server/domain/chat-intake";
import { DomainError } from "@/server/domain/incidents";
import { body, crewActor, handle, projectLater } from "@/server/http";
import { eventById, eventCrew } from "@/server/services";

const ChatRequest = z.object({
  messageId: z.string().min(1).max(64),
  senderUserId: z.string().min(1).max(64),
  text: z.string().trim().min(1).max(500),
});

/** "Make it a request" on a crew chat message the detector missed. Same incident as the webhook path would create. */
export async function POST(req: Request, ctx: RouteContext<"/api/events/[eventId]/chat-requests">) {
  return handle(async () => {
    const { eventId } = await ctx.params;
    const actor = await crewActor(eventId, req);
    const input = await body(req, ChatRequest);
    const ev = await eventById(eventId);
    if (!ev) throw new DomainError("not_found", "Event not found");
    const sender = (await eventCrew(eventId)).find((m) => m.nexconnUserId === input.senderUserId);
    if (!sender) throw new DomainError("invalid", "Only crew messages can become requests");
    const r = await requestFromChat(db(), { eventId, messageId: input.messageId, text: input.text, senderMemberId: sender.id, actorMemberId: actor, mode: "manual" });
    if (r.kind !== "request") throw new DomainError("invalid", "That message has no text");
    return NextResponse.json({ incidentId: r.incidentId, outcome: r.outcome, projection: projectLater(r.effects) }, { status: r.outcome === "existing" ? 200 : 201 });
  });
}
