-- Production dashboard generation/project repair
-- Run this once in the production PostgreSQL SQL editor after taking a DB backup.
--
-- Why this exists:
-- The dashboard Previous Generations section depends on generation_projects,
-- project_generations, and user/tenant ownership columns on visualization tables.
-- If production was redeployed before these schema changes were applied, project
-- creation and generation library loading will fail.

BEGIN;

-- Tenant/embed ownership columns used to attach public embed generations to the
-- account that owns the tenant.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS embed_enabled boolean DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS embed_cta_text text DEFAULT 'Get Your Free Quote';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS embed_cta_phone text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS embed_cta_url text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS embed_primary_color text DEFAULT '#2563EB';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS embed_secondary_color text DEFAULT '#059669';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS monthly_generation_limit integer DEFAULT 100;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_month_generations integer DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_reset_date timestamp DEFAULT NOW();

-- Lead ownership columns used by account/tenant dashboards.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id integer REFERENCES tenants(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type text DEFAULT 'standard';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_details text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS selected_styles jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS original_image_url text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS generated_image_url text;

-- Generation ownership columns. These are nullable so old rows remain valid.
ALTER TABLE visualizations ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id);
ALTER TABLE visualizations ADD COLUMN IF NOT EXISTS tenant_id integer REFERENCES tenants(id);

ALTER TABLE pool_visualizations ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id);
ALTER TABLE pool_visualizations ADD COLUMN IF NOT EXISTS tenant_id integer REFERENCES tenants(id);

ALTER TABLE landscape_visualizations ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id);
ALTER TABLE landscape_visualizations ADD COLUMN IF NOT EXISTS tenant_id integer REFERENCES tenants(id);

ALTER TABLE halloween_visualizations ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id);
ALTER TABLE halloween_visualizations ADD COLUMN IF NOT EXISTS tenant_id integer REFERENCES tenants(id);

ALTER TABLE christmas_lights_visualizations ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id);
ALTER TABLE christmas_lights_visualizations ADD COLUMN IF NOT EXISTS tenant_id integer REFERENCES tenants(id);

-- Project folders in the dashboard.
CREATE TABLE IF NOT EXISTS generation_projects (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  name text NOT NULL,
  address text,
  notes text,
  cover_image_url text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Saved generation/project assignments.
CREATE TABLE IF NOT EXISTS project_generations (
  id serial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES generation_projects(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id),
  service text NOT NULL,
  visualization_id integer NOT NULL,
  created_at timestamp DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generation_projects_user_id_idx
  ON generation_projects(user_id);

CREATE INDEX IF NOT EXISTS project_generations_user_id_idx
  ON project_generations(user_id);

CREATE INDEX IF NOT EXISTS project_generations_project_id_idx
  ON project_generations(project_id);

CREATE UNIQUE INDEX IF NOT EXISTS project_generations_unique_generation_per_project_idx
  ON project_generations(project_id, user_id, service, visualization_id);

-- The generation library filters by user/tenant and sorts by created_at. These
-- indexes keep the dashboard from timing out once image rows grow.
CREATE INDEX IF NOT EXISTS visualizations_user_id_created_at_idx
  ON visualizations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS visualizations_tenant_id_created_at_idx
  ON visualizations(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pool_visualizations_user_id_created_at_idx
  ON pool_visualizations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pool_visualizations_tenant_id_created_at_idx
  ON pool_visualizations(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS landscape_visualizations_user_id_created_at_idx
  ON landscape_visualizations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS landscape_visualizations_tenant_id_created_at_idx
  ON landscape_visualizations(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS halloween_visualizations_user_id_created_at_idx
  ON halloween_visualizations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS halloween_visualizations_tenant_id_created_at_idx
  ON halloween_visualizations(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS christmas_lights_visualizations_user_id_created_at_idx
  ON christmas_lights_visualizations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS christmas_lights_visualizations_tenant_id_created_at_idx
  ON christmas_lights_visualizations(tenant_id, created_at DESC);

COMMIT;

-- Verification: both values should show table names, not null.
SELECT
  to_regclass('public.generation_projects') AS generation_projects_table,
  to_regclass('public.project_generations') AS project_generations_table;
