// Keep in sync with LANGS in src/lib/i18n.ts (tests/i18n.test.ts checks it).
const LANG_PREFIX = "(?:en|zh|es)";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/collections/play", destination: "/collections/discover", permanent: true },
      { source: "/collections/audio", destination: "/collections/utilities", permanent: true },
      // English lives at the plain URL. `/en/...` is only its internal address (see rewrites below).
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    // Every page is rendered by the `[lang]` segment. Chinese and Spanish are reached at /zh/... and
    // /es/...; everything else (the existing English URLs) is served from /en/... without changing the
    // address in the browser. These run after public files and route handlers (api, ads.txt, sitemap.xml,
    // robots.txt), so only page requests are rewritten. Paths that look like files skip the rewrite.
    return [
      { source: "/", destination: "/en" },
      { source: `/:path((?!${LANG_PREFIX}(?:/|$)|api(?:/|$)|_next(?:/|$)|.*\\.[A-Za-z0-9]{1,5}$).+)`, destination: "/en/:path" },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

export default nextConfig;
