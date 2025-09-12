
-- Seed test subscription plans with correct Stripe test price IDs
INSERT INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active)
VALUES 
  ('free', 'Free Plan', 'Basic free tier with limited features', 0, 'month', 5, false, true),
  ('price_1S6DdkBY2SPm2HvOxI9yuZdg', 'Basic Plan', 'Perfect for small businesses getting started', 2000, 'month', 100, false, true),
  ('price_1S6De0BY2SPm2HvOX1t23IUg', 'Pro Plan', 'Ideal for growing businesses', 10000, 'month', 200, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  visualization_limit = EXCLUDED.visualization_limit,
  embed_access = EXCLUDED.embed_access,
  active = EXCLUDED.active;
