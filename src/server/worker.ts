import { db } from "./db/client";
import { escalationTargets, takeDueEscalations } from "./domain/incidents";
import { applyEffects, MSG_NUDGE, reconcile } from "./domain/projection";
import { nexconnApi } from "./services";
import { events } from "./db/schema";
import { eq } from "drizzle-orm";

const g = globalThis as unknown as { batonWorker?: boolean };

async function runEscalations() {
  const api = nexconnApi();
  if (!api) return;
  const due = await takeDueEscalations(db());
  for (const { incident, level } of due) {
    const targets = await escalationTargets(db(), incident, level);
    const [ev] = await db().select().from(events).where(eq(events.id, incident.eventId));
    if (!ev || targets.length === 0) continue;
    try {
      // Targeted group message: only the named lead(s) receive it (docs: targeted messages carry no metadata).
      await api.sendGroupMessage({
        fromUserId: ev.botUserId,
        groupId: ev.nexconnGroupId,
        toUserIds: targets.map((t) => t.nexconnUserId).slice(0, 10),
        messageType: MSG_NUDGE,
        content: { incidentId: incident.id, number: incident.number, title: incident.title, level, names: targets.map((t) => t.name), reportCount: incident.reportCount },
        pushContent: `#${incident.number} unclaimed — ${incident.title}`,
      });
    } catch (err) {
      console.warn("Escalation nudge failed", incident.id, (err as Error).message);
    }
    await applyEffects(db(), api, [{ type: "card.update", incidentId: incident.id }]);
  }
}

/** Starts background loops once per server process (escalations every 10 s, reconciliation every 60 s). */
export function startWorker() {
  if (g.batonWorker || process.env.BATON_DISABLE_WORKER === "1") return;
  g.batonWorker = true;
  const safe = (name: string, fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
    } catch (err) {
      console.error(`[worker] ${name} failed`, err);
    }
  };
  setInterval(safe("escalations", runEscalations), 10_000).unref();
  setInterval(safe("reconcile", () => reconcile(db(), nexconnApi())), 60_000).unref();
  console.log("[worker] escalation + reconciliation loops started");
}
