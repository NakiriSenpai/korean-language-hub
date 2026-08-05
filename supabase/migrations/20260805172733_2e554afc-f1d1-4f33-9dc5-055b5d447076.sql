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

INSERT INTO public.role_permissions (role, permission) VALUES
  ('owner','analytics.export'),
  ('owner','analytics.platform'),
  ('admin','analytics.export'),
  ('instructor','analytics.export'),
  ('staff','analytics.read'),
  ('student','analytics.read')
ON CONFLICT DO NOTHING;