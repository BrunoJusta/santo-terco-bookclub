"use client";

import { CheckCircle } from "@phosphor-icons/react";
import type { Member } from "@/lib/types";
import { Avatar } from "./Avatar";

/** Grelha de nomes. Quem já participou aparece bloqueado, sem revelar o que escolheu. */
export function MemberPicker({
  members,
  doneIds,
  doneLabel,
  value,
  onChange,
}: {
  members: Member[];
  doneIds: string[];
  doneLabel: string;
  value: string | null;
  onChange: (id: string) => void;
}) {
  const done = new Set(doneIds);
  return (
    <fieldset>
      <legend className="sr-only">Escolhe o teu nome</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {members.map((m) => {
          const isDone = done.has(m.id);
          const selected = value === m.id;
          return (
            <label
              key={m.id}
              className={`relative flex min-h-12 cursor-pointer items-center gap-2 rounded-[14px] border px-3 py-2.5 text-[15px] transition ${
                isDone
                  ? "cursor-not-allowed border-line bg-paper-2 text-ink-3"
                  : selected
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-card text-ink hover:border-ink-3"
              }`}
            >
              <input
                type="radio"
                name="member"
                value={m.id}
                checked={selected}
                disabled={isDone}
                onChange={() => onChange(m.id)}
                className="sr-only"
              />
              <Avatar member={m} size={28} className={isDone ? "opacity-60" : ""} />
              <span className="min-w-0 flex-1 truncate">{m.name}</span>
              {isDone && (
                <span className="flex shrink-0 items-center gap-1 text-xs">
                  <CheckCircle size={16} weight="fill" aria-hidden />
                  {doneLabel}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
