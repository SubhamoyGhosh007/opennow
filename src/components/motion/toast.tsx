"use client";
import * as React from "react";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; title: string; body?: string };

const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

/** Toast stack — transitions-dev `t-toast` hooks (slow in, snappy out). */
export function ToastHost({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { ...t, id }]);
    // exit slightly before removal so the close clock can play
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 3400);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-80 flex-col gap-2">
        {items.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const [open, setOpen] = useState(false);
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <div
      className={cn(
        "t-toast pointer-events-auto rounded-xl border border-border bg-popover p-3 text-[15px] text-popover-foreground shadow-xl",
        open && "is-open"
      )}
    >
      <p className="font-semibold">{toast.title}</p>
      {toast.body && <p className="mt-1 text-muted-foreground">{toast.body}</p>}
    </div>
  );
}
