"use client";

import { Stars } from "./Stars";
import { formatRating } from "@/lib/format";

/** Escolha de 0,25 a 5 estrelas: toque nas estrelas (ao quarto) ou deslizador acessível. */
export function StarInput({ value, onChange, id = "rating" }: { value: number; onChange: (v: number) => void; id?: string }) {
  function fromPointer(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const v = Math.ceil(Math.max(0, Math.min(1, ratio)) * 5 * 4) / 4;
    onChange(Math.max(0.25, v));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="cursor-pointer select-none" onClick={fromPointer} aria-hidden>
          <Stars value={value || null} size={36} />
        </div>
        <span className="tabular font-mono text-2xl text-ink" aria-hidden>
          {value ? formatRating(value) : "0"}
        </span>
      </div>
      <label htmlFor={id} className="sr-only">
        Classificação em estrelas
      </label>
      <input
        id={id}
        type="range"
        min={0.25}
        max={5}
        step={0.25}
        value={value || 0.25}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${formatRating(value || 0.25)} estrelas`}
        className="w-full max-w-xs accent-[var(--rose)]"
      />
    </div>
  );
}
