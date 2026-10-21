import React from 'react';
import { cn } from '../../lib/utils';

/**
 * H — Section header with optional subtitle and action slot.
 * G3: all colours from CSS variables.
 * G5: semantic h2, accessible structure.
 */
export interface HProps {
  children: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function H({ children, sub, action, className }: HProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2
          className="text-[17px] font-bold leading-snug"
          style={{ color: 'var(--c-heading)' }}
        >
          {children}
        </h2>
        {sub && (
          <div className="text-[14px] mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
            {sub}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
