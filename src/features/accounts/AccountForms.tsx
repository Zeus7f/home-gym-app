/**
 * src/features/accounts/AccountForms.tsx
 * فرم‌های ساخت حساب بر اساس نقش و پنل حساب ورود.
 *
 *   NewTrainerSheet   مدیر → مربی با حساب ورود
 *   NewMemberSheet    مدیر → ورزشکار با بسته؛ مربی → ورزشکار با پروفایل حداقلی
 *   PackageSheet      مدیر → تعیین بستهٔ ورزشکارِ منتظر بسته
 *   AccountPanel      مدیر → وضعیت حساب، تغییر رمز، فعال/غیرفعال
 */

import React, { useEffect, useState } from 'react';
import { KeyRound, Power, ShieldCheck, ShieldOff } from 'lucide-react';
import { useI18n } from '../../components/LanguageProvider';
import { Btn } from '../../components/ui/Btn';
import { StatusPill } from '../../components/ui/Page';
import {
  Field,
  FieldGrid,
  FormError,
  FormSection,
  FormSheet,
  PasswordInput,
  PhoneInput,
  SelectInput,
  TextInput,
} from '../../components/ui/Form';
import {
  assignMemberPackage,
  createMember,
  createMemberAsTrainer,
  createTrainer,
  getAccountFor,
  resetAccountPassword,
  setAccountActive,
} from '../../api/accounts';
import { getTrainers } from '../../api/trainers';
import { subscribeToStore } from '../../api/auth';
import { displayName } from '../../lib/displayName';
import { getTodayJalaliString, gregorianToJalali, formatJalali, toLatinDigitsDate } from './dates';
import type { Member, Trainer, UserAccount } from '../../lib/domain/gymManagement';

type Done = (message: string) => void;

/** «۱۲٬۵۰۰٬۰۰۰» یا «12,500,000» → 12500000 */
function parseAmount(raw: string): number {
  const latin = raw.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const n = Number(latin.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** تاریخ جلالی چند روز بعد از امروز */
function jalaliInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatJalali(gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()));
}

function useResetOnOpen<T>(open: boolean, initial: () => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    if (open) setState(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return [state, setState];
}

// ── مربی جدید ────────────────────────────────────────────────────────────────

export function NewTrainerSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: Done }) {
  const { t } = useI18n();
  const a = t.accounts;
  const [form, setForm] = useResetOnOpen(open, () => ({
    name: '',
    phone: '',
    specialty: '',
    workingHours: '09:00 - 15:00',
    dailyCapacity: '6',
    sessionRate: '150000',
    password: '',
  }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setError(null), [open]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await createTrainer(
      {
        name: form.name,
        phone: form.phone,
        specialty: form.specialty.trim(),
        status: 'active',
        workingDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        workingHours: form.workingHours.trim(),
        dailyCapacity: Math.max(1, Math.round(parseAmount(form.dailyCapacity)) || 6),
        sessionRate: parseAmount(form.sessionRate),
      },
      form.password
    );
    setBusy(false);
    if (res.success) onDone(res.message);
    else setError(res.message);
  };

  return (
    <FormSheet open={open} onClose={onClose} title={a.newTrainer} submitLabel={a.create} busy={busy} onSubmit={submit}>
      <FormError message={error} />
      <FieldGrid>
        <Field label={a.fullName} className="sm:col-span-2">
          {id => <TextInput id={id} value={form.name} onChange={set('name')} autoComplete="name" autoFocus />}
        </Field>
        <Field label={a.phone}>
          {id => <PhoneInput id={id} value={form.phone} onChange={set('phone')} placeholder={t.auth.phonePlaceholder} />}
        </Field>
        <Field label={a.specialty} optional>
          {id => <TextInput id={id} value={form.specialty} onChange={set('specialty')} />}
        </Field>
        <Field label={a.workingHours}>
          {id => <TextInput id={id} value={form.workingHours} onChange={set('workingHours')} dir="ltr" />}
        </Field>
        <Field label={a.dailyCapacity}>
          {id => <TextInput id={id} value={form.dailyCapacity} onChange={set('dailyCapacity')} inputMode="numeric" dir="ltr" />}
        </Field>
        <Field label={a.sessionRate} className="sm:col-span-2">
          {id => <TextInput id={id} value={form.sessionRate} onChange={set('sessionRate')} inputMode="numeric" dir="ltr" />}
        </Field>
        <Field label={a.password} hint={a.passwordHint} className="sm:col-span-2">
          {(id, d) => <PasswordInput id={id} aria-describedby={d} value={form.password} onChange={set('password')} autoComplete="new-password" />}
        </Field>
      </FieldGrid>
    </FormSheet>
  );
}

// ── ورزشکار جدید ─────────────────────────────────────────────────────────────

export function NewMemberSheet({
  open,
  onClose,
  onDone,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onDone: Done;
  /** owner: با بسته و مربی؛ trainer: فقط پروفایل، وصل به خود مربی */
  mode: 'owner' | 'trainer';
}) {
  const { t, isFa } = useI18n();
  const a = t.accounts;
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [form, setForm] = useResetOnOpen(open, () => ({
    name: '',
    phone: '',
    password: '',
    trainerId: '',
    packageName: '',
    totalSessions: '12',
    packagePrice: '',
    paidAmount: '',
    expirationDate: jalaliInDays(60),
  }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === 'owner') {
      getTrainers().then(list => {
        const active = list.filter(tr => tr.status === 'active');
        setTrainers(active);
        setForm(f => ({ ...f, trainerId: f.trainerId || active[0]?.id || '' }));
      });
    }
  }, [open, mode, setForm]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    let res: { success: boolean; message: string };
    if (mode === 'trainer') {
      res = await createMemberAsTrainer({ name: form.name, phone: form.phone, password: form.password });
    } else {
      const trainer = trainers.find(tr => tr.id === form.trainerId);
      if (!form.packageName.trim() || parseAmount(form.totalSessions) < 1) {
        setBusy(false);
        setError(t.storeMessages['member.invalidPackage']);
        return;
      }
      res = await createMember(
        {
          name: form.name,
          phone: form.phone,
          defaultTrainerId: trainer?.id ?? '',
          defaultTrainerName: trainer?.name ?? '',
          packageName: form.packageName.trim(),
          totalSessions: Math.round(parseAmount(form.totalSessions)),
          packagePrice: parseAmount(form.packagePrice),
          paidAmount: parseAmount(form.paidAmount),
          startDate: getTodayJalaliString(),
          expirationDate: toLatinDigitsDate(form.expirationDate),
          status: 'active',
        },
        form.password
      );
    }
    setBusy(false);
    if (res.success) onDone(res.message);
    else setError(res.message);
  };

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={a.newMember}
      description={mode === 'trainer' ? a.trainerCreateHint : undefined}
      submitLabel={a.create}
      busy={busy}
      onSubmit={submit}
    >
      <FormError message={error} />
      <FormSection title={a.account}>
        <FieldGrid>
          <Field label={a.fullName} className="sm:col-span-2">
            {id => <TextInput id={id} value={form.name} onChange={set('name')} autoComplete="name" autoFocus />}
          </Field>
          <Field label={a.phone}>
            {id => <PhoneInput id={id} value={form.phone} onChange={set('phone')} placeholder={t.auth.phonePlaceholder} />}
          </Field>
          <Field label={a.password} hint={a.passwordHint}>
            {(id, d) => <PasswordInput id={id} aria-describedby={d} value={form.password} onChange={set('password')} autoComplete="new-password" />}
          </Field>
        </FieldGrid>
      </FormSection>

      {mode === 'owner' && (
        <FormSection title={a.packageName}>
          <FieldGrid>
            <Field label={a.trainer} className="sm:col-span-2">
              {id => (
                <SelectInput id={id} value={form.trainerId} onChange={set('trainerId')}>
                  {trainers.map(tr => (
                    <option key={tr.id} value={tr.id}>
                      {displayName(tr.name, isFa)}
                    </option>
                  ))}
                </SelectInput>
              )}
            </Field>
            <PackageFields form={form} set={set} />
          </FieldGrid>
        </FormSection>
      )}
    </FormSheet>
  );
}

function PackageFields({
  form,
  set,
}: {
  form: { packageName: string; totalSessions: string; packagePrice: string; paidAmount: string; expirationDate: string };
  set: (k: any) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useI18n();
  const a = t.accounts;
  return (
    <>
      <Field label={a.packageName}>
        {id => <TextInput id={id} value={form.packageName} onChange={set('packageName')} />}
      </Field>
      <Field label={a.totalSessions}>
        {id => <TextInput id={id} value={form.totalSessions} onChange={set('totalSessions')} inputMode="numeric" dir="ltr" />}
      </Field>
      <Field label={a.packagePrice}>
        {id => <TextInput id={id} value={form.packagePrice} onChange={set('packagePrice')} inputMode="numeric" dir="ltr" />}
      </Field>
      <Field label={a.paidAmount} optional>
        {id => <TextInput id={id} value={form.paidAmount} onChange={set('paidAmount')} inputMode="numeric" dir="ltr" />}
      </Field>
      <Field label={a.expirationDate} hint="YYYY/MM/DD" className="sm:col-span-2">
        {(id, d) => <TextInput id={id} aria-describedby={d} value={form.expirationDate} onChange={set('expirationDate')} dir="ltr" />}
      </Field>
    </>
  );
}

// ── تعیین بسته ───────────────────────────────────────────────────────────────

export function PackageSheet({ member, onClose, onDone }: { member: Member | null; onClose: () => void; onDone: Done }) {
  const { t, isFa } = useI18n();
  const a = t.accounts;
  const [form, setForm] = useResetOnOpen(!!member, () => ({
    packageName: '',
    totalSessions: '12',
    packagePrice: '',
    paidAmount: '',
    expirationDate: jalaliInDays(60),
  }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setError(null), [member]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!member) return;
    setBusy(true);
    const res = await assignMemberPackage(member.id, {
      packageName: form.packageName,
      totalSessions: Math.round(parseAmount(form.totalSessions)),
      packagePrice: parseAmount(form.packagePrice),
      paidAmount: parseAmount(form.paidAmount),
      startDate: getTodayJalaliString(),
      expirationDate: toLatinDigitsDate(form.expirationDate),
    });
    setBusy(false);
    if (res.success) onDone(res.message);
    else setError(res.message);
  };

  return (
    <FormSheet
      open={!!member}
      onClose={onClose}
      title={a.setPackage}
      description={member ? displayName(member.name, isFa) : undefined}
      submitLabel={a.save}
      busy={busy}
      onSubmit={submit}
    >
      <FormError message={error} />
      <FieldGrid>
        <PackageFields form={form} set={set} />
      </FieldGrid>
    </FormSheet>
  );
}

// ── پنل حساب ورود ───────────────────────────────────────────────────────────

export function AccountPanel({ role, entityId }: { role: 'trainer' | 'member'; entityId: string }) {
  const { t } = useI18n();
  const a = t.accounts;
  const [account, setAccount] = useState<UserAccount | undefined>(() => getAccountFor(role, entityId));
  const [resetting, setResetting] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = () => setAccount(getAccountFor(role, entityId));
    load();
    return subscribeToStore(load);
  }, [role, entityId]);

  if (!account) {
    return (
      <div className="rounded-xl border px-3.5 py-3 text-[13px]" style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}>
        {a.noAccount}
      </div>
    );
  }

  const active = account.isActive !== false;

  const run = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    setMessage({ text: res.message, ok: res.success });
    if (res.success) {
      setResetting(false);
      setPassword('');
    }
  };

  return (
    <div className="rounded-xl border p-3.5 space-y-3" style={{ borderColor: 'var(--c-border)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold" style={{ color: 'var(--c-heading)' }}>{a.account}</div>
          <div className="text-[12.5px] truncate" style={{ color: 'var(--c-text-muted)' }} dir="ltr">
            {account.phone ?? account.username}
          </div>
        </div>
        <StatusPill tone={active ? 'ok' : 'off'}>
          {active ? <ShieldCheck size={13} className="me-1" /> : <ShieldOff size={13} className="me-1" />}
          {active ? a.accountActive : a.accountInactive}
        </StatusPill>
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn v="soft" className="h-10" onClick={() => setResetting(r => !r)} aria-expanded={resetting}>
          <KeyRound size={16} /> {a.resetPassword}
        </Btn>
        <Btn v={active ? 'ghost' : 'brass'} className="h-10" disabled={busy} onClick={() => run(() => setAccountActive(account.id, !active))}>
          <Power size={16} /> {active ? a.deactivate : a.activate}
        </Btn>
      </div>

      {resetting && (
        <form
          className="space-y-2.5"
          onSubmit={e => {
            e.preventDefault();
            void run(() => resetAccountPassword(account.id, password));
          }}
        >
          <Field label={a.newPassword} hint={a.passwordHint}>
            {(id, d) => (
              <PasswordInput id={id} aria-describedby={d} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" autoFocus />
            )}
          </Field>
          <Btn type="submit" v="primary" className="h-10" disabled={busy}>
            {a.save}
          </Btn>
        </form>
      )}

      {message && (
        <p role="status" className="text-[12.5px] font-semibold" style={{ color: message.ok ? 'var(--c-avail-fg)' : 'var(--c-rubber)' }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
