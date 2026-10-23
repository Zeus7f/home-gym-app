import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ArrowLeftRight } from 'lucide-react';
import { H } from '../../../components/ui/H';
import { Btn } from '../../../components/ui/Btn';
import { Avatar } from '../../../components/ui/Avatar';
import { Capacity } from '../../../components/ui/Capacity';
import { MemberData } from '../components/MemberSheet';
import { num, short, toman } from '../../../lib/format';
import { useI18n } from '../../../components/LanguageProvider';
import { Toast } from '../../../components/ui/Toast';
import { displayName } from '../../../lib/displayName';
import { getTodaySessions, completeSession, checkInSession } from '../../../api/sessions';
import { getMembers } from '../../../api/members';
import { getTrainers } from '../../../api/trainers';
import { DailySession, Gym, Member, Trainer } from '../../../lib/domain/gymManagement';
import { getGym } from '../../../api/gym';
import { subscribeToStore } from '../../../api/auth';
import { NewMemberSheet } from '../../accounts/AccountForms';

export interface DashProps {
  onNavigate?: (tab: string) => void;
  onOpenMember?: (member: MemberData) => void;
  isMobile?: boolean;
}

export function Dash({ onNavigate, onOpenMember, isMobile = false }: DashProps) {
  const { t, isFa } = useI18n();
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [gym, setGym] = useState<Gym | null>(null);
  const [creatingMember, setCreatingMember] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // واکشی داده‌ها از لایه API
  useEffect(() => {
    async function loadData() {
      try {
        const [sessData, memData, trData, gymData] = await Promise.all([
          getTodaySessions(),
          getMembers(),
          getTrainers(),
          getGym(),
        ]);
        setGym(gymData);
        setSessions(sessData);
        setMembers(memData);
        setTrainers(trData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    return subscribeToStore(loadData);
  }, []);

  const capacityProps = {
    sessions: sessions.map(s => ({ time: s.time, status: s.status })),
    totalCapacity: gym?.capacity ?? 30,
    hourCap: gym?.hourlyCapacity ?? 6,
  };

  const live = sessions.filter(s => s.status === 'in_progress');
  const next = sessions.filter(s => s.status === 'scheduled');
  const lowMembers = members.filter(
    m => m.status === 'active' && m.remainingSessions <= 2
  );

  const totalReceivables = members.reduce((sum, m) => sum + m.outstandingBalance, 0);

  // اتمام جلسه به صورت زنده
  const [toast, setToast] = useState<string | null>(null);

  // B-06: تکمیل ناموفق (لغوشده، بدون اعتبار، بستهٔ منقضی) باید به مدیر نمایش داده شود
  const handleComplete = async (sessionId: string) => {
    const res = await completeSession(sessionId);
    if (!res.success) setToast(res.message);
    const updated = await getTodaySessions();
    setSessions(updated);
  };

  // ثبت ورود به سالن
  const handleCheckIn = async (sessionId: string) => {
    await checkInSession(sessionId);
    const updated = await getTodaySessions();
    setSessions(updated);
  };

  // بخش الان و بعدی
  const FloorSection = (
    <section
      style={{
        backgroundColor: 'var(--c-surface-1)',
        borderColor: 'var(--c-border)',
      }}
      className="p-5 rounded-2xl border shadow-xs"
    >
      <H
        sub={`${num(live.length)} ${t.owner.dash.inGymNow} · ${num(next.length)} ${t.owner.dash.nextUp}`}
        action={
          <button
            type="button"
            onClick={() => onNavigate?.('sched')}
            style={{ color: 'var(--c-steel)' }}
            className="text-[14px] font-semibold hover:underline cursor-pointer"
          >
            {t.owner.dash.fullSchedule}
          </button>
        }
      >
        {t.owner.dash.nowAndNext}
      </H>

      <div className="mt-3">
        {[...live, ...next.slice(0, isMobile ? 2 : 4)].map(s => {
          const isLive = s.status === 'in_progress';
          return (
            <div
              key={s.id}
              style={{ borderColor: 'var(--c-surface-2)' }}
              className="flex items-center gap-3 py-2.5 border-b last:border-0"
            >
              <span
                style={{
                  backgroundColor: isLive ? 'var(--c-brass)' : 'var(--c-steel)',
                }}
                className={`h-9 w-1.5 rounded-full shrink-0 ${isLive ? 'live-pulse' : ''}`}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold truncate"
                  style={{ color: 'var(--c-heading)' }}
                >
                  {displayName(s.memberName, isFa)}
                </div>
                <div
                  className="text-[14px] truncate"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {s.time} · {displayName(s.trainerName, isFa)}
                  {s.isDailyOverride && (
                    <span
                      style={{ color: 'var(--c-brass)' }}
                      className="inline-flex items-center gap-1 font-medium ms-1"
                    >
                      <ArrowLeftRight size={13} />
                      {t.owner.dash.dailyOverride}
                    </span>
                  )}
                </div>
              </div>
              {isLive ? (
                <Btn
                  v="primary"
                  className="h-9 px-3 text-xs"
                  onClick={() => handleComplete(s.id)}
                >
                  {t.owner.dash.completeSession}
                </Btn>
              ) : (
                <Btn
                  v="ghost"
                  className="h-9 px-3 text-xs"
                  onClick={() => handleCheckIn(s.id)}
                >
                  {t.owner.dash.checkIn}
                </Btn>
              )}
            </div>
          );
        })}

        {live.length === 0 && next.length === 0 && (
          <div
            className="py-6 text-center text-[14px]"
            style={{ color: 'var(--c-text-faint)' }}
          >
            {t.owner.dash.noSlotAtHour}
          </div>
        )}
      </div>
    </section>
  );

  // بخش بار مربیان امروز
  const LoadSection = (
    <section
      style={{
        backgroundColor: 'var(--c-surface-1)',
        borderColor: 'var(--c-border)',
      }}
      className="p-5 rounded-2xl border shadow-xs"
    >
      <H
        action={
          <button
            type="button"
            onClick={() => onNavigate?.('tr')}
            style={{ color: 'var(--c-steel)' }}
            className="text-[14px] font-semibold hover:underline cursor-pointer"
          >
            {t.owner.dash.trainers}
          </button>
        }
      >
        {t.owner.dash.trainerLoadTitle}
      </H>

      <div className="mt-4 space-y-4">
        {trainers.map(trainer => {
          const trainerSessions = sessions.filter(
            s => s.trainerId === trainer.id && s.status !== 'cancelled'
          );
          const cap = trainer.dailyCapacity || 6;
          const pct = Math.min(1, trainerSessions.length / cap);
          const full = trainerSessions.length >= cap;

          return (
            <div key={trainer.id} className="flex items-center gap-3">
              <Avatar name={displayName(trainer.name, isFa)} size={36} tone="mist" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[14px]">
                  <span
                    className="font-semibold truncate"
                    style={{ color: 'var(--c-heading)' }}
                  >
                    {displayName(trainer.name, isFa)}
                  </span>
                  <span
                    style={{
                      color: full ? 'var(--c-rubber)' : 'var(--c-text-muted)',
                    }}
                    className={`tnum ${full ? 'font-bold' : ''}`}
                  >
                    {full
                      ? t.owner.dash.completed
                      : t.owner.dash.freeSlots.replace(
                          '{count}',
                          num(cap - trainerSessions.length)
                        )}
                  </span>
                </div>
                <div
                  style={{ backgroundColor: 'var(--c-surface-2)' }}
                  className="mt-1.5 h-2 rounded-full overflow-hidden"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                      backgroundColor: full ? 'var(--c-rubber)' : 'var(--c-ink)',
                    }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  // بخش بسته‌های رو به اتمام
  const LowSection = (
    <section
      style={{
        backgroundColor: 'var(--c-status-noshow-bg)',
        borderColor: 'var(--c-rubber)',
      }}
      className="p-5 rounded-2xl border shadow-xs"
    >
      <H sub={t.owner.dash.lowPackagesSub}>{t.owner.dash.lowPackagesTitle}</H>
      <div className="mt-2 divide-y divide-rose-200/60 dark:divide-rose-900/40">
        {lowMembers.slice(0, 4).map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() =>
              onOpenMember?.({
                id: m.id,
                name: m.name,
                phone: m.phone,
                packageName: m.packageName,
                totalSessions: m.totalSessions,
                usedSessions: m.usedSessions,
                packagePrice: m.packagePrice,
                paidAmount: m.paidAmount,
                defaultTrainerName: m.defaultTrainerName,
                expirationDate: m.expirationDate,
              })
            }
            className="w-full flex items-center justify-between py-2.5 text-start hover:opacity-85 transition-opacity cursor-pointer"
          >
            <div>
              <div
                className="font-semibold text-[15px]"
                style={{ color: 'var(--c-heading)' }}
              >
                {displayName(m.name, isFa)}
              </div>
              {m.outstandingBalance > 0 && (
                <div
                  className="text-[13px] font-medium"
                  style={{ color: 'var(--c-rubber)' }}
                >
                  {t.owner.dash.debt} {toman(m.outstandingBalance)}
                </div>
              )}
            </div>
            <span
              style={{ color: 'var(--c-rubber)' }}
              className="font-display text-[26px] leading-none tnum"
            >
              {num(m.remainingSessions)}
              <span className="font-sans text-[13px] ms-1">
                {t.owner.dash.session}
              </span>
            </span>
          </button>
        ))}

        {lowMembers.length === 0 && (
          <div
            className="py-4 text-center text-sm"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {t.owner.dash.noLowMembers}
          </div>
        )}
      </div>

      {lowMembers.length > 0 && (
        // B-13: سرویس پیامک هنوز متصل نیست؛ دکمه غیرفعال و با توضیح نمایش داده می‌شود
        <Btn
          v="danger"
          className="mt-3 w-full gap-2"
          disabled
          title={t.owner.dash.renewSmsUnavailable}
          aria-label={`${t.owner.dash.renewSms} — ${t.owner.dash.renewSmsUnavailable}`}
        >
          <MessageSquare size={16} />
          {t.owner.dash.renewSms}
        </Btn>
      )}
    </section>
  );

  // کارت خلاصه مالی
  const MoneySection = (
    <section
      style={{
        backgroundColor: 'var(--c-surface-1)',
        borderColor: 'var(--c-border)',
      }}
      className="p-5 rounded-2xl border shadow-xs"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
            {t.owner.dash.collectedToday}
          </div>
          <div
            style={{ color: 'var(--c-ink)' }}
            className="font-display text-[28px] tnum leading-tight mt-1"
          >
            {short(1500000)}
          </div>
        </div>
        <div>
          <div className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
            {t.owner.dash.receivables}
          </div>
          <div
            style={{ color: 'var(--c-rubber)' }}
            className="font-display text-[28px] tnum leading-tight mt-1"
          >
            {short(totalReceivables)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigate?.('fin')}
        style={{ color: 'var(--c-steel)' }}
        className="mt-3 text-[14px] font-semibold hover:underline cursor-pointer block"
      >
        {t.owner.dash.financeCta} ←
      </button>
    </section>
  );

  if (loading) {
    return (
      <div
        className="py-16 text-center text-sm"
        style={{ color: 'var(--c-text-muted)' }}
      >
        {t.owner.dash.loading}
      </div>
    );
  }

  // چیدمان دسکتاپ
  return (
    <div className="space-y-6">
      {isMobile ? (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
            {([
              [`+ ${t.owner.dash.quickMember}`, () => setCreatingMember(true)],
              [t.owner.dash.quickPayment, () => onNavigate?.('fin')],
              [t.owner.dash.quickCheckIn, () => onNavigate?.('sched')],
              [t.owner.dash.quickPayout, () => onNavigate?.('tr')],
            ] as const).map(([label, go]) => (
              <Btn key={label} v="soft" className="shrink-0 text-xs h-9" onClick={go}>
                {label}
              </Btn>
            ))}
          </div>
          <Capacity compact {...capacityProps} />
          {FloorSection}
          {LowSection}
          {LoadSection}
          {MoneySection}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            <Capacity {...capacityProps} />
            {FloorSection}
          </div>
          <div className="space-y-6 min-w-0">
            {LoadSection}
            {LowSection}
            {MoneySection}
          </div>
        </div>
      )}
      <NewMemberSheet
        open={creatingMember}
        mode="owner"
        onClose={() => setCreatingMember(false)}
        onDone={msg => {
          setCreatingMember(false);
          setNotice(msg);
        }}
      />
      <Toast message={toast} type="warning" onClose={() => setToast(null)} />
      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
