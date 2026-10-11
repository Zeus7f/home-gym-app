import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  CalendarCheck,
  Users,
  History as HistoryIcon,
  BookOpen,
  Bell,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { formatJalaliHumanToday } from '../../lib/date/jalali';
import { mockStore } from '../../lib/supabase/mockStore';
import { DailySession } from '../../lib/domain/gymManagement';

// صفحات اپ مربی
import { Today } from './pages/Today';
import { Athletes } from './pages/Athletes';
import { History } from './pages/History';
import { Catalog } from './pages/Catalog';
import { SessionFlow } from './components/SessionFlow';

export type TrainerTabKey = 'today' | 'mem' | 'hist' | 'cat';

interface TrainerTabItem {
  key: TrainerTabKey;
  icon: React.ElementType;
  label: string;
  title: string;
}

const TABS: TrainerTabItem[] = [
  { key: 'today', icon: CalendarCheck, label: 'امروز', title: 'ورزشکاران و سانس‌های امروز' },
  { key: 'mem', icon: Users, label: 'ورزشکاران', title: 'ورزشکاران من' },
  { key: 'hist', icon: HistoryIcon, label: 'سوابق', title: 'سوابق جلسات و کارکرد' },
  { key: 'cat', icon: BookOpen, label: 'حرکات', title: 'بانک و کاتالوگ حرکات' },
];

export function TrainerShell() {
  const queryTab = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tab') as TrainerTabKey;
  const [activeTab, setActiveTab] = useState<TrainerTabKey>(queryTab || 'today');
  const [activeSession, setActiveSession] = useState<DailySession | null>(null);

  const trainerName = mockStore.currentUser?.displayName || 'مربی';
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
      {/* ۱. سربرگ اپلیکیشن مربی */}
      <header
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="pt-5 px-4 sm:px-6 pb-3.5 border-b flex items-center gap-3.5 shrink-0"
      >
        <Avatar name={trainerName} size={42} tone="ink" />
        <div className="flex-1 min-w-0">
          <div className="text-[12px]" style={{ color: 'var(--c-text-muted)' }}>
            مربی باشگاه · {todayShamsi}
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
          className="relative h-10 w-10 rounded-xl border grid place-items-center text-slate-600 hover:bg-slate-50 transition-colors"
          title="اعلان‌ها"
        >
          <Bell size={18} />
          <span
            style={{ backgroundColor: 'var(--c-rubber)' }}
            className="absolute top-2.5 left-2.5 h-2 w-2 rounded-full"
          />
        </button>
      </header>

      {/* ۲. محتوای اسکرول‌پذیر صفحه فعال */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-24 thin-scroll">
        {activeTab === 'today' && (
          <Today
            onOpenSession={sess => setActiveSession(sess)}
          />
        )}
        {activeTab === 'mem' && <Athletes />}
        {activeTab === 'hist' && <History />}
        {activeTab === 'cat' && <Catalog />}
      </main>

      {/* ۳. منوی ناوبری پایین صفحه (Bottom Tabs) */}
      <nav
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="fixed sm:sticky bottom-0 inset-x-0 z-30 border-t grid grid-cols-4 pt-1.5 pb-4 select-none shadow-lg max-w-4xl mx-auto"
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
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

      {/* ۴. مدال تمام‌صفحه ثبت جلسه تمرینی (Session Flow) */}
      <AnimatePresence>
        {activeSession && (
          <SessionFlow
            sessionId={activeSession.id}
            memberId={activeSession.memberId}
            memberName={activeSession.memberName}
            onClose={() => setActiveSession(null)}
            onCompleted={() => setActiveSession(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
