import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { col, db } from "./firebase";
import { computeResult, DEFAULT_K } from "../voting";
import type { Book, BookStatus, Member, Photo, Poll, Review, Rules, Wine } from "../types";
import { DEFAULT_RULES } from "../default-rules";

type Data = Record<string, unknown>;

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const strOrNull = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function photo(v: unknown): Photo | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Data;
  if (typeof p.url !== "string") return null;
  return { path: str(p.path), url: p.url, width: num(p.width), height: num(p.height) };
}

export function toMember(s: DocumentSnapshot): Member {
  const d = (s.data() ?? {}) as Data;
  return {
    id: s.id,
    name: str(d.name, "Sem nome"),
    founder: d.founder === true,
    active: d.active !== false,
    rodadas: arr<Member["rodadas"][number]>(d.rodadas),
    createdAt: str(d.createdAt),
  };
}

const STATUSES: BookStatus[] = ["fila", "votacao", "proximo", "lido"];

export function toBook(s: DocumentSnapshot): Book {
  const d = (s.data() ?? {}) as Data;
  return {
    id: s.id,
    title: str(d.title, "Sem título"),
    author: str(d.author),
    year: num(d.year),
    pages: num(d.pages),
    synopsis: str(d.synopsis),
    isbn: str(d.isbn),
    cover: photo(d.cover),
    status: STATUSES.includes(d.status as BookStatus) ? (d.status as BookStatus) : "fila",
    proposedBy: strOrNull(d.proposedBy),
    dinnerAt: strOrNull(d.dinnerAt),
    dinnerPlace: str(d.dinnerPlace),
    readAt: strOrNull(d.readAt),
    attendees: arr<string>(d.attendees),
    photos: arr<unknown>(d.photos).map(photo).filter((p): p is Photo => p !== null),
    createdAt: str(d.createdAt),
    updatedAt: str(d.updatedAt),
  };
}

export function toReview(s: DocumentSnapshot): Review {
  const d = (s.data() ?? {}) as Data;
  return {
    id: s.id,
    bookId: str(d.bookId),
    memberId: str(d.memberId),
    rating: num(d.rating) ?? 0,
    text: str(d.text),
    source: d.source === "admin" ? "admin" : "membro",
    createdAt: str(d.createdAt),
    updatedAt: str(d.updatedAt),
  };
}

export function toWine(s: DocumentSnapshot): Wine {
  const d = (s.data() ?? {}) as Data;
  return {
    id: s.id,
    name: str(d.name),
    image: photo(d.image),
    bookId: strOrNull(d.bookId),
    createdAt: str(d.createdAt),
  };
}

export function toPoll(s: DocumentSnapshot): Poll {
  const d = (s.data() ?? {}) as Data;
  const status = d.status === "aberta" || d.status === "fechada" ? d.status : "rascunho";
  return {
    id: s.id,
    title: str(d.title, "Votação"),
    status,
    bookIds: arr<string>(d.bookIds),
    k: num(d.k) ?? DEFAULT_K,
    closesAt: strOrNull(d.closesAt),
    voterIds: arr<string>(d.voterIds),
    result: (d.result as Poll["result"]) ?? null,
    promotedBookId: strOrNull(d.promotedBookId),
    createdAt: str(d.createdAt),
    openedAt: strOrNull(d.openedAt),
    closedAt: strOrNull(d.closedAt),
  };
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "pt");

export async function getMembers(): Promise<Member[]> {
  const snap = await col.members().get();
  return snap.docs.map(toMember).sort(byName);
}

export async function getBooks(): Promise<Book[]> {
  const snap = await col.books().get();
  return snap.docs.map(toBook);
}

export async function getBook(id: string): Promise<Book | null> {
  const s = await col.books().doc(id).get();
  return s.exists ? toBook(s) : null;
}

export async function getReviews(): Promise<Review[]> {
  const snap = await col.reviews().get();
  return snap.docs.map(toReview);
}

export async function getReviewsForBook(bookId: string): Promise<Review[]> {
  const snap = await col.reviews().where("bookId", "==", bookId).get();
  return snap.docs.map(toReview).sort((a, b) => b.rating - a.rating);
}

export async function getWines(): Promise<Wine[]> {
  const snap = await col.wines().get();
  return snap.docs.map(toWine);
}

export async function getRules(): Promise<Rules> {
  const s = await col.config().doc("regulamento").get();
  const d = s.data();
  if (!d || !Array.isArray(d.articles)) return DEFAULT_RULES;
  return { articles: d.articles, updatedAt: str(d.updatedAt, DEFAULT_RULES.updatedAt) };
}

export async function getAdminEmails(): Promise<string[]> {
  const s = await col.config().doc("admins").get();
  return arr<string>(s.data()?.emails).map((e) => e.toLowerCase());
}

/** Fecha automaticamente uma votação cujo prazo já passou. */
export async function closePollIfExpired(poll: Poll): Promise<Poll> {
  if (poll.status !== "aberta" || !poll.closesAt || new Date(poll.closesAt).getTime() > Date.now()) return poll;
  return closePoll(poll.id);
}

export async function closePoll(pollId: string): Promise<Poll> {
  const ref = col.polls().doc(pollId);
  await db().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    const poll = toPoll(s);
    if (!s.exists || poll.status !== "aberta") return;
    const ballotsSnap = await tx.get(col.ballots().where("pollId", "==", pollId));
    const ballots = ballotsSnap.docs.map((b) => arr<string>(b.data().ranking));
    const result = computeResult(poll.bookIds, ballots, poll.k);
    tx.update(ref, { status: "fechada", closedAt: new Date().toISOString(), result });
  });
  return toPoll(await ref.get());
}

export async function getPolls(): Promise<Poll[]> {
  const snap = await col.polls().get();
  const polls = await Promise.all(snap.docs.map(toPoll).map(closePollIfExpired));
  return polls.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPoll(id: string): Promise<Poll | null> {
  const s = await col.polls().doc(id).get();
  if (!s.exists) return null;
  return closePollIfExpired(toPoll(s));
}
