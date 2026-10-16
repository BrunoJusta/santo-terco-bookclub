export type BookStatus = "fila" | "votacao" | "proximo" | "lido";

export const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
  fila: "Na fila",
  votacao: "Em votação",
  proximo: "Próximo",
  lido: "Lido",
};

export interface Photo {
  path: string;
  url: string;
  width?: number | null;
  height?: number | null;
}

export interface Rodada {
  id: string;
  motivo: string;
  data: string; // YYYY-MM-DD
  paga: boolean;
}

export interface Member {
  id: string;
  name: string;
  founder: boolean;
  active: boolean;
  rodadas: Rodada[];
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number | null;
  pages: number | null;
  synopsis: string;
  isbn: string;
  cover: Photo | null;
  status: BookStatus;
  proposedBy: string | null;
  /** Data e hora do jantar, que é também a data limite de leitura (ISO, UTC). */
  dinnerAt: string | null;
  dinnerPlace: string;
  readAt: string | null;
  attendees: string[];
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string; // `${bookId}_${memberId}`
  bookId: string;
  memberId: string;
  rating: number; // 0.25 a 5, em passos de 0.25
  text: string;
  source: "membro" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface Wine {
  id: string;
  name: string;
  image: Photo | null;
  bookId: string | null;
  createdAt: string;
}

export type PollStatus = "rascunho" | "aberta" | "fechada";

export type TieMethod = "pontos" | "primeiros" | "comite" | "moeda" | "sorteio";

export interface PollRow {
  bookId: string;
  score: number;
  firsts: number;
}

export interface PollResult {
  rows: PollRow[];
  ballots: number;
  winnerId: string | null;
  method: TieMethod | null;
  /** Livros empatados depois das regras automáticas (vazio se não houver empate). */
  tiedIds: string[];
  coin: { cara: string; coroa: string; outcome: "cara" | "coroa" } | null;
  computedAt: string;
}

export interface Poll {
  id: string;
  title: string;
  status: PollStatus;
  bookIds: string[];
  k: number;
  closesAt: string | null;
  voterIds: string[];
  result: PollResult | null;
  promotedBookId: string | null;
  createdAt: string;
  openedAt: string | null;
  closedAt: string | null;
}

export interface RuleArticle {
  id: string;
  title: string;
  body: string; // markdown, com fórmulas em $...$
}

export interface Rules {
  articles: RuleArticle[];
  updatedAt: string;
}

export interface AdminData {
  me: string;
  admins: string[];
  bootstrapAdmins: string[];
  members: Member[];
  books: Book[];
  reviews: Review[];
  wines: Wine[];
  polls: Poll[];
  rules: Rules;
}

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };
