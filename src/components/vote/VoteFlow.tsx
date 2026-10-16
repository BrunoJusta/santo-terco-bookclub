"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { MemberPicker } from "@/components/MemberPicker";
import { RankingBoard, type VoteBook } from "./RankingBoard";
import { submitBallot } from "@/app/actions/public";
import { btn } from "@/components/ui";
import type { Member } from "@/lib/types";

type Step = "nome" | "ordenar" | "confirmar" | "feito";

export function VoteFlow({
  pollId,
  k,
  books,
  members,
  voterIds,
}: {
  pollId: string;
  k: number;
  books: VoteBook[];
  members: Member[];
  voterIds: string[];
}) {
  const [step, setStep] = useState<Step>("nome");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [ranked, setRanked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const name = (id: string | null) => members.find((m) => m.id === id)?.name ?? null;

  function submit() {
    if (!memberId) return;
    setError(null);
    start(async () => {
      const res = await submitBallot(pollId, memberId, ranked);
      if (res.ok) setStep("feito");
      else {
        setError(res.error);
        setStep("ordenar");
      }
    });
  }

  if (step === "feito") {
    return (
      <div className="flex flex-col items-start gap-4 py-10" role="status">
        <CheckCircle size={44} weight="fill" className="text-rose" aria-hidden />
        <h2 className="font-display text-4xl text-ink">Voto registado.</h2>
        <p className="max-w-[46ch] text-lg text-ink-2">Obrigado, {name(memberId)?.split(" ")[0]}. Que vença o livro com mais potencial de bitaite.</p>
        <Link href={`/votar/${pollId}/resultados`} className={btn.ghost}>
          Ver quem já votou
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p role="alert" className="rounded-[10px] border border-rose/40 bg-rose-soft px-4 py-3 text-[15px] text-ink">
          {error}
        </p>
      )}

      {step === "nome" && (
        <>
          <div>
            <h2 className="font-display text-2xl text-ink">Quem és tu?</h2>
            <p className="mt-1 text-sm text-ink-3">Um voto por membro. Ninguém vê a tua ordem, só que já votaste.</p>
          </div>
          <MemberPicker members={members} doneIds={voterIds} doneLabel="já votou" value={memberId} onChange={setMemberId} />
          <div>
            <button type="button" className={btn.primary} disabled={!memberId} onClick={() => setStep("ordenar")}>
              Continuar <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </>
      )}

      {step === "ordenar" && (
        <>
          <button type="button" onClick={() => setStep("nome")} className="inline-flex items-center gap-1.5 self-start text-sm text-ink-3 hover:text-ink">
            <ArrowLeft size={16} aria-hidden /> A votar como {name(memberId)}
          </button>
          <RankingBoard books={books} ranked={ranked} setRanked={setRanked} k={k} proposerName={name} />
          <div className="sticky bottom-20 z-[5] flex justify-end md:bottom-6">
            <button type="button" className={`${btn.rose} shadow-lg`} disabled={ranked.length === 0} onClick={() => setStep("confirmar")}>
              Rever voto <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </>
      )}

      {step === "confirmar" && (
        <div className="flex max-w-xl flex-col gap-5">
          <h2 className="font-display text-3xl text-ink">Confirmas, {name(memberId)?.split(" ")[0]}?</h2>
          <ol className="flex flex-col gap-1.5 text-[15px] text-ink-2">
            {ranked.map((id, i) => (
              <li key={id} className="flex gap-3">
                <span className="tabular w-6 font-mono text-ink">{i + 1}.</span>
                {books.find((b) => b.id === id)?.title}
              </li>
            ))}
          </ol>
          <p className="text-sm text-ink-3">Depois de submeter não dá para alterar. Só um admin pode anular um voto.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.rose} onClick={submit} disabled={pending}>
              {pending ? "A registar…" : "Submeter voto"}
            </button>
            <button type="button" className={btn.ghost} onClick={() => setStep("ordenar")} disabled={pending}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
