"use client";

import { useState } from "react";
import { Copy, PencilSimple, Plus } from "@phosphor-icons/react";
import { deleteReview, saveReview } from "@/app/actions/admin";
import { useAdmin } from "./context";
import { ConfirmButton, SectionTitle, SelectInput, StatusPill, TextArea } from "./bits";
import { StarInput } from "@/components/StarInput";
import { Stars } from "@/components/Stars";
import { Avatar } from "@/components/Avatar";
import { btn, field } from "@/components/ui";
import { average, formatRating } from "@/lib/format";
import type { Review } from "@/lib/types";

function ReviewEdit({ bookId, initial, onDone, takenIds }: { bookId: string; initial?: Review; onDone: () => void; takenIds: string[] }) {
  const { data, run } = useAdmin();
  const [memberId, setMemberId] = useState(initial?.memberId ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [text, setText] = useState(initial?.text ?? "");
  const [saving, setSaving] = useState(false);
  const options = data.members.filter((m) => m.id === initial?.memberId || !takenIds.includes(m.id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await run((t) => saveReview(t, { bookId, memberId, rating, text }), "Review guardada.");
    setSaving(false);
    if (res.ok) onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-[14px] border border-line bg-card p-4">
      <SelectInput label="Membro" value={memberId} onChange={(e) => setMemberId(e.target.value)} disabled={Boolean(initial)} required>
        <option value="">Escolhe…</option>
        {options.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.active ? "" : " (inativo)"}
          </option>
        ))}
      </SelectInput>
      <div className="flex flex-col gap-1.5">
        <span className={field.label}>Classificação</span>
        <StarInput id={`r-${initial?.id ?? "novo"}`} value={rating} onChange={setRating} />
      </div>
      <TextArea label="Texto" rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} />
      <div className="flex gap-2">
        <button type="submit" className={btn.smallInk} disabled={saving || !memberId || !rating}>
          {saving ? "A guardar…" : "Guardar review"}
        </button>
        <button type="button" className={btn.small} onClick={onDone}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ReviewsEditor({ bookId }: { bookId: string }) {
  const { data, run, notify } = useAdmin();
  const [editing, setEditing] = useState<string | "novo" | null>(null);
  const reviews = data.reviews.filter((r) => r.bookId === bookId).sort((a, b) => b.rating - a.rating);
  const name = new Map(data.members.map((m) => [m.id, m.name]));
  const avg = average(reviews);

  function copyLink() {
    const url = `${window.location.origin}/review/${bookId}`;
    navigator.clipboard.writeText(url).then(
      () => notify("Link das reviews copiado. Cola no grupo."),
      () => notify(url),
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.small} onClick={copyLink}>
              <Copy size={16} aria-hidden /> Link para membros
            </button>
            <button type="button" className={btn.smallInk} onClick={() => setEditing("novo")}>
              <Plus size={16} aria-hidden /> Review manual
            </button>
          </div>
        }
      >
        Reviews {avg != null && <span className="tabular font-mono text-lg text-ink-2">· média {formatRating(avg)}</span>}
      </SectionTitle>

      {editing === "novo" && <ReviewEdit bookId={bookId} onDone={() => setEditing(null)} takenIds={reviews.map((r) => r.memberId)} />}

      {reviews.length === 0 && editing !== "novo" && <p className="text-sm text-ink-3">Sem reviews. Partilha o link ou adiciona à mão.</p>}

      <ul className="flex flex-col divide-y divide-line">
        {reviews.map((r) =>
          editing === r.id ? (
            <li key={r.id} className="py-3">
              <ReviewEdit bookId={bookId} initial={r} onDone={() => setEditing(null)} takenIds={[]} />
            </li>
          ) : (
            <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Avatar member={data.members.find((m) => m.id === r.memberId)} size={28} />
                  <span className="font-medium text-ink">{name.get(r.memberId) ?? r.memberId}</span>
                  <Stars value={r.rating} size={14} />
                  <span className="tabular font-mono text-sm text-ink-2">{formatRating(r.rating)}</span>
                  {r.source === "admin" && <StatusPill tone="muted">manual</StatusPill>}
                </div>
                {r.text && <p className="mt-1 line-clamp-3 text-sm text-ink-2">{r.text}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className={btn.small} onClick={() => setEditing(r.id)}>
                  <PencilSimple size={16} aria-hidden /> Editar
                </button>
                <ConfirmButton onConfirm={() => run((t) => deleteReview(t, r.id), "Review apagada.")}>Apagar</ConfirmButton>
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
