/** Classes partilhadas. Botões em pílula, campos com raio 10px, cartões 14px. */

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition duration-200 ease-[var(--ease-out-soft)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const btn = {
  primary: `${base} bg-ink text-paper px-5 h-11 text-[15px] hover:bg-ink/90`,
  rose: `${base} bg-rose text-rose-ink px-5 h-11 text-[15px] hover:brightness-105`,
  ghost: `${base} border border-line bg-card text-ink px-5 h-11 text-[15px] hover:border-ink-3`,
  small: `${base} border border-line bg-card text-ink px-3.5 h-9 text-sm hover:border-ink-3`,
  smallInk: `${base} bg-ink text-paper px-3.5 h-9 text-sm hover:bg-ink/90`,
  danger: `${base} border border-rose/40 text-rose px-3.5 h-9 text-sm hover:bg-rose-soft`,
  icon: `${base} h-9 w-9 border border-line bg-card text-ink hover:border-ink-3`,
};

export const field = {
  label: "text-sm font-medium text-ink",
  help: "text-xs text-ink-3",
  input:
    "w-full rounded-[10px] border border-line bg-card px-3 h-11 text-[15px] text-ink placeholder:text-ink-3 transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-rose/30",
  textarea:
    "w-full rounded-[10px] border border-line bg-card px-3 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-3 transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-rose/30",
  error: "text-sm text-rose",
};

export const card = "rounded-[14px] border border-line bg-card";

export const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 h-8 text-sm text-ink-2";

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
