"use client";

import Image from "next/image";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, DotsSixVertical, Plus, X } from "@phosphor-icons/react";
import { pointsFor, requiredCount } from "@/lib/voting";

export interface VoteBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  pages: number | null;
  proposedBy: string | null;
}

function Thumb({ book }: { book: VoteBook }) {
  return (
    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-[4px] bg-paper-2">
      {book.coverUrl ? (
        <Image src={book.coverUrl} alt="" fill sizes="44px" className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-ink p-1 text-center text-[8px] leading-tight text-paper">{book.title}</div>
      )}
    </div>
  );
}

function RankedItem({
  book,
  index,
  k,
  total,
  onMove,
  onRemove,
}: {
  book: VoteBook;
  index: number;
  k: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: book.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-[14px] border bg-card p-2.5 pr-2 ${isDragging ? "z-10 border-ink shadow-xl" : "border-line"}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-10 w-7 shrink-0 touch-none cursor-grab items-center justify-center text-ink-3 active:cursor-grabbing"
        aria-label={`Arrastar ${book.title}`}
      >
        <DotsSixVertical size={22} weight="bold" aria-hidden />
      </button>
      <span className="tabular w-6 shrink-0 text-center font-mono text-lg text-ink">{index + 1}</span>
      <div className="hidden sm:block">
        <Thumb book={book} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{book.title}</p>
        <p className="truncate text-sm text-ink-3">{book.author}</p>
      </div>
      <span className="tabular shrink-0 rounded-full bg-rose-soft px-2.5 py-1 font-mono text-sm text-rose" aria-label={`${pointsFor(index + 1, k)} pontos`}>
        {pointsFor(index + 1, k)} pts
      </span>
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          className="flex h-6 w-8 items-center justify-center text-ink-3 hover:text-ink disabled:opacity-30"
          aria-label={`Subir ${book.title}`}
        >
          <ArrowUp size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          className="flex h-6 w-8 items-center justify-center text-ink-3 hover:text-ink disabled:opacity-30"
          aria-label={`Descer ${book.title}`}
        >
          <ArrowDown size={16} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"
        aria-label={`Retirar ${book.title}`}
      >
        <X size={18} aria-hidden />
      </button>
    </li>
  );
}

export function RankingBoard({
  books,
  ranked,
  setRanked,
  k,
  proposerName,
}: {
  books: VoteBook[];
  ranked: string[];
  setRanked: (ids: string[]) => void;
  k: number;
  proposerName: (id: string | null) => string | null;
}) {
  const max = requiredCount(books.length, k);
  const byId = new Map(books.map((b) => [b.id, b]));
  const pool = books.filter((b) => !ranked.includes(b.id));
  const full = ranked.length >= max;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRanked(arrayMove(ranked, ranked.indexOf(String(active.id)), ranked.indexOf(String(over.id))));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= ranked.length) return;
    setRanked(arrayMove(ranked, from, to));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="ordem" className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="ordem" className="font-display text-2xl text-ink">
            A tua ordem
          </h2>
          <span className="tabular text-sm text-ink-3">
            {ranked.length} de {max}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-3">1.º lugar vale {k} pontos, e cada lugar abaixo vale menos um.</p>
        {ranked.length === 0 ? (
          <div className="mt-4 rounded-[14px] border border-dashed border-line px-5 py-10 text-center text-ink-3">
            Toca nos livros ao lado (ou abaixo) pela tua ordem de preferência. Tens de ordenar todos.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ranked} strategy={verticalListSortingStrategy}>
              <ol className="mt-4 flex flex-col gap-2">
                {ranked.map((id, i) => {
                  const b = byId.get(id);
                  if (!b) return null;
                  return (
                    <RankedItem
                      key={id}
                      book={b}
                      index={i}
                      k={k}
                      total={ranked.length}
                      onMove={move}
                      onRemove={() => setRanked(ranked.filter((x) => x !== id))}
                    />
                  );
                })}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <section aria-labelledby="propostos" className="min-w-0">
        <h2 id="propostos" className="font-display text-2xl text-ink">
          Livros propostos
        </h2>
        <p className="mt-1 text-sm text-ink-3">{full ? "Todos ordenados. Podes ainda arrastar para afinar." : `Faltam ${max - ranked.length} para completar o boletim.`}</p>
        <ul className="mt-4 flex flex-col gap-2">
          {pool.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                disabled={full}
                onClick={() => setRanked([...ranked, b.id])}
                className="flex w-full items-center gap-3 rounded-[14px] border border-line bg-card p-2.5 text-left transition hover:border-ink-3 disabled:opacity-50"
              >
                <Thumb book={b} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{b.title}</p>
                  <p className="truncate text-sm text-ink-3">
                    {[b.author, b.pages ? `${b.pages} págs.` : null, proposerName(b.proposedBy) ? `por ${proposerName(b.proposedBy)}` : null]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper" aria-hidden>
                  <Plus size={18} />
                </span>
                <span className="sr-only">Adicionar à ordem</span>
              </button>
            </li>
          ))}
          {pool.length === 0 && <li className="py-6 text-center text-sm text-ink-3">Boletim completo.</li>}
        </ul>
      </section>
    </div>
  );
}
