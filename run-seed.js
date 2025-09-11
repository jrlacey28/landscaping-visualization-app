
import fs from 'fs';
import path from 'path';
import { db } from './server/db.ts';

async function seedSubscriptionPlans() {
  try {
    const sqlContent = fs.readFileSync('seed-subscription-plans.sql', 'utf8');
    
    // Extract the INSERT statement from the SQL file
    const insertStatement = `
      INSERT OR REPLACE INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active) VALUES
      ('free', 'Free', 'Free plan with limited visualizations', 0, 'month', 5, 0, 1),
      ('price_1S5X1sBY2SPm2HvOuDHNzsIp', 'Basic', 'Basic plan with more visualizations', 2500, 'month', 50, 0, 1),
      ('price_1S5X2XBY2SPm2HvO2he9Unto', 'Pro', 'Pro plan with unlimited visualizations', 10000, 'month', -1, 1, 1),
      ('enterprise', 'Enterprise', 'Enterprise plan with custom features', 25000, 'month', -1, 1, 1),
      ('custom', 'Custom', 'Admin-managed custom plan', 0, 'month', 100, 0, 1)
    `;
    
    await db.exec(insertStatement);
    console.log('✅ Subscription plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
  }
}

seedSubscriptionPlans();
