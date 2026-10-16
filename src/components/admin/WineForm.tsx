"use client";

import { useState } from "react";
import { saveWine } from "@/app/actions/admin";
import { useAdmin, uploadPhoto } from "./context";
import { ImagePicker, TextInput } from "./bits";
import { btn } from "@/components/ui";
import type { Photo, Wine } from "@/lib/types";

export function WineForm({ initial, fixedBookId, onDone }: { initial?: Wine; fixedBookId: string; onDone: () => void }) {
  const { run, getToken, notify } = useAdmin();
  const [name, setName] = useState(initial?.name ?? "");
  const [image, setImage] = useState<Photo | null>(initial?.image ?? null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pick(file: File) {
    setBusy(true);
    const res = await uploadPhoto(await getToken(), file, "wines");
    setBusy(false);
    if (res.ok) setImage(res.data);
    else notify(res.error, "erro");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await run((t) => saveWine(t, { id: initial?.id, name, image, bookId: fixedBookId }), initial ? "Vinho atualizado." : "Vinho adicionado.");
    setSaving(false);
    if (res.ok) onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-[14px] border border-line bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <ImagePicker
          label="Garrafa (PNG)"
          value={image}
          onPick={pick}
          onClear={() => setImage(null)}
          busy={busy}
          accept="image/png,image/webp"
          aspect="aspect-[1/2]"
          contain
          help="PNG com fundo transparente."
        />
        <div className="flex flex-col gap-4">
          <TextInput label="Nome do vinho" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={btn.smallInk} disabled={saving || busy || !name.trim()}>
          {saving ? "A guardar…" : "Guardar vinho"}
        </button>
        <button type="button" className={btn.small} onClick={onDone}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
