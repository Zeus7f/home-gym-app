/**
 * src/features/owner/pages/Sched.tsx
 * نوبت‌دهی و برنامهٔ حضور از دید مدیر باشگاه.
 *
 * دو نما: هفته (نوار هفت‌روزه با ظرفیت آزاد هر روز) و ماه (تقویم ماهانه با
 * همان شاخص). انتخاب هر روز، نوبت‌های همان روز را ساعت‌به‌ساعت نشان می‌دهد و
 * از همان‌جا می‌توان ورزشکار به آن روز افزود.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Chips } from '../../../components/ui/Chips';
import { Pill, SessionStatus } from '../../../components/ui/Pill';
import { Avatar } from '../../../components/ui/Avatar';
import { Btn } from '../../../components/ui/Btn';
import { Seg } from '../../../components/ui/Seg';
import { MonthlyCalendar } from '../../../components/calendar/MonthlyCalendar';
import { useI18n } from '../../../components/LanguageProvider';
import { Toast } from '../../../components/ui/Toast';
import { displayName } from '../../../lib/displayName';
import { num } from '../../../lib/format';
import {
  getWeekShamsi,
  getCurrentHour,
  formatJalaliLocalized,
  getTodayJalaliString,
  PERSIAN_WEEK_DAYS_SHORT,
  PERSIAN_WEEK_DAYS_SHORT_EN as WEEK_DAYS_SHORT_EN,
} from '../../../lib/date/jalali';
import { checkInSession, completeSession, getGymDailyCapacity } from '../../../api/sessions';
import { getMembers } from '../../../api/members';
import { getTrainers } from '../../../api/trainers';
import { getGym } from '../../../api/gym';
import { subscribeToStore } from '../../../api/auth';
import { gymStore } from '../../../api/_client';
import { BookingSheet } from '../components/BookingSheet';
import type { DailySession, Gym, Member, Trainer } from '../../../lib/domain/gymManagement';

export interface SchedProps {
  isMobile?: boolean;
  /** درخواست باز شدن کشوی نوبت تازه از دکمهٔ هدر */
  bookingNonce?: number;
}

/** ساعت ابتدای یک نوبت به عدد؛ ارقام فارسی هم پذیرفته می‌شود */
function hourOf(time: string): number {
  const latin = time.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0));
  const parsed = parseInt(latin.split(':')[0], 10);
  return isNaN(parsed) ? 8 : parsed;
}

export function Sched({ isMobile = false, bookingNonce = 0 }: SchedProps) {
  const { t, isFa } = useI18n();
  const s = t.owner.sched;

  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getTodayJalaliString);
  const [filter, setFilter] = useState<'all' | 'live' | 'wait' | 'done'>('all');

  const [version, setVersion] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [gym, setGym] = useState<Gym | undefined>(undefined);
  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const currentHour = getCurrentHour();
  const week = useMemo(() => getWeekShamsi(weekOffset), [weekOffset]);

  useEffect(() => subscribeToStore(() => setVersion(v => v + 1)), []);

  useEffect(() => {
    getMembers().then(setMembers);
    getTrainers().then(setTrainers);
    getGym().then(g => setGym(g ?? undefined));
  }, [version]);

  // دکمهٔ «نوبت‌دهی جدید» در هدر، همین کشو را برای روز انتخاب‌شده باز می‌کند
  useEffect(() => {
    if (bookingNonce > 0) setBookingDate(selectedDayKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingNonce]);

  /**
   * همهٔ نوبت‌ها (آینده و گذشته) برای شمارش ظرفیت هر روز.
   * استور کش خواندنی سرور است، پس ماه کامل بدون درخواست تازه در دسترس است.
   */
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, DailySession[]>();
    const seen = new Set<string>();
    for (const session of [...gymStore.todaySessions, ...gymStore.pastSessions]) {
      if (seen.has(session.id)) continue;
      seen.add(session.id);
      const list = map.get(session.date) ?? [];
      list.push(session);
      map.set(session.date, list);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  /** ظرفیت مصرف‌شده و کل برای یک روز — نوبت لغوشده جا را آزاد می‌کند */
  const capacityOf = useCallback(
    (dateKey: string) => {
      const list = sessionsByDate.get(dateKey) ?? [];
      const used = list.filter(x => x.status !== 'cancelled').length;
      return { used, total: getGymDailyCapacity(dateKey) };
    },
    [sessionsByDate]
  );

  const capacityStatuses = useMemo(() => {
    const out: Record<string, { used: number; total: number }> = {};
    for (const dateKey of sessionsByDate.keys()) out[dateKey] = capacityOf(dateKey);
    return out;
  }, [sessionsByDate, capacityOf]);

  const daySessions = sessionsByDate.get(selectedDayKey) ?? [];
  const dayCapacity = capacityOf(selectedDayKey);
  const dayFree = Math.max(0, dayCapacity.total - dayCapacity.used);

  const filteredSessions = daySessions.filter(x => {
    if (filter === 'live') return x.status === 'in_progress';
    if (filter === 'wait') return x.status === 'scheduled';
    if (filter === 'done') return x.status === 'completed';
    return true;
  });

  const sessionHours = Array.from(new Set(filteredSessions.map(x => hourOf(x.time)))).sort((a, b) => a - b);

  const handleCheckIn = async (sessionId: string) => {
    await checkInSession(sessionId);
  };

  // B-06: تکمیل ناموفق (لغوشده، بدون اعتبار، بستهٔ منقضی) باید به مدیر نمایش داده شود
  const handleComplete = async (sessionId: string) => {
    const res = await completeSession(sessionId);
    if (!res.success) setToast({ text: res.message, type: 'warning' });
  };

  const surface = { backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border)' };

  return (
    <div className="space-y-5">
      {/* نمای ظرفیت: هفته یا ماه */}
      <section style={surface} className="p-4 rounded-2xl border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-extrabold" style={{ color: 'var(--c-heading)' }}>
            {view === 'week' ? s.weekCapacity : s.monthCapacity}
          </h2>
          <Seg
            value={view}
            onChange={v => setView(v as 'week' | 'month')}
            items={[
              ['week', s.viewWeek],
              ['month', s.viewMonth],
            ]}
          />
        </div>

        {view === 'week' ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <Btn v="ghost" className="h-9 px-2.5 text-[12px] gap-1" onClick={() => setWeekOffset(w => w - 1)}>
                <ChevronRight size={14} />
                <span>{s.prevWeek}</span>
              </Btn>
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="text-[12.5px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                style={{ color: weekOffset === 0 ? 'var(--c-steel)' : 'var(--c-text-muted)' }}
              >
                <CalendarDays size={14} />
                {s.thisWeek}
              </button>
              <Btn v="ghost" className="h-9 px-2.5 text-[12px] gap-1" onClick={() => setWeekOffset(w => w + 1)}>
                <span>{s.nextWeek}</span>
                <ChevronLeft size={14} />
              </Btn>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {week.map(day => {
                const isSelected = selectedDayKey === day.dateKey;
                const { used, total } = capacityOf(day.dateKey);
                const free = Math.max(0, total - used);
                const dayIndex = PERSIAN_WEEK_DAYS_SHORT.indexOf(day.labelShort);
                const dayLabel = isFa || dayIndex < 0 ? day.labelShort : WEEK_DAYS_SHORT_EN[dayIndex];
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDayKey(day.dateKey)}
                    aria-pressed={isSelected}
                    aria-label={`${dayLabel} ${day.dayNum} — ${s.capacityOf.replace('{used}', String(used)).replace('{total}', String(total))}`}
                    className="rounded-xl p-1.5 text-center transition-colors cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--c-ink)' : 'var(--c-surface-2)',
                      borderColor: isSelected ? 'var(--c-ink)' : day.isToday ? 'var(--c-steel)' : 'transparent',
                      borderWidth: isSelected || day.isToday ? 2 : 1,
                      borderStyle: 'solid',
                      color: isSelected ? '#ffffff' : 'var(--c-text)',
                    }}
                  >
                    <div className="text-[10.5px] opacity-80 leading-none">{dayLabel}</div>
                    <div className="text-[17px] font-extrabold tnum mt-1 leading-none">{num(day.dayNum)}</div>
                    <div
                      className="text-[9.5px] font-bold mt-1 leading-3 h-3"
                      style={{ color: isSelected ? '#ffffff' : free === 0 ? 'var(--c-rubber)' : 'var(--c-avail-fg)' }}
                    >
                      {free === 0 ? s.fullDay : num(free)}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <MonthlyCalendar
            selectedDate={selectedDayKey}
            onSelectDate={setSelectedDayKey}
            capacityStatuses={capacityStatuses}
          />
        )}
      </section>

      {/* روز انتخاب‌شده: ظرفیت آزاد و افزودن ورزشکار */}
      <section style={surface} className="p-4 rounded-2xl border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold" style={{ color: 'var(--c-heading)' }}>
              {formatJalaliLocalized(selectedDayKey, isFa)}
            </h2>
            <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
              {s.dayFree}:{' '}
              <span style={{ color: dayFree === 0 ? 'var(--c-rubber)' : 'var(--c-avail-fg)', fontWeight: 700 }}>
                {s.capacityOf.replace('{used}', num(dayCapacity.used)).replace('{total}', num(dayCapacity.total))}
              </span>
            </p>
          </div>
          <Btn v="primary" className="h-10 gap-1.5" onClick={() => setBookingDate(selectedDayKey)}>
            <Plus size={16} />
            <span>{s.addAthlete}</span>
          </Btn>
        </div>

        <Chips<'all' | 'wait' | 'done' | 'live'>
          value={filter}
          onChange={setFilter}
          ariaLabel={s.statusFilter}
          items={[
            ['all', s.all],
            ['live', s.inGym],
            ['wait', s.waiting],
            ['done', s.done],
          ]}
        />
      </section>

      {/* لیست زمانی ساعت به ساعت */}
      <div className="space-y-6">
        {sessionHours.map(hour => {
          const list = filteredSessions.filter(x => hourOf(x.time) === hour);
          const isNow = hour === currentHour && selectedDayKey === getTodayJalaliString();

          return (
            <div key={hour} className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span
                  style={{ color: isNow ? 'var(--c-brass)' : 'var(--c-ink)' }}
                  className="font-display text-[24px] tnum leading-none"
                >
                  {s.hourFormat.replace('{hour}', num(hour))}
                </span>
                {isNow && (
                  <span
                    style={{ backgroundColor: 'var(--c-brass)', color: 'var(--c-heading)' }}
                    className="h-6 px-2.5 rounded-md text-[13px] font-bold inline-flex items-center"
                  >
                    {s.now}
                  </span>
                )}
                <span style={{ backgroundColor: 'var(--c-border)' }} className="flex-1 h-px" />
                <span className="text-[13px] tnum" style={{ color: 'var(--c-text-muted)' }}>
                  {s.sessionCount.replace('{count}', num(list.length))}
                </span>
              </div>

              <div className={isMobile ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-3'}>
                {list.map(session => {
                  const isLive = session.status === 'in_progress';
                  const isWait = session.status === 'scheduled';
                  const isDone = session.status === 'completed';
                  const isCancel = session.status === 'cancelled';
                  const statusKey: SessionStatus = isLive ? 'live' : isDone ? 'done' : isCancel ? 'cancel' : 'wait';

                  return (
                    <div key={session.id} style={surface} className="p-3.5 rounded-xl border flex items-center gap-3 shadow-2xs">
                      <Avatar
                        name={displayName(session.memberName, isFa)}
                        size={40}
                        tone={isLive ? 'brass' : isDone ? 'ink' : 'mist'}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          style={{ color: isCancel ? 'var(--c-text-faint)' : 'var(--c-deep)' }}
                          className={`font-semibold truncate text-[15px] ${isCancel ? 'line-through' : ''}`}
                        >
                          {displayName(session.memberName, isFa)}
                        </div>
                        <div className="text-[13px] truncate flex items-center gap-1.5" style={{ color: 'var(--c-text-muted)' }}>
                          <span>{displayName(session.trainerName, isFa)}</span>
                          {session.isDailyOverride && (
                            <span style={{ color: 'var(--c-brass)' }} className="inline-flex items-center gap-0.5 text-xs font-semibold">
                              <ArrowLeftRight size={12} />
                              {s.dailyOverride}
                            </span>
                          )}
                        </div>
                      </div>

                      {isWait && (
                        <Btn v="ghost" className="h-8 px-3 text-xs" onClick={() => handleCheckIn(session.id)}>
                          {s.checkIn}
                        </Btn>
                      )}
                      {isLive && (
                        <Btn v="primary" className="h-8 px-3 text-xs" onClick={() => handleComplete(session.id)}>
                          {s.finish}
                        </Btn>
                      )}
                      {(isDone || isCancel) && <Pill status={statusKey} />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {sessionHours.length === 0 && (
          <div className="py-12 text-center rounded-2xl border text-sm" style={{ ...surface, color: 'var(--c-text-muted)' }}>
            {s.empty}
          </div>
        )}
      </div>

      <BookingSheet
        date={bookingDate}
        members={members}
        trainers={trainers}
        daySessions={bookingDate ? (sessionsByDate.get(bookingDate) ?? []) : []}
        hourlyCapacity={Math.max(1, gym?.hourlyCapacity ?? 6)}
        onClose={() => setBookingDate(null)}
        onDone={message => {
          setBookingDate(null);
          setToast({ text: message, type: 'success' });
        }}
      />

      <Toast message={toast?.text ?? null} type={toast?.type ?? "success"} onClose={() => setToast(null)} />
    </div>
  );
}
