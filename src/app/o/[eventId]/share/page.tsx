import Link from "next/link";
import { eventById, eventZones } from "@/server/services";
import { getSession } from "@/server/session";

/** Printable QR sheet: one crew QR and one attendee poster per zone (the zone is encoded in the URL). */
export default async function SharePage(props: PageProps<"/o/[eventId]/share">) {
  const { eventId } = await props.params;
  const [ev, session] = await Promise.all([eventById(eventId), getSession("organizer", eventId)]);
  if (!ev || !session) return <p className="p-6 text-sm">Open your organizer link first.</p>;
  const zones = await eventZones(ev.id);
  const posters = [{ name: "General help", path: `/e/${ev.slug}` }, ...zones.map((z) => ({ name: z.name, path: `/e/${ev.slug}?z=${z.slug}` }))];
  return (
    <main className="mx-auto max-w-5xl p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <p className="text-xs font-medium text-accent">{ev.name}</p>
          <h1 className="text-xl font-semibold tracking-tight">QR codes</h1>
        </div>
        <Link href={`/o/${ev.id}`} className="text-sm text-text-2 underline underline-offset-2">
          Back to board
        </Link>
      </div>
      <section className="mb-8 rounded-xl border border-border bg-surface p-6 print:break-after-page">
        <h2 className="text-lg font-semibold">Crew — scan to join</h2>
        <p className="text-sm text-text-2">Share in your volunteer group. Rotate the code if it leaks.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/qr?path=${encodeURIComponent(`/join/${ev.crewCode}`)}`} alt="Crew join QR code" className="mt-4 size-56" />
      </section>
      <div className="grid gap-6 sm:grid-cols-2">
        {posters.map((p) => (
          <section key={p.path} className="flex flex-col items-center rounded-xl border border-border bg-surface p-6 text-center print:break-inside-avoid">
            <p className="text-sm text-text-2">{ev.name}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Need help? Scan me.</h2>
            <p className="mt-1 text-sm text-text-2">{p.name} · no app needed</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/qr?path=${encodeURIComponent(p.path)}`} alt={`Help QR code for ${p.name}`} className="mt-4 size-48" />
          </section>
        ))}
      </div>
    </main>
  );
}
