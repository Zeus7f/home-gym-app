// B-01: احراز هویت با Supabase Auth — منطق خالص و رفتار استور در هر دو حالت

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gymStore } from '../../supabase/mockStore';
import { translations } from '../../i18n';
import {
  profileToUserAccount,
  resolveAuthMode,
  toAuthEmail,
  USERNAME_PATTERN,
  type ProfileRow,
} from '../../auth/accountMapping';

function profile(over: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'Coach A',
    phone: '09120000000',
    role: 'trainer',
    tenant_id: '00000000-0000-0000-0000-0000000000aa',
    is_active: true,
    username: 'coach.a',
    app_entity_id: 't-a',
    ...over,
  };
}

export function runAuthTests() {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(cond: boolean, msg: string) {
    if (cond) passed++;
    else {
      failed++;
      errors.push(msg);
    }
  }

  const snapshot = {
    authMode: gymStore.authMode,
    authReady: gymStore.authReady,
    currentUser: gymStore.currentUser,
    previewUser: gymStore.previewUser,
    users: gymStore.users,
    trainers: gymStore.trainers,
    members: gymStore.members,
    memberPayments: gymStore.memberPayments,
  };
  const realNotify = gymStore.notify;
  gymStore.notify = () => {};

  try {
    // ── حالت احراز هویت ────────────────────────────────────────
    assert(resolveAuthMode({ hasSupabase: false }) === 'demo', 'no Supabase → local demo');
    assert(resolveAuthMode({ hasSupabase: true }) === 'supabase', 'Supabase configured → Supabase Auth');
    assert(
      resolveAuthMode({ hasSupabase: true, requested: 'demo', isDev: false }) === 'supabase',
      'production build ignores VITE_AUTH_MODE=demo'
    );
    assert(
      resolveAuthMode({ hasSupabase: true, requested: 'demo', isDev: true }) === 'demo',
      'dev build may opt into demo auth'
    );

    // ── ایمیل Auth ─────────────────────────────────────────────
    assert(toAuthEmail(' Ali ', 'x.test') === 'ali@x.test', 'username maps to lowercase synthetic email');
    assert(toAuthEmail('Owner@Gym.com', 'x.test') === 'owner@gym.com', 'an email is used as is');
    assert(USERNAME_PATTERN.test('09121112233'), 'phone numbers are valid usernames');
    assert(!USERNAME_PATTERN.test('ab') && !USERNAME_PATTERN.test('a b c'), 'short or spaced usernames are rejected');

    // ── پروفایل → حساب ────────────────────────────────────────
    const tr = profileToUserAccount(profile(), 'gym-1');
    assert(tr.ok && tr.user.role === 'trainer' && tr.user.entityId === 't-a', 'trainer maps to local trainer record');
    assert(tr.ok && tr.user.password === '', 'no password is kept in the browser');

    const owner = profileToUserAccount(profile({ role: 'gym_owner', app_entity_id: null }), 'gym-1');
    assert(owner.ok && owner.user.role === 'owner' && owner.user.entityId === 'gym-1', 'gym_owner maps to owner of the gym');

    const noProfile = profileToUserAccount(null, 'gym-1');
    assert(!noProfile.ok && 'messageKey' in noProfile && noProfile.messageKey === 'login.noProfile', 'missing profile is refused');

    const inactive = profileToUserAccount(profile({ is_active: false }), 'gym-1');
    assert(!inactive.ok && 'messageKey' in inactive && inactive.messageKey === 'login.inactive', 'inactive profile is refused');

    const unlinked = profileToUserAccount(profile({ role: 'member', app_entity_id: null }), 'gym-1');
    assert(!unlinked.ok, 'member without a linked record is refused');

    const superAdmin = profileToUserAccount(profile({ role: 'super_admin', tenant_id: null, app_entity_id: null }), '');
    assert(superAdmin.ok && superAdmin.user.role === 'super_admin' && !superAdmin.user.gymId, 'super_admin maps to the platform admin without a gym');

    const noGym = profileToUserAccount(profile(), '');
    assert(!noGym.ok, 'gym staff without a gym are refused');

    // ── استور در حالت Supabase ───────────────────────────────
    gymStore.authMode = 'supabase';
    gymStore.currentUser = null;
    // کپی آرایه‌ها تا addTrainer دادهٔ اصلی استور را تغییر ندهد
    gymStore.users = [...snapshot.users];
    gymStore.trainers = [...snapshot.trainers];
    const demoLogin = gymStore.login('admin', '123');
    assert(!demoLogin.success && demoLogin.messageKey === 'login.authUnavailable', 'demo passwords are refused under Supabase Auth');
    assert(gymStore.currentUser === null, 'refused demo login leaves no user signed in');

    gymStore.setCurrentUser('u-owner');
    assert(gymStore.currentUser === null, 'setCurrentUser cannot impersonate under Supabase Auth');

    const added = gymStore.addTrainer(
      {
        name: 'Coach Z',
        phone: '09125550000',
        specialty: 'x',
        workingHours: '09:00 - 15:00',
        dailyCapacity: 6,
        sessionRate: 1,
        status: 'active',
      } as any,
      'secret-password'
    );
    const acct = gymStore.users.find(u => u.entityId === added.trainer?.id);
    assert(!!acct && acct.password === '', 'trainer password is not stored locally under Supabase Auth');

    gymStore.setAuthenticatedUser(tr.ok ? tr.user : null);
    assert(gymStore.authReady && gymStore.currentUser?.entityId === 't-a', 'verified user becomes the signed-in user');

    // ── استور در دموی محلی ───────────────────────────────────
    gymStore.authMode = 'demo';
    gymStore.users = snapshot.users;
    gymStore.currentUser = null;
    assert(gymStore.login('admin', '123').success, 'demo login still works without Supabase');

    // ── متن‌ها و صفحهٔ ورود ─────────────────────────────────
    const keys = [
      'login.badCredentials',
      'login.noProfile',
      'login.inactive',
      'login.authUnavailable',
      'account.created',
      'account.usernameTaken',
      'account.invalidUsername',
      'account.weakPassword',
      'account.failed',
    ];
    for (const lang of ['fa', 'en'] as const) {
      const catalog = translations[lang].storeMessages as Record<string, string>;
      const missing = keys.filter(k => !catalog[k]);
      assert(missing.length === 0, `${lang}: auth messages exist (${missing.join(', ')})`);
    }

    const login = readFileSync(join(process.cwd(), 'src/features/auth/LoginScreen.tsx'), 'utf8');
    assert(/\{demo && \(/.test(login) && login.includes("const demo = !isServerAuth()"), 'demo quick sign-in is hidden under Supabase Auth');

    const fn = readFileSync(join(process.cwd(), 'supabase/functions/manage-account/index.ts'), 'utf8');
    assert(fn.includes("caller.role === 'trainer' && role !== 'member'"), 'trainers can only create athletes');
    assert(fn.includes("record.trainer_id !== caller.app_entity_id || !pending"), 'trainer-created athletes must be their own and pending');
    assert(fn.includes("target.tenant_id === caller.tenant_id"), 'owners only manage accounts of their own gym');
    assert(fn.includes("caller.role !== 'super_admin'"), 'only the platform admin creates gyms');
  } catch (e: any) {
    failed++;
    errors.push(`Unexpected error: ${e?.message ?? e}`);
  } finally {
    Object.assign(gymStore, snapshot);
    gymStore.notify = realNotify;
  }

  return { passed, failed, errors };
}
