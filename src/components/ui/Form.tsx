/**
 * src/components/ui/Form.tsx
 * فیلدهای فرم موبایل‌محور: ارتفاع ۴۴px، برچسب بالای فیلد، خطای کنار فیلد.
 * FormSheet: فرم در کشوی کناری (دسکتاپ) یا پایین‌برگ تمام‌عرض (موبایل) با دکمه‌های ثابت.
 */

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Sheet } from '../../features/owner/components/Sheet';
import { useI18n } from '../LanguageProvider';
import { useIsMobile } from '../../lib/useMediaQuery';
import { Btn } from './Btn';
import { cn } from '../../lib/utils';

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
        className={cn(control, 'pe-12 [direction:ltr] text-start', className)}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 end-0 w-11 grid place-items-center cursor-pointer"
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

export const SelectInput = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} {...props} className={cn(control, 'pe-8', className)} />
);
SelectInput.displayName = 'SelectInput';

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
