import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/Game";
import { getServerTime } from "@/game/time.functions";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Samenland Dorf-Simulation – Pflanze einen Samen. Sieh ihm beim Wachsen zu." },
      { name: "description", content: "Setz einen Stadt-Samen auf der großen Karte und schau zu, wie dein Dorf in Echtzeit wächst – gemeinsam mit anderen." },
      { property: "og:title", content: "Samenland Dorf-Simulation – Pflanze einen Samen. Sieh ihm beim Wachsen zu." },
      { name: "twitter:title", content: "Samenland Dorf-Simulation – Pflanze einen Samen. Sieh ihm beim Wachsen zu." },
      { property: "og:description", content: "Ein gemütliches Dorf, das in Echtzeit wächst – auf einer gemeinsamen Karte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getServerTime(),
  component: IndexPage,
});

function IndexPage() {
  const { serverTime } = Route.useLoaderData();
  return <Game serverTime={serverTime} />;
}
