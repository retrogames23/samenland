import { remoteIsle } from "@/game/island";
import { dropSeedId, withoutSeed, withoutKeys, LoadGate, applySign, mergeRows, onIds, snapRows, refreshMap } from "@/game/realtime";
import { allIn, allPages, allEither } from "@/lib/fetch-all";
import { WalkStick } from "./WalkStick";
import { maxZoom } from "@/game/camera";
import { personHit } from "@/game/hit";
import { CharacterBadge, CharacterDetails } from "./hud/CharacterBadge";
import { tileHits } from "@/game/disasters";
import { BOOK } from "@/game/lang/book";
import { PROSPERITY } from "@/game/lang/prosperity";
import { ESTATE_TAX } from "@/game/prosperity";
import { AID_TALER, GIFT_TALER, sentToday, thankable, type Gift, type GiftKind } from "@/game/gifts";
import { giftReadKey, mergeGiftReads, parseGiftReads } from "@/game/gift-read";
/** Accounts that always found their village on Europa I (Altenland), bypassing the overflow to Europa II. */
const FORCE_EUROPE = new Set(["victoria.halper@gmail.com", "johanna.mellentin@gmail.com"]);
import { REALMS, REALM_TZ, detectRealm, setRealm, clock, worldHour, isSunday, isLab, labJump, setLabJump, LAB_SPEED, gameDate, workDone, openRealm, isRealmFull, nextOpenRealm, initTimeSync, syncServerTime, SYNC_EVERY, type Realm } from "@/game/time";
import { getServerTime } from "@/game/time.functions";
import { useModeCursor } from "@/components/hooks/useModeCursor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { wonders, wonderClaims, firstFinder, daysSince, WONDER_REACH, type WonderFind } from "@/game/wonders";
import { draw, renderStats, iso, toTile, MIN_ZOOM, lastPeople, lastTraders, lastSources, peopleFocus, signFocus, prewarmOverview, setBakeHold, setSignposts, setWonderFound, setKnights, signpostMap, type Camera } from "@/game/render";
/** Stroll position kept across reloads (browser only, never stored on the server). */
const STROLL_KEY = "samenland-stroll", STROLL_TTL = 30 * 60e3, VIEW_KEY = "samenland-view";
/** Tiles within which strangers in a foreign village speak to the strolling mayor. */
const MEET_TILES = 4;
const pkey = (p: { id: number; seed: { id: string } }) => `${p.seed.id}:${p.id}`;
import { townRank, rankInput, nextRankNeed, roadsFor } from "@/game/rank";
import { townOf, poseOf, jobKey, weddingFocus, kinOf, FETE_SECS, commandMayor, driveMayor, restoreDrive, clearMayorOrder, parkMayor, mayorAway, setMounted, setStrollHold, setOwnMayor, citizensOf, isHomeKind, type Person } from "@/game/people";
import { traitsOf, thoughtOf } from "@/game/traits";
import { banter } from "@/game/banter";
import { weddingJoy, weddingLive } from "@/game/weddings";
import { inspectAt, ensembleOver, paintedKind, type Inspect } from "@/game/inspect";
import { larderOf, storedAt, chainOf, boonsOf, type Ware } from "@/game/goods";
import { WareIcon } from "@/components/hud/WareIcon";
import { Maximize2, Minimize2, Volume2, VolumeX, Hammer, Bell, Signpost as SignIcon, Map as MapIcon, Sprout, Settings, Plus, Minus, Home, Crown, X, LogIn, Footprints } from "lucide-react";
import { Panel, WoodButton } from "@/components/hud/Panel";
import { Parchment, WaxSeal, buzz } from "@/components/hud/Parchment";
import { EncounterDialog, RoadDialog, PactDialog, CharterDialog } from "@/components/dialogs/DecisionDialogs";
import { ART, pickDecision } from "@/game/decisions";
import { ITEM_RANK } from "@/game/disasters";
import type { DecisionKind } from "@/game/decision-order";
import { Minimap } from "@/components/hud/Minimap";
import { rideTime, letterArrives } from "@/game/wander";
import { IslandRegister, type RegisterRow } from "@/components/hud/IslandRegister";
type MoveRow = { id: string; seed_id: string; item: string; x: number; y: number; cost: number; created_at: string };
type LetterRow = { id: string; from_seed: string; to_seed: string; created_at: string };
import { chronicle, FEST_GAP, CHRON_LETTER, CHRON_BANNER, type Chronicle, type ChronEvent } from "@/game/chronicle";
import { scribeGreeting } from "@/lib/chronicle.functions";
import { deleteAccount } from "@/lib/account.functions";
import { certifyMyRank, callNothilfe } from "@/lib/treasury.functions";
import { useTreasurySync } from "@/components/hooks/useTreasurySync";
import { civicRoadsOf } from "@/game/civic-roads";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ScrollText, MoreHorizontal, Feather } from "lucide-react";
import logoUrl from "@/assets/logo-keimling.png";
import { TRACK_NAMES, TRACK_ICONS } from "@/game/lang/tracks";
import { ORPHAN_FAREWELL } from "@/game/lang/orphan";
import { QUESTS, questHeads, questKey, WAY_SMALL, WAY_BIG, type Quest, type QuestClaim } from "@/game/quests";
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
import { ownHead, addressMayor, mayorWord, titleForm } from "@/game/lang/address";
import { COURT } from "@/game/lang/court";
import { setWayside, lastWayside } from "@/game/render";
import { waysideNear, freeLand, readWayMem, markMet, WAYSIDE, WAY_GRAPH, WAY_PROP, vignetteOf, type Wayside } from "@/game/wayside";
import { WAY_VIGNETTE } from "@/game/wayside-vignettes";
import { WAYSIDE_TEXT } from "@/game/lang/wayside";
import { setCourtLabel, setSupportOwned, dogSpots, iso as dogIso, setHeraldRows, setHeraldQuiet, heraldSpots, isPlantedRare } from "@/game/render";
import { DOG } from "@/game/lang/dog";
import { SupportBox } from "@/components/SupportBox";
import { SUPPORT, UKRAINE_URL } from "@/game/lang/support";
import { FOUNTAIN } from "@/game/lang/fountain";
import { FREIMARKT } from "@/game/lang/freimarkt";
import { NOTHILFE } from "@/game/lang/nothilfe";
import { NOTHILFE_PRICE, NOTHILFE_RANK, nothilfeItem } from "@/game/nothilfe";
import { activeRuins } from "@/game/disasters";
import { VORHABEN_T } from "@/game/lang/vorhaben";
import { VORHABEN, VORHABEN_KEYS, vorhabenOf, vorhabenPrice, nextVorhaben, vorhabenReady, lastDayTax, bauhuetteCareHint } from "@/game/vorhaben";
import { FREIMARKT_PRICE, FREIMARKT_RANK, FREIMARKT_LEN, isFreimarkt, nextFreimarkt, freimarktReady } from "@/game/freimarkt";
import { AUSBAU_BASES, AUSBAU_STEPS, AUSBAU_PRICE, AUSBAU_RANK, ausbauStatus, isAusbau } from "@/game/ausbau";
import { AUSBAU } from "@/game/lang/ausbau";
import { FOUNTAIN_STEPS, FOUNTAIN_PRICE, FOUNTAIN_DAYS, FOUNTAIN_RANK, fountainChain, nextFountainStep, isFountain } from "@/game/civic-fountain";
import { Survey } from "@/components/Survey";
import { Stube, STUBE_KINDS, type StubeKind } from "@/components/Stube";
import { STUBE } from "@/game/lang/stube";
import { Search } from "lucide-react";
import { THANKS, OSS } from "@/game/lang/thanks";
import { TILEINFO } from "@/game/lang/tileinfo";
import { tileFacts } from "@/game/tile-info";
import { RENAME } from "@/game/lang/rename";
import { renameDaysLeft, renameReadyAt } from "@/game/rename";
import { paymentsEnvOrNull } from "@/lib/stripe";
import { PRINCELY } from "@/game/lang/princely";
import { HERALD, edictText, DECREE_HEAD, DECREE_STATUS } from "@/game/lang/edicts";
import { princelyClaims, favourOf, openTaskOf, heraldVisit, decreeMet, heraldArrives, PRINCELY_COUNT, type PrincelyRow, type PrincelyKind } from "@/game/princely";
import { courtPoses, courtCenter, atCourt, audienceHost, errandNear, ERRANDS, type AudienceHost, type Errand } from "@/game/court";
import { BUGS } from "@/game/lang/bugs";
import { ALWAYS_DAY } from "@/game/lang/daylight";
import { isAlwaysDay, setAlwaysDay } from "@/game/sun";
import { Beer, ChevronDown, MapPin, Dices, Music, Wheat, Heart, Coins } from "lucide-react";
import { setMusic, setTavernMusic } from "@/game/music";
import { MUSIC } from "@/game/lang/music";
import { suggestTownName } from "@/game/town-names";
import { seasonAt } from "@/game/season";
import { setScene, setSound, unlock, audioRunning, animalCall, hm, tap, bell, jingle, disposeAudio } from "@/game/audio";
import {
  canPlant,
  MIN_SEED_DISTANCE,
  specialSites,
  specialBuild,
  specialDone,
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

  links,
  isBlessed,
  blessCooldown,
  BLESS_MS,
  type Signpost,
  type Planting,
  roadCandidates, roadHours,
  roadBuilding,
  roadIncoming,
  type Seed,
  canPlaceSpecial,
  SPECIAL_KIND,
  CHARTER_PATHS,
  charterReady,
  type CharterPath,
  twinLinks, pactOf, pactPending, workOf, marketDay, marketHours, festivalDate, twinGateAt, PACTS, TWIN_WORKS, PACT_WAIT, type PactKind, type WorkKind,
  SEAT_KINDS,
  signTile,
  hash,
  FOOT2,
  TRADE_DIST,
  seedsKey,
  careSoftCap,
} from "@/game/world";
const PATH_ICON: Record<string, string> = { trade: "⚖️", craft: "🔨", culture: "📜", farm: "🌾" };
const CHAR_ICON: Record<TownWay, string> = { grain: "🌾", workshop: "⚒", gateway: "⚓" };
const WAY_BUILDS: Record<TownWay, string[]> = { grain: ["bigstore", "millrow", "harvesthall"], workshop: ["stonemason", "hammerworks", "guildtower"], gateway: ["smokehouse", "saltquay", "lighthouse"] };
const wayOf = (p: { x: number; y: number }) => townCharacter(p).main;
import { drawBuildingSprite, spriteUrl, GHOST_WIDTH } from "@/game/building-sprites";
import { TOWN_CHARACTER } from "@/game/i18n";
import { onIsland, ISLAND } from "@/game/islands";
import { townCharacter, type TownWay } from "@/game/character";
import { LabDesk } from "@/components/hud/LabDesk";
import { DICT, LANGS, LANG_LABEL, LANG_NAME, RTL, LOCALE, plantError, type Lang } from "@/game/i18n";
import { CHEST } from "@/game/lang/chest";
import { FOUNDING } from "@/game/lang/founding";
import { CHEST_STAGE, RANK_STAGE, CHEST_STEPS, CHEST_CAP, CHEST_PRICE, chestLevel, chestCap, chestBlock } from "@/game/economy";
import { titleOfSeed, TITLE_PRICE, TITLE_STAGE, TITLE_STEPS, TITLE_RANK, TITLE_BONUS, titleOf, titleBlock, RANK_PRICE, RANK_ROADS, rankOf, rankBlock, type RankStep, ITEMS, MONUMENT_PRICE, MONUMENTS, nextMonumentStep, needRankOf, GUILD, canBuy, canBuyWay, WAY_ITEM, dailyTax, attributes, treasury, referralClaims, visitClaims, type Item, type Purchase } from "@/game/economy";
import { ENCOUNTERS, choiceOf, saplingsOwed, type Decision } from "@/game/encounters";
import { pendingAll, isCommons, commonsVoices, adviceIdx, bakeCost } from "@/game/commons";
import { COMMONS_TEXT } from "@/game/lang/commons";
import { fillLife } from "@/game/lang/village-life";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ForgotForm, RecoveryDialog, ChangePasswordDialog, ChangeEmailDialog } from "@/components/dialogs/AccountDialogs";
import { firstFreeSite, placeTap, footprint, footTileFree, goodSpots } from "@/game/placement";
import { canMoveTo, moveBlock, moveCost, itemOfKind, treeGuard } from "@/game/relocate";
import { RELOCATE } from "@/game/lang/relocate";
import { saplingSpots } from "@/game/saplings";
import FigureLab from "@/components/FigureLab";
import { feastOn, feastKey, type FeastCode } from "@/game/feasts";
import { FEAST_TEXT } from "@/game/lang/feasts";
import { pBegin, pEnd, pFrame, perfCamOn } from "@/game/perf-probe";

/** Painted scene per feast; feasts without their own picture borrow a fitting encounter scene. */
const FEAST_ART: Record<FeastCode, string> = { christmas: "feast-christmas", easter: "feast-easter", midsummer: "feast-midsummer", pentecost: "maypole", michaelmas: "harvest", martinmas: "tithe", shrovetide: "minstrel", palm: "pilgrims", ascension: "pilgrims", corpus: "pilgrims", epiphany: "monk", candlemas: "monk", ashwed: "monk", goodfriday: "monk", allsaints: "monk" };

type Mode = "look" | "seed" | "tree" | "flower" | "lantern" | "sapling";

const SHEET = "pointer-events-auto w-full max-w-xs rounded-md border-2 border-wood bg-card px-3 py-2 text-foreground shadow-[var(--shadow-cozy)] max-md:max-h-[45dvh] max-md:max-w-none max-md:overflow-y-auto max-md:overflow-x-hidden max-md:overscroll-contain max-md:rounded-t-2xl";
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

export function Game({ serverTime }: { serverTime?: number } = {}) {
  // shared realm clock: anchor on the server time from the page load, then NTP-lite re-syncs
  useEffect(() => {
    if (serverTime) initTimeSync(serverTime);
    const sync = () => { void syncServerTime(() => getServerTime()); };
    sync();
    const iv = setInterval(sync, SYNC_EVERY);
    return () => clearInterval(iv);
  }, []);
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
  const [moves, setMoves] = useState<MoveRow[]>([]);
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
  const instantOpen = useRef(false);
  // true while an encounter answer is being saved: keeps the auto-open timer from re-asking the same question
  const encSaving = useRef(false);
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
    const mo = new Map<string, NonNullable<Seed["moves"]>>();
    for (const m of moves) { if (!mo.has(m.seed_id)) mo.set(m.seed_id, []); mo.get(m.seed_id)!.push({ item: m.item, x: m.x, y: m.y, at: Date.parse(m.created_at), cost: m.cost }); }
    const civic = civicRoadsOf(rawSeeds, firstRoads);
    return rawSeeds.map((s0) => {
      const v0 = vo.get(s0.id), w0 = wo.get(s0.id), m0 = mo.get(s0.id);
      const s: Seed = v0 || w0 || m0 ? { ...s0, ...(v0 ? { votes: v0 } : {}), ...(w0 ? { works: w0 } : {}), ...(m0 ? { moves: m0 } : {}) } : s0;
      const bl = by.get(s.id), bo = buys.get(s.id), ch = charters.find((c) => c.seed_id === s.id), fr0 = firstRoads.filter((f) => f.seed_id === s.id), fr = fr0.length ? fr0 : null, de = decs.get(s.id);
      if (!bl && !bo && !ch && !fr && !de) return s;
      return { ...s, ...(bl ? { blessed: bl.sort((a, b) => a - b) } : {}), ...(bo ? { bought: bo.sort((a, b) => a.at - b.at) } : {}), ...(ch ? { charter: { path: ch.path as CharterPath, at: Date.parse(ch.created_at) } } : {}), ...(fr ? { roads: fr.map((f) => ({ target: f.target_id, at: Date.parse(f.created_at) })).sort((a, b) => a.at - b.at) } : {}), ...(de ? { decisions: de.sort((a, b) => a.at - b.at) } : {}) };
    }).map((s, i) => {
      s = { ...s, civicRoads: civic[i]! };
      const lt = letters.filter((g) => g.from_seed === s.id).map((g) => ({ id: g.id, to: g.to_seed, at: Date.parse(g.created_at) }));
      return lt.length ? { ...s, letters: lt } : s;
    }).map((s) => {
      const sent = gifts.filter((g) => g.from_seed === s.id).map((g) => ({ id: g.id, to: g.to_seed, kind: g.kind as GiftKind, at: Date.parse(g.created_at) }));
      const aid = gifts.filter((g) => g.to_seed === s.id && g.kind === "aid").map((g) => Date.parse(g.created_at));
      return sent.length || aid.length ? { ...s, ...(sent.length ? { sent } : {}), ...(aid.length ? { aid } : {}) } : s;
    });
  }, [rawSeeds, blessings, purchases, charters, firstRoads, encounters, votes, works, gifts, letters, moves]);
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
  // true while `placing` picks a new spot for an already bought building (Umsetzen) instead of buying one
  const [moving, setMoving] = useState(false);
  useEffect(() => { if (!placing) setMoving(false); }, [placing]);
  // faint hint of every good spot while placing — computed once per pick, not per frame
  useEffect(() => {
    const own = placing ? seeds.find((x) => x.id === mine) : undefined;
    if (!placing || !own) { st.current.spots = []; return; }
    const now = clock(), chk = treeGuard(moving ? canMoveTo : canPlaceSpecial, plantings);
    st.current.spots = goodSpots(placing, own, seeds, now, (x, y) => chk(placing, x, y, own, seeds, now) === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placing, moving, mine, seeds]);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const tileInfoRef = useRef<HTMLDivElement>(null);
  const tileInfoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openCard = useRef(false);
  // tile facts are written straight into the fixed bottom-left strip, so pointer moves never re-render the HUD
  const showTileInfo = (nt: [number, number], fade?: number) => {
    const box = tileInfoRef.current; if (!box || openCard.current) return;
    const f = tileFacts(nt[0], nt[1], st.current.seeds, clock(), isPlantedRare(st.current.plantings, nt[0], nt[1])), ti = TILEINFO[lang];
    const head = f.kind ? `${t.kind[f.kind] ?? (t.kinds as Record<string, string>)[f.kind] ?? f.kind}${f.seed ? ` (${f.seed})` : ""}` : t.terrain[f.terrain];
    const parts = [head, ...(f.kind ? [t.terrain[f.terrain]] : []), ...f.animals.map((a) => ti.animals[a])];
    box.textContent = parts.join(" · ") + (f.effects.length ? ` — ${f.effects.map((k) => ti.fx[k]).join(", ")}` : "");
    box.style.display = "";
    if (tileInfoTimer.current) clearTimeout(tileInfoTimer.current);
    tileInfoTimer.current = fade ? setTimeout(() => { if (tileInfoRef.current) tileInfoRef.current.style.display = "none"; }, fade) : null;
  };
  const hideTileInfo = () => { if (tileInfoTimer.current) clearTimeout(tileInfoTimer.current); tileInfoTimer.current = null; if (tileInfoRef.current) tileInfoRef.current.style.display = "none"; };
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
  const walkWas = useRef(false);
  useEffect(() => { if (walkWas.current && !walk) try { localStorage.removeItem(STROLL_KEY); } catch { /* ignore */ } walkWas.current = walk; }, [walk]);
  const stick = useRef({ dx: 0, dy: 0 });
  const [authOpen, setAuthOpen] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [acct, setAcct] = useState<null | "recovery" | "pw" | "mail">(null);
  const [settings, setSettings] = useState(false);
  const [imprint, setImprint] = useState(false);
  const [thanks, setThanks] = useState(false);
  // feast-day parchment: once per feast and game year (receipt in this browser), derived from the realm clock
  const [feast, setFeast] = useState<FeastCode | null>(null);
  useEffect(() => {
    if (!mine || !userId) return;
    let alive = true;
    // receipt per account (feast_reads) merged with this browser's key, so other devices don't replay the parchment
    const check = async () => {
      const f = feastOn(clock()); if (!f) return;
      const fk = feastKey(f, clock()), k = `samenland:feast:${userId}:${fk}`;
      try { if (localStorage.getItem(k)) return; } catch { /* private mode */ }
      const { data } = await supabase.from("feast_reads").select("feast").eq("user_id", userId).eq("feast", fk).maybeSingle();
      if (!alive) return;
      if (data) { try { localStorage.setItem(k, "1"); } catch { /* private mode */ } return; }
      setFeast(f);
    };
    void check(); const id = setInterval(() => void check(), 60000); return () => { alive = false; clearInterval(id); };
  }, [mine, userId]);
  const closeFeast = () => {
    if (feast && userId) {
      const fk = feastKey(feast, clock());
      try { localStorage.setItem(`samenland:feast:${userId}:${fk}`, "1"); } catch { /* private mode */ }
      void supabase.from("feast_reads").upsert({ user_id: userId, feast: fk }, { onConflict: "user_id,feast", ignoreDuplicates: true }).then(({ error }) => { if (error) console.warn("Feast read receipt could not sync", error.code); });
    }
    setFeast(null);
  };
  const [renameName, setRenameName] = useState("");
  const [renameErr, setRenameErr] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameSkip, setRenameSkip] = useState<string | null>(null);
  useEffect(() => { try { setRenameSkip(localStorage.getItem("samenland:rename-skip")); } catch { setRenameSkip(""); } }, []);
  const mySeed = seeds.find((s) => s.id === mine);
  const dupOf = mySeed && renameSkip !== null && renameSkip !== mySeed.id + ":" + mySeed.name
    ? seeds.find((o) => o.id !== mySeed.id && o.name.trim().toLowerCase() === mySeed.name.trim().toLowerCase() && o.created_at < mySeed.created_at) : undefined;
  const renameDays = renameDaysLeft(renameReadyAt(mySeed?.renamed_at), Date.now());
  const closeRename = () => { setRenameOpen(false); setRenameErr(""); };
  const openRename = () => { if (!mySeed) return; setRenameName(mySeed.name); setRenameErr(""); setRenameOpen(true); setSettings(false); };
  const skipRename = () => { if (!mySeed) return; const k = mySeed.id + ":" + mySeed.name; try { localStorage.setItem("samenland:rename-skip", k); } catch { /* ignore */ } setRenameSkip(k); };
  const saveRename = async () => {
    if (!mySeed || renameBusy) return;
    const n = renameName.trim();
    if (n.length < 2 || n.length > 32) { setRenameErr(RENAME[lang].bad); return; }
    if (n === mySeed.name) { if (dupOf) skipRename(); else closeRename(); return; }
    if (renameDays > 0) { setRenameErr(RENAME[lang].cooldown(renameDays)); return; }
    if (seeds.some((o) => o.id !== mySeed.id && o.name.trim().toLowerCase() === n.toLowerCase())) { setRenameErr(RENAME[lang].taken); return; }
    setRenameBusy(true);
    const { error } = await supabase.rpc("rename_seed", { p_seed: mySeed.id, p_name: n });
    setRenameBusy(false);
    if (error) { setRenameErr(/taken/.test(error.message) ? RENAME[lang].taken : /cooldown/.test(error.message) ? RENAME[lang].cooldown(Math.max(1, renameDays)) : error.message); return; }
    const renamed_at = new Date().toISOString();
    setSeeds((ss) => ss.map((x) => (x.id === mySeed.id ? { ...x, name: n, renamed_at } : x)));
    closeRename();
    toast.success(RENAME[lang].saved(n));
  };
  const [bugOpen, setBugOpen] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  // supporter decorations: only granted rows are stored, placement is derived (src/game/supporter.ts)
  const [support, setSupport] = useState<Map<string, Set<string>>>(new Map());
  const [mapGen, setMapGen] = useState(0); // bumps when a map's villages are loaded, so per-map reads follow realm switches
  const loadSupport = useCallback(async () => {
    const env = paymentsEnvOrNull(); if (!env) return;
    const data = await mapRows<{ seed_id: string; reward: string }>(mapIds.current, (c) => supabase.from("supporter_rewards").select("id, seed_id, reward").eq("environment", env).in("seed_id", c));
    const m = new Map<string, Set<string>>();
    for (const r of data) { const v = m.get(r.seed_id) ?? new Set<string>(); v.add(r.reward); m.set(r.seed_id, v); }
    setSupport(m); return m;
  }, []);
  // village dog names (owner-chosen, public); the dog itself is derived in src/game/dog.ts
  const [dogNames, setDogNames] = useState<Map<string, string>>(new Map());
  useEffect(() => { void mapRows<{ seed_id: string; name: string }>(mapIds.current, (c) => supabase.from("village_dogs").select("seed_id, name").in("seed_id", c), "seed_id").then((data) => setDogNames(new Map(data.map((r) => [r.seed_id, r.name])))); }, [mapGen]);
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
    if (!mapGen) return;
    const back = typeof location !== "undefined" && new URLSearchParams(location.search).get("support") === "thanks";
    if (!back) return;
    history.replaceState(null, "", location.pathname);
    toast.success(SUPPORT[lang].thanks);
    // the payment confirmation arrives a few seconds later; refresh until it shows
    let n = 0; const id = setInterval(() => { if (++n > 12) clearInterval(id); void loadSupport(); }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSupport, mapGen]);
  // relocations (Umsetzen) of the loaded map; reloaded with every map load, live inserts arrive via realtime
  useEffect(() => {
    const ids = mapIds.current; if (!ids.length) { setMoves([]); return; }
    let dead = false;
    void mapRows(ids, (c) => supabase.from("building_moves").select("id, seed_id, item, x, y, cost, created_at").in("seed_id", c)).then((rows) => { if (!dead) setMoves(rows as MoveRow[]); });
    return () => { dead = true; };
  }, [mapGen]);
  const [quitOpen, setQuitOpen] = useState(false);
  const [quitName, setQuitName] = useState("");
  const [quitting, setQuitting] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delWord, setDelWord] = useState("");
  const delFn = useServerFn(deleteAccount);
  const [isAdmin, setIsAdmin] = useState(false);
  const [realm, setRealmState] = useState<Realm>("europe");
  const realmRef = useRef<Realm>("europe");
  // seed ids of the loaded map: every per-village table is read only for these (never world-wide, never cut at 1000 rows)
  const mapIds = useRef<string[]>([]);
  // holds realtime events while a map loads (see game/realtime.ts)
  const rtGate = useRef(new LoadGate());
  // tab woke up: re-read every population input of the loaded map through rtGate (stale after a map switch, events held + replayed)
  const refreshPop = useRef(() => {
    const r = realmRef.current;
    // seeds first: abandon_village deletes the seed row itself, so the map's ids come from a fresh read
    void refreshMap(rtGate.current, async () => {
      const ss = (await allRows<Seed>(() => supabase.from("seeds").select("*").eq("realm", r), "chrono")).data;
      const ids = ss.map((x) => x.id);
      return [ss, ids, await Promise.all([
      mapRows(ids, (c) => supabase.from("encounters").select("id, seed_id, event, choice, cost, created_at").in("seed_id", c)) as Promise<EncRow[]>,
      mapRows(ids, (c) => supabase.from("charters").select("id, seed_id, path, created_at").in("seed_id", c)),
      mapRows(ids, (c) => supabase.from("first_roads").select("id, seed_id, target_id, created_at").in("seed_id", c)),
      mapRows(ids, (c) => supabase.from("twin_votes").select("id, seed_id, partner_id, pact, created_at").in("seed_id", c)),
      mapRows(ids, (c) => supabase.from("twin_works").select("id, seed_id, partner_id, work, cost, created_at").in("seed_id", c)),
      mapRows(ids, (c) => supabase.from("purchases").select("id, seed_id, item, cost, created_at, x, y").in("seed_id", c)),
      mapRows(ids, (c) => supabase.from("blessings").select("id, seed_id, created_at").in("seed_id", c)),
    ])] as const;
    }, ([ss, ids, [enc, ch, fr, vo, wo, pu, bl]]) => {
      if (realmRef.current !== r) return;
      mapIds.current = ids;
      setSeeds(snapRows(ss, (x) => x.realm === r));
      setHome((h) => (h && h.realm === r && !ids.includes(h.id) ? null : h));
      const keep = (...xs: (string | null | undefined)[]) => onIds(mapIds.current, ...xs);
      setEncounters(snapRows(enc, (x) => keep(x.seed_id))); setCharters(snapRows(ch, (x) => keep(x.seed_id)));
      setFirstRoads(snapRows(fr, (x) => keep(x.seed_id, x.target_id)));
      setVotes(snapRows(vo, (x) => keep(x.seed_id, x.partner_id))); setWorks(snapRows(wo, (x) => keep(x.seed_id, x.partner_id)));
      setPurchases(snapRows(pu as Purchase[], (x) => keep(x.seed_id))); setBlessings(snapRows(bl as typeof blessings, (x) => keep(x.seed_id)));
    });
  });
  // swaps the map in place (admin realm switch) — no page reload, no splash
  const loadRealmRef = useRef<((r: Realm) => Promise<void>) | null>(null);
  // one init shares each per-user read (P.3b.1): the start sequence and the userId effects reuse the same promise
  const userReads = useRef(new Map<string, Promise<unknown>>());
  const shared = <T,>(key: string, run: () => PromiseLike<T>): Promise<T> => {
    const m = userReads.current; let p = m.get(key) as Promise<T> | undefined;
    if (!p) { p = Promise.resolve(run()); m.set(key, p); p.catch(() => m.delete(key)); setTimeout(() => m.delete(key), 10000); }
    return p;
  };
  const rolesOf = (uid: string) => shared(`roles:${uid}`, () => supabase.from("user_roles").select("role").eq("user_id", uid));
  const ownSeedOf = (uid: string) => shared(`own:${uid}`, () => supabase.from("seeds").select("*").eq("user_id", uid).limit(1));
  const [view, setView] = useState({ x: MAP / 2, y: MAP / 2, span: 40 });
  const [who, setWho] = useState<Person | null>(null);
  const [editMayor, setEditMayor] = useState(false);
  useEffect(() => setEditMayor(false), [who?.id]);
  const [place, setPlace] = useState<Inspect | null>(null);
  // an open person/house card owns the bottom edge: the tile strip must never cover its buttons
  openCard.current = !!(who || place);
  useEffect(() => { if (who || place) hideTileInfo(); }, [who, place]);
  /** Schaukasten: lens toggle and the opened farmhouse diorama (local only, nothing stored). */
  const [lens, setLens] = useState(false);
  const [stube, setStube] = useState<Inspect | null>(null);
  useModeCursor(canvasRef, lens, walk);
  const [, tick] = useState(0);

  const dpr = useRef(1);
  const [fs, setFs] = useState(false);
  const [sound, setSoundOn] = useState(false);
  const soundRef = useRef(false); soundRef.current = sound;
  // music remembers its own choice; sound off always silences it, sound on restores the last choice
  const [music, setMusicOn] = useState(true);
  const musicRef = useRef(true); musicRef.current = music;
  // Browsers only allow audio after a user gesture; the first one may be a key press, a touch or a click.
  // The listener stays armed until the audio context is really running, and reads the stored choices (refs may be stale).
  useEffect(() => {
    const on = localStorage.getItem("samenland.sound") !== "off";
    const m = localStorage.getItem("samenland.music") !== "off";
    setSoundOn(on); setMusicOn(m); musicRef.current = m;
    if (!on) return;
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const opts = { capture: true, passive: true } as const;
    const gesture = () => {
      if (localStorage.getItem("samenland.sound") === "off") return;
      setSound(true); unlock();
      setMusic(localStorage.getItem("samenland.music") !== "off");
      if (audioRunning()) events.forEach((e) => window.removeEventListener(e, gesture, opts));
    };
    events.forEach((e) => window.addEventListener(e, gesture, opts));
    return () => events.forEach((e) => window.removeEventListener(e, gesture, opts));
  }, []);
  useEffect(() => () => disposeAudio(), []);
  const toggleSound = () => {
    const on = !sound; setSoundOn(on); setSound(on);
    localStorage.setItem("samenland.sound", on ? "on" : "off");
    setMusic(on && musicRef.current);
  };
  useEffect(() => () => setMusic(false), []);
  const toggleMusic = () => {
    if (!sound) return;
    const m = !music; setMusicOn(m); musicRef.current = m;
    localStorage.setItem("samenland.music", m ? "on" : "off");
    setMusic(m);
  };
  useEffect(() => { prewarmOverview(); }, []);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  // start over the settled heartland, never the empty ocean at tile (0,0)
  // a reload resumes the last view of this tab (sessionStorage), so the camera never idles over open sea while towns load
  const bakeInit = useRef(false); // P.5a: hold baking once, only for the provisional default view
  const cam = useRef<Camera>((() => {
    try { const v = JSON.parse(sessionStorage.getItem(VIEW_KEY) ?? "null") as Camera | null; if (v && isFinite(v.x) && isFinite(v.y) && isFinite(v.zoom)) return { x: v.x, y: v.y, zoom: v.zoom }; } catch { /* ignore */ }
    const [x, y] = iso(500, 500); if (!bakeInit.current) { bakeInit.current = true; setBakeHold(true); } return { x, y, zoom: 2.6 };
  })());
  useEffect(() => { const id = setInterval(() => { try { const c = cam.current; sessionStorage.setItem(VIEW_KEY, JSON.stringify({ x: c.x, y: c.y, zoom: c.zoom })); } catch { /* ignore */ } }, 2000); return () => clearInterval(id); }, []);
  const target = useRef({ zoom: cam.current.zoom, ax: 0, ay: 0 });
  // terrain QA only: window.__labCam(tileX, tileY, zoom?) jumps the camera, exists solely while realm "lab" is loaded
  useEffect(() => {
    const w = window as unknown as { __labCam?: (x: number, y: number, z?: number) => boolean };
    w.__labCam = (x, y, z) => {
      if (realmRef.current !== "lab") return false;
      const [px, py] = iso(x, y);
      const zoom = z ?? cam.current.zoom;
      cam.current = { x: px, y: py, zoom };
      target.current = { ...target.current, zoom };
      return true;
    };
    return () => { delete w.__labCam; };
  }, []);
  const sapCache = useRef<{ key: string; spots: [number, number][] }>({ key: "", spots: [] });
  const st = useRef({ seeds, plantings: new Map<string, Planting>(), hover, mode, mine, placing: null as string | null, moving: false, spots: [] as [number, number][], ghost: null as [number, number] | null, walk: false });
  st.current.walk = walk;
  st.current.seeds = seeds;
  st.current.placing = placing; st.current.moving = moving;
  st.current.ghost = ghost;
  st.current.mode = mode;
  st.current.mine = mine;
  st.current.plantings = new Map(plantings.map((p) => [`${p.x},${p.y}`, p]));

  const focus = (x: number, y: number) => {
    const [ix, iy] = iso(x, y);
    cam.current.x = ix;
    cam.current.y = iy;
  };
  /** Event look: glide close (detail zoom); for a moving-in family follow the walking newcomer. */
  /** Soft camera flight to a tile; zoom only ever moves closer (never pulls a close view back out). */
  const glideTo = (x: number, y: number, zoom: number) => {
    const [gx, gy] = iso(x, y);
    camFree.current = true; fling.current = { vx: 0, vy: 0, t: performance.now() }; glide.current = { x: gx, y: gy };
    target.current = { ...target.current, zoom: Math.max(target.current.zoom, zoom) };
  };
  /** Zoom per kind of look: people/houses close, big monuments a bit wider, whole towns as overview. */
  const LOOK_PERSON = 5.5, LOOK_BUILDING = 4.4, LOOK_TOWN = 2.8;
  const lookAt = (x: number, y: number, code?: string) => {
    let tx = x, ty = y;
    if (code === "family" && my) {
      const nw = clock(), tw = townOf(my, seeds, nw);
      const p = tw.people.find((q) => q.home[0] === x && q.home[1] === y && q.arrive);
      if (p) { const z = poseOf(p, tw, seeds, nw); if (z.visible) { tx = z.x; ty = z.y; setWho(p); } }
    }
    glideTo(tx, ty, code === "stage" || code === "twin" || code === "road" || code == null ? LOOK_TOWN : code === "built" || code === "bought" ? LOOK_BUILDING : LOOK_PERSON);
  };
  /** Look at a villager: fly close and select; someone indoors shows their house instead. */
  const lookPerson = (p: Person) => {
    const nw = clock(), tw = townOf(p.seed, seeds, nw), q = tw.people.find((x) => x.id === p.id) ?? p, z = poseOf(q, tw, seeds, nw);
    glideTo(z.visible ? z.x : q.home[0], z.visible ? z.y : q.home[1], LOOK_PERSON);
    setWho(q);
    return z;
  };
  const placeBox = useRef<HTMLDivElement | null>(null);
  /** Placement on touch: centre the site in the free map strip above the placement panel, not behind it. */
  const placeFocus = (x: number, y: number) => {
    focus(x, y);
    // screen shift = viewport centre minus centre of the strip between top bar (~120 px) and panel top
    const vh = window.innerHeight, top = placeBox.current?.getBoundingClientRect().top ?? vh * 0.55;
    cam.current.y += Math.max(0, vh / 2 - (120 + top) / 2) / Math.max(0.1, cam.current.zoom);
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
  /** Sapling mode: glide the camera softly to the own village so the glowing meadows are in view. */
  const startSapling = () => {
    setMode("sapling"); setMsg(t.sapling.hint);
    const me = seeds.find((x) => x.id === mine); if (!me) return;
    const [gx, gy] = iso(me.x, me.y);
    camFree.current = true; fling.current = { vx: 0, vy: 0, t: performance.now() }; glide.current = { x: gx, y: gy };
    target.current = { ...target.current, zoom: Math.max(target.current.zoom, 1.4) };
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
    const q = isAdmin ? supabase.from("seeds").select("*").eq("user_id", userId).eq("realm", realm).limit(1) : ownSeedOf(userId);
    Promise.resolve(q).then(async ({ data }) => {
      if (!live) return;
      if (data?.[0]) {
        const h = data[0] as Seed;
        setHome(h);
        // signed in after the map loaded: swap to the home village's map in place
        if (!isAdmin && !localStorage.getItem("samenland-realm") && h.realm && REALMS.includes(h.realm) && h.realm !== realmRef.current) loadRealmRef.current?.(h.realm);
        return;
      }
      // signed in without a village: guide straight into founding instead of leaving them on the map
      setAuthOpen(false);
      // admins visiting the test map are not pushed into founding there
      if (realm !== "lab") setTab("plant");
      const { data: u } = await supabase.auth.getUser();
      // hand-picked accounts always settle on Europa I, even when Altenland is full
      if (live && !isAdmin && FORCE_EUROPE.has((u.user?.email ?? "").toLowerCase()) && realmRef.current !== "europe") loadRealmRef.current?.("europe");
      const meta = u.user?.user_metadata ?? {};
      const full = String(meta["full_name"] ?? meta["name"] ?? "").split(" ")[0]?.slice(0, 32) ?? "";
      if (live && full) setForm((f) => (f.owner ? f : { ...f, owner: full }));
    });
    return () => { live = false; };
  }, [userId, isAdmin, realm]);
  // letter texts are only readable once signed in: on phones the session often arrives after the map load
  useEffect(() => {
    setBodies({});
  }, [userId]);
  useEffect(() => {
    if (!userId || !letters.length) return;
    let live = true;
    const epoch = rtGate.current.epochNow;
    void mapRows<{ letter_id: string; body: string }>(
      letters.map((l) => l.id),
      (c) => supabase.from("letter_bodies").select("letter_id, body").in("letter_id", c),
      "letter_id",
    ).then((bs) => {
      if (live && rtGate.current.isCurrent(epoch))
        setBodies((old) => ({
          ...old,
          ...Object.fromEntries(bs.map((b) => [b.letter_id, b.body])),
        }));
    });
    return () => {
      live = false;
    };
  }, [userId, letters]);
  useEffect(() => {
    if (!userId) return;
    // the account's last explicit language choice wins over browser detection
    supabase.auth.getUser().then(({ data }) => {
      const l = data.user?.user_metadata?.["lang"];
      if (typeof l === "string" && (LANGS as string[]).includes(l)) { setLang(l as Lang); localStorage.setItem("samenland-lang", l); }
    });
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
    (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).from("build_mail").select("enabled").eq("user_id", userId).maybeSingle().then(({ data }) => setMailOn(!!data?.enabled));
  }, [userId]);
  // re-touch on language change too, so mails go out in the language the player last chose
  useEffect(() => {
    if (!userId) return;
    (supabase as unknown as import("@supabase/supabase-js").SupabaseClient).rpc("touch_activity", { _lang: lang }).then(() => {});
  }, [userId, lang]);
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
    rolesOf(userId).then(({ data }) => {
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
      if (ev === "PASSWORD_RECOVERY") { setAuthOpen(false); setAcct("recovery"); }
      if (session?.user.id) setUserId(session.user.id);
    });
    // Safari pauses timers in background tabs: refresh the token as soon as the page is visible again
    const onVis = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.startAutoRefresh();
        void syncServerTime(() => getServerTime());
        supabase.auth.getSession().then(({ data }) => { if (data.session) setUserId(data.session.user.id); });
        // decisions made on another device while this tab slept
        if (mapIds.current.length) refreshPop.current();
      } else supabase.auth.stopAutoRefresh();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onVis);
    (async () => {
      let r = detectRealm();
      let uid: string | null = null;
      let adminPick = false, hasHome = false;
      let sessMail: string | null = null;
      try {
        // guests must never wait on auth: local session only, with a short cap
        const sess = await Promise.race([
          supabase.auth.getSession().then((x) => x.data.session),
          new Promise<null>((res) => setTimeout(() => res(null), 1500)),
        ]);
        uid = sess?.user.id ?? null;
        sessMail = sess?.user.email ?? null;
        if (uid) {
          perfMark("auth");
          // roles and own seed depend only on uid: read both at once, shared with the userId effects
          const [{ data: roles }, { data: mine }] = await Promise.all([rolesOf(uid), ownSeedOf(uid)]);
          perfMark("own-seed");
          const adm = !!roles?.some((x) => x.role === "admin");
          setIsAdmin(adm);
          const o = localStorage.getItem("samenland-realm") as Realm | null;
          if (adm && o && (REALMS.includes(o) || o === "lab")) { r = o; adminPick = true; }
          // the test map always opens in normal time: a stored jump (up to four Hansestädte) froze the tab on entry
          if (r === "lab") { setLabJump(0); localStorage.setItem("samenland-lab-jump", "0"); }
          // an invite only steers newcomers: players with a village keep their own map
          if (mine?.length) {
            hasHome = true;
            localStorage.removeItem("samenland-ref");
            // players always land on their own village's map, whatever the browser time zone
            const hr = mine[0]!.realm as Realm;
            if (!adm && REALMS.includes(hr)) r = hr;
          }
        }
      } catch { /* play as guest */ }
      let refSeed: { id: string } | null = null; // invites never pick the map, so the friend may live elsewhere
      { const refId = localStorage.getItem("samenland-ref"); if (refId && !hasHome) refSeed = { id: refId }; }
      // an invite never picks the map (the bonus works across maps); a full map sends every newcomer on to the next map of its time zone
      if (!adminPick && !hasHome && FORCE_EUROPE.has((sessMail ?? "").toLowerCase())) r = "europe";
      else if (!adminPick && !hasHome) {
        // each map holds REALM_FULL villages, then newcomers move on along the time zone's chain (DB realm_full_guard mirrors it)
        const counts = new Map<string, number>();
        // deliberately across all maps; read completely so a full map is never miscounted
        const rows = await allRows<{ id: string; realm: string }>(() => supabase.from("seeds").select("id, realm").in("realm", REALMS));
        for (const x of rows.data) counts.set(x.realm, (counts.get(x.realm) ?? 0) + 1);
        r = openRealm(r, (q) => counts.get(q) ?? 0);
      }
      const loadRealm = async (r: Realm) => {
      // a newer map load supersedes this one: after that, this load must not touch any state
      const epoch = rtGate.current.begin();
      const live = () => rtGate.current.isCurrent(epoch);
      perfMark("loadRealm");
      try {
      if (!uid) uid = (await supabase.auth.getSession()).data.session?.user.id ?? null;
      if (!live()) return;
      setRealm(r);
      // a chronicle belongs to one village: never leave it open over another map
      if (realmRef.current !== r) { setChronOpen(false); setChron(null); setChronBanner(false); chronDone.current = null; }
      realmRef.current = r;
      setRealmState(r);
      if (r === "lab") { setLabJump(0); localStorage.setItem("samenland-lab-jump", "0"); }
      // charters and roads load together with the seeds, so no settled decision pops up again
      perfMark("seeds-start");
      const a = await allRows(() => supabase.from("seeds").select("*").eq("realm", r), "chrono");
      perfMark("seeds-end");
      if (!live()) return;
      const ids = a.data.map((x) => x.id);
      mapIds.current = ids;
      setMapGen((n) => n + 1);
      const [[b, bl, sg, pu, chq, frq], encRows, voteRows, workRows] = await Promise.all([Promise.all([
        mapRows(ids, (c) => supabase.from("plantings").select("*").in("seed_id", c)),
        mapRows(ids, (c) => supabase.from("blessings").select("id, seed_id, created_at").in("seed_id", c)),
        mapRows(ids, (c) => supabase.from("signposts").select("id, seed_id, target_id, user_id, message").in("seed_id", c)),
        mapRows(ids, (c) => supabase.from("purchases").select("id, seed_id, item, cost, created_at, x, y").in("seed_id", c)),
        mapRows(ids, (c) => supabase.from("charters").select("id, seed_id, path, created_at").in("seed_id", c)),
        mapRows(ids, (c) => supabase.from("first_roads").select("id, seed_id, target_id, created_at").in("seed_id", c)),
      ]).then((xs) => xs.map((data) => ({ data }))) as unknown as Promise<[{ data: Planting[] }, { data: { id: string; seed_id: string; created_at: string }[] }, { data: { id: string; seed_id: string; target_id: string; user_id: string; message: string }[] }, { data: { id: string; seed_id: string; item: string; cost: number; created_at: string; x: number | null; y: number | null }[] }, { data: { id: string; seed_id: string; path: string; created_at: string }[] }, { data: { id: string; seed_id: string; target_id: string; created_at: string }[] }]>,
        // everything population depends on loads before the first full town is published (no 124-then-189)
        mapRows(ids, (c) => supabase.from("encounters").select("id, seed_id, event, choice, cost, created_at").in("seed_id", c)) as Promise<EncRow[]>,
        mapRows(ids, (c) => supabase.from("twin_votes").select("id, seed_id, partner_id, pact, created_at").in("seed_id", c)),
        mapRows(ids, (c) => supabase.from("twin_works").select("id, seed_id, partner_id, work, cost, created_at").in("seed_id", c)),
      ]);
      if (!live()) return;
      const keep = (...xs: (string | null | undefined)[]) => onIds(mapIds.current, ...xs);
      // full snapshots; inserts racing the queries are held by rtGate and replayed after end()
      setCharters(snapRows(chq.data ?? [], (x) => keep(x.seed_id)));
      setFirstRoads(snapRows(frq.data ?? [], (x) => keep(x.seed_id, x.target_id)));
      setEncounters(snapRows(encRows, (x) => keep(x.seed_id)));
      setVotes(snapRows(voteRows, (x) => keep(x.seed_id, x.partner_id))); setWorks(snapRows(workRows, (x) => keep(x.seed_id, x.partner_id)));
      Promise.all([
        mapRows(ids, (c) => supabase.from("gifts").select("id, from_seed, to_seed, kind, amount, note, created_at").in("to_seed", c)),
        mapRows(ids, (c) => supabase.from("gifts").select("id, from_seed, to_seed, kind, amount, note, created_at").in("from_seed", c)),
      ]).then(([x, y]) => { const m = new Map([...x, ...y].map((g) => [g.id, g])); if (live()) setGifts((o) => mergeRows([...m.values()] as Gift[], o, (g) => keep(g.from_seed, g.to_seed))); });
      // letters touching this map (last 60 days) and only their bodies (RLS: sender/recipient)
      setLetters([]); setBodies({});
      { const since = new Date(Date.now() - 60 * 864e5).toISOString();
        allEither<LetterRow>(ids, ["from_seed", "to_seed"], (col, c) => supabase.from("letters").select("id, from_seed, to_seed, created_at").gte("created_at", since).in(col, c)).then(async (ls) => {
          if (!live()) return;
          setLetters((o) => mergeRows(ls, o, (l) => keep(l.from_seed, l.to_seed)));
          const bs = uid ? await mapRows<{ letter_id: string; body: string }>(ls.map((l) => l.id), (c) => supabase.from("letter_bodies").select("letter_id, body").in("letter_id", c), "letter_id") : [];
          if (live()) setBodies((old) => ({ ...old, ...Object.fromEntries(bs.map((b) => [b.letter_id, b.body])) }));
        }); }
      const ss = (a.data ?? []) as Seed[];
      const meId = uid ? ss.find((s) => s.user_id === uid)?.id ?? null : null;
      Promise.all([
        // private rows: only the own village (P.2b) — never realm-wide, guests query nothing
        (meId ? allPages(() => supabase.from("quest_claims").select("id, seed_id, quest, reward, created_at").eq("seed_id", meId)) : Promise.resolve([])).then((data) => ({ data: data as { id: string; seed_id: string; quest: string; reward: number; created_at: string }[] })),
        (meId ? allPages(() => supabase.from("market_sales").select("id, seed_id, day, reward, created_at").eq("seed_id", meId)) : Promise.resolve([])).then((data) => ({ data: data as { id: string; seed_id: string; day: string; reward: number; created_at: string }[] })),
        // both sides of an invite in one OR query (partners may live on another map)
        (meId ? allPages(() => supabase.from("referrals").select("id, referrer_seed, referee_seed, reward, created_at").or(`referrer_seed.eq.${meId},referee_seed.eq.${meId}`)) : Promise.resolve([])).then((data) => ({ data: data as { id: string; referrer_seed: string; referee_seed: string; reward: number; created_at: string }[] })),
        // only visits made by the own village count (visitClaims / repeatVisits / decree)
        (meId ? allPages(() => supabase.from("village_visits").select("id, visitor_seed, visited_seed, reward, created_at, last_at").eq("visitor_seed", meId)) : Promise.resolve([])).then((data) => ({ data: data as { id: string; visitor_seed: string; visited_seed: string; reward: number; created_at: string; last_at: string | null }[] })),
        allRows<unknown>(() => supabase.from("wonder_finds").select("id, seed_id, site, realm, first, reward, created_at").eq("realm", r)),
        mapRows<unknown>(ids, (c) => supabase.from("princely_tasks").select("id, seed_id, step, task, reward, accepted_at, done_at").in("seed_id", c)).then((data) => ({ data })),
      ]).then(([q, m, rf, vv, wf, pt]) => {
        if (!live()) return;
        princelyRows.current = (pt.data ?? []) as PrincelyRow[]; setHeraldRows(princelyRows.current); bumpPrince((n) => n + 1);
        loadErrands(epoch);
        mapRows<{ seed_id: string }>(ids, (c) => supabase.from("knighthoods").select("seed_id").in("seed_id", c), "seed_id").then((data) => { if (live()) { knights.current = new Set(data.map((k) => k.seed_id)); setKnights(knights.current); } });
        // only this player's own visits mark a town as seen — other players' visits must not block the welcome gift
        // (repeat visits are still reported once per session: they count for the prince's "visit" decree, never a second gift)
        // repeat visits persist as last_at — keep them after reload so the "visit" decree stays met (mirrors princely_task_met)
        { const me = ss.find((s) => uid && s.user_id === uid); repeatVisits.current = [...new Set([...repeatVisits.current, ...(vv.data ?? []).filter((x) => me && x.visitor_seed === me.id && x.last_at).map((x) => x.last_at as string)])]; }
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
      setBlessings(snapRows(bl.data ?? [], (x) => keep(x.seed_id)));
      setPurchases(snapRows(pu.data ?? [], (x) => keep(x.seed_id)));
      setSigns(snapRows((sg.data ?? []) as Signpost[], (x) => keep(x.seed_id)));
      setSeeds(snapRows(ss, (x) => x.realm === r));
      perfMark("primary");
      setPlantings(snapRows((b.data ?? []) as Planting[], (x) => keep(x.seed_id)));
      // visitors without a village first see the oldest (most grown) town of this map
      const oldest = [...ss].sort((p, q) => Date.parse(p.created_at) - Date.parse(q.created_at))[0];
      const own = ss.find((s) => uid && s.user_id === uid);
      const friend = refSeed ? ss.find((s) => s.id === refSeed!.id) : undefined;
      const my = own ?? friend ?? oldest;
      if (my) focus(my.x, my.y);
      else focus(MAP / 2, MAP / 2);
      setBakeHold(false); // P.5a: final start view known — bake from here on
      // a stroll interrupted by a reload resumes where the mayor stood (local-only, expires after STROLL_TTL)
      if (own) try {
        const sv = JSON.parse(localStorage.getItem(STROLL_KEY) ?? "null") as { sid: string; x: number; y: number; t: number } | null;
        if (sv && sv.sid === own.id && Date.now() - sv.t < STROLL_TTL) {
          const me = townOf(own, ss, clock()).people.find((q) => q.role === "mayor");
          if (me) { restoreDrive(me.id, own.id, sv.x, sv.y); focus(sv.x, sv.y); camFree.current = false; setWalk(true); }
        } else localStorage.removeItem(STROLL_KEY);
      } catch { /* ignore */ }
      // dense test cluster: enter close up so only one town is in view while the cold caches fill
      if (r === "lab") { const zl = Math.max(cam.current.zoom, 2.6); cam.current.zoom = zl; target.current = { ...target.current, zoom: zl }; }
      if (!own && friend) setMsg(tRef.current.invite.welcome(friend.name));
      refSeed = null; // the welcome is only for the first map
      } finally { setBakeHold(false); rtGate.current.end(epoch); }
      };
      loadRealmRef.current = loadRealm;
      await loadRealm(r);
    })();
    const onMap = (...xs: (string | null | undefined)[]) => onIds(mapIds.current, ...xs);
    // events arriving while a map loads are held, then judged against the new map's ids
    const held = (fn: (p: any) => void) => (p: any) => rtGate.current.run(() => fn(p)); // eslint-disable-line @typescript-eslint/no-explicit-any
    const ch = supabase
      .channel(`world-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seeds" }, held((p) => {
        const n = p.new as Seed; if ((n as { realm?: string }).realm !== realmRef.current) return;
        if (!mapIds.current.includes(n.id)) mapIds.current = [...mapIds.current, n.id];
        setSeeds((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      }))
      // abandoned village: held like every event, so a DELETE during a refresh replays after its snapshot and wins
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "seeds" }, held((p) => {
        const left = dropSeedId(mapIds.current, p); if (!left) return;
        const id = (p.old as { id: string }).id; mapIds.current = left;
        setSeeds((s) => s.filter((x) => x.id !== id)); setHome((h) => (h && h.id === id ? null : h));
        setEncounters((r) => withoutSeed(r, id, "seed_id")); setCharters((r) => withoutSeed(r, id, "seed_id"));
        setFirstRoads((r) => withoutSeed(r, id, "seed_id", "target_id")); setVotes((r) => withoutSeed(r, id, "seed_id", "partner_id"));
        setWorks((r) => withoutSeed(r, id, "seed_id", "partner_id")); setPurchases((r) => withoutSeed(r, id, "seed_id"));
        setBlessings((r) => withoutSeed(r, id, "seed_id")); setPlantings((r) => withoutSeed(r, id, "seed_id"));
        setGifts((r) => withoutSeed(r, id, "from_seed", "to_seed")); setSigns((r) => withoutSeed(r, id, "seed_id", "target_id"));
        // abandon_village also deletes letters to/from the village: drop them and their bodies, close views on it
        setLetters((r) => { const gone = r.filter((l) => l.from_seed === id || l.to_seed === id).map((l) => l.id); if (gone.length) setBodies((b) => withoutKeys(b, gone)); return gone.length ? withoutSeed(r, id, "from_seed", "to_seed") : r; });
        setPostTo((x) => (x && x.id === id ? null : x)); setProfile((x) => (x && x.id === id ? null : x));
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "plantings" }, held((p) => {
        const n = p.new as Planting; if (!onMap(n.seed_id)) return;
        setPlantings((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "building_moves" }, held((p) => {
        const n = p.new as MoveRow; if (!onMap(n.seed_id)) return;
        setMoves((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "purchases" }, held((p) => {
        const n = p.new as Purchase; if (!onMap(n.seed_id)) return;
        setPurchases((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "letters" }, held((p) => {
        const n = p.new as LetterRow; if (!onMap(n.from_seed, n.to_seed)) return;
        setLetters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
        const e = rtGate.current.epochNow;
        supabase.from("letter_bodies").select("letter_id, body").eq("letter_id", n.id).maybeSingle().then(({ data }) => { if (data && rtGate.current.isCurrent(e) && onMap(n.from_seed, n.to_seed)) setBodies((b) => ({ ...b, [data.letter_id]: data.body })); });
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "charters" }, held((p) => {
        const n = p.new as { id: string; seed_id: string; path: string; created_at: string }; if (!onMap(n.seed_id)) return;
        setCharters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "encounters" }, held((p) => {
        const n = p.new as EncRow; if (!onMap(n.seed_id)) return;
        setEncounters((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "first_roads" }, held((p) => {
        const n = p.new as { id: string; seed_id: string; target_id: string; created_at: string }; if (!onMap(n.seed_id, n.target_id)) return;
        setFirstRoads((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gifts" }, held((p) => {
        const g = p.new as Gift; if (!onMap(g.from_seed, g.to_seed)) return; setGifts((q) => (q.some((x) => x.id === g.id) ? q : [...q, g]));
      }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "blessings" }, held((p) => {
        const n = p.new as { id: string; seed_id: string; created_at: string }; if (!onMap(n.seed_id)) return;
        setBlessings((s) => (s.some((x) => x.id === n.id) ? s : [...s, n]));
      }))
      .on("postgres_changes", { event: "*", schema: "public", table: "signposts" }, held((p) => {
        setSigns((s) => applySign(s, p, mapIds.current));
      }))
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
    // iOS preview iframes can mount at 0×0 and never fire window.resize: watch the element itself
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
    ro?.observe(cv);
    let lastScene = 0;
    // diagnostics only (?perf=1): place the camera at a fixed tile + zoom for reproducible benchmark scenes
    if (perfCamOn()) (window as unknown as { __perfCam: unknown }).__perfCam = (tx: number, ty: number, zoom: number) => {
      const [x, y] = iso(tx, ty); cam.current = { x, y, zoom }; target.current = { zoom, ax: cv.width / 2, ay: cv.height / 2 }; camFree.current = true;
    };
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
      // no layout yet (0×0): wait for the next frame instead of drawing into nothing
      if (cv.clientWidth > 0 && (cv.width === 0 || cv.height === 0 || cv.width !== Math.ceil(cv.clientWidth * dpr.current))) resize();
      if (cv.width === 0 || cv.height === 0) { raf = document.hidden ? 0 : requestAnimationFrame(loop); return; }
      pBegin("draw");
      try { draw(ctx, cv.width, cv.height, dpr.current, c, s.seeds, s.plantings, clock(), h, ok); }
      catch (err) { console.error("draw failed", err); } // one bad frame must never stop the loop
      pEnd(); pFrame(performance.now() - t0);
      if (import.meta.env.DEV || isLab()) {
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
        const good = treeGuard(s.moving ? canMoveTo : canPlaceSpecial, s.plantings)(s.placing, gh[0], gh[1], own, s.seeds, clock()) === null;
        const z = c.zoom * dpr.current, [gx, gy] = iso(gh[0], gh[1]);
        ctx.save();
        ctx.setTransform(z, 0, 0, z, cv.width / 2 - c.x * z, cv.height / 2 - c.y * z);
        // 2×2 ensembles: show the whole four-tile footprint and draw at the same lifted anchor as the finished building
        const big = FOOT2.has(SPECIAL_KIND[s.placing]!), ay = big ? gy - 8 : gy, hw = big ? 32 : 16, hh = big ? 16 : 8;
        const diamond = (x: number, y: number) => { const [px, py] = iso(x, y); ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.lineTo(px + 16, py); ctx.lineTo(px, py + 8); ctx.lineTo(px - 16, py); ctx.closePath(); };
        // good spots nearby: a faint green wash so the player sees at a glance where the building may go
        ctx.fillStyle = "rgba(90,190,90,0.16)";
        for (const [sx, sy] of s.spots) { if (sx === gh[0] && sy === gh[1]) continue; diamond(sx, sy); ctx.fill(); }
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 320);
        // each covered tile on its own: red marks exactly the tile that blocks the building
        const now0 = clock();
        for (const [fx, fy] of footprint(s.placing, gh[0], gh[1])) {
          const ok = good || footTileFree(fx, fy, s.seeds, now0) && !(fx === gh[0] && fy === gh[1]);
          diamond(fx, fy); ctx.fillStyle = ok && good ? `rgba(90,190,90,${0.3 + 0.15 * pulse})` : ok ? `rgba(230,170,60,${0.3 + 0.15 * pulse})` : `rgba(210,70,60,${0.35 + 0.15 * pulse})`; ctx.fill();
        }
        ctx.beginPath(); ctx.moveTo(gx, ay - hh); ctx.lineTo(gx + hw, ay); ctx.lineTo(gx, ay + hh); ctx.lineTo(gx - hw, ay); ctx.closePath();
        // a bold rim (constant ~2.5 screen px) so the footprint reads even under roofs
        ctx.lineWidth = 2.5 / Math.max(0.5, c.zoom); ctx.strokeStyle = good ? "rgba(30,110,30,0.95)" : "rgba(150,30,25,0.95)"; ctx.stroke();
        const kind = SPECIAL_KIND[s.placing]!, gw = GHOST_WIDTH[kind];
        // a thin prop (the fire rack) is painted almost opaque so its buckets and ladder read over the footprint
        ctx.globalAlpha = gw ? (good ? 0.95 : 0.8) : good ? 0.55 + 0.15 * pulse : 0.4;
        drawBuildingSprite(ctx, kind, gx, ay, 0.5, 1, false, undefined, gw);
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
        let flood = 0, floodPan = 0;
        for (const q of lastSources) if (q.k === "flood") { const dx = (q.x - c.x) / hw, dy = (q.y - c.y) / hh, nr = Math.max(0, 1 - Math.hypot(dx, dy) * 0.7); if (nr > flood) { flood = nr; floodPan = Math.max(-1, Math.min(1, dx)); } }
        const sources = lastSources.filter((q) => q.k !== "flood").slice(0, 40).map((q) => {
          const dx = (q.x - c.x) / hw, dy = (q.y - c.y) / hh;
          return { k: q.k, pan: dx, near: Math.max(0, 1 - Math.hypot(dx, dy) * 0.8) };
        }).filter((q) => q.near > 0);
        setScene({ zoom: zn, forest: forest / n, water: water / n, sea: sea / n, people: lastPeople.length, talkers, sources, flood, floodPan });
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
        zoom: Math.min(maxZoom(st.current.walk), Math.max(MIN_ZOOM, target.current.zoom * Math.exp(-dy * 0.0012))),
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
    let lastPan = performance.now(), walkDriven = false, strollSaved = 0;
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
            if (now - strollSaved > 2000) { strollSaved = now; try { localStorage.setItem(STROLL_KEY, JSON.stringify({ sid: my.id, x: q.x, y: q.y, t: Date.now() })); } catch { /* storage full/blocked */ } }
            for (const o of S.seeds) if (o.id !== my.id && !visitSeen.current.has(o.id) && Math.hypot(q.x - o.x, q.y - o.y) <= radiusOf((nw - Date.parse(o.created_at)) / 36e5)) { visitSeen.current.add(o.id); visitFn.current(o, my); }
            for (const w of wonders()) if (!wonderSeen.current.has(w.key) && Math.hypot(q.x - w.x, q.y - w.y) <= WONDER_REACH) { wonderSeen.current.add(w.key); wonderFn.current(w.key, w.kind, my); }
            { const near = atCourt(q.x, q.y); if (near !== courtNear.current) { courtNear.current = near; setNearCourt(near); } }
            { const ct = courtTask(my.id); const e = ct ? errandNear(worldHour(nw), nw, q.x, q.y, new Set(errandDone.current.filter((r) => r.task_id === ct.id).map((r) => r.errand))) : null; if (e !== errNear.current) { errNear.current = e; setNearErrand(e); } }
            { const gl = courtGoal.current; if (gl && (gl === "audience" ? courtNear.current : errNear.current === gl)) { courtGoal.current = null; courtArrive.current(gl); } }
            if (drag.current?.moved) camFree.current = true;
            if (camFree.current !== camLooseRef.current) { camLooseRef.current = camFree.current; setCamLoose(camFree.current); }
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
      ro?.disconnect();
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
    return personHit(lastPeople, wx, wy, c.zoom, coarse);
  };
  useEffect(() => { peopleFocus.sel = who ? pkey(who) : null; }, [who]);
  // ---- talking: tap a villager, court servant or house for a fitting local speech bubble ----
  const bVars = (town: string) => { const m = seeds.find((x) => x.id === mine); return { mayor: m?.owner ?? "", town }; };
  const isNight = () => { const hr = worldHour(clock()); return hr >= 22 || hr < 6; };
  /** True when the player's own mayor is strolling within MEET_TILES of tile (x, y): only then do strangers address him. */
  const mayorNear = (x: number, y: number) => {
    if (!walk) return false;
    const me = lastPeople.find((o) => o.q.p.role === "mayor" && o.q.p.seed.id === mine);
    return !!me && Math.hypot(me.q.x - x, me.q.y - y) <= MEET_TILES;
  };
  /** Tapping one's own waiting visitor opens the pending encounter at once (no 3-minute wait). */
  const guestTap = (p: Person) => {
    if (p.role !== "guest" || p.guest?.until !== Infinity || p.seed.id !== mine || !userId || p.seed.user_id !== userId) return false;
    const nw = clock();
    if (!pendingAll(p.seed, p.seed.decisions ?? [], nw, effAge(p.seed, seeds, nw), townRank(p.seed, seeds, Math.floor(nw / 5000) * 5000))) return false;
    setSnooze({}); setEncOpen(true); return true;
  };
  const speak = (p: Person) => {
    if (p.role === "mayor") return;
    const nw = clock(), tw = townOf(p.seed, seeds, nw), q = poseOf(p, tw, seeds, nw);
    const own = p.seed.id === mine;
    // foreign folk stay silent unless our mayor stands before them in person
    if (!own && !mayorNear(q.x, q.y)) return;
    const child = p.role === "child" || p.age < 14, night = isNight() || q.act === "sleep";
    const myT = seeds.find((x) => x.id === mine)?.name ?? "";
    const head = (x: string) => ownHead(x, lang, p.seed.mayor_gender as "m" | "w" | "d" | null, townRank(p.seed, seeds, Math.floor(nw / 5000) * 5000));
    const text = head(addr(own ? banter(lang, { who: "own", traits: traitsOf(p.id), child, sick: !!p.sick, night, wedding: q.act === "wedding" || (q.act === "fete" && weddingLive(p.seed, nw) != null) }, bVars(p.seed.name))
      : banter(lang, { who: "foreign", child, night }, bVars(myT))));
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
      if (Math.hypot(ix - wx, iy - 2.5 - wy) < bd) { courtAct(q.role, q.x, q.y); if (mayorNear(q.x, q.y)) sayAt(addr(banter(lang, { who: "court", role: q.role, night: isNight() }, bVars(seeds.find((x) => x.id === mine)?.name ?? ""))), ix, iy, 10); return true; }
    }
    return false;
  };
  const knock = (ins: Inspect) => {
    if (!isHomeKind(ins.kind) || ins.build !== null) return false;
    const nw = clock(), tw = townOf(ins.seed, seeds, nw);
    const home = ins.residents.some((p) => { const a = poseOf(p, tw, seeds, nw).act; return a === "home" || a === "sleep" || a === "sick"; });
    const own = ins.seed.id === mine, [ix, iy] = iso(ins.x, ins.y);
    if (!own && !mayorNear(ins.x, ins.y)) return false;
    sayAt(ownHead(addr(banter(lang, { who: "house", own, home, night: isNight() }, bVars(own ? ins.seed.name : seeds.find((x) => x.id === mine)?.name ?? ""))), lang, ins.seed.mayor_gender as "m" | "w" | "d" | null, townRank(ins.seed, seeds, Math.floor(nw / 5000) * 5000)), ix, iy, 22);
    return true;
  };
  /** Stroll mode: talk to whoever/whatever lies under the tap; true when something answered. */
  const talkTo = (e: React.PointerEvent) => {
    { const [tx, ty] = tileAt(e);
      for (const [sid, d] of dogSpots) if (Math.hypot(d.x - tx, d.y - ty) < 0.9) {
        const dt = DOG[lang], n = dogNames.get(sid) ?? dt.unnamed, ls = dt.lines(n), [wx, wy] = dogIso(d.x, d.y);
        sayAt(isNight() ? dt.sleepy(n) : ls[Math.floor(Math.random() * ls.length)]!, wx, wy, 5); if (isNight()) tap(); else animalCall("dog"); return true;
      } }
    const p = personAt(e);
    if (p && p.role === "mayor" && p.seed.id !== mine && p.seed.user_id && userId) { setDmPeer(p.seed.user_id); setTavernOpen(true); return true; }
    if (p && guestTap(p)) { tap(); return true; }
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

  /** The database refused this map as full (realm_full): continue the founding on the next map of the chain with room, reusing openRealm and loadRealm. */
  const moveOnFromFullRealm = async () => {
    const from = realmRef.current;
    setMsg(t.realmFull.moving);
    try {
      // same read as the initial map choice; the refused map is skipped even if this count lags behind
      const rows = await allRows<{ id: string; realm: string }>(() => supabase.from("seeds").select("id, realm").in("realm", REALMS));
      const counts = new Map<string, number>();
      for (const x of rows.data) counts.set(x.realm, (counts.get(x.realm) ?? 0) + 1);
      const next = nextOpenRealm(from, (q) => counts.get(q) ?? 0);
      if (!next) { setMode("look"); return setMsg(t.realmFull.none); }
      await loadRealmRef.current?.(next);
      if (realmRef.current !== next) { setMode("look"); return setMsg(t.realmFull.fail); }
      setMode("seed");
    } catch { setMode("look"); setMsg(t.realmFull.fail); }
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
    // the chosen spot is map-specific and no longer held; the form (town, mayor, address) is kept
    const full = isRealmFull(error);
    setPlantAsk(null);
    setPtr(null);
    setHover(null); st.current.hover = null;
    // a full map keeps the founder in seed mode so they can place the village on the next map
    setMode(full ? "seed" : "look");
    if (error?.code === "23505") { setTab(null); return setMsg(t.alreadyHave); }
    if (full) return moveOnFromFullRealm();
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
  const certifyFn = useServerFn(certifyMyRank);
  const nothilfeFn = useServerFn(callNothilfe);
  const { accounting, setAccounting, refreshAccounting, refreshTreasury } = useTreasurySync(my, userId, [purchases, gifts, claims, encounters, works, moves]);
  const prepareSpend = async () => {
    // always book outstanding daily tax first — right after load `accounting` is still unknown
    if (await refreshTreasury()) return true;
    if (!accounting?.active) return true;
    setMsg(t.buyFail); return false;
  };
  const startWalk = () => { if (!my) return; setTab(null); setWho(null); setPlace(null); setPlacing(null); setWalk(true); };
  const wasWalk = useRef(false);
  useEffect(() => { setOwnMayor(my?.id ?? null); }, [my?.id]);
  useEffect(() => { setStrollHold(walk); if (wasWalk.current && !walk) { if (my) { const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor"); if (me) parkMayor(me, tw, seeds, nw); } target.current = { ...target.current, zoom: Math.min(maxZoom(false), target.current.zoom) }; } wasWalk.current = walk; }, [walk]);
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
    if (error || !data) {
      // already sealed (e.g. on another device): refresh and close instead of a silent dead button
      if (error?.code === "23505") {
        setCharters(await mapRows(mapIds.current, (c) => supabase.from("charters").select("id, seed_id, path, created_at").in("seed_id", c)));
        setCharterOpen(false);
        return;
      }
      toast.error(t.charter.fail);
      return setMsg(t.charter.fail);
    }
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
    bell(0); setRoadOpen(false);
    const { data, error } = await supabase.from("first_roads").insert({ seed_id: my.id, user_id: userId, target_id: roadPick }).select("id, seed_id, target_id, created_at").single();
    if (error || !data) return setMsg(error?.message?.includes("under construction") ? t.road.busyFail : t.road.fail);
    setFirstRoads((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    setMsg(t.road.sealed(seeds.find((s) => s.id === roadPick)?.name ?? ""));
  };
  const decide = async (event: string, choice: string) => {
    if (!my || !userId || encSaving.current) return;
    // instant feedback: bell and close at once; the server confirms (or we reopen on a money refusal)
    encSaving.current = true;
    bell(0); setEncOpen(false);
    // book outstanding tax first, but let the server guard judge the price — free choices must never be blocked here
    await refreshTreasury().catch(() => false);
    const { data, error } = await supabase.from("encounters").insert({ seed_id: my.id, user_id: userId, event, choice }).select("id, seed_id, event, choice, cost, created_at").single();
    encSaving.current = false;
    if (error || !data) {
      // already answered elsewhere: reload instead of leaving a stale question open
      { const ids = mapIds.current; refreshMap(rtGate.current, () => mapRows(ids, (c) => supabase.from("encounters").select("id, seed_id, event, choice, cost, created_at").in("seed_id", c)) as Promise<EncRow[]>,
        (rows) => setEncounters(snapRows(rows, (x) => onIds(mapIds.current, x.seed_id)))); }
      if (error?.message?.includes("not enough money")) setEncOpen(true);
      return setMsg(error?.message?.includes("not enough money") ? t.poor : t.enc.fail);
    }
    setEncounters((s) => (s.some((x) => x.id === data.id) ? s : [...s, data]));
    if (event === "nursery" && choice !== "pass") { startSapling(); } else setMsg(t.enc.done);
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
    // newcomers first get their bearings: the road question waits for the first claimed task
    road: owner && !myRoad && claims.some((c) => c.seed_id === my!.id) && !links(seeds).some((l) => l.a.id === my!.id || l.b.id === my!.id) && roadCandidates(my!, seeds).length > 0,
    charter: owner && !myCharter && charterReady(my!.created_at, now),
    pact: owner && !!pactPartner,
    // visitors only come while someone watches: the tab must have been open and visible for a few minutes
    encounter: owner && (watching || encOpen) && !!pendingAll(my!, my!.decisions ?? [], now, effAge(my!, seeds, now), townRank(my!, seeds, Math.floor(now / 5000) * 5000)),
  }, (k) => (snooze[k] ?? 0) > now);
  const anyOpen = roadOpen || charterOpen || encOpen || pactOpen;
  const sealShown = !anyOpen && !decision.open && decision.due.length > 0;
  // "show on map" only steps aside briefly; the wax seal stays and reopens at once
  function later(k: DecisionKind, ms = 3.6e6) {
    setSnooze((m) => ({ ...m, [k]: Date.now() + ms }));
    if (k === "road") setRoadOpen(false); else if (k === "charter") setCharterOpen(false); else if (k === "pact") setPactOpen(false); else setEncOpen(false);
  }
  function reopen() { instantOpen.current = true; setSnooze({}); }
  // Village chronicle: derived from time since the last visit (per village, per device)
  const [chron, setChron] = useState<Chronicle | null>(null);
  const [chronOpen, setChronOpen] = useState(false);
  // top-right feather only appears while something new waits (chronicle news since last reading, unread gifts)
  const [chronRead, setChronRead] = useState<number | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [tavernOpen, setTavernOpen] = useState(false);
  const [dmPeer, setDmPeer] = useState<string | null>(null);
  useEffect(() => { setTavernMusic(tavernOpen); }, [tavernOpen]);
  useEffect(() => () => setTavernMusic(false), []);
  const [chatUnread, setChatUnread] = useState(0);
  const [rollOpen, setRollOpen] = useState(false);
  // any window/drawer that floating banners must not cover
  const menuOpen = !!tab || settings || guideOpen || tavernOpen || rollOpen;
  // the tutorial parchment greets every visitor on their very first page load,
  // signed in or not, as soon as the loading screen has stepped aside
  const openGuide = () => {
    if (localStorage.getItem("samenland-guide-seen") || isLab()) return;
    localStorage.setItem("samenland-guide-seen", "1");
    setWelcome(true);
  };
  useEffect(() => { if (splashDone()) openGuide(); }, []);
  const [chronBanner, setChronBanner] = useState(false);
  const [scribe, setScribe] = useState<string | null | undefined>(undefined);
  const askScribe = useServerFn(scribeGreeting);
  const chronDone = useRef<string | null>(null);
  const myCharterPath = (s: typeof my) => s?.charter?.path;
  const titleOfPath = (s: typeof my, k: number) => { const path = myCharterPath(s); const male = path ? t.office.names[path]?.[k] : undefined; return male && path ? titleForm(lang, s?.mayor_gender as "m" | "w" | "d" | null, path, k, male) : male; };
  const titleName = (k: number) => titleOfPath(my, k) ?? t.office.title;
  /** Highest honorary title of a village head, or "" (display only). */
  const honour = (s: typeof my) => { const n = s ? titleOfSeed(s) : 0; return n > 0 ? titleOfPath(s, n - 1) ?? "" : ""; };
  /** Address the player's own head by gender and real settlement rank (display only). */
  const addr = (x: string) => addressMayor(x, lang, my?.mayor_gender as "m" | "w" | "d" | null, rankRef.current);
  const rankRef = useRef(0);
  const itemName = (item: string) => { if (/^title[1-3]$/.test(item)) return titleName(+item.slice(5) - 1); const mk = monumentOf(item); return t.items[item]?.[0] ?? (mk ? t.items[`${mk}1`]![0] : item); };
  const chronLine = (e: ChronEvent) => e.code === "stage" ? t.chron.stage(t.stages[e.stage] ?? "") : e.code === "built" ? t.chron.built(t.kind[e.kind] ?? e.kind) : e.code === "bought" ? t.chron.built(itemName(e.item)) : e.code === "road" ? t.chron.road(e.other) : e.code === "twin" ? t.chron.twin(e.other) : e.code === "house" ? t.chron.house(t.kind[e.kind] ?? e.kind) : e.code === "family" ? t.chron.family : e.code === "houses" ? t.chron.houses(e.n) : e.code === "families" ? t.chron.families(e.n) : e.code === "wedding" ? t.chron.wedding(e.a, e.b) : e.code === "fire" ? (e.guarded ? t.chron.fireOut : t.chron.fire(e.dead)) : e.code === "flood" ? t.chron.flood : e.code === "raid" ? (e.caught ? t.chron.caught : t.chron.raid(e.loss)) : e.code === "journeyman" ? t.chron.journeyman(e.name, t.job[e.craft]?.[e.sex === "f" ? 0 : 1] ?? e.craft, e.other) : e.code === "journeymen" ? t.chron.journeymen(e.n) : e.code === "bride" ? t.chron.bride(e.name, e.other, e.away) : e.code === "moved" ? t.chron.moved(e.name, e.other, e.away) : e.code === "letter" ? t.chron.letter(e.other) : e.code === "orphan" ? ORPHAN_FAREWELL[lang][e.choice === "adopt" ? 0 : 1] : t.chron.season(t.seasons[e.season]);
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
  const repeatVisits = useRef<string[]>([]);
  const visitFn = useRef<(o: Seed, my: Seed) => void>(() => {});
  const [visitNote, setVisitNote] = useState<string | null>(null);
  // audience at the prince's seat: offered while the strolling mayor stands on the estate
  const courtNear = useRef(false);
  /** Court figure the mayor was sent to by a click; acted on when he arrives. */
  const courtGoal = useRef<Errand | "audience" | null>(null);
  const courtArrive = useRef<(g: Errand | "audience") => void>(() => {});
  /** Stroll mode: the player scrolled the map away; the camera stops following until the mayor is sent off again. */
  const camFree = useRef(false);
  /** Mirrors camFree for the HUD: shows the "follow mayor" button while the camera roams freely. */
  const [camLoose, setCamLoose] = useState(false);
  const camLooseRef = useRef(false);
  const [nearCourt, setNearCourt] = useState(false);
  const [audience, setAudience] = useState<AudienceHost | null>(null);
  const princelyRows = useRef<PrincelyRow[]>([]);
  // the rows live in a ref (shared with the renderer); this bump re-renders the HUD decree card whenever they change
  const [, bumpPrince] = useState(0);
  // Hofdienst: errands done for the open "court" decree (owner-only rows, mirrors DB princely_errand)
  const errandDone = useRef<{ task_id: string; errand: string }[]>([]);
  const errNear = useRef<Errand | null>(null);
  const [nearErrand, setNearErrand] = useState<Errand | null>(null);
  const [errandNote, setErrandNote] = useState<string | null>(null);
  const [, bumpErrand] = useState(0);
  const courtTask = (seedId: string) => { const o = openTaskOf(princelyRows.current, seedId); return o && o.task === "court" ? o : null; };
  // epoch of the map load that asked: a superseded load never writes late errands
  const loadErrands = (epoch: number) => {
    mapRows<{ task_id: string; errand: string }>(mapIds.current, (c) => supabase.from("princely_errands").select("id, task_id, errand").in("seed_id", c))
      .then((data) => { if (!rtGate.current.isCurrent(epoch)) return; errandDone.current = data; errNear.current = null; bumpErrand((n) => n + 1); });
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
  const kneel = async (seedId: string, female: boolean) => {
    const P = PRINCELY[lang];
    const rpc = supabase.rpc.bind(supabase) as unknown as (f: string, a: Record<string, string>) => PromiseLike<{ data: string | null; error: unknown }>;
    const { data, error } = await rpc("princely_knight", { _seed: seedId });
    if (error || !data) { setDecree(P.fail); return; }
    if (data === "not_yet") { setDecree(P.notYet); return; }
    knights.current = new Set([...knights.current, seedId]); setKnights(knights.current); bumpKnight((n) => n + 1);
    setDecree(P.dubbed(P.sir(female))); jingle("fanfare");
  };
  const [decree, setDecree] = useState<string | null>(null);
  /** Courier: the prince's messenger rides into the own village, so decrees no longer need a trip to court (DB princely_audience has no location check). */
  const [herald, setHerald] = useState(false);
  const [, bumpHerald] = useState(0);
  /** Is the messenger in the village (riding in or waiting)? Derived by heraldVisit, the same visit the map draws. */
  /** "Let the decrees rest": local only (presentation), cleared by asking at court. */
  const [quiet, setQuiet] = useState<string[]>([]);
  useEffect(() => { try { setQuiet(JSON.parse(localStorage.getItem("samenland-herald-quiet") ?? "[]")); } catch { /* ignore */ } }, []);
  useEffect(() => { setHeraldQuiet(new Set(quiet)); }, [quiet]);
  const setQuietFor = (seedId: string, on: boolean) => setQuiet((q) => { const n = on ? [...new Set([...q, seedId])] : q.filter((x) => x !== seedId); try { localStorage.setItem("samenland-herald-quiet", JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const heraldDue = (seedId: string) => { if (quiet.includes(seedId)) return false; const v = heraldVisit(princelyRows.current, seedId, clock()); return !!v && v.phase !== "leave"; };
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
    setQuietFor(seedId, false);
    const rpc = supabase.rpc.bind(supabase) as unknown as (f: string, a: Record<string, string>) => PromiseLike<{ data: string | null; error: unknown }>;
    const { data, error } = await rpc("princely_audience", { _seed: seedId });
    if (error || !data) { setDecree(P.fail); return; }
    const sel = (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => PromiseLike<{ data: unknown[] | null }> } } }).from("princely_tasks").select("id, seed_id, step, task, reward, accepted_at, done_at").eq("seed_id", seedId);
    const rows = ((await sel).data ?? []) as PrincelyRow[];
    const prevDone = new Set(princelyRows.current.filter((r) => r.done_at).map((r) => r.id));
    princelyRows.current = [...princelyRows.current.filter((r) => r.seed_id !== seedId), ...rows]; setHeraldRows(princelyRows.current); bumpPrince((n) => n + 1);
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
    if (data === "swapped") { princelyRows.current = princelyRows.current.map((r) => r.seed_id === seedId && !r.done_at ? { ...r, task: "court", accepted_at: new Date().toISOString() } : r); errNear.current = null; bumpErrand((n) => n + 1); setHeraldRows(princelyRows.current); bumpPrince((n) => n + 1); }
    setDecree(data === "swapped" ? P.swapped : data === "wait" ? P.wait : P.open(P.task.court));
  };
  useEffect(() => { if (!audience && !herald) setDecree(null); }, [audience, herald]);
  // ---- wayside encounters on the stroll: rare, derived placement; only "met" marks are kept in this browser ----
  const [way, setWay] = useState<Wayside | null>(null);
  const [wayNode, setWayNode] = useState<string | null>(null);
  const wayRef = useRef<Wayside | null>(null);
  useEffect(() => {
    if (!walk) { wayRef.current = null; setWay(null); setWayNode(null); setWayside(null); return; }
    const tick = () => {
      if (wayNode) return;
      const me = lastPeople.find((o) => o.q.p.role === "mayor" && o.q.p.seed.id === mine);
      if (!me) return;
      const nw = clock(), w = waysideNear(me.q.x, me.q.y, nw, readWayMem(userId), (x, y) => freeLand(x, y, st.current.seeds, nw));
      if (w?.id !== wayRef.current?.id || w?.key !== wayRef.current?.key) {
        wayRef.current = w; setWay(w);
        setWayside(w ? { x: w.x, y: w.y, fig: WAYSIDE[w.key].fig, carry: (WAYSIDE[w.key] as { carry?: string }).carry, prop: WAY_PROP[w.key], sd: Math.abs((w.x * 977 + w.y * 131) | 0) } : null);
      }
    };
    tick(); const h = setInterval(tick, 2000); return () => clearInterval(h);
  }, [walk, mine, userId, wayNode]);
  const wayLeave = () => { const w = wayRef.current; if (w) markMet(userId, w.key, clock()); wayRef.current = null; setWay(null); setWayNode(null); setWayside(null); };
  /** Tapped the wayside figure: talk when the mayor stands close, otherwise walk over first. */
  const wayTap = (e: React.PointerEvent) => {
    const w = wayRef.current, f = lastWayside[0]; if (!w || !f) return false;
    const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
    const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
    if (Math.hypot(f.x - wx, f.y - 3 - wy) > Math.max(6, 22 / c.zoom)) return false;
    const me = lastPeople.find((o) => o.q.p.role === "mayor" && o.q.p.seed.id === mine);
    if (me && Math.hypot(me.q.x - w.x, me.q.y - w.y) <= 3.5) { setWayNode("start"); return true; }
    const my = seeds.find((x) => x.id === mine);
    if (my) { const nw = clock(), tw = townOf(my, seeds, nw), mp = tw.people.find((q) => q.role === "mayor"); if (mp) commandMayor(mp, tw, seeds, nw, [w.x + 1, w.y]); }
    setMsg(WAYSIDE_TEXT[lang].ui.far);
    return true;
  };
  useEffect(() => { if (!walk) { courtGoal.current = null; courtNear.current = false; setNearCourt(false); setAudience(null); errNear.current = null; setNearErrand(null); } }, [walk]);
  useEffect(() => { if (!errandNote) return; const h = setTimeout(() => setErrandNote(null), 9000); return () => clearTimeout(h); }, [errandNote]);
  useEffect(() => { if (!visitNote) return; const h = setTimeout(() => setVisitNote(null), 9000); return () => clearTimeout(h); }, [visitNote]);
  visitFn.current = (o, my) => {
    if (!owner || my.user_id !== userId) { visitSeen.current.delete(o.id); return; }
    // claim_visit only pays within 200 tiles of the own village — say so instead of staying silent
    if (Math.hypot(my.x - o.x, my.y - o.y) > 200) { setVisitNote(t.visit.far(o.name)); return; }
    supabase.rpc("claim_visit", { _seed: my.id, _visited: o.id }).then(({ data, error }) => {
      if (error) return;
      if (!data) {
        const op = openTaskOf(princelyRows.current, my.id);
        if (op && op.task === "visit" && Date.parse(op.accepted_at) < clock()) { repeatVisits.current.push(new Date().toISOString()); jingle("fanfare"); setVisitNote(PRINCELY[lang].visited(o.name)); }
        return;
      }
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
      const base = before ? t.wonder.later(name, data, by, daysSince(before.created_at, clock())) : t.wonder.first(name, data);
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
  // test map: the control desk makes the village nearest the camera the "watched" one — its event opens the parchment and the camera glides there
  const [labTown, setLabTown] = useState<Seed | null>(null);
  const labTrigger = (code: string) => {
    const [cx, cy] = toTile(cam.current.x, cam.current.y);
    const lab = seeds.filter((s) => s.realm === "lab");
    const s = lab.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0];
    if (!s) return;
    const now = clock();
    liveFrom.current = now + 1;
    const ev = chronicle(s, seeds, now - 2000, now + 1000).events.filter((e) => e.code === code).pop();
    // a wedding is followed where it happens right now (bride's door, portal, new home)
    const wf = ev?.code === "wedding" ? weddingFocus(townOf(s, seeds, now), ev.at, seeds, now) : null;
    const x = wf ? wf[0] : ev && "x" in ev ? ev.x : s.x, y = wf ? wf[1] : ev && "y" in ev ? ev.y : s.y;
    const [gx, gy] = iso(x, y);
    cam.current.zoom = Math.max(cam.current.zoom, 5);
    camFree.current = true; fling.current = { vx: 0, vy: 0, t: performance.now() }; glide.current = { x: gx, y: gy };
    setDeskOpen(false); setSettings(false); setWelcome(false); setTab(null);
    if (ev) { setLabTown(s); setFest((q) => [...q, ev].slice(-6)); }
  };
  const festNow = !anyOpen && !decision.open && !chronOpen ? fest[0] : undefined;
  const festSeed = my ?? labTown ?? undefined;
  const festSounded = useRef<ChronEvent | null>(null), giftSounded = useRef<string | null>(null);
  useEffect(() => {
    if (!festNow || festSounded.current === festNow) return;
    festSounded.current = festNow;
    const e = festNow;
    jingle(e.code === "wedding" ? "wedding" : e.code === "stage" ? "stage" : e.code === "road" ? "road" : e.code === "twin" ? "twin" : e.code === "letter" ? "letter" : e.code === "family" ? "welcome" : e.code === "built" && SEAT_KINDS.includes(e.kind) ? (["built", "fanfare", "stage", "stage"] as const)[SEAT_KINDS.indexOf(e.kind)]! : e.code === "house" || e.code === "built" || e.code === "bought" ? "built" : e.code === "fire" ? (e.guarded ? "relief" : "woe") : e.code === "flood" ? "woe" : e.code === "raid" ? (e.caught ? "relief" : "woe") : "fanfare");
  }, [festNow]);
  const festArt = (e: ChronEvent) => e.code === "fire" ? ART["fire"] : e.code === "flood" ? ART["flood"] : e.code === "raid" ? ART["robber"] : e.code === "wedding" ? ART["wedding"] : e.code === "house" ? ART["topping"] : e.code === "family" ? ART["newcomers"] : e.code === "road" ? ART["roadopen"] : e.code === "twin" || (e.code === "bought" && /^title[1-3]$/.test(e.item)) ? ART["charter"] : ART["fair"];
  const festText = (e: ChronEvent): [string, string] => {
    const n = festSeed?.name ?? "";
    if (e.code === "fire") return e.guarded ? [t.woe.fireGuarded[0], t.woe.fireGuarded[1](n)] : [t.woe.fire[0], t.woe.fire[1](n, e.water, e.dead) + (e.order ? ` ${t.woe.fireOrder}` : "")];
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
    if (e.code !== "built" && e.code !== "bought") return [e.code === "moved" ? (e.away ? t.chron.farewell : t.fest.newcomers[0]) : t.chron.title, chronLine(e)];
    const name = e.code === "built" ? (t.kind[e.kind] ?? e.kind) : itemName(e.item);
    // only promise a gathering while the inauguration is actually running
    const live = (e.code === "built" || e.code === "bought") && clock() - e.at < FETE_SECS * 1000;
    return [t.fest.built[0], !live ? t.fest.builtPast(name) : t.fest.built[1](name)];
  };
  function openChron() {
    if (!my) return;
    const now = clock();
    setChron((c) => c ?? { ...chronicle(my, seeds, now - 7 * 864e5, now), manual: true });
    setScribe((x) => (x === undefined ? null : x));
    setChronBanner(false); setChronOpen(true);
    localStorage.setItem(`samenland-chron-read-${my.id}`, String(now)); setChronRead(now);
  }
  // heavy derivations refresh every 5 s of world time, not on every pointer move
  const slow = Math.floor(now / 5000) * 5000;
  // Dörfer-Liste: Rang + Bonus je Dorf teuer (townRank) – im Leerlauf häppchenweise berechnen und 5 min cachen
  const townsTick = Math.floor(now / 300000);
  useEffect(() => { if (my) setChronRead(Number(localStorage.getItem(`samenland-chron-read-${my.id}`) ?? clock())); }, [my?.id]);
  // a chronicle belongs to one village: drop the cached one when the own village changes (abandon + refound in the same tab)
  const chronOf = useRef<string | null>(null);
  useEffect(() => {
    const prev = chronOf.current; chronOf.current = my?.id ?? null;
    if (prev && prev !== my?.id) { setChron(null); setChronOpen(false); setChronBanner(false); setScribe(undefined); }
  }, [my?.id]);
  const chronNews = useMemo(() => {
    if (!owner || !my || chronRead == null || seeds.length === 0) return false;
    const c = chronicle(my, seeds, chronRead, slow);
    return c.events.some((e) => e.code !== "season");
  }, [owner, my?.id, chronRead, seeds, slow]);
  const townsCache = useRef(new Map<string, { k: string; rank: number; parts: ReturnType<typeof speedParts>; citizens: number; homes: number; wares: Ware[] }>());
  const [, setTownsVer] = useState(0);
  // content fingerprint of every input (decisions, blessings, purchases, roads, twins, gifts) — never mere row counts
  const townsData = seedsKey(seeds);
  const townsKey = (s: Seed) => `${s.id}|${townsTick}|${townsData}`;
  useEffect(() => {
    if (tab !== "towns") return;
    let dead = false, timer = 0;
    const step = () => {
      if (dead) return;
      const t0 = performance.now();
      let did = false;
      for (const s of seeds) {
        const c = townsCache.current.get(s.id);
        if (c && c.k === townsKey(s)) continue;
        const t = clock();
        const cz = citizensOf(townOf(s, seeds, t)), wares = larderOf(s, seeds, t).flows.filter((f) => f.made > 0.05).sort((a, b) => b.made - a.made).slice(0, 3).map((f) => f.ware);
        townsCache.current.set(s.id, { k: townsKey(s), rank: townRank(s, seeds, Math.floor(t / 5000) * 5000), parts: speedParts(s, seeds, t), citizens: cz.length, homes: new Set(cz.map((p) => p.hh ?? `${p.home[0]},${p.home[1]}`)).size, wares });
        did = true;
        if (performance.now() - t0 > 30) break;
      }
      if (did) { setTownsVer((v) => v + 1); timer = window.setTimeout(step, 16); }
    };
    timer = window.setTimeout(step, 30);
    return () => { dead = true; clearTimeout(timer); };
  }, [tab, seeds, townsTick]);
  const { cash, myRank, myStage, myTown, at, pop, residents, season, nbs, larder, boons, rankHint } = useMemo(() => {
    // accounting.balance (DB village_balance) is authoritative; the local value is only a forecast, using booked receipts where known
    const own = accounting?.seed === my?.id ? accounting : null;
    const cash = my ? (own?.active ? own.balance : treasury(my, purchases, slow, gifts, claims, undefined, seeds, own?.receipts)) : 0;
    const myRank = my ? townRank(my, seeds, slow) : 0;
    // shop/monuments: the earned rank alone — the server re-counts it before every rank-gated purchase
    const myStage = myRank;
    rankRef.current = myRank;
    const myTown = my ? townOf(my, seeds, slow) : null;
    const larder = my ? larderOf(my, seeds, slow) : null;
    const boons = larder ? boonsOf(larder) : null;
    const at = my ? attributes(my, seeds, purchases, slow, myTown!.weddings.filter((w) => w.alliance).length, boons ?? undefined) : null;
    const pop = my ? (accounting?.seed === my.id && accounting.active ? accounting.daily : dailyTax(my, ageHours(my, slow), seeds)) : 0;
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
    const cheapest = Math.min(...(Object.keys(ITEMS) as Item[]).filter((it) => canBuy(it, myCharter) && canBuyWay(it, my ? wayOf(my) : undefined) && !at.has(it) && (ITEM_RANK[it] ?? 0) <= myStage).map((it) => ITEMS[it]));
    if (cash >= cheapest) return null;
    const ends = [...specialSites(my).values()].map((s) => specialDone(my, seeds, s.at)).filter((e) => e > slow);
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
  // the fold choice sticks until the player opens it again; phones start folded
  useEffect(() => { let v: string | null = null; try { v = localStorage.getItem("questFold"); } catch { /* storage off */ } setQuestFold(v != null ? v === "1" : coarse && window.innerWidth < 768); }, [coarse]);
  const foldQuest = (f: boolean) => { setQuestFold(f); try { localStorage.setItem("questFold", f ? "1" : "0"); } catch { /* storage off */ } };
  const [questTrack, setQuestTrack] = useState<number | null>(null);
  const heads = my ? questHeads(claims, my.id, {
    blessings: blessings.filter((b) => b.seed_id === my.id).length,
    purchases: purchases.filter((p) => p.seed_id === my.id).length,
    signposts: signs.filter((s) => s.seed_id === my.id).length,
    encounters: encounters.filter((e) => e.seed_id === my.id).length,
    giftsSent: gifts.filter((g) => g.from_seed === my.id).length,
    residents, stage: myRank,
    // a road counts for both towns, whoever decided it first
    roads: new Set(firstRoads.filter((f) => f.seed_id === my.id || f.target_id === my.id).map((f) => (f.seed_id === my.id ? f.target_id : f.seed_id))).size,
    reach: seeds.filter((o) => o.id !== my.id && (o.realm ?? "europe") === (my.realm ?? "europe") && Math.hypot(o.x - my.x, o.y - my.y) <= TRADE_DIST).length,
    waySmall: purchases.some((p) => p.seed_id === my.id && WAY_SMALL.includes(p.item)),
    wayBig: purchases.some((p) => p.seed_id === my.id && WAY_BIG.includes(p.item)),
  }) : [];
  // the chosen track tab, else a ready one, else the earliest open quest
  const quest = heads.find((h) => h.track === questTrack) ?? [...heads].sort((a, b) => a.index - b.index).find((h) => h.ready) ?? [...heads].sort((a, b) => a.index - b.index)[0] ?? null;
  const questText = quest && my ? (t.quests.list[questKey(quest.quest, wayOf(my))] ?? t.quests.list[quest.quest]!).map((x) => addr(x)) as typeof t.quests.list[string] : null;
  const petition = quest && my ? petitionOf(quest.quest, lang, questKey(quest.quest, wayOf(my)) !== quest.quest, myTown?.people, addr) : null;
  // only quests with a menu that actually helps get a "show me how" button; others would just repeat the card text
  const QUEST_TAB: Partial<Record<Quest, Tab>> = { bless: "rituals", bless7: "rituals", build: "build", buy3: "build", buy6: "build", metro: "build", sign: "signs", gift: "towns", gifts5: "towns", road: "build", roads2: "build" };
  const questTab = quest ? QUEST_TAB[quest.quest] : undefined;
  const questHow = () => { if (questTab) setTab(questTab); };
  const claimQuest = async () => {
    if (!my || !userId || !quest?.ready) return;
    setQuestOpen(false); jingle("fanfare");
    // rank and resident milestones are checked by the server against a fresh rank certificate
    if (["ten", "fifty", "hundred", "hamlet", "village", "town", "merchant", "metro"].includes(quest.quest)) {
      try { await certifyFn({ data: { seed: my.id } }); } catch { return setMsg(t.quests.fail); }
    }
    const { data, error } = await supabase.from("quest_claims").insert({ seed_id: my.id, user_id: userId, quest: quest.quest }).select("id, seed_id, quest, reward, created_at").single();
    if (error || !data) return setMsg(t.quests.fail);
    setClaims((c) => [...c, data]);
    // show the reward in the chest at once; the next treasury refresh reconciles with the server
    setAccounting((a) => (a && a.seed === my.id && a.active ? { ...a, balance: a.balance + data.reward } : a));
    jingle("coins"); setMsg(t.quests.got(data.reward));
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
    if (kind === "bell") bell(); else tap();
    const { data, error } = await supabase.from("blessings").insert({ seed_id: my.id, user_id: userId!, kind }).select("id, seed_id, created_at").single();
    if (error || !data) return setMsg(t.blessFail);
    setBlessings((s) => [...s, data]);
    setMsg(t.blessed(my.name));
  };
  const sendGift = async (to: Seed, kind: GiftKind, note = 0) => {
    if (!my || !userId) return;
    tap();
    if (!await prepareSpend()) return;
    const { data, error } = await supabase.from("gifts").insert({ from_seed: my.id, to_seed: to.id, user_id: userId, kind, note }).select("id, from_seed, to_seed, kind, amount, note, created_at").single();
    if (error || !data) return setMsg(t.gifts.fail);
    setGifts((q) => (q.some((x) => x.id === data.id) ? q : [...q, data as Gift]));
    setMsg(kind === "thanks" ? t.gifts.thanked(to.name) : t.gifts.sent(to.name));
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
      const err = treeGuard(canPlaceSpecial, plantings)(item, x, y, my, seeds, clock());
      if (err) return setMsg(t.place[err as "far" | "ground" | "taken" | "shore"]);
    }
    // instant feedback: sound, close placement and show the site right away; the server confirms or we roll back
    tap(); setPlacing(null);
    const price = (ITEMS as Record<string, number>)[item];
    const tmpId = `pending-${item}-${Date.now()}`;
    if (price != null && x != null && y != null) {
      setPurchases((s) => [...s, { id: tmpId, seed_id: my.id, item, cost: price, created_at: new Date(clock()).toISOString(), x, y } as (typeof s)[number]]);
    }
    const rollback = (m: string) => { setPurchases((s) => s.filter((p) => p.id !== tmpId)); setMsg(m); };
    if (!await prepareSpend()) return rollback(t.buyFail);
    // rank-gated items: the server counts citizens, homes and roads itself before the guard accepts the row
    const needRank = needRankOf(item);
    if (needRank > 0) { try { await certifyFn({ data: { seed: my.id } }); } catch { return rollback(t.buyFail); } }
    const { data, error } = await supabase.from("purchases").insert({ seed_id: my.id, user_id: userId!, item, x: x ?? null, y: y ?? null }).select("id, seed_id, item, cost, created_at, x, y").single();
    if (error || !data) {
      const m = error?.message ?? "";
      if (isAusbau(item)) {
        const at = AUSBAU[lang];
        if (m.includes("step already paid")) return rollback(at.bought);
        if (m.includes("previous step open")) return rollback(item.endsWith("2") ? at.needBase : at.needPrevious);
        if (m.includes("rank too low")) return rollback(t.needStage(t.stages[AUSBAU_RANK[item]!] ?? ""));
      }
      return rollback(m.includes("not enough money") ? t.poor : t.buyFail);
    }
    setPurchases((s) => [...s.filter((x) => x.id !== data.id && x.id !== tmpId), data]);
    const fresh = isAusbau(item) ? await refreshAccounting() : null;
    if (isFreimarkt(item)) { jingle("fanfare"); setMsg(FREIMARKT[lang].paidMsg); } else if (isAusbau(item)) {
      const at = AUSBAU[lang], base = AUSBAU_BASES.find((b) => AUSBAU_STEPS[b].includes(item)) ?? "backhaus";
      const balance = fresh?.seed === my.id ? fresh.balance : Math.max(0, cash - data.cost);
      jingle("coins"); setMsg(at.paidMsg(at.names[base], at.steps[item]![0], at.steps[item]![1], t.taler(data.cost), t.taler(balance)));
    } else if (vorhabenOf(item)) { jingle("coins"); setMsg(VORHABEN_T[lang].paid(VORHABEN_T[lang].items[vorhabenOf(item)!].title)); } else if (isFountain(item)) { jingle("fanfare"); setMsg(FOUNTAIN[lang].paidMsg(FOUNTAIN[lang].steps[FOUNTAIN_STEPS.indexOf(item)]!)); } else if (/^chest[2-4]$/.test(item)) { jingle("coins"); setMsg(`${CHEST[lang].title}: ${CHEST[lang].levels[+item.slice(5) - 1]}`); } else if (/^title[1-3]$/.test(item)) { jingle("stage"); bell(0); setMsg(t.office.fest); } else if (item === "rank2" || item === "rank3") { jingle("fanfare"); bell(0); setMsg(t.rank.sealed(t.rank.ranks[item === "rank2" ? 1 : 2]!)); } else { const mk = monumentOf(item); jingle(mk ? "fanfare" : "coins"); setMsg(mk ? `${t.monuments[mk]!.title} · ${t.monument.step(+item.slice(mk.length), monumentSteps(mk).length)}` : t.bought(t.items[item]![0])); }
  };
  /** Zimmerleute-Nothilfe: the server recomputes the ruin and books it; nothing is trusted from the client. */
  const aidBusy = useRef(false);
  const callAid = async (kind: "f" | "w", at: number) => {
    if (!my || aidBusy.current) return;
    aidBusy.current = true; tap();
    try {
      const nt = NOTHILFE[lang];
      if (!await prepareSpend()) return setMsg(t.buyFail);
      const r = await nothilfeFn({ data: { seed: my.id, kind, at } }).catch(() => null);
      if (!r) return setMsg(t.buyFail);
      if (!r.ok) return setMsg(r.code === "poor" ? t.poor : r.code === "already" ? nt.already : r.code === "noRuin" ? nt.noRuin : r.code === "rank" ? t.needStage(t.stages[NOTHILFE_RANK] ?? "") : t.buyFail);
      setPurchases((s) => [...s.filter((x) => x.id !== r.row.id), r.row]);
      const fresh = await refreshAccounting();
      const balance = fresh?.seed === my.id ? fresh.balance : Math.max(0, cash - r.row.cost);
      jingle("coins"); setMsg(nt.ok(r.row.cost, Math.max(1, Math.ceil(r.left / 3.6e6)), t.taler(balance)));
    } finally { aidBusy.current = false; }
  };
  /** Umsetzen: pay the carters, then the building is rebuilt on the chosen spot (the old one is cleared at once). */
  const relocate = async (item: string, x: number, y: number) => {
    if (!my) return;
    const err = treeGuard(canMoveTo, plantings)(item, x, y, my, seeds, clock());
    if (err) return setMsg(t.place[err as "far" | "ground" | "taken" | "shore"]);
    const block = moveBlock(my, item, clock());
    if (block) return setMsg(RELOCATE[lang][block]);
    tap(); setPlacing(null);
    const tmpId = `pending-move-${item}-${Date.now()}`;
    setMoves((s) => [...s, { id: tmpId, seed_id: my.id, item, x, y, cost: moveCost(item) ?? 0, created_at: new Date(clock()).toISOString() }]);
    const rollback = (m: string) => { setMoves((s) => s.filter((p) => p.id !== tmpId)); setMsg(m); };
    if (!await prepareSpend()) return rollback(t.buyFail);
    const { data, error } = await supabase.from("building_moves").insert({ seed_id: my.id, user_id: userId!, item, x, y }).select("id, seed_id, item, x, y, cost, created_at").single();
    if (error || !data) {
      const m = error?.message ?? "";
      return rollback(m.includes("not enough money") ? t.poor : m.includes("move cooldown") ? RELOCATE[lang].cooldown : m.includes("move busy") ? RELOCATE[lang].busy : t.buyFail);
    }
    setMoves((s) => [...s.filter((p) => p.id !== data.id && p.id !== tmpId), data as MoveRow]);
    void refreshTreasury();
    jingle("coins"); setMsg(RELOCATE[lang].done(t.items[item]![0]));
  };
  useEffect(() => {
    if (!placing || !coarse) { setGhost(null); return; }
    const own = seeds.find((x) => x.id === mine); if (!own) return;
    const g = firstFreeSite(placing, own, seeds, clock()) ?? [own.x, own.y];
    // close enough to read the building, far enough to see its neighbours
    const z = Math.min(Math.max(target.current.zoom, 2.5), 3.5);
    target.current = { ...target.current, zoom: z }; cam.current.zoom = z;
    setGhost(g); placeFocus(g[0], g[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placing, coarse]);
  const zoomBy = (f: number) => {
    const cv = canvasRef.current!;
    target.current = { zoom: Math.min(maxZoom(st.current.walk), Math.max(MIN_ZOOM, target.current.zoom * f)), ax: cv.width / 2, ay: cv.height / 2 };
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
      if (wayNode) return wayLeave();
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
          <ul className="max-h-40 space-y-1 overflow-y-auto overflow-x-hidden">{got.map((g) => (
            <li key={g.id}><button type="button" className="w-full rounded px-1 py-0.5 text-left hover:bg-accent" onClick={() => { setRollOpen(false); setTab(null); setFest((q) => [{ at: letterArrives(g.o, my, g.at), code: "letter", id: g.id, other: g.o.name }, ...q]); }}>
              <span className="italic text-foreground">„{bodies[g.id] ?? t.post.sealed}“</span> <span className="text-muted-foreground">{t.post.from(g.o.name)}</span>
            </button></li>
          ))}</ul>)}
      </div>
    );
  })() : null;
  const drawer = tab && (
    <div className="space-y-3 p-3 pt-0 text-sm">
      <div className="sticky top-0 z-10 -mx-3 flex items-center justify-between bg-card/95 px-3 pb-2 pt-3 backdrop-blur-[1px]">
        <Head>{tabs.find((x) => x.k === tab)?.label}</Head>
        <button type="button" aria-label={t.hud.close} onClick={() => setTab(null)} className="hit relative text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      {tab === "build" && my && at && (
        <div className="space-y-2">
          <Outlook t={t} lang={lang} my={my} seeds={seeds} now={slow} rank={myRank} charter={myCharter} way={wayOf(my)} />
          {my.user_id && (() => {
            const ct = CHEST[lang], lvl = chestLevel(my.id, purchases), cap = chestCap(my.id, purchases), blk = chestBlock(my, purchases, myStage);
            const step = CHEST_STEPS[Math.min(lvl - 1, 2)]!, fill = Math.min(1, Math.max(0, cash) / cap);
            return (
              <div className="rounded-md border border-brass/60 bg-brass/10 p-2 text-xs">
                <div className="flex items-center justify-between font-semibold"><span>🧰 {ct.title} · {ct.levels[lvl - 1]}</span><span>{Math.max(0, cash)} / {cap}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className={`h-full ${fill >= 1 ? "bg-destructive" : "bg-brass"}`} style={{ width: `${fill * 100}%` }} /></div>
                <div className="mt-1 text-muted-foreground">{fill >= 1 ? ct.full : ct.intro}</div>
                {blk === "max" ? <div className="mt-1 font-semibold text-primary">{ct.max}</div>
                  : blk ? <div className="mt-1 text-muted-foreground">{ct.levels[lvl]}: {ct.need(t.stages[[2, 3, 4][lvl - 1] ?? 4] ?? "")}</div>
                  : <>
                    <div className="mt-1.5 flex items-baseline justify-between gap-2"><span className="font-semibold">{ct.levels[lvl]}</span><span className="shrink-0 text-muted-foreground">{t.taler(CHEST_CAP[step])}</span></div>
                    <Button size="sm" className="mt-1 h-7 w-full" disabled={cash < CHEST_PRICE[step]} onClick={() => void buy(step)}>{ct.expand} · {t.taler(CHEST_PRICE[step])}</Button>
                  </>}
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
                const roads = roadsFor(my, seeds, now);
                const blk = rankBlock(my, purchases, myStage, roads);
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
                const n = titleOf(my, purchases), blk = titleBlock(my, purchases, myStage), step = TITLE_STEPS[Math.min(n, 2)]!;
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
            .sort((a, b) => ((ITEM_RANK[a] ?? 0) > myStage ? 1 : 0) - ((ITEM_RANK[b] ?? 0) > myStage ? 1 : 0) || (ITEM_RANK[a] ?? 0) - (ITEM_RANK[b] ?? 0) || ITEMS[a] - ITEMS[b])
            .map((it) => {
            const lockedIt = (ITEM_RANK[it] ?? 0) > myStage;
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
                    (ITEM_RANK[it] ?? 0) > myStage ? <span className="text-xs text-muted-foreground">🔒 {t.needStage(t.stages[ITEM_RANK[it]!] ?? "")}{RANK_NEED[ITEM_RANK[it]! - 1] ? ` (${RANK_NEED[ITEM_RANK[it]! - 1]![0]} ${OUTLOOK[lang].cit}, ${RANK_NEED[ITEM_RANK[it]! - 1]![1]} ${OUTLOOK[lang].homes}${RANK_NEED[ITEM_RANK[it]! - 1]![2] ? `, ${RANK_NEED[ITEM_RANK[it]! - 1]![2]} ${OUTLOOK[lang].roads}` : ""})` : ""}</span> :
                    <Button size="sm" className="h-7 w-full" disabled={cash < ITEMS[it]} onClick={() => { if (!SPECIAL_KIND[it]) { void buy(it); return; } setPlacing(it); setTab(null); setMsg(t.place.pick(t.items[it]![0])); if (my) focus(my.x, my.y); }}>{t.hud.build}</Button>
                  )}
                </div>
              </div>
            );
          })}
          {my && (() => {
            const at = AUSBAU[lang], paid = purchases.filter((p) => p.seed_id === my.id).map((p) => p.item);
            return (
              <div key="ausbau" className="rounded-md border border-brass/60 bg-brass/10 p-2">
                <div className="font-semibold">🔨 {at.title}</div>
                <div className="text-xs text-muted-foreground">{at.intro}</div>
                <div className="mt-2 space-y-2">
                  {AUSBAU_BASES.map((b) => AUSBAU_STEPS[b].map((k, i) => {
                    const status = ausbauStatus(b, k, paid, myStage, cash), price = AUSBAU_PRICE[k]!;
                    return (
                      <div key={k} data-ausbau-step={k} className="rounded border border-brass/35 bg-card/45 p-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="flex-1 font-semibold">{at.names[b]} · {at.stage(i + 2)}</span>
                          <span className="shrink-0 text-muted-foreground">{t.taler(price)}</span>
                        </div>
                        <div className="mt-0.5 font-semibold">{at.steps[k]![0]}</div>
                        <div className="mt-0.5">{at.steps[k]![1]}</div>
                        <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{at.baseReq(at.names[b])}<br />{t.needStage(t.stages[AUSBAU_RANK[k]!] ?? "")}</div>
                        <div className="mt-1.5">
                          {status === "bought" ? <span className="font-semibold text-primary">✓ {at.bought}</span>
                            : status === "needBase" ? <span className="text-muted-foreground">🔒 {at.needBase}</span>
                            : status === "needPrevious" ? <span className="text-muted-foreground">🔒 {at.needPrevious}</span>
                            : status === "needRank" ? <span className="text-muted-foreground">🔒 {t.needStage(t.stages[AUSBAU_RANK[k]!] ?? "")}</span>
                            : <>
                              {status === "poor" && <div className="mb-1 text-muted-foreground">{t.poor}</div>}
                              <Button size="sm" className="h-8 w-full" disabled={status === "poor"} onClick={() => void buy(k)}>{status === "available" ? `${at.available} · ` : ""}{at.pay} · {t.taler(price)}</Button>
                            </>}
                        </div>
                      </div>
                    );
                  }))}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">{at.voluntary}</div>
              </div>
            );
          })()}
          {my && (() => {
            const ft = FOUNTAIN[lang], locked = myStage < FOUNTAIN_RANK;
            const paid = purchases.filter((p) => p.seed_id === my.id && isFountain(p.item)).map((p) => p.item);
            const next = nextFountainStep(paid), chain = fountainChain(my), total = FOUNTAIN_STEPS.reduce((a, k) => a + FOUNTAIN_PRICE[k], 0);
            const paidSum = FOUNTAIN_STEPS.filter((k) => paid.includes(k)).reduce((a, k) => a + FOUNTAIN_PRICE[k], 0);
            const busy = chain.find((c) => c.done > now);
            return (
              <div key="fountain" className={`rounded-md border border-brass/60 bg-brass/10 p-2 ${locked ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2"><span className="flex-1 font-semibold">⛲ {ft.title}</span>{next && !locked && <span className="text-xs text-muted-foreground">{t.taler(FOUNTAIN_PRICE[next])}</span>}</div>
                <div className="text-xs text-muted-foreground">{ft.intro}</div>
                <div className="mt-1 text-xs">{ft.benefit}</div>
                {locked ? <div className="mt-1 text-xs text-muted-foreground">🔒 {t.needStage(t.stages[FOUNTAIN_RANK] ?? "")}</div> : <>
                  <ol className="mt-1 space-y-0.5 text-xs">
                    {FOUNTAIN_STEPS.map((k, i) => { const c = chain[i]; const st = !c ? "" : c.done <= now ? ` · ✓ ${ft.ready}` : now >= c.start ? ` · ${ft.building(Math.ceil((c.done - now) / 864e5))}` : "";
                      return <li key={k} className={c ? "text-primary" : k === next ? "font-semibold" : "opacity-60"}>{c ? "✓" : `${i + 1}.`} {ft.steps[i]} · {t.taler(FOUNTAIN_PRICE[k])} · {ft.days(FOUNTAIN_DAYS[k])}{st}</li>; })}
                  </ol>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-ink/15"><div className="h-full bg-brass" style={{ width: `${(100 * paidSum) / total}%` }} /></div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{ft.funded(paidSum, total)} · {ft.rest(total - paidSum)}</div>
                  <div className="mt-1.5">
                    {!next ? <span className="text-xs font-semibold text-primary">{busy ? ft.building(Math.ceil((chain.at(-1)!.done - now) / 864e5)) : ft.done}</span>
                      : <Button size="sm" className="h-7 w-full" disabled={cash < FOUNTAIN_PRICE[next]} onClick={() => void buy(next)}>{ft.pay(ft.steps[FOUNTAIN_STEPS.indexOf(next)]!)} · {t.taler(FOUNTAIN_PRICE[next])}</Button>}
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{ft.voluntary}</div>
                  </div>
                </>}
              </div>
            );
          })()}
          {my && MONUMENT_KEYS.filter((k) => myStage < MONUMENTS[k].rank && (!MONUMENTS[k].way || MONUMENTS[k].way === wayOf(my))).sort((a, b) => MONUMENTS[a].rank - MONUMENTS[b].rank).map((key) => (
            <div key={`lock-${key}`} className="rounded-md border border-brass/40 bg-brass/5 p-2 opacity-60">
              <div className="flex items-center gap-2">
                {spriteUrl(MONUMENT_DEFS[key].kind) && <img src={spriteUrl(MONUMENT_DEFS[key].kind)} alt="" loading="lazy" className="h-12 w-10 shrink-0 object-contain grayscale" />}
                <span className="flex-1 font-semibold">{t.monuments[key]!.title}</span>
              </div>
              <div className="text-xs text-muted-foreground">{t.items[`${key}1`]![1]}</div>
              <div className="mt-1 text-xs text-muted-foreground">🔒 {t.needStage(t.stages[MONUMENTS[key].rank] ?? "")}</div>
            </div>
          ))}
          {my && MONUMENT_KEYS.filter((k) => myStage >= MONUMENTS[k].rank && (!MONUMENTS[k].way || MONUMENTS[k].way === wayOf(my))).map((key) => {
            const steps = monumentSteps(key), mt = t.monuments[key]!;
            const paid = purchases.filter((p) => p.seed_id === my.id && steps.includes(p.item));
            const next = nextMonumentStep(paid.map((p) => p.item), key);
            const prog = monumentProgress(my, now, key), n = steps.length, i = paid.length;
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
            {live && (() => { const pct = Math.round(speedParts(my, seeds, now).bless * 100); return (
              <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/10 p-3">
                <Sprout aria-hidden className="h-8 w-8 shrink-0 text-primary" />
                <div className="text-xs">
                  <div className="font-display text-base text-primary">{t.festive(Math.ceil((last + BLESS_MS - now) / 3.6e6))}</div>
                  {pct > 0 && <div className="text-foreground">{t.blessBonus(pct)}</div>}
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${Math.max(0, Math.min(100, ((last + BLESS_MS - now) / BLESS_MS) * 100))}%` }} /></div>
                </div>
              </div>); })()}
            {cd > 0 ? <div className="text-xs text-muted-foreground">{t.blessAgain(Math.ceil(cd / 3.6e6))}</div> : (
              <div className="grid gap-2">
                <Button size="sm" variant="secondary" onClick={() => ring("bell")}>{t.ringBell}</Button>
                <Button size="sm" variant="secondary" onClick={() => ring("well")}>{t.decorateWell}</Button>
              </div>
            )}
            {(() => {
              const nt = NOTHILFE[lang], locked = myStage < NOTHILFE_RANK, ruins = activeRuins(my, now);
              const paidOf = (k: "f" | "w", at: number) => purchases.some((p) => p.seed_id === my.id && p.item === nothilfeItem(k, at));
              const hrs = (ms: number) => Math.max(1, Math.ceil(ms / 3.6e6));
              return (
                <div key="nothilfe" data-testid="nothilfe-card" className={`rounded-md border border-border bg-card/60 p-2 ${locked ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2"><span className="flex-1 font-semibold">🪚 {nt.title}</span><span className="text-xs text-muted-foreground">{t.taler(NOTHILFE_PRICE)}</span></div>
                  <div className="text-xs text-muted-foreground">{nt.intro}</div>
                  {locked ? <div className="mt-1.5 text-xs text-muted-foreground">🔒 {t.needStage(t.stages[NOTHILFE_RANK] ?? "")}</div>
                    : ruins.length === 0 ? <div className="mt-1.5 text-xs text-muted-foreground">{nt.none}</div>
                    : <div className="mt-1.5 grid gap-1.5">{ruins.map((r) => { const done = paidOf(r.kind, r.at); return (
                      <div key={`${r.kind}${Math.floor(r.at)}`} className="rounded border border-border p-1.5 text-xs">
                        <div className="font-semibold">{r.kind === "f" ? "🔥 " + nt.fire : "🌊 " + nt.flood}</div>
                        <div>{nt.left(hrs(r.left))}</div>
                        {done ? <div className="font-semibold text-primary">{nt.paid}</div> : <>
                          <div className="text-muted-foreground">{nt.effect(hrs(r.left / 2))}</div>
                          <Button size="sm" className="mt-1 h-7 w-full" disabled={cash < NOTHILFE_PRICE} onClick={() => void callAid(r.kind, Math.floor(r.at))}>{nt.call} · {t.taler(NOTHILFE_PRICE)}</Button>
                        </>}
                      </div>); })}</div>}
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{nt.voluntary}</div>
                </div>
              );
            })()}
            {(() => {
              const fm = FREIMARKT[lang], locked = myStage < FREIMARKT_RANK;
              const mine = purchases.filter((p) => p.seed_id === my.id && isFreimarkt(p.item));
              const rows = { bought: mine.map((p) => ({ item: p.item, at: Date.parse(p.created_at) })) };
              const last = rows.bought.reduce((m, b) => Math.max(m, b.at), -Infinity);
              const ready = freimarktReady(rows), openLeft = last + FREIMARKT_LEN - now;
              return (
                <div key="freimarkt" className={`rounded-md border border-brass/60 bg-brass/10 p-2 ${locked ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2"><span className="flex-1 font-semibold">🎪 {fm.title}</span><span className="text-xs text-muted-foreground">{t.taler(FREIMARKT_PRICE)}</span></div>
                  <div className="text-xs text-muted-foreground">{fm.intro}</div>
                  <div className="mt-1 text-xs">{fm.benefit}</div>
                  <div className="mt-1.5">
                    {locked ? <span className="text-xs text-muted-foreground">🔒 {t.needStage(t.stages[FREIMARKT_RANK] ?? "")}</span>
                      : openLeft > 0 ? <span className="text-xs font-semibold text-primary">{fm.open(Math.ceil(openLeft / 3.6e6))}</span>
                      : now < ready ? <span className="text-xs text-muted-foreground">{fm.wait(Math.ceil((ready - now) / 864e5))}</span>
                      : <Button size="sm" className="h-7 w-full" disabled={cash < FREIMARKT_PRICE} onClick={() => void buy(nextFreimarkt(mine.map((p) => p.item)))}>{fm.call} · {t.taler(FREIMARKT_PRICE)}</Button>}
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{fm.voluntary}</div>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const vt = VORHABEN_T[lang], dayTax = lastDayTax(accounting?.seed === my.id ? accounting.receipts : undefined);
              const rowsOf = (k: string) => purchases.filter((p) => p.seed_id === my.id && vorhabenOf(p.item) === k);
              const mineAll = { bought: purchases.filter((p) => p.seed_id === my.id && vorhabenOf(p.item)).map((p) => ({ item: p.item, at: Date.parse(p.created_at) })) };
              return (
                <div key="vorhaben" className="grid gap-2">
                  <div className="text-xs font-semibold text-muted-foreground">{vt.head}</div>
                  {VORHABEN_KEYS.map((k) => {
                    const it = vt.items[k], def = VORHABEN[k], locked = myStage < def.rank, price = vorhabenPrice(k, myStage, dayTax);
                    const rows = rowsOf(k), last = rows.reduce((m, p) => Math.max(m, Date.parse(p.created_at)), -Infinity);
                    const ready = vorhabenReady(mineAll, k), openLeft = last + def.len - now;
                    return (
                      <div key={k} className={`rounded-md border border-border bg-card/60 p-2 ${locked ? "opacity-60" : ""}`}>
                        <div className="flex items-center gap-2"><span className="flex-1 font-semibold">{it.title}</span>{!locked && <span className="text-xs text-muted-foreground">{t.taler(price)}</span>}</div>
                        <div className="text-xs text-muted-foreground">{it.intro}</div>
                        <div className="mt-1 text-xs">{it.benefit}</div>
                        {k === "bauhuette" && !locked && bauhuetteCareHint(effAge(my, seeds, now), careSoftCap(my, now)) && (
                          <div className="mt-1 rounded border border-border bg-muted/40 p-1.5 text-[11px]">{vt.careHint}</div>
                        )}
                        <div className="mt-1.5">
                          {locked ? <span className="text-xs text-muted-foreground">🔒 {t.needStage(t.stages[def.rank] ?? "")}</span>
                            : openLeft > 0 ? <span className="text-xs font-semibold text-primary">{vt.open(Math.ceil(openLeft / 3.6e6))}</span>
                            : now < ready ? <span className="text-xs text-muted-foreground">{vt.wait(Math.ceil((ready - now) / 864e5))}</span>
                            : <Button size="sm" className="h-7 w-full" disabled={cash < price} onClick={() => void buy(nextVorhaben(k, rows.map((p) => p.item)))}>{it.call} · {t.taler(price)}</Button>}
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-[10px] text-muted-foreground">{vt.voluntary}</div>
                </div>
              );
            })()}
          </div>
        );
      })()}
      {tab === "signs" && my && (() => {
        const mine = (o: Seed) => signs.find((x) => x.seed_id === my.id && x.target_id === o.id);
        const placed = nbs.filter((o) => mine(o)), open = nbs.filter((o) => !mine(o));
        const form = (o: Seed) => (
          <form className="flex flex-col gap-1.5 sm:flex-row" onSubmit={(e) => { e.preventDefault(); saveSign(o); setSignEdit(null); }}>
            <Input className="h-9 min-w-0 flex-1 text-sm sm:h-8 sm:text-xs" maxLength={80} placeholder={t.signPlaceholder} value={signDraft[o.id] ?? mine(o)?.message ?? ""} onChange={(e) => setSignDraft({ ...signDraft, [o.id]: e.target.value })} />
            <Button type="submit" size="sm" variant="secondary" className="shrink-0">{t.signSave}</Button>
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
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setSignEdit(signEdit === o.id ? null : o.id)}>{signEdit === o.id ? t.signUi.cancel : t.signUi.edit}</Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { glideTo(o.x, o.y, LOOK_TOWN); setTab(null); }}>{t.signUi.town}</Button>
                      {tl && <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { const cv = canvasRef.current; const [ix, iy] = iso(tl[0], tl[1]); cam.current.zoom = 6; cam.current.x = ix + 5; cam.current.y = iy + 18; target.current = { zoom: 6, ax: (cv?.width ?? 0) / 2, ay: (cv?.height ?? 0) / 2 }; signFocus.k = tl[1] * MAP + tl[0]; signFocus.until = Date.now() + 10000; setMsg(`${t.signTo(o.name)}: „${mine(o)!.message}“`); setTab(null); }}>{t.signUi.look}</Button>}
                    </div>
                  </div>
                ); })}
              </div>
            )}
            {open.length > 0 && (
              <div className="space-y-2">
                <div className="font-display text-sm">{t.signUi.open}</div>
                {open.map((o) => { const th = theirs(o); return (
                  <div key={o.id} className="space-y-1.5 rounded border border-dashed border-border p-2 text-xs">
                    <div className="font-medium text-foreground">{t.signTo(o.name)}</div>
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
          {home.realm === realm && <Button size="sm" variant="secondary" className="w-full" onClick={() => glideTo(home.x, home.y, LOOK_TOWN)}>{t.hasTown.look}</Button>}
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
      {tab === "towns" && (() => {
        const nw = clock(), lk = links(seeds), rb = my ? roadBuilding(my, nw, seeds) : null;
        const rows: RegisterRow[] = seeds.map((s) => { const tc = townsCache.current.get(s.id), mine = !!my && s.id === my.id;
          const road = !!my && !mine && lk.some((l) => nw >= l.since && ((l.a.id === my.id && l.b.id === s.id) || (l.b.id === my.id && l.a.id === s.id)));
          return { seed: s, ready: !!tc, rank: tc ? t.stages[tc.rank] ?? "" : "", way: TOWN_CHARACTER[lang].names[wayOf(s)], wayKey: wayOf(s), citizens: tc?.citizens ?? 0, homes: tc?.homes ?? 0, wares: tc?.wares ?? [],
            link: road ? "road" : rb?.target === s.id ? "building" : null, rideMin: my && !mine ? Math.round(rideTime(my, s) / 60000) : null, dist: my ? Math.hypot(my.x - s.x, my.y - s.y) : null, mine };
        });
        return <IslandRegister lang={lang} island={ISLAND[realm] ?? ISLAND.europe} rows={rows} wayNames={TOWN_CHARACTER[lang].names as Record<string, string>}
          onGo={(s) => { setTab(null); glideTo(s.x, s.y, LOOK_TOWN); }}
          details={(s) => { const tc = townsCache.current.get(s.id); if (!tc) return <span className="text-xs text-muted-foreground">…</span>; const rk = tc.rank; return (<>
              <button className="w-full rounded px-2 py-1 text-left hover:bg-accent" onClick={() => { setProfile(s); setTab(null); }}>
                <span className="text-foreground">{s.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {TOWN_CHARACTER[lang].names[wayOf(s)]} · {t.stages[rk]} · {(() => { const f = s.mayor_gender === "w" ? true : s.mayor_gender === "m" ? false : hash(s.x, s.y, 880) < 0.5; return <>{s.mayor_gender === "d" || rk >= 3 ? mayorWord(lang, (s.mayor_gender ?? (f ? "w" : "m")) as "m" | "w" | "d", rk) : t.roll.role["mayor"]![f ? 0 : 1]}{honour(s) && ` · ${honour(s)}`}: {s.owner}{support.get(s.id)?.has("seal") && <span title={SUPPORT[lang].seal} className="ms-1 text-primary">⚜️</span>}</>; })()} · {t.age(ageHours(s, now))}
                  {(() => { const p = tc.parts; const chips = [
                    p.bless > 0.005 && t.blessBonus(Math.round(p.bless * 100)),
                    p.trade > 0.005 && t.tradeBonus(Math.round(p.trade * 100)) + (p.raw - p.trade > 0.005 ? ` (${t.tradeCap(Math.round(p.raw * 100), Math.round(p.cap * 100))})` : ""),
                    p.toll > 0 && t.tollBonus(p.toll),
                    p.farm > 0.005 && t.farmBonus(Math.round(p.farm * 100)),
                  ].filter(Boolean) as string[]; return chips.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-1">{chips.map((c) => <span key={c} className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-px text-[11px] text-primary">{c}</span>)}</span>
                  ); })()}
                  {mentoring(s, seeds, now) && mentorOf(s, seeds, now) && <span className="block">{t.mentorBy(mentorOf(s, seeds, now)!.name)}</span>}
                  {my && s.id !== my.id && links(seeds).some((l) => now >= l.since && ((l.a.id === my.id && l.b.id === s.id) || (l.b.id === my.id && l.a.id === s.id))) && <span className="block">{marketHours(now) ? t.market.open : t.market.next(s.name)}</span>}
                </span>
              </button>
              {owner && my && s.id !== my.id && <Button size="sm" variant="secondary" className="ml-2 mb-1" onClick={() => { setPostText(""); setPostTo(s); }}>{t.post.send}</Button>}
              {owner && my && nbs.some((o) => o.id === s.id) && (() => { const used = sentToday(my.id, gifts, now), hurt = tileHits(s, now).size > 0; return (<>
                <Button size="sm" variant="secondary" className="ml-2 mb-1" disabled={used || cash < GIFT_TALER} onClick={() => sendGift(s, "gift")}>{t.gifts.give(GIFT_TALER)}</Button>
                {hurt && <Button size="sm" className="ml-2 mb-1" disabled={used || cash < AID_TALER} onClick={() => sendGift(s, "aid")}>{t.gifts.aid(AID_TALER)}</Button>}
                {(used || cash < GIFT_TALER) && <span className="mb-1 ml-2 block text-[11px] italic text-muted-foreground">{used ? t.gifts.once : t.gifts.poor}</span>}
              </>); })()}
</>); }} />;
      })()}
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
      else if (!encSaving.current) setEncOpen(true);
    }, instantOpen.current ? 0 : 2500);
    instantOpen.current = false;
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
      {walk && way && wayNode && (() => {
        const W = WAYSIDE_TEXT[lang], e = W.enc[way.key], n = e.nodes[wayNode as keyof typeof e.nodes] as { say: string } | undefined;
        const next = WAY_GRAPH[WAYSIDE[way.key].tree][wayNode] ?? [];
        return (
          <div data-walk role="dialog" aria-label={e.title} className="parchment absolute inset-x-0 top-[10%] z-50 mx-auto max-h-[80dvh] w-[min(28rem,92vw)] overflow-y-auto overflow-x-hidden rounded-md px-5 py-4 text-ink shadow-[var(--shadow-panel)] animate-in fade-in zoom-in-95">
            <img src={WAY_VIGNETTE[vignetteOf(way.key)]} alt="" width={768} height={480} className="parchment-art -mx-5 -mt-4 mb-1 block aspect-[16/10] w-[calc(100%+2.5rem)] max-w-none object-cover object-[50%_15%]" />
            <div className="text-center font-display text-2xl leading-none">{e.title}</div>
            <div className="mx-auto my-2 h-px w-2/3 bg-ink/30" />
            <p className="text-sm italic leading-relaxed">{n?.say}</p>
            <div className="mt-3 flex flex-col gap-2">
              {next.map((k) => { const o = e.nodes[k as keyof typeof e.nodes] as { ask?: string }; return <Button key={k} type="button" size="sm" variant="outline" className="h-auto whitespace-normal py-2 text-start" onClick={() => setWayNode(k)}>{o.ask}</Button>; })}
              <button type="button" onClick={wayLeave} className="hit relative mt-1 self-center font-display text-lg text-ink/70 underline decoration-ink/30 underline-offset-4 hover:text-ink">{W.ui.leave}</button>
            </div>
          </div>
        );
      })()}
      {walk && audience && (
        <div data-walk role="dialog" aria-label={COURT[lang].ask} className="absolute inset-x-0 top-[12%] z-50 mx-auto w-[min(26rem,90vw)] rounded-md border-2 border-wood bg-card px-5 py-4 text-foreground shadow-[var(--shadow-panel)] animate-in fade-in zoom-in-95">
          <div className="text-center font-display text-lg font-bold">{COURT[lang][audience]}</div>
          <p className="mt-2 text-sm italic leading-relaxed">{audience === "prince" ? addr(COURT[lang].princeSays([honour(my), my?.owner ?? ""].filter(Boolean).join(" "))) : audience === "herald" ? addr(COURT[lang].heraldSays([honour(my), my?.owner ?? ""].filter(Boolean).join(" "))) : COURT[lang].closedSays}</p>
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
          {coarse ? <WalkStick out={stick} label={t.hud.walk} /> : <span className="rounded border border-wood/40 bg-card/95 px-2 py-0.5 text-[11px] text-foreground shadow-[var(--shadow-cozy)]">{t.hud.walkHint}</span>}
          <WoodButton label={t.hud.walkExit} onClick={() => { stick.current = { dx: 0, dy: 0 }; setWalk(false); }} className="pointer-events-auto h-11 gap-1.5 px-4">
            <X className="h-4 w-4" /><span className="text-xs">{t.hud.walkExit}</span>
          </WoodButton>
          {camLoose && <WoodButton label={t.hud.walkFollow} onClick={() => { fling.current = { vx: 0, vy: 0, t: performance.now() }; camFree.current = false; }} className="pointer-events-auto h-9 gap-1.5 px-3"><Crown className="h-4 w-4" /><span className="text-xs">{t.hud.walkFollow}</span></WoodButton>}
          {mayorAway() && <WoodButton label={t.hud.walkHome} onClick={() => { stick.current = { dx: 0, dy: 0 }; clearMayorOrder(); setWalk(false); }} className="pointer-events-auto h-9 px-3"><span className="text-xs">🏠 {t.hud.walkHome}</span></WoodButton>}
        </div>
      )}
      <LoadingScreen title="Samenland" lines={t.loading} onDone={openGuide} />
      {(import.meta.env.DEV || realm === "lab") && <div ref={perfRef} className="pointer-events-none absolute left-1 top-1 z-50 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] leading-tight" />}
      <canvas
        ref={canvasRef}
        dir="ltr"
        style={{ touchAction: "none" }}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onContextMenu={(e) => e.preventDefault()}
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
              const nz = Math.min(maxZoom(st.current.walk), Math.max(MIN_ZOOM, c.zoom * (dist / p.dist)));
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
              if (e.pointerType === "mouse") showTileInfo(nt);
            }
          }
          if (mode === "seed" || placing) {
            ptrRef.current = [e.clientX, e.clientY];
            if (tipRef.current) { tipRef.current.style.left = `${e.clientX + 18}px`; tipRef.current.style.top = `${e.clientY + 18}px`; }
            if (!ptr) setPtr(ptrRef.current);
          }
          const hp = mode === "look" && !placing && !drag.current?.moved ? personAt(e) : null;
          peopleFocus.hover = hp ? pkey(hp) : null;
          let hb = false;
          if (!hp && !walk && mode === "look" && !placing && !drag.current?.moved && e.pointerType === "mouse") {
            const [bx, by] = tileAt(e), bi = inspectAt(bx, by, seeds, clock());
            hb = !!bi && bi.kind !== "pasture" && bi.kind !== "field";
          }
          (e.target as HTMLElement).style.cursor = hp || hb ? "pointer" : "";
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
            showTileInfo(tileAt(e), 4000);
            const lt = lastTap.current;
            if (nowT - lt.t < 300 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
              lastTap.current = { t: 0, x: 0, y: 0 };
              setWho(null); setPlace(null); // a zooming double tap never leaves a card open from its first tap
              const r = canvasRef.current!.getBoundingClientRect();
              target.current = { zoom: Math.min(maxZoom(st.current.walk), target.current.zoom * 1.6), ax: (e.clientX - r.left) * dpr.current, ay: (e.clientY - r.top) * dpr.current };
              return;
            }
            lastTap.current = { t: nowT, x: e.clientX, y: e.clientY };
          }
          if (d && !d.moved) {
            if (placing) { const [px, py] = tileAt(e); return moving ? relocate(placing, px, py) : buy(placing, px, py); }
            if (walk) {
              // stroll mode: tapping a person or house talks to them; elsewhere the mayor walks there
              if (heraldHit(e)) { openHerald(); return; }
              if (wayTap(e)) return;
              if (talkTo(e)) return;
              const [tx, ty] = tileAt(e), my = seeds.find((x) => x.id === mine);
              if (my) { const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor"); if (me && commandMayor(me, tw, seeds, nw, [tx, ty])) tap((e.clientX / window.innerWidth) * 2 - 1); }
              return;
            }
            if (mode === "look" && lens) {
              const [lx, ly] = tileAt(e), li = inspectAt(lx, ly, seeds, clock());
              setWho(null); setPlace(null);
              const pk = li ? paintedKind(li, seeds, clock()) : null;
              if (li && pk && STUBE_KINDS.has(pk) && li.build === null) { tap((e.clientX / window.innerWidth) * 2 - 1); setStube({ ...li, kind: pk }); }
              else setMsg(STUBE[lang].onlyFarm);
              return;
            }
            if (mode === "look") {
              const best = personAt(e);
              const pan = (e.clientX / window.innerWidth) * 2 - 1;
              if (best && best.role === "mayor" && best.seed.id !== mine && best.seed.user_id && userId) { tap(pan); setWho(null); setPlace(null); setDmPeer(best.seed.user_id); setTavernOpen(true); return; }
              if (heraldHit(e)) { openHerald(); return; }
              if (best && guestTap(best)) { tap(pan); setWho(null); setPlace(null); return; }
              if (best) { hm(pan); setPlace(null); speak(best); return setWho(best); }
              if (courtAt(e)) { tap(pan); setWho(null); setPlace(null); return; }
              { const r = canvasRef.current!.getBoundingClientRect(), c = cam.current;
                const wx = (e.clientX - r.left - r.width / 2) / c.zoom + c.x, wy = (e.clientY - r.top - r.height / 2) / c.zoom + c.y;
                const tr = lastTraders.find((f) => Math.hypot(f.x - wx, f.y - 3 - wy) < Math.max(4, 16 / c.zoom));
                if (tr) { tap(pan); setWho(null); setPlace(null); if (tr.stall && tr.free) return setMsg(FREIMARKT[lang].stall(tr.to)); if (tr.stall) return setMsg(t.market.stall(tr.from, tr.good ? t.trade.goods[tr.good] ?? tr.good : "–", tr.to)); if (tr.walker) { const w = tr.walker; return setMsg(t.walker(w.kind, w.name, w.kind === "bridal" ? w.sex : t.job[w.craft]?.[w.sex === "f" ? 0 : 1] ?? w.craft, tr.from, tr.to)); } return setMsg(t.trade.trader(tr.cart, tr.good ? t.trade.goods[tr.good] ?? tr.good : "–", tr.from, tr.to)); } }
              const [tx, ty] = tileAt(e);
              { const g = twinGateAt(tx, ty, seeds, clock());
                if (g) { tap(pan); setWho(null); setPlace(null); const p = pactOf(g.a, g.b, seeds, clock());
                  return setMsg(`${t.twin.gate(g.a.name, g.b.name)}${p ? ` · ${t.twin.pacts[p.kind]![0]}` : ""}${marketDay(g, clock()) ? ` · ${t.twin.market}` : ""}`); } }
              const sm = signpostMap(seeds);
              for (const [dx, dy] of [[0, 0], [1, 1], [1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
                const sp = sm.get((ty + dy) * MAP + tx + dx);
                if (sp) { tap(pan); setWho(null); setPlace(null); return setMsg(`${t.signFrom(seeds.find((x) => x.id === sp.seed_id)?.name ?? "?")}: „${sp.message}“`); }
              }
              // the village dog barks when clicked
              for (const d of dogSpots.values()) if (Math.hypot(d.x - tx, d.y - ty) < 0.9 && !isNight()) { animalCall("dog", pan); setWho(null); setPlace(null); return; }
              // every animal standing here answers with its own call (cow moos, sheep bleat, hens cluck …)
              const beasts = tileFacts(tx, ty, seeds, clock(), isPlantedRare(st.current.plantings, tx, ty)).animals;
              // a click on a pasture means the herd, never a house whose roof rises over it
              // …unless a 2×2 ensemble's wide sprite is painted over this pasture
              { const here = structureAt(tx, ty, seeds, clock());
                if (here?.kind === "pasture" && here.build === undefined && !ensembleOver(tx, ty, seeds, clock())) { animalCall(beasts.includes("cow") ? "cow" : "sheep", pan); setWho(null); setPlace(null); return; } }
              const beast = beasts[0];
              // send your mayor to a walkable tile of your own village; when he is selected this wins over nearby roofs
              const sendMayor = () => { const my = seeds.find((x) => x.id === mine); if (!my) return false;
                const nw = clock(), tw = townOf(my, seeds, nw), me = tw.people.find((q) => q.role === "mayor");
                if (!me || tx < tw.x0 || tx > tw.x1 || ty < tw.y0 || ty > tw.y1 || !commandMayor(me, tw, seeds, nw, [tx, ty])) return false;
                tap(pan); setWho(null); setPlace(null); return true; };
              if (who?.role === "mayor" && who.seed.id === mine && sendMayor()) return;
              const ins0 = inspectAt(tx, ty, seeds, clock());
              const ins = ins0 && isPlantedRare(st.current.plantings, ins0.x, ins0.y) ? null : ins0;
              if (ins) { if (beast && !FOOT2.has(ins.kind)) animalCall(beast, pan); else tap(pan); setWho(null); knock(ins); return setPlace(ins); }
              const hadCard = !!who || !!place;
              setPlace(null); setWho(null);
              if (!hadCard && sendMayor()) return;
            }
            const [x, y] = tileAt(e);
            onClick(x, y);
          }
        }}
        onPointerLeave={(e) => { st.current.hover = null; setHover(null); if (e.pointerType === "mouse" && tileInfoRef.current) tileInfoRef.current.style.display = "none"; }}
      />
      {/* top bar */}
      <div ref={barRef} className="pointer-events-none absolute left-[var(--safe-l)] right-[var(--safe-r)] top-[max(0.5rem,env(safe-area-inset-top))] z-30 md:left-[max(0.75rem,env(safe-area-inset-left))] md:right-[max(0.75rem,env(safe-area-inset-right))] md:top-[max(0.75rem,env(safe-area-inset-top))]">
        <Panel inner="flex items-center gap-1.5 px-1.5 py-1 md:gap-5 md:px-3 md:py-1.5">
          {my && <CharacterBadge seed={my} lang={lang} />}
          <div className="min-w-0 shrink">
            <div title={my ? TOWN_CHARACTER[lang].land[wayOf(my)] : undefined} className="-my-[0.34em] truncate py-[0.34em] ps-0.5 pe-1 font-display text-lg leading-none text-wood md:pe-3 md:text-2xl">{my ? my.name : "Samenland"}{my && <span className="ms-1.5 hidden text-sm text-muted-foreground sm:inline md:text-base">{onIsland(lang, realm)}</span>}</div>
            {my && <div className="truncate ps-0.5 text-[10px] leading-tight text-muted-foreground sm:hidden">{onIsland(lang, realm)}</div>}
            <div className="hidden truncate text-xs text-muted-foreground sm:block">
              {my && myStats ? `${CHAR_ICON[wayOf(my)]} ${TOWN_CHARACTER[lang].names[wayOf(my)]}${myCharter ? ` · ${PATH_ICON[myCharter]} ${t.charter.paths[myCharter]![0]}` : ""} · ${t.stages[myRank]}${rankHint ? ` · ${rankHint}` : ""} · ${myStats.buildings} ${t.buildings}` : t.taglineShort}
            </div>
          </div>
          {my && at ? (
            <>
              <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold tabular-nums md:gap-2 md:text-sm">
                {(() => { const cap = chestCap(my.id, purchases), full = cash >= cap; return (
                <span className={`flex items-center gap-1 md:gap-1.5 ${full ? "text-destructive" : ""}`} title={`${CHEST[lang].title} · ${CHEST[lang].levels[chestLevel(my.id, purchases) - 1]}: ${Math.max(0, cash)} / ${t.taler(cap)}${full ? ` – ${CHEST[lang].full}` : ""}`}>
                  <span aria-hidden className="hidden h-4 w-4 place-items-center rounded-full border border-wood bg-[radial-gradient(circle_at_35%_30%,var(--color-coin-shine),var(--color-brass)_55%,var(--color-coin-edge))] text-wood shadow-[inset_0_-1px_0_var(--color-coin-edge)] md:grid md:h-5 md:w-5">
                    {/* stylised Lübeck mark: the double-headed eagle */}
                    <svg viewBox="0 0 20 20" className="h-[78%] w-[78%]" fill="currentColor">
                      <circle cx="6.6" cy="4.6" r="1.6" /><circle cx="13.4" cy="4.6" r="1.6" />
                      <path d="M5.2 5.6 3.4 4.4M14.8 5.6l1.8-1.2M6.6 4.6 8.8 7M13.4 4.6 11.2 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M8 6.2h4l.6 2.4 5.6-1.8-1.2 2.6 1 .4-2.2 1.6.6.6-3.2.8-.8 2.4 1.6 2.6h-1.6L10 15.8l-1.4 2H7l1.6-2.6-.8-2.4-3.2-.8.6-.6-2.2-1.6 1-.4-1.2-2.6 5.6 1.8z" />
                    </svg>
                  </span>
                  {Math.max(0, cash).toLocaleString(LOCALE[lang])}<span className="font-normal text-muted-foreground"><span className="md:hidden"> {t.talerShort}</span><span className="hidden md:inline">/</span><span className="hidden md:inline"> {t.taler(cap)}</span></span>
                </span>); })()}
                <span className="hidden text-xs font-normal text-primary sm:inline" title={(() => { const c = Date.parse(my.created_at), next = c + Math.max(1, Math.ceil((now - c) / 864e5)) * 864e5, m = Math.max(0, Math.round((next - now) / 6e4)); return t.nextTax(new Date(next).toLocaleTimeString(LOCALE[lang], { hour: "2-digit", minute: "2-digit", timeZone: REALM_TZ[realm] }), `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} h`); })()}>{t.perDay(pop)}</span>
              </div>
              <div className="hidden text-sm sm:block">{t.people(residents)}</div>
              <button type="button" title={t.goods.larder} aria-label={`${t.attrs.food} ${at.food} · ${t.attrs.health} ${at.health} · ${t.attrs.wealth} ${at.wealth}`} onClick={() => setLarderOpen(true)} className="pointer-events-auto flex shrink-0 items-end gap-1 rounded px-0.5 py-1 hover:bg-muted lg:hidden md:px-1">
                {(["food", "health", "wealth"] as const).map((k) => {
                  const Icon = k === "food" ? Wheat : k === "health" ? Heart : Coins;
                  return (
                    <span key={k} className="flex flex-col items-center gap-0.5">
                      <span className="relative h-4 w-1.5 overflow-hidden rounded bg-muted"><span className={`absolute inset-x-0 bottom-0 rounded bg-primary`} style={{ height: `${at[k]}%` }} /></span>
                      <Icon aria-hidden className="h-2.5 w-2.5 text-muted-foreground" />
                    </span>
                  );
                })}
              </button>
              <div className="hidden gap-3 lg:flex">
                {(["food", "health", "wealth"] as const).map((k) => (
                  <div key={k} className="w-24 text-xs" title={k === "food" && larder ? t.goods.food(larder.food, residents) : undefined}>
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
            <button type="button" aria-pressed={sound && music} disabled={!sound} aria-label={!sound ? MUSIC[lang].muted : music ? MUSIC[lang].off : MUSIC[lang].on} title={!sound ? MUSIC[lang].muted : music ? MUSIC[lang].off : MUSIC[lang].on} onClick={toggleMusic} className="hit relative grid h-7 w-7 place-items-center rounded-md hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent md:h-8 md:w-8">
              <Music className={`h-4 w-4 ${sound && music ? "" : "opacity-50"}`} />
              {!(sound && music) && <span aria-hidden className="pointer-events-none absolute h-[1.5px] w-5 rotate-45 rounded bg-current" />}
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
        {deskOpen && isAdmin && realm === "lab" && <LabDesk lang={lang} onChange={() => tick((n) => n + 1)} onClose={() => setDeskOpen(false)} onTrigger={labTrigger} />}
        {settings && <div className="fixed inset-0 -z-10" aria-hidden onClick={() => setSettings(false)} />}
        {settings && (
          <Panel className="absolute end-0 top-full mt-2 w-64" inner="space-y-2 p-3 text-sm">
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              {t.hud.language}
              <select value={lang} aria-label={t.hud.language} onChange={(e) => switchLang(e.target.value as Lang)}
                className="h-8 flex-1 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {LANGS.map((l) => <option key={l} value={l} lang={l}>{LANG_LABEL[l]} · {LANG_NAME[l]}</option>)}
              </select>
            </label>
            {isAdmin && (<>
              <div className="text-xs text-muted-foreground">{t.hud.realm}</div>
              <select value={realm} onChange={(e) => { const r = e.target.value as Realm; if (r === realm) return; localStorage.setItem("samenland-realm", r); loadRealmRef.current?.(r); }}
                className="h-8 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {[...REALMS, "lab" as Realm].map((r) => <option key={r} value={r}>{ISLAND[r]} · {t.realms[r]}</option>)}
              </select>
              {realm === "lab" && (<>
                <div className="text-xs text-muted-foreground">{t.lab.title(LAB_SPEED)}</div>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 24, 168, 2160, 4380, 8760].map((h, i) => (
                    <button key={h} className={`rounded px-1 py-1 text-[10px] ${labJump() === h ? "bg-accent text-foreground" : "hover:bg-accent/50"}`} onClick={() => { localStorage.setItem("samenland-lab-jump", String(h)); setLabJump(h); tick((n) => n + 1); }}>{t.stages[i]}</button>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground">{t.lab.note}</div>
                <Button size="sm" variant="secondary" className="w-full" onClick={() => { setDeskOpen(true); setSettings(false); }}>🎛 {lang === "de" ? "Steuerungspult" : "Control desk"}</Button>
              </>)}
            </>)}
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked={isAlwaysDay()} onChange={(e) => setAlwaysDay(e.target.checked)} className="accent-primary" />
              ☀ {ALWAYS_DAY[lang]}
            </label>
            {userId && home && (
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={mailOn} onChange={(e) => toggleMail(e.target.checked)} className="accent-primary" />
                ✉ {t.guide.notify.label}
              </label>
            )}
            <Button asChild size="sm" variant="secondary" className="w-full"><a href={UKRAINE_URL[lang]} target="_blank" rel="noopener noreferrer" onClick={() => setSettings(false)}>🇺🇦 {SUPPORT[lang].ukraine}</a></Button>
            <Button size="sm" variant="secondary" className="w-full" onClick={() => { setSettings(false); if (userId) setSupportOpen(true); else setAuthOpen(true); }}>🌱 {SUPPORT[lang].button}</Button>
            {userId && home && <Button size="sm" variant="secondary" className="w-full" onClick={() => { setInviteOpen(true); setSettings(false); }}>✉ {t.invite.button}</Button>}
            {userId && home && <Button size="sm" variant="secondary" className="w-full" onClick={openRename}>✎ {RENAME[lang].change}</Button>}
            {userId && home && <button type="button" className="w-full rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10" onClick={() => { setQuitOpen(true); setSettings(false); }}>{t.quit.button}</button>}
            {userId && <Button size="sm" variant="secondary" className="w-full" onClick={() => { setAcct("pw"); setSettings(false); }}>🔑 {t.account.changePw}</Button>}
            {userId && <Button size="sm" variant="secondary" className="w-full" onClick={() => { setAcct("mail"); setSettings(false); }}>✉ {t.account.changeMail}</Button>}
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
        <Panel className="md:max-h-[calc(100dvh-var(--bar-h,6rem)-2.5rem)] md:overflow-y-auto md:[scrollbar-width:none]" inner="!bg-wood !border-0 flex gap-1 p-1 md:flex-col">
          {tabs.map(({ k, icon: I, label }) => (
            <WoodButton key={k} label={label} active={tab === k} onClick={() => { setMoreOpen(false); pick(k); }} className={`h-11 flex-1 flex-col gap-0.5 md:flex md:h-14 md:w-14 [@media(min-width:768px)_and_(max-height:760px)]:md:h-11 [@media(min-width:768px)_and_(max-height:760px)]:md:mt-0 md:flex-none ${k === "rituals" || k === "signs" ? "max-md:hidden" : ""}`}>
              <I className="h-5 w-5" /><span className="text-[10px] leading-none">{label}</span>
            </WoodButton>
          ))}
          {owner && myTown && (
            <WoodButton label={t.roll.title} active={rollOpen} onClick={() => setRollOpen(true)} className="h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 [@media(min-width:768px)_and_(max-height:760px)]:md:h-11 [@media(min-width:768px)_and_(max-height:760px)]:md:mt-0 md:flex-none">
              <ScrollText className="h-5 w-5" /><span className="text-[10px] leading-none">{t.roll.menu}</span>
            </WoodButton>
          )}
          {owner && (
            <WoodButton label={t.chron.title} active={chronOpen} onClick={openChron} className="max-md:hidden h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 [@media(min-width:768px)_and_(max-height:760px)]:md:h-11 [@media(min-width:768px)_and_(max-height:760px)]:md:mt-0 md:flex-none">
              <Feather className="h-5 w-5" /><span className="text-[10px] leading-none">{t.chron.open}</span>
            </WoodButton>
          )}
          {userId && (
            <WoodButton label={t.tavern.menu} active={tavernOpen} onClick={() => setTavernOpen(true)} className="relative h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 [@media(min-width:768px)_and_(max-height:760px)]:md:h-11 [@media(min-width:768px)_and_(max-height:760px)]:md:mt-0 md:flex-none">
              <Beer className="h-5 w-5" /><span className="text-[10px] leading-none">{t.tavern.menu}</span>
              {chatUnread > 0 && <span className="absolute end-1 top-1 h-2.5 w-2.5 rounded-full bg-destructive" />}
            </WoodButton>
          )}
          {my && (
            <WoodButton label={t.mayorFind} onClick={findMayor} className="max-md:hidden h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 [@media(min-width:768px)_and_(max-height:760px)]:md:h-11 [@media(min-width:768px)_and_(max-height:760px)]:md:mt-0 md:flex-none">
              <Crown className="h-5 w-5" /><span className="text-[10px] leading-none">{t.roll.role["mayor"]![1]}</span>
            </WoodButton>
          )}
          <WoodButton label={t.guide.menu} active={guideOpen} onClick={() => setGuideOpen(true)} className="max-md:hidden h-11 flex-1 flex-col gap-0.5 md:mt-2 md:h-14 md:w-14 [@media(min-width:768px)_and_(max-height:760px)]:md:h-11 [@media(min-width:768px)_and_(max-height:760px)]:md:mt-0 md:flex-none">
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
              {owner && <WoodButton label={t.chron.title} onClick={() => { setMoreOpen(false); openChron(); }} className="h-14 flex-col gap-0.5"><Feather className="h-5 w-5" /><span className="text-[10px] leading-none">{t.chron.open}</span></WoodButton>}
              <WoodButton label={t.mayorFind} onClick={() => { setMoreOpen(false); findMayor(); }} className="h-14 flex-col gap-0.5"><Crown className="h-5 w-5" /><span className="text-[10px] leading-none">{t.roll.role["mayor"]![1]}</span></WoodButton>
            </Panel>
          </>
        )}
      </div>
      {tab && (
        <div className="pointer-events-none absolute left-[var(--safe-l)] right-[var(--safe-r)] bottom-[calc(var(--dock-bottom)+4.5rem)] z-30 md:bottom-auto ltr:md:right-auto ltr:md:left-[calc(max(0.75rem,env(safe-area-inset-left))+5rem)] rtl:md:left-auto rtl:md:right-[calc(max(0.75rem,env(safe-area-inset-right))+5rem)] md:top-[var(--bar-h,6rem)] md:w-72" style={{ "--bar-h": `${barH + 8}px` } as import("react").CSSProperties}>
          <div className="pointer-events-auto fixed inset-0 -z-10 md:hidden" aria-hidden onClick={() => pick(tab)} />
          <div {...sheetSwipe(() => pick(tab))}><Panel className="flex flex-col max-h-[min(70dvh,calc(100dvh-var(--dock-bottom)-11rem))] md:max-h-[calc(100dvh-var(--bar-h,6rem)-2.5rem)] max-md:rounded-t-2xl" inner="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden [overflow-wrap:anywhere] overscroll-contain pb-6">{drawer}</Panel></div>
        </div>
      )}

      {!tab && (
        <div className="pointer-events-auto absolute end-[calc(var(--safe-r)+0.5rem)] bottom-[calc(var(--dock-bottom)+5.5rem)] z-20 flex flex-col gap-1.5 md:hidden">
          <Button size="sm" variant={lens ? "default" : "secondary"} className="hit h-9 w-9 rounded-full p-0 opacity-85 shadow" aria-label={STUBE[lang].lens} aria-pressed={lens} title={STUBE[lang].lens} onClick={() => { const on = !lens; setLens(on); setMsg(on ? STUBE[lang].lensOn : null); }}><Search className="h-4 w-4" /></Button>
          <Button size="sm" variant="secondary" className="hit h-9 w-9 rounded-full p-0 opacity-85 shadow" aria-label={t.hud.zoomIn} onClick={() => zoomBy(1.6)}><Plus className="h-4 w-4" /></Button>
          <Button size="sm" variant="secondary" className="hit h-9 w-9 rounded-full p-0 opacity-85 shadow" aria-label={t.hud.zoomOut} onClick={() => zoomBy(1 / 1.6)}><Minus className="h-4 w-4" /></Button>
        </div>
      )}
      {/* minimap + zoom */}
      <div className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] end-[max(0.75rem,env(safe-area-inset-right))] z-20 hidden md:block">
        <Panel inner="p-1.5">
          <div dir="ltr"><Minimap key={realm} realm={realm} seeds={seeds} mine={mine} view={view} onJump={(x, y) => focus(x, y)} /></div>
          <div className="mt-1.5 flex gap-1">
            <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.hud.zoomOut} onClick={() => zoomBy(1 / 1.6)}><Minus className="h-4 w-4" /></Button>
            <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.hud.zoomIn} onClick={() => zoomBy(1.6)}><Plus className="h-4 w-4" /></Button>
            <Button size="sm" variant={lens ? "default" : "secondary"} className="h-7 flex-1 px-0" aria-label={STUBE[lang].lens} aria-pressed={lens} title={STUBE[lang].lens} onClick={() => { const on = !lens; setLens(on); setMsg(on ? STUBE[lang].lensOn : null); }}><Search className="h-4 w-4" /></Button>
            {my && <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.toMine} title={t.toMine} onClick={() => glideTo(my.x, my.y, LOOK_TOWN)}><Home className="h-4 w-4" /></Button>}
            {my && <Button size="sm" variant="secondary" className="h-7 flex-1 px-0" aria-label={t.mayorFind} title={t.mayorFind} onClick={findMayor}><Crown className="h-4 w-4" /></Button>}
          </div>
        </Panel>
      </div>
      <Survey userId={userId} lang={lang} />
      {stube && <Stube kind={(STUBE_KINDS.has(stube.kind) ? stube.kind : "farmhouse") as StubeKind} seed={stube.seed} seeds={seeds} residents={stube.residents} family={stube.residents.find((p) => p.role === "head")?.last ?? stube.residents[0]?.last ?? stube.seed.name} lang={lang} onClose={() => setStube(null)} />}

      {plantAsk && (() => {
        const [px, py] = plantAsk;
        const c = wayOf({ x: px, y: py });
        let near: Seed | null = null, nd = Infinity;
        for (const s of seeds) { const d = Math.hypot(px - s.x, py - s.y); if (d < nd) { nd = d; near = s; } }
        return (
          <Parchment image={ART["surveyor"]} title={t.plantAsk.title} later={t.cancel} onLater={() => setPlantAsk(null)} action={<Button type="button" size="sm" disabled={planting} onClick={plantNow}>{planting ? t.plantAsk.wait : t.plantAsk.ok}</Button>}>
            <p className="mt-2 text-center font-display text-xl leading-snug">{t.plantAsk.intro(form.name.trim())}</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.land}</span><span className="text-right font-semibold">{CHAR_ICON[c]} {TOWN_CHARACTER[lang].names[c]}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{form.gender === "d" ? MAYOR[lang].d : form.gender === "w" ? MAYOR[lang].w : t.plantAsk.owner}</span><span className="text-right font-semibold">{form.owner.trim()}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.spread}</span><span className="text-right">{t.plantAsk.first(Math.round(radiusOf(8760)))}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{t.plantAsk.nearest}</span><span className="text-right">{near ? t.plantAsk.near(near.name, Math.round(nd)) : t.plantAsk.none}</span></div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{TOWN_CHARACTER[lang].land[c]}</p>
            {remoteIsle(px, py) && <p role="alert" className="mt-3 rounded-md border border-accent bg-accent/20 p-2 text-xs leading-snug">⚓ {t.plantAsk.isle}</p>}
            {nd > TRADE_DIST && <p role="status" className="mt-3 rounded-md border border-border bg-muted/40 p-2 text-xs leading-snug">{t.plantAsk.farOff(TRADE_DIST)}</p>}
            <div className="mt-3 space-y-1 rounded-md border border-border bg-muted/40 p-2 text-xs">
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{FOUNDING[lang].builds}</span><span className="text-right font-semibold">{WAY_BUILDS[c].map((k) => t.kind[k]).join(", ")}</span></div>
              <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{FOUNDING[lang].style}</span><span className="text-right">{FOUNDING[lang].look[c]}</span></div>
              {near && nd < 120 && (() => { const nw = wayOf(near); const nn = TOWN_CHARACTER[lang].names[nw]; return <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{FOUNDING[lang].neighbour}</span><span className="text-right">{CHAR_ICON[nw]} {nw !== c ? FOUNDING[lang].fits(near.name, nn) : FOUNDING[lang].same(near.name, nn)}</span></div>; })()}
              <p className="pt-1 text-center font-semibold text-primary">{FOUNDING[lang].fair}</p>
            </div>
            <div className="mt-3 border-t border-border pt-3"><CharacterDetails seed={{ x: px, y: py }} lang={lang} /></div>
          </Parchment>
        );
      })()}
      {larderOpen && larder && (
        <Parchment title={t.goods.larder} later={t.close} onLater={() => setLarderOpen(false)}>
          {at && <div className="mb-3 grid grid-cols-3 gap-3">{(["food", "health", "wealth"] as const).map((k) => (
            <div key={k} className="text-xs"><div className="flex justify-between gap-1"><span className="truncate">{t.attrs[k]}</span><span className="tabular-nums">{at[k]}</span></div>
              <div className="h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${at[k]}%` }} /></div></div>
          ))}</div>}
          <p className="text-xs text-muted-foreground">{t.goods.food(larder.food, residents)}</p>
          <div className="mt-3 border-t border-border pt-2 text-sm">
            <p className="mb-1 font-semibold">{t.goods.boonsTitle}</p>
            <ul className="space-y-0.5">
              {(["fed", "varied", "surplus"] as const).map((k) => (
                <li key={k} className={boons?.[k] ? "text-primary" : "text-muted-foreground"}>{boons?.[k] ? "✓" : "○"} {t.goods.boons[k]}</li>
              ))}
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
      {feast && (() => {
        const ft = FEAST_TEXT[lang], [title, text] = ft.days[feast];
        const show = () => {
          const my = seeds.find((x) => x.id === mine); closeFeast(); if (!my) return;
          const tw = townOf(my, seeds, clock()), at = tw.bonfire ?? tw.maypole ?? tw.church ?? tw.meet, [gx, gy] = iso(at[0], at[1]);
          camFree.current = true; glide.current = { x: gx, y: gy };
        };
        return (
          <Parchment image={ART[FEAST_ART[feast]]} title={title} later={ft.later} onLater={closeFeast}>
            <p className="text-center font-display text-lg text-ink/70">{ft.today}</p>
            <p className="mt-2 text-ink">{text}</p>
            <div className="mt-4 flex justify-center"><Button variant="outline" onClick={show}>{ft.show}</Button></div>
          </Parchment>
        );
      })()}
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
      {(dupOf || renameOpen) && mySeed && (
        <Parchment title={dupOf ? RENAME[lang].title : RENAME[lang].manualTitle} later={dupOf ? RENAME[lang].later : t.cancel} onLater={dupOf ? skipRename : closeRename}>
          <div className="space-y-3 text-center text-ink">
            <p>{dupOf ? RENAME[lang].body(mySeed.name) : RENAME[lang].manualBody}</p>
            {renameDays > 0 && <p className="text-sm text-ink/70">{RENAME[lang].cooldown(renameDays)}</p>}
            <div className="flex items-center gap-2">
              <Input maxLength={32} value={renameName} placeholder={t.townName} onChange={(e) => { setRenameName(e.target.value); setRenameErr(""); }} />
              <button type="button" onClick={() => { setRenameName(suggestTownName(seeds.map((s) => s.name), Math.random, renameName)); setRenameErr(""); }} aria-label={t.townName} title={t.townName} className="hit relative shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"><Dices className="h-4 w-4" /></button>
            </div>
            {renameErr && <p className="text-sm text-destructive">{renameErr}</p>}
            <Button disabled={renameBusy || renameDays > 0} onClick={() => void saveRename()}>{RENAME[lang].save}</Button>
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
        const ok = clock() - Date.parse(home.created_at) >= 24 * 3600e3;
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
                  try { if (navigator.share) await navigator.share({ text: t.invite.share, url: link }); else await navigator.clipboard.writeText(text); setMsg(t.invite.copied); }
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
      {encOpen && my && <EncounterDialog t={t} lang={lang} my={my} seeds={seeds} slow={slow} cash={cash} later={later} decide={decide} focus={(x, y) => glideTo(x, y, LOOK_PERSON)} setWho={setWho} />}
      {roadOpen && my && <RoadDialog t={t} lang={lang} my={my} seeds={seeds} now={now} charters={charters} pick={roadPick} setPick={setRoadPick} later={later} focus={(x, y) => glideTo(x, y, LOOK_TOWN)} seal={sealRoad} />}

      {pactOpen && my && pactPartner && <PactDialog t={t} my={my} partner={pactPartner} pick={pactPick} setPick={setPactPick} later={later} seal={sealPact} />}
      {charterOpen && my && <CharterDialog t={t} my={my} now={now} pick={charterPick} setPick={setCharterPick} later={later} seal={sealCharter} />}

      {profile && (
        <TownProfile t={t} lang={lang} town={seeds.find((x) => x.id === profile.id) ?? profile} me={my ?? null} seeds={seeds} now={clock()} onClose={() => setProfile(null)} onLook={() => { glideTo(profile.x, profile.y, LOOK_TOWN); setProfile(null); }} />
      )}
      {rollOpen && my && myTown && (
        <VillageRoll t={t} lang={lang} town={myTown} hue={my.hue} character={<><CharacterDetails seed={my} lang={lang} /><div className="mt-2"><Outlook t={t} lang={lang} my={my} seeds={seeds} now={slow} rank={myRank} charter={myCharter} way={wayOf(my)} /></div>{guestbook}</>} onClose={() => setRollOpen(false)} onPick={(p) => {
          setRollOpen(false);
          const z = lookPerson(p);
          setMsg(z.visible ? null : `${p.first} ${z.act === "sleep" || z.act === "home" || z.act === "sick" ? t.roll.home : t.roll.inside}`);
        }} />
      )}
      {labOpen && <FigureLab onClose={() => setLabOpen(false)} />}
      <Tavern t={t} open={tavernOpen} onClose={() => { setTavernOpen(false); setDmPeer(null); }} peer={dmPeer} userId={userId} my={my} seeds={seeds} realm={realm} lang={lang} onUnread={setChatUnread} />
      {waitDone && !waitShut && !anyOpen && !decision.open && !menuOpen && (
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
        <div className="absolute inset-x-0 z-30 max-md:mt-12 flex justify-center pointer-events-none" style={{ top: barH + 8 }}>
          <WoodButton label={HERALD[lang].button} onClick={() => { const hs = heraldSpots.get(my.id); if (hs) { cam.current.x = hs.x; cam.current.y = hs.y - 6; } openHerald(); }} className="pointer-events-auto h-10 px-3 animate-in fade-in"><span className="text-sm font-semibold">📜 {HERALD[lang].button}</span></WoodButton>
        </div>
      )}
      {herald && my && (
        <Parchment title={HERALD[lang].title} later={HERALD[lang].leave} onLater={() => setHerald(false)}>
          <p className="text-sm italic leading-relaxed text-ink">{addr(HERALD[lang].arrive)}{honour(my) && <> · {honour(my)} {my?.owner}</>}</p>
          {decree ? <p className="mt-3 text-sm italic leading-relaxed text-ink">{decree}</p>
            : <>
              <Button type="button" size="sm" className="mt-3 w-full" onClick={() => askDecree(my.id)}>📜 {HERALD[lang].ask}</Button>
              <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={() => { setQuietFor(my.id, true); setDecree(HERALD[lang].paused); }}>🌙 {HERALD[lang].pause}</Button>
            </>}
          {decree && decree !== HERALD[lang].paused && openTaskOf(princelyRows.current, my.id) && <p className="mt-2 text-xs italic text-muted-foreground">{HERALD[lang].read}</p>}
          <p className="mt-2 text-xs text-muted-foreground">{PRINCELY[lang].favour(favourOf(princelyRows.current, my.id), PRINCELY_COUNT)}</p>
        </Parchment>
      )}
      {owner && quest && claimsReady && !panelOpen && questFold && (
        <button type="button" aria-expanded={false} aria-label={petition!.header} title={petition!.header} onClick={() => foldQuest(false)}
          className={`parchment hit absolute right-16 z-30 grid h-10 w-10 place-items-center rounded-full text-lg shadow ${heads.some((h) => h.ready) ? "ring-2 ring-brass ring-offset-1 ring-offset-transparent" : "opacity-80"}`} style={{ top: barH + 8 }}>
          <span aria-hidden>📜</span>
          {heads.some((h) => h.ready) && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-background bg-brass" />}
        </button>
      )}
      {owner && quest && claimsReady && !panelOpen && !questFold && (
        <div className={`absolute right-16 z-30 ${waitDone && !waitShut && !anyOpen && !decision.open && !menuOpen ? "max-md:hidden" : ""} max-w-[calc(100vw-5rem)] w-60 md:w-64`} style={{ top: barH + 8 }}>
          <div className="parchment px-3 py-2 text-sm text-ink shadow">
            <div className="flex w-full items-start gap-1">
              <button type="button" aria-expanded={!questFold} onClick={() => foldQuest(true)} className="flex min-w-0 flex-1 items-start justify-between gap-2 text-start">
                <span className="font-display text-base leading-tight">{petition!.header}</span>
                <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 opacity-60 transition-transform ${questFold ? "" : "rotate-180"}`} />
              </button>
              {petition!.person && <button type="button" aria-label={petition!.find} title={petition!.find} className="hit relative shrink-0 rounded p-0.5 text-wood hover:bg-ink/10" onClick={() => { const nw = clock(), tw = townOf(my!, seeds, nw), p = tw.people.find((q) => q.id === petition!.person!.id); if (p) lookPerson(p); }}><MapPin className="h-4 w-4" /></button>}
            </div>
            {!questFold && heads.length > 1 && (
              <div role="tablist" className="mt-1 flex gap-1">
                {heads.map((h) => (
                  <button key={h.track} type="button" role="tab" aria-selected={h.track === quest.track} aria-label={TRACK_NAMES[lang][h.track]} title={TRACK_NAMES[lang][h.track]}
                    onClick={() => setQuestTrack(h.track)}
                    className={`hit relative grid h-7 w-8 place-items-center rounded border text-sm ${h.track === quest.track ? "border-wood bg-ink/10" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <span aria-hidden>{TRACK_ICONS[h.track]}</span>
                    {h.ready && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-background bg-brass" />}
                  </button>
                ))}
              </div>
            )}
            {!questFold && (
              <div className="mt-1 space-y-1">
                <div className="font-semibold">{questText![0]}</div>
                <div className={`text-xs opacity-80 ${petition!.plea ? "italic" : ""}`}>{petition!.plea ?? questText![1]}</div>
                {quest.need > 1 && <div className="flex items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded bg-ink/10"><div className="h-full bg-brass/70" style={{ width: `${(100 * quest.have) / quest.need}%` }} /></div><span dir="ltr" className="shrink-0 text-xs tabular-nums opacity-80">{quest.have} / {quest.need}</span></div>}
                <div className="text-end text-xs opacity-70">{t.quests.reward(quest.reward)}</div>
                {quest.ready
                  ? <Button size="sm" className="h-7 w-full" onClick={() => setQuestOpen(true)}>{t.quests.claim}</Button>
                  : questTab ? <Button size="sm" variant="outline" className="h-7 w-full" onClick={questHow}>{t.quests.how}</Button> : null}
              </div>
            )}
            {!questFold && my && (() => {
              const o = openTaskOf(princelyRows.current, my.id); if (!o || quiet.includes(my.id)) return null;
              const P = PRINCELY[lang], k = o.task as PrincelyKind;
              const flavour = k !== "court" ? edictText(lang, o.step) : null;
              return (
                <div className="mt-2 space-y-0.5 border-t border-ink/20 pt-1.5">
                  <div className="font-display text-sm leading-tight">👑 {DECREE_HEAD[lang]} <span dir="ltr" className="text-xs opacity-60">· {o.step}/{PRINCELY_COUNT}</span></div>
                  {flavour && <div className="text-xs italic opacity-80">{flavour}</div>}
                  <div className="text-xs font-semibold">{P.task[k] ?? k}</div>
                  {(() => {
                    const mineC = claims.filter((c) => c.seed_id === my.id);
                    const met = decreeMet(o.task, o.accepted_at, {
                      purchases: purchases.filter((x) => x.seed_id === my.id).map((x) => x.created_at),
                      letters: letters.filter((x) => x.from_seed === my.id).map((x) => x.created_at),
                      visits: [...mineC.filter((c) => c.quest.startsWith("visit:")).map((c) => c.created_at), ...repeatVisits.current],
                      gifts: gifts.filter((x) => x.from_seed === my.id).map((x) => x.created_at),
                      wonders: mineC.filter((c) => c.quest.startsWith("wonder:")).map((c) => c.created_at),
                      roadsOwn: firstRoads.filter((x) => x.seed_id === my.id).map((x) => x.created_at),
                      roadsAll: firstRoads.filter((x) => x.seed_id === my.id || x.target_id === my.id).length,
                      errands: new Set(errandDone.current.filter((e) => e.task_id === o.id).map((e) => e.errand)).size,
                    });
                    if (!met) return null;
                    const S = DECREE_STATUS[lang], left = heraldArrives(o) - clock();
                    return (<>
                      <div className="text-xs font-bold text-primary">{S.done}</div>
                      <div className="text-xs italic opacity-80">{left > 0 ? S.coming(Math.max(1, Math.ceil(left / 3600e3))) : S.waiting}</div>
                    </>);
                  })()}
                  <div className="text-end text-xs opacity-70">{t.quests.reward(o.reward)}</div>
                </div>
              );
            })()}
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
      {owner && !panelOpen && !chronBanner && (chronNews || (!!my && thankable(my.id, gifts, now).some((x) => !seenGifts.includes(x.id)))) && (
        <button type="button" onClick={openChron} title={t.chron.open} aria-label={t.chron.open} className="absolute right-3 z-30 grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-card/90 text-foreground shadow" style={{ top: barH + 8 }}>
          <Feather className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-card" />
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
      {festNow && festSeed && (() => { const [h, body] = festText(festNow); const go = () => { const e = festNow as { x?: number; y?: number }; if (e.x != null && e.y != null) lookAt(e.x, e.y, festNow.code); else lookAt(festSeed.x, festSeed.y); setFest((q) => q.slice(1)); }; return (
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
          <textarea className="mt-3 w-full rounded border border-border bg-card p-2 text-ink placeholder:text-ink/40" rows={3} maxLength={140} value={postText} placeholder={t.post.place} onChange={(e) => setPostText(e.target.value)} />
          <div className="mt-1 text-right text-xs text-ink/60">{postText.length}/140</div>
          <div className="mt-3 flex justify-center"><Button disabled={!postText.trim()} onClick={sendLetter}>{t.post.go}</Button></div>
        </Parchment>
      )}
      {chronOpen && chron && my && (
        <Parchment title={`${t.chron.title} · ${my.name}`} later={t.chron.close} onLater={() => setChronOpen(false)}>
          {!chron.manual && <p className="text-center text-sm text-ink/70">{t.chron.away(Math.max(1, Math.round((chron.to - chron.from) / 864e5)))}</p>}
          {!chron.manual && <p className="mt-3 text-center font-display text-xl leading-snug text-ink">{scribe === undefined ? <span className="animate-pulse text-ink/60">{t.chron.writing}</span> : scribe ?? addr(t.chron.greet)}</p>}
          <div className="mt-4 flex justify-center gap-4 font-display text-lg text-ink">
            <span>{t.chron.pop(chron.popFrom, chron.popTo)}</span><span>{t.chron.taler(chron.taler)}</span>
          </div>
          {chron.events.length === 0 ? <p className="mt-3 text-center text-sm text-ink/70">{t.chron.quiet}</p> : (
            <ul className="mt-3 space-y-1 border-l-2 border-ink/20 pl-3">
              {chron.events.slice(-14).map((e, i) => (
                <li key={i}>
                  <button type="button" className="flex w-full items-start gap-1 text-left text-sm text-ink hover:underline" onClick={() => { if (e.code === "letter") setFest((q) => [e, ...q]); else { const p = e as { x?: number; y?: number }; if (p.x != null && p.y != null) lookAt(p.x, p.y, e.code); else lookAt(my.x, my.y); } setChronOpen(false); }}>
                    <span className="mr-2 text-ink/60">{new Date(e.at).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short" })}</span><span className="flex-1">{chronLine(e)}</span>{"x" in e && <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Parchment>
      )}

      {my && owner && !walk && saplingsOwed(my.decisions ?? [], plantings.filter((p) => p.seed_id === my.id)).length > 0 && (
        <div className="absolute left-1/2 z-30 -translate-x-1/2" style={{ top: barH + 8 }}>
          <Button type="button" size="sm" variant={mode === "sapling" ? "default" : "outline"} onClick={() => { if (mode === "sapling") setMode("look"); else startSapling(); }}>
            🌱 {mode === "sapling" ? t.cancel : t.sapling.btn}
          </Button>
        </div>
      )}

      {sealShown && !panelOpen && (
        <div className="absolute right-2 z-30" style={{ top: barH + 56 }}>
          <WaxSeal label={t.enc.waiting} onClick={reopen} />
        </div>
      )}

      {acct === "recovery" && <RecoveryDialog a={t.account} closeLabel={t.hud.close} close={() => setAcct(null)} />}
      {acct === "pw" && userId && <ChangePasswordDialog a={t.account} closeLabel={t.hud.close} close={() => setAcct(null)} />}
      {acct === "mail" && userId && <ChangeEmailDialog a={t.account} closeLabel={t.hud.close} close={() => setAcct(null)} />}
      {authOpen && !userId && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-foreground/30 p-4" onClick={() => setAuthOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Panel inner="p-4">
              <div className="relative">
                <h1 className="flex justify-center leading-none text-wood"><img src={logoUrl} alt="Samenland" width={371} height={360} className="h-28 w-auto" /></h1>
                <button type="button" aria-label={t.hud.close} onClick={() => setAuthOpen(false)} className="hit absolute end-0 top-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              {forgot ? <ForgotForm a={t.account} initialEmail={auth.email} emailLabel={t.email} back={() => setForgot(false)} /> : <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); emailAuth(); }}>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => oauth("google")}>{t.google}</Button>
                  <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => oauth("apple")}>{t.apple}</Button>
                </div>
                <div className="text-center text-xs text-muted-foreground">{t.or}</div>
                <Input type="email" required placeholder={t.email} value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
                <Input type="password" required minLength={6} placeholder={t.password} value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} />
                <Button type="submit" size="sm" className="w-full">{auth.signup ? t.signUp : t.signIn}</Button>
                {!auth.signup && <button type="button" className="w-full text-xs text-muted-foreground underline" onClick={() => { setForgot(true); setMsg(null); }}>{t.account.forgot}</button>}
                <button type="button" className="w-full text-xs text-muted-foreground underline" onClick={() => setAuth({ ...auth, signup: !auth.signup })}>{auth.signup ? t.haveAccount : t.noAccount}</button>
                {msg && <p className="text-xs text-destructive">{msg}</p>}
              </form>}
            </Panel>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-[calc(var(--dock-bottom)+4.5rem)] left-[var(--safe-l)] right-[var(--safe-r)] z-40 flex flex-col items-end space-y-2 text-sm md:bottom-52 ltr:md:left-auto ltr:md:right-3 rtl:md:right-auto rtl:md:left-3 md:w-80">
        {placing && coarse && ghost && (() => {
          const own = seeds.find((s) => s.id === mine);
          const err = own ? treeGuard(moving ? canMoveTo : canPlaceSpecial, plantings)(placing, ghost[0], ghost[1], own, seeds, clock()) as keyof typeof t.place | null : "ground";
          const nudge = (dx: number, dy: number) => { const g: [number, number] = [ghost[0] + dx, ghost[1] + dy]; setGhost(g); placeFocus(g[0], g[1]); };
          const price = moving ? moveCost(placing) ?? 0 : MONUMENT_PRICE[placing] ?? ITEMS[placing as Item];
          return (
            <div ref={placeBox} className="pointer-events-auto w-full space-y-2 rounded-md border-2 border-wood bg-card p-2 text-foreground shadow-[var(--shadow-panel)]">
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
                <Button className="h-11 flex-[2]" disabled={!!err || cash < price} onClick={() => moving ? relocate(placing, ghost[0], ghost[1]) : buy(placing, ghost[0], ghost[1])}>{moving ? RELOCATE[lang].here : t.place.here} · {t.taler(price)}</Button>
              </div>
            </div>
          );
        })()}
        {placing && !(coarse && ghost) && (
          <div className="pointer-events-auto flex w-full max-w-xs items-center gap-2 rounded-md border-2 border-wood bg-card px-3 py-2 text-foreground shadow-[var(--shadow-panel)]">
            {spriteUrl(SPECIAL_KIND[placing]!) && <img src={spriteUrl(SPECIAL_KIND[placing]!)} alt="" className="h-10 w-10 object-contain" />}
            <div className="flex-1 text-xs"><div className="font-semibold">{t.items[placing]![0]} · {t.taler(moving ? moveCost(placing) ?? 0 : MONUMENT_PRICE[placing] ?? ITEMS[placing as Item])}</div>{moving ? RELOCATE[lang].hint : t.place.hint}</div>
            <Button size="sm" variant="secondary" onClick={() => { setPlacing(null); setMsg(null); }}>{t.cancel}</Button>
          </div>
        )}
        {placing && !coarse && hover && ptr && (() => {
          const own = seeds.find((s) => s.id === mine);
          if (!own) return null;
          const err = treeGuard(moving ? canMoveTo : canPlaceSpecial, plantings)(placing, hover[0], hover[1], own, seeds, clock()) as keyof typeof t.place | null;
          const txt = err ? (t.place[err] as string) ?? t.place.ground : moving ? RELOCATE[lang].hint : t.place.hint;
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
          const hw = err ? null : wayOf({ x: hover[0], y: hover[1] });
          return (
            <div className="pointer-events-none fixed z-50 rounded-md border-2 border-wood bg-card px-2 py-1 text-xs text-foreground shadow-[var(--shadow-panel)]" ref={tipRef} style={{ left: (ptrRef.current ?? ptr)[0] + 18, top: (ptrRef.current ?? ptr)[1] + 18 }}>
              <span className={err ? "text-destructive" : "text-primary"}>{err ? "✕ " : "✓ "}</span>{txt}
              {hw && <div className="mt-0.5 font-semibold">{CHAR_ICON[hw]} {TOWN_CHARACTER[lang].names[hw]} <span className="font-normal text-muted-foreground">· {WAY_BUILDS[hw].map((k) => t.kind[k]).join(", ")}</span></div>}
            </div>
          );
        })()}
        {msg && (
          <div role="status" className={`pointer-events-auto flex w-full items-start gap-2 rounded-md border-2 border-wood bg-card py-2 ps-3 pe-1.5 text-foreground shadow-[var(--shadow-panel)] md:w-auto ${tab ? "max-md:fixed max-md:inset-x-2 max-md:z-40 max-md:w-auto" : ""}`} style={tab ? { bottom: "calc(var(--dock-bottom, 0px) + 4.5rem)" } : undefined}>
            <span className="min-w-0 flex-1">{msg}</span>
            <button type="button" aria-label={t.hud.close} onClick={() => setMsg(null)} className="hit relative grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        )}
        {who && (() => {
          const now = clock();
          const tw = townOf(who.seed, seeds, now);
          const q = poseOf(who, tw, seeds, now);
          const kin = kinOf(who, tw);
          const pick = (p: Person) => { lookPerson(p); };
          const kl = (p: Person) => <button key={p.id} type="button" className="underline-offset-2 hover:underline" onClick={() => pick(p)}>{p.first}{p.role === "child" ? ` (${p.age})` : ""}</button>;
          const row = (label: string, ps: Person[]) => ps.length ? <div><span className="text-muted-foreground">{label}: </span>{ps.map((p, i) => <span key={p.id}>{i ? ", " : ""}{kl(p)}</span>)}</div> : null;
          return (
            <div {...sheetSwipe(() => setWho(null))} className={SHEET}>
              <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-muted-foreground/40 md:hidden" />
              <div className="sticky -top-2 z-10 -mx-3 flex items-start justify-between gap-3 bg-card/95 px-3 pt-2">
                <div className="font-['Caveat'] text-xl leading-tight">{who.first} {who.last}</div>
                <button type="button" aria-label={t.close} className="hit relative -m-2 p-2 text-lg leading-none text-muted-foreground hover:text-foreground" onClick={() => setWho(null)}>×</button>
              </div>
              <div className="text-sm">{t.personAge(who.age)} · {who.job === "mayor" ? <>{mayorWord(lang, who.seed.mayor_gender as "m" | "w" | "d" | null, townRank(who.seed, seeds, slow))}{honour(who.seed) && <span className="text-primary"> · {honour(who.seed)}</span>}</> : (t.job[jobKey(who)] ?? t.job[who.job]!)[who.sex === "f" ? 0 : 1]}</div>
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
                    {p.first} {p.last} · {(t.job[jobKey(p)] ?? t.job[p.job]!)[p.sex === "f" ? 0 : 1]}
                  </button>
                </li>
              ))}
            </ul>
          ) : <div className="text-muted-foreground">{t.nobody}</div>;
          return (
            <div {...sheetSwipe(() => setPlace(null))} className={SHEET}>
              <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-muted-foreground/40 md:hidden" />
              <div className="sticky -top-2 z-10 -mx-3 flex items-start justify-between gap-3 bg-card/95 px-3 pt-2">
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
                  {(() => { const pk = paintedKind(ins, seeds, clock()); return STUBE_KINDS.has(pk) && <Button type="button" size="sm" variant="outline" className="mt-1" onClick={() => { setStube({ ...ins, kind: pk }); setPlace(null); }}><Search className="me-1 h-4 w-4" />{STUBE[lang].look}</Button>; })()}
                  {ins.workers.length > 0 && <div className="text-xs"><div className="font-semibold">{t.workers}</div>{list(ins.workers)}</div>}
                  {my && ins.seed.id === my.id && (() => {
                    const item = itemOfKind(my, ins.kind); if (!item) return null;
                    const rt = RELOCATE[lang], price = moveCost(item) ?? 0, block = moveBlock(my, item, clock());
                    return (
                      <div className="mt-1 text-xs">
                        <Button type="button" size="sm" variant="outline" disabled={!!block || cash < price}
                          onClick={() => { setPlace(null); setPlacing(item); setMoving(true); setMsg(rt.pick(t.items[item]![0])); focus(ins.x, ins.y); }}>
                          {rt.button} · {t.taler(price)}
                        </Button>
                        <div className="mt-0.5 text-muted-foreground">{block ? rt[block] : rt.about}</div>
                      </div>
                    );
                  })()}
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
                              onClick={() => { if (c.tile) { glideTo(c.tile[0], c.tile[1], LOOK_BUILDING); setPlace({ ...ins, x: c.tile[0], y: c.tile[1], kind: c.kind }); } }}>
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

      </div>
      <div ref={tileInfoRef} style={{ display: "none", bottom: "calc(var(--dock-bottom, 0px) + 0.75rem)" }} className="pointer-events-none fixed start-[calc(var(--safe-l,0px)+0.75rem)] z-30 max-w-[min(26rem,80vw)] rounded-md border border-border bg-card/90 px-2.5 py-1 text-xs text-foreground shadow-sm max-md:!bottom-[calc(var(--dock-bottom,0px)+4.5rem)]" />
    </div>
  );
}

// The data API returns at most 1000 rows per request — page through growing tables so no claim is ever missed.
const mapRows = allIn;
// startup timeline (P.3b.1): marks share the navigation origin; read via performance.getEntriesByType("mark")
const perfMark = (n: string) => { try { performance.mark(`p3:${n}`); } catch { /* ignore */ } };
const allRows = async <T = any,>(q: () => any, key = "id") => ({ data: await allPages<T>(q, key) }); // eslint-disable-line @typescript-eslint/no-explicit-any
