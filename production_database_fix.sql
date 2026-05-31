-- Production Database Fix Script
-- Run this in your production database to update subscription plans

-- 1. Insert or update current Contractor plan
INSERT INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active)
VALUES ('price_1TcynuBY2SPm2HvO1Eri2ogI', 'Contractor', 'For small business owners ready to impress clients', 30000, 'month', 200, true, true)
ON CONFLICT (id) DO UPDATE 
SET name = 'Contractor',
    description = 'For small business owners ready to impress clients',
    price = 30000,
    interval = 'month',
    visualization_limit = 200,
    embed_access = true,
    active = true;

-- 2. Deactivate Basic plan and the previous Contractor/Pro price ID
UPDATE subscription_plans
SET active = false
WHERE id IN ('price_1S5X1sBY2SPm2HvOuDHNzsIp', 'price_1S5X2XBY2SPm2HvO2he9Unto');

-- Keep legacy Contractor subscriptions usable without offering the old price for new checkout
UPDATE subscription_plans
SET name = 'Contractor (Legacy)',
    description = 'Legacy Contractor plan retained for existing subscriptions',
    price = 30000,
    visualization_limit = 200,
    embed_access = true,
    active = false
WHERE id = 'price_1S5X2XBY2SPm2HvO2he9Unto';

-- 3. Insert or update Professional plan
INSERT INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active)
VALUES ('price_1SGN4YBY2SPm2HvOrpREWCn1', 'Professional', 'For growing teams and advanced features', 50000, 'month', 650, true, true)
ON CONFLICT (id) DO UPDATE 
SET name = 'Professional',
    description = 'For growing teams and advanced features',
    price = 50000,
    visualization_limit = 650,
    embed_access = true,
    active = true;

-- 4. Verify the changes
SELECT id, name, visualization_limit, price, active FROM subscription_plans ORDER BY price;
