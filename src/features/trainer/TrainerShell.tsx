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
import { useSection } from '../../lib/useSection';
import type { Section } from '../../lib/routes';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getSessionById } from '../../api/sessions';
import { getGymName } from '../../api/gym';
import { formatJalaliHumanTodayLocalized } from '../../lib/date/jalali';
import { getMember } from '../../api/members';
import { getTrainer } from '../../api/trainers';
import { DailySession, SessionExercise, Member, Trainer } from '../../lib/domain/gymManagement';
import { normalizeExerciseSets } from '../../lib/domain/sessionSets';
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

type TrainerSection = Section<'trainer'>;
interface TrainerTabItem {
  key: TrainerSection;
  icon: React.ElementType;
  /** کلید برچسب و عنوان در فرهنگ لغت */
  labelKey: 'today' | 'members' | 'history' | 'exercises' | 'programs' | 'calendar';
}

const TABS: TrainerTabItem[] = [
  { key: 'today', icon: CalendarCheck, labelKey: 'today' },
  { key: 'athletes', icon: Users, labelKey: 'members' },
  { key: 'history', icon: HistoryIcon, labelKey: 'history' },
  { key: 'exercises', icon: BookOpen, labelKey: 'exercises' },
  { key: 'programs', icon: ClipboardList, labelKey: 'programs' },
  { key: 'calendar', icon: CalendarDays, labelKey: 'calendar' },
];

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

const MOBILE_TABS: TrainerSection[] = ['today', 'athletes', 'exercises', 'programs'];

/**
 * /trainer/:section — امروز، تقویم، ورزشکاران، برنامه‌ها، حرکات، سوابق.
 * اجرای زندهٔ جلسه آدرس خودش را دارد: /trainer/sessions/:sessionId/live
 */
export function TrainerShell() {
  const params = useParams();
  const [first, liveId, liveTail] = (params['*'] ?? '').split('/').filter(Boolean);
  const isLive = first === 'sessions' && !!liveId && liveTail === 'live';
  const { section, go, linkTo, redirectTo } = useSection('trainer');
  const navigate = useNavigate();
  const [activeMember, setActiveMember] = useState<Member | undefined>(undefined);
  const [activeTrainer, setActiveTrainer] = useState<Trainer | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<DailySession | undefined>(undefined);

  const { t, isFa } = useI18n();
  const todayShamsi = formatJalaliHumanTodayLocalized(isFa);
  const gymName = getGymName();

  // جلسهٔ زنده از آدرس؛ اطلاعات عضو و مربی (اعتبار باقیمانده و نرخ دستمزد)
  useEffect(() => {
    if (!isLive) {
      setActiveSession(undefined);
      setActiveMember(undefined);
      setActiveTrainer(undefined);
      return;
    }
    let cancelled = false;
    getSessionById(liveId).then(sess => {
      if (cancelled) return;
      setActiveSession(sess);
      if (!sess) return;
      getMember(sess.memberId).then(m => !cancelled && setActiveMember(m));
      getTrainer(sess.trainerId).then(tr => !cancelled && setActiveTrainer(tr));
    });
    return () => {
      cancelled = true;
    };
  }, [isLive, liveId]);

  if (redirectTo && !isLive) return <Navigate to={redirectTo} replace />;

  const shownSection: TrainerSection = isLive ? 'today' : (section as TrainerSection);
  const currentTabInfo = TABS.find(t2 => t2.key === shownSection)!;
  const closeLive = () => navigate(linkTo('today'));

  const nav: ShellNavItem[] = TABS.map(tab => ({
    key: tab.key,
    icon: tab.icon,
    label: t.nav.trainerShort[tab.labelKey],
    to: linkTo(tab.key),
  }));

  return (
    <AppShell
      nav={nav}
      mobileKeys={MOBILE_TABS}
      activeKey={shownSection}
      onNavigate={key => go(key)}
      title={t.trainer.shell[TAB_TITLES[currentTabInfo.labelKey]]}
      subtitle={todayShamsi}
      context={gymName}
    >
      {shownSection === 'today' && <Today onOpenSession={sess => navigate(linkTo('sessions', sess.id, 'live'))} />}
      {shownSection === 'athletes' && <Athletes />}
      {shownSection === 'history' && <History />}
      {shownSection === 'exercises' && <Catalog />}
      {shownSection === 'programs' && <Programs />}
      {shownSection === 'calendar' && <Calendar />}

      {/* اجرای تمام‌صفحهٔ جلسه (Session Flow) */}
      <AnimatePresence>
        {isLive && activeSession && (
          <SessionFlow
            sessionId={activeSession.id}
            memberId={activeSession.memberId}
            memberName={activeSession.memberName}
            remainingSessions={activeMember?.remainingSessions ?? 0}
            totalSessions={activeMember?.totalSessions ?? 0}
            trainerId={activeSession.trainerId}
            sessionRate={activeTrainer?.sessionRate ?? 0}
            initialExercises={toWorkoutExercises(activeSession.exercises)}
            onClose={closeLive}
            onCompleted={closeLive}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
