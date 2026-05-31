import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const confirm = process.argv.includes("--confirm");
const dryRun = process.argv.includes("--dry-run");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  if (dryRun) {
    console.log("DATABASE_URL is not set. Dry run only; no SQL would be executed.");
    process.exit(0);
  }

  console.error("DATABASE_URL is not set. This script must run against the production Postgres database.");
  process.exit(1);
}

if (process.env.USE_LOCAL_DB === "true") {
  console.error("USE_LOCAL_DB=true is set. Refusing to run a production repair against a local database.");
  process.exit(1);
}

let databaseHost = "unknown";
try {
  databaseHost = new URL(databaseUrl).host;
} catch {
  // Keep host redacted if URL parsing fails.
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sqlPath = path.join(repoRoot, "production_generation_dashboard_fix.sql");
const sql = await fs.readFile(sqlPath, "utf8");

console.log(`Target database host: ${databaseHost}`);
console.log(`SQL file: ${sqlPath}`);

if (dryRun) {
  console.log("Dry run only. No SQL was executed.");
  process.exit(0);
}

if (!confirm) {
  console.error("Refusing to run without --confirm.");
  console.error("Run: npm run db:repair:generation-dashboard -- --confirm");
  process.exit(1);
}

const useSsl =
  process.env.DATABASE_SSL !== "false" &&
  (process.env.DATABASE_SSL === "true" ||
    process.env.NODE_ENV === "production" ||
    /sslmode=require|neon\.tech|supabase\.co/i.test(databaseUrl));

const client = new Client({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 10_000),
  query_timeout: Number(process.env.DATABASE_QUERY_TIMEOUT_MS || 30_000),
  statement_timeout: Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS || 30_000),
});

try {
  await client.connect();
  await client.query(sql);

  const verification = await client.query(`
    SELECT
      to_regclass('public.generation_projects') AS generation_projects_table,
      to_regclass('public.project_generations') AS project_generations_table;
  `);

  console.log("Repair completed.");
  console.table(verification.rows);
} catch (error) {
  console.error("Repair failed:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
