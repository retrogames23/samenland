# Fürstenbote: Texte in allen Sprachen und ein echter Reiter im Dorf

## 1. Erlass-Texte in allen 8 Sprachen
- Die 12 Erlass-Texte (Landkarten, Brief, Besuch, Hofjagd …) gibt es dann auch auf Französisch, Spanisch, Arabisch, Hindi, Chinesisch und Japanisch, jeweils im höfischen Ton der Sprache.
- Die angepassten Sätze, in denen ihr nicht mehr zum Schloss zurückkehrt („Unser Bote kommt wieder in Euer Dorf …“, „der Bote wartet in Eurem Dorf …“), werden in alle Sprachen übernommen. Bisher sagen die sechs anderen Sprachen noch „kehrt zum Schloss zurück“.

## 2. Der Bote reitet sichtbar ins Dorf
Das Reiten läuft als Ablauf in drei Teilen:

```text
Anreise (ca. 25 s)        Warten                          Abreise
Kartenrand/Straße  ->  vor dem Schulzensitz  ->  Depesche gelesen -> reitet davon
Trab-Schrittzyklus      Pferd steht, schnaubt,          Trab zurück, Staubwölkchen
Staubwölkchen           scharrt mit dem Huf, Bote
                        sitzt ab und hält das Siegel
```

- **Anreise:** Der Bote kommt auf der nächsten Handelsstraße angeritten. Gibt es keine Straße, kommt er über offenes Land. Er nutzt den gemalten Trab mit 4 Bildern, der schon für die Boten zwischen den Städten da ist. Dazu kommen ein weicher Übergang zwischen den Bildern, ein leichtes Wippen und kleine Staubwolken unter den Hufen. Zum Schulzensitz hin wird er weich langsamer, statt hart anzuhalten.
- **Warten:** Das Pferd steht ruhig. Es atmet sichtbar, nickt ab und zu mit dem Kopf, schweift mit dem Schweif und scharrt mit dem Huf. Der Bote steht neben dem Pferd, mit dem Schrittzyklus der Hof-Figur und schwingendem Gewand. In der Hand hält er die Depesche mit rotem Siegel, das sanft leuchtet. Ein Antippen öffnet das Pergament, so wie bisher der Knopf.
- **Abreise:** Wenn du die Depesche entgegengenommen hast, sitzt der Bote auf, wendet und trabt davon.
- **Nacht:** Nachts trägt der Bote eine Laterne. Dafür nutzen wir das vorhandene Nachtlicht, damit Licht und Dunkelheit stimmen.
- **Für alle gleich:** Ob der Bote kommt, wird aus den gespeicherten Erlassen und der Spieluhr berechnet. Nachbarn, die dein Dorf ansehen, sehen ihn also genauso. Nur du kannst ihn ansprechen.
- **Knopf oben:** Der Knopf „Bote des Fürsten“ bleibt als Abkürzung. Er führt die Kamera zum Boten und öffnet die Depesche.

## Was gleich bleibt
- Belohnungen, die 20 Stunden Pause, die Reihenfolge der 12 Erlasse, der Ritterschlag und der Hofdienst am Schloss.

## Technische Details
- `src/game/lang/edicts.ts`: Arrays für fr/es/ar/hi/zh/ja ergänzen, `edictText` auf alle Sprachen erweitern. In `src/game/lang/princely.ts` die Texte für `newTask` und `ready` in den 6 Sprachen anpassen.
- Neu `heraldVisit(seed, rows, now)` in `src/game/princely.ts` (pure): Phase arrive/wait/leave mit Fortschritt. `arrive` beginnt mit heraldDue, also Ende der Pause oder offener Erlass. `leave` beginnt, wenn der Erlass angenommen wurde. Der Weg führt über eine Straße (Straßenkacheln von `links`) oder in gerader Linie zum Platz vor dem Sitz (Kachel des Sitzes aus `LANDMARKS`).
- `render.ts`: `drawRider` bekommt Ausrollen, Staub und eine Pose für das stehende Pferd (Hals-Neigung über den Ausschnitt des Bildes, Atmen über scaleY um 1–2 %, Schweif). Der Bote zu Fuß verwendet das Sprite `herald.webp` über die vorhandenen Helfer in `figure.ts` (Gang mit Robe). Das Siegel wird im gespiegelten Bild gezeichnet, dazu kommt die Laterne aus `night.ts`. Alles läuft in der Tiefensortierung der Kacheln und nach der bestehenden Liste für die Silhouette (Bote = VIP, dort schon erlaubt).
- Antippen: Treffer über die vorhandene Auswahl von Figuren, dann `setHerald(true)`. Der Knopf im HUD ruft `focus` auf die Position des Boten auf.
- Test in `princely.test.ts`: Phasen von `heraldVisit`. Kein Bote vor der ersten Audienz und nach 12 Erlassen. Ankunft genau nach 20 h.
- Regel in `src/game/AGENTS.md` aktualisieren: Der Besuch des Boten wird berechnet und nie gespeichert.
