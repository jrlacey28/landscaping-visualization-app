import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Handle both development and production database connections
function getDatabaseUrl() {
  // In production, check /tmp/replitdb first, then fall back to DATABASE_URL
  if (process.env.NODE_ENV === 'production') {
    try {
      const fs = require('fs');
      if (fs.existsSync('/tmp/replitdb')) {
        const dbUrl = fs.readFileSync('/tmp/replitdb', 'utf-8').trim();
        if (dbUrl) return dbUrl;
      }
    } catch (error) {
      console.log('Could not read /tmp/replitdb, falling back to DATABASE_URL');
    }
  }
  
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  return process.env.DATABASE_URL;
}

export const pool = new Pool({ connectionString: getDatabaseUrl() });
export const db = drizzle({ client: pool, schema });