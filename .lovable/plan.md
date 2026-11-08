# Tiere, die vor Bäumen "schweben"

## Ursache
Das Schwein unter der Eiche wird auf derselben Kachel wie der Baum gezeichnet, und zwar danach – also immer davor. Beim Umherwandern darf es aber bis zu 1,5 Einheiten nach hinten (Richtung Norden) laufen. Dann steht es eigentlich hinter dem Stamm, wird aber trotzdem davor gemalt – und wirkt wie in der Baumkrone schwebend. Gänse und Ziegen (gleiche Wanderlogik, `farmAnimalPose`) haben dasselbe Risiko, ebenso Wildtiere im Wald.

## Umsetzung
1. **Schweine (`drawPig`)**: Wanderpunkte nur noch vor dem Baumfuß (Versatz nach vorn 0,3–1,8 statt ±1,5), seitlich etwas enger (±3 statt ±4), damit die Füße immer sichtbar unter/vor dem Stamm stehen.
2. **Gänse/Ziegen (`drawFarmAnimal`)**: dieselbe Regel – auf Kacheln mit Baum oder Gebäude kein Versatz nach hinten.
3. **Systematische Suche**: alle Tiere/Figuren, die per Versatz um ihren Kachelpunkt wandern (Wild, Herden, Hund, Begegnungs-Kuh), prüfen; wo der Versatz nach hinten über ein hohes Objekt auf derselben Kachel reicht, gleich begrenzen.
4. **Prüfung**: Tierlabor/Testkarte im Herbst per Screenshot ansehen (Schwein an der Eiche), Tests laufen lassen.

Rein optisch – keine Auswirkung auf Steuern, Wachstum oder gespeicherte Daten.
