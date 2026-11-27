import type { Lang } from "../i18n";

type Text = {
  /** an action was refused because the wedding settlement is still outstanding — never a lack of money */
  pending: string;
  /** resource chips: the daily booking waits for the wedding settlement */
  resources: string;
};
/** Paket B (O2): "Abrechnung ausstehend" — own module, so i18n.ts and the language files stay untouched. All eight languages. */
export const SETTLEMENT_T: Record<Lang, Text> = {
  de: {
    pending: "Die Abrechnung der Hochzeiten steht noch aus. Es wurde nichts gebucht – bitte gleich noch einmal versuchen.",
    resources: "Die Rohstoffabrechnung wartet auf die Abrechnung der Hochzeiten.",
  },
  en: {
    pending: "The wedding accounts are still being settled. Nothing was booked – please try again in a moment.",
    resources: "The resource accounts are waiting for the wedding accounts to be settled.",
  },
  fr: {
    pending: "Les comptes des mariages ne sont pas encore réglés. Rien n'a été enregistré – réessaie dans un instant.",
    resources: "Les comptes des ressources attendent le règlement des comptes des mariages.",
  },
  es: {
    pending: "Las cuentas de las bodas aún no están cerradas. No se ha registrado nada; inténtalo de nuevo en un momento.",
    resources: "Las cuentas de recursos esperan al cierre de las cuentas de las bodas.",
  },
  ar: {
    pending: "لم تُسوَّ حسابات الأعراس بعد. لم يُسجَّل أي شيء – حاول مرة أخرى بعد قليل.",
    resources: "حسابات الموارد بانتظار تسوية حسابات الأعراس.",
  },
  hi: {
    pending: "शादियों का हिसाब अभी पूरा नहीं हुआ है। कुछ भी दर्ज नहीं हुआ – कृपया थोड़ी देर में फिर कोशिश करें।",
    resources: "संसाधनों का हिसाब शादियों के हिसाब के पूरा होने की प्रतीक्षा कर रहा है।",
  },
  zh: {
    pending: "婚礼账目尚未结清。本次未记录任何内容——请稍后再试。",
    resources: "资源账目正在等待婚礼账目结清。",
  },
  ja: {
    pending: "婚礼の精算がまだ終わっていません。何も記帳されていません。少ししてからもう一度お試しください。",
    resources: "資材の精算は婚礼の精算が終わるのを待っています。",
  },
};
