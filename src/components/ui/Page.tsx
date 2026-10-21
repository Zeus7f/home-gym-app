/**
 * src/components/ui/Page.tsx
 * اجزای چیدمان صفحه: سرصفحه با کنش‌ها، کارت سطح، کاشی آمار.
 * همه با min-w-0 و شکست خط تا در عرض ۳۲۰px هم از صفحه بیرون نزنند.
 */

import React from 'react';
import { cn } from '../../lib/utils';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5 min-w-0">
      <div className="min-w-0 flex-1 basis-56">
        <h2 className="text-[20px] sm:text-[22px] font-extrabold leading-tight break-words" style={{ color: 'var(--c-heading)' }}>
          {title}
        </h2>
        {description && (
          <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 min-w-0">{actions}</div>}
    </div>
  );
}

export function Panel({
  children,
  className,
  padded = true,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      {...rest}
      className={cn('min-w-0 rounded-2xl border', padded && 'p-4 sm:p-5', className)}
      style={{ backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border)', ...rest.style }}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'ink',
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  tone?: 'ink' | 'brass' | 'rubber' | 'steel';
}) {
  const color = { ink: 'var(--c-ink)', brass: 'var(--c-brass)', rubber: 'var(--c-rubber)', steel: 'var(--c-steel)' }[tone];
  return (
    <Panel className="flex items-center gap-3 !p-3 sm:!p-5">
      {Icon && (
        <span className="hidden sm:grid h-11 w-11 rounded-xl place-items-center shrink-0" style={{ backgroundColor: 'var(--c-surface-2)', color }}>
          <Icon size={20} />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--c-text-muted)' }}>
          {label}
        </div>
        <div className="text-[20px] sm:text-[22px] font-extrabold leading-tight truncate" style={{ color: 'var(--c-heading)' }}>
          {value}
        </div>
      </div>
    </Panel>
  );
}

/** برچسب وضعیت کوچک */
export function StatusPill({ tone, children }: { tone: 'ok' | 'warn' | 'off' | 'info'; children: React.ReactNode }) {
  const styles = {
    ok: { bg: 'var(--c-avail-bg)', fg: 'var(--c-avail-fg)' },
    warn: { bg: 'var(--c-status-live-bg)', fg: 'var(--c-status-live-fg)' },
    off: { bg: 'var(--c-status-cancel-bg)', fg: 'var(--c-status-cancel-fg)' },
    info: { bg: 'var(--c-status-wait-bg)', fg: 'var(--c-status-wait-fg)' },
  }[tone];
  return (
    <span
      className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-bold whitespace-nowrap"
      style={{ backgroundColor: styles.bg, color: styles.fg }}
    >
      {children}
    </span>
  );
}
