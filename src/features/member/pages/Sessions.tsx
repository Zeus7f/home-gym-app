import React, { useState } from 'react';
import { Seg } from '../../../components/ui/Seg';
import { Btn } from '../../../components/ui/Btn';
import { Pill } from '../../../components/ui/Pill';

const UPCOMING_SESSIONS = [
  { date: 'پنجشنبه ۱۶ مهر', time: '۰۸:۰۰', trainer: 'سارا کریمی' },
  { date: 'شنبه ۱۸ مهر', time: '۰۸:۰۰', trainer: 'سارا کریمی' },
];

const PAST_SESSIONS = [
  { date: 'دوشنبه ۱۳ مهر', status: 'done', label: 'تکمیل‌شده' },
  { date: 'شنبه ۱۱ مهر', status: 'done', label: 'تکمیل‌شده' },
  { date: 'پنجشنبه ۹ مهر', status: 'noshow', label: 'غیبت' },
  { date: 'سه‌شنبه ۷ مهر', status: 'done', label: 'تکمیل‌شده' },
];

export function Sessions() {
  const [tab, setTab] = useState<'up' | 'past'>('up');

  return (
    <div className="space-y-4">
      {/* سوییچر بین جلسات پیش‌رو و سوابق */}
      <Seg
        full
        value={tab}
        onChange={v => setTab(v as 'up' | 'past')}
        items={[
          ['up', 'نوبت‌های پیش رو'],
          ['past', 'جلسات گذشته'],
        ]}
      />

      {tab === 'up' ? (
        <div className="space-y-3">
          {UPCOMING_SESSIONS.map(item => (
            <section
              key={item.date}
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="p-4 rounded-2xl border shadow-xs"
              aria-label={`نوبت ${item.date}`}
            >
              <div className="flex justify-between items-center">
                <span
                  className="font-bold text-[16px]"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {item.date}
                </span>
                <span
                  style={{ color: 'var(--c-ink)' }}
                  className="tnum font-extrabold text-[16px]"
                >
                  ساعت {item.time}
                </span>
              </div>

              <div
                className="text-[13px] mt-1"
                style={{ color: 'var(--c-text-muted)' }}
              >
                مربی: {item.trainer}
              </div>

              <div className="mt-3.5 flex gap-2">
                <Btn v="soft" className="flex-1 text-xs">
                  درخواست تغییر ساعت
                </Btn>
                <Btn v="ghost" className="flex-1 text-xs">
                  لغو نوبت
                </Btn>
              </div>
            </section>
          ))}

          <div
            className="text-[13px] text-center px-4 leading-6 pt-2"
            style={{ color: 'var(--c-text-muted)' }}
          >
            توجه: لغو یا تغییر ساعت نوبت تا ۴ ساعت قبل از شروع سانس، بدون کسر جلسه از
            بسته شما انجام می‌شود.
          </div>
        </div>
      ) : (
        <section
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="px-4 rounded-2xl border shadow-xs divide-y divide-slate-100 dark:divide-slate-800"
          aria-label="تاریخچه جلسات"
        >
          {PAST_SESSIONS.map(item => {
            const isNoShow = item.status === 'noshow';
            return (
              <div
                key={item.date}
                className="py-3.5 flex items-center justify-between text-sm"
              >
                <span className="font-semibold" style={{ color: 'var(--c-deep)' }}>
                  {item.date}
                </span>
                <span
                  style={{
                    color: isNoShow ? 'var(--c-rubber)' : 'var(--c-ink)',
                  }}
                  className={`font-bold text-[13px] ${isNoShow ? 'opacity-90' : ''}`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
