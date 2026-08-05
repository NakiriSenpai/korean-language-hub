REVOKE ALL ON FUNCTION public.create_tenant(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text) TO authenticated;