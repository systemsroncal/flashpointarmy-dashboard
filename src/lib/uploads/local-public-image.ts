import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const uploadsRoot = () => path.join(process.cwd(), "public", "uploads");

/** Web path always with forward slashes (e.g. `/uploads/avatars/...`). */
function toWebPath(...segments: string[]): string {
  return `/${["uploads", ...segments].join("/").replace(/\/+/g, "/")}`;
}

/**
 * Saves the user's avatar under `public/uploads/avatars/{userId}/avatar.{ext}`.
 * Removes previous `avatar.*` files in that folder so extension changes do not leave orphans.
 */
export async function writeUserAvatarImage(userId: string, buffer: Buffer, ext: string): Promise<string> {
  const absDir = path.join(uploadsRoot(), "avatars", userId);
  await mkdir(absDir, { recursive: true });
  const entries = await readdir(absDir).catch(() => [] as string[]);
  await Promise.all(
    entries
      .filter((f) => f.startsWith("avatar."))
      .map((f) => unlink(path.join(absDir, f)).catch(() => undefined))
  );
  const fileName = `avatar.${ext}`;
  await writeFile(path.join(absDir, fileName), buffer);
  return toWebPath("avatars", userId, fileName);
}

/** Saves a gathering image under `public/uploads/gatherings/{userId}/{uuid}.{ext}`. */
export async function writeGatheringImage(userId: string, buffer: Buffer, ext: string): Promise<string> {
  const absDir = path.join(uploadsRoot(), "gatherings", userId);
  await mkdir(absDir, { recursive: true });
  const fileName = `${randomUUID()}.${ext}`;
  await writeFile(path.join(absDir, fileName), buffer);
  return toWebPath("gatherings", userId, fileName);
}

/** Course builder assets: images or PDFs under `public/uploads/courses/{userId}/`. */
export async function writeCourseAsset(
  userId: string,
  buffer: Buffer,
  ext: string
): Promise<string> {
  const absDir = path.join(uploadsRoot(), "courses", userId);
  await mkdir(absDir, { recursive: true });
  const fileName = `${randomUUID()}.${ext}`;
  await writeFile(path.join(absDir, fileName), buffer);
  return toWebPath("courses", userId, fileName);
}
