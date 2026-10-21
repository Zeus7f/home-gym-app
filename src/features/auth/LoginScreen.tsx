/**
 * صفحهٔ ورود — ورود با شمارهٔ موبایل و کلمه عبور.
 *
 *   ≥ lg : دو ستون؛ پنل برند (نام باشگاه و سه مزیت) کنار فرم
 *   < lg : نوار برند فشرده بالای فرم تمام‌عرض
 *
 * حساب‌های نمونه فقط در دموی محلی (بدون Supabase) و در یک بخش جمع‌شو نمایش داده می‌شوند.
 */

import React, { useEffect, useState } from 'react';
import { Dumbbell, CheckCircle2, AlertCircle, LogIn, ChevronDown } from 'lucide-react';
import { isServerAuth, login } from '../../api/auth';
import { getGym } from '../../api/gym';
import { useI18n } from '../../components/LanguageProvider';
import { Language, translations } from '../../lib/i18n';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Field, PasswordInput, PhoneInput } from '../../components/ui/Form';
import { Btn } from '../../components/ui/Btn';
import { displayName } from '../../lib/displayName';
import type { AppRole } from '../../lib/auth/permissions';

interface LoginScreenProps {
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

/** حساب‌های نمونهٔ دموی محلی (رمز همه ۱۲۳) */
const DEMO_ACCOUNTS: { role: AppRole; phone: string; name: string }[] = [
  { role: 'super_admin', phone: '09120000099', name: 'مدیر کل سامانه (Super Admin)' },
  { role: 'owner', phone: '09120000000', name: 'مدیر باشگاه (Admin)' },
  { role: 'trainer', phone: '09121112233', name: 'علی رستمی (Ali)' },
  { role: 'member', phone: '09127778899', name: 'رضا کمالی (Reza)' },
];

export function LoginScreen({ lang: langProp, onLanguageChange: onLangProp }: LoginScreenProps) {
  const { lang, setLang } = useI18n();
  const activeLang = langProp ?? lang;
  const changeLang = onLangProp ?? setLang;
  const t = translations[activeLang];
  const isFa = activeLang === 'fa';
  const demo = !isServerAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gymName, setGymName] = useState('');

  useEffect(() => {
    getGym().then(g => setGymName(g?.name ?? ''));
  }, []);

  async function signIn(id: string, pass: string) {
    if (!id.trim() || !pass.trim()) {
      setError(t.auth.errEmpty);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await login(id, pass);
    setBusy(false);
    if (!res.success) setError(res.message || t.login.errInvalid);
  }

  const brand = displayName(gymName, isFa) || t.shell.brand;

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-[var(--c-surface-0)]" dir={isFa ? 'rtl' : 'ltr'}>
      {/* ── پنل برند ─────────────────────────────────────────────── */}
      <aside
        className="relative overflow-hidden lg:w-[44%] lg:min-h-dvh px-5 sm:px-8 lg:px-12 pt-6 pb-8 lg:py-12 flex flex-col"
        style={{
          backgroundColor: 'var(--c-chrome)',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(209,178,82,0.22), transparent 45%), radial-gradient(circle at 10% 90%, rgba(24,82,126,0.55), transparent 55%)',
          color: '#dbe5ec',
        }}
      >
        {/* الگوی صفحه‌های وزنه */}
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -end-24 hidden lg:block">
          {[340, 260, 180].map(size => (
            <div
              key={size}
              className="absolute rounded-full border-[18px]"
              style={{
                width: size,
                height: size,
                bottom: (340 - size) / 2,
                insetInlineEnd: (340 - size) / 2,
                borderColor: 'rgba(255,255,255,0.05)',
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-11 w-11 rounded-2xl grid place-items-center shrink-0" style={{ backgroundColor: 'var(--c-chrome-2)', color: 'var(--c-brass)' }}>
              <Dumbbell size={22} strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <div className="text-white font-extrabold text-[18px] leading-tight truncate">{t.shell.brand}</div>
              {gymName && <div className="text-[12.5px] truncate" style={{ color: '#b4c8d6' }}>{brand}</div>}
            </div>
          </div>
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            <LangSwitch lang={activeLang} onChange={changeLang} dark />
          </div>
        </div>

        <div className="relative hidden lg:block mt-auto mb-auto pt-16">
          <h2 className="text-white font-extrabold text-[34px] leading-tight max-w-md">{t.auth.featureTitle}</h2>
          <ul className="mt-8 space-y-4 max-w-md">
            {t.auth.features.map(f => (
              <li key={f} className="flex items-start gap-3 text-[15.5px] leading-relaxed">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--c-brass)' }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden lg:block text-[12.5px]" style={{ color: '#8fa7b8' }}>{t.auth.footer}</p>
      </aside>

      {/* ── فرم ──────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="hidden lg:flex justify-end items-center gap-2 px-8 pt-6">
          <LangSwitch lang={activeLang} onChange={changeLang} />
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-8 py-8 lg:py-10">
          <div className="w-full max-w-[420px]">
            <h1 className="text-[26px] sm:text-[30px] font-extrabold leading-tight" style={{ color: 'var(--c-heading)' }}>
              {t.auth.welcome}
            </h1>
            <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
              {t.auth.intro}
            </p>

            <form
              className="mt-7 space-y-4"
              noValidate
              onSubmit={e => {
                e.preventDefault();
                void signIn(phone, password);
              }}
            >
              <Field label={t.auth.phone}>
                {id => (
                  <PhoneInput
                    id={id}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t.auth.phonePlaceholder}
                    autoComplete="username"
                    className="h-12 text-[16px]"
                    aria-invalid={!!error}
                  />
                )}
              </Field>
              <Field label={t.auth.password}>
                {id => (
                  <PasswordInput
                    id={id}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-12 text-[16px]"
                    aria-invalid={!!error}
                  />
                )}
              </Field>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[13.5px] font-semibold"
                  style={{ backgroundColor: 'var(--c-status-noshow-bg)', borderColor: 'var(--c-rubber)', color: 'var(--c-rubber)' }}
                >
                  <AlertCircle size={17} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Btn type="submit" v="primary" className="w-full h-12 text-[16px] rounded-xl" disabled={busy}>
                {busy ? t.auth.checking : (
                  <>
                    <LogIn size={18} className={isFa ? 'rotate-180' : ''} /> {t.auth.submit}
                  </>
                )}
              </Btn>
              <p className="text-[12.5px] text-center" style={{ color: 'var(--c-text-muted)' }}>{t.auth.forgot}</p>
            </form>

            {demo && (
              <details className="mt-8 group rounded-2xl border" style={{ borderColor: 'var(--c-border)', backgroundColor: 'var(--c-surface-1)' }}>
                <summary className="list-none cursor-pointer px-4 h-12 flex items-center justify-between gap-3 text-[14px] font-bold" style={{ color: 'var(--c-steel)' }}>
                  <span className="truncate">{t.auth.demoTitle}</span>
                  <ChevronDown size={18} className="shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-[12.5px] mb-3" style={{ color: 'var(--c-text-muted)' }}>{t.auth.demoHint}</p>
                  <ul className="space-y-2">
                    {DEMO_ACCOUNTS.map(a => (
                      <li key={a.phone} className="flex items-center gap-3 rounded-xl px-3 py-2 min-w-0" style={{ backgroundColor: 'var(--c-surface-2)' }}>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-bold truncate" style={{ color: 'var(--c-text)' }}>{displayName(a.name, isFa)}</div>
                          <div className="text-[12px] truncate" style={{ color: 'var(--c-text-muted)' }}>
                            {t.roles[a.role]} · <span dir="ltr">{a.phone}</span>
                          </div>
                        </div>
                        <Btn
                          v="ghost"
                          className="h-9 !px-3 shrink-0"
                          disabled={busy}
                          aria-label={`${t.auth.demoUse}: ${displayName(a.name, isFa)}`}
                          onClick={() => {
                            setPhone(a.phone);
                            setPassword('123');
                            void signIn(a.phone, '123');
                          }}
                        >
                          {t.auth.demoUse}
                        </Btn>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="lg:hidden flex items-center justify-between gap-3 px-4 pb-6">
          <p className="text-[12px] truncate" style={{ color: 'var(--c-text-faint)' }}>{t.auth.footer}</p>
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
}

function LangSwitch({ lang, onChange, dark = false }: { lang: Language; onChange: (l: Language) => void; dark?: boolean }) {
  return (
    <div
      className="flex p-1 rounded-xl border"
      style={{
        backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'var(--c-surface-2)',
        borderColor: dark ? 'rgba(255,255,255,0.12)' : 'var(--c-border)',
      }}
    >
      {(['fa', 'en'] as const).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className="h-8 px-3 rounded-lg text-[12.5px] font-bold cursor-pointer"
          style={{
            backgroundColor: lang === l ? (dark ? 'rgba(255,255,255,0.16)' : 'var(--c-surface-1)') : 'transparent',
            color: dark ? '#fff' : lang === l ? 'var(--c-ink)' : 'var(--c-text-muted)',
          }}
        >
          {l === 'fa' ? 'فارسی' : 'EN'}
        </button>
      ))}
    </div>
  );
}
