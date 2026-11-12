#!/usr/bin/env node
// End-to-end check of Baton's core loop with genuinely separate identities. Each actor has its own cookie jar,
// so the server sees five different sessions:
//   organizer, volunteers Asha and Bilal, attendees One and Two.
// Usage:  node scripts/e2e-scenario.mjs [baseUrl]   (default http://localhost:3000)
//
// It creates an event named "[E2E test] …". Leave that event out of any traction numbers. The script never connects
// to Nexconn as a client, so it adds no active Nexconn users; the server still projects cards to the event's group.
// Not covered here, and checked by hand in two browsers: live delivery over the Nexconn SDK, direct messages, and calls.

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
let step = 0;

class Actor {
  constructor(name) {
    this.name = name;
    this.cookies = new Map();
  }
  async req(method, path, body) {
    const res = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json", cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const type = res.headers.get("content-type") ?? "";
    const data = type.includes("json") ? await res.json() : await res.text();
    return { status: res.status, data };
  }
}

function check(cond, label, extra) {
  step++;
  if (!cond) {
    console.error(`✗ ${step}. ${label}`, extra === undefined ? "" : JSON.stringify(extra).slice(0, 400));
    process.exit(1);
  }
  console.log(`✓ ${step}. ${label}`);
}

const organizer = new Actor("Organizer");
const asha = new Actor("Asha");
const bilal = new Actor("Bilal");
const att1 = new Actor("Attendee One");
const att2 = new Actor("Attendee Two");

const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
const created = await organizer.req("POST", "/api/events", { name: `[E2E test] ${stamp}`, organizerName: "Organizer", zones: ["Gate 3", "Food court"] });
check(created.status === 201, "Organizer creates an event", created.data);
const { eventId, slug } = created.data;

const page = await organizer.req("GET", `/o/${eventId}`);
const code = String(page.data).match(/\/join\/([A-Za-z0-9_-]{4,32})/)?.[1] ?? String(page.data).match(/crewCode\\?":\\?"([A-Za-z0-9_-]{4,32})/)?.[1];
check(page.status === 200 && code, "Organizer's command centre exposes the crew invite code");

for (const v of [asha, bilal]) {
  const j = await v.req("POST", "/api/join", { code, name: v.name, zoneId: null });
  check(j.status === 201 && j.data.eventId === eventId, `${v.name} joins the crew in their own session`, j.data);
}

const state = (who) => who.req("GET", `/api/events/${eventId}/state`).then((r) => r.data);
const s0 = await state(asha);
const ids = Object.fromEntries(s0.crew.map((m) => [m.name, m.id]));
check(ids.Asha && ids.Bilal && s0.me?.name === "Asha", "Server tells Asha and Bilal apart");

const r1 = await att1.req("POST", `/api/e/${slug}/reports`, { category: "supplies", zone: "gate-3", text: "Water station is empty" });
check(r1.status === 201 && r1.data.incidentId, "Attendee One reports an empty water station", r1.data);
const incidentId = r1.data.incidentId;

const r2 = await att2.req("POST", `/api/e/${slug}/reports`, { category: "supplies", zone: "gate-3", text: "no water at gate 3" });
check(r2.status === 201 && r2.data.incidentId === incidentId && r2.data.reportCount === 2, "Attendee Two's duplicate joins the same incident (2 reports)", r2.data);

const claim = await asha.req("POST", `/api/events/${eventId}/incidents/${incidentId}/claim`);
check(claim.status < 300, "Asha claims it", claim.data);

const inc = (s) => s.incidents.find((i) => i.id === incidentId);
check(inc(await state(bilal)).ownerName === "Asha", "Bilal sees Asha as the owner");
check(inc(await state(organizer)).ownerName === "Asha", "Organizer sees Asha as the owner");

const pass = await asha.req("POST", `/api/events/${eventId}/incidents/${incidentId}/pass`, { memberId: ids.Bilal, note: "Refill crates are behind the stage" });
check(pass.status < 300, "Asha passes the baton to Bilal with a note", pass.data);
const pending = inc(await state(bilal));
check(pending.ownerName === "Asha" && pending.passToName === "Bilal", "While the pass is pending, Asha still owns it (never ownerless)", pending);

const accept = await bilal.req("POST", `/api/events/${eventId}/incidents/${incidentId}/accept-pass`);
check(accept.status < 300, "Bilal takes the baton", accept.data);
const after = inc(await state(organizer));
check(after.ownerName === "Bilal" && !after.passToMemberId, "Organizer sees Bilal as the new owner", after);

const detail = (await organizer.req("GET", `/api/events/${eventId}/incidents/${incidentId}`)).data;
const types = detail.activity.map((a) => a.type);
check(types.includes("pass.offered") && types.includes("pass.accepted"), "Timeline records the offer and the handover", types);

// Race: two volunteers claim a fresh incident at the same instant; exactly one wins.
const r3 = await att1.req("POST", `/api/e/${slug}/reports`, { category: "tech", zone: "food-court", text: "Projector off" });
const both = await Promise.all([asha, bilal].map((v) => v.req("POST", `/api/events/${eventId}/incidents/${r3.data.incidentId}/claim`)));
const wins = both.filter((r) => r.status < 300).length;
check(wins === 1 && both.some((r) => r.status === 409), "Simultaneous claims: exactly one owner, the other is told who got it", both.map((r) => r.status));

const fix = await bilal.req("POST", `/api/events/${eventId}/incidents/${incidentId}/resolve`);
check(fix.status < 300, "Bilal marks the water station fixed", fix.data);

for (const a of [att1, att2]) {
  const mine = (await a.req("GET", `/api/e/${slug}/reports`)).data.reports.find((r) => r.incidentId === incidentId);
  check(mine && mine.status === "resolved", `${a.name} sees their report as fixed`, mine);
}

const final = (await organizer.req("GET", `/api/events/${eventId}/incidents/${incidentId}`)).data;
check(final.reports.length === 2 && final.activity.some((a) => a.type === "incident.resolved" || a.type.includes("resolve")), "Full history stays available: 2 reports and the resolution", final.activity.map((a) => a.type));

const outsider = new Actor("Outsider");
const denied = await outsider.req("GET", `/api/events/${eventId}/state`);
check(denied.status === 403, "Someone without a session cannot read the event", denied.status);

console.log(`\nAll ${step} checks passed against ${base} (event ${eventId}).`);
