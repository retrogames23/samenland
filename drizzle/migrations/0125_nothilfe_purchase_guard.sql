DO $do$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.purchase_guard()'::regprocedure);
  IF position('nothilfe' in d) > 0 THEN RETURN; END IF;
  d := replace(d, $s$  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;$s$,
    $s$  -- Zimmerleute-Nothilfe (src/game/nothilfe.ts): 80 Mark, Weiler, one per fire/flood event, booked only by the trusted server
  IF NEW.item ~ '^nothilfe-[fw][0-9]+$' THEN
    price := 80;
    IF coalesce(auth.role(), '') <> 'service_role' THEN RAISE EXCEPTION 'server only'; END IF;
    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'step already paid'; END IF;
  END IF;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;$s$);
  d := replace(d, $s$  IF NEW.item ~ '^bauhuette[1-9][0-9]*$' THEN need_rank := 1; END IF;$s$,
    $s$  IF NEW.item ~ '^bauhuette[1-9][0-9]*$' THEN need_rank := 1; END IF;
  IF NEW.item ~ '^nothilfe-[fw][0-9]+$' THEN need_rank := 1; END IF;$s$);
  IF (length(d) - length(replace(d, 'nothilfe-', ''))) / 9 < 2 THEN RAISE EXCEPTION 'purchase_guard patch did not apply'; END IF;
  EXECUTE d;
END $do$;
CREATE UNIQUE INDEX IF NOT EXISTS purchases_nothilfe_once ON public.purchases (seed_id, item) WHERE item LIKE 'nothilfe-%';