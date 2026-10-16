"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { FieldValue, type CollectionReference } from "firebase-admin/firestore";
import { z } from "zod";
import { col, db } from "@/lib/server/firebase";
import { AuthError, ALLOWED_DOMAIN, bootstrapAdmins, requireAdmin } from "@/lib/server/auth";
import {
  closePoll,
  getAdminEmails,
  getBooks,
  getMembers,
  getPolls,
  getReviews,
  getRules,
  getWines,
  toBook,
  toPoll,
  toWine,
} from "@/lib/server/data";
import { deleteImage, importRemoteCover, MAX_UPLOAD_BYTES, saveImage, type UploadKind } from "@/lib/server/storage";
import { slugify, isValidRating } from "@/lib/format";
import { DEFAULT_K } from "@/lib/voting";
import { DEFAULT_RULES, SEED_MEMBERS } from "@/lib/default-rules";
import { DEFAULT_RULES, SEED_MEMBERS } from "@/lib/default-rules";
import { DEFAULT_RULES, SEED_MEMBERS } from "@/lib/default-rules";
import type { ActionResult, AdminData, Book, Photo, PollResult } from "@/lib/types";

class UserError extends Error {}

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof UserError || e instanceof AuthError) return { ok: false, error: e.message };
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Dados inválidos." };
  console.error(e);
  return { ok: false, error: e instanceof Error && e.message ? e.message : "Algo correu mal." };
}

function done<T>(data: T): { ok: true; data: T } {
  revalidatePath("/", "layout");
  return { ok: true, data };
}

const now = () => new Date().toISOString();

async function uniqueId(collection: CollectionReference, base: string): Promise<string> {
  const slug = slugify(base) || "item";
  let id = slug;
  for (let i = 2; (await collection.doc(id).get()).exists; i++) id = `${slug}-${i}`;
  return id;
}

/* ------------------------------------------------------------------ Sessão e dados */

export async function verifyAdmin(token: string): Promise<ActionResult<string>> {
  try {
    return { ok: true, data: await requireAdmin(token) };
  } catch (e) {
    return fail(e);
  }
}

export async function getAdminData(token: string): Promise<ActionResult<AdminData>> {
  try {
    const me = await requireAdmin(token);
    const [members, books, reviews, wines, polls, rules, admins] = await Promise.all([
      getMembers(),
      getBooks(),
      getReviews(),
      getWines(),
      getPolls(),
      getRules(),
      getAdminEmails(),
    ]);
    return { ok: true, data: { me, admins, bootstrapAdmins: bootstrapAdmins(), members, books, reviews, wines, polls, rules } };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Imagens */

export async function uploadImage(token: string, form: FormData): Promise<ActionResult<Photo>> {
  try {
    await requireAdmin(token);
    const file = form.get("file");
    const kind = String(form.get("kind")) as UploadKind;
    if (!(file instanceof Blob)) throw new UserError("Ficheiro em falta.");
    if (!["covers", "photos", "wines"].includes(kind)) throw new UserError("Tipo de imagem inválido.");
    if (file.size > MAX_UPLOAD_BYTES) throw new UserError("Imagem demasiado grande, mesmo depois de comprimida.");
    const width = Number(form.get("width")) || null;
    const height = Number(form.get("height")) || null;
    const photo = await saveImage(Buffer.from(await file.arrayBuffer()), file.type, kind, { width, height });
    return { ok: true, data: photo };
  } catch (e) {
    return fail(e);
  }
}

export async function importCover(token: string, url: string): Promise<ActionResult<Photo>> {
  try {
    await requireAdmin(token);
    return { ok: true, data: await importRemoteCover(url) };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Pesquisa de livros */

export interface BookSearchResult {
  source: "google" | "openlibrary";
  title: string;
  author: string;
  year: number | null;
  pages: number | null;
  synopsis: string;
  isbn: string;
  coverUrl: string | null;
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function searchGoogle(q: string): Promise<BookSearchResult[]> {
  const isIsbn = /^[\d-]{10,17}$/.test(q.replace(/\s/g, ""));
  const query = isIsbn ? `isbn:${q.replace(/[\s-]/g, "")}` : q;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: Array<{ volumeInfo?: Record<string, unknown> }> };
  return (json.items ?? []).map(({ volumeInfo: v = {} }) => {
    const ids = (v.industryIdentifiers as Array<{ type: string; identifier: string }> | undefined) ?? [];
    const links = (v.imageLinks as Record<string, string> | undefined) ?? {};
    const thumb = links.thumbnail || links.smallThumbnail || null;
    const year = typeof v.publishedDate === "string" ? Number(v.publishedDate.slice(0, 4)) || null : null;
    return {
      source: "google" as const,
      title: String(v.title ?? "") + (v.subtitle ? `: ${v.subtitle}` : ""),
      author: ((v.authors as string[] | undefined) ?? []).join(", "),
      year,
      pages: typeof v.pageCount === "number" ? v.pageCount : null,
      synopsis: typeof v.description === "string" ? stripHtml(v.description).slice(0, 1500) : "",
      isbn: ids.find((i) => i.type === "ISBN_13")?.identifier ?? ids.find((i) => i.type === "ISBN_10")?.identifier ?? "",
      coverUrl: thumb ? thumb.replace(/^http:/, "https:").replace("&edge=curl", "").replace("zoom=1", "zoom=2") : null,
    };
  });
}

async function searchOpenLibrary(q: string): Promise<BookSearchResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { docs?: Array<Record<string, unknown>> };
  return (json.docs ?? []).map((d) => ({
    source: "openlibrary" as const,
    title: String(d.title ?? ""),
    author: ((d.author_name as string[] | undefined) ?? []).slice(0, 3).join(", "),
    year: typeof d.first_publish_year === "number" ? d.first_publish_year : null,
    pages: typeof d.number_of_pages_median === "number" ? d.number_of_pages_median : null,
    synopsis: "",
    isbn: ((d.isbn as string[] | undefined) ?? []).find((i) => i.length === 13) ?? "",
    coverUrl: typeof d.cover_i === "number" ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
  }));
}

export async function searchBooks(token: string, query: string): Promise<ActionResult<BookSearchResult[]>> {
  try {
    await requireAdmin(token);
    const q = query.trim().slice(0, 200);
    if (q.length < 2) return { ok: true, data: [] };
    let results: BookSearchResult[] = [];
    try {
      results = await searchGoogle(q);
    } catch {
      results = [];
    }
    if (results.length === 0) results = await searchOpenLibrary(q).catch(() => []);
    return { ok: true, data: results.filter((r) => r.title) };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Livros */

const photoSchema = z.object({
  path: z.string().max(500),
  url: z.string().url().max(2000),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

const bookSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "O livro precisa de título.").max(300),
  author: z.string().trim().max(300).default(""),
  year: z.number().int().min(-3000).max(3000).nullable().default(null),
  pages: z.number().int().min(1).max(20000).nullable().default(null),
  synopsis: z.string().max(6000).default(""),
  isbn: z.string().max(20).default(""),
  cover: photoSchema.nullable().default(null),
  status: z.enum(["fila", "votacao", "proximo", "lido"]),
  proposedBy: z.string().nullable().default(null),
  dinnerAt: z.string().datetime().nullable().default(null),
  dinnerPlace: z.string().trim().max(300).default(""),
  readAt: z.string().datetime().nullable().default(null),
  attendees: z.array(z.string()).max(200).default([]),
  photos: z.array(photoSchema).max(80).default([]),
});

export type BookInput = z.input<typeof bookSchema>;

export async function saveBook(token: string, input: BookInput): Promise<ActionResult<Book>> {
  try {
    await requireAdmin(token);
    const data = bookSchema.parse(input);
    const ref = data.id ? col.books().doc(data.id) : col.books().doc(await uniqueId(col.books(), data.title));
    const prevSnap = await ref.get();
    const prev = prevSnap.exists ? toBook(prevSnap) : null;
    const ts = now();

    const readAt = data.status === "lido" ? data.readAt ?? prev?.readAt ?? data.dinnerAt ?? ts : null;

    const batch = db().batch();
    if (data.status === "proximo") {
      const others = await col.books().where("status", "==", "proximo").get();
      others.docs.filter((d) => d.id !== ref.id).forEach((d) => batch.update(d.ref, { status: "fila", updatedAt: ts }));
    }
    const { id: _ignored, ...rest } = data;
    batch.set(ref, { ...rest, readAt, updatedAt: ts, createdAt: prev?.createdAt || ts });
    await batch.commit();

    // Limpar imagens substituídas ou removidas
    if (prev) {
      if (prev.cover && prev.cover.path !== data.cover?.path) await deleteImage(prev.cover.path);
      const keep = new Set(data.photos.map((p) => p.path));
      await Promise.all(prev.photos.filter((p) => !keep.has(p.path)).map((p) => deleteImage(p.path)));
    }
    return done(toBook(await ref.get()));
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBook(token: string, bookId: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const ref = col.books().doc(bookId);
    const snap = await ref.get();
    if (!snap.exists) throw new UserError("Livro não encontrado.");
    const book = toBook(snap);
    const polls = await col.polls().where("bookIds", "array-contains", bookId).get();
    const active = polls.docs.map(toPoll).filter((p) => p.status !== "rascunho");
    if (active.length > 0) throw new UserError("Este livro faz parte de uma votação aberta ou fechada e não pode ser apagado.");

    const [reviews, wines] = await Promise.all([
      col.reviews().where("bookId", "==", bookId).get(),
      col.wines().where("bookId", "==", bookId).get(),
    ]);
    const batch = db().batch();
    reviews.docs.forEach((d) => batch.delete(d.ref));
    wines.docs.forEach((d) => batch.delete(d.ref));
    polls.docs.forEach((d) => batch.update(d.ref, { bookIds: FieldValue.arrayRemove(bookId) }));
    batch.delete(ref);
    await batch.commit();
    await Promise.all([
      deleteImage(book.cover?.path),
      ...book.photos.map((p) => deleteImage(p.path)),
      ...wines.docs.map((w) => deleteImage(toWine(w).image?.path)),
    ]);
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Reviews (manuais e moderação) */

const reviewSchema = z.object({
  bookId: z.string().min(1),
  memberId: z.string().min(1, "Escolhe o membro."),
  rating: z.number().refine(isValidRating, "Classificação entre 0,25 e 5, em passos de 0,25."),
  text: z.string().max(3000).default(""),
});

export async function saveReview(token: string, input: z.input<typeof reviewSchema>): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const data = reviewSchema.parse(input);
    const ref = col.reviews().doc(`${data.bookId}_${data.memberId}`);
    const prev = await ref.get();
    const ts = now();
    await ref.set({
      ...data,
      text: data.text.trim(),
      source: prev.exists ? prev.data()?.source ?? "admin" : "admin",
      createdAt: prev.exists ? prev.data()?.createdAt ?? ts : ts,
      updatedAt: ts,
    });
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteReview(token: string, reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    await col.reviews().doc(reviewId).delete();
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Vinhos */

const wineSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "O vinho precisa de nome.").max(200),
  image: photoSchema.nullable().default(null),
  bookId: z.string().nullable().default(null),
});

export async function saveWine(token: string, input: z.input<typeof wineSchema>): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const data = wineSchema.parse(input);
    const ref = data.id ? col.wines().doc(data.id) : col.wines().doc();
    const prev = await ref.get();
    const prevWine = prev.exists ? toWine(prev) : null;
    const { id: _ignored, ...rest } = data;
    await ref.set({ ...rest, createdAt: prevWine?.createdAt || now() });
    if (prevWine?.image && prevWine.image.path !== data.image?.path) await deleteImage(prevWine.image.path);
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWine(token: string, wineId: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const ref = col.wines().doc(wineId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      await deleteImage(toWine(snap).image?.path);
    }
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Membros */

const memberSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Nome demasiado curto.").max(120),
  founder: z.boolean().default(false),
  active: z.boolean().default(true),
  rodadas: z
    .array(
      z.object({
        id: z.string().min(1),
        motivo: z.string().trim().max(300),
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        paga: z.boolean(),
      }),
    )
    .max(200)
    .default([]),
});

export async function saveMember(token: string, input: z.input<typeof memberSchema>): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const data = memberSchema.parse(input);
    const ref = data.id ? col.members().doc(data.id) : col.members().doc(await uniqueId(col.members(), data.name));
    const prev = await ref.get();
    const { id: _ignored, ...rest } = data;
    await ref.set({ ...rest, createdAt: prev.data()?.createdAt ?? now() });
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMember(token: string, memberId: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const [reviews, attended, proposed, ballots] = await Promise.all([
      col.reviews().where("memberId", "==", memberId).limit(1).get(),
      col.books().where("attendees", "array-contains", memberId).limit(1).get(),
      col.books().where("proposedBy", "==", memberId).limit(1).get(),
      col.ballots().where("memberId", "==", memberId).limit(1).get(),
    ]);
    if (!reviews.empty || !attended.empty || !proposed.empty || !ballots.empty) {
      throw new UserError("Este membro tem histórico (reviews, jantares, propostas ou votos). Marca-o como inativo em vez de apagar.");
    }
    await col.members().doc(memberId).delete();
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Votações */

const pollSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Dá um nome à votação.").max(200),
  bookIds: z.array(z.string()).max(200),
  closesAt: z.string().datetime().nullable().default(null),
  k: z.number().int().min(1).max(50).default(DEFAULT_K),
});

export async function savePoll(token: string, input: z.input<typeof pollSchema>): Promise<ActionResult<string>> {
  try {
    await requireAdmin(token);
    const data = pollSchema.parse(input);
    const ref = data.id ? col.polls().doc(data.id) : col.polls().doc();
    const prev = await ref.get();
    if (prev.exists && toPoll(prev).status !== "rascunho") {
      // Depois de aberta só se pode mudar o título e o prazo.
      await ref.update({ title: data.title, closesAt: data.closesAt });
      return done(ref.id);
    }
    const { id: _ignored, ...rest } = data;
    await ref.set({
      ...rest,
      bookIds: [...new Set(data.bookIds)],
      status: "rascunho",
      voterIds: [],
      result: null,
      promotedBookId: null,
      createdAt: prev.data()?.createdAt ?? now(),
      openedAt: null,
      closedAt: null,
    });
    return done(ref.id);
  } catch (e) {
    return fail(e);
  }
}

export async function openPoll(token: string, pollId: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const ref = col.polls().doc(pollId);
    const poll = toPoll(await ref.get());
    if (poll.status !== "rascunho") throw new UserError("Esta votação já foi aberta.");
    if (poll.bookIds.length < 2) throw new UserError("Uma votação precisa de pelo menos 2 livros.");
    if (poll.closesAt && new Date(poll.closesAt).getTime() <= Date.now()) throw new UserError("A data de fecho já passou.");
    const batch = db().batch();
    const ts = now();
    for (const id of poll.bookIds) {
      const b = await col.books().doc(id).get();
      if (b.exists && toBook(b).status === "fila") batch.update(b.ref, { status: "votacao", updatedAt: ts });
    }
    batch.update(ref, { status: "aberta", openedAt: ts });
    await batch.commit();
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function closePollNow(token: string, pollId: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    await closePoll(pollId);
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBallot(token: string, pollId: string, memberId: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const poll = toPoll(await col.polls().doc(pollId).get());
    if (poll.status !== "aberta") throw new UserError("Só é possível anular votos enquanto a votação está aberta.");
    const batch = db().batch();
    batch.delete(col.ballots().doc(`${pollId}_${memberId}`));
    batch.update(col.polls().doc(pollId), { voterIds: FieldValue.arrayRemove(memberId) });
    await batch.commit();
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function resolveTie(
  token: string,
  pollId: string,
  mode: "comite" | "moeda",
  bookId?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const ref = col.polls().doc(pollId);
    const poll = toPoll(await ref.get());
    const result = poll.result;
    if (poll.status !== "fechada" || !result) throw new UserError("A votação ainda não está fechada.");
    if (result.winnerId) throw new UserError("Esta votação já tem vencedor.");
    if (result.tiedIds.length < 2) throw new UserError("Não há empate para resolver.");
    let next: PollResult;
    if (mode === "comite") {
      if (!bookId || !result.tiedIds.includes(bookId)) throw new UserError("Escolhe um dos livros empatados.");
      next = { ...result, winnerId: bookId, method: "comite" };
    } else if (result.tiedIds.length === 2) {
      const [cara, coroa] = result.tiedIds;
      const outcome = randomInt(2) === 0 ? "cara" : "coroa";
      next = { ...result, winnerId: outcome === "cara" ? cara : coroa, method: "moeda", coin: { cara, coroa, outcome } };
    } else {
      next = { ...result, winnerId: result.tiedIds[randomInt(result.tiedIds.length)], method: "sorteio" };
    }
    await ref.update({ result: next });
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function promoteWinner(
  token: string,
  pollId: string,
  dinnerAt: string | null,
  dinnerPlace: string,
): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const ref = col.polls().doc(pollId);
    const poll = toPoll(await ref.get());
    const winner = poll.result?.winnerId;
    if (!winner) throw new UserError("Ainda não há vencedor.");
    if (dinnerAt && Number.isNaN(new Date(dinnerAt).getTime())) throw new UserError("Data do jantar inválida.");
    const ts = now();
    const batch = db().batch();
    const current = await col.books().where("status", "==", "proximo").get();
    current.docs.filter((d) => d.id !== winner).forEach((d) => batch.update(d.ref, { status: "fila", updatedAt: ts }));
    for (const id of poll.bookIds) {
      if (id === winner) continue;
      const b = await col.books().doc(id).get();
      if (b.exists && toBook(b).status === "votacao") batch.update(b.ref, { status: "fila", updatedAt: ts });
    }
    batch.update(col.books().doc(winner), { status: "proximo", dinnerAt, dinnerPlace: dinnerPlace.trim(), updatedAt: ts });
    batch.update(ref, { promotedBookId: winner });
    await batch.commit();
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function deletePoll(token: string, pollId: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const ref = col.polls().doc(pollId);
    const poll = toPoll(await ref.get());
    const ballots = await col.ballots().where("pollId", "==", pollId).get();
    const batch = db().batch();
    ballots.docs.forEach((d) => batch.delete(d.ref));
    if (!poll.promotedBookId) {
      for (const id of poll.bookIds) {
        const b = await col.books().doc(id).get();
        if (b.exists && toBook(b).status === "votacao") batch.update(b.ref, { status: "fila", updatedAt: now() });
      }
    }
    batch.delete(ref);
    await batch.commit();
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Regulamento */

const rulesSchema = z.array(
  z.object({ id: z.string().min(1), title: z.string().trim().min(1, "Cada artigo precisa de título.").max(200), body: z.string().max(20000) }),
);

export async function saveRules(token: string, articles: z.input<typeof rulesSchema>): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const data = rulesSchema.parse(articles);
    await col.config().doc("regulamento").set({ articles: data, updatedAt: now() });
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Admins */

export async function addAdmin(token: string, email: string): Promise<ActionResult> {
  try {
    await requireAdmin(token);
    const e = email.trim().toLowerCase();
    if (!z.string().email().safeParse(e).success || !e.endsWith(`@${ALLOWED_DOMAIN}`)) {
      throw new UserError(`Usa um email @${ALLOWED_DOMAIN}.`);
    }
    await col.config().doc("admins").set({ emails: FieldValue.arrayUnion(e) }, { merge: true });
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

export async function removeAdmin(token: string, email: string): Promise<ActionResult> {
  try {
    const me = await requireAdmin(token);
    const e = email.trim().toLowerCase();
    if (e === me) throw new UserError("Não te podes remover a ti próprio.");
    if (bootstrapAdmins().includes(e)) throw new UserError("Este admin está definido no Vercel (ADMIN_BOOTSTRAP_EMAILS).");
    await col.config().doc("admins").set({ emails: FieldValue.arrayRemove(e) }, { merge: true });
    return done(null);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Dados iniciais */

/** Carrega os 16 membros do Anexo I e o regulamento 2026. Não duplica nem apaga nada. */
export async function seedInitialData(token: string): Promise<ActionResult<number>> {
  try {
    const me = await requireAdmin(token);
    const existing = await col.members().get();
    const names = new Set(existing.docs.map((d) => String(d.data().name)));
    const ts = now();
    const batch = db().batch();
    let added = 0;
    for (const m of SEED_MEMBERS) {
      if (names.has(m.name)) continue;
      batch.set(col.members().doc(slugify(m.name)), { ...m, active: true, rodadas: [], createdAt: ts });
      added++;
    }
    const rulesRef = col.config().doc("regulamento");
    if (!(await rulesRef.get()).exists) batch.set(rulesRef, { ...DEFAULT_RULES, updatedAt: ts });
    batch.set(col.config().doc("admins"), { emails: FieldValue.arrayUnion(me) }, { merge: true });
    await batch.commit();
    return done(added);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Dados iniciais */

/** Carrega os 16 membros do Anexo I e o regulamento 2026. Não duplica nem apaga nada. */
export async function seedInitialData(token: string): Promise<ActionResult<number>> {
  try {
    const me = await requireAdmin(token);
    const existing = await col.members().get();
    const names = new Set(existing.docs.map((d) => String(d.data().name)));
    const ts = now();
    const batch = db().batch();
    let added = 0;
    for (const m of SEED_MEMBERS) {
      if (names.has(m.name)) continue;
      batch.set(col.members().doc(slugify(m.name)), { ...m, active: true, rodadas: [], createdAt: ts });
      added++;
    }
    const rulesRef = col.config().doc("regulamento");
    if (!(await rulesRef.get()).exists) batch.set(rulesRef, { ...DEFAULT_RULES, updatedAt: ts });
    batch.set(col.config().doc("admins"), { emails: FieldValue.arrayUnion(me) }, { merge: true });
    await batch.commit();
    return done(added);
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ Dados iniciais */

/** Carrega os 16 membros do Anexo I e o regulamento 2026. Não duplica nem apaga nada. */
export async function seedInitialData(token: string): Promise<ActionResult<number>> {
  try {
    const me = await requireAdmin(token);
    const existing = await col.members().get();
    const names = new Set(existing.docs.map((d) => String(d.data().name)));
    const ts = now();
    const batch = db().batch();
    let added = 0;
    for (const m of SEED_MEMBERS) {
      if (names.has(m.name)) continue;
      batch.set(col.members().doc(slugify(m.name)), { ...m, active: true, rodadas: [], createdAt: ts });
      added++;
    }
    const rulesRef = col.config().doc("regulamento");
    if (!(await rulesRef.get()).exists) batch.set(rulesRef, { ...DEFAULT_RULES, updatedAt: ts });
    batch.set(col.config().doc("admins"), { emails: FieldValue.arrayUnion(me) }, { merge: true });
    await batch.commit();
    return done(added);
  } catch (e) {
    return fail(e);
  }
}
