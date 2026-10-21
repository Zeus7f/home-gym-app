import React, { useState, useEffect } from 'react';
import { H } from '../../../components/ui/H';
import { PlateHero } from '../components/PlateHero';
import { num, toman } from '../../../lib/format';
import { displayName } from '../../../lib/displayName';
import { exerciseName } from '../../../lib/exerciseLabels';
import { getCurrentUser, subscribeToStore } from '../../../api/auth';
import { getMember, getMemberSessions } from '../../../api/members';
import { useI18n } from '../../../components/LanguageProvider';
import { getGym } from '../../../api/gym';
import { NotificationBell } from '../../../components/ui/NotificationBell';
import {
  getTodayJalali,
  parseJalali,
  getJalaliDayOfWeek,
  getCurrentWeekShamsi,
  formatJalaliHumanTodayLocalized,
  PERSIAN_WEEK_DAYS,
  PERSIAN_WEEK_DAYS_EN,
  PERSIAN_WEEK_DAYS_SHORT_EN,
} from '../../../lib/date/jalali';
import { Member } from '../../../lib/domain/gymManagement';

export interface HomeProps {
  onNavigateTab: (tab: string) => void;
}

export function Home({ onNavigateTab }: HomeProps) {
  const { t, isFa } = useI18n();
  const currentUser = getCurrentUser();
  const memberName = displayName(currentUser?.displayName || 'Niloofar Bahrami', isFa);

  const [memberData, setMemberData] = useState<Member | null>(null);
  const [gymName, setGymName] = useState('Iron Haven Fitness Club');
  const [memberSessions, setMemberSessions] = useState<import('../../../lib/domain/gymManagement').DailySession[]>([]);
  const memberId = currentUser?.entityId || 'm-reza';

  useEffect(() => {
    async function load() {
      const gym = await getGym();
      setGymName(gym?.name || t.member.home.gymFallback);

      if (currentUser?.entityId) {
        const mem = await getMember(currentUser.entityId);
        if (mem) setMemberData(mem);

        const sessions = await getMemberSessions(currentUser.entityId);
        setMemberSessions(sessions);
      }
    }
    load();

    // به‌روزرسانی خودکار پس از هر تغییر در استور
    return subscribeToStore(() => {
      if (currentUser?.entityId) {
        getMemberSessions(currentUser.entityId).then(setMemberSessions);
      }
    });
  }, [currentUser]);

  const total = memberData?.totalSessions || 12;
  const used = memberData?.usedSessions || 8;
  const remaining = memberData?.remainingSessions ?? Math.max(0, total - used);
  const debt = memberData?.outstandingBalance || 0;
  const expDate = memberData?.expirationDate || '';

  // روزهای حضور در هفته جاری (شنبه تا جمعه)
  // روزهای هفته از تقویم واقعی گرفته می‌شوند
  const weekVisits = getCurrentWeekShamsi().map((d, idx) => {
    const isToday = d.isToday;
    const hasSession = memberSessions.some(
      s => s.date === 'Today' && s.status !== 'cancelled' && s.memberId === memberId
    );
    return {
      label: isFa ? d.labelShort : PERSIAN_WEEK_DAYS_SHORT_EN[idx],
      status: isToday && hasSession ? 2 : isToday ? 1 : 0,
    };
  });

  return (
    <div className="space-y-4">
      {/* ۱. هیرو کارت سرمه‌ای وضعیت بسته ورزشکار */}
      <section
        style={{
          backgroundColor: 'var(--c-ink)',
          color: '#ffffff',
        }}
        className="px-5 pt-8 pb-6 rounded-3xl shadow-md select-none -mx-4 -mt-5 sm:mx-0 sm:mt-0"
        aria-label={t.member.home.remainingLabel}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] opacity-80">{t.member.home.greeting} {memberName}</div>
            <div className="font-display text-[26px] leading-tight text-white mt-0.5">
              {gymName}
            </div>
          </div>

          <NotificationBell onNavigateTab={onNavigateTab} />
        </div>

        {/* جلسات باقیمانده و صفحات وزنه PlateHero */}
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[13px] opacity-80">{t.member.home.remainingLabel}</div>
            <div
              style={{
                color: remaining <= 2 ? 'var(--c-rubber)' : 'var(--c-brass)',
              }}
              className="font-display text-[64px] sm:text-[72px] leading-[0.85] tnum mt-1"
            >
              {num(remaining)}
            </div>
            <div className="text-[13px] opacity-80 mt-2">
              {t.member.home.of} {num(total)} {t.member.home.sessions} {expDate}
            </div>
          </div>

          <PlateHero total={total} remaining={remaining} height={76} plateWidth={9} />
        </div>

        {/* نوار وضعیت بدهی (در صورت وجود بدهی) */}
        {debt > 0 && (
          <div
            style={{ backgroundColor: 'var(--c-deep)' }}
            className="mt-4 rounded-xl px-3.5 py-2.5 text-[14px] flex items-center justify-between text-slate-100"
          >
            <span className="opacity-90">{t.member.home.debtLabel}</span>
            <b style={{ color: 'var(--c-rubber)' }} className="tnum font-bold">
              {toman(debt)}
            </b>
          </div>
        )}
      </section>

      {/* ۲. کارت نوبت بعدی */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border flex items-center gap-4 shadow-xs"
        aria-label={t.member.home.nextSlot}
      >
        <div className="text-center w-16 shrink-0">
          {(() => {
            const nextSess = memberSessions.find(
              s => s.memberId === (currentUser?.entityId || 'm-reza') && s.status === 'scheduled'
            );
            const target = nextSess?.date && nextSess.date !== 'Today'
              ? parseJalali(nextSess.date)
              : getTodayJalali();
            const dayIndex = getJalaliDayOfWeek(target.jy, target.jm, target.jd);
            const dayName = isFa
              ? PERSIAN_WEEK_DAYS[dayIndex]
              : PERSIAN_WEEK_DAYS_EN[dayIndex];

            return (
              <>
                <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
                  {dayName}
                </div>
                <div
                  style={{ color: 'var(--c-ink)' }}
                  className="font-display text-[32px] leading-none mt-0.5"
                >
                  {num(target.jd)}
                </div>
              </>
            );
          })()}
        </div>

        <div
          style={{ borderColor: 'var(--c-border)' }}
          className="flex-1 border-r pr-4"
        >
          <div
            style={{ color: 'var(--c-brass)' }}
            className="text-[13px] font-bold"
          >
            {t.member.home.nextSlotTitle}
          </div>
          <div
            className="font-extrabold text-[15px] mt-0.5"
            style={{ color: 'var(--c-deep)' }}
          >
            {(() => {
              const nextSess = memberSessions.find(
                s => s.memberId === (currentUser?.entityId || 'm-reza') && s.status === 'scheduled'
              );
              if (nextSess) {
                return t.member.home.todayAt
                  .replace('{time}', nextSess.time)
                  .replace('{trainer}', nextSess.trainerName);
              }
              const trainer = memberData?.defaultTrainerName || 'Sara Jalali';
              return t.member.home.nextWith.replace('{trainer}', displayName(trainer, isFa));
            })()}
          </div>
        </div>
      </section>

      {/* ۳. آخرین تمرین انجام‌شده */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
        aria-label={t.member.home.lastWorkoutSub}
      >
        <H
          action={
            <button
              type="button"
              onClick={() => onNavigateTab('ex')}
              style={{ color: 'var(--c-steel)' }}
              className="text-[14px] font-bold hover:underline cursor-pointer"
            >{t.member.home.viewDetails}</button>
          }
        >{t.member.home.lastWorkout}
        </H>

        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {(() => {
            const memberId = currentUser?.entityId || 'm-reza';
            const lastSession = memberSessions.find(
              s => s.memberId === memberId && s.status === 'completed' && s.exercises && s.exercises.length > 0
            );

            const displayExercises = lastSession?.exercises?.slice(0, 3).map(e => [
              exerciseName(e.exerciseId, e.name, isFa),
              `${num(e.sets)} × ${num(e.reps)}${
                e.weightKg ? ` · ${num(e.weightKg)} ${t.units.kg}` : ''
              }`,
            ]) || [
              ['Goblet Squat', '3 × 12 · 16 kg'],
              ['Dumbbell Lunge', '3 × 10 · 10 kg'],
              ['Plank', '3 × 45 sec'],
            ];

            return displayExercises.map(([name, desc]) => (
              <div
                key={name}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="font-semibold" style={{ color: 'var(--c-deep)' }}>
                  {name}
                </span>
                <span className="tnum font-medium" style={{ color: 'var(--c-text-muted)' }}>
                  {desc}
                </span>
              </div>
            ));
          })()}
        </div>
      </section>

      {/* ۴. نوار روزهای حضور در هفته جاری */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
        aria-label={t.member.home.attendance}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-[15px]" style={{ color: 'var(--c-deep)' }}>
            {t.member.home.weeklyActivity}
          </span>
          <span className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            {t.member.home.weeklyVisits.replace('{count}', num(2))}
          </span>
        </div>

        <div className="flex justify-between items-end pt-1">
          {weekVisits.map((item, index) => {
            const barBg =
              item.status === 1
                ? 'var(--c-ink)'
                : item.status === 2
                  ? 'var(--c-brass)'
                  : 'var(--c-surface-2)';

            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1.5 flex-1"
              >
                <span
                  style={{ backgroundColor: barBg }}
                  className="h-10 w-3 rounded-sm transition-colors"
                  aria-hidden="true"
                />
                <span
                  style={{
                    color:
                      item.status === 2
                        ? 'var(--c-brass)'
                        : 'var(--c-text-muted)',
                  }}
                  className={`text-[13px] ${item.status === 2 ? 'font-bold' : ''}`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
