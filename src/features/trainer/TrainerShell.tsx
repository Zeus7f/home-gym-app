import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  CalendarCheck,
  Users,
  History as HistoryIcon,
  BookOpen,
  ClipboardList,
  CalendarDays,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { formatJalaliHumanTodayLocalized } from '../../lib/date/jalali';
import { getCurrentUser } from '../../api/auth';
import { getMember } from '../../api/members';
import { getTrainer } from '../../api/trainers';
import { DailySession, SessionExercise, Member, Trainer } from '../../lib/domain/gymManagement';
import { normalizeExerciseSets } from '../../lib/domain/sessionSets';
import { NotificationBell } from '../../components/ui/NotificationBell';
import { resolveTab } from '../../lib/navigation';
import { useI18n } from '../../components/LanguageProvider';
import { displayName } from '../../lib/displayName';
import type { WorkoutExercise } from './hooks/useSessionDraft';

// صفحات اپ مربی
import { Today } from './pages/Today';
import { Athletes } from './pages/Athletes';
import { History } from './pages/History';
import { Catalog } from './pages/Catalog';
import { Programs } from './pages/Programs';
import { Calendar } from './pages/Calendar';
import { SessionFlow } from './components/SessionFlow';

export type TrainerTabKey = 'today' | 'mem' | 'hist' | 'cat' | 'prog' | 'cal';
interface TrainerTabItem {
  key: TrainerTabKey;
  icon: React.ElementType;
  /** کلید برچسب و عنوان در فرهنگ لغت */
  labelKey: 'today' | 'members' | 'history' | 'exercises' | 'programs' | 'calendar';
}

const TABS: TrainerTabItem[] = [
  { key: 'today', icon: CalendarCheck, labelKey: 'today' },
  { key: 'mem', icon: Users, labelKey: 'members' },
  { key: 'hist', icon: HistoryIcon, labelKey: 'history' },
  { key: 'cat', icon: BookOpen, labelKey: 'exercises' },
  { key: 'prog', icon: ClipboardList, labelKey: 'programs' },
  { key: 'cal', icon: CalendarDays, labelKey: 'calendar' },
];

const TRAINER_TAB_KEYS = TABS.map(tab => tab.key);
const TRAINER_TAB_ALIASES: Partial<Record<string, TrainerTabKey>> = {
  members: 'mem',
  history: 'hist',
  exercises: 'cat',
  catalog: 'cat',
  programs: 'prog',
  calendar: 'cal',
};
const toTrainerTab = (raw: string | null | undefined) =>
  resolveTab(raw, TRAINER_TAB_KEYS, 'today', TRAINER_TAB_ALIASES);

/** نگاشت کلید تب به عنوان صفحه — برای پرهیز از ساخت کلید پویا */
const TAB_TITLES = {
  today: 'titleToday',
  members: 'titleMembers',
  history: 'titleHistory',
  exercises: 'titleCatalog',
  programs: 'titlePrograms',
  calendar: 'titleCalendar',
} as const;

/**
 * تبدیل حرکات ثبت‌شده یک جلسه واقعی به ساختار پیش‌نویس مربی.
 * شناسه حرکت (exerciseId) حفظ می‌شود تا داده‌ها به کاتالوگ و موتورهای تحلیلی متصل بماند.
 */
function toWorkoutExercises(exercises: SessionExercise[]): WorkoutExercise[] {
  return exercises.map(ex => ({
    exerciseId: ex.exerciseId,
    name: ex.name,
    part: ex.bodyPart,
    last: ex.notes,
    sets: normalizeExerciseSets(ex).map(s => ({ r: s.r, w: s.w, d: s.d })),
  }));
}

export function TrainerShell() {
  const queryTab = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tab');
  const [activeTab, setActiveTab] = useState<TrainerTabKey>(toTrainerTab(queryTab));
  const [activeSession, setActiveSession] = useState<DailySession | null>(null);
  const [activeMember, setActiveMember] = useState<Member | undefined>(undefined);
  const [activeTrainer, setActiveTrainer] = useState<Trainer | undefined>(undefined);

  const { t, isFa } = useI18n();
  const trainerName = displayName(getCurrentUser()?.displayName || t.roles.trainer, isFa);
  const todayShamsi = formatJalaliHumanTodayLocalized(isFa);
  const currentTabInfo = TABS.find(t2 => t2.key === activeTab)!;

  // بارگذاری اطلاعات عضو و مربی جلسه فعال (اعتبار باقیمانده و نرخ دستمزد)
  useEffect(() => {
    if (!activeSession) {
      setActiveMember(undefined);
      setActiveTrainer(undefined);
      return;
    }

    let cancelled = false;
    getMember(activeSession.memberId).then(m => {
      if (!cancelled) setActiveMember(m);
    });
    getTrainer(activeSession.trainerId).then(t => {
      if (!cancelled) setActiveTrainer(t);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSession?.id, activeSession?.memberId, activeSession?.trainerId]);

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
            {t.trainer.shell.role} · {todayShamsi}
          </div>
          <div
            className="text-[18px] sm:text-[20px] font-extrabold truncate mt-0.5"
            style={{ color: 'var(--c-deep)' }}
          >
            {t.trainer.shell[TAB_TITLES[currentTabInfo.labelKey]]}
          </div>
        </div>

        <NotificationBell onNavigateTab={raw => setActiveTab(toTrainerTab(raw))} />
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
        {activeTab === 'prog' && <Programs />}
        {activeTab === 'cal' && <Calendar />}
      </main>

      {/* ۳. منوی ناوبری پایین صفحه (Bottom Tabs) */}
      <nav
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="fixed sm:sticky bottom-0 inset-x-0 z-30 border-t grid grid-cols-6 pt-1.5 pb-4 select-none shadow-lg max-w-4xl mx-auto"
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
                {t.nav.trainerShort[tab.labelKey]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ۴. مدال تمام‌صفحه ثبت جلسه تمرینی (Session Flow) */}
      <AnimatePresence>
        {activeSession && (() => {
          return (
            <SessionFlow
              sessionId={activeSession.id}
              memberId={activeSession.memberId}
              memberName={activeSession.memberName}
              remainingSessions={activeMember?.remainingSessions ?? 12}
              totalSessions={activeMember?.totalSessions ?? 12}
              trainerId={activeSession.trainerId}
              sessionRate={activeTrainer?.sessionRate ?? 150000}
              initialExercises={toWorkoutExercises(activeSession.exercises)}
              onClose={() => setActiveSession(null)}
              onCompleted={() => setActiveSession(null)}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
