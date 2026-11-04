import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    // stale code chunk after an update: reload once instead of showing a blank page
    if (/Importing a module script failed|Failed to fetch dynamically imported module/i.test(String((error as Error | undefined)?.message))) {
      const k = "chunk-reload-react";
      if (Date.now() - Number(sessionStorage.getItem(k) ?? 0) > 30000) { sessionStorage.setItem(k, String(Date.now())); location.reload(); return; }
    }
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "google", content: "notranslate" },
      { title: "Samenland" },
      { name: "description", content: "Ein gemütliches Dorf, das in Echtzeit wächst." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Caveat:wght@500;700&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Naskh+Arabic:wght@400;600&display=swap" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", type: "image/png", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});


// A stale or briefly unavailable code file (preview restart, new deploy) would leave a blank page; retry with a short backoff ladder instead.
const CHUNK_GUARD = `(function(){var re=/Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|evaluating '\\w+\\[\\w+\\?\\?|reading 'default'/i;var K="chunk-reload";function st(){try{return JSON.parse(sessionStorage.getItem(K)||"{}")}catch(e){return{}}}function sv(o){try{sessionStorage.setItem(K,JSON.stringify(o))}catch(e){}}setTimeout(function(){sv({})},6000);function go(){var s=st(),t=Date.now();if(s.t&&t-s.t<400)return;var n=(s.n||0)+1;if(n>10)return;sv({n:n,t:t});setTimeout(function(){location.reload()},Math.min(1000*Math.pow(2,n-1),15000))}window.addEventListener("vite:preloadError",function(){go()});window.addEventListener("unhandledrejection",function(e){if(re.test(String(e.reason&&e.reason.message||e.reason)))go()});window.addEventListener("error",function(e){var s=e.target;if(s&&s.tagName==="SCRIPT"&&s.type==="module"){go();return}if(re.test(String(e.message)))go()},true)})();`;

const DOM_GUARD =  `(function(){if(typeof Node!=="function"||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c.parentNode!==this){return c}return r.apply(this,arguments)};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this){return n}return i.apply(this,arguments)}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de" translate="no" className="notranslate" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DOM_GUARD }} />
        <script dangerouslySetInnerHTML={{ __html: CHUNK_GUARD }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
