-- Chest cap for ALL income (from 2026-11-12) + one food-craft definition (fisher, hunter, granary, dairy).
-- Balances at the cutover stay exactly as the old formula computed them; afterwards every booking is walked
-- chronologically (mirrors treasury/walkChest in src/game/economy.ts).

-- 1) Wedding calendar as a list, parameterised by the food-craft list.
CREATE OR REPLACE FUNCTION public.village_wedding_list(_seed uuid, _at timestamptz, _food text[])
 RETURNS TABLE(t timestamptz, dowry integer)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; uid uuid; h double precision; raw integer; st integer; f integer; hl integer;
  r double precision; p integer; w integer; days double precision; cut double precision; gap integer;
  ft timestamptz[]; ht timestamptz[]; x timestamptz; cur timestamptz;
BEGIN
  SELECT date_trunc('milliseconds', s.created_at), s.user_id INTO created, uid FROM public.seeds s WHERE s.id = _seed;
  IF created IS NULL THEN RETURN; END IF;
  SELECT coalesce(array_agg(mt) FILTER (WHERE item = ANY(_food)), '{}'),
         coalesce(array_agg(mt) FILTER (WHERE item IN ('herbs','healer')), '{}')
    INTO ft, ht FROM (SELECT item, min(created_at) mt FROM public.purchases WHERE seed_id=_seed GROUP BY item) q;
  cur := created + interval '2 days';
  WHILE cur <= _at LOOP
    h := greatest(0, extract(epoch FROM (cur - created)) / 3600);
    raw := CASE WHEN h>=8760 THEN 5 WHEN h>=4380 THEN 4 WHEN h>=2160 THEN 3 WHEN h>=168 THEN 2 WHEN h>=24 THEN 1 ELSE 0 END;
    f := 0; hl := 0;
    FOREACH x IN ARRAY ft LOOP IF x <= cur THEN f := f + 1; END IF; END LOOP;
    FOREACH x IN ARRAY ht LOOP IF x <= cur THEN hl := hl + 1; END IF; END LOOP;
    IF uid IS NULL THEN st := raw; ELSE
      st := 2;
      IF f >= 1 THEN st := 3; IF f >= 2 AND hl >= 1 THEN st := 4; IF f >= 3 AND hl >= 2 THEN st := 5; END IF; END IF; END IF;
      st := least(raw, st);
    END IF;
    r := 1.6 + 0.18*sqrt(h) + 3*ln(1 + h/60);
    p := floor(3 + 0.9*power(r, 1.6))::integer;
    IF st < 5 THEN p := least(p, CASE WHEN st = 4 THEN 260 WHEN st = 3 THEN 150 ELSE 84 END); END IF;
    w := public.village_civic_wealth(_seed, cur);
    t := cur; dowry := floor(20 + w*0.6)::integer; RETURN NEXT;
    days := least(20, greatest(2, 9*sqrt(40.0 / greatest(10, p))));
    cut := (1 - 0.25*least(1, greatest(0, (w - 40) / 40.0))) * (1 - 0.04*f);
    gap := greatest(1, floor(24*days*cut + 0.5)::integer);
    cur := cur + make_interval(hours => gap);
  END LOOP;
END $function$;

-- Old six-item list, used ONLY for dowries before the cutover so existing balances stay unchanged.
CREATE OR REPLACE FUNCTION public.village_weddings_legacy(_seed uuid, _at timestamptz)
 RETURNS TABLE(n integer, dowry integer, last_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT count(*)::integer, coalesce(sum(l.dowry),0)::integer, max(l.t)
      FROM public.village_wedding_list(_seed, _at, ARRAY['fisher','hunter','granary','dairy','markethall','guildhall']) l $$;

-- Binding definition: four food crafts (mirrors FOOD_CRAFTS in src/game/food-crafts.ts).
CREATE OR REPLACE FUNCTION public.village_weddings_fast(_seed uuid, _at timestamptz)
 RETURNS TABLE(n integer, dowry integer, last_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT count(*)::integer, coalesce(sum(l.dowry),0)::integer, max(l.t)
      FROM public.village_wedding_list(_seed, _at, ARRAY['fisher','hunter','granary','dairy']) l $$;

-- 2) Raid calendar as a list (same formula as village_raids).
CREATE OR REPLACE FUNCTION public.village_raid_list(_seed uuid, _from timestamptz, _to timestamptz)
 RETURNS TABLE(t timestamptz, loss integer)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE h bigint; k integer := 0; d integer := 4; g timestamptz; created timestamptz; rt timestamptz;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id=_seed;
  IF created IS NULL THEN RETURN; END IF;
  h := ('x' || substr(replace(_seed::text, '-', ''), 1, 8))::bit(32)::bigint;
  SELECT min(created_at) INTO g FROM public.purchases WHERE seed_id = _seed AND item = 'guard';
  LOOP
    d := d + 6 + ((h + k * 7919) % 19)::integer;
    rt := created + make_interval(days => d, hours => ((h + k * 31) % 24)::integer);
    EXIT WHEN rt > _to OR k > 2000;
    IF rt > _from AND (g IS NULL OR g > rt) THEN t := rt; loss := 12 + ((h + k * 104729) % 34)::integer; RETURN NEXT; END IF;
    k := k + 1;
  END LOOP;
END $function$;

-- 3) Old balance formula evaluated at a moment (only rows before _at).
CREATE OR REPLACE FUNCTION public.village_balance_legacy(_seed uuid, _at timestamptz)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; owner uuid; spent integer; ev integer; tw integer; gi integer; qr integer; mk integer; rf integer; vv integer; wf integer; pt integer;
 dw integer; dold integer:=0; dnew integer; base integer; cap integer; since timestamptz := timestamptz '2026-10-31 00:00:00+00';
BEGIN
  SELECT s.created_at, s.user_id INTO created, owner FROM public.seeds s WHERE s.id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed AND created_at < _at;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed AND created_at < _at;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed AND created_at < _at;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE (to_seed = _seed OR from_seed = _seed) AND created_at < _at;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed AND created_at < _at;
  SELECT coalesce(sum(reward),0) INTO mk FROM public.market_sales WHERE seed_id = _seed AND created_at < _at;
  SELECT coalesce(sum(reward),0) INTO rf FROM public.referrals WHERE (referrer_seed = _seed OR referee_seed = _seed) AND created_at < _at;
  SELECT coalesce(sum(reward),0) INTO vv FROM public.village_visits WHERE visitor_seed = _seed AND created_at < _at;
  SELECT coalesce(sum(reward),0) INTO wf FROM public.wonder_finds WHERE seed_id = _seed AND created_at < _at;
  SELECT coalesce(sum(reward),0) INTO pt FROM public.princely_tasks WHERE seed_id = _seed AND done_at IS NOT NULL AND done_at < _at;
  SELECT coalesce(w.dowry,0) INTO dw FROM public.village_weddings_legacy(_seed, _at) w;
  IF created < since THEN SELECT coalesce(w.dowry,0) INTO dold FROM public.village_weddings_legacy(_seed, least(_at, since)) w; END IF;
  dw := coalesce(dw,0); dold := coalesce(dold,0); dnew := dw - dold;
  base := 160 + public.village_capped_tax_fast(_seed, _at) - spent - ev - tw + gi + qr + mk + rf + vv + wf + pt;
  IF owner IS NOT NULL THEN
    SELECT CASE WHEN bool_or(item='chest4') THEN 25000 WHEN bool_or(item='chest3') THEN 10000 WHEN bool_or(item='chest2') THEN 4000 ELSE 1200 END
      INTO cap FROM public.purchases WHERE seed_id = _seed AND item LIKE 'chest%' AND created_at < _at;
    cap := coalesce(cap, 1200);
    dnew := least(dnew, greatest(0, cap - base - dold));
  END IF;
  RETURN greatest(0, base + dold + dnew - public.village_raids(_seed, created, _at));
END $function$;

-- 4) Chronological walk from _since to _at. Same-time order: tax 0, dowry 1, credits 2, debits 3, raids 4, key.
CREATE OR REPLACE FUNCTION public.village_balance_walk(_seed uuid, _since timestamptz, _at timestamptz)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; owner uuid; bal integer; cap integer; e record; c2 timestamptz; c3 timestamptz; c4 timestamptz;
BEGIN
  SELECT s.created_at, s.user_id INTO created, owner FROM public.seeds s WHERE s.id = _seed;
  IF created IS NULL THEN RETURN 0; END IF;
  IF owner IS NULL OR _at < _since THEN RETURN public.village_balance_legacy(_seed, _at); END IF;
  bal := public.village_balance_legacy(_seed, _since);
  SELECT min(created_at) FILTER (WHERE item='chest2'), min(created_at) FILTER (WHERE item='chest3'), min(created_at) FILTER (WHERE item='chest4')
    INTO c2, c3, c4 FROM public.purchases WHERE seed_id=_seed;
  FOR e IN SELECT * FROM (
      SELECT created + make_interval(days => d) t, 0 r, coalesce((SELECT x.income FROM public.tax_receipts x WHERE x.seed_id=_seed AND x.day=d),0) v, 'd'||lpad(d::text,6,'0') k
        FROM generate_series(greatest(1, floor(extract(epoch FROM (_since-created))/86400)::integer + 1),
                             floor(extract(epoch FROM (_at-created))/86400)::integer) d
      UNION ALL SELECT l.t, 1, l.dowry, 'w' FROM public.village_wedding_list(_seed, _at, ARRAY['fisher','hunter','granary','dairy']) l WHERE l.t > _since
      UNION ALL SELECT q.t, CASE WHEN q.v > 0 THEN 2 ELSE 3 END, q.v, q.k FROM (
        SELECT created_at t, -cost v, 'p'||id k FROM public.purchases WHERE seed_id=_seed
        UNION ALL SELECT created_at, -cost, 'e'||id FROM public.encounters WHERE seed_id=_seed
        UNION ALL SELECT created_at, -cost, 't'||id FROM public.twin_works WHERE seed_id=_seed
        UNION ALL SELECT created_at, CASE WHEN to_seed=_seed THEN amount ELSE -amount END, 'g'||id FROM public.gifts WHERE to_seed=_seed OR from_seed=_seed
        UNION ALL SELECT created_at, reward, 'q'||id FROM public.quest_claims WHERE seed_id=_seed
        UNION ALL SELECT created_at, reward, 'm'||id FROM public.market_sales WHERE seed_id=_seed
        UNION ALL SELECT created_at, reward, 'f'||id FROM public.referrals WHERE referrer_seed=_seed OR referee_seed=_seed
        UNION ALL SELECT created_at, reward, 'v'||id FROM public.village_visits WHERE visitor_seed=_seed
        UNION ALL SELECT created_at, reward, 'o'||id FROM public.wonder_finds WHERE seed_id=_seed
        UNION ALL SELECT done_at, reward, 'z'||id FROM public.princely_tasks WHERE seed_id=_seed AND done_at IS NOT NULL
      ) q WHERE q.t >= _since AND q.t <= _at AND q.v <> 0
      UNION ALL SELECT x.t, 4, x.loss, 'r' FROM public.village_raid_list(_seed, _since, _at) x
    ) ev ORDER BY t, r, k LOOP
    IF e.r = 4 THEN bal := greatest(0, bal - e.v);
    ELSIF e.v > 0 THEN
      cap := CASE WHEN c4 <= e.t THEN 25000 WHEN c3 <= e.t THEN 10000 WHEN c2 <= e.t THEN 4000 ELSE 1200 END;
      bal := bal + least(e.v, greatest(0, cap - bal));
    ELSE bal := bal + e.v; END IF;
  END LOOP;
  RETURN greatest(0, bal);
END $function$;

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.village_balance_walk(_seed, timestamptz '2026-11-12 00:00:00+00', now()) $$;

REVOKE ALL ON FUNCTION public.village_wedding_list(uuid, timestamptz, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.village_weddings_legacy(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.village_raid_list(uuid, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.village_balance_legacy(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.village_balance_walk(uuid, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;