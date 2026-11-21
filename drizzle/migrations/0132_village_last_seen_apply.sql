CREATE OR REPLACE FUNCTION public.village_last_seen(_seeds uuid[])
RETURNS TABLE (seed_id uuid, days_ago integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id,
         GREATEST(0, (now() AT TIME ZONE 'Europe/Berlin')::date - (ua.last_active_at AT TIME ZONE 'Europe/Berlin')::date)::integer
  FROM public.seeds s
  JOIN public.user_activity ua ON ua.user_id = s.user_id
  WHERE auth.uid() IS NOT NULL AND s.id = ANY (_seeds[1:300]);
$$;
REVOKE ALL ON FUNCTION public.village_last_seen(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.village_last_seen(uuid[]) TO authenticated;