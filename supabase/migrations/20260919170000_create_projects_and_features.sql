-- Domaine projets / features (doc/03_DATABASE_DESIGN §5.2–5.5)
-- Ordre FK : enums → github_repositories → projects → features

DO $$
BEGIN
  CREATE TYPE public.project_status AS ENUM ('active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.feature_status AS ENUM (
    'planned',
    'in_progress',
    'committed',
    'pushed',
    'pr_open',
    'merged',
    'done',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- ---------------------------------------------------------------------------
-- github_repositories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.github_repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.github_connections (id) ON DELETE CASCADE,
  github_repository_id bigint NOT NULL,
  owner text NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL,
  default_branch text NOT NULL DEFAULT 'main',
  is_private boolean NOT NULL DEFAULT true,
  html_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT github_repositories_connection_github_id_key
    UNIQUE (connection_id, github_repository_id)
);

COMMENT ON TABLE public.github_repositories IS
  'Miroir repo GitHub lié à une connexion OAuth user';

CREATE INDEX IF NOT EXISTS idx_github_repositories_connection_id
  ON public.github_repositories (connection_id);

CREATE INDEX IF NOT EXISTS idx_github_repositories_full_name
  ON public.github_repositories (full_name);

CREATE TRIGGER github_repositories_set_updated_at
BEFORE UPDATE ON public.github_repositories
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.github_repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "github_repositories_select_own"
ON public.github_repositories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.github_connections c
    WHERE c.id = github_repositories.connection_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "github_repositories_insert_own"
ON public.github_repositories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.github_connections c
    WHERE c.id = github_repositories.connection_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "github_repositories_update_own"
ON public.github_repositories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.github_connections c
    WHERE c.id = github_repositories.connection_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.github_connections c
    WHERE c.id = github_repositories.connection_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "github_repositories_delete_own"
ON public.github_repositories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.github_connections c
    WHERE c.id = github_repositories.connection_id
      AND c.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status public.project_status NOT NULL DEFAULT 'active',
  github_repository_id uuid REFERENCES public.github_repositories (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_github_repository_id_key UNIQUE (github_repository_id)
);

COMMENT ON TABLE public.projects IS
  'Projet de pilotage — 1:1 optionnel avec un github_repositories';

CREATE INDEX IF NOT EXISTS idx_projects_owner_id
  ON public.projects (owner_id);

CREATE INDEX IF NOT EXISTS idx_projects_github_repository_id
  ON public.projects (github_repository_id)
  WHERE github_repository_id IS NOT NULL;

CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own"
ON public.projects
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "projects_insert_own"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_own"
ON public.projects
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_delete_own"
ON public.projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- features
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  parent_feature_id uuid REFERENCES public.features (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  branch_name text,
  status public.feature_status NOT NULL DEFAULT 'planned',
  manual_override boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT features_parent_not_self CHECK (parent_feature_id IS DISTINCT FROM id)
);

COMMENT ON TABLE public.features IS
  'Feature produit — branch_name = branche GitHub feature/* (V1)';

CREATE UNIQUE INDEX IF NOT EXISTS uq_features_project_branch_name
  ON public.features (project_id, branch_name)
  WHERE branch_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_features_project_id
  ON public.features (project_id);

CREATE INDEX IF NOT EXISTS idx_features_parent_feature_id
  ON public.features (parent_feature_id)
  WHERE parent_feature_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_features_status
  ON public.features (project_id, status);

CREATE TRIGGER features_set_updated_at
BEFORE UPDATE ON public.features
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "features_select_own"
ON public.features
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = features.project_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "features_insert_own"
ON public.features
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = features.project_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "features_update_own"
ON public.features
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = features.project_id
      AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = features.project_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "features_delete_own"
ON public.features
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = features.project_id
      AND p.owner_id = auth.uid()
  )
);
