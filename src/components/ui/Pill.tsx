import React from 'react';

/**
 * Session status type used throughout the app.
 * Maps to prototype STATUS object keys.
 */
export type SessionStatus = 'done' | 'live' | 'wait' | 'cancel' | 'noshow';

/**
 * Status config — labels and CSS-variable-based styles.
 * G3: zero hex values. All colours reference tokens.css.
 */
export const SESSION_STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; bg: string; fg: string; dot: string }
> = {
  done: {
    label: 'تکمیل شد',
    bg: 'var(--c-status-done-bg)',
    fg: 'var(--c-status-done-fg)',
    dot: 'var(--c-status-done-bg)',
  },
  live: {
    label: 'در حال تمرین',
    bg: 'var(--c-status-live-bg)',
    fg: 'var(--c-status-live-fg)',
    dot: 'var(--c-status-live-bg)',
  },
  wait: {
    label: 'در انتظار ورود',
    bg: 'var(--c-status-wait-bg)',
    fg: 'var(--c-status-wait-fg)',
    dot: 'var(--c-status-wait-dot)',
  },
  cancel: {
    label: 'لغو شده',
    bg: 'var(--c-status-cancel-bg)',
    fg: 'var(--c-status-cancel-fg)',
    dot: 'var(--c-status-cancel-fg)',
  },
  noshow: {
    label: 'غیبت',
    bg: 'var(--c-status-noshow-bg)',
    fg: 'var(--c-status-noshow-fg)',
    dot: 'var(--c-status-noshow-dot)',
  },
};

export interface PillProps {
  /** Session status key */
  status: SessionStatus;
  className?: string;
}

/**
 * Pill — inline session-status badge.
 *
 * G3: token-based colours.
 * G5: text carries meaning (not colour alone).
 *
 * @example
 * <Pill status="live" />   // "در حال تمرین"
 * <Pill status="noshow" /> // "غیبت"
 */
export function Pill({ status, className = '' }: PillProps) {
  const cfg = SESSION_STATUS_CONFIG[status];
  const isCancel = status === 'cancel';

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2.5 h-7 rounded-md text-[14px] font-medium ${isCancel ? 'line-through' : ''} ${className}`}
      style={{ background: cfg.bg, color: cfg.fg }}
      aria-label={cfg.label}
    >
      {cfg.label}
    </span>
  );
}

/**
 * StatusDot — small coloured dot for compact list views.
 */
export function StatusDot({ status }: { status: SessionStatus }) {
  const cfg = SESSION_STATUS_CONFIG[status];
  const isLive = status === 'live';
  return (
    <span
      className={`h-2 w-2 rounded-full shrink-0 ${isLive ? 'live-pulse' : ''}`}
      style={{ background: cfg.dot }}
      aria-hidden
    />
  );
}
