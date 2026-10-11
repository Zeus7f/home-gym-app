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
import { formatJalaliHumanToday } from '../../lib/date/jalali';
import { mockStore } from '../../lib/supabase/mockStore';

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
  shortLabel: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dash', icon: LayoutDashboard, shortLabel: 'داشبورد', label: 'داشبورد عملیات' },
  { key: 'sched', icon: CalendarClock, shortLabel: 'برنامه', label: 'برنامه و حضور' },
  { key: 'mem', icon: Users, shortLabel: 'اعضا', label: 'اعضا و بسته‌ها' },
  { key: 'tr', icon: Dumbbell, shortLabel: 'مربیان', label: 'مربیان و تسویه' },
  { key: 'fin', icon: Wallet, shortLabel: 'مالی', label: 'مالی و پرداخت‌ها' },
  { key: 'rep', icon: FileBarChart, shortLabel: 'گزارش', label: 'گزارش‌های عملکرد' },
  { key: 'set', icon: SettingsIcon, shortLabel: 'تنظیمات', label: 'تنظیمات باشگاه' },
];

const MOBILE_TABS: OwnerTabKey[] = ['dash', 'sched', 'mem', 'fin'];

export function OwnerShell() {
  const [activeTab, setActiveTab] = useState<OwnerTabKey>('dash');
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);

  const todayShamsi = formatJalaliHumanToday();
  const currentTitle = NAV_ITEMS.find(n => n.key === activeTab)?.label || 'داشبورد';

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
        <div className="lg:px-6 lg:pt-7 lg:pb-6 md:h-20 md:grid md:place-items-center">
          <div className="hidden lg:block">
            <div className="font-display text-[32px] leading-none text-white">
              هوم‌جیم
            </div>
            <div
              className="mt-1 text-[13px] truncate"
              style={{ color: '#b4c8d6' }}
            >
              {mockStore.gym.name}
            </div>
          </div>
          <span
            style={{ color: 'var(--c-brass)' }}
            className="lg:hidden font-display text-[30px]"
          >
            هـ
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
                className={`w-full flex items-center lg:gap-3 lg:px-3.5 lg:h-11 md:flex-col md:py-2.5 md:gap-1 rounded-xl text-[14px] transition-all cursor-pointer ${
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
                <span className="truncate hidden lg:inline">{item.label}</span>
                <span className="text-[12px] lg:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* پروفایل کاربر در انتهای سایدبار */}
        <div
          style={{ backgroundColor: 'var(--c-deep)' }}
          className="m-3 rounded-xl p-3 flex items-center gap-3 lg:justify-start md:justify-center"
        >
          <Avatar name={mockStore.currentUser?.displayName || 'مدیر'} size={36} tone="brass" />
          <div className="flex-1 min-w-0 hidden lg:block">
            <div className="text-white text-[13px] font-bold truncate">
              {mockStore.currentUser?.displayName || 'مدیریت باشگاه'}
            </div>
            <div className="text-[11px]" style={{ color: '#b4c8d6' }}>
              مدیر ارشد
            </div>
          </div>
          <button
            type="button"
            onClick={() => mockStore.logout()}
            className="hidden lg:block text-[#b4c8d6] hover:text-white transition-colors"
            title="خروج"
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
              {activeTab === 'dash' ? 'عملیات و مدیریت امروز' : currentTitle}
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
                placeholder="جستجو در کل سامانه…"
                className="w-full bg-transparent border-none outline-hidden placeholder:text-slate-400"
              />
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
                className="absolute top-2 left-2 h-2 w-2 rounded-full"
              />
            </button>

            <Btn v="primary" onClick={() => goToTab('sched')}>
              <Plus size={17} />
              <span>نوبت‌دهی جدید</span>
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
              {activeTab === 'dash' ? todayShamsi : mockStore.gym.name}
            </div>
            <div
              className="text-[18px] font-extrabold truncate"
              style={{ color: 'var(--c-deep)' }}
            >
              {activeTab === 'dash' ? 'عملیات امروز' : currentTitle}
            </div>
          </div>

          <button
            type="button"
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 grid place-items-center"
          >
            <Bell size={17} />
          </button>
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
                {item.shortLabel}
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
          <span className="text-[12px]">بیشتر</span>
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
        >
          بخش‌های تکمیلی
        </div>
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
                <span>{item.label}</span>
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
