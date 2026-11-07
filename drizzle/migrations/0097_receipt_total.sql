CREATE OR REPLACE FUNCTION public.village_receipt_total(_seed uuid)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT coalesce(sum(income),0)::integer FROM public.tax_receipts WHERE seed_id=_seed $$;
REVOKE ALL ON FUNCTION public.village_receipt_total(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.village_receipt_total(uuid) TO service_role;