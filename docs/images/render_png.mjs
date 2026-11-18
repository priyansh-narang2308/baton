// Renders README diagrams from SVG to PNG at 2x. Usage: node docs/images/render_png.mjs name [name...]
// Needs Playwright (any install) and a local Chrome.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = process.env.DIAGRAM_DIR ?? dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ channel: "chrome" });
for (const name of process.argv.slice(2)) {
  const svg = readFileSync(join(here, `${name}.svg`), "utf8");
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
  await page.setContent(`<html><head><style>html,body{margin:0}</style></head><body>${svg}</body></html>`);
  await page.screenshot({ path: join(here, `${name}.png`), clip: { x: 0, y: 0, width: +w, height: +h } });
  await page.close();
  console.log("rendered", name);
}
await browser.close();
