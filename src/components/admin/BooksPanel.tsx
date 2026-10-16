"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "@phosphor-icons/react";
import { useAdmin } from "./context";
import { BookEditor } from "./BookEditor";
import { StatusPill } from "./bits";
import { btn, cx } from "@/components/ui";
import { formatShortDate } from "@/lib/time";
import { BOOK_STATUS_LABEL, type BookStatus } from "@/lib/types";

const ORDER: BookStatus[] = ["proximo", "votacao", "fila", "lido"];

export function BooksPanel() {
  const { data } = useAdmin();
  const [editing, setEditing] = useState<string | "novo" | null>(null);
  const [filter, setFilter] = useState<BookStatus | "todos">("todos");
  const name = new Map(data.members.map((m) => [m.id, m.name]));
  const reviewsCount = (id: string) => data.reviews.filter((r) => r.bookId === id).length;

  if (editing) {
    const book = editing === "novo" ? undefined : data.books.find((b) => b.id === editing);
    return <BookEditor key={editing} book={book} onClose={() => setEditing(null)} />;
  }

  const books = data.books
    .filter((b) => filter === "todos" || b.status === filter)
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || (b.readAt ?? b.createdAt).localeCompare(a.readAt ?? a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Livros</h1>
          <p className="mt-1 text-ink-3">Fila, votação, próximo e lidos. O detalhe do lido junta o jantar, as fotos, os vinhos e as reviews.</p>
        </div>
        <button type="button" className={btn.primary} onClick={() => setEditing("novo")}>
          <Plus size={18} aria-hidden /> Novo livro
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
        {(["todos", ...ORDER] as const).map((s) => {
          const count = s === "todos" ? data.books.length : data.books.filter((b) => b.status === s).length;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
              className={cx(
                "h-8 rounded-full border px-3 text-sm transition",
                filter === s ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-ink-3",
              )}
            >
              {s === "todos" ? "Todos" : BOOK_STATUS_LABEL[s]} <span className="tabular opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {books.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-2xl text-ink">Estante vazia.</p>
          <p className="mt-1 text-ink-3">Adiciona o primeiro livro, ou prepara uma votação com as propostas do grupo.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-[14px] border border-line bg-card">
          {books.map((b) => (
            <li key={b.id}>
              <button type="button" onClick={() => setEditing(b.id)} className="flex w-full items-center gap-4 p-3 text-left hover:bg-paper-2/60 sm:p-4">
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-[4px] bg-paper-2">
                  {b.cover && <Image src={b.cover.url} alt="" fill sizes="44px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{b.title}</p>
                  <p className="truncate text-sm text-ink-3">
                    {[b.author, b.proposedBy ? `proposto por ${name.get(b.proposedBy) ?? "?"}` : null].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-3">
                    {[b.dinnerAt ? `jantar ${formatShortDate(b.dinnerAt)}` : null, b.status === "lido" ? `${reviewsCount(b.id)} reviews` : null]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <StatusPill tone={b.status === "proximo" ? "ink" : b.status === "votacao" ? "rose" : "muted"}>{BOOK_STATUS_LABEL[b.status]}</StatusPill>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
