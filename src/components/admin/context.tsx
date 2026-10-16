"use client";

import { createContext, useContext } from "react";
import type { ActionResult, AdminData, Photo } from "@/lib/types";
import { uploadImage } from "@/app/actions/admin";
import { IMAGE_PRESETS, resizeImage } from "@/lib/image-client";

export interface AdminCtx {
  data: AdminData;
  getToken: () => Promise<string>;
  /** Corre uma ação, mostra o resultado e recarrega os dados. Devolve o resultado para quem precisar. */
  run: <T>(fn: (token: string) => Promise<ActionResult<T>>, success?: string) => Promise<ActionResult<T>>;
  notify: (message: string, tone?: "ok" | "erro") => void;
}

export const AdminContext = createContext<AdminCtx | null>(null);

export function useAdmin(): AdminCtx {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin fora da Gestão");
  return ctx;
}

export async function uploadPhoto(token: string, file: File, kind: keyof typeof IMAGE_PRESETS): Promise<ActionResult<Photo>> {
  try {
    const { blob, width, height } = await resizeImage(file, IMAGE_PRESETS[kind]);
    const form = new FormData();
    form.set("file", blob, `upload.${blob.type.split("/")[1]}`);
    form.set("kind", kind);
    form.set("width", String(width));
    form.set("height", String(height));
    return await uploadImage(token, form);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao enviar a imagem." };
  }
}
