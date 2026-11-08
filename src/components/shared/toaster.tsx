"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast.store";

const TOAST_MS = 3000;

export function Toaster() {
  const message = useToastStore((state) => state.message);
  const seq = useToastStore((state) => state.seq);
  const clear = useToastStore((state) => state.clear);
  const visible = useToastStore((state) => state.visible);

  useEffect(() => {
    if (seq === 0) return;
    const timer = setTimeout(clear, TOAST_MS);
    return () => clearTimeout(timer);
  }, [seq, clear]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none fixed bottom-8 left-1/2 z-70 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md bg-night px-5 py-3 font-medium text-white shadow-[0_16px_40px_rgba(16,24,40,0.18)] transition duration-200",
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
      )}
    >
      {message}
    </div>
  );
}
