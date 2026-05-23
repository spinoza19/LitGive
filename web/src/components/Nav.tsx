"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { BlockHeight } from "@/components/BlockHeight";
import { Logo } from "@/components/Logo";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const links = [
  { href: "/", label: "Browse", exact: true },
  { href: "/new", label: "Launch" },
  { href: "/me", label: "Dashboard" },
];

export function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="hidden md:flex items-center justify-between border-b border-border px-6 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
        <div className="flex items-center gap-6">
          <span>LitVM LiteForge · Testnet</span>
          <BlockHeight />
          <span>Chain ID · 4441</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Native · zkLTC</span>
          <span>Fee · 2.00%</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label="LitGive home"
        >
          <Logo
            size={28}
            accent
            className="shrink-0 transition-transform group-hover:rotate-[22.5deg] motion-reduce:group-hover:rotate-0"
          />
          <span className="leading-tight">
            <span className="block font-display text-2xl tracking-tight">
              LitGive
            </span>
            <span className="hidden sm:block eyebrow">
              Hard money, soft hearts
            </span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {links.map((l) => {
            const active = l.exact
              ? pathname === l.href
              : pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`transition-colors ${
                  active ? "text-gold" : "hover:text-gold"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="size-9 grid place-items-center border border-border hover:border-border-strong transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
          <div className="connect-wrap">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
