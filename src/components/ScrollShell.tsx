"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export const SCROLLER_ID = "st-scroller";

/** Sobe ao topo da zona de scroll da app. */
export function scrollAppToTop() {
  document.getElementById(SCROLLER_ID)?.scrollTo({ top: 0 });
}

/**
 * A página em si não faz scroll: quem faz é esta zona, presa ao ecrã.
 * No iOS 26 o Safari desenha a página por trás da barra das horas; com o documento parado
 * não há conteúdo a passar lá atrás, só o fundo da app.
 */
export function ScrollShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();

  // Ao mudar de página, começar no topo (o Next só o faz para a janela).
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [path]);

  return (
    <div id={SCROLLER_ID} ref={ref} className="fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-paper">
      {children}
    </div>
  );
}
