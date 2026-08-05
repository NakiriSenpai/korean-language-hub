CREATE OR REPLACE FUNCTION public.audit_tenant_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, summary, metadata)
  VALUES (
    NEW.id, auth.uid(), 'tenant.update', 'tenant', NEW.id::text,
    format('Lembaga %s diperbarui', NEW.name),
    jsonb_build_object(
      'before', jsonb_build_object('name', OLD.name, 'status', OLD.status, 'logo_url', OLD.logo_url),
      'after', jsonb_build_object('name', NEW.name, 'status', NEW.status, 'logo_url', NEW.logo_url)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_audit_update AFTER UPDATE ON public.tenants
  FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION public.audit_tenant_change();

CREATE OR REPLACE FUNCTION public.audit_membership_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, summary, metadata)
    VALUES (NEW.tenant_id, auth.uid(), 'role.grant', 'membership', NEW.id::text,
      format('Peran %s diberikan', NEW.role),
      jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role, 'status', NEW.status));
    RETURN NEW;
  END IF;

  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, summary, metadata)
    VALUES (NEW.tenant_id, auth.uid(), 'role.change', 'membership', NEW.id::text,
      format('Peran diubah dari %s ke %s', OLD.role, NEW.role),
      jsonb_build_object('user_id', NEW.user_id, 'from', OLD.role, 'to', NEW.role));
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, summary, metadata)
    VALUES (NEW.tenant_id, auth.uid(), 'membership.status', 'membership', NEW.id::text,
      format('Status keanggotaan diubah dari %s ke %s', OLD.status, NEW.status),
      jsonb_build_object('user_id', NEW.user_id, 'from', OLD.status, 'to', NEW.status));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER memberships_audit AFTER INSERT OR UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.audit_membership_change();

CREATE OR REPLACE FUNCTION public.audit_assessment_publish()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.published_version IS DISTINCT FROM OLD.published_version AND NEW.published_version > 0 THEN
    INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, summary, metadata)
    VALUES (NEW.tenant_id, auth.uid(), 'assessment.publish', 'assessment', NEW.id::text,
      format('Asesmen %s dipublikasikan (versi %s)', NEW.title, NEW.published_version),
      jsonb_build_object('title', NEW.title, 'version', NEW.published_version, 'type', NEW.type));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assessments_audit_publish AFTER UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.audit_assessment_publish();

REVOKE ALL ON FUNCTION public.audit_tenant_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_membership_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_assessment_publish() FROM PUBLIC, anon, authenticated;