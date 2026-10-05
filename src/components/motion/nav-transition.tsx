"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * View-transition-aware navigation (progressive enhancement).
 * React 18 + Next 14 has no <ViewTransition> component, so this helper
 * uses the native document.startViewTransition when available and falls
 * back to a plain transition otherwise. Direction tags mirror the
 * vercel-react-view-transitions `nav-forward` / `nav-back` types so the
 * CSS in view-transitions.css applies in both worlds.
 */
export function navigateWithTransition(
  router: ReturnType<typeof useRouter>,
  href: string,
  direction: "nav-forward" | "nav-back" = "nav-forward"
) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> };
  };
  const run = () => router.push(href);
  if (typeof doc.startViewTransition === "function") {
    try {
      doc.startViewTransition(() => {
        React.startTransition(run);
      });
      return;
    } catch {
      /* fall through */
    }
  }
  React.startTransition(run);
}

export function TransitionLink({
  href,
  direction = "nav-forward",
  children,
  className,
}: {
  href: string;
  direction?: "nav-forward" | "nav-back";
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        // Same-tab left clicks go through the transition helper.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigateWithTransition(router, href, direction);
      }}
    >
      {children}
    </Link>
  );
}
