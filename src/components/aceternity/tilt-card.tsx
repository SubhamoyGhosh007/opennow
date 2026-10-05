"use client";
import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Aceternity-style 3-D tilt card. Pointer tracked on the flat outer
 * wrapper (per transitions-dev guidance); springs smooth the return.
 */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-9, 9]), { stiffness: 180, damping: 18 });

  return (
    <div
      ref={ref}
      className={cn("ac-tilt", className)}
      data-tilting="false"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        el.dataset.tilting = "true";
        const r = el.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={(e) => {
        const el = e.currentTarget;
        el.dataset.tilting = "false";
        px.set(0.5);
        py.set(0.5);
      }}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry }} className="ac-tilt-card h-full">
        {children}
      </motion.div>
    </div>
  );
}
