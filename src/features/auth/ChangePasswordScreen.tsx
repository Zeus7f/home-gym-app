/**
 * /auth/change-password — تغییر رمز اجباری در اولین ورود (یا پس از تعیین رمز توسط مدیر)
 * و تغییر رمز داوطلبانه.
 */

import React, { useState } from 'react';
import { KeyRound, AlertCircle } from 'lucide-react';
import { changePassword, getAuthenticatedUser, logout, mustChangePassword } from '../../api/auth';
import { useI18n } from '../../components/LanguageProvider';
import { Field, PasswordInput } from '../../components/ui/Form';
import { Btn } from '../../components/ui/Btn';
import { displayName } from '../../lib/displayName';
import { MIN_PASSWORD_LENGTH } from '../../lib/auth/accountRules';

export function ChangePasswordScreen({ onDone }: { onDone: () => void }) {
  const { t, isFa } = useI18n();
  const user = getAuthenticatedUser();
  const forced = mustChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < MIN_PASSWORD_LENGTH) return setError(t.storeMessages['account.weakPassword']);
    if (next !== repeat) return setError(t.auth.passwordMismatch);
    setBusy(true);
    setError(null);
    const res = await changePassword(current, next);
    setBusy(false);
    if (res.success) onDone();
    else setError(res.message);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10 bg-[var(--c-surface-0)]">
      <div className="w-full max-w-[420px] rounded-3xl border p-6 sm:p-8" style={{ backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border)' }}>
        <span className="h-12 w-12 rounded-2xl grid place-items-center mb-4" style={{ backgroundColor: 'var(--c-chrome)', color: 'var(--c-brass)' }}>
          <KeyRound size={22} />
        </span>
        <h1 className="text-[24px] font-extrabold" style={{ color: 'var(--c-heading)' }}>{t.auth.changeTitle}</h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
          {forced ? t.auth.changeForcedIntro : t.auth.changeIntro}
          {user && <span className="block mt-1 font-semibold">{displayName(user.displayName, isFa)}</span>}
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
          <Field label={t.auth.currentPassword}>
            {id => <PasswordInput id={id} value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" autoFocus />}
          </Field>
          <Field label={t.accounts.newPassword} hint={t.accounts.passwordHint}>
            {(id, d) => <PasswordInput id={id} aria-describedby={d} value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" />}
          </Field>
          <Field label={t.auth.repeatPassword}>
            {id => <PasswordInput id={id} value={repeat} onChange={e => setRepeat(e.target.value)} autoComplete="new-password" />}
          </Field>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[13.5px] font-semibold" style={{ backgroundColor: 'var(--c-status-noshow-bg)', borderColor: 'var(--c-rubber)', color: 'var(--c-rubber)' }}>
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <Btn type="submit" v="primary" className="w-full h-12 text-[16px] rounded-xl" disabled={busy}>
            {busy ? t.actions.loading : t.accounts.save}
          </Btn>
          <button type="button" onClick={() => void logout()} className="w-full text-[13px] font-semibold h-10 cursor-pointer" style={{ color: 'var(--c-steel)' }}>
            {t.shell.signOut}
          </button>
        </form>
      </div>
    </div>
  );
}
