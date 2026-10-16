import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { VoteFlow } from "@/components/vote/VoteFlow";
import { btn, container } from "@/components/ui";
import { getBooks, getMembers, getPoll } from "@/lib/server/data";
import { formatDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Votar" };

type Props = { params: Promise<{ id: string }> };

export default async function VotarPage({ params }: Props) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll || poll.status === "rascunho") notFound();

  if (poll.status === "fechada") {
    return (
      <div className={`${container} py-16`}>
        <h1 className="font-display text-5xl text-ink">{poll.title}</h1>
        <p className="mt-3 text-lg text-ink-2">Esta votação já fechou.</p>
        <Link href={`/votar/${poll.id}/resultados`} className={`${btn.primary} mt-6`}>
          Ver resultados
        </Link>
      </div>
    );
  }

  const [books, members] = await Promise.all([getBooks(), getMembers()]);
  const pollBooks = poll.bookIds
    .map((bid) => books.find((b) => b.id === bid))
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .map((b) => ({ id: b.id, title: b.title, author: b.author, coverUrl: b.cover?.url ?? null, pages: b.pages, proposedBy: b.proposedBy }));
  const active = members.filter((m) => m.active);

  return (
    <div className={`${container} pt-8 md:pt-14`}>
      <h1 className="font-display text-5xl leading-none text-ink md:text-6xl">{poll.title}</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-ink-2">
        Ordena até {Math.min(poll.k, pollBooks.length)} livros, do favorito para baixo.
        {poll.closesAt ? ` Fecha ${formatDateTime(poll.closesAt)}.` : ""}
      </p>
      <p className="mt-1 text-sm text-ink-3">
        {poll.voterIds.length} de {active.length} membros já votaram.
      </p>
      <div className="mt-10">
        <VoteFlow pollId={poll.id} k={poll.k} books={pollBooks} members={active} voterIds={poll.voterIds} />
      </div>
    </div>
  );
}
