import QRCode from "qrcode";
import type { NextRequest } from "next/server";

/** SVG QR code for one of our own relative links (not a general-purpose QR service). */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 300) return new Response("Bad path", { status: 400 });
  const base = process.env.PUBLIC_BASE_URL ?? req.nextUrl.origin;
  const svg = await QRCode.toString(new URL(path, base).toString(), { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
