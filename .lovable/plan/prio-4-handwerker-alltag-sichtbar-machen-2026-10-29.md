# Prio 4: Handwerker-Alltag sichtbar machen

Ziel: Fischer, Schmied und Müller zeigen ihre Arbeit draußen mit gemalten, flüssigen Bewegungen statt nur Rauch aus dem Schornstein.

## 1. Fischer am Ufer
- Neuer gemalter 6-Bild-Ablauf: Rute auswerfen, warten, einholen (Mann + Frau).
- Der Fischer steht am Ufer mit Blick aufs Wasser; kleine gemalte Wasserringe, wo die Schnur eintaucht.
- Ab und zu (fester Takt nach Weltuhr) zappelt ein Fisch am Haken und landet im Korb neben ihm.
- Nachts und im tiefen Winter (zugefroren) kein Fischen.

## 2. Schmied mit Amboss
- Gemalter Amboss vor der Schmiede, Schmied mit 4-Bild-Hammerzyklus.
- Beim Aufschlag kurze, gemalte Funkengarbe (glühend, auch nachts sichtbar und leuchtend).
- Leiser Hammerklang im Takt (nutzt vorhandene Schmiede-Geräuschkulisse, nur bei Nähe).

## 3. Müller mit Mehlsäcken
- Am Mühlentor stapeln sich gemalte Mehlsäcke; Stapelhöhe folgt dem Mehlvorrat aus der Vorratskammer.
- Der Müller trägt im ruhigen Zyklus einen Sack vom Tor zum Stapel (vorhandener Träger-Laufzyklus mit Sack).
- Gleiches Prinzip dezent auch an der Bäckerei: Brotkorb vor der Tür, solange Brot da ist.

## Gemeinsame Regeln
- Alles leitet sich aus Weltuhr, Beruf und Gebäude ab – nichts wird gespeichert, alle Spieler sehen dasselbe.
- Nur gemalte Bilder, keine Vektorstriche; Nachtlicht-Ebene für Funken.
- Arbeit nur in Arbeitszeiten, sonntags ruhen Schmied und Fischer.

## Technische Details
- Neue Sprites in `src/assets/sprites/folk/`: fisher-cast.webp (+ -f), smith-hammer.webp, anvil.webp, sparks.webp, flour-sacks.webp, bread-basket.webp, fish-basket.webp; Laden über folk-sprites.ts.
- people.ts: Fischer/Schmied/Müller bekommen beim Arbeiten einen festen Platz (Ufer / Amboss vor `front(smithy)` / Mühlentor) statt Innenarbeit; Schmied in OUTDOOR_WORK.
- render.ts: TOOL_WORK-Zyklen um "cast" und "hammer" erweitern (Bildwahl nach clock(), weiches Überblenden), Requisiten am Gebäude zeichnen, Sackstapel aus storedAt().
- night.ts: Funken als Licht-Ebene.
- Kleine Tests: Fischer ruht nachts/sonntags, Sackstapel wächst mit Mehlvorrat.
