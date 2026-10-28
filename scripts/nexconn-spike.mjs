// Nexconn Server API spike — run with real credentials in .env.local:
//   node scripts/nexconn-spike.mjs
// Prints PASS/FAIL per step. It never prints the App Secret or full tokens.
// Client-side receipt (onMessageReceived / onMessageMetadataUpdated) is verified in the app: see docs/VALIDATION_RESULTS.md.
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const { NEXCONN_APP_KEY: appKey, NEXCONN_APP_SECRET: appSecret } = env;
const domain = { SG: "api.sg-light-api.com", NA: "api.us-light-api.com", SA: "api.sau-light-api.com" }[env.NEXCONN_DATA_CENTER || "SG"];
if (!appKey || !appSecret) {
  console.error("FAIL  NEXCONN_APP_KEY / NEXCONN_APP_SECRET missing in .env.local");
  process.exit(1);
}

async function call(path, body) {
  const nonce = randomBytes(8).toString("hex");
  const timestamp = String(Date.now());
  const res = await fetch(`https://${domain}${path}`, {
    method: "POST",
    headers: { "App-Key": appKey, Nonce: nonce, Timestamp: timestamp, Signature: createHash("sha1").update(appSecret + nonce + timestamp).digest("hex"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { http: res.status, ...json };
}

const run = randomBytes(3).toString("hex");
const bot = `botspike${run}`;
const a = `cspikea${run}`;
const b = `cspikeb${run}`;
const group = `gspike${run}`;
const results = [];
async function step(name, fn) {
  try {
    const out = await fn();
    results.push(["PASS", name]);
    console.log(`PASS  ${name}${out ? `  ${out}` : ""}`);
    return out;
  } catch (e) {
    results.push(["FAIL", name]);
    console.log(`FAIL  ${name}  ${e.message}`);
  }
}
const ok = (r) => {
  if (r.code !== 0) throw new Error(`http ${r.http}, code ${r.code}: ${r.msg ?? r.message ?? JSON.stringify(r)}`);
  return r;
};

await step("issue tokens (bot, A, B)", async () => {
  for (const u of [bot, a, b]) ok(await call("/v4/auth/access-token/issue", { userId: u, name: u }));
  return "tokens issued (not printed)";
});
await step("create group with bot owner", async () => ok(await call("/v4/group-channel/create", { channelId: group, name: `Spike ${run}`, owner: bot })) && group);
await step("join A and B", async () => ok(await call("/v4/group-channel/join", { channelId: group, userIds: [a, b] })) && "joined");
const msgId = await step("send BTN:Incident card with hasMetadata", async () => {
  const r = ok(
    await call("/v4/group-channel/message/send", {
      fromUserId: bot,
      toChannelIds: [group],
      messageType: "BTN:Incident",
      content: JSON.stringify({ incidentId: "spike", number: 1, title: "Spike card" }),
      hasMetadata: true,
      metadata: { st: "open", v: "1", n: "1" },
    }),
  );
  return r.result?.messageIds?.[0]?.messageId;
});
if (msgId) {
  await step("set metadata via /v4/channel-type/message/metadata/set", async () =>
    ok(await call("/v4/channel-type/message/metadata/set", { messageId: msgId, userId: bot, channelType: 3, channelId: group, metadata: { st: "claimed", v: "2", own: a, ownN: "A" }, isEchoToSender: 1 })) && "ok",
  );
  await step("read metadata back via /v4/channel-type/message/metadata/list", async () => JSON.stringify(ok(await call("/v4/channel-type/message/metadata/list", { messageId: msgId })).result ?? {}).slice(0, 200));
}
await step("targeted group message to A only", async () => ok(await call("/v4/group-channel/message/send", { fromUserId: bot, toChannelIds: [group], toUserIds: [a], messageType: "BTN:Nudge", content: JSON.stringify({ number: 1, title: "Spike nudge" }) })) && "sent");
await step("direct status message bot → B", async () => ok(await call("/v4/direct-channel/message/send", { fromUserId: bot, toUserIds: [b], messageType: "BTN:Status", content: JSON.stringify({ state: "claimed" }) })) && "sent");

console.log(`\n${results.filter((r) => r[0] === "PASS").length}/${results.length} server steps passed (run ${run}).`);
