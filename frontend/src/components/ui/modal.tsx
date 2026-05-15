"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "w-full max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl safe-bottom",
              sizes[size],
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[hsl(var(--border))] flex-shrink-0">
                <h2 className="font-display text-base sm:text-lg font-semibold truncate pr-3">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
