import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
   * Tree-shake MUI barrel imports so dev/prod compile far fewer modules per route.
   * (Icons still import per-file where possible for best results.)
   */
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
  /**
   * Do not disable webpack cache in dev: turning it off was forcing full rebuilds
   * (~2000 modules / 10–50s per route). If you hit OOM, run `npm run clean` and try
   * `npm run dev:webpack` instead of `dev`.
   */
};

export default nextConfig;
