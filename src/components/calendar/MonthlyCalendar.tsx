import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_MONTH_NAMES_EN,
  PERSIAN_WEEK_DAYS_SHORT,
  PERSIAN_WEEK_DAYS_SHORT_EN,
  getJalaliMonthDays,
  getJalaliDayOfWeek,
  formatJalali,
  getTodayJalali,
  parseJalali,
} from '../../lib/date/jalali';
import { useI18n } from '../LanguageProvider';
import { num } from '../../lib/format';

export interface MonthlyCalendarProps {
  /** تاریخ انتخاب‌شده (YYYY/MM/DD) */
  selectedDate?: string;
  /** فراخوان انتخاب روز */
  onSelectDate?: (dateStr: string) => void;
  /** تعداد جلسات هر روز */
  sessionCounts?: Record<string, number>;
  /** ظرفیت مصرف‌شده هر روز */
  capacityStatuses?: Record<string, { used: number; total: number }>;
  /** روزهایی که فقط نشانگر دارند (بدون شمارش) */
  highlightedDates?: string[];
  /** روزهایی که ورزشکار مراجعه کرده است (عضو) */
  visitedDates?: string[];
  /** روزهای رزروشدهٔ آینده (عضو) */
  bookedDates?: string[];
  /** اگر true باشد، پیکربندی رنگی متفاوتی برای حالت «عضو» اعمال می‌شود */
  variant?: 'trainer' | 'member';
  className?: string;
}

/**
 * MonthlyCalendar — تقویم ماهانهٔ جلالی، دو‌زبانه.
 *
 * از هر دو فضای کاری مربی و ورزشکار استفاده می‌شود:
 *  - مربی: تعداد سانس‌های هر روز + وضعیت ظرفیت
 *  - ورزشکار: روزهای مراجعه‌شده و رزروشده
 */
export function MonthlyCalendar({
  selectedDate,
  onSelectDate,
  sessionCounts = {},
  capacityStatuses = {},
  highlightedDates = [],
  visitedDates = [],
  bookedDates = [],
  variant = 'trainer',
  className = '',
}: MonthlyCalendarProps) {
  const { lang, t } = useI18n();
  const isFa = lang === 'fa';

  const today = getTodayJalali();
  const todayStr = formatJalali(today);

  const [viewYear, setViewYear] = useState(today.jy);
  const [viewMonth, setViewMonth] = useState(today.jm);

  const monthNames = isFa ? PERSIAN_MONTH_NAMES : PERSIAN_MONTH_NAMES_EN;
  const weekDayNames = isFa ? PERSIAN_WEEK_DAYS_SHORT : PERSIAN_WEEK_DAYS_SHORT_EN;

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    setViewYear(today.jy);
    setViewMonth(today.jm);
    onSelectDate?.(todayStr);
  };

  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const startDayOfWeek = getJalaliDayOfWeek(viewYear, viewMonth, 1); // 0 = Saturday
  const emptyDays = useMemo(
    () => Array.from({ length: startDayOfWeek }, (_, i) => i),
    [startDayOfWeek]
  );
  const monthDays = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  return (
    <div
      className={`rounded-2xl border p-4 shadow-xs select-none ${className}`}
      style={{
        backgroundColor: 'var(--c-surface-1)',
        borderColor: 'var(--c-border)',
      }}
    >
      {/* سربرگ: ناوبری ماه */}
      <div
        className="flex items-center justify-between mb-4 pb-3"
        style={{ borderColor: 'var(--c-border)', borderBottomWidth: 1 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon size={16} style={{ color: 'var(--c-steel)' }} />
          <h3
            className="text-[15px] font-bold truncate"
            style={{ color: 'var(--c-heading)' }}
          >
            {monthNames[viewMonth - 1]} {num(viewYear)}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--c-surface-2)',
              color: 'var(--c-text-muted)',
            }}
            title={t.goToToday}
          >
            {t.today}
          </button>

          {/* در حالت راست‌چین «قبل» سمت راست است */}
          {isFa ? (
            <>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="h-7 w-7 rounded-lg grid place-items-center transition-colors cursor-pointer"
                style={{ color: 'var(--c-text-muted)' }}
                aria-label={t.prevMonth}
                title={t.prevMonth}
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="h-7 w-7 rounded-lg grid place-items-center transition-colors cursor-pointer"
                style={{ color: 'var(--c-text-muted)' }}
                aria-label={t.nextMonth}
                title={t.nextMonth}
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="h-7 w-7 rounded-lg grid place-items-center transition-colors cursor-pointer"
                style={{ color: 'var(--c-text-muted)' }}
                aria-label={t.prevMonth}
                title={t.prevMonth}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="h-7 w-7 rounded-lg grid place-items-center transition-colors cursor-pointer"
                style={{ color: 'var(--c-text-muted)' }}
                aria-label={t.nextMonth}
                title={t.nextMonth}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* نام روزهای هفته */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDayNames.map((day, idx) => (
          <div
            key={idx}
            className="text-[11px] font-bold py-1"
            style={{
              color: idx === 6 ? 'var(--c-rubber)' : 'var(--c-text-muted)',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* شبکه روزها */}
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map(i => (
          <div key={`empty-${i}`} className="h-10 sm:h-11" />
        ))}

        {monthDays.map(dayNum => {
          const dateStr = formatJalali({ jy: viewYear, jm: viewMonth, jd: dayNum });
          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;
          const count = sessionCounts[dateStr] || 0;
          const cap = capacityStatuses[dateStr];
          const isHighlighted = highlightedDates.includes(dateStr);
          const isVisited = visitedDates.includes(dateStr);
          const isBooked = bookedDates.includes(dateStr);
          const isCapFull = Boolean(cap && cap.used >= cap.total);

          // اولویت رنگ نشانگر
          const dotColor = isCapFull
            ? 'var(--c-rubber)'
            : isVisited
            ? 'var(--c-avail-fg)'
            : isBooked
            ? 'var(--c-brass)'
            : count > 0
            ? 'var(--c-steel)'
            : isHighlighted
            ? 'var(--c-text-faint)'
            : null;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate?.(dateStr)}
              className="h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center relative transition-all text-[12px] font-bold cursor-pointer"
              style={{
                backgroundColor: isSelected
                  ? 'var(--c-ink)'
                  : isToday
                  ? 'var(--c-surface-2)'
                  : 'transparent',
                color: isSelected ? '#ffffff' : 'var(--c-deep)',
                borderWidth: isToday && !isSelected ? 1 : 0,
                borderColor: 'var(--c-steel)',
                opacity: dotColor ? 1 : 0.55,
              }}
              aria-label={`${monthNames[viewMonth - 1]} ${dayNum}`}
              aria-pressed={isSelected}
            >
              <span className="leading-none">{num(dayNum)}</span>

              <div className="flex items-center gap-0.5 mt-1 h-1.5">
                {dotColor && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isSelected ? '#ffffff' : dotColor,
                    }}
                    title={t.sessionsCount.replace('{count}', num(count))}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* راهنما */}
      <div
        className="mt-4 pt-3 flex items-center justify-between text-[11px] flex-wrap gap-2"
        style={{ borderColor: 'var(--c-border)', borderTopWidth: 1, color: 'var(--c-text-muted)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {variant === 'member' ? (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-avail-fg)' }} />
                {t.legendVisited}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-brass)' }} />
                {t.legendBooked}
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-steel)' }} />
                {t.legendSession}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-rubber)' }} />
                {t.legendFull}
              </span>
            </>
          )}
        </div>
        {selectedDate && (
          <span>
            {t.selected.replace('{date}', selectedDate)}
          </span>
        )}
      </div>
    </div>
  );
}
