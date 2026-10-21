import React from 'react';
import { useI18n } from '../LanguageProvider';

/**
 * Session status type used throughout the app.
 * Maps to prototype STATUS object keys.
 */
export type SessionStatus = 'done' | 'live' | 'wait' | 'cancel' | 'noshow';

/**
 * Status config — styles only.
 * G3: zero hex values. All colours reference tokens.css.
 * Labels live in the i18n dictionary (common.sessionStatus) so they follow the UI language.
 */
export const SESSION_STATUS_CONFIG: Record<
  SessionStatus,
  { labelKey: string; bg: string; fg: string; dot: string }
> = {
  done: {
    labelKey: 'done',
    bg: 'var(--c-status-done-bg)',
    fg: 'var(--c-status-done-fg)',
    dot: 'var(--c-status-done-bg)',
  },
  live: {
    labelKey: 'live',
    bg: 'var(--c-status-live-bg)',
    fg: 'var(--c-status-live-fg)',
    dot: 'var(--c-status-live-bg)',
  },
  wait: {
    labelKey: 'wait',
    bg: 'var(--c-status-wait-bg)',
    fg: 'var(--c-status-wait-fg)',
    dot: 'var(--c-status-wait-dot)',
  },
  cancel: {
    labelKey: 'cancel',
    bg: 'var(--c-status-cancel-bg)',
    fg: 'var(--c-status-cancel-fg)',
    dot: 'var(--c-status-cancel-fg)',
  },
  noshow: {
    labelKey: 'noshow',
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
 * <Pill status="live" />   // "در حال تمرین" / "In progress"
 * <Pill status="noshow" /> // "غیبت" / "No show"
 */
export function Pill({ status, className = '' }: PillProps) {
  const { t } = useI18n();
  const cfg = SESSION_STATUS_CONFIG[status];
  const isCancel = status === 'cancel';
  const label = t.sessionStatus[cfg.labelKey as keyof typeof t.sessionStatus];

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2.5 h-7 rounded-md text-[14px] font-medium ${isCancel ? 'line-through' : ''} ${className}`}
      style={{ background: cfg.bg, color: cfg.fg }}
      aria-label={label}
    >
      {label}
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
