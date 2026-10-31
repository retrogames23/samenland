CREATE TABLE public.tax_receipts (seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE, day integer NOT NULL CHECK(day>0), population integer NOT NULL CHECK(population>=0), households integer NOT NULL CHECK(households>=0), income integer NOT NULL CHECK(income>=0), assessed_at timestamptz NOT NULL, version integer NOT NULL DEFAULT 1, PRIMARY KEY(seed_id,day));
GRANT SELECT ON public.tax_receipts TO authenticated;
GRANT ALL ON public.tax_receipts TO service_role;
ALTER TABLE public.tax_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads tax receipts" ON public.tax_receipts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id=seed_id AND s.user_id=auth.uid()));
CREATE TABLE public.tax_cutover (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.tax_cutover TO anon, authenticated;
GRANT ALL ON public.tax_cutover TO service_role;
ALTER TABLE public.tax_cutover ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read tax rules start" ON public.tax_cutover FOR SELECT TO anon, authenticated USING(true);
CREATE OR REPLACE FUNCTION public.tax_receipt_start() RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT at FROM public.tax_cutover WHERE singleton $$;
REVOKE ALL ON FUNCTION public.tax_receipt_start() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tax_receipt_start() TO authenticated, service_role;
COMMENT ON TABLE public.tax_cutover IS 'Receipt taxation stays inactive until the server deployment is ready; an absent row preserves legacy balances.';
COMMENT ON TABLE public.tax_receipts IS 'Server-derived daily economic receipts, not simulation or growth state. Existing earnings before cutover are retained.';
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.village_estate_tax(uuid,timestamptz)'::regprocedure) INTO definition;
 definition:=replace(definition,'public.village_estate_tax(', 'public.village_estate_tax_legacy(');
 EXECUTE definition;
END $$;
REVOKE ALL ON FUNCTION public.village_estate_tax_legacy(uuid,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.village_estate_tax_legacy(uuid,timestamptz) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.village_estate_tax(_seed uuid, _at timestamptz) RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE cut timestamptz; created timestamptz; first_day integer; days integer; earned integer;
BEGIN
 cut:=public.tax_receipt_start();
 IF cut IS NULL OR _at<cut THEN RETURN public.village_estate_tax_legacy(_seed,_at); END IF;
 SELECT created_at INTO created FROM public.seeds WHERE id=_seed;
 IF created IS NULL THEN RETURN 0; END IF;
 first_day:=greatest(1,ceil(extract(epoch FROM (cut-created))/86400)::integer);
 days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);
 earned:=public.village_estate_tax_legacy(_seed,created+make_interval(days=>least(days,first_day-1)));
 RETURN earned+coalesce((SELECT sum(income)::integer FROM public.tax_receipts WHERE seed_id=_seed AND day>=first_day AND day<=days),0);
END $$;
REVOKE ALL ON FUNCTION public.village_estate_tax(uuid,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.village_estate_tax(uuid,timestamptz) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.tax_spend_lock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE sid uuid; BEGIN
 sid:=CASE WHEN TG_TABLE_NAME='gifts' THEN (to_jsonb(NEW)->>'from_seed')::uuid ELSE (to_jsonb(NEW)->>'seed_id')::uuid END;
 PERFORM 1 FROM public.seeds WHERE id=sid FOR UPDATE;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.tax_spend_lock() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER a_tax_spend_lock BEFORE INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.tax_spend_lock();
CREATE TRIGGER a_tax_spend_lock BEFORE INSERT ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.tax_spend_lock();
CREATE TRIGGER a_tax_spend_lock BEFORE INSERT ON public.gifts FOR EACH ROW EXECUTE FUNCTION public.tax_spend_lock();
CREATE TRIGGER a_tax_spend_lock BEFORE INSERT ON public.twin_works FOR EACH ROW EXECUTE FUNCTION public.tax_spend_lock();