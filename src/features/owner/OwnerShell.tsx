import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Dumbbell,
  Wallet,
  FileBarChart,
  Settings as SettingsIcon,
  Plus,
} from 'lucide-react';
import { Btn } from '../../components/ui/Btn';
import { AppShell, type ShellNavItem } from '../../components/shell/AppShell';
import { MemberSheet, MemberData } from './components/MemberSheet';
import { formatJalaliHumanTodayLocalized } from '../../lib/date/jalali';
import { useI18n } from '../../components/LanguageProvider';
import { getGym } from '../../api/gym';
import { getMembers } from '../../api/members';
import { subscribeToStore } from '../../api/auth';
import { resolveTab } from '../../lib/navigation';
import { useIsMobile } from '../../lib/useMediaQuery';
import { useTabParam } from '../../lib/useTabParam';

// صفحات اپ مدیر
import { Dash } from './pages/Dash';
import { Sched } from './pages/Sched';
import { Members } from './pages/Members';
import { Trainers } from './pages/Trainers';
import { Finance } from './pages/Finance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export type OwnerTabKey = 'dash' | 'sched' | 'mem' | 'tr' | 'fin' | 'rep' | 'set';

type LabelKey = 'dashboard' | 'members' | 'trainers' | 'schedule' | 'finance' | 'reports' | 'settings';

const NAV: { key: OwnerTabKey; icon: React.ElementType; labelKey: LabelKey }[] = [
  { key: 'dash', icon: LayoutDashboard, labelKey: 'dashboard' },
  { key: 'sched', icon: CalendarClock, labelKey: 'schedule' },
  { key: 'mem', icon: Users, labelKey: 'members' },
  { key: 'tr', icon: Dumbbell, labelKey: 'trainers' },
  { key: 'fin', icon: Wallet, labelKey: 'finance' },
  { key: 'rep', icon: FileBarChart, labelKey: 'reports' },
  { key: 'set', icon: SettingsIcon, labelKey: 'settings' },
];

const MOBILE_TABS: OwnerTabKey[] = ['dash', 'sched', 'mem', 'fin'];

const OWNER_TAB_KEYS = NAV.map(n => n.key);
/** نام‌های کامل مقصد (مثلاً از اعلان‌ها) به کلید تب مالک */
const OWNER_TAB_ALIASES: Partial<Record<string, OwnerTabKey>> = {
  dashboard: 'dash',
  schedule: 'sched',
  members: 'mem',
  trainers: 'tr',
  finance: 'fin',
  reports: 'rep',
  settings: 'set',
};
const toOwnerTab = (raw: string | null | undefined) =>
  resolveTab(raw, OWNER_TAB_KEYS, 'dash', OWNER_TAB_ALIASES);

export function OwnerShell() {
  const [activeTab, setTab] = useTabParam(toOwnerTab);
  const isMobile = useIsMobile();
  const { t, isFa } = useI18n();
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [gymName, setGymName] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  React.useEffect(() => {
    getGym().then(g => setGymName(g?.name ?? ''));
    const refresh = () => getMembers().then(ms => setPendingCount(ms.filter(m => m.packagePending).length));
    refresh();
    return subscribeToStore(refresh);
  }, []);

  const nav: ShellNavItem[] = NAV.map(n => ({
    key: n.key,
    icon: n.icon,
    label: t.nav.owner[n.labelKey],
    short: t.nav.ownerShort[n.labelKey],
    badge: n.key === 'mem' ? pendingCount : undefined,
  }));
  const current = NAV.find(n => n.key === activeTab)!;
  const title = activeTab === 'dash' ? t.owner.shell.todayOps : t.nav.owner[current.labelKey];

  return (
    <AppShell
      nav={nav}
      mobileKeys={MOBILE_TABS}
      activeKey={activeTab}
      onNavigate={setTab}
      title={title}
      subtitle={activeTab === 'dash' ? formatJalaliHumanTodayLocalized(isFa) : gymName}
      context={gymName}
      actions={
        activeTab !== 'sched' && (
          <Btn v="primary" onClick={() => setTab('sched')} className="h-10 !px-3 sm:!px-4" aria-label={t.owner.shell.newBooking}>
            <Plus size={17} />
            <span className="hidden sm:inline">{t.owner.shell.newBooking}</span>
          </Btn>
        )
      }
    >
      {activeTab === 'dash' && <Dash onNavigate={setTab} onOpenMember={setSelectedMember} isMobile={isMobile} />}
      {activeTab === 'sched' && <Sched isMobile={isMobile} />}
      {activeTab === 'mem' && <Members onOpenMember={setSelectedMember} isMobile={isMobile} />}
      {activeTab === 'tr' && <Trainers isMobile={isMobile} />}
      {activeTab === 'fin' && <Finance isMobile={isMobile} />}
      {activeTab === 'rep' && <Reports isMobile={isMobile} />}
      {activeTab === 'set' && <Settings isMobile={isMobile} />}

      {/* کشوی اطلاعات عضو (MemberSheet) */}
      <MemberSheet member={selectedMember} onClose={() => setSelectedMember(null)} isMobile={isMobile} />
    </AppShell>
  );
}
