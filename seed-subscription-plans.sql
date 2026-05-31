
-- Insert the subscription plans that are referenced in the code
INSERT INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active) VALUES
('free', 'Free', 'Free plan with limited visualizations', 0, 'month', 5, false, true),
('price_1S5X1sBY2SPm2HvOuDHNzsIp', 'Basic', 'Legacy Basic plan', 2000, 'month', 50, false, false),
('price_1S5X2XBY2SPm2HvO2he9Unto', 'Contractor (Legacy)', 'Legacy Contractor plan retained for existing subscriptions', 30000, 'month', 200, true, false),
('price_1TcynuBY2SPm2HvO1Eri2ogI', 'Contractor', 'For small business owners ready to impress clients', 30000, 'month', 200, true, true),
('price_1SGN4YBY2SPm2HvOrpREWCn1', 'Professional', 'For growing teams and advanced features', 50000, 'month', 650, true, true),
('custom', 'Custom', 'Admin-managed custom plan', 0, 'month', 100, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  interval = EXCLUDED.interval,
  visualization_limit = EXCLUDED.visualization_limit,
  embed_access = EXCLUDED.embed_access,
  active = EXCLUDED.active;
