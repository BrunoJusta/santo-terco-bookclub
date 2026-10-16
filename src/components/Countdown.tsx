"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const end = new Date(target).getTime();
  const left = now == null ? null : end - now;

  if (left != null && left <= 0) {
    const sameDay = left > -12 * 3600 * 1000;
    return (
      <p className="font-display text-2xl text-ink sm:text-3xl" role="status">
        {sameDay ? "É hoje. Que os bitaites estejam afinados." : "O prazo passou. Esperemos que tenham lido."}
      </p>
    );
  }

  const p = left == null ? null : parts(left);
  const cells: Array<[string, string]> = [
    [p ? String(p.d) : "--", p?.d === 1 ? "dia" : "dias"],
    [p ? pad(p.h) : "--", "horas"],
    [p ? pad(p.m) : "--", "min"],
    [p ? pad(p.s) : "--", "seg"],
  ];

  return (
    <div className="flex items-stretch gap-2 sm:gap-3" role="timer" aria-live="off" aria-label="Tempo até ao jantar">
      {cells.map(([value, label], i) => (
        <div
          key={label}
          className={`flex min-w-0 flex-1 flex-col items-center rounded-[14px] border border-line bg-card px-2 py-3 sm:px-4 ${i === 0 ? "border-ink bg-ink text-paper" : ""}`}
        >
          <span className={`tabular font-mono text-3xl leading-none sm:text-4xl ${i === 0 ? "text-paper" : "text-ink"}`}>{value}</span>
          <span className={`mt-1.5 text-xs ${i === 0 ? "text-paper/75" : "text-ink-3"}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}
