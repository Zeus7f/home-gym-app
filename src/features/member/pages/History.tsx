import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, Scale, AlertTriangle } from 'lucide-react';
import { H } from '../../../components/ui/H';
import { num } from '../../../lib/format';
import { useI18n } from '../../../components/LanguageProvider';
import { exerciseName, muscleName } from '../../../lib/exerciseLabels';
import { getCurrentUser, subscribeToStore } from '../../../api/auth';
import { getMemberSessions } from '../../../api/members';
import { EXERCISE_CATALOG } from '../../../lib/exercises/catalog';
import { getTodayJalaliKey } from '../../../lib/date/jalali';
import type { DailySession } from '../../../lib/domain/gymManagement';
import {
  computeMemberAnalytics,
  type PersonalRecordSummary,
  type PushPullCategory,
} from '../../../lib/domain/memberAnalytics';

const PR_LABELS: Record<PersonalRecordSummary['prType'], string> = {
  max_weight: 'prWeight',
  max_reps: 'prReps',
  est_1rm: 'prOneRm',
};

const PR_UNITS: Record<PersonalRecordSummary['prType'], string> = {
  max_weight: 'prUnitWeight',
  max_reps: 'prUnitReps',
  est_1rm: 'prUnitWeight',
};

const CATEGORY_LABELS: Record<PushPullCategory, string> = {
  push: 'push',
  pull: 'pull',
  legs: 'legs',
  core: 'core',
  cardio: 'cardio',
  other: 'other',
};

const CATEGORY_COLORS: Record<PushPullCategory, string> = {
  push: 'var(--c-brass)',
  pull: 'var(--c-steel)',
  legs: 'var(--c-ink)',
  core: 'var(--c-avail-fg)',
  cardio: 'var(--c-text-muted)',
  other: 'var(--c-text-faint)',
};

export function History() {
  const { t, isFa } = useI18n();
  const [version, setVersion] = useState(0);
  const [sessions, setSessions] = useState<DailySession[]>([]);

  const memberId = getCurrentUser()?.entityId || 'm-reza';

  useEffect(() => {
    const load = () => {
      getMemberSessions(memberId).then(setSessions);
    };
    load();
    return subscribeToStore(() => {
      setVersion(v => v + 1);
      load();
    });
  }, [memberId]);

  const analytics = useMemo(() => {
    return computeMemberAnalytics({
      sessions,
      catalog: EXERCISE_CATALOG,
      todayKey: getTodayJalaliKey(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, version]);

  const {
    totalCompletedSessions,
    weeklyAverage,
    personalRecords,
    trend,
    mainExerciseName,
    mainExerciseId,
    progression,
    muscleWorkloads,
    balance,
    untrainedMuscles,
  } = analytics;

  // فقط رکوردهای وزنه‌ای (۱RM و وزنه) — تکرار خالص گیج‌کننده است
  const weightRecords = personalRecords
    .filter(r => r.prType === 'max_weight' || r.prType === 'est_1rm')
    .slice()
    .reverse()
    .slice(0, 6);

  const maxTrendWeight = Math.max(...trend.map(t => t.weight), 1);

  const balanceTotal =
    balance.push + balance.pull + balance.legs + balance.core + balance.cardio;

  if (totalCompletedSessions === 0) {
    return (
      <div className="space-y-4">
        <section
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-8 rounded-2xl border text-center"
        >
          <Trophy size={28} className="mx-auto" style={{ color: 'var(--c-brass)' }} />
          <p className="mt-3 text-[15px] font-bold" style={{ color: 'var(--c-deep)' }}>
            {t.member.history.noSessionsTitle}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            {t.member.history.noSessionsBody}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ۱. کارت متریک‌های کلان ورزشکار */}
      <div className="grid grid-cols-2 gap-3">
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
        >
          <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>{t.member.history.totalVisits}</div>
          <div
            style={{ color: 'var(--c-ink)' }}
            className="font-display text-[34px] leading-tight tnum mt-1"
          >
            {num(totalCompletedSessions)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
        >
          <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>{t.member.history.weeklyAverage}</div>
          <div
            style={{ color: 'var(--c-ink)' }}
            className="font-display text-[34px] leading-tight tnum mt-1"
          >
            {num(weeklyAverage)}{' '}
            <span className="text-[14px] font-sans font-normal opacity-70">
              {t.member.history.session}
            </span>
          </div>
        </div>
      </div>

      {/* ۲. بخش رکوردهای شخصی (Personal Records) */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
        aria-label={t.member.history.prTitle}
      >
        <H sub={t.member.history.prSub}>{t.member.history.prTitle}</H>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {weightRecords.length === 0 ? (
            <p className="py-4 text-[13px] text-center" style={{ color: 'var(--c-text-muted)' }}>
              {t.member.history.prEmpty}
            </p>
          ) : (
            weightRecords.map((item, i) => (
              <div
                key={`${item.exerciseId}-${item.prType}-${i}`}
                className="flex items-center gap-3 py-3 border-b last:border-0"
              >
                <Trophy size={18} style={{ color: 'var(--c-brass)' }} />
                <span
                  className="flex-1 font-semibold text-[15px] min-w-0 truncate"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {exerciseName(item.exerciseId, item.exerciseName, isFa)}
                </span>
                <span
                  className="font-bold tnum text-[14px] whitespace-nowrap"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {num(Math.round(item.value))}{' '}
                  <span className="text-[11px] font-normal opacity-70">
                    {t.member.history[PR_UNITS[item.prType]]}
                  </span>
                </span>
                {item.previousValue > 0 && (
                  <span
                    style={{ color: 'var(--c-avail-fg)' }}
                    className="text-[13px] tnum font-bold w-12 text-left"
                  >
                    +{num(Math.round(item.value - item.previousValue))}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ۳. نمودار روند افزایش رکورد وزنه */}
      {trend.length > 0 && (
        <section
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
          aria-label={t.member.history.trendTitle}
        >
          <H sub={t.member.history.trendSub.replace(
            '{exercise}',
            exerciseName(mainExerciseId, mainExerciseName, isFa)
          ).replace('{count}', num(trend.length))}>{t.member.history.trendTitle}</H>

          <div className="mt-5 flex items-end gap-2.5 h-32 select-none pt-2">
            {trend.map((point, i) => {
              const heightPct = (point.weight / maxTrendWeight) * 100;
              return (
                <div
                  key={`${point.date}-${i}`}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"
                >
                  <span
                    className="text-[11px] tnum font-bold"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {num(point.weight)}
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
                        i === trend.length - 1 ? 'var(--c-brass)' : 'var(--c-ink)',
                      opacity: 0.5 + (i / Math.max(1, trend.length - 1)) * 0.5,
                    }}
                    className="w-full rounded-t-md transition-all"
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ۴. توصیه بار بعدی بر پایه موتور پیشرفت */}
      {progression && (
        <section
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
          aria-label={t.member.history.adviceTitle}
        >
          <H sub={exerciseName(mainExerciseId, mainExerciseName, isFa)}>
            {t.member.history.adviceTitle}
          </H>

          <div className="mt-3 flex items-center gap-3">
            <span
              style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-steel)' }}
              className="h-11 w-11 rounded-xl grid place-items-center shrink-0"
            >
              {progression.isDeloadTriggered ? (
                <AlertTriangle size={20} style={{ color: 'var(--c-rubber)' }} />
              ) : (
                <TrendingUp size={20} />
              )}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-display text-[26px] leading-none tnum"
                  style={{ color: 'var(--c-ink)' }}
                >
                  {num(progression.nextLoadKg)}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--c-text-muted)' }}>
                  {t.units.kg} · {num(progression.nextTargetReps.min)}–
                  {num(progression.nextTargetReps.max)} {t.units.reps}
                </span>
              </div>
              <p className="text-[12px] mt-1 leading-5" style={{ color: 'var(--c-text-muted)' }}>
                {progression.rationale}
              </p>
            </div>
          </div>

          {progression.isStalled && (
            <div
              style={{
                backgroundColor: 'var(--c-status-noshow-bg)',
                color: 'var(--c-rubber)',
              }}
              className="mt-3 rounded-xl text-[13px] font-bold py-2.5 px-3.5"
            >
              {t.member.history.stalledWarning}
            </div>
          )}
        </section>
      )}

      {/* ۵. ماتریس تعادل عضلانی */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
        aria-label={t.member.history.balanceTitle}
      >
        <H sub={t.member.history.balanceSub}>{t.member.history.balanceTitle}</H>

        {balanceTotal === 0 ? (
          <p className="mt-3 text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            {t.member.history.balanceEmpty}
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              {(
                [
                  ['push', balance.push],
                  ['pull', balance.pull],
                  ['legs', balance.legs],
                  ['core', balance.core],
                  ['cardio', balance.cardio],
                ] as Array<[PushPullCategory, number]>
              )
                .filter(([, value]) => value > 0)
                .map(([key, value]) => {
                  const pct = (value / balanceTotal) * 100;
                  return (
                    <div key={key} className="flex items-center gap-2.5">
                      <span
                        className="text-[12px] w-24 shrink-0 truncate"
                        style={{ color: 'var(--c-text-muted)' }}
                      >
                        {t.member.history[CATEGORY_LABELS[key]]}
                      </span>
                      <div
                        style={{ backgroundColor: 'var(--c-surface-2)' }}
                        className="flex-1 h-2 rounded-full overflow-hidden"
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CATEGORY_COLORS[key],
                          }}
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                      <span
                        className="text-[12px] tnum font-bold w-10 text-left"
                        style={{ color: 'var(--c-deep)' }}
                      >
                        {num(value)}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="mt-3.5 pt-3 border-t grid grid-cols-2 gap-3 border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-[12px]" style={{ color: 'var(--c-text-muted)' }}>{t.member.history.pushPullRatio}</div>
                <div
                  className="font-bold tnum text-[18px] mt-0.5"
                  style={{ color: 'var(--c-ink)' }}
                >
                  {num(balance.pushPullRatio)}
                </div>
              </div>
              <div>
                <div className="text-[12px]" style={{ color: 'var(--c-text-muted)' }}>{t.member.history.upperLowerRatio}</div>
                <div
                  className="font-bold tnum text-[18px] mt-0.5"
                  style={{ color: 'var(--c-ink)' }}
                >
                  {num(balance.upperLowerRatio)}
                </div>
              </div>
            </div>

            {untrainedMuscles.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--c-status-noshow-bg)',
                  color: 'var(--c-rubber)',
                }}
                className="mt-3 rounded-xl text-[13px] font-bold py-2.5 px-3.5 flex items-start gap-2"
              >
                <Scale size={16} className="shrink-0 mt-0.5" />
                <span>
                  {t.member.history.untrained.replace('{list}', untrainedMuscles
                    .map(m => muscleName(m.id, m.name, isFa))
                    .join(isFa ? '، ' : ', '))}
                </span>
              </div>
            )}
          </>
        )}
      </section>

      {/* ۶. توزیع ست‌های مؤثر به تفکیک عضله */}
      {muscleWorkloads.length > 0 && (
        <section
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
          aria-label={t.member.history.volumeTitle}
        >
          <H sub={t.member.history.volumeSub}>{t.member.history.volumeTitle}</H>

          <div className="mt-3 space-y-1.5">
            {muscleWorkloads
              .filter(w => w.effectiveSets > 0)
              .slice(0, 8)
              .map(w => (
                <div key={w.muscleId} className="flex items-center justify-between gap-3">
                  <span className="text-[13px]" style={{ color: 'var(--c-deep)' }}>
                    {muscleName(w.muscleId, w.muscleName, isFa)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] tnum" style={{ color: 'var(--c-text-muted)' }}>
                      {num(w.totalVolumeKg)} {t.member.history.volumeUnit}
                    </span>
                    <span
                      className="text-[13px] tnum font-bold w-8 text-left"
                      style={{ color: 'var(--c-ink)' }}
                    >
                      {num(w.effectiveSets)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
