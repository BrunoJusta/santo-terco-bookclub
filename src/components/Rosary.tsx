import Image from "next/image";
import type { Photo } from "@/lib/types";

/**
 * O terço do logo, à volta da capa do próximo livro.
 * Cinco dezenas (10 contas pequenas + 1 grande) num laço, com a cauda e a cruz em baixo.
 * Com movimento ativo, uma conta acende a cada segundo.
 */

const W = 400;
const H = 664;
const CX = 200;
const CY = 230;
const RX = 168;
const RY = 205;
const GAP = 0.32; // abertura (radianos) em baixo, onde a cauda se liga

type Bead = { x: number; y: number; r: number; big: boolean };

function loopBeads(): Bead[] {
  const beads: Bead[] = [];
  const total = 55; // 5 × (10 pequenas + 1 grande)
  const start = Math.PI / 2 + GAP;
  const end = Math.PI / 2 + 2 * Math.PI - GAP;
  for (let i = 0; i < total; i++) {
    const t = start + ((end - start) * i) / (total - 1);
    const big = i % 11 === 10;
    beads.push({ x: CX + RX * Math.cos(t), y: CY + RY * Math.sin(t), r: big ? 9.5 : 6.6, big });
  }
  return beads;
}

const LOOP = loopBeads();
const JOIN_Y = CY + RY + 14;
const TAIL: Bead[] = [
  { x: CX, y: JOIN_Y + 28, r: 9.5, big: true },
  { x: CX, y: JOIN_Y + 56, r: 6.6, big: false },
  { x: CX, y: JOIN_Y + 76, r: 6.6, big: false },
  { x: CX, y: JOIN_Y + 96, r: 6.6, big: false },
  { x: CX, y: JOIN_Y + 124, r: 9.5, big: true },
];
const CROSS_TOP = JOIN_Y + 142;

// Caixa da capa dentro do laço (proporção 2:3)
const COVER_W = 196;
const COVER_H = 294;
const coverStyle = {
  left: `${((CX - COVER_W / 2) / W) * 100}%`,
  top: `${((CY - COVER_H / 2) / H) * 100}%`,
  width: `${(COVER_W / W) * 100}%`,
  height: `${(COVER_H / H) * 100}%`,
};

export function Rosary({ cover, title, className }: { cover: Photo | null; title: string; className?: string }) {
  const loopPath = `M ${LOOP[0].x} ${LOOP[0].y} ` + LOOP.slice(1).map((b) => `L ${b.x} ${b.y}`).join(" ");
  return (
    <div className={`relative mx-auto aspect-[400/664] w-full max-w-[360px] ${className ?? ""}`}>
      {/* Halo discreto atrás da capa */}
      <div
        aria-hidden
        className="absolute rounded-full bg-rose/25 blur-3xl"
        style={{ left: "18%", top: "10%", width: "64%", height: "52%" }}
      />
      <div className="absolute overflow-hidden rounded-[6px] shadow-[0_24px_50px_-18px_rgb(var(--shadow)/0.55)]" style={coverStyle}>
        {cover ? (
          <Image src={cover.url} alt={`Capa de ${title}`} fill sizes="(min-width: 1024px) 180px, 46vw" className="object-cover" priority />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink p-4 text-center">
            <span className="font-display text-xl leading-tight text-paper">{title}</span>
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="st-bead" cx="35%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#ffc2da" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#e2477f" stopOpacity="0.62" />
          </radialGradient>
          <linearGradient id="st-cross" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd3e4" />
            <stop offset="55%" stopColor="#f07aa8" />
            <stop offset="100%" stopColor="#d23a73" />
          </linearGradient>
        </defs>

        <path d={loopPath} fill="none" stroke="#e2477f" strokeOpacity="0.45" strokeWidth="1.4" />
        <path
          d={`M ${LOOP[0].x} ${LOOP[0].y} L ${CX} ${JOIN_Y} L ${LOOP[LOOP.length - 1].x} ${LOOP[LOOP.length - 1].y} M ${CX} ${JOIN_Y} L ${CX} ${CROSS_TOP}`}
          fill="none"
          stroke="#e2477f"
          strokeOpacity="0.45"
          strokeWidth="1.4"
        />

        {LOOP.map((b, i) => (
          <circle
            key={i}
            className="bead bead-pray"
            cx={b.x}
            cy={b.y}
            r={b.r}
            fill="url(#st-bead)"
            stroke="#d23a73"
            strokeOpacity="0.55"
            strokeWidth="0.8"
            style={{ ["--delay" as string]: `${i}s`, ["--loop" as string]: `${LOOP.length}s` }}
          />
        ))}

        {/* Medalha de junção */}
        <ellipse cx={CX} cy={JOIN_Y} rx="9" ry="11" fill="url(#st-cross)" stroke="#d23a73" strokeOpacity="0.6" strokeWidth="0.8" />

        {TAIL.map((b, i) => (
          <circle key={`t${i}`} className="bead" cx={b.x} cy={b.y} r={b.r} fill="url(#st-bead)" stroke="#d23a73" strokeOpacity="0.55" strokeWidth="0.8" />
        ))}

        {/* Cruz */}
        <g transform={`translate(${CX} ${CROSS_TOP})`}>
          <rect x="-7" y="0" width="14" height="62" rx="7" fill="url(#st-cross)" />
          <rect x="-24" y="14" width="48" height="13" rx="6.5" fill="url(#st-cross)" />
          <rect x="-7" y="0" width="14" height="62" rx="7" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
