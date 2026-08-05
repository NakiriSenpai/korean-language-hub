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