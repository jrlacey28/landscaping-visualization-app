import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@shared/schema";

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

export const pool = useLocalDatabase
  ? undefined
  : new Pool({ connectionString: databaseUrl });

const localDatabasePath = process.env.LOCAL_DATABASE_PATH || ".local/pglite";
if (useLocalDatabase) {
  fs.mkdirSync(path.dirname(localDatabasePath), { recursive: true });
}

const localClient = useLocalDatabase ? new PGlite(localDatabasePath) : undefined;

export const db = useLocalDatabase
  ? drizzlePglite(localClient!, { schema })
  : drizzleNodePostgres(pool!, { schema });
