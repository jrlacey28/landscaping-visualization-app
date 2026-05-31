-- PRODUCTION DATABASE FIX - RUN THIS IN YOUR DATABASE PANEL SQL EDITOR
-- This fixes the subscription_plans table based on your screenshot

-- Step 1: Insert/update the current Contractor plan with the live $300 Stripe price ID
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
    'price_1TcynuBY2SPm2HvO1Eri2ogI',
    'Contractor',
    'For small business owners ready to impress clients',
    30000,
    'month',
    200,
    true,
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET 
    name = 'Contractor',
    description = 'For small business owners ready to impress clients',
    price = 30000,
    interval = 'month',
    visualization_limit = 200,
    embed_access = true,
    active = true;

-- Step 2: Deactivate the Basic plan (price_1S5X1sBY2SPm2HvO...)
UPDATE subscription_plans
SET active = false
WHERE id = 'price_1S5X1sBY2SPm2HvOuDHNzsIp';

-- Step 3: Deactivate the old Contractor/Pro price ID and test plans
UPDATE subscription_plans
SET active = false
WHERE id IN ('price_1S5X2XBY2SPm2HvO2he9Unto', 'price_1SGDb6kBY2SPm2HvOL9qjHhK', 'price_1SGDe8BY2SPm2HvOLf0zJc6Y');

-- Keep legacy Contractor subscriptions usable without offering the old price for new checkout
UPDATE subscription_plans
SET 
    name = 'Contractor (Legacy)',
    description = 'Legacy Contractor plan retained for existing subscriptions',
    visualization_limit = 200,
    price = 30000,
    embed_access = true,
    active = false
WHERE id = 'price_1S5X2XBY2SPm2HvO2he9Unto';

-- Step 4: Insert Professional plan (only if it doesn't exist)
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
    'Professional', 
    'For growing teams and advanced features', 
    50000, 
    'month', 
    650, 
    true, 
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET 
    name = 'Professional',
    description = 'For growing teams and advanced features',
    price = 50000,
    visualization_limit = 650,
    embed_access = true,
    active = true;

-- Step 5: Verify the changes (this will show you the final state)
SELECT id, name, price, visualization_limit, embed_access, active 
FROM subscription_plans 
ORDER BY 
    CASE 
        WHEN id = 'free' THEN 1
        WHEN id = 'price_1TcynuBY2SPm2HvO1Eri2ogI' THEN 2
        WHEN id = 'price_1SGN4YBY2SPm2HvOrpREWCn1' THEN 3
        WHEN id = 'price_1S5X2XBY2SPm2HvO2he9Unto' THEN 4
        ELSE 5
    END;
