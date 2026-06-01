import Link from "next/link";
import { BlockHeight } from "@/components/BlockHeight";
import { Logo } from "@/components/Logo";
import { NETWORK } from "@/lib/display";
import { shortAddr } from "@/lib/format";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-rule">
      <div className="px-6 py-10 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-3">
            <Logo size={36} accent />
            <span className="font-display text-3xl tracking-tight">
              LitGive
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Donations, transparent by default. Built on LitVM. Litecoin&apos;s
            first ZK rollup. Hard money for soft hands.
          </p>
        </div>
        <div className="md:col-span-3 space-y-2">
          <div className="eyebrow mb-3">Network</div>
          <Row k="Chain" v={`${NETWORK.name} · ${NETWORK.chainId}`} />
          <Row k="Block" v={<BlockHeight />} />
          <Row
            k="Contract"
            v={
              <a
                href={`${NETWORK.explorer}/address/${NETWORK.contract}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-gold"
              >
                {shortAddr(NETWORK.contract)}
              </a>
            }
          />
          <Row k="Fee" v="2.00% @ withdraw" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <div className="eyebrow mb-3">Reading</div>
          <FootLink href="https://docs.litvm.com" external>
            LitVM docs
          </FootLink>
          <FootLink href="https://github.com/spinoza19/LitGive" external>
            Source
          </FootLink>
          <FootLink href="https://testnet.litvm.com" external>
            Faucet
          </FootLink>
        </div>
        <div className="md:col-span-2 space-y-2">
          <div className="eyebrow mb-3">Channels</div>
          <FootLink href="https://x.com/lit_give" external>
            Twitter
          </FootLink>
          <FootLink href="https://t.me/litecoinvm" external>
            Telegram
          </FootLink>
          <FootLink href={NETWORK.explorer} external>
            Explorer
          </FootLink>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 flex flex-col sm:flex-row gap-2 justify-between font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
        <span>© {new Date().getFullYear()} LitGive · A public good</span>
        <span>Built on LitVM · Litecoin&apos;s first ZK rollup</span>
      </div>
    </footer>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="num text-foreground">{v}</span>
    </div>
  );
}

function FootLink({
  children,
  href,
  external,
}: {
  children: React.ReactNode;
  href: string;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block text-sm hover:text-gold transition-colors"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="block text-sm hover:text-gold transition-colors">
      {children}
    </Link>
  );
}
