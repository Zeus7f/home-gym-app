import React, { useState, useEffect } from 'react';
import { Check, Plus } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Btn } from '../../../components/ui/Btn';
import { fa } from '../../../lib/format';
import { getTodaySessions, checkInSession } from '../../../api/sessions';
import { getMembers } from '../../../api/members';
import { DailySession, Member } from '../../../lib/domain/gymManagement';
import { mockStore } from '../../../lib/supabase/mockStore';

export interface TodayProps {
  onOpenSession: (session: DailySession) => void;
}

export function Today({ onOpenSession }: TodayProps) {
  const currentTrainerId = mockStore.currentUser?.entityId || 't-1';
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [currentTrainerId]);

  const activeSessions = sessions.filter(s => s.status !== 'cancelled');
  const liveSessions = sessions.filter(s => s.status === 'in_progress');
  const waitSessions = sessions.filter(s => s.status === 'scheduled');
  const doneSessions = sessions.filter(s => s.status === 'completed');

  const maxCapacity = 6;

  const getMemberRemaining = (memberId: string) => {
    const mem = members.find(m => m.id === memberId);
    return mem ? mem.remainingSessions : 12;
  };

  const handleCheckIn = async (sessionId: string) => {
    await checkInSession(sessionId);
    await loadData();
  };

  if (loading) {
    return (
      <div
        className="py-12 text-center text-sm"
        style={{ color: 'var(--c-text-muted)' }}
      >
        در حال بارگذاری سانس‌های امروز...
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
              ظرفیت امروز من
            </div>
            <div
              style={{ color: 'var(--c-ink)' }}
              className="font-display text-[42px] leading-none tnum mt-1"
            >
              {fa(activeSessions.length)}{' '}
              <span className="text-[20px]" style={{ color: 'var(--c-text-faint)' }}>
                / {fa(maxCapacity)}
              </span>
            </div>
          </div>

          <div
            className="text-left text-[13px] leading-6"
            style={{ color: 'var(--c-text-muted)' }}
          >
            <div>
              تکمیل:{' '}
              <b style={{ color: 'var(--c-deep)' }} className="tnum font-bold">
                {fa(doneSessions.length)}
              </b>
            </div>
            <div>
              در سالن:{' '}
              <b style={{ color: 'var(--c-deep)' }} className="tnum font-bold">
                {fa(liveSessions.length)}
              </b>
            </div>
            <div>
              در انتظار:{' '}
              <b style={{ color: 'var(--c-deep)' }} className="tnum font-bold">
                {fa(waitSessions.length)}
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
          <span>داخل سالن ({fa(liveSessions.length)})</span>
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
              className="w-full text-right rounded-2xl p-4 flex items-center gap-3.5 shadow-md active:scale-[0.99] transition-transform cursor-pointer"
            >
              <Avatar name={s.memberName} size={46} tone="brass" />
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-extrabold truncate">
                  {s.memberName}
                </div>
                <div className="text-[13px] opacity-80 mt-0.5 truncate">
                  ساعت {s.time} · مانده {fa(remaining)} جلسه
                </div>
              </div>
              <span
                style={{
                  backgroundColor: 'var(--c-brass)',
                  color: 'var(--c-deep)',
                }}
                className="h-10 px-3.5 rounded-xl text-[13px] font-extrabold grid place-items-center shrink-0 shadow-xs"
              >
                ادامه ثبت
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
            در حال حاضر ورزشکاری داخل سالن نیست.
          </div>
        )}
      </div>

      {/* ۳. بخش بعدی (نوبت‌های رزرو شده بعدی) */}
      <div>
        <div
          className="text-[14px] font-bold mb-2"
          style={{ color: 'var(--c-text-muted)' }}
        >
          نوبت‌های بعدی ({fa(waitSessions.length)})
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
                <Avatar name={s.memberName} size={40} tone="mist" />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-[15px]"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {s.memberName}
                  </div>
                  <div
                    className="text-[13px]"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    ساعت {s.time} · مانده {fa(remaining)} جلسه
                  </div>
                </div>
                <Btn
                  v="ghost"
                  className="h-9 px-3 text-xs"
                  onClick={() => handleCheckIn(s.id)}
                >
                  ثبت ورود
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
            جلسات تکمیل‌شده ({fa(doneSessions.length)})
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
                <span className="flex-1 font-semibold" style={{ color: 'var(--c-deep)' }}>
                  {s.memberName}
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
      <Btn v="soft" className="w-full h-12 text-[14px] font-bold gap-2">
        <Plus size={18} />
        <span>افزودن ورزشکار به امروز</span>
      </Btn>
    </div>
  );
}
