import React, { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Chips } from '../../../components/ui/Chips';
import { Pill, SessionStatus } from '../../../components/ui/Pill';
import { Avatar } from '../../../components/ui/Avatar';
import { Btn } from '../../../components/ui/Btn';
import { useI18n } from '../../../components/LanguageProvider';
import { Toast } from '../../../components/ui/Toast';
import { displayName } from '../../../lib/displayName';
import { num } from '../../../lib/format';
import {
  getCurrentWeekShamsi,
  getCurrentHour,
  PERSIAN_WEEK_DAYS_SHORT,
  WeekDay,
} from '../../../lib/date/jalali';
import { PERSIAN_WEEK_DAYS_SHORT_EN as WEEK_DAYS_SHORT_EN } from '../../../lib/date/jalali';
import { getSessions, checkInSession, completeSession } from '../../../api/sessions';
import { DailySession } from '../../../lib/domain/gymManagement';

export interface SchedProps {
  isMobile?: boolean;
}

export function Sched({ isMobile = false }: SchedProps) {
  const { t, isFa } = useI18n();
  const weekDays = getCurrentWeekShamsi();
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => {
    const today = weekDays.find(d => d.isToday);
    return today ? today.dateKey : weekDays[0].dateKey;
  });

  const [filter, setFilter] = useState<'all' | 'live' | 'wait' | 'done'>('all');
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);

  const currentHour = getCurrentHour();

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const data = await getSessions(selectedDayKey);
        setSessions(data);
      } catch (err) {
        console.error('Error fetching schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [selectedDayKey]);

  // فیلتر وضعیت
  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'live') return s.status === 'in_progress';
    if (filter === 'wait') return s.status === 'scheduled';
    if (filter === 'done') return s.status === 'completed';
    return true;
  });

  // استخراج ساعات جلسات و مرتب‌سازی
  const sessionHours: number[] = Array.from(
    new Set<number>(
      filteredSessions.map(s => {
        const raw = s.time.replace(/[\u06F0-\u06F9]/g, d =>
          String(d.charCodeAt(0) - 0x06f0)
        );
        const parsed = parseInt(raw.split(':')[0], 10);
        return isNaN(parsed) ? 8 : parsed;
      })
    )
  ).sort((a, b) => a - b);

  const handleCheckIn = async (sessionId: string) => {
    await checkInSession(sessionId);
    const updated = await getSessions(selectedDayKey);
    setSessions(updated);
  };

  const [toast, setToast] = useState<string | null>(null);

  // B-06: تکمیل ناموفق (لغوشده، بدون اعتبار، بستهٔ منقضی) باید به مدیر نمایش داده شود
  const handleComplete = async (sessionId: string) => {
    const res = await completeSession(sessionId);
    if (!res.success) setToast(res.message);
    const updated = await getSessions(selectedDayKey);
    setSessions(updated);
  };

  return (
    <div className="space-y-6">
      {/* هدر تقویم روزهای هفته (شنبه تا جمعه) و فیلترها */}
      <div
        className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between gap-4'}`}
      >
        {/* نوار انتخاب روز هفته واقعی شمسی */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {weekDays.map(day => {
            const isSelected = selectedDayKey === day.dateKey;
            const dayIndex = PERSIAN_WEEK_DAYS_SHORT.indexOf(day.labelShort);
            const dayLabel =
              isFa || dayIndex < 0 ? day.labelShort : WEEK_DAYS_SHORT_EN[dayIndex];
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDayKey(day.dateKey)}
                style={{
                  backgroundColor: isSelected
                    ? 'var(--c-ink)'
                    : 'var(--c-surface-1)',
                  borderColor: isSelected
                    ? 'var(--c-ink)'
                    : 'var(--c-border)',
                  color: isSelected ? '#ffffff' : 'var(--c-text)',
                }}
                className={`h-16 ${isMobile ? 'flex-1 min-w-[46px]' : 'w-14'} rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer`}
              >
                <span className="text-[13px] opacity-80 leading-none">
                  {dayLabel}
                </span>
                <span className="text-[18px] font-bold tnum mt-1 leading-none">
                  {num(day.dayNum)}
                </span>
                {day.isToday && (
                  <span
                    style={{
                      backgroundColor: isSelected ? 'var(--c-brass)' : 'var(--c-ink)',
                    }}
                    className="w-1.5 h-1.5 rounded-full mt-1"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* فیلتر وضعیت */}
        <Chips<'all' | 'wait' | 'done' | 'live'>
          value={filter}
          onChange={setFilter}
          ariaLabel={t.owner.sched.statusFilter}
          items={[
            ['all', t.owner.sched.all],
            ['live', t.owner.sched.inGym],
            ['wait', t.owner.sched.waiting],
            ['done', t.owner.sched.done],
          ]}
        />
      </div>

      {loading && (
        <div
          className="py-12 text-center text-sm"
          style={{ color: 'var(--c-text-muted)' }}
        >
          {t.owner.sched.loading}
        </div>
      )}

      {/* لیست زمانی ساعت به ساعت */}
      {!loading && (
        <div className="space-y-6">
          {sessionHours.map(hour => {
            const list = filteredSessions.filter(s => {
              const raw = s.time.replace(/[\u06F0-\u06F9]/g, d =>
                String(d.charCodeAt(0) - 0x06f0)
              );
              const parsed = parseInt(raw.split(':')[0], 10);
              return (isNaN(parsed) ? 8 : parsed) === hour;
            });

            const isCurrentNowHour = hour === currentHour;

            return (
              <div key={hour} className="space-y-2.5">
                {/* تیتر ساعت با نشانگر الان */}
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      color: isCurrentNowHour ? 'var(--c-brass)' : 'var(--c-ink)',
                    }}
                    className="font-display text-[24px] tnum leading-none"
                  >
                    {t.owner.sched.hourFormat.replace('{hour}', num(hour))}
                  </span>
                  {isCurrentNowHour && (
                    <span
                      style={{
                        backgroundColor: 'var(--c-brass)',
                        color: 'var(--c-deep)',
                      }}
                      className="h-6 px-2.5 rounded-md text-[13px] font-bold inline-flex items-center"
                    >
                      {t.owner.sched.now}
                    </span>
                  )}
                  <span
                    style={{ backgroundColor: 'var(--c-border)' }}
                    className="flex-1 h-px"
                  />
                  <span
                    className="text-[13px] tnum"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {t.owner.sched.sessionCount.replace(
                      '{count}',
                      num(list.length)
                    )}
                  </span>
                </div>

                {/* کارت‌های جلسات آن ساعت */}
                <div
                  className={
                    isMobile ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-3'
                  }
                >
                  {list.map(s => {
                    const isLive = s.status === 'in_progress';
                    const isWait = s.status === 'scheduled';
                    const isDone = s.status === 'completed';
                    const isCancel = s.status === 'cancelled';

                    const statusKey: SessionStatus = isLive
                      ? 'live'
                      : isDone
                        ? 'done'
                        : isCancel
                          ? 'cancel'
                          : 'wait';

                    return (
                      <div
                        key={s.id}
                        style={{
                          backgroundColor: 'var(--c-surface-1)',
                          borderColor: 'var(--c-border)',
                        }}
                        className="p-3.5 rounded-xl border flex items-center gap-3 shadow-2xs"
                      >
                        <Avatar
                          name={displayName(s.memberName, isFa)} size={40}
                          tone={isLive ? 'brass' : isDone ? 'ink' : 'mist'}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            style={{
                              color: isCancel
                                ? 'var(--c-text-faint)'
                                : 'var(--c-deep)',
                            }}
                            className={`font-semibold truncate text-[15px] ${isCancel ? 'line-through' : ''}`}
                          >
                            {displayName(s.memberName, isFa)}
                          </div>
                          <div
                            className="text-[13px] truncate flex items-center gap-1.5"
                            style={{ color: 'var(--c-text-muted)' }}
                          >
                            <span>{displayName(s.trainerName, isFa)}</span>
                            {s.isDailyOverride && (
                              <span
                                style={{ color: 'var(--c-brass)' }}
                                className="inline-flex items-center gap-0.5 text-xs font-semibold"
                              >
                                <ArrowLeftRight size={12} />
                                {t.owner.sched.dailyOverride}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* اکشن‌های سریع نوبت */}
                        {isWait && (
                          <Btn
                            v="ghost"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleCheckIn(s.id)}
                          >
                            {t.owner.sched.checkIn}
                          </Btn>
                        )}
                        {isLive && (
                          <Btn
                            v="primary"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleComplete(s.id)}
                          >
                            {t.owner.sched.finish}
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
            <div
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="py-12 text-center rounded-2xl border text-sm"
            >
              {t.owner.sched.empty}
            </div>
          )}
        </div>
      )}
      <Toast message={toast} type="warning" onClose={() => setToast(null)} />
    </div>
  );
}
