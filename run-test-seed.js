
const { Pool } = require('pg');
const fs = require('fs');

async function seedTestPlans() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const sql = fs.readFileSync('seed-test-subscription-plans.sql', 'utf8');
    console.log('🌱 Seeding test subscription plans...');
    
    await pool.query(sql);
    
    console.log('✅ Test subscription plans seeded successfully!');
    
    // Verify the plans were created
    const result = await pool.query('SELECT id, name, price FROM subscription_plans ORDER BY price');
    console.log('Plans in database:');
    result.rows.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price/100}/month (ID: ${plan.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding plans:', error.message);
  } finally {
    await pool.end();
  }
}

seedTestPlans();
