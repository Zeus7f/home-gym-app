import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { H } from '../../../components/ui/H';
import { Seg } from '../../../components/ui/Seg';
import { fa, short } from '../../../lib/format';
import { getCurrentWeekShamsi } from '../../../lib/date/jalali';
import { getTrainers } from '../../../api/trainers';
import { Trainer } from '../../../lib/domain/gymManagement';

export interface ReportsProps {
  isMobile?: boolean;
}

const SAMPLE_LOGS = [
  { athlete: 'مهسا فتحی', trainer: 'سارا کریمی', exercises: 'اسکات گابلت ۳×۱۲، لانج ۳×۱۰، پلانک' },
  { athlete: 'بهراد شریفی', trainer: 'علی محمدی', exercises: 'ددلیفت ۴×۵ با ۹۰، زیربغل ۳×۱۰' },
  { athlete: 'شیما رستمی', trainer: 'مهدی رحیمی', exercises: 'دوچرخه ۲۰ دقیقه، حرکات اصلاحی کمر' },
  { athlete: 'پارسا موسوی', trainer: 'علی محمدی', exercises: 'پرس سینه ۳×۸ با ۶۰، پرس سرشانه ۳×۱۰' },
];

export function Reports({ isMobile = false }: ReportsProps) {
  const [tab, setTab] = useState<'week' | 'ex' | 'pay'>('week');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const weekDays = getCurrentWeekShamsi();

  useEffect(() => {
    async function load() {
      try {
        const trData = await getTrainers();
        setTrainers(trData);
      } catch (err) {
        console.error('Error fetching trainers for reports:', err);
      }
    }
    load();
  }, []);

  // داده‌های نمونه هفتگی متناظر با روزهای جاری هفته شمسی
  const weekData = weekDays.map((d, index) => {
    // نمونه ارقام مراجعات روزانه
    const counts = [24, 19, 27, 22, 18, 12, 0];
    return {
      label: d.label,
      labelShort: d.labelShort,
      isToday: d.isToday,
      count: counts[index] || 0,
    };
  });

  const maxCapacity = 30;
  const totalVisits = weekData.reduce((acc, d) => acc + d.count, 0);
  const avgVisits = Math.round(totalVisits / 6);

  return (
    <div className="space-y-5">
      {/* سوییچر تب‌های گزارش */}
      <div className={isMobile ? 'overflow-x-auto no-scrollbar -mx-4 px-4' : ''}>
        <Seg
          value={tab}
          onChange={v => setTab(v as 'week' | 'ex' | 'pay')}
          items={[
            ['week', 'خلاصه هفتگی'],
            ['ex', 'تمرینات ثبت‌شده'],
            ['pay', 'دستمزد مربیان'],
          ]}
        />
      </div>

      {/* ۱. تب خلاصه هفتگی */}
      {tab === 'week' && (
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-5 rounded-2xl border shadow-xs"
        >
          <H sub="تعداد مراجعین روزانه نسبت به ظرفیت ۳۰ نفره سالن">
            مراجعات هفته جاری
          </H>

          {/* نمودار ستونی با Framer Motion */}
          <div
            className={`mt-6 flex items-end select-none ${
              isMobile ? 'gap-2 h-48' : 'gap-5 h-64'
            }`}
          >
            {weekData.map(w => {
              const heightPct = Math.min(100, (w.count / maxCapacity) * 100);
              return (
                <div
                  key={w.label}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2"
                >
                  <span
                    className="text-[13px] font-bold tnum"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {w.count > 0 ? fa(w.count) : ''}
                  </span>

                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{
                      backgroundColor: w.isToday
                        ? 'var(--c-brass)'
                        : 'var(--c-ink)',
                    }}
                    className="w-full rounded-t-lg transition-all"
                  />

                  {w.count === 0 && (
                    <div
                      style={{ backgroundColor: 'var(--c-surface-2)' }}
                      className="w-full h-1 rounded"
                    />
                  )}

                  <span
                    style={{
                      color: w.isToday ? 'var(--c-brass)' : 'var(--c-text-muted)',
                    }}
                    className={`text-[13px] ${w.isToday ? 'font-bold' : ''}`}
                  >
                    {isMobile ? w.labelShort : w.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* خلاصه ارقام آماری */}
          <div
            style={{ borderColor: 'var(--c-surface-2)' }}
            className="mt-6 grid grid-cols-3 gap-3 pt-4 border-t"
          >
            <div>
              <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
                کل مراجعات
              </div>
              <div
                style={{ color: 'var(--c-ink)' }}
                className="font-display text-[26px] tnum mt-0.5"
              >
                {fa(totalVisits)}
              </div>
            </div>
            <div>
              <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
                میانگین روزانه
              </div>
              <div
                style={{ color: 'var(--c-deep)' }}
                className="font-display text-[26px] tnum mt-0.5"
              >
                {fa(avgVisits)}
              </div>
            </div>
            <div>
              <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
                غیبت ثبت‌شده
              </div>
              <div
                style={{ color: 'var(--c-rubber)' }}
                className="font-display text-[26px] tnum mt-0.5"
              >
                {fa(3)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ۲. تب تمرینات امروز */}
      {tab === 'ex' && (
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-5 rounded-2xl border shadow-xs"
        >
          <H sub="ثبت آخرین جلسات تمرینی توسط مربیان">گزارش حرکات ورزشی</H>
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {SAMPLE_LOGS.map(log => (
              <div
                key={log.athlete}
                className={`py-3.5 ${
                  isMobile
                    ? 'space-y-1'
                    : 'grid grid-cols-[180px_160px_1fr] gap-4 items-center'
                }`}
              >
                <div
                  className="font-bold text-[15px]"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {log.athlete}
                </div>
                <div
                  className="text-[13px]"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {log.trainer}
                </div>
                <div
                  className="text-[14px]"
                  style={{ color: 'var(--c-text)' }}
                >
                  {log.exercises}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ۳. تب دستمزد مربیان */}
      {tab === 'pay' && (
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-5 rounded-2xl border shadow-xs"
        >
          <H sub="کارکرد، دستمزد مصوب و مانده طلب مربیان">محاسبه دستمزد</H>
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {trainers.map(t => {
              const gross = t.completedSessions * t.sessionRate;
              const owed = Math.max(0, gross - t.paidCompensation);
              return (
                <div key={t.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bold text-[15px]"
                      style={{ color: 'var(--c-deep)' }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{ color: 'var(--c-brass)' }}
                      className="tnum font-bold text-[16px]"
                    >
                      طلب: {short(owed)} تومان
                    </span>
                  </div>
                  <div
                    className="text-[13px] tnum"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {fa(t.completedSessions)} جلسه تکمیل × {short(t.sessionRate)} ={' '}
                    {short(gross)} تومان · تسویه‌شده: {short(t.paidCompensation)} تومان
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
