import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Base shimmering placeholder. Composes with `className` so callers
 * shape it however they need (h-4 w-32, h-10 w-10 rounded-full, etc.).
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Renders N skeleton rows shaped like list-page table rows. Drop in
 * place of the centered spinner used to mean "loading."
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b py-3 last:border-b-0"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          {Array.from({ length: columns - 1 }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn(
                'h-4',
                c === 0 ? 'w-32' : c === columns - 2 ? 'w-16' : 'w-24 flex-1',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Stat-card skeleton — the row of summary cards at the top of list
 * pages and the Dashboard.
 */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      role="status"
      aria-label="Loading stats"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}
