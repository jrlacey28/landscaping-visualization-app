
-- Insert the subscription plans that are referenced in the code
INSERT INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active) VALUES
('free', 'Free', 'Free plan with limited visualizations', 0, 'month', 5, false, true),
('price_1S5X1sBY2SPm2HvOuDHNzsIp', 'Basic', 'Basic plan with more visualizations', 2500, 'month', 50, false, true),
('price_1S5X2XBY2SPm2HvO2he9Unto', 'Pro', 'Pro plan with unlimited visualizations', 10000, 'month', -1, true, true),
('enterprise', 'Enterprise', 'Enterprise plan with custom features', 25000, 'month', -1, true, true),
('custom', 'Custom', 'Admin-managed custom plan', 0, 'month', 100, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  visualization_limit = EXCLUDED.visualization_limit,
  embed_access = EXCLUDED.embed_access,
  active = EXCLUDED.active;
