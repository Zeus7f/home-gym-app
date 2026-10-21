/**
 * src/lib/data/cloudSync.ts
 * B-03: بارگذاری دادهٔ باشگاه از Supabase و همگام‌سازی تغییرات استور با آن.
 *
 * الگو: استور همچنان منبع خواندن صفحه‌هاست. پس از ورود، دادهٔ باشگاه (با RLS
 * فقط همان بخشی که نقش کاربر اجازه دارد) در استور بار می‌شود. هر تغییر استور
 * (notify) با تأخیر کوتاه با آخرین وضعیت همگام‌شده مقایسه و فقط ردیف‌های
 * تغییرکرده نوشته می‌شوند. اگر سرور نوشتن را رد کند (مثلاً RLS)، وضعیت از سرور
 * دوباره بار می‌شود تا رابط کاربری چیزی را نشان ندهد که ذخیره نشده است.
 */

import { supabase } from '../supabase/client';
import { gymStore, useUuidIds } from '../supabase/mockStore';
import type { Gym, UserAccount } from '../domain/gymManagement';
import { diffRecords, indexRecords, recordsToState, stateToRecords, type RecordRow } from './records';
import type { ProfileRow } from '../auth/accountMapping';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface GymRow {
  id: string;
  tenant_id: string;
  name: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at?: string;
}

const SYNC_DELAY_MS = 400;

let activeGymId: string | null = null;
let lastSynced = new Map<string, string>();
let lastGymJson = '';
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
let unsubscribeStore: (() => void) | null = null;
let applying = false;

let status: SyncStatus = 'idle';
const statusListeners = new Set<() => void>();

function setStatus(next: SyncStatus) {
  status = next;
  statusListeners.forEach(fn => fn());
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(fn: () => void): () => void {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

function gymFromRow(row: GymRow): Gym {
  const s = row.settings ?? {};
  return {
    id: row.id,
    name: row.name,
    capacity: Number(s.capacity ?? 30),
    hourlyCapacity: s.hourlyCapacity == null ? undefined : Number(s.hourlyCapacity),
    currency: String(s.currency ?? 'تومان'),
    noShowDeductsSession: Boolean(s.noShowDeductsSession),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function gymSettings(gym: Gym) {
  return {
    capacity: gym.capacity,
    hourlyCapacity: gym.hourlyCapacity ?? null,
    currency: gym.currency,
    noShowDeductsSession: gym.noShowDeductsSession,
  };
}

function userFromProfile(p: ProfileRow, gymId: string): UserAccount {
  return {
    id: p.id,
    username: p.username ?? p.phone ?? '',
    password: '',
    role: p.role === 'gym_owner' ? 'owner' : p.role,
    entityId: p.role === 'gym_owner' ? gymId : p.app_entity_id ?? '',
    gymId,
    isActive: p.is_active,
    displayName: p.full_name,
    phone: p.phone ?? undefined,
  };
}

/** باشگاهِ tenant کاربر واردشده (برای مدیر، مربی و ورزشکار) */
export async function fetchGymForTenant(tenantId: string): Promise<Gym | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('app_gyms').select('*').eq('tenant_id', tenantId).maybeSingle();
  return data ? gymFromRow(data as GymRow) : null;
}

/**
 * بارگذاری کامل دادهٔ یک باشگاه در استور و شروع همگام‌سازی.
 * @returns پیام خطا یا null
 */
export async function openGym(gymId: string): Promise<string | null> {
  if (!supabase) return 'unavailable';
  stopSync();
  useUuidIds(true);

  const gymRes = await supabase.from('app_gyms').select('*').eq('id', gymId).maybeSingle();
  if (gymRes.error || !gymRes.data) return 'load_failed';
  const gymRow = gymRes.data as GymRow;

  const [recordsRes, profilesRes] = await Promise.all([
    supabase.from('app_records').select('kind, id, member_id, trainer_id, data').eq('gym_id', gymId),
    supabase
      .from('profiles')
      .select('id, full_name, phone, role, tenant_id, is_active, username, app_entity_id')
      .eq('tenant_id', gymRow.tenant_id),
  ]);
  if (recordsRes.error) return 'load_failed';

  const gym = gymFromRow(gymRow);
  const rows = (recordsRes.data ?? []) as RecordRow[];
  // ورزشکار و مربی فقط پروفایل‌هایی را می‌بینند که RLS اجازه می‌دهد
  const profiles = (profilesRes.data ?? []) as ProfileRow[];

  applying = true;
  gymStore.applyCloudGym(gym, recordsToState(rows), profiles.map(p => userFromProfile(p, gym.id)));
  applying = false;

  activeGymId = gym.id;
  lastSynced = indexRecords(stateToRecords(gymStore));
  lastGymJson = JSON.stringify({ name: gymStore.gym.name, settings: gymSettings(gymStore.gym) });
  unsubscribeStore = gymStore.subscribe(scheduleSync);
  setStatus('idle');
  return null;
}

export function stopSync() {
  if (timer) clearTimeout(timer);
  timer = null;
  unsubscribeStore?.();
  unsubscribeStore = null;
  activeGymId = null;
  lastSynced = new Map();
  lastGymJson = '';
}

function scheduleSync() {
  if (applying || !activeGymId) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void runSync();
  }, SYNC_DELAY_MS);
}

async function runSync(): Promise<void> {
  if (inFlight) {
    await inFlight;
  }
  if (!supabase || !activeGymId) return;
  const gymId = activeGymId;

  const next = stateToRecords(gymStore);
  const { upserts, deletes } = diffRecords(lastSynced, next);
  const gymJson = JSON.stringify({ name: gymStore.gym.name, settings: gymSettings(gymStore.gym) });
  if (!upserts.length && !deletes.length && gymJson === lastGymJson) return;

  setStatus('saving');
  inFlight = (async () => {
    try {
      if (gymJson !== lastGymJson) {
        const { error } = await supabase!
          .from('app_gyms')
          .update({ name: gymStore.gym.name, settings: gymSettings(gymStore.gym) })
          .eq('id', gymId);
        if (error) throw error;
      }
      if (upserts.length) {
        const { error } = await supabase!
          .from('app_records')
          .upsert(upserts.map(r => ({ ...r, gym_id: gymId })), { onConflict: 'gym_id,kind,id' });
        if (error) throw error;
      }
      for (const d of deletes) {
        const { error } = await supabase!
          .from('app_records')
          .delete()
          .eq('gym_id', gymId)
          .eq('kind', d.kind)
          .eq('id', d.id);
        if (error) throw error;
      }
      lastSynced = indexRecords(next);
      lastGymJson = gymJson;
      setStatus('saved');
    } catch (e) {
      console.warn('Cloud sync failed:', e);
      setStatus('error');
      // آنچه ذخیره نشد نباید روی صفحه بماند
      await openGym(gymId);
      setStatus('error');
    }
  })();
  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}

/** صبر تا ذخیرهٔ تغییرات در صف (پیش از ساخت حساب برای رکوردی که تازه ساخته شده) */
export async function flushSync(): Promise<boolean> {
  if (!activeGymId) return true;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  await runSync();
  return status !== 'error';
}

export function isCloudActive(): boolean {
  return activeGymId !== null;
}

// ── مدیر کل ────────────────────────────────────────────────────────────────

export interface GymSummary {
  gym: Gym;
  trainers: number;
  members: number;
  owner?: UserAccount;
}

/** فهرست همهٔ باشگاه‌ها با شمار مربی و عضو (فقط مدیر کل؛ RLS بقیه را محدود می‌کند) */
export async function listGyms(): Promise<GymSummary[]> {
  if (!supabase) return [];
  const { data: gyms } = await supabase.from('app_gyms').select('*').order('created_at');
  const list = (gyms ?? []) as GymRow[];
  return Promise.all(
    list.map(async row => {
      const count = async (kind: string) =>
        (await supabase!.from('app_records').select('id', { count: 'exact', head: true }).eq('gym_id', row.id).eq('kind', kind)).count ?? 0;
      const [trainers, members, ownerRes] = await Promise.all([
        count('trainer'),
        count('member'),
        supabase!
          .from('profiles')
          .select('id, full_name, phone, role, tenant_id, is_active, username, app_entity_id')
          .eq('tenant_id', row.tenant_id)
          .eq('role', 'gym_owner')
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        gym: gymFromRow(row),
        trainers,
        members,
        owner: ownerRes.data ? userFromProfile(ownerRes.data as ProfileRow, row.id) : undefined,
      };
    })
  );
}

export async function setGymActiveInCloud(gymId: string, active: boolean): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('app_gyms').update({ is_active: active }).eq('id', gymId);
  return !error;
}
