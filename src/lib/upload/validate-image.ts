const MAX_AVATAR_BYTES = 1024 * 1024;

const ALLOWED_CLIENT_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type ValidatedImageKind = "jpeg" | "png" | "gif" | "webp";

export function validateAvatarFile(file: File): { error: string } | null {
  if (!file || !(file instanceof File)) {
    return { error: "No file selected." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be 1 MB or smaller." };
  }
  if (file.size < 16) {
    return { error: "File is too small to be a valid image." };
  }
  if (!ALLOWED_CLIENT_MIME.has(file.type)) {
    return { error: "Only JPEG, PNG, WebP, or GIF images are allowed." };
  }
  return null;
}

/** Detect type from magic bytes; returns null if bytes do not match a known image signature. */
export function detectImageKindFromBuffer(buf: ArrayBuffer): ValidatedImageKind | null {
  const u = new Uint8Array(buf);
  if (u.length < 12) return null;
  if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return "jpeg";
  if (
    u[0] === 0x89 &&
    u[1] === 0x50 &&
    u[2] === 0x4e &&
    u[3] === 0x47 &&
    u[4] === 0x0d &&
    u[5] === 0x0a &&
    u[6] === 0x1a &&
    u[7] === 0x0a
  ) {
    return "png";
  }
  if (u[0] === 0x47 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x38) return "gif";
  if (u[0] === 0x52 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x46) {
    const tag = String.fromCharCode(u[8], u[9], u[10], u[11]);
    if (tag === "WEBP") return "webp";
  }
  return null;
}

/** Reject polyglot / mismatched Content-Type vs actual file content. */
export function assertMimeMatchesKind(
  declaredMime: string,
  kind: ValidatedImageKind
): { error: string } | null {
  const map: Record<ValidatedImageKind, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  if (declaredMime !== map[kind]) {
    return { error: "File content does not match its type. Choose a real image file." };
  }
  return null;
}

export function fileExtensionForKind(kind: ValidatedImageKind): string {
  if (kind === "jpeg") return "jpg";
  return kind;
}

export function contentTypeForKind(kind: ValidatedImageKind): string {
  const map: Record<ValidatedImageKind, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return map[kind];
}

export { MAX_AVATAR_BYTES };
