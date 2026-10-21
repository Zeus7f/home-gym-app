import React, { useState } from 'react';
import { isServerAuth, login } from '../../api/auth';
import { useI18n } from '../../components/LanguageProvider';
import { getGym } from '../../api/gym';
import { Language, translations } from '../../lib/i18n';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import {
  Dumbbell,
  Lock,
  User,
  LogIn,
  AlertCircle,
  Sparkles,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface LoginScreenProps {
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

type RoleTab = 'owner' | 'trainer' | 'member';

export function LoginScreen({ lang: langProp, onLanguageChange: onLangProp }: LoginScreenProps) {
  const { lang, setLang } = useI18n();
  const activeLang = langProp ?? lang;
  const onLanguageChange = onLangProp ?? setLang;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState<RoleTab>('owner');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[activeLang];
  const demoAuth = !isServerAuth();

  const [gymName, setGymName] = useState('Iron Haven Fitness Club');

  React.useEffect(() => {
    getGym().then(g => {
      if (g?.name) setGymName(g.name);
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(
        activeLang === 'fa'
          ? t.login.errEmpty
          : 'Please enter username and password.'
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    setTimeout(async () => {
      const res = await login(username, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(
          res.message ||
            (activeLang === 'fa'
              ? t.login.errInvalid
              : 'Invalid credentials.')
        );
      }
    }, 200);
  }

  function handleQuickLogin(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
    setLoading(true);
    setTimeout(async () => {
      await login(user, pass);
      setLoading(false);
    }, 150);
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--c-deep)',
        color: 'var(--c-text-primary)',
      }}
      className="min-h-screen flex flex-col justify-between p-4 sm:p-6 transition-colors relative overflow-hidden select-none"
    >
      {/* هاله‌های نوری تم آیرون هیون (Deep, Steel, Brass) */}
      <div
        style={{
          background: 'radial-gradient(circle, rgba(24,82,126,0.35) 0%, rgba(4,29,44,0) 70%)',
        }}
        className="absolute top-[-15%] start-[10%] w-[650px] h-[650px] rounded-full blur-[100px] pointer-events-none"
      />
      <div
        style={{
          background: 'radial-gradient(circle, rgba(209,178,82,0.18) 0%, rgba(4,29,44,0) 70%)',
        }}
        className="absolute bottom-[-15%] end-[10%] w-[550px] h-[550px] rounded-full blur-[100px] pointer-events-none"
      />

      {/* هدر بالای صفحه با لوگو و ابزارهای تغییر تم/زبان */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full py-2">
        <div className="flex items-center gap-3">
          <div
            style={{
              backgroundColor: 'var(--c-ink)',
              borderColor: 'var(--c-border-strong)',
              color: 'var(--c-brass)',
            }}
            className="w-11 h-11 rounded-2xl border flex items-center justify-center font-black shadow-md shadow-black/20"
          >
            <Dumbbell className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-lg tracking-tight text-white">
                {activeLang === 'fa' ? gymName : 'Iron Haven Club'}
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(209,178,82,0.18)',
                  color: 'var(--c-brass)',
                  borderColor: 'rgba(209,178,82,0.35)',
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-black border"
              >
                {t.login.version}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              {activeLang === 'fa'
                ? t.login.subtitle
                : 'Integrated Gym Operational Platform'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle currentLang={lang} onLanguageChange={onLanguageChange} />
          <ThemeToggle />
        </div>
      </header>

      {/* بدنه اصلی و فرم ورود */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-6">
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="rounded-3xl p-6 sm:p-7 border shadow-2xl space-y-5"
        >
          {/* عنوان کارت ورود */}
          <div className="text-center space-y-1.5">
            <div
              style={{
                backgroundColor: 'var(--c-surface-2)',
                borderColor: 'var(--c-border)',
                color: 'var(--c-steel)',
              }}
              className="w-14 h-14 rounded-2xl border mx-auto flex items-center justify-center shadow-inner"
            >
              <Lock className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h1
              className="text-2xl font-black pt-1 tracking-tight"
              style={{ color: 'var(--c-deep)' }}
            >
              {t.login.title}
            </h1>
            <p
              className="text-xs max-w-xs mx-auto leading-relaxed"
              style={{ color: 'var(--c-text-muted)' }}
            >
              {activeLang === 'fa'
                ? t.login.hint
                : 'Enter your credentials to access your designated workspace.'}
            </p>
          </div>

          {/* پیام خطا در صورت وجود */}
          {errorMsg && (
            <div
              role="alert"
              style={{
                backgroundColor: 'var(--c-status-noshow-bg)',
                borderColor: 'var(--c-rubber)',
                color: 'var(--c-rubber)',
              }}
              className="p-3 border rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* B-01: حساب‌های تستی فقط در دموی محلی؛ با Supabase Auth ورود فقط با حساب واقعی است */}
          {demoAuth && (
          <>
          {/* کارت‌های انتخاب سریع نقش (مدیر، مربی، شاگرد) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles size={13} style={{ color: 'var(--c-brass)' }} />
                <span>{t.login.quickAccess}</span>
              </span>
              <span className="font-mono text-[10px]">{t.login.allPasswords}</span>
            </div>

            <div
              style={{
                backgroundColor: 'var(--c-surface-2)',
                borderColor: 'var(--c-border)',
              }}
              className="p-1 rounded-2xl border grid grid-cols-3 gap-1"
            >
              {/* تب مدیر */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleTab('owner');
                  setUsername('admin');
                  setPassword('123');
                }}
                style={{
                  backgroundColor:
                    selectedRoleTab === 'owner' ? 'var(--c-ink)' : 'transparent',
                  color: selectedRoleTab === 'owner' ? '#ffffff' : 'var(--c-text-muted)',
                }}
                className="py-2 px-1.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 shadow-2xs"
              >
                <Shield size={16} style={{ color: selectedRoleTab === 'owner' ? 'var(--c-brass)' : 'inherit' }} />
                <span>{t.roles.owner}</span>
              </button>

              {/* تب مربی */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleTab('trainer');
                  setUsername('sara');
                  setPassword('123');
                }}
                style={{
                  backgroundColor:
                    selectedRoleTab === 'trainer' ? 'var(--c-steel)' : 'transparent',
                  color: selectedRoleTab === 'trainer' ? '#ffffff' : 'var(--c-text-muted)',
                }}
                className="py-2 px-1.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 shadow-2xs"
              >
                <Dumbbell size={16} />
                <span>{t.roles.trainer}</span>
              </button>

              {/* تب ورزشکار */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleTab('member');
                  setUsername('reza');
                  setPassword('123');
                }}
                style={{
                  backgroundColor:
                    selectedRoleTab === 'member' ? 'var(--c-brass)' : 'transparent',
                  color: selectedRoleTab === 'member' ? '#041d2c' : 'var(--c-text-muted)',
                }}
                className="py-2 px-1.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 shadow-2xs"
              >
                <UserCheck size={16} />
                <span>{t.roles.member}</span>
              </button>
            </div>

            {/* کارت پیش‌نمایش نقش انتخاب‌شده با دکمه ورود آنی */}
            <div
              style={{
                backgroundColor: 'var(--c-surface-2)',
                borderColor: 'var(--c-border)',
              }}
              className="p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in"
            >
              {selectedRoleTab === 'owner' && (
                <>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>{t.login.ownerAccount}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      <span>{t.login.usernameLabel}</span> <span className="font-mono font-bold text-slate-600 dark:text-slate-300">admin</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', '123')}
                    style={{
                      backgroundColor: 'var(--c-ink)',
                      color: '#ffffff',
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                  >
                    <span>{t.login.directLogin}</span>
                    <ArrowRight size={13} className="rtl:rotate-180" />
                  </button>
                </>
              )}

              {selectedRoleTab === 'trainer' && (
                <>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span>{t.login.trainerAccount}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex gap-2">
                      <span>sara: <b className="font-mono text-slate-600 dark:text-slate-300">sara</b></span>
                      <span>·</span>
                      <span>ali: <b className="font-mono text-slate-600 dark:text-slate-300">ali</b></span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('sara', '123')}
                    style={{
                      backgroundColor: 'var(--c-steel)',
                      color: '#ffffff',
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                  >
                    <span>{t.login.loginAs(t.login.saraName)}</span>
                    <ArrowRight size={13} className="rtl:rotate-180" />
                  </button>
                </>
              )}

              {selectedRoleTab === 'member' && (
                <>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{t.login.memberAccount}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      <span>{t.login.usernameLabel}</span>{' '}
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-300">reza</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('reza', '123')}
                    style={{
                      backgroundColor: 'var(--c-brass)',
                      color: '#041d2c',
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                  >
                    <span>{t.login.loginAs(t.login.rezaName)}</span>
                    <ArrowRight size={13} className="rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* خط تفکیک فرم دستی */}
          <div className="relative flex items-center justify-center">
            <div className="border-t w-full" style={{ borderColor: 'var(--c-border)' }} />
            <span
              style={{
                backgroundColor: 'var(--c-surface-1)',
                color: 'var(--c-text-muted)',
              }}
              className="absolute px-3 text-[11px] font-medium"
            >
              {t.login.orManual}
            </span>
          </div>
          </>
          )}

          {/* فرم اصلی ورود */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* فیلد نام کاربری */}
            <div className="space-y-1">
              <label
                htmlFor="login-username"
                className="block text-xs font-bold"
                style={{ color: 'var(--c-deep)' }}
              >
                {t.login.username}
              </label>
              <div
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  borderColor: 'var(--c-border)',
                }}
                className="flex items-center gap-2 h-11 px-3.5 rounded-xl border focus-within:border-slate-400 dark:focus-within:border-slate-500 transition-colors"
              >
                <User size={17} className="text-slate-400 shrink-0" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={demoAuth ? t.login.usernamePlaceholder : t.login.username}
                  autoComplete="username"
                  required
                  className="w-full bg-transparent border-none outline-hidden text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* فیلد کلمه عبور */}
            <div className="space-y-1">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold"
                style={{ color: 'var(--c-deep)' }}
              >
                {t.login.password}
              </label>
              <div
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  borderColor: 'var(--c-border)',
                }}
                className="flex items-center gap-2 h-11 px-3.5 rounded-xl border focus-within:border-slate-400 dark:focus-within:border-slate-500 transition-colors"
              >
                <Lock size={17} className="text-slate-400 shrink-0" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent border-none outline-hidden text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={t.login.togglePassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* دکمه ارسال فرم */}
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: 'var(--c-deep)',
                color: '#ffffff',
                borderColor: 'var(--c-steel)',
              }}
              className="w-full h-12 rounded-xl border font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>{t.login.checking}</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{t.login.submit}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* فوتر پایین صفحه */}
      <footer className="relative z-10 text-center text-xs text-slate-400 py-2">
        {t.login.footer}
      </footer>
    </div>
  );
}
