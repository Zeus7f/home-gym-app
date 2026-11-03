/**
 * src/components/ui/Form.tsx
 * فیلدهای فرم موبایل‌محور: ارتفاع ۴۴px، برچسب بالای فیلد، خطای کنار فیلد.
 * FormSheet: فرم در کشوی کناری (دسکتاپ) یا پایین‌برگ تمام‌عرض (موبایل) با دکمه‌های ثابت.
 */

import React, { useId, useState } from 'react';
import { CalendarDays, Eye, EyeOff } from 'lucide-react';
import { PersianCalendar } from '../calendar/PersianCalendar';
import { Sheet } from '../../features/owner/components/Sheet';
import { useI18n } from '../LanguageProvider';
import { useIsMobile } from '../../lib/useMediaQuery';
import { Btn } from './Btn';
import { cn } from '../../lib/utils';
import { groupAmount, num, toLatinDigits } from '../../lib/format';

const control =
  'w-full h-11 rounded-xl border px-3.5 text-[15px] outline-none transition-shadow bg-[var(--c-surface-1)] text-[var(--c-text)] border-[var(--c-border-strong)] placeholder:text-[var(--c-text-faint)] focus:ring-2 focus:ring-[var(--c-steel)]/40 focus:border-[var(--c-steel)] disabled:opacity-60';

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const { t } = useI18n();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[13px] font-bold" style={{ color: 'var(--c-text)' }}>
        {label}
        {optional && (
          <span className="font-medium ms-1" style={{ color: 'var(--c-text-faint)' }}>
            ({t.accounts.optional})
          </span>
        )}
      </label>
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-err`} className="text-[12.5px] font-semibold" style={{ color: 'var(--c-rubber)' }}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12.5px]" style={{ color: 'var(--c-text-muted)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const TextInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} {...props} className={cn(control, className)} />
));
TextInput.displayName = 'TextInput';

/** موبایل: صفحه‌کلید عددی، چپ‌به‌راست، بدون تصحیح خودکار */
export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="tel"
    inputMode="tel"
    autoComplete="tel"
    dir="ltr"
    {...props}
    className={cn(control, 'text-start tracking-wide [direction:ltr]', className)}
  />
));
PhoneInput.displayName = 'PhoneInput';

/**
 * فیلد رمز با کلید نمایش/پنهان.
 *
 * فیلد همیشه چپ‌به‌راست است، پس جای دکمه و فضای خالی کنارش با ضلع فیزیکی
 * (right) تعیین می‌شود؛ با `end-*` در صفحهٔ راست‌به‌چپ دکمه روی کاراکترهای رمز می‌افتاد.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  const [show, setShow] = useState(false);
  const { t } = useI18n();
  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        dir="ltr"
        {...props}
        className={cn(control, 'pr-12 [direction:ltr] text-start', className)}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 right-0 w-11 grid place-items-center cursor-pointer"
        style={{ color: 'var(--c-text-muted)' }}
        aria-label={show ? t.auth.hidePassword : t.auth.showPassword}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

/**
 * فیلد مبلغ به تومان: هنگام تایپ سه‌رقمی جدا می‌شود و واحد داخل فیلد دیده می‌شود.
 * مقدار همان متن جداشده است؛ هنگام ثبت با `parseAmount` به عدد تبدیل می‌شود.
 */
export const MoneyInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'value' | 'onChange' | 'type'> & { value: string; onChange: (grouped: string) => void }
>(({ className, value, onChange, ...props }, ref) => {
  const { t } = useI18n();
  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        dir="ltr"
        autoComplete="off"
        value={value}
        onChange={e => onChange(groupAmount(e.target.value))}
        {...props}
        className={cn(control, 'pr-16 [direction:ltr] text-start tnum', className)}
      />
      <span
        className="absolute inset-y-0 right-3 flex items-center text-[12.5px] font-semibold pointer-events-none"
        style={{ color: 'var(--c-text-faint)' }}
      >
        {t.units.toman}
      </span>
    </div>
  );
});
MoneyInput.displayName = 'MoneyInput';

export const SelectInput = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} {...props} className={cn(control, 'pe-8', className)} />
);
SelectInput.displayName = 'SelectInput';

/** ساعت‌های انتخابی بازهٔ کاری — از ۰۶:۰۰ تا ۲۳:۰۰، نیم‌ساعت به نیم‌ساعت */
export const HOUR_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

/** سانس‌های نوبت‌دهی — سرِ هر ساعت، از ۰۶:۰۰ تا ۲۳:۰۰ */
export const SLOT_HOURS = Array.from({ length: 18 }, (_, i) => `${String(6 + i).padStart(2, '0')}:00`);

/** «۰۹:۰۰ - ۱۵:۰۰» → ['09:00', '15:00'] با مقدار پیش‌فرض برای ورودی ناقص */
export function parseTimeRange(raw: string): [string, string] {
  const [from, to] = toLatinDigits(raw).split('-').map(s => s.trim());
  const valid = (v: string) => (HOUR_OPTIONS.includes(v) ? v : '');
  return [valid(from) || '09:00', valid(to) || '15:00'];
}

export const formatTimeRange = (from: string, to: string): string => `${from} - ${to}`;

/**
 * بازهٔ ساعت کاری: دو فهرست کشویی که همان قالب متنی «HH:MM - HH:MM» را می‌سازند،
 * تا بخش‌های دیگر برنامه که این رشته را می‌خوانند بدون تغییر کار کنند.
 */
export function TimeRangeInput({
  id,
  value,
  onChange,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (range: string) => void;
  describedBy?: string;
}) {
  const { t } = useI18n();
  const [from, to] = parseTimeRange(value);
  return (
    <div className="flex items-center gap-2" dir="ltr">
      <SelectInput
        id={id}
        aria-describedby={describedBy}
        aria-label={t.accounts.workingHoursFrom}
        value={from}
        onChange={e => onChange(formatTimeRange(e.target.value, to))}
        className="flex-1 text-center tnum"
      >
        {HOUR_OPTIONS.map(h => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </SelectInput>
      <span aria-hidden className="text-[13px] font-bold" style={{ color: 'var(--c-text-faint)' }}>
        –
      </span>
      <SelectInput
        aria-label={t.accounts.workingHoursTo}
        value={to}
        onChange={e => onChange(formatTimeRange(from, e.target.value))}
        className="flex-1 text-center tnum"
      >
        {HOUR_OPTIONS.map(h => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </SelectInput>
    </div>
  );
}

/** ارتفاع تقریبی تقویم؛ اگر زیر فیلد جا نشود، رو به بالا باز می‌شود. */
const CALENDAR_HEIGHT = 340;

/** فیلد تاریخ جلالی با تقویم بازشونده — تایپ دستی لازم نیست. */
export function JalaliDateInput({
  id,
  value,
  onChange,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (date: string) => void;
  describedBy?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const canonical = toLatinDigits(value);

  const toggle = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setDropUp(window.innerHeight - rect.bottom < CALENDAR_HEIGHT && rect.top > CALENDAR_HEIGHT);
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-describedby={describedBy}
        aria-expanded={open}
        onClick={toggle}
        className={cn(control, 'flex items-center justify-between gap-2 text-start cursor-pointer')}
      >
        <span className="tnum" dir="ltr">
          {localizedDate(canonical)}
        </span>
        <CalendarDays size={17} style={{ color: 'var(--c-text-muted)' }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={cn(
              'absolute z-50 w-[300px] max-w-[85vw] rounded-2xl border p-3 shadow-lg',
              dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            )}
            style={{ backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border-strong)' }}
            role="dialog"
            aria-label={t.accounts.expirationDate}
          >
            <PersianCalendar
              selectedDate={canonical}
              onSelectDate={next => {
                onChange(next);
                setOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

/** «۱۴۰۵/۰۹/۱۲» — ارقام زبان فعال، با صفر ابتدای ماه و روز. */
function localizedDate(canonical: string): string {
  const [year = '', month = '', day = ''] = canonical.split('/');
  const digits = (part: string, width: number) => num(Number(part)).replace(/[,٬]/g, '').padStart(width, num(0));
  return `${digits(year, 4)}/${digits(month, 2)}/${digits(day, 2)}`;
}

/** شبکهٔ فیلدها: یک ستون در موبایل، دو ستون از sm */
export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[13px] font-extrabold uppercase tracking-wide" style={{ color: 'var(--c-steel)' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border px-3.5 py-3 text-[13.5px] font-semibold"
      style={{ backgroundColor: 'var(--c-status-noshow-bg)', borderColor: 'var(--c-rubber)', color: 'var(--c-rubber)' }}
    >
      {message}
    </div>
  );
}

export function FormSheet({
  open,
  onClose,
  title,
  description,
  submitLabel,
  busy,
  onSubmit,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  submitLabel: string;
  busy?: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const { t } = useI18n();
  return (
    <Sheet open={open} onClose={onClose} isMobile={isMobile} className={isMobile ? '!px-4 !pb-4' : '!w-[480px]'}>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!busy) onSubmit();
        }}
        className="flex flex-col min-h-full"
        noValidate
      >
        <div className="mb-5">
          <h2 className="text-[19px] font-extrabold" style={{ color: 'var(--c-heading)' }}>
            {title}
          </h2>
          {description && (
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
              {description}
            </p>
          )}
        </div>
        <div className="flex-1 space-y-5">{children}</div>
        <div
          className="sticky bottom-0 -mx-4 sm:-mx-6 mt-6 px-4 sm:px-6 pt-3 pb-1 flex gap-2.5 border-t"
          style={{ backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border)' }}
        >
          <Btn type="submit" v="primary" className="flex-1 h-11" disabled={busy}>
            {busy ? t.actions.loading : submitLabel}
          </Btn>
          <Btn type="button" v="ghost" className="h-11" onClick={onClose}>
            {t.accounts.cancel}
          </Btn>
        </div>
      </form>
    </Sheet>
  );
}
