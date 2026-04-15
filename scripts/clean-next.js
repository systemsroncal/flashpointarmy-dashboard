/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const nextDir = path.join(process.cwd(), ".next");
try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next");
} catch (e) {
  if (e && e.code !== "ENOENT") {
    console.error(e);
    process.exit(1);
  }
}
