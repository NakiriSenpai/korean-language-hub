-- Default tenant bootstrap: new sign-ups automatically join the default institution.
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

-- Storage policies for the media bucket (buckets themselves are created via the storage tool).
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