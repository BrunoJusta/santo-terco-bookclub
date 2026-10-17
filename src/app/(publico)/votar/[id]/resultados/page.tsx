import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Crown } from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/Avatar";
import { BookCover } from "@/components/BookCover";
import { CoinFlip } from "@/components/CoinFlip";
import { btn, chip, container } from "@/components/ui";
import { getBooks, getMembers, getPoll } from "@/lib/server/data";
import { METHOD_LABEL } from "@/lib/voting";
import { formatDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resultados" };

type Props = { params: Promise<{ id: string }> };

export default async function ResultadosPage({ params }: Props) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll || poll.status === "rascunho") notFound();
  const [books, members] = await Promise.all([getBooks(), getMembers()]);
  const book = new Map(books.map((b) => [b.id, b]));
  const name = new Map(members.map((m) => [m.id, m.name]));
  const active = members.filter((m) => m.active);
  const result = poll.result;

  return (
    <div className={`${container} pt-8 md:pt-14`}>
      <h1 className="font-display text-5xl leading-none text-ink md:text-6xl">{poll.title}</h1>

      {poll.status === "aberta" || !result ? (
        <section className="mt-6">
          <p className="max-w-[56ch] text-lg text-ink-2">
            A votação ainda está aberta{poll.closesAt ? ` até ${formatDateTime(poll.closesAt)}` : ""}. Os resultados aparecem aqui quando fechar.
          </p>
          <h2 className="mt-10 font-display text-2xl text-ink">
            Já votaram {poll.voterIds.length} de {active.length}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {poll.voterIds.map((v) => (
              <li key={v} className={`${chip} pl-1`}>
                <Avatar member={members.find((m) => m.id === v)} size={24} />
                {name.get(v) ?? "Ex-membro"}
              </li>
            ))}
          </ul>
          {active.some((m) => !poll.voterIds.includes(m.id)) && (
            <p className="mt-6 text-sm text-ink-3">
              Falta: {active.filter((m) => !poll.voterIds.includes(m.id)).map((m) => m.name.split(" ")[0]).join(", ")}.
            </p>
          )}
          <Link href={`/votar/${poll.id}`} className={`${btn.rose} mt-8`}>
            Votar
          </Link>
        </section>
      ) : (
        <>
          <p className="mt-3 text-lg text-ink-2">
            {result.ballots} {result.ballots === 1 ? "boletim" : "boletins"}, k = {poll.k}.{" "}
            {result.method ? METHOD_LABEL[result.method] + "." : result.tiedIds.length > 1 ? "Empate. Aguarda a intervenção do Comité de Founders." : ""}
          </p>

          {result.winnerId && book.get(result.winnerId) && (
            <section className="mt-10 grid grid-cols-[120px_minmax(0,1fr)] items-end gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8">
              <BookCover book={book.get(result.winnerId)!} sizes="180px" priority />
              <div className="pb-1">
                <p className="flex items-center gap-1.5 text-sm font-medium text-rose">
                  <Crown size={18} weight="fill" aria-hidden /> Vencedor
                </p>
                <p className="mt-1 font-display text-3xl leading-[1.08] text-ink sm:text-5xl">{book.get(result.winnerId)!.title}</p>
                <p className="mt-1 text-ink-2">{book.get(result.winnerId)!.author}</p>
              </div>
            </section>
          )}

          {result.coin && (
            <section className="mt-10" aria-label="Moeda ao ar">
              <CoinFlip
                cara={book.get(result.coin.cara)?.title ?? "Cara"}
                coroa={book.get(result.coin.coroa)?.title ?? "Coroa"}
                outcome={result.coin.outcome}
              />
            </section>
          )}

          <section className="mt-12" aria-labelledby="classificacao">
            <h2 id="classificacao" className="font-display text-2xl text-ink">
              Classificação
            </h2>
            <ol className="mt-4 flex flex-col divide-y divide-line">
              {result.rows.map((r, i) => {
                const b = book.get(r.bookId);
                const isWinner = r.bookId === result.winnerId;
                const isTied = result.tiedIds.includes(r.bookId);
                return (
                  <li key={r.bookId} className="flex items-center gap-4 py-3.5">
                    <span className="tabular w-7 shrink-0 font-mono text-lg text-ink-3">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[15px] ${isWinner ? "font-semibold text-ink" : "text-ink"}`}>{b?.title ?? "Livro removido"}</p>
                      <p className="truncate text-sm text-ink-3">
                        {b?.author}
                        {isTied && !result.winnerId ? ", empatado" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-4 text-right">
                      <span className="tabular font-mono text-sm text-ink-3" title="Primeiros lugares">
                        {r.firsts}× 1.º
                      </span>
                      <span className="tabular w-14 font-mono text-xl text-ink">{r.score}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-xs text-ink-3">S(b) = soma de max(0, k + 1 - posição) de todos os boletins. Os boletins individuais nunca são mostrados.</p>
          </section>
        </>
      )}
    </div>
  );
}
