CREATE TABLE IF NOT EXISTS generation_projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_generations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES generation_projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  service TEXT NOT NULL,
  visualization_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generation_projects_user_id_idx
  ON generation_projects(user_id);

CREATE INDEX IF NOT EXISTS project_generations_user_id_idx
  ON project_generations(user_id);

CREATE INDEX IF NOT EXISTS project_generations_project_id_idx
  ON project_generations(project_id);

CREATE INDEX IF NOT EXISTS project_generations_lookup_idx
  ON project_generations(project_id, user_id, service, visualization_id);
