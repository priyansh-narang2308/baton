import { eventBySlug, eventZones } from "@/server/services";
import { AttendeeHelp } from "./attendee-help";

export default async function AttendeePage(props: PageProps<"/e/[slug]">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const ev = await eventBySlug(slug);
  if (!ev) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 p-6 text-center">
        <h1 className="font-serif font-normal tracking-tight text-[30px] leading-[1.05]">
          We couldn&apos;t find this event
        </h1>
        <p className="text-sm text-text-2">
          The QR code may be from an old event.
        </p>
      </main>
    );
  }
  const zones = await eventZones(ev.id);
  const zoneSlug = typeof sp.z === "string" ? sp.z : null;
  const zone = zones.find((z) => z.slug === zoneSlug) ?? null;
  return (
    <AttendeeHelp
      slug={slug}
      eventId={ev.id}
      eventName={ev.name}
      zone={zone ? { slug: zone.slug, name: zone.name } : null}
      ended={ev.status === "ended"}
      isDemo={ev.isDemo}
    />
  );
}
