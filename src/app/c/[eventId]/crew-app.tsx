"use client";

import {
  BellRing,
  Inbox as InboxIcon,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BatonMark,
  BottomTabs,
  liveLabelFor,
  PresenceDot,
  SectionHeader,
  type ShellSection,
  Sidebar,
  SidebarLink,
  SignedInAs,
  useIsDesktop,
} from "@/components/app-shell";
import { DirectThread } from "@/components/direct-thread";
import { Inbox, useDirectThreads } from "@/components/inbox";
import { IncidentCard } from "@/components/incident-card";
import { IncidentDetail } from "@/components/incident-detail";
import { Sheet } from "@/components/sheet";
import {
  Button,
  ConnectionBanner,
  cx,
  ErrorNote,
  inputClass,
} from "@/components/ui";
import {
  loadHistory,
  onMessage,
  sendGroupText,
  useNexconn,
  type ChatMessage,
} from "@/lib/nexconn-client";
import {
  api,
  CATEGORY_LABEL,
  type CrewMemberView,
  type IncidentView,
} from "@/lib/types";
import { useEventState } from "@/lib/use-event-state";
import { Picker } from "@/components/dropdown";

type Tab = "stream" | "mine" | "inbox" | "crew";
type NudgeKind =
  | "escalation"
  | "assigned"
  | "pass_offered"
  | "pass_accepted"
  | "pass_declined";
type Nudge = {
  kind: NudgeKind;
  incidentId: string;
  number: number;
  title: string;
  byName?: string;
};
const NUDGE_KINDS: NudgeKind[] = [
  "assigned",
  "pass_offered",
  "pass_accepted",
  "pass_declined",
];

export function CrewApp({
  eventId,
  role = "member",
}: {
  eventId: string;
  role?: "member" | "organizer";
}) {
  const conn = useNexconn(eventId, role);
  const { state, error, refresh, patchIncident, flash } = useEventState(
    eventId,
    conn.state,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dmPeer, setDmPeer] = useState<CrewMemberView | null>(null);
  const connected = conn.state === "connected";
  const dms = useDirectThreads(
    connected,
    state?.crew,
    state?.me?.nexconnUserId,
  );
  const [tab, setTab] = useState<Tab>("stream");
  const [selected, setSelected] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const bottom = useRef<HTMLDivElement>(null);
  const groupId = state?.event.groupId;
  const desktop = useIsDesktop();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  // History once connected (Web SDK keeps no local store), then live messages for our group.
  useEffect(() => {
    if (conn.state !== "connected" || !groupId) return;
    let cancelled = false;
    loadHistory("group", groupId).then((h) => {
      if (!cancelled) setMessages((cur) => mergeMessages(h, cur));
    });
    return () => {
      cancelled = true;
    };
  }, [conn.state, groupId]);

  useEffect(() => {
    return onMessage((m) => {
      if (m.channelId !== groupId) return;
      if (m.messageType === "BTN:Nudge") {
        const c = m.content as {
          kind?: string;
          incidentId: string;
          number: number;
          title: string;
          byName?: string;
        };
        setNudge({
          kind: NUDGE_KINDS.includes(c.kind as NudgeKind)
            ? (c.kind as NudgeKind)
            : "escalation",
          incidentId: c.incidentId,
          number: c.number,
          title: c.title,
          byName: c.byName,
        });
        if (typeof navigator !== "undefined" && "vibrate" in navigator)
          navigator.vibrate?.(200);
      }
      setMessages((cur) => mergeMessages(cur, [m]));
    });
  }, [groupId]);

  useEffect(() => {
    if (tab === "stream") bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, tab]);

  const incidentsById = useMemo(
    () => new Map(state?.incidents.map((i) => [i.id, i]) ?? []),
    [state],
  );
  // A nudge is a one-off message; the incident state is the truth. Hide it once it no longer matches, e.g. the pass
  // was accepted, declined or withdrawn, or someone claimed the unowned request it was about.
  const meIdForNudge = state?.me?.id;
  const nudgeIncident = nudge ? incidentsById.get(nudge.incidentId) : undefined;
  const nudgeStale =
    !!nudge &&
    !!nudgeIncident &&
    ((nudge.kind === "pass_offered" && nudgeIncident.passToMemberId !== meIdForNudge) ||
      (nudge.kind === "assigned" && nudgeIncident.ownerMemberId !== meIdForNudge) ||
      (nudge.kind === "escalation" && nudgeIncident.status !== "open"));
  // Chat-detected requests live on the crew message itself (cardMessageId = that message).
  const incidentsByMessage = useMemo(
    () =>
      new Map(
        state?.incidents
          .filter((i) => i.origin === "chat" && i.cardMessageId)
          .map((i) => [i.cardMessageId!, i]) ?? [],
      ),
    [state],
  );
  const nameByUser = useMemo(
    () => new Map(state?.crew.map((c) => [c.nexconnUserId, c.name]) ?? []),
    [state],
  );
  const isLead = state?.me?.role === "lead";
  // Requests whose card isn't in the loaded history (joined mid-event, or history beyond the first page).
  const earlier = useMemo(() => {
    const loaded = new Set(messages.map((m) => m.messageId));
    return (
      state?.incidents.filter(
        (i) =>
          (i.status === "open" || i.status === "claimed") &&
          !(i.cardMessageId && loaded.has(i.cardMessageId)),
      ) ?? []
    );
  }, [state, messages]);

  if (error?.code === "forbidden") {
    return (
      <Centered>
        <h1 className="font-serif font-normal tracking-[-0.025em] text-[30px] leading-[1.05]">
          You&apos;re not on this crew yet
        </h1>
        <p className="text-sm text-text-2">
          Scan the crew QR code from your organizer to join.
        </p>
      </Centered>
    );
  }

  // My tasks: what I own, plus anything a teammate is passing to me (it needs my answer).
  // My tasks: what I own, plus anything a teammate is passing to me (it needs my answer).
  const mine =
    state?.incidents.filter(
      (i) =>
        i.status === "claimed" &&
        (i.ownerMemberId === state.me?.id || i.passToMemberId === state.me?.id),
    ) ?? [];
  const waiting = (
    state?.incidents.filter((i) => i.status === "open") ?? []
  ).sort((a, b) =>
    a.priority === b.priority
      ? a.createdAt - b.createdAt
      : a.priority === "urgent"
        ? -1
        : 1,
  );
  const openCount = waiting.length;
  const loadOf = (memberId: string) =>
    state?.incidents.filter(
      (i) => i.status === "claimed" && i.ownerMemberId === memberId,
    ).length ?? 0;

  const card = (
    inc: IncidentView,
    extra: { attached?: boolean; compact?: boolean } = {},
  ) => (
    <IncidentCard
      key={inc.id}
      eventId={eventId}
      incident={inc}
      meId={state?.me?.id ?? null}
      isLead={isLead}
      now={now}
      flashAt={flash[inc.id]}
      onOpen={() => setOpenId(inc.id)}
      onPatch={patchIncident}
      onRefresh={refresh}
      {...extra}
    />
  );

  // On a laptop a conversation opens next to the inbox; on a phone it opens as a sheet.
  function openDm(c: CrewMemberView) {
    setDmPeer(c);
    if (desktop) setTab("inbox");
  }

  const NAV: ShellSection<Tab>[] = [
    {
      key: "stream",
      Icon: MessageSquare,
      label: "Stream",
      hint: "Crew chat and live requests",
    },
    {
      key: "mine",
      Icon: ListTodo,
      label: "My tasks",
      hint: "What you own, and passes waiting for your answer",
      count: mine.length,
      countTone: "task",
    },
    {
      key: "inbox",
      Icon: InboxIcon,
      label: "Inbox",
      hint: "Private conversations with your crew",
      count: dms.unread,
      countTone: "alert",
    },
    {
      key: "crew",
      Icon: Users,
      label: "Crew",
      hint: "Everyone on this event and what they're handling",
      count: state?.crew.length,
    },
  ];
  const current = NAV.find((n) => n.key === tab)!;
  const liveLabel = liveLabelFor(conn.state);

  return (
    <div className="flex h-dvh bg-bg">
      {/* Laptop: sidebar */}
      <Sidebar
        label="Crew navigation"
        eyebrow={`Crew${state?.event.isDemo ? " · Demo" : ""}`}
        title={state?.event.name ?? "Loading…"}
        sections={NAV}
        current={tab}
        onSelect={setTab}
        links={
          role === "organizer" ? (
            <SidebarLink
              href={`/o/${eventId}`}
              icon={<LayoutDashboard className="size-[18px]" aria-hidden />}
            >
              Command centre
            </SidebarLink>
          ) : undefined
        }
        footer={
          state?.me && (
            <SignedInAs
              name={state.me.name}
              role={state.me.role === "lead" ? "Lead" : "Crew"}
              connected={connected}
              liveLabel={liveLabel}
            />
          )
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone: compact header */}
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <BatonMark className="h-[13px] w-[18px] shrink-0 text-text" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[22px] leading-none tracking-[-0.02em]">
              {state?.event.name ?? "Loading…"}
            </p>
            <p className="mt-0.5 text-xs text-text-3">
              {state?.me
                ? `${state.me.name} · ${state.me.role === "lead" ? "Lead" : "Crew"}`
                : " "}
              {openCount > 0 && (
                <span className="text-open"> · {openCount} open</span>
              )}
            </p>
          </div>
          {role === "organizer" && (
            <Link
              href={`/o/${eventId}`}
              className="rounded-full border border-border px-3 py-1 text-xs text-text-2"
            >
              Board
            </Link>
          )}
          {state?.event.isDemo && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
              Demo
            </span>
          )}
        </header>

        {/* Laptop: section header */}
        <SectionHeader title={current.label} hint={current.hint}>
          {openCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-open-soft px-3 py-1 text-[13px] font-medium text-open">
              <span className="size-1.5 rounded-full bg-open" aria-hidden />{" "}
              {openCount} need{openCount === 1 ? "s" : ""} an owner
            </span>
          )}
        </SectionHeader>

        <ConnectionBanner
          state={conn.state}
          error={conn.error}
          onRetry={conn.retry}
        />
        {nudge && !nudgeStale && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-urgent-soft px-4 py-2.5 text-[13px] text-urgent lg:px-8"
          >
            <BellRing className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">
              {nudge.kind === "assigned" ? (
                <>
                  {nudge.byName ?? "A lead"} assigned you{" "}
                  <strong>#{nudge.number}</strong> — {nudge.title}
                </>
              ) : nudge.kind === "pass_offered" ? (
                <>
                  {nudge.byName ?? "A teammate"} wants to pass you{" "}
                  <strong>#{nudge.number}</strong> — {nudge.title}
                </>
              ) : nudge.kind === "pass_accepted" ? (
                <>
                  {nudge.byName ?? "Your teammate"} took over{" "}
                  <strong>#{nudge.number}</strong>. You&apos;re free.
                </>
              ) : nudge.kind === "pass_declined" ? (
                <>
                  {nudge.byName ?? "Your teammate"} can&apos;t take{" "}
                  <strong>#{nudge.number}</strong>. It&apos;s still yours.
                </>
              ) : (
                <>
                  <strong>#{nudge.number}</strong> is unclaimed — {nudge.title}.
                  You were asked to handle it.
                </>
              )}
            </span>
            {incidentsById.has(nudge.incidentId) && (
              <button
                className="font-medium underline underline-offset-2"
                onClick={() => {
                  setOpenId(nudge.incidentId);
                  setNudge(null);
                }}
              >
                Open
              </button>
            )}
            <button aria-label="Dismiss" onClick={() => setNudge(null)}>
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1 overflow-y-auto">
              <div
                className={cx(
                  "mx-auto w-full px-3 py-3 lg:px-8 lg:py-6",
                  tab === "inbox" || tab === "crew" ? "max-w-5xl" : "max-w-3xl",
                )}
              >
                {!state && !error && (
                  <div className="space-y-2.5" aria-label="Loading">
                    {[0, 1, 2].map((k) => (
                      <div
                        key={k}
                        className="h-24 animate-pulse rounded-xl bg-surface-2"
                      />
                    ))}
                  </div>
                )}
                {error && error.code !== "forbidden" && (
                  <ErrorNote>{error.message}</ErrorNote>
                )}
                {state && tab === "stream" && (
                  <ol
                    className="space-y-2.5 lg:space-y-3"
                    aria-label="Crew stream"
                  >
                    {earlier.length > 0 && (
                      <li>
                        <section
                          aria-label="Earlier requests"
                          className="space-y-2.5"
                        >
                          <h2 className="px-1 text-xs font-medium text-text-3">
                            Earlier requests still open
                          </h2>
                          {earlier.map((inc) => card(inc))}
                        </section>
                      </li>
                    )}
                    {messages.length === 0 &&
                      earlier.length === 0 &&
                      conn.state === "connected" && (
                        <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-3">
                          <MessageSquare
                            className="mx-auto mb-2 size-5"
                            aria-hidden
                          />
                          No messages yet. Requests from attendees and crew show
                          up here as cards.
                        </li>
                      )}
                    {messages.map((m) => {
                      if (m.messageType === "BTN:Incident") {
                        const inc = incidentsById.get(
                          String(m.content.incidentId),
                        );
                        if (!inc) return null;
                        return <li key={m.messageId}>{card(inc)}</li>;
                      }
                      if (m.messageType === "BTN:Nudge") return null; // shown as the alert banner
                      if (m.messageType !== "RC:TxtMsg") return null;
                      const own = m.senderUserId === state.me?.nexconnUserId;
                      const text = String(
                        (m.content as { text?: string; content?: string })
                          .text ??
                          (m.content as { content?: string }).content ??
                          "",
                      );
                      const inc =
                        incidentsByMessage.get(m.messageId) ??
                        (m.metadata.inc
                          ? incidentsById.get(m.metadata.inc)
                          : undefined);
                      const fromCrew = nameByUser.has(m.senderUserId);
                      return (
                        <li
                          key={m.messageId}
                          className={cx(
                            "flex flex-col",
                            own ? "items-end" : "items-start",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelected((cur) =>
                                cur === m.messageId ? null : m.messageId,
                              )
                            }
                            aria-expanded={
                              !inc && fromCrew
                                ? selected === m.messageId
                                : undefined
                            }
                            className={cx(
                              "max-w-[80%] rounded-2xl px-3.5 py-2 text-left text-[15px] lg:max-w-[70%]",
                              own
                                ? "bg-accent text-accent-ink"
                                : "border border-border bg-surface",
                              inc && (own ? "rounded-br-md" : "rounded-bl-md"),
                            )}
                          >
                            {!own && (
                              <span className="mb-0.5 block text-xs font-medium text-text-3">
                                {nameByUser.get(m.senderUserId) ?? "Crew"}
                              </span>
                            )}
                            <span className="block whitespace-pre-wrap break-words">
                              {text}
                            </span>
                          </button>
                          {inc && (
                            <div className="mt-1 w-[88%] max-w-sm">
                              {card(inc, { attached: true })}
                            </div>
                          )}
                          {!inc && fromCrew && selected === m.messageId && (
                            <MakeRequest
                              eventId={eventId}
                              messageId={m.messageId}
                              senderUserId={m.senderUserId}
                              text={text}
                              onDone={() => {
                                setSelected(null);
                                refresh();
                              }}
                            />
                          )}
                        </li>
                      );
                    })}
                    <div ref={bottom} />
                  </ol>
                )}
                {state && tab === "mine" && (
                  <div className="grid gap-2.5 lg:gap-3">
                    {mine.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-3">
                        Nothing claimed yet. Tap “I’ll take it” on a card to own
                        it.
                      </p>
                    ) : (
                      mine.map((inc) => card(inc))
                    )}
                  </div>
                )}
                {state && tab === "inbox" && (
                  <div className="lg:grid lg:h-[calc(100dvh-190px)] lg:grid-cols-[320px_1fr] lg:gap-5">
                    <div className="min-h-0 lg:overflow-y-auto">
                      <Inbox
                        threads={dms.threads}
                        crew={state.crew}
                        meId={state.me?.nexconnUserId ?? null}
                        now={now}
                        onOpen={openDm}
                        onStart={() => setTab("crew")}
                      />
                    </div>
                    <section
                      className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface lg:flex"
                      aria-label="Conversation"
                    >
                      {dmPeer ? (
                        <>
                          <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                            <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-sm font-semibold">
                              {dmPeer.name.slice(0, 1).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {dmPeer.name}
                              </p>
                              <p className="text-xs text-text-3">
                                {dmPeer.role === "lead" ? "Lead" : "Crew"} ·
                                private Nexconn conversation
                              </p>
                            </div>
                          </header>
                          <div className="flex min-h-0 flex-1 flex-col">
                            <DirectThread
                              key={dmPeer.id}
                              peerUserId={dmPeer.nexconnUserId}
                              peerName={dmPeer.name}
                              meUserId={state.me?.nexconnUserId ?? null}
                              connected={connected}
                              onActivity={dms.refresh}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="grid flex-1 place-items-center p-8 text-center text-sm text-text-3">
                          <div>
                            <MessageCircle
                              className="mx-auto mb-2 size-6"
                              aria-hidden
                            />
                            Pick a conversation, or message someone from Crew.
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                )}
                {state && tab === "crew" && (
                  <ul className="grid gap-2.5 sm:grid-cols-2 lg:gap-3 2xl:grid-cols-3">
                    {state.crew.map((c) => {
                      const load = loadOf(c.id);
                      const zone = c.zoneId
                        ? state.zones.find((z) => z.id === c.zoneId)?.name
                        : null;
                      return (
                        <li
                          key={c.id}
                          className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5"
                        >
                          <span
                            className={cx(
                              "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
                              c.id === state.me?.id
                                ? "bg-brand text-white"
                                : "bg-surface-2",
                            )}
                          >
                            {c.name.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                              <PresenceDot online={c.online} />
                              {c.name}{" "}
                              {c.id === state.me?.id && (
                                <span className="font-normal text-text-3">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-text-3">
                              {c.role === "lead" ? "Lead" : "Crew"}
                              {zone ? ` · ${zone}` : ""}
                              {c.isSimulated ? " · simulated" : ""}
                            </p>
                            <p
                              className={cx(
                                "mt-1 text-xs",
                                load ? "text-claimed" : "text-text-3",
                              )}
                            >
                              {load
                                ? `On ${load} request${load === 1 ? "" : "s"}`
                                : "Free"}
                            </p>
                          </div>
                          {c.id !== state.me?.id && !c.isSimulated && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDm(c)}
                              aria-label={`Message ${c.name}`}
                            >
                              <MessageCircle className="size-4" aria-hidden />{" "}
                              Message
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </main>
            {state && tab === "stream" && (
              <Composer
                eventId={eventId}
                groupId={state.event.groupId}
                zones={state.zones}
                connected={conn.state === "connected"}
                onSent={(m) => setMessages((cur) => mergeMessages(cur, [m]))}
                onRequested={refresh}
              />
            )}
          </div>

          {/* Wide laptop: the queue that needs an owner, always in view */}
          {state && (
            <aside
              className="hidden w-[340px] shrink-0 flex-col border-l border-border bg-surface/60 xl:flex"
              aria-labelledby="queue-h"
            >
              <h2
                id="queue-h"
                className="flex items-center gap-2 border-b border-border px-5 py-4 text-[13px] font-semibold text-text-2"
              >
                <span className="size-2 rounded-full bg-open" aria-hidden />
                Needs an owner
                <span className="font-normal text-text-3">{openCount}</span>
              </h2>
              <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {waiting.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-5 text-center text-[13px] text-text-3">
                    Nothing waiting. New requests land here.
                  </p>
                ) : (
                  waiting.map((inc) => card(inc, { compact: true }))
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Phone: bottom tabs */}
        <BottomTabs sections={NAV} current={tab} onSelect={setTab} />
      </div>

      {state && openId && incidentsById.get(openId) && (
        <IncidentDetail
          eventId={eventId}
          incident={incidentsById.get(openId)!}
          crew={state.crew}
          me={state.me}
          isLead={isLead}
          now={now}
          connected={connected}
          flashAt={flash[openId]}
          onPatch={patchIncident}
          onRefresh={refresh}
          onClose={() => setOpenId(null)}
        />
      )}
      {state && dmPeer && !desktop && (
        <Sheet
          onClose={() => {
            setDmPeer(null);
            dms.refresh();
          }}
          title={
            <span>
              {dmPeer.name}{" "}
              <span className="font-normal text-text-3">
                · {dmPeer.role === "lead" ? "lead" : "crew"}
              </span>
            </span>
          }
        >
          <div className="flex h-full min-h-[60dvh] flex-col lg:min-h-full">
            <DirectThread
              peerUserId={dmPeer.nexconnUserId}
              peerName={dmPeer.name}
              meUserId={state.me?.nexconnUserId ?? null}
              connected={connected}
              onActivity={dms.refresh}
            />
          </div>
        </Sheet>
      )}
    </div>
  );
}

function mergeMessages(a: ChatMessage[], b: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  for (const m of [...a, ...b])
    byId.set(m.messageId, { ...byId.get(m.messageId), ...m });
  return [...byId.values()].sort((x, y) => x.sentTime - y.sentTime);
}

function Composer({
  eventId,
  groupId,
  zones,
  connected,
  onSent,
  onRequested,
}: {
  eventId: string;
  groupId: string;
  zones: { id: string; name: string }[];
  connected: boolean;
  onSent: (m: ChatMessage) => void;
  onRequested: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [category, setCategory] = useState("supplies");
  const [zoneId, setZoneId] = useState<string>("");
  const [urgent, setUrgent] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      onSent(await sendGroupText(groupId, text.trim()));
      setText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function request() {
    setSending(true);
    setError(null);
    try {
      await api(`/api/events/${eventId}/reports`, {
        method: "POST",
        body: JSON.stringify({
          category,
          zoneId: zoneId || null,
          text: text.trim(),
          urgent,
        }),
      });
      setText("");
      setSheet(false);
      onRequested();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-border bg-surface px-3 py-2.5 lg:px-8 lg:py-4">
      <div className="mx-auto w-full max-w-3xl">
        {error && (
          <p role="alert" className="mb-2 text-[13px] text-danger">
            {error}
          </p>
        )}
        {sheet && (
          <div className="mb-3 space-y-3 rounded-xl border border-border bg-surface-2 p-3">
            <div
              className="flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label="Category"
            >
              {Object.entries(CATEGORY_LABEL).map(([k, label]) => (
                <button
                  key={k}
                  role="radio"
                  aria-checked={category === k}
                  onClick={() => setCategory(k)}
                  className={cx(
                    "rounded-full border px-3 py-1 text-[13px]",
                    category === k
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-surface text-text-2",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Picker
                ariaLabel="Location"
                label="Location"
                className="h-10 flex-1"
                value={zoneId}
                onChange={setZoneId}
                placeholder="Location (optional)"
                emptyLabel={zoneId ? "No location" : undefined}
                options={zones.map((z) => ({ value: z.id, label: z.name }))}
              />
              <label className="flex items-center gap-1.5 text-[13px] text-text-2">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                />{" "}
                Urgent
              </label>
            </div>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Button
            variant={sheet ? "primary" : "secondary"}
            size="md"
            aria-label={sheet ? "Close request form" : "Create a request"}
            onClick={() => setSheet((s) => !s)}
            className="w-10 px-0"
          >
            {sheet ? <X className="size-4" /> : <Plus className="size-4" />}
          </Button>
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                if (sheet) void request();
                else void send();
              }
            }}
            placeholder={
              sheet
                ? "What's needed? (optional)"
                : connected
                  ? "Message the crew"
                  : "Connecting…"
            }
            aria-label={sheet ? "Request details" : "Message"}
            className={cx(inputClass, "min-h-10 resize-none py-2 text-[15px]")}
          />
          <Button
            variant="primary"
            busy={sending}
            disabled={!connected && !sheet}
            aria-label={sheet ? "Post request" : "Send"}
            onClick={sheet ? request : send}
            className={sheet ? "" : "w-10 px-0"}
          >
            {sheet ? "Post" : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Fallback when detection missed a request: the same chat message becomes claimable in place. */
function MakeRequest({
  eventId,
  messageId,
  senderUserId,
  text,
  onDone,
}: {
  eventId: string;
  messageId: string;
  senderUserId: string;
  text: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function make() {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/events/${eventId}/chat-requests`, {
        method: "POST",
        body: JSON.stringify({ messageId, senderUserId, text }),
      });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-1 flex items-center gap-2">
      <Button size="sm" variant="secondary" busy={busy} onClick={make}>
        <Sparkles className="size-3.5" aria-hidden /> Make it a request
      </Button>
      {error && (
        <span role="alert" className="text-[13px] text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-2 p-6 text-center">
      {children}
    </div>
  );
}
