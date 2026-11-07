# Grafik-Feinschliff: Standpose und Nachtfenster

## 1. Maurer und Lastenträger stehen geschlossen
Bisher zeigen beide im Stillstand ein Bild aus dem Laufzyklus. Dabei bleiben die Beine halb geöffnet, als würden sie mitten im Schritt einfrieren.

- **Maurer:** Das vorhandene Standbild (gleiche Kleidung, Füße nebeneinander) wird fürs Stehen verwendet. Der Laufzyklus bleibt unverändert.
- **Lastenträger (Mann):** Sein vorhandenes Standbild steht ebenfalls im Schritt. Daher wird ein neues Standbild gemalt: aus seinem eigenen Laufbild abgeleitet, mit gleichem Kittel, gleichen Beinlingen und gleichem Sack auf der Schulter, die Füße geschlossen. Dabei gilt die übliche Bildgröße, und der Fußpunkt liegt auf derselben Bodenlinie.
- Die Lastenträgerin wird mitgeprüft und bekommt nur ein neues Bild, falls sie dasselbe Problem hat.
- Im Figurenkabinett (P) werden „Stehen" und „Gehen" beider Figuren nebeneinander geprüft: kein Größensprung, kein Kleidungswechsel, kein Versatz beim Wechsel zwischen Stehen und Gehen.

## 2. Nachtfenster der Kaufmannshäuser
- **Kaufmannshaus mit Gaube** (Kornland-Stil, Variante 1): Das Gaubenfenster im Dach bekommt nachts warmes Licht, passend zu den übrigen Fenstern.
- **Mittleres Haus** (Kornland-Handwerkerhaus, Variante 1): Bisher ist es nachts komplett dunkel. Es bekommt eine neue Lichtmaske mit allen echten Fenstern. Nach der Regel für schlichtere Häuser um 1500 leuchten sie gedämpft.
- Beide Masken übernehmen exakt Größe und Ausrichtung des Tagbilds, damit das Licht genau in den Fenstern sitzt. Holzbalken, Ziegel und Dekor bleiben dunkel.
- Die anderen Varianten beider Häuser werden kurz gegengeprüft.

## 3. Prüfung
- Nachtansicht beider Häuser und Standpose beider Figuren per Bildschirmfoto prüfen.
- Lauf-Test und Bild-Prüfskript laufen lassen.

## Technische Details
- Standbild: In `folk-sprites.ts` bekommen Figuren mit WALK4-Sheet einen optionalen Eintrag `STANDS` (Figur → Standsprite), der beim Stillstand statt des Passing-Frames gezeichnet wird. Die Skalierung wird so berechnet, dass Kopf-/Fußhöhe zum Walk-Sheet passen. Die Regel „standing uses its passing frame" in `src/assets/sprites/AGENTS.md` wird um diese Ausnahme ergänzt.
- Neues `porter-stand.webp` per Bildbearbeitung aus dem Passing-Frame von `porter-walk4.webp`, danach Alpha-Crop. Ein Lab-Card-Test stellt sicher, dass für mason/porter beim Stehen das Standsprite gewählt wird.
- Nachtmasken `cohesive/night/grain-patrician.webp` und `grain-handwerker.webp`: Fensterflächen per Skript aus dem Tagbild ermitteln (dunkle, eingerahmte Flächen in den Fassaden), warm füllen, einzeln kontrollieren. Gleiche Abmessungen wie das Tagbild.
