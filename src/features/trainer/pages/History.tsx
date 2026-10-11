import React from 'react';
import { fa, short } from '../../../lib/format';

interface HistoryItem {
  athlete: string;
  exercises: string;
  duration: string;
}

interface DayGroup {
  dayTitle: string;
  items: HistoryItem[];
}

const SAMPLE_HISTORY: DayGroup[] = [
  {
    dayTitle: 'امروز',
    items: [
      {
        athlete: 'پارسا موسوی',
        exercises: 'پرس سینه ۳×۸ با ۶۰ کیلو، پرس سرشانه ۳×۱۰',
        duration: '۴۵ دقیقه',
      },
      {
        athlete: 'بهراد شریفی',
        exercises: 'ددلیفت ۴×۵ با ۹۰ کیلو، زیربغل دمبل ۳×۱۰',
        duration: '۵۰ دقیقه',
      },
    ],
  },
  {
    dayTitle: 'دیروز',
    items: [
      {
        athlete: 'رضا احمدی',
        exercises: 'اسکات پا ۳×۱۰ با ۷۰ کیلو، لانج متناوب، پلانک',
        duration: '۵۵ دقیقه',
      },
      {
        athlete: 'ترانه یزدانی',
        exercises: 'پرس بالا سینه، پشت بازو سیم‌کش',
        duration: '۴۰ دقیقه',
      },
      {
        athlete: 'آیدا مرادی',
        exercises: 'دوچرخه ۲۰ دقیقه، حرکات اصلاحی ستون فقرات',
        duration: '۳۵ دقیقه',
      },
    ],
  },
  {
    dayTitle: 'شنبه ۱۲ مهر',
    items: [
      {
        athlete: 'محمد کریمی',
        exercises: 'تمرین سینه و جلو بازو سنگین',
        duration: '۶۰ دقیقه',
      },
      {
        athlete: 'سارا کاظمی',
        exercises: 'تمرین فول بادی و هوازی تناوبی',
        duration: '۴۵ دقیقه',
      },
    ],
  },
];

export function History() {
  const stats = [
    { label: 'این ماه', val: fa(42) + ' جلسه' },
    { label: 'این هفته', val: fa(11) + ' جلسه' },
    { label: 'کارکرد ناخالص', val: short(6300000) + ' تومان' },
  ];

  return (
    <div className="space-y-5">
      {/* کارت خلاصه عملکرد مربی */}
      <div
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs grid grid-cols-3 text-center"
      >
        {stats.map(s => (
          <div key={s.label}>
            <div
              style={{ color: 'var(--c-ink)' }}
              className="font-display text-[24px] sm:text-[28px] tnum leading-tight"
            >
              {s.val}
            </div>
            <div
              className="text-[12px] sm:text-[13px] mt-1"
              style={{ color: 'var(--c-text-muted)' }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* لیست جلسات گذشته گروه‌بندی‌شده بر اساس روز */}
      <div className="space-y-4">
        {SAMPLE_HISTORY.map(grp => (
          <div key={grp.dayTitle}>
            <div
              className="text-[14px] font-bold mb-2"
              style={{ color: 'var(--c-text-muted)' }}
            >
              {grp.dayTitle}
            </div>

            <div
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="px-4 rounded-2xl border shadow-2xs divide-y divide-slate-100 dark:divide-slate-800"
            >
              {grp.items.map(row => (
                <div key={row.athlete} className="py-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bold text-[15px]"
                      style={{ color: 'var(--c-deep)' }}
                    >
                      {row.athlete}
                    </span>
                    <span
                      className="text-[13px] tnum font-semibold"
                      style={{ color: 'var(--c-steel)' }}
                    >
                      {row.duration}
                    </span>
                  </div>
                  <div
                    className="text-[13px] mt-1"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {row.exercises}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
