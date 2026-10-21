import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { getNotifications, type AppNotification } from '../../api/notifications';
import { useI18n } from '../LanguageProvider';
import { subscribeToStore } from '../../api/auth';
import { num } from '../../lib/format';

/**
 * NotificationBell — دکمه زنگ + کشوی اعلان‌ها.
 * اعلان‌ها از داده‌های زنده استور محاسبه می‌شوند (نه لیست هاردکد).
 */

const SEVERITY_STYLE: Record<
  AppNotification['severity'],
  { icon: React.ElementType; color: string; bg: string }
> = {
  info: { icon: Info, color: 'var(--c-steel)', bg: 'var(--c-surface-2)' },
  success: { icon: CheckCircle2, color: 'var(--c-avail-fg)', bg: 'var(--c-surface-2)' },
  warning: { icon: AlertTriangle, color: 'var(--c-brass)', bg: 'var(--c-status-noshow-bg)' },
  critical: { icon: AlertCircle, color: 'var(--c-rubber)', bg: 'var(--c-status-noshow-bg)' },
};

export interface NotificationBellProps {
  /** اگر داده شود، با کلیک روی اعلان به این تب می‌رود */
  onNavigateTab?: (tab: string) => void;
  /** اگر true باشد، نشان نقطه‌ای فقط در صورت وجود اعلان بحرانی/هشدار نمایش داده می‌شود */
  badgeOnlyWhenUrgent?: boolean;
  className?: string;
}

export function NotificationBell({
  onNavigateTab,
  badgeOnlyWhenUrgent = false,
  className = '',
}: NotificationBellProps) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const load = () => {
    getNotifications(lang).then(setNotifications);
  };

  useEffect(() => {
    load();
    return subscribeToStore(load);
  }, [lang]);

  const hasBadge = badgeOnlyWhenUrgent
    ? notifications.some(n => n.severity === 'critical' || n.severity === 'warning')
    : notifications.length > 0;

  const handleNavigate = (n: AppNotification) => {
    if (n.targetTab && onNavigateTab) {
      onNavigateTab(n.targetTab);
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className={`relative h-10 w-10 rounded-xl border grid place-items-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer ${className}`}
        aria-label={t.notifications.title + (hasBadge ? ` (${num(notifications.length)})` : '')}
        aria-expanded={open}
      >
        <Bell size={18} />
        {hasBadge && (
          <span
            style={{ backgroundColor: 'var(--c-rubber)' }}
            className="absolute top-2.5 left-2.5 h-2 w-2 rounded-full"
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--c-surface-0)',
                borderColor: 'var(--c-border)',
              }}
              className="absolute inset-y-0 end-0 w-full max-w-sm border-s flex flex-col shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="اعلان‌ها"
            >
              {/* سربرگ کشو */}
              <div
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
                className="flex items-center justify-between gap-3 px-4 py-4 border-b shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Bell size={18} style={{ color: 'var(--c-steel)' }} />
                  <h2 className="font-bold text-[16px]" style={{ color: 'var(--c-deep)' }}>{t.notifications.title}</h2>
                  {notifications.length > 0 && (
                    <span
                      style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-text-muted)' }}
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                    >
                      {num(notifications.length)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-lg grid place-items-center cursor-pointer"
                  style={{ color: 'var(--c-text-muted)' }}
                  aria-label="بستن اعلان‌ها"
                >
                  <X size={18} />
                </button>
              </div>

              {/* فهرست اعلان‌ها */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 thin-scroll">
                {notifications.length === 0 ? (
                  <div className="py-16 text-center">
                    <CheckCircle2
                      size={32}
                      className="mx-auto"
                      style={{ color: 'var(--c-avail-fg)' }}
                    />
                    <p className="mt-3 text-[14px] font-bold" style={{ color: 'var(--c-deep)' }}>
                      {t.notifications.empty}
                    </p>
                    <p className="mt-1 text-[12px]" style={{ color: 'var(--c-text-muted)' }}>
                      {t.notifications.emptyHint}
                    </p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const style = SEVERITY_STYLE[n.severity];
                    const Icon = style.icon;
                    const clickable = Boolean(n.targetTab && onNavigateTab);

                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNavigate(n)}
                        disabled={!clickable}
                        style={{
                          backgroundColor: 'var(--c-surface-1)',
                          borderColor: 'var(--c-border)',
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-right flex items-start gap-3 ${
                          clickable
                            ? 'hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer'
                            : 'cursor-default'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: style.bg, color: style.color }}
                          className="h-9 w-9 rounded-xl grid place-items-center shrink-0"
                        >
                          <Icon size={17} />
                        </span>

                        <div className="flex-1 min-w-0">
                          <div
                            className="font-bold text-[14px] leading-snug"
                            style={{ color: 'var(--c-deep)' }}
                          >
                            {n.title}
                          </div>
                          <div
                            className="text-[12px] mt-1 leading-5"
                            style={{ color: 'var(--c-text-muted)' }}
                          >
                            {n.body}
                          </div>
                        </div>

                        {clickable && (
                          <ChevronLeft
                            size={16}
                            className="shrink-0 mt-1"
                            style={{ color: 'var(--c-text-faint)' }}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
