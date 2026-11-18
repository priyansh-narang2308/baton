"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** The link behind a QR code, as text with a copy button, so it can be pasted into a chat. Hidden when printing. */
export function CopyLink({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        const text = e.currentTarget.querySelector("[data-url]");
        const copy = navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject(new Error("no clipboard"));
        copy.then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          },
          // Clipboard blocked: select the link so it can be copied by hand.
          () => {
            if (!text) return;
            const range = document.createRange();
            range.selectNodeContents(text);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);
          },
        );
      }}
      aria-label={`Copy ${label} link`}
      className="mt-4 flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5 text-left font-mono text-xs text-text-2 hover:bg-surface-2 print:hidden"
    >
      <span data-url className="flex-1 select-all break-all">{url}</span>
      {copied ? <Check className="size-4 shrink-0 text-done" aria-hidden /> : <Copy className="size-4 shrink-0" aria-hidden />}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
