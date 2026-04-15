/**
 * dev-reset: borra caché Next (.next), libera el puerto (por defecto 3000) y arranca `npm run dev`.
 * Uso: npm run dev:reset
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync, spawn } = require("child_process");
const path = require("path");

const port = Number(process.env.PORT || 3000);

function cleanNext() {
  require(path.join(__dirname, "clean-next.js"));
}

function killPort(p) {
  if (process.platform === "win32") {
    try {
      const out = execSync("netstat -ano", { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        const colon = `:${p}`;
        if (!line.includes(colon)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        console.log(`Freeing port ${p}: terminating PID ${pid}`);
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
        } catch {
          // ignore
        }
      }
    } catch {
      // netstat/findstr: nothing listening
    }
    return;
  }

  try {
    execSync(`lsof -ti:${p} | xargs kill -9`, {
      shell: "/bin/sh",
      stdio: "ignore",
    });
    console.log(`Freeing port ${p} (unix)`);
  } catch {
    // no process on this port
  }
}

cleanNext();
killPort(port);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(npm, ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
