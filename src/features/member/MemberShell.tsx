import React from 'react';
import { Home as HomeIcon, CalendarDays, Dumbbell, History as HistoryIcon } from 'lucide-react';
import { getCurrentUser } from '../../api/auth';
import { useI18n } from '../../components/LanguageProvider';
import { displayName } from '../../lib/displayName';
import { formatJalaliHumanTodayLocalized } from '../../lib/date/jalali';
import { AppShell, type ShellNavItem } from '../../components/shell/AppShell';
import { useTabParam } from '../../lib/useTabParam';
import { getGymName } from '../../api/gym';
import { getCurrentMember } from '../../api/members';
import { resolveTab } from '../../lib/navigation';

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

const MEMBER_TAB_KEYS = TABS.map(tab => tab.key);
const MEMBER_TAB_ALIASES: Partial<Record<string, MemberTabKey>> = {
  sessions: 'ses',
  exercises: 'ex',
  history: 'hist',
};
const toMemberTab = (raw: string | null | undefined) =>
  resolveTab(raw, MEMBER_TAB_KEYS, 'home', MEMBER_TAB_ALIASES);

/** نگاشت کلید تب به عنوان صفحه */
const TAB_TITLES = {
  home: 'titleHome',
  sessions: 'titleSessions',
  exercises: 'titleExercises',
  history: 'titleHistory',
} as const;

export function MemberShell() {
  const [activeTab, setTab] = useTabParam(toMemberTab);
  const { t, isFa } = useI18n();
  const todayShamsi = formatJalaliHumanTodayLocalized(isFa);
  const currentTabInfo = TABS.find(tab => tab.key === activeTab)!;
  const user = getCurrentUser();
  const memberName = displayName(user?.displayName || '', isFa);

  const nav: ShellNavItem[] = TABS.map(tab => ({
    key: tab.key,
    icon: tab.icon,
    label: t.nav.memberShort[tab.labelKey],
  }));

  return (
    <AppShell
      nav={nav}
      activeKey={activeTab}
      onNavigate={setTab}
      title={t.member.shell[TAB_TITLES[currentTabInfo.labelKey]]}
      subtitle={activeTab === 'home' ? `${memberName} · ${todayShamsi}` : todayShamsi}
      context={getGymName()}
    >
      <PendingPackageBanner />
      {activeTab === 'home' && <Home onNavigateTab={setTab} />}
      {activeTab === 'ses' && <Sessions />}
      {activeTab === 'ex' && <Exercises />}
      {activeTab === 'hist' && <History />}
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
