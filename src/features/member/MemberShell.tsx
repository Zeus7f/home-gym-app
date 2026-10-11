import React, { useState } from 'react';
import { Home as HomeIcon, CalendarDays, Dumbbell, History as HistoryIcon, Bell } from 'lucide-react';
import { mockStore } from '../../lib/supabase/mockStore';
import { formatJalaliHumanToday } from '../../lib/date/jalali';

// صفحات اپ ورزشکار
import { Home } from './pages/Home';
import { Sessions } from './pages/Sessions';
import { Exercises } from './pages/Exercises';
import { History } from './pages/History';

export type MemberTabKey = 'home' | 'ses' | 'ex' | 'hist';

interface MemberTabItem {
  key: MemberTabKey;
  icon: React.ElementType;
  label: string;
  title: string;
}

const TABS: MemberTabItem[] = [
  { key: 'home', icon: HomeIcon, label: 'خانه', title: 'داشبورد ورزشکار' },
  { key: 'ses', icon: CalendarDays, label: 'جلسات', title: 'جلسات و نوبت‌های من' },
  { key: 'ex', icon: Dumbbell, label: 'تمرینات', title: 'تمرین امروز' },
  { key: 'hist', icon: HistoryIcon, label: 'سوابق', title: 'سوابق و رکوردهای من' },
];

export function MemberShell() {
  const [activeTab, setActiveTab] = useState<MemberTabKey>('home');
  const memberName = mockStore.currentUser?.displayName || 'نیلوفر صادقی';
  const todayShamsi = formatJalaliHumanToday();

  const currentTabInfo = TABS.find(t => t.key === activeTab)!;

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
              {currentTabInfo.title}
            </div>
          </div>

          <button
            type="button"
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="h-10 w-10 rounded-xl border grid place-items-center text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="اعلان‌ها"
          >
            <Bell size={18} />
          </button>
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
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
