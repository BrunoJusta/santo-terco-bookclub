import Link from "next/link";
import type { Metadata } from "next";
import { BookCover } from "@/components/BookCover";
import { Stars } from "@/components/Stars";
import { container } from "@/components/ui";
import { getBooks, getReviews } from "@/lib/server/data";
import { average, formatRating } from "@/lib/format";
import { formatShortDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estante" };

export default async function EstantePage() {
  const [books, reviews] = await Promise.all([getBooks(), getReviews()]);
  const read = books
    .filter((b) => b.status === "lido")
    .sort((a, b) => (b.readAt ?? "").localeCompare(a.readAt ?? ""))
    .map((b) => {
      const rs = reviews.filter((r) => r.bookId === b.id);
      return { book: b, avg: average(rs), count: rs.length };
    });

  const [featured, ...rest] = read;

  return (
    <div className={`${container} pt-8 md:pt-14`}>
      <h1 className="font-display text-5xl leading-none text-ink md:text-6xl">Estante</h1>
      <p className="mt-3 max-w-[52ch] text-lg text-ink-2">
        {read.length === 0
          ? "Ainda nenhum livro foi lido. A primeira prateleira espera por vocês."
          : `${read.length} ${read.length === 1 ? "livro lido" : "livros lidos"}, com jantar, bitaites e média do clube.`}
      </p>

      {featured && (
        <Link
          href={`/estante/${featured.book.id}`}
          className="group mt-10 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-end gap-5 border-b border-line pb-10 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-8"
        >
          <BookCover book={featured.book} sizes="200px" priority className="transition duration-500 group-hover:-translate-y-1" />
          <div className="flex flex-col gap-2 pb-1">
            <span className="text-sm text-ink-3">Lido mais recentemente</span>
            <span className="font-display text-3xl leading-[1.08] text-ink sm:text-5xl">{featured.book.title}</span>
            <span className="text-ink-2">{featured.book.author}</span>
            <span className="mt-2 flex items-center gap-2">
              <Stars value={featured.avg} size={20} />
              {featured.avg != null && <span className="tabular font-mono text-ink">{formatRating(featured.avg)}</span>}
            </span>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {rest.map(({ book, avg }) => (
            <li key={book.id} className="reveal">
              <Link href={`/estante/${book.id}`} className="group flex flex-col gap-3">
                <BookCover book={book} sizes="(min-width: 1024px) 200px, 45vw" className="transition duration-500 group-hover:-translate-y-1" />
                <div>
                  <p className="font-display text-xl leading-tight text-ink">{book.title}</p>
                  <p className="mt-0.5 text-sm text-ink-3">{book.author}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Stars value={avg} size={15} />
                    {avg != null && <span className="tabular font-mono text-sm text-ink-2">{formatRating(avg)}</span>}
                  </div>
                  {book.readAt && <p className="mt-1 text-xs text-ink-3">{formatShortDate(book.dinnerAt ?? book.readAt)}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
