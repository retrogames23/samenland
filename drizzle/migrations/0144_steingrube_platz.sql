-- Steingrube als sichtbares Gebäude: der Spieler wählt den Bauplatz in der normalen Vorschau, wie bei jedem anderen
-- gekauften Gebäude. 0143 lehnte für die Steingrube jede Position ab ('bad position'); diese Migration entfernt
-- ausschließlich diese eine Zeile aus dem Steingruben-Block des purchase_guard.
--
-- Danach gelten für die Position die allgemeinen Regeln des Guards, unverändert wie für alle platzierten Gebäude:
-- x und y nur gemeinsam, höchstens 60 Felder vom Dorf, nicht auf einer Pflanzung. Buchungen ohne Koordinaten bleiben
-- gültig (alte Steingruben auf der Testkarte; der Client platziert sie auf einem freien Feld).
--
-- Unverändert: Preis 150 Mark (300 − 150), Holzbedarf 20 (purchase_material), höchstens eine pro Dorf (Guard und
-- Unique-Index purchases_steingrube_once), Verkauf nur wo die Ressourcen laufen ('not now'), Produktion (resource_rate:
-- ab Kaufzeitpunkt), alle anderen Gebäude. Keine Tabelle, keine Zeile, keine Buchung wird verändert.
DO $do$
DECLARE
  d text;
  old_line constant text := $s$    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'steingrube') THEN RAISE EXCEPTION 'already built'; END IF;$s$;
  new_line constant text := $s$    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'steingrube') THEN RAISE EXCEPTION 'already built'; END IF;$s$;
  hits integer;
  positions_before integer;
  positions_after integer;
BEGIN
  d := pg_get_functiondef('public.purchase_guard()'::regprocedure);
  -- 0143 must be in place: the Steingrube block with its price exists
  IF position($s$  IF NEW.item = 'steingrube' THEN
    price := 300 - 150;$s$ in d) = 0 THEN RAISE EXCEPTION '0144: Steingrube block from 0143 not found in purchase_guard'; END IF;
  -- the generic position rule every placed building relies on must exist, or a placed Steingrube would be unchecked
  IF position('IF (NEW.x IS NULL) <> (NEW.y IS NULL) THEN RAISE EXCEPTION ''bad position''; END IF;' in d) = 0 THEN
    RAISE EXCEPTION '0144: generic position check not found in purchase_guard';
  END IF;
  hits := (length(d) - length(replace(d, old_line, ''))) / length(old_line);
  IF hits = 0 THEN
    -- already applied (re-run): the Steingrube block must then read exactly the new form
    IF position($s$    price := 300 - 150;
$s$ || new_line in d) = 0 THEN RAISE EXCEPTION '0144: unexpected Steingrube block in purchase_guard'; END IF;
    RETURN;
  END IF;
  IF hits <> 1 THEN RAISE EXCEPTION '0144: Steingrube position rule found % times, expected once', hits; END IF;
  positions_before := (length(d) - length(replace(d, 'bad position', ''))) / length('bad position');
  d := replace(d, old_line, new_line);
  positions_after := (length(d) - length(replace(d, 'bad position', ''))) / length('bad position');
  -- exactly one position rule less; every other building keeps all of its rules
  IF positions_after <> positions_before - 1 THEN RAISE EXCEPTION '0144: patch changed more than the Steingrube rule'; END IF;
  EXECUTE d;
END $do$;
