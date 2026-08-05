CREATE OR REPLACE FUNCTION public.create_tenant(_slug text, _name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi.' USING ERRCODE = '42501';
  END IF;
  IF _slug !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' THEN
    RAISE EXCEPTION 'Slug hanya boleh huruf kecil, angka, dan tanda minus.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.tenants (slug, name, status)
  VALUES (_slug, btrim(_name), 'active')
  RETURNING id INTO new_id;

  INSERT INTO public.memberships (user_id, tenant_id, role, status)
  VALUES (auth.uid(), new_id, 'owner', 'active');

  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_tenant(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text) TO authenticated;

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

CREATE OR REPLACE FUNCTION public.default_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants WHERE slug = 'default' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_id uuid;
  assigned public.app_role;
BEGIN
  SELECT id INTO t_id FROM public.tenants WHERE slug = 'default' LIMIT 1;
  IF t_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.memberships WHERE tenant_id = t_id AND role = 'owner' AND status = 'active') THEN
    assigned := 'student';
  ELSE
    assigned := 'owner';
  END IF;

  INSERT INTO public.memberships (user_id, tenant_id, role, status)
  VALUES (NEW.id, t_id, assigned, 'active')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_membership ON auth.users;
CREATE TRIGGER on_auth_user_created_membership
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_membership();

INSERT INTO public.tenants (slug, name, status)
VALUES ('default', 'Lembaga Default', 'active')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t.relname);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.relname);
  END LOOP;
END $$;

DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig, p.proname,
                  pg_get_function_result(p.oid) AS ret
           FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    IF f.ret = 'trigger' OR f.proname NOT IN
       ('has_tenant_role','is_tenant_member','shares_tenant_with','create_tenant') THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    ELSE
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.sig);
    END IF;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.shares_tenant_with(uuid, uuid) FROM anon, authenticated, public;