import React, { useState } from 'react';
import { Home as HomeIcon, CalendarDays, Dumbbell, History as HistoryIcon } from 'lucide-react';
import { getCurrentUser } from '../../api/auth';
import { useI18n } from '../../components/LanguageProvider';
import { displayName } from '../../lib/displayName';
import { formatJalaliHumanTodayLocalized } from '../../lib/date/jalali';
import { NotificationBell } from '../../components/ui/NotificationBell';

// صفحات اپ ورزشکار
import { Home } from './pages/Home';
import { Sessions } from './pages/Sessions';
import { Exercises } from './pages/Exercises';
import { History } from './pages/History';

export type MemberTabKey = 'home' | 'ses' | 'ex' | 'hist';

interface MemberTabItem {
  key: MemberTabKey;
  icon: React.ElementType;
  /** کلید برچسب در فرهنگ لغت */
  labelKey: 'home' | 'sessions' | 'exercises' | 'history';
}

const TABS: MemberTabItem[] = [
  { key: 'home', icon: HomeIcon, labelKey: 'home' },
  { key: 'ses', icon: CalendarDays, labelKey: 'sessions' },
  { key: 'ex', icon: Dumbbell, labelKey: 'exercises' },
  { key: 'hist', icon: HistoryIcon, labelKey: 'history' },
];

/** نگاشت کلید تب به عنوان صفحه */
const TAB_TITLES = {
  home: 'titleHome',
  sessions: 'titleSessions',
  exercises: 'titleExercises',
  history: 'titleHistory',
} as const;

export function MemberShell() {
  const queryTab = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tab') as MemberTabKey;
  const [activeTab, setActiveTab] = useState<MemberTabKey>(queryTab || 'home');
  const { t, isFa } = useI18n();
  const memberName = displayName(getCurrentUser()?.displayName || 'Niloofar Bahrami', isFa);
  const todayShamsi = formatJalaliHumanTodayLocalized(isFa);

  const currentTabInfo = TABS.find(tab => tab.key === activeTab)!;

  return (
    <div
      style={{
        backgroundColor: 'var(--c-surface-0)',
        borderColor: 'var(--c-border)',
      }}
      className="relative min-h-[calc(100vh-80px)] flex flex-col rounded-2xl overflow-hidden border shadow-xs select-none max-w-4xl mx-auto"
    >
      {/* سربرگ تب‌های ثانویه (جلسات، تمرینات، سوابق) */}
      {activeTab !== 'home' && (
        <header
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="pt-5 px-4 sm:px-6 pb-3.5 border-b flex items-center justify-between gap-3.5 shrink-0"
        >
          <div>
            <div className="text-[12px]" style={{ color: 'var(--c-text-muted)' }}>
              {memberName} · {todayShamsi}
            </div>
            <div
              className="text-[18px] sm:text-[20px] font-extrabold truncate mt-0.5"
              style={{ color: 'var(--c-deep)' }}
            >
              {t.member.shell[TAB_TITLES[currentTabInfo.labelKey]]}
            </div>
          </div>

          <NotificationBell onNavigateTab={t => setActiveTab(t as MemberTabKey)} />
        </header>
      )}

      {/* محتوای فعال صفحه */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-24 thin-scroll">
        {activeTab === 'home' && <Home onNavigateTab={t => setActiveTab(t as MemberTabKey)} />}
        {activeTab === 'ses' && <Sessions />}
        {activeTab === 'ex' && <Exercises />}
        {activeTab === 'hist' && <History />}
      </main>

      {/* منوی ناوبری پایین صفحه (Bottom Tabs) */}
      <nav
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="fixed sm:sticky bottom-0 inset-x-0 z-30 border-t grid grid-cols-4 pt-1.5 pb-4 select-none shadow-lg max-w-4xl mx-auto"
        role="tablist"
        aria-label="منوی اصلی ورزشکار"
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              style={{
                color: isActive ? 'var(--c-ink)' : 'var(--c-text-muted)',
              }}
              className="flex flex-col items-center gap-1 cursor-pointer transition-colors"
            >
              <span
                style={{
                  backgroundColor: isActive
                    ? 'var(--c-surface-3)'
                    : 'transparent',
                }}
                className="h-8 w-14 rounded-full grid place-items-center transition-all"
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              </span>
              <span className={`text-[12px] ${isActive ? 'font-bold' : ''}`}>
                {t.nav.memberShort[tab.labelKey]}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
