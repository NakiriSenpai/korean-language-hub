-- =============================================================================
-- complete_migration.sql
-- Full backend bundle for manual execution in the Supabase SQL Editor.
-- Target: an EMPTY Supabase project (no public-schema objects).
--
-- Source: every file in supabase/migrations/, replayed in chronological order.
--   20260805014532 .. 20260805110245  (16 original migrations)
--   20260805121319                    (consolidated restore == the 16 above)
--   20260805172317 .. 20260805173028  (chunked replay of the same consolidated set)
-- The three series are byte-for-byte equivalent in the objects they create
-- (verified: 38 tables, 22 enums, 44 indexes, 41 triggers, 129 policies in each).
-- Replaying them all would fail with "type already exists", so this bundle
-- contains the single canonical, dependency-ordered superset.
--
-- Nothing was simplified: all enums, tables, indexes, foreign keys, functions,
-- triggers, RLS, policies, grants/revokes, storage policies and seed data are
-- present, in original order.
--
-- Only edit vs. source: `ALTER TYPE public.tenant_status ADD VALUE 'archived'`
-- is inlined into the CREATE TYPE, because Postgres forbids using a newly added
-- enum value inside the same transaction, and the SQL Editor runs one transaction.
--
-- Execution: paste this whole file into the Supabase SQL Editor and Run once.
-- =============================================================================

-- =============================================================
-- Consolidated schema restore (16 migrations)
-- =============================================================
-- FILE 1: enums, profiles, tenants, memberships, role_permissions, helpers, policies, triggers, permission matrix
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'instructor', 'staff', 'student');
CREATE TYPE public.membership_status AS ENUM ('invited', 'active', 'suspended', 'revoked');
CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'archived');

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

-- FILE 2: revoke on internal functions
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.shares_tenant_with(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid, public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_tenant_with(uuid, uuid) TO authenticated;

-- FILE 3: academic domain
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

-- FILE 4: learning domain
CREATE TYPE public.content_status AS ENUM ('draft','published','archived');
CREATE TYPE public.block_type AS ENUM ('text','image','audio','video','quote','divider','callout');
CREATE TYPE public.progress_status AS ENUM ('not_started','in_progress','completed');
CREATE TYPE public.learning_target AS ENUM ('lesson','unit');

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  level text,
  cover_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY courses_select ON public.courses FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid())
    AND (status = 'published' OR public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[])));
CREATE POLICY courses_write ON public.courses FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  status public.content_status NOT NULL DEFAULT 'draft',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX course_modules_course_idx ON public.course_modules(course_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_modules_select ON public.course_modules FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid())
    AND (status = 'published' OR public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[])));
CREATE POLICY course_modules_write ON public.course_modules FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER course_modules_set_updated_at BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  estimated_minutes integer NOT NULL DEFAULT 10,
  status public.content_status NOT NULL DEFAULT 'draft',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_module_idx ON public.lessons(module_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY lessons_select ON public.lessons FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid())
    AND (status = 'published' OR public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[])));
CREATE POLICY lessons_write ON public.lessons FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER lessons_set_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lesson_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lesson_units_lesson_idx ON public.lesson_units(lesson_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_units TO authenticated;
GRANT ALL ON public.lesson_units TO service_role;
ALTER TABLE public.lesson_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY lesson_units_select ON public.lesson_units FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY lesson_units_write ON public.lesson_units FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER lesson_units_set_updated_at BEFORE UPDATE ON public.lesson_units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lesson_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.lesson_units(id) ON DELETE CASCADE,
  type public.block_type NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lesson_blocks_unit_idx ON public.lesson_blocks(unit_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_blocks TO authenticated;
GRANT ALL ON public.lesson_blocks TO service_role;
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY lesson_blocks_select ON public.lesson_blocks FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY lesson_blocks_write ON public.lesson_blocks FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER lesson_blocks_set_updated_at BEFORE UPDATE ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.learning_target NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.lesson_units(id) ON DELETE CASCADE,
  status public.progress_status NOT NULL DEFAULT 'in_progress',
  percent integer NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  last_position integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX learning_progress_lesson_unique ON public.learning_progress(tenant_id, user_id, lesson_id) WHERE target_type = 'lesson';
CREATE UNIQUE INDEX learning_progress_unit_unique ON public.learning_progress(tenant_id, user_id, unit_id) WHERE target_type = 'unit';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_progress TO authenticated;
GRANT ALL ON public.learning_progress TO service_role;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_progress_select ON public.learning_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY learning_progress_insert ON public.learning_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY learning_progress_update ON public.learning_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY learning_progress_delete ON public.learning_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER learning_progress_set_updated_at BEFORE UPDATE ON public.learning_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.learning_target NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.lesson_units(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX bookmarks_lesson_unique ON public.bookmarks(tenant_id, user_id, lesson_id) WHERE target_type = 'lesson';
CREATE UNIQUE INDEX bookmarks_unit_unique ON public.bookmarks(tenant_id, user_id, unit_id) WHERE target_type = 'unit';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookmarks_all ON public.bookmarks FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.is_tenant_member(tenant_id, auth.uid()));
CREATE TRIGGER bookmarks_set_updated_at BEFORE UPDATE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.continue_learning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.lesson_units(id) ON DELETE SET NULL,
  last_position integer NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, lesson_id)
);
CREATE INDEX continue_learning_recent_idx ON public.continue_learning(tenant_id, user_id, opened_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.continue_learning TO authenticated;
GRANT ALL ON public.continue_learning TO service_role;
ALTER TABLE public.continue_learning ENABLE ROW LEVEL SECURITY;
CREATE POLICY continue_learning_all ON public.continue_learning FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.is_tenant_member(tenant_id, auth.uid()));
CREATE TRIGGER continue_learning_set_updated_at BEFORE UPDATE ON public.continue_learning FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FILE 5: knowledge domain
CREATE TYPE public.knowledge_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.knowledge_kind AS ENUM ('grammar', 'vocabulary', 'conversation', 'culture_note', 'eps_reference');

CREATE TABLE public.grammars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  difficulty public.knowledge_difficulty NOT NULL DEFAULT 'beginner',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  thumbnail_url text,
  cover_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  pattern text,
  meaning text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grammars TO authenticated;
GRANT ALL ON public.grammars TO service_role;
ALTER TABLE public.grammars ENABLE ROW LEVEL SECURITY;
CREATE POLICY grammars_select ON public.grammars FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY grammars_insert ON public.grammars FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY grammars_update ON public.grammars FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY grammars_delete ON public.grammars FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE UNIQUE INDEX grammars_tenant_slug_key ON public.grammars (tenant_id, slug);
CREATE INDEX grammars_tenant_status_idx ON public.grammars (tenant_id, status);
CREATE INDEX grammars_tenant_difficulty_idx ON public.grammars (tenant_id, difficulty);
CREATE INDEX grammars_tags_idx ON public.grammars USING gin (tags);
CREATE TRIGGER grammars_set_updated_at BEFORE UPDATE ON public.grammars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.vocabularies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  difficulty public.knowledge_difficulty NOT NULL DEFAULT 'beginner',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  thumbnail_url text,
  cover_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  hangeul text,
  romanization text,
  meaning text,
  audio_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vocabularies TO authenticated;
GRANT ALL ON public.vocabularies TO service_role;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
CREATE POLICY vocabularies_select ON public.vocabularies FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY vocabularies_insert ON public.vocabularies FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY vocabularies_update ON public.vocabularies FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY vocabularies_delete ON public.vocabularies FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE UNIQUE INDEX vocabularies_tenant_slug_key ON public.vocabularies (tenant_id, slug);
CREATE INDEX vocabularies_tenant_status_idx ON public.vocabularies (tenant_id, status);
CREATE INDEX vocabularies_tenant_difficulty_idx ON public.vocabularies (tenant_id, difficulty);
CREATE INDEX vocabularies_tags_idx ON public.vocabularies USING gin (tags);
CREATE TRIGGER vocabularies_set_updated_at BEFORE UPDATE ON public.vocabularies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  difficulty public.knowledge_difficulty NOT NULL DEFAULT 'beginner',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  thumbnail_url text,
  cover_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  situation text,
  audio_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_select ON public.conversations FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY conversations_insert ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY conversations_update ON public.conversations FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY conversations_delete ON public.conversations FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE UNIQUE INDEX conversations_tenant_slug_key ON public.conversations (tenant_id, slug);
CREATE INDEX conversations_tenant_status_idx ON public.conversations (tenant_id, status);
CREATE INDEX conversations_tenant_difficulty_idx ON public.conversations (tenant_id, difficulty);
CREATE INDEX conversations_tags_idx ON public.conversations USING gin (tags);
CREATE TRIGGER conversations_set_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.culture_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  difficulty public.knowledge_difficulty NOT NULL DEFAULT 'beginner',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  thumbnail_url text,
  cover_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  region text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.culture_notes TO authenticated;
GRANT ALL ON public.culture_notes TO service_role;
ALTER TABLE public.culture_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY culture_notes_select ON public.culture_notes FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY culture_notes_insert ON public.culture_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY culture_notes_update ON public.culture_notes FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY culture_notes_delete ON public.culture_notes FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE UNIQUE INDEX culture_notes_tenant_slug_key ON public.culture_notes (tenant_id, slug);
CREATE INDEX culture_notes_tenant_status_idx ON public.culture_notes (tenant_id, status);
CREATE INDEX culture_notes_tenant_difficulty_idx ON public.culture_notes (tenant_id, difficulty);
CREATE INDEX culture_notes_tags_idx ON public.culture_notes USING gin (tags);
CREATE TRIGGER culture_notes_set_updated_at BEFORE UPDATE ON public.culture_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.eps_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  difficulty public.knowledge_difficulty NOT NULL DEFAULT 'beginner',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  thumbnail_url text,
  cover_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  reference_code text,
  source_year integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eps_references TO authenticated;
GRANT ALL ON public.eps_references TO service_role;
ALTER TABLE public.eps_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY eps_references_select ON public.eps_references FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY eps_references_insert ON public.eps_references FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY eps_references_update ON public.eps_references FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY eps_references_delete ON public.eps_references FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE UNIQUE INDEX eps_references_tenant_slug_key ON public.eps_references (tenant_id, slug);
CREATE INDEX eps_references_tenant_status_idx ON public.eps_references (tenant_id, status);
CREATE INDEX eps_references_tenant_difficulty_idx ON public.eps_references (tenant_id, difficulty);
CREATE INDEX eps_references_tags_idx ON public.eps_references USING gin (tags);
CREATE TRIGGER eps_references_set_updated_at BEFORE UPDATE ON public.eps_references
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.knowledge_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type public.knowledge_kind NOT NULL,
  item_id uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_favorites TO authenticated;
GRANT ALL ON public.knowledge_favorites TO service_role;
ALTER TABLE public.knowledge_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_favorites_select ON public.knowledge_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY knowledge_favorites_insert ON public.knowledge_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY knowledge_favorites_update ON public.knowledge_favorites FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY knowledge_favorites_delete ON public.knowledge_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE UNIQUE INDEX knowledge_favorites_unique ON public.knowledge_favorites (tenant_id, user_id, item_type, item_id);
CREATE INDEX knowledge_favorites_user_idx ON public.knowledge_favorites (tenant_id, user_id);
CREATE TRIGGER knowledge_favorites_set_updated_at BEFORE UPDATE ON public.knowledge_favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FILE 6: assessment domain
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'multiple_response', 'true_false', 'short_answer');
CREATE TYPE public.question_skill AS ENUM ('reading', 'listening');
CREATE TYPE public.assessment_type AS ENUM ('exam', 'quiz', 'practice', 'tryout');

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  public_id text NOT NULL,
  type public.question_type NOT NULL,
  skill public.question_skill NOT NULL DEFAULT 'reading',
  difficulty public.knowledge_difficulty NOT NULL DEFAULT 'beginner',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  source text,
  language text NOT NULL DEFAULT 'ko',
  status public.content_status NOT NULL DEFAULT 'draft',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  current_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT questions_public_id_unique UNIQUE (tenant_id, public_id),
  CONSTRAINT questions_current_version_positive CHECK (current_version >= 1)
);
CREATE INDEX questions_tenant_status_idx ON public.questions (tenant_id, status);
CREATE INDEX questions_tenant_type_idx ON public.questions (tenant_id, type);
CREATE INDEX questions_tags_idx ON public.questions USING gin (tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select_members" ON public.questions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "questions_insert_authors" ON public.questions FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "questions_update_authors" ON public.questions FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "questions_delete_authors" ON public.questions FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER questions_set_updated_at BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.question_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  version integer NOT NULL,
  type public.question_type NOT NULL,
  skill public.question_skill NOT NULL DEFAULT 'reading',
  difficulty public.knowledge_difficulty NOT NULL DEFAULT 'beginner',
  prompt text NOT NULL,
  passage text,
  audio_url text,
  explanation text,
  answer_key text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  source text,
  language text NOT NULL DEFAULT 'ko',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_versions_unique UNIQUE (question_id, version),
  CONSTRAINT question_versions_version_positive CHECK (version >= 1)
);
CREATE INDEX question_versions_question_idx ON public.question_versions (question_id, version DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_versions TO authenticated;
GRANT ALL ON public.question_versions TO service_role;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_versions_select_members" ON public.question_versions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "question_versions_insert_authors" ON public.question_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "question_versions_update_authors" ON public.question_versions FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "question_versions_delete_authors" ON public.question_versions FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER question_versions_set_updated_at BEFORE UPDATE ON public.question_versions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.question_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  question_version_id uuid NOT NULL REFERENCES public.question_versions(id) ON DELETE CASCADE,
  label text,
  content text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX question_choices_version_idx ON public.question_choices (question_version_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_choices TO authenticated;
GRANT ALL ON public.question_choices TO service_role;
ALTER TABLE public.question_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_choices_select_members" ON public.question_choices FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "question_choices_insert_authors" ON public.question_choices FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "question_choices_update_authors" ON public.question_choices FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "question_choices_delete_authors" ON public.question_choices FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER question_choices_set_updated_at BEFORE UPDATE ON public.question_choices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  type public.assessment_type NOT NULL DEFAULT 'quiz',
  status public.content_status NOT NULL DEFAULT 'draft',
  difficulty public.knowledge_difficulty NOT NULL DEFAULT 'beginner',
  duration_minutes integer NOT NULL DEFAULT 0,
  passing_score integer NOT NULL DEFAULT 0,
  randomize_questions boolean NOT NULL DEFAULT false,
  randomize_choices boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  published_version integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assessments_slug_unique UNIQUE (tenant_id, slug),
  CONSTRAINT assessments_duration_valid CHECK (duration_minutes >= 0),
  CONSTRAINT assessments_passing_valid CHECK (passing_score >= 0 AND passing_score <= 100)
);
CREATE INDEX assessments_tenant_type_idx ON public.assessments (tenant_id, type, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessments_select_members" ON public.assessments FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "assessments_insert_authors" ON public.assessments FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "assessments_update_authors" ON public.assessments FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "assessments_delete_authors" ON public.assessments FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER assessments_set_updated_at BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_version_id uuid NOT NULL REFERENCES public.question_versions(id) ON DELETE RESTRICT,
  position integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assessment_questions_unique UNIQUE (assessment_id, question_id),
  CONSTRAINT assessment_questions_points_valid CHECK (points >= 1)
);
CREATE INDEX assessment_questions_assessment_idx ON public.assessment_questions (assessment_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_questions TO service_role;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessment_questions_select_members" ON public.assessment_questions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "assessment_questions_insert_authors" ON public.assessment_questions FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "assessment_questions_update_authors" ON public.assessment_questions FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]))
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE POLICY "assessment_questions_delete_authors" ON public.assessment_questions FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));
CREATE TRIGGER assessment_questions_set_updated_at BEFORE UPDATE ON public.assessment_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assessment_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  version integer NOT NULL,
  payload jsonb NOT NULL,
  question_count integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assessment_snapshots_unique UNIQUE (assessment_id, version),
  CONSTRAINT assessment_snapshots_version_positive CHECK (version >= 1)
);
CREATE INDEX assessment_snapshots_assessment_idx ON public.assessment_snapshots (assessment_id, version DESC);
GRANT SELECT, INSERT ON public.assessment_snapshots TO authenticated;
GRANT ALL ON public.assessment_snapshots TO service_role;
ALTER TABLE public.assessment_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessment_snapshots_select_members" ON public.assessment_snapshots FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "assessment_snapshots_insert_authors" ON public.assessment_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor']::app_role[]));

-- FILE 7: exam engine
CREATE TYPE public.attempt_status AS ENUM ('draft', 'in_progress', 'submitted', 'expired', 'abandoned');

CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES public.assessment_snapshots(id) ON DELETE RESTRICT,
  snapshot_version integer NOT NULL DEFAULT 1,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.attempt_status NOT NULL DEFAULT 'draft',
  question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_minutes integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  expires_at timestamptz,
  submitted_at timestamptz,
  last_saved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exam_attempts_tenant_user_idx ON public.exam_attempts (tenant_id, user_id, status);
CREATE INDEX exam_attempts_assessment_idx ON public.exam_attempts (tenant_id, assessment_id);
CREATE UNIQUE INDEX exam_attempts_one_active_idx
  ON public.exam_attempts (tenant_id, assessment_id, user_id)
  WHERE status IN ('draft', 'in_progress');
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read own attempts" ON public.exam_attempts
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id, auth.uid())
    AND (
      user_id = auth.uid()
      OR public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor','staff']::app_role[])
    )
  );
CREATE POLICY "Participants start own attempts" ON public.exam_attempts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Participants update own attempts" ON public.exam_attempts
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid())
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Managers delete attempts" ON public.exam_attempts
  FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER exam_attempts_set_updated_at
  BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL,
  question_version_id uuid NOT NULL,
  selected_choice_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  text_answer text,
  flagged boolean NOT NULL DEFAULT false,
  audio_plays integer NOT NULL DEFAULT 0,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_version_id)
);
CREATE INDEX attempt_answers_attempt_idx ON public.attempt_answers (tenant_id, attempt_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read answers of visible attempts" ON public.attempt_answers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exam_attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND public.is_tenant_member(a.tenant_id, auth.uid())
      AND (
        a.user_id = auth.uid()
        OR public.has_tenant_role(a.tenant_id, auth.uid(), ARRAY['owner','admin','instructor','staff']::app_role[])
      )
  ));
CREATE POLICY "Write answers of own open attempts" ON public.attempt_answers
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exam_attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = auth.uid()
      AND a.status IN ('draft', 'in_progress')
      AND a.tenant_id = attempt_answers.tenant_id
  ));
CREATE POLICY "Update answers of own open attempts" ON public.attempt_answers
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exam_attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = auth.uid()
      AND a.status IN ('draft', 'in_progress')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exam_attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = auth.uid()
      AND a.status IN ('draft', 'in_progress')
  ));
CREATE POLICY "Managers delete answers" ON public.attempt_answers
  FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER attempt_answers_set_updated_at
  BEFORE UPDATE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  empty_count integer NOT NULL DEFAULT 0,
  earned_points integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'E',
  passed boolean NOT NULL DEFAULT false,
  time_used_seconds integer NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exam_results_tenant_user_idx ON public.exam_results (tenant_id, user_id);
CREATE INDEX exam_results_assessment_idx ON public.exam_results (tenant_id, assessment_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_results TO authenticated;
GRANT ALL ON public.exam_results TO service_role;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or tenant results" ON public.exam_results
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id, auth.uid())
    AND (
      user_id = auth.uid()
      OR public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin','instructor','staff']::app_role[])
    )
  );
CREATE POLICY "Insert own result" ON public.exam_results
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Update own result" ON public.exam_results
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid())
  WITH CHECK (public.is_tenant_member(tenant_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Managers delete results" ON public.exam_results
  FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id, auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER exam_results_set_updated_at
  BEFORE UPDATE ON public.exam_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.role_permissions (role, permission)
SELECT r.role, p.permission
FROM (VALUES
  ('owner'::app_role), ('admin'::app_role), ('instructor'::app_role), ('staff'::app_role), ('student'::app_role)
) AS r(role)
CROSS JOIN (VALUES ('exam.start'), ('exam.submit'), ('exam.review'), ('result.read')) AS p(permission)
WHERE NOT (r.role = 'staff'::app_role AND p.permission IN ('exam.start', 'exam.submit'))
ON CONFLICT DO NOTHING;

-- FILE 8: analytics permissions
INSERT INTO public.role_permissions (role, permission) VALUES
  ('owner','analytics.export'),
  ('owner','analytics.platform'),
  ('admin','analytics.export'),
  ('instructor','analytics.export'),
  ('staff','analytics.read'),
  ('student','analytics.read')
ON CONFLICT DO NOTHING;

-- FILE 9: platform admin domain
-- 'archived' is already part of public.tenant_status (declared at creation time above);
-- the original ALTER TYPE ... ADD VALUE is intentionally inlined so this bundle runs in one transaction.

CREATE TYPE public.announcement_status AS ENUM ('draft','published','archived');
CREATE TYPE public.announcement_audience AS ENUM ('platform','tenant','study_group');
CREATE TYPE public.media_kind AS ENUM ('image','audio','video','document');
CREATE TYPE public.cms_block_kind AS ENUM ('banner','carousel','static_page','faq');
CREATE TYPE public.setting_category AS ENUM ('general','academic','assessment','learning','notification','media');

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

-- FILE 10: revoke create_tenant
REVOKE ALL ON FUNCTION public.create_tenant(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text) TO authenticated;

-- FILE 11: audit triggers
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

-- FILE 12: table grant normalization
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

-- FILE 13: function grant normalization
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.sig);
  END LOOP;
END $$;

-- FILE 14: restrict internal functions
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig, p.proname,
                  pg_get_function_result(p.oid) AS ret
           FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public'
  LOOP
    IF f.ret = 'trigger' OR f.proname NOT IN
       ('has_tenant_role','is_tenant_member','shares_tenant_with','create_tenant') THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    END IF;
  END LOOP;
END $$;

-- FILE 15: default tenant bootstrap + storage policies
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

DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
CREATE POLICY "Public can read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Members can upload media" ON storage.objects;
CREATE POLICY "Members can upload media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Members can update media" ON storage.objects;
CREATE POLICY "Members can update media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "Members can delete media" ON storage.objects;
CREATE POLICY "Members can delete media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owners can read documents" ON storage.objects;
CREATE POLICY "Owners can read documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owners can write documents" ON storage.objects;
CREATE POLICY "Owners can write documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owners can delete documents" ON storage.objects;
CREATE POLICY "Owners can delete documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documents' AND owner = auth.uid());

-- FILE 16: final revokes
REVOKE EXECUTE ON FUNCTION public.default_tenant_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_membership() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_assessment_publish() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_membership_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_tenant_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_study_group_capacity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.shares_tenant_with(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_tenant(text, text) FROM anon;


-- =============================================================================
-- SECTION: STORAGE BUCKETS
-- Bucket rows CAN be created from SQL. If your project blocks direct writes to
-- storage.buckets (some hosted projects do), skip this block and follow
-- "MANUAL STEPS" at the bottom of this file instead.
-- The storage.objects policies above already assume these two bucket ids.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION: SEED DATA
-- The default institution. public.handle_new_user_membership() looks up the
-- tenant with slug = 'default' and grants the FIRST sign-up the 'owner' role,
-- every later sign-up the 'student' role. Without this row the trigger is a
-- no-op and nobody gets a membership.
-- (public.role_permissions is seeded inline earlier in this file.)
-- =============================================================================

INSERT INTO public.tenants (slug, name, status)
VALUES ('default', 'Lembaga Default', 'active')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- MANUAL STEPS (only if the storage bucket INSERTs above were skipped/failed)
-- =============================================================================
-- 1. Supabase Dashboard -> Storage -> New bucket
--      Name: media        Public: OFF (private)
--      Read access is granted by the "Public can read media" policy in this file.
-- 2. Supabase Dashboard -> Storage -> New bucket
--      Name: documents    Public: OFF (private)
-- 3. Auth -> Providers: enable Email (and Google if used). Auto-confirm stays OFF.
-- 4. Auth -> URL Configuration: set Site URL + Redirect URLs to your app origin.
-- 5. Update the app env vars to the new project:
--      VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY,
--      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server side only).
-- 6. Regenerate src/integrations/supabase/types.ts against the new project.
-- Note: the triggers on auth.users (on_auth_user_created,
-- on_auth_user_created_membership) ARE created by this script - no manual work.
-- =============================================================================
