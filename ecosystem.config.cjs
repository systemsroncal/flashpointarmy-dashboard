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
 *    Or let `scripts/deploy-from-github.sh` handle it (stop → delete → free port → start).
 * 3) Build each site: `npm ci && npm run build` in each `public_html`.
 * 4) PM2 (manual bootstrap) or routine deploy script (one app at a time):
 *      cd /home/admin/web/dev.fparmychapters.com/public_html
 *      GIT_BRANCH=dev PM2_APP_NAME=dev-fparmychapters APP_PORT=3001 bash scripts/deploy-from-github.sh
 *    deploy-from-github.sh does NOT load this file (avoids stopping the other site).
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
