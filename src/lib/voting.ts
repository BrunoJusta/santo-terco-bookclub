import type { PollResult, PollRow, TieMethod } from "./types";

export const DEFAULT_K = 15;

/** p_i(b) = max(0, k + 1 - r_i(b)), com r a começar em 1. */
export function pointsFor(position: number, k: number): number {
  return Math.max(0, k + 1 - position);
}

/** Número de livros que cada boletim tem de ordenar: todos, até ao limite k. */
export function requiredCount(bookCount: number, k: number): number {
  return Math.min(k, bookCount);
}

/** Valida e normaliza uma ordenação: livros da votação, sem repetidos, todos ordenados (até k). */
export function normalizeRanking(ranking: unknown, bookIds: string[], k: number): string[] | null {
  if (!Array.isArray(ranking)) return null;
  const allowed = new Set(bookIds);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ranking) {
    if (typeof id !== "string" || !allowed.has(id) || seen.has(id)) return null;
    seen.add(id);
    out.push(id);
  }
  if (out.length !== requiredCount(bookIds.length, k)) return null;
  return out;
}

export function scoreBallots(bookIds: string[], ballots: string[][], k: number): PollRow[] {
  const rows = new Map<string, PollRow>(bookIds.map((id) => [id, { bookId: id, score: 0, firsts: 0 }]));
  for (const ranking of ballots) {
    ranking.slice(0, k).forEach((bookId, i) => {
      const row = rows.get(bookId);
      if (!row) return;
      row.score += pointsFor(i + 1, k);
      if (i === 0) row.firsts += 1;
    });
  }
  return [...rows.values()].sort((a, b) => b.score - a.score || b.firsts - a.firsts);
}

/** Aplica o Art. 4.º: maior pontuação, depois maior número de primeiros lugares. */
export function computeResult(bookIds: string[], ballots: string[][], k: number): PollResult {
  const rows = scoreBallots(bookIds, ballots, k);
  let winnerId: string | null = null;
  let method: TieMethod | null = null;
  let tiedIds: string[] = [];

  if (rows.length > 0 && ballots.length > 0) {
    const top = rows.filter((r) => r.score === rows[0].score);
    if (top.length === 1) {
      winnerId = top[0].bookId;
      method = "pontos";
    } else {
      const maxFirsts = Math.max(...top.map((r) => r.firsts));
      const byFirsts = top.filter((r) => r.firsts === maxFirsts);
      if (byFirsts.length === 1) {
        winnerId = byFirsts[0].bookId;
        method = "primeiros";
      } else {
        tiedIds = byFirsts.map((r) => r.bookId);
      }
    }
  }

  return {
    rows,
    ballots: ballots.length,
    winnerId,
    method,
    tiedIds,
    coin: null,
    computedAt: new Date().toISOString(),
  };
}

export const METHOD_LABEL: Record<TieMethod, string> = {
  pontos: "Vitória por pontos",
  primeiros: "Desempate pelo maior número de primeiros lugares",
  comite: "Desempate decidido pelo Comité de Founders",
  moeda: "Desempate por moeda ao ar",
  sorteio: "Desempate por sorteio",
};
