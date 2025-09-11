
-- Migration to ensure proper schema for Stripe price IDs
-- Ensure subscription_plans.id is TEXT (should already be)
ALTER TABLE subscription_plans ALTER COLUMN id TYPE TEXT;

-- Ensure subscriptions.plan_id is TEXT (should already be)  
ALTER TABLE subscriptions ALTER COLUMN plan_id TYPE TEXT;

-- Drop existing constraint if it exists
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;

-- Add the foreign key constraint with proper options
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_id_fkey 
FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Clean up any invalid data
DELETE FROM subscriptions WHERE plan_id NOT IN (SELECT id FROM subscription_plans);

-- Verify the constraint exists
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
