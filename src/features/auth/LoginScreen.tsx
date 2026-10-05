import React, { useState } from 'react';
import { mockStore } from '../../lib/supabase/mockStore';
import { Language, translations } from '../../lib/i18n';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { Dumbbell, Lock, User, LogIn, AlertCircle, Sparkles, Shield, Activity } from 'lucide-react';

interface LoginScreenProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LoginScreen({ lang, onLanguageChange }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(lang === 'fa' ? 'لطفاً نام کاربری و کلمه عبور را وارد نمایید.' : 'Please enter username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const res = mockStore.login(username, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || (lang === 'fa' ? 'خطا در ورود' : 'Login failed'));
      }
    }, 200);
  }

  function handleQuickLogin(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
    mockStore.login(user, pass);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090C] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              {lang === 'fa' ? mockStore.gym.name : 'Iron Haven Club'}
            </span>
            <span className="mr-2 rtl:mr-2 ltr:ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              {t.appBadge}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle currentLang={lang} onLanguageChange={onLanguageChange} />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white dark:bg-[#11151A] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white pt-2">
              {lang === 'fa' ? 'ورود به سامانه باشگاه' : 'Sign in to Gym Portal'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'fa'
                ? 'هر کاربر پس از ورود تنها به داده‌ها و برنامه‌های مجاز خود دسترسی دارد.'
                : 'Each user strictly accesses only their authorized records and workouts.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'نام کاربری' : 'Username'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={lang === 'fa' ? 'مثال: admin یا ali' : 'e.g. admin or ali'}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'کلمه عبور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? (lang === 'fa' ? 'در حال بررسی...' : 'Signing in...') : (lang === 'fa' ? 'ورود به حساب کاربری' : 'Sign In')}</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>{lang === 'fa' ? 'ورود سریع تستی (Demo Accounts):' : 'Instant Demo Logins:'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', '123')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-right rtl:text-right ltr:text-left transition font-bold flex items-center justify-between"
              >
                <span>👑 {lang === 'fa' ? 'مدیر باشگاه' : 'Gym Owner'}</span>
                <span className="text-[10px] text-slate-400">admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ali', '123')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-right rtl:text-right ltr:text-left transition font-bold flex items-center justify-between"
              >
                <span>🏋️ {lang === 'fa' ? 'مربی علی' : 'Coach Ali'}</span>
                <span className="text-[10px] text-slate-400">ali</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sara', '123')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-right rtl:text-right ltr:text-left transition font-bold flex items-center justify-between"
              >
                <span>🏃‍♀️ {lang === 'fa' ? 'مربی سارا' : 'Coach Sara'}</span>
                <span className="text-[10px] text-slate-400">sara</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reza', '123')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-right rtl:text-right ltr:text-left transition font-bold flex items-center justify-between"
              >
                <span>👤 {lang === 'fa' ? 'شاگرد رضا' : 'Member Reza'}</span>
                <span className="text-[10px] text-slate-400">reza</span>
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400">
              {lang === 'fa' ? 'رمز همه اکانت‌های تستی: 123' : 'Password for all demo accounts: 123'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        {lang === 'fa' ? 'سامانه یکپارچه و هوشمند مدیریت باشگاه ورزشی' : 'Integrated Physical Gym Operations Platform'}
      </footer>
    </div>
  );
}
