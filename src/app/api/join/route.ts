import { NextResponse } from "next/server";
import { z } from "zod";
import { body, clientIp, handle, rateLimit } from "@/server/http";
import { joinCrew } from "@/server/services";
import { setSession } from "@/server/session";

const Join = z.object({
  code: z.string().trim().min(4).max(32),
  name: z.string().trim().min(1).max(40),
  zoneId: z.string().max(40).nullable().default(null),
});

export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(`join:${clientIp(req)}`, 20, 60_000);
    const input = await body(req, Join);
    const { eventId, memberId } = await joinCrew({ crewCode: input.code, name: input.name, zoneId: input.zoneId });
    await setSession({ role: "member", id: memberId, eventId });
    return NextResponse.json({ eventId }, { status: 201 });
  });
}
