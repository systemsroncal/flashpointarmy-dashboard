/**
 * PM2: production (3000) + dev (3001) on one VPS.
 *
 * Starts Next via `scripts/pm2-next-start.sh` so the listen port is always correct
 * (PM2 + `args` on the Next binary can drop flags; `.env.production` may set PORT=3000 on both clones).
 *
 * Before `pm2 start ecosystem.config.cjs`, build in **each** cwd: `npm ci && npm run build`
 *
 *   pm2 delete app-fparmychapters dev-fparmychapters 2>/dev/null || true
 *   sudo fuser -k 3000/tcp 3001/tcp 2>/dev/null; sleep 2
 *   cd /home/admin/web/app.fparmychapters.com/public_html && pm2 start ecosystem.config.cjs && pm2 save
 *
 * Edit `cwd` if your Hestia paths differ.
 */
module.exports = {
  apps: [
    {
      name: "app-fparmychapters",
      cwd: "/home/admin/web/app.fparmychapters.com/public_html",
      interpreter: "bash",
      script: "scripts/pm2-next-start.sh",
      args: ["3000"],
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "dev-fparmychapters",
      cwd: "/home/admin/web/dev.fparmychapters.com/public_html",
      interpreter: "bash",
      script: "scripts/pm2-next-start.sh",
      args: ["3001"],
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
