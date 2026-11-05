# Figuren und Gebäude historisch korrigieren (Norddeutschland um 1500)

Alle Funde aus der letzten Durchsicht werden behoben. Größe, Umriss, Standpunkt und Lichtrichtung jeder Grafik bleiben gleich, damit im Spiel nichts verrutscht. Spielwerte, Preise und Boni ändern sich nicht.

## 1. Hochzeitspaar
- **Braut:** kein weißer Tüllschleier, kein Dirndlmieder mit Puffärmeln, kein Rosenstrauß. Stattdessen langes Festkleid aus rotem oder blauem Wolltuch mit engen Ärmeln, Ziergürtel, offenes Haar mit Brautkranz, ein Rosmarinzweig am Kleid.
- **Bräutigam:** kein Alpenhut, keine Ansteckblume, keine Kniebundhose mit Schnallenschuhen. Stattdessen Wollrock mit Gürtel, enge Beinlinge, Kuhmaulschuhe, Barett oder Gugel.
- Gehen bleibt echt animiert: alle Bilder des Schrittzyklus werden gleich angepasst.

## 2. Glaslaternen entfernen
- Bäckerei, Handwerkerhaus, Wachstube, Spritzenhaus, Mietshaus, Stadthaus, Schulzensitz, Holzfällerlager: Glaslaternen werden zu Hornlaternen (trübe Hornscheiben) oder Wandhalter mit Kienspan bzw. Fackel.
- Die Unterstützer-Laterne (gusseiserner Mast) wird eine Hornlaterne an einem Holzpfahl.

## 3. Weitere Gebäude
- **Hafen:** Außenbordmotor und Plastikfender raus; Ruderboot mit Strohwülsten bzw. Tauwerk.
- **Spritzenhaus:** roter Spritzenwagen raus; Ledereimer, Feuerhaken, Leitern, kleine Messing-Handspritzen.
- **Lagerhaus:** Speicher aus Backstein mit Giebel, Ladeluken und Windenbalken statt Güterschuppen mit Schiebetoren.
- **Windmühle auf der Karte:** Bockwindmühle statt Holländermühle (Flügel passen weiter auf die Drehachse).
- **Leuchtturm:** wehrhafter Steinturm mit offenem Feuerkorb oben (wie Neuwerk) statt rot-weißem Turm mit Glaskuppel.
- **Markisen** an Bäckerei, Stadthaus 2 und Markthalle: hölzerne Ladenklappen statt gestreifter Stoffmarkisen.
- **Villa:** Stadthof eines Patriziers (Backstein, Treppengiebel) statt Vorstadt-Landhaus mit Klappläden und Parkbank.
- **Theater:** offene Bühne auf dem Markt bzw. Tanzhaus für Fastnachtsspiele statt Globe-Theater.
- Alle weiteren Punkte der letzten Liste werden ebenso umgesetzt.

## 4. Nachtlichter
Jedes geänderte Gebäude bekommt eine neu passende Nachtlicht-Ebene, damit die leuchtenden Fenster genau auf den neuen Fenstern liegen. Fehlt ein Fenster, verschwindet sein Licht.

## 5. Prüfung
Jede Grafik einzeln ansehen, Maße mit dem Original vergleichen, dann einige Gebäude bei Tag und Nacht im Spiel anschauen.

## Technische Details
- Bearbeitung per Bild-Edit (nicht Neugenerierung), danach auf Originalmaße und Transparenz zurückskalieren; Bodenanker unverändert.
- Night-Layer in `src/assets/sprites/night/` je geändertem Gebäude nachziehen (gleiche Maße/Anker, nur Licht).
- Hochzeits-Sprites: alle Frames/Richtungen konsistent; Mühle: `mill-body` an `mill-sails`-Achse ausrichten.
- Keine Code- oder Datenänderungen außer ggf. Namenstexten (Villa/Theater) im Übersetzungskatalog für alle 8 Sprachen.
