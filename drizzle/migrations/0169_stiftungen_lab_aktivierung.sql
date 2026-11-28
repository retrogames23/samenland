-- 0169 Wirtschaftsumbau P4, Schritt 2b – Lab-Aktivierung der Stiftungen (Masterplan v7.1, 11.2; Freigabe Stephan 28.11.2026).
-- Spiegel: src/game/stiftungszeit.ts (STIFT_SINCE_LAB, stiftSince). Test: src/lib/stiftung-lab.pg.test.ts.
--
-- EINZIGE ÄNDERUNG: stift_since('lab') = 2026-11-28 00:00 UTC. Jede andere Welt (europe, us-west, us-east, asia und ihre
-- Überlaufkarten wie europe-2) bleibt auf dem Platzhalter 2100-01-04. Keine öffentliche Aktivierung (D7 offen, P6).
-- Keine Regel, kein Wert, keine Tabelle, kein Recht und keine andere Funktion wird angefasst; 0165–0168 bleiben, wie sie
-- sind. Die Funktion wird mit CREATE OR REPLACE ersetzt: Eigentümer und Rechte (nur service_role) bleiben erhalten.
--
-- Wirkung: Stiftungen wirken nie rückwärts – jede Zeile entsteht nur durch eine Spieleraktion. Ein Start in der
-- Vergangenheit bucht deshalb nichts; ab dem Einspielen können Lab-Dörfer mit Spital 1 oder Waage 1 Stufen öffnen.
-- Rücknahme: dieselbe Funktion mit dem Platzhalter für `lab` (docs/p4-lab-aktivierung.md); bereits gestiftete Stufen
-- blieben dann gebucht und wirkten bis zu ihrem Ende weiter, neue Aktionen wären gesperrt.

-- Vorprüfung, vor jeder Änderung: 0165 ist eingespielt, und der Schalter steht dort, wo ihn diese Migration erwartet.
DO $$
DECLARE lab timestamptz; r text;
BEGIN
  IF to_regprocedure('public.stift_since(text)') IS NULL OR to_regclass('public.stift_stages') IS NULL THEN
    RAISE EXCEPTION 'P4 0169: 0165 fehlt (stift_since / stift_stages nicht vorhanden)'; END IF;
  lab := public.stift_since('lab');
  IF lab NOT IN (timestamptz '2100-01-04 00:00:00+00', timestamptz '2026-11-28 00:00:00+00') THEN
    RAISE EXCEPTION 'P4 0169: stift_since(lab) steht unerwartet auf % – nichts geändert', lab; END IF;
  FOREACH r IN ARRAY ARRAY['europe', 'us-west', 'us-east', 'asia', 'europe-2', 'europe-3', 'europe-4', 'us-west-2', 'us-east-2', 'asia-2'] LOOP
    IF public.stift_since(r) <> timestamptz '2100-01-04 00:00:00+00' THEN
      RAISE EXCEPTION 'P4 0169: stift_since(%) steht nicht auf dem Platzhalter – nichts geändert', r; END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.stift_since(_realm text) RETURNS timestamptz
 LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT CASE WHEN _realm = 'lab' THEN timestamptz '2026-11-28 00:00:00+00' ELSE timestamptz '2100-01-04 00:00:00+00' END $$;

-- Nachprüfung in derselben Transaktion: nur `lab` ist aktiv, die Rechte sind unverändert.
DO $$
DECLARE r text;
BEGIN
  IF public.stift_since('lab') <> timestamptz '2026-11-28 00:00:00+00' THEN RAISE EXCEPTION 'P4 0169: lab nicht gesetzt'; END IF;
  FOREACH r IN ARRAY ARRAY['europe', 'us-west', 'us-east', 'asia', 'europe-2', 'europe-3', 'europe-4', 'us-west-2', 'us-east-2', 'asia-2', '', 'LAB', 'lab-2'] LOOP
    IF public.stift_since(r) <> timestamptz '2100-01-04 00:00:00+00' THEN RAISE EXCEPTION 'P4 0169: % wäre aktiviert', r; END IF;
  END LOOP;
  IF public.stift_since(NULL) <> timestamptz '2100-01-04 00:00:00+00' THEN RAISE EXCEPTION 'P4 0169: NULL wäre aktiviert'; END IF;
  IF has_function_privilege('authenticated', 'public.stift_since(text)', 'EXECUTE') OR has_function_privilege('anon', 'public.stift_since(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'P4 0169: Rechte von stift_since haben sich geändert'; END IF;
END $$;
