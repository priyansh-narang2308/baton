import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { events } from "@/server/db/schema";
import { eventZones } from "@/server/services";
import { JoinForm } from "./join-form";

export default async function JoinPage(props: PageProps<"/join/[code]">) {
  const { code } = await props.params;
  const sp = await props.searchParams;
  const [ev] = await db().select().from(events).where(eq(events.crewCode, code));
  if (!ev) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 p-6 text-center">
        <h1 className="text-lg font-semibold">This invite doesn&apos;t work anymore</h1>
        <p className="text-sm text-text-2">The organizer may have rotated the crew code. Ask them for the current QR code.</p>
      </main>
    );
  }
  const zones = await eventZones(ev.id);
  return <JoinForm code={code} eventName={ev.name} zones={zones.map((z) => ({ id: z.id, name: z.name }))} defaultName={typeof sp.name === "string" ? sp.name : ""} isDemo={ev.isDemo} />;
}
