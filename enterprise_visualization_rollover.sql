-- Adds configurable enterprise visualization rollover state.
-- Run this before deploying code that reads the new tenant columns.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS visualization_rollover_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS visualization_rollover_balance integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visualization_rollover_cap integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visualization_rollover_last_processed_at timestamp;

UPDATE tenants
SET
  visualization_rollover_enabled = COALESCE(visualization_rollover_enabled, false),
  visualization_rollover_balance = GREATEST(COALESCE(visualization_rollover_balance, 0), 0),
  visualization_rollover_cap = GREATEST(COALESCE(visualization_rollover_cap, 0), 0);

ALTER TABLE tenants
  ALTER COLUMN visualization_rollover_enabled SET DEFAULT false,
  ALTER COLUMN visualization_rollover_enabled SET NOT NULL,
  ALTER COLUMN visualization_rollover_balance SET DEFAULT 0,
  ALTER COLUMN visualization_rollover_balance SET NOT NULL,
  ALTER COLUMN visualization_rollover_cap SET DEFAULT 0,
  ALTER COLUMN visualization_rollover_cap SET NOT NULL;
