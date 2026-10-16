import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookCover } from "@/components/BookCover";
import { ReviewForm } from "@/components/ReviewForm";
import { container } from "@/components/ui";
import { getBook, getMembers, getReviewsForBook } from "@/lib/server/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Deixar review" };

type Props = { params: Promise<{ id: string }> };

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book || book.status !== "lido") notFound();
  const [members, reviews] = await Promise.all([getMembers(), getReviewsForBook(id)]);
  const active = members.filter((m) => m.active);

  return (
    <div className={`${container} pt-8 md:pt-14`}>
      <div className="grid grid-cols-[88px_minmax(0,1fr)] items-end gap-5 sm:grid-cols-[120px_minmax(0,1fr)]">
        <BookCover book={book} sizes="120px" priority />
        <div className="pb-1">
          <p className="text-sm text-ink-3">Review de</p>
          <h1 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">{book.title}</h1>
          <p className="mt-1 text-ink-2">{book.author}</p>
        </div>
      </div>
      <div className="mt-10">
        <ReviewForm bookId={book.id} members={active} doneIds={reviews.map((r) => r.memberId)} />
      </div>
    </div>
  );
}
