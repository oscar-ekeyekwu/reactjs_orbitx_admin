import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Lucide icon component, rendered above the heading. */
  icon?: LucideIcon;
  /** Short heading — "No drivers yet", "No pending approvals", etc. */
  title: string;
  /** Optional one-liner describing the situation or next step. */
  description?: string;
  /** Optional CTA — primary action the admin can take from here. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standard zero-state for list views. Replaces the plain "No X found"
 * text scattered across pages with a centered icon + heading +
 * (optional) action, so empty queries feel intentional rather than
 * like a stuck page.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
