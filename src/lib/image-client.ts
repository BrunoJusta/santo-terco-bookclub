/** Reduz e comprime imagens no browser antes de as enviar (fotos de telemóvel chegam a 8 MB). */
export async function resizeImage(
  file: File,
  opts: { max: number; type: "image/jpeg" | "image/png" | "image/webp"; quality?: number },
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, opts.max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("O browser não conseguiu processar a imagem.");
  if (opts.type === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, opts.type, opts.quality ?? 0.84));
  if (!blob) throw new Error("Não foi possível comprimir a imagem.");
  return { blob, width, height };
}

export const IMAGE_PRESETS = {
  covers: { max: 1000, type: "image/jpeg", quality: 0.86 },
  photos: { max: 1900, type: "image/jpeg", quality: 0.82 },
  wines: { max: 900, type: "image/png" },
} as const;
