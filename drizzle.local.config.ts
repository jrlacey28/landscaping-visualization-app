import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: {
    url: process.env.LOCAL_DATABASE_PATH || ".local/pglite",
  },
});
