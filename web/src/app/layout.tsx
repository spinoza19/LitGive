import type { Metadata } from "next";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { fraunces, interTight, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "LitGive · Donations, transparent by default",
  description:
    "Onchain donation marketplace built on LitVM, Litecoin's first ZK rollup. Public good, public ledger.",
  openGraph: {
    title: "LitGive · Donations, transparent by default",
    description:
      "A donation marketplace on LitVM. Anyone can launch a campaign. Every transaction is public.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LitGive · Donations, transparent by default",
    description:
      "Onchain donation marketplace on LitVM. Sub-cent fees, transparent flows, no middlemen.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
