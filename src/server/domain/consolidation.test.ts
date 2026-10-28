import { describe, expect, it } from "vitest";
import { decide, keywords, type Candidate, type NewReport } from "./consolidation";

const t0 = new Date("2026-11-14T10:00:00Z");
const minutes = (m: number) => new Date(t0.getTime() + m * 60_000);

const water: Candidate = { incidentId: "in1", zoneId: "gate3", category: "supplies", texts: ["Water station near Gate 3 is empty"], createdAt: t0, status: "open" };
const report = (over: Partial<NewReport> = {}): NewReport => ({ zoneId: "gate3", category: "supplies", text: "No drinking water at Gate 3", structured: true, at: minutes(2), ...over });

describe("keywords", () => {
  it("normalises synonyms and drops stop words", () => {
    expect([...keywords("No drinking water at the dispenser!")].sort()).toEqual(["water"]);
    expect(keywords("Washroom is dirty").has("restroom")).toBe(true);
  });
});

describe("decide", () => {
  it("auto-attaches same zone + same category structured reports", () => {
    expect(decide(report(), [water])).toMatchObject({ kind: "attach", incidentId: "in1" });
  });

  it("auto-attaches even with empty text when zone and category come from the poster and chip", () => {
    expect(decide(report({ text: "" }), [water]).kind).toBe("attach");
  });

  it("never merges across different known zones", () => {
    expect(decide(report({ zoneId: "hallB" }), [water])).toEqual({ kind: "new" });
  });

  it("never merges across categories", () => {
    expect(decide(report({ category: "cleanliness" }), [water])).toEqual({ kind: "new" });
  });

  it("only suggests (never auto-merges) sensitive categories", () => {
    const medical: Candidate = { ...water, category: "medical", texts: ["someone fainted near gate 3"] };
    expect(decide(report({ category: "medical", text: "person fainted at gate 3" }), [medical]).kind).toBe("suggest");
  });

  it("suggests when the report has no zone but matching text", () => {
    const d = decide(report({ zoneId: null, structured: false, text: "water dispenser empty near entrance" }), [water]);
    expect(d.kind).toBe("suggest");
  });

  it("does not auto-attach to incidents older than 20 minutes, only suggests", () => {
    expect(decide(report({ at: minutes(25) }), [water]).kind).toBe("suggest");
  });

  it("ignores incidents outside the 30-minute window and resolved incidents", () => {
    expect(decide(report({ at: minutes(31) }), [water])).toEqual({ kind: "new" });
    expect(decide(report(), [{ ...water, status: "resolved" }])).toEqual({ kind: "new" });
  });

  it("starts a new incident when nothing matches", () => {
    expect(decide(report(), [])).toEqual({ kind: "new" });
  });

  it("picks the best of several candidates", () => {
    const other: Candidate = { ...water, incidentId: "in2", zoneId: null, texts: ["line at registration"] };
    expect(decide(report(), [other, water])).toMatchObject({ kind: "attach", incidentId: "in1" });
  });
});
