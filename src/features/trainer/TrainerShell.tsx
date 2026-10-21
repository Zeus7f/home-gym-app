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
import { AppShell, type ShellNavItem } from '../../components/shell/AppShell';
import { useTabParam } from '../../lib/useTabParam';
import { getGymName } from '../../api/gym';
import { formatJalaliHumanTodayLocalized } from '../../lib/date/jalali';
import { getMember } from '../../api/members';
import { getTrainer } from '../../api/trainers';
import { DailySession, SessionExercise, Member, Trainer } from '../../lib/domain/gymManagement';
import { normalizeExerciseSets } from '../../lib/domain/sessionSets';
import { resolveTab } from '../../lib/navigation';
import { useI18n } from '../../components/LanguageProvider';
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

const MOBILE_TABS: TrainerTabKey[] = ['today', 'mem', 'cat', 'prog'];

export function TrainerShell() {
  const [activeTab, setTab] = useTabParam(toTrainerTab);
  const [activeSession, setActiveSession] = useState<DailySession | null>(null);
  const [activeMember, setActiveMember] = useState<Member | undefined>(undefined);
  const [activeTrainer, setActiveTrainer] = useState<Trainer | undefined>(undefined);

  const { t, isFa } = useI18n();
  const todayShamsi = formatJalaliHumanTodayLocalized(isFa);
  const currentTabInfo = TABS.find(t2 => t2.key === activeTab)!;
  const gymName = getGymName();

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

  const nav: ShellNavItem[] = TABS.map(tab => ({
    key: tab.key,
    icon: tab.icon,
    label: t.nav.trainerShort[tab.labelKey],
  }));

  return (
    <AppShell
      nav={nav}
      mobileKeys={MOBILE_TABS}
      activeKey={activeTab}
      onNavigate={setTab}
      title={t.trainer.shell[TAB_TITLES[currentTabInfo.labelKey]]}
      subtitle={todayShamsi}
      context={gymName}
    >
      {activeTab === 'today' && <Today onOpenSession={sess => setActiveSession(sess)} />}
      {activeTab === 'mem' && <Athletes />}
      {activeTab === 'hist' && <History />}
      {activeTab === 'cat' && <Catalog />}
      {activeTab === 'prog' && <Programs />}
      {activeTab === 'cal' && <Calendar />}

      {/* مدال تمام‌صفحه ثبت جلسه تمرینی (Session Flow) */}
      <AnimatePresence>
        {activeSession && (
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
        )}
      </AnimatePresence>
    </AppShell>
  );
}
