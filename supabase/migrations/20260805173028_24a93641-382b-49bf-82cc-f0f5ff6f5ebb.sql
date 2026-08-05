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