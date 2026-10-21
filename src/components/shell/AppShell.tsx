/**
 * src/components/shell/AppShell.tsx
 * پوستهٔ واحد همهٔ نقش‌ها — جایگزین هدر سراسری App و سه پوستهٔ جداگانه.
 *
 *   ≥ lg : سایدبار تیرهٔ برند + هدر فشرده
 *   < lg : هدر فشرده + نوار ناوبری پایین (حداکثر ۴ مورد + «بیشتر»)
 *
 * ضدسرریز: همهٔ فرزندان flex با min-w-0، main با overflow-x-clip، متن‌ها truncate.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Dumbbell, LogOut, MoreHorizontal, Compass, Eye, ChevronLeft, ChevronRight, X, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useI18n } from '../LanguageProvider';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationBell } from '../ui/NotificationBell';
import { Sheet } from '../../features/owner/components/Sheet';
import { displayName } from '../../lib/displayName';
import { cn } from '../../lib/utils';
import type { AppRole } from '../../lib/auth/permissions';
import type { UserAccount } from '../../lib/domain/gymManagement';
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from '../../lib/data/cloudSync';

// ── زمینهٔ پوسته: کاربر، پیش‌نمایش و کنش‌های سراسری (از App) ─────────────────

export interface ShellChrome {
  /** کاربر واقعیِ واردشده */
  user: UserAccount;
  /** هویت فعال (کاربر پیش‌نمایش یا خود کاربر) */
  acting: UserAccount;
  previewing: boolean;
  /** نقش‌هایی که کاربر می‌تواند به‌عنوان آن‌ها مشاهده کند */
  viewAsRoles: AppRole[];
  onViewAs: (role: AppRole) => void;
  onExitPreview: () => void;
  onShowGuide: () => void;
  onLogout: () => void;
}

const ShellChromeContext = createContext<ShellChrome | null>(null);
export const ShellChromeProvider = ShellChromeContext.Provider;

export interface ShellNavItem {
  key: string;
  icon: React.ElementType;
  label: string;
  /** برچسب کوتاه برای نوار پایین موبایل */
  short?: string;
  /** عدد یا نقطهٔ هشدار کنار مورد */
  badge?: number;
}

export interface AppShellProps {
  nav: ShellNavItem[];
  /** کلیدهایی که در نوار پایین موبایل دیده می‌شوند (بقیه در «بیشتر») */
  mobileKeys?: string[];
  activeKey: string;
  onNavigate: (key: string) => void;
  title: string;
  subtitle?: string;
  /** زیرعنوان برند در سایدبار (نام باشگاه) */
  context?: string;
  /** دکمه‌های عمل اصلی صفحه در هدر (در موبایل فقط آیکن) */
  actions?: React.ReactNode;
  /** نمایش زنگ اعلان */
  notifications?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  nav,
  mobileKeys,
  activeKey,
  onNavigate,
  title,
  subtitle,
  context,
  actions,
  notifications = true,
  children,
}: AppShellProps) {
  const { t, isFa } = useI18n();
  const chrome = useContext(ShellChromeContext);
  const [moreOpen, setMoreOpen] = useState(false);

  const bottomKeys = (mobileKeys ?? nav.map(n => n.key)).slice(0, nav.length > 5 ? 4 : 5);
  const bottomItems = nav.filter(n => bottomKeys.includes(n.key));
  const moreItems = nav.filter(n => !bottomKeys.includes(n.key));
  const moreActive = moreItems.some(n => n.key === activeKey);

  const go = (key: string) => {
    setMoreOpen(false);
    onNavigate(key);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  const Chevron = isFa ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-dvh flex bg-[var(--c-surface-0)] text-[var(--c-text)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[60] focus:rounded-lg focus:bg-[var(--c-ink)] focus:px-3 focus:py-2 focus:text-white"
      >
        {t.shell.skipToContent}
      </a>

      {/* ── سایدبار دسکتاپ ───────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-dvh select-none"
        style={{ backgroundColor: 'var(--c-chrome)', color: '#dbe5ec' }}
      >
        <div className="px-5 pt-6 pb-5 flex items-center gap-3 min-w-0">
          <span
            className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
            style={{ backgroundColor: 'var(--c-chrome-2)', color: 'var(--c-brass)' }}
          >
            <Dumbbell size={20} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <div className="text-white font-extrabold text-[17px] leading-tight truncate">{t.shell.brand}</div>
            {context && (
              <div className="text-[12px] truncate mt-0.5" style={{ color: '#b4c8d6' }} title={context}>
                {context}
              </div>
            )}
          </div>
        </div>

        <nav aria-label={t.shell.mainNav} className="flex-1 overflow-y-auto px-3 space-y-1 thin-scroll">
          {nav.map(item => {
            const Icon = item.icon;
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.key)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'w-full h-11 px-3.5 rounded-xl flex items-center gap-3 text-[14px] transition-colors cursor-pointer',
                  active ? 'font-bold text-white shadow-[inset_-3px_0_0_var(--c-brass)]' : 'hover:bg-white/10'
                )}
                style={{ backgroundColor: active ? 'var(--c-chrome-2)' : undefined }}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? 'var(--c-brass)' : undefined }} />
                <span className="truncate flex-1 text-start">{item.label}</span>
                {!!item.badge && <NavBadge value={item.badge} />}
              </button>
            );
          })}
        </nav>

        {chrome && (
          <div className="m-3 rounded-xl p-3 flex items-center gap-3 min-w-0" style={{ backgroundColor: 'var(--c-chrome-2)' }}>
            <Avatar name={displayName(chrome.user.displayName, isFa)} size={36} tone="brass" />
            <div className="flex-1 min-w-0">
              <div className="text-white text-[13px] font-bold truncate">{displayName(chrome.user.displayName, isFa)}</div>
              <div className="text-[11px] truncate" style={{ color: '#b4c8d6' }}>{t.roles[chrome.user.role]}</div>
            </div>
            <button
              type="button"
              onClick={chrome.onLogout}
              className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10 cursor-pointer"
              style={{ color: '#b4c8d6' }}
              aria-label={t.shell.signOut}
              title={t.shell.signOut}
            >
              <LogOut size={16} className={isFa ? '' : 'rotate-180'} />
            </button>
          </div>
        )}
      </aside>

      {/* ── ستون محتوا ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-30 border-b backdrop-blur-xl"
          style={{
            background: 'color-mix(in srgb, var(--c-surface-1) 88%, transparent)',
            borderColor: 'var(--c-border)',
          }}
        >
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-3 min-w-0">
            <span
              className="lg:hidden h-9 w-9 rounded-xl grid place-items-center shrink-0"
              style={{ backgroundColor: 'var(--c-chrome)', color: 'var(--c-brass)' }}
              aria-hidden
            >
              <Dumbbell size={17} strokeWidth={2.4} />
            </span>
            <div className="flex-1 min-w-0">
              {subtitle && (
                <div className="text-[12px] truncate leading-tight" style={{ color: 'var(--c-text-muted)' }}>
                  {subtitle}
                </div>
              )}
              <h1 className="text-[17px] sm:text-[19px] font-extrabold truncate leading-tight" style={{ color: 'var(--c-heading)' }}>
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SyncIndicator />
              {actions}
              {notifications && <NotificationBell onNavigateTab={go} badgeOnlyWhenUrgent className="!h-10 !w-10" />}
              {chrome && <UserMenu chrome={chrome} />}
            </div>
          </div>
        </header>

        {chrome?.previewing && (
          <div
            className="px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-[13px] font-semibold min-w-0"
            style={{ backgroundColor: 'var(--c-status-live-bg)', color: 'var(--c-status-live-fg)' }}
            role="status"
          >
            <Eye size={15} className="shrink-0" />
            <span className="truncate flex-1">
              {t.shell.previewBanner
                .replace('{name}', displayName(chrome.acting.displayName, isFa))
                .replace('{role}', t.roles[chrome.acting.role])}
            </span>
            <button type="button" onClick={chrome.onExitPreview} className="underline underline-offset-2 shrink-0 cursor-pointer">
              {t.shell.exitPreview}
            </button>
          </div>
        )}

        <main id="main" className="flex-1 min-w-0 overflow-x-clip">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28 lg:pb-10">{children}</div>
        </main>
      </div>

      {/* ── نوار پایین موبایل ───────────────────────────────────────── */}
      <nav
        aria-label={t.shell.mainNav}
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t select-none"
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        }}
      >
        <div
          className="grid pt-1.5"
          style={{ gridTemplateColumns: `repeat(${bottomItems.length + (moreItems.length ? 1 : 0)}, minmax(0, 1fr))` }}
        >
          {bottomItems.map(item => (
            <BottomTab
              key={item.key}
              icon={item.icon}
              label={item.short ?? item.label}
              active={item.key === activeKey}
              badge={item.badge}
              onClick={() => go(item.key)}
            />
          ))}
          {moreItems.length > 0 && (
            <BottomTab icon={MoreHorizontal} label={t.shell.more} active={moreActive} onClick={() => setMoreOpen(true)} />
          )}
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} isMobile>
        <div className="text-[17px] font-bold mb-2" style={{ color: 'var(--c-heading)' }}>
          {t.shell.moreTitle}
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--c-border)' }}>
          {moreItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.key)}
                className="w-full flex items-center gap-3.5 h-14 text-[15px] font-semibold cursor-pointer"
                style={{ color: 'var(--c-text)' }}
              >
                <span className="h-10 w-10 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-ink)' }}>
                  <Icon size={19} />
                </span>
                <span className="truncate">{item.label}</span>
                {!!item.badge && <NavBadge value={item.badge} />}
                <Chevron size={18} className="ms-auto shrink-0" style={{ color: 'var(--c-text-faint)' }} />
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

function NavBadge({ value }: { value: number }) {
  const { isFa } = useI18n();
  return (
    <span
      className="min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold grid place-items-center shrink-0"
      style={{ backgroundColor: 'var(--c-rubber)', color: '#fff' }}
    >
      {new Intl.NumberFormat(isFa ? 'fa-IR' : 'en-US').format(value)}
    </span>
  );
}

function BottomTab({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="min-w-0 flex flex-col items-center gap-1 py-1 cursor-pointer"
      style={{ color: active ? 'var(--c-ink)' : 'var(--c-text-muted)' }}
    >
      <span
        className="relative h-8 w-12 rounded-full grid place-items-center transition-colors"
        style={{ backgroundColor: active ? 'var(--c-surface-3)' : 'transparent' }}
      >
        <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
        {!!badge && (
          <span className="absolute top-0.5 end-2 h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--c-rubber)' }} />
        )}
      </span>
      <span className={cn('text-[11.5px] leading-tight truncate max-w-full px-0.5', active && 'font-bold')}>{label}</span>
    </button>
  );
}

/** وضعیت ذخیرهٔ ابری — فقط وقتی دادهٔ باشگاه از Supabase بار شده باشد */
function SyncIndicator() {
  const { t } = useI18n();
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());
  useEffect(() => subscribeSyncStatus(() => setStatus(getSyncStatus())), []);
  if (status === 'idle') return null;

  const map = {
    saving: { icon: Loader2, label: t.shell.syncSaving, color: 'var(--c-text-muted)', spin: true },
    saved: { icon: Cloud, label: t.shell.syncSaved, color: 'var(--c-avail-fg)', spin: false },
    error: { icon: CloudOff, label: t.shell.syncError, color: 'var(--c-rubber)', spin: false },
  } as const;
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className="h-10 w-10 grid place-items-center" title={s.label} role="status" aria-label={s.label}>
      <Icon size={18} style={{ color: s.color }} className={s.spin ? 'animate-spin' : ''} />
    </span>
  );
}

/** منوی حساب: پیش‌نمایش نقش، ظاهر، زبان، راهنما و خروج */
function UserMenu({ chrome }: { chrome: ShellChrome }) {
  const { t, isFa, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = displayName(chrome.user.displayName, isFa);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item = 'w-full min-h-11 px-3 rounded-xl flex items-center gap-3 text-[14px] font-semibold cursor-pointer hover:bg-[var(--c-surface-2)]';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.shell.openMenu}
        className="h-10 w-10 grid place-items-center rounded-full cursor-pointer"
      >
        <Avatar name={name} size={36} tone={chrome.previewing ? 'brass' : 'ink'} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-12 end-0 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl p-2"
          style={{ backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border)' }}
        >
          <div className="px-3 py-2.5 flex items-center gap-3 min-w-0">
            <Avatar name={name} size={40} tone="ink" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[14px] truncate" style={{ color: 'var(--c-heading)' }}>{name}</div>
              <div className="text-[12px] truncate" style={{ color: 'var(--c-text-muted)' }}>
                {t.roles[chrome.user.role]}
                {chrome.user.phone ? ` · ${chrome.user.phone}` : ''}
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="lg:hidden h-9 w-9 grid place-items-center rounded-lg" aria-label={t.actions.close}>
              <X size={16} />
            </button>
          </div>

          {chrome.viewAsRoles.length > 0 && (
            <div className="px-3 pt-2 pb-1">
              <div className="text-[11px] font-bold mb-1.5" style={{ color: 'var(--c-text-muted)' }}>{t.shell.viewAs}</div>
              <div className="flex flex-wrap gap-1.5">
                {chrome.viewAsRoles.map(role => {
                  const active = chrome.acting.role === role && chrome.previewing;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        chrome.onViewAs(role);
                      }}
                      className="h-9 px-3 rounded-lg text-[13px] font-bold border cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--c-ink)' : 'var(--c-surface-2)',
                        color: active ? '#fff' : 'var(--c-ink)',
                        borderColor: 'var(--c-border)',
                      }}
                    >
                      {t.roles[role]}
                    </button>
                  );
                })}
              </div>
              {chrome.previewing && (
                <button type="button" onClick={() => { setOpen(false); chrome.onExitPreview(); }} className={cn(item, 'mt-1 !px-0 !min-h-9 text-[13px]')} style={{ color: 'var(--c-steel)' }}>
                  {t.shell.exitPreview}
                </button>
              )}
            </div>
          )}

          <div className="my-1.5 border-t" style={{ borderColor: 'var(--c-border)' }} />

          <div className="px-3 py-1.5 flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--c-text-muted)' }}>{t.shell.theme}</span>
            <ThemeToggle />
          </div>
          <div className="px-3 py-1.5 flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--c-text-muted)' }}>{t.shell.language}</span>
            <div className="flex p-1 rounded-xl border" style={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)' }}>
              {(['fa', 'en'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className="h-7 px-2.5 rounded-lg text-[12px] font-bold cursor-pointer"
                  style={{
                    backgroundColor: lang === l ? 'var(--c-surface-1)' : 'transparent',
                    color: lang === l ? 'var(--c-ink)' : 'var(--c-text-muted)',
                  }}
                >
                  {l === 'fa' ? 'فارسی' : 'EN'}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1.5 border-t" style={{ borderColor: 'var(--c-border)' }} />

          <button type="button" role="menuitem" className={item} style={{ color: 'var(--c-text)' }} onClick={() => { setOpen(false); chrome.onShowGuide(); }}>
            <Compass size={17} /> {t.shell.guide}
          </button>
          <button type="button" role="menuitem" className={item} style={{ color: 'var(--c-rubber)' }} onClick={() => { setOpen(false); chrome.onLogout(); }}>
            <LogOut size={17} className={isFa ? '' : 'rotate-180'} /> {t.shell.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
