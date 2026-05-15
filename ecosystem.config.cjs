/**
 * PM2: production (3000) + dev (3001) on one VPS.
 *
 * Must be named `ecosystem.config.cjs` (or `ecosystem.config.js`) at repo root
 * so `pm2 start` parses `apps[]` — do NOT use a random filename or PM2 runs the file as one app.
 *
 * From this directory:
 *   pm2 delete app-fparmychapters dev-fparmychapters pm2.ecosystem 2>/dev/null || true
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
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "dev-fparmychapters",
      cwd: "/home/admin/web/dev.fparmychapters.com/public_html",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
    },
  ],
};
