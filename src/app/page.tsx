import {
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
import Hero57 from "@/components/originkit/hero-57";
import { MotionRoot, Reveal, Stagger, StaggerItem } from "@/components/landing-motion";
import { TryDemoButton } from "./try-demo";

/*
 * Marketing page. The hero is Originkit's hero-57, adapted with our copy over real product screens; the rest follows its
 * look: white and warm surfaces, a serif display face, black pill buttons. Every claim describes something the
 * product does today; there are no customer logos, testimonials or usage numbers because we don't have them yet.
 */

const serif = "font-(family-name:--font-display) font-normal";
const pill =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-progress disabled:opacity-70";
const ghost =
  "inline-flex h-12 items-center justify-center rounded-full border border-neutral-950/15 bg-white/70 px-7 text-[15px] font-medium text-neutral-950 backdrop-blur transition-colors hover:border-neutral-950/40";

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
    t: "Nobody knows who’s on it",
    d: "“Someone handling this?” goes unanswered, so organizers chase by phone.",
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
    d: "Each reporter is told who is on it, then that it’s fixed. Once.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    t: "Chat that becomes work",
    d: "Type “need 2 chairs at Hall B” in the crew chat and the message itself becomes claimable. Transparent rules, no guesswork, one tap to undo.",
  },
  {
    icon: GitMerge,
    t: "Duplicate merging",
    d: "Same place, same kind of problem, within minutes: merged. Medical and safety reports are only suggested, never merged silently.",
  },
  {
    icon: Hand,
    t: "Race-proof ownership",
    d: "Ten volunteers can tap at once. Exactly one wins, and everyone else sees who did.",
  },
  {
    icon: Users,
    t: "Assign and reassign",
    d: "Leads hand a request to a specific person, who gets a private alert inside the crew chat.",
  },
  {
    icon: MessageCircle,
    t: "Direct messages",
    d: "Message the owner from the incident itself. One-to-one, and no phone numbers shared.",
  },
  {
    icon: Bell,
    t: "Escalation, by name",
    d: "Unclaimed for too long? The zone lead is alerted, then the event leads. Urgent issues escalate sooner.",
  },
  {
    icon: ScrollText,
    t: "Full incident history",
    d: "Every report, merge, claim, reassignment and fix, with who and when, on one timeline.",
  },
  {
    icon: BarChart3,
    t: "Impact report",
    d: "Time to owner, time to fix and hot spots by zone, built only from what really happened.",
  },
];

const COMPARE: [string, boolean, boolean][] = [
  ["Works for volunteers with no app or account", true, true],
  ["Requests stay visible until someone owns them", false, true],
  ["Duplicate reports collapse into one task", false, true],
  ["Everyone sees who is handling what, live", false, true],
  ["The person who reported it is told when it’s fixed", false, true],
  ["Unowned requests escalate to a named lead", false, true],
  ["Times to respond and fix, per zone", false, true],
];

const FAQ = [
  {
    q: "Do volunteers or attendees need to install anything?",
    a: "No. Volunteers join from a QR code or link and type their name. Attendees scan a poster and report anonymously. Everything runs in the phone’s browser.",
  },
  {
    q: "Does it replace our WhatsApp group?",
    a: "It replaces the part a group chat is bad at: tracking requests. Many crews keep their social group and run operations in Baton, which has a real crew chat of its own.",
  },
  {
    q: "What counts as a duplicate?",
    a: "A report in the same zone and category as an open incident from the last few minutes. Reports that only look similar are suggested for a merge, never merged silently, and medical or safety reports are never merged automatically.",
  },
  {
    q: "What happens if the internet drops?",
    a: "Every claim and status change is saved on our server first. Phones resync when they reconnect, and a background job repairs anything that didn’t reach the live chat.",
  },
  {
    q: "What do you keep about attendees?",
    a: "Nothing that identifies them: no name, phone or email. A report is tied to an anonymous browser session so we can tell that person when it’s fixed.",
  },
  {
    q: "What does it cost?",
    a: "Baton is free while we pilot it with real events. If you run an event in the next few weeks, we’d like to help you set it up.",
  },
];

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  return (
    <div
      className={`flex flex-1 flex-col bg-white font-(family-name:--font-body) text-neutral-950 antialiased scheme-light`}
    >
      <MotionRoot>
      <Hero57 error={typeof sp.error === "string" ? sp.error : undefined} />

      <main>
        {/* The problem */}
        <Section id="problem">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <Reveal>
              <Eyebrow>The problem</Eyebrow>
              <h2
                className={`${serif} mt-4 text-[40px] leading-[1.02] tracking-[-0.03em] sm:text-6xl`}
              >
                Event crews run on group chats{" "}
                <em className="text-neutral-400">never built</em> for
                operations.
              </h2>
            </Reveal>
            <Stagger as="ol" gap={0.1} delay={0.15} className="divide-y divide-neutral-200 border-y border-neutral-200">
              {PROBLEMS.map((p, k) => (
                <StaggerItem as="li" key={p.t} className="flex gap-5 py-6">
                  <span
                    className={`${serif} w-8 shrink-0 text-3xl leading-none text-[#c8664f]`}
                  >
                    {k + 1}
                  </span>
                  <div>
                    <p className="text-[17px] font-semibold">{p.t}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-neutral-600">
                      {p.d}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Section>

        {/* How it works */}
        <Section id="how">
          <Heading
            eyebrow="How it works"
            title={
              <>
                One issue, four states,{" "}
                <em className="text-neutral-400">everyone</em> can see it.
              </>
            }
          />
          <Stagger as="ol" gap={0.12} className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, k) => (
              <StaggerItem as="li" key={s.t} className="border-t border-neutral-950 pt-6">
                <div className="flex items-center justify-between">
                  <span className={`${serif} text-4xl leading-none`}>
                    0{k + 1}
                  </span>
                  <s.icon className="size-5 text-[#c8664f]" aria-hidden />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                  {s.d}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        {/* The closed loop */}
        <section
          id="lifecycle"
          aria-labelledby="lifecycle-h"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 sm:px-6"
        >
          <Reveal className="grid items-center gap-10 overflow-hidden rounded-4xl bg-[linear-gradient(160deg,#FBE6DF_0%,#F7D3C8_45%,#F4A493_100%)] px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <Eyebrow>The closed loop</Eyebrow>
              <h2
                id="lifecycle-h"
                className={`${serif} mt-4 text-[40px] leading-[1.02] tracking-[-0.03em] sm:text-6xl`}
              >
                The person who reported it is <em>part of the loop.</em>
              </h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-neutral-800">
                Most tools stop when a volunteer marks something done. Baton
                tells every person who reported the issue that someone is on it,
                and again when it’s fixed. One update per state, never a flood.
              </p>
              <ol
                className="mt-8 flex flex-wrap items-center gap-2 text-[13px] font-medium"
                aria-label="Incident states"
              >
                {["Reported", "Owned", "Fixed", "Reporters told"].map(
                  (t, k) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
                        {t}
                      </span>
                      {k < 3 && (
                        <span aria-hidden className="text-neutral-700">
                          →
                        </span>
                      )}
                    </li>
                  ),
                )}
              </ol>
            </div>
            <Reveal delay={0.2}>
              <ProductIllustration />
            </Reveal>
          </Reveal>
        </section>

        {/* Roles */}
        <Section id="roles">
          <Heading
            eyebrow="Who it’s for"
            title={
              <>
                Three views, each built for the device{" "}
                <em className="text-neutral-400">that person holds.</em>
              </>
            }
          />
          <Stagger gap={0.12} className="mt-14 grid gap-4 md:grid-cols-3">
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
                "Claim with one tap and see your tasks",
                "Crew chat where requests become cards",
              ]}
            />
            <RoleCard
              icon={<QrCode className="size-5" />}
              who="Attendees"
              where="Any phone camera"
              points={[
                "Scan a poster at the location",
                "Pick what’s wrong, add a detail",
                "See “on it”, then “fixed”, with no account",
              ]}
            />
          </Stagger>
        </Section>

        {/* Features */}
        <Section id="features">
          <Heading
            eyebrow="Features"
            title={
              <>
                Small, deliberate tools for{" "}
                <em className="text-neutral-400">the moments that go wrong.</em>
              </>
            }
          />
          <Stagger gap={0.06} className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <StaggerItem key={f.t} className="bg-white p-6">
                <f.icon className="size-5 text-[#c8664f]" aria-hidden />
                <h3 className="mt-5 font-semibold">{f.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                  {f.d}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        {/* Built on Nexconn */}
        <section
          id="realtime"
          aria-labelledby="realtime-h"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 sm:px-6"
        >
          <Reveal className="rounded-4xl bg-neutral-950 px-6 py-14 text-white sm:px-12 sm:py-20">
            <Eyebrow dark>Real-time by Nexconn</Eyebrow>
            <h2
              id="realtime-h"
              className={`${serif} mt-4 max-w-3xl text-[40px] leading-[1.02] tracking-[-0.03em] sm:text-6xl`}
            >
              The chat message <em className="text-[#F4A493]">is</em> the
              incident.
            </h2>
            <Stagger gap={0.12} delay={0.2} className="mt-12 grid gap-8 border-t border-white/15 pt-10 md:grid-cols-3">
              <TechPoint
                title="Live state on the message"
                body="Each incident is a Nexconn group message. Its status, owner and report count live in message metadata, so a claim updates the same card on every phone."
              />
              <TechPoint
                title="Private where it should be"
                body="Assignment alerts are targeted group messages only the assignee receives. Organizer ↔ volunteer conversations use Nexconn direct channels."
              />
              <TechPoint
                title="The database decides"
                body="Claims are settled in Postgres first, then projected to Nexconn in the background, with a repair loop that re-syncs anything that didn’t arrive."
              />
            </Stagger>
          </Reveal>
        </section>

        {/* Comparison */}
        <Section id="compare">
          <Heading
            eyebrow="Compared with a group chat"
            title={
              <>
                Keep the chat.{" "}
                <em className="text-neutral-400">Add ownership.</em>
              </>
            }
          />
          <Reveal className="mt-12 overflow-hidden rounded-3xl border border-neutral-200">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-[#faf6f4] text-[13px] text-neutral-500">
                <tr>
                  <th scope="col" className="px-4 py-4 font-medium sm:px-6">
                    What a crew needs
                  </th>
                  <th
                    scope="col"
                    className="w-20 px-2 py-4 text-center font-medium sm:w-32"
                  >
                    Group chat
                  </th>
                  <th
                    scope="col"
                    className="w-20 px-2 py-4 text-center font-semibold text-neutral-950 sm:w-32"
                  >
                    Baton
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {COMPARE.map(([need, chat, baton]) => (
                  <tr key={need}>
                    <td className="px-4 py-4 sm:px-6">{need}</td>
                    <td className="px-2 py-4 text-center">{mark(chat)}</td>
                    <td className="px-2 py-4 text-center">{mark(baton)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </Section>

        {/* Setup */}
        <Section id="setup" className="pt-0 sm:pt-0">
          <Heading
            eyebrow="Setup"
            title={
              <>
                Ready before your{" "}
                <em className="text-neutral-400">first volunteer arrives.</em>
              </>
            }
          />
          <Stagger as="ol" gap={0.12} className="mt-12 grid gap-4 md:grid-cols-3">
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
              <StaggerItem as="li" key={t} className="rounded-3xl bg-[#faf6f4] p-7">
                <span
                  className={`${serif} text-5xl leading-none text-[#c8664f]`}
                >
                  {k + 1}
                </span>
                <h3 className="mt-6 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                  {d}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        {/* Privacy and reliability */}
        <Section id="trust" className="pt-0 sm:pt-0">
          <Heading
            eyebrow="Privacy and reliability"
            title={
              <>
                Built for a crowded venue{" "}
                <em className="text-neutral-400">with patchy signal.</em>
              </>
            }
          />
          <Stagger gap={0.1} className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            <TrustPoint
              icon={<Lock className="size-5" />}
              t="No attendee identity"
              d="No name, phone or email is collected from attendees."
            />
            <TrustPoint
              icon={<ShieldCheck className="size-5" />}
              t="Secrets stay server-side"
              d="Messaging credentials never reach the browser; each person gets their own token."
            />
            <TrustPoint
              icon={<Radio className="size-5" />}
              t="Reconnects on its own"
              d="Phones re-read the true state on reconnect, so nothing is lost if a tab sleeps."
            />
            <TrustPoint
              icon={<MapPin className="size-5" />}
              t="Simulated data is labelled"
              d="Demo activity is marked and never counted in impact numbers."
            />
          </Stagger>
        </Section>

        {/* FAQ */}
        <Section id="faq">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Heading
              eyebrow="FAQ"
              title={
                <>
                  Questions organizers{" "}
                  <em className="text-neutral-400">ask first.</em>
                </>
              }
            />
            <Stagger gap={0.07} delay={0.1} className="divide-y divide-neutral-200 border-y border-neutral-200">
              {FAQ.map((f) => (
                <StaggerItem key={f.q}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition-transform group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 pr-12 text-[15px] leading-relaxed text-neutral-600">
                    {f.a}
                  </p>
                </details>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <Reveal className="rounded-4xl bg-[linear-gradient(180deg,#FBE6DF_0%,#F7D3C8_50%,#F4A493_100%)] px-6 py-16 text-center sm:px-12 sm:py-24">
            <h2
              className={`${serif} mx-auto max-w-3xl text-[44px] leading-none tracking-[-0.035em] sm:text-7xl`}
            >
              See the whole loop <em>in two minutes.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-neutral-800">
              Report a problem as an attendee, claim it as a volunteer, and
              watch the organizer’s command centre update live.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <TryDemoButton
                className={pill}
                errorClassName="mt-2 text-sm text-red-700"
              >
                Try Baton live <span aria-hidden>→</span>
              </TryDemoButton>
              <Link href="/new" className={ghost}>
                Set up your event
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-[13px] text-neutral-500 sm:px-6">
          <span className={`${serif} text-2xl text-neutral-950`}>Baton</span>
        </div>
      </footer>
      </MotionRoot>
    </div>
  );
}

function Section({
  id,
  className = "",
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 ${className}`}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`text-[12px] font-medium uppercase tracking-[0.14em] ${dark ? "text-[#F4A493]" : "text-[#b4533f]"}`}
    >
      {children}
    </p>
  );
}

function Heading({ eyebrow, title }: { eyebrow: string; title: ReactNode }) {
  return (
    <Reveal className="max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        className={`${serif} mt-4 text-[40px] leading-[1.02] tracking-[-0.03em] sm:text-6xl`}
      >
        {title}
      </h2>
    </Reveal>
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
    <StaggerItem className="flex flex-col rounded-3xl bg-[#faf6f4] p-7">
      <span
        className="grid size-11 place-items-center rounded-full bg-white text-[#c8664f] shadow-sm"
        aria-hidden
      >
        {icon}
      </span>
      <h3 className={`${serif} mt-6 text-4xl leading-none`}>{who}</h3>
      <p className="mt-1.5 text-[13px] text-neutral-500">{where}</p>
      <ul className="mt-6 space-y-3 text-[15px] text-neutral-700">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5">
            <Check
              className="mt-0.5 size-4 shrink-0 text-neutral-950"
              aria-hidden
            />
            {p}
          </li>
        ))}
      </ul>
    </StaggerItem>
  );
}

function TechPoint({ title, body }: { title: string; body: string }) {
  return (
    <StaggerItem>
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-white/65">{body}</p>
    </StaggerItem>
  );
}

function TrustPoint({ icon, t, d }: { icon: ReactNode; t: string; d: string }) {
  return (
    <StaggerItem className="border-t border-neutral-200 pt-6">
      <span className="text-[#c8664f]" aria-hidden>
        {icon}
      </span>
      <h3 className="mt-4 font-semibold">{t}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-600">{d}</p>
    </StaggerItem>
  );
}

function mark(v: boolean) {
  return v ? (
    <span className="mx-auto grid size-6 place-items-center rounded-full bg-neutral-950 text-white">
      <Check className="size-3.5" aria-label="Yes" />
    </span>
  ) : (
    <X className="mx-auto size-4 text-neutral-300" aria-label="No" />
  );
}

/** A static picture of the product (not live data): three reports merging into one owned incident. */
function ProductIllustration() {
  return (
    <figure aria-label="Illustration: three reports from Gate 3 merge into one incident that Riya owns">
      <div className="space-y-3" aria-hidden>
        <div className="flex flex-wrap gap-2">
          {[
            "No water at Gate 3",
            "Water dispenser empty",
            "Gate 3 out of water!!",
          ].map((t, k) => (
            <span
              key={t}
              className="rounded-full bg-white/85 px-3 py-1.5 text-[13px] text-neutral-700 shadow-sm"
              style={{ transform: `rotate(${[-2, 1.5, -1][k]}deg)` }}
            >
              <QrCode className="mr-1.5 inline size-3.5 text-neutral-400" />
              {t}
            </span>
          ))}
        </div>
        <div className="flex justify-center text-neutral-700">
          <GitMerge className="size-5 rotate-180" />
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-[0_24px_60px_-24px_rgba(120,40,20,0.45)]">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                <span className="font-mono">#12</span> Water &amp; supplies
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="size-3" /> Gate 3
                </span>
                <span>· 2m ago</span>
              </p>
              <p className="mt-1 text-base font-semibold">No water at Gate 3</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              On it
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[13px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              <Users className="size-3.5" /> 3 reports
            </span>
            <span className="grid size-6 place-items-center rounded-full bg-neutral-950 text-[11px] font-semibold text-white">
              R
            </span>
            Riya
            <span className="text-neutral-400">· 40s</span>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <span className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-medium text-white">
              <Check className="size-4" /> Mark fixed
            </span>
            <span className="inline-flex h-11 items-center px-3 text-sm text-neutral-500">
              Release
            </span>
          </div>
        </div>
        <div className="ml-auto w-fit max-w-[85%] rounded-3xl rounded-br-md bg-neutral-950 px-4 py-2.5 text-[13px] text-white">
          Riya is on it. You’ll hear back when it’s fixed.
        </div>
      </div>
      <figcaption className="mt-4 text-center text-[11px] text-neutral-700/70">
        Illustration of the product, not live data
      </figcaption>
    </figure>
  );
}
