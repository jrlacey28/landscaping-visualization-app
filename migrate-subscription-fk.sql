
-- Migration to add foreign key constraint for subscriptions.plan_id
-- Drop existing constraint if it exists (in case it was created without proper options)
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;

-- Add the foreign key constraint with proper options
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_id_fkey 
FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

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
