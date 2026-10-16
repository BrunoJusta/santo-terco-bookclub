"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { Image as ImageIcon, Trash, UploadSimple } from "@phosphor-icons/react";
import { btn, cx, field } from "@/components/ui";
import type { Photo } from "@/lib/types";

export function Field({
  label,
  help,
  children,
  htmlFor,
}: {
  label: string;
  help?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={field.label}>
        {label}
      </label>
      {children}
      {help && <span className={field.help}>{help}</span>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string }) {
  const id = useId();
  const { label, help, className, ...rest } = props;
  return (
    <Field label={label} help={help} htmlFor={id}>
      <input id={id} {...rest} className={cx(field.input, className)} />
    </Field>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; help?: string }) {
  const id = useId();
  const { label, help, className, ...rest } = props;
  return (
    <Field label={label} help={help} htmlFor={id}>
      <textarea id={id} {...rest} className={cx(field.textarea, className)} />
    </Field>
  );
}

export function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; help?: string; children: React.ReactNode },
) {
  const id = useId();
  const { label, help, className, children, ...rest } = props;
  return (
    <Field label={label} help={help} htmlFor={id}>
      <select id={id} {...rest} className={cx(field.input, "appearance-auto", className)}>
        {children}
      </select>
    </Field>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-[15px] text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[var(--rose)]" />
      {label}
    </label>
  );
}

/** Botão que pede confirmação no segundo toque, sem janelas modais. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "Tens a certeza?",
  className = btn.danger,
  disabled,
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      className={cx(className, armed && "bg-rose text-rose-ink")}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}

export function StatusPill({ tone, children }: { tone: "ink" | "rose" | "muted"; children: React.ReactNode }) {
  const tones = {
    ink: "bg-ink text-paper",
    rose: "bg-rose-soft text-rose",
    muted: "bg-paper-2 text-ink-2",
  };
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function ImagePicker({
  label,
  value,
  onPick,
  onClear,
  busy,
  accept = "image/*",
  aspect = "aspect-[2/3]",
  contain,
  help,
}: {
  label: string;
  value: Photo | null;
  onPick: (file: File) => void;
  onClear?: () => void;
  busy?: boolean;
  accept?: string;
  aspect?: string;
  contain?: boolean;
  help?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span className={field.label} id={`${id}-l`}>
        {label}
      </span>
      <div className="flex items-end gap-3">
        <div className={`relative ${aspect} w-28 shrink-0 overflow-hidden rounded-[10px] border border-line bg-paper-2`}>
          {value ? (
            <Image src={value.url} alt="" fill sizes="112px" className={contain ? "object-contain p-1" : "object-cover"} />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-3">
              <ImageIcon size={28} aria-hidden />
            </div>
          )}
          {busy && <div className="absolute inset-0 animate-pulse bg-paper/60" />}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={ref}
            type="file"
            accept={accept}
            className="sr-only"
            aria-labelledby={`${id}-l`}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
          <button type="button" className={btn.small} onClick={() => ref.current?.click()} disabled={busy}>
            <UploadSimple size={16} aria-hidden /> {busy ? "A enviar..." : value ? "Trocar" : "Carregar"}
          </button>
          {value && onClear && (
            <button type="button" className={btn.danger} onClick={onClear} disabled={busy}>
              <Trash size={16} aria-hidden /> Remover
            </button>
          )}
        </div>
      </div>
      {help && <span className={field.help}>{help}</span>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-2xl text-ink">{children}</h2>
      {action}
    </div>
  );
}
