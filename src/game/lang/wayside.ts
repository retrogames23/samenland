import type { Lang } from "../i18n";

/** Wayside encounter dialogues (stroll), all eight languages. Node keys follow WAY_GRAPH in ../wayside.ts. */
type Node = { say: string; ask?: string };
type Enc = { title: string; nodes: Record<string, Node> };
type Text = { ui: { leave: string; far: string; greet: string }; enc: Record<string, Enc> };
const de = {
 "ui": {
  "leave": "Mit Gruß weiterziehen",
  "far": "Geh näher heran, um zu grüßen.",
  "greet": "Ansprechen"
 },
 "enc": {
  "pilger": {
   "title": "Der Jakobspilger",
   "nodes": {
    "start": {
     "say": "Ein Wanderer lüftet seinen feuchten Filzhut, an dem eine bleierne Jakobsmuschel glänzt. „Gott zum Gruße, ehrsamer Mann. Seit drei Wochen bin ich von Magdeburg her unterwegs, gen Wilsnack zum Heiligen Blut. Hättet Ihr einen Schluck Wasser für eine durstige Kehle?“"
    },
    "a": {
     "ask": "Hier, nehmt meinen Wasserschlauch.",
     "say": "Er trinkt in tiefen Zügen und bekreuzigt sich. „Der Herr lohne es Eurem Dorf mit reicher Gerstenernte. Auf den Geestwegen zur Elbe hin, sagt man, lauern Strauchdiebe den Pilgern auf.“"
    },
    "a1": {
     "ask": "Was wisst Ihr von diesen Gesellen?",
     "say": "„Drei Mann, heißt es, mit einem Schimmel. Der Vogt von Lüneburg hat Fangbriefe ausgeschickt. Ich gehe nur noch bei Tage und im Haufen mit anderen.“"
    },
    "b": {
     "ask": "Was hört man auf den Heerstraßen?",
     "say": "Er stützt sich auf seinen Eschenstab. „In Braunschweig murren die Gilden gegen den Rat wegen des Bierzolls, und in den Klöstern streitet man über den Ablass. Die Welt will aus den Fugen geraten, dünkt mich.“"
    },
    "b1": {
     "ask": "Hält denn der Landfrieden nicht?",
     "say": "„Der Kaiser ist weit, Herr Schulze, und die Fürsten sind nah. Ein Dorf, das zusammenhält, ist sicherer als jeder Brief mit Siegel.“"
    }
   }
  },
  "spielmann": {
   "title": "Der Spielmann",
   "nodes": {
    "start": {
     "say": "Ein Mann mit buntem Wams und einer Fiedel auf dem Rücken verbeugt sich übertrieben tief. „Gesegnet sei der Weg, der mich zu einem Schulzen führt! Ein Lied gefällig, Herr? Für einen Kanten Brot spiele ich bis Sonnenuntergang.“"
    },
    "a": {
     "ask": "Spielt mir ein Lied.",
     "say": "Er streicht die Saiten und singt vom Störtebeker, der ohne Kopf noch an elf Gefährten vorbeigeschritten sei. Am Ende zwinkert er. „In Hamburg hört man das nicht gern – dort singe ich lieber von Rittern.“"
    },
    "a1": {
     "ask": "Wo spielt Ihr sonst?",
     "say": "„Auf Hochzeiten, an Kirchweih, in den Krügen an der Heerstraße. Im Winter suche ich ein warmes Kloster. Ein Spielmann hat kein Haus, nur Wege.“"
    },
    "b": {
     "ask": "Ist ein Spielmann nicht ehrlos?",
     "say": "Er lacht, ohne gekränkt zu wirken. „Ehrlos vor dem Gericht, Herr, das ist wahr – aber nicht vor den Leuten. Wer tanzt, fragt nicht nach Stand.“"
    },
    "b1": {
     "ask": "Und was bleibt Euch?",
     "say": "„Ein Lied, das man noch singt, wenn ich längst unter dem Rasen liege. Das ist mehr, als mancher Ratsherr hinterlässt.“"
    }
   }
  },
  "kraemer": {
   "title": "Der Hausierer",
   "nodes": {
    "start": {
     "say": "Ein Krämer mit einer schweren Kiepe auf dem Rücken bleibt schnaufend stehen. „Nadeln, Zwirn, Bänder aus Flandern, Pfeffer, so teuer wie Silber! Nur schauen kostet nichts, Herr Schulze.“"
    },
    "a": {
     "ask": "Woher kommt Eure Ware?",
     "say": "„Die Bänder aus Brügge, die Nadeln aus Nürnberg, der Pfeffer über Venedig und Lübeck. Jeder Zoll unterwegs frisst ein Stück davon – darum der Preis.“"
    },
    "a1": {
     "ask": "Wie viele Zölle sind es denn?",
     "say": "Er zählt an den Fingern und gibt bei zwölf auf. „Jeder Fluss, jede Brücke, jeder Herr. Am Ende verdient der Pfeffer mehr als ich.“"
    },
    "b": {
     "ask": "Was gibt es Neues im Land?",
     "say": "„In Lüneburg ist das Salz teurer geworden, und in Bardowick ist ein Kalb mit zwei Köpfen geboren worden – das schwört die Wirtin bei ihrer Seele.“"
    },
    "b1": {
     "ask": "Glaubt Ihr das?",
     "say": "„Ich glaube, was sich verkaufen lässt, Herr. Und eine gute Mär verkauft sich besser als Zwirn.“ Er lacht und rückt die Kiepe zurecht."
    }
   }
  },
  "moench": {
   "title": "Der Bettelmönch",
   "nodes": {
    "start": {
     "say": "Ein Franziskaner in grauer Kutte, barfuß trotz des kalten Bodens, hebt segnend die Hand. „Friede sei mit Euch. Ich sammle für unser Kloster in Lüneburg – ein Almosen oder auch nur ein gutes Wort.“"
    },
    "a": {
     "ask": "Wie geht es Euren Brüdern?",
     "say": "„Wir pflegen die Kranken im Spital und predigen auf den Märkten. Die Herren vom Rat geben gern, wenn wir für ihre Seelen beten.“"
    },
    "a1": {
     "ask": "Hilft das Beten denn?",
     "say": "Er lächelt milde. „Gegen die Pest nicht immer, Herr Schulze. Aber gegen die Verzweiflung allemal.“"
    },
    "b": {
     "ask": "Warum geht Ihr barfuß?",
     "say": "„Unser Vater Franziskus wollte arm sein wie der Herr. Die Füße gewöhnen sich, das Herz braucht länger.“"
    },
    "b1": {
     "ask": "Ist das nicht hart im Winter?",
     "say": "„Im Winter tragen wir Holzsohlen, so gnädig ist die Regel. Und wer friert, betet schneller.“ Er zwinkert beinahe."
    }
   }
  },
  "torf": {
   "title": "Der Torfstecher",
   "nodes": {
    "start": {
     "say": "Ein Mann mit schlammigen Beinlingen trägt Soden auf dem Rücken. „Gott grüß Euch. Im Moor ist das Stechen gut dies Jahr – trocken genug, dass man nicht versinkt.“"
    },
    "a": {
     "ask": "Wie sticht man Torf?",
     "say": "„Mit dem Spaten in Ziegeln, im Frühjahr. Dann schichtet man sie zu Haufen, damit der Wind sie trocknet. Erst im Herbst brennen sie.“"
    },
    "a1": {
     "ask": "Ist das Moor nicht gefährlich?",
     "say": "„Wer die Wege nicht kennt, den holt es. Mein Großvater hat dort eine Moorleiche gefunden, braun wie Leder. Wir haben sie wieder zugedeckt und ein Vaterunser gesprochen.“"
    },
    "b": {
     "ask": "Wem gehört das Moor?",
     "say": "„Dem Kloster, Herr. Für jedes Fuder geben wir den Zehnten. Aber ohne Torf frören die Mönche ebenso wie wir.“"
    },
    "b1": {
     "ask": "Zahlt sich die Mühe aus?",
     "say": "„Für den Herd reicht es. Reich wird vom Torf nur, wer ihn nicht sticht.“"
    }
   }
  },
  "schaefer": {
   "title": "Der Heideschäfer",
   "nodes": {
    "start": {
     "say": "Ein alter Schäfer lehnt auf seinem Stab, den Hund zu Füßen. „Na, Herr Schulze, auch einmal draußen bei uns? Die Heidschnucken sind heut ruhig – das gibt Wetter.“"
    },
    "a": {
     "ask": "Woran seht Ihr das Wetter?",
     "say": "„Wenn die Schafe die Köpfe zusammenstecken, kommt Regen. Wenn die Schwalben tief fliegen, auch. Und wenn mir das Knie zieht, ganz gewiss.“"
    },
    "a1": {
     "ask": "Irrt Ihr Euch nie?",
     "say": "„Doch, Herr. Aber seltener als der Kalendermacher in der Stadt.“ Er lacht in seinen grauen Bart."
    },
    "b": {
     "ask": "Wie lange hütet Ihr schon?",
     "say": "„Seit ich sieben Winter alt war. Die Heide lernt man nicht aus Büchern. Hier wächst nur, was zäh ist – Heide, Wacholder und Schäfer.“"
    },
    "b1": {
     "ask": "Fürchtet Ihr die Wölfe?",
     "say": "„Nicht, solange der Hund wach ist. Im letzten Winter hat einer zwei Lämmer genommen. Seitdem schläft der Hund weniger als ich.“"
    }
   }
  },
  "landsknecht": {
   "title": "Der Landsknecht",
   "nodes": {
    "start": {
     "say": "Ein Mann in zerschlissenen, geschlitzten Hosen, einen Katzbalger an der Seite, tippt an die Federmütze. „Ohne Sold entlassen, Herr. Ich ziehe heim nach Holstein. Keine Sorge – ich bin müde, nicht gefährlich.“"
    },
    "a": {
     "ask": "Wo habt Ihr gedient?",
     "say": "„Unter dem Dänenkönig in Dithmarschen. Die Bauern haben die Schleusen geöffnet, und wir standen bis zum Gürtel im Wasser. Bei Hemmingstedt sind mehr ertrunken als gefallen.“"
    },
    "a1": {
     "ask": "Und wie seid Ihr entkommen?",
     "say": "Er schweigt lange. „Ich konnte schwimmen, Herr. Das war alles. Gott hat die Tapferen nicht gefragt.“"
    },
    "b": {
     "ask": "Was wollt Ihr nun tun?",
     "say": "„Pflügen, wenn mein Bruder mich noch nimmt. Mit dem Spieß habe ich genug Furchen gezogen.“"
    },
    "b1": {
     "ask": "Und wenn er Euch nicht nimmt?",
     "say": "„Dann werbe ich wieder an. Ein Knecht ohne Herrn ist wie ein Hund ohne Hof.“ Er zuckt die Achseln und geht weiter."
    }
   }
  },
  "kraeuter": {
   "title": "Die Kräuterfrau",
   "nodes": {
    "start": {
     "say": "Eine Frau mit einem Korb voller Kraut und Wurzeln blickt auf. „Grüß Gott, Herr Schulze. Schafgarbe für die Wunden, Kamille für den Bauch, und Johanniskraut – das muss man am rechten Tag pflücken.“"
    },
    "a": {
     "ask": "Welcher Tag ist der rechte?",
     "say": "„Johannis, wenn die Sonne am höchsten steht. Dann ist die Kraft im Kraut. Der Pfarrer sagt, das sei Aberglaube, aber seinen Husten kuriert er damit trotzdem.“"
    },
    "a1": {
     "ask": "Helft Ihr auch bei Fieber?",
     "say": "„Weidenrinde, gekocht und bitter. Und Ruhe, die vergessen die Leute immer. Gegen das Fleckfieber hilft kein Kraut – da hilft nur Beten und Abstand.“"
    },
    "b": {
     "ask": "Habt Ihr keine Angst vor dem Gerede?",
     "say": "Ihr Blick wird hart. „Doch, Herr. Eine Frau, die heilt, ist schnell eine, die verhext. Ich gehe allein in den Wald und zeige niemandem, wo meine Kräuter wachsen.“"
    },
    "b1": {
     "ask": "In meinem Dorf sollt Ihr sicher sein.",
     "say": "Sie mustert Euch und nickt langsam. „Ein gutes Wort von einem Schulzen ist mehr wert als ein Kraut. Gott behüt Euch.“"
    }
   }
  },
  "fuhrmann": {
   "title": "Der Fuhrmann mit der Achse",
   "nodes": {
    "start": {
     "say": "Ein Fuhrmann flucht über seinem Wagen, dessen Rad im Sand festsitzt. „Verzeiht die Worte, Herr! Die Achse hat gekracht, und bis Uelzen sind es noch zwei Tage.“"
    },
    "a": {
     "ask": "Kann ich mit anfassen?",
     "say": "Ihr stemmt Euch gegen den Wagen, und mit einem Ruck kommt das Rad frei. „Gott vergelt's! Das hält bis zum nächsten Schmied. Ein Schulze, der sich die Hände schmutzig macht – das erzähl ich weiter.“"
    },
    "a1": {
     "ask": "Was fahrt Ihr denn?",
     "say": "„Leinen aus Westfalen, für die Kaufleute in Lübeck. Wenn ich zu spät komme, segelt das Schiff ohne mich nach Bergen.“"
    },
    "b": {
     "ask": "Warum fahrt Ihr diesen Weg?",
     "say": "„Die Heerstraße hat drei Zollstellen. Hier ist der Weg schlechter, aber billiger. Man spart am Zoll und zahlt am Rad.“"
    },
    "b1": {
     "ask": "Lohnt sich das?",
     "say": "Er blickt auf sein Rad und seufzt. „Heute nicht, Herr. Heute nicht.“"
    }
   }
  },
  "salzfuhre": {
   "title": "Die Salzfuhre",
   "nodes": {
    "start": {
     "say": "Ein schwerer Wagen mit Salzfässern rumpelt heran, der Fuhrknecht hält die Pferde an. „Salz aus Lüneburg, Herr, auf der alten Salzstraße nach Lübeck. Weißes Gold nennen es die Kaufleute.“"
    },
    "a": {
     "ask": "Wozu braucht Lübeck so viel Salz?",
     "say": "„Für den Hering, Herr! Auf Schonen wird er gesalzen und in Tonnen bis nach Nowgorod verkauft. Ohne Lüneburger Salz keine Fastenspeise in der halben Christenheit.“"
    },
    "a1": {
     "ask": "Wie lange dauert die Fahrt?",
     "say": "„Bei gutem Wetter zwanzig Tage hin und zurück. Bei Regen frisst der Schlamm die Räder, und das Salz wird nass. Dann zahlt man es dem Herrn aus dem eigenen Lohn.“"
    },
    "b": {
     "ask": "Ist die Fracht nicht verlockend für Diebe?",
     "say": "„Darum fahren wir zu dritt und mit Knüppeln. Aber Salz ist schwer zu stehlen – man kann es nicht in der Tasche verstecken.“"
    },
    "b1": {
     "ask": "Gute Fahrt dann!",
     "say": "Er schnalzt mit der Zunge, und die Pferde ziehen an. „Und Euch volle Scheuern, Herr Schulze!“"
    }
   }
  },
  "bote": {
   "title": "Der Bote des Bischofs",
   "nodes": {
    "start": {
     "say": "Ein Reiter mit einer Botentasche und dem Wappen des Bischofs von Verden zügelt sein Pferd. „Platz, guter Mann – ah, verzeiht, Ihr seid der Schulze? Ich bin in Eile, aber ein Wort ist erlaubt.“"
    },
    "a": {
     "ask": "Was tragt Ihr für Nachricht?",
     "say": "„Das darf ich nicht sagen, Herr. Gesiegelt und versiegelt. Aber wenn ein Bote so eilt, geht es um Geld oder um Ketzer.“"
    },
    "a1": {
     "ask": "Und welches von beiden?",
     "say": "Er grinst. „Meist um beides, Herr Schulze.“ Dann gibt er dem Pferd die Sporen."
    },
    "b": {
     "ask": "Ist Euer Pferd nicht müde?",
     "say": "„Es wird in Rotenburg gewechselt. Wir Boten reiten bis zu zehn Meilen am Tag. Das Pferd hat Glück – der Reiter wird nicht gewechselt.“"
    },
    "b1": {
     "ask": "Gott befohlen, Bote.",
     "say": "Er nickt kurz und galoppiert davon, eine Staubwolke hinter sich."
    }
   }
  },
  "brief": {
   "title": "Der verlorene Brief",
   "nodes": {
    "start": {
     "say": "Ein Kaufmannsdiener sucht hastig den Wegrand ab. Neben Euch im Gras liegt ein gefalteter Brief mit rotem Wachssiegel. „Herr! Habt Ihr einen Brief gesehen? Mein Meister lässt mich auspeitschen, wenn er fehlt!“"
    },
    "a": {
     "ask": "Gebt ihm den Brief zurück.",
     "say": "Er reißt ihn an sich und küsst das Siegel. „Unversehrt, Gott sei Dank! Ein Wechselbrief für Brügge – wer den bricht, bricht dem Hause Wullenwever das Genick.“"
    },
    "a1": {
     "ask": "Was ist ein Wechselbrief?",
     "say": "„Man zahlt in Lübeck und lässt in Brügge auszahlen, ohne Silber über Land zu tragen. Das ist die Kunst der Kaufleute: Papier statt Pferde.“"
    },
    "b": {
     "ask": "Zuerst das Siegel prüfen.",
     "say": "Ihr dreht den Brief in der Hand. Das Siegel zeigt ein Schiff und drei Sterne. Der Diener wird bleich. „Das ist meines Meisters Siegel, bei meiner Seele! Bitte, Herr!“ Ihr reicht ihm den Brief."
    },
    "b1": {
     "ask": "Passt künftig besser auf.",
     "say": "„Das will ich, Herr, das will ich!“ Er steckt den Brief unter sein Hemd und läuft weiter, ohne sich noch einmal umzusehen."
    }
   }
  },
  "deichbauer": {
   "title": "Der Deichbauer aus Holland",
   "nodes": {
    "start": {
     "say": "Ein Mann mit einer Messlatte und fremder Mundart schaut über das flache Land. „Goedendag, mijnheer. Ich bin aus Holland gerufen, um die Deiche zu prüfen. Ihr habt hier viel Wasser und wenig Erde.“"
    },
    "a": {
     "ask": "Was macht ein guter Deich aus?",
     "say": "„Flach zum Meer hin, wie ein Rücken, steil zum Land. Klei aus der Marsch, kein Sand. Und jeder Hof gibt Männer zum Deichen, sonst bricht er am schwächsten Stück.“"
    },
    "a1": {
     "ask": "Bricht er dennoch?",
     "say": "„Jeder Deich bricht einmal, mijnheer. Die Marcellusflut hat ganze Kirchspiele genommen. Der Deich ist kein Sieg, er ist ein Vertrag mit dem Meer.“"
    },
    "b": {
     "ask": "Warum holt man Euch aus Holland?",
     "say": "„Weil wir seit dreihundert Jahren gegen das Wasser kämpfen und es noch nicht gewonnen hat. Wer kein Land hat, macht sich welches.“"
    },
    "b1": {
     "ask": "Bleibt Ihr lange?",
     "say": "„Bis der Sommer um ist. Dann zieht es mich heim, zu Frau und Torffeuer.“ Er notiert etwas auf seiner Wachstafel."
    }
   }
  },
  "jaeger": {
   "title": "Der Jäger des Junkers",
   "nodes": {
    "start": {
     "say": "Ein Jäger in grünem Rock, die Armbrust über der Schulter, hält Euch an. „Herr Schulze. Mein Junker sucht nach Wilddieben. Es sind Schlingen gefunden worden, hier am Waldrand.“"
    },
    "a": {
     "ask": "Bei uns wildert niemand.",
     "say": "„Das sagt jeder Schulze, Herr. Aber im Winter, wenn der Kohl alle ist, wird mancher Bauer zum Jäger. Wer erwischt wird, verliert die Hand.“"
    },
    "a1": {
     "ask": "Ist das nicht hart für einen Hasen?",
     "say": "Er zuckt die Schultern. „Das Wild gehört dem Herrn, so ist es Recht. Ich mache das Recht nicht, ich trage nur die Armbrust.“"
    },
    "b": {
     "ask": "Was jagt Euer Junker?",
     "say": "„Rothirsch und Sau, im Herbst mit Hunden. Die Bauern müssen die Treiber stellen und dürfen nicht klagen, wenn das Wild ihr Korn frisst.“"
    },
    "b1": {
     "ask": "Das ist eine bittere Last.",
     "say": "„So sagen es viele, Herr. Leise.“ Er nickt Euch zu und verschwindet zwischen den Eichen."
    }
   }
  },
  "hirtenkind": {
   "title": "Das verirrte Hütekind",
   "nodes": {
    "start": {
     "say": "Ein kleines Mädchen mit einer Gerte steht weinend am Weg. „Die Gänse sind fort, Herr, und ich finde den Weg nicht mehr heim. Die Mutter wird mich schelten.“"
    },
    "a": {
     "ask": "Wo wohnst du denn?",
     "say": "Sie schnieft und zeigt vage in eine Richtung. „Hinter dem großen Findling, wo die Eiche steht.“ Ihr zeigt ihr den Kirchturm am Horizont. Da hellt sich ihr Gesicht auf."
    },
    "a1": {
     "ask": "Geh dem Turm nach, dann findest du heim.",
     "say": "„Danke, Herr Schulze!“ Sie läuft los und ruft schon von weitem nach den Gänsen – die schnattern prompt aus dem Ried zurück."
    },
    "b": {
     "ask": "Die Gänse finden schon heim.",
     "say": "„Meint Ihr?“ Sie wischt sich die Nase am Ärmel. „Die Alte mit dem lahmen Flügel ist klüger als ich, sagt der Vater.“"
    },
    "b1": {
     "ask": "Dann folge der Alten.",
     "say": "Sie kichert und hüpft davon, die Gerte schwingend, als wäre sie nie verloren gewesen."
    }
   }
  },
  "koehler": {
   "title": "Der Köhler",
   "nodes": {
    "start": {
     "say": "Ein rußgeschwärzter Mann tritt aus dem Rauch. Hinter ihm qualmt ein Meiler. „Gott grüß Euch, Herr. Kommt nicht zu nah, der Meiler ist launisch wie eine Ziege.“"
    },
    "a": {
     "ask": "Wie lange brennt der Meiler?",
     "say": "„Zwölf Tage und Nächte. Ich schlafe daneben in meiner Hütte und höre auf sein Atmen. Wenn er Feuer fängt, ist alles Holz Asche.“"
    },
    "a1": {
     "ask": "Wer kauft die Kohle?",
     "say": "„Die Schmiede und die Hütten im Harz. Gute Kohle brennt heißer als jedes Holz – ohne sie kein Eisen und kein Pflug.“"
    },
    "b": {
     "ask": "Ist das nicht ein einsames Leben?",
     "say": "„Die Leute meiden uns, wir sind schwarz wie der Teufel. Aber der Wald redet, wenn man still ist. Die Eule kennt mich besser als der Pfarrer.“"
    },
    "b1": {
     "ask": "Kommt einmal in unser Dorf.",
     "say": "Er lacht, dass die Zähne weiß aus dem Ruß blitzen. „Wenn ich mich vorher im Bach wasche, Herr Schulze. Versprochen.“"
    }
   }
  },
  "scholar": {
   "title": "Der fahrende Scholar",
   "nodes": {
    "start": {
     "say": "Ein junger Mann mit Tintenflecken an den Fingern und einem Bündel Bücher grüßt auf Latein. „Salve, domine! Ich bin Scholar aus Rostock, unterwegs nach Erfurt. Habt Ihr ein Nachtlager für einen armen Gelehrten?“"
    },
    "a": {
     "ask": "Was lernt man in Rostock?",
     "say": "„Die sieben freien Künste, Herr: Grammatik, Rhetorik, Logik, und dann Rechnen, Geometrie, Musik und die Sterne. Danach erst Recht oder Theologie, wenn man es sich leisten kann.“"
    },
    "a1": {
     "ask": "Und was nützt das einem Bauern?",
     "say": "Er überlegt ernsthaft. „Wer rechnen kann, wird vom Vogt nicht betrogen. Wer lesen kann, glaubt nicht jedem Brief mit Siegel. Das ist kein kleiner Nutzen.“"
    },
    "b": {
     "ask": "Warum seid Ihr so arm?",
     "say": "„Die Bücher sind teuer, und mein Vater ist Böttcher. Ich singe vor den Türen für Brot, wie alle fahrenden Schüler. Die Bürger geben, damit wir für sie beten.“"
    },
    "b1": {
     "ask": "Viel Glück auf dem Weg.",
     "say": "„Deo gratias!“ Er rückt seine Bücher zurecht und zieht pfeifend weiter."
    }
   }
  },
  "hirschkalb": {
   "title": "Das Hirschkalb im Dornbusch",
   "nodes": {
    "start": {
     "say": "Im Gestrüpp am Wegrand zappelt ein junges Hirschkalb. Sein Lauf hat sich in einer Brombeerranke und einer alten Schlinge verfangen. Es schaut Euch mit großen, ängstlichen Augen an."
    },
    "a": {
     "ask": "Das Kalb befreien.",
     "say": "Vorsichtig löst Ihr die Schlinge. Das Kalb springt auf, stolpert einmal und verschwindet mit weiten Sätzen zwischen den Birken. Irgendwo im Wald antwortet die Hirschkuh."
    },
    "b": {
     "ask": "Es dem Jäger des Herrn überlassen.",
     "say": "Das Wild gehört dem Junker, und wer es berührt, macht sich verdächtig. Ihr wendet Euch ab. Als Ihr Euch noch einmal umseht, hat das Kalb sich selbst befreit und ist fort."
    }
   }
  },
  "frischling": {
   "title": "Der Frischling in der Schlinge",
   "nodes": {
    "start": {
     "say": "Unter einer Eiche quiekt ein gestreifter Frischling, der Hinterlauf in einer Wilddiebschlinge. Weit kann die Bache nicht sein."
    },
    "a": {
     "ask": "Die Schlinge rasch durchschneiden.",
     "say": "Mit einem Schnitt ist er frei und rennt quiekend ins Unterholz. Ein tiefes Grunzen antwortet aus dem Dickicht. Ihr geht lieber zügig weiter."
    },
    "b": {
     "ask": "Abstand halten – die Bache ist nah.",
     "say": "Ihr weicht langsam zurück. Wenig später bricht die Bache aus dem Gebüsch, zerrt am Draht, bis er reißt, und führt das Junge davon."
    }
   }
  },
  "rothirsch": {
   "title": "Der Rothirsch am Waldrand",
   "nodes": {
    "start": {
     "say": "Am Waldrand steht ein mächtiger Rothirsch, das Geweih wie eine Krone. Er hebt den Kopf und wittert in Eure Richtung."
    },
    "a": {
     "ask": "Still stehen bleiben und schauen.",
     "say": "Lange steht er da, dann senkt er den Kopf und äst weiter, als wärt Ihr ein Baum. Ein seltener Anblick – die Alten sagen, er bringt ein gutes Jahr."
    },
    "b": {
     "ask": "In die Hände klatschen.",
     "say": "Mit einem gewaltigen Satz ist er im Wald verschwunden. Nur ein paar Äste wippen noch nach."
    }
   }
  },
  "bache": {
   "title": "Die Bache mit den Frischlingen",
   "nodes": {
    "start": {
     "say": "Mitten auf dem Weg wühlt eine Bache im Boden, ein paar gestreifte Frischlinge um sie herum. Sie hat Euch bemerkt und stellt die Borsten auf."
    },
    "a": {
     "ask": "Langsam zurückweichen.",
     "say": "Schritt für Schritt geht Ihr rückwärts. Die Bache grunzt warnend, dann treibt sie ihre Jungen quer über den Weg ins Farnkraut."
    },
    "b": {
     "ask": "Einen Bogen durch die Heide schlagen.",
     "say": "Ihr macht einen weiten Umweg durch das Heidekraut. Hinter Euch hört Ihr das zufriedene Schmatzen der Rotte, die ungestört weiterwühlt."
    }
   }
  }
 }
} satisfies Text;
type Full = typeof de;
export const WAYSIDE_TEXT: Record<Lang, Full> = {
  de,
  en: {
 "ui": {
  "leave": "Take leave with a greeting",
  "far": "Come nearer to offer a greeting.",
  "greet": "Speak"
 },
 "enc": {
  "pilger": {
   "title": "The Pilgrim of St James",
   "nodes": {
    "start": {
     "say": "A traveller lifts his damp felt hat, upon which a leaden scallop shell gleams. “God greet you, worthy sir. I have been on the road from Magdeburg these three weeks, bound for the Holy Blood at Wilsnack. Might you spare a drink of water for a thirsty throat?”"
    },
    "a": {
     "ask": "Here, take my waterskin.",
     "say": "He drinks deeply and crosses himself. “May the Lord reward your village with a rich barley harvest. They say robbers lie in wait for pilgrims on the heathland roads towards the Elbe.”"
    },
    "a1": {
     "ask": "What do you know of these fellows?",
     "say": "“Three men, they say, with a white horse. The bailiff of Lüneburg has sent out warrants for their capture. I travel only by daylight now, and in company with others.”"
    },
    "b": {
     "ask": "What news is there on the highways?",
     "say": "He leans on his ash staff. “In Braunschweig the guilds grumble against the council over the beer toll, and in the monasteries they quarrel over indulgences. The world is coming apart at the seams, it seems to me.”"
    },
    "b1": {
     "ask": "Does the peace of the land not hold?",
     "say": "“The Emperor is far away, Master Headman, and the princes are near. A village that stands together is safer than any letter bearing a seal.”"
    }
   }
  },
  "spielmann": {
   "title": "The Minstrel",
   "nodes": {
    "start": {
     "say": "A man in a brightly coloured doublet, with a fiddle on his back, bows extravagantly low. “Blessed be the road that leads me to a village headman! Would you care for a song, sir? For a crust of bread I shall play till sunset.”"
    },
    "a": {
     "ask": "Play me a song.",
     "say": "He draws his bow across the strings and sings of Störtebeker, who, they say, walked past eleven of his companions after losing his head. At the end he winks. “They do not care to hear that in Hamburg – there I prefer to sing of knights.”"
    },
    "a1": {
     "ask": "Where else do you play?",
     "say": "“At weddings and church fairs, in the taverns along the highway. In winter I seek a warm monastery. A minstrel has no house, only roads.”"
    },
    "b": {
     "ask": "Is a minstrel not without honour?",
     "say": "He laughs, seemingly unoffended. “Without honour before the court, sir, that is true – but not before the people. A person who dances does not ask after another’s station.”"
    },
    "b1": {
     "ask": "And what will remain of you?",
     "say": "“A song still sung when I have long lain beneath the turf. That is more than many a councillor leaves behind.”"
    }
   }
  },
  "kraemer": {
   "title": "The Pedlar",
   "nodes": {
    "start": {
     "say": "A pedlar with a heavy pack basket on his back stops, panting. “Needles, thread, ribbons from Flanders, pepper as dear as silver! It costs nothing to look, Master Headman.”"
    },
    "a": {
     "ask": "Whence come your wares?",
     "say": "“The ribbons from Bruges, the needles from Nuremberg, the pepper by way of Venice and Lübeck. Every toll along the road eats a piece of it – hence the price.”"
    },
    "a1": {
     "ask": "How many tolls are there?",
     "say": "He counts on his fingers and gives up at twelve. “Every river, every bridge, every lord. In the end the pepper earns more than I do.”"
    },
    "b": {
     "ask": "What news is there in the land?",
     "say": "“Salt has grown dearer in Lüneburg, and in Bardowick a calf was born with two heads – the innkeeper’s wife swears it on her soul.”"
    },
    "b1": {
     "ask": "Do you believe it?",
     "say": "“I believe what can be sold, sir. And a good tale sells better than thread.” He laughs and adjusts his pack basket."
    }
   }
  },
  "moench": {
   "title": "The Mendicant Friar",
   "nodes": {
    "start": {
     "say": "A Franciscan in a grey habit, barefoot despite the cold ground, raises his hand in blessing. “Peace be with you. I am gathering for our monastery in Lüneburg – alms, or even a kind word.”"
    },
    "a": {
     "ask": "How fare your brothers?",
     "say": "“We tend the sick in the hospital and preach in the marketplaces. The gentlemen of the council give gladly when we pray for their souls.”"
    },
    "a1": {
     "ask": "Does prayer truly help?",
     "say": "He smiles gently. “Not always against the plague, Master Headman. But against despair, most certainly.”"
    },
    "b": {
     "ask": "Why do you go barefoot?",
     "say": "“Our father Francis wished to be poor like the Lord. The feet grow accustomed to it; the heart takes longer.”"
    },
    "b1": {
     "ask": "Is that not hard in winter?",
     "say": "“In winter we wear wooden soles, so merciful is the rule. And a man who is cold prays faster.” He almost winks."
    }
   }
  },
  "torf": {
   "title": "The Peat Cutter",
   "nodes": {
    "start": {
     "say": "A man with muddy leggings carries peat sods on his back. “God greet you. The cutting is good in the bog this year – dry enough that a man does not sink.”"
    },
    "a": {
     "ask": "How do you cut peat?",
     "say": "“With a spade, in bricks, in the spring. Then we stack them in heaps for the wind to dry. They are ready to burn only in autumn.”"
    },
    "a1": {
     "ask": "Is the bog not dangerous?",
     "say": "“It takes those who do not know the paths. My grandfather found a body in the bog there, brown as leather. We covered it again and said the Lord’s Prayer.”"
    },
    "b": {
     "ask": "Who owns the bog?",
     "say": "“The monastery, sir. For every cartload we pay a tithe. But without peat the monks would freeze as surely as we.”"
    },
    "b1": {
     "ask": "Is it worth the toil?",
     "say": "“It is enough for the hearth. The only man who grows rich from peat is the one who does not cut it.”"
    }
   }
  },
  "schaefer": {
   "title": "The Heath Shepherd",
   "nodes": {
    "start": {
     "say": "An old shepherd leans on his staff, his dog at his feet. “Well, Master Headman, out here among us for a change? The heath sheep are quiet today – there is weather coming.”"
    },
    "a": {
     "ask": "How can you tell what weather is coming?",
     "say": "“When the sheep put their heads together, rain is coming. When the swallows fly low, likewise. And when my knee aches, it is certain.”"
    },
    "a1": {
     "ask": "Are you never mistaken?",
     "say": "“Indeed I am, sir. But less often than the almanac maker in town.” He laughs into his grey beard."
    },
    "b": {
     "ask": "How long have you tended sheep?",
     "say": "“Since I was seven winters old. You cannot learn the heath from books. Only what is hardy grows here – heather, juniper and shepherds.”"
    },
    "b1": {
     "ask": "Do you fear the wolves?",
     "say": "“Not while the dog is awake. One took two lambs last winter. Since then the dog sleeps less than I do.”"
    }
   }
  },
  "landsknecht": {
   "title": "The Landsknecht",
   "nodes": {
    "start": {
     "say": "A man in tattered, slashed breeches, a Katzbalger at his side, touches his feathered cap. “Dismissed without pay, sir. I am travelling home to Holstein. Have no fear – I am weary, not dangerous.”"
    },
    "a": {
     "ask": "Where did you serve?",
     "say": "“Under the Danish king in Dithmarschen. The peasants opened the sluices, and we stood waist-deep in water. At Hemmingstedt more drowned than fell in battle.”"
    },
    "a1": {
     "ask": "And how did you escape?",
     "say": "He is silent for a long while. “I could swim, sir. That was all. God did not ask who was brave.”"
    },
    "b": {
     "ask": "What will you do now?",
     "say": "“Plough, if my brother will still take me in. I have drawn furrows enough with the pike.”"
    },
    "b1": {
     "ask": "And if he will not take you in?",
     "say": "“Then I shall enlist again. A soldier without a master is like a dog without a farm.” He shrugs and walks on."
    }
   }
  },
  "kraeuter": {
   "title": "The Herb Woman",
   "nodes": {
    "start": {
     "say": "A woman with a basket full of herbs and roots looks up. “God greet you, Master Headman. Yarrow for wounds, chamomile for the belly, and St John’s wort – that must be picked on the proper day.”"
    },
    "a": {
     "ask": "Which day is the proper one?",
     "say": "“St John’s Day, when the sun stands highest. Then the strength is in the herb. The priest says it is superstition, but he cures his cough with it all the same.”"
    },
    "a1": {
     "ask": "Can you help with fever too?",
     "say": "“Willow bark, boiled and bitter. And rest, which people always forget. No herb helps against spotted fever – only prayer and keeping one’s distance.”"
    },
    "b": {
     "ask": "Are you not afraid of what people say?",
     "say": "Her gaze hardens. “I am, sir. A woman who heals is soon called one who bewitches. I go alone into the woods and show no one where my herbs grow.”"
    },
    "b1": {
     "ask": "You shall be safe in my village.",
     "say": "She studies you and nods slowly. “A kind word from a village headman is worth more than any herb. God keep you.”"
    }
   }
  },
  "fuhrmann": {
   "title": "The Carter and the Broken Axle",
   "nodes": {
    "start": {
     "say": "A carter curses over his wagon, its wheel stuck fast in the sand. “Forgive my words, sir! The axle has cracked, and Uelzen is still two days away.”"
    },
    "a": {
     "ask": "Can I lend a hand?",
     "say": "You brace yourself against the wagon, and with a heave the wheel comes free. “God reward you! It will hold until the next smith. A headman who gets his hands dirty – I shall tell that tale.”"
    },
    "a1": {
     "ask": "What are you carrying?",
     "say": "“Linen from Westphalia, for the merchants in Lübeck. If I arrive late, the ship will sail for Bergen without me.”"
    },
    "b": {
     "ask": "Why do you take this road?",
     "say": "“The highway has three toll stations. The road here is worse, but cheaper. One saves on the toll and pays at the wheel.”"
    },
    "b1": {
     "ask": "Is it worth it?",
     "say": "He looks at his wheel and sighs. “Not today, sir. Not today.”"
    }
   }
  },
  "salzfuhre": {
   "title": "The Salt Wagon",
   "nodes": {
    "start": {
     "say": "A heavy wagon laden with barrels of salt comes rumbling along, and the carter reins in the horses. “Salt from Lüneburg, sir, on the old salt road to Lübeck. The merchants call it white gold.”"
    },
    "a": {
     "ask": "Why does Lübeck need so much salt?",
     "say": "“For the herring, sir! In Scania it is salted and sold in barrels as far as Novgorod. Without Lüneburg salt, half of Christendom would have no food for fast days.”"
    },
    "a1": {
     "ask": "How long does the journey take?",
     "say": "“In good weather, twenty days there and back. In the rain the mud swallows the wheels, and the salt gets wet. Then we must pay our master for it out of our own wages.”"
    },
    "b": {
     "ask": "Is the cargo not tempting to thieves?",
     "say": "“That is why three of us travel together, with clubs. But salt is hard to steal – you cannot hide it in your pocket.”"
    },
    "b1": {
     "ask": "A safe journey to you, then!",
     "say": "He clicks his tongue, and the horses pull away. “And may your barns be full, Master Headman!”"
    }
   }
  },
  "bote": {
   "title": "The Bishop’s Messenger",
   "nodes": {
    "start": {
     "say": "A rider with a messenger’s bag and the arms of the Bishop of Verden reins in his horse. “Make way, good man – ah, forgive me, are you the village headman? I am in haste, but there is time for a word.”"
    },
    "a": {
     "ask": "What news do you carry?",
     "say": "“I cannot say, sir. Sealed and sealed again. But when a messenger rides in such haste, it concerns money or heretics.”"
    },
    "a1": {
     "ask": "And which is it?",
     "say": "He grins. “Most often both, Master Headman.” Then he spurs his horse."
    },
    "b": {
     "ask": "Is your horse not weary?",
     "say": "“It will be changed at Rotenburg. We messengers ride as much as ten miles a day. The horse is fortunate – the rider is not changed.”"
    },
    "b1": {
     "ask": "God be with you, messenger.",
     "say": "He nods briefly and gallops away, a cloud of dust behind him."
    }
   }
  },
  "brief": {
   "title": "The Lost Letter",
   "nodes": {
    "start": {
     "say": "A merchant’s servant searches the roadside in haste. Beside you in the grass lies a folded letter with a red wax seal. “Sir! Have you seen a letter? My master will have me whipped if it is lost!”"
    },
    "a": {
     "ask": "Give him back the letter.",
     "say": "He snatches it up and kisses the seal. “Unbroken, thank God! A bill of exchange for Bruges – whoever breaks that will break the neck of the house of Wullenwever.”"
    },
    "a1": {
     "ask": "What is a bill of exchange?",
     "say": "“One pays in Lübeck and collects the money in Bruges, without carrying silver overland. That is the merchants’ art: paper instead of horses.”"
    },
    "b": {
     "ask": "First examine the seal.",
     "say": "You turn the letter in your hand. The seal shows a ship and three stars. The servant turns pale. “That is my master’s seal, upon my soul! Please, sir!” You hand him the letter."
    },
    "b1": {
     "ask": "Take better care henceforth.",
     "say": "“I shall, sir, I shall!” He tucks the letter beneath his shirt and runs on without looking back."
    }
   }
  },
  "deichbauer": {
   "title": "The Dike Builder from Holland",
   "nodes": {
    "start": {
     "say": "A man with a measuring rod and a foreign accent looks out over the flat land. “Goedendag, mijnheer. I have been summoned from Holland to inspect the dikes. You have much water here and little earth.”"
    },
    "a": {
     "ask": "What makes a good dike?",
     "say": "“A gentle slope towards the sea, like a back, steep towards the land. Clay from the marsh, not sand. And every farm must send men to work on it, or it will break at its weakest point.”"
    },
    "a1": {
     "ask": "Does it break even so?",
     "say": "“Every dike breaks in time, mijnheer. The St Marcellus flood took whole parishes. A dike is no victory; it is a bargain with the sea.”"
    },
    "b": {
     "ask": "Why do they bring you from Holland?",
     "say": "“Because we have fought the water for three hundred years, and it has not won yet. He who has no land makes some for himself.”"
    },
    "b1": {
     "ask": "Will you stay long?",
     "say": "“Until summer is over. Then I shall long for home, for my wife and a peat fire.” He makes a note on his wax tablet."
    }
   }
  },
  "jaeger": {
   "title": "The Nobleman’s Huntsman",
   "nodes": {
    "start": {
     "say": "A huntsman in a green coat, a crossbow over his shoulder, stops you. “Master Headman. My lord is seeking poachers. Snares have been found here at the edge of the wood.”"
    },
    "a": {
     "ask": "No one in our village poaches.",
     "say": "“Every headman says that, sir. But in winter, when the cabbages are gone, many a peasant turns hunter. Whoever is caught loses his hand.”"
    },
    "a1": {
     "ask": "Is that not harsh for a hare?",
     "say": "He shrugs. “The game belongs to the lord; that is the law. I do not make the law, I merely carry the crossbow.”"
    },
    "b": {
     "ask": "What does your lord hunt?",
     "say": "“Red deer and wild boar, with hounds in autumn. The peasants must serve as beaters and may not complain when the game eats their grain.”"
    },
    "b1": {
     "ask": "That is a bitter burden.",
     "say": "“Many say so, sir. Quietly.” He nods to you and disappears among the oaks."
    }
   }
  },
  "hirtenkind": {
   "title": "The Lost Goose Girl",
   "nodes": {
    "start": {
     "say": "A little girl with a switch stands weeping by the road. “The geese are gone, sir, and I cannot find my way home. Mother will scold me.”"
    },
    "a": {
     "ask": "Where do you live?",
     "say": "She sniffles and points vaguely in one direction. “Beyond the great boulder, where the oak stands.” You show her the church tower on the horizon. Her face brightens."
    },
    "a1": {
     "ask": "Follow the tower and you will find your way home.",
     "say": "“Thank you, Master Headman!” She runs off, calling for the geese from afar – and they promptly answer with a cackle from the reeds."
    },
    "b": {
     "ask": "The geese will find their own way home.",
     "say": "“Do you think so?” She wipes her nose on her sleeve. “Father says the old one with the lame wing is cleverer than I am.”"
    },
    "b1": {
     "ask": "Then follow the old one.",
     "say": "She giggles and skips away, swinging her switch, as though she had never been lost."
    }
   }
  },
  "koehler": {
   "title": "The Charcoal Burner",
   "nodes": {
    "start": {
     "say": "A soot-blackened man steps out of the smoke. Behind him a charcoal mound smoulders. “God greet you, sir. Do not come too near; the mound is as fickle as a goat.”"
    },
    "a": {
     "ask": "How long does the mound burn?",
     "say": "“Twelve days and nights. I sleep beside it in my hut and listen to it breathing. If it catches fire, all the wood turns to ash.”"
    },
    "a1": {
     "ask": "Who buys the charcoal?",
     "say": "“The smiths and the ironworks in the Harz. Good charcoal burns hotter than any wood – without it, no iron and no plough.”"
    },
    "b": {
     "ask": "Is it not a lonely life?",
     "say": "“People avoid us; we are black as the devil. But the forest speaks when one is quiet. The owl knows me better than the priest does.”"
    },
    "b1": {
     "ask": "Come to our village sometime.",
     "say": "He laughs, his teeth flashing white through the soot. “If I wash in the brook first, Master Headman. I promise.”"
    }
   }
  },
  "scholar": {
   "title": "The Wandering Scholar",
   "nodes": {
    "start": {
     "say": "A young man with ink-stained fingers and a bundle of books greets you in Latin. “Salve, domine! I am a scholar from Rostock, bound for Erfurt. Have you a place for a poor learned man to sleep?”"
    },
    "a": {
     "ask": "What does one learn in Rostock?",
     "say": "“The seven liberal arts, sir: grammar, rhetoric, logic, and then arithmetic, geometry, music and the stars. Only after that, law or theology, if one can afford it.”"
    },
    "a1": {
     "ask": "And what use is that to a peasant?",
     "say": "He considers this earnestly. “A man who can reckon will not be cheated by the bailiff. A man who can read does not believe every letter with a seal. That is no small use.”"
    },
    "b": {
     "ask": "Why are you so poor?",
     "say": "“Books are dear, and my father is a cooper. I sing at doors for bread, like all wandering students. The townsfolk give so that we shall pray for them.”"
    },
    "b1": {
     "ask": "Good fortune on your journey.",
     "say": "“Deo gratias!” He adjusts his books and goes on his way, whistling."
    }
   }
  },
  "hirschkalb": {
   "title": "The Fawn in the Thorns",
   "nodes": {
    "start": {
     "say": "A young red deer fawn struggles in the brush by the roadside. Its leg has caught in a bramble and an old snare. It looks at you with wide, frightened eyes."
    },
    "a": {
     "ask": "Free the fawn.",
     "say": "Carefully, you loosen the snare. The fawn leaps up, stumbles once and bounds away among the birches. Somewhere in the wood, its mother calls in answer."
    },
    "b": {
     "ask": "Leave it to the lord’s huntsman.",
     "say": "The game belongs to the nobleman, and anyone who touches it risks suspicion. You turn away. When you look back once more, the fawn has freed itself and is gone."
    }
   }
  },
  "frischling": {
   "title": "The Boar Piglet in the Snare",
   "nodes": {
    "start": {
     "say": "Beneath an oak, a striped boar piglet squeals, its hind leg caught in a poacher’s snare. The sow cannot be far away."
    },
    "a": {
     "ask": "Quickly cut the snare.",
     "say": "One cut sets it free, and it runs squealing into the undergrowth. A deep grunt answers from the thicket. You decide to move on quickly."
    },
    "b": {
     "ask": "Keep your distance – the sow is near.",
     "say": "You retreat slowly. Soon afterwards, the sow bursts from the bushes, tugs at the wire until it snaps, and leads her young away."
    }
   }
  },
  "rothirsch": {
   "title": "The Red Stag at the Forest’s Edge",
   "nodes": {
    "start": {
     "say": "At the edge of the forest stands a mighty red stag, his antlers like a crown. He raises his head and scents the air in your direction."
    },
    "a": {
     "ask": "Stand still and watch.",
     "say": "He stands there a long while, then lowers his head and resumes grazing, as though you were a tree. A rare sight – the elders say it promises a good year."
    },
    "b": {
     "ask": "Clap your hands.",
     "say": "With one great bound he vanishes into the forest. Only a few branches still sway in his wake."
    }
   }
  },
  "bache": {
   "title": "The Sow and Her Piglets",
   "nodes": {
    "start": {
     "say": "In the middle of the path, a wild sow roots in the earth, a few striped piglets about her. She has noticed you and raises her bristles."
    },
    "a": {
     "ask": "Back away slowly.",
     "say": "Step by step, you retreat. The sow grunts a warning, then drives her young across the path into the bracken."
    },
    "b": {
     "ask": "Make a detour across the heath.",
     "say": "You make a wide detour through the heather. Behind you, you hear the contented snuffling of the sounder as they continue rooting undisturbed."
    }
   }
  }
 }
} as Full,
  fr: {
 "ui": {
  "leave": "Poursuivre son chemin en saluant",
  "far": "Approchez-vous pour saluer.",
  "greet": "Adresser la parole"
 },
 "enc": {
  "pilger": {
   "title": "Le pèlerin de Saint-Jacques",
   "nodes": {
    "start": {
     "say": "Un voyageur soulève son chapeau de feutre humide, où brille une coquille Saint-Jacques en plomb. « Dieu vous garde, honorable homme. Voilà trois semaines que je chemine depuis Magdeburg, vers Wilsnack et le Saint-Sang. Auriez-vous une gorgée d’eau pour une gorge altérée ? »"
    },
    "a": {
     "ask": "Tenez, prenez ma gourde.",
     "say": "Il boit à longues gorgées et se signe. « Que le Seigneur récompense votre village d’une riche moisson d’orge. On dit que, sur les chemins de la lande vers l’Elbe, des détrousseurs guettent les pèlerins. »"
    },
    "a1": {
     "ask": "Que savez-vous de ces gaillards ?",
     "say": "« Trois hommes, dit-on, avec un cheval blanc. Le bailli de Lüneburg a envoyé des mandats pour les faire prendre. Je ne marche plus que de jour, en compagnie d’autres voyageurs. »"
    },
    "b": {
     "ask": "Qu’entend-on sur les grandes routes ?",
     "say": "Il s’appuie sur son bâton de frêne. « À Braunschweig, les guildes grondent contre le conseil à cause du droit sur la bière, et dans les monastères on dispute des indulgences. Le monde se défait, ce me semble. »"
    },
    "b1": {
     "ask": "La paix du pays n’est-elle donc pas maintenue ?",
     "say": "« L’empereur est loin, monsieur le prévôt, et les princes sont près. Un village uni est plus sûr que toute lettre munie d’un sceau. »"
    }
   }
  },
  "spielmann": {
   "title": "Le ménestrel",
   "nodes": {
    "start": {
     "say": "Un homme au pourpoint bariolé et à la vièle sur le dos s’incline bien bas, avec force révérences. « Béni soit le chemin qui me mène à un prévôt ! Une chanson vous plairait-elle, seigneur ? Pour un quignon de pain, je joue jusqu’au coucher du soleil. »"
    },
    "a": {
     "ask": "Jouez-moi une chanson.",
     "say": "Il fait chanter les cordes et chante Störtebeker, qui, privé de sa tête, aurait encore passé devant onze de ses compagnons. À la fin, il cligne de l’œil. « À Hamburg, on n’aime guère entendre cela ; là-bas, je chante plutôt les chevaliers. »"
    },
    "a1": {
     "ask": "Où jouez-vous d’ordinaire ?",
     "say": "« Aux noces, aux fêtes paroissiales, dans les auberges des grandes routes. En hiver, je cherche un monastère bien chaud. Un ménestrel n’a point de maison, il n’a que les chemins. »"
    },
    "b": {
     "ask": "Un ménestrel n’est-il pas sans honneur ?",
     "say": "Il rit sans paraître offensé. « Sans honneur devant la justice, seigneur, c’est vrai, mais non devant les gens. Qui danse ne s’enquiert pas du rang. »"
    },
    "b1": {
     "ask": "Et que vous restera-t-il ?",
     "say": "« Une chanson que l’on chantera encore quand je reposerai depuis longtemps sous l’herbe. C’est plus que ne laisse derrière lui maint conseiller. »"
    }
   }
  },
  "kraemer": {
   "title": "Le colporteur",
   "nodes": {
    "start": {
     "say": "Un marchand portant une lourde hotte sur le dos s’arrête, tout essoufflé. « Aiguilles, fil, rubans de Flandre, poivre aussi cher que l’argent ! Regarder ne coûte rien, monsieur le prévôt. »"
    },
    "a": {
     "ask": "D’où vient votre marchandise ?",
     "say": "« Les rubans de Brügge, les aiguilles de Nürnberg, le poivre par Venedig et Lübeck. Chaque péage en chemin en dévore une part ; voilà pourquoi le prix est tel. »"
    },
    "a1": {
     "ask": "Combien y a-t-il donc de péages ?",
     "say": "Il compte sur ses doigts et renonce à douze. « Chaque rivière, chaque pont, chaque seigneur. Au bout du compte, le poivre gagne plus que moi. »"
    },
    "b": {
     "ask": "Quelles nouvelles y a-t-il au pays ?",
     "say": "« À Lüneburg, le sel a renchéri, et à Bardowick, un veau à deux têtes est né : l’aubergiste le jure sur son âme. »"
    },
    "b1": {
     "ask": "Le croyez-vous ?",
     "say": "« Je crois ce qui peut se vendre, seigneur. Et une bonne histoire se vend mieux que du fil. » Il rit et rajuste sa hotte."
    }
   }
  },
  "moench": {
   "title": "Le moine mendiant",
   "nodes": {
    "start": {
     "say": "Un franciscain en bure grise, pieds nus malgré le sol froid, lève la main pour bénir. « La paix soit avec vous. Je quête pour notre monastère de Lüneburg : une aumône ou seulement une bonne parole. »"
    },
    "a": {
     "ask": "Comment se portent vos frères ?",
     "say": "« Nous soignons les malades à l’hospice et prêchons sur les marchés. Les messieurs du conseil donnent volontiers quand nous prions pour leurs âmes. »"
    },
    "a1": {
     "ask": "La prière est-elle donc secourable ?",
     "say": "Il sourit avec douceur. « Contre la peste, pas toujours, monsieur le prévôt. Mais contre le désespoir, assurément. »"
    },
    "b": {
     "ask": "Pourquoi allez-vous pieds nus ?",
     "say": "« Notre père François voulait être pauvre comme le Seigneur. Les pieds s’accoutument ; le cœur prend plus de temps. »"
    },
    "b1": {
     "ask": "N’est-ce pas rude en hiver ?",
     "say": "« En hiver, nous portons des semelles de bois : la règle est clémente à ce point. Et qui a froid prie plus vite. » Il esquisse presque un clin d’œil."
    }
   }
  },
  "torf": {
   "title": "Le tourbier",
   "nodes": {
    "start": {
     "say": "Un homme aux chausses boueuses porte des mottes de tourbe sur le dos. « Dieu vous garde. L’extraction va bien au marais cette année : c’est assez sec pour qu’on n’y enfonce point. »"
    },
    "a": {
     "ask": "Comment extrait-on la tourbe ?",
     "say": "« À la bêche, en briques, au printemps. Puis on les empile pour que le vent les sèche. Elles ne brûlent qu’en automne. »"
    },
    "a1": {
     "ask": "Le marais n’est-il pas dangereux ?",
     "say": "« Qui n’en connaît pas les sentiers, il l’emporte. Mon grand-père y a trouvé un corps, brun comme du cuir. Nous l’avons recouvert et avons dit un Notre Père. »"
    },
    "b": {
     "ask": "À qui appartient le marais ?",
     "say": "« Au monastère, seigneur. Pour chaque charretée, nous donnons la dîme. Mais sans tourbe, les moines auraient froid tout autant que nous. »"
    },
    "b1": {
     "ask": "La peine en vaut-elle la chandelle ?",
     "say": "« Il y en a assez pour l’âtre. De la tourbe, seul s’enrichit celui qui ne l’extrait pas. »"
    }
   }
  },
  "schaefer": {
   "title": "Le berger de la lande",
   "nodes": {
    "start": {
     "say": "Un vieux berger s’appuie sur son bâton, son chien à ses pieds. « Eh bien, monsieur le prévôt, vous voilà dehors avec nous pour une fois ? Les moutons de la lande sont calmes aujourd’hui : le temps va changer. »"
    },
    "a": {
     "ask": "À quoi reconnaissez-vous le temps qu’il fera ?",
     "say": "« Quand les moutons rapprochent leurs têtes, la pluie vient. Quand les hirondelles volent bas, aussi. Et quand mon genou me tire, c’est certain. »"
    },
    "a1": {
     "ask": "Ne vous trompez-vous jamais ?",
     "say": "« Si fait, seigneur. Mais moins souvent que le faiseur de calendriers en ville. » Il rit dans sa barbe grise."
    },
    "b": {
     "ask": "Depuis combien de temps gardez-vous les bêtes ?",
     "say": "« Depuis que j’avais sept hivers. La lande ne s’apprend pas dans les livres. Ici ne pousse que ce qui est tenace : la bruyère, le genévrier et les bergers. »"
    },
    "b1": {
     "ask": "Craignez-vous les loups ?",
     "say": "« Pas tant que le chien veille. L’hiver dernier, l’un d’eux a pris deux agneaux. Depuis lors, le chien dort moins que moi. »"
    }
   }
  },
  "landsknecht": {
   "title": "Le lansquenet",
   "nodes": {
    "start": {
     "say": "Un homme aux chausses crevées et usées, une épée à la hanche, touche son bonnet à plumes. « Congédié sans solde, seigneur. Je rentre chez moi en Holstein. Soyez sans crainte : je suis las, non dangereux. »"
    },
    "a": {
     "ask": "Où avez-vous servi ?",
     "say": "« Sous le roi de Danemark, en Dithmarschen. Les paysans ont ouvert les écluses et nous avions de l’eau jusqu’à la ceinture. À Hemmingstedt, plus d’hommes se sont noyés qu’il n’en est tombé au combat. »"
    },
    "a1": {
     "ask": "Et comment avez-vous échappé ?",
     "say": "Il garde longtemps le silence. « Je savais nager, seigneur. C’était tout. Dieu n’a pas demandé qui étaient les braves. »"
    },
    "b": {
     "ask": "Que voulez-vous faire à présent ?",
     "say": "« Labourer, si mon frère veut encore de moi. Avec ma pique, j’ai tracé assez de sillons. »"
    },
    "b1": {
     "ask": "Et s’il ne veut pas de vous ?",
     "say": "« Alors je m’engagerai de nouveau. Un homme sans maître est comme un chien sans ferme. » Il hausse les épaules et poursuit son chemin."
    }
   }
  },
  "kraeuter": {
   "title": "L’herboriste",
   "nodes": {
    "start": {
     "say": "Une femme portant un panier plein d’herbes et de racines lève les yeux. « Dieu vous garde, monsieur le prévôt. De l’achillée pour les plaies, de la camomille pour le ventre, et du millepertuis : il faut le cueillir au bon jour. »"
    },
    "a": {
     "ask": "Quel est le bon jour ?",
     "say": "« La Saint-Jean, quand le soleil est au plus haut. Alors la force est dans l’herbe. Le curé dit que c’est superstition, mais il en soigne tout de même sa toux. »"
    },
    "a1": {
     "ask": "Soulagez-vous aussi la fièvre ?",
     "say": "« De l’écorce de saule, bouillie et amère. Et du repos : les gens l’oublient toujours. Contre la fièvre pourprée, nulle herbe ne vaut ; il n’y a que la prière et la distance. »"
    },
    "b": {
     "ask": "Ne craignez-vous pas les commérages ?",
     "say": "Son regard se durcit. « Si fait, seigneur. Une femme qui guérit passe vite pour une femme qui ensorcelle. Je vais seule dans les bois et ne montre à personne où poussent mes herbes. »"
    },
    "b1": {
     "ask": "Dans mon village, vous serez en sûreté.",
     "say": "Elle vous examine et acquiesce lentement. « Une bonne parole d’un prévôt vaut plus qu’une herbe. Dieu vous garde. »"
    }
   }
  },
  "fuhrmann": {
   "title": "Le charretier et son essieu",
   "nodes": {
    "start": {
     "say": "Un charretier jure devant son chariot, dont la roue est prise dans le sable. « Pardonnez mes paroles, seigneur ! L’essieu a craqué, et il reste encore deux jours jusqu’à Uelzen. »"
    },
    "a": {
     "ask": "Puis-je vous donner la main ?",
     "say": "Vous poussez contre le chariot et, d’un coup, la roue se dégage. « Dieu vous le rende ! Cela tiendra jusqu’au prochain forgeron. Un prévôt qui se salit les mains, voilà ce que je raconterai. »"
    },
    "a1": {
     "ask": "Que transportez-vous donc ?",
     "say": "« De la toile de lin de Westfalen, pour les marchands de Lübeck. Si j’arrive en retard, le navire partira pour Bergen sans moi. »"
    },
    "b": {
     "ask": "Pourquoi prenez-vous ce chemin ?",
     "say": "« La grande route compte trois péages. Ici, le chemin est plus mauvais, mais moins coûteux. On épargne au péage et l’on paie à la roue. »"
    },
    "b1": {
     "ask": "Cela en vaut-il la peine ?",
     "say": "Il regarde sa roue et soupire. « Pas aujourd’hui, seigneur. Pas aujourd’hui. »"
    }
   }
  },
  "salzfuhre": {
   "title": "Le chariot de sel",
   "nodes": {
    "start": {
     "say": "Un lourd chariot chargé de tonneaux de sel approche en grondant ; le valet charretier arrête les chevaux. « Du sel de Lüneburg, seigneur, sur l’ancienne route du sel vers Lübeck. Les marchands l’appellent l’or blanc. »"
    },
    "a": {
     "ask": "Pourquoi Lübeck a-t-elle besoin de tant de sel ?",
     "say": "« Pour le hareng, seigneur ! À Schonen, on le sale et on le vend en tonneaux jusqu’à Nowgorod. Sans le sel de Lüneburg, point de mets de carême pour la moitié de la chrétienté. »"
    },
    "a1": {
     "ask": "Combien de temps dure le voyage ?",
     "say": "« Par beau temps, vingt jours pour l’aller et le retour. Par pluie, la boue dévore les roues et le sel se mouille. Alors on le paie au maître sur son propre salaire. »"
    },
    "b": {
     "ask": "La cargaison ne tente-t-elle pas les voleurs ?",
     "say": "« C’est pourquoi nous voyageons à trois, avec des gourdins. Mais le sel est difficile à voler : on ne peut le cacher dans sa poche. »"
    },
    "b1": {
     "ask": "Bonne route, alors !",
     "say": "Il claque la langue et les chevaux se mettent en marche. « Et à vous des granges pleines, monsieur le prévôt ! »"
    }
   }
  },
  "bote": {
   "title": "Le messager de l’évêque",
   "nodes": {
    "start": {
     "say": "Un cavalier muni d’une sacoche de messager et portant les armes de l’évêque de Verden retient son cheval. « Place, brave homme… ah, pardonnez-moi, vous êtes le prévôt ? Je suis pressé, mais nous pouvons échanger quelques mots. »"
    },
    "a": {
     "ask": "Quelle nouvelle portez-vous ?",
     "say": "« Je ne puis le dire, seigneur. C’est scellé et bien scellé. Mais quand un messager se hâte ainsi, c’est affaire d’argent ou d’hérétiques. »"
    },
    "a1": {
     "ask": "Et de laquelle des deux s’agit-il ?",
     "say": "Il sourit. « Le plus souvent, des deux, monsieur le prévôt. » Puis il donne de l’éperon à son cheval."
    },
    "b": {
     "ask": "Votre cheval n’est-il pas las ?",
     "say": "« On le change à Rotenburg. Nous autres messagers parcourons jusqu’à dix milles par jour. Le cheval a de la chance : on ne change pas le cavalier. »"
    },
    "b1": {
     "ask": "Allez avec Dieu, messager.",
     "say": "Il acquiesce brièvement et s’éloigne au galop, laissant derrière lui un nuage de poussière."
    }
   }
  },
  "brief": {
   "title": "La lettre perdue",
   "nodes": {
    "start": {
     "say": "Un commis de marchand fouille hâtivement le bord du chemin. À côté de vous, dans l’herbe, repose une lettre pliée, scellée de cire rouge. « Seigneur ! Avez-vous vu une lettre ? Mon maître me fera fouetter si elle manque ! »"
    },
    "a": {
     "ask": "Lui rendre la lettre.",
     "say": "Il la saisit vivement et baise le sceau. « Intacte, Dieu merci ! Une lettre de change pour Brügge : qui la rompt brise le cou de la maison Wullenwever. »"
    },
    "a1": {
     "ask": "Qu’est-ce qu’une lettre de change ?",
     "say": "« On paie à Lübeck et l’on se fait payer à Brügge, sans porter d’argent par les routes. C’est l’art des marchands : du papier plutôt que des chevaux. »"
    },
    "b": {
     "ask": "Examiner d’abord le sceau.",
     "say": "Vous tournez la lettre dans votre main. Le sceau montre un navire et trois étoiles. Le commis pâlit. « C’est le sceau de mon maître, sur mon âme ! Je vous en prie, seigneur ! » Vous lui remettez la lettre."
    },
    "b1": {
     "ask": "Prenez mieux garde à l’avenir.",
     "say": "« Je le ferai, seigneur, je le ferai ! » Il glisse la lettre sous sa chemise et reprend sa course sans se retourner."
    }
   }
  },
  "deichbauer": {
   "title": "Le bâtisseur de digues de Holland",
   "nodes": {
    "start": {
     "say": "Un homme muni d’une règle de mesure et parlant avec un accent étranger contemple le pays plat. « Goedendag, mijnheer. On m’a fait venir de Holland pour examiner les digues. Vous avez ici beaucoup d’eau et peu de terre. »"
    },
    "a": {
     "ask": "Qu’est-ce qui fait une bonne digue ?",
     "say": "« Une pente douce vers la mer, comme un dos, et raide vers les terres. De l’argile des marais, point de sable. Et chaque ferme fournit des hommes pour entretenir la digue, sans quoi elle cède à son endroit le plus faible. »"
    },
    "a1": {
     "ask": "Cède-t-elle malgré tout ?",
     "say": "« Toute digue cède un jour, mijnheer. L’inondation de la Saint-Marcel a emporté des paroisses entières. La digue n’est pas une victoire, c’est un pacte avec la mer. »"
    },
    "b": {
     "ask": "Pourquoi vous fait-on venir de Holland ?",
     "say": "« Parce que voilà trois cents ans que nous luttons contre l’eau et qu’elle n’a pas encore gagné. Qui n’a point de terre s’en fait. »"
    },
    "b1": {
     "ask": "Resterez-vous longtemps ?",
     "say": "« Jusqu’à la fin de l’été. Alors je voudrai rentrer, retrouver ma femme et mon feu de tourbe. » Il note quelque chose sur sa tablette de cire."
    }
   }
  },
  "jaeger": {
   "title": "Le chasseur du seigneur",
   "nodes": {
    "start": {
     "say": "Un chasseur en habit vert, l’arbalète sur l’épaule, vous arrête. « Monsieur le prévôt. Mon seigneur cherche des braconniers. On a trouvé des collets ici, à l’orée du bois. »"
    },
    "a": {
     "ask": "Chez nous, nul ne braconne.",
     "say": "« Chaque prévôt dit cela, seigneur. Mais en hiver, quand il n’y a plus de choux, plus d’un paysan devient chasseur. Qui se fait prendre perd la main. »"
    },
    "a1": {
     "ask": "N’est-ce pas rude pour un lièvre ?",
     "say": "Il hausse les épaules. « Le gibier appartient au seigneur, c’est le droit. Je ne fais pas le droit, je porte seulement l’arbalète. »"
    },
    "b": {
     "ask": "Que chasse votre seigneur ?",
     "say": "« Le cerf et le sanglier, en automne avec des chiens. Les paysans doivent fournir les rabatteurs et ne peuvent se plaindre quand le gibier mange leur grain. »"
    },
    "b1": {
     "ask": "C’est un bien lourd fardeau.",
     "say": "« Beaucoup le disent, seigneur. Tout bas. » Il vous salue de la tête et disparaît entre les chênes."
    }
   }
  },
  "hirtenkind": {
   "title": "La petite gardeuse égarée",
   "nodes": {
    "start": {
     "say": "Une petite fille tenant une baguette se tient au bord du chemin, en pleurs. « Les oies sont parties, seigneur, et je ne retrouve plus le chemin de la maison. Mère va me gronder. »"
    },
    "a": {
     "ask": "Où habites-tu donc ?",
     "say": "Elle renifle et montre vaguement une direction. « Derrière la grosse pierre, là où se trouve le chêne. » Vous lui montrez le clocher à l’horizon. Son visage s’éclaire."
    },
    "a1": {
     "ask": "Suis le clocher et tu retrouveras ta maison.",
     "say": "« Merci, monsieur le prévôt ! » Elle part en courant et appelle déjà les oies de loin ; aussitôt, elles lui répondent en cacardant dans les roseaux."
    },
    "b": {
     "ask": "Les oies retrouveront bien leur chemin.",
     "say": "« Vous croyez ? » Elle s’essuie le nez à sa manche. « La vieille qui a l’aile boiteuse est plus maligne que moi, dit père. »"
    },
    "b1": {
     "ask": "Alors suis la vieille.",
     "say": "Elle glousse et s’éloigne en sautillant, agitant sa baguette comme si elle ne s’était jamais perdue."
    }
   }
  },
  "koehler": {
   "title": "Le charbonnier",
   "nodes": {
    "start": {
     "say": "Un homme noirci de suie sort de la fumée. Derrière lui, une meule fume. « Dieu vous garde, seigneur. N’approchez pas trop : la meule est capricieuse comme une chèvre. »"
    },
    "a": {
     "ask": "Combien de temps la meule brûle-t-elle ?",
     "say": "« Douze jours et douze nuits. Je dors à côté, dans ma cabane, et j’écoute son souffle. Si elle prend feu, tout le bois devient cendre. »"
    },
    "a1": {
     "ask": "Qui achète le charbon ?",
     "say": "« Les forgerons et les fonderies du Harz. Un bon charbon brûle plus chaud que n’importe quel bois : sans lui, point de fer et point de charrue. »"
    },
    "b": {
     "ask": "N’est-ce pas une vie solitaire ?",
     "say": "« Les gens nous évitent, nous sommes noirs comme le diable. Mais la forêt parle quand on se tait. La chouette me connaît mieux que le curé. »"
    },
    "b1": {
     "ask": "Venez un jour dans notre village.",
     "say": "Il rit, et ses dents blanches brillent dans la suie. « Si je me lave d’abord au ruisseau, monsieur le prévôt. Promis. »"
    }
   }
  },
  "scholar": {
   "title": "L’écolier itinérant",
   "nodes": {
    "start": {
     "say": "Un jeune homme aux doigts tachés d’encre et portant un paquet de livres vous salue en latin. « Salve, domine! Je suis écolier de Rostock, en route pour Erfurt. Auriez-vous un gîte pour la nuit pour un pauvre lettré ? »"
    },
    "a": {
     "ask": "Qu’apprend-on à Rostock ?",
     "say": "« Les sept arts libéraux, seigneur : grammaire, rhétorique, logique, puis calcul, géométrie, musique et les astres. Après seulement viennent le droit ou la théologie, si l’on en a les moyens. »"
    },
    "a1": {
     "ask": "Et à quoi cela sert-il à un paysan ?",
     "say": "Il réfléchit sérieusement. « Qui sait compter ne se laisse pas tromper par le bailli. Qui sait lire ne croit pas toute lettre munie d’un sceau. Ce n’est pas un mince profit. »"
    },
    "b": {
     "ask": "Pourquoi êtes-vous si pauvre ?",
     "say": "« Les livres sont coûteux et mon père est tonnelier. Je chante devant les portes pour du pain, comme tous les écoliers itinérants. Les bourgeois donnent pour que nous priions pour eux. »"
    },
    "b1": {
     "ask": "Bonne chance sur votre route.",
     "say": "« Deo gratias! » Il rajuste ses livres et reprend son chemin en sifflant."
    }
   }
  },
  "hirschkalb": {
   "title": "Le faon dans les ronces",
   "nodes": {
    "start": {
     "say": "Dans les broussailles au bord du chemin, un jeune faon se débat. Sa patte est prise dans une ronce et un vieux collet. Il vous regarde de ses grands yeux effrayés."
    },
    "a": {
     "ask": "Libérer le faon.",
     "say": "Avec précaution, vous défaites le collet. Le faon bondit, trébuche une fois et disparaît à grandes enjambées entre les bouleaux. Quelque part dans la forêt, la biche lui répond."
    },
    "b": {
     "ask": "Le laisser au chasseur du seigneur.",
     "say": "Le gibier appartient au seigneur, et qui y touche se rend suspect. Vous détournez les yeux. Quand vous regardez de nouveau, le faon s’est libéré seul et a disparu."
    }
   }
  },
  "frischling": {
   "title": "Le marcassin dans le collet",
   "nodes": {
    "start": {
     "say": "Sous un chêne, un marcassin rayé pousse des cris, la patte arrière prise dans un collet de braconnier. La laie ne peut être loin."
    },
    "a": {
     "ask": "Couper rapidement le collet.",
     "say": "D’un coup de lame, il est libre et s’enfuit en criant dans le sous-bois. Un profond grognement lui répond du fourré. Vous préférez poursuivre vivement votre chemin."
    },
    "b": {
     "ask": "Garder ses distances : la laie est proche.",
     "say": "Vous reculez lentement. Peu après, la laie surgit des broussailles, tire sur le fil jusqu’à le rompre et emmène son petit."
    }
   }
  },
  "rothirsch": {
   "title": "Le cerf à l’orée du bois",
   "nodes": {
    "start": {
     "say": "À l’orée du bois se tient un puissant cerf, ses bois pareils à une couronne. Il relève la tête et flaire dans votre direction."
    },
    "a": {
     "ask": "Demeurer immobile et regarder.",
     "say": "Il reste là longtemps, puis baisse la tête et reprend sa pâture, comme si vous étiez un arbre. Un spectacle rare : les anciens disent qu’il annonce une bonne année."
    },
    "b": {
     "ask": "Frapper dans ses mains.",
     "say": "D’un bond puissant, il disparaît dans la forêt. Seules quelques branches oscillent encore."
    }
   }
  },
  "bache": {
   "title": "La laie et ses marcassins",
   "nodes": {
    "start": {
     "say": "Au milieu du chemin, une laie fouille le sol, quelques marcassins rayés autour d’elle. Elle vous a remarqué et hérisse ses soies."
    },
    "a": {
     "ask": "Reculer lentement.",
     "say": "Pas à pas, vous reculez. La laie grogne en guise d’avertissement, puis pousse ses petits à travers le chemin, vers les fougères."
    },
    "b": {
     "ask": "Faire un détour par la lande.",
     "say": "Vous faites un large détour à travers la bruyère. Derrière vous, vous entendez la harde grogner de contentement et continuer à fouiller le sol sans être dérangée."
    }
   }
  }
 }
} as Full,
  es: {
 "ui": {
  "leave": "Despedirse y seguir camino",
  "far": "Acercaos para saludar.",
  "greet": "Dirigir la palabra"
 },
 "enc": {
  "pilger": {
   "title": "El peregrino de Santiago",
   "nodes": {
    "start": {
     "say": "Un caminante se alza el húmedo sombrero de fieltro, en el que brilla una concha de Santiago de plomo. «Dios os salude, hombre honrado. Hace tres semanas que vengo de Magdeburg, camino de Wilsnack y de la Santa Sangre. ¿Tendríais un sorbo de agua para una garganta sedienta?»"
    },
    "a": {
     "ask": "Tomad, aquí tenéis mi odre.",
     "say": "Bebe a largos tragos y se santigua. «Que el Señor premie a vuestra aldea con abundante cosecha de cebada. Dicen que en los caminos de la geest hacia el Elba acechan salteadores a los peregrinos»."
    },
    "a1": {
     "ask": "¿Qué sabéis de esos individuos?",
     "say": "«Tres hombres, dicen, con un caballo tordo. El alguacil de Lüneburg ha enviado órdenes de captura. Ya solo camino de día y en compañía de otros»."
    },
    "b": {
     "ask": "¿Qué se oye en los caminos reales?",
     "say": "Se apoya en su bordón de fresno. «En Braunschweig murmuran los gremios contra el concejo por el impuesto sobre la cerveza, y en los monasterios disputan sobre las indulgencias. Paréceme que el mundo quiere salirse de sus goznes»."
    },
    "b1": {
     "ask": "¿Acaso no se respeta la paz del reino?",
     "say": "«El emperador está lejos, señor alcalde, y los príncipes cerca. Una aldea que permanece unida está más segura que con cualquier carta sellada»."
    }
   }
  },
  "spielmann": {
   "title": "El juglar",
   "nodes": {
    "start": {
     "say": "Un hombre con jubón de vivos colores y una fídula a la espalda hace una reverencia exageradamente profunda. «¡Bendito sea el camino que me lleva ante un alcalde! ¿Gustáis de una canción, señor? Por un mendrugo de pan tocaré hasta la puesta del sol»."
    },
    "a": {
     "ask": "Tocadme una canción.",
     "say": "Hace sonar las cuerdas y canta sobre Störtebeker, quien, ya sin cabeza, habría pasado andando junto a once compañeros. Al terminar, guiña un ojo. «En Hamburg no gusta oír eso; allí prefiero cantar sobre caballeros»."
    },
    "a1": {
     "ask": "¿Dónde más tocáis?",
     "say": "«En bodas, en las fiestas de la consagración de las iglesias, en las tabernas del camino real. En invierno busco un monasterio cálido. Un juglar no tiene casa, solo caminos»."
    },
    "b": {
     "ask": "¿No es un juglar hombre sin honra?",
     "say": "Se ríe, sin parecer ofendido. «Sin honra ante el tribunal, señor, eso es cierto; mas no ante la gente. Quien baila no pregunta por el linaje»."
    },
    "b1": {
     "ask": "¿Y qué os queda?",
     "say": "«Una canción que todavía se cante cuando yo lleve mucho tiempo bajo la hierba. Es más de lo que deja tras de sí algún concejal»."
    }
   }
  },
  "kraemer": {
   "title": "El buhonero",
   "nodes": {
    "start": {
     "say": "Un buhonero con una pesada cesta a la espalda se detiene, resoplando. «¡Agujas, hilo, cintas de Flandes, pimienta tan cara como la plata! Mirar no cuesta nada, señor alcalde»."
    },
    "a": {
     "ask": "¿De dónde vienen vuestras mercancías?",
     "say": "«Las cintas de Brügge, las agujas de Nürnberg, la pimienta por Venezia y Lübeck. Cada peaje del camino se lleva un pedazo; de ahí el precio»."
    },
    "a1": {
     "ask": "¿Cuántos peajes hay, pues?",
     "say": "Cuenta con los dedos y se da por vencido al llegar a doce. «Cada río, cada puente, cada señor. Al cabo, la pimienta gana más que yo»."
    },
    "b": {
     "ask": "¿Qué novedades hay en estas tierras?",
     "say": "«En Lüneburg ha subido el precio de la sal, y en Bardowick ha nacido un ternero de dos cabezas; la posadera lo jura por su alma»."
    },
    "b1": {
     "ask": "¿Lo creéis?",
     "say": "«Creo lo que se puede vender, señor. Y una buena historia se vende mejor que el hilo». Se ríe y se acomoda la cesta."
    }
   }
  },
  "moench": {
   "title": "El fraile mendicante",
   "nodes": {
    "start": {
     "say": "Un franciscano de hábito gris, descalzo pese a la frialdad del suelo, alza la mano para bendeciros. «La paz sea con vos. Recojo limosnas para nuestro monasterio de Lüneburg: una dádiva o siquiera una buena palabra»."
    },
    "a": {
     "ask": "¿Cómo les va a vuestros hermanos?",
     "say": "«Cuidamos a los enfermos en el hospital y predicamos en las plazas. Los señores del concejo dan de buen grado cuando rezamos por sus almas»."
    },
    "a1": {
     "ask": "¿Sirve de algo rezar?",
     "say": "Sonríe con dulzura. «Contra la peste, no siempre, señor alcalde. Pero contra la desesperación, sin duda»."
    },
    "b": {
     "ask": "¿Por qué vais descalzo?",
     "say": "«Nuestro padre Francisco quiso ser pobre como el Señor. Los pies se acostumbran; el corazón tarda más»."
    },
    "b1": {
     "ask": "¿No es duro en invierno?",
     "say": "«En invierno llevamos suelas de madera, tan clemente es la regla. Y quien tiene frío reza más deprisa». Casi parece guiñar un ojo."
    }
   }
  },
  "torf": {
   "title": "El cortador de turba",
   "nodes": {
    "start": {
     "say": "Un hombre con las calzas llenas de barro lleva terrones de turba a la espalda. «Dios os salude. Este año se corta bien en la turbera: está lo bastante seca para no hundirse»."
    },
    "a": {
     "ask": "¿Cómo se corta la turba?",
     "say": "«Con la pala, en bloques, por primavera. Luego se apilan para que el viento los seque. No arden hasta el otoño»."
    },
    "a1": {
     "ask": "¿No es peligrosa la turbera?",
     "say": "«A quien no conoce los caminos, se lo traga. Mi abuelo encontró allí un cuerpo, pardo como el cuero. Volvimos a cubrirlo y rezamos un padrenuestro»."
    },
    "b": {
     "ask": "¿A quién pertenece la turbera?",
     "say": "«Al monasterio, señor. Por cada carretada damos el diezmo. Pero sin turba los monjes pasarían tanto frío como nosotros»."
    },
    "b1": {
     "ask": "¿Compensa el esfuerzo?",
     "say": "«Para el hogar alcanza. Con la turba solo se hace rico quien no la corta»."
    }
   }
  },
  "schaefer": {
   "title": "El pastor del brezal",
   "nodes": {
    "start": {
     "say": "Un viejo pastor se apoya en su cayado, con el perro a sus pies. «Vaya, señor alcalde, ¿también vos salís alguna vez a vernos? Las ovejas del brezal están tranquilas hoy; eso anuncia cambio de tiempo»."
    },
    "a": {
     "ask": "¿Cómo sabéis qué tiempo hará?",
     "say": "«Cuando las ovejas juntan las cabezas, viene lluvia. Cuando las golondrinas vuelan bajo, también. Y si me duele la rodilla, seguro»."
    },
    "a1": {
     "ask": "¿Nunca os equivocáis?",
     "say": "«Sí, señor. Pero menos que el hacedor de calendarios de la ciudad». Se ríe entre las canas de su barba."
    },
    "b": {
     "ask": "¿Cuánto tiempo lleváis pastoreando?",
     "say": "«Desde que tenía siete inviernos. El brezal no se aprende en los libros. Aquí solo crece lo que es recio: brezo, enebro y pastores»."
    },
    "b1": {
     "ask": "¿Teméis a los lobos?",
     "say": "«No, mientras el perro esté despierto. El invierno pasado uno se llevó dos corderos. Desde entonces el perro duerme menos que yo»."
    }
   }
  },
  "landsknecht": {
   "title": "El lansquenete",
   "nodes": {
    "start": {
     "say": "Un hombre con calzas acuchilladas y raídas, y un Katzbalger al costado, se toca la gorra de plumas. «Me han licenciado sin paga, señor. Vuelvo a casa, a Holstein. No temáis: estoy cansado, no soy peligroso»."
    },
    "a": {
     "ask": "¿Dónde habéis servido?",
     "say": "«Bajo el rey de Dinamarca, en Dithmarschen. Los campesinos abrieron las esclusas y nos vimos con el agua hasta la cintura. En Hemmingstedt se ahogaron más hombres de los que cayeron en combate»."
    },
    "a1": {
     "ask": "¿Y cómo escapasteis?",
     "say": "Calla durante largo rato. «Sabía nadar, señor. Eso fue todo. Dios no preguntó quiénes eran valientes»."
    },
    "b": {
     "ask": "¿Qué pensáis hacer ahora?",
     "say": "«Arar, si mi hermano aún me acepta. Bastantes surcos he abierto con la pica»."
    },
    "b1": {
     "ask": "¿Y si no os acepta?",
     "say": "«Entonces volveré a alistarme. Un soldado sin señor es como un perro sin casa». Se encoge de hombros y sigue su camino."
    }
   }
  },
  "kraeuter": {
   "title": "La herbolaria",
   "nodes": {
    "start": {
     "say": "Una mujer con un cesto lleno de hierbas y raíces alza la vista. «Dios os salude, señor alcalde. Milenrama para las heridas, manzanilla para el vientre e hipérico; ese hay que recogerlo en el día preciso»."
    },
    "a": {
     "ask": "¿Cuál es el día preciso?",
     "say": "«San Juan, cuando el sol está en lo más alto. Entonces la fuerza está en la hierba. El párroco dice que eso es superstición, pero aun así se cura la tos con ella»."
    },
    "a1": {
     "ask": "¿También ayudáis contra la fiebre?",
     "say": "«Corteza de sauce, cocida y amarga. Y reposo, que la gente siempre lo olvida. Contra el tifus no hay hierba que valga; solo ayudan las oraciones y mantenerse lejos»."
    },
    "b": {
     "ask": "¿No teméis las habladurías?",
     "say": "Su mirada se endurece. «Sí, señor. A una mujer que cura pronto la toman por hechicera. Voy sola al bosque y no muestro a nadie dónde crecen mis hierbas»."
    },
    "b1": {
     "ask": "En mi aldea estaréis segura.",
     "say": "Os observa y asiente lentamente. «Una buena palabra de un alcalde vale más que una hierba. Dios os guarde»."
    }
   }
  },
  "fuhrmann": {
   "title": "El carretero y el eje roto",
   "nodes": {
    "start": {
     "say": "Un carretero maldice junto a su carro, cuya rueda está atascada en la arena. «¡Perdonad mis palabras, señor! El eje ha crujido y aún quedan dos días hasta Uelzen»."
    },
    "a": {
     "ask": "¿Puedo ayudaros?",
     "say": "Empujáis el carro y, de un tirón, la rueda queda libre. «¡Dios os lo pague! Aguantará hasta la próxima herrería. Un alcalde que se ensucia las manos... eso habré de contarlo»."
    },
    "a1": {
     "ask": "¿Qué transportáis?",
     "say": "«Lienzo de Westfalen, para los mercaderes de Lübeck. Si llego tarde, el barco zarpará hacia Bergen sin mí»."
    },
    "b": {
     "ask": "¿Por qué vais por este camino?",
     "say": "«En el camino real hay tres puestos de peaje. Este camino es peor, pero más barato. Uno ahorra en peajes y paga en ruedas»."
    },
    "b1": {
     "ask": "¿Vale la pena?",
     "say": "Mira la rueda y suspira. «Hoy no, señor. Hoy no»."
    }
   }
  },
  "salzfuhre": {
   "title": "El carro de la sal",
   "nodes": {
    "start": {
     "say": "Un pesado carro cargado de barriles de sal se acerca con estrépito; el carretero detiene los caballos. «Sal de Lüneburg, señor, por la vieja ruta de la sal hacia Lübeck. Oro blanco la llaman los mercaderes»."
    },
    "a": {
     "ask": "¿Para qué necesita Lübeck tanta sal?",
     "say": "«¡Para el arenque, señor! En Schonen se sala y se vende en barriles hasta en Nowgorod. Sin la sal de Lüneburg, media cristiandad no tendría qué comer en Cuaresma»."
    },
    "a1": {
     "ask": "¿Cuánto dura el viaje?",
     "say": "«Con buen tiempo, veinte días de ida y vuelta. Si llueve, el barro se traga las ruedas y la sal se moja. Entonces uno ha de pagársela al señor de su propio jornal»."
    },
    "b": {
     "ask": "¿No resulta tentadora la carga para los ladrones?",
     "say": "«Por eso viajamos tres hombres y llevamos garrotes. Pero la sal es difícil de robar: no se puede esconder en el bolsillo»."
    },
    "b1": {
     "ask": "¡Buen viaje, pues!",
     "say": "Chasquea la lengua y los caballos se ponen en marcha. «¡Y que vuestros graneros estén llenos, señor alcalde!»"
    }
   }
  },
  "bote": {
   "title": "El mensajero del obispo",
   "nodes": {
    "start": {
     "say": "Un jinete con una alforja de mensajero y el blasón del obispo de Verden refrena su caballo. «Abrid paso, buen hombre... Ah, perdonad, ¿sois el alcalde? Tengo prisa, pero bien puedo cambiar una palabra»."
    },
    "a": {
     "ask": "¿Qué noticia lleváis?",
     "say": "«No puedo decirlo, señor. Está sellada y bien sellada. Pero cuando un mensajero corre tanto, se trata de dinero o de herejes»."
    },
    "a1": {
     "ask": "¿Y de cuál de las dos cosas?",
     "say": "Sonríe. «Por lo común, de ambas, señor alcalde». Luego espolea el caballo."
    },
    "b": {
     "ask": "¿No está cansado vuestro caballo?",
     "say": "«Lo cambiarán en Rotenburg. Los mensajeros cabalgamos hasta diez millas al día. El caballo tiene suerte: al jinete no lo cambian»."
    },
    "b1": {
     "ask": "Id con Dios, mensajero.",
     "say": "Asiente brevemente y parte al galope, dejando tras de sí una nube de polvo."
    }
   }
  },
  "brief": {
   "title": "La carta perdida",
   "nodes": {
    "start": {
     "say": "Un criado de mercader registra con premura el borde del camino. A vuestro lado, entre la hierba, yace una carta doblada con un sello de cera roja. «¡Señor! ¿Habéis visto una carta? ¡Mi amo mandará azotarme si no aparece!»"
    },
    "a": {
     "ask": "Devolverle la carta.",
     "say": "La toma de un tirón y besa el sello. «¡Intacto, gracias a Dios! Una letra de cambio para Brügge; quien rompa el sello arruinará a la casa Wullenwever»."
    },
    "a1": {
     "ask": "¿Qué es una letra de cambio?",
     "say": "«Se paga en Lübeck y se cobra en Brügge, sin llevar plata por los caminos. Tal es el arte de los mercaderes: papel en vez de caballos»."
    },
    "b": {
     "ask": "Examinar primero el sello.",
     "say": "Dais la vuelta a la carta en la mano. El sello muestra un barco y tres estrellas. El criado palidece. «¡Es el sello de mi amo, por mi alma! ¡Os lo ruego, señor!». Le entregáis la carta."
    },
    "b1": {
     "ask": "Tened más cuidado en adelante.",
     "say": "«¡Así lo haré, señor, así lo haré!». Se guarda la carta bajo la camisa y echa a correr sin volver la vista."
    }
   }
  },
  "deichbauer": {
   "title": "El constructor de diques de Holland",
   "nodes": {
    "start": {
     "say": "Un hombre con una vara de medir y habla extranjera contempla la llanura. «Goedendag, mijnheer. Me han llamado de Holland para examinar los diques. Tenéis aquí mucha agua y poca tierra»."
    },
    "a": {
     "ask": "¿Cómo debe ser un buen dique?",
     "say": "«Tendido hacia el mar, como un lomo, y empinado hacia tierra. Arcilla de las marismas, nada de arena. Y cada casa aporta hombres para construirlo; de otro modo se romperá por el trecho más débil»."
    },
    "a1": {
     "ask": "¿Se rompe aun así?",
     "say": "«Todo dique se rompe alguna vez, mijnheer. La inundación de San Marcelo se llevó parroquias enteras. El dique no es una victoria, es un pacto con el mar»."
    },
    "b": {
     "ask": "¿Por qué os traen de Holland?",
     "say": "«Porque hace trescientos años que luchamos contra el agua y aún no nos ha vencido. Quien no tiene tierra, se la hace»."
    },
    "b1": {
     "ask": "¿Os quedaréis mucho tiempo?",
     "say": "«Hasta que termine el verano. Luego me llamará el hogar, junto a mi esposa y al fuego de turba». Anota algo en su tablilla de cera."
    }
   }
  },
  "jaeger": {
   "title": "El cazador del señor",
   "nodes": {
    "start": {
     "say": "Un cazador con jubón verde y una ballesta al hombro os detiene. «Señor alcalde. Mi señor anda tras unos furtivos. Han encontrado lazos aquí, al borde del bosque»."
    },
    "a": {
     "ask": "Nadie caza furtivamente entre nosotros.",
     "say": "«Eso dice todo alcalde, señor. Pero en invierno, cuando se acaba la col, más de un campesino se vuelve cazador. A quien atrapan, le cortan la mano»."
    },
    "a1": {
     "ask": "¿No es demasiado castigo por una liebre?",
     "say": "Se encoge de hombros. «La caza pertenece al señor, así lo manda el derecho. Yo no hago las leyes, solo llevo la ballesta»."
    },
    "b": {
     "ask": "¿Qué caza vuestro señor?",
     "say": "«Ciervos y jabalíes, en otoño y con perros. Los campesinos deben servir de ojeadores y no pueden quejarse cuando la caza se come su grano»."
    },
    "b1": {
     "ask": "Es una carga amarga.",
     "say": "«Así lo dicen muchos, señor. En voz baja». Os saluda con la cabeza y desaparece entre los robles."
    }
   }
  },
  "hirtenkind": {
   "title": "La pequeña pastora perdida",
   "nodes": {
    "start": {
     "say": "Una niña con una vara está llorando junto al camino. «Los gansos se han ido, señor, y ya no encuentro el camino a casa. Mi madre me reñirá»."
    },
    "a": {
     "ask": "¿Dónde vives?",
     "say": "Sorbetea y señala vagamente en una dirección. «Detrás de la gran piedra, donde está el roble». Le mostráis el campanario en el horizonte. Su rostro se ilumina."
    },
    "a1": {
     "ask": "Sigue hacia el campanario y encontrarás el camino a casa.",
     "say": "«¡Gracias, señor alcalde!». Echa a correr y empieza a llamar a los gansos desde lejos; estos responden enseguida con sus graznidos desde el carrizal."
    },
    "b": {
     "ask": "Los gansos sabrán volver a casa.",
     "say": "«¿De veras?». Se limpia la nariz con la manga. «La vieja del ala coja es más lista que yo, dice mi padre»."
    },
    "b1": {
     "ask": "Entonces sigue a la vieja.",
     "say": "Se ríe y se aleja dando saltos, blandiendo la vara, como si nunca se hubiera perdido."
    }
   }
  },
  "koehler": {
   "title": "El carbonero",
   "nodes": {
    "start": {
     "say": "Un hombre ennegrecido de hollín sale de entre el humo. Tras él humea una carbonera. «Dios os salude, señor. No os acerquéis demasiado: la carbonera es caprichosa como una cabra»."
    },
    "a": {
     "ask": "¿Cuánto tiempo arde la carbonera?",
     "say": "«Doce días y doce noches. Duermo a su lado, en mi choza, y escucho cómo respira. Si prende fuego, toda la leña se vuelve ceniza»."
    },
    "a1": {
     "ask": "¿Quién compra el carbón?",
     "say": "«Los herreros y las fundiciones del Harz. El buen carbón arde con más calor que cualquier leña; sin él no habría hierro ni arados»."
    },
    "b": {
     "ask": "¿No es una vida solitaria?",
     "say": "«La gente nos rehúye, somos negros como el diablo. Pero el bosque habla cuando uno calla. El búho me conoce mejor que el párroco»."
    },
    "b1": {
     "ask": "Venid alguna vez a nuestra aldea.",
     "say": "Se ríe y sus dientes brillan blancos entre el hollín. «Si antes me lavo en el arroyo, señor alcalde. Prometido»."
    }
   }
  },
  "scholar": {
   "title": "El estudiante errante",
   "nodes": {
    "start": {
     "say": "Un joven con los dedos manchados de tinta y un hatillo de libros saluda en latín. «Salve, domine! Soy estudiante de Rostock y voy camino de Erfurt. ¿Tenéis un lugar donde pueda dormir un pobre hombre de letras?»"
    },
    "a": {
     "ask": "¿Qué se aprende en Rostock?",
     "say": "«Las siete artes liberales, señor: gramática, retórica, lógica y luego aritmética, geometría, música y el estudio de los astros. Solo después se estudia derecho o teología, si uno puede costearlo»."
    },
    "a1": {
     "ask": "¿Y de qué le sirve eso a un campesino?",
     "say": "Reflexiona con seriedad. «A quien sabe contar, el alguacil no lo engaña. Quien sabe leer no cree cualquier carta por llevar un sello. No es poco provecho»."
    },
    "b": {
     "ask": "¿Por qué sois tan pobre?",
     "say": "«Los libros son caros y mi padre es tonelero. Canto ante las puertas a cambio de pan, como todos los estudiantes errantes. Los vecinos dan limosna para que recemos por ellos»."
    },
    "b1": {
     "ask": "Buena suerte en el camino.",
     "say": "«Deo gratias!». Se acomoda los libros y sigue silbando su camino."
    }
   }
  },
  "hirschkalb": {
   "title": "El cervatillo en el zarzal",
   "nodes": {
    "start": {
     "say": "En la maleza junto al camino forcejea un cervatillo. Una pata se le ha enredado en una rama de zarza y en un viejo lazo. Os mira con grandes ojos asustados."
    },
    "a": {
     "ask": "Liberar al cervatillo.",
     "say": "Soltáis el lazo con cuidado. El cervatillo salta, tropieza una vez y desaparece a grandes brincos entre los abedules. En algún lugar del bosque responde la cierva."
    },
    "b": {
     "ask": "Dejarlo para el cazador del señor.",
     "say": "La caza pertenece al señor, y quien la toca despierta sospechas. Os alejáis. Cuando volvéis la vista, el cervatillo se ha liberado por sí solo y ha desaparecido."
    }
   }
  },
  "frischling": {
   "title": "El jabato en el lazo",
   "nodes": {
    "start": {
     "say": "Bajo un roble chilla un jabato rayado, con una pata trasera atrapada en un lazo de furtivo. La madre no puede de andar lejos."
    },
    "a": {
     "ask": "Cortar el lazo deprisa.",
     "say": "Con un corte queda libre y corre chillando hacia la maleza. Un profundo gruñido responde desde la espesura. Preferís seguir camino sin demora."
    },
    "b": {
     "ask": "Mantenerse lejos: la madre está cerca.",
     "say": "Retrocedéis lentamente. Poco después la jabalina sale del matorral, tira del alambre hasta romperlo y se lleva a su cría."
    }
   }
  },
  "rothirsch": {
   "title": "El ciervo al borde del bosque",
   "nodes": {
    "start": {
     "say": "Al borde del bosque se alza un imponente ciervo, con la cornamenta como una corona. Levanta la cabeza y olfatea en vuestra dirección."
    },
    "a": {
     "ask": "Quedarse quieto y contemplarlo.",
     "say": "Permanece allí largo rato; luego baja la cabeza y sigue pastando, como si fuerais un árbol. Una visión poco común: los ancianos dicen que anuncia un buen año."
    },
    "b": {
     "ask": "Dar una palmada.",
     "say": "De un salto poderoso desaparece en el bosque. Solo unas cuantas ramas siguen balanceándose."
    }
   }
  },
  "bache": {
   "title": "La jabalina y sus crías",
   "nodes": {
    "start": {
     "say": "En mitad del camino una jabalina hoza en la tierra, rodeada de unos cuantos jabatos rayados. Os ha visto y eriza las cerdas."
    },
    "a": {
     "ask": "Retroceder lentamente.",
     "say": "Retrocedéis paso a paso. La jabalina gruñe en señal de advertencia y luego guía a sus crías a través del camino, hacia los helechos."
    },
    "b": {
     "ask": "Dar un rodeo por el brezal.",
     "say": "Dais un amplio rodeo entre el brezo. A vuestra espalda oís los satisfechos resoplidos de la piara, que sigue hozando sin que nadie la moleste."
    }
   }
  }
 }
} as Full,
  ar: {
 "ui": {
  "leave": "امضِ بعد التحية",
  "far": "اقترب لتلقي التحية.",
  "greet": "خاطب"
 },
 "enc": {
  "pilger": {
   "title": "الحاج إلى مقام القديس يعقوب",
   "nodes": {
    "start": {
     "say": "يرفع مسافر قبعة لباد مبتلة تلمع عليها صدفة القديس يعقوب المصنوعة من الرصاص. «سلام الله عليك، أيها الرجل الكريم. منذ ثلاثة أسابيع وأنا في الطريق من Magdeburg، قاصدًا Wilsnack حيث الدم المقدس. ألعلك تمنح جرعة ماء لحلق ظمآن؟»"
    },
    "a": {
     "ask": "خذ، إليك قربة مائي.",
     "say": "يشرب جرعات عميقة ويرسم إشارة الصليب. «جزى الرب قريتكم عن ذلك حصادًا وافرًا من الشعير. يقولون إن قطاع الطرق يكمنون للحجاج في دروب الأراضي الرملية نحو نهر الإلبه.»"
    },
    "a1": {
     "ask": "ماذا تعرف عن هؤلاء القوم؟",
     "say": "«يقال إنهم ثلاثة رجال معهم حصان أشهب. وقد أرسل حاكم Lüneburg أوامر بالقبض عليهم. أما أنا فلا أسير بعد اليوم إلا نهارًا، وفي صحبة الآخرين.»"
    },
    "b": {
     "ask": "ما الأخبار على الطرق الكبرى؟",
     "say": "يتكئ على عصاه من خشب الدردار. «في Braunschweig تتذمر النقابات من المجلس بسبب رسم الجعة، وفي الأديرة يتجادلون بشأن صكوك الغفران. يخيل إليّ أن الدنيا توشك أن تخرج عن طورها.»"
    },
    "b1": {
     "ask": "أما زال سلم البلاد مصونًا؟",
     "say": "«الإمبراطور بعيد، يا سيدي مختار القرية، والأمراء قريبون. القرية المتآزرة آمن من كل كتاب مختوم.»"
    }
   }
  },
  "spielmann": {
   "title": "المغني الجوال",
   "nodes": {
    "start": {
     "say": "ينحني رجل يرتدي سترة ملونة ويحمل على ظهره ربابًا انحناءة مبالغًا فيها. «مبارك الطريق الذي ساقني إلى مختار قرية! أترغب في أغنية يا سيدي؟ لقاء كسرة خبز أعزف حتى غروب الشمس.»"
    },
    "a": {
     "ask": "اعزف لي أغنية.",
     "say": "يمس الأوتار بقوسه وينشد عن Störtebeker، الذي يقال إنه سار بعد قطع رأسه أمام أحد عشر من رفاقه. وفي الختام يغمز قائلًا: «لا يحب أهل Hamburg سماع ذلك، لذا أفضل أن أغني هناك عن الفرسان.»"
    },
    "a1": {
     "ask": "وأين تعزف أيضًا؟",
     "say": "«في الأعراس وأعياد تكريس الكنائس، وفي الحانات على الطريق الكبرى. وفي الشتاء ألتمس ديرًا دافئًا. ليس للمغني الجوال بيت، بل طرق فحسب.»"
    },
    "b": {
     "ask": "أليس المغني الجوال معدوم الشرف؟",
     "say": "يضحك دون أن يبدو عليه الامتعاض. «معدوم الشرف أمام القضاء، يا سيدي، هذا حق؛ لكن ليس أمام الناس. فمن يرقص لا يسأل عن المقام.»"
    },
    "b1": {
     "ask": "وماذا يبقى لك؟",
     "say": "«أغنية يظل الناس ينشدونها بعد أن أكون قد رقدت طويلًا تحت الثرى. وذلك أكثر مما يخلّف بعض أعضاء المجلس.»"
    }
   }
  },
  "kraemer": {
   "title": "البائع المتجول",
   "nodes": {
    "start": {
     "say": "يقف بائع يلهث، وعلى ظهره سلة ثقيلة. «إبر وخيوط وأشرطة من Flandern، وفلفل يساوي الفضة! النظر وحده لا يكلف شيئًا، يا سيدي مختار القرية.»"
    },
    "a": {
     "ask": "من أين تأتي بضاعتك؟",
     "say": "«الأشرطة من Brügge، والإبر من Nürnberg، والفلفل يمر عبر Venedig وLübeck. وكل رسم في الطريق يأكل منه قطعة، ومن هنا يأتي الثمن.»"
    },
    "a1": {
     "ask": "وكم رسمًا تدفع؟",
     "say": "يعد على أصابعه ويتوقف عند اثني عشر. «كل نهر، وكل جسر، وكل سيد. وفي النهاية يكسب الفلفل أكثر مما أكسب.»"
    },
    "b": {
     "ask": "ما الجديد في البلاد؟",
     "say": "«غلا الملح في Lüneburg، ووُلد في Bardowick عجل برأسين؛ وصاحبة الحانة تقسم على ذلك بروحها.»"
    },
    "b1": {
     "ask": "أتصدق ذلك؟",
     "say": "«أصدق ما يمكن بيعه يا سيدي. والحكاية الطيبة تباع خيرًا من الخيوط.» يضحك ويسوي سلته على ظهره."
    }
   }
  },
  "moench": {
   "title": "الراهب المتسول",
   "nodes": {
    "start": {
     "say": "يرفع راهب فرنسيسكاني في مسح رمادي، حافي القدمين رغم برودة الأرض، يده مباركًا. «السلام عليكم. أجمع لديرنا في Lüneburg صدقة، أو حتى كلمة طيبة.»"
    },
    "a": {
     "ask": "كيف حال إخوتك؟",
     "say": "«نرعى المرضى في المشفى ونعظ في الأسواق. ويسخو علينا سادة المجلس حين نصلي من أجل أرواحهم.»"
    },
    "a1": {
     "ask": "وهل تنفع الصلاة؟",
     "say": "يبتسم برفق. «ليس دائمًا في مواجهة الطاعون، يا سيدي مختار القرية. لكنها تنفع في مواجهة اليأس على الدوام.»"
    },
    "b": {
     "ask": "لماذا تمشي حافيًا؟",
     "say": "«أراد أبونا فرنسيس أن يكون فقيرًا كالرب. القدمان تعتادان، أما القلب فيحتاج إلى وقت أطول.»"
    },
    "b1": {
     "ask": "أليس ذلك قاسيًا في الشتاء؟",
     "say": "«في الشتاء نلبس نعالًا خشبية، فهذه رحمة قانون الرهبنة بنا. ومن يقرصه البرد يصلي أسرع.» ويكاد يغمز."
    }
   }
  },
  "torf": {
   "title": "قاطع الخث",
   "nodes": {
    "start": {
     "say": "يحمل رجل، وقد تلطخت لفائف ساقيه بالطين، قطعًا من الخث على ظهره. «سلام الله عليك. القطع في المستنقع جيد هذا العام؛ الأرض جافة بما يكفي فلا يغوص المرء فيها.»"
    },
    "a": {
     "ask": "كيف تقطعون الخث؟",
     "say": "«بالمجرفة، على هيئة قوالب، في الربيع. ثم نرصها أكوامًا لتجففها الريح. ولا تصلح للوقود حتى الخريف.»"
    },
    "a1": {
     "ask": "أليس المستنقع خطرًا؟",
     "say": "«من لا يعرف دروبه يبتلعه. وجد جدي هناك جثة محفوظة في المستنقع، بنية كالجلد. فأعدنا سترها وتلونا صلاة الأبانا.»"
    },
    "b": {
     "ask": "لمن يملك المستنقع؟",
     "say": "«للدير يا سيدي. نعطي العُشر عن كل حمولة عربة. لكن الرهبان سيتجمدون مثلنا لولا الخث.»"
    },
    "b1": {
     "ask": "أيجزي هذا العناء؟",
     "say": "«يكفي لإيقاد الموقد. ولا يغتني من الخث إلا من لا يقطعه.»"
    }
   }
  },
  "schaefer": {
   "title": "راعي البرية",
   "nodes": {
    "start": {
     "say": "يتكئ راعٍ عجوز على عصاه، وكلبه عند قدميه. «أهلا يا سيدي مختار القرية، أخرجت إلينا اليوم؟ أغنام البرية هادئة اليوم؛ تلك علامة على تغير الطقس.»"
    },
    "a": {
     "ask": "كيف تعرف حال الطقس؟",
     "say": "«إذا ضمت الأغنام رؤوسها بعضها إلى بعض، جاء المطر. وكذلك إذا حلقت السنونو منخفضة. وإذا آلمتني ركبتي فهو آتٍ لا محالة.»"
    },
    "a1": {
     "ask": "أما تخطئ أبدًا؟",
     "say": "«بلى يا سيدي، ولكن أقل من صانع التقويم في المدينة.» ويضحك في لحيته الرمادية."
    },
    "b": {
     "ask": "منذ متى وأنت ترعى؟",
     "say": "«منذ بلغت سبعة فصول شتاء. لا يتعلم المرء البرية من الكتب. هنا لا ينمو إلا ما اشتد عوده: الخلنج والعرعر والرعاة.»"
    },
    "b1": {
     "ask": "أتخشى الذئاب؟",
     "say": "«لا، ما دام الكلب يقظًا. في الشتاء الماضي أخذ أحدها حملين، ومنذ ذلك الحين ينام الكلب أقل مني.»"
    }
   }
  },
  "landsknecht": {
   "title": "الجندي المرتزق",
   "nodes": {
    "start": {
     "say": "يلمس رجل يرتدي سروالًا باليًا ذا شقوق، ويتقلد سيفًا قصيرًا، قبعته المريشة تحيةً. «سرّحوني دون أجر يا سيدي. أنا عائد إلى بيتي في Holstein. لا تقلق؛ أنا متعب، لا خطر مني.»"
    },
    "a": {
     "ask": "أين خدمت؟",
     "say": "«تحت راية ملك الدنمارك في Dithmarschen. فتح الفلاحون بوابات السدود، فوقفنا في الماء حتى أحزمتنا. وعند Hemmingstedt غرق من الرجال أكثر ممن سقطوا في القتال.»"
    },
    "a1": {
     "ask": "وكيف نجوت؟",
     "say": "يصمت طويلًا. «كنت أعرف السباحة يا سيدي، هذا كل ما في الأمر. لم يسأل الله عن الشجعان.»"
    },
    "b": {
     "ask": "وماذا تنوي أن تفعل الآن؟",
     "say": "«أحرث الأرض، إن كان أخي لا يزال يقبلني. لقد شققت برمحي من الأثلام ما يكفيني.»"
    },
    "b1": {
     "ask": "وإن لم يقبلك؟",
     "say": "«أتجند من جديد. الخادم بلا سيد كالكلب بلا دار.» يهز كتفيه ويمضي."
    }
   }
  },
  "kraeuter": {
   "title": "امرأة الأعشاب",
   "nodes": {
    "start": {
     "say": "ترفع امرأة تحمل سلة مملوءة بالأعشاب والجذور بصرها. «حياك الله، يا سيدي مختار القرية. أخيلية للجروح، وبابونج للبطن، وعشبة القديس يوحنا؛ لا بد من قطفها في اليوم المناسب.»"
    },
    "a": {
     "ask": "وما اليوم المناسب؟",
     "say": "«عيد القديس يوحنا، حين تكون الشمس في أعلى مقامها. عندئذ تكون القوة في العشبة. يقول القس إن ذلك خرافة، لكنه يعالج بها سعاله على أي حال.»"
    },
    "a1": {
     "ask": "أتعالجين الحمى أيضًا؟",
     "say": "«بلحاء الصفصاف، مغليًا ومرًّا. وبالراحة، فالناس ينسونها دائمًا. أما حمى التيفوس فلا تنفع معها عشبة؛ لا ينفع إلا الدعاء والابتعاد.»"
    },
    "b": {
     "ask": "أما تخشين كلام الناس؟",
     "say": "تشتد نظرتها. «بلى يا سيدي. فالمرأة التي تشفي سرعان ما تصبح في أعينهم ساحرة. أذهب إلى الغابة وحدي، ولا أري أحدًا أين تنمو أعشابي.»"
    },
    "b1": {
     "ask": "ستكونين آمنة في قريتي.",
     "say": "تتأملك وتنظر مليًّا، ثم تومئ ببطء. «كلمة طيبة من مختار قرية أثمن من عشبة. حفظك الله.»"
    }
   }
  },
  "fuhrmann": {
   "title": "سائق العربة ومحورها",
   "nodes": {
    "start": {
     "say": "يلعن سائق عربة حظه، وقد غاصت عجلتها في الرمل. «اعذر ألفاظي يا سيدي! لقد تصدع المحور، وما زال بيننا وبين Uelzen يومان.»"
    },
    "a": {
     "ask": "أيمكنني أن أساعدك؟",
     "say": "تدفع العربة بكل قوتك، فتتحرر العجلة بدفعة واحدة. «جزاك الله خيرًا! سيصمد المحور حتى نبلغ الحداد التالي. مختار قرية يوسخ يديه بالعمل، تلك حكاية سأرويها.»"
    },
    "a1": {
     "ask": "وماذا تنقل؟",
     "say": "«كتانًا من Westfalen لتجار Lübeck. إن تأخرت أبحرت السفينة إلى Bergen من دوني.»"
    },
    "b": {
     "ask": "لماذا تسلك هذا الطريق؟",
     "say": "«على الطريق الكبرى ثلاث محطات جباية. الطريق هنا أردأ، لكنه أقل كلفة. نوفر في الرسوم وندفع من العجلات.»"
    },
    "b1": {
     "ask": "أويستحق الأمر؟",
     "say": "ينظر إلى عجلته ويتنهد. «ليس اليوم يا سيدي. ليس اليوم.»"
    }
   }
  },
  "salzfuhre": {
   "title": "عربة الملح",
   "nodes": {
    "start": {
     "say": "تقترب عربة ثقيلة محملة ببراميل الملح وهي تقرقع، فيوقف سائقها الخيول. «ملح من Lüneburg يا سيدي، على طريق الملح القديم إلى Lübeck. يسميه التجار الذهب الأبيض.»"
    },
    "a": {
     "ask": "لماذا تحتاج Lübeck إلى كل هذا الملح؟",
     "say": "«للرنجة يا سيدي! تُملّح في Schonen وتباع في براميل حتى Nowgorod. لولا ملح Lüneburg لما وجد نصف العالم المسيحي طعامًا للصوم.»"
    },
    "a1": {
     "ask": "كم تستغرق الرحلة؟",
     "say": "«عشرون يومًا ذهابًا وإيابًا في الطقس الحسن. أما في المطر فيبتلع الوحل العجلات ويبتل الملح، وعندئذ ندفع ثمنه للسيد من أجورنا.»"
    },
    "b": {
     "ask": "أليست الحمولة مغرية للصوص؟",
     "say": "«لذلك نسافر ثلاثة ومعنا الهراوات. لكن سرقة الملح عسيرة؛ فلا يمكن إخفاؤه في الجيب.»"
    },
    "b1": {
     "ask": "رحلة موفقة إذن!",
     "say": "يطقطق بلسانه، فتبدأ الخيول بالجر. «ولك أهراء عامرة، يا سيدي مختار القرية!»"
    }
   }
  },
  "bote": {
   "title": "رسول الأسقف",
   "nodes": {
    "start": {
     "say": "يكبح فارس يحمل حقيبة رسائل وشعار أسقف Verden جماح حصانه. «أفسح الطريق أيها الرجل الطيب؛ آه، عفوًا، أأنت مختار القرية؟ أنا على عجل، لكن لا بأس بكلمة.»"
    },
    "a": {
     "ask": "أي خبر تحمل؟",
     "say": "«لا يجوز لي قوله يا سيدي. إنه مختوم ومكتوم. لكن حين يعجل رسول إلى هذا الحد، فالأمر يتعلق بالمال أو بالهراطقة.»"
    },
    "a1": {
     "ask": "وأيهما هو؟",
     "say": "يبتسم ابتسامة عريضة. «غالبًا كلاهما، يا سيدي مختار القرية.» ثم يحث حصانه بمهميزه."
    },
    "b": {
     "ask": "أليس حصانك متعبًا؟",
     "say": "«سيُستبدل في Rotenburg. نحن الرسل نركب حتى عشرة أميال في اليوم. الحصان محظوظ؛ فالفارس لا يُستبدل.»"
    },
    "b1": {
     "ask": "في أمان الله أيها الرسول.",
     "say": "يومئ إيماءة سريعة وينطلق عدوًا، تاركًا وراءه سحابة من الغبار."
    }
   }
  },
  "brief": {
   "title": "الرسالة المفقودة",
   "nodes": {
    "start": {
     "say": "يفتش خادم تاجر جانب الطريق في عجلة. وبجوارك في العشب رسالة مطوية مختومة بالشمع الأحمر. «يا سيدي! هل رأيت رسالة؟ سيأمر معلمي بجلدي إن ضاعت!»"
    },
    "a": {
     "ask": "أعِد إليه الرسالة.",
     "say": "ينتزعها ويقبل الختم. «سليمة، حمدًا لله! إنها حوالة مالية إلى Brügge؛ ومن يفض ختمها يقصم ظهر بيت Wullenwever.»"
    },
    "a1": {
     "ask": "ما الحوالة المالية؟",
     "say": "«يدفع المرء في Lübeck ويُقبض المال في Brügge، دون أن يحمل الفضة برًّا. تلك صنعة التجار: ورق بدل الخيول.»"
    },
    "b": {
     "ask": "افحص الختم أولًا.",
     "say": "تقلب الرسالة في يدك. يظهر على الختم مركب وثلاث نجوم. يشحب وجه الخادم. «هذا ختم معلمي، أقسم بروحي! أرجوك يا سيدي!» فتناوله الرسالة."
    },
    "b1": {
     "ask": "كن أشد انتباهًا بعد اليوم.",
     "say": "«سأفعل يا سيدي، سأفعل!» يدس الرسالة تحت قميصه ويواصل الجري دون أن يلتفت مرة أخرى."
    }
   }
  },
  "deichbauer": {
   "title": "باني السدود من Holland",
   "nodes": {
    "start": {
     "say": "ينظر رجل يحمل مسطرة قياس ويتكلم بلهجة غريبة إلى الأرض المنبسطة. «Goedendag, mijnheer. استُدعيت من Holland لفحص السدود. لديكم هنا ماء كثير وتراب قليل.»"
    },
    "a": {
     "ask": "ما الذي يجعل السد جيدًا؟",
     "say": "«يكون منحدرًا برفق نحو البحر كالظهر، وشديد الانحدار نحو البر. ويُبنى من طين أراضي السبخات، لا من الرمل. وتقدم كل دار رجالًا للعمل في السد، وإلا انكسر عند أضعف موضع.»"
    },
    "a1": {
     "ask": "وهل ينكسر رغم ذلك؟",
     "say": "«كل سد ينكسر يومًا، mijnheer. لقد ابتلع فيضان القديس Marcellus أبرشيات بأكملها. السد ليس نصرًا، بل عهد مع البحر.»"
    },
    "b": {
     "ask": "لماذا يستقدمونك من Holland؟",
     "say": "«لأننا نحارب الماء منذ ثلاثمئة عام ولم ينتصر علينا بعد. من لا أرض له يصنع لنفسه أرضًا.»"
    },
    "b1": {
     "ask": "أستبقى طويلًا؟",
     "say": "«حتى ينقضي الصيف. ثم يحن قلبي إلى الديار، إلى زوجتي ونار الخث.» ويدون شيئًا على لوحه الشمعي."
    }
   }
  },
  "jaeger": {
   "title": "صياد النبيل",
   "nodes": {
    "start": {
     "say": "يستوقفك صياد يرتدي معطفًا أخضر ويحمل قوسًا نشابة على كتفه. «يا سيدي مختار القرية، يبحث سيدي النبيل عن صيادين مخالفين. وُجدت أفخاخ هنا عند حافة الغابة.»"
    },
    "a": {
     "ask": "لا أحد عندنا يصيد خلسة.",
     "say": "«هذا ما يقوله كل مختار يا سيدي. لكن في الشتاء، حين ينفد الملفوف، يصبح بعض الفلاحين صيادين. ومن يُقبض عليه يفقد يده.»"
    },
    "a1": {
     "ask": "أليست تلك قسوة من أجل أرنب؟",
     "say": "يهز كتفيه. «الصيد ملك للسيد، هكذا يقضي القانون. لست أنا من يضع القانون؛ أنا أحمل النشابة فحسب.»"
    },
    "b": {
     "ask": "ماذا يصطاد سيدك النبيل؟",
     "say": "«الأيل الأحمر والخنزير البري، في الخريف بمساعدة الكلاب. وعلى الفلاحين أن يقدموا رجالًا لدفع الطرائد، ولا يجوز لهم الشكوى حين يأكل الصيد زرعهم.»"
    },
    "b1": {
     "ask": "ذلك عبء مرير.",
     "say": "«كثيرون يقولون ذلك يا سيدي، همسًا.» يومئ لك ويختفي بين أشجار البلوط."
    }
   }
  },
  "hirtenkind": {
   "title": "الراعية الصغيرة التائهة",
   "nodes": {
    "start": {
     "say": "تقف طفلة صغيرة تحمل عصًا رفيعة وتبكي عند الطريق. «ذهب الإوز يا سيدي، ولم أعد أجد الطريق إلى البيت. ستوبخني أمي.»"
    },
    "a": {
     "ask": "أين تسكنين؟",
     "say": "تشهق وتمسح دموعها وتشير إشارة مبهمة إلى ناحية ما. «خلف الصخرة الكبيرة، حيث تقف شجرة البلوط.» فتريها برج الكنيسة في الأفق، فيشرق وجهها."
    },
    "a1": {
     "ask": "اتبعي البرج تجدي طريقك إلى البيت.",
     "say": "«شكرًا يا سيدي مختار القرية!» تنطلق راكضة وتنادي الإوز من بعيد، فيرد عليها صياحه من بين القصب في الحال."
    },
    "b": {
     "ask": "سيجد الإوز طريقه إلى البيت.",
     "say": "«أتظن ذلك؟» تمسح أنفها بكمها. «يقول أبي إن الإوزة العجوز ذات الجناح الأعرج أذكى مني.»"
    },
    "b1": {
     "ask": "اتبعي العجوز إذن.",
     "say": "تقهقه وتمضي قافزة، تلوح بعصاها، كأنها لم تضل الطريق قط."
    }
   }
  },
  "koehler": {
   "title": "صانع الفحم",
   "nodes": {
    "start": {
     "say": "يخرج من الدخان رجل اسودّ وجهه بالسخام، وخلفه كومة تفحيم يتصاعد منها الدخان. «سلام الله عليك يا سيدي. لا تقترب كثيرًا؛ كومة التفحيم متقلبة المزاج كالعنزة.»"
    },
    "a": {
     "ask": "كم تدوم عملية التفحيم؟",
     "say": "«اثني عشر يومًا وليلة. أنام بجوارها في كوخي وأصغي إلى أنفاسها. فإن اشتعلت النار فيها صار كل الخشب رمادًا.»"
    },
    "a1": {
     "ask": "من يشتري الفحم؟",
     "say": "«الحدادون وأصحاب أفران صهر المعادن في Harz. الفحم الجيد أشد حرارة من أي خشب؛ ولولاه لما كان حديد ولا محراث.»"
    },
    "b": {
     "ask": "أليست حياة موحشة؟",
     "say": "«يتجنبنا الناس، فنحن سود كالشيطان. لكن الغابة تتكلم حين يصمت المرء. البومة تعرفني أكثر مما يعرفني القس.»"
    },
    "b1": {
     "ask": "زر قريتنا يومًا.",
     "say": "يضحك حتى تلمع أسنانه البيضاء وسط السخام. «بعد أن أغتسل في الجدول أولًا، يا سيدي مختار القرية. أعدك بذلك.»"
    }
   }
  },
  "scholar": {
   "title": "الطالب الجوال",
   "nodes": {
    "start": {
     "say": "يحيي شاب، على أصابعه بقع حبر ويحمل صرة كتب، باللاتينية. «Salve, domine! أنا طالب من Rostock في طريقي إلى Erfurt. ألك أن تمنح عالمًا فقيرًا مأوى لهذه الليلة؟»"
    },
    "a": {
     "ask": "ماذا تتعلمون في Rostock؟",
     "say": "«الفنون الحرة السبعة يا سيدي: النحو والبلاغة والمنطق، ثم الحساب والهندسة والموسيقى وعلم النجوم. وبعدها فقط ندرس القانون أو اللاهوت، إن استطعنا تحمل النفقة.»"
    },
    "a1": {
     "ask": "وما نفع ذلك للفلاح؟",
     "say": "يفكر بجدية. «من يعرف الحساب لا يخدعه الحاكم. ومن يعرف القراءة لا يصدق كل كتاب مختوم. وذلك نفع ليس بالقليل.»"
    },
    "b": {
     "ask": "لماذا أنت فقير إلى هذا الحد؟",
     "say": "«الكتب غالية، وأبي صانع براميل. أغني أمام الأبواب طلبًا للخبز، مثل سائر الطلاب الجوالين. ويعطينا أهل المدن كي نصلي من أجلهم.»"
    },
    "b1": {
     "ask": "حظًا طيبًا في الطريق.",
     "say": "«Deo gratias!» يسوي كتبه ويمضي مصفرًا."
    }
   }
  },
  "hirschkalb": {
   "title": "خشف الأيل في شجيرة الشوك",
   "nodes": {
    "start": {
     "say": "يتخبط خشف أيل صغير بين الأحراج على جانب الطريق. علقت ساقه في غصن عليق وفخ قديم. ينظر إليك بعينين واسعتين خائفتين."
    },
    "a": {
     "ask": "حرر الخشف.",
     "say": "تفك الفخ بحذر. يثب الخشف، ويتعثر مرة، ثم يختفي بقفزات واسعة بين أشجار البتولا. ومن موضع ما في الغابة تجيبه أمه."
    },
    "b": {
     "ask": "اتركه لصياد السيد.",
     "say": "الصيد ملك للنبيل، ومن يمسه يثير الشبهة حول نفسه. تستدير مبتعدًا. وحين تلتفت مرة أخرى، تجد أن الخشف قد حرر نفسه ورحل."
    }
   }
  },
  "frischling": {
   "title": "الخنزير البري الصغير في الفخ",
   "nodes": {
    "start": {
     "say": "تحت شجرة بلوط يصرخ خنزير بري صغير مخطط، وقد علقت ساقه الخلفية في فخ لصياد مخالف. لا بد أن أمه قريبة."
    },
    "a": {
     "ask": "اقطع الفخ سريعًا.",
     "say": "بقطعة واحدة يتحرر ويندفع صارخًا إلى الأحراج. ويجيبه نخير عميق من بين الأدغال. تفضل أن تواصل طريقك مسرعًا."
    },
    "b": {
     "ask": "ابقَ بعيدًا؛ الأم قريبة.",
     "say": "تتراجع ببطء. وبعد قليل تندفع الأم من الأدغال، وتجذب السلك حتى ينقطع، ثم تقود صغيرها بعيدًا."
    }
   }
  },
  "rothirsch": {
   "title": "الأيل الأحمر عند حافة الغابة",
   "nodes": {
    "start": {
     "say": "عند حافة الغابة يقف أيل أحمر مهيب، قرناه كالتاج. يرفع رأسه ويشم الهواء في اتجاهك."
    },
    "a": {
     "ask": "قف ساكنًا وتأمله.",
     "say": "يقف طويلًا، ثم يخفض رأسه ويعود إلى الرعي، كأنك شجرة. منظر نادر؛ ويقول الشيوخ إنه يبشر بعام خير."
    },
    "b": {
     "ask": "صفق بيديك.",
     "say": "بوثبة عظيمة يختفي في الغابة، ولا يبقى إلا بضعة أغصان تتأرجح من بعده."
    }
   }
  },
  "bache": {
   "title": "أنثى الخنزير البري وصغارها",
   "nodes": {
    "start": {
     "say": "في وسط الطريق تنبش أنثى خنزير بري الأرض، وحولها بضعة صغار مخططة. لقد انتبهت إليك ونصبت شعيرات ظهرها."
    },
    "a": {
     "ask": "تراجع ببطء.",
     "say": "تتراجع خطوة خطوة. تطلق الأنثى نخيرًا محذرًا، ثم تسوق صغارها عبر الطريق إلى السرخس."
    },
    "b": {
     "ask": "اسلك طريقًا دائريًا عبر البرية.",
     "say": "تسلك منعطفًا واسعًا بين شجيرات الخلنج. وخلفك تسمع أصوات القطيع الراضية وهو يواصل النبش دون إزعاج."
    }
   }
  }
 }
} as Full,
  hi: {
 "ui": {
  "leave": "अभिवादन कर आगे बढ़ें",
  "far": "अभिवादन करने को और निकट आएँ।",
  "greet": "बात करें"
 },
 "enc": {
  "pilger": {
   "title": "संत याकूब का तीर्थयात्री",
   "nodes": {
    "start": {
     "say": "एक पथिक अपनी नम फेल्ट की टोपी उठाकर अभिवादन करता है। उस पर सीसे का बना संत याकूब का सीप चमक रहा है। “ईश्वर आपका भला करे, माननीय महोदय। तीन सप्ताह हुए Magdeburg से चला हूँ, पवित्र रक्त के दर्शन हेतु Wilsnack जा रहा हूँ। क्या इस प्यासी कंठ के लिए आपके पास एक घूँट पानी होगा?”"
    },
    "a": {
     "ask": "लीजिए, मेरा मशक ले लीजिए।",
     "say": "वह लंबे घूँट भरता है और सलीब का चिह्न बनाता है। “प्रभु आपके गाँव को जौ की भरपूर उपज देकर इसका फल दें। कहते हैं, Elbe की ओर ऊँची रेतीली भूमि के रास्तों पर लुटेरे तीर्थयात्रियों की घात में रहते हैं।”"
    },
    "a1": {
     "ask": "इन लोगों के विषय में आप क्या जानते हैं?",
     "say": "“कहते हैं, तीन आदमी हैं और उनके पास एक सफेद घोड़ा है। Lüneburg के अधिकारी ने उनकी गिरफ्तारी के परवाने भेजे हैं। अब मैं केवल दिन में और दूसरों के साथ झुंड में चलता हूँ।”"
    },
    "b": {
     "ask": "राजमार्गों पर क्या समाचार सुनने को मिलता है?",
     "say": "वह अपनी ऐश की लकड़ी की लाठी पर टेक लगाता है। “Braunschweig में शिल्प-संघ मदिरा-शुल्क को लेकर नगर-परिषद के विरुद्ध कुड़कुड़ा रहे हैं, और मठों में पापमोचन-पत्रों पर विवाद चल रहा है। मुझे लगता है, संसार अपनी धुरी से डिगने को है।”"
    },
    "b1": {
     "ask": "क्या देश की शांति-व्यवस्था बनी नहीं हुई?",
     "say": "“सम्राट दूर हैं, मुखियाजी, और सामंत निकट। जो गाँव एकजुट रहता है, वह मुहर लगे किसी भी परवाने से अधिक सुरक्षित है।”"
    }
   }
  },
  "spielmann": {
   "title": "घुमंतू गवैया",
   "nodes": {
    "start": {
     "say": "रंगीन अंगरखा पहने और पीठ पर सारंगी जैसा वाद्य लटकाए एक आदमी बहुत ही गहरा झुककर प्रणाम करता है। “धन्य है वह राह जो मुझे गाँव के मुखिया तक ले आई! एक गीत सुनना चाहेंगे, महोदय? रोटी के एक टुकड़े के बदले सूर्यास्त तक बजाऊँगा।”"
    },
    "a": {
     "ask": "मुझे एक गीत सुनाइए।",
     "say": "वह तार छेड़ता है और Störtebeker का गीत गाता है, जो सिर कटने के बाद भी अपने ग्यारह साथियों के सामने से चलकर निकल गया था। अंत में वह आँख मारता है। “Hamburg में यह सुनना किसी को नहीं भाता—वहाँ मैं शूरवीरों के गीत ही गाता हूँ।”"
    },
    "a1": {
     "ask": "और कहाँ-कहाँ बजाते हैं आप?",
     "say": "“विवाहों में, गिरजाघर के स्थापना-पर्व पर, राजमार्ग की सरायों में। सर्दियों में कोई गरम मठ ढूँढ़ लेता हूँ। गवैये का कोई घर नहीं होता, बस राहें होती हैं।”"
    },
    "b": {
     "ask": "क्या गवैये को अपमानित नहीं माना जाता?",
     "say": "वह बिना बुरा माने हँसता है। “न्यायालय की दृष्टि में सम्मानहीन हूँ, महोदय, यह सच है—पर लोगों की दृष्टि में नहीं। जो नाचता है, वह हैसियत नहीं पूछता।”"
    },
    "b1": {
     "ask": "और आपके पीछे क्या रह जाएगा?",
     "say": "“एक गीत, जिसे लोग तब भी गाएँगे जब मुझे मिट्टी के नीचे गए बहुत समय बीत चुका होगा। यह उससे अधिक है जो कई नगर-पार्षद पीछे छोड़ जाते हैं।”"
    }
   }
  },
  "kraemer": {
   "title": "फेरीवाला",
   "nodes": {
    "start": {
     "say": "पीठ पर भारी टोकरी लादे एक फेरीवाला हाँफता हुआ रुकता है। “सुइयाँ, धागा, Flandern के फीते, चाँदी जितनी महँगी काली मिर्च! देखने का कोई मोल नहीं, मुखियाजी।”"
    },
    "a": {
     "ask": "आपका माल कहाँ से आता है?",
     "say": "“फीते Brügge से, सुइयाँ Nürnberg से, काली मिर्च Venedig और Lübeck के रास्ते। राह का हर शुल्क उसमें से कुछ खा जाता है—इसीलिए दाम ऐसा है।”"
    },
    "a1": {
     "ask": "आखिर कितने शुल्क देने पड़ते हैं?",
     "say": "वह उँगलियों पर गिनता है और बारह पर हार मान लेता है। “हर नदी, हर पुल, हर स्वामी। अंत में काली मिर्च मुझसे अधिक कमा लेती है।”"
    },
    "b": {
     "ask": "देश में क्या नया समाचार है?",
     "say": "“Lüneburg में नमक महँगा हो गया है, और Bardowick में दो सिर वाला बछड़ा पैदा हुआ है—सराय वाली अपनी आत्मा की शपथ खाकर कहती है।”"
    },
    "b1": {
     "ask": "क्या आप इस पर विश्वास करते हैं?",
     "say": "“मैं उसी पर विश्वास करता हूँ जो बिक सके, महोदय। और अच्छी कहानी धागे से बेहतर बिकती है।” वह हँसता है और अपनी टोकरी ठीक करता है।"
    }
   }
  },
  "moench": {
   "title": "भिक्षुक साधु",
   "nodes": {
    "start": {
     "say": "धूसर चोगा पहने एक फ्रांसिस्कन साधु, ठंडी धरती के बावजूद नंगे पाँव, आशीर्वाद देने को हाथ उठाता है। “आपके साथ शांति हो। मैं Lüneburg में अपने मठ के लिए कुछ माँग रहा हूँ—दान, या केवल एक शुभ वचन।”"
    },
    "a": {
     "ask": "आपके बंधु कैसे हैं?",
     "say": "“हम चिकित्सालय में रोगियों की देखभाल करते हैं और बाजारों में उपदेश देते हैं। नगर-परिषद के स्वामी प्रसन्नता से दान देते हैं, जब हम उनकी आत्माओं के लिए प्रार्थना करते हैं।”"
    },
    "a1": {
     "ask": "क्या प्रार्थना से सचमुच सहायता मिलती है?",
     "say": "वह सौम्य मुस्कान से कहता है। “महामारी के विरुद्ध सदा नहीं, मुखियाजी। पर निराशा के विरुद्ध अवश्य।”"
    },
    "b": {
     "ask": "आप नंगे पाँव क्यों चलते हैं?",
     "say": "“हमारे पिता फ्रांसिस प्रभु की भाँति निर्धन रहना चाहते थे। पाँव अभ्यस्त हो जाते हैं, हृदय को अधिक समय लगता है।”"
    },
    "b1": {
     "ask": "सर्दियों में यह कठिन नहीं होता?",
     "say": "“सर्दियों में हम लकड़ी के तले पहनते हैं, नियम इतना कृपालु है। और जिसे ठंड लगती है, वह अधिक तेजी से प्रार्थना करता है।” वह मानो आँख मारने ही वाला हो।"
    }
   }
  },
  "torf": {
   "title": "पीट काटने वाला",
   "nodes": {
    "start": {
     "say": "कीचड़ से सने पायजामे पहने एक आदमी पीठ पर पीट के टुकड़े लादे है। “ईश्वर आपका भला करे। इस वर्ष दलदल में कटाई अच्छी है—जमीन इतनी सूखी है कि आदमी धँसता नहीं।”"
    },
    "a": {
     "ask": "पीट कैसे काटते हैं?",
     "say": "“वसंत में फावड़े से ईंट जैसे टुकड़े काटते हैं। फिर उन्हें ढेरों में जमाते हैं, ताकि हवा उन्हें सुखा दे। शरद ऋतु में ही वे जलने लायक होते हैं।”"
    },
    "a1": {
     "ask": "क्या दलदल खतरनाक नहीं है?",
     "say": "“जो राहें नहीं जानता, उसे वह निगल लेता है। मेरे दादा को वहाँ दलदल में एक शव मिला था, चमड़े जैसा भूरा। हमने उसे फिर ढक दिया और प्रभु-प्रार्थना पढ़ी।”"
    },
    "b": {
     "ask": "दलदल किसका है?",
     "say": "“मठ का, महोदय। हर गाड़ी भर पीट पर हम दसवाँ हिस्सा देते हैं। पर पीट न हो तो साधु भी हमारी ही तरह ठिठुरें।”"
    },
    "b1": {
     "ask": "क्या मेहनत का फल मिलता है?",
     "say": "“चूल्हे भर को मिल जाता है। पीट से धनी वही होता है जो उसे काटता नहीं।”"
    }
   }
  },
  "schaefer": {
   "title": "हीथ का चरवाहा",
   "nodes": {
    "start": {
     "say": "एक बूढ़ा चरवाहा अपनी लाठी पर झुका है, कुत्ता उसके पैरों के पास है। “अरे, मुखियाजी, आज आप भी हमारे बीच बाहर आए हैं? हीथ की भेड़ें आज शांत हैं—मौसम बदलेगा।”"
    },
    "a": {
     "ask": "आप मौसम का हाल कैसे जान लेते हैं?",
     "say": "“जब भेड़ें सिर जोड़कर खड़ी हों, तो वर्षा आती है। जब अबाबीलें नीचे उड़ें, तब भी। और जब मेरे घुटने में खिंचाव हो, तब तो निश्चय ही।”"
    },
    "a1": {
     "ask": "क्या आप कभी भूलते नहीं?",
     "say": "“भूलता हूँ, महोदय। पर नगर में पंचांग बनाने वाले से कम।” वह अपनी धूसर दाढ़ी में हँसता है।"
    },
    "b": {
     "ask": "आप कब से भेड़ें चरा रहे हैं?",
     "say": "“जब मैं सात सर्दियों का था, तब से। हीथ का ज्ञान पुस्तकों से नहीं मिलता। यहाँ वही उगता और पलता है जो कठोर हो—हीथ की झाड़ी, जुनिपर और चरवाहे।”"
    },
    "b1": {
     "ask": "क्या आपको भेड़ियों का भय है?",
     "say": "“जब तक कुत्ता जागता है, नहीं। पिछली सर्दी एक भेड़िया दो मेमने ले गया। तब से कुत्ता मुझसे भी कम सोता है।”"
    }
   }
  },
  "landsknecht": {
   "title": "भाड़े का सिपाही",
   "nodes": {
    "start": {
     "say": "फटी-पुरानी चिरदार पतलून पहने, कमर पर Katzbalger तलवार लगाए एक आदमी अपनी पंखदार टोपी छूकर अभिवादन करता है। “बिना वेतन दिए छुट्टी दे दी गई, महोदय। Holstein अपने घर जा रहा हूँ। चिंता न करें—मैं थका हूँ, खतरनाक नहीं।”"
    },
    "a": {
     "ask": "आपने कहाँ सेवा की?",
     "say": "“Dithmarschen में डेनमार्क के राजा के अधीन। किसानों ने जल-द्वार खोल दिए और हम कमर तक पानी में खड़े रह गए। Hemmingstedt में युद्ध से अधिक लोग डूबकर मरे।”"
    },
    "a1": {
     "ask": "और आप कैसे बच निकले?",
     "say": "वह देर तक चुप रहता है। “मुझे तैरना आता था, महोदय। बस इतना ही। ईश्वर ने बहादुरों से कुछ नहीं पूछा।”"
    },
    "b": {
     "ask": "अब आप क्या करेंगे?",
     "say": "“हल चलाऊँगा, यदि मेरा भाई मुझे अब भी रख ले। भाले से बहुत लकीरें खींच चुका हूँ।”"
    },
    "b1": {
     "ask": "और यदि वह आपको न रखे?",
     "say": "“तो फिर किसी सेना में भर्ती हो जाऊँगा। स्वामी बिना सिपाही, आँगन बिना कुत्ते जैसा है।” वह कंधे उचकाकर आगे बढ़ जाता है।"
    }
   }
  },
  "kraeuter": {
   "title": "जड़ी-बूटी वाली",
   "nodes": {
    "start": {
     "say": "जड़ी-बूटियों और जड़ों से भरी टोकरी लिए एक स्त्री सिर उठाती है। “ईश्वर आपका भला करे, मुखियाजी। घावों के लिए यैरो, पेट के लिए कैमोमाइल, और यह सेंट जॉन्स वॉर्ट—इसे ठीक दिन पर तोड़ना चाहिए।”"
    },
    "a": {
     "ask": "ठीक दिन कौन-सा है?",
     "say": "“संत योहन का दिन, जब सूर्य सबसे ऊँचा होता है। तब जड़ी में शक्ति होती है। पादरी कहते हैं यह अंधविश्वास है, पर अपनी खाँसी इसी से ठीक करते हैं।”"
    },
    "a1": {
     "ask": "क्या आप ज्वर में भी सहायता करती हैं?",
     "say": "“विलो की छाल, उबालकर—कड़वी होती है। और विश्राम; लोग उसे सदा भूल जाते हैं। चित्तीदार ज्वर पर कोई जड़ी काम नहीं करती—वहाँ केवल प्रार्थना और दूरी काम आती है।”"
    },
    "b": {
     "ask": "लोगों की बातों से आपको भय नहीं लगता?",
     "say": "उसकी दृष्टि कठोर हो जाती है। “लगता है, महोदय। जो स्त्री रोग ठीक करती है, उसे लोग शीघ्र ही जादू करने वाली कहने लगते हैं। मैं वन में अकेली जाती हूँ और किसी को नहीं बताती कि मेरी जड़ियाँ कहाँ उगती हैं।”"
    },
    "b1": {
     "ask": "मेरे गाँव में आप सुरक्षित रहेंगी।",
     "say": "वह आपको परखती है और धीरे से सिर हिलाती है। “मुखिया का एक अच्छा वचन किसी जड़ी से अधिक मूल्य रखता है। ईश्वर आपकी रक्षा करे।”"
    }
   }
  },
  "fuhrmann": {
   "title": "धुरी से परेशान गाड़ीवान",
   "nodes": {
    "start": {
     "say": "एक गाड़ीवान अपनी गाड़ी पर झुँझलाकर गालियाँ दे रहा है, जिसका पहिया रेत में फँसा है। “मेरे शब्दों को क्षमा करें, महोदय! धुरी चटक गई है, और Uelzen अभी दो दिन दूर है।”"
    },
    "a": {
     "ask": "क्या मैं हाथ बँटाऊँ?",
     "say": "आप गाड़ी को जोर लगाकर धकेलते हैं और एक झटके से पहिया निकल आता है। “ईश्वर आपको इसका फल दे! यह अगले लोहार तक टिक जाएगी। हाथ गंदे करने वाला मुखिया—यह बात मैं सबको बताऊँगा।”"
    },
    "a1": {
     "ask": "आप क्या माल ले जा रहे हैं?",
     "say": "“Westfalen का लिनन, Lübeck के व्यापारियों के लिए। देर हुई तो जहाज मेरे बिना Bergen को रवाना हो जाएगा।”"
    },
    "b": {
     "ask": "आप इस राह से क्यों जा रहे हैं?",
     "say": "“राजमार्ग पर तीन शुल्क चौकियाँ हैं। यहाँ राह खराब है, पर सस्ती। शुल्क में बचत करो और पहिए से उसका मोल चुकाओ।”"
    },
    "b1": {
     "ask": "क्या ऐसा करना लाभदायक है?",
     "say": "वह अपने पहिए को देखता है और आह भरता है। “आज तो नहीं, महोदय। आज तो नहीं।”"
    }
   }
  },
  "salzfuhre": {
   "title": "नमक की गाड़ी",
   "nodes": {
    "start": {
     "say": "नमक के पीपों से लदी एक भारी गाड़ी खड़खड़ाती हुई आती है, और गाड़ीवान घोड़ों को रोकता है। “Lüneburg का नमक है, महोदय, पुराने नमक मार्ग से Lübeck जा रहा है। व्यापारी इसे सफेद सोना कहते हैं।”"
    },
    "a": {
     "ask": "Lübeck को इतना नमक किसलिए चाहिए?",
     "say": "“हेरिंग मछली के लिए, महोदय! Schonen में उसे नमक लगाकर पीपों में भरा जाता है और Nowgorod तक बेचा जाता है। Lüneburg के नमक बिना आधी ईसाई दुनिया को उपवास का भोजन न मिले।”"
    },
    "a1": {
     "ask": "यात्रा में कितना समय लगता है?",
     "say": "“अच्छे मौसम में आने-जाने के बीस दिन। वर्षा में कीचड़ पहियों को निगलता है और नमक भीग जाता है। तब उसकी भरपाई स्वामी को अपनी मजदूरी से करनी पड़ती है।”"
    },
    "b": {
     "ask": "क्या यह माल चोरों को नहीं ललचाता?",
     "say": "“इसीलिए हम तीन जन लाठियाँ लेकर चलते हैं। पर नमक चुराना कठिन है—उसे जेब में नहीं छिपा सकते।”"
    },
    "b1": {
     "ask": "तो यात्रा शुभ हो!",
     "say": "वह जीभ से चटक की आवाज करता है और घोड़े चल पड़ते हैं। “और आपके कोठार भरे रहें, मुखियाजी!”"
    }
   }
  },
  "bote": {
   "title": "बिशप का दूत",
   "nodes": {
    "start": {
     "say": "दूत की थैली और Verden के बिशप का कुलचिह्न लिए एक सवार अपना घोड़ा रोकता है। “राह दीजिए, भले आदमी—आह, क्षमा करें, आप मुखिया हैं? मुझे शीघ्रता है, पर एक बात कहने का समय है।”"
    },
    "a": {
     "ask": "क्या समाचार लेकर जा रहे हैं?",
     "say": "“यह मैं नहीं बता सकता, महोदय। मुहर पर मुहर लगी है। पर जब दूत इतनी जल्दी में हो, तो मामला धन का होता है या विधर्मियों का।”"
    },
    "a1": {
     "ask": "और इनमें से कौन-सा है?",
     "say": "वह मुस्कराता है। “अधिकतर दोनों का, मुखियाजी।” फिर वह घोड़े को एड़ लगाता है।"
    },
    "b": {
     "ask": "क्या आपका घोड़ा थका नहीं है?",
     "say": "“Rotenburg में इसे बदल दिया जाएगा। हम दूत दिन में दस मील तक सवारी करते हैं। घोड़ा भाग्यवान है—सवार नहीं बदला जाता।”"
    },
    "b1": {
     "ask": "ईश्वर के भरोसे, दूत।",
     "say": "वह संक्षेप में सिर हिलाता है और पीछे धूल का बादल छोड़ सरपट चला जाता है।"
    }
   }
  },
  "brief": {
   "title": "खोया हुआ पत्र",
   "nodes": {
    "start": {
     "say": "एक व्यापारी का सेवक घबराहट में राह के किनारे खोज रहा है। आपके पास घास में लाल मोम की मुहर लगा एक मुड़ा हुआ पत्र पड़ा है। “महोदय! क्या आपने कोई पत्र देखा है? वह न मिला तो मेरे मालिक मुझे कोड़े लगवाएँगे!”"
    },
    "a": {
     "ask": "उसे पत्र लौटा दें।",
     "say": "वह झपटकर पत्र लेता है और मुहर चूमता है। “सही-सलामत है, ईश्वर का धन्यवाद! Brügge के लिए विनिमय-पत्र है—जो इसे भंग करे, वह Wullenwever के व्यापारिक घराने की कमर तोड़ दे।”"
    },
    "a1": {
     "ask": "विनिमय-पत्र क्या होता है?",
     "say": "“Lübeck में धन चुकाते हैं और Brügge में भुगतान ले लेते हैं, बिना चाँदी को स्थल मार्ग से ढोए। यही व्यापारियों की कला है: घोड़ों के बदले कागज।”"
    },
    "b": {
     "ask": "पहले मुहर जाँचें।",
     "say": "आप पत्र को हाथ में घुमाते हैं। मुहर पर एक जहाज और तीन तारे बने हैं। सेवक पीला पड़ जाता है। “यह मेरे मालिक की मुहर है, अपनी आत्मा की शपथ! कृपा करें, महोदय!” आप उसे पत्र दे देते हैं।"
    },
    "b1": {
     "ask": "आगे से अधिक सावधान रहना।",
     "say": "“अवश्य, महोदय, अवश्य!” वह पत्र को अपनी कमीज के भीतर रखता है और बिना फिर पीछे देखे दौड़ जाता है।"
    }
   }
  },
  "deichbauer": {
   "title": "Holland का बाँध बनाने वाला",
   "nodes": {
    "start": {
     "say": "मापने की छड़ी लिए, परदेशी बोली बोलने वाला एक आदमी समतल भूमि पर दृष्टि डालता है। “Goedendag, mijnheer. मुझे बाँधों की जाँच के लिए Holland से बुलाया गया है। यहाँ आपके पास जल बहुत है और धरती कम।”"
    },
    "a": {
     "ask": "एक अच्छा बाँध कैसा होना चाहिए?",
     "say": "“समुद्र की ओर पीठ की तरह ढलुआ, भूमि की ओर खड़ा। दलदली तटीय भूमि की चिकनी मिट्टी हो, रेत नहीं। और हर घराने को बाँध बनाने के लिए आदमी देने चाहिए, नहीं तो वह सबसे कमजोर जगह पर टूटेगा।”"
    },
    "a1": {
     "ask": "क्या वह फिर भी टूट जाता है?",
     "say": "“हर बाँध कभी न कभी टूटता है, mijnheer. संत मार्सेलस की बाढ़ पूरे के पूरे गिरजा-परिक्षेत्र बहा ले गई। बाँध विजय नहीं, समुद्र के साथ एक संधि है।”"
    },
    "b": {
     "ask": "आपको Holland से क्यों बुलाते हैं?",
     "say": "“क्योंकि हम तीन सौ वर्ष से जल से लड़ रहे हैं और वह अभी तक जीता नहीं है। जिसके पास भूमि नहीं, वह अपने लिए भूमि बना लेता है।”"
    },
    "b1": {
     "ask": "क्या आप देर तक यहाँ रहेंगे?",
     "say": "“ग्रीष्म बीतने तक। फिर घर की याद खींच ले जाएगी, पत्नी और पीट की आग के पास।” वह अपनी मोम की पट्टी पर कुछ लिखता है।"
    }
   }
  },
  "jaeger": {
   "title": "जागीरदार का शिकारी",
   "nodes": {
    "start": {
     "say": "हरे कोट में, कंधे पर कमानीदार धनुष लटकाए एक शिकारी आपको रोकता है। “मुखियाजी। मेरे जागीरदार अवैध शिकारियों की खोज में हैं। यहीं वन के किनारे कुछ फंदे मिले हैं।”"
    },
    "a": {
     "ask": "हमारे यहाँ कोई अवैध शिकार नहीं करता।",
     "say": "“हर मुखिया यही कहता है, महोदय। पर सर्दियों में, जब पत्तागोभी चुक जाती है, तो कई किसान शिकारी बन जाते हैं। जो पकड़ा जाए, उसका हाथ काट लिया जाता है।”"
    },
    "a1": {
     "ask": "एक खरगोश के लिए यह कठोर दंड नहीं है?",
     "say": "वह कंधे उचकाता है। “शिकार स्वामी का है, यही कानून है। कानून मैं नहीं बनाता, मैं तो बस धनुष उठाए चलता हूँ।”"
    },
    "b": {
     "ask": "आपके जागीरदार किसका शिकार करते हैं?",
     "say": "“लाल हिरन और जंगली सूअर का, शरद ऋतु में कुत्तों के साथ। किसानों को शिकार हाँकने के लिए लोग देने पड़ते हैं, और जानवर उनकी फसल खा जाएँ तो वे शिकायत भी नहीं कर सकते।”"
    },
    "b1": {
     "ask": "यह तो भारी बोझ है।",
     "say": "“बहुत लोग यही कहते हैं, महोदय। धीरे से।” वह आपकी ओर सिर हिलाता है और बलूत के पेड़ों के बीच ओझल हो जाता है।"
    }
   }
  },
  "hirtenkind": {
   "title": "राह भूली चरवाहा बच्ची",
   "nodes": {
    "start": {
     "say": "एक छोटी लड़की छड़ी लिए राह पर रोती खड़ी है। “हंस चले गए, महोदय, और मुझे घर का रास्ता नहीं मिल रहा। माँ मुझे डाँटेंगी।”"
    },
    "a": {
     "ask": "तुम रहती कहाँ हो?",
     "say": "वह सुड़कती है और अनिश्चित-सी एक दिशा में इशारा करती है। “उस बड़े पत्थर के पीछे, जहाँ बलूत का पेड़ है।” आप उसे क्षितिज पर गिरजाघर की मीनार दिखाते हैं। उसका चेहरा खिल उठता है।"
    },
    "a1": {
     "ask": "मीनार की ओर जाओ, घर पहुँच जाओगी।",
     "say": "“धन्यवाद, मुखियाजी!” वह दौड़ पड़ती है और दूर से ही हंसों को पुकारने लगती है—सरकंडों में से वे तुरंत काँव-काँव कर उत्तर देते हैं।"
    },
    "b": {
     "ask": "हंस स्वयं घर पहुँच जाएँगे।",
     "say": "“आपको लगता है?” वह आस्तीन से नाक पोंछती है। “जिस बूढ़ी हंसनी का पंख लँगड़ा है, वह मुझसे अधिक चतुर है, पिता कहते हैं।”"
    },
    "b1": {
     "ask": "तो उस बूढ़ी हंसनी के पीछे चलो।",
     "say": "वह खिलखिलाती है और छड़ी घुमाती हुई उछलकर चली जाती है, मानो कभी राह भूली ही न हो।"
    }
   }
  },
  "koehler": {
   "title": "कोयला बनाने वाला",
   "nodes": {
    "start": {
     "say": "कालिख से काला पड़ा एक आदमी धुएँ में से निकलता है। उसके पीछे कोयला बनाने की भट्ठी सुलग रही है। “ईश्वर आपका भला करे, महोदय। बहुत पास न आएँ, भट्ठी बकरी की तरह मनमौजी है।”"
    },
    "a": {
     "ask": "भट्ठी कितने समय तक जलती है?",
     "say": "“बारह दिन और रातें। मैं पास ही अपनी झोंपड़ी में सोता हूँ और उसकी साँस सुनता रहता हूँ। यदि उसमें आग भड़क उठे, तो सारी लकड़ी राख हो जाए।”"
    },
    "a1": {
     "ask": "कोयला कौन खरीदता है?",
     "say": "“लोहार और Harz के धातु गलाने वाले कारखाने। अच्छा कोयला किसी भी लकड़ी से अधिक गर्म जलता है—उसके बिना न लोहा, न हल।”"
    },
    "b": {
     "ask": "क्या यह अकेला जीवन नहीं है?",
     "say": "“लोग हमसे दूर रहते हैं, हम शैतान की तरह काले जो हैं। पर चुप रहो तो वन बातें करता है। उल्लू मुझे पादरी से बेहतर जानता है।”"
    },
    "b1": {
     "ask": "कभी हमारे गाँव आइए।",
     "say": "वह हँसता है और कालिख के बीच उसके दाँत सफेद चमकते हैं। “पहले नाले में नहा लूँगा, मुखियाजी। वचन देता हूँ।”"
    }
   }
  },
  "scholar": {
   "title": "घुमंतू विद्यार्थी",
   "nodes": {
    "start": {
     "say": "उँगलियों पर स्याही के धब्बे और पुस्तकों की गठरी लिए एक युवक लैटिन में अभिवादन करता है। “Salve, domine! मैं Rostock का विद्यार्थी हूँ, Erfurt जा रहा हूँ। क्या एक निर्धन विद्वान को रात्रि के लिए आश्रय मिलेगा?”"
    },
    "a": {
     "ask": "Rostock में क्या पढ़ाया जाता है?",
     "say": "“सात स्वतंत्र विद्याएँ, महोदय: व्याकरण, वाक्पटुता, तर्क, फिर गणना, ज्यामिति, संगीत और तारों का ज्ञान। उसके बाद ही विधि या धर्मशास्त्र, यदि खर्च उठा सकें।”"
    },
    "a1": {
     "ask": "और एक किसान को इससे क्या लाभ?",
     "say": "वह गंभीरता से सोचता है। “जिसे गणना आती है, उसे अधिकारी ठग नहीं सकता। जो पढ़ सकता है, वह मुहर लगे हर पत्र पर विश्वास नहीं करता। यह कोई छोटा लाभ नहीं।”"
    },
    "b": {
     "ask": "आप इतने निर्धन क्यों हैं?",
     "say": "“पुस्तकें महँगी हैं और मेरे पिता पीपे बनाने वाले हैं। सभी घुमंतू विद्यार्थियों की तरह मैं रोटी के लिए द्वार-द्वार गाता हूँ। नगरवासी देते हैं ताकि हम उनके लिए प्रार्थना करें।”"
    },
    "b1": {
     "ask": "आपकी यात्रा शुभ हो।",
     "say": "“Deo gratias!” वह अपनी पुस्तकें ठीक करता है और सीटी बजाता हुआ आगे बढ़ जाता है।"
    }
   }
  },
  "hirschkalb": {
   "title": "काँटेदार झाड़ी में हिरन का बच्चा",
   "nodes": {
    "start": {
     "say": "राह किनारे झाड़-झंखाड़ में हिरन का एक बच्चा छटपटा रहा है। उसका पैर ब्लैकबेरी की बेल और एक पुराने फंदे में फँस गया है। वह बड़ी, डरी हुई आँखों से आपको देखता है।"
    },
    "a": {
     "ask": "बच्चे को मुक्त करें।",
     "say": "आप सावधानी से फंदा खोलते हैं। बच्चा उछलकर उठता है, एक बार लड़खड़ाता है और लंबी छलाँगें लगाता हुआ भोजपत्र के पेड़ों के बीच ओझल हो जाता है। वन में कहीं उसकी माँ उत्तर देती है।"
    },
    "b": {
     "ask": "उसे स्वामी के शिकारी पर छोड़ दें।",
     "say": "शिकार जागीरदार का है, और जो उसे छुए, उस पर संदेह होता है। आप मुँह फेर लेते हैं। जब फिर पीछे देखते हैं, तो बच्चा स्वयं को छुड़ाकर जा चुका है।"
    }
   }
  },
  "frischling": {
   "title": "फंदे में जंगली सूअर का बच्चा",
   "nodes": {
    "start": {
     "say": "एक बलूत के नीचे धारियों वाला जंगली सूअर का बच्चा चीख रहा है। उसका पिछला पैर अवैध शिकारी के फंदे में फँसा है। उसकी माँ अधिक दूर नहीं होगी।"
    },
    "a": {
     "ask": "फंदा तुरंत काट दें।",
     "say": "एक ही वार में वह मुक्त हो जाता है और चीखता हुआ झाड़ियों में भाग जाता है। घने झुरमुट से एक गहरी घुरघुराहट सुनाई देती है। आप शीघ्र आगे बढ़ जाना ही उचित समझते हैं।"
    },
    "b": {
     "ask": "दूरी बनाए रखें—मादा सूअर पास है।",
     "say": "आप धीरे-धीरे पीछे हटते हैं। थोड़ी देर बाद मादा सूअर झाड़ियों से निकलती है, तार को तब तक खींचती है जब तक वह टूट नहीं जाता, और बच्चे को साथ ले जाती है।"
    }
   }
  },
  "rothirsch": {
   "title": "वन के किनारे लाल हिरन",
   "nodes": {
    "start": {
     "say": "वन के किनारे एक विशाल लाल हिरन खड़ा है, उसके सींग मुकुट जैसे हैं। वह सिर उठाकर आपकी दिशा में गंध सूँघता है।"
    },
    "a": {
     "ask": "चुपचाप खड़े होकर देखें।",
     "say": "वह देर तक खड़ा रहता है, फिर सिर झुकाकर चरने लगता है, मानो आप कोई पेड़ हों। दुर्लभ दृश्य है—बुजुर्ग कहते हैं, यह शुभ वर्ष लाता है।"
    },
    "b": {
     "ask": "ताली बजाएँ।",
     "say": "एक बड़ी छलाँग में वह वन के भीतर ओझल हो जाता है। बस कुछ डालियाँ अभी हिल रही हैं।"
    }
   }
  },
  "bache": {
   "title": "बच्चों संग मादा जंगली सूअर",
   "nodes": {
    "start": {
     "say": "राह के बीच एक मादा जंगली सूअर जमीन खोद रही है, उसके आसपास कुछ धारीदार बच्चे हैं। उसने आपको देख लिया है और अपनी पीठ के बाल खड़े कर लिए हैं।"
    },
    "a": {
     "ask": "धीरे-धीरे पीछे हटें।",
     "say": "आप कदम-दर-कदम पीछे जाते हैं। मादा सूअर चेतावनी भरी घुरघुराहट करती है, फिर बच्चों को राह पार कराकर फर्न की झाड़ियों में ले जाती है।"
    },
    "b": {
     "ask": "हीथ से होकर घूम जाएँ।",
     "say": "आप हीथ की झाड़ियों के बीच से लंबा चक्कर लगाते हैं। पीछे आपको झुंड की संतुष्ट चबाने की आवाज सुनाई देती है; वे बिना किसी बाधा के जमीन खोदते रहते हैं।"
    }
   }
  }
 }
} as Full,
  zh: {
 "ui": {
  "leave": "道别上路",
  "far": "走近些才能问候。",
  "greet": "搭话"
 },
 "enc": {
  "pilger": {
   "title": "圣雅各朝圣者",
   "nodes": {
    "start": {
     "say": "一名旅人掀起潮湿的毡帽，帽上一枚铅制的圣雅各扇贝闪着光。“愿主赐您平安，体面的先生。我从Magdeburg出发，已走了三个星期，正往Wilsnack朝拜圣血。可否给我这干渴的喉咙一口水喝？”"
    },
    "a": {
     "ask": "来，请用我的水囊。",
     "say": "他大口喝着水，在胸前画了个十字。“愿主赐您的村子大麦丰收，以报您的恩德。听说往易北河去的沙岗路上，有劫匪埋伏着打劫朝圣者。”"
    },
    "a1": {
     "ask": "您可知道这些人的底细？",
     "say": "“听说有三个人，带着一匹白马。Lüneburg的领主官已发出了缉捕文书。我如今只在白日赶路，与旁人结伴而行。”"
    },
    "b": {
     "ask": "大路上有什么传闻？",
     "say": "他拄着白蜡木手杖。“在Braunschweig，行会因啤酒税向市议会抱怨；修道院里又在争论赎罪券。依我看，这世道快要乱了。”"
    },
    "b1": {
     "ask": "难道地方治安法令也不管用么？",
     "say": "“皇帝远在天边，村长大人，诸侯却近在眼前。一个齐心的村子，比任何盖了印的文书都可靠。”"
    }
   }
  },
  "spielmann": {
   "title": "游吟艺人",
   "nodes": {
    "start": {
     "say": "一个身穿彩色短上衣、背着提琴的男子夸张地深深鞠躬。“愿引我来到村长面前的道路蒙福！先生，想听首歌么？一块粗面包，便够我唱到日落。”"
    },
    "a": {
     "ask": "请为我唱一首。",
     "say": "他拉响琴弦，唱起Störtebeker的故事：据说他身首异处后，仍走过了十一名同伴。唱罢，他眨眨眼。“在Hamburg，人们可不爱听这个——我在那里宁可唱骑士的故事。”"
    },
    "a1": {
     "ask": "您平日还在何处演唱？",
     "say": "“婚宴上，教堂庆典上，大路边的酒馆里。冬天我便找一座暖和的修道院。艺人没有家，只有路。”"
    },
    "b": {
     "ask": "艺人不是不体面的人么？",
     "say": "他笑了，并未显出被冒犯的样子。“在法庭眼里不体面，先生，这倒是真的；可在人们眼里却未必。跳舞的人，才不问什么身份。”"
    },
    "b1": {
     "ask": "那您能留下什么呢？",
     "say": "“一首歌。我长眠草地下许久之后，人们仍会唱它。这比许多市议员留下的还要多。”"
    }
   }
  },
  "kraemer": {
   "title": "行商",
   "nodes": {
    "start": {
     "say": "一名背着沉重背篓的小贩停下脚步，喘着粗气。“针、线、Flandern的缎带，还有和银子一般贵的胡椒！只看看不花钱，村长大人。”"
    },
    "a": {
     "ask": "您的货从何处来？",
     "say": "“缎带来自Brügge，针来自Nürnberg，胡椒则经Venedig和Lübeck运来。路上每一道关税都要吃掉一份——价钱便是这么来的。”"
    },
    "a1": {
     "ask": "究竟要过多少道关税？",
     "say": "他掰着手指数，数到十二便放弃了。“每条河、每座桥、每位领主都要收。到头来，胡椒挣得都比我多。”"
    },
    "b": {
     "ask": "这片地方有什么新鲜事？",
     "say": "“Lüneburg的盐涨价了，Bardowick还生了一头双头小牛——女店主拿自己的灵魂起誓，说此事千真万确。”"
    },
    "b1": {
     "ask": "您信么？",
     "say": "“能卖出去的，我便信，先生。一则好故事比线还好卖。”他笑着扶正背篓。"
    }
   }
  },
  "moench": {
   "title": "托钵修士",
   "nodes": {
    "start": {
     "say": "一位身穿灰色修士袍的方济各会修士，尽管地面寒冷仍赤着脚，举手祝福。“愿平安与你们同在。我为Lüneburg的修道院募施——一点施舍，或一句好话也好。”"
    },
    "a": {
     "ask": "您的弟兄们近来如何？",
     "say": "“我们在济贫院照料病人，在集市上传道。若我们为市议会诸位大人的灵魂祈祷，他们便乐意施舍。”"
    },
    "a1": {
     "ask": "祈祷当真有用么？",
     "say": "他温和地笑了。“对付瘟疫，未必总有用，村长大人。可对付绝望，总是有用的。”"
    },
    "b": {
     "ask": "您为何赤脚行走？",
     "say": "“我们的方济各神父愿像主一样清贫。脚总会习惯，心却要更久些。”"
    },
    "b1": {
     "ask": "冬日里这样岂不难熬？",
     "say": "“冬日里我们穿木底鞋，戒规还算宽仁。谁若冻得厉害，祈祷便快些。”他几乎眨了眨眼。"
    }
   }
  },
  "torf": {
   "title": "泥炭工",
   "nodes": {
    "start": {
     "say": "一个腿套沾满泥浆的男子背着泥炭块。“愿主保佑您。今年沼地里的泥炭好挖——地够干，不至于陷进去。”"
    },
    "a": {
     "ask": "泥炭是怎样挖的？",
     "say": "“春天用铲子挖成砖块，再堆成垛，让风吹干。要到秋天才能烧。”"
    },
    "a1": {
     "ask": "沼地不危险么？",
     "say": "“不认得路的人，会被它吞去。我祖父曾在那里发现一具沼泽尸，褐得像皮革。我们又把它盖好，念了一遍天主经。”"
    },
    "b": {
     "ask": "沼地归谁所有？",
     "say": "“归修道院，先生。每车泥炭都要纳十分之一。不过没有泥炭，修士们也会和我们一样挨冻。”"
    },
    "b1": {
     "ask": "这番辛苦值得么？",
     "say": "“够生炉子便成。靠泥炭发财的，只有那些不用亲手挖的人。”"
    }
   }
  },
  "schaefer": {
   "title": "荒原牧羊人",
   "nodes": {
    "start": {
     "say": "一位老牧羊人拄着手杖，脚边卧着狗。“哟，村长大人，也到我们这儿的野地里来了？荒原羊今日安静得很——这是要变天了。”"
    },
    "a": {
     "ask": "您怎么看出天气的？",
     "say": "“羊把脑袋凑在一起，便要下雨。燕子低飞也是。若我的膝盖发酸，那就准错不了。”"
    },
    "a1": {
     "ask": "您从不看错么？",
     "say": "“也会，先生。不过比城里编历书的人错得少。”他捋着灰胡子笑了。"
    },
    "b": {
     "ask": "您放羊多久了？",
     "say": "“从七岁那年起。荒原的事不是从书上学来的。这里长得起来的都是坚韧之物——石南、杜松，还有牧羊人。”"
    },
    "b1": {
     "ask": "您怕狼么？",
     "say": "“只要狗醒着，便不怕。去年冬天有一头狼叼走了两只羊羔。自那以后，狗睡得比我还少。”"
    }
   }
  },
  "landsknecht": {
   "title": "雇佣步兵",
   "nodes": {
    "start": {
     "say": "一个男子穿着破旧的开衩长裤，腰佩短剑，抬手碰了碰羽毛帽。“我被遣散了，连军饷也没拿到，先生。正要回Holstein的家。莫担心——我只是累了，并不危险。”"
    },
    "a": {
     "ask": "您曾在何处服役？",
     "say": "“在Dithmarschen，为丹麦国王效力。农人打开了水闸，我们站在齐腰深的水里。Hemmingstedt一战，淹死的人比战死的还多。”"
    },
    "a1": {
     "ask": "那您如何逃出来的？",
     "say": "他沉默了许久。“我会游水，先生。就这么简单。上帝并未问谁才是勇者。”"
    },
    "b": {
     "ask": "您往后打算做什么？",
     "say": "“若我兄弟还肯收留我，便去耕地。我用长矛犁出的沟，已经够多了。”"
    },
    "b1": {
     "ask": "若他不肯收留您呢？",
     "say": "“那我便再去从军。没有主人的兵，就像没有院子的狗。”他耸耸肩，继续赶路。"
    }
   }
  },
  "kraeuter": {
   "title": "采药妇人",
   "nodes": {
    "start": {
     "say": "一位提着满篮草药和根茎的妇人抬起头。“愿主保佑您，村长大人。西洋蓍草治伤口，洋甘菊治肚子，还有贯叶连翘——那须在对的日子采摘。”"
    },
    "a": {
     "ask": "哪一天才是对的日子？",
     "say": "“圣若翰节，太阳升得最高的时候。那时草药才有灵力。神父说这是迷信，可他治咳嗽时照样用它。”"
    },
    "a1": {
     "ask": "您也能治发热么？",
     "say": "“柳树皮，煮出来苦得很。还要静养，人们总忘了这点。斑疹伤寒却没有草药能治——只能祈祷，再离病人远些。”"
    },
    "b": {
     "ask": "您不怕旁人说闲话么？",
     "say": "她的目光变得严厉。“怕，先生。会治病的女人，很快就会被说成会施巫术。我独自进林子，也不让任何人知道我的草药长在哪里。”"
    },
    "b1": {
     "ask": "在我的村子里，您尽可安心。",
     "say": "她打量着您，缓缓点头。“村长一句好话，比一株草药还珍贵。愿主护佑您。”"
    }
   }
  },
  "fuhrmann": {
   "title": "车轴坏了的车夫",
   "nodes": {
    "start": {
     "say": "一名车夫正对着马车咒骂，车轮陷在沙里。“恕我失言，先生！车轴喀嚓一声坏了，到Uelzen还有两天路呢。”"
    },
    "a": {
     "ask": "我来搭把手？",
     "say": "您用力推住车身，猛地一使劲，车轮便脱了困。“愿主报答您！这下能撑到下一个铁匠铺了。村长也肯弄脏自己的手——这事我可要讲给人听。”"
    },
    "a1": {
     "ask": "您运的是什么？",
     "say": "“Westfalen的亚麻布，给Lübeck的商人。若我迟到了，船便要不等我，径自驶往Bergen了。”"
    },
    "b": {
     "ask": "您为何走这条路？",
     "say": "“大路上有三处关卡。这边路虽差些，却便宜。省了关税，便要赔在车轮上。”"
    },
    "b1": {
     "ask": "那值得么？",
     "say": "他望着车轮叹了口气。“今日不值，先生。今日不值。”"
    }
   }
  },
  "salzfuhre": {
   "title": "运盐车",
   "nodes": {
    "start": {
     "say": "一辆装着盐桶的重车隆隆驶来，赶车人勒住了马。“Lüneburg的盐，先生，沿着古盐道运往Lübeck。商人们称它为白金。”"
    },
    "a": {
     "ask": "Lübeck要这么多盐做什么？",
     "say": "“腌鲱鱼呀，先生！鱼在Schonen腌好，装桶卖到远在Nowgorod的地方。没有Lüneburg的盐，半个基督教世界守斋时便无鱼可吃。”"
    },
    "a1": {
     "ask": "这一趟要走多久？",
     "say": "“天气好时，往返二十天。若是下雨，泥泞便会吞住车轮，盐也会受潮。那时就得从自己的工钱里赔给主人。”"
    },
    "b": {
     "ask": "这货物不会招来盗贼么？",
     "say": "“所以我们三人结伴，还带着木棒。不过盐不好偷——没法藏在口袋里。”"
    },
    "b1": {
     "ask": "那么，一路顺风！",
     "say": "他咂了一声舌，马儿便拉车向前。“也愿您的谷仓满满当当，村长大人！”"
    }
   }
  },
  "bote": {
   "title": "主教的信使",
   "nodes": {
    "start": {
     "say": "一名带着信袋、佩有Verden主教徽记的骑手勒住马。“让路，好人——啊，失礼了，您是村长？我赶时间，不过说句话的工夫还是有的。”"
    },
    "a": {
     "ask": "您带的是什么消息？",
     "say": "“这个不能说，先生。封得严严实实，盖了火漆印。不过信使赶得这样急，不是为了钱财，便是为了异端。”"
    },
    "a1": {
     "ask": "那究竟是哪一桩？",
     "say": "他咧嘴一笑。“多半两桩都有，村长大人。”说罢，他一夹马腹，策马而去。"
    },
    "b": {
     "ask": "您的马不累么？",
     "say": "“到了Rotenburg便换马。我们信使一天要骑上十里。马倒是好命——骑手可没人换。”"
    },
    "b1": {
     "ask": "愿主保佑，信使。",
     "say": "他匆匆点头，策马飞驰而去，身后扬起一片尘土。"
    }
   }
  },
  "brief": {
   "title": "遗失的信",
   "nodes": {
    "start": {
     "say": "一名商人的仆从正沿路边匆忙寻找。您身旁的草丛里躺着一封折好的信，封着红色火漆。“先生！您见到一封信了么？若找不回来，我主人会鞭打我的！”"
    },
    "a": {
     "ask": "把信还给他。",
     "say": "他一把抓过信，亲吻封印。“完好无损，感谢上帝！这是一张给Brügge的汇票——谁毁了它，便是要了Wullenwever商家的命。”"
    },
    "a1": {
     "ask": "汇票是什么？",
     "say": "“在Lübeck付钱，便能在Brügge取钱，不必带着银子走陆路。这便是商人的本事：用纸代替马匹。”"
    },
    "b": {
     "ask": "先查看封印。",
     "say": "您把信拿在手里翻看。封印上有一艘船和三颗星。仆从脸色发白。“我拿灵魂起誓，那是我主人的印！求您了，先生！”您把信递给了他。"
    },
    "b1": {
     "ask": "往后可要当心些。",
     "say": "“我会的，先生，我一定会！”他把信塞进衬衣里，继续跑去，连头也不曾回一下。"
    }
   }
  },
  "deichbauer": {
   "title": "来自Holland的筑堤人",
   "nodes": {
    "start": {
     "say": "一名拿着测量尺、说着外地口音的男子眺望平坦的土地。“Goedendag, mijnheer. 我应召从Holland来，查看堤坝。你们这里水多土少。”"
    },
    "a": {
     "ask": "怎样的堤坝才算好？",
     "say": "“朝海的一面平缓，像脊背，朝陆地的一面陡峭。要用沼泽低地的黏土，不能用沙。每户人家都得出人筑堤，否则堤坝便会从最薄弱的地方决口。”"
    },
    "a1": {
     "ask": "即便如此，它还是会决口么？",
     "say": "“每一道堤坝总有决口的一天，mijnheer。圣Marcellus洪灾吞没了整个教区。堤坝不是胜利，而是人与大海订下的契约。”"
    },
    "b": {
     "ask": "为何要从Holland请您来？",
     "say": "“因为我们与洪水斗了三百年，而它至今还未赢。没有土地的人，就自己造出土地来。”"
    },
    "b1": {
     "ask": "您会留很久么？",
     "say": "“待到夏天过去。那时我便想家了，想念妻子和泥炭炉火。”他在蜡板上记下了什么。"
    }
   }
  },
  "jaeger": {
   "title": "贵族领主的猎人",
   "nodes": {
    "start": {
     "say": "一名身穿绿色外衣、肩背十字弓的猎人拦住了您。“村长大人。我的领主正在搜寻偷猎者。林子边缘发现了几个套索，就在这附近。”"
    },
    "a": {
     "ask": "我们这里没人偷猎。",
     "say": "“每位村长都这么说，先生。可到了冬天，卷心菜吃光时，有些农人便成了猎人。被抓住的人要被砍掉一只手。”"
    },
    "a1": {
     "ask": "为一只野兔受这样的罚，岂不太重了？",
     "say": "他耸耸肩。“猎物归领主所有，法便是如此。我不制定法令，只负责背这把十字弓。”"
    },
    "b": {
     "ask": "您的领主猎些什么？",
     "say": "“赤鹿和野猪，秋天带着猎犬去猎。农人须派人驱赶猎物，野兽吃了他们的庄稼，他们也不得抱怨。”"
    },
    "b1": {
     "ask": "这负担着实沉重。",
     "say": "“许多人都这么说，先生。不过是悄声说的。”他向您点点头，消失在橡树林间。"
    }
   }
  },
  "hirtenkind": {
   "title": "迷路的放牧孩子",
   "nodes": {
    "start": {
     "say": "一个拿着细枝的小女孩站在路边哭泣。“鹅都不见了，先生，我也找不到回家的路。母亲会骂我的。”"
    },
    "a": {
     "ask": "你住在哪里？",
     "say": "她抽着鼻子，含糊地指了个方向。“在那块大石头后面，有棵橡树的地方。”您指给她看地平线上的教堂塔楼。她的脸顿时亮了起来。"
    },
    "a1": {
     "ask": "朝着塔楼走，就能找到家了。",
     "say": "“谢谢您，村长大人！”她跑了出去，远远地便呼唤起鹅来——芦苇丛里立刻传来鹅群的嘎嘎应声。"
    },
    "b": {
     "ask": "鹅自己会找到回家的路。",
     "say": "“您这么想么？”她用袖子擦擦鼻子。“父亲说，那只翅膀跛了的老鹅比我还聪明。”"
    },
    "b1": {
     "ask": "那就跟着老鹅走吧。",
     "say": "她咯咯笑着蹦跳而去，挥舞着细枝，仿佛从未迷过路。"
    }
   }
  },
  "koehler": {
   "title": "烧炭人",
   "nodes": {
    "start": {
     "say": "一个浑身熏黑的男子从烟雾中走出，身后的炭窑正冒着烟。“愿主保佑您，先生。别靠得太近，炭窑像山羊一样脾气难捉摸。”"
    },
    "a": {
     "ask": "炭窑要烧多久？",
     "say": "“十二天十二夜。我睡在旁边的小屋里，听它呼吸。若它烧起明火，所有木头都会化为灰烬。”"
    },
    "a1": {
     "ask": "谁买这些炭？",
     "say": "“铁匠和Harz的冶铁工坊。好木炭烧得比任何木头都旺——没有它，便没有铁，也没有犁。”"
    },
    "b": {
     "ask": "这样的日子不孤单么？",
     "say": "“人们躲着我们，我们黑得像魔鬼。可只要静下来，树林便会说话。猫头鹰比神父还了解我。”"
    },
    "b1": {
     "ask": "有空来我们村里坐坐。",
     "say": "他笑了起来，白牙在黑灰中闪现。“我先在溪水里洗干净再来，村长大人。我答应您。”"
    }
   }
  },
  "scholar": {
   "title": "游学书生",
   "nodes": {
    "start": {
     "say": "一位手指沾着墨迹、抱着一捆书的年轻人用拉丁语问候。“Salve, domine! 我是Rostock的学生，正要去Erfurt。可否给一个穷书生一处过夜的地方？”"
    },
    "a": {
     "ask": "在Rostock都学些什么？",
     "say": "“七艺，先生：文法、修辞、逻辑，然后是算术、几何、音乐和天文学。再往后，若负担得起，才学法律或神学。”"
    },
    "a1": {
     "ask": "这些对农人有何用处？",
     "say": "他认真想了想。“会算术，便不会被领主官欺骗。会识字，便不会见到盖印的文书就信。这用处可不小。”"
    },
    "b": {
     "ask": "您为何如此贫穷？",
     "say": "“书太贵，我父亲又是个制桶匠。我和所有游学的学生一样，在人家门前唱歌换面包。城里人施舍，好让我们为他们祈祷。”"
    },
    "b1": {
     "ask": "祝您一路好运。",
     "say": "“Deo gratias!”他整理好书，吹着口哨继续上路。"
    }
   }
  },
  "hirschkalb": {
   "title": "困在荆棘丛中的小鹿",
   "nodes": {
    "start": {
     "say": "路边的灌木丛里，一只小鹿正挣扎着。它的腿缠在黑莓藤和一只旧套索里，睁着惊恐的大眼睛望着您。"
    },
    "a": {
     "ask": "救出小鹿。",
     "say": "您小心地解开套索。小鹿跳起身，踉跄了一下，随即大步跃进白桦林里，不见了踪影。林中某处传来母鹿的回应。"
    },
    "b": {
     "ask": "留给领主的猎人处置。",
     "say": "猎物归领主所有，碰它的人会招来嫌疑。您转身离去。回头再看时，小鹿已自行挣脱，不见了。"
    }
   }
  },
  "frischling": {
   "title": "困在套索里的小野猪",
   "nodes": {
    "start": {
     "say": "一棵橡树下，一只浑身带条纹的小野猪正尖叫着，后腿被偷猎者的套索缠住。母野猪定然离此不远。"
    },
    "a": {
     "ask": "迅速割断套索。",
     "say": "您一刀割断套索，小野猪便尖叫着奔进灌木丛。浓密的林丛里传来低沉的呼噜声。您还是快步离开为妙。"
    },
    "b": {
     "ask": "保持距离——母野猪就在附近。",
     "say": "您慢慢后退。不久，母野猪冲出灌木丛，拖拽铁丝直到它断开，随后带着幼崽离去。"
    }
   }
  },
  "rothirsch": {
   "title": "林边的赤鹿",
   "nodes": {
    "start": {
     "say": "林边站着一头雄壮的赤鹿，鹿角犹如王冠。它抬起头，朝您的方向嗅了嗅。"
    },
    "a": {
     "ask": "静静站着观看。",
     "say": "它站了许久，随后低下头继续吃草，仿佛您是一棵树。这般景象难得一见——老人们说，它预示着丰年。"
    },
    "b": {
     "ask": "拍拍手。",
     "say": "它猛地一跃，消失在林中，只留下几根树枝还在晃动。"
    }
   }
  },
  "bache": {
   "title": "带着幼崽的母野猪",
   "nodes": {
    "start": {
     "say": "一头母野猪正在路中央拱土，身边围着几只带条纹的小野猪。它已察觉到您，竖起了鬃毛。"
    },
    "a": {
     "ask": "慢慢后退。",
     "say": "您一步一步向后退去。母野猪发出警告的哼声，随后赶着幼崽穿过道路，钻进蕨丛。"
    },
    "b": {
     "ask": "绕道穿过荒原。",
     "say": "您从石南丛中绕了一个大圈。身后传来野猪群心满意足的咂嘴声，它们正不受打扰地继续拱土。"
    }
   }
  }
 }
} as Full,
  ja: {
 "ui": {
  "leave": "挨拶して立ち去る",
  "far": "挨拶するには、もっと近づいてくだされ。",
  "greet": "声をかける"
 },
 "enc": {
  "pilger": {
   "title": "聖ヤコブの巡礼者",
   "nodes": {
    "start": {
     "say": "旅人が湿ったフェルトの帽子を持ち上げる。帽子には鉛のホタテ貝が光っている。「神のご加護を、立派なお方。Magdeburgを発って三週、このかたWilsnackの聖なる血を目指しております。渇いた喉に、水を一口いただけませぬか」"
    },
    "a": {
     "ask": "さあ、この水袋をお使いなされ。",
     "say": "彼は水を何口も深く飲み、十字を切る。「主が皆さまの村に、豊かな大麦の実りをもって報いてくださいますように。Elbeへ向かう砂地の道では、巡礼を狙う追いはぎが待ち伏せているそうです」"
    },
    "a1": {
     "ask": "その連中について何をご存じかな。",
     "say": "「三人組で、白馬を連れているとか。Lüneburgの代官が捕縛状を出したそうです。私はもう、昼間にほかの人々と連れ立ってしか歩きませぬ」"
    },
    "b": {
     "ask": "街道ではどんな噂を耳にする？",
     "say": "彼はトネリコの杖に身を支える。「Braunschweigではビール税を巡って同職組合が参事会に不満を募らせ、修道院では贖宥を巡って争っております。世の中が狂い始めているように思われますな」"
    },
    "b1": {
     "ask": "では、ラント平和令も役に立たぬのか？",
     "say": "「皇帝陛下は遠く、諸侯は近うございます、村長殿。力を合わせる村は、どんな封印付きの文書よりも頼りになります」"
    }
   }
  },
  "spielmann": {
   "title": "旅の楽師",
   "nodes": {
    "start": {
     "say": "色とりどりの胴衣を着て、背にフィーデルを担いだ男が、大げさに深々とお辞儀する。「村長殿のもとへ導いてくれた道に祝福あれ！　一曲いかがです、旦那様？　パンの一切れで、日暮れまで弾きましょう」"
    },
    "a": {
     "ask": "一曲、聞かせてくだされ。",
     "say": "彼は弦を弾き、首を落とされた後も十一人の仲間の前を歩いたというStörtebekerの歌を歌う。歌い終えると、彼は片目をつぶる。「Hamburgでは、これを聞きたがりませぬ。あそこでは騎士の歌にしておきます」"
    },
    "a1": {
     "ask": "ほかにはどこで演奏なさる？",
     "say": "「婚礼や教会の献堂祭、街道沿いの酒場で。冬には暖かな修道院を探します。楽師に家はありませぬ、あるのは道ばかり」"
    },
    "b": {
     "ask": "楽師は不名誉な身分ではないのか？",
     "say": "彼は気を悪くした様子もなく笑う。「法廷では不名誉な身分、旦那様、それは本当です。ですが人々の前では違います。踊る者は身分など尋ねませぬ」"
    },
    "b1": {
     "ask": "それで、そなたには何が残る？",
     "say": "「私がとっくに草の下に眠ってからも、歌われ続ける歌です。参事会の旦那方が残すものより、よほどましでしょう」"
    }
   }
  },
  "kraemer": {
   "title": "行商人",
   "nodes": {
    "start": {
     "say": "重い背負い籠を担いだ商人が、息を切らして立ち止まる。「針に撚り糸、Flandernのリボン、銀と同じほど高価な胡椒！　見るだけならただですぞ、村長殿」"
    },
    "a": {
     "ask": "品物はどこから来たのかな？",
     "say": "「リボンはBrüggeから、針はNürnbergから、胡椒はVenedigとLübeckを経て。道中の関税が少しずつ食いつぶすものですから、この値になるのです」"
    },
    "a1": {
     "ask": "関税は幾つもあるのか？",
     "say": "彼は指を折って数え、十二で諦める。「川ごと、橋ごと、領主ごとです。しまいには胡椒のほうが私より稼いでおりますよ」"
    },
    "b": {
     "ask": "この辺りに新しい話はあるか？",
     "say": "「Lüneburgでは塩が値上がりし、Bardowickでは頭が二つある子牛が生まれたとか。宿の女将が魂にかけて誓っておりました」"
    },
    "b1": {
     "ask": "そなたはそれを信じるのか？",
     "say": "「私は売れるものを信じます、旦那様。面白い話は撚り糸よりよく売れますから」彼は笑って、背負い籠を担ぎ直す。"
    }
   }
  },
  "moench": {
   "title": "托鉢修道士",
   "nodes": {
    "start": {
     "say": "灰色の修道衣をまとい、冷たい地面にもかかわらず裸足のフランシスコ会士が、祝福するように手を上げる。「皆さまに平安を。Lüneburgの我らの修道院のために施しを集めております。お恵みを、あるいは温かいお言葉だけでも」"
    },
    "a": {
     "ask": "修道士の皆さまはいかがお過ごしかな？",
     "say": "「施療院で病人の世話をし、市場で説教をしております。参事会の旦那方も、その魂のために祈れば、喜んで施しをくださいます」"
    },
    "a1": {
     "ask": "祈りは役に立つのか？",
     "say": "彼は穏やかに微笑む。「ペストには、いつも効くとは申せませぬ、村長殿。ですが絶望には、必ずや」"
    },
    "b": {
     "ask": "なぜ裸足で歩くのかな？",
     "say": "「我らの父フランシスコは、主のように貧しくあろうとされました。足は慣れますが、心にはもう少し時が要ります」"
    },
    "b1": {
     "ask": "冬はつらくはないか？",
     "say": "「冬には木の底の履物を履きます。会則もそれほどには慈悲深いのです。そして凍える者は、祈りも速くなります」彼はほとんど片目をつぶりかける。"
    }
   }
  },
  "torf": {
   "title": "泥炭掘り",
   "nodes": {
    "start": {
     "say": "泥だらけの脚衣を着けた男が、泥炭の塊を背負っている。「神のご加護を。今年は泥炭地の掘り具合がようございます。沈み込まずに済むほど乾いておりますから」"
    },
    "a": {
     "ask": "泥炭はどうやって掘るのかな？",
     "say": "「春にシャベルで、煉瓦の形に切り出します。それを山に積んで、風で乾かすのです。燃やせるのは秋になってからです」"
    },
    "a1": {
     "ask": "泥炭地は危なくないのか？",
     "say": "「道を知らぬ者は、泥炭地に呑まれます。祖父はそこで、革のように茶色い湿地の死体を見つけました。私らはまた土をかぶせ、主の祈りを唱えました」"
    },
    "b": {
     "ask": "泥炭地は誰のものかな？",
     "say": "「修道院のものです、旦那様。荷車一台分につき十分の一を納めます。ですが泥炭がなければ、修道士様方も私らと同じに凍えるでしょう」"
    },
    "b1": {
     "ask": "苦労に見合う稼ぎになるか？",
     "say": "「炉を焚くには足ります。泥炭で金持ちになるのは、掘らぬ者ばかりです」"
    }
   }
  },
  "schaefer": {
   "title": "荒野の羊飼い",
   "nodes": {
    "start": {
     "say": "年老いた羊飼いが杖にもたれ、足もとには犬がいる。「おや、村長殿、たまには私らのところへお出ましですか。今日は荒野の羊たちが大人しい。こりゃ天気が変わりますぞ」"
    },
    "a": {
     "ask": "何を見て天気を知るのかな？",
     "say": "「羊が頭を寄せ合えば雨が来ます。ツバメが低く飛んでも同じ。そして私の膝がうずけば、間違いありませぬ」"
    },
    "a1": {
     "ask": "外れることはないのか？",
     "say": "「そりゃありますとも、旦那様。ですが町の暦作りよりは少のうございます」彼は灰色の髭の中で笑う。"
    },
    "b": {
     "ask": "羊の番はどれほど長くしている？",
     "say": "「七つの冬を越した頃からです。荒野のことは本からは学べませぬ。ここで育つのは、丈夫なものばかり。ヒースにネズの木、それに羊飼いです」"
    },
    "b1": {
     "ask": "狼は怖くないのか？",
     "say": "「犬が起きている限りは。去年の冬、一頭に子羊を二匹さらわれました。それから犬は私より寝ておりませぬ」"
    }
   }
  },
  "landsknecht": {
   "title": "傭兵",
   "nodes": {
    "start": {
     "say": "擦り切れた切り込み入りのズボンをはき、腰にカッツバルゲルを差した男が、羽飾りの帽子に指を添える。「給金もなしに解雇されました、旦那様。Holsteinの故郷へ帰るところです。ご心配なく。疲れてはおりますが、危ない者ではありませぬ」"
    },
    "a": {
     "ask": "どこで仕えていたのかな？",
     "say": "「Dithmarschenでデンマーク王のもとに。農民たちが水門を開け、私らは腰まで水に浸かりました。Hemmingstedtでは、討たれた者より溺れた者のほうが多かった」"
    },
    "a1": {
     "ask": "そなたはどうやって逃れた？",
     "say": "彼は長いあいだ黙っている。「私は泳げたのです、旦那様。それだけのこと。神は誰が勇敢かなどお尋ねにならなかった」"
    },
    "b": {
     "ask": "これからどうするつもりかな？",
     "say": "「兄がまだ私を受け入れてくれるなら、畑を耕します。長槍でなら、もう十分に畝をつけました」"
    },
    "b1": {
     "ask": "兄上が受け入れなかったら？",
     "say": "「そのときはまた兵に志願します。主のいない兵は、家のない犬のようなものです」彼は肩をすくめ、歩き去る。"
    }
   }
  },
  "kraeuter": {
   "title": "薬草摘みの女",
   "nodes": {
    "start": {
     "say": "草や根でいっぱいの籠を持った女が顔を上げる。「神のご加護を、村長殿。傷にはノコギリソウ、腹にはカミツレ、それにセイヨウオトギリソウ。これは正しい日に摘まねばなりませぬ」"
    },
    "a": {
     "ask": "正しい日とはいつかな？",
     "say": "「聖ヨハネの日、太陽がいちばん高く昇るときです。そのとき草に力が宿ります。神父様は迷信だとおっしゃいますが、ご自分の咳はそれで治しておられます」"
    },
    "a1": {
     "ask": "熱にも効く薬があるのか？",
     "say": "「ヤナギの皮を煮たものです。苦いですが。それに休むこと、人はいつもそれを忘れます。発疹チフスにはどんな草も効きませぬ。祈って、離れているしかありませぬ」"
    },
    "b": {
     "ask": "人の噂は怖くないのか？",
     "say": "彼女の眼差しが険しくなる。「怖うございます、旦那様。癒やす女は、すぐに呪う女にされます。私は一人で森へ行き、薬草の生えている場所を誰にも教えませぬ」"
    },
    "b1": {
     "ask": "我が村では安心してくだされ。",
     "say": "彼女はあなたを見つめ、ゆっくりとうなずく。「村長殿の温かいお言葉は、薬草より値打ちがあります。神のお守りがありますように」"
    }
   }
  },
  "fuhrmann": {
   "title": "車軸の壊れた荷車引き",
   "nodes": {
    "start": {
     "say": "荷車引きが、砂に車輪を取られた荷車の前で悪態をついている。「汚い言葉をお許しくだされ、旦那様！　車軸がばきりといきまして、Uelzenまではまだ二日もあるというのに」"
    },
    "a": {
     "ask": "手を貸そうか？",
     "say": "あなたが荷車を押すと、車輪がぐいと動いて抜け出す。「神のお報いがありますように！　これで次の鍛冶屋までは持ちます。手を汚してくださる村長殿とは、皆に話して聞かせますぞ」"
    },
    "a1": {
     "ask": "何を運んでいるのかな？",
     "say": "「Westfalenの亜麻布です。Lübeckの商人向けで。遅れたら、船は私を置いてBergenへ出てしまいます」"
    },
    "b": {
     "ask": "なぜこの道を通るのかな？",
     "say": "「街道には関所が三つあります。こちらは道が悪いが、安くつきます。関税を節約して、車輪で払うわけです」"
    },
    "b1": {
     "ask": "それで得になるのか？",
     "say": "彼は車輪を見て、ため息をつく。「今日は駄目です、旦那様。今日ばかりは」"
    }
   }
  },
  "salzfuhre": {
   "title": "塩を運ぶ荷車",
   "nodes": {
    "start": {
     "say": "塩樽を積んだ重い荷車ががたがたとやって来て、荷車引きが馬を止める。「Lüneburgの塩です、旦那様。古い塩街道を通ってLübeckへ。商人たちは白い黄金と呼んでおります」"
    },
    "a": {
     "ask": "Lübeckではなぜそんなに塩が要るのかな？",
     "say": "「ニシンのためです、旦那様！　Schonenで塩漬けにして樽に詰め、遠くNowgorodまで売るのです。Lüneburgの塩がなければ、キリスト教世界の半分で精進の食べ物がなくなります」"
    },
    "a1": {
     "ask": "旅にはどれほどかかる？",
     "say": "「天気がよければ往復で二十日。雨が降れば泥が車輪を呑み込み、塩も濡れます。そうなれば自分の給金から主人に弁償するのです」"
    },
    "b": {
     "ask": "積み荷は盗人に狙われぬか？",
     "say": "「だから三人連れで、棍棒を持って行くのです。もっとも塩は盗みにくい。懐に隠せませぬから」"
    },
    "b1": {
     "ask": "では、よい旅を！",
     "say": "彼が舌を鳴らすと、馬たちが荷車を引き始める。「村長殿の納屋もいっぱいになりますように！」"
    }
   }
  },
  "bote": {
   "title": "司教の使者",
   "nodes": {
    "start": {
     "say": "使者の鞄とVerden司教の紋章を身につけた騎手が、馬を止める。「道を空けてくだされ、よき人よ。ああ、失礼、あなたが村長殿ですか？　急いでおりますが、一言くらいなら」"
    },
    "a": {
     "ask": "どのような知らせを運んでいる？",
     "say": "「それは申せませぬ、旦那様。しっかり封印されております。ですが使者がこれほど急ぐときは、金か異端者の話です」"
    },
    "a1": {
     "ask": "それで、どちらなのかな？",
     "say": "彼はにやりと笑う。「たいていは両方です、村長殿」そう言って馬に拍車をかける。"
    },
    "b": {
     "ask": "馬は疲れていないのか？",
     "say": "「Rotenburgで乗り換えます。我ら使者は一日に十マイルも馬を走らせます。馬は幸せですな。乗り手は替えてもらえませぬ」"
    },
    "b1": {
     "ask": "神のご加護を、使者殿。",
     "say": "彼は軽くうなずき、土埃を残して駆け去る。"
    }
   }
  },
  "brief": {
   "title": "落とされた手紙",
   "nodes": {
    "start": {
     "say": "商人の召使いが、慌てて道端を探している。あなたの傍らの草むらに、赤い蝋で封じた折りたたみの手紙が落ちている。「旦那様！　手紙を見かけませなんだか？　なくしたら主人に鞭打たれます！」"
    },
    "a": {
     "ask": "手紙を返してやる。",
     "say": "彼は手紙をひったくるように受け取り、封蝋に口づけする。「無事だ、神に感謝を！　Brügge宛ての為替手形です。これを破る者は、Wullenwever家を破滅させることになります」"
    },
    "a1": {
     "ask": "為替手形とは何かな？",
     "say": "「Lübeckで金を払い、Brüggeで受け取るのです。銀を陸路で運ばずに済みます。これが商人の知恵です。馬の代わりに紙を使うのです」"
    },
    "b": {
     "ask": "まず封蝋を調べる。",
     "say": "あなたは手紙を手の中で返す。封蝋には船と三つの星が描かれている。召使いは青ざめる。「それは主人の封印です、我が魂にかけて！　どうか、旦那様！」あなたは彼に手紙を渡す。"
    },
    "b1": {
     "ask": "これからはもっと気をつけなされ。",
     "say": "「そういたします、旦那様、必ず！」彼は手紙をシャツの下にしまい、一度も振り返らずに走り去る。"
    }
   }
  },
  "deichbauer": {
   "title": "Hollandの堤防造り",
   "nodes": {
    "start": {
     "say": "測量用の竿を持ち、異国の訛りで話す男が、平らな土地を見渡している。「Goedendag, mijnheer. 堤防を調べるため、Hollandから呼ばれて参りました。ここは水が多く、土が少ないですな」"
    },
    "a": {
     "ask": "よい堤防とはどんなものかな？",
     "say": "「海側は背のようになだらかに、陸側は急に。砂ではなく、湿地の粘土を使います。そして各農家が堤防造りに人を出すのです。さもなくば、いちばん弱いところが決壊します」"
    },
    "a1": {
     "ask": "それでも決壊するのか？",
     "say": "「どんな堤防もいつかは決壊します、mijnheer。聖マルケルスの大洪水は、教区を丸ごと幾つも呑み込みました。堤防は勝利ではありませぬ。海との約束です」"
    },
    "b": {
     "ask": "なぜHollandから呼ばれるのかな？",
     "say": "「我らは三百年、水と戦ってきましたが、まだ水に負けておらぬからです。土地のない者は、自分で土地を造るのです」"
    },
    "b1": {
     "ask": "長く滞在なさるのか？",
     "say": "「夏が終わるまでです。その後は妻と泥炭の火が待つ故郷へ帰りたくなります」彼は蝋板に何かを書き留める。"
    }
   }
  },
  "jaeger": {
   "title": "領主の猟師",
   "nodes": {
    "start": {
     "say": "緑の上着を着て、肩に石弓をかけた猟師があなたを呼び止める。「村長殿。我が領主様が密猟者を探しておられます。この森の端で罠が見つかりまして」"
    },
    "a": {
     "ask": "我が村に密猟する者はおらぬ。",
     "say": "「どの村長殿もそうおっしゃいます。ですが冬、キャベツが尽きれば、猟師になる農民もおります。捕まれば手を失いますが」"
    },
    "a1": {
     "ask": "兎一匹にしては厳しすぎぬか？",
     "say": "彼は肩をすくめる。「獲物は領主様のもの、それが法です。私は法を作っているのではありませぬ。ただ石弓を担いでいるだけです」"
    },
    "b": {
     "ask": "領主殿は何を狩られる？",
     "say": "「秋に犬を連れて、アカシカや猪を。農民は勢子を出さねばならず、獲物に穀物を食い荒らされても、文句は言えませぬ」"
    },
    "b1": {
     "ask": "それはつらい務めだ。",
     "say": "「多くの者がそう申します、旦那様。小声でですが」彼はあなたにうなずき、樫の木々の間に消える。"
    }
   }
  },
  "hirtenkind": {
   "title": "迷子の番の子",
   "nodes": {
    "start": {
     "say": "小さな女の子が、細い鞭を持って道端で泣いている。「ガチョウがいなくなっちゃったの、旦那様。それにおうちへの道もわからないの。母さんに叱られちゃう」"
    },
    "a": {
     "ask": "家はどこにあるのかな？",
     "say": "彼女は鼻をすすり、おぼろげにある方角を指さす。「大きな石の向こう、樫の木があるところ」あなたは地平線に見える教会の塔を指さす。すると彼女の顔が明るくなる。"
    },
    "a1": {
     "ask": "あの塔に向かって行けば、家に帰れるよ。",
     "say": "「ありがとう、村長様！」彼女は走り出し、遠くからもうガチョウを呼び始める。すると葦原から、すぐにガアガアと返事が聞こえる。"
    },
    "b": {
     "ask": "ガチョウは自分で家に帰れるだろう。",
     "say": "「そう思う？」彼女は袖で鼻を拭う。「翼の悪い年寄りのガチョウは、私より賢いって父さんが言ってた」"
    },
    "b1": {
     "ask": "なら、その年寄りについてお行き。",
     "say": "彼女はくすくす笑い、まるで迷ったことなどなかったかのように、鞭を振りながら跳ねて行く。"
    }
   }
  },
  "koehler": {
   "title": "炭焼き",
   "nodes": {
    "start": {
     "say": "煤で真っ黒になった男が煙の中から現れる。背後では炭焼き窯が煙を上げている。「神のご加護を、旦那様。あまり近づきなさるな。窯は山羊のように気まぐれですから」"
    },
    "a": {
     "ask": "窯はどれほど燃やすのかな？",
     "say": "「昼も夜も十二日です。私は脇の小屋で眠り、窯の息遣いに耳を澄ませます。炎が上がれば、木はみな灰になってしまいます」"
    },
    "a1": {
     "ask": "炭は誰が買うのかな？",
     "say": "「鍛冶屋やHarzの製錬所です。よい炭はどんな木より熱く燃えます。炭がなければ鉄も鋤もありませぬ」"
    },
    "b": {
     "ask": "寂しい暮らしではないか？",
     "say": "「人々は私らを避けます。悪魔のように黒いですから。ですが静かにしていれば森が語りかけてきます。フクロウは神父様より私をよく知っております」"
    },
    "b1": {
     "ask": "一度、我が村に来なされ。",
     "say": "彼は笑い、煤の中に白い歯をきらりと見せる。「先に小川で体を洗ってからにします、村長殿。お約束です」"
    }
   }
  },
  "scholar": {
   "title": "旅の学徒",
   "nodes": {
    "start": {
     "say": "指にインクの染みをつけ、本の包みを持った若者がラテン語で挨拶する。「Salve, domine! 私はRostockの学徒で、Erfurtへ向かう途中です。貧しい学び手に、一夜の宿をいただけませぬか」"
    },
    "a": {
     "ask": "Rostockでは何を学ぶのかな？",
     "say": "「七つの自由学芸です、旦那様。文法、修辞、論理、それから算術、幾何、音楽、天文学。その後ようやく、余裕があれば法学か神学を学びます」"
    },
    "a1": {
     "ask": "それが農民に何の役に立つ？",
     "say": "彼は真剣に考える。「計算ができれば代官に騙されませぬ。字が読めれば、封印のある文書を何でも信じたりはしませぬ。それは小さな役には立たぬでしょうか」"
    },
    "b": {
     "ask": "なぜそれほど貧しいのかな？",
     "say": "「本は高く、父は樽職人なのです。ほかの旅の学徒と同じように、戸口で歌ってパンをいただきます。町の人々は、自分たちのために祈ってもらおうと施してくださいます」"
    },
    "b1": {
     "ask": "旅の幸運を祈る。",
     "say": "「Deo gratias!」彼は本を抱え直し、口笛を吹きながら旅を続ける。"
    }
   }
  },
  "hirschkalb": {
   "title": "茨に絡まった鹿の子",
   "nodes": {
    "start": {
     "say": "道端の茂みで、鹿の子がもがいている。脚が木苺の蔓と古い罠に絡まってしまったのだ。大きな怯えた目であなたを見つめている。"
    },
    "a": {
     "ask": "鹿の子を助ける。",
     "say": "あなたは慎重に罠を解く。鹿の子は跳び上がり、一度よろめいてから、大きく跳ねて白樺の間に消える。森のどこかで母鹿が応える。"
    },
    "b": {
     "ask": "領主の猟師に任せる。",
     "say": "獲物は領主のもので、触れれば疑いをかけられる。あなたは背を向ける。もう一度振り返ると、鹿の子は自力で抜け出し、いなくなっている。"
    }
   }
  },
  "frischling": {
   "title": "罠にかかった猪の子",
   "nodes": {
    "start": {
     "say": "樫の木の下で、縞模様の猪の子が甲高い声を上げている。後ろ脚が密猟者の罠にかかっているのだ。母猪もそう遠くにはいないだろう。"
    },
    "a": {
     "ask": "急いで罠を切る。",
     "say": "ひと切りで自由になった猪の子は、甲高い声を上げながら下生えの中へ走っていく。茂みから低いうなり声が応える。あなたは足早に立ち去ることにする。"
    },
    "b": {
     "ask": "母猪が近い。距離を取る。",
     "say": "あなたはゆっくりと後ずさる。まもなく母猪が茂みから飛び出し、針金が切れるまで引っ張って、子を連れて行く。"
    }
   }
  },
  "rothirsch": {
   "title": "森の端のアカシカ",
   "nodes": {
    "start": {
     "say": "森の端に、立派なアカシカが立っている。枝角はまるで冠のようだ。鹿は頭を上げ、あなたの方へ鼻を向ける。"
    },
    "a": {
     "ask": "静かに立ち止まって眺める。",
     "say": "鹿は長いあいだそこに立ち、やがてあなたを木ででもあるかのように、頭を下げて再び草を食む。めったに見られぬ光景だ。年寄りたちは、よい年の兆しだと言う。"
    },
    "b": {
     "ask": "手を打ち鳴らす。",
     "say": "鹿は大きくひと跳びして森の中へ消える。枝が幾つか揺れているばかりだ。"
    }
   }
  },
  "bache": {
   "title": "子連れの母猪",
   "nodes": {
    "start": {
     "say": "道の真ん中で母猪が土を掘り返し、その周りには縞模様の子猪が何匹かいる。母猪はあなたに気づき、剛毛を逆立てる。"
    },
    "a": {
     "ask": "ゆっくりと後ずさる。",
     "say": "あなたは一歩ずつ後ろへ下がる。母猪は警戒するようにうなり、それから子を追い立てて道を横切り、シダの中へ入っていく。"
    },
    "b": {
     "ask": "荒野を通って大きく迂回する。",
     "say": "あなたはヒースの生える荒野を大きく迂回する。背後からは、邪魔されずに土を掘り続ける猪の群れが、満足げに口を鳴らす音が聞こえる。"
    }
   }
  }
 }
} as Full,
};
