import type { Lang } from "@/game/i18n";
import type { Quest } from "@/game/quests";
import type { Job, Person } from "@/game/people";

/** Mayor's tasks dressed as villagers' petitions; growth thresholds are celebrated milestones instead. Presentation only — quest keys, rewards and the DB guard are unchanged. */
export type Speaker = "elder" | "herb" | "carpenter" | "inn" | "carter" | "trader" | "guild" | "sexton";

export const MILESTONES: readonly Quest[] = ["ten", "hamlet", "village", "fifty", "town", "hundred", "merchant", "metro"];

export const SPEAKER: Partial<Record<Quest, Speaker>> = {
  bless: "elder", build: "herb", sign: "carpenter", meet: "inn", gift: "carter",
  road: "trader", bless7: "sexton", buy3: "guild", gifts5: "carter", roads2: "trader", buy6: "guild",
};

const NAMES: Record<Speaker, string> = {
  elder: "Martha", herb: "Almut", carpenter: "Gerlach", inn: "Kunz", carter: "Jost", trader: "Ruprecht", guild: "Hartwig", sexton: "Lorenz",
};

type Chrome = {
  roles: Record<Speaker, string>;
  plea: (name: string, role: string) => string;
  thanks: (name: string) => string;
  milestone: string;
  feast: string;
  find: string;
};

const CHROME: Record<Lang, Chrome> = {
  de: { roles: { elder: "die Dorfälteste", herb: "die Kräuterfrau", carpenter: "der Zimmermann", inn: "der Wirt", carter: "der Fuhrmann", trader: "der Händler", guild: "der Zunftmeister", sexton: "der Küster" }, plea: (n, r) => `Eine Bitte von ${n}, ${r}`, thanks: (n) => `${n} dankt dir`, milestone: "Das Dorf wächst", feast: "Ein Festtag fürs Dorf!", find: "Aufsuchen" },
  en: { roles: { elder: "the village elder", herb: "the herb-wife", carpenter: "the carpenter", inn: "the innkeeper", carter: "the carter", trader: "the trader", guild: "the guild master", sexton: "the sexton" }, plea: (n, r) => `A request from ${n}, ${r}`, thanks: (n) => `${n} thanks you`, milestone: "The village grows", feast: "A feast day for the village!", find: "Find" },
  fr: { roles: { elder: "la doyenne", herb: "l'herboriste", carpenter: "le charpentier", inn: "l'aubergiste", carter: "le charretier", trader: "le marchand", guild: "le maître de guilde", sexton: "le sacristain" }, plea: (n, r) => `Une requête de ${n}, ${r}`, thanks: (n) => `${n} vous remercie`, milestone: "Le village grandit", feast: "Jour de fête au village !", find: "Trouver" },
  es: { roles: { elder: "la anciana", herb: "la herbolaria", carpenter: "el carpintero", inn: "el posadero", carter: "el carretero", trader: "el mercader", guild: "el maestro gremial", sexton: "el sacristán" }, plea: (n, r) => `Una petición de ${n}, ${r}`, thanks: (n) => `${n} te da las gracias`, milestone: "La aldea crece", feast: "¡Día de fiesta en la aldea!", find: "Buscar" },
  ar: { roles: { elder: "كبيرة القرية", herb: "العشّابة", carpenter: "النجّار", inn: "صاحب النُّزُل", carter: "العربجي", trader: "التاجر", guild: "شيخ الطائفة", sexton: "خادم الكنيسة" }, plea: (n, r) => `طلب من ${n}، ${r}`, thanks: (n) => `${n} يشكرك`, milestone: "القرية تكبر", feast: "يوم عيد في القرية!", find: "ابحث" },
  hi: { roles: { elder: "गाँव की बुज़ुर्ग", herb: "जड़ी-बूटी वाली", carpenter: "बढ़ई", inn: "सराय वाला", carter: "गाड़ीवान", trader: "व्यापारी", guild: "श्रेणी-प्रमुख", sexton: "गिरजे का सेवक" }, plea: (n, r) => `${n} (${r}) का निवेदन`, thanks: (n) => `${n} आपका धन्यवाद करते हैं`, milestone: "गाँव बढ़ रहा है", feast: "गाँव में उत्सव का दिन!", find: "खोजें" },
  zh: { roles: { elder: "村中长者", herb: "草药婆婆", carpenter: "木匠", inn: "旅店老板", carter: "车夫", trader: "商人", guild: "行会师傅", sexton: "教堂司事" }, plea: (n, r) => `${r}${n}的请求`, thanks: (n) => `${n}向你致谢`, milestone: "村庄在成长", feast: "村里的节日！", find: "寻找" },
  ja: { roles: { elder: "村の長老", herb: "薬草師", carpenter: "大工", inn: "宿屋の主人", carter: "荷馬車引き", trader: "商人", guild: "ギルドの親方", sexton: "教会守" }, plea: (n, r) => `${r}${n}からのお願い`, thanks: (n) => `${n}からの感謝`, milestone: "村は育っています", feast: "村の祝いの日！", find: "会いに行く" },
};

/** Personal plea + thanks in the villager's voice. Languages without their own wording fall back to the quest list text. */
const VOICE: Partial<Record<Lang, Partial<Record<Quest, [string, string]>>>> = {
  de: {
    bless: ["„Schulze, die Leute sind noch scheu in der neuen Heimat. Sprich unter „Zuwendung“ einen Segen über Brunnen und Glocke – das gibt allen Mut.“", "„Hörst du? Die Kinder lachen wieder am Brunnen. Hab Dank.“"],
    build: ["„Der Nachtfrost kriecht in die Hütten, und mir fehlen Salbei und Lindenblüten. Ein Werkhaus aus dem Bau-Menü – eine Kräuterhütte vielleicht – wäre ein Segen.“", "„Schon duftet es nach getrocknetem Salbei. Heute schlafen die Leute ruhiger.“"],
    sign: ["„Fast wäre ich an eurem Tal vorbeigelaufen! Schreib doch unter „Wegweiser“ einen Gruß an die Nachbarn, damit Reisende uns finden.“", "„Ein schönes Schild! Ich hab's mit eigener Hand geglättet.“"],
    meet: ["„Ein Fremder sitzt am Kamin und hat allerlei zu erzählen. Hör ihn an, wenn er dich anspricht – man lernt nie aus.“", "„Klug entschieden! Das ganze Wirtshaus spricht davon.“"],
    gift: ["„Drüben im Nachbardorf ist die Ernte mager. Schick ihnen unter „Dörfer“ ein Geschenk – ich spanne gern an.“", "„Sie haben gewinkt, bis mein Karren hinterm Hügel verschwand.“"],
    road: ["„Meine Ware versinkt im Schlamm der Pfade. Beschließ im Bau-Menü eine Straße zu einem Nachbarn, dann kommen Händler von selbst.“", "„Hörst du die Räder? Der Handel hat uns gefunden.“"],
    bless7: ["„Eine Glocke, die nur einmal läutet, vergisst man. Segne das Dorf an sieben Tagen, dann wird es ein Brauch.“", "„Sieben Mal hat die Glocke gerufen – nun gehört sie zu unserem Leben.“"],
    buy3: ["„Die Gesellen ziehen weiter, wenn sie keine Werkbank finden. Drei Werkhäuser, Schulze, und sie schlagen hier Wurzeln.“", "„Die Gesellen bleiben! Aus jeder Werkstatt klingt es.“"],
    gifts5: ["„Man spricht schon von unserer Großzügigkeit. Fünf Geschenke an andere Dörfer – dann kennt man uns im ganzen Land.“", "„Wohin ich auch fahre, man winkt mir zu. Das ist dein Verdienst.“"],
    roads2: ["„Eine Straße ist gut, zwei machen uns zum Kreuzweg. Beschließ eine zweite zu einem anderen Nachbarn.“", "„Ein Kreuzweg! Hier rasten nun alle, die durchs Land ziehen.“"],
    buy6: ["„Eine Stadt braucht Gilden. Sechs Werkhäuser, und wir dürfen unsere Zunftfahne hissen.“", "„Die Zunftfahne weht über dem Markt. Wir danken dir, Schulze.“"],
  },
  en: {
    bless: ["“Mayor, folk are still shy in their new home. Speak a blessing over well and bell under “Care” – it gives everyone heart.”", "“Hear that? The children laugh at the well again. Thank you.”"],
    build: ["“Night frost creeps into the huts and I've no sage or linden. A workshop from the build menu – a herb hut, perhaps – would be a blessing.”", "“It already smells of dried sage. Folk will sleep easier tonight.”"],
    sign: ["“I nearly walked past your valley! Write a greeting to the neighbours under “Signposts” so travellers can find us.”", "“A fine sign! I planed it with my own hands.”"],
    meet: ["“A stranger sits by the hearth with many tales. Hear him out when he speaks to you – one never stops learning.”", "“Wisely chosen! The whole inn is talking about it.”"],
    gift: ["“The harvest is thin in the next village. Send them a gift under “Villages” – I'll gladly hitch the cart.”", "“They waved until my cart disappeared over the hill.”"],
    road: ["“My wares sink in the mud of these paths. Decide on a road to a neighbour in the build menu and traders will come on their own.”", "“Hear the wheels? Trade has found us.”"],
    bless7: ["“A bell that rings once is soon forgotten. Bless the village on seven days and it becomes a custom.”", "“Seven times the bell has called – now it belongs to our lives.”"],
    buy3: ["“Journeymen move on when they find no workbench. Three workshops, mayor, and they'll put down roots.”", "“The journeymen are staying! Every workshop rings.”"],
    gifts5: ["“They already speak of our generosity. Five gifts to other villages – and the whole land will know us.”", "“Wherever I drive, people wave. That's your doing.”"],
    roads2: ["“One road is good; two make us a crossroads. Decide on a second one to another neighbour.”", "“A crossroads! Everyone travelling the land now rests here.”"],
    buy6: ["“A town needs guilds. Six workshops and we may raise our guild banner.”", "“The guild banner flies over the market. We thank you, mayor.”"],
  },
};

export type Petition = { milestone: boolean; header: string; plea?: string | undefined; thanks?: string | undefined; who?: string | undefined; person?: Person | undefined; find?: string | undefined };

/** Real villagers who can voice each speaker (sex matches the role wording); elder = oldest resident. */
const JOBS: Record<Speaker, readonly Job[]> = {
  elder: ["retired"], herb: ["herbalist", "healer"], carpenter: ["builder", "sawyer", "crafter"], inn: ["innkeeper"],
  carter: ["carter"], trader: ["merchant"], guild: ["smith", "crafter", "miller", "baker"], sexton: ["priest"],
};
const SEX: Record<Speaker, "f" | "m"> = { elder: "f", herb: "f", carpenter: "m", inn: "m", carter: "m", trader: "m", guild: "m", sexton: "m" };

/** A resident actually living in the village who fits the speaker, chosen stably by id; none -> archetype stays. */
export function speakerIn(s: Speaker, people: readonly Person[]): Person | undefined {
  const ok = people.filter((p) => p.role !== "mayor" && p.role !== "guest" && p.sex === SEX[s] && p.age >= 16 && (s === "elder" ? p.age >= 60 : JOBS[s].includes(p.job)));
  if (!ok.length) return undefined;
  return s === "elder" ? ok.reduce((a, b) => (b.age > a.age || (b.age === a.age && b.id < a.id) ? b : a)) : ok.reduce((a, b) => (b.id < a.id ? b : a));
}

/** Presentation of the current task: who asks, their words, or a milestone header. */
export function petitionOf(q: Quest, lang: Lang, variant: boolean, people: readonly Person[] = []): Petition {
  const c = CHROME[lang] ?? CHROME.en;
  const s = SPEAKER[q];
  if (!s || MILESTONES.includes(q)) return { milestone: true, header: c.milestone };
  const person = speakerIn(s, people);
  const name = person ? `${person.first} ${person.last}`.trim() : NAMES[s];
  const v = variant ? undefined : VOICE[lang]?.[q];
  return { milestone: false, header: c.plea(name, c.roles[s]), plea: v?.[0], thanks: v?.[1], who: c.thanks(person?.first ?? name), person, find: person ? c.find : undefined };
}

export const feastTitle = (lang: Lang) => (CHROME[lang] ?? CHROME.en).feast;
