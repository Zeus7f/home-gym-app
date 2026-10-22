import React from 'react';
import { Home as HomeIcon, CalendarDays, Dumbbell, History as HistoryIcon } from 'lucide-react';
import { getCurrentUser } from '../../api/auth';
import { useI18n } from '../../components/LanguageProvider';
import { displayName } from '../../lib/displayName';
import { formatJalaliHumanTodayLocalized } from '../../lib/date/jalali';
import { AppShell, type ShellNavItem } from '../../components/shell/AppShell';
import { useSection } from '../../lib/useSection';
import type { Section } from '../../lib/routes';
import { Navigate } from 'react-router-dom';
import { getGymName } from '../../api/gym';
import { getCurrentMember } from '../../api/members';

// صفحات اپ ورزشکار
import { Home } from './pages/Home';
import { Sessions } from './pages/Sessions';
import { Exercises } from './pages/Exercises';
import { History } from './pages/History';

type MemberSection = Section<'member'>;

interface MemberTabItem {
  key: MemberSection;
  icon: React.ElementType;
  /** کلید برچسب در فرهنگ لغت */
  labelKey: 'home' | 'sessions' | 'exercises' | 'history';
}

const TABS: MemberTabItem[] = [
  { key: 'overview', icon: HomeIcon, labelKey: 'home' },
  { key: 'sessions', icon: CalendarDays, labelKey: 'sessions' },
  { key: 'workouts', icon: Dumbbell, labelKey: 'exercises' },
  { key: 'progress', icon: HistoryIcon, labelKey: 'history' },
];

/** نگاشت کلید تب به عنوان صفحه */
const TAB_TITLES = {
  home: 'titleHome',
  sessions: 'titleSessions',
  exercises: 'titleExercises',
  history: 'titleHistory',
} as const;

/** /member/:section — نمای کلی، جلسات، تمرین‌ها، پیشرفت */
export function MemberShell() {
  const { section, go, linkTo, redirectTo } = useSection('member');
  const { t, isFa } = useI18n();
  const todayShamsi = formatJalaliHumanTodayLocalized(isFa);
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  const activeTab = section as MemberSection;
  const currentTabInfo = TABS.find(tab => tab.key === activeTab)!;
  const user = getCurrentUser();
  const memberName = displayName(user?.displayName || '', isFa);

  const nav: ShellNavItem[] = TABS.map(tab => ({
    key: tab.key,
    icon: tab.icon,
    label: t.nav.memberShort[tab.labelKey],
    to: linkTo(tab.key),
  }));

  return (
    <AppShell
      nav={nav}
      activeKey={activeTab}
      onNavigate={key => go(key)}
      title={t.member.shell[TAB_TITLES[currentTabInfo.labelKey]]}
      subtitle={activeTab === 'overview' ? `${memberName} · ${todayShamsi}` : todayShamsi}
      context={getGymName()}
    >
      <PendingPackageBanner />
      {activeTab === 'overview' && <Home onNavigateTab={key => go(key)} />}
      {activeTab === 'sessions' && <Sessions />}
      {activeTab === 'workouts' && <Exercises />}
      {activeTab === 'progress' && <History />}
    </AppShell>
  );
}

/** ورزشکاری که مربی ساخته و بسته‌اش هنوز تعیین نشده */
function PendingPackageBanner() {
  const { t } = useI18n();
  const member = getCurrentMember();
  if (!member?.packagePending) return null;
  return (
    <div
      role="status"
      className="mb-4 rounded-2xl border px-4 py-3 text-[14px] font-semibold"
      style={{ backgroundColor: 'var(--c-status-live-bg)', color: 'var(--c-status-live-fg)', borderColor: 'var(--c-brass)' }}
    >
      {t.accounts.memberPendingBanner}
    </div>
  );
}
