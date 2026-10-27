# Bewohner: Bewegung, Sprechen, Verhalten – einheitliches Konzept

## Was heute schiefläuft (im Code bestätigt)
- **Zu schnell:** Erwachsene laufen 0,55 Felder/Sek., Kinder 0,8. Seit die Figuren auf ~55 % verkleinert wurden, wirkt das wie Rennen.
- **Schweben:** Beim Herumstehen wandern Bewohner per Rauschen langsam umher (bis ±0,25 Felder), aber ohne Laufanimation – sie gleiten. Auch die Schrittfrequenz ist fest an die Strecke gekoppelt und passt nicht zur Figurengröße.
- **Ziellos:** Freizeit = an einem Punkt stehen und driften; Kinder laufen endlose Kreise.
- **Sprechblasen im Takt:** Alle Gespräche im ganzen Dorf wechseln gleichzeitig alle 3 Minuten, und *alle* Paare wechseln den Sprecher synchron alle 2,6 Sekunden.

## Grundsatz
Alles bleibt eine reine Funktion von Bewohner + Uhrzeit (kein gespeicherter Zustand), damit jeder Spieler dasselbe sieht. Jeder Bewohner bekommt aber eine **eigene Zeitverschiebung und eigenes Tempo**, damit nichts im Gleichtakt passiert.

## 1. Gehen
- Tempo auf ca. 40 % senken (Erwachsene ~0,22, Ältere ~0,15, Kinder ~0,3 Felder/Sek.), mit leichter persönlicher Streuung.
- Schrittfrequenz aus Schrittlänge der verkleinerten Figur ableiten, damit Füße nicht rutschen.
- Sanftes Anlaufen und Abbremsen an Start/Ziel, kurze Pausen an Türen.
- Regel: **Jede Ortsveränderung zeigt Laufanimation** – kein Gleiten mehr. Das Driften im Stand wird entfernt und ersetzt durch Gewicht verlagern, Kopf drehen, sich umsehen (Pose ohne Ortswechsel).

## 2. Zielgerichtetes Verhalten
Freizeit wird zu einer Folge kurzer, sichtbarer Vorhaben (je 5–20 Min., pro Person versetzt):
- zum Brunnen/Marktplatz gehen, auf der Bank sitzen, Nachbarn besuchen, am Feldrand stehen, Tiere anschauen.
- Kinder: Fangen zwischen zwei Punkten, Ball, zu Eltern laufen – statt Kreise.
- Arbeit: kurze Arbeitszyklen (hacken, tragen, Pause) mit zufällig versetztem Start.
- Abends gezielt nach Hause, nachts niemand draußen außer Ausnahmen (Wächter, Wirtshausgäste).

## 3. Gespräche
- Gespräche entstehen nur, wenn zwei Personen tatsächlich am selben Treffpunkt sind; sie gehen aufeinander zu und stellen sich gegenüber.
- Jedes Gespräch hat eigene Start- und Dauerzeit (1–4 Min.), versetzt pro Paar – kein dorfweiter Wechsel.
- Sprecherwechsel unregelmäßig (3–9 Sek. pro Beitrag, mit Pausen ohne Blase).
- Höchstens ein Teil der Paare zeigt gleichzeitig eine Blase; Blasen blenden weich ein/aus.
- Gesten statt nur Blasen: Nicken, Arm heben, Lachen.
- Gruppen von 3 möglich (Markt, Wirtshaus).

## 4. Umsetzung in Schritten
1. Tempo + Schrittfrequenz + kein Gleiten (größter sichtbarer Effekt).
2. Gespräche entkoppeln (Paar-eigener Takt, Pausen, Einblenden).
3. Zielgerichtete Freizeit-Vorhaben und neue Kinderspiele.
4. Gesten und Gruppen.
Nach jedem Schritt Sichtprüfung im Spiel per Bildschirmfotos.

## Technische Details
- `people.ts`: `speed`-Werte senken; `phase` aus Schrittlänge (`PERSON_SCALE`) berechnen; Ease-in/out über Weglänge; Rausch-Drift in `poseOf` entfernen, stattdessen `idle`-Gestenfeld in `Pose`.
- Freizeit: `planOf` erzeugt deterministische Unter-Einträge (Hash aus id + Zeitfenster) mit Zielen aus vorhandenen Gebäuden/Plätzen; Weg über bestehendes `route()`.
- `townPoses`: `slot` pro Paar = `floor((now + offset(id)) / dauer(id))`; Sprecherwechsel über per-Paar-Hash-Sequenz statt `now/2600`; Anteil sichtbarer Blasen begrenzen; Alpha für Fade an `render.ts` übergeben.
- Tests: kein Bewohner ändert Position ohne `walking`; Gesprächsstarts zweier Paare fallen nicht zusammen; Tempo-Obergrenze.
