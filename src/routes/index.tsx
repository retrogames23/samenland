import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Samenland Dorf-Simulation – Pflanze einen Samen. Sieh ihm beim Wachsen zu." },
      { name: "description", content: "Setz einen Stadt-Samen auf der großen Karte und schau zu, wie dein Dorf in Echtzeit wächst – gemeinsam mit anderen." },
      { property: "og:title", content: "Samenland" },
      { property: "og:description", content: "Ein gemütliches Dorf, das in Echtzeit wächst – auf einer gemeinsamen Karte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
