import type { Lang } from "@/game/i18n";

export type MusicText = { on: string; off: string; muted: string };

export const MUSIC: Record<Lang, MusicText> = {
  de: { on: "Musik an", off: "Musik aus", muted: "Musik (Ton ist aus)" },
  en: { on: "Music on", off: "Music off", muted: "Music (sound is off)" },
  fr: { on: "Musique activée", off: "Musique coupée", muted: "Musique (son coupé)" },
  es: { on: "Música activada", off: "Música desactivada", muted: "Música (sonido apagado)" },
  ar: { on: "تشغيل الموسيقى", off: "إيقاف الموسيقى", muted: "الموسيقى (الصوت مكتوم)" },
  hi: { on: "संगीत चालू", off: "संगीत बंद", muted: "संगीत (ध्वनि बंद है)" },
  zh: { on: "开启音乐", off: "关闭音乐", muted: "音乐（声音已关闭）" },
  ja: { on: "音楽を流す", off: "音楽を止める", muted: "音楽（音が消えています）" },
};
