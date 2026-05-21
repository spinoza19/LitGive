"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GoalProgress } from "@/components/GoalProgress";
import type { DisplayCampaign } from "@/lib/display";
import { formatLTC, timeLeft, categoryLabel } from "@/lib/format";

export function CampaignCard({
  c,
  size = "default",
  index = 0,
}: {
  c: DisplayCampaign;
  size?: "default" | "compact" | "feature";
  index?: number;
}) {
  if (size === "feature") return <FeatureCard c={c} />;
  if (size === "compact") return <CompactRow c={c} />;
  return <DefaultCard c={c} index={index} />;
}

function PlaceholderArt({ category }: { category: string }) {
  // Abstract editorial placeholder when no image is provided.
  return (
    <div className="size-full bg-secondary halftone grid place-items-center">
      <span className="font-display text-5xl text-foreground/40 italic">
        {categoryLabel(category)}
      </span>
    </div>
  );
}

function DefaultCard({ c, index }: { c: DisplayCampaign; index: number }) {
  const pct = c.goal > 0 ? Math.min(100, (c.raised / c.goal) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className="group h-full"
    >
      <Link
        href={`/campaign/${c.id}`}
        className="block h-full border border-border hover:border-border-strong bg-card transition-colors"
      >
        <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-muted">
          {c.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.image}
              alt=""
              className="size-full object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
              loading="lazy"
            />
          ) : (
            <PlaceholderArt category={c.category} />
          )}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 text-[0.62rem] font-mono uppercase tracking-[0.18em]">
            <span className="bg-background/85 backdrop-blur px-2 py-1 border border-border">
              Issue №{String(c.issue).padStart(3, "0")}
            </span>
            <span className="bg-background/85 backdrop-blur px-2 py-1 border border-border">
              {c.mode}
            </span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="eyebrow">{categoryLabel(c.category)}</div>
          <h3 className="font-display text-2xl leading-[1.05] tracking-tight">
            {c.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {c.excerpt}
          </p>
          <div className="pt-2 space-y-2">
            <div className="flex h-1.5 gap-[2px]">
              {Array.from({ length: 24 }).map((_, i) => {
                const active = i < Math.round((pct / 100) * 24);
                return (
                  <div
                    key={i}
                    className={`flex-1 ${active ? "bg-gold" : "bg-muted"}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between items-baseline">
              <span className="num text-sm">
                <span className="text-foreground">
                  {formatLTC(c.raised, c.raised < 1 ? 4 : 0)}
                </span>
                <span className="text-muted-foreground">
                  {" / "}
                  {formatLTC(c.goal, c.goal < 1 ? 4 : 0)} zkLTC
                </span>
              </span>
              {c.deadline > 0 && (
                <span className="eyebrow num">{timeLeft(c.deadline)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FeatureCard({ c }: { c: DisplayCampaign }) {
  return (
    <Link
      href={`/campaign/${c.id}`}
      className="group block border-y border-rule"
    >
      <div className="grid lg:grid-cols-12 gap-0">
        <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden border-r border-border">
          {c.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.image}
              alt=""
              className="size-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-[1200ms]"
            />
          ) : (
            <PlaceholderArt category={c.category} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          <div className="absolute top-4 left-4 flex gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em]">
            <span className="bg-background/90 backdrop-blur px-2 py-1 border border-border">
              Featured · Issue №{String(c.issue).padStart(3, "0")}
            </span>
          </div>
        </div>
        <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <div className="eyebrow">
              {categoryLabel(c.category)} —{" "}
              {c.mode === "AON" ? "All or nothing" : "Keep what you raise"}
            </div>
            <h2 className="display-lg">{c.title}</h2>
            {c.pull && (
              <blockquote className="border-l-2 border-gold pl-4 font-display italic text-xl leading-snug text-foreground/85">
                &quot;{c.pull}&quot;
              </blockquote>
            )}
            <p className="text-muted-foreground leading-relaxed">
              {c.excerpt}
            </p>
          </div>
          <div>
            <GoalProgress raised={c.raised} goal={c.goal} />
            <div className="mt-6 flex items-center justify-between">
              <span className="eyebrow">
                {c.deadline > 0 ? `${timeLeft(c.deadline)} left` : "Open ended"}
              </span>
              <span className="font-display text-xl underline underline-offset-4 decoration-1 group-hover:text-gold transition-colors">
                Read &amp; give →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CompactRow({ c }: { c: DisplayCampaign }) {
  const pct = c.goal > 0 ? Math.min(100, (c.raised / c.goal) * 100) : 0;
  return (
    <Link
      href={`/campaign/${c.id}`}
      className="group grid grid-cols-[60px_1fr_auto] gap-4 items-center py-4 border-b border-border hover:bg-accent/40 px-3 -mx-3 transition-colors"
    >
      <span className="eyebrow num">№{String(c.issue).padStart(3, "0")}</span>
      <div className="min-w-0">
        <div className="font-display text-lg leading-tight truncate group-hover:text-gold transition-colors">
          {c.title}
        </div>
        <div className="eyebrow mt-1">
          {categoryLabel(c.category)}
          {c.deadline > 0 && ` · ${timeLeft(c.deadline)} left`}
        </div>
      </div>
      <div className="text-right">
        <div className="num text-sm tabular-nums">
          {formatLTC(c.raised, c.raised < 1 ? 4 : 0)} /{" "}
          {formatLTC(c.goal, c.goal < 1 ? 4 : 0)}
        </div>
        <div className="num text-xs text-muted-foreground">
          {pct.toFixed(0)}%
        </div>
      </div>
    </Link>
  );
}
