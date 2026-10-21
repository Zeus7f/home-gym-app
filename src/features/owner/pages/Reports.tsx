import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { H } from '../../../components/ui/H';
import { Seg } from '../../../components/ui/Seg';
import { useI18n } from '../../../components/LanguageProvider';
import { displayName } from '../../../lib/displayName';
import { num, short } from '../../../lib/format';
import { getCurrentWeekShamsi } from '../../../lib/date/jalali';
import { getTrainers } from '../../../api/trainers';
import { Trainer } from '../../../lib/domain/gymManagement';

export interface ReportsProps {
  isMobile?: boolean;
}

export function Reports({ isMobile = false }: ReportsProps) {
  const { t, isFa } = useI18n();
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
      label: t.owner.reports.weekDays[index],
      labelShort: t.owner.reports.weekDaysShort[index],
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
            ['week', t.owner.reports.tabWeekly],
            ['ex', t.owner.reports.tabExercises],
            ['pay', t.owner.reports.tabTrainerPay],
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
          <H sub={t.owner.reports.weeklyTitle}>{t.owner.reports.weeklySub}</H>

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
                    {w.count > 0 ? num(w.count) : ''}
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
                {t.owner.reports.totalVisits}
              </div>
              <div
                style={{ color: 'var(--c-ink)' }}
                className="font-display text-[26px] tnum mt-0.5"
              >
                {num(totalVisits)}
              </div>
            </div>
            <div>
              <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
                {t.owner.reports.dailyAverage}
              </div>
              <div
                style={{ color: 'var(--c-deep)' }}
                className="font-display text-[26px] tnum mt-0.5"
              >
                {num(avgVisits)}
              </div>
            </div>
            <div>
              <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
                {t.owner.reports.noShows}
              </div>
              <div
                style={{ color: 'var(--c-rubber)' }}
                className="font-display text-[26px] tnum mt-0.5"
              >
                {num(3)}
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
          <H sub={t.owner.reports.exercisesSub}>
            {t.owner.reports.exercisesTitle}
          </H>
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {t.owner.reports.samples.map(log => (
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
          <H sub={t.owner.reports.trainerPaySub}>{t.owner.reports.calcPay}</H>
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {trainers.map(tr => {
              const gross = tr.completedSessions * tr.sessionRate;
              const owed = Math.max(0, gross - tr.paidCompensation);
              return (
                <div key={tr.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bold text-[15px]"
                      style={{ color: 'var(--c-deep)' }}
                    >
                      displayName(tr.name, isFa)
                    </span>
                    <span
                      style={{ color: 'var(--c-brass)' }}
                      className="tnum font-bold text-[16px]"
                    >
                      {t.owner.reports.owed}: {short(owed)}{' '}
                      {t.owner.reports.toman}
                    </span>
                  </div>
                  <div
                    className="text-[13px] tnum"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {num(tr.completedSessions)} {t.owner.reports.completed} ×{' '}
                    {short(tr.sessionRate)} = {short(gross)}{' '}
                    {t.owner.reports.toman} · {t.owner.reports.paid}:{' '}
                    {short(tr.paidCompensation)} {t.owner.reports.toman}
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
