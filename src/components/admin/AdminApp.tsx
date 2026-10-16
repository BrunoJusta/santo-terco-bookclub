"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { ArrowSquareOut, GoogleLogo, SignOut } from "@phosphor-icons/react";
import { clientAuth, googleProvider, isClientConfigured } from "@/lib/firebase-client";
import { getAdminData, verifyAdmin } from "@/app/actions/admin";
import { AdminContext, type AdminCtx } from "./context";
import { BooksPanel } from "./BooksPanel";
import { PollsPanel } from "./PollsPanel";
import { MembersPanel } from "./MembersPanel";
import { WinesPanel } from "./WinesPanel";
import { RulesPanel } from "./RulesPanel";
import { AdminsPanel } from "./AdminsPanel";
import { btn, container } from "@/components/ui";
import type { ActionResult, AdminData } from "@/lib/types";

const TABS = [
  { id: "livros", label: "Livros" },
  { id: "votacoes", label: "Votações" },
  { id: "membros", label: "Membros" },
  { id: "vinhos", label: "Vinhos" },
  { id: "regulamento", label: "Regulamento" },
  { id: "admins", label: "Admins" },
] as const;
type Tab = (typeof TABS)[number]["id"];

type Toast = { id: number; message: string; tone: "ok" | "erro" };

export function AdminApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [data, setData] = useState<AdminData | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("livros");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t as Tab);
  }, []);

  function changeTab(t: Tab) {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  }

  const notify = useCallback((message: string, tone: "ok" | "erro" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, message, tone }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), tone === "erro" ? 6000 : 3200);
  }, []);

  useEffect(() => {
    if (!isClientConfigured()) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(clientAuth(), setUser);
  }, []);

  const getToken = useCallback(async () => {
    const u = clientAuth().currentUser;
    if (!u) throw new Error("Sessão terminada.");
    return u.getIdToken();
  }, []);

  const reload = useCallback(async () => {
    const res = await getAdminData(await getToken());
    if (res.ok) setData(res.data);
    else notify(res.error, "erro");
  }, [getToken, notify]);

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await user.getIdToken();
      const check = await verifyAdmin(token);
      if (cancelled) return;
      if (!check.ok) {
        setDenied(check.error);
        return;
      }
      setDenied(null);
      const res = await getAdminData(token);
      if (!cancelled) {
        if (res.ok) setData(res.data);
        else setDenied(res.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const run = useCallback(
    async <T,>(fn: (token: string) => Promise<ActionResult<T>>, success?: string): Promise<ActionResult<T>> => {
      let res: ActionResult<T>;
      try {
        res = await fn(await getToken());
      } catch (e) {
        res = { ok: false, error: e instanceof Error ? e.message : "Falha de ligação." };
      }
      if (res.ok) {
        if (success) notify(success);
        await reload();
      } else notify(res.error, "erro");
      return res;
    },
    [getToken, notify, reload],
  );

  const ctx: AdminCtx | null = useMemo(() => (data ? { data, getToken, run, notify } : null), [data, getToken, run, notify]);

  async function login() {
    try {
      await signInWithPopup(clientAuth(), googleProvider());
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        notify("Não foi possível entrar com o Google.", "erro");
      }
    }
  }

  const header = (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className={`${container} flex h-16 items-center justify-between gap-3`}>
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image src="/brand/logo.webp" alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-1 ring-line" />
          <span className="truncate font-display text-lg text-ink">Gestão do Santo Terço</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" target="_blank" className={`${btn.icon} hidden sm:inline-flex`} aria-label="Abrir a app pública">
            <ArrowSquareOut size={18} aria-hidden />
          </Link>
          {user && (
            <button type="button" className={btn.small} onClick={() => signOut(clientAuth())}>
              <SignOut size={16} aria-hidden /> Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );

  const toastLayer = (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "erro" ? "alert" : "status"}
          className={`pointer-events-auto max-w-md rounded-[14px] px-4 py-3 text-[15px] shadow-xl ${
            t.tone === "erro" ? "bg-rose text-rose-ink" : "bg-ink text-paper"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );

  if (user === undefined || (user && !data && !denied)) {
    return (
      <>
        {header}
        <div className={`${container} py-16`} aria-busy>
          <div className="h-10 w-64 animate-pulse rounded-[10px] bg-paper-2" />
          <div className="mt-8 grid gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-[14px] bg-paper-2" />
            ))}
          </div>
        </div>
        {toastLayer}
      </>
    );
  }

  if (!user || denied) {
    return (
      <>
        {header}
        <div className={`${container} flex min-h-[70dvh] flex-col justify-center py-16`}>
          <h1 className="max-w-[16ch] font-display text-5xl leading-[1.05] text-ink">Só para quem guarda o terço.</h1>
          {denied ? (
            <p className="mt-4 max-w-[52ch] text-lg text-ink-2">{denied}</p>
          ) : (
            <p className="mt-4 max-w-[52ch] text-lg text-ink-2">Entra com a tua conta Google @sogrape.pt. Só admins do clube conseguem gerir livros, votações e jantares.</p>
          )}
          {!isClientConfigured() ? (
            <p className="mt-6 text-sm text-rose">Falta configurar as variáveis NEXT_PUBLIC_FIREBASE_* no Vercel.</p>
          ) : denied ? (
            <button type="button" className={`${btn.ghost} mt-8 w-fit`} onClick={() => signOut(clientAuth())}>
              Entrar com outra conta
            </button>
          ) : (
            <button type="button" className={`${btn.primary} mt-8 w-fit`} onClick={login}>
              <GoogleLogo size={20} weight="bold" aria-hidden /> Entrar com Google
            </button>
          )}
        </div>
        {toastLayer}
      </>
    );
  }

  return (
    <AdminContext.Provider value={ctx!}>
      {header}
      <div className="sticky top-16 z-[9] border-b border-line bg-paper/90 backdrop-blur-md">
        <nav aria-label="Secções da Gestão" className={`${container} flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]`}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => changeTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium transition ${
                tab === t.id ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <main className={`${container} pb-24 pt-8`}>
        {tab === "livros" && <BooksPanel />}
        {tab === "votacoes" && <PollsPanel />}
        {tab === "membros" && <MembersPanel />}
        {tab === "vinhos" && <WinesPanel />}
        {tab === "regulamento" && <RulesPanel />}
        {tab === "admins" && <AdminsPanel />}
      </main>
      {toastLayer}
    </AdminContext.Provider>
  );
}
