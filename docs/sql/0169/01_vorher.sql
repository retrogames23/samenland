-- P4 Schritt 2b, Migration 0169 (Lab-Aktivierung der Stiftungen) – 01 VORHER-Prüfung. NUR LESEND.
-- Ausführen unmittelbar VOR dem Einspielen von 0169/0170. Jede Zeile der Art "pruefung" muss ok = true zeigen.
-- Bei ok = false: nicht einspielen, nichts reparieren, Befund melden.
BEGIN TRANSACTION READ ONLY;

SELECT 'identitaet' AS art, current_database() AS datenbank,
       (SELECT d.oid FROM pg_database d WHERE d.datname = current_database()) AS datenbank_oid,
       current_setting('server_version') AS version, now() AS zeit,
       (SELECT max(id) FROM drizzle.__drizzle_migrations) AS hoechste_live_id;

SELECT 'pruefung' AS art, p.pruefung, p.ok, p.befund FROM (
  SELECT '0165 ist eingespielt (stift_since und stift_stages vorhanden)' AS pruefung,
         to_regprocedure('public.stift_since(text)') IS NOT NULL AND to_regclass('public.stift_stages') IS NOT NULL AS ok, '-' AS befund
  UNION ALL
  SELECT 'stift_since(lab) steht noch auf dem Platzhalter 2100-01-04', public.stift_since('lab') = timestamptz '2100-01-04 00:00:00+00', public.stift_since('lab')::text
  UNION ALL
  SELECT 'alle anderen Welten stehen auf dem Platzhalter 2100-01-04',
         (SELECT bool_and(public.stift_since(w.welt) = timestamptz '2100-01-04 00:00:00+00') FROM (VALUES ('lab'), ('europe'), ('us-west'), ('us-east'), ('asia'), ('europe-2'), ('europe-3'), ('europe-4'), ('us-west-2'), ('us-east-2'), ('asia-2')) AS w(welt) WHERE w.welt <> 'lab'),
         (SELECT string_agg(w.welt || '=' || public.stift_since(w.welt)::date::text, ', ') FROM (VALUES ('lab'), ('europe'), ('us-west'), ('us-east'), ('asia'), ('europe-2'), ('europe-3'), ('europe-4'), ('us-west-2'), ('us-east-2'), ('asia-2')) AS w(welt) WHERE w.welt <> 'lab')
  UNION ALL
  SELECT 'stift_since vor 0169 = Stand aus 0165', md5(pg_get_functiondef('public.stift_since(text)'::regprocedure)) = 'e40b14b32120a70fc281ece9cd273cc4', md5(pg_get_functiondef('public.stift_since(text)'::regprocedure))
  UNION ALL
  SELECT 'noch keine Stiftung gebucht (stift_stages leer, keine Stiftungszeile)',
         (SELECT count(*) FROM public.stift_stages) = 0 AND (SELECT count(*) FROM public.purchases WHERE item LIKE 'stift:%') = 0,
         (SELECT count(*)::text FROM public.stift_stages) || ' / ' || (SELECT count(*)::text FROM public.purchases WHERE item LIKE 'stift:%')
  UNION ALL
  SELECT '0169 noch nicht im Live-Journal', NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations m WHERE m.hash = '889ed3397227cdc560cb30c0425959fa796201a2268e287300f76ed11eda6482'), '-'
) p;

-- SCHALTER je Welt (die fünf Welten und ihre Überlaufkarten). Diese Zeilen gehören ins Protokoll.
SELECT 'schalter' AS art, w.welt, public.stift_since(w.welt) AS stift_since, public.stift_since(w.welt) <= now() AS aktiv
  FROM (VALUES ('lab'), ('europe'), ('us-west'), ('us-east'), ('asia'), ('europe-2'), ('europe-3'), ('europe-4'), ('us-west-2'), ('us-east-2'), ('asia-2')) AS w(welt);

-- BESTAND (in 01 und 02 wortgleich; muss vorher und nachher gleich sein, sofern dazwischen kein Spieler etwas gebucht hat).
SELECT 'bestand' AS art, x.name, x.wert FROM (
  SELECT 1 AS n, 'stift_stages: Zeilen' AS name, (SELECT count(*)::text FROM public.stift_stages) AS wert
  UNION ALL SELECT 2, 'purchases: Stiftungszeilen', (SELECT count(*)::text FROM public.purchases WHERE item LIKE 'stift:%')
  UNION ALL SELECT 3, 'purchases: Anzahl | Summe cost (vor heute, UTC)', (SELECT count(*)::text || ' | ' || coalesce(sum(cost), 0)::text FROM public.purchases WHERE created_at < date_trunc('day', now()))
  UNION ALL SELECT 4, 'tax_receipts: Anzahl | Summe income (vor heute, UTC)', (SELECT count(*)::text || ' | ' || coalesce(sum(income), 0)::text FROM public.tax_receipts WHERE assessed_at < date_trunc('day', now()))
  UNION ALL SELECT 5, 'seeds: Anzahl | davon lab', (SELECT count(*)::text || ' | ' || count(*) FILTER (WHERE realm = 'lab')::text FROM public.seeds)
  UNION ALL SELECT 6, 'Lab-Dörfer mit Spital 1 oder Waage 1 (können nach der Aktivierung stiften)',
    (SELECT count(DISTINCT s.id)::text FROM public.seeds s JOIN public.purchases p ON p.seed_id = s.id WHERE s.realm = 'lab' AND p.item IN ('spital1', 'waage1') AND p.created_at <= now())
) x ORDER BY x.n;

ROLLBACK;
