/**
 * Self-hosted TinyMCE: copy skins, themes, plugins, etc. from node_modules into public/tinymce
 * so the browser can load /tinymce/tinymce.min.js and related assets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcRoot = path.join(root, "node_modules", "tinymce");
const destRoot = path.join(root, "public", "tinymce");

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, ent.name);
    const d = path.join(to, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(srcRoot)) {
  console.warn("[copy-tinymce] Skip: `tinymce` is not installed (node_modules/tinymce missing).");
  process.exit(0);
}

rmrf(destRoot);
fs.mkdirSync(destRoot, { recursive: true });

for (const name of ["skins", "themes", "icons", "models", "plugins"]) {
  const p = path.join(srcRoot, name);
  if (fs.existsSync(p)) copyDir(p, path.join(destRoot, name));
}

for (const file of ["tinymce.min.js", "tinymce.js", "license.md", "notices.txt"]) {
  const p = path.join(srcRoot, file);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(destRoot, file));
}

console.log("[copy-tinymce] Copied TinyMCE assets to public/tinymce");
