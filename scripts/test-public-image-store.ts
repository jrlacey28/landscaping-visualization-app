import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  ensurePublicImagesSchema,
  getPublicImage,
  importLegacyPublicImages,
} from "../server/public-image-store";

const uploadsDirectory = path.resolve("public", "uploads");
const recoveredBathroomSample = "upload_1784170009536.jpg";
const recoveredSamplePath = path.join(uploadsDirectory, recoveredBathroomSample);

assert.ok(
  fs.existsSync(recoveredSamplePath),
  "the recovered Exterior Custom Solutions reference image must remain in public/uploads",
);

await ensurePublicImagesSchema();
await importLegacyPublicImages(uploadsDirectory);

const expectedBytes = fs.readFileSync(recoveredSamplePath);
const storedImage = await getPublicImage(recoveredBathroomSample);

assert.ok(storedImage, "the recovered reference image must be persisted");
assert.equal(storedImage.contentType, "image/jpeg");
assert.deepEqual(storedImage.imageData, expectedBytes);

console.log("Durable public image storage regression passed");
process.exit(0);
