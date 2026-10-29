ALTER TABLE public.market_sales ADD COLUMN IF NOT EXISTS small boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.market_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text; tz text;
BEGIN
  SELECT realm INTO r FROM seeds WHERE id = NEW.seed_id AND (NEW.small OR created_at < now() - interval '1 day');
  IF NOT FOUND THEN RAISE EXCEPTION 'village too young'; END IF;
  tz := CASE r WHEN 'us-west' THEN 'America/Los_Angeles' WHEN 'us-east' THEN 'America/New_York' WHEN 'asia' THEN 'Asia/Tokyo' ELSE 'Europe/Berlin' END;
  NEW.day := (now() AT TIME ZONE 'utc')::date;
  NEW.reward := CASE WHEN NEW.small THEN 6 WHEN extract(dow FROM now() AT TIME ZONE tz) = 6 THEN 20 ELSE 15 END;
  NEW.created_at := now();
  RETURN NEW;
END $$;