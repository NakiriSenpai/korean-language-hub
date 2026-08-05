CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'instructor', 'staff', 'student');
CREATE TYPE public.membership_status AS ENUM ('invited', 'active', 'suspended', 'revoked');
CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  status public.tenant_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  status public.membership_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);
GRANT SELECT ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission text NOT NULL,
  UNIQUE (role, permission)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = _tenant_id AND m.user_id = _user_id AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id uuid, _user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = _tenant_id AND m.user_id = _user_id
      AND m.status = 'active' AND m.role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_tenant_with(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships a
    JOIN public.memberships b ON a.tenant_id = b.tenant_id
    WHERE a.user_id = _user_id AND b.user_id = _other_user_id
      AND a.status = 'active' AND b.status = 'active'
  );
$$;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.shares_tenant_with(auth.uid(), id));
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "tenants_select_member" ON public.tenants
  FOR SELECT TO authenticated USING (public.is_tenant_member(id, auth.uid()));

CREATE POLICY "memberships_select_own" ON public.memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));

CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tenants_set_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER memberships_set_updated_at BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.role_permissions (role, permission) VALUES
  ('owner','identity.read'),('owner','identity.write'),('owner','learning.read'),('owner','learning.write'),('owner','assessment.read'),('owner','assessment.write'),('owner','analytics.read'),('owner','tenant.manage'),
  ('admin','identity.read'),('admin','identity.write'),('admin','learning.read'),('admin','learning.write'),('admin','assessment.read'),('admin','assessment.write'),('admin','analytics.read'),
  ('instructor','identity.read'),('instructor','learning.read'),('instructor','learning.write'),('instructor','assessment.read'),('instructor','assessment.write'),('instructor','analytics.read'),
  ('staff','identity.read'),('staff','learning.read'),('staff','assessment.read'),
  ('student','identity.read'),('student','learning.read'),('student','assessment.read');

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.shares_tenant_with(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid, public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_tenant_with(uuid, uuid) TO authenticated;

CREATE TYPE public.academic_period_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE public.study_group_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'suspended', 'dropped');
CREATE TYPE public.teacher_assignment_role AS ENUM ('lead', 'assistant');

CREATE TABLE public.academic_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status public.academic_period_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_periods_range_valid CHECK (ends_on >= starts_on),
  CONSTRAINT academic_periods_code_unique UNIQUE (tenant_id, code)
);
CREATE UNIQUE INDEX academic_periods_single_active
  ON public.academic_periods (tenant_id) WHERE status = 'active';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_periods TO authenticated;
GRANT ALL ON public.academic_periods TO service_role;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY academic_periods_select ON public.academic_periods FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY academic_periods_insert ON public.academic_periods FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY academic_periods_update ON public.academic_periods FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY academic_periods_delete ON public.academic_periods FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE TRIGGER academic_periods_set_updated_at BEFORE UPDATE ON public.academic_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  level text,
  room text,
  capacity integer NOT NULL DEFAULT 20,
  status public.study_group_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_groups_capacity_positive CHECK (capacity > 0 AND capacity <= 1000),
  CONSTRAINT study_groups_code_unique UNIQUE (tenant_id, period_id, code)
);
CREATE INDEX study_groups_period_idx ON public.study_groups (tenant_id, period_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_groups TO authenticated;
GRANT ALL ON public.study_groups TO service_role;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY study_groups_select ON public.study_groups FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY study_groups_insert ON public.study_groups FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY study_groups_update ON public.study_groups FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY study_groups_delete ON public.study_groups FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE TRIGGER study_groups_set_updated_at BEFORE UPDATE ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  student_number text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  birth_date date,
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_profiles_number_unique UNIQUE (tenant_id, student_number)
);
CREATE INDEX student_profiles_tenant_idx ON public.student_profiles (tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_profiles_select ON public.student_profiles FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY student_profiles_insert ON public.student_profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY student_profiles_update ON public.student_profiles FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY student_profiles_delete ON public.student_profiles FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE TRIGGER student_profiles_set_updated_at BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  study_group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  status public.enrollment_status NOT NULL DEFAULT 'active',
  enrolled_on date NOT NULL DEFAULT CURRENT_DATE,
  completed_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_unique_per_period UNIQUE (period_id, student_profile_id)
);
CREATE INDEX enrollments_group_idx ON public.enrollments (study_group_id, status);
CREATE INDEX enrollments_tenant_idx ON public.enrollments (tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY enrollments_select ON public.enrollments FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY enrollments_insert ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::public.app_role[]));
CREATE POLICY enrollments_update ON public.enrollments FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::public.app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::public.app_role[]));
CREATE POLICY enrollments_delete ON public.enrollments FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE TRIGGER enrollments_set_updated_at BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_study_group_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  group_capacity integer;
  active_count integer;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.study_group_id = NEW.study_group_id THEN
    RETURN NEW;
  END IF;

  SELECT capacity INTO group_capacity FROM public.study_groups WHERE id = NEW.study_group_id;
  SELECT count(*) INTO active_count FROM public.enrollments
    WHERE study_group_id = NEW.study_group_id AND status = 'active' AND id <> NEW.id;

  IF group_capacity IS NOT NULL AND active_count >= group_capacity THEN
    RAISE EXCEPTION 'Kapasitas kelompok belajar sudah penuh (% peserta).', group_capacity
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_study_group_capacity() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enrollments_capacity_guard
  BEFORE INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_study_group_capacity();

CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  study_group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_role public.teacher_assignment_role NOT NULL DEFAULT 'lead',
  assigned_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_assignments_unique UNIQUE (study_group_id, teacher_user_id)
);
CREATE INDEX teacher_assignments_tenant_idx ON public.teacher_assignments (tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY teacher_assignments_select ON public.teacher_assignments FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY teacher_assignments_insert ON public.teacher_assignments FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY teacher_assignments_update ON public.teacher_assignments FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY teacher_assignments_delete ON public.teacher_assignments FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::public.app_role[]));
CREATE TRIGGER teacher_assignments_set_updated_at BEFORE UPDATE ON public.teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();