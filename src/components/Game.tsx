import { WalkStick } from "./WalkStick";
import { CharacterBadge, CharacterDetails } from "./hud/CharacterBadge";
import { tileHits } from "@/game/disasters";
import { BOOK } from "@/game/lang/book";
import { PROSPERITY } from "@/game/lang/prosperity";
import { ESTATE_TAX } from "@/game/prosperity";
import { AID_TALER, GIFT_TALER, sentToday, thankable, type Gift, type GiftKind } from "@/game/gifts";
import { giftReadKey, mergeGiftReads, parseGiftReads } from "@/game/gift-read";
import { REALMS, REALM_TZ, detectRealm, setRealm, clock, worldHour, isSunday, isLab, labJump, setLabJump, LAB_SPEED, gameDate, type Realm } from "@/game/time";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { wonders, wonderClaims, firstFinder, daysSince, WONDER_REACH, type WonderFind } from "@/game/wonders";
import { draw, renderStats, iso, toTile, MIN_ZOOM, lastPeople, lastTraders, lastSources, peopleFocus, signFocus, prewarmOverview, setSignposts, setWonderFound, signpostMap, type Camera } from "@/game/render";
const pkey = (p: { id: number; seed: { id: string } }) => `${p.seed.id}:${p.id}`;
import { townRank, rankInput, nextRankNeed } from "@/game/rank";
import { townOf, poseOf, kinOf, FETE_SECS, commandMayor, driveMayor, clearMayorOrder, parkMayor, mayorAway, setMounted, setStrollHold, citizensOf, isHomeKind, setRemoteMayor, clearRemoteMayors, type Person } from "@/game/people";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { traitsOf, thoughtOf } from "@/game/traits";
import { banter } from "@/game/banter";
import { weddingJoy } from "@/game/weddings";
import { inspectAt, type Inspect } from "@/game/inspect";
import { larderOf, storedAt, chainOf, boonsOf, type Ware } from "@/game/goods";
import { WareIcon } from "@/components/hud/WareIcon";
import { Maximize2, Minimize2, Volume2, VolumeX, Hammer, Bell, Signpost as SignIcon, Map as MapIcon, Sprout, Settings, Plus, Minus, Home, Crown, X, LogIn, Footprints } from "lucide-react";
import { Panel, WoodButton } from "@/components/hud/Panel";
import { Parchment, WaxSeal, buzz } from "@/components/hud/Parchment";
import { ART, pickDecision } from "@/game/decisions";
import { ITEM_STAGE } from "@/game/disasters";
import type { DecisionKind } from "@/game/decision-order";
import { Minimap } from "@/components/hud/Minimap";
import { rideTime, letterArrives } from "@/game/wander";
type LetterRow = { id: string; from_seed: string; to_seed: string; created_at: string };
import { chronicle, FEST_GAP, CHRON_LETTER, CHRON_BANNER, type Chronicle, type ChronEvent } from "@/game/chronicle";
import { scribeGreeting } from "@/lib/chronicle.functions";
import { deleteAccount } from "@/lib/account.functions";
import { settleTreasury } from "@/lib/treasury.functions";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ScrollText, MoreHorizontal } from "lucide-react";
import logoUrl from "@/assets/logo-keimling.png";
import { QUESTS, questState, questKey, WAY_SMALL, WAY_BIG, type Quest, type QuestClaim } from "@/game/quests";
import { petitionOf, feastTitle } from "@/game/lang/petitions";
import { LoadingScreen } from "@/components/LoadingScreen";
import { splashDone } from "@/game/splash";
import { VillageRoll } from "@/components/VillageRoll";
import { TownProfile } from "@/components/TownProfile";
import { Outlook } from "@/components/Outlook";
import { OUTLOOK } from "@/game/lang/outlook";
import { RANK_NEED } from "@/game/rank";
import { Tavern } from "@/components/Tavern";
import { BugReport } from "@/components/BugReport";
import { MayorEditor } from "@/components/MayorEditor";
import { MAYOR } from "@/game/lang/mayor";
import { COURT } from "@/game/lang/court";
import { setCourtLabel, setSupportOwned, dogSpots, iso as dogIso, setHeraldRows, heraldSpots, isPlantedRare } from "@/game/render";
import { DOG } from "@/game/lang/dog";
import { SupportBox } from "@/components/SupportBox";
import { SUPPORT } from "@/game/lang/support";
import { Survey } from "@/components/Survey";
import { THANKS, OSS } from "@/game/lang/thanks";
import { TILEINFO } from "@/game/lang/tileinfo";
import { tileFacts } from "@/game/tile-info";
import { RENAME } from "@/game/lang/rename";
import { paymentsEnvOrNull } from "@/lib/stripe";
import { PRINCELY } from "@/game/lang/princely";
import { HERALD, edictText } from "@/game/lang/edicts";
import { princelyClaims, favourOf, openTaskOf, heraldVisit, PRINCELY_COUNT, type PrincelyRow, type PrincelyKind } from "@/game/princely";
import { courtPoses, courtCenter, atCourt, audienceHost, errandNear, ERRANDS, type AudienceHost, type Errand } from "@/game/court";
import { BUGS } from "@/game/lang/bugs";
import { Beer, ChevronDown, MapPin, Dices } from "lucide-react";
import { suggestTownName } from "@/game/town-names";
import { seasonAt } from "@/game/season";
import { setScene, setSound, unlock, baa, hm, tap, bell, jingle, disposeAudio } from "@/game/audio";
import {
  canPlant,
  MIN_SEED_DISTANCE,
  specialSites,
  specialBuild,
  monumentProgress,
  MONUMENT_KEYS, MONUMENT_DEFS, monumentSteps, monumentOf,
  structureAt,
  radiusOf,
  ageHours,
  effAge,
  speedOf,
  speedParts,
  tradeProfile,
  tradePartners,
  mentoring,
  mentorOf,
  tradeHints,
  townStats,
  terrain,
  buildable,
  resourceAt,
  MAP,
  stageOf,
  links,
  isBlessed,
  blessCooldown,
  BLESS_MS,
  type Signpost,
  type Planting,
  roadCandidates, roadHours,
  roadBuilding,
  roadIncoming,
  roadDone,
  type Seed,
  canPlaceSpecial,
  SPECIAL_KIND,
  CHARTER_PATHS,
  charterReady,
  type CharterPath,
  twinLinks, pactOf, pactPending, workOf, marketDay, marketHours, festivalDate, twinGateAt, PACTS, TWIN_WORKS, PACT_WAIT, type PactKind, type WorkKind,
  sawmillUp, SEAT_KINDS,
  signTile,
  hash,
} from "@/game/world";
const PATH_ICON: Record<string, string> = { trade: "⚖️", craft: "🔨", culture: "📜", farm: "🌾" };
const CHAR_ICON: Record<TownWay, string> = { grain: "🌾", workshop: "⚒", gateway: "⚓" };
const wayOf = (p: { x: number; y: number }) => townCharacter(p).main;
import { drawBuildingSprite, spriteUrl } from "@/game/building-sprites";
import { TOWN_CHARACTER } from "@/game/i18n";
import { onIsland } from "@/game/islands";
import { townCharacter, type TownWay } from "@/game/character";
import { DICT, LANGS, LANG_LABEL, LANG_NAME, RTL, LOCALE, plantError, type Lang } from "@/game/i18n";
import { CHEST } from "@/game/lang/chest";
import { CHEST_STEPS, CHEST_CAP, CHEST_PRICE, chestLevel, chestCap, chestBlock } from "@/game/economy";
import { TITLE_PRICE, TITLE_STEPS, TITLE_RANK, TITLE_BONUS, titleOf, titleBlock, RANK_PRICE, RANK_ROADS, rankOf, rankBlock, type RankStep, ITEMS, MONUMENT_PRICE, MONUMENTS, nextMonumentStep, GUILD, canBuy, canBuyWay, WAY_ITEM, dailyTax, attributes, treasury, referralClaims, visitClaims, type Item, type Purchase } from "@/game/economy";
import { ENCOUNTERS, choiceOf, pendingEncounter, saplingsOwed, type Decision } from "@/game/encounters";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { firstFreeSite, placeTap } from "@/game/placement";
import { saplingSpots } from "@/game/saplings";
import FigureLab from "@/components/FigureLab";

type Mode = "look" | "seed" | "tree" | "flower" | "lantern" | "sapling";

const SHEET = "pointer-events-auto w-full max-w-xs rounded-md border-2 border-wood bg-card px-3 py-2 text-foreground shadow-[var(--shadow-cozy)] max-md:max-h-[45dvh] max-md:max-w-none max-md:overflow-y-auto max-md:overscroll-contain max-md:rounded-t-2xl";
/** swipe a phone sheet down to close it */
const sheetSwipe = (close: () => void) => {
  let y0: number | null = null;
  return {
    onTouchStart: (e: import("react").TouchEvent<HTMLDivElement>) => { y0 = e.currentTarget.scrollTop <= 0 ? e.touches[0]!.clientY : null; },
    onTouchEnd: (e: import("react").TouchEvent<HTMLDivElement>) => { if (y0 != null && e.changedTouches[0]!.clientY - y0 > 60) close(); y0 = null; },
  };
};

/** One local speech bubble at a time (never stored): follows a villager (pid) or sits at a world point. */
const bubble: { text: string; until: number; pid: number | null; sid: string | null; wx: number; wy: number; lift: number } = { text: "", until: 0, pid: null, sid: null, wx: 0, wy: 0, lift: 9 };
const sayAt = (text: string, wx: number, wy: number, lift: number, pid: number | null = null, sid: string | null = null) => {
  Object.assign(bubble, { text, wx, wy, lift, pid, sid, until: performance.now() + Math.min(9000, 3000 + text.length * 70) });
};
function drawBubble(ctx: CanvasRenderingContext2D, cv: HTMLCanvasElement, cam: Camera, dpr: number) {
  const nowT = performance.now(); if (nowT > bubble.until || !bubble.text) return;
  if (bubble.pid !== null) { const f = lastPeople.find((o) => o.q.p.id === bubble.pid && o.q.p.seed.id === bubble.sid); if (f) { bubble.wx = f.x; bubble.wy = f.y; } }
  const sx = (bubble.wx - cam.x) * cam.zoom * dpr + cv.width / 2, sy = (bubble.wy - bubble.lift) * cam.zoom * dpr + cv.height / 2 - (cam.y * cam.zoom * dpr) - 6 * dpr;
  const fs = 14 * dpr, maxW = 220 * dpr, pad = 8 * dpr;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `italic 600 ${fs}px Georgia, 'Times New Roman', 'Noto Serif CJK SC', serif`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  // word wrap (CJK has no spaces: wrap per character)
  const words = /\s/.test(bubble.text) ? bubble.text.split(/(\s+)/) : [...bubble.text];
  const lines: string[] = []; let cur = "";
  for (const w of words) { const nx = cur + w; if (ctx.measureText(nx).width > maxW && cur.trim()) { lines.push(cur.trim()); cur = w.trimStart(); } else cur = nx; }
  if (cur.trim()) lines.push(cur.trim());
  const lh = fs * 1.25, bw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width))) + pad * 2, bh = lines.length * lh + pad * 1.6;
  const fade = Math.min(1, (bubble.until - nowT) / 400);
  const bx = Math.max(4, Math.min(cv.width - bw - 4, sx - bw / 2)), by = Math.max(4, sy - bh - 10 * dpr);
  ctx.globalAlpha = fade;
  ctx.fillStyle = "rgba(246,238,220,0.97)"; ctx.strokeStyle = "rgba(92,62,36,0.85)"; ctx.lineWidth = 2 * dpr;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10 * dpr); ctx.fill(); ctx.stroke();
  const tx = Math.max(bx + 12 * dpr, Math.min(bx + bw - 12 * dpr, sx));
  ctx.beginPath(); ctx.moveTo(tx - 7 * dpr, by + bh - 1); ctx.lineTo(sx, by + bh + 9 * dpr); ctx.lineTo(tx + 7 * dpr, by + bh - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillRect(tx - 6 * dpr, by + bh - 3 * dpr, 12 * dpr, 3 * dpr);
  ctx.fillStyle = "rgba(52,34,20,1)";
  lines.forEach((l, i) => ctx.fillText(l, bx + bw / 2, by + pad * 0.8 + i * lh));
  ctx.restore();
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // dev diagnostics HUD: written straight to the DOM, never through React state
  const perfRef = useRef<HTMLDivElement>(null);
  const perf = useRef({ sum: 0, n: 0, max: 0, t: 0 });
  const [rawSeeds, setSeeds] = useState<Seed[]>([]);
  const [blessings, setBlessings] = useState<{ id: string; seed_id: string; created_at: string }[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [postTo, setPostTo] = useState<Seed | null>(null);
  const [profile, setProfile] = useState<Seed | null>(null);
  const [postText, setPostText] = useState("");
  const [claims, setClaims] = useState<QuestClaim[]>([]);
  const [claimsReady, setClaimsReady] = useState(false);
  const [charters, setCharters] = useState<{ id: string; seed_id: string; path: string; created_at: string }[]>([]);
  const [charterOpen, setCharterOpen] = useState(false);
  const [firstRoads, setFirstRoads] = useState<{ id: string; seed_id: string; target_id: string; created_at: string }[]>([]);
  const [roadOpen, setRoadOpen] = useState(false);
  type EncRow = { id: string; seed_id: string; event: string; choice: string; cost: number; created_at: string };
  const [encounters, setEncounters] = useState<EncRow[]>([]);
  const [votes, setVotes] = useState<{ id: string; seed_id: string; partner_id: string; pact: string; created_at: string }[]>([]);
  const [works, setWorks] = useState<{ id: string; seed_id: string; partner_id: string; work: string; cost: number; created_at: string }[]>([]);
  const [pactOpen, setPactOpen] = useState(false);
  const [pactPick, setPactPick] = useState<PactKind | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(88);
  useEffect(() => {
    const el = barRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setBarH(el.offsetTop + el.offsetHeight));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const [encOpen, setEncOpen] = useState(false);
  // "watching": the tab has been visible for WATCH_MS without interruption; encounters reward watching
  const [watching, setWatching] = useState(false);
  useEffect(() => {
    const WATCH_MS = 3 * 60000;
    let id: ReturnType<typeof setTimeout> | undefined;
    const arm = () => { clearTimeout(id); setWatching(false); if (document.visibilityState === "visible") id = setTimeout(() => setWatching(true), WATCH_MS); };
    arm();
    document.addEventListener("visibilitychange", arm);
    return () => { clearTimeout(id); document.removeEventListener("visibilitychange", arm); };
  }, []);
  const [snooze, setSnooze] = useState<Partial<Record<DecisionKind, number>>>({});
  const [roadPick, setRoadPick] = useState<string | null>(null);
  const [charterPick, setCharterPick] = useState<CharterPath | null>(null);
  const [signs, setSigns] = useState<Signpost[]>([]);
  const [signDraft, setSignDraft] = useState<Record<string, string>>({});
  // blessing timestamps travel with the seed, so growth stays a pure function of shared rows
  const seeds = useMemo(() => {
    const by = new Map<string, number[]>();
    for (const b of blessings) { if (!by.has(b.seed_id)) by.set(b.seed_id, []); by.get(b.seed_id)!.push(Date.parse(b.created_at)); }
    const buys = new Map<string, NonNullable<Seed["bought"]>>();
    const decs = new Map<string, Decision[]>();
    for (const e of encounters) { if (!decs.has(e.seed_id)) decs.set(e.seed_id, []); decs.get(e.seed_id)!.push({ event: e.event, choice: e.choice, cost: e.cost, at: Date.parse(e.created_at) }); }
    for (const p of purchases) { if (!buys.has(p.seed_id)) buys.set(p.seed_id, []); buys.get(p.seed_id)!.push({ item: p.item, at: Date.parse(p.created_at), x: p.x ?? null, y: p.y ?? null }); }
    const vo = new Map<string, NonNullable<Seed["votes"]>>(), wo = new Map<string, NonNullable<Seed["works"]>>();
    for (const v of votes) { if (!vo.has(v.seed_id)) vo.set(v.seed_id, []); vo.get(v.seed_id)!.push({ partner: v.partner_id, pact: v.pact as PactKind, at: Date.parse(v.created_at) }); }
    for (const w of works) { if (!wo.has(w.seed_id)) wo.set(w.seed_id, []); wo.get(w.seed_id)!.push({ partner: w.partner_id, work: w.work as WorkKind, cost: w.cost, at: Date.parse(w.created_at) }); }
    return rawSeeds.map((s0) => {
      const v0 = vo.get(s0.id), w0 = wo.get(s0.id);
      const s: Seed = v0 || w0 ? { ...s0, ...(v0 ? { votes: v0 } : {}), ...(w0 ? { works: w0 } : {}) } : s0;
      const bl = by.get(s.id), bo = buys.get(s.id), ch = charters.find((c) => c.seed_id === s.id), fr0 = firstRoads.filter((f) => f.seed_id === s.id), fr = fr0.length ? fr0 : null, de = decs.get(s.id);
      if (!bl && !bo && !ch && !fr && !de) return s;
      return { ...s, ...(bl ? { blessed: bl.sort((a, b) => a - b) } : {}), ...(bo ? { bought: bo.sort((a, b) => a.at - b.at) } : {}), ...(ch ? { charter: { path: ch.path as CharterPath, at: Date.parse(ch.created_at) } } : {}), ...(fr ? { roads: fr.map((f) => ({ target: f.target_id, at: Date.parse(f.created_at) })).sort((a, b) => a.at - b.at) } : {}), ...(de ? { decisions: de.sort((a, b) => a.at - b.at) } : {}) };
    }).map((s) => {
      const civicRoads = rawSeeds.filter(o => o.id !== s.id).flatMap(o => {
        const a = { ...s, roads: firstRoads.filter(r => r.seed_id === s.id).map(r => ({ target: r.target_id, at: Date.parse(r.created_at) })) };
        const b = { ...o, roads: firstRoads.filter(r => r.seed_id === o.id).map(r => ({ target: r.target_id, at: Date.parse(r.created_at) })) };
        const at = roadDone(a, b);
        return at === null ? [] : [{ at }];
      });
      s = { ...s, civicRoads };
      const lt = letters.filter((g) => g.from_seed === s.id).map((g) => ({ id: g.id, to: g.to_seed, at: Date.parse(g.created_at) }));
      return lt.length ? { ...s, letters: lt } : s;
    }).map((s) => {
      const sent = gifts.filter((g) => g.from_seed === s.id).map((g) => ({ id: g.id, to: g.to_seed, kind: g.kind as GiftKind, at: Date.parse(g.created_at) }));
      const aid = gifts.filter((g) => g.to_seed === s.id && g.kind === "aid").map((g) => Date.parse(g.created_at));
      return sent.length || aid.length ? { ...s, ...(sent.length ? { sent } : {}), ...(aid.length ? { aid } : {}) } : s;
    });
  }, [rawSeeds, blessings, purchases, charters, firstRoads, encounters, votes, works, gifts, letters]);
  useEffect(() => { setSignposts(signs); }, [signs]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  /** the player's own village, wherever it stands — one account plants exactly one seed */
  const [home, setHome] = useState<Seed | null>(null);
  const [lang, setLang] = useState<Lang>("de");
  const t = DICT[lang];
  const book = BOOK[lang];
  const tRef = useRef(t);
  tRef.current = t;
  const [inviteOpen, setInviteOpen] = useState(false);
  useEffect(() => { document.title = t.docTitle; }, [t]);
  useEffect(() => {
    document.documentElement.lang = lang;
    setCourtLabel(COURT[lang].name);
    document.documentElement.dir = RTL[lang] ? "rtl" : "ltr";
  }, [lang]);
  const mine = seeds.find((s) => userId && s.user_id === userId)?.id ?? null;
  const [auth, setAuth] = useState({ email: "", password: "", signup: false });
  const [mode, setMode] = useState<Mode>("look");
  const [placing, setPlacing] = useState<string | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const tileInfoRef = useRef<HTMLDivElement>(null);
  // touch placement: the preview sits on its own tile until the player confirms
  const [ghost, setGhost] = useState<[number, number] | null>(null);
  const hotkey = useRef<(e: KeyboardEvent) => void>(() => {});
  /** soft camera glide target (screen-iso coords) for the Space key; any drag or pan key cancels it */
  const glide = useRef<{ x: number; y: number } | null>(null);
  const [coarse, setCoarse] = useState(false);
  // hybrid input (iPad + trackpad, touch laptops): start from the media query, then follow the device actually used —
  // a mouse/trackpad switches to fine mode (no joystick), the next finger switches back; state only flips on change
  useEffect(() => {
    const m = window.matchMedia("(pointer: coarse)"); let cur = m.matches; setCoarse(cur);
    const set = (v: boolean) => { if (v !== cur) { cur = v; setCoarse(v); } };
    const onMq = () => set(m.matches);
    const onPtr = (e: PointerEvent) => { if (e.pointerType === "mouse") set(false); else if (e.pointerType === "touch" || e.pointerType === "pen") set(true); };
    m.addEventListener("change", onMq);
    window.addEventListener("pointerdown", onPtr, { capture: true, passive: true });
    window.addEventListener("pointermove", onPtr, { capture: true, passive: true });
    return () => { m.removeEventListener("change", onMq); window.removeEventListener("pointerdown", onPtr, true); window.removeEventListener("pointermove", onPtr, true); };
  }, []);
  const [form, setForm] = useState({ name: "", owner: "", gender: "d" });
  // a ready-made cozy name lowers the founding hurdle (set after hydration, so SSR stays stable)
  // suggestion skips names already on this map; re-rolls while still untouched if seeds load later
  const autoName = useRef("");
  useEffect(() => {
    setForm((f) => {
      const taken = seeds.map((s) => s.name);
      if (f.name && f.name !== autoName.current) return f;
      if (f.name && !taken.some((n) => n.trim().toLowerCase() === f.name.toLowerCase())) return f;
      const name = suggestTownName(taken);
      autoName.current = name;
      return { ...f, name };
    });
  }, [seeds]);
  const rerollName = () => { const name = suggestTownName(seeds.map((s) => s.name), Math.random, form.name); autoName.current = name; setForm((f) => ({ ...f, name })); };
  const [msg, setMsg] = useState<string | null>(null);
  type Tab = "build" | "rituals" | "signs" | "towns" | "plant";
  const [tab, setTab] = useState<Tab | null>(null);
  const [walk, setWalk] = useState(false);
  const stick = useRef({ dx: 0, dy: 0 });
  const [authOpen, setAuthOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [imprint, setImprint] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renameErr, setRenameErr] = useState("");
  const [renameSkip, setRenameSkip] = useState<string | null>(null);
  useEffect(() => { try { setRenameSkip(localStorage.getItem("samenland:rename-skip")); } catch { setRenameSkip(""); } }, []);
  const mySeed = seeds.find((s) => s.id === mine);
  const dupOf = mySeed && renameSkip !== null && renameSkip !== mySeed.id + ":" + mySeed.name
    ? seeds.find((o) => o.id !== mySeed.id && o.name.trim().toLowerCase() === mySeed.name.trim().toLowerCase() && o.created_at < mySeed.created_at) : undefined;
  const skipRename = () => { if (!mySeed) return; const k = mySeed.id + ":" + mySeed.name; try { localStorage.setItem("samenland:rename-skip", k); } catch { /* ignore */ } setRenameSkip(k); };
  const saveRename = async () => {
    if (!mySeed) return;
    const n = renameName.trim();
    if (n.length < 2 || n.length > 32) { setRenameErr(RENAME[lang].bad); return; }
    if (seeds.some((o) => o.id !== mySeed.id && o.name.trim().toLowerCase() === n.toLowerCase())) { setRenameErr(RENAME[lang].taken); return; }
    const { error } = await supabase.rpc("rename_seed", { p_seed: mySeed.id, p_name: n });
    if (error) { setRenameErr(/taken/.test(error.message) ? RENAME[lang].taken : error.message); return; }
    setSeeds((ss) => ss.map((x) => (x.id === mySeed.id ? { ...x, name: n } : x)));
    setRenameErr("");
  };
  const [bugOpen, setBugOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  // supporter decorations: only granted rows are stored, placement is derived (src/game/supporter.ts)
  const [support, setSupport] = useState<Map<string, Set<string>>>(new Map());
  const loadSupport = useCallback(async () => {
    const env = paymentsEnvOrNull(); if (!env) return;
    const { data } = await supabase.from("supporter_rewards").select("seed_id, reward").eq("environment", env);
    const m = new Map<string, Set<string>>();
    for (const r of data ?? []) { const v = m.get(r.seed_id) ?? new Set<string>(); v.add(r.reward); m.set(r.seed_id, v); }
    setSupport(m); return m;
  }, []);
  // village dog names (owner-chosen, public); the dog itself is derived in src/game/dog.ts
  const [dogNames, setDogNames] = useState<Map<string, string>>(new Map());
  useEffect(() => { void supabase.from("village_dogs").select("seed_id, name").then(({ data }) => setDogNames(new Map((data ?? []).map((r) => [r.seed_id, r.name])))); }, []);
  // preview only: Roggenfeld gets the dog for testing, so the reward can be seen without a payment
  useEffect(() => {
    const host = typeof location !== "undefined" ? location.hostname : "";
    const preview = host.includes("id-preview") || host === "localhost" || host.includes("lovableproject");
    const m = new Map([...support].map(([k, v]) => [k, new Set(v)]));
    if (preview) for (const sd of seeds) if (sd.name === "Roggenfeld") { const v = m.get(sd.id) ?? new Set<string>(); v.add("dog"); m.set(sd.id, v); }
    setSupportOwned(m);
  }, [support, seeds]);
  useEffect(() => {
    void loadSupport();
    const back = typeof location !== "undefined" && new URLSearchParams(location.search).get("support") === "thanks";
    if (!back) return;
    history.replaceState(null, "", location.pathname);
    toast.success(SUPPORT[lang].thanks);
    // the payment confirmation arrives a few seconds later; refresh until it shows
    let n = 0; const id = setInterval(() => { if (++n > 12) clearInterval(id); void loadSupport(); }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSupport]);
  const [quitOpen, setQuitOpen] = useState(false);
  const [quitName, setQuitName] = useState("");
  const [quitting, setQuitting] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delWord, setDelWord] = useState("");
  const delFn = useServerFn(deleteAccount);
  const [isAdmin, setIsAdmin] = useState(false);
  const [realm, setRealmState] = useState<Realm>("europe");
  const realmRef = useRef<Realm>("europe");
  // swaps the map in place (admin realm switch) — no page reload, no splash
  const loadRealmRef = useRef<((r: Realm) => Promise<void>) | null>(null);
  const [view, setView] = useState({ x: MAP / 2, y: MAP / 2, span: 40 });
  const [who, setWho] = useState<Person | null>(null);
  const [editMayor, setEditMayor] = useState(false);
  useEffect(() => setEditMayor(false), [who?.id]);
  const [place, setPlace] = useState<Inspect | null>(null);
  const [, tick] = useState(0);

  const dpr = useRef(1);
  const [fs, setFs] = useState(false);
  const [sound, setSoundOn] = useState(false);
  const soundRef = useRef(false); soundRef.current = sound;
  useEffect(() => {
    const on = localStorage.getItem("samenland.sound") !== "off";
    setSoundOn(on);
    if (!on) return;
    const first = () => { setSound(true); unlock(); };
    window.addEventListener("pointerdown", first, { once: true });
    return () => window.removeEventListener("pointerdown", first);
  }, []);
  useEffect(() => () => disposeAudio(), []);
  const toggleSound = () => {
    const on = !sound; setSoundOn(on); setSound(on);
    localStorage.setItem("samenland.sound", on ? "on" : "off");
  };
  useEffect(() => { prewarmOverview(); }, []);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  // start over the settled heartland, never the empty ocean at tile (0,0)
  const cam = useRef<Camera>((() => { const [x, y] = iso(500, 500); return { x, y, zoom: 2.6 }; })());
  const target = useRef({ zoom: 2.6, ax: 0, ay: 0 });
  const sapCache = useRef<{ key: string; spots: [number, number][] }>({ key: "", spots: [] });
  const st = useRef({ seeds, plantings: new Map<string, Planting>(), hover, mode, mine, placing: null as string | null, ghost: null as [number, number] | null, walk: false });
  st.current.walk = walk;
  st.current.seeds = seeds;
  const liveCh = useRef<RealtimeChannel | null>(null);
  st.current.placing = placing;
  st.current.ghost = ghost;
  st.current.mode = mode;
  st.current.mine = mine;
  st.current.plantings = new Map(plantings.map((p) => [`${p.x},${p.y}`, p]));

  const focus = (x: number, y: number) => {
    const [ix, iy] = iso(x, y);
    cam.current.x = ix;
    cam.current.y = iy;
  };
  /** Entering seed mode: if the view centre is unplantable (mountain, water), glide to the nearest free valley. */
  const startSeedMode = () => {
    if (home) { setMsg(t.alreadyHave); return; }
    setPlantAsk(null);
    setMode("seed");
    const [cx, cy] = toTile(cam.current.x, cam.current.y);
    if (canPlant(cx, cy, seeds) === null) return;
    for (let r = 2; r < 200; r += 2) for (let a = 0; a < 24; a++) {
      const x = Math.round(cx + Math.cos((a / 24) * 6.283) * r), y = Math.round(cy + Math.sin((a / 24) * 6.283) * r);
      if (canPlant(x, y, seeds) === null && canPlant(x + 3, y, seeds) === null && canPlant(x - 3, y, seeds) === null && canPlant(x, y + 3, seeds) === null && canPlant(x, y - 3, seeds) === null) {
        focus(x, y); target.current = { ...target.current, zoom: Math.max(target.current.zoom, 1.4) }; return;
      }
    }
  };
  const [ptr, setPtr] = useState<[number, number] | null>(null);
  const ptrRef = useRef<[number, number] | null>(null), tipRef = useRef<HTMLDivElement | null>(null);
  const [plantAsk, setPlantAsk] = useState<[number, number] | null>(null);
  const [planting, setPlanting] = useState(false);
  // one seed per account on any map; admins get one per map
  useEffect(() => {
    if (!userId) { setHome(null); return; }
    let live = true;
    setHome(null);
    let q = supabase.from("seeds").select("*").eq("user_id", userId);
    if (isAdmin) q = q.eq("realm", realm);
    q.limit(1).then(async ({ data }) => {
      if (!live) return;
      if (data?.[0]) { setHome(data[0] as Seed); return; }
      // signed in without a village: guide straight into founding instead of leaving them on the map
      setAuthOpen(false);
      setTab("plant");
      const { data: u } = await supabase.auth.getUser();
      const meta = u.user?.user_metadata ?? {};
      const full = String(meta["full_name"] ?? meta["name"] ?? "").split(" ")[0]?.slice(0, 32) ?? "";
      if (live && full) setForm((f) => (f.owner ? f : { ...f, owner: full }));
    });
    return () => { live = false; };
  }, [userId, isAdmin, realm]);
  // letter texts are only readable once signed in: on phones the session often arrives after the map load
  useEffect(() => {
    if (!userId) return;
    // the account's last explicit language choice wins over browser detection
    supabase.auth.getUser().then(({ data }) => {
      const l = data.user?.user_metadata?.["lang"];
      if (typeof l === "string" && (LANGS as string[]).includes(l)) { setLang(l as Lang); localStorage.setItem("samenland-lang", l); }
    });
    supabase.from("letter_bodies").select("letter_id, body").then(({ data }) => { if (data?.length) setBodies((old) => ({ ...old, ...Object.fromEntries(data.map((b) => [b.letter_id, b.body])) })); });
  }, [userId]);
  // optional letter by email when a bought building is finished (sent by the scheduled build-mail route)
  const [mailOn, setMailOn] = useState(false);
  // optional letter when the village chest is nearly full (sent by the scheduled chest-mail route)
  const [chestMail, setChestMail] = useState(false);
  useEffect(() => {
    if (!userId) { setChestMail(false); return; }
    (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).from("chest_mail").select("enabled").eq("user_id", userId).maybeSingle().then(({ data }) => setChestMail(!!data?.enabled));
  }, [userId]);
  const toggleChestMail = async (on: boolean) => {
    if (!userId) return;
    setChestMail(on);
    const { error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).from("chest_mail").upsert({ user_id: userId, enabled: on, lang });
    if (error) setChestMail(!on);
  };
  useEffect(() => {
    if (!userId) { setMailOn(false); return; }
    // every visit restarts the 3-month inactivity countdown (see api/public/idle-sweep)
    (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).rpc("touch_activity", { _lang: lang }).then(() => {});
    (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).from("build_mail").select("enabled").eq("user_id", userId).maybeSingle().then(({ data }) => setMailOn(!!data?.enabled));
  }, [userId]);
  const toggleMail = async (on: boolean) => {
    if (!userId) return;
    setMailOn(on);
    const { error } = await (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).from("build_mail").upsert({ user_id: userId, enabled: on, lang });
    if (error) setMailOn(!on);
  };
  // admin rights follow the login, even when the session arrives after the first map load
  useEffect(() => {
    if (!userId) { setIsAdmin(false); return; }
    let live = true;
    supabase.from("user_roles").select("role").eq("user_id", userId).then(({ data }) => {
      if (!live) return;
      const adm = !!data?.some((x) => x.role === "admin");
      setIsAdmin(adm);
      const o = localStorage.getItem("samenland-realm") as Realm | null;
      // the map was loaded before the login arrived: swap to the admin's map in place
      if (adm && o && (REALMS.includes(o) || o === "lab") && o !== realmRef.current) loadRealmRef.current?.(o);
    });
    return () => { live = false; };
  }, [userId]);

  useEffect(() => {
    const saved = localStorage.getItem("samenland-lang");
    setLang(
      saved && (LANGS as string[]).includes(saved) ? (saved as Lang) : (LANGS.find((l) => navigator.language.toLowerCase().startsWith(l)) ?? "en"),
    );
    const vi = setInterval(() => {
      const cv = canvasRef.current, c = cam.current; if (!cv) return;
      const [x, y] = toTile(c.x, c.y);
      setView({ x, y, span: (cv.clientWidth / c.zoom) / 32 + (cv.clientHeight / c.zoom) / 16 });
    }, 500);
    // one canonical origin, so the stored login is always found
    if (location.hostname === "www.samenland.app") {
      location.replace("https://samenland.app" + location.pathname + location.search + location.hash);
    }
    // friend invite: remember the inviting village until the newcomer plants
    try { const ref = new URLSearchParams(location.search).get("ref"); if (ref && /^[0-9a-f-]{36}$/i.test(ref)) localStorage.setItem("samenland-ref", ref); } catch { /* ignore */ }
    // local session first: a slow/offline network (iPhone waking up) must never look like a logout
    supabase.auth.getSession().then(({ data }) => { if (data.session) setUserId(data.session.user.id); });
    // only an explicit sign-out clears the user: in the editor preview the session arrives
    // late over the editor handshake, and an empty INITIAL_SESSION must not look like a logout
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "SIGNED_OUT") { setUserId(null); return; }
      if (session?.user.id) setUserId(session.user.id);
    });
    // Safari pauses timers in background tabs: refresh the token as soon as the page is visible again
    const onVis = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.startAutoRefresh();
        supabase.auth.getSession().then(({ data }) => { if (data.session) setUserId(data.session.user.id); });
      } else supabase.auth.stopAutoRefresh();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onVis);
    (async () => {
      let r = detectRealm();
      let uid: string | null = null;
      let adminPick = false;
      try {
        // guests must never wait on auth: local session only, with a short cap
        const sess = await Promise.race([
          supabase.auth.getSession().then((x) => x.data.session),
          new Promise<null>((res) => setTimeout(() => res(null), 1500)),
        ]);
        uid = sess?.user.id ?? null;
        if (uid) {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
          const adm = !!roles?.some((x) => x.role === "admin");
          setIsAdmin(adm);
          const o = localStorage.getItem("samenland-realm") as Realm | null;
          if (adm && o && (REALMS.includes(o) || o === "lab")) { r = o; adminPick = true; }
          if (r === "lab") setLabJump(Number(localStorage.getItem("samenland-lab-jump") ?? 0));
          // an invite only steers newcomers: players with a village keep their own map
          const { data: mine } = await supabase.from("seeds").select("id").eq("user_id", uid).limit(1);
          if (mine?.length) localStorage.removeItem("samenland-ref");
        }
      } catch { /* play as guest */ }
      // invited newcomers land on their friend's map
      const refId = localStorage.getItem("samenland-ref");
      let refSeed: { id: string; realm: string; name: string } | null = null;
      if (refId && !adminPick) {
        const { data } = await supabase.from("seeds").select("id, realm, name").eq("id", refId).maybeSingle();
        if (data) { refSeed = data; if (REALMS.includes(data.realm as Realm)) r = data.realm as Realm; }
        else localStorage.removeItem("samenland-ref");
      }
      const loadRealm = async (r: Realm) => {
      if (!uid) uid = (await supabase.auth.getSession()).data.session?.user.id ?? null;
      setRealm(r);
      realmRef.current = r;
      setRealmState(r);
      if (r === "lab") setLabJump(Number(localStorage.getItem("samenland-lab-jump") ?? 0));
      const [a, b, bl, sg, pu] = await Promise.all([
        supabase.from("seeds").select("*").eq("realm", r).order("created_at"),
        supabase.from("plantings").select("*"),
        supabase.from("blessings").select("id, seed_id, created_at"),
        supabase.from("signposts").select("id, seed_id, target_id, user_id, message"),
        supabase.from("purchases").select("id, seed_id, item, cost, created_at, x, y"),
      ]);
      supabase.from("charters").select("id, seed_id, path, created_at").then(({ data }) => setCharters(data ?? []));
      supabase.from("encounters").select("id, seed_id, event, choice, cost, created_at").then(({ data }) => setEncounters(data ?? []));
      supabase.from("first_roads").select("id, seed_id, target_id, created_at").then(({ data }) => setFirstRoads(data ?? []));
      supabase.from("twin_votes").select("id, seed_id, partner_id, pact, created_at").then(({ data }) => setVotes(data ?? []));
      supabase.from("twin_works").select("id, seed_id, partner_id, work, cost, created_at").then(({ data }) => setWorks(data ?? []));
      supabase.from("gifts").select("id, from_seed, to_seed, kind, amount, note, created_at").then(({ data }) => setGifts((data ?? []) as Gift[]));
      supabase.from("letters").select("id, from_seed, to_seed, created_at").gte("created_at", new Date(Date.now() - 60 * 864e5).toISOString()).then(({ data }) => setLetters(data ?? []));
      supabase.from("letter_bodies").select("letter_id, body").then(({ data }) => setBodies((old) => ({ ...old, ...Object.fromEntries((data ?? []).map((b) => [b.letter_id, b.body])) })));
      const ss = (a.data ?? []) as Seed[];
      Promise.all([
        supabase.from("quest_claims").select("id, seed_id, quest, reward, created_at"),
        supabase.from("market_sales").select("id, seed_id, day, reward, created_at"),
        // signed-in only (RLS): guests would just get 401s
        uid ? supabase.from("referrals").select("id, referrer_seed, referee_seed, reward, created_at") : Promise.resolve({ data: [] as { id: string; referrer_seed: string; referee_seed: string; reward: number; created_at: string }[] }),
        uid ? supabase.from("village_visits").select("id, visitor_seed, visited_seed, reward, created_at") : Promise.resolve({ data: [] as { id: string; visitor_seed: string; visited_seed: string; reward: number; created_at: string }[] }),
        (supabase as unknown as { from: (t: string) => { select: (c: string) => PromiseLike<{ data: unknown[] | null }> } }).from("wonder_finds").select("id, seed_id, site, realm, first, reward, created_at"),
        (supabase as unknown as { from: (t: string) => { select: (c: string) => PromiseLike<{ data: unknown[] | null }> } }).from("princely_tasks").select("id, seed_id, step, task, reward, accepted_at, done_at"),
      ]).then(([q, m, rf, vv, wf, pt]) => {
        princelyRows.current = (pt.data ?? []) as PrincelyRow[]; setHeraldRows(princelyRows.current);
        loadErrands();
        (supabase as unknown as { from: (t: string) => { select: (c: string) => PromiseLike<{ data: { seed_id: string }[] | null }> } }).from("knighthoods").select("seed_id").then(({ data }) => { knights.current = new Set((data ?? []).map((k) => k.seed_id)); });
        // only this player's own visits mark a town as seen — other players' visits must not block the welcome gift
        { const me = ss.find((s) => uid && s.user_id === uid); for (const v of vv.data ?? []) if (me && v.visitor_seed === me.id) visitSeen.current.add(v.visited_seed); }
        wonderRows.current = (wf.data ?? []) as unknown as WonderFind[];
        syncWonders();
        setClaims([...(q.data ?? []), ...visitClaims(vv.data ?? []), ...wonderClaims(wonderRows.current), ...(m.data ?? []).map((x) => ({ id: x.id, seed_id: x.seed_id, quest: `market:${x.day}`, reward: x.reward, created_at: x.created_at }) as QuestClaim), ...referralClaims(rf.data ?? []), ...princelyClaims(princelyRows.current)]);
        setClaimsReady(true);
        // tell the inviter once when a friend has answered the call
        const mine = ss.find((s) => uid && s.user_id === uid);
        const got = (rf.data ?? []).filter((x) => mine && x.referrer_seed === mine.id);
        const seen = Number(localStorage.getItem("samenland-ref-seen") ?? 0);
        if (got.length > seen) {
          const last = ss.find((s) => s.id === got[got.length - 1]!.referee_seed);
          setMsg(tRef.current.invite.got(last?.name ?? "?"));
          localStorage.setItem("samenland-ref-seen", String(got.length));
        }
      });
      setBlessings(bl.data ?? []);
      setPurchases(pu.data ?? []);
      setSigns((sg.data ?? []) as Signpost[]);
      setSeeds(ss);
      setPlantings((b.data ?? []) as Planting[]);
      // visitors without a village first see the oldest (most grown) town of this map
      const oldest = [...ss].sort((p, q) => Date.parse(p.created_at) - Date.parse(q.created_at))[0];
      const own = ss.find((s) => uid && s.user_id === uid);
      const friend = refSeed ? ss.find((s) => s.id === refSeed!.id) : undefined;
      const my = own ?? friend ?? oldest;
      if (my) focus(my.x, my.y);
      else focus(MAP / 2, MAP / 2);
      if (!own && friend) setMsg(tRef.current.invite.welcome(friend.name));
      refSeed = null; // the welcome is only for the first map
      };
      loadRealmRef.current = loadRealm;
      await loadRealm(r);
    })();
    const ch = supabase
      .channel(`world-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seeds" }, (p) => {
        if ((p.new as { realm?: string }).realm !== realmRef.current) return;
        setSeeds((s) => (s.some((x) => x.id === (p.new as Seed).id) ? s : [...s, p.new as Seed]));
      },
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "plantings" }, (p) =>
        setPlantings((s) =>
          s.some((x) => x.id === (p.new as Planting).id) ? s : [...s, p.new as Planting],
        ),
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "purchases" }, (p) => {
        const n = p.new as Purchase;
        setPurchases((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "letters" }, (p) => {
        const n = p.new as LetterRow;
        setLetters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
        supabase.from("letter_bodies").select("letter_id, body").eq("letter_id", n.id).maybeSingle().then(({ data }) => { if (data) setBodies((b) => ({ ...b, [data.letter_id]: data.body })); });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "charters" }, (p) => {
        const n = p.new as { id: string; seed_id: string; path: string; created_at: string };
        setCharters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "encounters" }, (p) => {
        const n = p.new as EncRow;
        setEncounters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "first_roads" }, (p) => {
        const n = p.new as { id: string; seed_id: string; target_id: string; created_at: string };
        setFirstRoads((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gifts" }, (p) => {
        const g = p.new as Gift; setGifts((q) => (q.some((x) => x.id === g.id) ? q : [...q, g]));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "blessings" }, (p) => {
        const n = p.new as { id: string; seed_id: string; created_at: string };
        setBlessings((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "signposts" }, (p) => {
        if (p.eventType === "DELETE") return setSigns((s) => s.filter((x) => x.id !== (p.old as Signpost).id));
        const n = p.new as Signpost;
        setSigns((s) => [...s.filter((x) => x.id !== n.id), n]);
      })
      .subscribe();
    const iv = setInterval(() => tick((n) => n + 1), isLab() && LAB_SPEED > 1 ? 2000 : 30000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(iv);
      clearInterval(vi);
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onVis);
    };
  }, []);

  // render loop + input
  useEffect(() => {
    const cv = canvasRef.current!;
    // opaque canvas: the map always paints sky/sea edge to edge, so the compositor can skip alpha blending
    const ctx = cv.getContext("2d", { alpha: false })!;
    let raf = 0;
    const resize = () => {
      // phones: cap pixel density at 2 – DPR 3 screens otherwise push ~2.25x the pixels for no visible gain
      const touch = window.matchMedia("(pointer: coarse)").matches;
      dpr.current = Math.min(window.devicePixelRatio || 1, touch ? 2 : 3);
      cv.width = Math.ceil(cv.clientWidth * dpr.current);
      cv.height = Math.ceil(cv.clientHeight * dpr.current);
    };
    resize();
    window.addEventListener("resize", resize);
    let lastScene = 0;
    let panStep = () => {};
    const loop = () => {
      panStep(); // keyboard pan + fling share the draw frame (one rAF loop)
      const c = cam.current,
        tg = target.current;
      if (Math.abs(tg.zoom - c.zoom) > 0.0005) {
        const nz = c.zoom + (tg.zoom - c.zoom) * 0.16;
        const px = (tg.ax - cv.width / 2) / dpr.current,
          py = (tg.ay - cv.height / 2) / dpr.current;
        c.x += px / c.zoom - px / nz;
        c.y += py / c.zoom - py / nz;
        c.zoom = nz;
      }
      // keep the camera over the island, so far panning or fast wheel zoom never leaves the map
      c.x = Math.max(-MAP * 16, Math.min(MAP * 16, c.x)); c.y = Math.max(0, Math.min(MAP * 16, c.y));
      const s = st.current;
      const h = s.hover;
      const ok = h && s.mode === "seed" ? canPlant(h[0], h[1], s.seeds) === null : null;
      const t0 = performance.now();
      draw(ctx, cv.width, cv.height, dpr.current, c, s.seeds, s.plantings, clock(), h, ok);
      if (import.meta.env.DEV) {
        const ms = performance.now() - t0, p = perf.current;
        p.sum += ms; p.n++; p.max = Math.max(p.max, ms);
        if (t0 - p.t >= 500) {
          const el = perfRef.current;
          if (el) {
            const avg = p.sum / p.n, fps = (p.n * 1000) / (t0 - p.t);
            el.textContent = `${fps.toFixed(0)} fps · render ${avg.toFixed(1)} ms (max ${p.max.toFixed(1)}) · tiles ${renderStats.tiles} · folk ${renderStats.folk} · chunks ${renderStats.chunks} · zoom ${c.zoom.toFixed(2)}`;
            el.style.color = avg > 12 ? "#ff6b5a" : avg > 8 ? "#ffd166" : "#9be59b";
          }
          p.sum = 0; p.n = 0; p.max = 0; p.t = t0;
        }
      }
      drawBubble(ctx, cv, c, dpr.current);
      if (s.mode === "seed") {
        // drawn above the night grade, so the founding marker stays readable at midnight
        const z = c.zoom * dpr.current, k = Math.SQRT2;
        ctx.save();
        ctx.setTransform(z, 0, 0, z, cv.width / 2 - c.x * z, cv.height / 2 - c.y * z);
        const lw = 1.5 / c.zoom;
        for (const o of s.seeds) {
          const [ox, oy] = iso(o.x, o.y), R = MIN_SEED_DISTANCE;
          ctx.beginPath(); ctx.ellipse(ox, oy, R * 16 * k, R * 8 * k, 0, 0, 7);
          ctx.fillStyle = "rgba(170,50,40,0.16)"; ctx.fill();
          ctx.setLineDash([6 / c.zoom, 4 / c.zoom]); ctx.lineWidth = lw; ctx.strokeStyle = "rgba(200,70,55,0.75)"; ctx.stroke(); ctx.setLineDash([]);
        }
        if (h) {
          const [gx, gy] = iso(h[0], h[1]);
          ctx.globalCompositeOperation = "lighter";
          const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, 90);
          gr.addColorStop(0, "rgba(255,190,110,0.32)"); gr.addColorStop(1, "rgba(255,150,70,0)");
          ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(gx, gy, 90, 50, 0, 0, 7); ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          const col = ok ? "rgba(110,215,110,0.95)" : "rgba(235,85,70,0.95)";
          if (ok) { // first-year village reach
            ctx.beginPath(); ctx.ellipse(gx, gy, 5 * 16 * k, 5 * 8 * k, 0, 0, 7);
            ctx.fillStyle = "rgba(110,215,110,0.12)"; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = "rgba(110,215,110,0.7)"; ctx.stroke();
          }
          ctx.beginPath(); ctx.moveTo(gx, gy - 8); ctx.lineTo(gx + 16, gy); ctx.lineTo(gx, gy + 8); ctx.lineTo(gx - 16, gy); ctx.closePath();
          ctx.fillStyle = ok ? "rgba(110,215,110,0.3)" : "rgba(235,85,70,0.3)"; ctx.fill();
          ctx.lineWidth = 2.2 / c.zoom; ctx.strokeStyle = col; ctx.stroke();
          // founding stake with pennant
          ctx.fillStyle = "rgba(20,14,8,0.35)"; ctx.beginPath(); ctx.ellipse(gx, gy, 3, 1.2, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#6b4a2b"; ctx.fillRect(gx - 0.7, gy - 20, 1.4, 20);
          const wv = Math.sin(performance.now() / 300) * 1.5;
          ctx.beginPath(); ctx.moveTo(gx + 0.7, gy - 20); ctx.quadraticCurveTo(gx + 6, gy - 19 + wv, gx + 10, gy - 17 + wv); ctx.lineTo(gx + 0.7, gy - 14); ctx.closePath();
          ctx.fillStyle = ok ? "#c9a227" : "#a33a2c"; ctx.fill();
        }
        ctx.restore();
      }
      if (s.mode === "sapling") {
        const me = s.seeds.find((x) => x.id === s.mine);
        if (me) {
          const nowC = clock(), key = `${me.id}|${s.seeds.length}|${s.plantings.size}|${Math.floor(nowC / 5000)}`;
          if (sapCache.current.key !== key) sapCache.current = { key, spots: saplingSpots(me, s.seeds, (px, py) => s.plantings.has(`${px},${py}`), nowC) };
          const z = c.zoom * dpr.current, pulse = 0.75 + Math.sin(performance.now() / 500) * 0.25;
          ctx.save();
          ctx.setTransform(z, 0, 0, z, cv.width / 2 - c.x * z, cv.height / 2 - c.y * z);
          ctx.lineWidth = 1.2 / Math.max(0.5, c.zoom);
          for (const [sx, sy] of sapCache.current.spots) {
            const [gx, gy] = iso(sx, sy);
            ctx.beginPath(); ctx.moveTo(gx, gy - 7); ctx.lineTo(gx + 14, gy); ctx.lineTo(gx, gy + 7); ctx.lineTo(gx - 14, gy); ctx.closePath();
            ctx.fillStyle = `rgba(214,196,92,${0.28 * pulse})`; ctx.fill();
            ctx.strokeStyle = `rgba(120,150,50,${0.85 * pulse})`; ctx.stroke();
          }
          const hv = h ?? null;
          if (hv) {
            const good = sapCache.current.spots.some(([a, b]) => Math.hypot(a - hv[0], b - hv[1]) < 1.6);
            const [gx, gy] = iso(hv[0], hv[1]);
            ctx.globalAlpha = good ? 0.85 : 0.4;
            ctx.fillStyle = "#5e4630"; ctx.fillRect(gx - 0.6, gy - 9, 1.2, 9);
            ctx.fillStyle = good ? "#6f9a3a" : "#a33a2c"; ctx.beginPath(); ctx.arc(gx, gy - 11, 4, 0, 7); ctx.fill();
          }
          ctx.restore();
        }
      }
      const own = s.seeds.find((x) => x.id === s.mine);
      const gh = s.ghost ?? h;
      if (s.placing && gh && own) {
        // SimCity-style ghost: the building floats over the tile, tinted by whether it may stand there
        const good = canPlaceSpecial(s.placing, gh[0], gh[1], own, s.seeds, clock()) === null;
        const z = c.zoom * dpr.current, [gx, gy] = iso(gh[0], gh[1]);
        ctx.save();
        ctx.setTransform(z, 0, 0, z, cv.width / 2 - c.x * z, cv.height / 2 - c.y * z);
        ctx.beginPath(); ctx.moveTo(gx, gy - 8); ctx.lineTo(gx + 16, gy); ctx.lineTo(gx, gy + 8); ctx.lineTo(gx - 16, gy); ctx.closePath();
        ctx.fillStyle = good ? "rgba(90,190,90,0.45)" : "rgba(210,70,60,0.45)"; ctx.fill();
        ctx.lineWidth = 1 / Math.max(0.5, c.zoom); ctx.strokeStyle = good ? "rgba(40,120,40,0.9)" : "rgba(150,30,25,0.9)"; ctx.stroke();
        ctx.globalAlpha = good ? 0.8 : 0.45;
        drawBuildingSprite(ctx, SPECIAL_KIND[s.placing]!, gx, gy, 0.5);
        ctx.restore();
      }
      const nowMs = performance.now();
      if (soundRef.current && nowMs - lastScene > 250) {
        lastScene = nowMs;
        const hw = cv.clientWidth / 2 / c.zoom, hh = cv.clientHeight / 2 / c.zoom;
        const [tx, ty] = toTile(c.x, c.y), span = Math.min(200, Math.max(4, (hw / 16 + hh / 8) / 2));
        let forest = 0, water = 0, sea = 0, n = 0;
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
          const tr = terrain(Math.round(tx + (i * span) / 4), Math.round(ty + (j * span) / 4)); n++;
          if (tr === "forest") forest++; else if (tr === "water") water++; else if (tr === "deep") sea++;
        }
        const zn = Math.min(1, Math.max(0, (Math.log(c.zoom) - Math.log(MIN_ZOOM)) / (Math.log(5) - Math.log(MIN_ZOOM))));
        const talkers = lastPeople.filter((p) => p.q.talk !== null && p.q.talkTurn).length;
        const sources = lastSources.slice(0, 40).map((q) => {
          const dx = (q.x - c.x) / hw, dy = (q.y - c.y) / hh;
          return { k: q.k, pan: dx, near: Math.max(0, 1 - Math.hypot(dx, dy) * 0.8) };
        }).filter((q) => q.near > 0);
        setScene({ zoom: zn, forest: forest / n, water: water / n, sea: sea / n, people: lastPeople.length, talkers, sources });
      }
      raf = document.hidden ? 0 : requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // background tab: stop drawing entirely; resume with a fresh frame on return
    const onHide = () => { if (!document.hidden && !raf) raf = requestAnimationFrame(loop); };
    document.addEventListener("visibilitychange", onHide);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
      // every wheel / trackpad two-finger swipe zooms (laptop users pan by dragging); pinch (ctrl) is fine-grained,
      // deltas are capped per tick so one fast spin never slams the zoom
      const dy = Math.max(-80, Math.min(80, e.deltaY * unit)) * (e.ctrlKey ? 4 : 1);
      target.current = {
        zoom: Math.min(st.current.walk ? 20 : 12, Math.max(MIN_ZOOM, target.current.zoom * Math.exp(-dy * 0.0012))),
        ax: (e.clientX - r.left) * dpr.current,
        ay: (e.clientY - r.top) * dpr.current,
      };
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    // keyboard panning: WASD + arrow keys, smooth per frame
    const keys = new Set<string>();
    const KEYMAP: Record<string, [number, number]> = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
    const typing = (e: KeyboardEvent) => { const el = e.target as HTMLElement | null; return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable); };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!KEYMAP[k]) { hotkey.current(e); return; }
      e.preventDefault(); keys.add(k);
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const onBlur = () => keys.clear();
    let lastPan = performance.now(), walkDriven = false, liveSent = 0, liveOn = false, liveW = false;
    panStep = () => {
      const now = performance.now(), dt = Math.min(50, now - lastPan); lastPan = now;
      { const pd = panDelta.current; if (pd.dx || pd.dy) { cam.current.x -= pd.dx / cam.current.zoom; cam.current.y -= pd.dy / cam.current.zoom; pd.dx = 0; pd.dy = 0; } }
      if (st.current.walk) {
        // stroll mode: the keys steer the own mayor and the camera follows him softly
        const S = st.current, my = S.seeds.find((x) => x.id === S.mine);
        if (my) {
          let dx = 0, dy = 0;
          for (const k of keys) { const v = KEYMAP[k]; if (v) { dx += v[0]; dy += v[1]; } }
          const sk = stick.current, held = !!(sk.dx || sk.dy); dx += sk.dx; dy += sk.dy;
          const nw = clock(), tw = townOf(my, S.seeds, nw), me = tw.people.find((q) => q.role === "mayor");
          if (me) {
            setMounted(knights.current.has(my.id));
            if (keys.size || held) camFree.current = false;
            // steer only while a key/stick is held; one idle call on release stops the stride, so a later
            // click order is never overwritten by a lingering drive (which used to cancel every click)
            if (keys.size || held) { driveMayor(me, tw, S.seeds, nw, dx + dy, dy - dx, dt / 1000); walkDriven = true; }
            else if (walkDriven) { driveMayor(me, tw, S.seeds, nw, 0, 0, dt / 1000); walkDriven = false; }
            const q = poseOf(me, tw, S.seeds, nw), [ix, iy] = iso(q.x, q.y), k = 1 - Math.exp(-dt / 220);
            // live broadcast for other players: ~4/s while walking, a heartbeat every 3 s while standing
            if (liveCh.current && q.act === "stroll" && (now - liveSent > (q.walking ? 230 : 3000) || q.walking !== liveW)) {
              liveSent = now; liveOn = true; liveW = q.walking;
              void liveCh.current.send({ type: "broadcast", event: "pos", payload: { sid: my.id, x: +q.x.toFixed(2), y: +q.y.toFixed(2), dx: +q.dir[0].toFixed(2), dy: +q.dir[1].toFixed(2), w: q.walking, m: knights.current.has(my.id), d: +q.phase.toFixed(2) } });
            }
            for (const o of S.seeds) if (o.id !== my.id && !visitSeen.current.has(o.id) && Math.hypot(q.x - o.x, q.y - o.y) <= radiusOf((nw - Date.parse(o.created_at)) / 36e5)) { visitSeen.current.add(o.id); visitFn.current(o, my); }
            for (const w of wonders()) if (!wonderSeen.current.has(w.key) && Math.hypot(q.x - w.x, q.y - w.y) <= WONDER_REACH) { wonderSeen.current.add(w.key); wonderFn.current(w.key, w.kind, my); }
            { const near = atCourt(q.x, q.y); if (near !== courtNear.current) { courtNear.current = near; setNearCourt(near); } }
            { const ct = courtTask(my.id); const e = ct ? errandNear(worldHour(nw), nw, q.x, q.y, new Set(errandDone.current.filter((r) => r.task_id === ct.id).map((r) => r.errand))) : null; if (e !== errNear.current) { errNear.current = e; setNearErrand(e); } }
            { const gl = courtGoal.current; if (gl && (gl === "audience" ? courtNear.current : errNear.current === gl)) { courtGoal.current = null; courtArrive.current(gl); } }
            if (drag.current?.moved) camFree.current = true;
            if (!camFree.current) { cam.current.x += (ix - cam.current.x) * k; cam.current.y += (iy - 10 - cam.current.y) * k; }
            else {
              // map scrolled freely during the stroll: keep the glide, don't snap back to the mayor
              const f = fling.current;
              if (!drag.current && (f.vx || f.vy)) {
                cam.current.x -= (f.vx * dt) / cam.current.zoom; cam.current.y -= (f.vy * dt) / cam.current.zoom;
                const kk = Math.exp(-dt / 130); f.vx *= kk; f.vy *= kk;
                if (Math.hypot(f.vx, f.vy) < 0.01) { f.vx = 0; f.vy = 0; }
              }
            }
          }
        }
        return;
      }
      walkDriven = false;
      if (liveOn) { liveOn = false; liveSent = 0; const S = st.current; if (S.mine) void liveCh.current?.send({ type: "broadcast", event: "pos", payload: { sid: S.mine, bye: true } }); }
      { const g = glide.current;
        if (g && (keys.size || drag.current)) glide.current = null;
        else if (g) { const k = 1 - Math.exp(-dt / 160); cam.current.x += (g.x - cam.current.x) * k; cam.current.y += (g.y - cam.current.y) * k; if (Math.hypot(g.x - cam.current.x, g.y - cam.current.y) < 0.5) glide.current = null; } }
      if (keys.size) {
        let dx = 0, dy = 0;
        for (const k of keys) { const v = KEYMAP[k]; if (v) { dx += v[0]; dy += v[1]; } }
        const sp = (0.6 * dt) / cam.current.zoom; // screen px per ms, independent of zoom
        cam.current.x += dx * sp; cam.current.y += dy * sp;
      }
      const f = fling.current;
      if (!drag.current && (f.vx || f.vy)) {
        cam.current.x -= (f.vx * dt) / cam.current.zoom; cam.current.y -= (f.vy * dt) / cam.current.zoom;
        const k = Math.exp(-dt / 130);
        f.vx *= k; f.vy *= k;
        if (Math.hypot(f.vx, f.vy) < 0.01) { f.vx = 0; f.vy = 0; }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      cv.removeEventListener("wheel", onWheel);
    };
  }, []);

  const tileAt = (e: React.PointerEvent) => {
    const cv = canvasRef.current!,
      r = cv.getBoundingClientRect(),
      c = cam.current;
    const sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    return toTile((sx - r.width / 2) / c.zoom + c.x, (sy - r.height / 2) / c.zoom + c.y) as [
      number,
      number,
    ];
  };
  const drag = useRef<{ x: number; y: number; moved: boolean; t0?: number; touch?: boolean; sx?: number; sy?: number; ghost?: boolean } | null>(null);
  // inertia: screen px/ms of the last drag; decays in the pan loop
  const fling = useRef({ vx: 0, vy: 0, t: 0 });
  /** drag deltas (screen px) gathered between frames; applied once per rAF tick so pointer rate never fights the display rate */
  const panDelta = useRef({ dx: 0, dy: 0 });
  const lastTap = useRef({ t: 0, x: 0, y: 0 });
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mx: number; my: number } | null>(null);

  /** Villager under the pointer; hit radius is in screen pixels so it stays easy to tap at any zoom. */
  const personAt = (e: { clientX: number; clientY: number }): Person | null => {
    const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
    const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
    let best: Person | null = null, bd = Math.max(3, (coarse ? 34 : 16) / c.zoom);
    for (const f of lastPeople) { const dd = Math.hypot(f.x - wx, f.y - 2.5 - wy); if (dd < bd) { bd = dd; best = f.q.p; } }
    return best;
  };
  useEffect(() => { peopleFocus.sel = who ? pkey(who) : null; }, [who]);
  // ---- talking: tap a villager, court servant or house for a fitting local speech bubble ----
  const bVars = (town: string) => { const m = seeds.find((x) => x.id === mine); return { mayor: m?.owner ?? "", town }; };
  const isNight = () => { const hr = worldHour(clock()); return hr >= 22 || hr < 6; };
  const speak = (p: Person) => {
    if (p.role === "mayor") return;
    const nw = clock(), tw = townOf(p.seed, seeds, nw), q = poseOf(p, tw, seeds, nw);
    const own = p.seed.id === mine, child = p.role === "child" || p.age < 14, night = isNight() || q.act === "sleep";
    const myT = seeds.find((x) => x.id === mine)?.name ?? "";
    const text = own ? banter(lang, { who: "own", traits: traitsOf(p.id), child, sick: !!p.sick, night }, bVars(p.seed.name))
      : banter(lang, { who: "foreign", child, night }, bVars(myT));
    const f = lastPeople.find((o) => o.q.p === p);
    sayAt(text, f?.x ?? 0, f?.y ?? 0, 9, p.id, p.seed.id);
  };
  /** Clicked a court figure in stroll mode: servants count for the Hofdienst, prince/herald grant the audience; too far → walk there first. */
  const courtAct = (role: string, x: number, y: number) => {
    if (!walk || !my || my.user_id !== userId) return;
    const ct = courtTask(my.id);
    const errand = (role === "gardener" || role === "groom") && ct && !errandDone.current.some((r) => r.task_id === ct.id && r.errand === role) ? role as Errand : null;
    const aud = role === "prince" || role === "princess" || role === "herald";
    if (!errand && !aud) return;
    if (errand && errNear.current === errand) { void doErrand(my.id, errand); return; }
    if (aud && courtNear.current) { setAudience(audienceHost(worldHour(clock()))); jingle("fanfare"); return; }
    const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor");
    if (!me) return;
    const c = aud ? courtCenter() : { x, y };
    const offs: [number, number][] = [];
    for (let r = 0; r <= (aud ? 8 : 2); r++) for (let ox = -r; ox <= r; ox++) for (let oy = -r; oy <= r; oy++) if (Math.max(Math.abs(ox), Math.abs(oy)) === r) offs.push([ox, oy]);
    for (const [ox, oy] of offs) {
      if (commandMayor(me, tw, seeds, nw, [Math.round(c.x) + ox, Math.round(c.y) + oy])) { courtGoal.current = errand ?? "audience"; camFree.current = false; return; }
    }
  };
  const courtAt = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
    const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
    const bd = Math.max(3, (coarse ? 34 : 16) / c.zoom);
    for (const q of courtPoses(worldHour(clock()), clock())) {
      const [ix, iy] = iso(q.x, q.y);
      if (Math.hypot(ix - wx, iy - 2.5 - wy) < bd) { courtAct(q.role, q.x, q.y); sayAt(banter(lang, { who: "court", role: q.role, night: isNight() }, bVars(seeds.find((x) => x.id === mine)?.name ?? "")), ix, iy, 10); return true; }
    }
    return false;
  };
  const knock = (ins: Inspect) => {
    if (!isHomeKind(ins.kind) || ins.build !== null) return false;
    const nw = clock(), tw = townOf(ins.seed, seeds, nw);
    const home = ins.residents.some((p) => { const a = poseOf(p, tw, seeds, nw).act; return a === "home" || a === "sleep" || a === "sick"; });
    const own = ins.seed.id === mine, [ix, iy] = iso(ins.x, ins.y);
    sayAt(banter(lang, { who: "house", own, home, night: isNight() }, bVars(own ? ins.seed.name : seeds.find((x) => x.id === mine)?.name ?? "")), ix, iy, 22);
    return true;
  };
  /** Stroll mode: talk to whoever/whatever lies under the tap; true when something answered. */
  const talkTo = (e: React.PointerEvent) => {
    { const [tx, ty] = tileAt(e);
      for (const [sid, d] of dogSpots) if (Math.hypot(d.x - tx, d.y - ty) < 0.9) {
        const dt = DOG[lang], n = dogNames.get(sid) ?? dt.unnamed, ls = dt.lines(n), [wx, wy] = dogIso(d.x, d.y);
        sayAt(isNight() ? dt.sleepy(n) : ls[Math.floor(Math.random() * ls.length)]!, wx, wy, 5); tap(); return true;
      } }
    const p = personAt(e);
    if (p && p.role === "mayor" && p.seed.id !== mine && p.seed.user_id && userId) { setDmPeer(p.seed.user_id); setTavernOpen(true); return true; }
    if (p && p.role !== "mayor") { hm(); speak(p); return true; }
    if (courtAt(e)) { tap(); return true; }
    // knock only when the house itself was clicked; paths and meadows beside it send the mayor there
    const [tx, ty] = tileAt(e), ins = inspectAt(tx, ty, seeds, clock());
    if (ins && ins.x === tx && ins.y === ty && knock(ins)) { tap(); return true; }
    return false;
  };
  useEffect(() => { if (who || place) buzz(); }, [who, place]); // haptic tick when a sheet opens
  const onClick = async (x: number, y: number) => {
    setMsg(null);
    if (mode === "seed") {
      if (!userId) return setMsg(t.signInToPlant);
      if (!form.name.trim() || !form.owner.trim() || !form.gender) return setMsg(t.needNames);
      const err = canPlant(x, y, seeds);
      if (err) return setMsg(plantError(t, err));
      setPlantAsk([x, y]);
    } else if (mode === "sapling") {
      const my = seeds.find((s) => s.id === mine);
      const kind = my ? saplingsOwed(my.decisions ?? [], plantings.filter((p) => p.seed_id === my.id))[0] : undefined;
      if (!my || !kind) return setMode("look");
      // forgiving tap: snap to the nearest highlighted meadow within ~1.5 tiles
      const spots = saplingSpots(my, seeds, (px, py) => plantings.some((p) => p.x === px && p.y === py), clock());
      let pick: [number, number] | null = null, pd = 1.6;
      for (const sp of spots) { const d = Math.hypot(sp[0] - x, sp[1] - y); if (d < pd) { pd = d; pick = sp; } }
      if (!pick) return setMsg(spots.length && Math.hypot(x - my.x, y - my.y) > radiusOf(effAge(my, seeds, clock())) + 3 ? t.nearOnly : t.sapling.bad);
      [x, y] = pick;
      const { data } = await supabase.from("plantings").insert({ seed_id: my.id, kind, x, y }).select().single();
      if (!data) return setMsg(t.sapling.bad);
      setPlantings((p) => [...p, data as Planting]);
      setMode("look"); setMsg(t.sapling.planted); jingle("fanfare");
    } else if (mode === "tree" || mode === "flower" || mode === "lantern") {
      const my = seeds.find((s) => s.id === mine);
      if (!my) return;
      if (Math.hypot(x - my.x, y - my.y) > radiusOf(effAge(my, seeds, clock())) + 3)
        return setMsg(t.nearOnly);
      if (!buildable(terrain(x, y))) return setMsg(t.noGrow);
      const { data } = await supabase
        .from("plantings")
        .insert({ seed_id: my.id, kind: mode, x, y })
        .select()
        .single();
      if (data) setPlantings((p) => [...p, data as Planting]);
    }
  };

  /** Planting only after the player confirms the spot on the parchment. */
  const plantNow = async () => {
    if (!plantAsk || !userId) return;
    const [x, y] = plantAsk;
    setPlanting(true);
    const { data, error } = await supabase
      .from("seeds")
      .insert({ name: form.name.trim(), owner: form.owner.trim(), mayor_gender: form.gender || null, x, y, hue: Math.floor(Math.random() * 360), user_id: userId, realm })
      .select()
      .single();
    setPlanting(false);
    // whatever the outcome, the seed is no longer held in the hand
    setPlantAsk(null);
    setPtr(null);
    setHover(null); st.current.hover = null;
    setMode("look");
    if (error?.code === "23505") { setTab(null); return setMsg(t.alreadyHave); }
    if (error || !data) return setMsg(t.plantFail);
    setHome(data as Seed);
    setSeeds((s) => [...s, data as Seed]);
    setTab(null);
    focus(x, y);
    setMsg(t.planted(data.name)); jingle("fanfare");
    if (!localStorage.getItem(`samenland-intro-seen-${data.id}`)) { localStorage.setItem(`samenland-intro-seen-${data.id}`, "1"); setIntroOpen(true); }
    // invited newcomer: both villages receive the friend bonus (checked by the database)
    const ref = localStorage.getItem("samenland-ref");
    if (ref) {
      localStorage.removeItem("samenland-ref");
      const { error: re } = await supabase.rpc("claim_referral", { _seed: data.id, _ref: ref });
      if (!re) {
        const now0 = new Date().toISOString();
        setClaims((c) => [...c, ...referralClaims([{ id: `local-${data.id}`, referrer_seed: ref, referee_seed: data.id, reward: 50, created_at: now0 }])]);
        setMsg(`${t.planted(data.name)} ${t.quests.got(50)}`); setTimeout(() => jingle("coins"), 900);
      }
    }
  };

  const my = seeds.find((s) => s.id === mine);
  const treasuryFn = useServerFn(settleTreasury);
  const [accounting, setAccounting] = useState<Awaited<ReturnType<typeof settleTreasury>> | null>(null);
  const accountingSeed = useRef<string | null>(null);
  accountingSeed.current = my?.id ?? null;
  const refreshTreasury = async () => {
    if (!my || !userId || my.user_id !== userId) return false;
    const id = my.id;
    try {
      let result = await treasuryFn({ data: { seed: id } });
      for (let batch = 0; !result.settled && batch < 7; batch++) result = await treasuryFn({ data: { seed: id } });
      if (accountingSeed.current === id) setAccounting(result);
      return result.settled;
    } catch {
      return false;
    }
  };
  useEffect(() => {
    if (!my || !userId || my.user_id !== userId) { setAccounting(null); return; }
    void refreshTreasury();
    const timer = setInterval(() => { void refreshTreasury(); }, 60000);
    return () => clearInterval(timer);
    // Refresh from authoritative rows, never from pointer/camera changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [my, userId, purchases, gifts, claims, encounters, works]);
  const prepareSpend = async () => {
    if (!accounting?.active) return true;
    if (await refreshTreasury()) return true;
    setMsg(t.buyFail); return false;
  };
  const startWalk = () => { if (!my) return; setTab(null); setWho(null); setPlace(null); setPlacing(null); const cv = canvasRef.current; target.current = { zoom: 16, ax: (cv?.width ?? 0) / 2, ay: (cv?.height ?? 0) / 2 }; setWalk(true); };
  const wasWalk = useRef(false);
  useEffect(() => { setStrollHold(walk); if (wasWalk.current && !walk) { if (my) { const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor"); if (me) parkMayor(me, tw, seeds, nw); } target.current = { ...target.current, zoom: Math.min(12, target.current.zoom) }; } wasWalk.current = walk; }, [walk]);
  const findMayor = () => {
    if (!my) return; const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor"); if (!me) return focus(my.x, my.y);
    const z = poseOf(me, tw, seeds, nw);
    // camera far from the mayor: activate him in place, so the player picks a goal without losing the view
    const [ix, iy] = iso(z.x, z.y), c = cam.current, cv = canvasRef.current;
    const off = Math.hypot((ix - c.x) * c.zoom, (iy - c.y) * c.zoom), half = Math.min(cv?.clientWidth ?? 800, cv?.clientHeight ?? 600) * 0.4;
    if (!walk && off > half) { setTab(null); setWho(null); setPlace(null); setPlacing(null); camFree.current = true; setWalk(true); return; }
    camFree.current = false; focus(z.x, z.y); setPlace(null); if (!walk) setWho(me);
  };
  const myCharter = my ? charters.find((c) => c.seed_id === my.id)?.path : undefined;
  const sealCharter = async () => {
    if (!my || !userId || !charterPick) return;
    const { data, error } = await supabase.from("charters").insert({ seed_id: my.id, user_id: userId, path: charterPick }).select("id, seed_id, path, created_at").single();
    if (error || !data) return setMsg(t.charter.fail);
    setCharters((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setCharterOpen(false); setMsg(t.charter.sealed(t.charter.paths[charterPick]![0]));
  };
  const myRoad = my ? firstRoads.find((f) => f.seed_id === my.id) : undefined;
  const openRoad = () => { const cs = my ? roadCandidates(my, seeds) : []; setRoadPick(cs.length === 1 ? cs[0]!.id : null); setTab(null); setRoadOpen(true); };
  const joinRoad = async (target: string) => {
    if (!my || !userId) return;
    const { data, error } = await supabase.from("first_roads").insert({ seed_id: my.id, user_id: userId, target_id: target }).select("id, seed_id, target_id, created_at").single();
    if (error || !data) return setMsg(error?.message?.includes("under construction") ? t.road.busyFail : t.road.fail);
    setFirstRoads((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setMsg(t.road.joined(seeds.find((s) => s.id === target)?.name ?? ""));
  };
  const sealRoad = async () => {
    if (!my || !userId || !roadPick) return;
    const { data, error } = await supabase.from("first_roads").insert({ seed_id: my.id, user_id: userId, target_id: roadPick }).select("id, seed_id, target_id, created_at").single();
    if (error || !data) return setMsg(error?.message?.includes("under construction") ? t.road.busyFail : t.road.fail);
    setFirstRoads((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setRoadOpen(false); setMsg(t.road.sealed(seeds.find((s) => s.id === roadPick)?.name ?? ""));
  };
  const decide = async (event: string, choice: string) => {
    if (!my || !userId) return;
    if (!await prepareSpend()) return;
    const { data, error } = await supabase.from("encounters").insert({ seed_id: my.id, user_id: userId, event, choice }).select("id, seed_id, event, choice, cost, created_at").single();
    if (error || !data) return setMsg(t.enc.fail);
    setEncounters((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    bell(0); setEncOpen(false);
    if (event === "nursery" && choice !== "pass") { setMode("sapling"); setMsg(t.sapling.hint); } else setMsg(t.enc.done);
  };
  const twinsOfMine = my ? twinLinks(my, seeds, clock()).map((l) => (l.a.id === my.id ? l.b : l.a)) : [];
  const pactPartner = twinsOfMine.find((o) => pactPending(my!, o, seeds, clock()) === "vote") ?? null;
  const sealPact = async () => {
    if (!my || !userId || !pactPartner || !pactPick) return;
    const { data, error } = await supabase.from("twin_votes").insert({ seed_id: my.id, partner_id: pactPartner.id, user_id: userId, pact: pactPick }).select("id, seed_id, partner_id, pact, created_at").single();
    if (error || !data) return setMsg(t.twin.fail);
    setVotes((v) => [...v, data]); bell(0); setPactOpen(false);
  };
  const payWork = async (o: Seed, work: WorkKind) => {
    if (!my || !userId) return;
    if (!await prepareSpend()) return;
    const { data, error } = await supabase.from("twin_works").insert({ seed_id: my.id, partner_id: o.id, user_id: userId, work }).select("id, seed_id, partner_id, work, cost, created_at").single();
    if (error || !data) return setMsg(t.twin.poor);
    setWorks((w) => [...w, data]); tap();
  };
  const myStats = my ? townStats(my, seeds, clock()) : null;
  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("samenland-lang", l);
    // signed-in players keep their choice on every device
    if (userId) void supabase.auth.updateUser({ data: { lang: l } });
  };
  const emailAuth = async () => {
    setMsg(null);
    const { email, password, signup } = auth;
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return setMsg(error.message);
      if (!data.session) setMsg(t.checkMail);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(t.authFail);
    }
  };
  const oauth = async (p: "google" | "apple") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r?.error) setMsg(t.authFail);
  };

  const now = clock();
  const owner = !!my && !!userId && my.user_id === userId;
  const decision = pickDecision({
    road: owner && !myRoad && !links(seeds).some((l) => l.a.id === my!.id || l.b.id === my!.id) && roadCandidates(my!, seeds).length > 0,
    charter: owner && !myCharter && charterReady(my!.created_at, now),
    pact: owner && !!pactPartner,
    // visitors only come while someone watches: the tab must have been open and visible for a few minutes
    encounter: owner && watching && !!pendingEncounter(my!, my!.decisions ?? [], now),
  }, (k) => (snooze[k] ?? 0) > now);
  const anyOpen = roadOpen || charterOpen || encOpen || pactOpen;
  const sealShown = !anyOpen && !decision.open && decision.due.length > 0;
  function later(k: DecisionKind) {
    setSnooze((m) => ({ ...m, [k]: Date.now() + 3.6e6 }));
    if (k === "road") setRoadOpen(false); else if (k === "charter") setCharterOpen(false); else if (k === "pact") setPactOpen(false); else setEncOpen(false);
  }
  function reopen() { setSnooze({}); }
  // Village chronicle: derived from time since the last visit (per village, per device)
  const [chron, setChron] = useState<Chronicle | null>(null);
  const [chronOpen, setChronOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [tavernOpen, setTavernOpen] = useState(false);
  const [dmPeer, setDmPeer] = useState<string | null>(null);
  const [chatUnread, setChatUnread] = useState(0);
  const [rollOpen, setRollOpen] = useState(false);
  // the tutorial parchment greets every visitor on their very first page load,
  // signed in or not, as soon as the loading screen has stepped aside
  const openGuide = () => {
    if (localStorage.getItem("samenland-guide-seen")) return;
    localStorage.setItem("samenland-guide-seen", "1");
    setWelcome(true);
  };
  useEffect(() => { if (splashDone()) openGuide(); }, []);
  const [chronBanner, setChronBanner] = useState(false);
  const [scribe, setScribe] = useState<string | null | undefined>(undefined);
  const askScribe = useServerFn(scribeGreeting);
  const chronDone = useRef<string | null>(null);
  const myCharterPath = (s: typeof my) => s?.charter?.path;
  const titleName = (k: number) => (myCharterPath(my) ? t.office.names[myCharterPath(my)!]?.[k] : undefined) ?? t.office.title;
  const itemName = (item: string) => { if (/^title[1-3]$/.test(item)) return titleName(+item.slice(5) - 1); const mk = monumentOf(item); return t.items[item]?.[0] ?? (mk ? t.items[`${mk}1`]![0] : item); };
  const chronLine = (e: ChronEvent) => e.code === "stage" ? t.chron.stage(t.stages[e.stage] ?? "") : e.code === "built" ? t.chron.built(t.kind[e.kind] ?? e.kind) : e.code === "bought" ? t.chron.built(itemName(e.item)) : e.code === "road" ? t.chron.road(e.other) : e.code === "twin" ? t.chron.twin(e.other) : e.code === "house" ? t.chron.house(t.kind[e.kind] ?? e.kind) : e.code === "family" ? t.chron.family : e.code === "houses" ? t.chron.houses(e.n) : e.code === "families" ? t.chron.families(e.n) : e.code === "wedding" ? t.chron.wedding(e.a, e.b) : e.code === "fire" ? (e.guarded ? t.chron.fireOut : t.chron.fire(e.dead)) : e.code === "flood" ? t.chron.flood : e.code === "raid" ? (e.caught ? t.chron.caught : t.chron.raid(e.loss)) : e.code === "journeyman" ? t.chron.journeyman(e.name, t.job[e.craft]?.[e.sex === "f" ? 0 : 1] ?? e.craft, e.other) : e.code === "journeymen" ? t.chron.journeymen(e.n) : e.code === "bride" ? t.chron.bride(e.name, e.other, e.away) : e.code === "moved" ? t.chron.moved(e.name, e.other, e.away) : e.code === "letter" ? t.chron.letter(e.other) : t.chron.season(t.seasons[e.season]);
  useEffect(() => {
    if (!owner || !my || seeds.length === 0 || chronDone.current === my.id) return;
    chronDone.current = my.id;
    const k = `samenland-seen-${my.id}`, now = clock(), last = Number(localStorage.getItem(k) ?? 0);
    localStorage.setItem(k, String(now));
    const save = () => localStorage.setItem(k, String(clock()));
    window.addEventListener("pagehide", save);
    if (!last) return;
    const gap = now - last;
    if (gap < CHRON_BANNER) return;
    const c = chronicle(my, seeds, last, now);
    setChron(c);
    if (gap >= CHRON_LETTER) {
      setChronOpen(true);
      const facts = [...c.events.filter((e) => e.code !== "season").slice(-8).map(chronLine), t.chron.pop(c.popFrom, c.popTo), t.chron.taler(c.taler)];
      askScribe({ data: { lang, town: my.name, days: Math.floor(gap / 864e5), facts } }).then((r) => setScribe(r.text)).catch(() => setScribe(null));
    } else { setChronBanner(true); setScribe(null); }
  }, [owner, my?.id, seeds.length]);
  // Live celebrations: while the player watches, newly derived milestones open an illustrated parchment.
  const [fest, setFest] = useState<ChronEvent[]>([]);
  // mayor visits: the first walk into a neighbour town brings a welcome gift scaled by its size
  const visitSeen = useRef(new Set<string>());
  const visitFn = useRef<(o: Seed, my: Seed) => void>(() => {});
  const [visitNote, setVisitNote] = useState<string | null>(null);
  // audience at the prince's seat: offered while the strolling mayor stands on the estate
  const courtNear = useRef(false);
  /** Court figure the mayor was sent to by a click; acted on when he arrives. */
  const courtGoal = useRef<Errand | "audience" | null>(null);
  const courtArrive = useRef<(g: Errand | "audience") => void>(() => {});
  /** Stroll mode: the player scrolled the map away; the camera stops following until the mayor is sent off again. */
  const camFree = useRef(false);
  const [nearCourt, setNearCourt] = useState(false);
  const [audience, setAudience] = useState<AudienceHost | null>(null);
  const princelyRows = useRef<PrincelyRow[]>([]);
  // Hofdienst: errands done for the open "court" decree (owner-only rows, mirrors DB princely_errand)
  const errandDone = useRef<{ task_id: string; errand: string }[]>([]);
  const errNear = useRef<Errand | null>(null);
  const [nearErrand, setNearErrand] = useState<Errand | null>(null);
  const [errandNote, setErrandNote] = useState<string | null>(null);
  const [, bumpErrand] = useState(0);
  const courtTask = (seedId: string) => { const o = openTaskOf(princelyRows.current, seedId); return o && o.task === "court" ? o : null; };
  const loadErrands = () => {
    (supabase as unknown as { from: (t: string) => { select: (c: string) => PromiseLike<{ data: { task_id: string; errand: string }[] | null }> } }).from("princely_errands").select("task_id, errand")
      .then(({ data }) => { errandDone.current = data ?? []; errNear.current = null; bumpErrand((n) => n + 1); });
  };
  const doErrand = async (seedId: string, e: Errand) => {
    const P = PRINCELY[lang], ct = courtTask(seedId);
    if (!ct) return;
    const rpc = supabase.rpc.bind(supabase) as unknown as (f: string, a: Record<string, string>) => PromiseLike<{ data: number | null; error: unknown }>;
    const { data, error } = await rpc("princely_errand", { _seed: seedId, _errand: e });
    if (error || data == null || data < 0) { setErrandNote(P.fail); return; }
    if (!errandDone.current.some((r) => r.task_id === ct.id && r.errand === e)) errandDone.current = [...errandDone.current, { task_id: ct.id, errand: e }];
    errNear.current = null; setNearErrand(null); bumpErrand((n) => n + 1);
    setErrandNote(P.errand[e][1] + (data >= ERRANDS.length ? " " + P.errandReady : ""));
    jingle(data >= ERRANDS.length ? "fanfare" : "coins");
  };
  courtArrive.current = (gl) => { if (!my) return; if (gl === "audience") { setAudience(audienceHost(worldHour(clock()))); jingle("fanfare"); } else void doErrand(my.id, gl); };
  const knights = useRef<Set<string>>(new Set());
  const [, bumpKnight] = useState(0);
  // live strolling mayors: one shared broadcast room per realm, purely ephemeral (no table writes)
  useEffect(() => {
    const ch = supabase.channel(`mayors:${realm}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "pos" }, ({ payload }) => {
      const m = payload as { sid?: string; x?: number; y?: number; dx?: number; dy?: number; w?: boolean; m?: boolean; d?: number; bye?: boolean };
      if (typeof m.sid !== "string" || m.sid === st.current.mine) return;
      if (m.bye) return setRemoteMayor(m.sid, null);
      if (![m.x, m.y, m.dx, m.dy, m.d].every((v) => typeof v === "number" && Number.isFinite(v))) return;
      if (m.x! < 0 || m.y! < 0 || m.x! > MAP || m.y! > MAP) return;
      setRemoteMayor(m.sid, { x: m.x!, y: m.y!, dir: [m.dx!, m.dy!], walking: !!m.w, mounted: !!m.m, dist: m.d! });
    }).subscribe();
    liveCh.current = ch;
    return () => { liveCh.current = null; clearRemoteMayors(); supabase.removeChannel(ch); };
  }, [realm]);
  const kneel = async (seedId: string, female: boolean) => {
    const P = PRINCELY[lang];
    const rpc = supabase.rpc.bind(supabase) as unknown as (f: string, a: Record<string, string>) => PromiseLike<{ data: string | null; error: unknown }>;
    const { data, error } = await rpc("princely_knight", { _seed: seedId });
    if (error || !data) { setDecree(P.fail); return; }
    if (data === "not_yet") { setDecree(P.notYet); return; }
    knights.current = new Set([...knights.current, seedId]); bumpKnight((n) => n + 1);
    setDecree(P.dubbed(P.sir(female))); jingle("fanfare");
  };
  const [decree, setDecree] = useState<string | null>(null);
  /** Courier: the prince's messenger rides into the own village, so decrees no longer need a trip to court (DB princely_audience has no location check). */
  const [herald, setHerald] = useState(false);
  const [, bumpHerald] = useState(0);
  /** Is the messenger in the village (riding in or waiting)? Derived by heraldVisit, the same visit the map draws. */
  const heraldDue = (seedId: string) => { const v = heraldVisit(princelyRows.current, seedId, Date.now()); return !!v && v.phase !== "leave"; };
  const openHerald = () => { setDecree(null); setHerald(true); jingle("fanfare"); };
  /** Tap on the own village's messenger (screen spot from the last frame). */
  const heraldHit = (e: { clientX: number; clientY: number }) => {
    const me = my && my.user_id === userId ? heraldSpots.get(my.id) : undefined; if (!me || !canvasRef.current) return false;
    const r = canvasRef.current.getBoundingClientRect(), c = cam.current;
    const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
    return Math.hypot(me.x - wx, me.y - 6 - wy) < Math.max(7, 18 / c.zoom);
  };
  const askDecree = async (seedId: string) => {
    const P = PRINCELY[lang];
    const rpc = supabase.rpc.bind(supabase) as unknown as (f: string, a: Record<string, string>) => PromiseLike<{ data: string | null; error: unknown }>;
    const { data, error } = await rpc("princely_audience", { _seed: seedId });
    if (error || !data) { setDecree(P.fail); return; }
    const sel = (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => PromiseLike<{ data: unknown[] | null }> } } }).from("princely_tasks").select("id, seed_id, step, task, reward, accepted_at, done_at").eq("seed_id", seedId);
    const rows = ((await sel).data ?? []) as PrincelyRow[];
    const prevDone = new Set(princelyRows.current.filter((r) => r.done_at).map((r) => r.id));
    princelyRows.current = [...princelyRows.current.filter((r) => r.seed_id !== seedId), ...rows]; setHeraldRows(princelyRows.current);
    const fresh = rows.filter((r) => r.done_at && !prevDone.has(r.id));
    if (fresh.length) { setClaims((c) => [...c, ...princelyClaims(fresh)]); jingle("coins"); }
    const open = openTaskOf(rows, seedId), last = [...rows].sort((a, b) => b.step - a.step)[0];
    const txt = (k: string) => (open && k === open.task && k !== "court" ? edictText(lang, open.step) : null) ?? P.task[k as PrincelyKind] ?? k;
    setDecree(data === "done" ? P.done(last?.reward ?? 0) : data === "new" && open ? P.newTask(txt(open.task), open.reward) : data === "open" && open ? P.open(txt(open.task)) : data === "all" ? P.all : P.rest);
    if (data === "done" || data === "new") bumpHerald((n) => n + 1);
  };
  const swapDecree = async (seedId: string) => {
    const P = PRINCELY[lang];
    const rpc = supabase.rpc.bind(supabase) as unknown as (f: string, a: Record<string, string>) => PromiseLike<{ data: string | null; error: unknown }>;
    const { data, error } = await rpc("princely_swap", { _seed: seedId });
    if (error || !data) { setDecree(P.fail); return; }
    if (data === "swapped") { princelyRows.current = princelyRows.current.map((r) => r.seed_id === seedId && !r.done_at ? { ...r, task: "court", accepted_at: new Date().toISOString() } : r); errNear.current = null; bumpErrand((n) => n + 1); setHeraldRows(princelyRows.current); }
    setDecree(data === "swapped" ? P.swapped : data === "wait" ? P.wait : P.open(P.task.court));
  };
  useEffect(() => { if (!audience && !herald) setDecree(null); }, [audience, herald]);
  useEffect(() => { if (!walk) { courtGoal.current = null; courtNear.current = false; setNearCourt(false); setAudience(null); errNear.current = null; setNearErrand(null); } }, [walk]);
  useEffect(() => { if (!errandNote) return; const h = setTimeout(() => setErrandNote(null), 9000); return () => clearTimeout(h); }, [errandNote]);
  useEffect(() => { if (!visitNote) return; const h = setTimeout(() => setVisitNote(null), 9000); return () => clearTimeout(h); }, [visitNote]);
  visitFn.current = (o, my) => {
    if (!owner || my.user_id !== userId) { visitSeen.current.delete(o.id); return; }
    supabase.rpc("claim_visit", { _seed: my.id, _visited: o.id }).then(({ data, error }) => {
      if (error || !data) return;
      const now0 = new Date().toISOString();
      setClaims((c) => [...c, ...visitClaims([{ id: `local-v-${o.id}`, visitor_seed: my.id, visited_seed: o.id, reward: data, created_at: now0 }])]);
      jingle("fanfare"); setTimeout(() => jingle("coins"), 700);
      // shown as its own parchment so it stays visible during the stroll (normal HUD is hidden there)
      setVisitNote(t.visit.got(o.name, data));
    });
  };
  // wonders in the wild: the first village on a map is named in the summit book, every later one still gets its own find
  const wonderRows = useRef<WonderFind[]>([]);
  const wonderSeen = useRef(new Set<string>());
  const wonderFn = useRef<(key: string, kind: string, my: Seed) => void>(() => {});
  const syncWonders = () => {
    const mine = st.current.seeds.find((s) => userId && s.user_id === userId);
    const own = new Set(wonderRows.current.filter((r) => mine && r.seed_id === mine.id).map((r) => r.site));
    wonderSeen.current = new Set(own); setWonderFound(own);
  };
  useEffect(() => { syncWonders(); }, [my?.id, userId]);
  wonderFn.current = (key, kind, my) => {
    if (!owner || my.user_id !== userId) { wonderSeen.current.delete(key); return; }
    (supabase.rpc.bind(supabase) as unknown as (f: string, a: Record<string, string>) => PromiseLike<{ data: number | null; error: unknown }>)("claim_wonder", { _seed: my.id, _site: key }).then(({ data, error }) => {
      if (error || !data) {
        const P = PRINCELY[lang], o = openTaskOf(princelyRows.current, my.id);
        if (error) {
          wonderSeen.current.delete(key);
          if (/too many/.test(String((error as { message?: string }).message ?? ""))) {
            // daily limit: keep the site quiet until reload so the note isn't repeated every frame
            wonderSeen.current.add(key);
            setVisitNote(o && o.task === "wonder" ? `${P.tired} ${P.ready}` : P.tired);
          }
        } else {
          // reward 0: this village already logged the site — say so instead of staying silent
          setVisitNote(P.seen);
        }
        return;
      }
      const realm = my.realm ?? "europe", before = firstFinder(wonderRows.current, key, realm);
      const row: WonderFind = { id: `local-w-${key}`, seed_id: my.id, site: key, realm, first: !before, reward: data, created_at: new Date().toISOString() };
      wonderRows.current = [...wonderRows.current, row]; syncWonders();
      setClaims((c) => [...c, ...wonderClaims([row])]);
      jingle("fanfare"); setTimeout(() => jingle("coins"), 700);
      const name = t.wonder.names[kind] ?? kind;
      const fs = before ? st.current.seeds.find((s) => s.id === before.seed_id) : null;
      const by = fs ? `${fs.owner} (${fs.name})` : "?";
      const o = openTaskOf(princelyRows.current, my.id);
      const base = before ? t.wonder.later(name, data, by, daysSince(before.created_at, Date.now())) : t.wonder.first(name, data);
      setVisitNote(o && o.task === "wonder" ? `${base} ${PRINCELY[lang].ready}` : base);
    });
  };
  const [seenGifts, setSeenGifts] = useState<string[]>([]);
  const [giftReadsReady, setGiftReadsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setGiftReadsReady(false);
    setSeenGifts([]);
    if (!userId) return;
    let local: string[] = [];
    try { local = mergeGiftReads(parseGiftReads(localStorage.getItem(giftReadKey(userId))), parseGiftReads(localStorage.getItem("samenland-gifts-seen"))); } catch { /* storage unavailable */ }
    const sync = async () => {
      const { data } = await supabase.from("gift_reads").select("gift_id").eq("user_id", userId);
      if (cancelled) return;
      const read = mergeGiftReads(local, (data ?? []).map((r) => r.gift_id));
      setSeenGifts(read);
      setGiftReadsReady(true);
      try { localStorage.setItem(giftReadKey(userId), JSON.stringify(read)); } catch { /* account receipts still persist */ }
      // Import old browser receipts only for gifts addressed to this account.
      if (local.length) {
        const { data: owned } = await supabase.from("seeds").select("id").eq("user_id", userId);
        if (cancelled || !owned?.length) return;
        const { data: received } = await supabase.from("gifts").select("id").in("to_seed", owned.map((s) => s.id)).in("id", local);
        if (cancelled || !received?.length) return;
        await supabase.from("gift_reads").upsert(received.map((g) => ({ user_id: userId, gift_id: g.id })), { onConflict: "user_id,gift_id", ignoreDuplicates: true });
      }
    };
    void sync();
    return () => { cancelled = true; };
  }, [userId]);
  const liveFrom = useRef(0), lastSmall = useRef(0);
  useEffect(() => {
    if (!owner || !my || seeds.length === 0) return;
    liveFrom.current = clock();
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const now = clock(), c = chronicle(my, seeds, liveFrom.current, now);
      liveFrom.current = now;
      localStorage.setItem(`samenland-seen-${my.id}`, String(now));
      let big = c.events.filter((e) => e.code !== "season" && e.code !== "houses" && e.code !== "families" && !(e.code === "wedding" && !e.grand));
      // Small moments (one house + its family) at most every few minutes, so big towns don't flood the screen.
      const small = big.filter((e) => e.code === "house" || e.code === "family");
      big = big.filter((e) => e.code !== "house" && e.code !== "family");
      if (small.length && Date.now() - lastSmall.current > FEST_GAP) { const h = small.find((e) => e.code === "house") ?? small[0]!; big.push(h, ...small.filter((e) => e.code === "family" && "x" in h && e.x === h.x && e.y === h.y)); lastSmall.current = Date.now(); }
      if (big.length) setFest((q) => [...q, ...big].slice(-6));
    }, 15000);
    return () => window.clearInterval(id);
  }, [owner, my?.id, seeds]);
  const festNow = !anyOpen && !decision.open && !chronOpen ? fest[0] : undefined;
  const festSounded = useRef<ChronEvent | null>(null), giftSounded = useRef<string | null>(null);
  useEffect(() => {
    if (!festNow || festSounded.current === festNow) return;
    festSounded.current = festNow;
    const e = festNow;
    jingle(e.code === "wedding" ? "wedding" : e.code === "stage" ? "stage" : e.code === "road" ? "road" : e.code === "twin" ? "twin" : e.code === "letter" ? "letter" : e.code === "family" ? "welcome" : e.code === "built" && SEAT_KINDS.includes(e.kind) ? (["built", "fanfare", "stage", "stage"] as const)[SEAT_KINDS.indexOf(e.kind)]! : e.code === "house" || e.code === "built" || e.code === "bought" ? "built" : e.code === "fire" ? (e.guarded ? "relief" : "woe") : e.code === "flood" ? "woe" : e.code === "raid" ? (e.caught ? "relief" : "woe") : "fanfare");
  }, [festNow]);
  const festArt = (e: ChronEvent) => e.code === "fire" ? ART["fire"] : e.code === "flood" ? ART["flood"] : e.code === "raid" ? ART["robber"] : e.code === "wedding" ? ART["wedding"] : e.code === "house" ? ART["topping"] : e.code === "family" ? ART["newcomers"] : e.code === "road" ? ART["roadopen"] : e.code === "twin" || (e.code === "bought" && /^title[1-3]$/.test(e.item)) ? ART["charter"] : ART["fair"];
  const festText = (e: ChronEvent): [string, string] => {
    const n = my?.name ?? "";
    if (e.code === "fire") return e.guarded ? [t.woe.fireGuarded[0], t.woe.fireGuarded[1](n)] : [t.woe.fire[0], t.woe.fire[1](n, e.water, e.dead)];
    if (e.code === "flood") return [t.woe.flood[0], t.woe.flood[1](n)];
    if (e.code === "raid") return e.caught ? [t.woe.caught[0], t.woe.caught[1](n)] : [t.woe.raid[0], t.woe.raid[1](n, e.loss)];
    if (e.code === "wedding") return [t.fest.wedding, t.fest.wedBody(e.a, e.b, e.dowry) + (e.alliance ? " " + t.fest.wedAlliance : "")];
    if (e.code === "house") return [t.fest.topping[0], t.fest.topping[1](t.kind[e.kind] ?? e.kind, n)];
    if (e.code === "family") return [t.fest.newcomers[0], t.fest.newcomers[1](n)];
    if (e.code === "road") return [t.fest.road[0], t.fest.road[1](e.other)];
    if (e.code === "twin") return [t.fest.twin[0], t.fest.twin[1](e.other)];
    if (e.code === "letter") return [t.post.arrived(e.other), bodies[e.id] ? `„${bodies[e.id]}“` : t.post.sealed];
    if (e.code === "bought" && /^title[1-3]$/.test(e.item)) return [t.office.fest, t.office.festBody(my?.owner ?? n, itemName(e.item))];
    if (e.code === "stage") return [t.fest.stage[0], t.fest.stage[1](t.stages[e.stage] ?? "")];
    if (e.code === "built" && SEAT_KINDS.includes(e.kind)) { const p = t.fest.seat[SEAT_KINDS.indexOf(e.kind)]; if (p) return p; }
    // moves, brides, journeymen: plain news, never a "finished – everyone gathers" inauguration
    if (e.code !== "built" && e.code !== "bought") return [e.code === "moved" && !e.away ? t.fest.newcomers[0] : t.chron.title, chronLine(e)];
    const name = e.code === "built" ? (t.kind[e.kind] ?? e.kind) : itemName(e.item);
    // only promise a gathering while the inauguration is actually running
    const live = (e.code === "built" || e.code === "bought") && clock() - e.at < FETE_SECS * 1000;
    return [t.fest.built[0], !live ? t.fest.builtPast(name) : t.fest.built[1](name)];
  };
  function openChron() {
    if (!my) return;
    const now = clock();
    setChron((c) => c ?? chronicle(my, seeds, now - 7 * 864e5, now));
    setScribe((x) => (x === undefined ? null : x));
    setChronBanner(false); setChronOpen(true);
  }
  // heavy derivations refresh every 5 s of world time, not on every pointer move
  const slow = Math.floor(now / 5000) * 5000;
  const { cash, myRank, myStage, myTown, at, pop, residents, season, nbs, larder, boons, rankHint } = useMemo(() => {
    const cash = my ? (accounting?.seed === my.id && accounting.active ? accounting.balance : treasury(my, purchases, slow, gifts, claims)) : 0;
    const myRank = my ? townRank(my, seeds, slow) : 0;
    // shop/monuments: the earned rank, never beyond what the server's guard allows
    const myStage = my ? Math.min(myRank, stageOf(effAge(my, seeds, slow))) : 0;
    const myTown = my ? townOf(my, seeds, slow) : null;
    const larder = my ? larderOf(my, seeds, slow) : null;
    const boons = larder ? boonsOf(larder) : null;
    const at = my ? attributes(my, seeds, purchases, slow, myTown!.weddings.filter((w) => w.alliance).length, boons ?? undefined) : null;
    const pop = my ? (accounting?.seed === my.id && accounting.active ? accounting.daily : dailyTax(my, ageHours(my, slow))) : 0;
    const residents = myTown ? citizensOf(myTown).length : 0;
    const sw = seasonAt(slow);
    const season = (Object.keys(sw) as (keyof typeof sw)[]).reduce((a, b) => (sw[b] > sw[a] ? b : a));
    const nbs = my ? links(seeds).filter((l) => l.a.id === my.id || l.b.id === my.id).map((l) => (l.a.id === my.id ? l.b : l.a)) : [];
    // what is still missing for the next rank, e.g. "Bis Dorf fehlen noch: 12 Bürger, 3 Häuser"
    const need = my ? nextRankNeed(rankInput(my, seeds, slow)) : null;
    const parts = need ? [need.citizens > 0 ? t.needCitizens(need.citizens) : "", need.homes > 0 ? t.needHomes(need.homes) : "", need.roads > 0 ? t.needRoads(need.roads) : ""].filter(Boolean) : [];
    const rankHint = need && parts.length ? t.nextRank(t.stages[myRank + 1] ?? "", parts) : "";
    return { cash, myRank, myStage, myTown, at, pop, residents, season, nbs, larder, boons, rankHint };
  }, [my, seeds, purchases, gifts, claims, slow, accounting, t]);
  const [larderOpen, setLarderOpen] = useState(false);
  // "come back later": purse too thin for anything new while builders still work — say so once per session
  const [waitShut, setWaitShut] = useState(false);
  const waitDone = (() => {
    if (!owner || !my || !at) return null;
    const cheapest = Math.min(...(Object.keys(ITEMS) as Item[]).filter((it) => canBuy(it, myCharter) && canBuyWay(it, my ? wayOf(my) : undefined) && !at.has(it) && (ITEM_STAGE[it] ?? 0) <= myStage).map((it) => ITEMS[it]));
    if (cash >= cheapest) return null;
    const dur = specialBuild(my, sawmillUp(my, seeds, slow));
    const ends = [...specialSites(my).values()].map((s) => s.at + dur).filter((e) => e > slow);
    return ends.length ? Math.min(...ends) : null;
  })();
  // the "come back later" band stays shut for this build site: remembered per finishing building
  useEffect(() => {
    if (!waitDone) return;
    try { if (localStorage.getItem("samenland-wait-shut") === String(waitDone)) setWaitShut(true); } catch { /* ignore */ }
  }, [waitDone]);
  const shutWait = () => {
    setWaitShut(true);
    try { localStorage.setItem("samenland-wait-shut", String(waitDone)); } catch { /* ignore */ }
  };

  const wareName = (w: Ware, n: number) => t.goods.ware[w]![n === 1 ? 0 : 1];
  const [questOpen, setQuestOpen] = useState(false);
  const [signEdit, setSignEdit] = useState<string | null>(null);
  const [questFold, setQuestFold] = useState(false);
  useEffect(() => { if (coarse && window.innerWidth < 768) setQuestFold(true); }, [coarse]); // phones: quest starts as a small badge
  const quest = my ? questState(claims, my.id, {
    blessings: blessings.filter((b) => b.seed_id === my.id).length,
    purchases: purchases.filter((p) => p.seed_id === my.id).length,
    signposts: signs.filter((s) => s.seed_id === my.id).length,
    encounters: encounters.filter((e) => e.seed_id === my.id).length,
    giftsSent: gifts.filter((g) => g.from_seed === my.id).length,
    residents, stage: myStage, roads: firstRoads.filter((f) => f.seed_id === my.id).length,
    waySmall: purchases.some((p) => p.seed_id === my.id && WAY_SMALL.includes(p.item)),
    wayBig: purchases.some((p) => p.seed_id === my.id && WAY_BIG.includes(p.item)),
  }) : null;
  const questText = quest && my ? t.quests.list[questKey(quest.quest, wayOf(my))] ?? t.quests.list[quest.quest]! : null;
  const petition = quest && my ? petitionOf(quest.quest, lang, questKey(quest.quest, wayOf(my)) !== quest.quest, myTown?.people) : null;
  const questHow = () => {
    if (!quest || !my) return;
    const tabs: Partial<Record<Quest, Tab>> = { bless: "rituals", bless7: "rituals", build: "build", buy3: "build", buy6: "build", metro: "build", sign: "signs", gift: "towns", gifts5: "towns", road: "build", roads2: "build" };
    const tb = tabs[quest.quest];
    if (tb) setTab(tb); else { focus(my.x, my.y); setMsg(questText![1]); }
  };
  const claimQuest = async () => {
    if (!my || !userId || !quest?.ready) return;
    const { data, error } = await supabase.from("quest_claims").insert({ seed_id: my.id, user_id: userId, quest: quest.quest }).select("id, seed_id, quest, reward, created_at").single();
    setQuestOpen(false);
    if (error || !data) return setMsg(t.quests.fail);
    setClaims((c) => [...c, data]);
    jingle("fanfare"); setTimeout(() => jingle("coins"), 700); setMsg(t.quests.got(data.reward));
  };
  const sendLetter = async () => {
    if (!my || !postTo) return;
    const body = postText.trim(), to = postTo;
    const { data, error } = await supabase.rpc("send_letter", { _from: my.id, _to: to.id, _body: body });
    setPostTo(null);
    if (error || !data) return setMsg(t.post.fail);
    const row = { id: data as string, from_seed: my.id, to_seed: to.id, created_at: new Date().toISOString() };
    setLetters((s) => (s.some((x) => x.id === row.id) ? s : [...s, row]));
    setBodies((b) => ({ ...b, [row.id]: body }));
    setMsg(t.post.sent(Math.round(rideTime(my, to) / 6e4)));
  };
  const holdMarket = async (small: boolean) => {
    if (!my || !userId) return;
    const { data, error } = await supabase.from("market_sales").insert({ seed_id: my.id, user_id: userId, small }).select("id, seed_id, day, reward, created_at").single();
    if (error || !data) return setMsg(t.goods.marketFail);
    setClaims((c) => [...c, { id: data.id, seed_id: data.seed_id, quest: `market:${data.day}`, reward: data.reward, created_at: data.created_at } as QuestClaim]);
    jingle("coins"); setMsg(t.goods.marketGot(data.reward));
  };
  const ring = async (kind: "bell" | "well") => {
    if (!my) return;
    const { data, error } = await supabase.from("blessings").insert({ seed_id: my.id, user_id: userId!, kind }).select("id, seed_id, created_at").single();
    if (error || !data) return setMsg(t.blessFail);
    setBlessings((s) => [...s, data]);
    if (kind === "bell") bell(); else tap();
    setMsg(t.blessed(my.name));
  };
  const sendGift = async (to: Seed, kind: GiftKind, note = 0) => {
    if (!my || !userId) return;
    if (!await prepareSpend()) return;
    const { data, error } = await supabase.from("gifts").insert({ from_seed: my.id, to_seed: to.id, user_id: userId, kind, note }).select("id, from_seed, to_seed, kind, amount, note, created_at").single();
    if (error || !data) return setMsg(t.gifts.fail);
    setGifts((q) => (q.some((x) => x.id === data.id) ? q : [...q, data as Gift]));
    tap(); setMsg(kind === "thanks" ? t.gifts.thanked(to.name) : t.gifts.sent(to.name));
  };
  const saveSign = async (to: Seed) => {
    if (!my) return;
    const cur = signs.find((x) => x.seed_id === my.id && x.target_id === to.id);
    const text = (signDraft[to.id] ?? cur?.message ?? "").trim().slice(0, 80);
    if (!text) return setMsg(t.signPlaceholder);
    if (cur && cur.message === text) return setMsg(t.signSaved);
    const { data, error } = await supabase.from("signposts").upsert({ seed_id: my.id, target_id: to.id, user_id: userId!, message: text }, { onConflict: "seed_id,target_id" }).select("id, seed_id, target_id, user_id, message").single();
    if (error || !data) return setMsg(t.blessFail);
    setSigns((s) => [...s.filter((x) => x.id !== data.id), data as Signpost]);
    setMsg(t.signSaved);
  };
  const buy = async (item: string, x?: number, y?: number) => {
    if (!my) return;
    if (x != null && y != null) {
      const err = canPlaceSpecial(item, x, y, my, seeds, clock());
      if (err) return setMsg(t.place[err as "far" | "ground" | "taken" | "shore"]);
    }
    if (!await prepareSpend()) return;
    setPlacing(null);
    const { data, error } = await supabase.from("purchases").insert({ seed_id: my.id, user_id: userId!, item, x: x ?? null, y: y ?? null }).select("id, seed_id, item, cost, created_at, x, y").single();
    if (error || !data) return setMsg(error?.message?.includes("not enough money") ? t.poor : t.buyFail);
    setPurchases((s) => [...s.filter((x) => x.id !== data.id), data]);
    tap();
    if (/^chest[2-4]$/.test(item)) { jingle("coins"); setMsg(`${CHEST[lang].title}: ${CHEST[lang].levels[+item.slice(5) - 1]}`); } else if (/^title[1-3]$/.test(item)) { jingle("stage"); bell(0); setMsg(t.office.fest); } else if (item === "rank2" || item === "rank3") { jingle("fanfare"); bell(0); setMsg(t.rank.sealed(t.rank.ranks[item === "rank2" ? 1 : 2]!)); } else { const mk = monumentOf(item); jingle(mk ? "fanfare" : "coins"); setMsg(mk ? `${t.monuments[mk]!.title} · ${t.monument.step(+item.slice(mk.length), monumentSteps(mk).length)}` : t.bought(t.items[item]![0])); }
  };
  useEffect(() => {
    if (!placing || !coarse) { setGhost(null); return; }
    const own = seeds.find((x) => x.id === mine); if (!own) return;
    const g = firstFreeSite(placing, own, seeds, clock()) ?? [own.x, own.y];
    setGhost(g); focus(g[0], g[1]); target.current = { ...target.current, zoom: Math.max(target.current.zoom, 6) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placing, coarse]);
  const zoomBy = (f: number) => {
    const cv = canvasRef.current!;
    target.current = { zoom: Math.min(st.current.walk ? 20 : 12, Math.max(MIN_ZOOM, target.current.zoom * f)), ax: cv.width / 2, ay: cv.height / 2 };
  };
  const [moreOpen, setMoreOpen] = useState(false);
  const pick = (k: Tab) => setTab(tab === k ? null : k);
  // desktop hotkeys (read fresh every render via the ref; the key listener lives in the canvas effect and skips form fields)
  const overview = useRef<number | null>(null);
  hotkey.current = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase(), done = () => e.preventDefault();
    if (k === "escape") {
      // 1. topmost window, 2. mode / placement / inspection, 3. stroll
      if (labOpen) return setLabOpen(false);
      if (supportOpen) return setSupportOpen(false);
      if (bugOpen) return setBugOpen(false);
      if (herald) return setHerald(false); if (thanks) return setThanks(false);
      if (imprint) return setImprint(false);
      if (inviteOpen) return setInviteOpen(false);
      if (authOpen) return setAuthOpen(false);
      if (tavernOpen) return setTavernOpen(false);
      if (rollOpen) return setRollOpen(false);
      if (larderOpen) return setLarderOpen(false);
      if (chronOpen) return setChronOpen(false);
      if (guideOpen) return setGuideOpen(false);
      if (settings) return setSettings(false);
      if (moreOpen) return setMoreOpen(false);
      if (editMayor) return setEditMayor(false);
      if (placing) { setPlacing(null); setMsg(null); return; }
      if (mode !== "look") return setMode("look");
      if (who || place) { setWho(null); setPlace(null); return; }
      if (tab) return setTab(null);
      if (walk) { stick.current = { dx: 0, dy: 0 }; setWalk(false); }
      return;
    }
    if (k === " " || k === "spacebar") { done(); if (walk) camFree.current = false; else if (my) { const [gx, gy] = iso(my.x, my.y); fling.current = { vx: 0, vy: 0, t: performance.now() }; glide.current = { x: gx, y: gy }; } return; }
    if (k === "+" || k === "=" || k === "e") { done(); return zoomBy(1.6); }
    if (k === "-" || k === "_" || k === "q") { done(); return zoomBy(1 / 1.6); }
    if (walk) return;
    if (k === "b") { done(); return pick(my ? "build" : "plant"); }
    if (k === "p" && (import.meta.env.DEV || location.search.includes("figs"))) { done(); return setLabOpen((v) => !v); }
    if (k === "t" && userId) { done(); return setTavernOpen((v) => !v); }
    if (k === "m") {
      // map overview: zoom far out over the island, the second press returns to the earlier zoom
      done(); const cv = canvasRef.current; if (!cv) return;
      const back = overview.current;
      overview.current = back == null ? target.current.zoom : null;
      target.current = { zoom: back ?? Math.max(MIN_ZOOM, 0.08), ax: cv.width / 2, ay: cv.height / 2 };
    }
  };
  const tabs: { k: Tab; icon: typeof Hammer; label: string }[] = [
    ...(my ? [
      { k: "build" as Tab, icon: Hammer, label: t.hud.build },
      { k: "rituals" as Tab, icon: Bell, label: t.hud.rituals },
      { k: "signs" as Tab, icon: SignIcon, label: t.hud.signs },
    ] : [{ k: "plant" as Tab, icon: Sprout, label: t.hud.plant }]),
    { k: "towns", icon: MapIcon, label: t.hud.towns },
  ];
  const Head = ({ children }: { children: React.ReactNode }) => <div className="font-display text-2xl leading-none text-wood">{children}</div>;

  const guestbook = my && owner ? (() => {
    const now2 = clock(); const got = seeds.flatMap((o) => (o.letters ?? []).filter((g) => g.to === my.id && letterArrives(o, my, g.at) <= now2).map((g) => ({ ...g, o }))).sort((a, b) => b.at - a.at).slice(0, 20);
    return (
      <div className="mt-2 border-t border-border pt-2 text-xs">
        <div className="font-display text-sm text-foreground">{t.post.book}</div>
        {got.length === 0 ? <div className="text-muted-foreground">{t.post.empty}</div> : (
          <ul className="max-h-40 space-y-1 overflow-auto">{got.map((g) => (
            <li key={g.id}><button type="button" className="w-full rounded px-1 py-0.5 text-left hover:bg-accent" onClick={() => { setRollOpen(false); setTab(null); setFest((q) => [{ at: letterArrives(g.o, my, g.at), code: "letter", id: g.id, other: g.o.name }, ...q]); }}>
              <span className="italic text-foreground">„{bodies[g.id] ?? t.post.sealed}“</span> <span className="text-muted-foreground">{t.post.from(g.o.name)}</span>
            </button></li>
          ))}</ul>)}
      </div>
    );
  })() : null;
  const drawer = tab && (
    <div className="space-y-3 p-3 text-sm">
      <div className="flex items-center justify-between">
        <Head>{tabs.find((x) => x.k === tab)?.label}</Head>
        <button type="button" aria-label={t.hud.close} onClick={() => setTab(null)} className="hit relative text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      {tab === "build" && my && at && (
        <div className="space-y-2">
          <Outlook t={t} lang={lang} my={my} seeds={seeds} now={slow} rank={myRank} charter={myCharter} way={wayOf(my)} />
          {my.user_id && (() => {
            const ct = CHEST[lang], lvl = chestLevel(my.id, purchases), cap = chestCap(my.id, purchases), blk = chestBlock(my, purchases, now);
            const step = CHEST_STEPS[Math.min(lvl - 1, 2)]!, fill = Math.min(1, Math.max(0, cash) / cap);
            return (
              <div className="rounded-md border border-brass/60 bg-brass/10 p-2 text-xs">
                <div className="flex items-center justify-between font-semibold"><span>🧰 {ct.title} · {ct.levels[lvl - 1]}</span><span>{Math.max(0, cash)} / {cap}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className={`h-full ${fill >= 1 ? "bg-destructive" : "bg-brass"}`} style={{ width: `${fill * 100}%` }} /></div>
                <div className="mt-1 text-muted-foreground">{fill >= 1 ? ct.full : ct.intro}</div>
                {blk === "max" ? <div className="mt-1 font-semibold text-primary">{ct.max}</div>
                  : blk ? <div className="mt-1 text-muted-foreground">{ct.levels[lvl]}: {ct.need(t.stages[[2, 3, 4][lvl - 1] ?? 4] ?? "")}</div>
                  : <Button size="sm" className="mt-1.5 h-7 w-full" disabled={cash < CHEST_PRICE[step]} onClick={() => void buy(step)}>{ct.expand}: {ct.levels[lvl]} ({CHEST_CAP[step]}) · {t.taler(CHEST_PRICE[step])}</Button>}
              </div>
            );
          })()}
          {(() => {
            const b = roadBuilding(my, now, seeds), inc = b ? null : roadIncoming(my, seeds, now), cs = roadCandidates(my, seeds), to = b ? seeds.find((s) => s.id === b.target) : null;
            return (
              <div className="rounded-md border border-border bg-secondary/60 p-2">
                <div className="flex items-center gap-2">
                  {ART["road"] && <img src={ART["road"]} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded object-cover" />}
                  <span className="flex-1 font-semibold">{t.road.menu}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t.road.menuHint}</div>
                {b ? <div className="mt-2 space-y-1"><div className="text-xs font-semibold text-wood">{t.road.busy(to?.name ?? "", Math.max(1, Math.ceil((b.done - now) / 3.6e6)))}</div><div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-brass" style={{ width: `${Math.round(Math.max(0, Math.min(1, (now - b.at) / Math.max(1, b.done - b.at))) * 100)}%` }} /></div></div>
                  : inc ? <div className="mt-2 space-y-1"><div className="text-xs font-semibold text-wood">{t.road.incoming(inc.from.name, Math.max(1, Math.ceil((inc.done - now) / 3.6e6)))}</div><Button size="sm" className="w-full" onClick={() => joinRoad(inc.from.id)}>{t.road.join}</Button></div>
                  : cs.length === 0 ? <div className="mt-2 text-xs">{t.road.none}</div>
                  : <Button size="sm" className="mt-2 w-full" onClick={openRoad}>{t.road.btn}</Button>}
              </div>
            );
          })()}
          {myCharter && (
            <div className="rounded-md border border-brass/60 bg-brass/15 p-2 text-xs">
              <b>{PATH_ICON[myCharter]} {t.charter.paths[myCharter]![0]}:</b> {t.charter.bonus[myCharter]}
              {my && (() => {
                const r = rankOf(my, purchases), step: RankStep = r === 1 ? "rank2" : "rank3";
                const roads = links(seeds).filter((l) => (l.a.id === my.id || l.b.id === my.id) && now >= l.since).length;
                const blk = rankBlock(my, purchases, now, roads);
                const why = blk === "age" ? t.rank.need.age(t.stages[step === "rank2" ? 2 : 4] ?? "") : blk === "guild" ? t.rank.need.guild : blk === "belfry" ? t.rank.need.belfry : blk === "roads" ? t.rank.need.roads(RANK_ROADS) : "";
                return (
                  <div className="mt-2 border-t border-brass/40 pt-2">
                    <div className="font-semibold">{t.rank.title}</div>
                    <div className="mt-1 flex gap-1">
                      {t.rank.ranks.map((n, k) => <span key={k} className={`rounded-full px-2 py-0.5 text-[10px] ${k < r ? "bg-brass/60 font-semibold text-wood" : "bg-ink/10 opacity-60"}`}>{k < r ? "✦" : "○"} {n}</span>)}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {t.rank.perks[myCharter]!.map((p, k) => <li key={k} className={k + 2 <= r ? "text-primary" : "opacity-70"}>{k + 2 <= r ? "✓" : "·"} <b>{t.rank.ranks[k + 1]}:</b> {p}</li>)}
                    </ul>
                    {blk === "max" ? <div className="mt-1 font-semibold text-primary">{t.rank.need.max}</div>
                      : blk ? <div className="mt-1 text-muted-foreground">{t.rank.exam[r]}: {why}</div>
                      : <Button size="sm" className="mt-1.5 h-7 w-full" disabled={cash < RANK_PRICE[step]} onClick={() => void buy(step)}>{t.rank.exam[r]} · {t.taler(RANK_PRICE[step])}</Button>}
                  </div>
                );
              })()}
              {my && (() => {
                const n = titleOf(my, purchases), blk = titleBlock(my, purchases, now), step = TITLE_STEPS[Math.min(n, 2)]!;
                const why = blk === "age" ? t.office.need.age(t.stages[[3, 4, 5][n] ?? 5] ?? "") : blk === "rank" ? t.office.need.rank(t.rank.ranks[TITLE_RANK[step] - 1] ?? "") : blk === "charter" ? t.office.need.charter : "";
                const fmt = (b: Partial<Record<string, number>>) => Object.entries(b).map(([k, v]) => `+${v} ${t.office.stat[k] ?? k}`).join(", ");
                return (
                  <div className="mt-2 border-t border-brass/40 pt-2">
                    <div className="font-semibold">📜 {t.office.title}</div>
                    <div className="mt-0.5 text-muted-foreground">{t.office.intro}</div>
                    <ul className="mt-1 space-y-0.5">
                      {TITLE_STEPS.map((st, k) => <li key={st} className={k < n ? "text-primary" : "opacity-70"}>{k < n ? "✓" : "·"} <b>{titleName(k)}</b> · {fmt(TITLE_BONUS[myCharter as CharterPath][k] ?? {})} · {t.office.garb[k]}</li>)}
                    </ul>
                    {blk === "max" ? <div className="mt-1 font-semibold text-primary">{t.office.need.max}</div>
                      : blk ? <div className="mt-1 text-muted-foreground">{titleName(n)}: {why}</div>
                      : <Button size="sm" className="mt-1.5 h-7 w-full" disabled={cash < TITLE_PRICE[step]} onClick={() => void buy(step)}>{t.office.appoint}: {titleName(n)} · {t.taler(TITLE_PRICE[step])}</Button>}
                  </div>
                );
              })()}
            </div>
          )}
          {(Object.keys(ITEMS) as Item[]).filter((it) => canBuy(it, myCharter) && canBuyWay(it, my ? wayOf(my) : undefined) && !at.has(it))
            .sort((a, b) => ((ITEM_STAGE[a] ?? 0) > myStage ? 1 : 0) - ((ITEM_STAGE[b] ?? 0) > myStage ? 1 : 0) || (ITEM_STAGE[a] ?? 0) - (ITEM_STAGE[b] ?? 0) || ITEMS[a] - ITEMS[b])
            .map((it) => {
            const lockedIt = (ITEM_STAGE[it] ?? 0) > myStage;
            return (
              <div key={it} className={`rounded-md border border-border bg-secondary/60 p-2 ${lockedIt ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2">
                  {spriteUrl(SPECIAL_KIND[it]!) && <img src={spriteUrl(SPECIAL_KIND[it]!)} alt="" loading="lazy" className="h-12 w-12 shrink-0 object-contain drop-shadow" />}
                  <span className="flex-1 font-semibold">{t.items[it]![0]}{GUILD[it] && <span className="ml-1 rounded-full bg-brass/30 px-1.5 py-0.5 text-[10px] text-wood">{t.charter.guild}</span>}{WAY_ITEM[it] && <span className="ml-1 rounded-full bg-brass/30 px-1.5 py-0.5 text-[10px] text-wood">{CHAR_ICON[WAY_ITEM[it]!]} {TOWN_CHARACTER[lang].names[WAY_ITEM[it]!]}</span>}</span>
                  <span className="text-xs text-muted-foreground">{t.taler(ITEMS[it])}</span>
                </div>
                <div className="text-xs text-muted-foreground">{t.items[it]![1]}</div>
                <div className="mt-1.5">
                  {at.has(it) ? <span className="text-xs font-semibold text-primary">{t.owned}</span> : (
                    (ITEM_STAGE[it] ?? 0) > myStage ? <span className="text-xs text-muted-foreground">🔒 {t.needStage(t.stages[ITEM_STAGE[it]!] ?? "")}{RANK_NEED[ITEM_STAGE[it]! - 1] ? ` (${RANK_NEED[ITEM_STAGE[it]! - 1]![0]} ${OUTLOOK[lang].cit}, ${RANK_NEED[ITEM_STAGE[it]! - 1]![1]} ${OUTLOOK[lang].homes}${RANK_NEED[ITEM_STAGE[it]! - 1]![2] ? `, ${RANK_NEED[ITEM_STAGE[it]! - 1]![2]} ${OUTLOOK[lang].roads}` : ""})` : ""}</span> :
                    <Button size="sm" className="h-7 w-full" disabled={cash < ITEMS[it]} onClick={() => { setPlacing(it); setTab(null); setMsg(t.place.pick(t.items[it]![0])); if (my) focus(my.x, my.y); }}>{t.hud.build}</Button>
                  )}
                </div>
              </div>
            );
          })}
          {my && MONUMENT_KEYS.filter((k) => myStage < MONUMENTS[k].stage && (!MONUMENTS[k].way || MONUMENTS[k].way === wayOf(my))).sort((a, b) => MONUMENTS[a].stage - MONUMENTS[b].stage).map((key) => (
            <div key={`lock-${key}`} className="rounded-md border border-brass/40 bg-brass/5 p-2 opacity-60">
              <div className="flex items-center gap-2">
                {spriteUrl(MONUMENT_DEFS[key].kind) && <img src={spriteUrl(MONUMENT_DEFS[key].kind)} alt="" loading="lazy" className="h-12 w-10 shrink-0 object-contain grayscale" />}
                <span className="flex-1 font-semibold">{t.monuments[key]!.title}</span>
              </div>
              <div className="text-xs text-muted-foreground">{t.items[`${key}1`]![1]}</div>
              <div className="mt-1 text-xs text-muted-foreground">🔒 {t.needStage(t.stages[MONUMENTS[key].stage] ?? "")}</div>
            </div>
          ))}
          {my && MONUMENT_KEYS.filter((k) => myStage >= MONUMENTS[k].stage && (!MONUMENTS[k].way || MONUMENTS[k].way === wayOf(my))).map((key) => {
            const steps = monumentSteps(key), mt = t.monuments[key]!;
            const paid = purchases.filter((p) => p.seed_id === my.id && steps.includes(p.item));
            const next = nextMonumentStep(paid.map((p) => p.item), key);
            const mill = sawmillUp(my, seeds, now), prog = monumentProgress(my, now, key, mill), n = steps.length, i = paid.length;
            const last = Math.max(0, ...paid.map((p) => Date.parse(p.created_at)));
            const ready = i === 0 || (prog >= i / n && now - last >= 3 * 3600000);
            const waitH = Math.max(Math.ceil((last + 3 * 3600000 - now) / 3.6e6), Math.ceil(((i / n - prog) * n * specialBuild(my, mill)) / 3.6e6));
            const kind = MONUMENT_DEFS[key].kind, first = `${key}1`;
            return (
              <div key={key} className="rounded-md border border-brass/60 bg-brass/10 p-2">
                <div className="flex items-center gap-2">
                  {spriteUrl(kind) && <img src={spriteUrl(kind)} alt="" loading="lazy" className="h-14 w-12 shrink-0 object-contain drop-shadow" />}
                  <span className="flex-1 font-semibold">{mt.title}</span>
                  {next && <span className="text-xs text-muted-foreground">{t.taler(MONUMENT_PRICE[next]!)}</span>}
                </div>
                <div className="text-xs text-muted-foreground">{t.items[first]![1]}</div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-ink/15"><div className="h-full bg-brass" style={{ width: `${100 * prog}%` }} /></div>
                <ol className="mt-1 space-y-0.5 text-xs">
                  {mt.steps.map((name, k) => <li key={k} className={k < i ? "text-primary" : k === i ? "font-semibold" : "opacity-60"}>{k < i ? "✓" : `${k + 1}.`} {name}</li>)}
                </ol>
                <div className="mt-1.5">
                  {!next ? <span className="text-xs font-semibold text-primary">{prog >= 1 ? mt.done : t.monument.building}</span>
                    : !ready ? <span className="text-xs text-muted-foreground">{t.monument.wait(Math.max(1, waitH))}</span>
                    : <Button size="sm" className="h-7 w-full" disabled={cash < MONUMENT_PRICE[next]!} onClick={() => {
                        if (next === first) { setPlacing(first); setTab(null); setMsg(t.place.pick(t.items[first]![0])); focus(my.x, my.y); }
                        else void buy(next);
                      }}>{t.monument.step(i + 1, n)} · {t.monument.pay}</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {tab === "rituals" && my && (() => {
        const live = isBlessed(my, now), last = Math.max(0, ...(my.blessed ?? [])), cd = blessCooldown(my, now);
        return (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t.ritual}</div>
            {live && <div className="text-xs text-primary">{t.festive(Math.ceil((last + BLESS_MS - now) / 3.6e6))}</div>}
            {cd > 0 ? <div className="text-xs text-muted-foreground">{t.blessAgain(Math.ceil(cd / 3.6e6))}</div> : (
              <div className="grid gap-2">
                <Button size="sm" variant="secondary" onClick={() => ring("bell")}>{t.ringBell}</Button>
                <Button size="sm" variant="secondary" onClick={() => ring("well")}>{t.decorateWell}</Button>
              </div>
            )}
          </div>
        );
      })()}
      {tab === "signs" && my && (() => {
        const mine = (o: Seed) => signs.find((x) => x.seed_id === my.id && x.target_id === o.id);
        const placed = nbs.filter((o) => mine(o)), open = nbs.filter((o) => !mine(o));
        const form = (o: Seed) => (
          <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); saveSign(o); setSignEdit(null); }}>
            <Input className="h-8 text-xs" maxLength={80} placeholder={t.signPlaceholder} value={signDraft[o.id] ?? mine(o)?.message ?? ""} onChange={(e) => setSignDraft({ ...signDraft, [o.id]: e.target.value })} />
            <Button type="submit" size="sm" variant="secondary">{t.signSave}</Button>
          </form>
        );
        const theirs = (o: Seed) => signs.find((x) => x.seed_id === o.id && x.target_id === my.id);
        return (
          <div className="space-y-3">
            {nbs.length === 0 && <div className="text-xs text-muted-foreground">{t.noNeighbours}</div>}
            {placed.length > 0 && (
              <div className="space-y-2">
                <div className="font-display text-sm">{t.signUi.placed}</div>
                {placed.map((o) => { const th = theirs(o), tl = signTile(seeds, my.id, o.id); return (
                  <div key={o.id} className="space-y-1 rounded border border-border p-2 text-xs">
                    <div><span className="font-medium text-foreground">✓ {t.signTo(o.name)}</span> <span className="text-muted-foreground">· {t.signUi.stands}</span></div>
                    {signEdit === o.id ? form(o) : <div className="italic text-foreground">„{mine(o)!.message}“</div>}
                    {th && <div className="text-muted-foreground">{t.signUi.theirs(o.name)}: <span className="italic">„{th.message}“</span></div>}
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSignEdit(signEdit === o.id ? null : o.id)}>{signEdit === o.id ? t.signUi.cancel : t.signUi.edit}</Button>
                      <Button size="sm" variant="ghost" onClick={() => { focus(o.x, o.y); setTab(null); }}>{t.signUi.town}</Button>
                      {tl && <Button size="sm" variant="ghost" onClick={() => { const cv = canvasRef.current; const [ix, iy] = iso(tl[0], tl[1]); cam.current.zoom = 6; cam.current.x = ix + 5; cam.current.y = iy + 18; target.current = { zoom: 6, ax: (cv?.width ?? 0) / 2, ay: (cv?.height ?? 0) / 2 }; signFocus.k = tl[1] * MAP + tl[0]; signFocus.until = Date.now() + 10000; setMsg(`${t.signTo(o.name)}: „${mine(o)!.message}“`); setTab(null); }}>{t.signUi.look}</Button>}
                    </div>
                  </div>
                ); })}
              </div>
            )}
            {open.length > 0 && (
              <div className="space-y-2">
                <div className="font-display text-sm">{t.signUi.open}</div>
                {open.map((o) => { const th = theirs(o); return (
                  <div key={o.id} className="space-y-1 text-xs">
                    <div className="text-foreground">{t.signTo(o.name)}</div>
                    {th && <div className="text-muted-foreground">{t.signUi.theirs(o.name)}: <span className="italic">„{th.message}“</span></div>}
                    {form(o)}
                  </div>
                ); })}
              </div>
            )}
          </div>
        );
      })()}
      {tab === "plant" && (!userId ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t.hud.login}</p>
          <Button size="sm" className="w-full" onClick={() => setAuthOpen(true)}>{t.signIn}</Button>
        </div>
      ) : home ? (
        <div className="space-y-2">
          <p className="text-xs">{t.hasTown.at(home.name, t.realms[home.realm ?? "europe"])}</p>
          <p className="text-xs text-muted-foreground">{t.hasTown.one}</p>
          {home.realm === realm && <Button size="sm" variant="secondary" className="w-full" onClick={() => focus(home.x, home.y)}>{t.hasTown.look}</Button>}
        </div>
      ) : (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); startSeedMode(); }}>
          <label className="block space-y-1">
            <span className="block text-xs font-semibold text-foreground">{t.townName}</span>
            <span className="flex items-center gap-1.5">
              <Input placeholder={t.townName} maxLength={32} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <button type="button" onClick={rerollName} aria-label={t.townName} title={t.townName} className="hit relative shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"><Dices className="h-4 w-4" /></button>
            </span>
            <span className="block text-[11px] leading-snug text-muted-foreground">{t.townHint}</span>
          </label>
          <label className="block space-y-1">
            <span className="block text-xs font-semibold text-foreground">{t.yourName}</span>
            <Input placeholder={t.yourName} maxLength={32} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            <span className="block text-[11px] leading-snug text-muted-foreground">{t.ownerHint}</span>
          </label>
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-foreground">{t.gender.label}</span>
            <div className="flex gap-1" role="radiogroup" aria-label={t.gender.label}>
              {(["m", "w", "d"] as const).map((g) => <Button key={g} type="button" size="sm" className="flex-1 px-1" variant={form.gender === g ? "default" : "outline"} aria-pressed={form.gender === g} onClick={() => setForm({ ...form, gender: g })}>{t.gender[g]}</Button>)}
            </div>
            <span className="block text-[11px] leading-snug text-muted-foreground">{t.gender.hint}</span>
          </div>
          <p className="text-xs text-muted-foreground">{mode === "seed" ? t.clickLand : t.needNames}</p>
          {mode === "seed" ? <Button type="button" size="sm" variant="ghost" onClick={() => { setMode("look"); setPlantAsk(null); setPtr(null); }}>{t.cancel}</Button>
            : <Button type="submit" size="sm" className="w-full" disabled={!form.name.trim() || !form.owner.trim() || !form.gender}>{t.plant}</Button>}
        </form>
      ))}
      {tab === "build" && my && (() => {
        const g = (xs: string[]) => xs.map((x) => t.trade.goods[x] ?? x).join(", ");
        const prof = tradeProfile(my, now), parts = tradePartners(my, seeds, now), hints = tradeHints(my, seeds, now);
        return (
          <div className="mt-3 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
            <div className="font-display text-sm text-foreground">{t.trade.title}</div>
            <div>{t.trade.exports}: {g(prof.exports)}</div>
            <div>{t.trade.imports}: {g(prof.imports)}</div>
            <div className="text-foreground">{t.trade.partners}</div>
            {parts.length === 0 && <div>{t.trade.none}</div>}
            {parts.map((p) => (
              <div key={p.seed.id}>{t.trade.partner(p.seed.name, Math.round(p.bonus * 100), t.trade.fit(p.factor))}<span className="block">{t.trade.flow(g(p.buy), g(p.sell))}</span></div>
            ))}
            {hints.map((h) => <div key={h.good} className="italic">{t.trade.hint(t.trade.goods[h.good] ?? h.good, h.from?.name ?? null)}</div>)}
            {twinLinks(my, seeds, now).map((l) => {
              const o = l.a.id === my.id ? l.b : l.a, p = pactOf(my, o, seeds, now), pend = pactPending(my, o, seeds, now), w = workOf(my, o, now);
              const mine = (my.votes ?? []).filter((v) => v.partner === o.id).sort((a, b) => b.at - a.at)[0];
              return (
                <div key={o.id} className="mt-2 space-y-1 rounded border border-border p-2">
                  <div className="font-display text-sm text-foreground">{t.twin.title(my.name, o.name)}</div>
                  <div>{t.twin.bonus}</div>
                  {p ? <div className="text-foreground">{t.twin.agreed(t.twin.pacts[p.kind]![0])}</div>
                    : pend === "wait" && mine ? <div>{t.twin.waiting(Math.max(1, Math.ceil((mine.at + PACT_WAIT - now) / 864e5)))}</div>
                    : owner ? <Button size="sm" variant="secondary" onClick={() => { setPactPick(null); setPactOpen(true); }}>{t.twin.seal}</Button> : null}
                  {marketDay(l, now) && <div>{t.twin.market}</div>}
                  <div>{t.twin.festival(festivalDate(l))}</div>
                  {p && (
                    <div className="space-y-1">
                      <div className="text-foreground">{t.twin.workTitle}</div>
                      {w.done !== null ? <div>{now >= w.done ? t.twin.built(t.twin.works[w.work!]!) : t.twin.building}</div>
                        : w.mine ? <div>{t.twin.paid}</div>
                        : <>
                            <div>{t.twin.workIntro}</div>
                            {(Object.keys(TWIN_WORKS) as WorkKind[]).filter((k) => !w.work || w.work === k).map((k) => (
                              <Button key={k} size="sm" variant="secondary" className="mr-1" disabled={!owner || cash < TWIN_WORKS[k]} onClick={() => payWork(o, k)}>{t.twin.works[k]} · {t.twin.pay(TWIN_WORKS[k])}</Button>
                            ))}
                          </>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
      {tab === "towns" && (
        <ul className="max-h-[50vh] space-y-1 overflow-auto">
          {seeds.map((s) => (
            <li key={s.id}>
              <button className="w-full rounded px-2 py-1 text-left hover:bg-accent" onClick={() => { setProfile(s); setTab(null); }}>
                <span className="text-foreground">{s.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {TOWN_CHARACTER[lang].names[wayOf(s)]} · {t.stages[townRank(s, seeds, slow)]} · {(() => { const f = s.mayor_gender === "w" ? true : s.mayor_gender === "m" ? false : hash(s.x, s.y, 880) < 0.5; return <>{t.roll.role["mayor"]![f ? 0 : 1]}: {s.owner}{support.get(s.id)?.has("seal") && <span title={SUPPORT[lang].seal} className="ms-1 text-primary">⚜️</span>}</>; })()} · {t.age(ageHours(s, now))}
                  {(() => { const p = speedParts(s, seeds, now); return (<>
                    {p.bless > 0.005 && <span className="block">{t.blessBonus(Math.round(p.bless * 100))}</span>}
                    {p.trade > 0.005 && <span className="block">{t.tradeBonus(Math.round(p.trade * 100))}{p.raw - p.trade > 0.005 && <> ({t.tradeCap(Math.round(p.raw * 100), Math.round(p.cap * 100))})</>}</span>}
                    {p.toll > 0 && <span className="block">{t.tollBonus(p.toll)}</span>}
                    {p.farm > 0.005 && <span className="block">{t.farmBonus(Math.round(p.farm * 100))}</span>}
                  </>); })()}
                  {mentoring(s, seeds, now) && mentorOf(s, seeds, now) && <span className="block">{t.mentorBy(mentorOf(s, seeds, now)!.name)}</span>}
                  {my && s.id !== my.id && links(seeds).some((l) => now >= l.since && ((l.a.id === my.id && l.b.id === s.id) || (l.b.id === my.id && l.a.id === s.id))) && <span className="block">{marketHours(now) ? t.market.open : t.market.next(s.name)}</span>}
                </span>
              </button>
              {owner && my && s.id !== my.id && <Button size="sm" variant="secondary" className="ml-2 mb-1" onClick={() => { setPostText(""); setPostTo(s); }}>{t.post.send}</Button>}
              {owner && my && nbs.some((o) => o.id === s.id) && (() => { const used = sentToday(my.id, gifts, now), hurt = tileHits(s, now).size > 0; return (<>
                <Button size="sm" variant="secondary" className="ml-2 mb-1" disabled={used || cash < GIFT_TALER} onClick={() => sendGift(s, "gift")}>{t.gifts.give(GIFT_TALER)}</Button>
                {hurt && <Button size="sm" className="ml-2 mb-1" disabled={used || cash < AID_TALER} onClick={() => sendGift(s, "aid")}>{t.gifts.aid(AID_TALER)}</Button>}
              </>); })()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const dueKey = decision.due.join(",");
  useEffect(() => {
    // close a popup whose decision is no longer due (e.g. answered on another device)
    if (roadOpen && !decision.due.includes("road")) setRoadOpen(false);
    if (charterOpen && !decision.due.includes("charter")) setCharterOpen(false);
    if (encOpen && !decision.due.includes("encounter")) setEncOpen(false);
    if (pactOpen && !decision.due.includes("pact")) setPactOpen(false);
  }, [dueKey]);
  useEffect(() => {
    if (anyOpen || !decision.open) return;
    const k = decision.open;
    // let all village records arrive before asking, so nothing pops up that is already settled
    const id = setTimeout(() => {
      if (k === "road") openRoad();
      else if (k === "charter") { setCharterPick(null); setCharterOpen(true); }
      else if (k === "pact") { setPactPick(null); setPactOpen(true); }
      else setEncOpen(true);
    }, 2500);
    return () => clearTimeout(id);
  }, [decision.open, anyOpen]);

  // panels that sit over the map's top-right corner: the chronicle button, the quest
  // card and the wax seal must step aside while any of them is open
  const panelOpen =
    settings || !!tab || authOpen ||
    guideOpen || introOpen ||
    supportOpen || bugOpen || inviteOpen || quitOpen || delOpen ||
    tavernOpen || rollOpen || larderOpen || questOpen ||
    !!plantAsk || !!postTo || anyOpen || chronOpen;
  const heraldBtn = owner && !!my && my.user_id === userId && claimsReady && !panelOpen && !walk && !herald && heraldDue(my.id);

  return (


    <div className={`relative h-[100dvh] w-full overflow-hidden bg-background ${walk ? "[&>*:not(canvas):not([data-walk])]:hidden" : ""}`}>
      {visitNote && (
        <div data-walk role="status" className="pointer-events-auto absolute inset-x-0 top-[22%] z-50 mx-auto w-fit max-w-[88vw] rounded-md border-2 border-wood bg-card px-5 py-4 text-center font-semibold text-foreground shadow-[var(--shadow-panel)] animate-in fade-in zoom-in-95" onClick={() => setVisitNote(null)}>
          <div className="text-2xl" aria-hidden>🪙</div>
          {visitNote}
        </div>
      )}
      {walk && my && courtTask(my.id) && !audience && (() => {
        const P = PRINCELY[lang], ct = courtTask(my.id)!, done = new Set(errandDone.current.filter((r) => r.task_id === ct.id).map((r) => r.errand));
        return (
          <div data-walk className="absolute left-2 top-2 z-40 w-[min(16rem,70vw)] rounded-md border-2 border-wood bg-card/95 px-3 py-2 text-xs text-foreground shadow-[var(--shadow-panel)]">
            <div className="font-display text-sm font-bold">👑 {P.errandTitle} · {done.size}/{ERRANDS.length}</div>
            <ul className="mt-1 space-y-0.5">{ERRANDS.map((e) => <li key={e} className={done.has(e) ? "text-muted-foreground line-through" : ""}>{done.has(e) ? "✓" : "○"} {P.errandWho[e]}</li>)}</ul>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{done.size >= ERRANDS.length ? P.errandReady : P.errandHint}</p>
          </div>
        );
      })()}
      {walk && my && nearErrand && !audience && (
        <div data-walk className="absolute inset-x-0 top-[22%] z-40 flex justify-center">
          <WoodButton label={PRINCELY[lang].errand[nearErrand][0]} onClick={() => void doErrand(my.id, nearErrand)} className="h-11 px-4"><span className="text-sm font-semibold">{nearErrand === "gardener" ? "🌹" : "🐎"} {PRINCELY[lang].errand[nearErrand][0]}</span></WoodButton>
        </div>
      )}
      {walk && errandNote && (
        <div data-walk role="status" className="pointer-events-auto absolute inset-x-0 top-[30%] z-50 mx-auto w-fit max-w-[88vw] rounded-md border-2 border-wood bg-card px-5 py-3 text-center text-sm italic text-foreground shadow-[var(--shadow-panel)] animate-in fade-in zoom-in-95" onClick={() => setErrandNote(null)}>{errandNote}</div>
      )}
      {walk && nearCourt && !audience && (
        <div data-walk className="absolute inset-x-0 top-[14%] z-40 flex justify-center">
          <WoodButton label={COURT[lang].ask} onClick={() => { setAudience(audienceHost(worldHour(clock()))); jingle("fanfare"); }} className="h-11 px-4"><span className="text-sm font-semibold">👑 {COURT[lang].ask}</span></WoodButton>
        </div>
      )}
      {walk && audience && (
        <div data-walk role="dialog" aria-label={COURT[lang].ask} className="absolute inset-x-0 top-[12%] z-50 mx-auto w-[min(26rem,90vw)] rounded-md border-2 border-wood bg-card px-5 py-4 text-foreground shadow-[var(--shadow-panel)] animate-in fade-in zoom-in-95">
          <div className="text-center font-display text-lg font-bold">{COURT[lang][audience]}</div>
          <p className="mt-2 text-sm italic leading-relaxed">{audience === "prince" ? COURT[lang].princeSays(my?.owner ?? "") : audience === "herald" ? COURT[lang].heraldSays(my?.owner ?? "") : COURT[lang].closedSays}</p>
          {audience !== "closed" && my && my.user_id === userId && (<>
            {decree && <p className="mt-3 text-sm italic leading-relaxed">{decree}</p>}
            {!decree && <Button type="button" size="sm" className="mt-3 w-full" onClick={() => askDecree(my.id)}>📜 {PRINCELY[lang].ask}</Button>}
            {(() => { const o = openTaskOf(princelyRows.current, my.id); return o && o.task !== "court" && decree && decree !== PRINCELY[lang].swapped && decree !== PRINCELY[lang].wait ? <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={() => swapDecree(my.id)}>🔄 {PRINCELY[lang].swap}</Button> : null; })()}
            {audience === "prince" && !knights.current.has(my.id) && favourOf(princelyRows.current, my.id) >= PRINCELY_COUNT && <Button type="button" size="sm" className="mt-2 w-full" onClick={() => kneel(my.id, (my as { mayor_gender?: string | null }).mayor_gender === "w")}>⚔️ {PRINCELY[lang].kneel}</Button>}
            {knights.current.has(my.id) && <p className="mt-2 text-center text-xs font-semibold">🐎 {PRINCELY[lang].sir((my as { mayor_gender?: string | null }).mayor_gender === "w")}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{PRINCELY[lang].favour(favourOf(princelyRows.current, my.id), PRINCELY_COUNT)}</p>
          </>)}
          <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={() => setAudience(null)}>{COURT[lang].bow}</Button>
        </div>
      )}
      {walk && (
        <div data-walk className="pointer-events-none absolute inset-x-0 bottom-[var(--dock-bottom)] z-40 flex flex-col items-center gap-2">
          {coarse ? <WalkStick out={stick} label={t.hud.walk} /> : <span className="rounded bg-background/70 px-2 py-0.5 text-[11px] text-foreground/80">{t.hud.walkHint}</span>}
          <WoodButton label={t.hud.walkExit} onClick={() => { stick.current = { dx: 0, dy: 0 }; setWalk(false); }} className="pointer-events-auto h-11 gap-1.5 px-4">
            <X className="h-4 w-4" /><span className="text-xs">{t.hud.walkExit}</span>
          </WoodButton>
          {mayorAway() && <WoodButton label={t.hud.walkHome} onClick={() => { stick.current = { dx: 0, dy: 0 }; clearMayorOrder(); setWalk(false); }} className="pointer-events-auto h-9 px-3"><span className="text-xs">🏠 {t.hud.walkHome}</span></WoodButton>}
        </div>
      )}
      <LoadingScreen title="Samenland" lines={t.loading} onDone={openGuide} />
      {import.meta.env.DEV && <div ref={perfRef} className="pointer-events-none absolute left-1 top-1 z-50 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] leading-tight" />}
      <canvas
        ref={canvasRef}
        dir="ltr"
        style={{ touchAction: "none" }}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onLostPointerCapture={(e) => { touches.current.delete(e.pointerId); if (touches.current.size < 2) pinch.current = null; }}
        onPointerDown={(e) => {
          // a mouse is always a single pointer; drop any finger left over from a missed release
          if (e.pointerType === "mouse" || e.isPrimary) touches.current.clear();
          touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          try { (e.target as Element).setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
          if (touches.current.size >= 2) { pinch.current = null; if (drag.current) drag.current.moved = true; return; }
          fling.current = { vx: 0, vy: 0, t: performance.now() };
          drag.current = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, t0: performance.now(), touch: e.pointerType !== "mouse" };
          { const g = st.current.ghost; if (st.current.placing && g && e.pointerType !== "mouse") { const [tx, ty] = tileAt(e); if (Math.abs(tx - g[0]) <= 1 && Math.abs(ty - g[1]) <= 1) drag.current.ghost = true; } }
        }}
        onPointerMove={(e) => {
          const tp = touches.current;
          if (tp.has(e.pointerId)) tp.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (tp.size >= 2 && tp.has(e.pointerId)) {
            // two-finger pinch: zoom around the midpoint and pan with it
            const [a, b] = [...tp.values()];
            const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y), mx = (a!.x + b!.x) / 2, my = (a!.y + b!.y) / 2;
            const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
            const p = pinch.current;
            if (p && p.dist > 0) {
              const nz = Math.min(st.current.walk ? 20 : 12, Math.max(MIN_ZOOM, c.zoom * (dist / p.dist)));
              const ox = p.mx - r.left - r.width / 2, oy = p.my - r.top - r.height / 2;
              const wx = ox / c.zoom + c.x, wy = oy / c.zoom + c.y;
              const nx = mx - r.left - r.width / 2, ny = my - r.top - r.height / 2;
              c.zoom = nz; c.x = wx - nx / nz; c.y = wy - ny / nz;
              target.current = { zoom: nz, ax: (mx - r.left) * dpr.current, ay: (my - r.top) * dpr.current };
            }
            pinch.current = { dist, mx, my };
            if (drag.current) drag.current.moved = true;
            return;
          }
          const d = drag.current;
          if (d && (e.buttons || e.pointerType !== "mouse") && tp.size < 2) {
            const dx = e.clientX - d.x,
              dy = e.clientY - d.y;
            const lim = d.touch ? 10 : 3;
            if (!d.moved && Math.abs(e.clientX - (d.sx ?? d.x)) + Math.abs(e.clientY - (d.sy ?? d.y)) > lim) d.moved = true;
            if (d.moved && d.ghost) {
              const nt = tileAt(e), g = st.current.ghost;
              if (!g || g[0] !== nt[0] || g[1] !== nt[1]) { st.current.ghost = nt; setGhost(nt); }
              d.x = e.clientX; d.y = e.clientY;
            } else if (d.moved) {
              panDelta.current.dx += dx;
              panDelta.current.dy += dy;
              const nowT = performance.now(), f = fling.current, el = Math.max(1, nowT - f.t);
              const a = Math.min(1, el / 50); // smoothed release velocity over the last ~80 ms
              f.vx = f.vx * (1 - a) + (dx / el) * a; f.vy = f.vy * (1 - a) + (dy / el) * a; f.t = nowT;
              d.x = e.clientX;
              d.y = e.clientY;
            }
          }
          if (!drag.current?.moved) {
            const nt = tileAt(e), ph = st.current.hover;
            // the canvas reads the ref every frame; React state only feeds the seed/placing tooltip, so plain mouse moves never re-render the HUD
            if (!ph || ph[0] !== nt[0] || ph[1] !== nt[1]) {
              st.current.hover = e.pointerType === "mouse" || mode === "seed" || placing ? nt : null; if (mode === "seed" || placing) setHover(nt);
              // tile facts are written straight into the info strip, so mouse moves never re-render the HUD
              const box = tileInfoRef.current;
              if (box) {
                if (e.pointerType !== "mouse") box.style.display = "none";
                else {
                  const f = tileFacts(nt[0], nt[1], st.current.seeds, clock(), isPlantedRare(st.current.plantings, nt[0], nt[1])), ti = TILEINFO[lang];
                  const head = f.kind ? `${t.kind[f.kind] ?? (t.kinds as Record<string, string>)[f.kind] ?? f.kind}${f.seed ? ` (${f.seed})` : ""}` : t.terrain[f.terrain];
                  const parts = [head, ...(f.kind ? [t.terrain[f.terrain]] : []), ...f.animals.map((a) => ti.animals[a])];
                  box.textContent = parts.join(" · ") + (f.effects.length ? ` — ${f.effects.map((k) => ti.fx[k]).join(", ")}` : "");
                  box.style.display = "";
                }
              }
            }
          }
          if (mode === "seed" || placing) {
            ptrRef.current = [e.clientX, e.clientY];
            if (tipRef.current) { tipRef.current.style.left = `${e.clientX + 18}px`; tipRef.current.style.top = `${e.clientY + 18}px`; }
            if (!ptr) setPtr(ptrRef.current);
          }
          const hp = mode === "look" && !placing && !drag.current?.moved ? personAt(e) : null;
          peopleFocus.hover = hp ? pkey(hp) : null;
          (e.target as HTMLElement).style.cursor = hp ? "pointer" : "";
        }}
        onPointerCancel={(e) => { touches.current.delete(e.pointerId); pinch.current = null; drag.current = null; }}
        onPointerUp={(e) => {
          touches.current.delete(e.pointerId);
          if (touches.current.size > 0) {
            // one finger left after a pinch: continue as a drag from there, no click
            pinch.current = null;
            const [rest] = [...touches.current.values()];
            drag.current = { x: rest!.x, y: rest!.y, moved: true, touch: true };
            fling.current = { vx: 0, vy: 0, t: performance.now() };
            return;
          }
          pinch.current = null;
          const d = drag.current;
          drag.current = null;
          const nowT = performance.now();
          if (d?.ghost) { fling.current = { vx: 0, vy: 0, t: nowT }; if (d.moved) return; }
          if (d?.moved && nowT - fling.current.t > 80) fling.current = { vx: 0, vy: 0, t: nowT }; // held still before release: no glide
          if (d && !d.moved && placing && placeTap(!!d.touch) === "move") { const g = tileAt(e); st.current.ghost = g; setGhost(g); return; }
          if (d && !d.moved && d.touch && d.t0 != null && nowT - d.t0 > 350) { if (placing || mode !== "look") return; const p = personAt(e); if (p) { setPlace(null); return setWho(p); } const [lx, ly] = tileAt(e); const li = inspectAt(lx, ly, seeds, clock()); if (li) { setWho(null); setPlace(li); } return; } // long press opens what lies under the finger
          if (d && !d.moved && d.touch && !placing && mode === "look") {
            const lt = lastTap.current;
            if (nowT - lt.t < 300 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
              lastTap.current = { t: 0, x: 0, y: 0 };
              const r = canvasRef.current!.getBoundingClientRect();
              target.current = { zoom: Math.min(st.current.walk ? 20 : 12, target.current.zoom * 1.6), ax: (e.clientX - r.left) * dpr.current, ay: (e.clientY - r.top) * dpr.current };
              return;
            }
            lastTap.current = { t: nowT, x: e.clientX, y: e.clientY };
          }
          if (d && !d.moved) {
            if (placing) { const [px, py] = tileAt(e); return buy(placing, px, py); }
            if (walk) {
              // stroll mode: tapping a person or house talks to them; elsewhere the mayor walks there
              if (heraldHit(e)) { openHerald(); return; }
              if (talkTo(e)) return;
              const [tx, ty] = tileAt(e), my = seeds.find((x) => x.id === mine);
              if (my) { const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor"); if (me && commandMayor(me, tw, seeds, nw, [tx, ty])) tap((e.clientX / window.innerWidth) * 2 - 1); }
              return;
            }
            if (mode === "look") {
              const best = personAt(e);
              const pan = (e.clientX / window.innerWidth) * 2 - 1;
              if (best && best.role === "mayor" && best.seed.id !== mine && best.seed.user_id && userId) { tap(pan); setWho(null); setPlace(null); setDmPeer(best.seed.user_id); setTavernOpen(true); return; }
              if (heraldHit(e)) { openHerald(); return; }
              if (best) { hm(pan); setPlace(null); speak(best); return setWho(best); }
              if (courtAt(e)) { tap(pan); setWho(null); setPlace(null); return; }
              { const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
                const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
                const tr = lastTraders.find((f) => Math.hypot(f.x - wx, f.y - 3 - wy) < Math.max(4, 16 / c.zoom));
                if (tr) { tap(pan); setWho(null); setPlace(null); if (tr.stall) return setMsg(t.market.stall(tr.from, tr.good ? t.trade.goods[tr.good] ?? tr.good : "–", tr.to)); if (tr.walker) { const w = tr.walker; return setMsg(t.walker(w.kind, w.name, w.kind === "bridal" ? w.sex : t.job[w.craft]?.[w.sex === "f" ? 0 : 1] ?? w.craft, tr.from, tr.to)); } return setMsg(t.trade.trader(tr.cart, tr.good ? t.trade.goods[tr.good] ?? tr.good : "–", tr.from, tr.to)); } }
              const [tx, ty] = tileAt(e);
              { const g = twinGateAt(tx, ty, seeds, clock());
                if (g) { tap(pan); setWho(null); setPlace(null); const p = pactOf(g.a, g.b, seeds, clock());
                  return setMsg(`${t.twin.gate(g.a.name, g.b.name)}${p ? ` · ${t.twin.pacts[p.kind]![0]}` : ""}${marketDay(g, clock()) ? ` · ${t.twin.market}` : ""}`); } }
              const sm = signpostMap(seeds);
              for (const [dx, dy] of [[0, 0], [1, 1], [1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
                const sp = sm.get((ty + dy) * MAP + tx + dx);
                if (sp) { tap(pan); setWho(null); setPlace(null); return setMsg(`${t.signFrom(seeds.find((x) => x.id === sp.seed_id)?.name ?? "?")}: „${sp.message}“`); }
              }
              // a click on a pasture means the flock, never a house whose roof rises over it
              { const here = structureAt(tx, ty, seeds, clock());
                if (here?.kind === "pasture" && here.build === undefined) { baa(pan); setWho(null); setPlace(null); return; } }
              // send your mayor to a walkable tile of your own village; when he is selected this wins over nearby roofs
              const sendMayor = () => { const my = seeds.find((x) => x.id === mine); if (!my) return false;
                const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor");
                if (!me || tx < tw.x0 || tx > tw.x1 || ty < tw.y0 || ty > tw.y1 || !commandMayor(me, tw, seeds, nw, [tx, ty])) return false;
                tap(pan); setWho(null); setPlace(null); return true; };
              if (who?.role === "mayor" && who.seed.id === mine && sendMayor()) return;
              const ins0 = inspectAt(tx, ty, seeds, clock());
              const ins = ins0 && isPlantedRare(st.current.plantings, ins0.x, ins0.y) ? null : ins0;
              if (ins) { if (ins.kind === "pasture") baa(pan); else tap(pan); setWho(null); knock(ins); return setPlace(ins); }
              const hadCard = !!who || !!place;
              setPlace(null); setWho(null);
              if (!hadCard && sendMayor()) return;
            }
            const [x, y] = tileAt(e);
            onClick(x, y);
          }
        }}
        onPointerLeave={() => { st.current.hover = null; setHover(null); if (tileInfoRef.current) tileInfoRef.current.style.display = "none"; }}
      />
      {/* top bar */}
      <div ref={barRef} className="pointer-events-none absolute left-[var(--safe-l)] right-[var(--safe-r)] top-[max(0.5rem,env(safe-area-inset-top))] z-30 md:left-[max(0.75rem,env(safe-area-inset-left))] md:right-[max(0.75rem,env(safe-area-inset-right))] md:top-[max(0.75rem,env(safe-area-inset-top))]">
        <Panel inner="flex items-center gap-1.5 px-1.5 py-1 md:gap-5 md:px-3 md:py-1.5">
          {my && <CharacterBadge seed={my} lang={lang} />}
          <div className="min-w-0 shrink">
            <div title={my ? TOWN_CHARACTER[lang].land[wayOf(my)] : undefined} className="-my-[0.34em] truncate py-[0.34em] ps-0.5 pe-1 font-display text-lg leading-none text-wood md:pe-3 md:text-2xl">{my ? my.name : "Samenland"}{my && <span className="ms-1.5 text-sm text-muted-foreground md:text-base">{onIsland(lang, realm)}</span>}</div>
            <div className="hidden truncate text-xs text-muted-foreground sm:block">
              {my && myStats ? `${CHAR_ICON[wayOf(my)]} ${TOWN_CHARACTER[lang].names[wayOf(my)]}${myCharter ? ` · ${PATH_ICON[myCharter]} ${t.charter.paths[myCharter]![0]}` : ""} · ${t.stages[myRank]}${rankHint ? ` · ${rankHint}` : ""} · ${myStats.buildings} ${t.buildings}` : t.taglineShort}
            </div>
          </div>
          {my && at ? (
            <>
              <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold tabular-nums md:gap-2 md:text-sm">
                {(() => { const cap = chestCap(my.id, purchases), full = cash >= cap; return (
                <span className={`flex items-center gap-1 md:gap-1.5 ${full ? "text-destructive" : ""}`} title={`${CHEST[lang].title} · ${CHEST[lang].levels[chestLevel(my.id, purchases) - 1]}: ${Math.max(0, cash)} / ${t.taler(cap)}${full ? ` – ${CHEST[lang].full}` : ""}`}>
                  <span aria-hidden className="hidden h-4 w-4 place-items-center rounded-full border border-wood bg-[radial-gradient(circle_at_35%_30%,var(--color-coin-shine),var(--color-brass)_55%,var(--color-coin-edge))] text-[9px] font-bold leading-none text-wood shadow-[inset_0_-1px_0_var(--color-coin-edge)] md:grid md:h-5 md:w-5 md:text-[10px]">T</span>
                  {Math.max(0, cash).toLocaleString(LOCALE[lang])}<span className="font-normal text-muted-foreground">/<span className="md:hidden"> {cap.toLocaleString(LOCALE[lang])} {t.talerShort}</span><span className="hidden md:inline"> {t.taler(cap)}</span></span>
                </span>); })()}
                <span className="hidden text-xs font-normal text-primary sm:inline">{t.perDay(pop)}</span>
              </div>
              <div className="hidden text-sm sm:block">{t.people(residents)}</div>
              <button type="button" title={t.goods.larder} aria-label={`${t.attrs.food} ${at.food} · ${t.attrs.health} ${at.health} · ${t.attrs.wealth} ${at.wealth}`} onClick={() => setLarderOpen(true)} className="pointer-events-auto flex shrink-0 items-end gap-1 rounded px-0.5 py-1 hover:bg-muted lg:hidden md:px-1">
                {(["food", "health", "wealth"] as const).map((k) => (
                  <span key={k} className="relative h-6 w-1 overflow-hidden rounded bg-muted md:w-1.5"><span className="absolute inset-x-0 bottom-0 rounded bg-primary" style={{ height: `${at[k]}%` }} /></span>
                ))}
              </button>
              <div className="hidden gap-3 lg:flex">
                {(["food", "health", "wealth"] as const).map((k) => (
                  <div key={k} className="w-24 text-xs" title={k === "food" && larder ? t.goods.food(larder.food, larder.eaters) : undefined}>
                    <div className="flex justify-between gap-1"><span className="truncate">{t.attrs[k]}</span><span>{at[k]}</span></div>
                    <div className="h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${at[k]}%` }} /></div>
                  </div>
                ))}
                {my && weddingJoy(my, now) && <span className="self-center text-xs text-primary" title={t.fest.joy}>💍</span>}
              </div>
            </>
          ) : !userId ? (
            <Button size="sm" onClick={() => setAuthOpen(true)}><LogIn className="mr-1 h-4 w-4" />{t.signIn}</Button>
          ) : null}
          <div className="ms-auto hidden text-end text-xs text-muted-foreground md:block">
            <div>{gameDate(now, LOCALE[lang])}</div>
            <div>{t.seasons[season]} · {new Date(now).toLocaleTimeString(LOCALE[lang], { hour: "2-digit", minute: "2-digit", timeZone: REALM_TZ[realm] })}</div>
          </div>
          <div className="ms-auto flex shrink-0 items-center gap-1 md:ms-0">
            <button type="button" aria-label={sound ? t.soundOff : t.soundOn} title={sound ? t.soundOff : t.soundOn} onClick={toggleSound} className="hit relative grid h-7 w-7 place-items-center rounded-md hover:bg-accent md:h-8 md:w-8">
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button type="button" aria-label={fs ? t.exitFullscreen : t.fullscreen} title={fs ? t.exitFullscreen : t.fullscreen} onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())} className="hidden h-8 w-8 place-items-center rounded-md hover:bg-accent md:grid">
              {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button type="button" aria-label={t.guide.menu} title={t.guide.menu} onClick={() => setGuideOpen(true)} className="hit relative grid h-7 w-7 place-items-center rounded-md hover:bg-accent md:hidden">
              <BookOpen className="h-4 w-4" />
            </button>
            <button type="button" aria-label={t.hud.settings} title={t.hud.settings} aria-expanded={settings} onClick={() => { if (!settings) { setWho(null); setPlace(null); } setSettings(!settings); }} className="hit relative grid h-7 w-7 place-items-center rounded-md hover:bg-accent md:h-8 md:w-8">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </Panel>
        {settings && <div className="fixed inset-0 -z-10" aria-hidden onClick={() => setSettings(false)} />}
        {settings && (
          <Panel className="absolute end-0 top-full mt-2 w-64" inner="space-y-2 p-3 text-sm">
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              {t.hud.language}
              <select value={lang} aria-label={t.hud.language} onChange={(e) => switchLang(e.target.value as Lang)}
                className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {LANGS.map((l) => <option key={l} value={l} lang={l}>{LANG_LABEL[l]} · {LANG_NAME[l]}</option>)}
              </select>
            </label>
            {isAdmin && (<>
              <div className="text-xs text-muted-foreground">{t.hud.realm}</div>
              <div className="grid grid-cols-2 gap-1">
                {[...REALMS, "lab" as Realm].map((r) => (
                  <button key={r} className={`rounded px-2 py-1 text-xs ${realm === r ? "bg-accent text-foreground" : "hover:bg-accent/50"}`} onClick={() => { if (r === realm) return; localStorage.setItem("samenland-realm", r); loadRealmRef.current?.(r); }}>{t.realms[r]}</button>
                ))}
              </div>
              {realm === "lab" && (<>
                <div className="text-xs text-muted-foreground">{t.lab.title(LAB_SPEED)}</div>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 24, 168, 2160, 4380, 8760].map((h, i) => (
                    <button key={h} className={`rounded px-1 py-1 text-[10px] ${labJump() === h ? "bg-accent text-foreground" : "hover:bg-accent/50"}`} onClick={() => { localStorage.setItem("samenland-lab-jump", String(h)); setLabJump(h); tick((n) => n + 1); }}>{t.stages[i]}</button>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground">{t.lab.note}</div>
              </>)}
            </>)}
            {userId && home && (
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={mailOn} onChange={(e) => toggleMail(e.target.checked)} className="accent-primary" />
                ✉ {t.guide.notify.label}
              </label>
            )}
            <Button size="sm" variant="secondary" className="w-full" onClick={() => { setSettings(false); if (userId) setSupportOpen(true); else setAuthOpen(true); }}>🌱 {SUPPORT[lang].button}</Button>
            {userId && home && <Button size="sm" variant="secondary" className="w-full" onClick={() => { setInviteOpen(true); setSettings(false); }}>✉ {t.invite.button}</Button>}
            {userId && home && <button type="button" className="w-full rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10" onClick={() => { setQuitOpen(true); setSettings(false); }}>{t.quit.button}</button>}
            {userId && <button type="button" className="w-full rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10" onClick={() => { setDelOpen(true); setSettings(false); }}>{t.delAcc.button}</button>}
            {userId ? <Button size="sm" variant="secondary" className="w-full" onClick={() => { supabase.auth.signOut(); setSettings(false); }}>{t.signOut}</Button>
              : <Button size="sm" className="w-full" onClick={() => { setAuthOpen(true); setSettings(false); }}>{t.signIn}</Button>}
            {userId && <Button size="sm" variant="secondary" className="w-full" onClick={() => { setBugOpen(true); setSettings(false); }}>📜 {BUGS[lang].button}</Button>}
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-border/60 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <a href="https://lovable.dev/invite/LN0I260" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">♥ {t.imprint.built}</a>
              <button type="button" onClick={() => { setThanks(true); setImprint(false); setSettings(false); }} className="uppercase hover:text-foreground">{THANKS[lang].title}</button>
              <button type="button" onClick={() => { setImprint(true); setThanks(false); setSettings(false); }} className="uppercase hover:text-foreground">{t.imprint.title}</button>
            </div>
          </Panel>
        )}
      </div>

      {/* build rail: left on desktop, bottom on phones */}
      <div className="pointer-events-none absolute left-[var(--safe-l)] right-[var(--safe-r)] bottom-[var(--dock-bottom)] z-30 md:bottom-auto ltr:md:right-auto ltr:md:left-[max(0.75rem,env(safe-area-inset-left))] rtl:md:left-auto rtl:md:right-[max(0.75rem,env(safe-area-inset-right))] md:top-[var(--bar-h,6rem)]" style={{ "--bar-h": `${barH + 8}px` } as import("react").CSSProperties}>
        <Panel inner="!bg-wood !border-0 flex gap-1 p-1 md:flex-col">
          {tabs.map(({ k, icon: I, label }) => (
            <WoodButton key={k} label={label} active={tab === k} onClick={() => { setMoreOpen(false); pick(k); }} className={`h-11 flex-1 flex-col gap-0.5 md:flex md:h-14 md:w-14 md:flex-none ${k === "rituals" || k === "signs" ? "max-md:hidden" : ""}`}>
              <I className="h-5 w-5" /><span className="text-[10px] leading-none">{label}</span>
            </WoodButton>
          ))}
          {owner && myTown && (
            <WoodButton label={t.roll.title} active={rollOpen} onClick={() => setRollOpen(true)} className="h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
              <ScrollText className="h-5 w-5" /><span className="text-[10px] leading-none">{t.roll.menu}</span>
            </WoodButton>
          )}
          {userId && (
            <WoodButton label={t.tavern.menu} active={tavernOpen} onClick={() => setTavernOpen(true)} className="relative h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
              <Beer className="h-5 w-5" /><span className="text-[10px] leading-none">{t.tavern.menu}</span>
              {chatUnread > 0 && <span className="absolute end-1 top-1 h-2.5 w-2.5 rounded-full bg-destructive" />}
            </WoodButton>
          )}
          {my && (
            <WoodButton label={t.mayorFind} onClick={findMayor} className="max-md:hidden h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
              <Crown className="h-5 w-5" /><span className="text-[10px] leading-none">{t.roll.role["mayor"]![1]}</span>
            </WoodButton>
          )}
          <WoodButton label={t.guide.menu} active={guideOpen} onClick={() => setGuideOpen(true)} className="max-md:hidden h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 md:flex-none">
            <BookOpen className="h-5 w-5" /><span className="text-[10px] leading-none">{t.guide.menu}</span>
          </WoodButton>
          {my && (
            <WoodButton label={t.hud.menu} active={moreOpen || tab === "rituals" || tab === "signs"} onClick={() => setMoreOpen(!moreOpen)} className="h-11 flex-1 flex-col gap-0.5 md:hidden">
              <MoreHorizontal className="h-5 w-5" /><span className="text-[10px] leading-none">{t.hud.menu}</span>
            </WoodButton>
          )}
        </Panel>
        {moreOpen && my && (
          <>
            <div className="pointer-events-auto fixed inset-0 -z-10 md:hidden" aria-hidden onClick={() => setMoreOpen(false)} />
            <Panel className="absolute bottom-full end-0 mb-2 w-56 md:hidden" inner="!bg-wood !border-0 grid grid-cols-3 gap-1 p-1">
              <WoodButton label={t.hud.rituals} active={tab === "rituals"} onClick={() => { setMoreOpen(false); pick("rituals"); }} className="h-14 flex-col gap-0.5"><Bell className="h-5 w-5" /><span className="text-[10px] leading-none">{t.hud.rituals}</span></WoodButton>
              <WoodButton label={t.hud.signs} active={tab === "signs"} onClick={() => { setMoreOpen(false); pick("signs"); }} className="h-14 flex-col gap-0.5"><SignIcon className="h-5 w-5" /><span className="text-[10px] leading-none">{t.hud.signs}</span></WoodButton>
              <WoodButton label={t.mayorFind} onClick={() => { setMoreOpen(false); findMayor(); }} className="h-14 flex-col gap-0.5"><Crown className="h-5 w-5" /><span className="text-[10px] leading-none">{t.roll.role["mayor"]![1]}</span></WoodButton>
            </Panel>
          </>
        )}
      </div>
      {tab && (
        <div className="pointer-events-none absolute left-[var(--safe-l)] right-[var(--safe-r)] bottom-[calc(var(--dock-bottom)+4.5rem)] z-30 md:bottom-auto ltr:md:right-auto ltr:md:left-24 rtl:md:left-auto rtl:md:right-24 md:top-24 md:w-72">
          <div {...sheetSwipe(() => pick(tab))}><Panel className="max-h-[min(72dvh,calc(100dvh-11rem))] overflow-y-auto overscroll-contain max-md:rounded-t-2xl">{drawer}</Panel></div>
        </div>
      )}

      {/* minimap + zoom */}
      <div className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] end-[max(0.75rem,env(safe-area-inset-right))] z-20 hidden md:block">
        <Panel inner="p-1.5">
          <div dir="ltr"><Minimap seeds={seeds} mine={mine} view={view} onJump={(x, y) => focus(x, y)} /></div>
          <div className="mt-1.5 flex gap-1">
            <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.hud.zoomOut} onClick={() => zoomBy(1 / 1.6)}><Minus className="h-4 w-4" /></Button>
            <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.hud.zoomIn} onClick={() => zoomBy(1.6)}><Plus className="h-4 w-4" /></Button>
            {my && <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.toMine} title={t.toMine} onClick={() => focus(my.x, my.y)}><Home className="h-4 w-4" /></Button>}
            {my && <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.mayorFind} title={t.mayorFind} onClick={findMayor}><Crown className="h-4 w-4" /></Button>}
          </div>
        </Panel>
      </div>
      <Survey userId={userId} lang={lang} />

      {plantAsk && (() => {
        const [px, py] = plantAsk;
        const c = wayOf({ x: px, y: py });
        let near: Seed | null = null, nd = Infinity;
        for (const s of seeds) { const d = Math.hypot(px - s.x, py - s.y); if (d < nd) { nd = d; near = s; } }
        return (
          <Parchment image={ART["surveyor"]} title={t.plantAsk.title} later={t.cancel} onLater={() => setPlantAsk(null)}>
            <p className="mt-2 text-center font-display text-xl leading-snug">{t.plantAsk.intro(form.name.trim())}</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.land}</span><span className="text-right font-semibold">{CHAR_ICON[c]} {TOWN_CHARACTER[lang].names[c]}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.owner}</span><span className="text-right font-semibold">{form.owner.trim()}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.spread}</span><span className="text-right">{t.plantAsk.first(Math.round(radiusOf(8760)))}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.nearest}</span><span className="text-right">{near ? t.plantAsk.near(near.name, Math.round(nd)) : t.plantAsk.none}</span></div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{TOWN_CHARACTER[lang].land[c]}</p>
            <div className="mt-3 border-t border-border pt-3"><CharacterDetails seed={{ x: px, y: py }} lang={lang} /></div>
            <div className="mt-4 flex justify-center">
              <Button type="button" size="sm" disabled={planting} onClick={plantNow}>{planting ? t.plantAsk.wait : t.plantAsk.ok}</Button>
            </div>
          </Parchment>
        );
      })()}
      {larderOpen && larder && (
        <Parchment title={t.goods.larder} later={t.close} onLater={() => setLarderOpen(false)}>
          {at && <div className="mb-3 grid grid-cols-3 gap-3">{(["food", "health", "wealth"] as const).map((k) => (
            <div key={k} className="text-xs"><div className="flex justify-between gap-1"><span className="truncate">{t.attrs[k]}</span><span className="tabular-nums">{at[k]}</span></div>
              <div className="h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${at[k]}%` }} /></div></div>
          ))}</div>}
          <p className="text-xs text-muted-foreground">{t.goods.food(larder.food, larder.eaters)}</p>
          <div className="mt-3 border-t border-border pt-2 text-sm">
            <p className="mb-1 font-semibold">{t.goods.boonsTitle}</p>
            <ul className="space-y-0.5">
              {(["fed", "varied", "surplus"] as const).map((k) => (
                <li key={k} className={boons?.[k] ? "text-primary" : "text-muted-foreground"}>{boons?.[k] ? "✓" : "○"} {t.goods.boons[k]}</li>
              ))}
              <li className={my && sawmillUp(my, seeds, slow) ? "text-primary" : "text-muted-foreground"}>{my && sawmillUp(my, seeds, slow) ? "✓" : "○"} {t.goods.timber}</li>
            </ul>
            {(() => {
              const today = new Date(clock()).toISOString().slice(0, 10);
              const done = !!my && claims.some((c) => c.seed_id === my.id && c.quest === `market:${today}`);
              return (
                <div className="mt-2">
                  <button type="button" disabled={done} onClick={() => holdMarket(!boons?.surplus)}
                    className="rounded border border-border bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50">{boons?.surplus ? t.goods.market : t.goods.smallMarket}</button>
                  <p className="mt-1 text-xs text-muted-foreground">{done ? t.goods.marketDone : !boons?.surplus ? t.goods.marketNeed : ""}</p>
                </div>
              );
            })()}
          </div>
        </Parchment>
      )}
      {thanks && (
        <Parchment wide title={THANKS[lang].title} later={t.close} onLater={() => setThanks(false)}>
          <ul className="list-disc space-y-2 ps-5 text-ink">
            <li>{THANKS[lang].settlers}</li>
            <li>{THANKS[lang].anno}</li>
            <li>{THANKS[lang].simcity}</li>
            <li>{THANKS[lang].oss}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 ps-5 text-sm text-ink/80" dir="ltr">
            {OSS.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">{n}</a>)}
          </div>
        </Parchment>
      )}
      {dupOf && mySeed && (
        <Parchment title={RENAME[lang].title} later={RENAME[lang].later} onLater={skipRename}>
          <div className="space-y-3 text-center text-ink">
            <p>{RENAME[lang].body(mySeed.name)}</p>
            <div className="flex items-center gap-2">
              <Input maxLength={32} value={renameName} placeholder={t.townName} onChange={(e) => { setRenameName(e.target.value); setRenameErr(""); }} />
              <button type="button" onClick={() => { setRenameName(suggestTownName(seeds.map((s) => s.name), Math.random, renameName)); setRenameErr(""); }} aria-label={t.townName} title={t.townName} className="hit relative shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"><Dices className="h-4 w-4" /></button>
            </div>
            {renameErr && <p className="text-sm text-destructive">{renameErr}</p>}
            <Button onClick={() => void saveRename()}>{RENAME[lang].save}</Button>
          </div>
        </Parchment>
      )}
      {imprint && (
        <Parchment title={t.imprint.title} later={t.close} onLater={() => setImprint(false)}>
          <div className="space-y-3 text-center text-ink">
            <div>Stephan Dörner<br />Bornholmer Str. 89<br />10439 Berlin</div>
            <div>{t.imprint.contact}: <a href="mailto:stephan.doerner@posteo.de" className="underline decoration-ink/30 underline-offset-2">stephan.doerner@posteo.de</a></div>
            <p className="text-sm italic text-ink/80">{t.imprint.note}</p>
          </div>
        </Parchment>
      )}
      {supportOpen && (
        <Parchment title={SUPPORT[lang].title} later={t.cancel} onLater={() => { setSupportOpen(false); void loadSupport(); }}>
          <SupportBox lang={lang} seedId={home?.id ?? null} owned={home ? support.get(home.id) ?? new Set() : new Set()} signedIn={!!userId} hasDog={!!home && (support.get(home.id)?.has("dog") || (home.name === "Roggenfeld" && /id-preview|localhost|lovableproject/.test(location.hostname)))} dogName={home ? dogNames.get(home.id) ?? "" : ""} onDogName={async (n) => { if (!home) return false; const { error } = await supabase.from("village_dogs").upsert({ seed_id: home.id, name: n, updated_at: new Date().toISOString() }); if (!error) setDogNames((m) => new Map(m).set(home.id, n)); return !error; }} />
        </Parchment>
      )}
      {bugOpen && userId && (
        <Parchment title={BUGS[lang].button} later={t.cancel} onLater={() => setBugOpen(false)}>
          <BugReport lang={lang} userId={userId} context={{ realm, lang, town: home?.name ?? null, url: typeof location !== "undefined" ? location.href : "", ua: typeof navigator !== "undefined" ? navigator.userAgent : "", screen: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}` : "" }} onClose={() => setBugOpen(false)} />
        </Parchment>
      )}
      {inviteOpen && home && (() => {
        const ok = Date.now() - Date.parse(home.created_at) >= 24 * 3600e3;
        const link = `https://samenland.app/?ref=${home.id}`;
        const n = claims.filter((c) => c.seed_id === home.id && c.quest.startsWith("ref:")).length;
        return (
          <Parchment image={ART["surveyor"]} title={t.invite.title} later={t.cancel} onLater={() => setInviteOpen(false)}>
            {ok ? (<>
              <p className="mt-2 text-center text-sm leading-snug">{t.invite.body}</p>
              <Input className="mt-3 text-xs" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
              <div className="mt-3 flex justify-center">
                <Button type="button" size="sm" onClick={async () => {
                  const text = `${t.invite.share} ${link}`;
                  try { if (navigator.share) await navigator.share({ text, url: link }); else await navigator.clipboard.writeText(text); setMsg(t.invite.copied); }
                  catch { try { await navigator.clipboard.writeText(text); setMsg(t.invite.copied); } catch { /* user cancelled */ } }
                }}>{t.invite.copy}</Button>
              </div>
              {(() => {
                const post = encodeURIComponent(`${t.invite.post} ${link}`);
                const items: [string, string][] = [
                  [`✉ ${t.invite.mail}`, `mailto:?subject=${encodeURIComponent(t.invite.mailSubject)}&body=${encodeURIComponent(t.invite.mailBody(link))}`],
                  ["Mastodon", `https://toot.kytta.dev/?text=${post}`],
                  ["Bluesky", `https://bsky.app/intent/compose?text=${post}`],
                  ["X", `https://x.com/intent/tweet?text=${post}`],
                ];
                return (
                  <div className="mt-3 flex flex-wrap justify-center gap-2" aria-label={t.invite.shareOn}>
                    {items.map(([label, href]) => (
                      <Button key={label} asChild size="sm" variant="secondary">
                        <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer">{label}</a>
                      </Button>
                    ))}
                  </div>
                );
              })()}
              {n > 0 && <p className="mt-2 text-center text-xs text-muted-foreground">{t.invite.count(n)}</p>}
            </>) : <p className="mt-2 text-center text-sm">{t.invite.locked}</p>}
          </Parchment>
        );
      })()}
      {quitOpen && home && (
        <Parchment image={ART["surveyor"]} title={t.quit.title(home.name)} later={t.cancel} onLater={() => { setQuitOpen(false); setQuitName(""); }}>
          <p className="mt-2 text-center text-sm leading-snug">{t.quit.warn}</p>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t.quit.type(home.name)}</p>
          <Input className="mt-2" value={quitName} onChange={(e) => setQuitName(e.target.value)} placeholder={home.name} />
          <div className="mt-4 flex justify-center">
            <Button type="button" size="sm" variant="destructive" disabled={quitting || quitName.trim() !== home.name} onClick={async () => {
              setQuitting(true);
              const { error } = await supabase.rpc("abandon_village", { _seed: home.id });
              setQuitting(false);
              if (error) { toast.error(t.quit.fail); return; }
              const id = home.id;
              setSeeds((s) => s.filter((x) => x.id !== id));
              setHome(null); setQuitOpen(false); setQuitName("");
              toast.success(t.quit.done);
            }}>{quitting ? t.plantAsk.wait : t.quit.ok}</Button>
          </div>
        </Parchment>
      )}
      {delOpen && userId && (
        <Parchment image={ART["surveyor"]} title={t.delAcc.title} later={t.cancel} onLater={() => { setDelOpen(false); setDelWord(""); }}>
          <p className="mt-2 text-center text-sm leading-snug">{t.delAcc.warn}</p>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t.delAcc.type}</p>
          <Input className="mt-2" value={delWord} onChange={(e) => setDelWord(e.target.value)} placeholder={t.delAcc.word} />
          <div className="mt-4 flex justify-center">
            <Button type="button" size="sm" variant="destructive" disabled={quitting || delWord.trim().toUpperCase() !== t.delAcc.word.toUpperCase()} onClick={async () => {
              setQuitting(true);
              let ok = false;
              try { ok = (await delFn()).ok; } catch { ok = false; }
              setQuitting(false);
              if (!ok) { toast.error(t.delAcc.fail); return; }
              const uid = userId;
              setSeeds((s) => s.filter((x) => x.user_id !== uid));
              setHome(null); setDelOpen(false); setDelWord("");
              await supabase.auth.signOut();
              toast.success(t.delAcc.done);
            }}>{quitting ? t.plantAsk.wait : t.delAcc.ok}</Button>
          </div>
        </Parchment>
      )}
      {encOpen && my && (() => {
        const ev = pendingEncounter(my, my.decisions ?? [], clock());
        const fxText = (e: string, c: string) => {
          const ch = choiceOf(e, c)!; const f = ch.fx as { h?: number; growth?: number; food?: number; health?: number; wealth?: number };
          const parts = [f.growth ? t.enc.growth(Math.round(f.growth * 100)) : "", f.food ? `+${f.food} ${t.enc.food}` : "", f.health ? `+${f.health} ${t.enc.health}` : "", f.wealth ? `+${f.wealth} ${t.enc.wealth}` : ""].filter(Boolean);
          return parts.length && f.h ? `${parts.join(" · ")} · ${t.enc.lasts(f.h)}` : parts.join(" · ");
        };
        const created = Date.parse(my.created_at);
        return (
          <Parchment image={ev ? ART[ev] : undefined} title={ev ? t.enc.events[ev]![0] : t.enc.title} later={t.enc.later} onLater={() => later("encounter")}>
                {!ev ? <p className="mt-2 text-sm text-muted-foreground">{t.enc.decided}</p> : (
                  <>
                    {(() => {
                      const w = ev === "wedding" ? townOf(my, seeds, clock()).weddings.filter((x) => x.at <= clock()).pop() : undefined;
                      const live = w && clock() - w.at < 3 * 3600e3;
                      return <>
                        <p className="mt-2 text-center font-display text-xl leading-snug">{live ? t.enc.couple(`${w.a.first} ${w.a.last}`, `${w.b.first} ${w.b.maiden ?? w.b.last}`) : t.enc.events[ev]![1]}</p>
                        {live && <div className="mt-2 text-center"><button type="button" className="rounded-md border-2 border-brass px-3 py-1 text-sm font-semibold text-wood hover:bg-brass/20" onClick={() => { const nw = clock(), tw = townOf(my, seeds, nw), p = tw.people.find((q) => q.id === w.a.id); const z = p ? poseOf(p, tw, seeds, nw) : null; later("encounter"); if (z) focus(z.x, z.y); if (p) setWho(p); }}>{t.enc.look}</button></div>}
                      </>;
                    })()}
                    <div className="mt-4 grid gap-2">
                      {Object.keys(ENCOUNTERS[ev]).map((c) => {
                        const cost = choiceOf(ev, c)!.cost, poor = cost > cash, fx = fxText(ev, c);
                        return (
                          <button key={c} type="button" disabled={poor} onClick={() => decide(ev, c)} className="rounded-md border-2 border-border p-2 text-left hover:border-brass hover:bg-brass/20 disabled:opacity-50">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-wood">{t.enc.choices[`${ev}:${c}`]}</span>
                              <span className="text-xs font-semibold tabular-nums">{cost > 0 ? t.taler(cost) : cost < 0 ? t.enc.gain(-cost) : t.enc.free}</span>
                            </div>
                            {(fx || poor) && <div className="text-xs text-muted-foreground">{poor ? t.enc.poor : fx}</div>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <h3 className="mt-5 font-display text-2xl text-wood">{t.enc.chronicle}</h3>
                {(my.decisions ?? []).length === 0 ? <p className="text-xs text-muted-foreground">{t.enc.none}</p> : (
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {[...(my.decisions ?? [])].reverse().slice(0, 8).map((d) => (
                      <li key={d.at}>{t.enc.dayN(Math.floor((d.at - created) / 86400000) + 1)}: {t.enc.events[d.event]?.[0]} – {t.enc.choices[`${d.event}:${d.choice}`]}</li>
                    ))}
                  </ul>
                )}
          </Parchment>
        );
      })()}
      {roadOpen && my && (
        <Parchment image={ART["road"]} title={t.road.title} later={t.enc.later} onLater={() => later("road")}>
              <p className="mt-2 text-sm text-center">{t.road.intro}</p>
              {roadCandidates(my, seeds).length === 0 ? <p className="mt-4 text-sm font-semibold">{t.road.none}</p> : (
                <>
                  <div className="mt-4 grid gap-2">
                    {roadCandidates(my, seeds).map((o) => {
                      const c = wayOf(o), ch = charters.find((x) => x.seed_id === o.id)?.path;
                      return (
                        <div key={o.id} onClick={() => setRoadPick(o.id)} className={`flex cursor-pointer items-center gap-2 rounded-md border-2 p-2 ${roadPick === o.id ? "border-brass bg-brass/20" : "border-border"}`}>
                          <button type="button" aria-pressed={roadPick === o.id} onClick={() => setRoadPick(o.id)} className="flex-1 py-1 text-left">
                            <div className="font-semibold text-wood">{o.name}</div>
                            <div className="text-xs text-muted-foreground">{t.road.dist(Math.round(Math.hypot(o.x - my.x, o.y - my.y)))} · ⏳ {roadHours(my, o)} h · {CHAR_ICON[c]} {TOWN_CHARACTER[lang].names[c]}{ch ? ` · ${PATH_ICON[ch]} ${t.charter.paths[ch]![0]}` : ""}</div>
                          </button>
                          <Button size="sm" variant="secondary" onClick={() => { focus(o.x, o.y); later("road"); }}>{t.road.look}</Button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{t.road.final}</span>
                    <Button disabled={!roadPick || !!roadBuilding(my, now, seeds)} onClick={sealRoad}>{t.road.seal}</Button>
                  </div>
                </>
              )}
        </Parchment>
      )}

      {pactOpen && my && pactPartner && (() => {
        const theirs = (pactPartner.votes ?? []).filter((v) => v.partner === my.id).sort((a, b) => b.at - a.at)[0];
        return (
          <Parchment image={ART["charter"]} title={t.twin.title(my.name, pactPartner.name)} later={t.enc.later} onLater={() => later("pact")}>
            <p className="mt-2 text-sm text-center">{t.twin.intro}</p>
            {theirs && <p className="mt-2 text-center text-sm font-semibold">{t.twin.partnerChose(t.twin.pacts[theirs.pact]![0])}</p>}
            <div className="mt-4 grid gap-2">
              {PACTS.map((p) => (
                <button key={p} type="button" aria-pressed={pactPick === p} onClick={() => setPactPick(p)}
                  className={`rounded-md border-2 p-2 text-left ${pactPick === p ? "border-brass bg-brass/20" : "border-border hover:border-brass/60"}`}>
                  <div className="font-semibold text-wood">{t.twin.pacts[p]![0]}</div>
                  <div className="text-xs text-muted-foreground">{t.twin.pacts[p]![1]}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end"><Button disabled={!pactPick} onClick={sealPact}>{t.twin.seal}</Button></div>
          </Parchment>
        );
      })()}
      {charterOpen && my && (
        <Parchment wide image={ART["charter"]} title={`${t.charter.title} · ${my.name}`} later={t.enc.later} onLater={() => later("charter")}>
              <p className="mt-2 text-sm text-center">{t.charter.intro}</p>
              {!charterReady(my.created_at, now) ? (
                <p className="mt-4 text-sm font-semibold">{t.charter.locked}</p>
              ) : (
                <>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {CHARTER_PATHS.map((p) => {
                      const [name, style, bonus, builds] = t.charter.paths[p]!;
                      return (
                        <button key={p} type="button" onClick={() => setCharterPick(p)} aria-pressed={charterPick === p}
                          className={`rounded-md border-2 p-3 text-left transition ${charterPick === p ? "border-brass bg-brass/20" : "border-border hover:border-brass/60"}`}>
                          <div className="font-display text-2xl leading-none text-wood">{PATH_ICON[p]} {name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{style}</div>
                          <div className="mt-2 text-xs"><b>+</b> {bonus}</div>
                          <div className="mt-1 text-xs"><b>{t.charter.buildings}:</b> {builds}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{t.charter.final}</span>
                    <Button disabled={!charterPick} onClick={sealCharter}>{t.charter.sealBtn}</Button>
                  </div>
                </>
              )}
        </Parchment>
      )}

      {profile && (
        <TownProfile t={t} lang={lang} town={seeds.find((x) => x.id === profile.id) ?? profile} me={my ?? null} seeds={seeds} now={clock()} onClose={() => setProfile(null)} onLook={() => { focus(profile.x, profile.y); setProfile(null); }} />
      )}
      {rollOpen && my && myTown && (
        <VillageRoll t={t} town={myTown} hue={my.hue} character={<><CharacterDetails seed={my} lang={lang} /><div className="mt-2"><Outlook t={t} lang={lang} my={my} seeds={seeds} now={slow} rank={myRank} charter={myCharter} way={wayOf(my)} /></div>{guestbook}</>} onClose={() => setRollOpen(false)} onPick={(p) => {
          const now = clock();
          const z = poseOf(p, townOf(p.seed, seeds, now), seeds, now);
          setRollOpen(false);
          focus(z.visible ? z.x : p.home[0], z.visible ? z.y : p.home[1]);
          cam.current.zoom = Math.max(cam.current.zoom, 2);
          setWho(p);
          setMsg(z.visible ? null : `${p.first} ${z.act === "sleep" || z.act === "home" || z.act === "sick" ? t.roll.home : t.roll.inside}`);
        }} />
      )}
      {labOpen && <FigureLab onClose={() => setLabOpen(false)} />}
      <Tavern t={t} open={tavernOpen} onClose={() => { setTavernOpen(false); setDmPeer(null); }} peer={dmPeer} userId={userId} my={my} seeds={seeds} realm={realm} lang={lang} onUnread={setChatUnread} />
      {waitDone && !waitShut && !anyOpen && !decision.open && (
        <div className="pointer-events-none absolute inset-x-2 z-20 flex justify-center" style={{ top: barH + 56 }}>
          <Panel className="w-full max-w-md" inner="relative p-3 text-center">
            <button type="button" aria-label={t.hud.close} onClick={shutWait} className="pointer-events-auto absolute end-0 top-0 p-2.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>

            <p className="px-4 font-display text-lg leading-snug text-wood">🔨 {t.guide.wait.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.guide.wait.body(Math.max(1, Math.ceil((waitDone - now) / 3.6e6)))}</p>
            {mailOn ? <p className="mt-2 text-xs text-primary">{t.guide.notify.on}</p>
              : <Button size="sm" variant="secondary" className="pointer-events-auto mt-2" onClick={() => toggleMail(true)}>✉ {t.guide.notify.label}</Button>}
          </Panel>
        </div>
      )}
      {welcome && !my && !guideOpen && (
        <div className="pointer-events-none absolute inset-x-2 top-20 z-30 flex justify-center md:top-24">
          <Panel className="w-full max-w-md" inner="relative p-3 text-center">
            <button type="button" aria-label={t.hud.close} onClick={() => setWelcome(false)} className="pointer-events-auto absolute right-0 top-0 p-2.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            <p className="px-4 font-display text-lg leading-snug text-wood">{t.guide.welcome.pitch}</p>
            <div className="mt-2 flex justify-center gap-2">
              <Button size="sm" onClick={() => { setWelcome(false); if (userId) setTab("plant"); else setAuthOpen(true); }}><Sprout className="mr-1 h-4 w-4" />{t.guide.welcome.plant}</Button>
              <Button size="sm" variant="secondary" onClick={() => { setWelcome(false); setGuideOpen(true); }}>{t.guide.welcome.more}</Button>
            </div>
          </Panel>
        </div>
      )}
      {introOpen && (
        <Parchment image={ART["guide"]} title={book.first.title} later={book.first.go} onLater={() => setIntroOpen(false)}>
          <ol className="list-decimal space-y-2 ps-5 text-sm">
            {book.first.rules.map(([b, r]) => <li key={b}><b className="text-ink">{b}</b> {r}</li>)}
          </ol>
          <div className="mt-4 flex justify-center">
            <Button size="sm" variant="secondary" onClick={() => { setIntroOpen(false); setGuideOpen(true); }}>{book.first.more}</Button>
          </div>
        </Parchment>
      )}
      {guideOpen && (
        <Parchment wide image={ART["guide"]} title={book.title} later={t.guide.close} onLater={() => setGuideOpen(false)}>
          <ol className="list-decimal space-y-1 ps-5 text-sm">
            {book.first.rules.map(([b, r]) => <li key={b}><b className="text-ink">{b}</b> {r}</li>)}
          </ol>
          {book.chapters.map(([h, items], ci) => (
            <section key={h} className="mt-4">
              <h3 className="font-display text-lg text-ink">{h}</h3>
              <ul className="mt-1 space-y-1.5 text-sm">
                {(ci === 5 ? [...items, [CHEST[lang].title, `${CHEST[lang].intro} ${CHEST[lang].levels.map((l, i) => `${l}: ${t.taler([800, CHEST_CAP.chest2, CHEST_CAP.chest3, CHEST_CAP.chest4][i]!)}`).join(" · ")}. ${CHEST[lang].notify}.`] as [string, string]] : items).map(([b, d], i) => <li key={i}>{b && <b className="text-ink">{b}: </b>}{d}</li>)}
              </ul>
            </section>
          ))}
        </Parchment>
      )}

      {heraldBtn && my && (
        <div className="absolute inset-x-0 z-30 flex justify-center pointer-events-none" style={{ top: barH + 8 }}>
          <WoodButton label={HERALD[lang].button} onClick={() => { const hs = heraldSpots.get(my.id); if (hs) { cam.current.x = hs.x; cam.current.y = hs.y - 6; } openHerald(); }} className="pointer-events-auto h-10 px-3 animate-in fade-in"><span className="text-sm font-semibold">📜 {HERALD[lang].button}</span></WoodButton>
        </div>
      )}
      {herald && my && (
        <Parchment title={HERALD[lang].title} later={HERALD[lang].leave} onLater={() => setHerald(false)}>
          <p className="text-sm italic leading-relaxed text-ink">{HERALD[lang].arrive}</p>
          {decree ? <p className="mt-3 text-sm italic leading-relaxed text-ink">{decree}</p>
            : <Button type="button" size="sm" className="mt-3 w-full" onClick={() => askDecree(my.id)}>📜 {HERALD[lang].ask}</Button>}
          {decree && openTaskOf(princelyRows.current, my.id) && <p className="mt-2 text-xs italic text-muted-foreground">{HERALD[lang].read}</p>}
          <p className="mt-2 text-xs text-muted-foreground">{PRINCELY[lang].favour(favourOf(princelyRows.current, my.id), PRINCELY_COUNT)}</p>
        </Parchment>
      )}
      {owner && quest && claimsReady && !panelOpen && (
        <div className={`absolute right-16 z-30 ${heraldBtn ? "max-md:mt-12" : ""} ${waitDone && !waitShut && !anyOpen && !decision.open ? "max-md:hidden" : ""} max-w-[calc(100vw-5rem)] md:w-64 ${questFold ? "w-44" : "w-60"}`} style={{ top: barH + 8 }}>
          <div className="parchment px-3 py-2 text-sm text-ink shadow">
            <div className="flex w-full items-start gap-1">
              <button type="button" aria-expanded={!questFold} onClick={() => setQuestFold((f) => !f)} className="flex min-w-0 flex-1 items-start justify-between gap-2 text-start">
                <span className="font-display text-base leading-tight">{petition!.header}</span>
                <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 opacity-60 transition-transform ${questFold ? "" : "rotate-180"}`} />
              </button>
              {petition!.person && <button type="button" aria-label={petition!.find} title={petition!.find} className="hit relative shrink-0 rounded p-0.5 text-wood hover:bg-ink/10" onClick={() => { const nw = clock(), tw = townOf(my!, seeds, nw), p = tw.people.find((q) => q.id === petition!.person!.id); const z = p ? poseOf(p, tw, seeds, nw) : null; if (z) focus(z.x, z.y); if (p) setWho(p); }}><MapPin className="h-4 w-4" /></button>}
            </div>
            {!questFold && (
              <div className="mt-1 space-y-1">
                <div className="font-semibold">{questText![0]}</div>
                <div className={`text-xs opacity-80 ${petition!.plea ? "italic" : ""}`}>{petition!.plea ?? questText![1]}</div>
                {quest.need > 1 && <div className="h-1 overflow-hidden rounded bg-ink/10"><div className="h-full bg-brass/70" style={{ width: `${(100 * quest.have) / quest.need}%` }} /></div>}
                <div className="text-end text-xs opacity-70">{t.quests.reward(quest.reward)}</div>
                {quest.ready
                  ? <Button size="sm" className="h-7 w-full" onClick={() => setQuestOpen(true)}>{t.quests.claim}</Button>
                  : <Button size="sm" variant="outline" className="h-7 w-full" onClick={questHow}>{t.quests.how}</Button>}
              </div>
            )}
          </div>
        </div>
      )}
      {owner && my && quest?.ready && questOpen && (
        <Parchment image={ART["quest"]} title={petition!.milestone ? feastTitle(lang) : petition!.who!} later={t.quests.later} onLater={() => setQuestOpen(false)}>
          <p className="text-center font-semibold">{questText![0]}</p>
          {petition!.thanks && <p className="mt-2 text-center italic">{petition!.thanks}</p>}
          {!petition!.thanks && <p className="mt-2 text-center italic">{petition!.milestone ? "" : `${t.quests.says(my.owner)} `}„{questText![2]}“</p>}
          {quest.quest === "metro" && <p className="mt-1 text-center text-sm">{t.quests.end}</p>}
          <div className="mt-4 flex justify-center"><Button onClick={claimQuest}>{t.quests.claim} · {t.taler(quest.reward)}</Button></div>
        </Parchment>
      )}
      {chronBanner && !panelOpen && (
        <button type="button" onClick={openChron} className="parchment absolute left-1/2 z-30 -translate-x-1/2 px-4 py-1.5 font-display text-lg text-ink shadow-lg" style={{ top: barH + 8 }}>
          {t.chron.banner(Math.max(1, Math.floor(((chron?.to ?? 0) - (chron?.from ?? 0)) / 864e5)))}
        </button>
      )}
      {owner && !panelOpen && !chronBanner && (
        <button type="button" onClick={openChron} title={t.chron.open} aria-label={t.chron.open} className="absolute right-3 z-30 grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-card/90 text-foreground shadow" style={{ top: barH + 8 }}>
          <BookOpen className="h-5 w-5" />
        </button>
      )}

      {giftReadsReady && !festNow && my && !anyOpen && !decision.open && !chronOpen && (() => {
        const g = thankable(my.id, gifts, now).find((x) => !seenGifts.includes(x.id));
        const tl = !g ? gifts.find((x) => x.kind === "thanks" && x.to_seed === my.id && now - Date.parse(x.created_at) < 7 * 864e5 && !seenGifts.includes(x.id)) : undefined;
        const e = g ?? tl; if (!e) return null;
        const from = seeds.find((s) => s.id === e.from_seed); if (!from) return null;
        if (giftSounded.current !== e.id) { giftSounded.current = e.id; const gk = g ? "gift" : "letter"; setTimeout(() => jingle(gk), 0); }
        const seen = () => {
          const n = mergeGiftReads(seenGifts, [e.id]);
          setSeenGifts(n);
          if (!userId) return;
          try { localStorage.setItem(giftReadKey(userId), JSON.stringify(n)); } catch { /* account receipt below */ }
          void supabase.from("gift_reads").upsert({ user_id: userId, gift_id: e.id }, { onConflict: "user_id,gift_id", ignoreDuplicates: true }).then(({ error }) => { if (error) console.warn("Gift read receipt could not sync", error.code); });
        };
        return (
          <Parchment image={ART["fair"]} title={g ? t.gifts.gotTitle : t.gifts.letterTitle} later={t.fest.close} onLater={seen}>
            {g ? (<>
              <p className="text-center text-ink">{t.gifts.got(from.name, g.amount, g.kind === "aid")}</p>
              <div className="mt-4 grid gap-2">{t.gifts.notes.map((n, i) => <Button key={i} variant="secondary" onClick={() => { seen(); sendGift(from, "thanks", i); }}>{n}</Button>)}</div>
            </>) : (
              <p className="text-center font-['Caveat'] text-xl text-ink">„{t.gifts.notes[tl!.note] ?? t.gifts.notes[0]}“ — {from.name}</p>
            )}
          </Parchment>
        );
      })()}
      {festNow && my && (() => { const [h, body] = festText(festNow); const go = () => { const e = festNow as { x?: number; y?: number }; if (e.x != null && e.y != null) focus(e.x, e.y); else focus(my.x, my.y); setFest((q) => q.slice(1)); }; return (
        <Parchment image={festArt(festNow)} title={h} later={t.fest.close} onLater={() => setFest((q) => q.slice(1))}>
          <p className="text-center font-display text-xl leading-snug text-ink">{body}</p>
          <div className="mt-4 flex justify-center gap-2">
            {festNow.code === "letter" ? (() => { const fe = festNow; const o = seeds.find((x) => x.name === fe.other); return o && owner ? <Button onClick={() => { setFest((q) => q.slice(1)); setPostText(""); setPostTo(o); }}>{t.post.reply}</Button> : null; })() : <Button onClick={go}>{t.fest.go}</Button>}
          </div>
        </Parchment>
      ); })()}
      {postTo && my && (
        <Parchment title={t.post.title(postTo.name)} later={t.fest.close} onLater={() => setPostTo(null)}>
          <p className="text-center text-sm text-ink/70">{t.post.hint}</p>
          <textarea className="mt-3 w-full rounded border border-border bg-background/80 p-2 text-ink" rows={3} maxLength={140} value={postText} placeholder={t.post.place} onChange={(e) => setPostText(e.target.value)} />
          <div className="mt-1 text-right text-xs text-ink/60">{postText.length}/140</div>
          <div className="mt-3 flex justify-center"><Button disabled={!postText.trim()} onClick={sendLetter}>{t.post.go}</Button></div>
        </Parchment>
      )}
      {chronOpen && chron && my && (
        <Parchment title={t.chron.title} later={t.chron.close} onLater={() => setChronOpen(false)}>
          <p className="text-center text-sm text-ink/70">{t.chron.away(Math.max(1, Math.round((chron.to - chron.from) / 864e5)))}</p>
          <p className="mt-3 text-center font-display text-xl leading-snug text-ink">{scribe === undefined ? <span className="animate-pulse text-ink/60">{t.chron.writing}</span> : scribe ?? t.chron.greet}</p>
          <div className="mt-4 flex justify-center gap-4 font-display text-lg text-ink">
            <span>{t.chron.pop(chron.popFrom, chron.popTo)}</span><span>{t.chron.taler(chron.taler)}</span>
          </div>
          {chron.events.length === 0 ? <p className="mt-3 text-center text-sm text-ink/70">{t.chron.quiet}</p> : (
            <ul className="mt-3 space-y-1 border-l-2 border-ink/20 pl-3">
              {chron.events.slice(-14).map((e, i) => (
                <li key={i}>
                  <button type="button" className="text-left text-sm text-ink hover:underline" onClick={() => { if (e.code === "letter") setFest((q) => [e, ...q]); else { const p = e as { x?: number; y?: number }; if (p.x != null && p.y != null) focus(p.x, p.y); else focus(my.x, my.y); } setChronOpen(false); }}>
                    <span className="mr-2 text-ink/60">{new Date(e.at).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short" })}</span>{chronLine(e)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Parchment>
      )}

      {my && owner && !walk && saplingsOwed(my.decisions ?? [], plantings.filter((p) => p.seed_id === my.id)).length > 0 && (
        <div className="absolute left-1/2 z-30 -translate-x-1/2" style={{ top: barH + 8 }}>
          <Button type="button" size="sm" variant={mode === "sapling" ? "default" : "outline"} onClick={() => { if (mode === "sapling") setMode("look"); else { setMode("sapling"); setMsg(t.sapling.hint); } }}>
            🌱 {mode === "sapling" ? t.cancel : t.sapling.btn}
          </Button>
        </div>
      )}

      {sealShown && !panelOpen && (
        <div className="absolute end-3 z-30" style={{ top: barH + 8 }}>
          <WaxSeal label={t.enc.waiting} onClick={reopen} />
        </div>
      )}

      {authOpen && !userId && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-foreground/30 p-4" onClick={() => setAuthOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Panel inner="p-4">
              <div className="relative">
                <h1 className="flex justify-center leading-none text-wood"><img src={logoUrl} alt="Samenland" width={371} height={360} className="h-28 w-auto" /></h1>
                <button type="button" aria-label={t.hud.close} onClick={() => setAuthOpen(false)} className="hit absolute end-0 top-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); emailAuth(); }}>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => oauth("google")}>{t.google}</Button>
                  <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => oauth("apple")}>{t.apple}</Button>
                </div>
                <div className="text-center text-xs text-muted-foreground">{t.or}</div>
                <Input type="email" required placeholder={t.email} value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
                <Input type="password" required minLength={6} placeholder={t.password} value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} />
                <Button type="submit" size="sm" className="w-full">{auth.signup ? t.signUp : t.signIn}</Button>
                <button type="button" className="w-full text-xs text-muted-foreground underline" onClick={() => setAuth({ ...auth, signup: !auth.signup })}>{auth.signup ? t.haveAccount : t.noAccount}</button>
                {msg && <p className="text-xs text-destructive">{msg}</p>}
              </form>
            </Panel>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-[calc(var(--dock-bottom)+4.5rem)] left-[var(--safe-l)] right-[var(--safe-r)] z-20 flex flex-col items-end space-y-2 text-sm md:bottom-52 ltr:md:left-auto ltr:md:right-3 rtl:md:right-auto rtl:md:left-3 md:w-80">
        {placing && coarse && ghost && (() => {
          const own = seeds.find((s) => s.id === mine);
          const err = own ? canPlaceSpecial(placing, ghost[0], ghost[1], own, seeds, clock()) as keyof typeof t.place | null : "ground";
          const nudge = (dx: number, dy: number) => { const g: [number, number] = [ghost[0] + dx, ghost[1] + dy]; setGhost(g); focus(g[0], g[1]); };
          const price = MONUMENT_PRICE[placing] ?? ITEMS[placing as Item];
          return (
            <div className="pointer-events-auto w-full space-y-2 rounded-md border-2 border-wood bg-card p-2 text-foreground shadow-[var(--shadow-panel)]">
              <div className="flex items-center gap-2">
                {spriteUrl(SPECIAL_KIND[placing]!) && <img src={spriteUrl(SPECIAL_KIND[placing]!)} alt="" className="h-10 w-10 shrink-0 object-contain" />}
                <div className="min-w-0 flex-1 text-xs"><div className="truncate font-semibold">{t.items[placing]![0]}</div>
                  <div className={err ? "text-destructive" : "text-primary"}>{err ? `✕ ${(t.place[err] as string) ?? t.place.ground}` : `✓ ${t.place.drag}`}</div></div>
                <div className="grid shrink-0 grid-cols-3 gap-0.5">
                  <span /><Button size="icon" variant="secondary" className="h-9 w-9" aria-label="↑" onClick={() => nudge(-1, -1)}>↑</Button><span />
                  <Button size="icon" variant="secondary" className="h-9 w-9" aria-label="←" onClick={() => nudge(-1, 1)}>←</Button><span />
                  <Button size="icon" variant="secondary" className="h-9 w-9" aria-label="→" onClick={() => nudge(1, -1)}>→</Button>
                  <span /><Button size="icon" variant="secondary" className="h-9 w-9" aria-label="↓" onClick={() => nudge(1, 1)}>↓</Button><span />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-11 flex-1" onClick={() => { setPlacing(null); setMsg(null); }}>{t.cancel}</Button>
                <Button className="h-11 flex-[2]" disabled={!!err || cash < price} onClick={() => buy(placing, ghost[0], ghost[1])}>{t.place.here} · {t.taler(price)}</Button>
              </div>
            </div>
          );
        })()}
        {placing && !(coarse && ghost) && (
          <div className="pointer-events-auto flex w-full max-w-xs items-center gap-2 rounded-md border-2 border-wood bg-card px-3 py-2 text-foreground shadow-[var(--shadow-panel)]">
            {spriteUrl(SPECIAL_KIND[placing]!) && <img src={spriteUrl(SPECIAL_KIND[placing]!)} alt="" className="h-10 w-10 object-contain" />}
            <div className="flex-1 text-xs"><div className="font-semibold">{t.items[placing]![0]} · {t.taler(MONUMENT_PRICE[placing] ?? ITEMS[placing as Item])}</div>{t.place.hint}</div>
            <Button size="sm" variant="secondary" onClick={() => { setPlacing(null); setMsg(null); }}>{t.cancel}</Button>
          </div>
        )}
        {placing && !coarse && hover && ptr && (() => {
          const own = seeds.find((s) => s.id === mine);
          if (!own) return null;
          const err = canPlaceSpecial(placing, hover[0], hover[1], own, seeds, clock()) as keyof typeof t.place | null;
          const txt = err ? (t.place[err] as string) ?? t.place.ground : t.place.hint;
          return (
            <div className="pointer-events-none fixed z-50 max-w-[16rem] rounded-md border-2 border-wood bg-card px-2 py-1 text-xs text-foreground shadow-[var(--shadow-panel)]" ref={tipRef} style={{ left: (ptrRef.current ?? ptr)[0] + 18, top: (ptrRef.current ?? ptr)[1] + 18 }}>
              <span className={err ? "text-destructive" : "text-primary"}>{err ? "✕ " : "✓ "}</span>{txt}
            </div>
          );
        })()}
        {mode === "seed" && hover && ptr && (() => {
          const err = canPlant(hover[0], hover[1], seeds);
          let txt = t.seedHint.ok(form.name.trim());
          if (err?.startsWith("near:")) {
            const o = seeds.find((s) => s.name === err.slice(5));
            const d = o ? Math.max(1, Math.ceil(MIN_SEED_DISTANCE - Math.hypot(hover[0] - o.x, hover[1] - o.y))) : 1;
            txt = t.seedHint.near(err.slice(5), d);
          } else if (err) txt = err === "court" ? t.court : err === "hill" ? t.seedHint.hill : t.seedHint.water;
          return (
            <div className="pointer-events-none fixed z-50 rounded-md border-2 border-wood bg-card px-2 py-1 text-xs text-foreground shadow-[var(--shadow-panel)]" ref={tipRef} style={{ left: (ptrRef.current ?? ptr)[0] + 18, top: (ptrRef.current ?? ptr)[1] + 18 }}>
              <span className={err ? "text-destructive" : "text-primary"}>{err ? "✕ " : "✓ "}</span>{txt}
            </div>
          );
        })()}
        {msg && (
          <div role="status" className={`pointer-events-auto flex w-full items-start gap-2 rounded-md border-2 border-wood bg-card py-2 ps-3 pe-1.5 text-foreground shadow-[var(--shadow-panel)] md:w-auto ${tab ? "max-md:fixed max-md:inset-x-2 max-md:z-40 max-md:w-auto" : ""}`} style={tab ? { top: barH + 16 } : undefined}>
            <span className="min-w-0 flex-1">{msg}</span>
            <button type="button" aria-label={t.hud.close} onClick={() => setMsg(null)} className="hit relative grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        )}
        {who && (() => {
          const now = clock();
          const tw = townOf(who.seed, seeds, now);
          const q = poseOf(who, tw, seeds, now);
          const kin = kinOf(who, tw);
          const pick = (p: Person) => { const z = poseOf(p, tw, seeds, now); focus(z.x, z.y); setWho(p); };
          const kl = (p: Person) => <button key={p.id} type="button" className="underline-offset-2 hover:underline" onClick={() => pick(p)}>{p.first}{p.role === "child" ? ` (${p.age})` : ""}</button>;
          const row = (label: string, ps: Person[]) => ps.length ? <div><span className="text-muted-foreground">{label}: </span>{ps.map((p, i) => <span key={p.id}>{i ? ", " : ""}{kl(p)}</span>)}</div> : null;
          return (
            <div {...sheetSwipe(() => setWho(null))} className={SHEET}>
              <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-muted-foreground/40 md:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div className="font-['Caveat'] text-xl leading-tight">{who.first} {who.last}</div>
                <button type="button" aria-label={t.close} className="hit relative -m-2 p-2 text-lg leading-none text-muted-foreground hover:text-foreground" onClick={() => setWho(null)}>×</button>
              </div>
              <div className="text-sm">{t.personAge(who.age)} · {t.job[who.job]![who.sex === "f" ? 0 : 1]}</div>
              {who.estate && <div className="mt-1 text-xs"><div>{PROSPERITY[lang].estates[who.estate]}</div><div className="text-muted-foreground">{PROSPERITY[lang].tax(who.sick ? 0 : ESTATE_TAX[who.estate])}</div></div>}
              {(kin.spouse || kin.parents.length || kin.children.length || kin.siblings.length || who.maiden) && (
                <div className="mt-1 space-y-0.5 text-xs">
                  {kin.spouse && <div>{t.fest.kinSpouse("")}{kl(kin.spouse)}{who.wedAt ? <span className="text-muted-foreground"> · {t.fest.kinWed(new Date(who.wedAt).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short" }))}</span> : null}</div>}
                  {who.maiden && <div className="text-muted-foreground">{t.fest.kinMaiden(who.maiden)}</div>}
                  {row(t.fest.kinParents, kin.parents)}{row(t.fest.kinChildren, kin.children)}{row(t.fest.kinSiblings, kin.siblings)}
                </div>
              )}
              {(() => {
                const sickOne = who.carer != null ? tw.people.find((x) => x.id === who.carer) : null;
                const carer = who.sick ? tw.people.find((x) => x.carer === who.id) : null;
                const sw = seasonAt(now), season = (Object.keys(sw) as (keyof typeof sw)[]).reduce((a, b) => (sw[b] > sw[a] ? b : a));
                const hr = worldHour(now);
                const th = thoughtOf(who.id, { act: q.act, working: q.working || q.act === "work", sick: !!who.sick, caring: who.carer != null, sunday: isSunday(now), season, newlywed: !!who.wedAt && now - who.wedAt < 7 * 864e5, baby: tw.people.some((x) => x.hh === who.hh && x.age <= 1 && x.role === "child") && who.age >= 18, child: who.job === "child", night: hr < 5.5 || hr >= 22 }, now);
                return (
                  <div className="mt-1 space-y-0.5 text-xs">
                    <div><span className="text-muted-foreground">{t.person.traitsL}: </span>{traitsOf(who.id).map((k) => t.person.traits[k]).join(", ")}</div>
                    {carer && <div>{t.person.sickBy("")}{kl(carer)}</div>}
                    {sickOne && <div>{t.person.caresFor("")}{kl(sickOne)}</div>}
                    <div className="font-['Caveat'] text-base leading-tight">{t.person.thoughts[th]}</div>
                  </div>
                );
              })()}
              <div className="text-xs text-muted-foreground">{t.livesIn(who.seed.name)} – {q.carry && q.dest ? t.carrying(q.carry, q.dest) : t.act[q.walking && q.act !== "play" ? "walking" : q.act]}</div>
              {who.role === "mayor" && my && who.seed.id === my.id && (
                <Button type="button" size="sm" className="mt-2 w-full gap-1.5" onClick={startWalk}><Footprints className="h-4 w-4" />{t.hud.walk}</Button>
              )}
              {who.role === "mayor" && my && who.seed.id === my.id && (editMayor
                ? <MayorEditor seed={my} lang={lang} age={who.age} traits={traitsOf(who.id)} onClose={() => setEditMayor(false)} onSaved={(patch) => { setSeeds((ss) => ss.map((x) => x.id === my.id ? { ...x, ...patch } : x)); setWho(null); }} />
                : <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={() => setEditMayor(true)}>{MAYOR[lang].edit}</Button>)}
            </div>
          );
        })()}
        {place && (() => {
          const ins = inspectAt(place.x, place.y, seeds, clock()) ?? place;
          const name = t.kind[ins.kind] ?? (t.kinds as Record<string, string>)[ins.kind] ?? ins.kind;
          const list = (ps: Person[]) => ps.length ? (
            <ul className="mt-0.5 space-y-0.5">
              {ps.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => { setPlace(null); setWho(p); }}>
                    {p.first} {p.last} · {t.job[p.job]![p.sex === "f" ? 0 : 1]}
                  </button>
                </li>
              ))}
            </ul>
          ) : <div className="text-muted-foreground">{t.nobody}</div>;
          return (
            <div {...sheetSwipe(() => setPlace(null))} className={SHEET}>
              <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-muted-foreground/40 md:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div className="font-['Caveat'] text-xl leading-tight">{ins.build !== null ? t.site(name) : name}</div>
                <button type="button" aria-label={t.close} className="hit relative -m-2 p-2 text-lg leading-none text-muted-foreground hover:text-foreground" onClick={() => setPlace(null)}>×</button>
              </div>
              <div className="text-xs text-muted-foreground">{t.inTown(name, ins.seed.name)}</div>
              {ins.build !== null ? (
                <div className="mt-1 space-y-1 text-sm">
                  <div>{t.progress(Math.round(ins.build * 100))}</div>
                  {ins.doneAt != null && ins.doneAt > now && <div className="text-xs text-muted-foreground">{ins.doneAt - now >= 3.6e6 ? t.etaH(Math.ceil((ins.doneAt - now) / 3.6e6)) : t.etaM(Math.max(1, Math.ceil((ins.doneAt - now) / 6e4)))}</div>}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.round(ins.build * 100)}%` }} /></div>
                  <div className="text-xs text-muted-foreground">{t.needs}</div>
                  <div className="text-xs font-semibold">{t.builders}</div>
                  <div className="text-xs">{list(ins.workers)}</div>
                </div>
              ) : (
                <div className="mt-1 space-y-1 text-sm">
                  {t.purpose[ins.kind] && <div>{t.purpose[ins.kind]}</div>}
                  {ins.residents.some(p => p.estate) && <div className="text-xs text-muted-foreground">{PROSPERITY[lang].household(ins.residents.reduce((sum, p) => sum + (p.estate && !p.sick ? ESTATE_TAX[p.estate] : 0), 0))}</div>}
                  {ins.residents.length > 0 && <div className="text-xs"><div className="font-semibold">{t.residents}</div>{list(ins.residents)}</div>}
                  {ins.workers.length > 0 && <div className="text-xs"><div className="font-semibold">{t.workers}</div>{list(ins.workers)}</div>}
                  {(() => {
                    const l = larderOf(ins.seed, seeds, clock());
                    const held = storedAt(ins.kind, [ins.x, ins.y], l);
                    const ch = chainOf(ins.kind, [ins.x, ins.y], l, townOf(ins.seed, seeds, clock()).people);
                    return (<>
                      {held.length > 0 && <div className="text-xs"><div className="font-semibold">{t.goods.stored}</div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1">{held.map((h) => <span key={h.ware} className="flex items-center gap-1"><WareIcon ware={h.ware} />{h.n} {wareName(h.ware, h.n)}</span>)}</div></div>}
                      {ch && <div className="text-xs"><div className="font-semibold">{t.goods.chain}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">{ch.map((c, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && <span className="text-muted-foreground">→</span>}
                            <button type="button" disabled={!c.tile || c.here} title={c.tile ? undefined : t.goods.missing}
                              className={c.here ? "rounded bg-primary/15 px-1 font-semibold" : c.tile ? "rounded px-1 underline-offset-2 hover:underline" : "rounded px-1 text-muted-foreground line-through"}
                              onClick={() => { if (c.tile) { focus(c.tile[0], c.tile[1]); setPlace({ ...ins, x: c.tile[0], y: c.tile[1], kind: c.kind }); } }}>
                              {t.kind[c.kind] ?? c.kind}
                            </button>
                          </span>))}</div></div>}
                    </>);
                  })()}
                </div>
              )}
            </div>
          );
        })()}
        <div ref={tileInfoRef} style={{ display: "none" }} className="pointer-events-none max-md:!hidden rounded bg-card/85 px-2 py-1 text-xs text-muted-foreground" />
      </div>
    </div>
  );
}
