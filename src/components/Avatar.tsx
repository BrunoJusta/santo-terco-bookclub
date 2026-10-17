import Image from "next/image";
import { initials } from "@/lib/format";
import type { Member } from "@/lib/types";

/** Foto de perfil redonda; sem foto mostra as iniciais sobre rosa. */
export function Avatar({
  member,
  size = 32,
  className,
}: {
  member: Pick<Member, "name" | "photo"> | null | undefined;
  size?: number;
  className?: string;
}) {
  const name = member?.name ?? "Ex-membro";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-soft font-medium text-rose ring-1 ring-line ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      aria-hidden
    >
      {member?.photo ? (
        <Image src={member.photo.url} alt="" fill sizes={`${size * 2}px`} className="object-cover" />
      ) : (
        <span className="leading-none">{initials(name)}</span>
      )}
    </span>
  );
}
