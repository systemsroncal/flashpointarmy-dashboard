/**
 * PM2: production (3000) + dev (3001) on one VPS.
 *
 * Starts Next via `scripts/pm2-next-start.sh` so the listen port is always correct
 * (PM2 + `args` on the Next binary can drop flags; `.env.production` may set PORT=3000 on both clones).
 *
 * Before `pm2 start ecosystem.config.cjs`:
 *
 * 1) Pull **both** clones (prod + dev). If `git` as root says "dubious ownership", run as `admin` or:
 *      git config --global --add safe.directory /home/admin/web/app.fparmychapters.com/public_html
 *      git config --global --add safe.directory /home/admin/web/dev.fparmychapters.com/public_html
 * 2) Kill orphaned `next-server` on 3000/3001 (they are NOT stopped by `pm2 delete`):
 *      sudo bash scripts/free-next-host-ports.sh
 *    Or: `sudo ss -ltnp | grep -E ':3000|:3001'` then `sudo kill <pid>`.
 * 3) Build each site: `npm ci && npm run build` in each `public_html`.
 * 4) PM2:
 *      pm2 delete app-fparmychapters dev-fparmychapters 2>/dev/null || true
 *      cd /home/admin/web/app.fparmychapters.com/public_html && pm2 start ecosystem.config.cjs && pm2 save
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
