import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarBlank, MapPin, Star } from "@phosphor-icons/react/dist/ssr";
import { BookCover } from "@/components/BookCover";
import { Stars } from "@/components/Stars";
import { btn, chip, container } from "@/components/ui";
import { getBook, getMembers, getReviewsForBook, getWines } from "@/lib/server/data";
import { average, formatRating, plural } from "@/lib/format";
import { formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(id);
  return { title: book?.title ?? "Livro" };
}

export default async function BookPage({ params }: Props) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book || book.status !== "lido") notFound();

  const [reviews, members, wines] = await Promise.all([getReviewsForBook(id), getMembers(), getWines()]);
  const name = new Map(members.map((m) => [m.id, m.name]));
  const avg = average(reviews);
  const bookWines = wines.filter((w) => w.bookId === id && w.image);
  const activeCount = members.filter((m) => m.active).length;

  return (
    <article className={`${container} pt-6 md:pt-10`}>
      <Link href="/estante" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> Estante
      </Link>

      <header className="mt-6 grid gap-8 md:grid-cols-[260px_minmax(0,1fr)] md:gap-12">
        <BookCover book={book} sizes="260px" priority className="max-w-[220px] md:max-w-none" />
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-display text-[2.6rem] leading-[1.05] text-ink md:text-6xl">{book.title}</h1>
            <p className="mt-2 text-lg text-ink-2">
              {book.author}
              {book.year ? <span className="text-ink-3">, {book.year}</span> : null}
            </p>
            {book.proposedBy && name.get(book.proposedBy) && (
              <p className="mt-1 text-sm text-ink-3">Proposto por {name.get(book.proposedBy)}</p>
            )}
          </div>

          <div className="flex items-end gap-4">
            <span className="tabular font-display text-7xl leading-none text-ink">{avg != null ? formatRating(avg) : "?"}</span>
            <div className="flex flex-col gap-1 pb-1.5">
              <Stars value={avg} size={22} />
              <span className="text-sm text-ink-3">
                Média do clube{reviews.length ? `, ${plural(reviews.length, "review", "reviews")}` : ", ainda sem reviews"}
              </span>
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-ink-2">
            {(book.dinnerAt || book.readAt) && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Data do jantar</dt>
                <CalendarBlank size={18} className="text-rose" aria-hidden />
                <dd>{formatDate(book.dinnerAt ?? book.readAt)}</dd>
              </div>
            )}
            {book.dinnerPlace && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Local</dt>
                <MapPin size={18} className="text-rose" aria-hidden />
                <dd>{book.dinnerPlace}</dd>
              </div>
            )}
          </dl>

          {reviews.length < activeCount && (
            <div>
              <Link href={`/review/${book.id}`} className={btn.primary}>
                <Star size={18} aria-hidden /> Deixar review
              </Link>
            </div>
          )}
        </div>
      </header>

      {(book.photos.length > 0 || book.attendees.length > 0 || bookWines.length > 0) && (
        <section className="mt-16 border-t border-line pt-10" aria-labelledby="jantar">
          <h2 id="jantar" className="font-display text-4xl text-ink">
            O jantar
          </h2>
          <p className="mt-1 text-ink-3">{[book.dinnerPlace, formatDate(book.dinnerAt ?? book.readAt)].filter(Boolean).join(", ")}</p>

          {book.photos.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
              {book.photos.map((p, i) => (
                <a
                  key={p.path}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`relative block overflow-hidden rounded-[14px] bg-paper-2 ${
                    i === 0 ? "col-span-2 aspect-[4/3] md:col-span-4 md:row-span-2" : "aspect-square md:col-span-2"
                  }`}
                >
                  <Image
                    src={p.url}
                    alt={`Fotografia ${i + 1} do jantar de ${book.title}`}
                    fill
                    sizes={i === 0 ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 50vw"}
                    className="object-cover transition duration-700 hover:scale-[1.03]"
                  />
                </a>
              ))}
            </div>
          )}

          <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {book.attendees.length > 0 && (
              <div>
                <h3 className="font-display text-2xl text-ink">À mesa</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {book.attendees.map((m) => (
                    <li key={m} className={chip}>
                      {name.get(m) ?? "Ex-membro"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {bookWines.length > 0 && (
              <div>
                <h3 className="font-display text-2xl text-ink">No copo</h3>
                <div className="relative mt-2">
                  {/* Prateleira por baixo das garrafas */}
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[calc(1rem+12rem)] h-3 rounded-full bg-gradient-to-b from-ink/20 to-ink/5" />
                  <ul className="relative flex snap-x overflow-x-auto pt-4 [scrollbar-width:none]">
                    {bookWines.map((w) => (
                      <li key={w.id} className="group flex w-24 shrink-0 snap-start flex-col sm:w-28">
                        <div className="relative mx-auto h-48 w-20 transition duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-2">
                          <Image
                            src={w.image!.url}
                            alt={w.name}
                            fill
                            sizes="80px"
                            className="object-contain object-bottom drop-shadow-[0_10px_12px_rgb(var(--shadow)/0.25)]"
                          />
                        </div>
                        <p className="mt-6 px-1.5 text-center text-xs leading-snug text-ink-2">{w.name}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mt-16 grid gap-12 border-t border-line pt-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          {book.synopsis && (
            <section aria-labelledby="sinopse">
              <h2 id="sinopse" className="font-display text-2xl text-ink">
                Sinopse
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{book.synopsis}</p>
            </section>
          )}
        </div>

        <section aria-labelledby="reviews">
          <h2 id="reviews" className="font-display text-3xl text-ink">
            Bitaites
          </h2>
          {reviews.length === 0 ? (
            <p className="mt-4 text-ink-2">Ninguém se pronunciou ainda. Sê o primeiro a estragar a média.</p>
          ) : (
            <ul className="mt-5 flex flex-col divide-y divide-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-5 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ink">{name.get(r.memberId) ?? "Ex-membro"}</span>
                    <span className="flex items-center gap-2">
                      <Stars value={r.rating} size={16} />
                      <span className="tabular font-mono text-sm text-ink-2">{formatRating(r.rating)}</span>
                    </span>
                  </div>
                  {r.text && <p className="mt-2 max-w-[65ch] whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{r.text}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}
