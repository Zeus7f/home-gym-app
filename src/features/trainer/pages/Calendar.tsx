import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { H } from '../../../components/ui/H';
import { Btn } from '../../../components/ui/Btn';
import { Pill } from '../../../components/ui/Pill';
import { MonthlyCalendar } from '../../../components/calendar/MonthlyCalendar';
import { useI18n } from '../../../components/LanguageProvider';
import { exerciseName } from '../../../lib/exerciseLabels';
import { num } from '../../../lib/format';
import { displayName } from '../../../lib/displayName';
import { getCurrentUser, subscribeToStore } from '../../../api/auth';
import { getTodaySessions, getTrainerPastSessions, getTrainerDailyCapacity } from '../../../api/sessions';
import { getTodayJalaliString, getTodayJalaliKey } from '../../../lib/date/jalali';
import type { DailySession } from '../../../lib/domain/gymManagement';

type SessionStatusKey = 'done' | 'live' | 'wait' | 'cancel' | 'noshow';

function toStatusKey(status: DailySession['status']): SessionStatusKey {
  switch (status) {
    case 'completed':
      return 'done';
    case 'in_progress':
      return 'live';
    case 'cancelled':
      return 'cancel';
    case 'no_show':
      return 'noshow';
    default:
      return 'wait';
  }
}

export function Calendar() {
  const { t, isFa } = useI18n();
  const currentTrainerId = getCurrentUser()?.entityId || 't-ali';

  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayJalaliString());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [today, past] = await Promise.all([
        getTodaySessions(currentTrainerId),
        getTrainerPastSessions(currentTrainerId),
      ]);
      setSessions([...today, ...past]);
    };
    load();
    return subscribeToStore(() => {
      setVersion(v => v + 1);
      load();
    });
  }, [currentTrainerId]);

  /** شمارش سانس‌ها و وضعیت ظرفیت برای هر روز */
  const { sessionCounts, capacityStatuses } = useMemo(() => {
    const counts: Record<string, number> = {};
    const capacity: Record<string, { used: number; total: number }> = {};
    const todayKey = getTodayJalaliString();

    for (const s of sessions) {
      if (s.status === 'cancelled') continue;
      // جلسات «Today» روی تاریخ امروز نگاشت می‌شوند
      const dateKey = s.date === 'Today' ? todayKey : s.date;
      if (!dateKey) continue;
      counts[dateKey] = (counts[dateKey] || 0) + 1;

      const total = getTrainerDailyCapacity(dateKey, s.trainerId);
      const current = capacity[dateKey] || { used: 0, total };
      current.used += 1;
      capacity[dateKey] = current;
    }

    return { sessionCounts: counts, capacityStatuses: capacity };
  }, [sessions, version]);

  const daySessions = useMemo(
    () =>
      sessions
        .filter(s => {
          if (s.status === 'cancelled') return false;
          const todayKey = getTodayJalaliString();
          const dateKey = s.date === 'Today' ? todayKey : s.date;
          return dateKey === selectedDate;
        })
        .sort((a, b) => a.time.localeCompare(b.time)),
    [sessions, selectedDate]
  );

  return (
    <div className="space-y-4">
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
      >
        <H sub={t.trainer.calendar.subtitle}>{t.trainer.calendar.title}</H>

        <div className="mt-3.5">
          <MonthlyCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            sessionCounts={sessionCounts}
            capacityStatuses={capacityStatuses}
            variant="trainer"
          />
        </div>
      </section>

      {/* سانس‌های روز انتخاب‌شده */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays size={16} style={{ color: 'var(--c-steel)' }} />
            <h2
              className="text-[15px] font-bold truncate"
              style={{ color: 'var(--c-deep)' }}
            >
              {t.trainer.calendar.selectDay}
            </h2>
          </div>
          <span
            style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-text-muted)' }}
            className="px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0"
          >
            {t.trainer.calendar.sessionsOn.replace('{count}', num(daySessions.length))}
          </span>
        </div>

        {daySessions.length === 0 ? (
          <p
            className="mt-4 text-[13px] text-center py-6"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {t.trainer.calendar.noSlots}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {daySessions.map(s => (
              <div
                key={s.id}
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-3 rounded-xl border flex items-center gap-3"
              >
                <span
                  className="font-display text-[20px] leading-none tnum shrink-0"
                  style={{ color: 'var(--c-ink)' }}
                >
                  {s.time}
                </span>

                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-[14px] truncate"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    displayName(s.memberName, isFa)
                  </div>
                  <div
                    className="text-[12px] truncate"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {s.exercises && s.exercises.length > 0
                      ? s.exercises
                          .map(e => exerciseName(e.exerciseId, e.name, isFa))
                          .join(isFa ? '، ' : ', ')
                      : t.trainer.history.noExercises}
                  </div>
                </div>

                <Pill status={toStatusKey(s.status)} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
