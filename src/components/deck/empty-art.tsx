"use client";
import { cn } from "@/lib/utils";

/**
 * Small inline SVG spot illustrations for empty states.
 * Geometric, two-tone, theme-aware via currentColor + lime accents.
 */
export function EmptyArt({
  kind,
  className,
}: {
  kind: "queue" | "search" | "inbox";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 96"
      fill="none"
      aria-hidden
      className={cn("h-24 w-28 text-muted-foreground/60", className)}
    >
      {kind === "queue" && (
        <g>
          <rect x="28" y="18" width="64" height="60" rx="10" stroke="currentColor" strokeWidth="3" />
          <line x1="40" y1="34" x2="80" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="46" x2="68" y2="46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="74" cy="62" r="12" fill="var(--ls-lime, #c8ff00)" />
          <path d="M69 62l3.5 3.5L80 58" stroke="var(--ls-ink, #0d2833)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {kind === "search" && (
        <g>
          <circle cx="52" cy="42" r="22" stroke="currentColor" strokeWidth="3" />
          <line x1="68" y1="58" x2="86" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="46" y1="42" x2="58" y2="42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {kind === "inbox" && (
        <g>
          <path d="M24 34h72l-8 44H32l-8-44z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="M24 34l14 12h44l14-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="88" cy="30" r="10" fill="var(--ls-lime, #c8ff00)" />
          <text x="88" y="34" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ls-ink, #0d2833)">0</text>
        </g>
      )}
    </svg>
  );
}
