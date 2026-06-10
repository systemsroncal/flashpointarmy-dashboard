const MAX_RESOURCE_DOC_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type ResourceDocumentExt = "pdf" | "doc" | "docx";

function isPdf(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf.slice(0, 5));
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46 && u[4] === 0x2d;
}

function extFromName(name: string): ResourceDocumentExt | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  return null;
}

export function validateResourceDocument(file: File): { error: string } | null {
  if (!(file instanceof File)) {
    return { error: "No file selected." };
  }
  if (file.size > MAX_RESOURCE_DOC_BYTES) {
    return { error: "Document must be 15 MB or smaller." };
  }
  if (file.size < 16) {
    return { error: "File is too small." };
  }
  const ext = extFromName(file.name);
  if (!ext) {
    return { error: "Only PDF, DOC, or DOCX files are allowed." };
  }
  if (!ALLOWED_MIME.has(file.type) && file.type !== "application/octet-stream") {
    return { error: "Invalid document type. Use PDF, DOC, or DOCX." };
  }
  return null;
}

export function detectResourceDocumentExt(file: File, buf: ArrayBuffer): ResourceDocumentExt | null {
  const fromName = extFromName(file.name);
  if (!fromName) return null;
  if (fromName === "pdf" && !isPdf(buf)) return null;
  return fromName;
}
