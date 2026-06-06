ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_enterprise boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS embed_visitor_limit integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS embed_require_quote_after_limit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS embed_quote_gate_title text DEFAULT 'Ready for a free quote?',
  ADD COLUMN IF NOT EXISTS embed_quote_gate_message text DEFAULT 'You''ve reached the free visualization limit. Request a quote to keep planning your project.',
  ADD COLUMN IF NOT EXISTS embed_quote_form_title text DEFAULT 'Get your free quote',
  ADD COLUMN IF NOT EXISTS embed_quote_form_message text DEFAULT 'Send your project details and the team will follow up with a quote.',
  ADD COLUMN IF NOT EXISTS embed_quote_destination_type text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS embed_quote_recipient_email text,
  ADD COLUMN IF NOT EXISTS embed_quote_success_redirect_url text,
  ADD COLUMN IF NOT EXISTS embed_quote_include_images boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS embed_customizations jsonb;

CREATE TABLE IF NOT EXISTS embed_visitor_usage (
  id serial PRIMARY KEY,
  tenant_id integer NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  visualization_count integer DEFAULT 0,
  quote_click_count integer DEFAULT 0,
  first_seen_at timestamp DEFAULT now(),
  last_seen_at timestamp DEFAULT now(),
  last_generated_at timestamp
);

CREATE INDEX IF NOT EXISTS embed_visitor_usage_lookup_idx
  ON embed_visitor_usage (tenant_id, visitor_key, year, month);
