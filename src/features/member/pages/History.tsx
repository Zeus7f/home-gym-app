import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { H } from '../../../components/ui/H';
import { fa } from '../../../lib/format';

const PRS = [
  { name: 'اسکات گابلت', value: '۲۰ کیلوگرم', change: '+۴' },
  { name: 'ددلیفت رومانیایی', value: '۳۵ کیلوگرم', change: '+۵' },
  { name: 'پلانک شکم', value: '۹۰ ثانیه', change: '+۱۵' },
];

const PROGRESSION_WEIGHTS = [10, 12, 12, 14, 14, 16, 16, 20];

export function History() {
  const maxWeight = Math.max(...PROGRESSION_WEIGHTS);

  return (
    <div className="space-y-4">
      {/* ۲ کارت متریک‌های کلان ورزشکار */}
      <div className="grid grid-cols-2 gap-3">
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
        >
          <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            کل جلسات مراجعه‌شده
          </div>
          <div
            style={{ color: 'var(--c-ink)' }}
            className="font-display text-[34px] leading-tight tnum mt-1"
          >
            {fa(38)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
        >
          <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            میانگین هفتگی
          </div>
          <div
            style={{ color: 'var(--c-ink)' }}
            className="font-display text-[34px] leading-tight tnum mt-1"
          >
            ۲٫۸{' '}
            <span className="text-[14px] font-sans font-normal opacity-70">
              جلسه
            </span>
          </div>
        </div>
      </div>

      {/* بخش رکوردهای شخصی (Personal Records) */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
        aria-label="رکوردهای شخصی"
      >
        <H>رکوردهای شخصی (PRs)</H>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {PRS.map(item => (
            <div
              key={item.name}
              className="flex items-center gap-3 py-3 border-b last:border-0"
            >
              <Trophy size={18} style={{ color: 'var(--c-brass)' }} />
              <span
                className="flex-1 font-semibold text-[15px]"
                style={{ color: 'var(--c-deep)' }}
              >
                {item.name}
              </span>
              <span
                className="font-bold tnum text-[14px]"
                style={{ color: 'var(--c-deep)' }}
              >
                {item.value}
              </span>
              <span
                style={{ color: 'var(--c-avail-fg)' }}
                className="text-[13px] tnum font-bold w-10 text-left"
              >
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* نمودار روند افزایش رکورد وزنه */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
        aria-label="روند پیشرفت وزنه"
      >
        <H sub="ثبت وزنه اسکات در ۸ جلسه تمرینی اخیر">روند پیشرفت وزنه</H>

        <div className="mt-5 flex items-end gap-2.5 h-32 select-none pt-2">
          {PROGRESSION_WEIGHTS.map((weight, i) => {
            const heightPct = (weight / maxWeight) * 100;
            return (
              <div
                key={i}
                className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"
              >
                <span
                  className="text-[11px] tnum font-bold"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {fa(weight)}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{
                    delay: 0.05 + i * 0.04,
                    duration: 0.5,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  style={{
                    backgroundColor:
                      i === PROGRESSION_WEIGHTS.length - 1
                        ? 'var(--c-brass)'
                        : 'var(--c-ink)',
                    opacity: 0.5 + i * 0.06,
                  }}
                  className="w-full rounded-t-md transition-all"
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
