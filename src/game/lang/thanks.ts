import type { Lang } from "@/game/i18n";

type T = { title: string; settlers: string; anno: string; simcity: string; oss: string };

export const THANKS: Record<Lang, T> = {
  de: { title: "Inspiration & Dank", settlers: "Den Macher*innen der Siedler-Reihe, vor allem der ersten beiden Teile – allen voran Volker Wertich", anno: "Den Macher*innen der Anno-Reihe", simcity: "Den Macher*innen der SimCity-Reihe, die mich mit Aufbau- und Wirtschaftssimulationen vertraut gemacht haben", oss: "Allen Autor*innen der verwendeten Open-Source-Komponenten:" },
  en: { title: "Inspiration & thanks", settlers: "The makers of The Settlers series, above all the first two games – foremost Volker Wertich", anno: "The makers of the Anno series", simcity: "The makers of the SimCity series, who introduced me to city-building and economic simulations", oss: "All authors of the open-source components used:" },
  fr: { title: "Inspiration & remerciements", settlers: "Aux créatrices et créateurs de la série The Settlers, surtout des deux premiers volets – en tête Volker Wertich", anno: "Aux créatrices et créateurs de la série Anno", simcity: "Aux créatrices et créateurs de la série SimCity, qui m'ont fait découvrir les jeux de construction et de gestion", oss: "À toutes les autrices et tous les auteurs des composants open source utilisés :" },
  es: { title: "Inspiración y gracias", settlers: "A quienes crearon la saga The Settlers, sobre todo sus dos primeras entregas – ante todo a Volker Wertich", anno: "A quienes crearon la saga Anno", simcity: "A quienes crearon la saga SimCity, que me acercaron a los juegos de construcción y economía", oss: "A todas las autoras y autores de los componentes de código abierto utilizados:" },
  ar: { title: "الإلهام والشكر", settlers: "إلى صانعي سلسلة The Settlers، ولا سيما الجزأين الأولين – وفي مقدمتهم فولكر فيرتيش", anno: "إلى صانعي سلسلة Anno", simcity: "إلى صانعي سلسلة SimCity الذين عرّفوني بألعاب البناء والمحاكاة الاقتصادية", oss: "إلى جميع مؤلفي مكونات المصدر المفتوح المستخدمة:" },
  hi: { title: "प्रेरणा और आभार", settlers: "The Settlers शृंखला के रचनाकारों को, विशेषकर पहले दो भागों के – सबसे बढ़कर Volker Wertich को", anno: "Anno शृंखला के रचनाकारों को", simcity: "SimCity शृंखला के रचनाकारों को, जिन्होंने मुझे निर्माण और अर्थव्यवस्था सिमुलेशन से परिचित कराया", oss: "उपयोग किए गए सभी ओपन-सोर्स घटकों के लेखकों को:" },
  zh: { title: "灵感与致谢", settlers: "致《工人物语》系列的创作者们，尤其是前两部——首先是 Volker Wertich", anno: "致《纪元》（Anno）系列的创作者们", simcity: "致《模拟城市》系列的创作者们，是他们带我走进建造与经济模拟游戏", oss: "致所用开源组件的全体作者：" },
  ja: { title: "インスピレーションと感謝", settlers: "『セトラーズ』シリーズ、とくに最初の二作の作り手たち――なかでも Volker Wertich に", anno: "『アノ』シリーズの作り手たちに", simcity: "街づくりと経済シミュレーションの楽しさを教えてくれた『シムシティ』シリーズの作り手たちに", oss: "使用しているオープンソース部品のすべての作者に：" },
};

export const OSS: [string, string][] = [
  ["React", "https://react.dev"],
  ["TanStack Start & Router", "https://tanstack.com"],
  ["TanStack Query", "https://tanstack.com/query"],
  ["Vite", "https://vite.dev"],
  ["Vitest", "https://vitest.dev"],
  ["TypeScript", "https://www.typescriptlang.org"],
  ["Tailwind CSS", "https://tailwindcss.com"],
  ["Radix UI", "https://www.radix-ui.com"],
  ["shadcn/ui", "https://ui.shadcn.com"],
  ["Lucide", "https://lucide.dev"],
  ["Supabase", "https://github.com/supabase/supabase"],
  ["PostgreSQL", "https://www.postgresql.org"],
  ["Zod", "https://zod.dev"],
  ["React Hook Form", "https://react-hook-form.com"],
  ["date-fns", "https://date-fns.org"],
  ["Sonner", "https://sonner.emilkowal.ski"],
  ["Vaul", "https://vaul.emilkowal.ski"],
  ["cmdk", "https://cmdk.paco.me"],
  ["Recharts", "https://recharts.org"],
  ["Embla Carousel", "https://www.embla-carousel.com"],
  ["React Email", "https://react.email"],
  ["clsx", "https://github.com/lukeed/clsx"],
  ["tailwind-merge", "https://github.com/dcastil/tailwind-merge"],
  ["class-variance-authority", "https://cva.style"],
  ["Drizzle ORM", "https://orm.drizzle.team"],
  ["ESLint", "https://eslint.org"],
  ["Prettier", "https://prettier.io"],
];
