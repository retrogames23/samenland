REVOKE SELECT ON public.building_moves FROM anon, authenticated;
GRANT SELECT (id, seed_id, item, x, y, cost, created_at) ON public.building_moves TO anon, authenticated;