-- PRODUCTION DATABASE FIX - RUN THIS IN YOUR DATABASE PANEL SQL EDITOR
-- This fixes the subscription_plans table based on your screenshot

-- Step 1: Update the Pro plan (price_1S5X2XBY2SPm2HvO...) to be Contractor with 100 visualizations
UPDATE subscription_plans 
SET 
    name = 'Contractor',
    description = 'For small business owners ready to impress clients',
    visualization_limit = 100,
    price = 10000,
    embed_access = false
WHERE id = 'price_1S5X2XBY2SPm2HvO2he9Unto';

-- Step 2: Deactivate the Basic plan (price_1S5X1sBY2SPm2HvO...)
UPDATE subscription_plans
SET active = false
WHERE id = 'price_1S5X1sBY2SPm2HvOuDHNzsIp';

-- Step 3: Deactivate the test plans
UPDATE subscription_plans
SET active = false
WHERE id IN ('price_1SGDb6kBY2SPm2HvOL9qjHhK', 'price_1SGDe8BY2SPm2HvOLf0zJc6Y');

-- Step 4: Insert Business Pro plan (only if it doesn't exist)
INSERT INTO subscription_plans (
    id, 
    name, 
    description, 
    price, 
    interval, 
    visualization_limit, 
    embed_access, 
    active,
    created_at
)
VALUES (
    'price_1SGN4YBY2SPm2HvOrpREWCn1', 
    'Business Pro', 
    'For growing teams and advanced features', 
    30000, 
    'month', 
    500, 
    true, 
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET 
    name = 'Business Pro',
    description = 'For growing teams and advanced features',
    price = 30000,
    visualization_limit = 500,
    embed_access = true,
    active = true;

-- Step 5: Verify the changes (this will show you the final state)
SELECT id, name, price, visualization_limit, embed_access, active 
FROM subscription_plans 
ORDER BY 
    CASE 
        WHEN id = 'free' THEN 1
        WHEN id = 'price_1S5X2XBY2SPm2HvO2he9Unto' THEN 2
        WHEN id = 'price_1SGN4YBY2SPm2HvOrpREWCn1' THEN 3
        ELSE 4
    END;