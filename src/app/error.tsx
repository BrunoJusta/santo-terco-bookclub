"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center px-4 py-24 sm:px-6">
      <h1 className="font-display text-5xl leading-[1.05] text-ink">Algo correu mal.</h1>
      <p className="mt-4 text-lg text-ink-2">Não foi culpa do livro. Tenta outra vez daqui a pouco.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-11 w-fit items-center rounded-full bg-ink px-5 text-[15px] font-medium text-paper"
      >
        Tentar outra vez
      </button>
    </main>
  );
}
