# Auftrag an Lovable: P4 Schritt 2b – Stiftungen im Lab aktivieren und abnehmen

Freigabe: Stephan, 28.11.2026, 09:05 Uhr. Grundlage: `main` nach dem Merge des PR „P4 Schritt 2b“.
Du führst alle Datenbankarbeiten, den Publish, alle Screenshots und alle Prüfungen im Spiel aus. Claude hat nichts
eingespielt, nichts aktiviert und nichts im Spiel gesehen.

**Grenzen:** Aktiviert wird ausschließlich `lab`. `europe`, `us-west`, `us-east`, `asia` bleiben abgeschaltet.
Keine Änderung an 0165–0168, an Regeln, Werten, Rechten (auch nicht `sandbox_exec`) oder an Spieldaten. Keine
Reparatur bei Abweichungen: stoppen und melden.

## Teil 1 – Datenbank und Aktivierung

1. **Vorher-Prüfung.** `docs/sql/0169/01_vorher.sql` unverändert und als Ganzes ausführen (eine READ-ONLY-Transaktion).
   Erwartet: Block `pruefung` 6 Zeilen, alle `ok = true`. Block `schalter` 11 Zeilen, alle `aktiv = false`, alle
   `2100-01-04`. Blöcke `identitaet` und `bestand` vollständig ins Protokoll (Datenbank `postgres`, OID 5).
   Ist eine Prüfung `false`: nicht einspielen, Zeile melden.
2. **Einspielen.** `0169_stiftungen_lab_aktivierung` und `0170_begleitmigration_0170` in dieser Reihenfolge, Dateien
   unverändert. Bricht 0169 mit `P4 0169: …` ab, ist nichts geändert: Meldung wörtlich ins Protokoll, stoppen.
3. **Nachher-Prüfung.** `docs/sql/0169/02_nachher.sql` unverändert und als Ganzes ausführen.
   Erwartet: Block `pruefung` 23 Zeilen, alle `ok = true`. Block `schalter`: genau **eine** Zeile `aktiv = true`,
   nämlich `lab` mit `2026-11-28 00:00:00+00`; die zehn anderen `2100-01-04`, `aktiv = false`. Block `bestand`
   gleich dem Vorher-Ergebnis (Abweichung nur, wenn dazwischen ein Spieler gebucht hat – dann benennen).
   Sonderfall: Weicht nur eine Zeile „unverändert: …“ ab (lokal PostgreSQL 16, live 17.11), den gemeldeten Hash
   notieren und melden; nichts ändern.
4. **Protokoll.** Live-IDs, `created_at` und Hash von 0169 und 0170 aus dem Block `journal`. Erwartet:
   0169 = `889ed3397227cdc560cb30c0425959fa796201a2268e287300f76ed11eda6482` / `1795857739857`;
   0170 = `17db4fd369edb9244b9f91d9aeed145c3d04ad8ba6e95d06247f07a63527d11a` / `1795857740857`.
   Dazu Zeitstempel beider Prüfungen und der Status aller fünf Welten als Tabelle (lab aktiv; europe, us-west,
   us-east, asia abgeschaltet).
5. **Publish** des aktuellen `main`. Vor dem Publish ist die Karte auch im Lab verborgen – das ist richtig.
6. Zeile 6 im Block `bestand` („Lab-Dörfer mit Spital 1 oder Waage 1“) nennen. Steht dort 0, sind A3–A10 erst
   möglich, sobald ein Lab-Dorf einen der beiden Bauten im regulären Spiel fertig hat; dann A1, A2, A11, A12 jetzt
   ausführen und den Rest als offen melden. Keine Bauten per Datenbank anlegen, außer Stephan ordnet das an.

## Teil 2 – Abnahme im Spiel (Desktop und Mobil, je ein Screenshot pro Schritt)

Echtes Lab-Dorf, regulärer Ablauf, keine Datenbankeingriffe. Die Karte „Stiftungen“ steht direkt unter der Karte
des Gemeindebaus. Vor jedem Schritt Kasse, Lagerbestand Holz/Stein und Kontingent notieren.

| Nr. | Schritt | Erwartetes Ergebnis |
|---|---|---|
| A1 | Lab-Dorf öffnen, zur Karte „Stiftungen“ gehen | Karte sichtbar mit Titel „Stiftungen“, Einleitung („… 14 Tage Stiftungszeit … höchstens 28 Tage Vorrat …“), je ein Abschnitt „Spital“ und „Ratswaage“ mit Wirkungstext (×0,85). Steht ein Bau noch nicht: „Stiftbar, sobald … steht“, kein Öffnen-Knopf. |
| A2 | Ein Dorf in `europe` (oder einer anderen öffentlichen Welt) öffnen | Keine Karte „Stiftungen“, kein Hinweis darauf. |
| A3 | Bei einem fertigen Bau ohne Stiftung | „Zurzeit nicht gestiftet“, Knopf „Stufe öffnen (Preis X)“ mit X = 4 × letzte gebuchte Tagessteuer, Hinweis „Öffnen kostet nichts …“. Ohne gebuchte Tagessteuer: „Noch keine Tagessteuer gebucht …“, kein Knopf. |
| A4 | „Stufe öffnen“ | Kasse unverändert. Anzeige „0 von X eingezahlt“, Betragsfeld, Hinweis „Einzahlungen sind endgültig …“. Zweites Öffnen am selben Bau nicht möglich. |
| A5 | Teilbetrag einzahlen (z. B. ein Drittel) | Kasse sinkt genau um den Betrag; „… von X eingezahlt“ stimmt; nach Neuladen derselbe Stand. |
| A6 | Fehlerfälle beim Einzahlen: Betrag 0, Betrag über dem Rest, Betrag über der Kasse | Knopf gesperrt oder Meldung „Der Betrag passt nicht …“ bzw. „Dafür reicht die Kasse nicht.“; nichts gebucht, Kasse unverändert. |
| A7 | Rest einzahlen | „Voll bezahlt. Stiften braucht 30 Holz und 20 Stein.“ Darunter die Aufteilung: entweder „Das ganze Material kommt aus dem Lager (über der Rücklage 40 🪵 / 30 🪨)“ oder „Aus dem Lager: … · vom Kontor: … für …“. Lageranteil = Bestand über 40 Holz / 30 Stein, höchstens 30 / 20. |
| A8 | Lager- und Kontorbedingungen: Stiften bei zu wenig Material und Kontingent | Meldung „Es fehlen … im Kontingent – es wächst täglich um 4 Holz und 3 Stein“; nichts gebucht. Mit Kontoranteil: Rückfrage „Jetzt stiften? Das Kontor liefert … für …“ mit „Jetzt stiften“ / „Abbrechen“; Abbrechen bucht nichts. |
| A9 | Stiften bestätigen | „Gestiftet! Der Bau ist jetzt 14 Tage gestiftet.“ Karte: „Gestiftet: noch 14 Tage (bis Datum)“. Lager sinkt um den Lageranteil, nie unter 40 Holz / 30 Stein; Kasse sinkt genau um den Kontorpreis (0, wenn alles aus dem Lager kam). Nächstes Öffnen: „Nächste Stufe ab Datum“ (7 Tage nach dem Öffnen). |
| A10 | Wirkung der Stiftungszeit | Ratswaage gestiftet: Kontorpreis für dieselbe Menge vorher und nachher vergleichen – nachher 15 % günstiger (×0,85, zusätzlich zu Waage 1). Spital gestiftet: zeigt das Spiel das Krankheitsrisiko an, dann ×0,85 gegenüber vorher; zeigt es keinen Wert, als „im Spiel nicht sichtbar prüfbar“ melden (durch lokale Tests belegt). Werte mit Screenshot vorher/nachher. |
| A11 | Baustellen-Vorrang und Materialreservierung: im selben Dorf eine Gemeindebau-Stufe offen und nicht voll bezahlt | Stiftung zeigt „Ruht: erst <Stufe> bezahlen, noch <Rest>“, kein Öffnen. Bei voll bezahlter Stiftungsstufe und laufender Baustelle: „Der Kontoranteil ruht: erst … bezahlen …“ bzw. „… im Kontingent sind für die Baustelle reserviert“; Stiften allein aus dem Lager bleibt möglich. Nach voller Bezahlung des Baus verschwindet die Sperre. |
| A12 | Darstellung | Desktop und Mobil (ca. 390 px): kein Umbruchfehler, keine abgeschnittenen Texte oder Knöpfe, Betragsfeld bedienbar, Rückfrage vollständig lesbar. Sprache umstellen (mindestens Deutsch und Englisch): keine fehlenden Texte, keine Schlüsselnamen. |

Nachprüfungen in Echtzeit (das Lab läuft mit einfacher Geschwindigkeit; die Datenbank kennt keinen Zeitsprung):

- **T+1 Tag:** „Gestiftet: noch 13 Tage“.
- **T+7 Tage** nach dem Öffnen: Öffnen wieder möglich; eine zweite Stufe verlängert auf höchstens 28 Tage, die
  Wirkung bleibt ×0,85. Bei mehr als 14 Tagen Rest: „Vorrat voll: noch … Tage gestiftet. Nächste Stufe ab …“.
- **T+14 Tage** ohne neue Stiftung: „Zurzeit nicht gestiftet“, Kontorpreis bzw. Risiko wieder wie vor A9.

## Rückmeldung

1. Ergebnisse von Teil 1 (Schritte 1–6) mit Zeitstempeln, Live-IDs, Hashes, Tabelle der fünf Welten.
2. A1–A12 je mit bestanden / nicht bestanden / nicht ausführbar (Grund), Dorf, Gerät, Screenshot.
3. Offene Nachprüfungen mit Datum.
4. Jede Abweichung wörtlich, ohne Korrekturversuch.
