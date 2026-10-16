"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Books, HandsPraying, UsersThree, Wine } from "@phosphor-icons/react";

const LINKS = [
  { href: "/", label: "Agora", Icon: HandsPraying },
  { href: "/estante", label: "Estante", Icon: Books },
  { href: "/vinhos", label: "Vinhos", Icon: Wine },
  { href: "/clube", label: "Clube", Icon: UsersThree },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function SiteNav() {
  const path = usePathname() || "/";
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Santo Terço, início">
            <Image src="/brand/logo.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-1 ring-line" />
            <span className="font-display text-xl leading-none text-ink">Santo Terço</span>
          </Link>
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(path, href) ? "page" : undefined}
                    className={`rounded-full px-4 py-2 text-[15px] transition ${
                      isActive(path, href) ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-4">
          {LINKS.map(({ href, label, Icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${active ? "text-rose" : "text-ink-3"}`}
                >
                  <Icon size={24} weight={active ? "fill" : "regular"} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
