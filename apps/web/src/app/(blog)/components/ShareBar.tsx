"use client";

import { useState } from "react";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  // Native sheet where it exists (mobile); the explicit links below cover desktop.
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enc = encodeURIComponent;

  return (
    <div className="k-share">
      <span className="k-share__label">Bagikan</span>
      <button type="button" className="k-share__btn" onClick={share}>
        {copied ? "Tersalin ✓" : "Salin tautan"}
      </button>
      <a
        className="k-share__btn"
        href={`https://wa.me/?text=${enc(`${title} ${url}`)}`}
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp
      </a>
      <a
        className="k-share__btn"
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noreferrer"
      >
        X
      </a>
    </div>
  );
}
