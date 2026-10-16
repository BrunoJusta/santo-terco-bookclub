import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { isFirebaseConfigured } from "@/lib/server/firebase";
import { container } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  return (
    <>
      <SiteNav />
      <main className="pb-28 md:pb-16">
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
      <footer className={`${container} hidden border-t border-line py-8 text-sm text-ink-3 md:flex md:items-center md:justify-between`}>
        <span>Santo Terço Book Club. Sem fins lucrativos, com muitos bitaites.</span>
        <Link href="/gestao" className="hover:text-ink">
          Gestão
        </Link>
      </footer>
    </>
  );
}
