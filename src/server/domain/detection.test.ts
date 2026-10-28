import { describe, expect, it } from "vitest";
import { detectRequest, matchZone, type ZoneRef } from "./detection";

const zones: ZoneRef[] = [
  { id: "z1", name: "Gate 3", slug: "gate-3" },
  { id: "z2", name: "Hall B", slug: "hall-b" },
  { id: "z3", name: "Registration", slug: "registration" },
  { id: "z4", name: "Hall", slug: "hall" },
];

describe("detectRequest", () => {
  it.each([
    ["need 2 more chairs at Hall B", "supplies", "z2", "normal"],
    ["we're out of water at gate 3", "supplies", "z1", "normal"],
    ["projector not working in hall b", "tech", "z2", "normal"],
    ["mic is dead, can someone bring batteries", "tech", null, "normal"],
    ["someone spilled coffee near registration, need a mop", "cleanliness", "z3", "normal"],
    ["toilets overflowing at Gate 3!!", "cleanliness", "z1", "urgent"],
    ["found a wallet at registration", "lost_found", "z3", "normal"],
    ["guy fainted near gate 3", "medical", "z1", "urgent"],
    ["smoke coming from the kitchen", "safety", null, "urgent"],
    ["queue at registration is huge, need an usher", "directions", "z3", "normal"],
    ["need water asap", "supplies", null, "urgent"],
  ])("detects %j", (text, category, zoneId, priority) => {
    expect(detectRequest(text, zones)).toMatchObject({ category, zoneId, priority });
  });

  it.each(["ok", "on it", "Done!", "thanks 🙏", "fixed the projector", "I'm on it, bringing chairs", "on my way to hall b", "lunch was great", "where is lunch?", "Hall B looks good", "see you at 5"])(
    "ignores chatter %j",
    (text) => {
      expect(detectRequest(text, zones)).toBeNull();
    },
  );

  it("needs an intent word or a place for non-sensitive categories", () => {
    expect(detectRequest("the water here is nice", zones)).toBeNull();
    expect(detectRequest("water at Hall B", zones)).toMatchObject({ category: "supplies", zoneId: "z2" });
  });

  it("explains itself", () => {
    expect(detectRequest("need 2 more chairs at Hall B", zones)?.reasons).toEqual(["chairs", "Hall B", "“need”"]);
  });

  it("rejects empty and oversized text", () => {
    expect(detectRequest("  ", zones)).toBeNull();
    expect(detectRequest(`need water ${"x".repeat(600)}`, zones)).toBeNull();
  });
});

describe("matchZone", () => {
  it("prefers the longest zone name and matches slugs", () => {
    expect(matchZone("hall b needs chairs", zones)?.id).toBe("z2");
    expect(matchZone("main hall is full", zones)?.id).toBe("z4");
    expect(matchZone("GATE-3 is blocked", zones)?.id).toBe("z1");
    expect(matchZone("nowhere in particular", zones)).toBeNull();
  });
});
