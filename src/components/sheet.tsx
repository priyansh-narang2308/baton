"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "./ui";

/** Bottom sheet on phones, right-hand drawer on wide screens. Escape and the backdrop close it. */
export function Sheet({ title, onClose, children, footer, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  // Runs once per opening. (Re-running on every parent render used to pull focus back to the close button
  // mid-typing, so Enter closed the sheet.)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // Respect a child that focused itself (e.g. a prefilled message box); otherwise focus the close button.
    if (!panelRef.current?.contains(document.activeElement)) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <button aria-label="Close" tabIndex={-1} className="anim-fade absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={panelRef}
        className={cx(
          "anim-sheet absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl border border-border bg-bg shadow-pop",
          "lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:rounded-none lg:rounded-l-2xl",
          wide ? "lg:w-[520px]" : "lg:w-[440px]",
        )}
      >
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1 text-[15px] font-semibold">{title}</div>
          <button ref={closeRef} onClick={onClose} aria-label="Close panel" className="grid size-8 place-items-center rounded-lg text-text-2 hover:bg-surface-2 hover:text-text">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer}
      </div>
    </div>
  );
}
