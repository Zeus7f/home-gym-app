import React, { useState, useEffect } from 'react';
import { num, short } from '../../../lib/format';
import { displayName } from '../../../lib/displayName';
import { useI18n } from '../../../components/LanguageProvider';
import { exerciseName } from '../../../lib/exerciseLabels';
import { getCurrentUser, subscribeToStore } from '../../../api/auth';
import { getTrainer } from '../../../api/trainers';
import { getTodaySessions, getTrainerPastSessions } from '../../../api/sessions';
import { formatJalaliLocalized, getTodayJalaliKey, toCanonicalJalali, isJalaliToday } from '../../../lib/date/jalali';
import { formatDate } from '../../../lib/format';
import type { DailySession } from '../../../lib/domain/gymManagement';

interface HistoryItem {
  athlete: string;
  exercises: string;
  duration: string;
}

interface DayGroup {
  dayTitle: string;
  items: HistoryItem[];
}

/**
 * تبدیل جلسات به گروه‌های روزانه برای نمایش در صفحه سوابق.
 * فرهنگ لغت به‌صورت پارامتر داده می‌شود تا این تابع خالص بماند.
 */
function groupSessionsByDate(
  sessions: DailySession[],
  todayKey: number,
  t: ReturnType<typeof useI18n>['t'],
  isFa: boolean
): DayGroup[] {
  const groups = new Map<string, HistoryItem[]>();

  for (const session of sessions) {
    const dateKey = toCanonicalJalali(session.date);
    const items = groups.get(dateKey) || [];

    const exerciseSummary =
      session.exercises && session.exercises.length > 0
        ? session.exercises
            .map(e => {
              const label = exerciseName(e.exerciseId, e.name, isFa);
              return e.weightKg
                ? `${label} ${num(e.sets)}×${num(e.reps)} · ${num(e.weightKg)} ${t.units.kg}`
                : `${label} ${num(e.sets)}×${num(e.reps)}`;
            })
            .join(isFa ? '، ' : ', ')
        : t.trainer.history.noExercises;

    items.push({
      athlete: displayName(session.memberName, isFa),
      exercises: exerciseSummary,
      duration: session.completedAt
        ? t.trainer.history.completedAt.replace('{time}', session.completedAt)
        : '—',
    });

    groups.set(dateKey, items);
  }

  return Array.from(groups.entries())
    .sort((a, b) => {
      const keyA = Number(a[0].replace(/\//g, '')) || todayKey;
      const keyB = Number(b[0].replace(/\//g, '')) || todayKey;
      return keyB - keyA;
    })
    .map(([date, items]) => ({
      dayTitle: isJalaliToday(date) ? t.actions.today : formatJalaliLocalized(date, isFa),
      items,
    }));
}

export function History() {
  const { t, isFa } = useI18n();
  const [version, setVersion] = useState(0);
  const [trainer, setTrainer] = useState<Awaited<ReturnType<typeof getTrainer>>>(undefined);
  const [sessions, setSessions] = useState<DailySession[]>([]);

  const currentTrainerId = getCurrentUser()?.entityId || '';

  useEffect(() => {
    const load = () => {
      getTrainer(currentTrainerId).then(setTrainer);
      Promise.all([
        getTodaySessions(currentTrainerId),
        getTrainerPastSessions(currentTrainerId),
      ]).then(([today, past]) => {
        setSessions([...today, ...past]);
      });
    };

    load();
    return subscribeToStore(() => {
      setVersion(v => v + 1);
      load();
    });
  }, [currentTrainerId]);

  const todayCompleted = sessions.filter(
    s => s.trainerId === currentTrainerId && s.status === 'completed' && isJalaliToday(s.date)
  );

  const completedCount = trainer?.completedSessions || 0;
  const sessionRate = trainer?.sessionRate || 150000;
  const grossEarnings = completedCount * sessionRate;

  const dayGroups = groupSessionsByDate(
    sessions.filter(s => s.trainerId === currentTrainerId),
    getTodayJalaliKey(),
    t,
    isFa
  );

  const stats = [
    { label: t.trainer.history.statCompleted, val: `${num(completedCount)} ${t.units.sessions}` },
    { label: t.trainer.history.statRate, val: `${num(sessionRate / 1000)} ${t.trainer.history.perThousand}` },
    { label: t.trainer.history.statGross, val: `${short(grossEarnings)} ${t.units.toman}` },
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
              className="font-display text-[20px] sm:text-[24px] tnum leading-tight"
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

      {/* جلسات تکمیل‌شده امروز */}
      {todayCompleted.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="px-4 rounded-2xl border shadow-2xs"
        >
          {todayCompleted.map(s => (
            <div
              key={s.id}
              className="py-3 flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-semibold" style={{ color: 'var(--c-heading)' }}>
                {displayName(s.memberName, isFa)}
              </span>
              <span className="text-[12px] tnum" style={{ color: 'var(--c-text-muted)' }}>
                {s.completedAt ? `تکمیل در ${s.completedAt}` : formatDate(s.time)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* لیست جلسات گذشته گروه‌بندی‌شده بر اساس روز */}
      <div className="space-y-4">
        {dayGroups.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="py-10 rounded-2xl border text-center text-[13px]"
          >
            <p style={{ color: 'var(--c-text-muted)' }}>هنوز جلسه‌ای ثبت نشده است.</p>
          </div>
        ) : (
          dayGroups.map(grp => (
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
                {grp.items.map((row, i) => (
                  <div key={`${row.athlete}-${i}`} className="py-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[15px]" style={{ color: 'var(--c-heading)' }}>
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
                      className="text-[13px] mt-1 leading-5"
                      style={{ color: 'var(--c-text-muted)' }}
                    >
                      {row.exercises}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
