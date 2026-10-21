import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, X, AlertTriangle, Check, CalendarDays, ChevronUp, ChevronDown } from 'lucide-react';
import { Seg } from '../../../components/ui/Seg';
import { Btn } from '../../../components/ui/Btn';
import { Modal } from '../../../components/ui/Modal';
import { num } from '../../../lib/format';
import { displayName } from '../../../lib/displayName';
import { MonthlyCalendar } from '../../../components/calendar/MonthlyCalendar';
import { useI18n } from '../../../components/LanguageProvider';
import { getCurrentUser, subscribeToStore } from '../../../api/auth';
import { getMemberSessions } from '../../../api/members';
import { rescheduleSession, cancelSessionByMember } from '../../../api/sessions';
import { getTrainer } from '../../../api/trainers';
import { formatJalaliLocalized, getTodayJalaliString, toCanonicalJalali } from '../../../lib/date/jalali';
import { DailySession } from '../../../lib/domain/gymManagement';

/** بازه ساعت‌های پیشنهادی برای تغییر نوبت */
function buildTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
}

export function Sessions() {
  const [tab, setTab] = useState<'up' | 'past'>('up');
  const [upcoming, setUpcoming] = useState<DailySession[]>([]);
  const [past, setPast] = useState<DailySession[]>([]);

  const [rescheduleTarget, setRescheduleTarget] = useState<DailySession | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayJalaliString());
  const [showCalendar, setShowCalendar] = useState(false);

  const { t, isFa } = useI18n();
  const memberId = getCurrentUser()?.entityId || 'm-reza';

  const loadSessions = () => {
    getMemberSessions(memberId).then(all => {
      const up = all.filter(s => s.status === 'scheduled' || s.status === 'in_progress');
      const completed = all.filter(s => s.status === 'completed' || s.status === 'no_show');
      setUpcoming(up);
      setPast(completed);
    });
  };

  useEffect(() => {
    loadSessions();
    return subscribeToStore(loadSessions);
  }, [memberId]);

  /** روزهایی که ورزشکار مراجعه کرده (تکمیل‌شده یا غیبت) */
  const visitedDates = useMemo(
    () =>
      past.map(s => toCanonicalJalali(s.date)),
    [past]
  );

  /** روزهای رزروشدهٔ آینده */
  const bookedDates = useMemo(
    () =>
      upcoming.map(s => toCanonicalJalali(s.date)),
    [upcoming]
  );

  /** جلسات همان روز انتخاب‌شده در تقویم */
  const daySessions = useMemo(() => {
    return [...upcoming, ...past]
      .filter(s => toCanonicalJalali(s.date) === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [upcoming, past, selectedDate]);

  /** باز کردن مودال تغییر ساعت */
  const openReschedule = async (session: DailySession) => {
    setRescheduleTarget(session);
    setSelectedTime(session.time);
    setFeedback(null);

    // ساعت‌های کاری مربی تعیین‌کننده بازه پیشنهادی است
    const trainer = await getTrainer(session.trainerId);
    if (trainer) {
      const [start, end] = trainer.workingHours.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        setSlots(buildTimeSlots(start, end));
        return;
      }
    }
    setSlots(buildTimeSlots(8, 22));
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !selectedTime) return;
    setBusy(true);
    try {
      const res = await rescheduleSession(rescheduleTarget.id, selectedTime);
      setFeedback({ type: res.success ? 'ok' : 'err', text: res.message });
      if (res.success) {
        setTimeout(() => setRescheduleTarget(null), 1200);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (session: DailySession) => {
    setBusy(true);
    try {
      const res = await cancelSessionByMember(session.id);
      setFeedback({ type: res.success ? 'ok' : 'err', text: res.message });
      if (res.success) {
        setTimeout(() => setFeedback(null), 3200);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* پیام نتیجه عمل */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor:
              feedback.type === 'ok' ? 'var(--c-avail-fg)' : 'var(--c-rubber)',
            color: '#ffffff',
          }}
          className="rounded-xl px-4 py-3 text-[13px] font-bold text-center"
          role="status"
        >
          {feedback.text}
        </motion.div>
      )}

      {/* دکمه نمایش تقویم ماهانه */}
      <button
        type="button"
        onClick={() => setShowCalendar(v => !v)}
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
          color: 'var(--c-steel)',
        }}
        className="w-full h-11 rounded-2xl border flex items-center justify-center gap-2 text-[13px] font-bold transition-colors cursor-pointer"
        aria-expanded={showCalendar}
      >
        <CalendarDays size={16} />
        <span>{t.member.sessions.calendarToggle}</span>
        {showCalendar ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {/* تقویم ماهانه — روزهای مراجعه‌شده و رزروشده */}
      {showCalendar && (
        <section
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
        >
          <MonthlyCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            visitedDates={visitedDates}
            bookedDates={bookedDates}
            variant="member"
          />

          {daySessions.length > 0 && (
            <div className="mt-3.5 space-y-2">
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
                      {displayName(s.trainerName, isFa)}
                    </div>
                    <div
                      className="text-[12px] truncate"
                      style={{ color: 'var(--c-text-muted)' }}
                    >
                      {s.status === 'completed'
                        ? t.member.sessions.completed
                        : s.status === 'no_show'
                        ? t.member.sessions.noShow
                        : t.member.sessions.upcomingTitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* سوییچر بین جلسات پیش‌رو و سوابق */}
      <Seg
        full
        value={tab}
        onChange={v => setTab(v as 'up' | 'past')}
        items={[
          ['up', t.member.sessions.upcoming.replace('{count}', num(upcoming.length))],
          ['past', t.member.sessions.past.replace('{count}', num(past.length))],
        ]}
      />

      {tab === 'up' ? (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="p-8 rounded-2xl border text-center text-[14px]"
            >
              <p style={{ color: 'var(--c-text-muted)' }}>
                {t.member.sessions.emptyUpcoming}
              </p>
            </div>
          ) : (
            upcoming.map(item => (
              <section
                key={item.id}
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-4 rounded-2xl border shadow-xs"
                aria-label={`${t.member.sessions.upcomingTitle} ${formatJalaliLocalized(item.date, isFa)}`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className="font-bold text-[16px]"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {formatJalaliLocalized(item.date, isFa)}
                  </span>
                  <span
                    style={{ color: 'var(--c-ink)' }}
                    className="tnum font-extrabold text-[16px]"
                  >
                    {t.member.sessions.at} {item.time}
                  </span>
                </div>

                <div
                  className="text-[13px] mt-1"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {t.member.sessions.trainer}: {displayName(item.trainerName, isFa)}
                </div>

                <div className="mt-3.5 flex gap-2">
                  <Btn
                    v="soft"
                    className="flex-1 text-xs"
                    onClick={() => openReschedule(item)}
                    disabled={busy || item.status === 'in_progress'}
                  >
                    {t.member.sessions.requestReschedule}
                  </Btn>
                  <Btn
                    v="ghost"
                    className="flex-1 text-xs"
                    onClick={() => handleCancel(item)}
                    disabled={busy || item.status === 'in_progress'}
                  >
                    {t.member.sessions.cancelSlot}
                  </Btn>
                </div>

                {item.status === 'in_progress' && (
                  <div
                    className="text-[12px] mt-2.5 text-center"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {t.member.sessions.inProgressNote}
                  </div>
                )}
              </section>
            ))
          )}

          <div
            className="text-[13px] text-center px-4 leading-6 pt-2"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {t.member.sessions.policyNote}
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
          {past.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--c-text-muted)' }}>
              {t.member.sessions.emptyPast}
            </div>
          ) : (
            past.map((item, idx) => {
              const isNoShow = item.status === 'no_show';
              return (
                <div
                  key={item.id || `${item.date}-${idx}`}
                  className="py-3.5 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-semibold block" style={{ color: 'var(--c-deep)' }}>
                      {formatJalaliLocalized(item.date, isFa)}
                    </span>
                    <span className="text-[12px] opacity-75" style={{ color: 'var(--c-text-muted)' }}>
                      {t.member.sessions.trainer}: {displayName(item.trainerName, isFa)} · {t.member.sessions.at} {item.time}
                    </span>
                  </div>
                  <span
                    style={{
                      color: isNoShow ? 'var(--c-rubber)' : 'var(--c-avail-fg)',
                    }}
                    className="font-bold text-[13px]"
                  >
                    {isNoShow ? t.member.sessions.noShow : t.member.sessions.completed}
                  </span>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* مودال انتخاب ساعت جدید */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title={t.member.sessions.rescheduleTitle}
        description={
          rescheduleTarget
            ? t.member.sessions.rescheduleCurrent.replace('{time}', rescheduleTarget.time).replace('{trainer}', rescheduleTarget.trainerName)
            : undefined
        }
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div
            style={{
              backgroundColor: 'var(--c-surface-2)',
              borderColor: 'var(--c-border)',
            }}
            className="p-3 rounded-xl border flex items-start gap-2"
          >
            <Clock size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--c-steel)' }} />
            <p className="text-[12px] leading-5" style={{ color: 'var(--c-text-muted)' }}>
              {t.member.sessions.rescheduleHint}
            </p>
          </div>

          <div>
            <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--c-deep)' }}>
              {t.member.sessions.suggestedTime}
            </div>
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto thin-scroll">
              {slots.map(slot => {
                const isSelected = selectedTime === slot;
                const isCurrent = rescheduleTarget?.time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    style={{
                      backgroundColor: isSelected ? 'var(--c-ink)' : 'var(--c-surface-1)',
                      color: isSelected ? '#ffffff' : 'var(--c-text-muted)',
                      borderColor: isSelected ? 'var(--c-ink)' : 'var(--c-border)',
                    }}
                    className="h-10 rounded-xl border text-[13px] font-bold tnum transition-colors cursor-pointer"
                    disabled={isCurrent}
                    title={isCurrent ? t.member.sessions.currentTime : undefined}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {feedback && feedback.type === 'err' && (
            <div
              style={{
                backgroundColor: 'var(--c-status-noshow-bg)',
                color: 'var(--c-rubber)',
              }}
              className="rounded-xl text-[13px] font-bold py-2.5 px-3.5 flex items-start gap-2"
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{feedback.text}</span>
            </div>
          )}

          {feedback && feedback.type === 'ok' && (
            <div
              style={{
                backgroundColor: 'var(--c-surface-2)',
                color: 'var(--c-avail-fg)',
              }}
              className="rounded-xl text-[13px] font-bold py-2.5 px-3.5 flex items-start gap-2"
            >
              <Check size={16} className="shrink-0 mt-0.5" />
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <Btn v="soft" className="flex-1" onClick={() => setRescheduleTarget(null)}>
              {t.actions.cancel}
            </Btn>
            <Btn
              v="primary"
              className="flex-1 gap-1.5"
              onClick={handleReschedule}
              disabled={busy || !selectedTime || selectedTime === rescheduleTarget?.time}
            >
              <X size={15} className="rotate-45" />
              <span>{busy ? t.member.sessions.submitting : t.member.sessions.submit}</span>
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
