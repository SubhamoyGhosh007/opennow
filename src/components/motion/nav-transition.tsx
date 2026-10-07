"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Smooth transition navigation helper.
 * Uses React.startTransition so React transitions seamlessly without freezing DOM.
 */
export function navigateWithTransition(
  router: ReturnType<typeof useRouter>,
  href: string,
  _direction: "nav-forward" | "nav-back" = "nav-forward"
) {
  React.startTransition(() => {
    router.push(href);
  });
}

export function TransitionLink({
  href,
  direction = "nav-forward",
  children,
  className,
  onClick,
}: {
  href: string;
  direction?: "nav-forward" | "nav-back";
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
