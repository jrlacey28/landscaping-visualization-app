import "dotenv/config";
import fs from "fs";
import path from "path";
import { PGlite } from "@electric-sql/pglite";

const dataDir = process.env.LOCAL_DATABASE_PATH || ".local/pglite";
fs.mkdirSync(path.dirname(dataDir), { recursive: true });

const db = new PGlite(dataDir);
await db.waitReady;

await db.exec(`
  INSERT INTO subscription_plans (id, name, description, price, interval, visualization_limit, embed_access, active)
  VALUES
    ('free', 'Free', 'Free plan with limited visualizations', 0, 'month', 5, false, true),
    ('price_1S5X1sBY2SPm2HvOuDHNzsIp', 'Basic', 'Legacy Basic plan', 2000, 'month', 50, false, false),
    ('price_1S5X2XBY2SPm2HvO2he9Unto', 'Contractor', 'For small business owners ready to impress clients', 30000, 'month', 200, true, true),
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
`);

await db.exec(`
  INSERT INTO tenants (
    slug,
    company_name,
    logo_url,
    primary_color,
    secondary_color,
    phone,
    email,
    address,
    description,
    show_pricing,
    require_phone,
    active
  )
  VALUES (
    'demo',
    'DreamBuilder',
    null,
    '#2563EB',
    '#059669',
    '(555) 123-4567',
    'info@ailandscaping.com',
    '123 Main St, Anytown USA',
    'Professional AI-powered visualization services',
    true,
    false,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    logo_url = EXCLUDED.logo_url,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    description = EXCLUDED.description,
    show_pricing = EXCLUDED.show_pricing,
    require_phone = EXCLUDED.require_phone,
    active = EXCLUDED.active;
`);

await db.close();

console.log(`Seeded local database at ${dataDir}`);
