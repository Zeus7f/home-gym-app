import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Dumbbell,
  Wallet,
  FileBarChart,
  Settings as SettingsIcon,
  Search,
  Plus,
  LogOut,
  MoreHorizontal,
  Bell,
  ChevronLeft,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Btn } from '../../components/ui/Btn';
import { Sheet } from './components/Sheet';
import { MemberSheet, MemberData } from './components/MemberSheet';
import { formatJalaliHumanTodayLocalized } from '../../lib/date/jalali';
import { getCurrentUser, logout } from '../../api/auth';
import { useI18n } from '../../components/LanguageProvider';
import { displayName } from '../../lib/displayName';
import { getGym } from '../../api/gym';
import { NotificationBell } from '../../components/ui/NotificationBell';

// صفحات اپ مدیر
import { Dash } from './pages/Dash';
import { Sched } from './pages/Sched';
import { Members } from './pages/Members';
import { Trainers } from './pages/Trainers';
import { Finance } from './pages/Finance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export type OwnerTabKey =
  | 'dash'
  | 'sched'
  | 'mem'
  | 'tr'
  | 'fin'
  | 'rep'
  | 'set';

interface NavItem {
  key: OwnerTabKey;
  icon: React.ElementType;
  /** کلید برچسب کامل در فرهنگ لغت */
  labelKey: 'dashboard' | 'members' | 'trainers' | 'schedule' | 'finance' | 'reports' | 'settings';
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dash', icon: LayoutDashboard, labelKey: 'dashboard' },
  { key: 'sched', icon: CalendarClock, labelKey: 'schedule' },
  { key: 'mem', icon: Users, labelKey: 'members' },
  { key: 'tr', icon: Dumbbell, labelKey: 'trainers' },
  { key: 'fin', icon: Wallet, labelKey: 'finance' },
  { key: 'rep', icon: FileBarChart, labelKey: 'reports' },
  { key: 'set', icon: SettingsIcon, labelKey: 'settings' },
];

const MOBILE_TABS: OwnerTabKey[] = ['dash', 'sched', 'mem', 'fin'];

export function OwnerShell() {
  const [activeTab, setActiveTab] = useState<OwnerTabKey>('dash');
  const { t, isFa } = useI18n();
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [gymName, setGymName] = useState('Iron Haven Fitness Club');

  const todayShamsi = formatJalaliHumanTodayLocalized(isFa);
  const currentNav = NAV_ITEMS.find(n => n.key === activeTab);
  const currentTitle = currentNav ? t.nav.owner[currentNav.labelKey] : t.nav.owner.dashboard;
  const currentUserName = displayName(getCurrentUser()?.displayName || t.owner.shell.seniorOwner, isFa);

  React.useEffect(() => {
    getGym().then(g => {
      if (g?.name) setGymName(g.name);
    });
  }, []);

  const goToTab = (key: OwnerTabKey) => {
    setActiveTab(key);
    setShowMoreSheet(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col md:flex-row bg-[var(--c-surface-0)] rounded-2xl overflow-hidden border border-[var(--c-border)] shadow-xs">
      {/* ─────────────────────────────────────────────────────────────
          ۱. سایدبار دسکتاپ (>= 1024px) و ریل تبلت (768px - 1023px)
         ───────────────────────────────────────────────────────────── */}
      <aside
        style={{
          backgroundColor: 'var(--c-ink)',
          color: '#dbe5ec',
        }}
        className="hidden md:flex flex-col shrink-0 lg:w-60 md:w-[84px] transition-all duration-200 select-none"
      >
        {/* برند و لوگو */}
        <div className="md:h-20 md:grid md:place-items-center lg:block lg:h-auto lg:text-start lg:px-5 lg:pt-6 lg:pb-5">
          <div className="hidden lg:block min-w-0 overflow-hidden">
            <div className="font-display text-[28px] leading-tight text-white font-bold">
              {t.owner.shell.brand}
            </div>
            <div
              className="mt-1 text-[12px] truncate font-medium max-w-[190px]"
              title={gymName}
              style={{ color: '#b4c8d6' }}
            >
              {gymName}
            </div>
          </div>
          <span
            style={{ color: 'var(--c-brass)' }}
            className="lg:hidden font-display text-[28px] font-bold"
          >{isFa ? 'هـ' : 'HG'}
          </span>
        </div>

        {/* منوهای سایدبار */}
        <nav className="flex-1 lg:px-3 md:px-2 space-y-1.5 mt-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => goToTab(item.key)}
                style={{
                  backgroundColor: isActive
                    ? 'var(--c-deep)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#dbe5ec',
                }}
                className={`w-full flex items-center md:flex-col md:justify-center md:py-2.5 md:gap-1.5 md:h-auto lg:flex-row lg:justify-start lg:gap-3 lg:px-3.5 lg:py-0 lg:h-11 rounded-xl text-[14px] transition-all cursor-pointer ${
                  isActive
                    ? 'font-bold shadow-[inset_-3px_0_0_var(--c-brass)]'
                    : 'hover:bg-white/10'
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={{ color: isActive ? 'var(--c-brass)' : 'currentColor' }}
                  className="shrink-0"
                />
                <span className="hidden lg:inline-block truncate text-[13.5px] font-medium leading-none text-start flex-1">
                  {t.nav.owner[item.labelKey]}
                </span>
                <span className="text-[11px] font-medium leading-none lg:hidden">
                  {t.nav.ownerShort[item.labelKey]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* پروفایل کاربر در انتهای سایدبار */}
        <div
          style={{ backgroundColor: 'var(--c-deep)' }}
          className="m-3 rounded-xl p-3 flex items-center gap-3 lg:justify-start md:justify-center"
        >
          <Avatar name={currentUserName} size={36} tone="brass" />
          <div className="flex-1 min-w-0 hidden lg:block">
            <div className="text-white text-[13px] font-bold truncate">
              {currentUserName}
            </div>
            <div className="text-[11px]" style={{ color: '#b4c8d6' }}>
              {t.owner.shell.seniorOwner}
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="hidden lg:block text-[#b4c8d6] hover:text-white transition-colors"
            title={t.owner.shell.signOut}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          ۲. محتوای اصلی (Header + Body)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* سربرگ دسکتاپ و تبلت */}
        <header
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="hidden md:flex h-[74px] shrink-0 items-center justify-between gap-4 px-6 lg:px-8 border-b"
        >
          <div className="min-w-0">
            <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
              {todayShamsi}
            </div>
            <h1
              className="text-[21px] font-extrabold truncate"
              style={{ color: 'var(--c-deep)' }}
            >
              {activeTab === 'dash' ? t.owner.shell.todayOps : currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: 'var(--c-surface-2)',
                borderColor: 'var(--c-border)',
              }}
              className="hidden lg:flex items-center gap-2 h-10 px-3.5 w-64 rounded-xl border text-[13px]"
            >
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder={t.owner.shell.searchPlaceholder}
                className="w-full bg-transparent border-none outline-hidden placeholder:text-slate-400"
              />
            </div>

            <NotificationBell
              onNavigateTab={t => goToTab(t as OwnerTabKey)}
              badgeOnlyWhenUrgent
            />

            <Btn v="primary" onClick={() => goToTab('sched')}>
              <Plus size={17} />
              <span>{t.owner.shell.newBooking}</span>
            </Btn>
          </div>
        </header>

        {/* سربرگ مخصوص موبایل */}
        <header
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="md:hidden pt-4 px-4 pb-3 border-b flex items-center justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[12px]" style={{ color: 'var(--c-text-muted)' }}>
              {activeTab === 'dash' ? todayShamsi : gymName}
            </div>
            <div
              className="text-[18px] font-extrabold truncate"
              style={{ color: 'var(--c-deep)' }}
            >
              {activeTab === 'dash' ? t.owner.shell.todayOps : currentTitle}
            </div>
          </div>

          <NotificationBell
            onNavigateTab={t => goToTab(t as OwnerTabKey)}
            badgeOnlyWhenUrgent
            className="!h-9 !w-9"
          />
        </header>

        {/* بدنه اسکرول‌پذیر صفحه فعال */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8 thin-scroll">
          {activeTab === 'dash' && (
            <Dash
              onNavigate={key => goToTab(key as OwnerTabKey)}
              onOpenMember={setSelectedMember}
            />
          )}
          {activeTab === 'sched' && <Sched />}
          {activeTab === 'mem' && <Members onOpenMember={setSelectedMember} />}
          {activeTab === 'tr' && <Trainers />}
          {activeTab === 'fin' && <Finance />}
          {activeTab === 'rep' && <Reports />}
          {activeTab === 'set' && <Settings />}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ۳. منوی ناوبری موبایل (Bottom Tabs) + دکمه شناور FAB
         ───────────────────────────────────────────────────────────── */}
      <nav
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t grid grid-cols-5 pt-1.5 pb-4 select-none shadow-lg"
      >
        {MOBILE_TABS.map(key => {
          const item = NAV_ITEMS.find(n => n.key === key)!;
          const Icon = item.icon;
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => goToTab(key)}
              style={{
                color: isActive ? 'var(--c-ink)' : 'var(--c-text-muted)',
              }}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <span
                style={{
                  backgroundColor: isActive ? 'var(--c-surface-3)' : 'transparent',
                }}
                className="h-8 w-12 rounded-full grid place-items-center transition-colors"
              >
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
              </span>
              <span className={`text-[12px] ${isActive ? 'font-bold' : ''}`}>
                {t.nav.ownerShort[item.labelKey]}
              </span>
            </button>
          );
        })}

        {/* دکمه "بیشتر" برای مربیان، گزارش‌ها و تنظیمات */}
        <button
          type="button"
          onClick={() => setShowMoreSheet(true)}
          style={{
            color: ['tr', 'rep', 'set'].includes(activeTab)
              ? 'var(--c-ink)'
              : 'var(--c-text-muted)',
          }}
          className="flex flex-col items-center gap-1 cursor-pointer"
        >
          <span
            style={{
              backgroundColor: ['tr', 'rep', 'set'].includes(activeTab)
                ? 'var(--c-surface-3)'
                : 'transparent',
            }}
            className="h-8 w-12 rounded-full grid place-items-center"
          >
            <MoreHorizontal size={19} />
          </span>
          <span className="text-[12px]">{t.owner.shell.more}</span>
        </button>
      </nav>

      {/* باتم‌شیت بخش‌های بیشتر در موبایل */}
      <Sheet
        open={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        isMobile
      >
        <div
          className="text-[17px] font-bold mb-3"
          style={{ color: 'var(--c-deep)' }}
        >{t.owner.shell.moreSheetTitle}</div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {NAV_ITEMS.filter(n => !MOBILE_TABS.includes(n.key)).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => goToTab(item.key)}
                className="w-full flex items-center gap-3.5 h-14 text-[15px] font-semibold text-slate-800 dark:text-slate-100 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-ink)',
                  }}
                  className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
                >
                  <Icon size={19} />
                </span>
                <span>{t.nav.owner[item.labelKey]}</span>
                <ChevronLeft size={18} className="ms-auto text-slate-400" />
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* کشوی اطلاعات عضو (MemberSheet) */}
      <MemberSheet
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}
