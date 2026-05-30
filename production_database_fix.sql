-- Production Database Fix Script
-- Run this in your production database to update subscription plans

-- 1. Update existing Pro plan to be Contractor with 200 visualizations
UPDATE subscription_plans 
SET name = 'Contractor', 
    description = 'For small business owners ready to impress clients',
    price = 30000,
    visualization_limit = 200,
    embed_access = true,
    active = true
WHERE id = 'price_1S5X2XBY2SPm2HvO2he9Unto';

-- 2. Deactivate Basic plan
UPDATE subscription_plans
SET active = false
WHERE id = 'price_1S5X1sBY2SPm2HvOuDHNzsIp';

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
