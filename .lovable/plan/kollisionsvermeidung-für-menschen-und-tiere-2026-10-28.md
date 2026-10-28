# Kollisionsvermeidung für Menschen und Tiere

## Problem
Auf dem Screenshot steht ein Kind auf dem Rücken eines Schafs, ein anderes läuft durch ein Schaf hindurch. Ursache: Menschen (people.ts) und Schafe (animals.ts) werden unabhängig voneinander berechnet. Jeder Teil prüft nur, ob die Kachel frei von Gebäuden ist (`freeAt`), aber nicht, ob dort schon jemand steht. Wanderer, Karren und Arbeiter kennen sich ebenfalls nicht gegenseitig. Das schon vorhandene seitliche Ausweichen beim Laufen ist nur ein fester Versatz.

## Grundsatz
Die Welt bleibt eine reine Funktion von Samen und Uhrzeit, damit alle Spieler dasselbe sehen. Deshalb gibt es keine Physik mit gespeichertem Zustand, sondern zwei deterministische Ebenen:

```text
1. Planung (people.ts / animals.ts)  -> Plätze werden so vergeben, dass sie sich nicht überschneiden
2. Feinausgleich (render.ts, pro Bild) -> kleine Rest-Überlappungen werden weich auseinandergeschoben
```

## Schritt 1: Gemeinsame Belegung pro Kachel
- Neues Modul `src/game/space.ts` mit Fußabdrücken (Ellipsen am Boden): Erwachsener, Kind, Schaf, Ochse, Wagen, Baustellenmaterial.
- `sheepSpots(tile, now)` liefert die Schafpositionen einer Weide als reine Funktion. Diese Funktion nutzen `animals.ts` und die Menschenplanung gemeinsam.

## Schritt 2: Menschen planen um Tiere herum
- Spielplätze (`kidSpot`), Stehplätze, Gesprächspartner und Arbeitsplätze auf Weiden und Feldern meiden die Fußabdrücke der Schafe zum jeweiligen Zeitpunkt. Ist ein Platz belegt, rückt die Figur zum nächsten freien Punkt am Kachelrand.
- Kinder spielen am Weiderand statt mitten in der Herde.

## Schritt 3: Tiere weichen aus
- Liegt das Wanderziel eines Schafs auf einem Menschen oder einem anderen Schaf, wird es deterministisch verschoben. Schafe halten untereinander einen echten Mindestabstand statt fester Bahnen.

## Schritt 4: Weicher Feinausgleich beim Zeichnen
- In `render.ts` werden pro Bild alle sichtbaren Figuren, Schafe und Ochsen einer Kachel gesammelt. Paare, die sich überlappen, werden entlang ihrer Verbindungslinie auseinandergeschoben (2 Durchgänge). Das Ergebnis zählt nur für die Darstellung.
- Wer läuft, weicht stehenden Figuren aus. Menschen weichen Tieren aus, Tiere aber nicht Karren. Laufrichtung und Blickrichtung bleiben unverändert, damit nichts zuckt.
- Weil die Eingaben bei allen Spielern gleich sind, sieht auch jeder dasselbe Ergebnis.

## Schritt 5: Wege und Fahrzeuge
- Begegnen sich zwei Karren auf einer Handelsstraße, fahren sie rechts aneinander vorbei, statt sich zu durchdringen. Fußgänger auf derselben Straße gehen an den Rand.

## Schritt 6: Tests
- Für eine Beispielweide über 24 Stunden: Kein Kind und kein Erwachsener steht näher als den Mindestabstand an einem Schaf.
- Kein Schaf überlappt mit einem anderen.
- Zwei Karren auf derselben Straße haben bei der Begegnung einen seitlichen Abstand.

## Technische Details
- Fußabdruck-Radien in Kachel-Einheiten, zum Beispiel Mensch 0,12, Kind 0,09, Schaf 0,18 x 0,1, Ochsenkarren 0,45.
- Belegung wird nur für sichtbare Kacheln und mit Cache pro (Kachel, Minute) berechnet. Der Aufwand bleibt deshalb gering.
- Die Regel wird in `src/game/AGENTS.md` festgehalten: Kollisionen werden abgeleitet, nicht gespeichert.
