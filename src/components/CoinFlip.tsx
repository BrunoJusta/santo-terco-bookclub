"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowClockwise } from "@phosphor-icons/react";

/** Repete o lançamento da moeda registado no servidor. O resultado nunca é decidido aqui. */
export function CoinFlip({ cara, coroa, outcome }: { cara: string; coroa: string; outcome: "cara" | "coroa" }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const finalTurn = outcome === "cara" ? 1800 : 1980;

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="[perspective:900px]">
        <motion.div
          key={run}
          className="relative h-40 w-40 [transform-style:preserve-3d]"
          initial={{ rotateY: 0, y: 0 }}
          animate={reduce ? { rotateY: finalTurn } : { rotateY: finalTurn, y: [0, -90, 0] }}
          transition={reduce ? { duration: 0 } : { duration: 2.2, ease: [0.16, 1, 0.3, 1], y: { duration: 2.2, times: [0, 0.4, 1] } }}
        >
          {(["cara", "coroa"] as const).map((face) => (
            <div
              key={face}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full border-4 border-rose/60 bg-[radial-gradient(circle_at_35%_30%,#fff_0%,#ffd1e2_40%,#e2477f_100%)] p-4 text-center text-[#2a0d1c] [backface-visibility:hidden]"
              style={{ transform: face === "coroa" ? "rotateY(180deg)" : undefined }}
            >
              <span className="text-xs font-semibold uppercase">{face}</span>
              <span className="mt-1 line-clamp-3 font-display text-sm leading-tight">{face === "cara" ? cara : coroa}</span>
            </div>
          ))}
        </motion.div>
      </div>
      <button type="button" onClick={() => setRun((r) => r + 1)} className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowClockwise size={16} aria-hidden /> Repetir lançamento
      </button>
    </div>
  );
}
