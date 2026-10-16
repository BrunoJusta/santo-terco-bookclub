"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Trash } from "@phosphor-icons/react";
import { deleteWine } from "@/app/actions/admin";
import { useAdmin } from "./context";
import { ConfirmButton } from "./bits";
import { WineForm } from "./WineForm";
import { btn, card } from "@/components/ui";

export function WinesPanel() {
  const { data, run } = useAdmin();
  const [editing, setEditing] = useState<string | "novo" | null>(null);
  const title = new Map(data.books.map((b) => [b.id, b.title]));
  const wines = [...data.wines].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Vinhos</h1>
          <p className="mt-1 text-ink-3">Nome e PNG da garrafa. Liga cada um ao jantar onde foi bebido.</p>
        </div>
        <button type="button" className={btn.primary} onClick={() => setEditing("novo")}>
          <Plus size={18} aria-hidden /> Novo vinho
        </button>
      </div>

      {editing === "novo" && <WineForm onDone={() => setEditing(null)} />}
      {editing && editing !== "novo" && (
        <WineForm key={editing} initial={data.wines.find((w) => w.id === editing)} onDone={() => setEditing(null)} />
      )}

      {wines.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-2xl text-ink">Garrafeira vazia.</p>
          <p className="mt-1 text-ink-3">Também podes juntar vinhos a partir do jantar, na ficha do livro lido.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {wines.map((w) => (
            <li key={w.id} className={`${card} flex flex-col items-center gap-2 p-3`}>
              <div className="relative h-40 w-20">
                {w.image ? (
                  <Image src={w.image.url} alt="" fill sizes="80px" className="object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[10px] bg-paper-2 text-xs text-ink-3">Sem imagem</div>
                )}
              </div>
              <p className="line-clamp-2 text-center text-sm font-medium text-ink">{w.name || "Sem nome"}</p>
              <p className="line-clamp-1 text-center text-xs text-ink-3">{w.bookId ? title.get(w.bookId) ?? "Jantar apagado" : "Sem jantar"}</p>
              <div className="mt-1 flex gap-1.5">
                <button type="button" className={btn.small} onClick={() => setEditing(w.id)}>
                  Editar
                </button>
                <ConfirmButton confirmLabel="Apagar?" onConfirm={() => run((t) => deleteWine(t, w.id), "Vinho apagado.")}>
                  <Trash size={16} aria-label="Apagar vinho" />
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
