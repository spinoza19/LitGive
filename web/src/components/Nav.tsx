"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const links = [
  { href: "/", label: "Browse" },
  { href: "/new", label: "Start a campaign" },
  { href: "/me", label: "My dashboard" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center text-black font-bold">
            L
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">LitGive</div>
            <div className="text-[10px] uppercase tracking-wider text-muted hidden sm:block">
              on LitVM testnet
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-3 md:gap-5 text-sm">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`hidden sm:inline-block transition ${
                  active ? "text-accent" : "text-muted hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <ConnectButton showBalance={false} chainStatus="icon" />
        </nav>
      </div>
    </header>
  );
}
