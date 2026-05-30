import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool, type PoolConfig } from "pg";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@shared/schema";

export const serverBuild = "2026-05-30-db-pg-ssl";

function getReplitDatabaseUrl() {
  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }

  try {
    if (fs.existsSync("/tmp/replitdb")) {
      const dbUrl = fs.readFileSync("/tmp/replitdb", "utf-8").trim();
      if (dbUrl) return dbUrl;
    }
  } catch {
    console.log("Could not read /tmp/replitdb, falling back to DATABASE_URL");
  }

  return undefined;
}

export const databaseUrl = getReplitDatabaseUrl() || process.env.DATABASE_URL;
const useLocalDatabase =
  process.env.USE_LOCAL_DB === "true" ||
  (!databaseUrl && process.env.NODE_ENV !== "production");

if (!useLocalDatabase && !databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set in production. For local development, set USE_LOCAL_DB=true.",
  );
}

export const dbDriver = useLocalDatabase ? "pglite" : "node-postgres";
export const dbUsesSsl =
  !useLocalDatabase &&
  process.env.DATABASE_SSL !== "false" &&
  (process.env.DATABASE_SSL === "true" ||
    process.env.NODE_ENV === "production" ||
    /sslmode=require|neon\.tech|supabase\.co/i.test(databaseUrl || ""));

const poolConfig: PoolConfig = {
  connectionString: databaseUrl,
};

if (dbUsesSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = useLocalDatabase
  ? undefined
  : new Pool(poolConfig);

export function getDatabaseHost() {
  if (!databaseUrl) return "local";

  try {
    return new URL(databaseUrl).host;
  } catch {
    return "unknown";
  }
}

const localDatabasePath = process.env.LOCAL_DATABASE_PATH || ".local/pglite";
if (useLocalDatabase) {
  fs.mkdirSync(path.dirname(localDatabasePath), { recursive: true });
}

const localClient = useLocalDatabase ? new PGlite(localDatabasePath) : undefined;

export const db = useLocalDatabase
  ? drizzlePglite(localClient!, { schema })
  : drizzleNodePostgres(pool!, { schema });
