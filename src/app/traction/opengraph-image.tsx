import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The share card deliberately carries no numbers, so a cached preview can never show a stale or misleading figure.
export const alt = "Baton Impact: real-time coordination, measurable outcomes. Baton's public impact report.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [serif, inter] = await Promise.all([readFile(join(process.cwd(), "assets/og/instrument-serif.ttf")), readFile(join(process.cwd(), "assets/og/inter-500.ttf"))]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fbf8f6", padding: "72px 80px", fontFamily: "Inter" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, color: "#0a0a0a" }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: "#c8664f" }} />
          Baton
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 3, color: "#b4533f", textTransform: "uppercase" }}>Public impact report</div>
          <div style={{ fontFamily: "Instrument Serif", fontSize: 150, lineHeight: 1, color: "#0a0a0a", marginTop: 18 }}>Baton Impact</div>
          <div style={{ fontSize: 38, color: "#57534e", marginTop: 22 }}>Real-time coordination. Measurable outcomes.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #ece3de", paddingTop: 26, fontSize: 24, color: "#8f8780" }}>
          <span>Verified usage · Nexconn messaging · Outcomes</span>
          <span>Nexconn Build Challenge 2026</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Instrument Serif", data: serif, weight: 400 }, { name: "Inter", data: inter, weight: 500 }] },
  );
}
