import { eventById } from "@/server/services";
import { getSession } from "@/server/session";
import { Board } from "./board";

export default async function BoardPage(props: PageProps<"/o/[eventId]">) {
  const { eventId } = await props.params;
  const [ev, session] = await Promise.all([eventById(eventId), getSession("organizer", eventId)]);
  if (!ev || !session) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 p-6 text-center">
        <h1 className="text-lg font-semibold">Open your organizer link</h1>
        <p className="text-sm text-text-2">This board is private. Use the organizer link you saved when you created the event.</p>
      </main>
    );
  }
  return <Board eventId={ev.id} crewCode={ev.crewCode} slug={ev.slug} />;
}
