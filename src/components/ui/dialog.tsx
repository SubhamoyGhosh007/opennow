"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function closeAfterMs(): number {
  const v = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--modal-close-dur")
  );
  return Number.isFinite(v) ? v : 150;
}

// t-modal open/close: .is-open / .is-closing with cleanup, per transitions-dev.
export function Modal({
  open,
  onOpenChange,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [render, setRender] = React.useState(open);
  const [closing, setClosing] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (open) {
      if (timer.current) clearTimeout(timer.current);
      setRender(true);
      setClosing(false);
    } else if (render) {
      setClosing(true);
      timer.current = setTimeout(() => {
        setRender(false);
        setClosing(false);
      }, closeAfterMs());
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, render]);

  if (!render) return null;
  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Content
            className={cn(
              "t-modal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-popover p-4 text-popover-foreground shadow-2xl sm:p-6",
              !closing && "is-open",
              closing && "is-closing",
              className
            )}
          >
            {children}
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
