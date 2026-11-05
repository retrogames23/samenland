# Kirchliche Feiertage um 1500 – Plan in Etappen

Grundsatz: Jeder Feiertag ist auf der Karte zu sehen (Menschen, Schmuck, Feuer, Prozession, Arbeitsruhe). Am Morgen des Festtags erscheint einmal ein kurzes Pergament, das den Tag historisch erklärt („Heute ist Ostern …“). Alles wird aus dem Datum berechnet und nichts gespeichert. Damit sehen alle Spieler in einer Welt dasselbe.

## Etappe 1 – Grundgerüst + Sonntag/Arbeitsruhe + Ostern und Weihnachten
- Festkalender: Er bestimmt aus dem Spieldatum (Spieljahr = echtes Jahr − 526), welcher Feiertag ist. Ostern wird für das Spieljahr nach dem damals gültigen julianischen Kalender berechnet. Bewegliche Feste (Fastnacht, Palmsonntag, Karfreitag, Himmelfahrt, Pfingsten, Fronleichnam) hängen daran.
- Arbeitsruhe: An gebotenen Feiertagen bleiben Feld, Werkstatt und Baustelle leer. Die Leute gehen zur Kirche oder Kapelle, danach ruhen sie oder gehen zum Krug. So wie heute schon am Sonntag.
- **Ostern**: Vorher Karfreitag mit stillen Glocken und ohne Marktgeschehen. Am Ostermorgen Kirchgang und Osterfeuer am Abend auf einer Anhöhe oder am Dorfrand, mit Tanz drumherum. Eierkörbe an den Häusern. Die Fastenzeit davor ist zu sehen: kein Räucherfleisch vor dem Krug, Fisch auf dem Markt.
- **Weihnachten** (Christmesse um Mitternacht): Fackelzug zur Kirche in der Nacht, Lichter in allen Fenstern, Grün (Tanne/Stechpalme) an den Türen. Die Zwölf Nächte bis Dreikönig mit ruhigem Dorfleben. Kein Christbaum, den gab es noch nicht.
- Overlay „Festtag“: Pergament mit Illustration, 2–3 Sätze Erklärung, „Auf der Karte zeigen“ (Kamera auf Kirche bzw. Feuer). Es erscheint einmal pro Fest und Gerät, auf Wunsch auch über alle Geräte hinweg.
- Sprüche der Bewohner passend zum Tag, z. B. „Christ is upstahn!“ oder das Ende der Fastenzeit.
- Übersetzungen in alle 8 Sprachen, 2 neue Illustrationen.

## Etappe 2 – Fastnacht und Pfingsten
- **Fastnacht** (Dienstag vor Aschermittwoch): Umzug mit Masken und Narren über die Dorfstraße, Fettgebäck, abends Lärm am Krug. Am **Aschermittwoch** ist es auf einen Schlag still.
- **Pfingsten**: Maibaum oder Pfingstbaum aus Birkengrün an den Häusern, Pfingstochse mit Blumen geschmückt, der durchs Dorf geführt wird, Tanz auf dem Anger.

## Etappe 3 – Sommer- und Erntefeste
- **Johannis** (24. Juni): Johannisfeuer am Abend, Sprung übers Feuer, Kräuterbüschel an den Türen.
- **Fronleichnam**: Prozession mit Baldachin vom Kirchplatz um das Dorf, Blumen auf dem Weg.
- **Michaelis** (29. September): Ende der Ernte, Zins- und Pachttag. Bauern bringen Abgaben zum Schulzen, kleines Erntefest.

## Etappe 4 – Jahreskreis vervollständigen
- **Lichtmess** (2. Februar): Kerzenprozession, Gesinde wechselt den Dienst (Bündel tragen, Abschied).
- **Martini** (11. November): Martinsgans, Ende des Wirtschaftsjahres, Zinstag.
- **Dreikönig, Himmelfahrt** (Flurumgang/Bittgang um die Felder), Allerheiligen/Allerseelen (Lichter auf dem Kirchhof).
- Hinweis im Kalender bzw. Buch der Stadt: „Nächstes Fest“.

## Spielbalance
Feiertage sind Stimmung und kein neues Wirtschaftssystem. Arbeitsruhe kostet keine Steuern und verändert nicht das Wachstum. Ein Feiertag zählt höchstens wie ein Sonntag. Ob ein Fest wie der Markt einen kleinen Bonus fürs Wachstum gibt, entscheiden wir getrennt. Vorschlag: nein.

## Technische Details
- Neues Modul `src/game/feasts.ts`: `feastOn(now, realm) → FeastCode | null` (über die Realm-Uhr aus time.ts), julianischer Computus für `gameYear(now)`, Fenster je Fest (Vorabend/Nacht/Tag). Gibt Codes zurück, keinen Text.
- `isSunday`-Logik in people.ts erweitern: `isRestDay = isSunday || feast.rest`. Neue Aktivitäten bzw. Ziele (Feuer, Prozessionsroute) werden aus vorhandenen Plätzen wie Kirche, Anger und Straßenkacheln abgeleitet, z. B. der Platz fürs Osterfeuer über einen Hash des Dorfs.
- Darstellung: Feuer, Türgrün, Eierkörbe, Pfingstbaum, Masken und Baldachin als gemalte Requisiten in folk-sprites/seasonal-props, eingehängt in die Tiefensortierung. Das Nachtlicht für Fackeln läuft über night.ts.
- Overlay: neue Pergament-Art „feast“ in Game.tsx, gelesen bzw. gemerkt über localStorage mit dem Schlüssel aus Fest + Spieljahr. Neue Texte in `src/game/lang/feasts.ts` (8 Sprachen).
- Tests: Ostertermin 1501 (julianisch 11. April) und 1502, Weihnachten 25.12., Arbeitsruhe an Ostern, kein Fest an normalen Tagen, Realm-Uhr wird beachtet.
- AGENTS.md-Regel: Feste werden aus Datum und Realm-Uhr abgeleitet und nie gespeichert.
