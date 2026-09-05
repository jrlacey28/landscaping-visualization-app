import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool, type PoolConfig } from "pg";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@shared/schema";

export const serverBuild = "2026-05-30-db-pg-ssl";

export const databaseUrl = process.env.DATABASE_URL;
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
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 5_000),
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30_000),
  query_timeout: Number(process.env.DATABASE_QUERY_TIMEOUT_MS || 5_000),
  statement_timeout: Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS || 5_000),
};

if (dbUsesSsl) {
  poolConfig.ssl = { rejectUnauthorized: true, ...(process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n") } : {}) };
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

const enterpriseVisualizationRolloverSchemaSql = `
  ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS visualization_rollover_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS visualization_rollover_balance integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS visualization_rollover_cap integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS visualization_rollover_last_processed_at timestamp;

  UPDATE tenants
  SET
    visualization_rollover_enabled = COALESCE(visualization_rollover_enabled, false),
    visualization_rollover_balance = GREATEST(COALESCE(visualization_rollover_balance, 0), 0),
    visualization_rollover_cap = GREATEST(COALESCE(visualization_rollover_cap, 0), 0);

  ALTER TABLE tenants
    ALTER COLUMN visualization_rollover_enabled SET DEFAULT false,
    ALTER COLUMN visualization_rollover_enabled SET NOT NULL,
    ALTER COLUMN visualization_rollover_balance SET DEFAULT 0,
    ALTER COLUMN visualization_rollover_balance SET NOT NULL,
    ALTER COLUMN visualization_rollover_cap SET DEFAULT 0,
    ALTER COLUMN visualization_rollover_cap SET NOT NULL;
`;

export async function ensureEnterpriseVisualizationRolloverSchema() {
  if (pool) {
    await pool.query(enterpriseVisualizationRolloverSchemaSql);
    return;
  }

  await localClient!.exec(enterpriseVisualizationRolloverSchemaSql);
}

export async function ensureSecuritySchema() {
  const statement = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires timestamp;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_version integer NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version text;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding jsonb;
    CREATE TABLE IF NOT EXISTS security_rate_limits (
      key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL
    );
    CREATE INDEX IF NOT EXISTS security_rate_limits_expiry ON security_rate_limits (expires_at);
    CREATE TABLE IF NOT EXISTS security_leases (
      key text PRIMARY KEY, token text NOT NULL, expires_at timestamptz NOT NULL
    );
    CREATE TABLE IF NOT EXISTS processed_stripe_events (
      id text PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now()
    );
  `;
  if (pool) await pool.query(statement);
  else await localClient!.exec(statement);
}
