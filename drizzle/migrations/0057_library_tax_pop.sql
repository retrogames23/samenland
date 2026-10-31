CREATE OR REPLACE FUNCTION public.village_tax_pop(_seed uuid, _h double precision, _at timestamptz)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r double precision; p integer; owner uuid; f integer; hl integer;
BEGIN
 r:=1.6+0.18*sqrt(_h)+3*ln(1+_h/60);
 p:=floor(3+0.9*power(r,1.6))::integer;
 SELECT user_id INTO owner FROM public.seeds WHERE id=_seed;
 IF owner IS NULL THEN RETURN p; END IF;
 SELECT count(DISTINCT item) INTO f FROM public.purchases WHERE seed_id=_seed AND item IN ('fisher','hunter','granary','dairy') AND created_at<=_at;
 SELECT count(DISTINCT item) INTO hl FROM public.purchases WHERE seed_id=_seed AND item IN ('herbs','healer','library') AND created_at<=_at;
 RETURN least(p, 85+25*f+15*hl);
END $$;