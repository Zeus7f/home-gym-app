import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import { Sheet } from './Sheet';
import { Avatar } from '../../../components/ui/Avatar';
import { Meter } from '../../../components/ui/Meter';
import { Btn } from '../../../components/ui/Btn';
import { fa, toman } from '../../../lib/format';

export interface MemberData {
  id: string;
  name?: string;
  m?: string; // برای سازگاری با پروتوتایپ
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
  if (!member) return null;

  const name = member.name || member.m || 'ورزشکار';
  const phone = member.phone || member.ph || '—';
  const pkg = member.packageName || member.pkg || 'بسته جلسات';
  const total = member.totalSessions ?? member.total ?? 12;
  const used = member.usedSessions ?? member.used ?? 0;
  const remaining = Math.max(0, total - used);
  const price = member.packagePrice ?? member.price ?? 0;
  const paid = member.paidAmount ?? member.paid ?? 0;
  const debt = Math.max(0, price - paid);
  const trainer = member.trainerName || member.defaultTrainerName || member.tr || 'نامشخص';
  const exp = member.expirationDate || member.exp || '—';

  return (
    <Sheet open={!!member} onClose={onClose} isMobile={isMobile}>
      <div>
        {/* هدر جزئیات */}
        <div className="flex items-center gap-3">
          <Avatar name={name} size={52} tone="ink" />
          <div className="flex-1 min-w-0">
            <div
              className="text-[19px] font-extrabold truncate"
              style={{ color: 'var(--c-deep)' }}
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
            aria-label="بستن پنجره"
          >
            <X size={20} />
          </button>
        </div>

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
                انقضا: {exp}
              </div>
            </div>
            <div
              style={{
                color: remaining <= 2 ? 'var(--c-rubber)' : 'var(--c-ink)',
              }}
              className="font-display text-[44px] leading-none tnum"
            >
              {fa(remaining)}
              <span className="text-[18px]" style={{ color: 'var(--c-text-faint)' }}>
                {' '}/ {fa(total)}
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
              مربی پیش‌فرض
            </div>
            <div className="font-bold mt-0.5" style={{ color: 'var(--c-deep)' }}>
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
              بدهی
            </div>
            <div
              style={{
                color: debt > 0 ? 'var(--c-status-noshow-fg)' : 'var(--c-avail-fg)',
              }}
              className="font-bold tnum mt-0.5"
            >
              {debt > 0 ? toman(debt) : 'تسویه'}
            </div>
          </div>
        </div>

        {/* دکمه‌های عملیات */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Btn v="primary">ثبت دریافت وجه</Btn>
          <Btn v="brass">تمدید بسته</Btn>
          <Btn v="ghost">تغییر مربی دائم</Btn>
          <Btn v="ghost">اصلاح مانده</Btn>
        </div>

        {/* آخرین جلسات */}
        <div className="mt-6">
          <div className="text-[15px] font-bold mb-2" style={{ color: 'var(--c-deep)' }}>
            آخرین جلسات ثبت‌شده
          </div>
          {[
            ['۱۲ مهر', 'پرس سینه، اسکات، زیربغل'],
            ['۱۰ مهر', 'ددلیفت، پرس سرشانه'],
            ['۷ مهر', 'اسکات، لانج، پلانک'],
          ].map(([dt, ex]) => (
            <div
              key={dt}
              style={{ borderColor: 'var(--c-surface-2)' }}
              className="flex gap-3 py-3 border-b last:border-0"
            >
              <span className="w-14 text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
                {dt}
              </span>
              <span className="text-[15px] flex-1 truncate" style={{ color: 'var(--c-text)' }}>
                {ex}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
