import type { Metadata } from "next";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "LitGive — Onchain donations on LitVM",
  description:
    "Generic donation marketplace on LitVM. Launch a campaign for any cause and accept zkLTC.",
  openGraph: {
    title: "LitGive — Onchain donations on LitVM",
    description:
      "Launch a campaign for any cause — charity, creator, public good, personal — and accept zkLTC with full transparency.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LitGive — Onchain donations on LitVM",
    description:
      "Onchain donation marketplace built on LitVM. Sub-cent fees, transparent flows, no middlemen.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mt-16 border-t border-border py-6 text-center text-xs text-muted">
            Built on LitVM LiteForge testnet · Chain ID 4441 · zkLTC
          </footer>
        </Providers>
      </body>
    </html>
  );
}
