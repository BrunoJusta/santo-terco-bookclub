import { getBook } from "@/lib/server/data";

export const dynamic = "force-dynamic";

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book || !book.dinnerAt) return new Response("Sem jantar marcado.", { status: 404 });

  const start = new Date(book.dinnerAt);
  const end = new Date(start.getTime() + 3 * 3600 * 1000);
  const url = new URL("/", req.url).toString();
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Santo Terco Book Club//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${book.id}-${icsDate(start)}@santo-terco`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(`Santo Terço: ${book.title}`)}`,
    `DESCRIPTION:${esc(`Jantar do clube e data limite de leitura de "${book.title}"${book.author ? `, de ${book.author}` : ""}.\n${url}`)}`,
    book.dinnerPlace ? `LOCATION:${esc(book.dinnerPlace)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Falta uma semana para o jantar de ${book.title}. Como vai a leitura?`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="santo-terco-${book.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
