import { formatRating } from "@/lib/format";

const STAR = "M12 2.6l2.83 6.08 6.67.72-4.98 4.5 1.4 6.56L12 17.13l-5.92 3.33 1.4-6.56L2.5 9.4l6.67-.72L12 2.6z";

/** Mostra uma classificação de 0 a 5 com preenchimento parcial (passos de 0,25). */
export function Stars({ value, size = 18, className }: { value: number | null; size?: number; className?: string }) {
  const v = value ?? 0;
  return (
    <span
      className={`inline-flex items-center gap-[2px] ${className ?? ""}`}
      role="img"
      aria-label={value == null ? "Sem classificação" : `${formatRating(value)} em 5 estrelas`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
            <defs>
              <clipPath id={`clip-${i}-${Math.round(fill * 100)}`}>
                <rect x="0" y="0" width={24 * fill} height="24" />
              </clipPath>
            </defs>
            <path d={STAR} fill="var(--line)" />
            <path d={STAR} fill="var(--rose)" clipPath={`url(#clip-${i}-${Math.round(fill * 100)})`} />
          </svg>
        );
      })}
    </span>
  );
}
