
#!/usr/bin/env node

async function verifyDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Get database URL
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found');
    }
    
    console.log('✅ DATABASE_URL is configured');
    
    // Check Stripe configuration
    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_API_KEY;
    if (stripeKey) {
      if (stripeKey.startsWith('sk_test_')) {
        console.log('🧪 Stripe TEST mode configured');
      } else if (stripeKey.startsWith('sk_live_')) {
        console.log('🚀 Stripe PRODUCTION mode configured');
      } else {
        console.log('❓ Stripe key format unknown');
      }
    } else {
      console.log('❌ No Stripe key found');
    }
    
    console.log('🎉 Configuration check complete!');
    
  } catch (error) {
    console.error('❌ Configuration check failed:', error.message);
  }
}

verifyDatabase();
