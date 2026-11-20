# Wegbegegnungen beim Spaziergang mit dem Schulzen

## Ziel
Beim Herumlaufen mit dem Schulzen tauchen selten kleine, historisch stimmige Begegnungen (Norddeutschland um 1500) am Wegesrand auf. Man sieht sie auf der Karte, tippt sie an und es öffnet sich ein Pergament – bei Menschen ein mehrstufiges Gespräch, jederzeit mit „Mit Gruß weiterziehen" beendbar. Keine Auswirkung auf Geld, Wachstum, Steuern oder Zuzug.

## Inhalt
- 21 Begegnungen in vier Bereichen: Wanderer & fahrendes Volk, Tiere & Natur, Fundstücke (z. B. verlorener Brief), Arbeit & Glauben am Weg.
- Menschen: Gesprächsbaum Einstieg → 2 Vertiefungen → Abschluss, jede Stufe mit 1–2 Nachfragen plus Ausstieg.
- Tiere/Fundstücke: kurze Entscheidung (z. B. Tier aus der Falle befreien oder nicht), nur Stimmungstext als Folge, sichtbare Reaktion (Tier springt davon, Brief verschwindet).
- Alle Texte in allen 8 Spielsprachen.

## Häufigkeit und Platzierung
- Nur im Spaziermodus, nur außerhalb von Dörfern (auf Wegen, Heide, Waldrand, Deich, Ufer – passend zur Begegnung).
- Höchstens eine sichtbare Begegnung in der Nähe des Schulzen, nach einer Begegnung mehrere Stunden Pause; dieselbe Begegnung kehrt frühestens nach vielen Tagen wieder.
- Kein automatisches Aufploppen: nur wer die Figur antippt, öffnet das Pergament.

## Darstellung
- Gemalte Figuren/Requisiten aus vorhandenen Sprites (Wanderer, Pilger, Händler, Tiere, Karren), echt animiert; neue Requisiten (Falle, Brief, Wegkreuz) als gemalte Sprites im bestehenden Stil, keine Vektorgrafik.
- Während des Gesprächs bleibt der Schulze stehen und schaut die Figur an; danach geht die Figur weiter oder wendet sich ab.

## Technische Details
- Neue reine Datei `src/game/wayside.ts`: Begegnung wird aus (Karte, Tagesfenster, Wegkachel-Raster) abgeleitet – deterministisch, nichts in der Datenbank. Gesehen/zuletzt erlebt pro Konto in localStorage (try/catch), damit Wiederholungen und Pausen greifen.
- Dialogbäume als Daten (Knoten-IDs, Text-Schlüssel), Texte in `i18n.ts`/`lang/*`; Logik liefert nur Codes.
- Pergament-Komponente unter `src/components/hud/` mit Ausstiegsknopf auf jeder Stufe; Escape schließt (bestehende Hotkey-Kette).
- Zeichnung in der Tiefensortierung von `render.ts`, Antippen über bestehende Stroll-Klicklogik in `Game.tsx`.
- Tests: Seltenheit (max. eine pro Pause), keine Platzierung in Dorfreichweite/Wasser, jeder Dialogknoten hat Ausstieg, alle Schlüssel in 8 Sprachen vorhanden, keine Wirtschaftsfelder berührt.
- Keine Veröffentlichung.
