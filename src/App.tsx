import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { mockStore } from './lib/supabase/mockStore';
import { LoginScreen } from './features/auth/LoginScreen';
import { UserJourneyGuide } from './components/UserJourneyGuide';

// Lazy loading roles for code-splitting (Phase 7 - Hardening)
const OwnerShell = React.lazy(() =>
  import('./features/owner/OwnerShell').then(m => ({ default: m.OwnerShell }))
);
const TrainerShell = React.lazy(() =>
  import('./features/trainer/TrainerShell').then(m => ({ default: m.TrainerShell }))
);
const MemberShell = React.lazy(() =>
  import('./features/member/MemberShell').then(m => ({ default: m.MemberShell }))
);
const UIShowcase = React.lazy(() => import('./pages/dev/UIShowcase'));
import { ThemeToggle } from './components/ui/ThemeToggle';
import { LanguageToggle } from './components/ui/LanguageToggle';
import { LanguageProvider, useI18n } from './components/LanguageProvider';
import { displayName } from './lib/displayName';
import {
  LayoutDashboard,
  Activity,
  User,
  Compass,
  Dumbbell,
  LogOut,
  Eye,
} from 'lucide-react';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { cn } from './lib/utils';

// ── Root: wraps everything in BrowserRouter + LanguageProvider ──
export default function Root() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  );
}

// ── Role-based redirect guard ─────────────────────────────────
function RoleRedirect({ role }: { role: 'owner' | 'trainer' | 'member' }) {
  const defaultPath: Record<string, string> = {
    owner:   '/owner',
    trainer: '/trainer',
    member:  '/member',
  };
  return <Navigate to={defaultPath[role]} replace />;
}

/**
 * محافظ نقش — اگر نقش کاربر واردشده با نقش مسیر جاری یکی نباشد،
 * کاربر به فضای کاری خودش هدایت می‌شود.
 *
 * استثنا: مدیر باشگاه می‌تواند فضای کاری مربی و ورزشکار را پیش‌نمایش کند
 * (قابلیت توسعه‌ای). بقیه نقش‌ها فقط به فضای خودشان دسترسی دارند.
 *
 * بدون این محافظ، ورود با نقش دیگر روی URL قبلی (مثلاً /owner)
 * فضای کاری نقش قبلی را نمایش می‌داد.
 */
function RoleGuard({
  role,
  authUser,
  children,
}: {
  role: 'owner' | 'trainer' | 'member';
  authUser: { role: 'owner' | 'trainer' | 'member' } | null;
  children: React.ReactNode;
}) {
  if (!authUser) {
    return <RoleRedirect role="owner" />;
  }
  if (authUser.role !== role && authUser.role !== 'owner') {
    return <RoleRedirect role={authUser.role} />;
  }
  return <>{children}</>;
}

// ── App shell (needs router context) ─────────────────────────
function App() {
  const [showJourney, setShowJourney] = useState(false);
  const { lang, setLang, t, isFa } = useI18n();
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const previewRole = searchParams.get('preview_role');

  /**
   * کاربر واردشده واقعی (احراز هویت‌شده).
   * جدا از کاربر پیش‌نمایش نگه داشته می‌شود تا محاسبهٔ نقش‌ها حلقهٔ وابستگی نداشته باشد.
   */
  const authUser = mockStore.currentUser;

  /**
   * پیش‌نمایش نقش — فقط مدیر باشگاه اجازهٔ آن را دارد.
   *
   * این پیش‌نمایش هرگز نباید جای ورود را بگیرد: پارامتر ?preview_role در URL
   * به‌تنهایی نباید کاربر را وارد کند. بنابراین فقط وقتی معتبر است که
   * کاربر واقعاً به‌عنوان مدیر وارد شده باشد.
   */
  const previewUser =
    authUser?.role === 'owner' && previewRole
      ? mockStore.users.find(u => u.role === previewRole) ?? null
      : null;

  const currentUser = previewUser || authUser;

  // If not authenticated → login page
  if (!currentUser) {
    return <LoginScreen lang={lang} onLanguageChange={setLang} />;
  }


  // Owner can switch to trainer/member preview; others are locked
  // فقط کاربر واقعیِ مدیر می‌تواند نقش‌ها را جابه‌جا کند.
  // (در حالت پیش‌نمایش، currentUser نقش پیش‌نمایشی‌شده را دارد، پس باید authUser بررسی شود)
  const canSwitchRole = authUser?.role === 'owner';

  function switchTo(role: 'owner' | 'trainer' | 'member') {
    // مدیر باشگاه برای دیدن فضای کاری مربی/ورزشکار باید با یک کاربر واقعی
    // همان نقش پیش‌نمایش کند، وگرنه فضای کاری خالی نمایش داده می‌شود.
    if (authUser?.role === 'owner' && role !== 'owner') {
      navigate(`/${role}?preview_role=${role}`);
    } else {
      navigate(`/${role}`);
    }
  }

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{ background: 'var(--c-surface-0)', color: 'var(--c-text)' }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl px-4 sm:px-8 py-3"
        style={{
          background: 'rgba(255,255,255,0.85)',
          borderColor: 'var(--c-border)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'var(--c-ink)' }}
            >
              <Dumbbell className="w-5 h-5 stroke-[2.4] text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-black text-base tracking-tight leading-none"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {lang === 'fa' ? mockStore.gym.name : displayName(mockStore.gym.name, isFa) || 'Iron Haven Club'}
                </span>
                <Badge variant="brand" size="sm" className="hidden sm:inline-flex">
                  {t.appBadge}
                </Badge>
                {mockStore.isSupabaseConnected && (
                  <span
                    className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      background: 'var(--c-avail-bg)',
                      color: 'var(--c-avail-fg)',
                      borderColor: 'var(--c-avail-fg)',
                    }}
                    title="Connected to Supabase PostgreSQL Database"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: 'var(--c-avail-dot)' }}
                    />
                    <span>{lang === 'fa' ? 'دیتابیس ابری متصل' : 'Supabase Live'}</span>
                  </span>
                )}
              </div>
              <p
                className="text-[10px] font-semibold tracking-wider uppercase leading-none mt-1"
                style={{ color: 'var(--c-text-faint)' }}
              >
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Role switcher — owner only, dev convenience */}
          {canSwitchRole && (
            <div
              className="hidden md:flex items-center p-1 rounded-2xl border shadow-inner"
              style={{ background: 'var(--c-surface-2)', borderColor: 'var(--c-border)' }}
            >
              {(['owner', 'trainer', 'member'] as const).map(role => {
                const Icon = role === 'owner' ? LayoutDashboard : role === 'trainer' ? Activity : User;
                const label = t.roles[role];
                const isActive = location.pathname.startsWith(`/${role}`);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => switchTo(role)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    style={
                      isActive
                        ? { background: 'var(--c-ink)', color: '#fff' }
                        : { color: 'var(--c-text-muted)' }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Right tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJourney(true)}
              className="font-bold"
              style={{ color: 'var(--c-steel)', borderColor: 'var(--c-border)' }}
            >
              <Compass className="w-4 h-4 me-1.5" />
              <span className="hidden sm:inline">{t.userJourney.button}</span>
            </Button>

            <LanguageToggle currentLang={lang} onLanguageChange={setLang} />
            <ThemeToggle />

            <div
              className="flex items-center gap-2.5 border-s ps-3"
              style={{ borderColor: 'var(--c-border)' }}
            >
              <div className="text-end hidden lg:block">
                <span
                  className="text-xs font-black block leading-none"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {displayName(currentUser.displayName, isFa)}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider leading-none mt-1 block"
                  style={{ color: 'var(--c-steel)' }}
                >
                  {currentUser.role === 'owner'
                    ? (lang === 'fa' ? 'مدیریت کل' : 'Gym Owner')
                    : currentUser.role === 'trainer'
                    ? (lang === 'fa' ? 'مربی' : 'Trainer')
                    : (lang === 'fa' ? 'ورزشکار' : 'Member')}
                </span>
                {previewUser && (
                  <span
                    className="text-[10px] font-bold leading-none mt-1 block"
                    style={{ color: 'var(--c-brass)' }}
                  >
                    {lang === 'fa' ? 'حالت پیش‌نمایش' : 'Preview mode'}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  mockStore.logout();
                  // بازگشت به ریشه تا ورود بعدی با نقش جدید از مسیر درست آغاز شود
                  navigate('/');
                }}
                aria-label={lang === 'fa' ? 'خروج از حساب کاربری' : 'Sign Out'}
                className="p-2 rounded-xl"
                style={{ color: 'var(--c-rubber)' }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile role switcher (owner only, dev mode) */}
      {canSwitchRole && (
        <div
          className="md:hidden flex items-center justify-around border-b p-2 text-xs font-bold"
          style={{ background: 'var(--c-surface-2)', borderColor: 'var(--c-border)' }}
        >
          {(['owner', 'trainer', 'member'] as const).map(role => {
            const isActive = location.pathname.startsWith(`/${role}`);
            return (
              <button
                key={role}
                type="button"
                onClick={() => switchTo(role)}
                className="px-3 py-1.5 rounded-xl transition cursor-pointer"
                style={
                  isActive
                    ? { background: 'var(--c-ink)', color: '#fff' }
                    : { color: 'var(--c-text-muted)' }
                }
              >
                {t.roles[role]}
              </button>
            );
          })}
        </div>
      )}

      {/* نشان حالت پیش‌نمایش (فقط مدیر باشگاه) */}
      {previewUser && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-bold"
          style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-brass)' }}
          role="status"
        >
          <Eye size={14} />
          <span>
            {lang === 'fa'
              ? `شما در حال مشاهده فضای کاری «${t.roles[currentUser.role]}» به‌عنوان ${currentUser.displayName} هستید.`
              : `Previewing the ${t.roles[currentUser.role]} workspace as ${currentUser.displayName}.`}
          </span>
        </div>
      )}

      {/* ── Route views ── */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <React.Suspense
          fallback={
            <div
              className="py-24 text-center select-none"
              style={{ color: 'var(--c-text-muted)' }}
            >
              <div
                style={{ borderColor: 'var(--c-ink)' }}
                className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3"
              />
              <span className="text-[14px] font-bold">در حال بارگذاری بخش مورد نظر...</span>
            </div>
          }
        >
          <Routes>
            {/* Default → redirect based on logged-in role */}
            <Route path="/" element={<RoleRedirect role={currentUser.role} />} />

            {/* Owner workspace */}
            <Route
              path="/owner/*"
              element={
                <RoleGuard role="owner" authUser={authUser}>
                  <OwnerShell />
                </RoleGuard>
              }
            />

            {/* Trainer workspace */}
            <Route
              path="/trainer/*"
              element={
                <RoleGuard role="trainer" authUser={authUser}>
                  <TrainerShell />
                </RoleGuard>
              }
            />

            {/* Member workspace */}
            <Route
              path="/member/*"
              element={
                <RoleGuard role="member" authUser={authUser}>
                  <MemberShell />
                </RoleGuard>
              }
            />

            {/* Dev UI Showcase */}
            <Route path="/dev/ui" element={<UIShowcase />} />

            {/* Catch-all */}
            <Route path="*" element={<RoleRedirect role={currentUser.role} />} />
          </Routes>
        </React.Suspense>
      </main>

      {/* User journey guide */}
      {showJourney && (
        <UserJourneyGuide
          lang={lang}
          onClose={() => setShowJourney(false)}
          onSelectRole={role => navigate(`/${role}`)}
        />
      )}
    </div>
  );
}
