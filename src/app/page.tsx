import Link from "next/link";
import { TryDemoButton } from "./try-demo";

const STEPS = [
  { k: "01", t: "Anyone reports", d: "Attendees scan a poster, crew types in chat. No app, no account." },
  { k: "02", t: "Duplicates merge", d: "Five reports of the same empty water station become one live card — “5 reports”." },
  { k: "03", t: "One person owns it", d: "“I’ll take it” flips the card on every crew phone. Nobody wonders who’s on it." },
  { k: "04", t: "Everyone hears back", d: "Every person who reported it sees “Riya is on it”, then “Fixed”. Once." },
];

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
      <nav className="flex items-center justify-between">
        <span className="text-[15px] font-semibold tracking-tight">Baton</span>
        <Link href="/new" className="text-sm text-text-2 hover:text-text">
          Create an event
        </Link>
      </nav>
      {typeof sp.error === "string" && <p className="mt-6 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">That link didn&apos;t work ({sp.error.replaceAll("-", " ")}).</p>}

      <section className="mt-20 max-w-3xl">
        <p className="text-sm font-medium text-accent">For event crews that run on group chat</p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">The group chat where every request gets an owner.</h1>
        <p className="mt-5 max-w-2xl text-lg text-text-2">
          Baton turns reports from attendees and volunteers into live, claimable cards — merges duplicates, shows who&apos;s handling what, and tells everyone who reported it when it&apos;s fixed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <TryDemoButton />
          <Link href="/new" className="inline-flex h-12 items-center rounded-lg border border-border bg-surface px-5 text-[15px] font-medium hover:bg-surface-2">
            Set up your event
          </Link>
        </div>
      </section>

      <section className="mt-24 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.k} className="bg-surface p-5">
            <p className="font-mono text-xs text-text-3">{s.k}</p>
            <h2 className="mt-2 font-semibold">{s.t}</h2>
            <p className="mt-1 text-sm text-text-2">{s.d}</p>
          </div>
        ))}
      </section>

      <footer className="mt-auto pt-16 text-xs text-text-3">Real-time messaging by Nexconn. Built for the Nexconn Build Challenge 2026.</footer>
    </main>
  );
}
