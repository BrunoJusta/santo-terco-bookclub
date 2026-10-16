import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center px-4 py-24 sm:px-6">
      <h1 className="font-display text-5xl leading-[1.05] text-ink">Esta página perdeu-se entre as contas do terço.</h1>
      <p className="mt-4 text-lg text-ink-2">Pode ter sido apagada, ou o link chegou torto pelo WhatsApp.</p>
      <Link href="/" className="mt-8 inline-flex h-11 w-fit items-center rounded-full bg-ink px-5 text-[15px] font-medium text-paper">
        Voltar ao início
      </Link>
    </main>
  );
}
