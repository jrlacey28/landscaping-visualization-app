import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Database initialization script to ensure critical data exists
 * Safe to run multiple times (idempotent)
 */
export async function initializeDatabase() {
  console.log("🔧 Initializing database...");

  // Check if we're in test mode based on Stripe key
  const stripeSecretKey = process.env.STRIPE_TEST_API_KEY || process.env.STRIPE_SECRET_KEY;
  const isTestMode = stripeSecretKey?.startsWith('sk_test_');

  console.log(`🎯 Running in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);

  // Define ALL subscription plans (both test and production)
  const plans = [
    // Free plan (always the same)
    {
      id: 'free',
      name: 'Free',
      description: 'Free plan with limited visualizations',
      price: 0,
      interval: 'month' as const,
      visualizationLimit: 5,
      embedAccess: false,
      active: true
    },
    // TEST plans (for development and testing)
    {
      id: 'price_1S6DdkBY2SPm2HvOxI9yuZdg',
      name: 'Basic (Test)',
      description: 'TEST Basic plan with more visualizations',
      price: 2000, // $20.00
      interval: 'month' as const,
      visualizationLimit: 100,
      embedAccess: false,
      active: isTestMode // Only active in test mode
    },
    {
      id: 'price_1S6De0BY2SPm2HvOX1t23IUg',
      name: 'Pro (Test)',
      description: 'TEST Pro plan with premium features',
      price: 10000, // $100.00
      interval: 'month' as const,
      visualizationLimit: 200,
      embedAccess: true,
      active: isTestMode // Only active in test mode
    },
    // PRODUCTION plans
    {
      id: 'price_1S5X1sBY2SPm2HvOuDHNzsIp',
      name: 'Basic',
      description: 'Basic plan with more visualizations',
      price: 2000, // $20.00
      interval: 'month' as const,
      visualizationLimit: 100,
      embedAccess: false,
      active: !isTestMode // Only active in production mode
    },
    {
      id: 'price_1S5X2XBY2SPm2HvO2he9Unto',
      name: 'Pro',
      description: 'Pro plan with premium features',
      price: 10000, // $100.00
      interval: 'month' as const,
      visualizationLimit: 200,
      embedAccess: true,
      active: !isTestMode // Only active in production mode
    },
    // Custom plan (for admin-managed subscriptions)
    {
      id: 'custom',
      name: 'Custom',
      description: 'Admin-managed custom plan',
      price: 0,
      interval: 'month' as const,
      visualizationLimit: 100,
      embedAccess: false,
      active: true
    }
  ];

  // Insert or update each plan
  for (const plan of plans) {
    try {
      // Check if plan exists
      const [existing] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, plan.id));

      if (existing) {
        // Update existing plan
        await db
          .update(subscriptionPlans)
          .set({
            ...plan,
            updatedAt: new Date()
          })
          .where(eq(subscriptionPlans.id, plan.id));
        console.log(`✅ Updated plan: ${plan.name} (${plan.id})`);
      } else {
        // Insert new plan
        await db
          .insert(subscriptionPlans)
          .values({
            ...plan,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        console.log(`✅ Created plan: ${plan.name} (${plan.id})`);
      }
    } catch (error) {
      console.error(`❌ Error processing plan ${plan.id}:`, error);
    }
  }

  console.log("✨ Database initialization complete!");
}

// Run if called directly (ES module compatible)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this file is being run directly
if (process.argv[1] === __filename) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error during initialization:", error);
      process.exit(1);
    });
}