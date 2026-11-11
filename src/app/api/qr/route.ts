import QRCode from "qrcode";
import type { NextRequest } from "next/server";
import { env } from "@/server/env";

/** SVG QR code for one of our own relative links (not a general-purpose QR service). */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 300) return new Response("Bad path", { status: 400 });
  // A blank PUBLIC_BASE_URL in .env counts as unset (env() normalises it), so QR codes fall back to this host.
  const base = env().PUBLIC_BASE_URL ?? req.nextUrl.origin;
  const svg = await QRCode.toString(new URL(path, base).toString(), { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
