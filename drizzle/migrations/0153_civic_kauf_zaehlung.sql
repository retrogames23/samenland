-- Fehlerpaket F-P2-1 (Entscheidung: Variante 2): what counts as a bought building for quests (quest_guard: build,
-- buy3, buy6) and the decree "build" (princely_task_met). Mirrors src/game/civic.ts countsAsBuilding — change both.
--
--  Not counted: the money rows of a Gemeindebau stage — instalments `<stage>:r<n>` and the server's daily Kontor rows
--  `<stage>:kYYYYMMDD` — for every stage of Spital and Waage (spital1, spital2, …, waage1, waage2, …), and, as since
--  0151, every Ankauf credit `ankauf:YYYYMMDD`. A stage counts exactly once, by its completion marker `<stage>`
--  (one row per stage, cost 0). Ordinary purchases count as before.
--
-- Builds on 0151 (its filtered texts are the anchors here): runs only after 0151 and its companion. Same patch pattern
-- as 0143/0147/0151: a live text that differs aborts the migration before anything changes; a re-run changes nothing.
-- No table, row, price or other rule changes.
DO $do$
DECLARE d text;
  civic text := $s$ AND item !~ '^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$'$s$;
BEGIN
  d := pg_get_functiondef('public.quest_guard()'::regprocedure);
  IF position('(spital|waage)[1-9]' in d) = 0 THEN
    d := replace(d, $s$SELECT count(*) INTO np FROM purchases WHERE seed_id = NEW.seed_id AND item !~ '^ankauf:[0-9]{8}$';$s$,
      $s$SELECT count(*) INTO np FROM purchases WHERE seed_id = NEW.seed_id AND item !~ '^ankauf:[0-9]{8}$'$s$ || civic || ';');
    IF (length(d) - length(replace(d, '(spital|waage)[1-9]', ''))) / 19 <> 1 THEN RAISE EXCEPTION 'quest_guard patch did not apply'; END IF;
    EXECUTE d;
  END IF;
  d := pg_get_functiondef('public.princely_task_met(uuid, text, timestamptz)'::regprocedure);
  IF position('(spital|waage)[1-9]' in d) = 0 THEN
    d := replace(d, $s$FROM purchases WHERE seed_id=_seed AND created_at>_since AND item !~ '^ankauf:[0-9]{8}$')$s$,
      $s$FROM purchases WHERE seed_id=_seed AND created_at>_since AND item !~ '^ankauf:[0-9]{8}$'$s$ || civic || ')');
    d := replace(d, $s$(SELECT count(*) FROM purchases WHERE seed_id=_seed AND item !~ '^ankauf:[0-9]{8}$') >= 8$s$,
      $s$(SELECT count(*) FROM purchases WHERE seed_id=_seed AND item !~ '^ankauf:[0-9]{8}$'$s$ || civic || ') >= 8');
    IF (length(d) - length(replace(d, '(spital|waage)[1-9]', ''))) / 19 <> 2 THEN RAISE EXCEPTION 'princely_task_met patch did not apply'; END IF;
    EXECUTE d;
  END IF;
END $do$;
