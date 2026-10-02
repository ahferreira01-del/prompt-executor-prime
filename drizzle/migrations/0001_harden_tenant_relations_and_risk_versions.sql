CREATE OR REPLACE FUNCTION public.prevent_used_risk_configuration_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.diagnostics WHERE risk_configuration_id = OLD.id)
     OR EXISTS (SELECT 1 FROM public.risk_indicators WHERE risk_configuration_id = OLD.id) THEN
    IF NEW.doc_none IS DISTINCT FROM OLD.doc_none
       OR NEW.doc_partial IS DISTINCT FROM OLD.doc_partial
       OR NEW.doc_complete IS DISTINCT FROM OLD.doc_complete
       OR NEW.weight_concentration IS DISTINCT FROM OLD.weight_concentration
       OR NEW.weight_criticality IS DISTINCT FROM OLD.weight_criticality
       OR NEW.weight_coverage IS DISTINCT FROM OLD.weight_coverage
       OR NEW.weight_documentation IS DISTINCT FROM OLD.weight_documentation
       OR NEW.weight_revenue IS DISTINCT FROM OLD.weight_revenue
       OR NEW.revenue_mode IS DISTINCT FROM OLD.revenue_mode
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'Used risk configurations are immutable; create a new version';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER prevent_used_risk_configuration_changes
BEFORE UPDATE ON public.risk_configurations
FOR EACH ROW EXECUTE FUNCTION public.prevent_used_risk_configuration_changes();

CREATE OR REPLACE FUNCTION public.validate_tenant_relations()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.employees e WHERE e.id = NEW.employee_id AND e.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'Employee belongs to another company';
  END IF;
  IF NEW.process_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.processes p WHERE p.id = NEW.process_id AND p.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'Process belongs to another company';
  END IF;
  IF NEW.technology_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.technologies t WHERE t.id = NEW.technology_id AND t.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'Technology belongs to another company';
  END IF;
  IF to_jsonb(NEW) ? 'client_id' AND (to_jsonb(NEW)->>'client_id') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = (to_jsonb(NEW)->>'client_id')::uuid AND c.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'Client belongs to another company';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER validate_employee_capability_tenant
BEFORE INSERT OR UPDATE ON public.employee_capabilities
FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_relations();

CREATE TRIGGER validate_knowledge_activity_tenant
BEFORE INSERT OR UPDATE ON public.knowledge_activities
FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_relations();

CREATE POLICY "Members keep membership tenant" ON public.company_members AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));
CREATE POLICY "Editors keep employee tenant" ON public.employees AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep process tenant" ON public.processes AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep technology tenant" ON public.technologies AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep client tenant" ON public.clients AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep capability tenant" ON public.employee_capabilities AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep activity tenant" ON public.knowledge_activities AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep diagnostic tenant" ON public.diagnostics AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep answer tenant" ON public.diagnostic_answers AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep indicator tenant" ON public.risk_indicators AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep ticket tenant" ON public.tickets AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep classification tenant" ON public.ticket_classifications AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Editors keep recommendation tenant" ON public.mitigation_recommendations AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin','manager','analyst']::public.app_role[]));
CREATE POLICY "Admins keep risk config tenant" ON public.risk_configurations AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_company_role(company_id, ARRAY['admin']::public.app_role[])) WITH CHECK (public.has_company_role(company_id, ARRAY['admin']::public.app_role[]));