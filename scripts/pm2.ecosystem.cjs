/**
 * PM2: production (3000) + dev (3001) on one VPS.
 *
 * First time or after fixing wrong PORT:
 *   pm2 delete app-fparmychapters dev-fparmychapters 2>/dev/null || true
 *   cd /path/to/this/repo && pm2 start scripts/pm2.ecosystem.cjs
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
