import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDb } from "../db/client";
import { events, incidentEvents, incidents, members, reports, zones } from "../db/schema";
import {
  DomainError,
  assignIncident,
  claimIncident,
  incidentDetail,
  listIncidents,
  mergeIncidents,
  releaseIncident,
  resolveIncident,
  splitReport,
  submitReport,
  takeDueEscalations,
} from "./incidents";

// Real Postgres (project-local test DB) — these tests exercise the actual transactions and row locks.
const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://baton@localhost:54329/baton_test");

const EVENT = "evtest";
const GATE3 = "zngate3";
const HALLB = "znhallb";

async function seed() {
  await db.execute(sql`truncate events, zones, members, attendees, incidents, reports, merge_suggestions, incident_events, notifications, webhook_events restart identity cascade`);
  await db.insert(events).values({ id: EVENT, slug: "fest", name: "Test Fest", organizerToken: "org", crewCode: "crew1", nexconnGroupId: "g1", botUserId: "botevtest" });
  await db.insert(zones).values([
    { id: GATE3, eventId: EVENT, name: "Gate 3", slug: "gate-3" },
    { id: HALLB, eventId: EVENT, name: "Hall B", slug: "hall-b" },
  ]);
  await db.insert(members).values(
    ["riya", "arjun", "sam", "kim", "lee"].map((n, i) => ({ id: `mb${n}`, eventId: EVENT, role: i === 1 ? ("lead" as const) : ("volunteer" as const), name: n, nexconnUserId: `cmb${n}` })),
  );
}

const report = (over: Partial<Parameters<typeof submitReport>[1]> = {}) =>
  submitReport(db, { eventId: EVENT, source: "attendee", attendeeId: "at1", zoneId: GATE3, category: "supplies", text: "water station empty", structured: true, ...over });

beforeEach(seed);
afterAll(async () => {
  await (db.$client as unknown as { end: () => Promise<void> }).end();
});

describe("report intake & consolidation", () => {
  it("creates an incident for the first report and attaches structured duplicates", async () => {
    const a = await report();
    const b = await report({ attendeeId: "at2", text: "no drinking water" });
    const c = await report({ attendeeId: "at3", text: "" });
    expect(a.outcome).toBe("new");
    expect(b).toMatchObject({ outcome: "attached", incidentId: a.incidentId, reportCount: 2 });
    expect(c).toMatchObject({ outcome: "attached", incidentId: a.incidentId, reportCount: 3 });
    const rows = await db.select().from(reports);
    expect(rows).toHaveLength(3); // every original report kept
    expect(new Set(rows.map((r) => r.incidentId))).toEqual(new Set([a.incidentId]));
  });

  it("keeps different zones separate", async () => {
    const a = await report();
    const b = await report({ zoneId: HALLB });
    expect(b.outcome).toBe("new");
    expect(b.incidentId).not.toBe(a.incidentId);
  });

  it("suggests (never auto-merges) medical reports", async () => {
    await report({ category: "medical", text: "someone fainted" });
    const b = await report({ category: "medical", text: "person fainted near gate", attendeeId: "at2" });
    expect(b.outcome).toBe("new_with_suggestion");
    const list = await listIncidents(db, EVENT);
    expect(list.find((i) => i.id === b.incidentId)?.suggestion?.candidateNumber).toBe(1);
  });

  it("numbers incidents sequentially per event even under concurrent intake", async () => {
    const results = await Promise.all(["supplies", "cleanliness", "tech", "directions", "other"].map((category) => report({ category: category as never, zoneId: HALLB })));
    const nums = (await db.select({ n: incidents.number }).from(incidents)).map((r) => r.n).sort();
    expect(results.every((r) => r.outcome === "new")).toBe(true);
    expect(nums).toEqual([1, 2, 3, 4, 5]);
  });

  it("rejects zones from another event", async () => {
    await expect(report({ zoneId: "znother" })).rejects.toMatchObject({ code: "invalid" });
  });
});

describe("ownership", () => {
  it("lets exactly one of five simultaneous claimers win", async () => {
    const { incidentId } = await report();
    const claimers = ["mbriya", "mbarjun", "mbsam", "mbkim", "mblee"];
    const outcomes = await Promise.allSettled(claimers.map((m) => claimIncident(db, EVENT, incidentId, m)));
    const winners = outcomes.filter((o) => o.status === "fulfilled");
    const losers = outcomes.filter((o): o is PromiseRejectedResult => o.status === "rejected");
    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(4);
    for (const l of losers) {
      expect(l.reason).toBeInstanceOf(DomainError);
      expect(l.reason.code).toBe("conflict");
      expect(l.reason.details.ownerName).toBeTruthy();
    }
    const [inc] = await db.select().from(incidents);
    expect(inc.status).toBe("claimed");
    const audits = await db.select().from(incidentEvents).where(sql`type = 'incident.claimed'`);
    expect(audits).toHaveLength(1);
  });

  it("treats a repeated claim by the owner as idempotent", async () => {
    const { incidentId } = await report();
    await claimIncident(db, EVENT, incidentId, "mbriya");
    const again = await claimIncident(db, EVENT, incidentId, "mbriya");
    expect(again.alreadyYours).toBe(true);
    expect(again.effects).toEqual([]);
  });

  it("rejects people who are not on the crew", async () => {
    const { incidentId } = await report();
    await expect(claimIncident(db, EVENT, incidentId, "mbstranger")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("only the owner or a lead can release or resolve", async () => {
    const { incidentId } = await report();
    await claimIncident(db, EVENT, incidentId, "mbriya");
    await expect(releaseIncident(db, EVENT, incidentId, "mbsam")).rejects.toMatchObject({ code: "forbidden" });
    await expect(resolveIncident(db, EVENT, incidentId, "mbsam")).rejects.toMatchObject({ code: "forbidden" });
    const r = await resolveIncident(db, EVENT, incidentId, "mbarjun"); // lead
    expect(r.incident.status).toBe("resolved");
  });

  it("release re-opens and re-arms escalation", async () => {
    const { incidentId } = await report();
    await claimIncident(db, EVENT, incidentId, "mbriya");
    const r = await releaseIncident(db, EVENT, incidentId, "mbriya");
    expect(r.incident.status).toBe("open");
    expect(r.incident.nextEscalationAt).not.toBeNull();
  });
});

describe("merge & split", () => {
  it("merges a suggested incident and can split a report back out", async () => {
    const a = await report();
    const b = await report({ zoneId: null, structured: false, text: "water dispenser empty near entrance", attendeeId: "at2" });
    expect(b.outcome).toBe("new_with_suggestion");
    await mergeIncidents(db, EVENT, b.incidentId, a.incidentId, "mbriya");
    let [target] = await db.select().from(incidents).where(sql`id = ${a.incidentId}`);
    const [source] = await db.select().from(incidents).where(sql`id = ${b.incidentId}`);
    expect(target.reportCount).toBe(2);
    expect(source.status).toBe("withdrawn");

    const [moved] = await db.select().from(reports).where(sql`id = ${b.reportId}`);
    const split = await splitReport(db, EVENT, moved.id, "mbriya");
    [target] = await db.select().from(incidents).where(sql`id = ${a.incidentId}`);
    expect(target.reportCount).toBe(1);
    const [rep] = await db.select().from(reports).where(sql`id = ${b.reportId}`);
    expect(rep.incidentId).toBe(split.incidentId);
  });
});

describe("escalation", () => {
  it("takes each due incident once and stops after level 2", async () => {
    const t = new Date("2026-11-14T10:00:00Z");
    await report({ now: t });
    const later = new Date(t.getTime() + 10 * 60_000);
    const first = await takeDueEscalations(db, later);
    const concurrent = await takeDueEscalations(db, later);
    expect(first).toHaveLength(1);
    expect(first[0].level).toBe(1);
    expect(concurrent).toHaveLength(0);
    const second = await takeDueEscalations(db, new Date(later.getTime() + 3 * 60_000));
    expect(second[0].level).toBe(2);
    const third = await takeDueEscalations(db, new Date(later.getTime() + 60 * 60_000));
    expect(third).toHaveLength(0);
  });
});

describe("assignment (lead hands a request to someone)", () => {
  // In the seed, "mbarjun" is the lead and everyone else is a volunteer.
  it("lets a lead assign an open request and tells the assignee", async () => {
    const { incidentId } = await report();
    const r = await assignIncident(db, EVENT, incidentId, "mbarjun", "mbriya");
    expect(r.incident).toMatchObject({ status: "claimed", ownerMemberId: "mbriya" });
    expect(r.effects).toContainEqual({ type: "assigned", incidentId, memberId: "mbriya", byName: "arjun" });
  });

  it("refuses volunteers, unknown people and finished incidents", async () => {
    const { incidentId } = await report();
    await expect(assignIncident(db, EVENT, incidentId, "mbriya", "mbsam")).rejects.toMatchObject({ code: "forbidden" });
    await expect(assignIncident(db, EVENT, incidentId, "mbarjun", "mbstranger")).rejects.toMatchObject({ code: "invalid" });
    await resolveIncident(db, EVENT, incidentId, "mbarjun");
    await expect(assignIncident(db, EVENT, incidentId, "mbarjun", "mbriya")).rejects.toMatchObject({ code: "conflict" });
  });

  it("reassigns without resetting the original claim time, and is idempotent for the same person", async () => {
    const { incidentId } = await report();
    const t0 = new Date("2026-11-11T10:00:00Z");
    await claimIncident(db, EVENT, incidentId, "mbriya", t0);
    const r = await assignIncident(db, EVENT, incidentId, "mbarjun", "mbsam", new Date("2026-11-11T10:05:00Z"));
    expect(r.incident.ownerMemberId).toBe("mbsam");
    expect(r.incident.claimedAt?.toISOString()).toBe(t0.toISOString());
    const again = await assignIncident(db, EVENT, incidentId, "mbarjun", "mbsam");
    expect(again.unchanged).toBe(true);
    expect(again.effects).toEqual([]);
  });

  it("a claim racing an assignment never leaves two owners", async () => {
    const { incidentId } = await report();
    await Promise.allSettled([claimIncident(db, EVENT, incidentId, "mbkim"), assignIncident(db, EVENT, incidentId, "mbarjun", "mbriya")]);
    const [inc] = await db.select().from(incidents);
    expect(inc.status).toBe("claimed");
    expect(["mbkim", "mbriya"]).toContain(inc.ownerMemberId);
    const owners = (await db.select().from(incidentEvents)).filter((e) => e.type === "incident.claimed" || e.type === "incident.assigned");
    expect(owners.length).toBeGreaterThanOrEqual(1);
  });
});

describe("incident detail", () => {
  it("returns every report and a readable, ordered timeline", async () => {
    const a = await report({ text: "Water supply is unavailable near Gate 3" });
    await report({ attendeeId: "at2", text: "Same problem at Gate 3" });
    await assignIncident(db, EVENT, a.incidentId, "mbarjun", "mbriya");
    await resolveIncident(db, EVENT, a.incidentId, "mbriya");
    const d = await incidentDetail(db, EVENT, a.incidentId);
    expect(d.reports.map((r) => r.text)).toEqual(["Water supply is unavailable near Gate 3", "Same problem at Gate 3"]);
    expect(d.reports.every((r) => r.reporterName === "Attendee" && r.zoneName === "Gate 3")).toBe(true);
    expect(d.activity.map((e) => e.type)).toEqual(["incident.created", "report.attached", "incident.assigned", "incident.resolved"]);
    const assigned = d.activity.find((e) => e.type === "incident.assigned")!;
    expect(assigned).toMatchObject({ actorName: "arjun", actorKind: "crew", detail: { assigneeName: "riya" } });
    expect(d.incident).toMatchObject({ status: "resolved", ownerName: "riya" });
    expect(d.incident.timeToFixSec).not.toBeNull();
  });

  it("does not leak incidents across events", async () => {
    const { incidentId } = await report();
    await expect(incidentDetail(db, "evother", incidentId)).rejects.toMatchObject({ code: "not_found" });
  });
});
