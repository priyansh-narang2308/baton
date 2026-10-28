import { eventById } from "@/server/services";
import { getSession } from "@/server/session";
import { DemoHub } from "./demo-hub";

export default async function DemoPage(props: PageProps<"/demo/[eventId]">) {
  const { eventId } = await props.params;
  const [ev, session] = await Promise.all([eventById(eventId), getSession("organizer", eventId)]);
  if (!ev?.isDemo || !session) {
    return <p className="p-6 text-sm">This demo isn&apos;t available in this browser. Start a new one from the home page.</p>;
  }
  return <DemoHub eventId={ev.id} crewCode={ev.crewCode} slug={ev.slug} />;
}
