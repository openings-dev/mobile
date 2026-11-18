import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const geometry = await readFile(
  new URL("../src/components/brand-wordmark/geometry.ts", import.meta.url),
  "utf8",
);
function constant(name) {
  const match = geometry.match(
    new RegExp(`export const ${name} =\\s*("[^"\\n]*")`),
  );
  if (!match) throw new Error(`Missing canonical brand geometry: ${name}`);
  return JSON.parse(match[1]);
}
// Use the exact canonical symbol contours, clipped out of the full wordmark.
// The 768px viewport gives the mark comparable visual weight to Troco.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<rect width="1024" height="1024" fill="#213130"/>
<svg x="128" y="128" width="768" height="768" viewBox="${constant("BRAND_FAVICON_VIEW_BOX")}">
<g transform="${constant("BRAND_ARTWORK_TRANSFORM")}"><path fill="#FFFFFF" fill-rule="evenodd" d="${constant("BRAND_ARTWORK_PATH")}"/></g>
</svg></svg>`;
const svgPath = new URL("../assets/images/ios-icon.svg", import.meta.url);
await writeFile(svgPath, svg);
const source = await sharp(Buffer.from(svg)).removeAlpha().png().toBuffer();
await writeFile(
  new URL("../assets/images/ios-icon.png", import.meta.url),
  source,
);
