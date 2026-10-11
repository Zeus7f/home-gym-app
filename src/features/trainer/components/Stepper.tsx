import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { fa } from '../../../lib/format';
import { cn } from '../../../lib/utils';

export interface StepperProps {
  /** مقدار عددی جاری */
  v: number;
  /** واحد (مثلاً kg یا تکرار) */
  u: string;
  /** میزان گام تغییر در هر کلیک (۲.۵ برای وزن، ۱ برای تکرار) */
  step?: number;
  /** کالبک تغییر مقدار */
  on: (val: number) => void;
  /** حالت پس‌زمینه تیره هنگام فعال بودن ست */
  dark?: boolean;
  className?: string;
}

/**
 * Stepper — کنترلر افزایش/کاهش مقادیر وزن و تکرار در ثبت تمرین
 *
 * G3: استایل‌دهی بر مبنای توکن‌های طراحی
 * G5: دارای aria-label برای خوانایی توسط ابزارهای دسترسی‌پذیری
 */
export function Stepper({
  v,
  u,
  step = 1,
  on,
  dark = false,
  className,
}: StepperProps) {
  const handleDec = () => {
    on(Math.max(0, Number((v - step).toFixed(1))));
  };

  const handleInc = () => {
    on(Number((v + step).toFixed(1)));
  };

  return (
    <div className={cn('flex items-center gap-1 select-none', className)}>
      <button
        type="button"
        onClick={handleDec}
        aria-label={`کاهش ${u}`}
        style={{
          backgroundColor: dark ? 'rgba(255, 255, 255, 0.15)' : 'var(--c-surface-1)',
          color: dark ? '#ffffff' : 'var(--c-ink)',
          borderColor: dark ? 'transparent' : 'var(--c-border)',
        }}
        className="h-10 w-9 rounded-lg border grid place-items-center transition-all active:scale-95 cursor-pointer hover:opacity-90"
      >
        <Minus size={15} />
      </button>

      <div className="w-[50px] text-center leading-tight">
        <div
          style={{ color: dark ? '#ffffff' : 'var(--c-deep)' }}
          className="font-bold text-[16px] tnum"
        >
          {fa(v)}
        </div>
        <div
          style={{ color: dark ? 'rgba(255,255,255,0.7)' : 'var(--c-text-muted)' }}
          className="text-[12px] font-medium"
        >
          {u}
        </div>
      </div>

      <button
        type="button"
        onClick={handleInc}
        aria-label={`افزایش ${u}`}
        style={{
          backgroundColor: dark ? 'rgba(255, 255, 255, 0.15)' : 'var(--c-surface-1)',
          color: dark ? '#ffffff' : 'var(--c-ink)',
          borderColor: dark ? 'transparent' : 'var(--c-border)',
        }}
        className="h-10 w-9 rounded-lg border grid place-items-center transition-all active:scale-95 cursor-pointer hover:opacity-90"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
