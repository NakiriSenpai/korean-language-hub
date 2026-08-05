INSERT INTO public.role_permissions (role, permission) VALUES
  ('owner','analytics.export'),
  ('owner','analytics.platform'),
  ('admin','analytics.export'),
  ('instructor','analytics.export'),
  ('staff','analytics.read'),
  ('student','analytics.read')
ON CONFLICT DO NOTHING;