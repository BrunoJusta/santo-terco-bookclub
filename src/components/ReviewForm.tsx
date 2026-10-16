"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { MemberPicker } from "./MemberPicker";
import { StarInput } from "./StarInput";
import { submitReview } from "@/app/actions/public";
import { btn, field } from "./ui";
import type { Member } from "@/lib/types";

export function ReviewForm({ bookId, members, doneIds }: { bookId: string; members: Member[]; doneIds: string[] }) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [step, setStep] = useState<"nome" | "review" | "feito">("nome");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const who = members.find((m) => m.id === memberId)?.name;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    if (!rating) {
      setError("Escolhe pelo menos 0,25 estrelas. Até o pior livro merece um quarto de estrela.");
      return;
    }
    setError(null);
    start(async () => {
      const res = await submitReview(bookId, memberId, rating, text);
      if (res.ok) setStep("feito");
      else setError(res.error);
    });
  }

  if (step === "feito") {
    return (
      <div className="flex flex-col items-start gap-4 py-8" role="status">
        <CheckCircle size={44} weight="fill" className="text-rose" aria-hidden />
        <h2 className="font-display text-4xl text-ink">Bitaite registado.</h2>
        <Link href={`/estante/${bookId}`} className={btn.ghost}>
          Ver a média do clube
        </Link>
      </div>
    );
  }

  if (step === "nome") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Quem és tu?</h2>
          <p className="mt-1 text-sm text-ink-3">Uma review por membro. Depois de submeter, só um admin a pode alterar.</p>
        </div>
        <MemberPicker members={members} doneIds={doneIds} doneLabel="já deu" value={memberId} onChange={setMemberId} />
        <div>
          <button type="button" className={btn.primary} disabled={!memberId} onClick={() => setStep("review")}>
            Continuar <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-6">
      <button type="button" onClick={() => setStep("nome")} className="inline-flex items-center gap-1.5 self-start text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> Review de {who}
      </button>
      <div className="flex flex-col gap-2">
        <span className={field.label}>Classificação</span>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="texto" className={field.label}>
          O teu bitaite
        </label>
        <textarea
          id="texto"
          rows={6}
          maxLength={3000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={field.textarea}
          aria-describedby="texto-ajuda"
        />
        <span id="texto-ajuda" className={field.help}>
          Opcional. Sem spoilers, como manda o Art. 5.º.
        </span>
      </div>
      {error && (
        <p role="alert" className={field.error}>
          {error}
        </p>
      )}
      <div>
        <button type="submit" className={btn.rose} disabled={pending}>
          {pending ? "A enviar…" : "Submeter review"}
        </button>
      </div>
    </form>
  );
}
