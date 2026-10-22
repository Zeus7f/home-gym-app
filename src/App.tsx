import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { gymStore } from './lib/store/gymStore';
import { LoginScreen } from './features/auth/LoginScreen';
import { ChangePasswordScreen } from './features/auth/ChangePasswordScreen';
import { initAuth, isAuthReady, logout, mustChangePassword } from './api/auth';
import { leaveGym } from './api/admin';
import { can, type AppRole } from './lib/auth/permissions';
import { AUTH_PATHS, BASE_PATH, homePath } from './lib/routes';
import { UserJourneyGuide } from './components/UserJourneyGuide';
import { ShellChromeProvider, type ShellChrome } from './components/shell/AppShell';
import { LanguageProvider, useI18n } from './components/LanguageProvider';

// هر فضای کاری جدا بارگذاری می‌شود (code splitting)
const AdminShell = React.lazy(() => import('./features/admin/AdminShell').then(m => ({ default: m.AdminShell })));
const OwnerShell = React.lazy(() => import('./features/owner/OwnerShell').then(m => ({ default: m.OwnerShell })));
const TrainerShell = React.lazy(() => import('./features/trainer/TrainerShell').then(m => ({ default: m.TrainerShell })));
const MemberShell = React.lazy(() => import('./features/member/MemberShell').then(m => ({ default: m.MemberShell })));
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

/** نقش‌هایی که هر نقش می‌تواند به‌عنوان آن‌ها مشاهده کند (پیش‌نمایش کنترل‌شده) */
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
      <div style={{ borderColor: 'var(--c-ink)' }} className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-[14px] font-bold">{t.actions.loading}</span>
    </div>
  );
}

/**
 * لایهٔ ۱ محافظ: کاربر واردشده با نقش مجاز.
 * نقش‌هایی که `role.preview` دارند، فضای نقش‌های پایین‌تر را فقط با یک هویت
 * پیش‌نمایش واقعی از همان باشگاه می‌بینند؛ نقش نامجاز به فضای خودش هدایت می‌شود.
 * (لایهٔ ۲، یعنی بررسی نقش و مالکیت در سرور، مستقل از این محافظ اجرا می‌شود.)
 */
function RoleProtectedRoute({
  allowedRoles,
  previewRole,
  children,
}: {
  allowedRoles: AppRole[];
  previewRole?: AppRole | null;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const authUser = gymStore.currentUser;
  if (!authUser) return <Navigate to={AUTH_PATHS.login} replace state={{ from: location.pathname + location.search }} />;
  if (allowedRoles.includes(authUser.role)) return <>{children}</>;

  const target = allowedRoles[0];
  if (!can(authUser.role, 'role.preview') || target === 'super_admin') return <Navigate to={homePath(authUser.role)} replace />;
  // B-07: پیش‌نمایش فقط با هویتِ همان نقش؛ وگرنه صفحه با شناسهٔ مدیر داده می‌خواند.
  if (previewRole !== target) return <Navigate to={`${homePath(target)}?preview_role=${target}`} replace />;
  return <>{children}</>;
}

/** فقط کاربر واردشده؛ با «تغییر رمز اجباری» فقط صفحهٔ تغییر رمز */
function SessionGate() {
  const location = useLocation();
  if (!gymStore.currentUser) {
    return <Navigate to={AUTH_PATHS.login} replace state={{ from: location.pathname + location.search }} />;
  }
  if (mustChangePassword()) return <Navigate to={AUTH_PATHS.changePassword} replace />;
  return <Outlet />;
}

// ── App (needs router context) ───────────────────────────────
function App() {
  const [showJourney, setShowJourney] = useState(false);
  const { lang, setLang } = useI18n();
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => gymStore.subscribe(() => setTick(t => t + 1)), []);

  // بازیابی نشست از کوکی سرور
  useEffect(() => initAuth(), []);

  if (!isAuthReady()) return <PageLoader />;

  const previewRole = new URLSearchParams(location.search).get('preview_role') as AppRole | null;
  const authUser = gymStore.currentUser;
  const viewAsRoles = viewAsRolesFor(authUser?.role, !!gymStore.adminGymId);

  /**
   * پیش‌نمایش نقش — فقط برای نقش‌هایی که `role.preview` دارند، و فقط با یک حساب
   * واقعی از همان باشگاه. پارامتر ?preview_role به‌تنهایی کسی را وارد نمی‌کند.
   */
  const previewUser =
    authUser && previewRole && viewAsRoles.includes(previewRole)
      ? previewRole === 'owner' && authUser.role === 'super_admin'
        ? { ...authUser, role: 'owner' as const, entityId: gymStore.gym.id, gymId: gymStore.gym.id }
        : gymStore.gymUsers.find(u => u.role === previewRole && u.isActive !== false) ?? null
      : null;

  // B-07: هویت داده‌ای پیش‌نمایش پیش از رندر فرزندان در استور تنظیم می‌شود
  if (previewUser && !gymStore.users.some(u => u.id === previewUser.id && u.role === previewUser.role)) {
    gymStore.previewUser = previewUser;
  } else {
    gymStore.setPreviewUser(previewUser?.id ?? null);
  }
  const currentUser = gymStore.actingUser;

  const chrome: ShellChrome | null =
    authUser && currentUser
      ? {
          user: authUser,
          acting: currentUser,
          previewing: !!previewUser,
          viewAsRoles,
          onViewAs: role => navigate(`${homePath(role)}?preview_role=${role}`),
          onExitPreview: () => {
            if (authUser.role === 'super_admin') leaveGym();
            navigate(homePath(authUser.role));
          },
          onShowGuide: () => setShowJourney(true),
          onLogout: () => {
            void logout();
            navigate(AUTH_PATHS.login);
          },
        }
      : null;

  const loginTarget = (location.state as { from?: string } | null)?.from;

  return (
    <ShellChromeProvider value={chrome}>
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          {/* عمومی: فقط مهمان */}
          <Route
            path={AUTH_PATHS.login}
            element={
              authUser ? (
                <Navigate to={mustChangePassword() ? AUTH_PATHS.changePassword : loginTarget ?? homePath(authUser.role)} replace />
              ) : (
                <LoginScreen lang={lang} onLanguageChange={setLang} />
              )
            }
          />
          <Route
            path={AUTH_PATHS.changePassword}
            element={
              authUser ? (
                <ChangePasswordScreen onDone={() => navigate(homePath(authUser.role), { replace: true })} />
              ) : (
                <Navigate to={AUTH_PATHS.login} replace />
              )
            }
          />
          {/* آدرس‌های قدیمی */}
          <Route path="/login" element={<Navigate to={AUTH_PATHS.login} replace />} />

          <Route element={<SessionGate />}>
            <Route path="/" element={authUser ? <Navigate to={homePath(authUser.role)} replace /> : null} />
            <Route
              path={`${BASE_PATH.super_admin}/*`}
              element={
                <RoleProtectedRoute allowedRoles={['super_admin']}>
                  <AdminShell />
                </RoleProtectedRoute>
              }
            />
            <Route
              path={`${BASE_PATH.owner}/*`}
              element={
                <RoleProtectedRoute allowedRoles={['owner']} previewRole={previewUser?.role}>
                  <OwnerShell />
                </RoleProtectedRoute>
              }
            />
            <Route
              path={`${BASE_PATH.trainer}/*`}
              element={
                <RoleProtectedRoute allowedRoles={['trainer']} previewRole={previewUser?.role}>
                  <TrainerShell />
                </RoleProtectedRoute>
              }
            />
            <Route
              path={`${BASE_PATH.member}/*`}
              element={
                <RoleProtectedRoute allowedRoles={['member']} previewRole={previewUser?.role}>
                  <MemberShell />
                </RoleProtectedRoute>
              }
            />
            {import.meta.env.DEV && <Route path="/dev/ui" element={<UIShowcase />} />}
            <Route path="*" element={authUser ? <Navigate to={homePath(authUser.role)} replace /> : null} />
          </Route>
        </Routes>
      </React.Suspense>

      {showJourney && authUser && (
        <UserJourneyGuide
          lang={lang}
          onClose={() => setShowJourney(false)}
          onSelectRole={role =>
            navigate(can(authUser.role, 'role.preview') && authUser.role !== role ? `${homePath(role)}?preview_role=${role}` : homePath(role))
          }
        />
      )}
    </ShellChromeProvider>
  );
}
