
#!/usr/bin/env node

const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

async function runMigrations() {
  try {
    console.log('🔧 Running database migrations...');
    
    // Get database URL from environment
    let databaseUrl = process.env.DATABASE_URL;
    
    // Check for Replit database file in production
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
    
    console.log('📊 Connected to database');
    
    // Run FK migration
    console.log('🔗 Running foreign key migration...');
    const fkMigration = fs.readFileSync('migrate-subscription-fk.sql', 'utf-8');
    await pool.query(fkMigration);
    console.log('✅ Foreign key migration completed');
    
    // Run subscription plans seed
    console.log('🌱 Seeding subscription plans...');
    const seedData = fs.readFileSync('seed-subscription-plans.sql', 'utf-8');
    await pool.query(seedData);
    console.log('✅ Subscription plans seeded');
    
    console.log('🎉 All migrations completed successfully!');
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigrations();
