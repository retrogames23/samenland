-- Daily limits follow the realm's calendar day (midnight in the map's time zone), not rolling 24 h.
CREATE OR REPLACE FUNCTION public.realm_day_start(_seed uuid)
 RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT (date_trunc('day', now() AT TIME ZONE z) AT TIME ZONE z)
  FROM (SELECT CASE (SELECT realm FROM public.seeds WHERE id = _seed)
    WHEN 'us-west' THEN 'America/Los_Angeles' WHEN 'us-east' THEN 'America/New_York' WHEN 'asia' THEN 'Asia/Tokyo' ELSE 'Europe/Berlin' END AS z) t
$$;
REVOKE EXECUTE ON FUNCTION public.realm_day_start(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.realm_day_start(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.claim_wonder(_seed uuid, _site text)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE me public.seeds; w public.wonder_sites; isfirst boolean; r integer;
BEGIN
  SELECT * INTO me FROM public.seeds WHERE id = _seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  SELECT * INTO w FROM public.wonder_sites WHERE key = _site;
  IF w.key IS NULL THEN RAISE EXCEPTION 'unknown site'; END IF;
  IF (SELECT count(*) FROM public.wonder_finds WHERE seed_id = _seed AND created_at >= public.realm_day_start(_seed)) >= 3 THEN RAISE EXCEPTION 'too many'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_site || coalesce(me.realm, '')));
  isfirst := NOT EXISTS (SELECT 1 FROM public.wonder_finds WHERE site = _site AND realm = coalesce(me.realm, 'europe') AND first);
  r := CASE WHEN isfirst THEN 60 ELSE 50 END;
  INSERT INTO public.wonder_finds(seed_id, site, realm, first, reward) VALUES (_seed, _site, coalesce(me.realm, 'europe'), isfirst, r) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.princely_audience(_seed uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me public.seeds; open public.princely_tasks; last timestamptz; n integer; d record;
BEGIN
  SELECT * INTO me FROM seeds WHERE id=_seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('princely' || _seed::text));
  SELECT * INTO open FROM princely_tasks WHERE seed_id=_seed AND done_at IS NULL LIMIT 1;
  IF open.id IS NOT NULL THEN
    IF public.princely_task_met(_seed, open.task, open.accepted_at) THEN
      UPDATE princely_tasks SET done_at=now() WHERE id=open.id; RETURN 'done';
    END IF;
    RETURN 'open';
  END IF;
  SELECT count(*), max(done_at) INTO n, last FROM princely_tasks WHERE seed_id=_seed;
  IF n >= 12 THEN RETURN 'all'; END IF;
  IF last IS NOT NULL AND last >= public.realm_day_start(_seed) THEN RETURN 'rest'; END IF;
  SELECT * INTO d FROM public.princely_task_def(n+1);
  INSERT INTO princely_tasks(seed_id, step, task, reward) VALUES (_seed, n+1, d.task, d.reward);
  RETURN 'new';
END $$;

CREATE OR REPLACE FUNCTION public.princely_swap(_seed uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me public.seeds; open public.princely_tasks; lastswap timestamptz;
BEGIN
  SELECT * INTO me FROM seeds WHERE id=_seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('princely' || _seed::text));
  SELECT * INTO open FROM princely_tasks WHERE seed_id=_seed AND done_at IS NULL LIMIT 1;
  IF open.id IS NULL THEN RETURN 'none'; END IF;
  IF open.task = 'court' THEN RETURN 'same'; END IF;
  SELECT max(swapped_at) INTO lastswap FROM princely_tasks WHERE seed_id=_seed;
  IF lastswap IS NOT NULL AND lastswap >= public.realm_day_start(_seed) THEN RETURN 'wait'; END IF;
  UPDATE princely_tasks SET task='court', accepted_at=now(), swapped_at=now() WHERE id=open.id;
  RETURN 'swapped';
END $$;

CREATE OR REPLACE FUNCTION public.blessing_cooldown()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.created_at := now();
  IF EXISTS (SELECT 1 FROM public.blessings b WHERE b.seed_id = NEW.seed_id AND b.created_at >= public.realm_day_start(NEW.seed_id)) THEN
    RAISE EXCEPTION 'cooldown' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.gift_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ra text; rb text;
BEGIN
  NEW.created_at := now();
  IF NEW.from_seed = NEW.to_seed THEN RAISE EXCEPTION 'self gift'; END IF;
  SELECT realm INTO ra FROM public.seeds WHERE id = NEW.from_seed;
  SELECT realm INTO rb FROM public.seeds WHERE id = NEW.to_seed;
  IF rb IS NULL OR ra IS DISTINCT FROM rb THEN RAISE EXCEPTION 'other realm'; END IF;
  IF NEW.kind = 'thanks' THEN
    NEW.amount := 0; NEW.note := greatest(0, least(2, NEW.note));
    IF NOT EXISTS (SELECT 1 FROM public.gifts g WHERE g.from_seed = NEW.to_seed AND g.to_seed = NEW.from_seed AND g.kind <> 'thanks' AND g.created_at > now() - interval '7 days') THEN RAISE EXCEPTION 'nothing to thank'; END IF;
    IF EXISTS (SELECT 1 FROM public.gifts g WHERE g.from_seed = NEW.from_seed AND g.to_seed = NEW.to_seed AND g.kind = 'thanks' AND g.created_at >= public.realm_day_start(NEW.from_seed)) THEN RAISE EXCEPTION 'already thanked'; END IF;
    RETURN NEW;
  END IF;
  NEW.amount := CASE NEW.kind WHEN 'gift' THEN 25 ELSE 40 END; NEW.note := 0;
  IF EXISTS (SELECT 1 FROM public.gifts g WHERE g.from_seed = NEW.from_seed AND g.kind <> 'thanks' AND g.created_at >= public.realm_day_start(NEW.from_seed)) THEN RAISE EXCEPTION 'one gift per day'; END IF;
  IF public.village_balance(NEW.from_seed) < NEW.amount THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;