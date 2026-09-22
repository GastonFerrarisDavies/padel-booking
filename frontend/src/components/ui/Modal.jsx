"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

/**
 * Diálogo modal sobre `<dialog>` nativo (foco atrapado, Esc y ::backdrop gratis).
 * El contenido se monta solo mientras `open` es true, así los formularios internos se reinician.
 */
export function Modal({ open, onClose, title, description, size = "md", children, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-200 shadow-2xl shadow-black/50",
        "backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm",
        sizes[size],
      )}
    >
      {open && (
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4 p-6 pb-0">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
              {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mt-1 -mr-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
          {footer && <div className="flex justify-end gap-3 border-t border-slate-800 p-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
