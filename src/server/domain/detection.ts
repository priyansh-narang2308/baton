import type { Category } from "../db/schema";

/**
 * Deterministic request detection for plain crew chat ("need 2 more chairs at Hall B").
 * No AI on this path: it is fast, explainable and testable. A detected request is always shown as
 * "detected" and can be dismissed in one tap, so the rules favour recall over precision for operational
 * words and are strict about chatter ("ok", "on it", "thanks").
 */

export type ZoneRef = { id: string; name: string; slug: string };

export type Detection = {
  category: Category;
  zoneId: string | null;
  priority: "normal" | "urgent";
  /** Human-readable reasons, shown on the card ("water · Hall B · 'need'"). */
  reasons: string[];
};

// Order matters: the first category with a hit wins, so sensitive categories come first.
const CATEGORY_TERMS: [Category, string[]][] = [
  ["medical", ["medic", "medical", "first aid", "firstaid", "ambulance", "injured", "injury", "bleeding", "blood", "fainted", "faint", "fainting", "collapsed", "unconscious", "dizzy", "seizure", "allergic", "allergy", "asthma", "hurt", "chest pain", "can't breathe", "cant breathe"]],
  ["safety", ["fire", "smoke", "fight", "fighting", "security", "suspicious", "unsafe", "crush", "stampede", "weapon", "threat", "harass", "harassment", "evacuate", "gas leak"]],
  ["lost_found", ["lost", "found", "missing", "wallet", "keys", "id card", "badge left", "left behind", "lost child", "separated"]],
  ["tech", ["mic", "mike", "microphone", "projector", "screen", "speaker", "speakers", "audio", "sound", "hdmi", "wifi", "wi-fi", "internet", "laptop", "clicker", "power", "socket", "extension", "charger", "lights", "printer", "av"]],
  ["cleanliness", ["spill", "spilled", "spilt", "mess", "messy", "dirty", "cleaning", "clean up", "cleanup", "trash", "bin", "bins", "dustbin", "garbage", "litter", "vomit", "puke", "restroom", "toilet", "toilets", "washroom", "bathroom", "mop", "wet floor", "overflowing"]],
  ["supplies", ["water", "bottles", "cups", "chairs", "chair", "tables", "table", "food", "snacks", "lunch", "coffee", "tea", "tape", "batteries", "battery", "pens", "paper", "lanyards", "badges", "wristbands", "tissues", "napkins", "ice", "plates", "kits", "stock", "refill", "supplies"]],
  ["directions", ["directions", "signage", "sign", "signs", "queue", "line", "crowd", "crowded", "where is", "where's", "which way", "way to", "usher", "guide"]],
];

// Words that make an operational mention into a request ("we're out of water", "projector not working").
const INTENT_TERMS = [
  "need", "needs", "needed", "send", "bring", "get", "grab", "fetch", "can someone", "can anyone", "could someone", "anyone", "someone", "help", "pls", "please", "asap",
  "out of", "ran out", "run out", "running out", "running low", "low on", "empty", "finished", "over at",
  "broken", "not working", "isn't working", "isnt working", "doesn't work", "doesnt work", "down", "dead", "no sound", "stopped", "failed", "flickering",
  "spill", "spilled", "overflowing", "leaking", "leak", "blocked", "jammed", "stuck", "long", "huge", "urgent", "emergency", "now",
];

const URGENT_TERMS = ["urgent", "asap", "emergency", "now", "immediately", "quick", "quickly", "911", "112"];

// Messages that are coordination chatter, never requests on their own.
const CHATTER = /^(ok(ay)?|k|kk|sure|yes|yep|yeah|no|nope|done|fixed|sorted|handled|thanks|thank you|thx|ty|on it|omw|on my way|got it|roger|copy|cool|nice|great|noted|coming|👍|🙏|✅)[\s.!]*$/i;
const ACK_PREFIX = /^(done|fixed|sorted|handled|resolved|all good|on it|omw|on my way|got it|i('| a)m on it|i'll (take|handle|do)|i will (take|handle|do))\b/i;

function normalize(text: string) {
  return ` ${text.toLowerCase().normalize("NFKC").replace(/[’`]/g, "'").replace(/[^\p{L}\p{N}'-]+/gu, " ").replace(/\s+/g, " ").trim()} `;
}

function hasTerm(norm: string, term: string) {
  return norm.includes(` ${term} `);
}

function firstHit(norm: string, terms: string[]) {
  return terms.find((t) => hasTerm(norm, t)) ?? null;
}

/** Finds a zone named in the text ("hall b", "gate 3", "registration"), preferring the longest name. */
export function matchZone(text: string, zones: ZoneRef[]): ZoneRef | null {
  const norm = normalize(text).replace(/-/g, " ");
  const hits = zones.filter((z) => {
    const name = normalize(z.name).trim();
    const slug = z.slug.replace(/-/g, " ");
    return (name.length >= 2 && hasTerm(norm, name)) || (slug.length >= 3 && hasTerm(norm, slug));
  });
  hits.sort((a, b) => b.name.length - a.name.length);
  return hits[0] ?? null;
}

export function detectRequest(text: string, zones: ZoneRef[]): Detection | null {
  const raw = text.trim();
  if (raw.length < 4 || raw.length > 500) return null;
  if (CHATTER.test(raw) || ACK_PREFIX.test(raw)) return null;
  const norm = normalize(raw);

  let category: Category | null = null;
  let term: string | null = null;
  for (const [cat, terms] of CATEGORY_TERMS) {
    term = firstHit(norm, terms);
    if (term) {
      category = cat;
      break;
    }
  }
  if (!category || !term) return null;

  const zone = matchZone(raw, zones);
  const intent = firstHit(norm, INTENT_TERMS);
  const sensitive = category === "medical" || category === "safety";
  // A sensitive word is enough on its own; anything else needs an intent word or a named place.
  if (!sensitive && !intent && !zone) return null;
  // "where is lunch?" / "line is long" alone are questions or observations, not tasks, unless placed or asked for.
  if (category === "directions" && !zone && !intent) return null;

  const urgent = sensitive || Boolean(firstHit(norm, URGENT_TERMS)) || /!{2,}/.test(raw);
  const reasons = [term, zone?.name, intent ? `“${intent}”` : null].filter((r): r is string => Boolean(r));
  return { category, zoneId: zone?.id ?? null, priority: urgent ? "urgent" : "normal", reasons };
}
