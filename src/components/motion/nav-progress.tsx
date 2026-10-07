"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // When route changes, complete the bar and fade out
  React.useEffect(() => {
    if (active) {
      setProgress(100);
      const t = setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [pathname, searchParams]);

  // Listen to clicks on navigation links to trigger the indicator
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank"
      ) {
        return;
      }
      // If navigating to the exact current path, skip
      if (href === window.location.pathname) return;

      setActive(true);
      setProgress(40);
      const timer = setTimeout(() => {
        setProgress((prev) => (prev < 80 ? 80 : prev));
      }, 150);
      return () => clearTimeout(timer);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  if (!active && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-[2px] overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-[var(--ls-lime,#c8ff00)] to-primary shadow-[0_0_8px_rgba(200,255,0,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition:
            progress === 100
              ? "width 150ms ease-out, opacity 250ms ease-in"
              : "width 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}
