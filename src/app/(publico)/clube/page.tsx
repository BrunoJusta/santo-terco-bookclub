import Image from "next/image";
import type { Metadata } from "next";
import { CaretDown, Crown, Wine } from "@phosphor-icons/react/dist/ssr";
import { Markdown } from "@/components/Markdown";
import { card, container } from "@/components/ui";
import { getMembers, getRules } from "@/lib/server/data";
import { formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clube" };

export default async function ClubePage() {
  const [members, rules] = await Promise.all([getMembers(), getRules()]);
  const active = members.filter((m) => m.active);
  const founders = active.filter((m) => m.founder);
  const others = active.filter((m) => !m.founder);
  const debtors = active
    .map((m) => ({ m, owed: m.rodadas.filter((r) => !r.paga) }))
    .filter((d) => d.owed.length > 0)
    .sort((a, b) => b.owed.length - a.owed.length);

  return (
    <div className={`${container} pt-8 md:pt-14`}>
      <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14">
        <div className="relative aspect-square w-full max-w-[460px] overflow-hidden rounded-[14px] shadow-[0_30px_60px_-30px_rgb(var(--shadow)/0.6)]">
          <Image src="/brand/logo.webp" alt="Logo do Santo Terço Book Club" fill sizes="(min-width: 768px) 460px, 100vw" className="object-cover" priority />
        </div>
        <div>
          <h1 className="font-display text-5xl leading-none text-ink md:text-6xl">O Clube</h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-ink-2">
            Um clube de leitura informal e voluntário, nascido numa tarde solarenga de agosto de 2026 por inspiração divina. Sem metas de
            produtividade, com muita curiosidade e um copo na mão.
          </p>
          <p className="mt-4 text-ink-3">
            {active.length} membros, {founders.length} dos quais no Comité de Founders.
          </p>
        </div>
      </section>

      <section className="reveal mt-20 grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" aria-labelledby="membros">
        <div>
          <h2 className="flex items-center gap-2 font-display text-3xl text-ink">
            <Crown size={26} weight="fill" className="text-rose" aria-hidden />
            Comité de Founders
          </h2>
          <p className="mt-2 text-sm text-ink-3">Órgão supremo de orientação, mediação e decisão (Art. 3.º).</p>
          <ul className="mt-5 flex flex-col">
            {founders.map((m) => (
              <li key={m.id} className="border-b border-line py-3 font-display text-2xl text-ink last:border-b-0">
                {m.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 id="membros" className="font-display text-3xl text-ink">
            Membros
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {others.map((m) => (
              <li key={m.id} className="border-b border-line py-3 text-lg text-ink-2">
                {m.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {debtors.length > 0 && (
        <section className={`${card} reveal mt-16 p-6 md:p-8`} aria-labelledby="rodadas">
          <h2 id="rodadas" className="flex items-center gap-2 font-display text-3xl text-ink">
            <Wine size={26} className="text-rose" aria-hidden />
            Rodadas em dívida
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm text-ink-3">
            Ausências sem motivo de força maior, nos termos do Art. 2.º, n.º 3. Atribuídas pelo Comité, pagas em vinho.
          </p>
          <ul className="mt-5 flex flex-col divide-y divide-line">
            {debtors.map(({ m, owed }) => (
              <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <span className="text-ink">{m.name}</span>
                <span className="text-sm text-ink-2">
                  {owed.length} {owed.length === 1 ? "rodada" : "rodadas"}
                  {owed[0]?.motivo ? <span className="text-ink-3">, {owed.map((o) => o.motivo).filter(Boolean).join("; ")}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="reveal mt-20" aria-labelledby="regulamento">
        <h2 id="regulamento" className="font-display text-4xl text-ink md:text-5xl">
          Regulamento
        </h2>
        <p className="mt-2 text-sm text-ink-3">Última alteração aprovada pelo Comité a {formatDate(rules.updatedAt)}.</p>
        <div className="mt-6 flex flex-col">
          {rules.articles.map((a, i) => (
            <details key={a.id} className="group border-t border-line last:border-b" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
                <span className="font-display text-xl text-ink md:text-2xl">{a.title}</span>
                <CaretDown size={20} className="shrink-0 text-ink-3 transition group-open:rotate-180" aria-hidden />
              </summary>
              <Markdown className="pb-7">{a.body}</Markdown>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
