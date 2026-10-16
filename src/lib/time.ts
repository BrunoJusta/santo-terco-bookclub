export const TZ = "Europe/Lisbon";

/** Diferença (ms) entre a hora de Lisboa e UTC num dado instante. */
function lisbonOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** "2027-01-14T20:00" (hora de Lisboa) para ISO UTC. */
export function lisbonLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let ts = guess - lisbonOffsetMs(new Date(guess));
  ts = guess - lisbonOffsetMs(new Date(ts));
  return new Date(ts).toISOString();
}

/** ISO UTC para o valor de um <input type="datetime-local"> em hora de Lisboa. */
export function isoToLisbonLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() + lisbonOffsetMs(d));
  return local.toISOString().slice(0, 16);
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("pt-PT", { timeZone: TZ, ...opts });
    fmtCache.set(key, f);
  }
  return f;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return fmt({ day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return fmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)).replace(".", "");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return fmt({ weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return fmt({ hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function yearInLisbon(iso: string | Date = new Date()): number {
  return Number(fmt({ year: "numeric" }).format(typeof iso === "string" ? new Date(iso) : iso));
}

export function todayLisbon(): string {
  return isoToLisbonLocal(new Date().toISOString()).slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}
