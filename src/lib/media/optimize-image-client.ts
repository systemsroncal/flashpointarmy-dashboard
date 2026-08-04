/** Client-side image load / crop / compress helpers (browser canvas). */

export type CropAreaPixels = { x: number; y: number; width: number; height: number };

export const COVER_ASPECT = 21 / 9;
export const PROFILE_ASPECT = 1;
export const COVER_MAX_WIDTH = 1920;
export const PROFILE_OUTPUT_SIZE = 800;

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    img.src = url;
  });
}

/** Scale image so width is at most `maxWidth` (no upscale). */
export async function normalizeImageWidth(
  file: File,
  maxWidth: number
): Promise<{ file: File; width: number; height: number }> {
  const img = await loadImageFromFile(file);
  if (img.naturalWidth <= maxWidth) {
    return { file, width: img.naturalWidth, height: img.naturalHeight };
  }
  const scale = maxWidth / img.naturalWidth;
  const w = maxWidth;
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  const out = new File([blob], renameExt(file.name, "jpg"), { type: "image/jpeg" });
  return { file: out, width: w, height: h };
}

export async function cropImageToFile(
  imageSrc: string,
  crop: CropAreaPixels,
  opts: {
    outputWidth?: number;
    outputHeight?: number;
    mime?: "image/jpeg" | "image/webp" | "image/png";
    quality?: number;
    fileName?: string;
  } = {}
): Promise<File> {
  const img = await loadImageFromUrl(imageSrc);
  const mime = opts.mime ?? "image/jpeg";
  const quality = opts.quality ?? 0.88;
  const outW = opts.outputWidth ?? Math.round(crop.width);
  const outH = opts.outputHeight ?? Math.round(crop.height);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH
  );
  const blob = await canvasToBlob(canvas, mime, quality);
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return new File([blob], opts.fileName ?? `image.${ext}`, { type: mime });
}

/** Compress until under maxBytes (or quality floor). Prefers JPEG. */
export async function compressImageFile(
  file: File,
  maxBytes: number,
  opts: { maxWidth?: number; minQuality?: number } = {}
): Promise<File> {
  const maxWidth = opts.maxWidth ?? COVER_MAX_WIDTH;
  const minQuality = opts.minQuality ?? 0.55;
  let working = file;
  const normalized = await normalizeImageWidth(working, maxWidth);
  working = normalized.file;

  if (working.size <= maxBytes) return working;

  const img = await loadImageFromFile(working);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return working;
  ctx.drawImage(img, 0, 0);

  let quality = 0.88;
  let blob = await canvasToBlob(canvas, "image/jpeg", quality);
  while (blob.size > maxBytes && quality > minQuality) {
    quality = Math.max(minQuality, quality - 0.08);
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }
  return new File([blob], renameExt(file.name, "jpg"), { type: "image/jpeg" });
}

function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for crop."));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image encode failed."))),
      mime,
      quality
    );
  });
}

function renameExt(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
}
