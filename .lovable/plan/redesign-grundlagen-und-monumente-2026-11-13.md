# Redesign der Spielmechanik – Grundlagen und Umsetzungsplan

**Stand:** 13.11.2026  
**Referenzstand:** `main` – `1c9107d4f2ad6295cee6551d9c28a737320fbfaa`  
**Status:** Verbindlicher Arbeitsplan, noch keine Implementierungsfreigabe für spätere Blöcke

## Leitstern und unverhandelbare Designziele

- **Das Dorf stirbt nie.** Auch ohne Aktivität bleibt es ein lebendiger, sich selbst tragender Ort. Keine Verarmungsspirale, kein Bevölkerungskollaps und kein Verfall durch Abwesenheit.
- **Mit dem Spieler wird das Dorf zur Stadt.** Aktivität und Investitionen schaffen einen spürbaren Entwicklungsvorsprung: mehr Wohnraum, Berufe, Infrastruktur, gesellschaftliche Differenzierung und städtische Funktionen.
- **Kein Anwesenheitszwang.** Es gibt keine täglichen Pflichten, künstlichen Unterhaltsstrafen oder Nachteile für längere Abwesenheit.
- **Drei gleichwertige Wege.** Kornkammer (Ebene), Werkbank (Hügelland) und Tor zur Welt (Küste/Fluss) erreichen dasselbe langfristige Entwicklungspotenzial auf unterschiedliche Weise.
- **Investitionen müssen etwas bewirken.** Jeder Kauf soll eine sichtbare oder spielmechanisch nachvollziehbare Funktion haben. Keine bloßen Zahlenboni ohne Wirkung.
- **Die Welt bleibt gemeinschaftlich.** Handel, Nachbarschaft, Straßen, Märkte und gemeinsame Projekte ergänzen die Entwicklung des einzelnen Orts.
- **Progress not perfection.** Kleine, testbare und auslieferbare Schritte. Keine Big-Bang-Neuentwicklung und keine unnötige Perfektionierung vor dem ersten Nutzen.

## Vorgehen und Sicherheitsregeln

1. Vor jedem Block aktuellen `main`-Commit und tatsächlich aktiven Preview-Stand feststellen. Änderungen von Lovable werden nach GitHub gepusht; keine unnötige Annahme, dass ein anderer Branch oder eine manuelle Übertragung nötig sei.
2. Bestehende Spieler und ihre Kassen schützen: keine rückwirkende Änderung bereits gebuchter Steuerbelege, Guthaben, Käufe oder Belohnungen.
3. Keine gespeicherten Wachstumszustände neu einführen, solange die bestehende deterministische Ableitung aus Siedlung, Zeit, Käufen und Netzwerk ausreicht.
4. Jede ökonomische oder wachstumsrelevante Regel muss auf Client und vertrauenswürdiger Serverseite/Datenbank dieselbe Bedeutung haben. Spiegelungen in SQL und Migrationsregeln gehören zum selben Arbeitsschritt.
5. Jede Änderung zuerst gegen bestehende Tests und eine kleine, feste Referenzmatrix prüfen; danach die vollständige relevante Testsuite ausführen.
6. Keine großen Balancing-Änderungen verstecken: alte und neue Werte sowie Auswirkungen auf bestehende Beispielorte ausdrücklich ausweisen.
7. Die vorhandene Welt darf durch eine Korrektur nicht unbemerkt schlechter werden. Bei Änderungen an Einwohnern, Wohnungen, Rang oder Wachstum sind Vorher-/Nachher-Vergleiche verpflichtend.

---

# Umsetzungsblöcke

## Block 0 – Referenz sichern und Messlatte festlegen

**Ziel:** Vor Änderungen einen belastbaren, reproduzierbaren Ausgangspunkt schaffen. Kurz halten; kein neues Analyseprojekt aufmachen.

### Arbeit
- Aktuellen Commit, Preview-Stand und vorhandene Tests festhalten.
- Repräsentative bestehende Siedlungen sichern: Ebene, Hügelland, Küste/Fluss; junge und alte Orte; gut gepflegte und wenig gepflegte Orte; alleinstehende und vernetzte Orte.
- Für diese Orte mindestens erfassen: Einwohner, Haushalte/Wohnungen, Rang, Entwicklungsalter, Kasse, Tagessteuer, Wohlstand/Standesanteile, Krankheitsrate und Versorgung.
- Die bestehende 730-Tage-Simulation als Referenz sichern, ihre Modellannahmen aber sichtbar von echten Spielregeln trennen.

### Abnahmekriterien
- Ein kleines Referenzset mit reproduzierbaren Eingaben und Vorher-Werten liegt vor.
- Es ist klar, welche Ergebnisse aus Live-Code stammen und welche von Annahmen der Offline-Spielerprofile abhängen.
- Keine Änderung am Live-Spiel.

## Block 1 – Grundkonsistenz der Simulation bereinigen (höchste Priorität)

**Ziel:** Die zentralen Kennzahlen und Regeln dürfen sich nicht widersprechen. Das ist die Grundlage für Standort-Balancing, Monumente und die nächsten zwei Jahre Entwicklung.

**Arbeitsprinzip:** Erst Definitionen und Datenflüsse klären, dann eindeutige Fehler korrigieren. Keine neuen Features und noch kein großes Zahlen-Balancing.

### 1.1 Wohlstand: eine verbindliche Bedeutung

**Befund im Code**
- `civicWealth()` und `prosperityAt()` berechnen unterschiedliche Größen und werden beide als Wohlstand bzw. Wohlstandsgrundlage verwendet.
- `civicWealth()` berücksichtigt unter anderem Alter, Charta, Bürgerstraßen, öffentliche Gebäude, Titel, Gildenränge und Prestige-Stufen.
- `prosperityAt()` leitet Wohlstand aus realen Einwohnern und öffentlichen Werken ab; dieser Wert beeinflusst die Verteilung der sozialen Stände.
- `attributes()` sammelt zusätzliche Wohlstandsboni in `b.wealth`, gibt am Ende aber den Wert aus `prosperityAt()` zurück. Die gesammelten Boni sind damit nicht automatisch der tatsächlich zurückgegebene Wohlstand.
- Prestige- und Weg-Monumente werden in den Berechnungen nicht durchgehend gleich behandelt. Außerdem unterscheiden sich Kaufzeit, sechs Stunden Reifezeit und tatsächliches bauliches Fertigstehen.

**Umsetzung**
- Alle Verbraucher beider Berechnungen inventarisieren: HUD/Attribute, soziale Stände, Bewohnerdarstellung, Steuer, Hochzeiten/Mitgift, Monumente und Datenbankfunktionen.
- Eine verbindliche Definition für **gesellschaftlichen Wohlstand** festlegen. Dieser Wert muss in Anzeige, sozialer Verteilung und Besteuerung dieselbe Bedeutung haben.
- Falls daneben eine eigenständige Größe wie institutionelles Prestige oder kommunale Ausstattung sinnvoll bleibt, diese ausdrücklich anders benennen und nicht mehr als denselben Wohlstand ausgeben.
- `attributes()` so korrigieren, dass angezeigte Werte und tatsächlich verwendete Mechaniken dieselbe Quelle haben. Keine Boni berechnen, die anschließend wirkungslos verworfen werden.
- Alle zehn Monumente und alle drei Weg-Monumente konsistent berücksichtigen.
- Die Datenbank-/SQL-Spiegelung anpassen, soweit sie dieselbe Größe für Steuer oder Abrechnung verwendet.

**Abnahme**
- Für einen identischen Ort und Zeitpunkt liefern HUD, soziale Standesverteilung und Steuerberechnung dieselbe definierte Wohlstandsgrundlage.
- Jede Abweichung zu einer separaten Prestige-/Ausstattungsgröße ist absichtlich benannt und dokumentiert.
- Kein bereits gebuchter Steuerbeleg und kein bestehender Kassenstand wird rückwirkend verändert.

### 1.2 Gesundheit und Krankheit: Doppeldefinitionen und überladene Effekte auflösen

**Befund im Code**
- `people.ts / sickRate()` bestimmt die tatsächliche Krankheitswahrscheinlichkeit der Bewohner. Sie berücksichtigt Jahreszeit, Kräuterhütte, Heiler, Beginenhof, Kultur-Charta sowie Effekte von Erntehalle, Dom, Universität und Orangerie.
- `prosperity.ts / sickTaxRate()` verwendet eine vereinfachte Berechnung: Winter wird dort über feste UTC-Monate abgebildet; mehrere im Live-Leben berücksichtigte Monument- und Betreuungseffekte fehlen.
- `resident-tax.ts` zieht Kultur-Charta und Beginenhof zusätzlich ab, bildet aber nicht automatisch alle Effekte aus `sickRate()` ab.
- Mehrere Einrichtungen senken denselben Prozentwert. Durch die Untergrenze von einem Prozent verlieren spätere Investitionen ihren Grenznutzen oder werden ganz wirkungslos.
- Die tatsächliche Betreuung durch Erkrankte und Pflegende (z. B. Beginenhof) ist etwas anderes als die Wahrscheinlichkeit, dass jemand erkrankt. Diese Funktionen dürfen nicht in einer einzigen Zahl verschwinden.

**Umsetzung**
- Ein gemeinsames, deterministisches Krankheitsmodell definieren: Grundrisiko, Jahreszeit, Prävention, Pflege und Krankheitsdauer.
- Klar trennen zwischen **Erkrankungswahrscheinlichkeit**, **Anteil betroffener Haushalte**, **Arbeitsausfall/Pflege** und **steuerlichem Ausfall**. Diese Größen müssen logisch aus derselben Krankheitsgrundlage abgeleitet sein.
- Eine gemeinsame Effektmatrix für Kräuterhütte, Heiler, Beginenhof, Kultur-Charta und alle Gesundheits-/Versorgungsmonumente anlegen.
- Jeder Effekt braucht einen eigenen, verständlichen Zweck. Nicht alle Gebäude senken pauschal dieselbe Krankheitswahrscheinlichkeit.
- Die harte Untergrenze und die Grenznutzen aller Effekte prüfen. Kein Kauf darf nur auf dem Papier wirken.
- Client-Berechnung, `resident-tax.ts` und SQL-Funktion(en) synchron halten. Die Frage, ob ein Fest-/Hochzeitsbonus auch steuerlich wirkt, ausdrücklich entscheiden und dokumentieren.

**Abnahme**
- Für denselben Ort und Zeitpunkt stimmen die Krankheitswahrscheinlichkeit in der Bewohner-Simulation und die ihr zugrunde liegende steuerliche Krankheitsannahme überein.
- Alle Gesundheitsgebäude haben einen messbaren, nicht durch die Untergrenze vollständig aufgehobenen Zweck.
- Keine doppelt oder widersprüchlich angewendeten Abzüge.
- Bestehende Steuerbelege bleiben unverändert; eine neue Regel gilt nur ab einem klar festgelegten Cutover.

### 1.3 Versorgung, Haushaltskapazität und Care-Gate sauber trennen

**Befund im Code**
- `CARE_FOOD` / `CARE_HEALTH` in `world.ts` entscheiden, welche Entwicklungsstufen freigeschaltet werden.
- `capacityAt()` / `foodCapacity()` in `households.ts` begrenzen die Zahl der Haushalte und verwenden eigene Listen und Gewichtungen.
- `goods.ts / larderOf()` berechnet die tatsächlichen Warenströme und Vorräte.
- Diese drei Dinge hängen zusammen, beschreiben aber unterschiedliche Sachverhalte. Die aktuelle Benennung und die teilweise unterschiedlichen Gebäudelisten machen ihre Wirkung schwer nachvollziehbar.

**Umsetzung**
- Drei klar benannte Funktionen unterscheiden: reale Versorgung/Vorräte, tragfähige Haushaltskapazität und Care-Gate für die nächste Entwicklungsstufe.
- Die Gebäudewirkungen zentral definieren oder eine nachvollziehbare gemeinsame Effektliste nutzen; keine unbemerkten Listen-Abweichungen.
- Festlegen, welche Gebäude Nahrung produzieren, Lagerkapazität erhöhen, Haushalte versorgen, Gesundheit/Pflege leisten oder lediglich eine Entwicklungsstufe ermöglichen.
- Das Grundprinzip erhalten: etablierte Haushalte verschwinden nicht wegen kurzfristiger Vorratsschwankungen. Winterknappheit darf Versorgung und Wachstum spürbar beeinflussen, aber kein Dorf auslöschen.
- Die Darstellung von Vorräten und die tatsächlichen Effekte auf Bewohner müssen verständlich bleiben.

**Abnahme**
- Für jede Versorgungs- und Gesundheitseinrichtung ist eindeutig, welchen der drei Bereiche sie beeinflusst.
- Care-Gate, Haushaltskapazität und Warenlager widersprechen sich nicht und sind in Tests getrennt abgedeckt.
- Keine bestehenden Haushalte gehen durch die Bereinigung verloren.

### 1.4 Zeitstufe, Siedlungsrang und Monumentfortschritt eindeutig definieren

**Befund im Code**
- `stageOf(effAge)` beschreibt die zeitliche Entwicklungs-/Bauphase.
- `townRank()` beschreibt den tatsächlich erreichten Rang aus Einwohnern, Wohnungen und Straßen.
- Beide Größen sind sinnvoll, aber nicht dasselbe. Unklare Verwendung führt zu scheinbar widersprüchlichen Freischaltungen.
- Bei Monumenten existieren bezahlte Stufen, baulicher Fortschritt und Effekte, die teilweise ab Kauf, teilweise nach Reifezeit oder bei physischem Stand wirken.

**Umsetzung**
- Die Unterscheidung **Zeitalter/Bauphase** versus **tatsächlicher Siedlungsrang** ausdrücklich dokumentieren und in allen Freischaltungen konsistent anwenden.
- Jede Monumentwirkung bekommt einen klaren Aktivierungszeitpunkt: bezahlt, im Bau oder fertiggestellt. Nicht je nach Funktion eine andere implizite Regel.
- Für Anzeige, Baufortschritt und Spielwirkung dieselbe Stufenlogik verwenden oder jede Abweichung ausdrücklich begründen.
- Keine unnötige Zusammenlegung der beiden Rangsysteme, wenn sie unterschiedliche Aufgaben erfüllen.

**Abnahme**
- Jede Freischaltung lässt sich eindeutig auf Zeitstufe oder tatsächlichen Rang zurückführen.
- Für jede Monumentstufe ist klar, wann sie sichtbar wird und wann ihre Wirkung beginnt.
- Bestehende Käufe behalten ihren Kaufdatensatz und ihre Kosten.

### 1.5 Client, Server, Datenbank und Offline-Simulation auf denselben Regelstand bringen

**Befund im Code**
- Mehrere Regeln werden im Client berechnet und für Kasse/Steuer in SQL gespiegelt.
- Die Offline-Simulation verwendet echte Spielformeln, enthält aber zusätzliche Annahmen über Login-Verhalten, Kaufreihenfolge und Nachbarstraßen.
- In `simulation/engine.ts` wird die Care-Kaufreihenfolge unabhängig vom Profil versucht; selbst das Profil `sparsam` ist dadurch kein vollständiges autonomes Dorf.
- Das Modell legt außerdem exemplarische Nachbarverbindungen an festen Simulationstagen an. Das ist eine Modellannahme, kein allgemeines Spielgesetz.

**Umsetzung**
- Für jede wirtschafts- oder wachstumsrelevante Formel den autoritativen Ort und seine Spiegelungen dokumentieren.
- Client und SQL mit gemeinsamen Referenzfällen auf Parität testen.
- Offline-Spielerprofile ausdrücklich als Verhaltensmodelle kennzeichnen.
- Einen echten **Autonom-/Nullaktivitätsfall** ergänzen: keine Käufe, keine Entscheidungen, keine automatisch erzeugten Straßen oder Nachbarn.
- Gelegentliche, regelmäßige und sehr aktive Profile beibehalten, aber Kauf- und Nachbarschaftsverhalten sichtbar als Annahme parametrisieren.
- Rang-Neuberechnung im Simulationsmodell präzise genug takten, damit die berichteten Rangtage nicht als exakte Live-Prognose missverstanden werden.

**Abnahme**
- Ein Regel-Fall hat dieselbe Bedeutung im Client, auf dem Server/in SQL und in der Offline-Simulation.
- Autonomes Dorf, gelegentlicher Spieler und aktiver Spieler sind getrennt messbar.
- Modellannahmen stehen im Report neben den Ergebnissen.
- Der Live-Spielstand und seine Kassen bleiben geschützt.

### Ergebnis von Block 1

Eine kurze, aktuelle **Regelkarte der Simulation** liegt vor. Sie hält für die wichtigsten Systeme jeweils fest:
- maßgebliche Funktion und Datenquelle;
- abhängige Systeme;
- Client-/SQL-Spiegelung;
- Aktivierungszeitpunkt;
- relevante Tests;
- bewusste Ausnahmen.

Die Regelkarte ist kein Selbstzweck: Sie soll künftige Widersprüche verhindern und nach Abschluss direkt als Grundlage für Standort- und Monumentumbau dienen.

---

## Block 2 – Standortabhängiges Wachstum: drei gleichwertige Entwicklungswege

**Ziel:** Ebene, Hügelland und Küste erreichen bei vergleichbarer Pflege ein ähnliches langfristiges Entwicklungspotenzial, aber mit eigenem Charakter und eigener Stadtgestalt.

### Arbeit
- `townCharacter()`, bestehende Handels-/Terrainklassifikation und ihre Verbraucher auf konsistente Standortbestimmung prüfen.
- Die derzeit in `density.ts` identischen Mehrwohnungsregeln nach Siedlungscharakter differenzieren.
- Kornkammer: Fläche, Höfe und viele Wohnungen.
- Werkbank: frühere/stärkere Mehrgeschossigkeit, steinerne und verdichtete Wohnquartiere.
- Tor zur Welt: Küsten- und Korridorwachstum, Hafenquartiere und Kaufmannshäuser.
- Landwirtschaft, Nahrung und Haushaltskapazität bleiben je Standort gleichwertig; die Quelle der Versorgung unterscheidet sich.
- Bestehende Gründungsorte nicht rückwirkend entwerten; keine Siedlung darf Bewohner oder Rang verlieren.

### Zielwerte und Tests
- Jede Lage kann die Hansestadt erreichen.
- Bei vergleichbarer Pflege liegen Einwohner und wirtschaftliche Entwicklung an Tag 730 grob innerhalb von ±10 %.
- Mehrere Standorte pro Charakter testen: offen, eng, Küste/Fluss und schwieriges Gelände.
- Vernetzte und isolierte Orte separat messen.
- Die bisherigen Rangschwellen nicht vorab absenken. Erst nach Tests entscheiden, ob 2.500 Einwohner / 700 Wohnungen / zwei Straßen für alle drei Wege realistisch erreichbar sind.

### Abnahme
- Kein Charakter ist ein struktureller Nachteil.
- Unterschiede sind im Stadtbild und in den jeweiligen Stärken sichtbar.
- Es entstehen keine kostenlosen Haushalte und keine unerklärlichen Steuergewinne.

## Block 3 – Monumente: zehn klare Funktionen statt dekorativer Zahlenboni

**Ziel:** Jedes Monument hat einen erkennbaren Hauptnutzen, und jede bezahlte Stufe bringt einen verständlichen Fortschritt.

### Gestaltungsregeln
- Pro Monument ein primärer Hebel; keine vier Monumente, die nur dieselbe Krankheitszahl senken.
- Vorstufen erhalten kleine Teilwirkungen desselben Hauptnutzens.
- Die drei Weg-Monumente sind gleichwertige, charakteristische Entwicklungsentscheidungen.
- Keine automatische neue Geldquelle und keine Pflicht zum Monumentbau.
- Wirkung muss im Spiel sichtbar oder anhand eines konkreten Ereignisses nachvollziehbar sein.
- Effekte werden erst nach Abschluss von Block 1 final festgelegt, damit keine widersprüchlichen Grundformeln erneut eingebaut werden.

### Vorläufige Funktionsrichtung
- **Belfried:** Feuerwarnung/Brandbekämpfung und begrenzte Sicherheit gegen Überfälle.
- **Tanzhaus:** öffentliches Fest- und Gemeinschaftsleben; keine künstlich erzeugten Einwohner oder Geldgeschenke.
- **Erntehalle:** Kornspeicher und Versorgungssicherheit im Winter.
- **Zunftturm:** Bauwesen und schnellerer Baufortschritt.
- **Leuchtfeuer:** Küstenhandel, sichere Wege und bessere Handelsreichweite.
- **Dom:** kirchliche Institution, Armenpflege und gesellschaftlicher Zusammenhalt.
- **Universität:** Wissen, Ausbildung und qualifizierte Wandergesellen.
- **Schütting/Börse:** Umschlag und Transit im Handelsnetz.
- **Klostergarten:** Heilkräuter und medizinische Versorgung.
- **Artushof:** hochrangige Kultur, Hanse-Bankette und Bindung von Handelspartnern.

### Umsetzung
- Vorhandene Mechaniken zuerst nutzen; keine unnötigen neuen Subsysteme.
- Jede Stufe in derselben Logik aus Kauf, Baufortschritt und Effektaktivierung berechnen.
- Bei Server-relevanten Effekten Datenbank-Spiegelung im gleichen Block ergänzen.
- Preise und Gesamtinvestitionsvolumen zunächst nicht pauschal erhöhen.
- Jedes Monument einzeln oder in kleinen, thematisch passenden Paketen simulieren.

### Abnahme
- Jede Stufe hat einen realen und dokumentierten Nutzen.
- Kein Effekt ist durch eine harte Untergrenze vollständig entwertet.
- Keine unbeabsichtigte Zunahme von Steuer, Kassenüberschuss oder Bevölkerung.
- Drei Weg-Monumente sind in Nutzen und Investitionswert vergleichbar.

## Block 4 – Langfristige Perspektive und freiwillige Stadtprojekte

**Ziel:** Auch nach Handels- oder Hansestadt bleiben attraktive Ziele, ohne künstlichen Ausgabenzwang.

### Arbeit
- Den vorhandenen Offline-Ansatz **Model C** für freiwillige kommunale und regionale Projekte prüfen und für ein späteres Live-Feature vorbereiten.
- Projekte wie Marktbrunnen, Spital, Ratswaage/Kranhaus, Stadtmauer, Hafenkai, Brücke, Geleitweg, Schleuse und Städtebund-Tagfahrtstube als sichtbare Langzeitziele weiterentwickeln.
- Kommunale und regionale Finanzierung unterscheiden; gemeinsame Projekte müssen echte Kooperation ermöglichen.
- Der Spieler entscheidet freiwillig, ob und welches Projekt er finanziert.
- Keine automatische Steuerabführung, keine Pflichtprojekte und keine Strafe bei Nichtteilnahme.

### Abnahme
- Ein Projekt ist ein attraktives Angebot, keine Voraussetzung für das Überleben oder den Rang.
- Fertigstellung verändert die sichtbare Welt und hat einen passenden Nutzen.
- Regionale Projekte funktionieren auch bei ungleicher Aktivität der beteiligten Spieler.

## Block 5 – Sichtbarkeit, Erklärung und Feinschliff

**Ziel:** Die neue Mechanik ist für Spieler verständlich, ohne dass sie Tabellen studieren müssen.

### Arbeit
- Wichtige Wirkungen in HUD, Bau-Menü, Monumentbeschreibung und Chronik erklären.
- Den eigenen Siedlungscharakter und seine Stärken/Entwicklungsmöglichkeiten sichtbar machen.
- Bei Care-Gate und Rangfortschritt klar zeigen, was fehlt und warum.
- Änderungen an laufenden Spielständen transparent ankündigen.
- Balancing nach realem Live-Verhalten weiter beobachten; keine vorschnellen Zusatzsysteme.

### Abnahme
- Spieler verstehen den nächsten sinnvollen Entwicklungsschritt.
- Kein Bonus bleibt eine unsichtbare interne Zahl.
- Die Darstellung erklärt auch, warum zwei Orte unterschiedlich wachsen.

---

# Konkrete Reihenfolge: schnell liefern, Grundlagen nicht überspringen

1. **Block 0 klein abschließen** – Referenzwerte und Preview-Situation sichern.
2. **Block 1 zuerst umsetzen**, aber in kleinen PR-/Commit-fähigen Scheiben: 1.1 Wohlstand, 1.2 Gesundheit, 1.3 Versorgung/Care, 1.4 Rang- und Monumentzeitpunkte, 1.5 Client/SQL/Simulation-Parität.
3. Nach jeder Scheibe Tests und Vorher-/Nachher-Referenzwerte prüfen; nicht auf die komplette Grundsatzsanierung warten, bevor ein sauber abgegrenzter Fix ausgeliefert werden kann.
4. **Block 2 Standortwachstum** als nächstes großes Balancing-Paket.
5. **Block 3 Monumente** auf dem bereinigten Regelwerk ausbalancieren und in kleinen Gruppen ausliefern.
6. **Block 4 Stadtprojekte** als langfristiges Endspiel.
7. **Block 5 Sichtbarkeit** parallel dort ergänzen, wo eine neue Mechanik sonst nicht verständlich wäre.

## Explizit nicht tun

- Keine vollständige Neuentwicklung der Simulation.
- Keine künstlichen Unterhaltskosten, Verfallsmechaniken oder täglichen Pflichten.
- Keine pauschale Absenkung von Wachstum, Einwohnern oder Steuern als schnelle Lösung der Geldschwemme.
- Keine Senkung der Hansestadt-Schwellen, bevor die drei Standortwege belastbar getestet wurden.
- Keine Monumente mit weiteren beliebigen Wohlstands-/Gesundheitspunkten aufladen.
- Keine Rückwirkung auf bereits gebuchte Steuern oder ausgegebene Guthaben.
- Keine neue persistente Wachstumsdatenbank, wenn deterministische Ableitung genügt.
- Keine gleichzeitige Änderung von Wachstum, Steuer, Preisen und Monumenteffekten ohne getrennte Messung.

## Erste konkrete Arbeitsfreigabe

**Jetzt nur Block 0 und Block 1 bearbeiten.** Block 1.1 (Wohlstand) und 1.2 (Gesundheit/Krankheit) sind die ersten Implementierungsscheiben. 1.3 bis 1.5 folgen unmittelbar, jeweils klein und testbar. Block 2 und alle Monumenteffekte bleiben bis zur Bereinigung der Grundlagen konzeptionell vorbereitet, aber werden noch nicht parallel umgebaut.

Bestehende Spielstände, Kassen und gebuchte Steuern haben Vorrang vor einer theoretisch eleganten Vereinheitlichung.
