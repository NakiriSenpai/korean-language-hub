-- Knowledge Domain ---------------------------------------------------------

CREATE TYPE public.knowledge_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.knowledge_kind AS ENUM ('grammar', 'vocabulary', 'conversation', 'culture_note', 'eps_reference');

-- 1. GRAMMARS ---------------------------------------------------------------
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

-- 2. VOCABULARIES -----------------------------------------------------------
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

-- 3. CONVERSATIONS ----------------------------------------------------------
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

-- 4. CULTURE NOTES ----------------------------------------------------------
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

-- 5. EPS REFERENCES ---------------------------------------------------------
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

-- 6. KNOWLEDGE FAVORITES ----------------------------------------------------
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