import "server-only";
import { randomUUID } from "node:crypto";
import { bucket, STORAGE_PREFIX } from "./firebase";
import type { Photo } from "../types";

export type UploadKind = "covers" | "photos" | "wines";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

function downloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export async function saveImage(
  data: Buffer,
  contentType: string,
  kind: UploadKind,
  size?: { width?: number | null; height?: number | null },
): Promise<Photo> {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error("Formato de imagem não suportado (usa JPG, PNG ou WebP).");
  if (data.byteLength > MAX_UPLOAD_BYTES) throw new Error("Imagem demasiado grande.");
  const b = bucket();
  const path = `${STORAGE_PREFIX}/${kind}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const token = randomUUID();
  await b.file(path).save(data, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return { path, url: downloadUrl(b.name, path, token), width: size?.width ?? null, height: size?.height ?? null };
}

/** Só apaga ficheiros dentro da pasta do clube. */
export async function deleteImage(path: string | null | undefined): Promise<void> {
  if (!path || !path.startsWith(`${STORAGE_PREFIX}/`)) return;
  try {
    await bucket().file(path).delete({ ignoreNotFound: true });
  } catch {
    // Ficheiro órfão não é motivo para falhar a operação.
  }
}

const COVER_HOSTS = ["books.google.com", "books.googleusercontent.com", "covers.openlibrary.org", "archive.org"];

/** Descarrega uma capa da pesquisa (Google Books / Open Library) e guarda-a no Storage do clube. */
export async function importRemoteCover(url: string): Promise<Photo> {
  const u = new URL(url.replace(/^http:/, "https:"));
  const allowed = COVER_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  if (!allowed) throw new Error("Origem de capa não permitida.");
  const res = await fetch(u, { redirect: "follow" });
  if (!res.ok) throw new Error("Não foi possível descarregar a capa.");
  const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 1500) throw new Error("A capa encontrada está vazia.");
  return saveImage(buf, ALLOWED_TYPES[type] ? type : "image/jpeg", "covers");
}
