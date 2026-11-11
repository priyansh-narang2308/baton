import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  GitMerge,
  Hand,
  Lock,
  MapPin,
  MessageCircle,
  QrCode,
  Radio,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { TryDemoButton } from "./try-demo";

/*
 * Marketing page. Every claim here describes something the product does today; there are no customer logos,
 * testimonials or usage numbers because we don't have them yet.
 */

const PROBLEMS = [
  {
    t: "Requests scroll away",
    d: "“Need water at Gate 3” is buried under forty messages within minutes.",
  },
  {
    t: "Five people report one problem",
    d: "The same empty dispenser arrives as five messages, and two volunteers go.",
  },
  {
    t: "Nobody knows who's on it",
    d: "“Someone handling this?” goes unanswered; organizers chase by phone.",
  },
  {
    t: "Attendees never hear back",
    d: "The person who reported it has no idea anything happened.",
  },
];

const STEPS = [
  {
    icon: QrCode,
    t: "Anyone reports",
    d: "Attendees scan a poster. Volunteers type in the crew chat. No app, no account.",
  },
  {
    icon: GitMerge,
    t: "Duplicates merge",
    d: "Reports of the same issue in the same place join one live card: “3 reports”.",
  },
  {
    icon: Hand,
    t: "One person owns it",
    d: "“I’ll take it” flips the card on every crew phone. Exactly one claim wins.",
  },
  {
    icon: Check,
    t: "Everyone hears back",
    d: "Each reporter is told who is on it, then that it's fixed. Once.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    t: "Chat that becomes work",
    d: "Type “need 2 chairs at Hall B” in the crew chat. Baton recognises it with transparent rules (no AI guesswork) and the message itself becomes claimable. One tap undoes it.",
  },
  {
    icon: GitMerge,
    t: "Duplicate merging",
    d: "Same place, same kind of problem, within minutes: merged automatically. Sensitive categories like medical are only suggested, never auto-merged.",
  },
  {
    icon: Hand,
    t: "Race-proof ownership",
    d: "Ten volunteers can tap at once; the database lets exactly one win and everyone else sees who did.",
  },
  {
    icon: Users,
    t: "Assign and reassign",
    d: "Leads hand a request to a specific person. They get a private alert inside the crew chat.",
  },
  {
    icon: MessageCircle,
    t: "Direct messages",
    d: "Message the owner of an incident from the incident itself. Private, one-to-one, no phone numbers shared.",
  },
  {
    icon: Bell,
    t: "Escalation, by name",
    d: "Unclaimed for too long? The zone lead is alerted, then the event leads. Urgent issues escalate faster.",
  },
  {
    icon: ScrollText,
    t: "Full incident history",
    d: "Every report, merge, claim, reassignment and fix, with who and when, on one timeline.",
  },
  {
    icon: BarChart3,
    t: "Impact report",
    d: "Time to owner, time to fix, hot spots by zone and category, built only from what really happened.",
  },
];

const COMPARE: [string, boolean | string, boolean | string][] = [
  ["Works for volunteers with no app or account", true, true],
  ["Requests stay visible until someone owns them", false, true],
  ["Duplicate reports collapse into one task", false, true],
  ["Everyone sees who is handling what, live", false, true],
  ["The person who reported it is told when it's fixed", false, true],
  ["Unowned requests escalate to a named lead", false, true],
  ["Times to respond and fix, per zone", false, true],
];

const FAQ = [
  {
    q: "Do volunteers or attendees need to install anything?",
    a: "No. Volunteers join from a QR code or link and type their name. Attendees scan a poster and report anonymously. Everything runs in the phone's browser.",
  },
  {
    q: "Does it replace our WhatsApp group?",
    a: "It replaces the part WhatsApp is bad at: tracking requests. Many crews keep their social group and run operations in Baton. The crew chat in Baton is a real group chat too.",
  },
  {
    q: "What counts as a duplicate?",
    a: "A report in the same zone and category as an open incident from the last few minutes. Free-text reports that only look similar are suggested for a merge, never merged silently, and medical or safety reports are never auto-merged.",
  },
  {
    q: "What happens if the internet drops?",
    a: "Every claim and status change is saved on our server first. Phones resync when they reconnect, and a background job repairs anything that didn't reach the live chat.",
  },
  {
    q: "What data do you keep about attendees?",
    a: "None that identifies them: no name, phone or email. A report is tied to an anonymous browser session so we can tell that person when it's fixed.",
  },
  {
    q: "What does it cost?",
    a: "Baton is free while we pilot it with real events. If you run an event in the next few weeks, we'd like to help you set it up.",
  },
];

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  return (
    <div className="flex flex-1 flex-col">
      {/* 1 · Navigation */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 backdrop-blur">
        <nav
          className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6"
          aria-label="Main"
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
          >
            <span
              className="grid size-6 place-items-center rounded-md bg-accent text-accent-ink"
              aria-hidden
            >
              <Radio className="size-3.5" />
            </span>
            Baton
          </Link>
          <div className="hidden flex-1 items-center gap-5 text-sm text-text-2 md:flex">
            <a href="#how" className="hover:text-text">
              How it works
            </a>
            <a href="#features" className="hover:text-text">
              Features
            </a>
            <a href="#roles" className="hover:text-text">
              Who it&apos;s for
            </a>
            <a href="#faq" className="hover:text-text">
              FAQ
            </a>
          </div>
          <Link
            href="/new"
            className="ml-auto inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-2 md:ml-0"
          >
            Create an event
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {typeof sp.error === "string" && (
          <p className="mx-auto mt-6 max-w-6xl rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger sm:px-6">
            That link didn&apos;t work ({sp.error.replaceAll("-", " ")}).
          </p>
        )}

        {/* 2 · Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-2">
              <span className="size-1.5 rounded-full bg-done" aria-hidden />{" "}
              Real-time incident coordination for event crews
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">
              Every report acknowledged.
              <br />
              <span className="text-accent">Every incident owned.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-text-2">
              Baton turns what attendees and volunteers report into live,
              claimable incidents. Duplicates merge, one person owns each issue,
              and everyone who reported it sees the outcome.
            </p>
            <div className="mt-8 flex flex-wrap items-start gap-3">
              <TryDemoButton />
              <Link
                href="/new"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-surface px-5 text-[15px] font-medium hover:bg-surface-2"
              >
                Set up your event <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-text-3">
              The live demo opens a private event with real messaging, plus the
              attendee, volunteer and organizer views side by side.
            </p>
          </div>
          <HeroIllustration />
        </section>

        {/* 3 · The problem */}
        <Section
          id="problem"
          eyebrow="The problem"
          title="Event crews run on group chats that were never built for operations."
        >
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {PROBLEMS.map((p) => (
              <div key={p.t} className="bg-surface p-5">
                <p className="flex items-center gap-2 font-semibold">
                  <X className="size-4 text-urgent" aria-hidden /> {p.t}
                </p>
                <p className="mt-1.5 text-[15px] text-text-2">{p.d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 4 · How it works */}
        <Section
          id="how"
          eyebrow="How it works"
          title="One issue moves through four states, and everyone can see it."
        >
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, k) => (
              <li
                key={s.t}
                className="relative rounded-2xl border border-border bg-surface p-5"
              >
                <span className="font-mono text-xs text-text-3">0{k + 1}</span>
                <s.icon className="mt-3 size-5 text-accent" aria-hidden />
                <h3 className="mt-3 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-text-2">{s.d}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* 5 · The lifecycle, shown */}
        <Section
          id="lifecycle"
          eyebrow="The closed loop"
          title="The attendee who reported it is part of the loop."
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <p className="text-[17px] text-text-2">
              Most tools stop when a volunteer marks something done. Baton tells
              every person who reported the issue that someone is on it, and
              again when it&apos;s fixed. Each of them gets one update per
              state, never a flood.
            </p>
            <ol
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              aria-label="Incident states"
            >
              {[
                ["Reported", "3 reports merged", "bg-open-soft text-open"],
                ["Owned", "Riya is on it", "bg-claimed-soft text-claimed"],
                ["Fixed", "Marked fixed", "bg-done-soft text-done"],
                [
                  "Told",
                  "All 3 reporters notified",
                  "bg-accent-soft text-accent",
                ],
              ].map(([t, d, c]) => (
                <li key={t} className={`rounded-xl px-3 py-3 ${c}`}>
                  <p className="text-[13px] font-semibold">{t}</p>
                  <p className="mt-0.5 text-xs opacity-80">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        {/* 6 · Roles */}
        <Section
          id="roles"
          eyebrow="Who it's for"
          title="Three views, each built for the device that person actually holds."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <RoleCard
              icon={<BarChart3 className="size-5" />}
              who="Organizers"
              where="Laptop or tablet"
              points={[
                "Live command centre: what needs an owner, longest wait, who is overloaded",
                "Assign, reassign and message the owner from the incident",
                "Impact report after the event",
              ]}
            />
            <RoleCard
              icon={<Smartphone className="size-5" />}
              who="Volunteers"
              where="Their own phone, no app"
              points={[
                "Join with a QR code and a name",
                "Claim with one tap; see your tasks",
                "Crew chat where requests become cards",
              ]}
            />
            <RoleCard
              icon={<QrCode className="size-5" />}
              who="Attendees"
              where="Any phone camera"
              points={[
                "Scan a poster at the location",
                "Pick what's wrong, add a detail",
                "See “on it”, then “fixed”, with no account",
              ]}
            />
          </div>
        </Section>

        {/* 7 · Features */}
        <Section
          id="features"
          eyebrow="Features"
          title="Small, deliberate tools for the moments that go wrong."
        >
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.t} className="bg-surface p-5">
                <f.icon className="size-5 text-accent" aria-hidden />
                <h3 className="mt-3 font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-text-2">{f.d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 8 · Built on Nexconn */}
        <Section
          id="realtime"
          eyebrow="Real-time by Nexconn"
          title="The chat message is the incident."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <TechPoint
              title="Live state on the message"
              body="Each incident is a Nexconn group message. Its status, owner and report count live in message metadata, so a claim updates the same card on every phone at once."
            />
            <TechPoint
              title="Private where it should be"
              body="Assignment alerts are targeted group messages only the assignee receives. Organizer ↔ volunteer conversations use Nexconn direct channels."
            />
            <TechPoint
              title="The database is the source of truth"
              body="Claims are settled in Postgres first, then projected to Nexconn in the background, with a repair loop that re-syncs anything that didn't arrive."
            />
          </div>
        </Section>

        {/* 9 · Comparison */}
        <Section
          id="compare"
          eyebrow="Compared with a group chat"
          title="Keep the chat. Add ownership."
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-text-3">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    What a crew needs
                  </th>
                  <th
                    scope="col"
                    className="w-20 px-2 py-3 text-center sm:w-28 sm:px-4 font-medium"
                  >
                    Group chat
                  </th>
                  <th
                    scope="col"
                    className="w-20 px-2 py-3 text-center sm:w-28 sm:px-4 font-medium text-accent"
                  >
                    Baton
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARE.map(([need, chat, baton]) => (
                  <tr key={need}>
                    <td className="px-4 py-3">{need}</td>
                    <td className="px-2 py-3 text-center sm:px-4">{mark(chat)}</td>
                    <td className="px-2 py-3 text-center sm:px-4">{mark(baton)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 10 · Setup */}
        <Section
          id="setup"
          eyebrow="Setup"
          title="Ready before your first volunteer arrives."
        >
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              [
                "Create the event",
                "Name it and list your locations: gates, halls, help desks.",
              ],
              [
                "Print the posters",
                "One QR poster per location for attendees, one crew QR for volunteers.",
              ],
              [
                "Run the day",
                "Keep the command centre open. Requests arrive, get owners, get fixed.",
              ],
            ].map(([t, d], k) => (
              <li
                key={t}
                className="flex gap-4 rounded-2xl border border-border bg-surface p-5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent">
                  {k + 1}
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="mt-1 block text-sm text-text-2">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        {/* 11 · Privacy and reliability */}
        <Section
          id="trust"
          eyebrow="Privacy and reliability"
          title="Built for a crowded venue with patchy signal."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TrustPoint
              icon={<Lock className="size-5" />}
              t="No attendee identity"
              d="No name, phone or email is collected from attendees."
            />
            <TrustPoint
              icon={<ShieldCheck className="size-5" />}
              t="Secrets stay server-side"
              d="Messaging credentials never reach the browser; each person gets a scoped token."
            />
            <TrustPoint
              icon={<Radio className="size-5" />}
              t="Reconnects on its own"
              d="Phones re-read the true state on reconnect; nothing is lost if a tab sleeps."
            />
            <TrustPoint
              icon={<MapPin className="size-5" />}
              t="Simulated data is labelled"
              d="Demo activity is marked and never counted in impact numbers."
            />
          </div>
        </Section>

        {/* 12 · FAQ */}
        <Section id="faq" eyebrow="FAQ" title="Questions organizers ask first.">
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span
                    className="text-text-3 transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-[15px] text-text-2">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* 13 · Final call to action */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6">
          <div className="rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight">
              See the whole loop in two minutes.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-2">
              Open the live demo, report a problem as an attendee, claim it as a
              volunteer, and watch the organizer view update.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <TryDemoButton />
              <Link
                href="/new"
                className="inline-flex h-12 items-center rounded-lg border border-border bg-bg px-5 text-[15px] font-medium hover:bg-surface-2"
              >
                Set up your event
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-xs text-text-3 sm:px-6">
          <span className="font-medium text-text-2">Baton</span>
          <span>Real-time messaging by Nexconn.</span>
          <span>Built for the Nexconn Build Challenge 2026.</span>
        </div>
      </footer>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6"
    >
      <p className="text-sm font-medium text-accent">{eyebrow}</p>
      <h2
        id={`${id}-h`}
        className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function RoleCard({
  icon,
  who,
  where,
  points,
}: {
  icon: ReactNode;
  who: string;
  where: string;
  points: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <span
        className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent"
        aria-hidden
      >
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold">{who}</h3>
      <p className="text-[13px] text-text-3">{where}</p>
      <ul className="mt-4 space-y-2 text-sm text-text-2">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-done" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TechPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-text-2">{body}</p>
    </div>
  );
}

function TrustPoint({ icon, t, d }: { icon: ReactNode; t: string; d: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <span className="text-accent" aria-hidden>
        {icon}
      </span>
      <h3 className="mt-3 font-semibold">{t}</h3>
      <p className="mt-1 text-sm text-text-2">{d}</p>
    </div>
  );
}

function mark(v: boolean | string) {
  if (typeof v === "string") return <span className="text-text-2">{v}</span>;
  return v ? (
    <Check className="mx-auto size-4 text-done" aria-label="Yes" />
  ) : (
    <X className="mx-auto size-4 text-text-3" aria-label="No" />
  );
}

/** A static picture of the product (not live data): three reports merging into one owned incident. */
function HeroIllustration() {
  return (
    <figure
      className="relative"
      aria-label="Illustration: three reports from Gate 3 merge into one incident that Riya owns"
    >
      <div
        className="absolute inset-x-0 -inset-y-6 -z-10 rounded-4xl sm:-inset-x-6 bg-accent-soft/60 blur-2xl"
        aria-hidden
      />
      <div className="space-y-3" aria-hidden>
        <div className="flex flex-wrap gap-2">
          {[
            "No water at Gate 3",
            "Water dispenser empty",
            "Gate 3 out of water!!",
          ].map((t, k) => (
            <span
              key={t}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] text-text-2 shadow-sm"
              style={{ transform: `rotate(${[-2, 1.5, -1][k]}deg)` }}
            >
              <QrCode className="mr-1.5 inline size-3.5 text-text-3" />
              {t}
            </span>
          ))}
        </div>
        <div className="flex justify-center text-text-3">
          <GitMerge className="size-5 rotate-180" />
        </div>
        <div className="rounded-2xl border border-border border-l-4 border-l-claimed bg-surface p-4 shadow-pop">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-text-3">
                <span className="font-mono">#12</span> Water &amp; supplies
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="size-3" /> Gate 3
                </span>
                <span>· 2m ago</span>
              </p>
              <p className="mt-1 text-[15px] font-semibold">
                No water at Gate 3
              </p>
            </div>
            <span className="rounded-full bg-claimed-soft px-2 py-0.5 text-xs font-medium text-claimed">
              On it
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px]">
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs text-text-2">
              <Users className="size-3.5" /> 3 reports
            </span>
            <span className="grid size-5 place-items-center rounded-full bg-claimed text-[10px] font-semibold text-white">
              R
            </span>
            Riya
            <span className="text-text-3">· 40s</span>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-done text-sm font-medium text-white">
              <Check className="size-4" /> Mark fixed
            </span>
            <span className="inline-flex h-10 items-center px-3 text-sm text-text-2">
              Release
            </span>
          </div>
        </div>
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-[13px] text-accent-ink">
          Riya is on it. You&apos;ll hear back when it&apos;s fixed.
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[11px] text-text-3">
        Illustration of the product, not live data
      </figcaption>
    </figure>
  );
}
