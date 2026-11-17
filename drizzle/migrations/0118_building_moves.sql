CREATE TABLE public.building_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  item text NOT NULL,
  x integer NOT NULL,
  y integer NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX building_moves_seed_idx ON public.building_moves(seed_id, created_at);
GRANT SELECT, INSERT ON public.building_moves TO authenticated;
GRANT SELECT ON public.building_moves TO anon;
GRANT ALL ON public.building_moves TO service_role;
ALTER TABLE public.building_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read building moves" ON public.building_moves FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners move their own buildings" ON public.building_moves FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.move_price(_item text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE
    WHEN _item IN ('herbs','hunter','fisher','fireorder','woodcamp') THEN 20
    WHEN _item IN ('backhaus','herberge','granary','healer','badestube','firehouse','guard','dairy','library','bigstore','stonemason','smokehouse') THEN 50
    WHEN _item IN ('beginen','school','markethall','guildhall','millrow','hammerworks','saltquay') THEN 100
    WHEN _item ~ '^(belfry|theater|cathedral|university|exchange|orangery|opera|harvest|guildtower|lighthouse)1$' THEN 150
    ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.building_move_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE price integer; sx integer; sy integer;
BEGIN
  price := public.move_price(NEW.item);
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  NEW.cost := price; NEW.created_at := now();
  IF NOT EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = NEW.seed_id AND p.item = NEW.item) THEN RAISE EXCEPTION 'not built'; END IF;
  IF EXISTS (SELECT 1 FROM public.building_moves m WHERE m.seed_id = NEW.seed_id AND m.item = NEW.item AND m.created_at > now() - interval '7 days') THEN RAISE EXCEPTION 'move cooldown'; END IF;
  IF EXISTS (SELECT 1 FROM public.building_moves m WHERE m.seed_id = NEW.seed_id AND m.created_at > now() - interval '12 hours') THEN RAISE EXCEPTION 'move busy'; END IF;
  SELECT s.x, s.y INTO sx, sy FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF sqrt(power(NEW.x - sx, 2) + power(NEW.y - sy, 2)) > 60 THEN RAISE EXCEPTION 'too far'; END IF;
  IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER building_moves_lock BEFORE INSERT ON public.building_moves FOR EACH ROW EXECUTE FUNCTION public.tax_spend_lock();
CREATE TRIGGER building_moves_guard BEFORE INSERT ON public.building_moves FOR EACH ROW EXECUTE FUNCTION public.building_move_guard();

CREATE OR REPLACE FUNCTION public.village_balance_walk(_seed uuid, _since timestamp with time zone, _at timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
        UNION ALL SELECT created_at, -cost, 'b'||id FROM public.building_moves WHERE seed_id=_seed
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

ALTER PUBLICATION supabase_realtime ADD TABLE public.building_moves;