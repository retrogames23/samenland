# Gemeinsame Einwohnergrundlage und ehrliche Steuerbalance

## Geprüfter Ausgangspunkt
Die letzte Anpassung ist noch keine exakte Kopplung: Die Kasse begrenzt Einwohner pauschal auf 85 plus Zuschläge für Betriebe. Die sichtbaren Familien entstehen dagegen aus tatsächlich bewohnten Häusern, Versorgung, Jahreszeit und zeitweiligem Wegzug.

Ein überprüftes Beispieldorf hat nach einem Jahr im Winter 60 Bewohner, die Kasse rechnet aber mit 85. Mit allen Versorgungsbetrieben stehen im gleichen Beispiel 445 Bewohner nur 215 steuerpflichtigen gegenüber. Eine exakte Kopplung senkt daher nicht automatisch sämtliche Einnahmen: Gepflegte Städte würden teilweise deutlich mehr verdienen.

## 1. Eine gemeinsame Bewohnergrundlage
- Die vorhandene Berechnung bewohnter Häuser, Haushaltsgrößen und Wegzüge in einen gemeinsamen, rein deterministischen Baustein auslagern.
- Einwohnerdarstellung und Steuerberechnung verwenden denselben Baustein; keine zweite pauschale Einwohnerformel.
- Baustellen, unbewohnte Häuser und vorübergehende Besucher bringen keine zusätzliche Steuer.
- Käufe, Straßen und Versorgung werden jeweils zum betrachteten historischen Zeitpunkt berücksichtigt, nicht nach dem heutigen Ausbauzustand.
- Die bestehenden Steuersätze von 1, 2 und 3 Talern je Bürgerstand und die Krankheitsregel zunächst unverändert lassen.

## 2. Kasse und Kaufprüfung zuverlässig verbinden
- Die gemeinsame Simulation auf der sicheren Serverseite ausführen, damit Spieler keine Einwohnerzahlen oder Guthaben vorgeben können.
- Nur errechnete Steuerabrechnungen als wirtschaftlichen Nachweis speichern, niemals Wachstum oder Bewohner als Spielzustand.
- Sämtliche Prüfungen gegen die Kasse weiterhin zentral absichern: Gebäude, Begegnungen, Straßen, Geschenke und weitere kostenpflichtige Entscheidungen.
- Vor dem Umschalten alte und neue Guthaben bestehender Orte vergleichen. Keine ungeprüfte rückwirkende Kürzung bereits ausgegebener Taler.

## 3. Einnahmen kalibrieren
- Ungepflegte und ausgebaute Dörfer nach 30, 90, 180, 365 und 730 Tagen durchrechnen, einschließlich Mitgift und Verlusten.
- Mit der gemeinsamen Einwohnergrundlage die verbleibende Geldschwemme separat beziffern.
- Falls sie weiter besteht, eine konkrete Balanceänderung mit Vorher-/Nachher-Zahlen zur Entscheidung vorlegen. Keine versteckte Senkung der zugesagten Bürgersteuern und kein ungefragter Strafunterhalt.

## Prüfungen
- Gleiche bewohnte Haushalte und Einwohnerzahlen für Darstellung und Abrechnung.
- Winter, Mangel, spätere Versorgungskäufe, Wegzug und reiche Haushalte abdecken.
- Vernachlässigte Orte bleiben höchstens ein Dorf und sterben nicht aus.
- Bestehende Spieltests ausführen und einen angemeldeten Kauf samt anschließend angezeigter Kasse prüfen.

## Technische Umsetzung
Die bisherige 85/25/15-Näherung wird erst ersetzt, wenn die gemeinsame Simulation auch die gesicherte Kaufprüfung erreicht. Ein reiner Austausch der Anzeige würde erneut zwei verschiedene Kassen erzeugen. Wirtschaftsabrechnungen sind abgeleitete Nachweise mit Versions- und Eingabestand; sie ersetzen keinen gespeicherten Wachstumszustand. Historische Berechnungen benötigen begrenzte, wiederverwendbare Abrechnungsabschnitte, damit alte Städte nicht bei jedem Klick vollständig neu simuliert werden.

## Nicht Bestandteil
Neue Prestigeprojekte, zusätzliche Geldsenken und Änderungen an Charta-Boni bleiben außerhalb dieses Schritts.