import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { isFirebaseConfigured } from "@/lib/server/firebase";
import { container } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Saltar para o conteúdo
      </a>
      <SiteNav />
      <main id="conteudo" className="flex-1 scroll-mt-20 pb-28 pt-[calc(4rem+env(safe-area-inset-top))] md:pb-16">
        {configured ? (
          children
        ) : (
          <div className={`${container} py-24`}>
            <h1 className="font-display text-4xl text-ink">Quase lá</h1>
            <p className="mt-3 max-w-[60ch] text-ink-2">
              A app ainda não está ligada ao Firebase. Configura as variáveis de ambiente descritas no README e volta a publicar.
            </p>
          </div>
        )}
      </main>
      <footer className={`${container} mt-auto hidden border-t border-line py-8 text-sm text-ink-3 md:flex md:items-center md:justify-between`}>
        <span>Santo Terço Book Club. Sem fins lucrativos, com muitos bitaites.</span>
        <Link href="/gestao" className="hover:text-ink">
          Gestão
        </Link>
      </footer>
    </div>
  );
}
