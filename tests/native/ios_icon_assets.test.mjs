import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import imageUtils from "@expo/image-utils";
const { getPngInfo } = imageUtils;
const root = fileURLToPath(new URL("../../", import.meta.url));
const project = "Openings";
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"))).expo;
const catalogPath = path.join(
  root,
  "ios",
  project,
  "Images.xcassets/AppIcon.appiconset",
);

test("iOS has explicit default and dark artwork instead of automatic recoloring", async () => {
  assert.equal(typeof app.ios.icon, "object");
  assert.ok(app.ios.icon.light);
  assert.ok(app.ios.icon.dark);
  const catalog = JSON.parse(
    fs.readFileSync(path.join(catalogPath, "Contents.json")),
  );
  const base = catalog.images.find((item) => !item.appearances);
  const dark = catalog.images.find((item) =>
    item.appearances?.some((a) => a.value === "dark"),
  );
  assert.ok(base);
  assert.ok(dark);
  for (const item of [base, dark]) {
    const png = await getPngInfo(path.join(catalogPath, item.filename));
    assert.equal(png.width, 1024);
    assert.equal(png.height, 1024);
    const channels = png.data.length / (png.width * png.height);
    const pixel = (x, y) =>
      Array.from(
        png.data.subarray(
          (y * png.width + x) * channels,
          (y * png.width + x) * channels + 3,
        ),
      );
    if (channels === 4) {
      for (let i = 3; i < png.data.length; i += 4)
        assert.equal(png.data[i], 255);
    }
    assert.deepEqual(pixel(0, 0), [33, 49, 48]);
    let white = 0,
      minX = 1024,
      maxX = -1;
    for (let y = 0; y < 1024; y++)
      for (let x = 0; x < 1024; x++) {
        if (pixel(x, y).every((c) => c === 255)) {
          white++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }
      }
    assert.ok(white > 180000, "The symbol must be solid white");
    assert.ok(
      maxX - minX >= 620 && maxX - minX <= 740,
      "The symbol needs consistent visual weight",
    );
  }
});
