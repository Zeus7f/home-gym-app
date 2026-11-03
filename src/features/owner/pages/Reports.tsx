/**
 * src/features/owner/pages/Reports.tsx
 * گزارش کلی باشگاه: یک محاسبه با بازهٔ روز، هفته یا ماه و فیلتر مربی/ورزشکار.
 *
 * گزارش روزانه حالا حالت خاصِ همین صفحه است (بازهٔ «روز»)، نه صفحه‌ای جدا.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { H } from '../../../components/ui/H';
import { Seg } from '../../../components/ui/Seg';
import { SelectInput } from '../../../components/ui/Form';
import { Btn } from '../../../components/ui/Btn';
import { Amount } from '../../../components/ui/Amount';
import { useI18n } from '../../../components/LanguageProvider';
import { displayName } from '../../../lib/displayName';
import { num } from '../../../lib/format';
import { formatJalaliLocalized, getTodayJalaliString, parseJalali } from '../../../lib/date/jalali';
import { summarize, shiftAnchor, type ReportPeriod, type ReportScope } from '../../../lib/domain/reporting';
import { getTrainers } from '../../../api/trainers';
import { getMembers } from '../../../api/members';
import { subscribeToStore } from '../../../api/auth';
import { gymStore } from '../../../api/_client';
import type { Member, Trainer } from '../../../lib/domain/gymManagement';

export interface ReportsProps {
  isMobile?: boolean;
}

export function Reports({ isMobile = false }: ReportsProps) {
  const { t, isFa } = useI18n();
  const r = t.owner.reports;

  const [tab, setTab] = useState<'overview' | 'pay'>('overview');
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [anchor, setAnchor] = useState<string>(getTodayJalaliString);
  const [scopeKind, setScopeKind] = useState<ReportScope['kind']>('all');
  const [scopeId, setScopeId] = useState<string>('');

  const [version, setVersion] = useState(0);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => subscribeToStore(() => setVersion(v => v + 1)), []);

  useEffect(() => {
    getTrainers().then(setTrainers);
    getMembers().then(setMembers);
  }, [version]);

  /** همهٔ نوبت‌ها (آینده و تاریخچه) — استور کش خواندنی سرور است */
  const allSessions = useMemo(
    () => [...gymStore.todaySessions, ...gymStore.pastSessions],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  const scope: ReportScope = { kind: scopeKind, id: scopeId || undefined };
  const report = useMemo(
    () => summarize(allSessions, period, anchor, scope, { trainers, members }),
    [allSessions, period, anchor, scopeKind, scopeId, trainers, members]
  );

  /** انتخاب نوع فیلتر، اولین گزینهٔ همان نوع را هم انتخاب می‌کند */
  const pickScopeKind = (kind: ReportScope['kind']) => {
    setScopeKind(kind);
    if (kind === 'trainer') setScopeId(trainers[0]?.id ?? '');
    else if (kind === 'member') setScopeId(members[0]?.id ?? '');
    else setScopeId('');
  };

  const rangeLabel =
    period === 'day'
      ? r.rangeDay.replace('{date}', formatJalaliLocalized(report.range.from, isFa))
      : r.rangeSpan
          .replace('{from}', formatJalaliLocalized(report.range.from, isFa))
          .replace('{to}', formatJalaliLocalized(report.range.to, isFa));

  const maxPerDay = Math.max(1, ...report.perDay);
  const gymCapacity = Math.max(1, gymStore.gym?.capacity ?? 30);
  const capacityUsed = Math.round((report.booked - report.cancelled) / (gymCapacity * report.range.days.length) * 100);

  const surface = { backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border)' };

  const stats: { label: string; value: string; color: string }[] = [
    { label: r.statBooked, value: num(report.booked), color: 'var(--c-ink)' },
    { label: r.statCompleted, value: num(report.completed), color: 'var(--c-avail-fg)' },
    { label: r.statCancelled, value: num(report.cancelled), color: 'var(--c-text-muted)' },
    { label: r.statNoShow, value: num(report.noShow), color: 'var(--c-rubber)' },
    { label: r.statAttendance, value: `${num(report.attendanceRate)}٪`, color: 'var(--c-heading)' },
    { label: r.statAthletes, value: num(report.activeAthletes), color: 'var(--c-steel)' },
    { label: r.statCapacity, value: `${num(Math.min(100, Math.max(0, capacityUsed)))}٪`, color: 'var(--c-brass)' },
  ];

  return (
    <div className="space-y-5">
      <div className={isMobile ? 'overflow-x-auto no-scrollbar -mx-4 px-4' : ''}>
        <Seg
          value={tab}
          onChange={v => setTab(v as 'overview' | 'pay')}
          items={[
            ['overview', r.tabOverview],
            ['pay', r.tabTrainerPay],
          ]}
        />
      </div>

      {tab === 'overview' && (
        <>
          {/* فیلترها: بازه، پیمایش دوره، و شخص */}
          <section style={surface} className="p-4 rounded-2xl border shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Seg
                value={period}
                onChange={v => setPeriod(v as ReportPeriod)}
                items={[
                  ['day', r.periodDay],
                  ['week', r.periodWeek],
                  ['month', r.periodMonth],
                ]}
              />
              <div className="flex items-center gap-2">
                <Btn v="ghost" className="h-9 px-2.5 text-[12px] gap-1" onClick={() => setAnchor(a => shiftAnchor(period, a, -1))}>
                  <ChevronRight size={14} />
                  <span>{r.prevPeriod}</span>
                </Btn>
                <button
                  type="button"
                  onClick={() => setAnchor(getTodayJalaliString())}
                  className="text-[12.5px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                  style={{ color: 'var(--c-steel)' }}
                >
                  <CalendarDays size={14} />
                  {r.currentPeriod}
                </button>
                <Btn v="ghost" className="h-9 px-2.5 text-[12px] gap-1" onClick={() => setAnchor(a => shiftAnchor(period, a, 1))}>
                  <span>{r.nextPeriod}</span>
                  <ChevronLeft size={14} />
                </Btn>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-bold" style={{ color: 'var(--c-text-muted)' }}>
                {r.scopeLabel}
              </span>
              <Seg
                value={scopeKind}
                onChange={v => pickScopeKind(v as ReportScope['kind'])}
                items={[
                  ['all', r.scopeAll],
                  ['trainer', r.scopeTrainer],
                  ['member', r.scopeAthlete],
                ]}
              />
              {scopeKind !== 'all' && (
                <SelectInput
                  value={scopeId}
                  onChange={e => setScopeId(e.target.value)}
                  aria-label={scopeKind === 'trainer' ? r.scopeTrainer : r.scopeAthlete}
                  className="!w-auto min-w-[180px] !h-9 text-[13px]"
                >
                  {(scopeKind === 'trainer' ? trainers : members).map(person => (
                    <option key={person.id} value={person.id}>
                      {displayName(person.name, isFa)}
                    </option>
                  ))}
                </SelectInput>
              )}
            </div>

            <p className="text-[13px] font-bold" style={{ color: 'var(--c-heading)' }}>
              {rangeLabel}
            </p>
          </section>

          {/* شاخص‌های بازه */}
          <section style={surface} className="p-4 rounded-2xl border shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4">
              {stats.map(stat => (
                <div key={stat.label} className="min-w-0">
                  <div className="text-[12.5px] truncate" style={{ color: 'var(--c-text-muted)' }}>
                    {stat.label}
                  </div>
                  <div style={{ color: stat.color }} className="font-display text-[24px] tnum mt-0.5 leading-tight">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* نمودار نوبت‌ها در طول بازه */}
          <section style={surface} className="p-5 rounded-2xl border shadow-xs">
            <H sub={rangeLabel}>{r.chartTitle}</H>
            {report.booked === 0 ? (
              <p className="py-10 text-center text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
                {r.noData}
              </p>
            ) : (
              <div className={`mt-5 flex items-end select-none gap-1 ${isMobile ? 'h-40' : 'h-56'}`}>
                {report.range.days.map((day, index) => {
                  const count = report.perDay[index];
                  const parsed = parseJalali(day);
                  const isToday = day === getTodayJalaliString();
                  return (
                    <div key={day} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold tnum" style={{ color: 'var(--c-heading)' }}>
                        {count > 0 ? num(count) : ''}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(count > 0 ? 6 : 2, (count / maxPerDay) * 100)}%` }}
                        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{ backgroundColor: isToday ? 'var(--c-brass)' : count > 0 ? 'var(--c-ink)' : 'var(--c-surface-2)' }}
                        className="w-full rounded-t-md"
                      />
                      <span
                        className="text-[10px] tnum truncate w-full text-center"
                        style={{ color: isToday ? 'var(--c-brass)' : 'var(--c-text-muted)' }}
                      >
                        {num(parsed?.jd ?? 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* تفکیک مربی و ورزشکار */}
          {report.booked > 0 && (
            <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
              <section style={surface} className="p-4 rounded-2xl border shadow-xs">
                <H sub={rangeLabel}>{r.byTrainer}</H>
                <div className="mt-2 divide-y" style={{ borderColor: 'var(--c-border)' }}>
                  {report.byTrainer.map(row => (
                    <div key={row.id} className="py-2.5 flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-bold truncate min-w-0" style={{ color: 'var(--c-heading)' }}>
                        {displayName(row.name, isFa)}
                      </span>
                      <span className="text-[12px] tnum shrink-0" style={{ color: 'var(--c-text-muted)' }}>
                        {r.colSessions}: {num(row.booked)} · {r.colCompleted}: {num(row.completed)} ·{' '}
                        <Amount value={row.earned ?? 0} unit={false} />
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section style={surface} className="p-4 rounded-2xl border shadow-xs">
                <H sub={rangeLabel}>{r.byAthlete}</H>
                <div className="mt-2 divide-y" style={{ borderColor: 'var(--c-border)' }}>
                  {report.byMember.map(row => (
                    <div key={row.id} className="py-2.5 flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-bold truncate min-w-0" style={{ color: 'var(--c-heading)' }}>
                        {displayName(row.name, isFa)}
                      </span>
                      <span className="text-[12px] tnum shrink-0" style={{ color: 'var(--c-text-muted)' }}>
                        {r.colSessions}: {num(row.booked)} · {r.colCompleted}: {num(row.completed)} · {r.colRemaining}:{' '}
                        {num(row.remaining ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {/* دستمزد مربیان — جمع کل، نه محدود به بازه */}
      {tab === 'pay' && (
        <section style={surface} className="p-5 rounded-2xl border shadow-xs">
          <H sub={r.trainerPaySub}>{r.calcPay}</H>
          <div className="mt-3 divide-y" style={{ borderColor: 'var(--c-border)' }}>
            {trainers.map(tr => {
              const gross = tr.completedSessions * tr.sessionRate;
              const owed = Math.max(0, gross - tr.paidCompensation);
              return (
                <div key={tr.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[15px]" style={{ color: 'var(--c-heading)' }}>
                      {displayName(tr.name, isFa)}
                    </span>
                    <span style={{ color: 'var(--c-brass)' }} className="tnum font-bold text-[16px]">
                      {r.owed}: <Amount value={owed} unit={false} /> {r.toman}
                    </span>
                  </div>
                  <div className="text-[13px] tnum" style={{ color: 'var(--c-text-muted)' }}>
                    {num(tr.completedSessions)} {r.completed} × <Amount value={tr.sessionRate} unit={false} /> ={' '}
                    <Amount value={gross} unit={false} /> {r.toman} · {r.paid}:{' '}
                    <Amount value={tr.paidCompensation} unit={false} /> {r.toman}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
