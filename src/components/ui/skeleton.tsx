import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export function QueueSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
          <Skeleton className="h-5 w-24 skeleton-shimmer" />
          <Skeleton className="h-5 flex-1 skeleton-shimmer" />
          <Skeleton className="h-5 w-12 skeleton-shimmer" />
          <Skeleton className="h-5 w-20 skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
