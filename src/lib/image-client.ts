/** Reduz e comprime imagens no browser antes de as enviar (fotos de telemóvel chegam a 8 MB). */
export async function resizeImage(
  file: File,
  opts: { max: number; type: "image/jpeg" | "image/png" | "image/webp"; quality?: number; square?: boolean },
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  // Recorte quadrado ao centro (fotos de perfil)
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = opts.square ? (bitmap.width - side) / 2 : 0;
  const sy = opts.square ? (bitmap.height - side) / 2 : 0;
  const sw = opts.square ? side : bitmap.width;
  const sh = opts.square ? side : bitmap.height;
  const scale = Math.min(1, opts.max / Math.max(sw, sh));
  const width = Math.round(sw * scale);
  const height = Math.round(sh * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("O browser não conseguiu processar a imagem.");
  if (opts.type === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, opts.type, opts.quality ?? 0.84));
  if (!blob) throw new Error("Não foi possível comprimir a imagem.");
  return { blob, width, height };
}

export const IMAGE_PRESETS = {
  covers: { max: 1000, type: "image/jpeg", quality: 0.86 },
  photos: { max: 1900, type: "image/jpeg", quality: 0.82 },
  wines: { max: 900, type: "image/png" },
  avatars: { max: 480, type: "image/jpeg", quality: 0.86, square: true },
} as const;
