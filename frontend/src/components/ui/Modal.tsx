import { X } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: "md" | "lg";
};

const sizeClasses = {
  md: "max-w-lg",
  lg: "max-w-3xl"
};

export function Modal({ children, footer, onClose, open, size = "md", title }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        aria-modal="true"
        className={`w-full ${sizeClasses[size]} rounded-ui border border-surface-600 bg-surface-elevated shadow-panel`}
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-surface-500 px-5 py-4">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <Button aria-label="Fechar" className="h-8 w-8 px-0" onClick={onClose} type="button" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-4 text-sm text-text-secondary">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-surface-500 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
