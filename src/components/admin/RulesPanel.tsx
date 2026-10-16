"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { saveRules } from "@/app/actions/admin";
import { useAdmin } from "./context";
import { TextArea, TextInput } from "./bits";
import { Markdown } from "@/components/Markdown";
import { btn, card } from "@/components/ui";
import { formatDate } from "@/lib/time";
import type { RuleArticle } from "@/lib/types";

export function RulesPanel() {
  const { data, run } = useAdmin();
  const [articles, setArticles] = useState<RuleArticle[]>(data.rules.articles);
  const [preview, setPreview] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(articles) !== JSON.stringify(data.rules.articles);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (id: string, patch: Partial<RuleArticle>) => setArticles((as) => as.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const move = (i: number, j: number) =>
    setArticles((as) => {
      if (j < 0 || j >= as.length) return as;
      const next = [...as];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function save() {
    setSaving(true);
    await run((t) => saveRules(t, articles), "Regulamento atualizado. Aprovado pelo Comité, esperamos.");
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl text-ink">Regulamento</h1>
        <p className="mt-1 max-w-[70ch] text-ink-3">
          Última alteração a {formatDate(data.rules.updatedAt)}. Texto em Markdown: **negrito**, listas com 1. e fórmulas entre $ (por exemplo $k = 15$) ou $$ para destaque.
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {articles.map((a, i) => (
          <li key={a.id} className={`${card} flex flex-col gap-4 p-4`}>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextInput label={`Artigo ${i + 1}`} value={a.title} onChange={(e) => update(a.id, { title: e.target.value })} />
              </div>
              <button type="button" className={btn.icon} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Subir artigo">
                <ArrowUp size={16} aria-hidden />
              </button>
              <button type="button" className={btn.icon} onClick={() => move(i, i + 1)} disabled={i === articles.length - 1} aria-label="Descer artigo">
                <ArrowDown size={16} aria-hidden />
              </button>
              <button
                type="button"
                className={btn.icon}
                onClick={() => setPreview((p) => ({ ...p, [a.id]: !p[a.id] }))}
                aria-label={preview[a.id] ? "Editar texto" : "Pré-visualizar"}
              >
                {preview[a.id] ? <PencilSimple size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
              <button type="button" className={btn.icon} onClick={() => setArticles((as) => as.filter((x) => x.id !== a.id))} aria-label="Remover artigo">
                <Trash size={16} aria-hidden />
              </button>
            </div>
            {preview[a.id] ? (
              <Markdown className="rounded-[10px] bg-paper p-4">{a.body}</Markdown>
            ) : (
              <TextArea label="Texto" rows={Math.min(18, Math.max(5, a.body.split("\n").length + 1))} value={a.body} onChange={(e) => update(a.id, { body: e.target.value })} className="font-mono text-sm" />
            )}
          </li>
        ))}
      </ol>

      <div className="sticky bottom-0 z-[5] -mx-4 flex flex-wrap gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[14px] sm:border">
        <button type="button" className={btn.primary} onClick={save} disabled={saving || !dirty}>
          {saving ? "A guardar…" : "Guardar regulamento"}
        </button>
        <button
          type="button"
          className={btn.ghost}
          onClick={() => setArticles((as) => [...as, { id: crypto.randomUUID(), title: `Artigo ${as.length + 1}.º · Novo artigo`, body: "" }])}
        >
          <Plus size={18} aria-hidden /> Artigo
        </button>
        {dirty && (
          <button type="button" className={btn.ghost} onClick={() => setArticles(data.rules.articles)}>
            Descartar alterações
          </button>
        )}
      </div>
    </div>
  );
}
