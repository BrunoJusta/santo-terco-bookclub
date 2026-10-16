import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarPlus, MapPin, Star } from "@phosphor-icons/react/dist/ssr";
import { Rosary } from "@/components/Rosary";
import { Countdown } from "@/components/Countdown";
import { Stars } from "@/components/Stars";
import { btn, card, container } from "@/components/ui";
import { getBooks, getMembers, getPolls, getReviews } from "@/lib/server/data";
import { average, formatRating, plural } from "@/lib/format";
import { formatDate, formatDateTime, yearInLisbon } from "@/lib/time";

export const dynamic = "force-dynamic";

const MIN_READS = 4;

export default async function AgoraPage() {
  const [books, members, polls, reviews] = await Promise.all([getBooks(), getMembers(), getPolls(), getReviews()]);
  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const active = members.filter((m) => m.active);

  const next = books.find((b) => b.status === "proximo") ?? null;
  const openPoll = polls.find((p) => p.status === "aberta") ?? null;
  const read = books.filter((b) => b.status === "lido").sort((a, b) => (b.readAt ?? "").localeCompare(a.readAt ?? ""));
  const last = read[0] ?? null;
  const lastReviews = last ? reviews.filter((r) => r.bookId === last.id) : [];
  const year = yearInLisbon();
  const readThisYear = read.filter((b) => b.readAt && yearInLisbon(b.readAt) === year).length;

  return (
    <>
      {/* Próximo livro */}
      <section className={`${container} pt-6 md:pt-12`}>
        {next ? (
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
            <Rosary cover={next.cover} title={next.title} className="max-w-[230px] sm:max-w-[320px] lg:max-w-[380px]" />
            <div className="rise flex flex-col gap-6">
              <div>
                <p className="text-sm font-medium text-rose">Próximo livro</p>
                <h1 className="mt-2 font-display text-[2.6rem] leading-[1.05] text-ink sm:text-5xl lg:text-6xl">{next.title}</h1>
                <p className="mt-3 text-lg text-ink-2">
                  {next.author}
                  {next.pages ? <span className="text-ink-3">, {next.pages} páginas</span> : null}
                </p>
                {next.proposedBy && memberName.get(next.proposedBy) && (
                  <p className="mt-1 text-sm text-ink-3">Proposto por {memberName.get(next.proposedBy)}</p>
                )}
              </div>

              {next.dinnerAt ? (
                <>
                  <Countdown target={next.dinnerAt} />
                  <div className="flex flex-col gap-1 text-ink-2">
                    <p className="text-[15px] first-letter:uppercase">
                      Ler até ao jantar de <span className="font-medium text-ink">{formatDateTime(next.dinnerAt)}</span>
                    </p>
                    {next.dinnerPlace && (
                      <p className="flex items-center gap-1.5 text-[15px]">
                        <MapPin size={18} aria-hidden className="text-rose" />
                        {next.dinnerPlace}
                      </p>
                    )}
                  </div>
                  <div>
                    <a href={`/api/ics/${next.id}`} className={btn.primary}>
                      <CalendarPlus size={20} aria-hidden />
                      Adicionar ao calendário
                    </a>
                  </div>
                </>
              ) : (
                <p className="max-w-[48ch] text-ink-2">A data do jantar ainda está a ser negociada pelo Comité. Vai lendo.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
            <Rosary cover={null} title="?" className="max-w-[220px] opacity-80 sm:max-w-[300px] lg:max-w-[340px]" />
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-4xl leading-[1.1] text-ink sm:text-5xl">O próximo livro ainda está em oração.</h1>
              <p className="max-w-[46ch] text-lg text-ink-2">
                {openPoll ? "A votação está aberta. Ordena os teus favoritos antes que feche." : "Assim que o Comité o anunciar, aparece aqui com a contagem até ao jantar."}
              </p>
              {openPoll && (
                <div>
                  <Link href={`/votar/${openPoll.id}`} className={btn.rose}>
                    Votar <ArrowRight size={18} aria-hidden />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Votação aberta (quando já há próximo livro, aparece como faixa) */}
      {openPoll && next && (
        <section className={`${container} reveal mt-14`}>
          <div className="flex flex-col gap-5 rounded-[14px] bg-ink p-6 text-paper dark:border dark:border-rose/40 dark:bg-paper-2 dark:text-ink sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="font-display text-3xl leading-tight">{openPoll.title}</h2>
              <p className="mt-1.5 text-paper/75 dark:text-ink-2">
                {openPoll.voterIds.length} de {active.length} já votaram
                {openPoll.closesAt ? `, fecha a ${formatDate(openPoll.closesAt)}` : ""}.
              </p>
            </div>
            <Link href={`/votar/${openPoll.id}`} className={`${btn.rose} self-start sm:self-auto`}>
              Votar <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* Leituras do ano, contadas como contas */}
      <section className={`${container} reveal mt-16`}>
        <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl text-ink">
              {readThisYear} {readThisYear === 1 ? "leitura" : "leituras"} em {year}
            </h2>
            <p className="mt-1 text-ink-2">
              {readThisYear >= MIN_READS
                ? "Mínimo do Art. 2.º cumprido. O Comité está orgulhoso."
                : `Faltam ${MIN_READS - readThisYear} para o mínimo de ${MIN_READS} do Art. 2.º.`}
            </p>
          </div>
          <div className="flex items-center gap-2" aria-hidden>
            {Array.from({ length: Math.max(MIN_READS, readThisYear) }).map((_, i) => (
              <span
                key={i}
                className={`h-7 w-7 rounded-full border ${
                  i < readThisYear ? "border-rose bg-[radial-gradient(circle_at_35%_30%,#fff_0%,#ffc2da_35%,#e2477f_100%)]" : "border-line bg-card"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Último jantar */}
      {last && (
        <section className={`${container} reveal mt-16`}>
          <div className="grid gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-center">
            <Link href={`/estante/${last.id}`} className="group relative block aspect-[4/3] overflow-hidden rounded-[14px] bg-paper-2">
              {last.photos[0] ? (
                <Image
                  src={last.photos[0].url}
                  alt={`Jantar de ${last.title}`}
                  fill
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover transition duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
                />
              ) : last.cover ? (
                <Image src={last.cover.url} alt={`Capa de ${last.title}`} fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover blur-[1px]" />
              ) : null}
            </Link>
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-ink-3">Último jantar</h2>
              <p className="font-display text-4xl leading-[1.08] text-ink">{last.title}</p>
              <div className="flex items-center gap-3">
                <Stars value={average(lastReviews)} size={22} />
                {lastReviews.length > 0 && (
                  <span className="tabular font-mono text-lg text-ink">{formatRating(average(lastReviews))}</span>
                )}
              </div>
              <p className="text-ink-2">
                {[last.dinnerPlace, formatDate(last.dinnerAt ?? last.readAt)].filter(Boolean).join(", ")}
                {last.attendees.length > 0 ? `. ${plural(last.attendees.length, "presente", "presentes")}.` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/estante/${last.id}`} className={btn.ghost}>
                  Ver jantar
                </Link>
                {lastReviews.length < active.length && (
                  <Link href={`/review/${last.id}`} className={btn.primary}>
                    <Star size={18} aria-hidden />
                    Deixar review
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
