import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { mockStore } from './lib/supabase/mockStore';
import { LoginScreen } from './features/auth/LoginScreen';
import { initAuth, isAuthReady, logout } from './api/auth';
import { can, HOME_PATH, type AppRole } from './lib/auth/permissions';
import { UserJourneyGuide } from './components/UserJourneyGuide';
import { ShellChromeProvider, type ShellChrome } from './components/shell/AppShell';
import { LanguageProvider, useI18n } from './components/LanguageProvider';

// Lazy loading roles for code-splitting (Phase 7 - Hardening)
const AdminShell = React.lazy(() =>
  import('./features/admin/AdminShell').then(m => ({ default: m.AdminShell }))
);
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
function RoleRedirect({ role }: { role: AppRole }) {
  return <Navigate to={HOME_PATH[role]} replace />;
}

/**
 * محافظ نقش — اگر نقش کاربر واردشده با نقش مسیر جاری یکی نباشد،
 * کاربر به فضای کاری خودش هدایت می‌شود.
 *
 * استثنا: نقش‌هایی که `role.preview` دارند (مدیر باشگاه و مدیر کل) می‌توانند
 * فضای کاری نقش‌های پایین‌تر را با یک هویت پیش‌نمایش ببینند.
 */
function RoleGuard({
  role,
  authUser,
  previewRole,
  children,
}: {
  role: AppRole;
  authUser: { role: AppRole } | null;
  /** نقش کاربر پیش‌نمایش فعال */
  previewRole?: AppRole | null;
  children: React.ReactNode;
}) {
  if (!authUser) return <Navigate to="/" replace />;
  if (authUser.role === role) return <>{children}</>;
  if (!can(authUser.role, 'role.preview') || role === 'super_admin') {
    return <RoleRedirect role={authUser.role} />;
  }
  // B-07: پیش‌نمایش فقط با هویتِ همان نقش؛ وگرنه صفحه با شناسهٔ مدیر داده می‌خواند.
  if (previewRole !== role) {
    return <Navigate to={`${HOME_PATH[role]}?preview_role=${role}`} replace />;
  }
  return <>{children}</>;
}

/** نقش‌هایی که هر نقش می‌تواند به‌عنوان آن‌ها مشاهده کند */
function viewAsRolesFor(role: AppRole | undefined, hasGym: boolean): AppRole[] {
  if (role === 'owner') return ['trainer', 'member'];
  if (role === 'super_admin' && hasGym) return ['owner', 'trainer', 'member'];
  return [];
}

function PageLoader() {
  const { t } = useI18n();
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center select-none"
      style={{ background: 'var(--c-surface-0)', color: 'var(--c-text-muted)' }}
      role="status"
    >
      <div
        style={{ borderColor: 'var(--c-ink)' }}
        className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mb-3"
      />
      <span className="text-[14px] font-bold">{t.actions.loading}</span>
    </div>
  );
}

// ── App (needs router context) ───────────────────────────────
function App() {
  const [showJourney, setShowJourney] = useState(false);
  const { lang, setLang } = useI18n();
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  // B-01: بازیابی نشست Supabase Auth (در دموی محلی کاری انجام نمی‌دهد)
  useEffect(() => initAuth(), []);

  const previewRole = new URLSearchParams(location.search).get('preview_role') as AppRole | null;

  /**
   * کاربر واردشده واقعی (احراز هویت‌شده).
   * جدا از کاربر پیش‌نمایش نگه داشته می‌شود تا محاسبهٔ نقش‌ها حلقهٔ وابستگی نداشته باشد.
   */
  const authUser = mockStore.currentUser;
  const viewAsRoles = viewAsRolesFor(authUser?.role, !!mockStore.adminGymId);

  /**
   * پیش‌نمایش نقش — فقط برای نقش‌هایی که `role.preview` دارند، و فقط با یک حساب
   * واقعی از همان باشگاه. پارامتر ?preview_role به‌تنهایی کسی را وارد نمی‌کند.
   */
  const previewUser =
    authUser && previewRole && viewAsRoles.includes(previewRole)
      ? mockStore.gymUsers.find(u => u.role === previewRole && u.isActive !== false) ?? null
      : null;

  // B-07: هویت داده‌ای پیش‌نمایش پیش از رندر فرزندان در استور تنظیم می‌شود
  // (بی‌صدا و idempotent) تا صفحات همان کاربری را بخوانند که پوسته نمایش می‌دهد.
  mockStore.setPreviewUser(previewUser?.id ?? null);

  const currentUser = previewUser || authUser;

  if (!currentUser) {
    // پس از مشخص شدن وضعیت نشست، تا صفحهٔ ورود چشمک نزند
    if (!isAuthReady()) return <PageLoader />;
    return <LoginScreen lang={lang} onLanguageChange={setLang} />;
  }

  const chrome: ShellChrome = {
    user: authUser!,
    acting: currentUser,
    previewing: !!previewUser,
    viewAsRoles,
    onViewAs: role => navigate(`${HOME_PATH[role]}?preview_role=${role}`),
    onExitPreview: () => navigate(HOME_PATH[authUser!.role]),
    onShowGuide: () => setShowJourney(true),
    onLogout: () => {
      void logout();
      // بازگشت به ریشه تا ورود بعدی با نقش جدید از مسیر درست آغاز شود
      navigate('/');
    },
  };

  return (
    <ShellChromeProvider value={chrome}>
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Default → redirect based on logged-in role */}
          <Route path="/" element={<RoleRedirect role={currentUser.role} />} />

          <Route
            path="/admin/*"
            element={
              <RoleGuard role="super_admin" authUser={authUser}>
                <AdminShell />
              </RoleGuard>
            }
          />
          <Route
            path="/owner/*"
            element={
              <RoleGuard role="owner" authUser={authUser} previewRole={previewUser?.role}>
                <OwnerShell />
              </RoleGuard>
            }
          />
          <Route
            path="/trainer/*"
            element={
              <RoleGuard role="trainer" authUser={authUser} previewRole={previewUser?.role}>
                <TrainerShell />
              </RoleGuard>
            }
          />
          <Route
            path="/member/*"
            element={
              <RoleGuard role="member" authUser={authUser} previewRole={previewUser?.role}>
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

      {showJourney && (
        <UserJourneyGuide
          lang={lang}
          onClose={() => setShowJourney(false)}
          onSelectRole={role => navigate(can(authUser?.role, 'role.preview') && authUser?.role !== role ? `/${role}?preview_role=${role}` : `/${role}`)}
        />
      )}
    </ShellChromeProvider>
  );
}
