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