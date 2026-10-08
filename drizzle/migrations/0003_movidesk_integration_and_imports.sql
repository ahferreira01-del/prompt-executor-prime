ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email varchar(255);
CREATE UNIQUE INDEX IF NOT EXISTS employees_company_email_uniq ON public.employees (company_id, lower(email)) WHERE email IS NOT NULL;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS external_status text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_source_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_source_check CHECK (source IN ('manual','webhook','sync_api','import'));
CREATE UNIQUE INDEX IF NOT EXISTS tickets_company_external_uniq ON public.tickets (company_id, external_id) WHERE external_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'movidesk' CHECK (provider IN ('movidesk')),
  api_token text,
  webhook_key text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''),
  sync_enabled boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read integrations" ON public.integrations;
DROP POLICY IF EXISTS "Admins create integrations" ON public.integrations;
DROP POLICY IF EXISTS "Admins update integrations" ON public.integrations;
DROP POLICY IF EXISTS "Admins delete integrations" ON public.integrations;
CREATE POLICY "Admins read integrations" ON public.integrations FOR SELECT TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Admins create integrations" ON public.integrations FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Admins update integrations" ON public.integrations FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Admins delete integrations" ON public.integrations FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));
CREATE TABLE IF NOT EXISTS public.integration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('webhook','sync_api','import')),
  entity text NOT NULL DEFAULT 'tickets',
  status text NOT NULL CHECK (status IN ('success','partial','error')),
  received integer NOT NULL DEFAULT 0,
  created integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.integration_runs TO authenticated;
GRANT ALL ON public.integration_runs TO service_role;
ALTER TABLE public.integration_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read integration runs" ON public.integration_runs;
DROP POLICY IF EXISTS "Editors log integration runs" ON public.integration_runs;
CREATE POLICY "Members read integration runs" ON public.integration_runs FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors log integration runs" ON public.integration_runs FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));