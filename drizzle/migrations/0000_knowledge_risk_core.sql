CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'analyst', 'viewer');
CREATE TYPE public.risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE public.diagnostic_status AS ENUM ('DRAFT', 'COMPLETED');
CREATE TYPE public.documentation_level AS ENUM ('NONE', 'PARTIAL', 'COMPLETE');
CREATE TYPE public.recommendation_type AS ENUM ('TRAINING', 'DOCUMENTATION', 'OPERATIONAL_BACKUP', 'KNOWLEDGE_SHARING');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name varchar(200) NOT NULL CHECK (length(trim(name)) > 0),
  segment varchar(150) NOT NULL,
  employee_count integer NOT NULL CHECK (employee_count > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid, _user_id uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company_id AND user_id = _user_id) OR EXISTS (SELECT 1 FROM public.companies WHERE id = _company_id AND owner_id = _user_id) $$;
CREATE OR REPLACE FUNCTION public.has_company_role(_company_id uuid, _roles public.app_role[], _user_id uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company_id AND user_id = _user_id AND role = ANY(_roles)) OR EXISTS (SELECT 1 FROM public.companies WHERE id = _company_id AND owner_id = _user_id AND 'admin' = ANY(_roles)) $$;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, public.app_role[], uuid) TO authenticated;
CREATE POLICY "Members read companies" ON public.companies FOR SELECT TO authenticated USING (public.is_company_member(id));
CREATE POLICY "Users create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins update companies" ON public.companies FOR UPDATE TO authenticated USING (public.has_company_role(id, ARRAY['admin']::public.app_role[])) WITH CHECK (public.has_company_role(id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Admins delete companies" ON public.companies FOR DELETE TO authenticated USING (public.has_company_role(id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Members read memberships" ON public.company_members FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Admins add memberships" ON public.company_members FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Admins update memberships" ON public.company_members FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Admins delete memberships" ON public.company_members FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.add_company_owner_membership() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.company_members(company_id,user_id,role) VALUES(NEW.id,NEW.owner_id,'admin') ON CONFLICT DO NOTHING; RETURN NEW; END $$;
CREATE TRIGGER company_owner_membership AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.add_company_owner_membership();

CREATE TABLE public.risk_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  version integer NOT NULL,
  doc_none numeric(5,2) NOT NULL DEFAULT 100,
  doc_partial numeric(5,2) NOT NULL DEFAULT 50,
  doc_complete numeric(5,2) NOT NULL DEFAULT 10,
  weight_concentration numeric(5,4) NOT NULL DEFAULT .25,
  weight_criticality numeric(5,4) NOT NULL DEFAULT .20,
  weight_coverage numeric(5,4) NOT NULL DEFAULT .20,
  weight_documentation numeric(5,4) NOT NULL DEFAULT .15,
  weight_revenue numeric(5,4) NOT NULL DEFAULT .20,
  revenue_mode text NOT NULL DEFAULT 'PROPORTIONAL' CHECK (revenue_mode = 'PROPORTIONAL'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, version),
  CHECK (weight_concentration + weight_criticality + weight_coverage + weight_documentation + weight_revenue = 1)
);
GRANT SELECT, INSERT, UPDATE ON public.risk_configurations TO authenticated;
GRANT ALL ON public.risk_configurations TO service_role;
ALTER TABLE public.risk_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read risk configs" ON public.risk_configurations FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Admins create risk configs" ON public.risk_configurations FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Admins update risk configs" ON public.risk_configurations FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL, job_title varchar(150) NOT NULL, area varchar(150) NOT NULL,
  tenure_months integer NOT NULL CHECK (tenure_months >= 0), active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated; GRANT ALL ON public.employees TO service_role; ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read employees" ON public.employees FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update employees" ON public.employees FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete employees" ON public.employees FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL, description text NOT NULL, area varchar(150) NOT NULL, criticality public.risk_level NOT NULL,
  documentation_level public.documentation_level NOT NULL DEFAULT 'NONE', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processes TO authenticated; GRANT ALL ON public.processes TO service_role; ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read processes" ON public.processes FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create processes" ON public.processes FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update processes" ON public.processes FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete processes" ON public.processes FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technologies TO authenticated; GRANT ALL ON public.technologies TO service_role; ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage technologies" ON public.technologies FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors insert technologies" ON public.technologies FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update technologies" ON public.technologies FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete technologies" ON public.technologies FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL, annual_revenue numeric(18,2) CHECK (annual_revenue >= 0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated; GRANT ALL ON public.clients TO service_role; ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read clients" ON public.clients FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update clients" ON public.clients FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete clients" ON public.clients FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.employee_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id), process_id uuid REFERENCES public.processes(id), technology_id uuid REFERENCES public.technologies(id),
  created_at timestamptz NOT NULL DEFAULT now(), CHECK(process_id IS NOT NULL OR technology_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_capabilities TO authenticated; GRANT ALL ON public.employee_capabilities TO service_role; ALTER TABLE public.employee_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read capabilities" ON public.employee_capabilities FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create capabilities" ON public.employee_capabilities FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update capabilities" ON public.employee_capabilities FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors delete capabilities" ON public.employee_capabilities FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));

CREATE TABLE public.knowledge_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id), process_id uuid REFERENCES public.processes(id), technology_id uuid REFERENCES public.technologies(id), client_id uuid REFERENCES public.clients(id),
  theme varchar(200), activity_type varchar(100), activity_date timestamptz NOT NULL DEFAULT now(), source_key text,
  UNIQUE(company_id, source_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_activities TO authenticated; GRANT ALL ON public.knowledge_activities TO service_role; ALTER TABLE public.knowledge_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read activities" ON public.knowledge_activities FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create activities" ON public.knowledge_activities FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update activities" ON public.knowledge_activities FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors delete activities" ON public.knowledge_activities FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));

CREATE TABLE public.diagnostic_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(50) NOT NULL UNIQUE, category text NOT NULL CHECK(category IN ('CAPABLE_PEOPLE','DOCUMENTATION','FREQUENCY','CRITICALITY')), question_text text NOT NULL, required boolean NOT NULL DEFAULT true, display_order integer NOT NULL
);
GRANT SELECT ON public.diagnostic_questions TO authenticated; GRANT ALL ON public.diagnostic_questions TO service_role; ALTER TABLE public.diagnostic_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read questions" ON public.diagnostic_questions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status public.diagnostic_status NOT NULL DEFAULT 'DRAFT', risk_score numeric(5,2) CHECK(risk_score BETWEEN 0 AND 100),
  risk_configuration_id uuid NOT NULL REFERENCES public.risk_configurations(id), started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostics TO authenticated; GRANT ALL ON public.diagnostics TO service_role; ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read diagnostics" ON public.diagnostics FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create diagnostics" ON public.diagnostics FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update diagnostics" ON public.diagnostics FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete diagnostics" ON public.diagnostics FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.diagnostic_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  diagnostic_id uuid NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE, question_id uuid NOT NULL REFERENCES public.diagnostic_questions(id), answer_value text NOT NULL,
  UNIQUE(diagnostic_id,question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_answers TO authenticated; GRANT ALL ON public.diagnostic_answers TO service_role; ALTER TABLE public.diagnostic_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read answers" ON public.diagnostic_answers FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create answers" ON public.diagnostic_answers FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update answers" ON public.diagnostic_answers FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors delete answers" ON public.diagnostic_answers FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));

CREATE TABLE public.risk_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  diagnostic_id uuid REFERENCES public.diagnostics(id), risk_configuration_id uuid NOT NULL REFERENCES public.risk_configurations(id),
  indicator_type varchar(50) NOT NULL, employee_id uuid REFERENCES public.employees(id), process_id uuid REFERENCES public.processes(id), technology_id uuid REFERENCES public.technologies(id), client_id uuid REFERENCES public.clients(id),
  numeric_value numeric(18,4), classification varchar(50), calculated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_indicators TO authenticated; GRANT ALL ON public.risk_indicators TO service_role; ALTER TABLE public.risk_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read indicators" ON public.risk_indicators FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create indicators" ON public.risk_indicators FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update indicators" ON public.risk_indicators FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete indicators" ON public.risk_indicators FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, employee_id uuid REFERENCES public.employees(id), content text NOT NULL CHECK(length(content) <= 10000), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated; GRANT ALL ON public.tickets TO service_role; ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tickets" ON public.tickets FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update tickets" ON public.tickets FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete tickets" ON public.tickets FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.ticket_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  technology varchar(200) NOT NULL, category varchar(200) NOT NULL, subject varchar(300) NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_classifications TO authenticated; GRANT ALL ON public.ticket_classifications TO service_role; ALTER TABLE public.ticket_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read classifications" ON public.ticket_classifications FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create classifications" ON public.ticket_classifications FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update classifications" ON public.ticket_classifications FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete classifications" ON public.ticket_classifications FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.mitigation_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, indicator_id uuid REFERENCES public.risk_indicators(id),
  recommendation_type public.recommendation_type NOT NULL, reason text NOT NULL, recommendation_text text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mitigation_recommendations TO authenticated; GRANT ALL ON public.mitigation_recommendations TO service_role; ALTER TABLE public.mitigation_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read recommendations" ON public.mitigation_recommendations FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Editors create recommendations" ON public.mitigation_recommendations FOR INSERT TO authenticated WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors update recommendations" ON public.mitigation_recommendations FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins delete recommendations" ON public.mitigation_recommendations FOR DELETE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id uuid, actor_id uuid, action text NOT NULL, entity_type text NOT NULL, entity_id uuid, before_data jsonb, after_data jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated; GRANT ALL ON public.audit_logs TO service_role; ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.audit_tenant_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE row_company uuid; row_id uuid; BEGIN row_company := COALESCE((to_jsonb(NEW)->>'company_id')::uuid,(to_jsonb(OLD)->>'company_id')::uuid); row_id := COALESCE((to_jsonb(NEW)->>'id')::uuid,(to_jsonb(OLD)->>'id')::uuid); INSERT INTO public.audit_logs(company_id,actor_id,action,entity_type,entity_id,before_data,after_data) VALUES(row_company,auth.uid(),TG_OP,TG_TABLE_NAME,row_id,CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END); RETURN COALESCE(NEW,OLD); END $$;
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.audit_tenant_change();
CREATE TRIGGER audit_processes AFTER INSERT OR UPDATE OR DELETE ON public.processes FOR EACH ROW EXECUTE FUNCTION public.audit_tenant_change();
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.audit_tenant_change();
CREATE TRIGGER audit_diagnostics AFTER INSERT OR UPDATE OR DELETE ON public.diagnostics FOR EACH ROW EXECUTE FUNCTION public.audit_tenant_change();
CREATE TRIGGER audit_risk_configs AFTER INSERT OR UPDATE OR DELETE ON public.risk_configurations FOR EACH ROW EXECUTE FUNCTION public.audit_tenant_change();

CREATE INDEX idx_members_user ON public.company_members(user_id);
CREATE INDEX idx_employees_company ON public.employees(company_id, active);
CREATE INDEX idx_processes_company ON public.processes(company_id, criticality);
CREATE INDEX idx_activities_technology ON public.knowledge_activities(company_id,technology_id,employee_id);
CREATE INDEX idx_activities_process ON public.knowledge_activities(company_id,process_id,employee_id);
CREATE INDEX idx_activities_client ON public.knowledge_activities(company_id,client_id,employee_id);
CREATE INDEX idx_indicators_company_type ON public.risk_indicators(company_id,indicator_type,calculated_at DESC);
CREATE INDEX idx_audit_company_time ON public.audit_logs(company_id,created_at DESC);