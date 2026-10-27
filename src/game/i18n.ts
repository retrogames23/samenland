export type Lang = "de" | "en";

const de = {
  tagline: "Setz einen Samen. Schau zu, wie dein Dorf wächst – in Echtzeit, auch wenn du weg bist.",
  plant: "Samen setzen", toMine: "Zu meinem Dorf", cancel: "Abbrechen",
  townName: "Name des Dorfes", yourName: "Dein Name",
  needNames: "Gib erst beide Namen ein.", clickLand: "Jetzt auf ein freies Stück Land klicken.",
  plantFail: "Das Pflanzen hat nicht geklappt. Bitte nochmal versuchen.",
  alreadyHave: "Du hast schon ein Dorf – jeder Spieler hat genau einen Samen.",
  planted: (n: string) => `${n} ist gepflanzt. Komm morgen wieder – es wächst auch ohne dich.`,
  nearOnly: "Nur in der Nähe deines Dorfes.", noGrow: "Hier wächst nichts.",
  hill: "Auf den Hügeln wird nicht gebaut.", water: "Hier ist kein festes Land.",
  near: (n: string) => `Zu nah an ${n}.`,
  since: "seit", buildings: "Gebäude", towns: "Dörfer",
  look: "Zuschauen", tree: "Baum", flower: "Blumen", lantern: "Laterne",
  hint: "Mausrad: zoomen · Ziehen: bewegen",
  stages: ["Hof", "Weiler", "Dorf", "Kleinstadt", "Industriestadt"],
  terrain: { deep: "Tiefes Meer", water: "Wasser", sand: "Sand", grass: "Wiese", meadow: "Blumenwiese", forest: "Wald", hill: "Hügel" } as Record<string, string>,
  age: (h: number) => h < 1 ? `${Math.max(1, Math.round(h * 60))} Min.` : h < 48 ? `${Math.round(h)} Std.` : `${Math.round(h / 24)} Tagen`,
  signInToPlant: "Melde dich an, um deinen Samen zu setzen.",
  signIn: "Anmelden", signUp: "Registrieren", signOut: "Abmelden",
  email: "E-Mail", password: "Passwort", google: "Mit Google", apple: "Mit Apple",
  noAccount: "Noch kein Konto? Registrieren", haveAccount: "Schon ein Konto? Anmelden",
  checkMail: "Fast geschafft: Bestätige deine E-Mail über den Link, den wir dir geschickt haben.",
  authFail: "Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.",
  or: "oder",
};

const en: typeof de = {
  tagline: "Plant a seed. Watch your village grow – in real time, even while you're away.",
  plant: "Plant a seed", toMine: "Go to my village", cancel: "Cancel",
  townName: "Village name", yourName: "Your name",
  needNames: "Enter both names first.", clickLand: "Now click a free patch of land.",
  plantFail: "Planting didn't work. Please try again.",
  alreadyHave: "You already have a village – every player gets exactly one seed.",
  planted: (n) => `${n} has been planted. Come back tomorrow – it grows without you.`,
  nearOnly: "Only near your village.", noGrow: "Nothing grows here.",
  hill: "Nothing is built on the hills.", water: "This isn't solid ground.",
  near: (n) => `Too close to ${n}.`,
  since: "for", buildings: "buildings", towns: "Villages",
  look: "Watch", tree: "Tree", flower: "Flowers", lantern: "Lantern",
  hint: "Scroll: zoom · Drag: move",
  stages: ["Farmstead", "Hamlet", "Village", "Small town", "Industrial town"],
  terrain: { deep: "Deep sea", water: "Water", sand: "Sand", grass: "Grassland", meadow: "Flower meadow", forest: "Forest", hill: "Hills" },
  age: (h) => h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} days`,
  signInToPlant: "Sign in to plant your seed.",
  signIn: "Sign in", signUp: "Sign up", signOut: "Sign out",
  email: "Email", password: "Password", google: "With Google", apple: "With Apple",
  noAccount: "No account yet? Sign up", haveAccount: "Already have an account? Sign in",
  checkMail: "Almost there: confirm your email via the link we sent you.",
  authFail: "Sign-in failed. Check your email and password.",
  or: "or",
};

export const DICT = { de, en };
export type Dict = typeof de;

/** Translate a canPlant error code. */
export function plantError(t: Dict, code: string) {
  if (code.startsWith("near:")) return t.near(code.slice(5));
  return code === "hill" ? t.hill : t.water;
}
