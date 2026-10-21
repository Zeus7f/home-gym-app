import React, { useState, useEffect } from 'react';
import { Check, Plus } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Btn } from '../../../components/ui/Btn';
import { Modal } from '../../../components/ui/Modal';
import { fa } from '../../../lib/format';
import { displayName } from '../../../lib/displayName';
import { getTodaySessions, checkInSession, getTrainerDailyCapacity, addSessionToToday, cancelSession } from '../../../api/sessions';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Toast } from '../../../components/ui/Toast';
import { getMembers } from '../../../api/members';
import { getCurrentUser, subscribeToStore } from '../../../api/auth';
import { DailySession, Member } from '../../../lib/domain/gymManagement';
import { getTodayJalaliString } from '../../../lib/date/jalali';
import { useI18n } from '../../../components/LanguageProvider';
import { num } from '../../../lib/format';

export interface TodayProps {
  onOpenSession: (session: DailySession) => void;
}

export function Today({ onOpenSession }: TodayProps) {
  const { t, isFa } = useI18n();
  const currentTrainerId = getCurrentUser()?.entityId || '';
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // دیالوگ افزودن ورزشکار به امروز
  const [addOpen, setAddOpen] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');
  const [addTime, setAddTime] = useState('11:00');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<DailySession | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const loadData = async () => {
    try {
      const [sessData, memData] = await Promise.all([
        getTodaySessions(currentTrainerId),
        getMembers(),
      ]);
      setSessions(sessData);
      setMembers(memData);
    } catch (err) {
      console.error('Error fetching trainer today data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(() => {
      loadData();
    });
    return unsub;
  }, [currentTrainerId]);

  const activeSessions = sessions.filter(s => s.status !== 'cancelled');
  const liveSessions = sessions.filter(s => s.status === 'in_progress');
  const waitSessions = sessions.filter(s => s.status === 'scheduled');
  const doneSessions = sessions.filter(s => s.status === 'completed');

  const maxCapacity = getTrainerDailyCapacity(getTodayJalaliString(), currentTrainerId);

  const getMemberRemaining = (memberId: string) => {
    const mem = members.find(m => m.id === memberId);
    return mem ? mem.remainingSessions : 12;
  };

  const handleCheckIn = async (sessionId: string) => {
    await checkInSession(sessionId);
    await loadData();
  };

  /**
   * لغو نوبت توسط مربی (PROJECT_STATUS P2).
   * مهلت ۴ ساعته فقط برای درخواست خود ورزشکار است؛ مربی در هر زمان می‌تواند لغو کند.
   */
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const res = await cancelSession(cancelTarget.id, t.trainer.today.cancelTitle);
    setToast({ message: res.message, ok: res.success });
    setCancelTarget(null);
    await loadData();
  };

  const handleAddAthlete = async () => {
    if (!addMemberId) {
      setAddError(t.trainer.today.errorNoAthlete);
      return;
    }

    setAdding(true);
    setAddError('');

    try {
      // جلوگیری از ثبت نوبت تکراری برای همان ورزشکار در همان ساعت
      const duplicate = sessions.find(
        s => s.memberId === addMemberId && s.time === addTime && s.status !== 'cancelled'
      );
      if (duplicate) {
        setAddError(
          t.trainer.today.errorDuplicate
            .replace('{name}', displayName(duplicate.memberName, isFa))
            .replace('{time}', addTime)
        );
        return;
      }

      const res = await addSessionToToday(addMemberId, currentTrainerId, addTime);
      if (!res.success) {
        setAddError(res.message);
        return;
      }

      await loadData();
      setAddOpen(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : t.trainer.today.errorFailed);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div
        className="py-12 text-center text-sm"
        style={{ color: 'var(--c-text-muted)' }}
      >
        {t.trainer.today.loading}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ۱. کارت ظرفیت کاری امروز مربی */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
              {t.trainer.today.capacityTitle}
            </div>
            <div
              style={{ color: 'var(--c-ink)' }}
              className="font-display text-[42px] leading-none tnum mt-1"
            >
              {num(activeSessions.length)}{' '}
              <span className="text-[20px]" style={{ color: 'var(--c-text-faint)' }}>
                / {num(maxCapacity)}
              </span>
            </div>
          </div>

          <div
            className="text-end text-[13px] leading-6"
            style={{ color: 'var(--c-text-muted)' }}
          >
            <div>
              {t.trainer.today.completed}:{' '}
              <b style={{ color: 'var(--c-heading)' }} className="tnum font-bold">
                {num(doneSessions.length)}
              </b>
            </div>
            <div>
              {t.trainer.today.inGym}:{' '}
              <b style={{ color: 'var(--c-heading)' }} className="tnum font-bold">
                {num(liveSessions.length)}
              </b>
            </div>
            <div>
              {t.trainer.today.waiting}:{' '}
              <b style={{ color: 'var(--c-heading)' }} className="tnum font-bold">
                {num(waitSessions.length)}
              </b>
            </div>
          </div>
        </div>

        {/* نوار نقطه‌ای وضعیت ظرفیت ۶ نوبت */}
        <div className="mt-3.5 flex gap-1.5">
          {Array.from({ length: maxCapacity }, (_, i) => {
            const sess = activeSessions[i];
            const isLive = sess?.status === 'in_progress';
            const isDone = sess?.status === 'completed';

            const dotColor = isLive
              ? 'var(--c-brass)'
              : isDone
                ? 'var(--c-ink)'
                : sess
                  ? 'var(--c-steel)'
                  : 'var(--c-surface-2)';

            return (
              <span
                key={i}
                style={{ backgroundColor: dotColor }}
                className={`h-3 flex-1 rounded-full transition-colors ${
                  isLive ? 'live-pulse' : ''
                }`}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </section>

      {/* ۲. بخش داخل سالن (جلسه در حال انجام) */}
      <div>
        <div
          className="text-[14px] font-bold mb-2 flex items-center justify-between"
          style={{ color: 'var(--c-brass)' }}
        >
          <span>{t.trainer.today.liveSection.replace('{count}', num(liveSessions.length))}</span>
          {liveSessions.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </div>

        {liveSessions.map(s => {
          const remaining = getMemberRemaining(s.memberId);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpenSession(s)}
              style={{
                backgroundColor: 'var(--c-ink)',
                color: '#ffffff',
              }}
              className="w-full text-start rounded-2xl p-4 flex items-center gap-3.5 shadow-md active:scale-[0.99] transition-transform cursor-pointer"
            >
              <Avatar name={displayName(s.memberName, isFa)} size={46} tone="brass" />
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-extrabold truncate">
                  {displayName(s.memberName, isFa)}
                </div>
                <div className="text-[13px] opacity-80 mt-0.5 truncate">
                  {t.trainer.today.atTime.replace('{time}', s.time)} ·{' '}
              {t.trainer.today.remaining.replace('{count}', num(remaining))}
                </div>
              </div>
              <span
                style={{
                  backgroundColor: 'var(--c-brass)',
                  color: 'var(--c-heading)',
                }}
                className="h-10 px-3.5 rounded-xl text-[13px] font-extrabold grid place-items-center shrink-0 shadow-xs"
              >
                {t.trainer.today.continueLogging}
              </span>
            </button>
          );
        })}

        {liveSessions.length === 0 && (
          <div
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="p-4 rounded-xl border text-center text-xs"
          >
            {t.trainer.today.liveEmpty}
          </div>
        )}
      </div>

      {/* ۳. بخش بعدی (نوبت‌های رزرو شده بعدی) */}
      <div>
        <div
          className="text-[14px] font-bold mb-2"
          style={{ color: 'var(--c-text-muted)' }}
        >
          {t.trainer.today.nextSection.replace('{count}', num(waitSessions.length))}
        </div>

        <div className="space-y-2">
          {waitSessions.map(s => {
            const remaining = getMemberRemaining(s.memberId);
            return (
              <div
                key={s.id}
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-3.5 rounded-xl border flex items-center gap-3 shadow-2xs"
              >
                <Avatar name={displayName(s.memberName, isFa)} size={40} tone="mist" />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-[15px]"
                    style={{ color: 'var(--c-heading)' }}
                  >
                    {displayName(s.memberName, isFa)}
                  </div>
                  <div
                    className="text-[13px]"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {t.trainer.today.atTime.replace('{time}', s.time)} ·{' '}
              {t.trainer.today.remaining.replace('{count}', num(remaining))}
                  </div>
                </div>
                <Btn
                  v="soft"
                  className="h-9 px-3 text-xs"
                  onClick={() => setCancelTarget(s)}
                  aria-label={`${t.trainer.today.cancelSlot} — ${displayName(s.memberName, isFa)}`}
                >
                  {t.trainer.today.cancelSlot}
                </Btn>
                <Btn
                  v="ghost"
                  className="h-9 px-3 text-xs"
                  onClick={() => handleCheckIn(s.id)}
                >
                  {t.trainer.today.checkIn}
                </Btn>
              </div>
            );
          })}
        </div>
      </div>

      {/* ۴. بخش تمام‌شده‌ها */}
      {doneSessions.length > 0 && (
        <div>
          <div
            className="text-[14px] font-bold mb-2"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {t.trainer.today.doneSection.replace('{count}', num(doneSessions.length))}
          </div>
          <div className="space-y-1.5 opacity-80">
            {doneSessions.map(s => (
              <div
                key={s.id}
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border text-sm"
              >
                <Check size={16} style={{ color: 'var(--c-avail-fg)' }} />
                <span className="flex-1 font-semibold" style={{ color: 'var(--c-heading)' }}>
                  {displayName(s.memberName, isFa)}
                </span>
                <span className="text-xs tnum" style={{ color: 'var(--c-text-muted)' }}>
                  {s.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* دکمه افزودن ورزشکار */}
      <Btn
        v="soft"
        className="w-full h-12 text-[14px] font-bold gap-2"
        onClick={() => {
          setAddOpen(true);
          setAddMemberId('');
          setAddTime('11:00');
          setAddError('');
        }}
      >
        <Plus size={18} />
        <span>{t.trainer.today.addAthlete}</span>
      </Btn>

      {/* مودال افزودن ورزشکار به برنامه امروز */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title={t.trainer.today.addAthleteTitle}
        description={t.trainer.today.addAthleteDesc}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="add-athlete"
              className="block text-[13px] font-bold mb-2"
              style={{ color: 'var(--c-heading)' }}
            >
              {t.trainer.today.addAthleteField}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAddMemberId(m.id)}
                  style={{
                    backgroundColor: addMemberId === m.id ? 'var(--c-ink)' : 'var(--c-surface-2)',
                    color: addMemberId === m.id ? '#ffffff' : 'var(--c-text-muted)',
                  }}
                  className="px-3 py-1.5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer"
                >
                  {displayName(m.name, isFa)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="add-time"
              className="block text-[13px] font-bold mb-2"
              style={{ color: 'var(--c-heading)' }}
            >
              {t.trainer.today.addAthleteTime}
            </label>
            <input
              id="add-time"
              type="time"
              value={addTime}
              onChange={e => setAddTime(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border text-[14px] tnum"
              style={{
                backgroundColor: 'var(--c-surface-2)',
                color: 'var(--c-ink)',
                borderColor: 'var(--c-border)',
              }}
            />
          </div>

          {addError && (
            <div
              style={{
                backgroundColor: 'var(--c-status-noshow-bg)',
                color: 'var(--c-rubber)',
              }}
              className="rounded-xl text-[13px] font-bold py-2.5 px-3.5"
              role="alert"
            >
              {addError}
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <Btn v="soft" className="flex-1" onClick={() => setAddOpen(false)}>
              {t.actions.cancel}
            </Btn>
            <Btn
              v="primary"
              className="flex-1"
              onClick={handleAddAthlete}
              disabled={!addMemberId || adding}
            >
              {adding ? t.trainer.today.submitting : t.trainer.today.submitSlot}
            </Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title={t.trainer.today.cancelTitle}
        message={t.trainer.today.cancelMessage
          .replace('{name}', cancelTarget ? displayName(cancelTarget.memberName, isFa) : '')
          .replace('{time}', cancelTarget?.time ?? '')}
        confirmText={t.trainer.today.cancelConfirm}
        cancelText={t.trainer.today.cancelKeep}
        variant="danger"
      />
      <Toast
        message={toast?.message ?? null}
        type={toast?.ok === false ? 'warning' : 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
