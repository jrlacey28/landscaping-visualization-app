import crypto from "crypto";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";

import { db } from "./db";

type QueryResult = {
  rows?: unknown[];
};

export type StoredPublicImage = {
  objectKey: string;
  contentType: string;
  imageData: Buffer;
  byteSize: number;
};

const safeObjectKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._() -]{0,199}$/;

function getRows(result: unknown) {
  if (Array.isArray(result)) {
    return result;
  }

  return ((result as QueryResult | undefined)?.rows || []) as unknown[];
}

function normalizeStoredBytes(value: unknown) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  if (typeof value === "string") {
    const hex = value.startsWith("\\x") ? value.slice(2) : value;
    return Buffer.from(hex, "hex");
  }

  throw new Error("Stored public image has an unsupported byte format.");
}

function normalizeObjectKey(objectKey: string) {
  const normalized = path.basename(String(objectKey || "").trim());
  if (!safeObjectKeyPattern.test(normalized)) {
    throw new Error("Invalid public image key.");
  }
  return normalized;
}

function extensionForContentType(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function contentTypeForFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function ensurePublicImagesSchema() {
  await db.execute(sql.raw("CREATE SCHEMA IF NOT EXISTS app_private"));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS app_private.public_images (
      id serial PRIMARY KEY,
      object_key text NOT NULL UNIQUE,
      content_type text NOT NULL,
      image_data bytea NOT NULL,
      byte_size integer NOT NULL,
      created_at timestamp DEFAULT now()
    );
  `));
}

export async function savePublicImage(
  imageData: Buffer,
  contentType = "image/jpeg",
  requestedObjectKey?: string,
) {
  const objectKey = requestedObjectKey
    ? normalizeObjectKey(requestedObjectKey)
    : `${Date.now()}_${crypto.randomBytes(12).toString("hex")}.${extensionForContentType(contentType)}`;

  await db.execute(sql`
    INSERT INTO app_private.public_images (object_key, content_type, image_data, byte_size)
    VALUES (${objectKey}, ${contentType}, ${imageData}, ${imageData.byteLength})
    ON CONFLICT (object_key) DO NOTHING
  `);

  return objectKey;
}

export async function getPublicImage(objectKey: string): Promise<StoredPublicImage | undefined> {
  const normalizedObjectKey = normalizeObjectKey(objectKey);
  const result = await db.execute(sql`
    SELECT object_key, content_type, image_data, byte_size
    FROM app_private.public_images
    WHERE object_key = ${normalizedObjectKey}
    LIMIT 1
  `);
  const row = getRows(result)[0] as
    | {
        object_key?: string;
        content_type?: string;
        image_data?: unknown;
        byte_size?: number;
      }
    | undefined;

  if (!row?.object_key || !row.content_type || row.image_data === undefined) {
    return undefined;
  }

  const imageData = normalizeStoredBytes(row.image_data);
  return {
    objectKey: row.object_key,
    contentType: row.content_type,
    imageData,
    byteSize: Number(row.byte_size || imageData.byteLength),
  };
}

async function publicImageExists(objectKey: string) {
  const normalizedObjectKey = normalizeObjectKey(objectKey);
  const result = await db.execute(sql`
    SELECT 1
    FROM app_private.public_images
    WHERE object_key = ${normalizedObjectKey}
    LIMIT 1
  `);
  return getRows(result).length > 0;
}

export async function importLegacyPublicImages(directory: string) {
  if (!fs.existsSync(directory)) {
    return 0;
  }

  const filenames = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:jpe?g|png|webp)$/i.test(entry.name))
    .map((entry) => entry.name);

  for (const filename of filenames) {
    if (await publicImageExists(filename)) {
      continue;
    }

    const imageData = fs.readFileSync(path.join(directory, filename));
    await savePublicImage(imageData, contentTypeForFilename(filename), filename);
  }

  return filenames.length;
}
