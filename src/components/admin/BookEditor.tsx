"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, BookOpen, Check, MagnifyingGlass, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import { deleteBook, deleteWine, importCover, saveBook, searchBooks, type BookSearchResult } from "@/app/actions/admin";
import { useAdmin, uploadPhoto } from "./context";
import { ConfirmButton, ImagePicker, SectionTitle, SelectInput, TextArea, TextInput } from "./bits";
import { ReviewsEditor } from "./ReviewsEditor";
import { WineForm } from "./WineForm";
import { btn, card, field } from "@/components/ui";
import { isoToLisbonLocal, lisbonLocalToIso } from "@/lib/time";
import { BOOK_STATUS_LABEL, type Book, type BookStatus, type Photo } from "@/lib/types";

interface Draft {
  id?: string;
  title: string;
  author: string;
  year: string;
  pages: string;
  synopsis: string;
  isbn: string;
  cover: Photo | null;
  status: BookStatus;
  proposedBy: string;
  dinnerLocal: string;
  dinnerPlace: string;
  attendees: string[];
  photos: Photo[];
  readAt: string | null;
}

function toDraft(b?: Book, status: BookStatus = "fila"): Draft {
  return {
    id: b?.id,
    title: b?.title ?? "",
    author: b?.author ?? "",
    year: b?.year ? String(b.year) : "",
    pages: b?.pages ? String(b.pages) : "",
    synopsis: b?.synopsis ?? "",
    isbn: b?.isbn ?? "",
    cover: b?.cover ?? null,
    status: b?.status ?? status,
    proposedBy: b?.proposedBy ?? "",
    dinnerLocal: isoToLisbonLocal(b?.dinnerAt),
    dinnerPlace: b?.dinnerPlace ?? "",
    attendees: b?.attendees ?? [],
    photos: b?.photos ?? [],
    readAt: b?.readAt ?? null,
  };
}

function toInput(d: Draft) {
  const int = (s: string) => (s.trim() && Number.isFinite(Number(s)) ? Math.round(Number(s)) : null);
  return {
    id: d.id,
    title: d.title,
    author: d.author,
    year: int(d.year),
    pages: int(d.pages),
    synopsis: d.synopsis,
    isbn: d.isbn,
    cover: d.cover,
    status: d.status,
    proposedBy: d.proposedBy || null,
    dinnerAt: d.dinnerLocal ? lisbonLocalToIso(d.dinnerLocal) : null,
    dinnerPlace: d.dinnerPlace,
    readAt: d.readAt,
    attendees: d.attendees,
    photos: d.photos,
  };
}

function BookSearch({ onPick }: { onPick: (r: BookSearchResult) => void }) {
  const { run } = useAdmin();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<BookSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await run((t) => searchBooks(t, q));
    setLoading(false);
    if (res.ok) setResults(res.data);
  }

  return (
    <div className={`${card} p-4`}>
      <form onSubmit={search} className="flex gap-2" role="search">
        <label htmlFor="book-q" className="sr-only">
          Pesquisar livro por título, autor ou ISBN
        </label>
        <input
          id="book-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Título, autor ou ISBN"
          className={field.input}
        />
        <button type="submit" className={btn.primary} disabled={loading || q.trim().length < 2}>
          <MagnifyingGlass size={18} aria-hidden />
          <span className="hidden sm:inline">{loading ? "A procurar…" : "Pesquisar"}</span>
        </button>
      </form>
      <p className="mt-2 text-xs text-ink-3">Preenche autor, ano, páginas, sinopse e capa a partir do Google Books ou da Open Library.</p>
      {results && (
        <ul className="mt-4 flex max-h-96 flex-col gap-2 overflow-y-auto">
          {results.length === 0 && <li className="text-sm text-ink-3">Nada encontrado. Experimenta só o título, ou o ISBN.</li>}
          {results.map((r, i) => (
            <li key={`${r.title}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  onPick(r);
                  setResults(null);
                }}
                className="flex w-full items-center gap-3 rounded-[10px] border border-line p-2 text-left hover:border-ink-3"
              >
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-[3px] bg-paper-2">
                  {r.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-ink">{r.title}</p>
                  <p className="truncate text-sm text-ink-3">{[r.author, r.year, r.pages ? `${r.pages} págs.` : null].filter(Boolean).join(", ")}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BookEditor({ book, initialStatus, onClose }: { book?: Book; initialStatus?: BookStatus; onClose: () => void }) {
  const { data, run, getToken, notify } = useAdmin();
  const [d, setD] = useState<Draft>(() => toDraft(book, initialStatus));
  const [saving, setSaving] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [photosBusy, setPhotosBusy] = useState(0);
  const [wineForm, setWineForm] = useState<string | "novo" | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const saved = d.id ? data.books.find((b) => b.id === d.id) ?? null : null;
  const otherNext = data.books.find((b) => b.status === "proximo" && b.id !== d.id);
  const wines = saved ? data.wines.filter((w) => w.bookId === saved.id) : [];
  const membersForAttendance = data.members.filter((m) => m.active || d.attendees.includes(m.id));

  async function pickResult(r: BookSearchResult) {
    setD((x) => ({
      ...x,
      title: r.title || x.title,
      author: r.author || x.author,
      year: r.year ? String(r.year) : x.year,
      pages: r.pages ? String(r.pages) : x.pages,
      synopsis: r.synopsis || x.synopsis,
      isbn: r.isbn || x.isbn,
    }));
    if (r.coverUrl) {
      setCoverBusy(true);
      const res = await run((t) => importCover(t, r.coverUrl!));
      setCoverBusy(false);
      if (res.ok) set("cover", res.data);
    }
  }

  async function pickCover(file: File) {
    setCoverBusy(true);
    const res = await uploadPhoto(await getToken(), file, "covers");
    setCoverBusy(false);
    if (res.ok) set("cover", res.data);
    else notify(res.error, "erro");
  }

  async function addPhotos(files: FileList) {
    const list = Array.from(files);
    setPhotosBusy(list.length);
    const token = await getToken();
    const added: Photo[] = [];
    for (const f of list) {
      const res = await uploadPhoto(token, f, "photos");
      if (res.ok) added.push(res.data);
      else notify(res.error, "erro");
      setPhotosBusy((n) => n - 1);
    }
    setD((x) => ({ ...x, photos: [...x.photos, ...added] }));
    if (added.length) notify(`${added.length} ${added.length === 1 ? "foto carregada" : "fotos carregadas"}. Não te esqueças de guardar.`);
  }

  async function save(override?: Partial<Draft>) {
    const next = { ...d, ...override };
    setSaving(true);
    const res = await run((t) => saveBook(t, toInput(next)), "Livro guardado.");
    setSaving(false);
    if (res.ok) setD(toDraft(res.data));
  }

  return (
    <div className="flex flex-col gap-8">
      <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 self-start text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> Livros
      </button>
      <h1 className="font-display text-4xl text-ink">{d.id ? d.title || "Livro" : "Novo livro"}</h1>

      <BookSearch onPick={pickResult} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-8"
      >
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <ImagePicker label="Capa" value={d.cover} onPick={pickCover} onClear={() => set("cover", null)} busy={coverBusy} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextInput label="Título" value={d.title} onChange={(e) => set("title", e.target.value)} required maxLength={300} />
            </div>
            <TextInput label="Autor" value={d.author} onChange={(e) => set("author", e.target.value)} maxLength={300} />
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Ano" inputMode="numeric" value={d.year} onChange={(e) => set("year", e.target.value)} />
              <TextInput label="Páginas" inputMode="numeric" value={d.pages} onChange={(e) => set("pages", e.target.value)} />
            </div>
            <SelectInput label="Proposto por" value={d.proposedBy} onChange={(e) => set("proposedBy", e.target.value)}>
              <option value="">Ninguém em particular</option>
              {data.members
                .filter((m) => m.active || m.id === d.proposedBy)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </SelectInput>
            <SelectInput
              label="Estado"
              value={d.status}
              onChange={(e) => set("status", e.target.value as BookStatus)}
              help={d.status === "proximo" && otherNext ? `"${otherNext.title}" deixa de ser o próximo e volta para a fila.` : undefined}
            >
              {(Object.keys(BOOK_STATUS_LABEL) as BookStatus[]).map((s) => (
                <option key={s} value={s}>
                  {BOOK_STATUS_LABEL[s]}
                </option>
              ))}
            </SelectInput>
            <div className="sm:col-span-2">
              <TextArea label="Sinopse" rows={4} value={d.synopsis} onChange={(e) => set("synopsis", e.target.value)} maxLength={6000} />
            </div>
          </div>
        </div>

        <fieldset className={`${card} grid gap-4 p-4 sm:grid-cols-2`}>
          <legend className="px-1 font-display text-xl text-ink">Jantar</legend>
          <TextInput
            label="Data e hora"
            type="datetime-local"
            value={d.dinnerLocal}
            onChange={(e) => set("dinnerLocal", e.target.value)}
            help="É também a data limite de leitura e o alvo do countdown. Hora de Lisboa."
          />
          <TextInput label="Local" value={d.dinnerPlace} onChange={(e) => set("dinnerPlace", e.target.value)} placeholder="Casa da Sofia, Porto" maxLength={300} />
        </fieldset>

        {d.status === "lido" && (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="font-display text-xl text-ink">Quem esteve presente</legend>
              <div className="flex flex-wrap gap-2">
                {membersForAttendance.map((m) => {
                  const on = d.attendees.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition ${
                        on ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-ink-3"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() => set("attendees", on ? d.attendees.filter((x) => x !== m.id) : [...d.attendees, m.id])}
                      />
                      {on && <Check size={14} weight="bold" aria-hidden />}
                      {m.name}
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button type="button" className={btn.small} onClick={() => set("attendees", data.members.filter((m) => m.active).map((m) => m.id))}>
                  Todos os ativos
                </button>
                <button type="button" className={btn.small} onClick={() => set("attendees", [])}>
                  Limpar
                </button>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="font-display text-xl text-ink">Fotos do encontro</legend>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {d.photos.map((p, i) => (
                  <li key={p.path} className="group relative aspect-square overflow-hidden rounded-[10px] bg-paper-2">
                    <Image src={p.url} alt={`Foto ${i + 1}`} fill sizes="160px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => set("photos", d.photos.filter((x) => x.path !== p.path))}
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-paper"
                      aria-label={`Remover foto ${i + 1}`}
                    >
                      <Trash size={16} aria-hidden />
                    </button>
                    {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] text-paper">Destaque</span>}
                  </li>
                ))}
                {Array.from({ length: photosBusy }).map((_, i) => (
                  <li key={`busy-${i}`} className="aspect-square animate-pulse rounded-[10px] bg-paper-2" />
                ))}
              </ul>
              <label className={`${btn.small} w-fit cursor-pointer`}>
                <UploadSimple size={16} aria-hidden /> Adicionar fotos
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && addPhotos(e.target.files)} />
              </label>
            </fieldset>
          </>
        )}

        <div className="sticky bottom-0 z-[5] -mx-4 flex flex-wrap gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[14px] sm:border">
          <button type="submit" className={btn.primary} disabled={saving || coverBusy || photosBusy > 0 || !d.title.trim()}>
            {saving ? "A guardar…" : "Guardar"}
          </button>
          {d.id && d.status !== "lido" && (
            <button type="button" className={btn.rose} disabled={saving} onClick={() => save({ status: "lido" })}>
              <BookOpen size={18} aria-hidden /> Marcar como lido
            </button>
          )}
          {d.id && (
            <ConfirmButton
              className={`${btn.danger} h-11 sm:ml-auto`}
              confirmLabel="Apagar livro, reviews e vinhos?"
              onConfirm={async () => {
                const res = await run((t) => deleteBook(t, d.id!), "Livro apagado.");
                if (res.ok) onClose();
              }}
            >
              <Trash size={16} aria-hidden /> Apagar
            </ConfirmButton>
          )}
        </div>
      </form>

      {saved && saved.status === "lido" && (
        <>
          <section className="flex flex-col gap-4">
            <SectionTitle
              action={
                <button type="button" className={btn.smallInk} onClick={() => setWineForm("novo")}>
                  <Plus size={16} aria-hidden /> Vinho
                </button>
              }
            >
              Vinhos do jantar
            </SectionTitle>
            {wineForm === "novo" && <WineForm fixedBookId={saved.id} onDone={() => setWineForm(null)} />}
            {wines.length === 0 && wineForm !== "novo" && <p className="text-sm text-ink-3">Ainda nenhuma garrafa registada.</p>}
            <ul className="flex flex-wrap gap-3">
              {wines.map((w) =>
                wineForm === w.id ? (
                  <li key={w.id} className="w-full">
                    <WineForm initial={w} fixedBookId={saved.id} onDone={() => setWineForm(null)} />
                  </li>
                ) : (
                  <li key={w.id} className={`${card} flex w-40 flex-col items-center gap-2 p-3`}>
                    <div className="relative h-32 w-16">
                      {w.image && <Image src={w.image.url} alt="" fill sizes="64px" className="object-contain" />}
                    </div>
                    <p className="line-clamp-2 text-center text-sm text-ink">{w.name}</p>
                    <div className="flex gap-1.5">
                      <button type="button" className={btn.small} onClick={() => setWineForm(w.id)}>
                        Editar
                      </button>
                      <ConfirmButton confirmLabel="Apagar?" onConfirm={() => run((t) => deleteWine(t, w.id), "Vinho apagado.")}>
                        <Trash size={16} aria-label="Apagar vinho" />
                      </ConfirmButton>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </section>
          <ReviewsEditor bookId={saved.id} />
        </>
      )}
      {d.status === "lido" && !saved && <p className="text-sm text-ink-3">Guarda o livro para poderes juntar vinhos e reviews.</p>}
    </div>
  );
}
