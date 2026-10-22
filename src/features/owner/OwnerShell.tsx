import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
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
import { useIsMobile } from '../../lib/useMediaQuery';
import { useSection } from '../../lib/useSection';
import type { Section } from '../../lib/routes';

// صفحات اپ مدیر
import { Dash } from './pages/Dash';
import { Sched } from './pages/Sched';
import { Members } from './pages/Members';
import { Trainers } from './pages/Trainers';
import { Finance } from './pages/Finance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

type OwnerSection = Section<'owner'>;
type LabelKey = 'dashboard' | 'members' | 'trainers' | 'schedule' | 'finance' | 'reports' | 'settings';

const NAV: { key: OwnerSection; icon: React.ElementType; labelKey: LabelKey }[] = [
  { key: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { key: 'schedule', icon: CalendarClock, labelKey: 'schedule' },
  { key: 'memberships', icon: Users, labelKey: 'members' },
  { key: 'trainers', icon: Dumbbell, labelKey: 'trainers' },
  { key: 'finance', icon: Wallet, labelKey: 'finance' },
  { key: 'analytics', icon: FileBarChart, labelKey: 'reports' },
  { key: 'settings', icon: SettingsIcon, labelKey: 'settings' },
];

const MOBILE_TABS: OwnerSection[] = ['dashboard', 'schedule', 'memberships', 'finance'];

/**
 * /owner/:section — داشبورد، برنامه، اعضا (/owner/memberships/:memberId)، مربیان، مالی، گزارش‌ها، تنظیمات.
 */
export function OwnerShell() {
  const { section, sub, go, linkTo, redirectTo } = useSection('owner');
  const isMobile = useIsMobile();
  const { t, isFa } = useI18n();
  const [gymName, setGymName] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [members, setMembers] = useState<MemberData[]>([]);

  React.useEffect(() => {
    const refresh = () => {
      getGym().then(g => setGymName(g?.name ?? ''));
      getMembers().then(ms => {
        setMembers(ms);
        setPendingCount(ms.filter(m => m.packagePending).length);
      });
    };
    refresh();
    return subscribeToStore(refresh);
  }, []);

  if (redirectTo) return <Navigate to={redirectTo} replace />;

  // جزئیات ورزشکار آدرس خودش را دارد: /owner/memberships/:memberId
  const memberId = section === 'memberships' ? sub[0] : undefined;
  const selectedMember = memberId ? members.find(m => m.id === memberId) ?? { id: memberId } : null;
  const openMember = (m: MemberData) => go('memberships', m.id);

  const nav: ShellNavItem[] = NAV.map(n => ({
    key: n.key,
    icon: n.icon,
    label: t.nav.owner[n.labelKey],
    short: t.nav.ownerShort[n.labelKey],
    badge: n.key === 'memberships' ? pendingCount : undefined,
    to: linkTo(n.key),
  }));
  const current = NAV.find(n => n.key === section)!;
  const title = section === 'dashboard' ? t.owner.shell.todayOps : t.nav.owner[current.labelKey];

  return (
    <AppShell
      nav={nav}
      mobileKeys={MOBILE_TABS}
      activeKey={section}
      onNavigate={key => go(key)}
      title={title}
      subtitle={section === 'dashboard' ? formatJalaliHumanTodayLocalized(isFa) : gymName}
      context={gymName}
      actions={
        section !== 'schedule' && (
          <Btn v="primary" onClick={() => go('schedule')} className="h-10 !px-3 sm:!px-4" aria-label={t.owner.shell.newBooking}>
            <Plus size={17} />
            <span className="hidden sm:inline">{t.owner.shell.newBooking}</span>
          </Btn>
        )
      }
    >
      {section === 'dashboard' && <Dash onNavigate={key => go(key)} onOpenMember={openMember} isMobile={isMobile} />}
      {section === 'schedule' && <Sched isMobile={isMobile} />}
      {section === 'memberships' && <Members onOpenMember={openMember} isMobile={isMobile} />}
      {section === 'trainers' && <Trainers isMobile={isMobile} />}
      {section === 'finance' && <Finance isMobile={isMobile} />}
      {section === 'analytics' && <Reports isMobile={isMobile} />}
      {section === 'settings' && <Settings isMobile={isMobile} />}

      {/* کشوی اطلاعات عضو — بسته شدن، به فهرست اعضا برمی‌گردد */}
      <MemberSheet member={selectedMember} onClose={() => go('memberships')} isMobile={isMobile} />
    </AppShell>
  );
}
