"use client";

import { useState } from "react";
import { Crown, Plus, Trash, Wine } from "@phosphor-icons/react";
import { deleteMember, saveMember } from "@/app/actions/admin";
import { useAdmin } from "./context";
import { ConfirmButton, StatusPill, TextInput, Toggle } from "./bits";
import { btn, card, field } from "@/components/ui";
import { todayLisbon } from "@/lib/time";
import type { Member, Rodada } from "@/lib/types";

function MemberEditor({ member, onDone }: { member?: Member; onDone: () => void }) {
  const { run } = useAdmin();
  const [name, setName] = useState(member?.name ?? "");
  const [founder, setFounder] = useState(member?.founder ?? false);
  const [active, setActive] = useState(member?.active ?? true);
  const [rodadas, setRodadas] = useState<Rodada[]>(member?.rodadas ?? []);
  const [saving, setSaving] = useState(false);

  const updateRodada = (id: string, patch: Partial<Rodada>) => setRodadas((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await run((t) => saveMember(t, { id: member?.id, name, founder, active, rodadas }), member ? "Membro atualizado." : "Membro adicionado.");
    setSaving(false);
    if (res.ok) onDone();
  }

  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-5 p-4`}>
      <TextInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
      <div className="flex flex-wrap gap-6">
        <Toggle checked={founder} onChange={setFounder} label="Comité de Founders" />
        <Toggle checked={active} onChange={setActive} label="Ativo" />
      </div>
      {!active && <p className={field.help}>Inativos saem das listas de voto e review e da página do clube, mas ficam no histórico dos jantares.</p>}

      <fieldset className="flex flex-col gap-3">
        <legend className={`${field.label} mb-1`}>Rodadas em dívida (Art. 2.º, n.º 3)</legend>
        {rodadas.length === 0 && <p className={field.help}>Sem rodadas. Por agora, um exemplo de assiduidade.</p>}
        {rodadas.map((r) => (
          <div key={r.id} className="grid items-end gap-2 sm:grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)_auto_auto]">
            <TextInput label="Motivo" value={r.motivo} onChange={(e) => updateRodada(r.id, { motivo: e.target.value })} placeholder="Faltou ao jantar de março" />
            <TextInput label="Data" type="date" value={r.data} onChange={(e) => updateRodada(r.id, { data: e.target.value })} required />
            <div className="pb-2.5">
              <Toggle checked={r.paga} onChange={(v) => updateRodada(r.id, { paga: v })} label="Paga" />
            </div>
            <button type="button" className={btn.icon} onClick={() => setRodadas((rs) => rs.filter((x) => x.id !== r.id))} aria-label="Remover rodada">
              <Trash size={16} aria-hidden />
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            className={btn.small}
            onClick={() => setRodadas((rs) => [...rs, { id: crypto.randomUUID(), motivo: "", data: todayLisbon(), paga: false }])}
          >
            <Wine size={16} aria-hidden /> Atribuir rodada
          </button>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btn.smallInk} disabled={saving || name.trim().length < 2}>
          {saving ? "A guardar..." : "Guardar"}
        </button>
        <button type="button" className={btn.small} onClick={onDone}>
          Cancelar
        </button>
        {member && (
          <ConfirmButton
            className={`${btn.danger} sm:ml-auto`}
            confirmLabel="Apagar de vez?"
            onConfirm={async () => {
              const res = await run((t) => deleteMember(t, member.id), "Membro apagado.");
              if (res.ok) onDone();
            }}
          >
            Apagar
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}

export function MembersPanel() {
  const { data } = useAdmin();
  const [editing, setEditing] = useState<string | "novo" | null>(null);
  const members = [...data.members].sort((a, b) => Number(b.active) - Number(a.active) || Number(b.founder) - Number(a.founder) || a.name.localeCompare(b.name, "pt"));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Membros</h1>
          <p className="mt-1 text-ink-3">
            {data.members.filter((m) => m.active).length} ativos. Quem tem histórico não se apaga: fica inativo.
          </p>
        </div>
        <button type="button" className={btn.primary} onClick={() => setEditing("novo")}>
          <Plus size={18} aria-hidden /> Novo membro
        </button>
      </div>

      {editing === "novo" && <MemberEditor onDone={() => setEditing(null)} />}

      <ul className="flex flex-col divide-y divide-line rounded-[14px] border border-line bg-card">
        {members.map((m) =>
          editing === m.id ? (
            <li key={m.id} className="p-2">
              <MemberEditor member={m} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={m.id}>
              <button type="button" onClick={() => setEditing(m.id)} className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-paper-2/60">
                <span className={`min-w-0 flex-1 truncate text-[15px] ${m.active ? "text-ink" : "text-ink-3 line-through"}`}>{m.name}</span>
                {m.founder && (
                  <span className="inline-flex items-center gap-1 text-xs text-rose">
                    <Crown size={14} weight="fill" aria-hidden /> Founder
                  </span>
                )}
                {m.rodadas.some((r) => !r.paga) && <StatusPill tone="rose">{m.rodadas.filter((r) => !r.paga).length} rodada(s)</StatusPill>}
                {!m.active && <StatusPill tone="muted">Inativo</StatusPill>}
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
