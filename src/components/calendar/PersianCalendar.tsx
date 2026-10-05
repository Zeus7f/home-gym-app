import React, { useState } from 'react';
import {
  JalaliDate,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS_SHORT,
  getJalaliMonthDays,
  getJalaliDayOfWeek,
  formatJalali,
  getTodayJalali,
  parseJalali
} from '../../lib/date/jalali';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';

interface PersianCalendarProps {
  selectedDate: string; // "YYYY/MM/DD"
  onSelectDate: (dateStr: string) => void;
  sessionCounts?: Record<string, number>; // "YYYY/MM/DD" -> count
  capacityStatuses?: Record<string, { used: number; total: number }>; // for trainer or gym
  highlightedDates?: string[]; // array of dates that have workouts
  className?: string;
}

export function PersianCalendar({
  selectedDate,
  onSelectDate,
  sessionCounts = {},
  capacityStatuses = {},
  highlightedDates = [],
  className = ''
}: PersianCalendarProps) {
  const today = getTodayJalali();
  const initialParsed = parseJalali(selectedDate) || today;

  const [viewYear, setViewYear] = useState(initialParsed.jy);
  const [viewMonth, setViewMonth] = useState(initialParsed.jm);

  // Month navigation
  function handlePrevMonth() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  }

  function handleGoToToday() {
    setViewYear(today.jy);
    setViewMonth(today.jm);
    onSelectDate(formatJalali(today));
  }

  // Calculate calendar grid
  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const startDayOfWeek = getJalaliDayOfWeek(viewYear, viewMonth, 1); // 0 = Saturday, ..., 6 = Friday

  const todayStr = formatJalali(today);

  // Empty cells before day 1
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i);
  // Month days
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div
      className={`bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm select-none ${className}`}
      dir="rtl"
    >
      {/* Calendar Header: Month/Year navigation */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {PERSIAN_MONTH_NAMES[viewMonth - 1]} {viewYear}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleGoToToday}
            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            امروز
          </button>
          {/* RTL note: Prev is right chevron, Next is left chevron in Persian */}
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="ماه قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="ماه بعد"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels (شنبه تا جمعه) */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {PERSIAN_WEEK_DAYS_SHORT.map((day, idx) => (
          <div
            key={idx}
            className={`text-[11px] font-bold py-1 ${
              idx === 6 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {emptyDays.map(i => (
          <div key={`empty-${i}`} className="h-10 sm:h-11" />
        ))}

        {/* Day cells */}
        {monthDays.map(dayNum => {
          const dateStr = formatJalali({ jy: viewYear, jm: viewMonth, jd: dayNum });
          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;
          const count = sessionCounts[dateStr] || 0;
          const cap = capacityStatuses[dateStr];
          const isHighlighted = highlightedDates.includes(dateStr);
          const isFriday = (startDayOfWeek + dayNum - 1) % 7 === 6;

          const isCapFull = cap && cap.used >= cap.total;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center relative transition-all text-xs font-bold group ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-500/40 scale-102 z-10'
                  : isToday
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              } ${isFriday && !isSelected ? 'text-rose-600 dark:text-rose-400' : ''}`}
            >
              <span className="leading-none">{dayNum}</span>

              {/* Badges / indicators under date number */}
              <div className="flex items-center gap-0.5 mt-1 h-1.5">
                {count > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? 'bg-white'
                        : isCapFull
                        ? 'bg-rose-500'
                        : 'bg-teal-500'
                    }`}
                    title={`${count} جلسه`}
                  />
                )}
                {isHighlighted && count === 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-amber-200' : 'bg-amber-500'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend / Guide */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            دارای برنامه
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            تکمیل ظرفیت
          </span>
        </div>
        <span>{selectedDate ? `انتخاب: ${selectedDate}` : ''}</span>
      </div>
    </div>
  );
}
