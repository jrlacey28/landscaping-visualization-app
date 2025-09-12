
#!/usr/bin/env node

const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database connection and schema...');
    
    // Get database URL
    let databaseUrl = process.env.DATABASE_URL;
    
    if (process.env.NODE_ENV === 'production') {
      try {
        if (fs.existsSync('/tmp/replitdb')) {
          const dbUrl = fs.readFileSync('/tmp/replitdb', 'utf-8').trim();
          if (dbUrl) databaseUrl = dbUrl;
        }
      } catch (error) {
        console.log('Could not read /tmp/replitdb, using DATABASE_URL');
      }
    }
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found');
    }
    
    const pool = new Pool({ connectionString: databaseUrl });
    
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subscription_plans', 'subscriptions', 'users')
      ORDER BY table_name;
    `;
    
    const { rows: tables } = await pool.query(tablesQuery);
    console.log('📋 Found tables:', tables.map(r => r.table_name));
    
    // Check foreign key constraint
    const fkQuery = `
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'subscriptions'
      AND kcu.column_name = 'plan_id';
    `;
    
    const { rows: fks } = await pool.query(fkQuery);
    if (fks.length > 0) {
      console.log('🔗 Foreign key constraint exists:', fks[0].constraint_name);
    } else {
      console.log('⚠️  Foreign key constraint missing');
    }
    
    // Check subscription plans
    const plansQuery = 'SELECT id, name, price FROM subscription_plans ORDER BY id;';
    const { rows: plans } = await pool.query(plansQuery);
    console.log('💳 Subscription plans:');
    plans.forEach(plan => {
      console.log(`  - ${plan.id}: ${plan.name} ($${plan.price/100})`);
    });
    
    await pool.end();
    console.log('🎉 Database verification complete!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

verifyDatabase();
