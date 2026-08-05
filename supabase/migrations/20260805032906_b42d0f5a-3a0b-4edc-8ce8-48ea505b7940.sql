-- Lifecycle
ALTER TYPE public.tenant_status ADD VALUE IF NOT EXISTS 'archived';

CREATE TYPE public.announcement_status AS ENUM ('draft','published','archived');
CREATE TYPE public.announcement_audience AS ENUM ('platform','tenant','study_group');
CREATE TYPE public.media_kind AS ENUM ('image','audio','video','document');
CREATE TYPE public.cms_block_kind AS ENUM ('banner','carousel','static_page','faq');
CREATE TYPE public.setting_category AS ENUM ('general','academic','assessment','learning','notification','media');

-- ============================ tenant_branding ============================
CREATE TABLE public.tenant_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  logo_url text,
  cover_url text,
  primary_color text,
  secondary_color text,
  contact_email text,
  contact_phone text,
  address text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_branding TO authenticated;
GRANT ALL ON public.tenant_branding TO service_role;
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_branding_select ON public.tenant_branding FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY tenant_branding_insert ON public.tenant_branding FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE POLICY tenant_branding_update ON public.tenant_branding FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER tenant_branding_set_updated_at BEFORE UPDATE ON public.tenant_branding
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================ system_settings ============================
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category public.setting_category NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_settings_select ON public.system_settings FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY system_settings_insert ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE POLICY system_settings_update ON public.system_settings FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER system_settings_set_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================== audit_logs ===============================
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_tenant_created_idx ON public.audit_logs (tenant_id, created_at DESC);
CREATE INDEX audit_logs_action_idx ON public.audit_logs (action);
-- Deliberately no UPDATE/DELETE grants: the audit trail is append only.
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING (
    actor_user_id = auth.uid()
    OR (tenant_id IS NOT NULL
        AND public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]))
  );
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(tenant_id, auth.uid()))
  );

-- ============================= announcements =============================
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience public.announcement_audience NOT NULL DEFAULT 'tenant',
  study_group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
  status public.announcement_status NOT NULL DEFAULT 'draft',
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX announcements_tenant_status_idx ON public.announcements (tenant_id, status, published_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY announcements_select ON public.announcements FOR SELECT TO authenticated
  USING (
    (status = 'published' AND public.is_tenant_member(tenant_id, auth.uid()))
    OR public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[])
  );
CREATE POLICY announcements_insert ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY announcements_update ON public.announcements FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY announcements_delete ON public.announcements FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER announcements_set_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================== media_assets =============================
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind public.media_kind NOT NULL,
  title text NOT NULL,
  public_id text NOT NULL,
  url text NOT NULL,
  format text,
  bytes bigint,
  width integer,
  height integer,
  duration_seconds numeric,
  folder text,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_assets_tenant_kind_idx ON public.media_assets (tenant_id, kind, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_assets_select ON public.media_assets FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY media_assets_insert ON public.media_assets FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY media_assets_update ON public.media_assets FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY media_assets_delete ON public.media_assets FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER media_assets_set_updated_at BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================== cms_blocks ==============================
CREATE TABLE public.cms_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind public.cms_block_kind NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  body text,
  image_url text,
  link_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  position integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, kind, slug)
);
CREATE INDEX cms_blocks_tenant_kind_idx ON public.cms_blocks (tenant_id, kind, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_blocks TO authenticated;
GRANT ALL ON public.cms_blocks TO service_role;
ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY cms_blocks_select ON public.cms_blocks FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY cms_blocks_insert ON public.cms_blocks FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE POLICY cms_blocks_update ON public.cms_blocks FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE POLICY cms_blocks_delete ON public.cms_blocks FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER cms_blocks_set_updated_at BEFORE UPDATE ON public.cms_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===================== tenant + membership management ====================
CREATE POLICY tenants_update_owner ON public.tenants FOR UPDATE TO authenticated
  USING (public.has_tenant_role(id, auth.uid(), ARRAY['owner','admin']::app_role[]))
  WITH CHECK (public.has_tenant_role(id, auth.uid(), ARRAY['owner','admin']::app_role[]));

CREATE POLICY memberships_update_owner ON public.memberships FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner']::app_role[]));

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
REVOKE ALL ON FUNCTION public.create_tenant(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text) TO authenticated;

-- ============================== permissions ==============================
INSERT INTO public.role_permissions (role, permission) VALUES
  ('owner','platform.read'),('owner','platform.write'),('owner','audit.read'),
  ('owner','settings.read'),('owner','settings.write'),('owner','branding.write'),
  ('owner','announcement.read'),('owner','announcement.write'),
  ('owner','media.read'),('owner','media.write'),('owner','cms.read'),('owner','cms.write'),
  ('admin','platform.read'),('admin','audit.read'),
  ('admin','settings.read'),('admin','settings.write'),('admin','branding.write'),
  ('admin','announcement.read'),('admin','announcement.write'),
  ('admin','media.read'),('admin','media.write'),('admin','cms.read'),('admin','cms.write'),
  ('instructor','settings.read'),('instructor','announcement.read'),('instructor','announcement.write'),
  ('instructor','media.read'),('instructor','media.write'),('instructor','cms.read'),
  ('staff','settings.read'),('staff','announcement.read'),('staff','media.read'),('staff','cms.read'),
  ('student','announcement.read')
ON CONFLICT DO NOTHING;