import { CrewApp } from "./crew-app";

export default async function CrewPage(props: PageProps<"/c/[eventId]">) {
  const { eventId } = await props.params;
  return <CrewApp eventId={eventId} />;
}
