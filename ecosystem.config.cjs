/**
 * PM2: production (3000) + dev (3001) on one VPS.
 *
 * Uses `next start -p <port>` so the listen port is fixed even if `.env.production`
 * contains `PORT=3000` in both clones (common copy-paste mistake on dev).
 *
 * Before `pm2 start ecosystem.config.cjs`, run a successful build in **each** cwd:
 *   cd .../public_html && npm ci && npm run build
 *   cd .../dev.../public_html && npm ci && npm run build
 *
 * From repo root (either clone):
 *   pm2 delete app-fparmychapters dev-fparmychapters 2>/dev/null || true
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *
 * Edit `cwd` if your Hestia paths differ.
 */
module.exports = {
  apps: [
    {
      name: "app-fparmychapters",
      cwd: "/home/admin/web/app.fparmychapters.com/public_html",
      script: "node_modules/next/dist/bin/next",
      args: ["start", "-p", "3000"],
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "dev-fparmychapters",
      cwd: "/home/admin/web/dev.fparmychapters.com/public_html",
      script: "node_modules/next/dist/bin/next",
      args: ["start", "-p", "3001"],
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
    },
  ],
};
