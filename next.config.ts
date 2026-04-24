import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** VPS/CI: do not fail `next build` on ESLint; run `npm run lint` separately in dev/CI. */
  eslint: {
    ignoreDuringBuilds: true,
  },
  /**
   * Serve `/uploads/*` via App Route so Turbopack/dev reliably returns files under `public/uploads`
   * (otherwise `/uploads/...` can hit the app router and show a 404 page even when the file exists).
   */
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }];
  },
  reactStrictMode: true,
  /**
   * Extra dev hostnames allowed to request `/_next/*` (HMR, chunks). Needed when exposing
   * `localhost` via localtunnel, Cloudflare quick tunnel, ngrok, etc.
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: [
    "*.loca.lt",
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
  /**
   * Tree-shake MUI barrel imports. Do not include @mui/icons-material here: Next's
   * optimizer breaks webpack resolution inside that package (Module not found Add.js / etc.).
   */
  experimental: {
    optimizePackageImports: ["@mui/material"],
  },
  /**
   * Do not disable webpack cache in dev: turning it off was forcing full rebuilds
   * (~2000 modules / 10–50s per route). If you hit OOM, run `npm run clean` and try
   * `npm run dev:webpack` instead of `dev`.
   */
};

export default nextConfig;
