
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { subscriptionPlans } from './shared/schema.js';
import ws from "ws";

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

async function seedSubscriptionPlans() {
  try {
    const pool = new Pool({ connectionString: getDatabaseUrl() });
    const db = drizzle({ client: pool });
    
    // Define the subscription plans with correct pricing
    const plans = [
      {
        id: 'free',
        name: 'Free',
        description: 'Free plan with limited visualizations',
        price: 0, // $0
        interval: 'month',
        visualizationLimit: 5,
        embedAccess: false,
        active: true
      },
      {
        id: 'price_1S5X1sBY2SPm2HvOuDHNzsIp',
        name: 'Basic',
        description: 'Basic plan with more visualizations',
        price: 2000, // $20 in cents
        interval: 'month',
        visualizationLimit: 100, // 100 visualizations
        embedAccess: false,
        active: true
      },
      {
        id: 'price_1S5X2XBY2SPm2HvO2he9Unto',
        name: 'Pro',
        description: 'Pro plan with premium features',
        price: 10000, // $100 in cents
        interval: 'month',
        visualizationLimit: 200, // 200 visualizations
        embedAccess: true,
        active: true
      },
      {
        id: 'custom',
        name: 'Custom',
        description: 'Admin-managed custom plan',
        price: 0,
        interval: 'month',
        visualizationLimit: 100,
        embedAccess: false,
        active: true
      }
    ];

    // Insert or update each plan
    for (const plan of plans) {
      await db.insert(subscriptionPlans)
        .values(plan)
        .onConflictDoUpdate({
          target: subscriptionPlans.id,
          set: {
            name: plan.name,
            description: plan.description,
            price: plan.price,
            interval: plan.interval,
            visualizationLimit: plan.visualizationLimit,
            embedAccess: plan.embedAccess,
            active: plan.active
          }
        });
    }

    console.log('✅ Subscription plans seeded successfully!');
    console.log('Plans created:');
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price/100}/month, ${plan.visualizationLimit === -1 ? 'unlimited' : plan.visualizationLimit} visualizations`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    process.exit(1);
  }
}

seedSubscriptionPlans();
