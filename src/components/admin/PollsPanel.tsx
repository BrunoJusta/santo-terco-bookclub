"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Coin, Crown, Plus, Warning } from "@phosphor-icons/react";
import {
  closePollNow,
  deleteBallot,
  deletePoll,
  openPoll,
  promoteWinner,
  resolveTie,
  saveBook,
  savePoll,
} from "@/app/actions/admin";
import { useAdmin } from "./context";
import { ConfirmButton, SectionTitle, SelectInput, StatusPill, TextInput } from "./bits";
import { btn, card } from "@/components/ui";
import { DEFAULT_K, METHOD_LABEL } from "@/lib/voting";
import { formatDateTime, isoToLisbonLocal, lisbonLocalToIso } from "@/lib/time";
import type { Poll } from "@/lib/types";

const STATUS_LABEL = { rascunho: "Rascunho", aberta: "Aberta", fechada: "Fechada" } as const;

function QuickAddBook({ onAdded }: { onAdded: (id: string) => void }) {
  const { data, run } = useAdmin();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [proposedBy, setProposedBy] = useState("");
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await run((t) => saveBook(t, { title, author, status: "fila", proposedBy: proposedBy || null }), "Livro adicionado à fila.");
    setSaving(false);
    if (res.ok) {
      onAdded(res.data.id);
      setTitle("");
      setAuthor("");
    }
  }

  return (
    <form onSubmit={add} className={`${card} grid gap-3 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_auto] sm:items-end`}>
      <TextInput label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <TextInput label="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <SelectInput label="Proposto por" value={proposedBy} onChange={(e) => setProposedBy(e.target.value)}>
        <option value="">Escolhe…</option>
        {data.members
          .filter((m) => m.active)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
      </SelectInput>
      <button type="submit" className={btn.smallInk} disabled={saving || !title.trim()}>
        <Plus size={16} aria-hidden /> Adicionar
      </button>
      <p className="text-xs text-ink-3 sm:col-span-4">Para capa e sinopse, completa o livro depois na aba Livros (tem pesquisa automática).</p>
    </form>
  );
}

function PollEditor({ poll, onClose }: { poll?: Poll; onClose: () => void }) {
  const { data, run } = useAdmin();
  const [title, setTitle] = useState(poll?.title ?? `Votação ${new Date().getFullYear()}`);
  const [closesLocal, setClosesLocal] = useState(isoToLisbonLocal(poll?.closesAt));
  const [k, setK] = useState(String(poll?.k ?? DEFAULT_K));
  const [selected, setSelected] = useState<string[]>(poll?.bookIds ?? []);
  const [saving, setSaving] = useState(false);
  const [pollId, setPollId] = useState(poll?.id);
  const name = new Map(data.members.map((m) => [m.id, m.name]));

  const candidates = data.books
    .filter((b) => b.status === "fila" || selected.includes(b.id))
    .sort((a, b) => a.title.localeCompare(b.title, "pt"));

  const proposals = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of selected) {
      const p = data.books.find((b) => b.id === id)?.proposedBy ?? "_";
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    return counts;
  }, [selected, data.books]);
  const proposerCounts = [...proposals.entries()].filter(([p]) => p !== "_");
  const unequal = new Set(proposerCounts.map(([, n]) => n)).size > 1;
  const noProposer = proposals.get("_") ?? 0;

  async function save(): Promise<string | null> {
    setSaving(true);
    const res = await run(
      (t) =>
        savePoll(t, {
          id: pollId,
          title,
          bookIds: selected,
          closesAt: closesLocal ? lisbonLocalToIso(closesLocal) : null,
          k: Number(k) || DEFAULT_K,
        }),
      "Votação guardada.",
    );
    setSaving(false);
    if (res.ok) {
      setPollId(res.data);
      return res.data;
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 self-start text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> Votações
      </button>
      <h1 className="font-display text-4xl text-ink">{pollId ? "Preparar votação" : "Nova votação"}</h1>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,1fr)]">
        <TextInput label="Nome" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <TextInput label="Fecha a" type="datetime-local" value={closesLocal} onChange={(e) => setClosesLocal(e.target.value)} help="Opcional. Fecha sozinha nesta hora." />
        <TextInput label="k" inputMode="numeric" value={k} onChange={(e) => setK(e.target.value)} help="Livros por boletim." />
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>
          Livros a votos <span className="tabular font-mono text-lg text-ink-3">{selected.length}</span>
        </SectionTitle>
        {(unequal || noProposer > 0) && selected.length > 0 && (
          <p className="flex items-start gap-2 rounded-[10px] bg-rose-soft px-3 py-2.5 text-sm text-ink">
            <Warning size={18} className="mt-0.5 shrink-0 text-rose" aria-hidden />
            <span>
              {unequal && <>O Art. 4.2 pede o mesmo número de propostas por membro: {proposerCounts.map(([p, n]) => `${name.get(p) ?? "?"} ${n}`).join(", ")}. </>}
              {noProposer > 0 && <>{noProposer} sem proponente.</>}
            </span>
          </p>
        )}
        {candidates.length === 0 ? (
          <p className="text-sm text-ink-3">Não há livros na fila. Adiciona as propostas abaixo.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((b) => {
              const on = selected.includes(b.id);
              return (
                <li key={b.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-2.5 transition ${on ? "border-ink bg-card" : "border-line bg-card hover:border-ink-3"}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => setSelected(on ? selected.filter((x) => x !== b.id) : [...selected, b.id])}
                    />
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-[3px] bg-paper-2">
                      {b.cover && <Image src={b.cover.url} alt="" fill sizes="40px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-ink">{b.title}</p>
                      <p className="truncate text-xs text-ink-3">{b.proposedBy ? name.get(b.proposedBy) : "sem proponente"}</p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${on ? "border-ink bg-ink text-paper" : "border-line"}`}
                      aria-hidden
                    >
                      {on && <Check size={14} weight="bold" />}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-ink">Adicionar proposta à fila</h2>
        <QuickAddBook onAdded={(id) => setSelected((s) => [...s, id])} />
      </section>

      <div className="sticky bottom-0 z-[5] -mx-4 flex flex-wrap gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[14px] sm:border">
        <button type="button" className={btn.primary} onClick={save} disabled={saving}>
          {saving ? "A guardar…" : "Guardar rascunho"}
        </button>
        <ConfirmButton
          className={btn.rose}
          confirmLabel="Abrir e partilhar?"
          disabled={saving || selected.length < 2}
          onConfirm={async () => {
            const id = await save();
            if (id) {
              const res = await run((t) => openPoll(t, id), "Votação aberta. Copia o link e partilha no grupo.");
              if (res.ok) onClose();
            }
          }}
        >
          Abrir votação
        </ConfirmButton>
      </div>
    </div>
  );
}

function PollCard({ poll, onEdit }: { poll: Poll; onEdit: () => void }) {
  const { data, run, notify } = useAdmin();
  const book = new Map(data.books.map((b) => [b.id, b]));
  const name = new Map(data.members.map((m) => [m.id, m.name]));
  const active = data.members.filter((m) => m.active);
  const [committee, setCommittee] = useState("");
  const [dinnerLocal, setDinnerLocal] = useState("");
  const [place, setPlace] = useState("");
  const result = poll.result;

  function copy() {
    const url = `${window.location.origin}/votar/${poll.id}`;
    navigator.clipboard.writeText(url).then(
      () => notify("Link da votação copiado."),
      () => notify(url),
    );
  }

  return (
    <li className={`${card} flex flex-col gap-5 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl text-ink">{poll.title}</h2>
            <StatusPill tone={poll.status === "aberta" ? "rose" : poll.status === "fechada" ? "ink" : "muted"}>{STATUS_LABEL[poll.status]}</StatusPill>
          </div>
          <p className="mt-1 text-sm text-ink-3">
            {poll.bookIds.length} livros, k = {poll.k}
            {poll.closesAt ? `, fecha ${formatDateTime(poll.closesAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {poll.status === "rascunho" && (
            <button type="button" className={btn.smallInk} onClick={onEdit}>
              Preparar
            </button>
          )}
          {poll.status !== "rascunho" && (
            <>
              <button type="button" className={btn.small} onClick={copy}>
                <Copy size={16} aria-hidden /> Link
              </button>
              <Link href={`/votar/${poll.id}/resultados`} target="_blank" className={btn.small}>
                Página pública
              </Link>
            </>
          )}
          <ConfirmButton confirmLabel="Apagar votação e votos?" onConfirm={() => run((t) => deletePoll(t, poll.id), "Votação apagada.")}>
            Apagar
          </ConfirmButton>
        </div>
      </div>

      {poll.status === "aberta" && (
        <div className="flex flex-col gap-3">
          <p className="text-[15px] text-ink">
            <span className="tabular font-mono">{poll.voterIds.length}</span> de {active.length} já votaram.
          </p>
          {poll.voterIds.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {poll.voterIds.map((v) => (
                <li key={v} className="inline-flex h-9 items-center gap-1 rounded-full border border-line bg-paper pl-3 pr-1 text-sm text-ink-2">
                  {name.get(v) ?? v}
                  <ConfirmButton
                    className="h-7 rounded-full px-2 text-xs text-rose hover:bg-rose-soft"
                    confirmLabel="Anular?"
                    onConfirm={() => run((t) => deleteBallot(t, poll.id, v), "Voto anulado. Essa pessoa pode votar outra vez.")}
                  >
                    anular
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          )}
          <div>
            <ConfirmButton className={btn.smallInk} confirmLabel="Fechar e contar votos?" onConfirm={() => run((t) => closePollNow(t, poll.id), "Votação fechada.")}>
              Fechar agora
            </ConfirmButton>
          </div>
        </div>
      )}

      {poll.status === "fechada" && result && (
        <div className="flex flex-col gap-5">
          <ol className="flex flex-col divide-y divide-line text-[15px]">
            {result.rows.slice(0, 5).map((r, i) => (
              <li key={r.bookId} className="flex items-center gap-3 py-2">
                <span className="tabular w-5 font-mono text-ink-3">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-ink">
                  {r.bookId === result.winnerId && <Crown size={16} weight="fill" className="mr-1 inline text-rose" aria-label="Vencedor" />}
                  {book.get(r.bookId)?.title ?? "Livro removido"}
                </span>
                <span className="tabular font-mono text-sm text-ink-3">{r.firsts}× 1.º</span>
                <span className="tabular w-10 text-right font-mono text-ink">{r.score}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-ink-3">
            {result.ballots} boletins. {result.method ? METHOD_LABEL[result.method] + "." : ""}
          </p>

          {!result.winnerId && result.tiedIds.length > 1 && (
            <div className="flex flex-col gap-4 rounded-[14px] bg-rose-soft p-4">
              <p className="text-[15px] text-ink">
                Empate entre {result.tiedIds.map((id) => book.get(id)?.title).join(" e ")}, mesmo nos primeiros lugares. Art. 4.º: decide o Comité ou a moeda.
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-56 flex-1">
                  <SelectInput label="Escolha do Comité" value={committee} onChange={(e) => setCommittee(e.target.value)}>
                    <option value="">Escolhe…</option>
                    {result.tiedIds.map((id) => (
                      <option key={id} value={id}>
                        {book.get(id)?.title}
                      </option>
                    ))}
                  </SelectInput>
                </div>
                <button
                  type="button"
                  className={btn.smallInk}
                  disabled={!committee}
                  onClick={() => run((t) => resolveTie(t, poll.id, "comite", committee), "Decisão do Comité registada.")}
                >
                  Registar decisão
                </button>
                <ConfirmButton
                  className={btn.small}
                  confirmLabel="Lançar a moeda?"
                  onConfirm={() => run((t) => resolveTie(t, poll.id, "moeda"), "Moeda lançada.")}
                >
                  <Coin size={16} aria-hidden /> {result.tiedIds.length === 2 ? "Moeda ao ar" : "Sorteio"}
                </ConfirmButton>
              </div>
            </div>
          )}

          {result.winnerId && !poll.promotedBookId && (
            <form
              className="flex flex-col gap-4 rounded-[14px] border border-ink p-4"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  (t) => promoteWinner(t, poll.id, dinnerLocal ? lisbonLocalToIso(dinnerLocal) : null, place),
                  "Temos próximo livro. O countdown já está a correr.",
                );
              }}
            >
              <p className="text-[15px] text-ink">
                Promover <strong>{book.get(result.winnerId)?.title}</strong> a próximo livro. Os restantes voltam para a fila.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Data do jantar (e limite de leitura)" type="datetime-local" value={dinnerLocal} onChange={(e) => setDinnerLocal(e.target.value)} />
                <TextInput label="Local" value={place} onChange={(e) => setPlace(e.target.value)} />
              </div>
              <div>
                <button type="submit" className={btn.rose}>
                  Promover a próximo livro
                </button>
              </div>
            </form>
          )}
          {poll.promotedBookId && <p className="text-sm text-ink-2">Promovido a próximo livro: {book.get(poll.promotedBookId)?.title}.</p>}
        </div>
      )}
    </li>
  );
}

export function PollsPanel() {
  const { data } = useAdmin();
  const [editing, setEditing] = useState<string | "novo" | null>(null);

  if (editing) {
    const poll = editing === "novo" ? undefined : data.polls.find((p) => p.id === editing);
    return <PollEditor key={editing} poll={poll} onClose={() => setEditing(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Votações</h1>
          <p className="mt-1 text-ink-3">Prepara os livros, abre, partilha o link no grupo e fecha. As contas do Art. 4.º são feitas aqui.</p>
        </div>
        <button type="button" className={btn.primary} onClick={() => setEditing("novo")}>
          <Plus size={18} aria-hidden /> Nova votação
        </button>
      </div>
      {data.polls.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-2xl text-ink">Nenhuma votação ainda.</p>
          <p className="mt-1 text-ink-3">Recolhe as propostas no WhatsApp e mete-as numa votação nova.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {data.polls.map((p) => (
            <PollCard key={p.id} poll={p} onEdit={() => setEditing(p.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
