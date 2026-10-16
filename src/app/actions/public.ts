"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { col, db } from "@/lib/server/firebase";
import { toBook, toMember, toPoll } from "@/lib/server/data";
import { normalizeRanking } from "@/lib/voting";
import { isValidRating } from "@/lib/format";
import type { ActionResult } from "@/lib/types";

class UserError extends Error {}

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof UserError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Algo correu mal. Tenta outra vez daqui a pouco." };
}

export async function submitBallot(pollId: string, memberId: string, ranking: string[]): Promise<ActionResult> {
  try {
    if (typeof pollId !== "string" || typeof memberId !== "string") throw new UserError("Pedido inválido.");
    const pollRef = col.polls().doc(pollId);
    const memberRef = col.members().doc(memberId);
    const ballotRef = col.ballots().doc(`${pollId}_${memberId}`);

    await db().runTransaction(async (tx) => {
      const [pollSnap, memberSnap, ballotSnap] = await Promise.all([tx.get(pollRef), tx.get(memberRef), tx.get(ballotRef)]);
      if (!pollSnap.exists) throw new UserError("Esta votação não existe.");
      const poll = toPoll(pollSnap);
      if (poll.status !== "aberta") throw new UserError("Esta votação já não está aberta.");
      if (poll.closesAt && new Date(poll.closesAt).getTime() <= Date.now()) throw new UserError("O prazo desta votação já terminou.");
      if (!memberSnap.exists || !toMember(memberSnap).active) throw new UserError("Membro não encontrado.");
      if (ballotSnap.exists || poll.voterIds.includes(memberId)) {
        throw new UserError("Este nome já votou. Se não foste tu, fala com um admin.");
      }
      const clean = normalizeRanking(ranking, poll.bookIds, poll.k);
      if (!clean) throw new UserError(`Ordena entre 1 e ${Math.min(poll.k, poll.bookIds.length)} livros.`);
      const now = new Date().toISOString();
      tx.create(ballotRef, { pollId, memberId, ranking: clean, createdAt: now });
      tx.update(pollRef, { voterIds: FieldValue.arrayUnion(memberId) });
    });

    revalidatePath(`/votar/${pollId}`);
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export async function submitReview(bookId: string, memberId: string, rating: number, text: string): Promise<ActionResult> {
  try {
    if (typeof bookId !== "string" || typeof memberId !== "string") throw new UserError("Pedido inválido.");
    if (!isValidRating(rating)) throw new UserError("Escolhe uma classificação entre 0,25 e 5 estrelas.");
    const body = typeof text === "string" ? text.trim().slice(0, 3000) : "";
    const bookRef = col.books().doc(bookId);
    const memberRef = col.members().doc(memberId);
    const reviewRef = col.reviews().doc(`${bookId}_${memberId}`);

    await db().runTransaction(async (tx) => {
      const [bookSnap, memberSnap, reviewSnap] = await Promise.all([tx.get(bookRef), tx.get(memberRef), tx.get(reviewRef)]);
      if (!bookSnap.exists || toBook(bookSnap).status !== "lido") throw new UserError("Este livro ainda não está marcado como lido.");
      if (!memberSnap.exists || !toMember(memberSnap).active) throw new UserError("Membro não encontrado.");
      if (reviewSnap.exists) throw new UserError("Este nome já deixou review. Se não foste tu, fala com um admin.");
      const now = new Date().toISOString();
      tx.create(reviewRef, { bookId, memberId, rating, text: body, source: "membro", createdAt: now, updatedAt: now });
    });

    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
