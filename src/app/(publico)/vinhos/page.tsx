import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { container } from "@/components/ui";
import { getBooks, getWines } from "@/lib/server/data";
import { formatShortDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vinhos" };

export default async function VinhosPage() {
  const [books, wines] = await Promise.all([getBooks(), getWines()]);
  const shelves = books
    .filter((b) => b.status === "lido")
    .sort((a, b) => (b.readAt ?? "").localeCompare(a.readAt ?? ""))
    .map((book) => ({ book, wines: wines.filter((w) => w.bookId === book.id && w.image) }))
    .filter((s) => s.wines.length > 0);
  const total = shelves.reduce((n, s) => n + s.wines.length, 0);

  return (
    <div className={`${container} pt-8 md:pt-14`}>
      <h1 className="font-display text-5xl leading-none text-ink md:text-6xl">Vinhos</h1>
      <p className="mt-3 max-w-[52ch] text-lg text-ink-2">
        {total === 0
          ? "A garrafeira ainda está vazia. O primeiro jantar trata disso."
          : `${total} ${total === 1 ? "garrafa aberta" : "garrafas abertas"} em nome da literatura. Sogrape, naturalmente.`}
      </p>

      <div className="mt-12 flex flex-col gap-14">
        {shelves.map(({ book, wines: ws }) => (
          <section key={book.id} aria-labelledby={`shelf-${book.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`shelf-${book.id}`} className="font-display text-2xl text-ink">
                <Link href={`/estante/${book.id}`} className="hover:text-rose">
                  {book.title}
                </Link>
              </h2>
              <span className="text-sm text-ink-3">
                {[book.dinnerPlace, formatShortDate(book.dinnerAt ?? book.readAt)].filter(Boolean).join(", ")}
              </span>
            </div>
            <ul className="mt-4 flex snap-x overflow-x-auto pt-6 [scrollbar-width:none]">
              {ws.map((w) => (
                <li key={w.id} className="group flex w-28 shrink-0 snap-start flex-col sm:w-32">
                  <div className="relative mx-auto h-52 w-20 transition duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-2 sm:h-60 sm:w-24">
                    <Image
                      src={w.image!.url}
                      alt={w.name}
                      fill
                      sizes="96px"
                      className="object-contain object-bottom drop-shadow-[0_10px_12px_rgb(var(--shadow)/0.25)]"
                    />
                  </div>
                  {/* Segmento da prateleira: os segmentos encostam uns aos outros */}
                  <div aria-hidden className="h-3 bg-gradient-to-b from-ink/20 to-ink/5" />
                  <p className="mt-3 px-2 text-center text-xs leading-snug text-ink-2">{w.name}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
