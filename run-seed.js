
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Handle both development and production database connections
function getDatabaseUrl() {
  // In production, check /tmp/replitdb first, then fall back to DATABASE_URL
  if (process.env.NODE_ENV === 'production') {
    try {
      const fs = await import('fs');
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

async function seedSubscriptionPlans() {
  try {
    const pool = new Pool({ connectionString: getDatabaseUrl() });
    const db = drizzle({ client: pool });
    
    // Insert subscription plans directly
    const insertStatement = `
      INSERT OR REPLACE INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active) VALUES
      ('free', 'Free', 'Free plan with limited visualizations', 0, 'month', 5, 0, 1),
      ('price_1S5X1sBY2SPm2HvOuDHNzsIp', 'Basic', 'Basic plan with more visualizations', 2500, 'month', 50, 0, 1),
      ('price_1S5X2XBY2SPm2HvO2he9Unto', 'Pro', 'Pro plan with unlimited visualizations', 10000, 'month', -1, 1, 1),
      ('enterprise', 'Enterprise', 'Enterprise plan with custom features', 25000, 'month', -1, 1, 1),
      ('custom', 'Custom', 'Admin-managed custom plan', 0, 'month', 100, 0, 1)
    `;
    
    await db.execute(insertStatement);
    console.log('✅ Subscription plans seeded successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
  }
}

seedSubscriptionPlans();
