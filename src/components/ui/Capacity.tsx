import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { num } from '../../lib/format';
import { useI18n } from '../LanguageProvider';
import { getCurrentHour } from '../../lib/date/jalali';
import { SessionStatus } from './Pill';

export interface CapacitySessionItem {
  id?: string | number;
  /** ساعت شروع جلسه (عدد بین ۰ تا ۲۳ یا رشته مثل "۰۸:۰۰" / "08:00") */
  h?: number;
  time?: string;
  /** وضعیت جلسه */
  s?: SessionStatus | string;
  status?: string;
}

export interface CapacityProps {
  /** حالت فشرده برای نمایش در موبایل یا سایدبار */
  compact?: boolean;
  /** لیست جلسات روز (در صورت خالی بودن، نمونه نمایشی استفاده می‌شود) */
  sessions?: CapacitySessionItem[];
  /** ظرفیت کل روزانه باشگاه (پیش‌فرض: ۳۰) */
  totalCapacity?: number;
  /** ظرفیت همزمان هر ساعت (پیش‌فرض: ۶) */
  hourCap?: number;
  /** ساعت جاری جهت نمایش حلقه نشانگر الان (پیش‌فرض: ساعت واقعی سیستم) */
  currentHour?: number;
  className?: string;
}

const ORDER: SessionStatus[] = ['done', 'live', 'wait', 'noshow'];

const SEG_COLORS: Record<SessionStatus, string> = {
  done: 'var(--c-seg-done)',
  live: 'var(--c-seg-live)',
  wait: 'var(--c-seg-wait)',
  cancel: 'var(--c-status-cancel-bg)',
  noshow: 'var(--c-seg-noshow)',
};

/**
 * نگاشت وضعیت‌های مختلف موجود در سیستم به وضعیت استاندارد
 */
function normalizeStatus(st?: string): SessionStatus {
  if (!st) return 'wait';
  const lower = st.toLowerCase();
  if (lower === 'done' || lower === 'completed') return 'done';
  if (lower === 'live' || lower === 'in_progress') return 'live';
  if (lower === 'cancel' || lower === 'cancelled') return 'cancel';
  if (lower === 'noshow') return 'noshow';
  return 'wait';
}

function parseHour(item: CapacitySessionItem): number {
  if (typeof item.h === 'number') return item.h;
  if (item.time) {
    // تبدیل ارقام فارسی به لاتین برای خواندن ساعت
    const raw = item.time.replace(/[\u06F0-\u06F9]/g, d =>
      String.fromCharCode(48 + (d.charCodeAt(0) - 0x06f0))
    );
    const parsed = parseInt(raw.split(':')[0], 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 8;
}

// داده‌های پیش‌فرض پروتوتایپ جهت نمایش مستقل
const DEFAULT_SESSIONS: CapacitySessionItem[] = [
  { h: 8, s: 'done' }, { h: 8, s: 'done' },
  { h: 9, s: 'done' }, { h: 10, s: 'done' }, { h: 10, s: 'noshow' },
  { h: 17, s: 'done' }, { h: 18, s: 'done' }, { h: 18, s: 'done' },
  { h: 19, s: 'done' }, { h: 20, s: 'live' }, { h: 20, s: 'live' },
  { h: 20, s: 'live' }, { h: 20, s: 'live' }, { h: 21, s: 'wait' },
  { h: 21, s: 'wait' }, { h: 21, s: 'wait' }, { h: 21, s: 'wait' },
  { h: 22, s: 'wait' }
];

/**
 * Capacity — ویجت هوشمند وضعیت ظرفیت امروز باشگاه
 *
 * G3: بدون هگز مستقیم — تمام رنگ‌ها از توکن‌های طراحی
 * G7: ساعت جاری پویا از طریق getCurrentHour() بدون مقدار هاردکد
 */
export function Capacity({
  compact = false,
  sessions = DEFAULT_SESSIONS,
  totalCapacity = 30,
  hourCap = 6,
  currentHour,
  className,
}: CapacityProps) {
  const { t } = useI18n();
  const activeNowHour = currentHour ?? getCurrentHour();

  // فیلتر موارد غیرلغوشده
  const activeSessions = sessions.filter(
    s => normalizeStatus(s.s || s.status) !== 'cancel'
  );

  const counts: Record<SessionStatus, number> = {
    done: 0,
    live: 0,
    wait: 0,
    noshow: 0,
    cancel: 0,
  };

  activeSessions.forEach(s => {
    const st = normalizeStatus(s.s || s.status);
    counts[st] = (counts[st] || 0) + 1;
  });

  const occupied = activeSessions.length;
  const free = Math.max(0, totalCapacity - occupied);
  const percentage = Math.round((occupied / totalCapacity) * 100);
  // ۸:۰۰ تا ۲۲:۰۰
  const hoursRange = Array.from({ length: 15 }, (_, i) => 8 + i);

  return (
    <section
      style={{
        backgroundColor: 'var(--c-surface-1)',
        borderColor: 'var(--c-border)',
      }}
      className={cn(
        'rounded-2xl border transition-all duration-200 shadow-xs',
        compact ? 'p-4' : 'p-6',
        className
      )}
      aria-label={t.owner.capacity.ariaLabel}
    >
      {/* هدر ویجت */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
            {t.owner.capacity.todayTitle}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              style={{ color: 'var(--c-ink)' }}
              className={cn(
                'font-display leading-[0.9] tnum',
                compact ? 'text-[52px]' : 'text-[68px]'
              )}
            >
              {num(occupied)}
            </span>
            <span
              style={{ color: 'var(--c-text-faint)' }}
              className={cn('font-display', compact ? 'text-[24px]' : 'text-[30px]')}
            >
              / {t.owner.capacity.totalOf.replace('{count}', num(totalCapacity))}
            </span>
          </div>
        </div>

        <div className="text-left">
          <div
            style={{
              backgroundColor: 'var(--c-avail-bg)',
              color: 'var(--c-avail-fg)',
            }}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-full text-[14px] font-semibold"
          >
            <span
              style={{ backgroundColor: 'var(--c-avail-dot)' }}
              className="h-2 w-2 rounded-full"
            />
            <span>{t.owner.capacity.freeSlots.replace('{count}', num(free))}</span>
          </div>
          <div className="text-[14px] mt-2" style={{ color: 'var(--c-text-muted)' }}>
            {t.owner.capacity.filled.replace('{count}', num(percentage))}
          </div>
        </div>
      </div>

      {/* نوار پشته‌ای متحرک (Stacked Bar) */}
      <div
        className={cn(
          'flex rounded-full overflow-hidden select-none',
          compact ? 'mt-4 h-4' : 'mt-5 h-5'
        )}
        style={{
          background:
            'repeating-linear-gradient(135deg, var(--c-surface-2) 0 6px, var(--c-border) 6px 12px)',
        }}
      >
        {ORDER.map((k, i) => {
          const widthPct = (counts[k] / totalCapacity) * 100;
          if (widthPct <= 0) return null;
          return (
            <motion.div
              key={k}
              initial={{ width: 0 }}
              animate={{ width: `${widthPct}%` }}
              transition={{
                delay: 0.1 + i * 0.12,
                duration: 0.6,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              style={{ backgroundColor: SEG_COLORS[k] }}
              className={cn(
                'h-full',
                k === 'live' && 'live-pulse',
                i > 0 && 'border-r-2 border-white dark:border-slate-900'
              )}
            />
          );
        })}
      </div>

      {/* راهنمای رنگ‌های نوار (Legend) */}
      <div
        className={cn(
          'mt-3 grid gap-x-3',
          compact ? 'grid-cols-2 gap-y-2' : 'grid-cols-5'
        )}
      >
        {ORDER.map(k => (
          <div key={k} className="flex items-center gap-2 min-w-0">
            <span
              style={{ backgroundColor: SEG_COLORS[k] }}
              className="h-3 w-3 rounded-[3px] shrink-0"
              aria-hidden
            />
            <span
              className="text-[14px] truncate"
              style={{ color: 'var(--c-text-muted)' }}
            >
              {t.owner.capacity.status[k]}
            </span>
            <span
              className="text-[15px] font-bold tnum"
              style={{ color: 'var(--c-deep)' }}
            >
              {num(counts[k])}
            </span>
          </div>
        ))}
        {!compact && (
          <div className="flex items-center gap-2 min-w-0">
            <span
              style={{
                background:
                  'repeating-linear-gradient(135deg, var(--c-surface-2) 0 3px, var(--c-border-strong) 3px 6px)',
              }}
              className="h-3 w-3 rounded-[3px] shrink-0"
              aria-hidden
            />
            <span
              className="text-[14px] truncate"
              style={{ color: 'var(--c-text-muted)' }}
            >
              {t.owner.capacity.free}
            </span>
            <span
              className="text-[15px] font-bold tnum"
              style={{ color: 'var(--c-deep)' }}
            >
              {num(free)}
            </span>
          </div>
        )}
      </div>

      {/* شلوغی ساعت به ساعت (Hour-by-hour Floor) */}
      <div
        style={{ borderColor: 'var(--c-surface-2)' }}
        className={cn('pt-4 border-t', compact ? 'mt-5' : 'mt-6')}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-semibold" style={{ color: 'var(--c-deep)' }}>
            {t.owner.capacity.hourlyTitle}
          </span>
          <span className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
            {t.owner.capacity.perHour.replace('{count}', num(hourCap))}
          </span>
        </div>

        <div className={cn('flex items-end', compact ? 'gap-[3px]' : 'gap-1.5')}>
          {hoursRange.map(h => {
            const list = activeSessions.filter(s => parseHour(s) === h);
            const isNow = h === activeNowHour;
            const full = list.length >= hourCap;

            return (
              <div
                key={h}
                className="flex-1 flex flex-col items-center gap-1.5 min-w-0"
              >
                {/* ستون ظرفیت ساعت */}
                <div
                  style={{
                    backgroundColor: isNow ? 'rgba(209, 178, 82, 0.12)' : 'transparent',
                    boxShadow: isNow ? '0 0 0 2px var(--c-brass)' : undefined,
                  }}
                  className="w-full flex flex-col-reverse gap-[2px] rounded-md p-[2px] transition-all"
                >
                  {Array.from({ length: hourCap }, (_, i) => {
                    const sessionItem = list[i];
                    const itemStatus = sessionItem
                      ? normalizeStatus(sessionItem.s || sessionItem.status)
                      : null;

                    return (
                      <span
                        key={i}
                        style={{
                          backgroundColor: itemStatus
                            ? SEG_COLORS[itemStatus]
                            : 'var(--c-surface-2)',
                        }}
                        className={cn(
                          'block w-full rounded-[2px] transition-colors',
                          compact ? 'h-[7px]' : 'h-[10px]',
                          itemStatus === 'live' && 'live-pulse'
                        )}
                        aria-hidden
                      />
                    );
                  })}
                </div>

                {/* برچسب ساعت */}
                <span
                  style={{
                    color: isNow
                      ? 'var(--c-brass)'
                      : full
                        ? 'var(--c-rubber)'
                        : 'var(--c-text-faint)',
                  }}
                  className={cn(
                    'text-[14px] tnum leading-none select-none',
                    isNow && 'font-bold',
                    compact && h % 2 !== 0 && 'opacity-0'
                  )}
                >
                  {num(h)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
