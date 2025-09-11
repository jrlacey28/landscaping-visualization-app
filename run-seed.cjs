
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require("ws");

neonConfig.webSocketConstructor = ws;

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

  // Fall back to DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return dbUrl;
}

async function seedSubscriptionPlans() {
  try {
    const pool = new Pool({ connectionString: getDatabaseUrl() });
    
    console.log('🌱 Seeding subscription plans...');
    
    // Define the subscription plans with correct pricing
    const plans = [
      {
        id: 'free',
        name: 'Free',
        description: 'Free plan with limited visualizations',
        price: 0, // $0
        interval: 'month',
        visualization_limit: 5,
        embed_access: false,
        active: true
      },
      {
        id: 'price_1S5X1sBY2SPm2HvOuDHNzsIp',
        name: 'Basic',
        description: 'Basic plan with more visualizations',
        price: 2000, // $20 in cents
        interval: 'month',
        visualization_limit: 100,
        embed_access: false,
        active: true
      },
      {
        id: 'price_1S5X2XBY2SPm2HvO2he9Unto',
        name: 'Pro',
        description: 'Pro plan with premium features',
        price: 10000, // $100 in cents
        interval: 'month',
        visualization_limit: 200,
        embed_access: true,
        active: true
      },
      {
        id: 'custom',
        name: 'Custom',
        description: 'Admin-managed custom plan',
        price: 0,
        interval: 'month',
        visualization_limit: 100,
        embed_access: false,
        active: true
      }
    ];

    // Use raw SQL to insert/update the plans with direct client query
    for (const plan of plans) {
      const query = `
        INSERT INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active, created_at)
        VALUES ('${plan.id}', '${plan.name}', '${plan.description}', ${plan.price}, '${plan.interval}', ${plan.visualization_limit}, ${plan.embed_access}, ${plan.active}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          interval = EXCLUDED.interval,
          visualization_limit = EXCLUDED.visualization_limit,
          embed_access = EXCLUDED.embed_access,
          active = EXCLUDED.active
      `;
      
      await pool.query(query);
    }

    console.log('✅ Subscription plans seeded successfully!');
    console.log('Plans created:');
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price/100}/month, ${plan.visualization_limit === -1 ? 'unlimited' : plan.visualization_limit} visualizations`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    process.exit(1);
  }
}

seedSubscriptionPlans();
