/**
 * Copy Mozilla PDF.js prebuilt viewer into public/pdfjs for same-origin embedding.
 * Source: https://github.com/mozilla/pdf.js (pdfjs-*-dist.zip releases)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const destRoot = path.join(root, "public", "pdfjs");
const VERSION = "4.10.38";
const ZIP_URL = `https://github.com/mozilla/pdf.js/releases/download/v${VERSION}/pdfjs-${VERSION}-dist.zip`;
const marker = path.join(destRoot, ".version");

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

async function downloadZip(url, outFile) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status} ${url}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(outFile));
}

function unzip(zipPath, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  // Linux: `unzip`. Windows 10+/macOS: `tar` can read zip. Last resort: PowerShell.
  const attempts = [
    () => execFileSync("unzip", ["-qo", zipPath, "-d", outDir], { stdio: "ignore" }),
    () => execFileSync("tar", ["-xf", zipPath, "-C", outDir], { stdio: "ignore" }),
    () =>
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${outDir.replace(/'/g, "''")}' -Force`,
        ],
        { stdio: "ignore" }
      ),
  ];
  const errors = [];
  for (const run of attempts) {
    try {
      run();
      return;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`Unzip failed (${errors.join(" | ")})`);
}

async function main() {
  if (fs.existsSync(marker) && fs.readFileSync(marker, "utf8").trim() === VERSION) {
    if (fs.existsSync(path.join(destRoot, "web", "viewer.html"))) {
      console.log(`[copy-pdfjs] public/pdfjs already at v${VERSION}`);
      return;
    }
  }

  const tmpDir = path.join(root, ".tmp-pdfjs");
  const zipPath = path.join(tmpDir, `pdfjs-${VERSION}-dist.zip`);
  rmrf(tmpDir);
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log(`[copy-pdfjs] Downloading Mozilla PDF.js v${VERSION}…`);
  try {
    await downloadZip(ZIP_URL, zipPath);
    unzip(zipPath, tmpDir);
  } catch (e) {
    console.warn(`[copy-pdfjs] Skip: ${e instanceof Error ? e.message : e}`);
    rmrf(tmpDir);
    process.exit(0);
  }

  // Zip extracts to web/, build/, LICENSE, etc. at tmp root or nested folder.
  let extracted = tmpDir;
  const nested = path.join(tmpDir, `pdfjs-${VERSION}-dist`);
  if (fs.existsSync(path.join(nested, "web", "viewer.html"))) extracted = nested;
  else if (!fs.existsSync(path.join(tmpDir, "web", "viewer.html"))) {
    const kids = fs.readdirSync(tmpDir).filter((n) => n !== path.basename(zipPath));
    for (const k of kids) {
      const p = path.join(tmpDir, k);
      if (fs.existsSync(path.join(p, "web", "viewer.html"))) {
        extracted = p;
        break;
      }
    }
  }

  if (!fs.existsSync(path.join(extracted, "web", "viewer.html"))) {
    console.warn("[copy-pdfjs] Skip: viewer.html not found in archive.");
    rmrf(tmpDir);
    process.exit(0);
  }

  rmrf(destRoot);
  fs.mkdirSync(destRoot, { recursive: true });
  for (const name of ["web", "build"]) {
    const from = path.join(extracted, name);
    const to = path.join(destRoot, name);
    if (fs.existsSync(from)) {
      fs.cpSync(from, to, { recursive: true });
    }
  }
  fs.writeFileSync(marker, VERSION);
  rmrf(tmpDir);
  console.log(`[copy-pdfjs] Installed Mozilla PDF.js viewer → public/pdfjs (v${VERSION})`);
}

void main();
