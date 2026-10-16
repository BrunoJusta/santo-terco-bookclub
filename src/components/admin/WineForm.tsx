"use client";

import { useState } from "react";
import { saveWine } from "@/app/actions/admin";
import { useAdmin, uploadPhoto } from "./context";
import { ImagePicker, SelectInput, TextInput } from "./bits";
import { btn } from "@/components/ui";
import type { Photo, Wine } from "@/lib/types";

export function WineForm({ initial, fixedBookId, onDone }: { initial?: Wine; fixedBookId?: string; onDone: () => void }) {
  const { data, run, getToken, notify } = useAdmin();
  const [name, setName] = useState(initial?.name ?? "");
  const [image, setImage] = useState<Photo | null>(initial?.image ?? null);
  const [bookId, setBookId] = useState<string>(fixedBookId ?? initial?.bookId ?? "");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const readBooks = data.books.filter((b) => b.status === "lido").sort((a, b) => (b.readAt ?? "").localeCompare(a.readAt ?? ""));

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
    const res = await run((t) => saveWine(t, { id: initial?.id, name, image, bookId: bookId || null }), initial ? "Vinho atualizado." : "Vinho adicionado.");
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
          {!fixedBookId && (
            <SelectInput label="Jantar" value={bookId} onChange={(e) => setBookId(e.target.value)} help="Só os vinhos ligados a um jantar aparecem na app.">
              <option value="">Sem jantar</option>
              {readBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </SelectInput>
          )}
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
