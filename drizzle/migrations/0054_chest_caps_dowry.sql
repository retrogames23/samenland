CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; owner uuid; spent integer; ev integer; tw integer; gi integer; qr integer; mk integer; rf integer; vv integer;
 dw integer; dold integer:=0; dnew integer; base integer; cap integer; since timestamptz := timestamptz '2026-10-31 00:00:00+00';
BEGIN
  SELECT s.created_at, s.user_id INTO created, owner FROM public.seeds s WHERE s.id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO mk FROM public.market_sales WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO rf FROM public.referrals WHERE referrer_seed = _seed OR referee_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO vv FROM public.village_visits WHERE visitor_seed = _seed;
  SELECT coalesce(w.dowry,0) INTO dw FROM public.village_weddings(_seed, now()) w;
  IF created < since THEN SELECT coalesce(w.dowry,0) INTO dold FROM public.village_weddings(_seed, least(now(), since)) w; END IF;
  dw := coalesce(dw,0); dold := coalesce(dold,0); dnew := dw - dold;
  base := 160 + public.village_capped_tax(_seed, now()) - spent - ev - tw + gi + qr + mk + rf + vv;
  IF owner IS NOT NULL THEN
    SELECT CASE WHEN bool_or(item='chest4') THEN 15000 WHEN bool_or(item='chest3') THEN 6000 WHEN bool_or(item='chest2') THEN 2500 ELSE 800 END
      INTO cap FROM public.purchases WHERE seed_id = _seed AND item LIKE 'chest%';
    cap := coalesce(cap, 800);
    dnew := least(dnew, greatest(0, cap - base - dold));
  END IF;
  RETURN base + dold + dnew - public.village_raids(_seed, created, now());
END $function$;