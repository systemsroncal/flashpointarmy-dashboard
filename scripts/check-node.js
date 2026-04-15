/* Node version check before install (ES5-friendly for very old Node). */
var match = /^v(\d+)/.exec(process.version);
var major = match ? parseInt(match[1], 10) : 0;
if (major < 18) {
  console.error("");
  console.error("[flashpoint-dashboard] Node.js 18.18+ is required (20 LTS recommended).");
  console.error("Current version: " + process.version);
  console.error("Install from https://nodejs.org/ then run npm install again.");
  console.error("");
  process.exit(1);
}
