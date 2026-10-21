import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Minus, Plus } from 'lucide-react';
import { Sheet } from './Sheet';
import { Avatar } from '../../../components/ui/Avatar';
import { Meter } from '../../../components/ui/Meter';
import { Btn } from '../../../components/ui/Btn';
import { useI18n } from '../../../components/LanguageProvider';
import { num, toman } from '../../../lib/format';
import { Seg } from '../../../components/ui/Seg';
import { Toast } from '../../../components/ui/Toast';
import { displayName, localizedLabel } from '../../../lib/displayName';
import { exerciseName } from '../../../lib/exerciseLabels';
import { formatJalaliLocalized, toCanonicalJalali } from '../../../lib/date/jalali';
import {
  getMember,
  getMemberSessions,
  recordMemberPayment,
  adjustMemberSessions,
  changeMemberTrainer,
} from '../../../api/members';
import { getTrainers } from '../../../api/trainers';
import { subscribeToStore } from '../../../api/auth';
import type { DailySession, Member, Trainer } from '../../../lib/domain/gymManagement';
import { AccountPanel, PackageSheet } from '../../accounts/AccountForms';

type SheetAction = 'payment' | 'adjust' | 'trainer' | null;
type PaymentMethod = 'card' | 'cash' | 'transfer';

export interface MemberData {
  id: string;
  name?: string;
  // برای سازگاری با پروتوتایپ
  m?: string;
  phone?: string;
  ph?: string;
  packageName?: string;
  pkg?: string;
  totalSessions?: number;
  total?: number;
  usedSessions?: number;
  used?: number;
  packagePrice?: number;
  price?: number;
  paidAmount?: number;
  paid?: number;
  trainerName?: string;
  defaultTrainerName?: string;
  tr?: string;
  expirationDate?: string;
  exp?: string;
}

export interface MemberSheetProps {
  member: MemberData | null;
  onClose: () => void;
  isMobile?: boolean;
}

export function MemberSheet({
  member,
  onClose,
  isMobile = false,
}: MemberSheetProps) {
  const { t, isFa } = useI18n();
  const ms = t.owner.memberSheet;

  // B-13: داده‌های زندهٔ عضو — پس از هر عملیات (پرداخت، اصلاح، تغییر مربی) به‌روز می‌شود
  const [live, setLive] = useState<Member | undefined>(undefined);
  const [recent, setRecent] = useState<DailySession[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [action, setAction] = useState<SheetAction>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState('');
  const [newTrainerId, setNewTrainerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const [packageFor, setPackageFor] = useState<Member | null>(null);

  const memberId = member?.id;

  useEffect(() => {
    if (!memberId) return;
    setAction(null);
    const load = async () => {
      const [m, sessions, trs] = await Promise.all([
        getMember(memberId),
        getMemberSessions(memberId),
        getTrainers(),
      ]);
      setLive(m);
      setTrainers(trs);
      setRecent(
        sessions
          .filter(s => s.status === 'completed')
          .sort((a, b) =>
            toCanonicalJalali(b.date).localeCompare(toCanonicalJalali(a.date)) ||
            b.time.localeCompare(a.time)
          )
          .slice(0, 3)
      );
    };
    load();
    return subscribeToStore(load);
  }, [memberId]);

  if (!member) return null;

  const rawName = live?.name || member.name || member.m || ms.athlete;
  const name = displayName(rawName, isFa);
  const phone = live?.phone || member.phone || member.ph || '—';
  const pkg = localizedLabel(live?.packageName || member.packageName || member.pkg || ms.package, isFa);
  const total = live?.totalSessions ?? member.totalSessions ?? member.total ?? 12;
  const used = live?.usedSessions ?? member.usedSessions ?? member.used ?? 0;
  const remaining = Math.max(0, total - used);
  const price = live?.packagePrice ?? member.packagePrice ?? member.price ?? 0;
  const paid = live?.paidAmount ?? member.paidAmount ?? member.paid ?? 0;
  const debt = Math.max(0, price - paid);
  const rawTrainer =
    live?.defaultTrainerName ||
    member.trainerName ||
    member.defaultTrainerName ||
    member.tr ||
    ms.unknown;
  const trainer = displayName(rawTrainer, isFa);
  const rawExp = live?.expirationDate || member.expirationDate || member.exp || '';
  const exp = rawExp ? formatJalaliLocalized(rawExp, isFa) : '—';

  const openAction = (next: SheetAction) => {
    setAction(prev => (prev === next ? null : next));
    setAmount(debt > 0 ? String(debt) : '');
    setMethod('card');
    setDelta(1);
    setReason('');
    setNewTrainerId(live?.defaultTrainerId ?? '');
  };

  const run = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    if (!memberId || busy) return;
    setBusy(true);
    try {
      const res = await fn();
      setToast({ message: res.message, ok: res.success });
      if (res.success) setAction(null);
    } finally {
      setBusy(false);
    }
  };

  const submitPayment = () =>
    run(() =>
      recordMemberPayment(memberId!, Number(amount.replace(/[^\d]/g, '')), method, ms.paymentNote)
    );
  const submitAdjust = () =>
    run(() => adjustMemberSessions(memberId!, delta, reason.trim() || ms.reasonDefault));
  const submitTrainer = () => run(() => changeMemberTrainer(memberId!, newTrainerId));

  const fieldStyle = {
    backgroundColor: 'var(--c-surface-2)',
    borderColor: 'var(--c-border)',
    color: 'var(--c-text)',
  } as const;

  return (
    <Sheet open={!!member} onClose={onClose} isMobile={isMobile}>
      <div>
        {/* هدر جزئیات */}
        <div className="flex items-center gap-3">
          <Avatar name={name} size={52} tone="ink" />
          <div className="flex-1 min-w-0">
            <div
              className="text-[19px] font-extrabold truncate"
              style={{ color: 'var(--c-heading)' }}
            >
              {name}
            </div>
            <div
              className="text-[14px] tnum"
              style={{ color: 'var(--c-text-muted)' }}
            >
              {phone}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 grid place-items-center transition-colors"
            aria-label={ms.close}
          >
            <X size={20} />
          </button>
        </div>

        {/* ورزشکار ساختهٔ مربی: تا تعیین بسته رزرو ندارد */}
        {live?.packagePending && (
          <div
            className="mt-4 rounded-2xl border p-3.5 flex flex-wrap items-center gap-3"
            style={{ backgroundColor: 'var(--c-status-live-bg)', borderColor: 'var(--c-brass)', color: 'var(--c-status-live-fg)' }}
          >
            <p className="text-[13.5px] font-semibold flex-1 min-w-[12rem]">{t.accounts.packagePendingHint}</p>
            <Btn v="primary" className="h-10" onClick={() => setPackageFor(live)}>
              {t.accounts.setPackage}
            </Btn>
          </div>
        )}

        {/* کارت مانده جلسات */}
        <div
          style={{ backgroundColor: 'var(--c-surface-2)' }}
          className="mt-5 rounded-2xl p-4"
        >
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
                {pkg}
              </div>
              <div className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
                {ms.expires}: {exp}
              </div>
            </div>
            <div
              style={{
                color: remaining <= 2 ? 'var(--c-rubber)' : 'var(--c-ink)',
              }}
              className="font-display text-[44px] leading-none tnum"
            >
              {num(remaining)}
              <span className="text-[18px]" style={{ color: 'var(--c-text-faint)' }}>
                {' '}/ {num(total)}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <Meter total={total} used={used} h={12} />
          </div>
        </div>

        {/* اطلاعات مربی و وضعیت مالی */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div
            style={{ borderColor: 'var(--c-border)' }}
            className="rounded-xl border p-3"
          >
            <div className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
              {ms.defaultTrainer}
            </div>
            <div className="font-bold mt-0.5" style={{ color: 'var(--c-heading)' }}>
              {trainer}
            </div>
          </div>

          <div
            style={{
              backgroundColor: debt > 0 ? 'var(--c-status-noshow-bg)' : 'transparent',
              borderColor: debt > 0 ? 'var(--c-rubber)' : 'var(--c-border)',
            }}
            className="rounded-xl border p-3"
          >
            <div className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
              {ms.debt}
            </div>
            <div
              style={{
                color: debt > 0 ? 'var(--c-status-noshow-fg)' : 'var(--c-avail-fg)',
              }}
              className="font-bold tnum mt-0.5"
            >
              {debt > 0 ? toman(debt) : t.owner.memberSheet.settled}
            </div>
          </div>
        </div>

        {/* دکمه‌های عملیات */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Btn v="primary" onClick={() => openAction('payment')} aria-expanded={action === 'payment'}>
            {ms.recordPayment}
          </Btn>
          {/* تمدید بسته هنوز workflow ندارد؛ به‌جای دکمهٔ بی‌اثر، غیرفعال و با توضیح نمایش داده می‌شود */}
          <Btn v="brass" disabled title={ms.comingSoon} aria-label={`${ms.extendPackage} — ${ms.comingSoon}`}>
            {ms.extendPackage}
          </Btn>
          <Btn v="ghost" onClick={() => openAction('trainer')} aria-expanded={action === 'trainer'}>
            {ms.changeTrainer}
          </Btn>
          <Btn v="ghost" onClick={() => openAction('adjust')} aria-expanded={action === 'adjust'}>
            {ms.adjustBalance}
          </Btn>
        </div>

        {action === 'payment' && (
          <form
            className="mt-3 rounded-xl border p-3 space-y-3"
            style={{ borderColor: 'var(--c-border)' }}
            onSubmit={e => {
              e.preventDefault();
              submitPayment();
            }}
          >
            <label className="block text-[13px] font-bold" style={{ color: 'var(--c-text-muted)' }}>
              {ms.amount}
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl border text-[15px] font-bold tnum"
                style={fieldStyle}
                autoFocus
              />
            </label>
            <div>
              <div className="text-[13px] font-bold mb-1" style={{ color: 'var(--c-text-muted)' }}>
                {ms.method}
              </div>
              <Seg<PaymentMethod>
                value={method}
                onChange={setMethod}
                ariaLabel={ms.method}
                full
                items={[
                  ['card', ms.methods.card],
                  ['cash', ms.methods.cash],
                  ['transfer', ms.methods.transfer],
                ]}
              />
            </div>
            <div className="flex gap-2">
              <Btn v="primary" type="submit" disabled={busy}>{ms.submit}</Btn>
              <Btn v="ghost" type="button" onClick={() => setAction(null)}>{ms.cancel}</Btn>
            </div>
          </form>
        )}

        {action === 'adjust' && (
          <form
            className="mt-3 rounded-xl border p-3 space-y-3"
            style={{ borderColor: 'var(--c-border)' }}
            onSubmit={e => {
              e.preventDefault();
              submitAdjust();
            }}
          >
            <div>
              <div className="text-[13px] font-bold mb-1" style={{ color: 'var(--c-text-muted)' }}>
                {ms.sessionsDelta}
              </div>
              <div className="flex items-center gap-2">
                <Btn v="soft" type="button" className="w-9 h-9 p-0" onClick={() => setDelta(d => d - 1)} aria-label="−1">
                  <Minus size={15} />
                </Btn>
                <span className="w-14 text-center font-bold text-[18px] tnum" style={{ color: 'var(--c-heading)' }} aria-live="polite">
                  {delta > 0 ? `+${num(delta)}` : num(delta)}
                </span>
                <Btn v="soft" type="button" className="w-9 h-9 p-0" onClick={() => setDelta(d => d + 1)} aria-label="+1">
                  <Plus size={15} />
                </Btn>
              </div>
            </div>
            <label className="block text-[13px] font-bold" style={{ color: 'var(--c-text-muted)' }}>
              {ms.reason}
              <input
                type="text"
                value={reason}
                placeholder={ms.reasonDefault}
                onChange={e => setReason(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl border text-[14px]"
                style={fieldStyle}
              />
            </label>
            <div className="flex gap-2">
              <Btn v="primary" type="submit" disabled={busy || delta === 0}>{ms.submit}</Btn>
              <Btn v="ghost" type="button" onClick={() => setAction(null)}>{ms.cancel}</Btn>
            </div>
          </form>
        )}

        {action === 'trainer' && (
          <form
            className="mt-3 rounded-xl border p-3 space-y-3"
            style={{ borderColor: 'var(--c-border)' }}
            onSubmit={e => {
              e.preventDefault();
              submitTrainer();
            }}
          >
            <label className="block text-[13px] font-bold" style={{ color: 'var(--c-text-muted)' }}>
              {ms.newTrainer}
              <select
                value={newTrainerId}
                onChange={e => setNewTrainerId(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl border text-[14px] font-bold"
                style={fieldStyle}
              >
                {trainers
                  .filter(tr => tr.status === 'active')
                  .map(tr => (
                    <option key={tr.id} value={tr.id}>
                      {displayName(tr.name, isFa)}
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex gap-2">
              <Btn
                v="primary"
                type="submit"
                disabled={busy || !newTrainerId || newTrainerId === live?.defaultTrainerId}
              >
                {ms.submit}
              </Btn>
              <Btn v="ghost" type="button" onClick={() => setAction(null)}>{ms.cancel}</Btn>
            </div>
          </form>
        )}

        {/* حساب ورود ورزشکار */}
        {memberId && (
          <div className="mt-5">
            <AccountPanel role="member" entityId={memberId} />
          </div>
        )}

        {/* آخرین جلسات */}
        <div className="mt-6">
          <div className="text-[15px] font-bold mb-2" style={{ color: 'var(--c-heading)' }}>
            {ms.recentSessions}
          </div>
          {recent.length === 0 && (
            <div className="py-3 text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
              {ms.noRecentSessions}
            </div>
          )}
          {recent.map(session => (
            <div
              key={session.id}
              style={{ borderColor: 'var(--c-surface-2)' }}
              className="flex gap-3 py-3 border-b last:border-0"
            >
              <span className="w-24 shrink-0 text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
                {formatJalaliLocalized(session.date, isFa)}
              </span>
              <span className="text-[15px] flex-1 truncate" style={{ color: 'var(--c-text)' }}>
                {session.exercises.length > 0
                  ? session.exercises
                      .map(e => exerciseName(e.exerciseId, e.name, isFa))
                      .join(isFa ? '، ' : ', ')
                  : ms.noExercises}
              </span>
            </div>
          ))}
        </div>
      </div>
      <PackageSheet
        member={packageFor}
        onClose={() => setPackageFor(null)}
        onDone={msg => {
          setPackageFor(null);
          setToast({ message: msg, ok: true });
        }}
      />
      <Toast
        message={toast?.message ?? null}
        type={toast?.ok === false ? 'warning' : 'success'}
        onClose={() => setToast(null)}
      />
    </Sheet>
  );
}
