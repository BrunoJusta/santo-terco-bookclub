import Image from "next/image";
import type { Book } from "@/lib/types";

/** Capa com proporção 2:3; sem imagem mostra o título composto como uma capa tipográfica. */
export function BookCover({
  book,
  sizes = "(min-width: 1024px) 220px, 45vw",
  className,
  priority,
}: {
  book: Pick<Book, "title" | "author" | "cover">;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-paper-2 shadow-[0_14px_30px_-16px_rgb(var(--shadow)/0.5)] ${className ?? ""}`}
    >
      {book.cover ? (
        <Image src={book.cover.url} alt={`Capa de ${book.title}`} fill sizes={sizes} className="object-cover" priority={priority} />
      ) : (
        <div className="flex h-full w-full flex-col justify-between bg-ink p-3 text-paper">
          <span className="font-display text-lg leading-tight">{book.title}</span>
          <span className="text-xs text-paper/70">{book.author}</span>
        </div>
      )}
    </div>
  );
}
