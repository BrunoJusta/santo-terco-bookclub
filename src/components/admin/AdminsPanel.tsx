"use client";

import { useState } from "react";
import { LockSimple, Plus } from "@phosphor-icons/react";
import { addAdmin, removeAdmin } from "@/app/actions/admin";
import { useAdmin } from "./context";
import { ConfirmButton, StatusPill } from "./bits";
import { btn, field } from "@/components/ui";

export function AdminsPanel() {
  const { data, run } = useAdmin();
  const [email, setEmail] = useState("");
  const all = [...new Set([...data.bootstrapAdmins, ...data.admins])].sort();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await run((t) => addAdmin(t, email), "Admin adicionado. Já pode entrar com o Google.");
    if (res.ok) setEmail("");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl text-ink">Admins</h1>
        <p className="mt-1 text-ink-3">Quem pode entrar na Gestão. Só contas Google @sogrape.pt.</p>
      </div>

      <form onSubmit={add} className="flex flex-col gap-1.5">
        <label htmlFor="admin-email" className={field.label}>
          Adicionar admin
        </label>
        <div className="flex gap-2">
          <input
            id="admin-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome.apelido@sogrape.pt"
            className={field.input}
          />
          <button type="submit" className={btn.primary} disabled={!email.includes("@")}>
            <Plus size={18} aria-hidden /> Adicionar
          </button>
        </div>
      </form>

      <ul className="flex flex-col divide-y divide-line rounded-[14px] border border-line bg-card">
        {all.map((e) => {
          const locked = data.bootstrapAdmins.includes(e);
          return (
            <li key={e} className="flex items-center gap-3 p-3.5">
              <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{e}</span>
              {e === data.me && <StatusPill tone="ink">Tu</StatusPill>}
              {locked ? (
                <span className="inline-flex items-center gap-1 text-xs text-ink-3" title="Definido em ADMIN_BOOTSTRAP_EMAILS no Vercel">
                  <LockSimple size={14} aria-hidden /> fixo
                </span>
              ) : (
                e !== data.me && (
                  <ConfirmButton confirmLabel="Remover?" onConfirm={() => run((t) => removeAdmin(t, e), "Admin removido.")}>
                    Remover
                  </ConfirmButton>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
