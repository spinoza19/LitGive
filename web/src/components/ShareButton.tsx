"use client";

import { useState } from "react";

export function ShareButton({
  url,
  title,
  text,
}: {
  url: string;
  title: string;
  text: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${text}\n\n${url}`
  )}`;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(
    url
  )}&text=${encodeURIComponent(text)}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text, url });
      } catch {
        // user cancelled
      }
    } else {
      setOpen((v) => !v);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={nativeShare}
        className="btn-secondary text-xs"
      >
        Share
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-panel shadow-xl z-20 p-1 text-sm">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 hover:bg-bg rounded"
          >
            <span>𝕏</span> Share on X
          </a>
          <a
            href={tgUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 hover:bg-bg rounded"
          >
            <span>✈️</span> Telegram
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 hover:bg-bg rounded"
          >
            <span>💬</span> WhatsApp
          </a>
          <button
            type="button"
            onClick={copy}
            className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-bg rounded"
          >
            <span>🔗</span> {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
