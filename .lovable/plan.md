# Schritt 3: Handwerk und Jahreszeiten sichtbar machen

Ziel: Was Bewohner, Chronik und Bitten erzählen, ist auch im Dorf zu sehen. Alles ergibt sich aus Jahreszeit, Weltuhr und Berufen, nichts wird gespeichert. So sehen alle Spieler dasselbe Dorf.

## Block 1: Herbst
- Korngarben (gemalte Hocken) auf abgeernteten Feldern, von der Ernte bis zum Pflügen.
- Rauch aus Dörröfen und Backhäusern an Herbsttagen, nur tagsüber.
- Holzstapel an der Nordwand von Wohnhäusern; sie werden im Herbst höher und schrumpfen über den Winter.

## Block 2: Winter
- Zugefrorene Tränken und Brunnentröge mit Eisglanz bei Frost; das Vieh steht an der Raufe statt am Wasser.
- Strohmäntel um junge und empfindliche Obstbäume, auch um gepflanzte Kirsche und Quitte.
- Geräumte Trampelpfade: Auf verschneiten Wegen und zwischen Haustür und Straße zeigt sich eine dunkle Spur.

## Block 3: Frühling
- Gejätete Beete: In Gärten liegen frische, dunkle Furchen, Bewohnerinnen hacken dort.
- Neue Flechtzäune um Gärten und Weiden; sie sind im Frühling hell und dunkeln über das Jahr nach.
- Erste Wäsche auf der Leine an trockenen Tagen. Sonntags hängt keine Wäsche, nachts wird sie abgenommen.

## Block 4: Handwerksszenen
- Böttcherei: Ein Handwerker biegt Fassdauben über offenem Feuer, mit Flammen und fertigen Fässern daneben.
- Webstube: Ein Webstuhl vor oder in der offenen Werkstatt, die Kettfäden bewegen sich im Takt.
- Beide verteilen sich auf die bestehenden Handwerker (keine neuen Gebäude, keine Preise). Bei Nacht und sonntags ruhen sie.

## Block 5: Das Geläut
- Zum Morgen-, Mittags- und Vespergeläut halten Feldarbeiter, Bauleute und Handwerker kurz inne. Sie stehen etwa 20 Sekunden mit gesenktem Kopf, dann geht die Arbeit weiter.
- Die Pause folgt derselben Uhr wie die hörbare Glocke ab Kleinstadt. In Dörfern ohne Glocke ruft die Kirchenglocke, wo eine Kirche steht.
- Passende neue Sprüche der Bewohner in allen 8 Sprachen (zum Beispiel über Garben, Wäsche, Frost). Die alten Scherze bleiben dabei erhalten.

## Grundsätze
- Nur gemalte Bilder im Stil der vorhandenen Dorfkunst, keine flachen Vektorformen.
- Gleiche Bilder in jeder Zoomstufe, mit Nachtlicht und Tiefensortierung (Verdeckung).
- Keine Änderung an Wachstum, Vorräten, Geld oder Aufgaben.

## Technische Details
- Neues reines Modul `src/game/seasonal-props.ts`: Aus Kachel, Hash und `seasonAt(now)` wird bestimmt, welches Requisit wo steht (Garben, Holzstapel, Eis, Strohmantel, Wäsche, Flechtzaun). Es wird über `addProp` in render.ts gezeichnet. Die Ground-Chunks bekommen den Saisonschlüssel bereits mit.
- Holzstapelseite: Nordwand im 2:1-Iso; die Höhe ergibt sich aus der Saisonphase.
- Neue gemalte Sprites (Garbe, Holzstapel, Eistrog, Strohmantel, Wäscheleine, Flechtzaun, Böttcherfeuer mit Dauben, Webstuhl) liegen alpha-zugeschnitten als WebP unter folk-sprites, jeweils mit Nachtschicht, wo Licht fällt (Feuer).
- `crafts.ts`: neue Szenen `cooperAt`/`loomAt` aus Weltuhr und `isSunday`, zugeordnet per Hash auf `crafter`; Requisiten im gespiegelten Rahmen des Arbeiters.
- Geläut: gemeinsame reine Funktion `pealAt(now)` in time.ts, von audio.ts und people.ts genutzt; in `poseOf` wird während des Fensters `act: "pause"` gesetzt.
- Tests: Saisonfenster (Garben nur Herbst, Eis nur Frost, keine Wäsche sonntags/nachts), Geläutfenster zu 06/12/18 Uhr Weltzeit, Werkstattszenen ruhen nachts. Bei jedem Block laufen alle Spieltests.
- AGENTS.md (src/game) erhält eine Regel zu abgeleiteten Saisonrequisiten.
