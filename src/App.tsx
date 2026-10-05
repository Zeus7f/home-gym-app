import React, { useState, useEffect } from 'react';
import { mockStore } from './lib/supabase/mockStore';
import { OwnerWorkspace } from './features/owner/OwnerWorkspace';
import { TrainerWorkspace } from './features/trainer/TrainerWorkspace';
import { MemberWorkspace } from './features/member/MemberWorkspace';
import { LoginScreen } from './features/auth/LoginScreen';
import { UserJourneyGuide } from './components/UserJourneyGuide';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { LanguageToggle } from './components/ui/LanguageToggle';
import { translations, Language } from './lib/i18n';
import { LayoutDashboard, Activity, User, Compass, Dumbbell, LogOut } from 'lucide-react';

export default function App() {
  const [activeRole, setActiveRole] = useState<'owner' | 'trainer' | 'member'>('owner');
  const [showJourney, setShowJourney] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('hg_lang') as Language) || 'fa';
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  // Sync RTL and language attribute with DOM
  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('hg_lang', lang);
  }, [lang]);

  const currentUser = mockStore.currentUser;

  // Sync active view with user's role upon login
  useEffect(() => {
    if (currentUser) {
      setActiveRole(currentUser.role);
    }
  }, [currentUser]);

  // If user is not authenticated, show dedicated Login Screen
  if (!currentUser) {
    return <LoginScreen lang={lang} onLanguageChange={setLang} />;
  }

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)] text-[var(--color-text)] transition-colors duration-200">
      {/* Top Application Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between bg-white dark:bg-[#0B0D10] sticky top-0 z-40">
        {/* Brand / Gym Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight leading-none text-slate-900 dark:text-white">
                {lang === 'fa' ? mockStore.gym.name : 'Iron Haven Club'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                {t.appBadge}
              </span>
              {mockStore.isSupabaseConnected && (
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  title="Connected to Supabase PostgreSQL Database"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{lang === 'fa' ? 'دیتابیس ابری متصل' : 'Supabase Live'}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase leading-none mt-1">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Roles Navigation (Available to Owner; for trainer and member locked to their workspace) */}
        {currentUser.role === 'owner' ? (
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveRole('owner')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === 'owner'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t.roles.owner}</span>
            </button>

            <button
              onClick={() => setActiveRole('trainer')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === 'trainer'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t.roles.trainer}</span>
            </button>

            <button
              onClick={() => setActiveRole('member')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRole === 'member'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.roles.member}</span>
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <span className="text-slate-500">{lang === 'fa' ? 'حساب فعال:' : 'Active Account:'}</span>
            <span className="text-teal-600 dark:text-teal-400">{currentUser.displayName}</span>
          </div>
        )}

        {/* Right Tools: User Journey Tour + Language Toggle + Theme Toggle + User / Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Journey Button */}
          <button
            onClick={() => setShowJourney(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 transition shadow-xs"
          >
            <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">{t.userJourney.button}</span>
          </button>

          <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
          <ThemeToggle />

          {/* User Profile Info & Logout */}
          <div className="flex items-center gap-2 border-l rtl:border-r rtl:border-l-0 border-slate-200 dark:border-slate-800 pl-3 rtl:pr-3 rtl:pl-0">
            <div className="text-right rtl:text-left hidden lg:block">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-none">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider leading-none mt-1 block">
                {currentUser.role === 'owner'
                  ? (lang === 'fa' ? 'مدیریت کل' : 'Gym Owner')
                  : currentUser.role === 'trainer'
                  ? (lang === 'fa' ? 'مربی' : 'Trainer')
                  : (lang === 'fa' ? 'ورزشکار' : 'Member')}
              </span>
            </div>

            <button
              onClick={() => mockStore.logout()}
              title={lang === 'fa' ? 'خروج از حساب کاربری' : 'Sign Out'}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Role Switcher for Owner */}
      {currentUser.role === 'owner' && (
        <div className="md:hidden flex items-center justify-around bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 text-xs font-bold">
          <button
            onClick={() => setActiveRole('owner')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeRole === 'owner' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.roles.owner}
          </button>
          <button
            onClick={() => setActiveRole('trainer')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeRole === 'trainer' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.roles.trainer}
          </button>
          <button
            onClick={() => setActiveRole('member')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeRole === 'member' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.roles.member}
          </button>
        </div>
      )}

      {/* Main Feature View */}
      <main className="p-4 sm:p-8">
        {activeRole === 'owner' && <OwnerWorkspace lang={lang} />}
        {activeRole === 'trainer' && <TrainerWorkspace lang={lang} />}
        {activeRole === 'member' && <MemberWorkspace lang={lang} />}
      </main>

      {/* Interactive User Journey Guide Modal */}
      {showJourney && (
        <UserJourneyGuide
          lang={lang}
          onClose={() => setShowJourney(false)}
          onSelectRole={role => {
            setActiveRole(role);
          }}
        />
      )}
    </div>
  );
}
