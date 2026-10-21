// Supabase Edge Function: manage-account
//
// ساخت باشگاه و حساب‌ها با service role. مرورگر هرگز کلید service role را نمی‌بیند؛
// این تابع JWT فراخواننده را بررسی می‌کند و نقش و باشگاه را از profiles می‌خواند
// (نه از بدنهٔ درخواست). قواعد همان ماتریس src/lib/auth/permissions.ts است:
//
//   create-gym     مدیر کل         → tenant + app_gyms + حساب مدیر باشگاه
//   create         مدیر باشگاه     → مربی یا ورزشکار در باشگاه خودش
//                  مربی            → ورزشکار با بستهٔ معلق، وصل به خودش
//   set-password   مدیر کل         → مدیر باشگاه
//                  مدیر باشگاه     → مربی و ورزشکار باشگاه خودش
//   set-active     مدیر باشگاه     → مربی و ورزشکار باشگاه خودش
//
// استقرار:
//   supabase functions deploy manage-account
//   supabase secrets set AUTH_EMAIL_DOMAIN=<همان VITE_AUTH_EMAIL_DOMAIN>

import { createClient } from 'npm:@supabase/supabase-js@2';

const PHONE_RE = /^09\d{9}$/;
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,62}$/;
const MIN_PASSWORD = 8;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const emailDomain = Deno.env.get('AUTH_EMAIL_DOMAIN');
  if (!emailDomain) return json(500, { error: 'auth_email_domain_missing' });

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });

  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userData.user) return json(401, { error: 'unauthorized' });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: caller } = await admin
    .from('profiles')
    .select('id, role, tenant_id, is_active, app_entity_id')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (!caller || !caller.is_active) return json(403, { error: 'forbidden' });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const audit = (tenantId: string | null, action: string, entityId: string, metadata: Record<string, unknown> = {}) =>
    admin.from('audit_events').insert({
      tenant_id: tenantId,
      actor_id: caller.id,
      action,
      entity_type: 'profile',
      entity_id: entityId,
      metadata,
    });

  /** حساب Auth + پروفایل. در صورت خطای پروفایل، حساب Auth پاک می‌شود. */
  async function createAccount(input: {
    tenantId: string;
    role: 'gym_owner' | 'trainer' | 'member';
    fullName: string;
    phone: string;
    password: string;
    appEntityId: string;
  }): Promise<Response | string> {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: `${input.phone}@${emailDomain}`,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });
    if (createErr || !created.user) {
      const taken = /already|registered|exists/i.test(createErr?.message ?? '');
      return json(taken ? 409 : 500, { error: taken ? 'username_taken' : 'create_failed' });
    }
    const { error: profileErr } = await admin.from('profiles').insert({
      id: created.user.id,
      full_name: input.fullName,
      phone: input.phone,
      role: input.role,
      tenant_id: input.tenantId,
      username: input.phone,
      app_entity_id: input.appEntityId,
    });
    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json(500, { error: 'profile_failed' });
    }
    await audit(input.tenantId, 'ACCOUNT_CREATED', created.user.id, { role: input.role });
    return created.user.id;
  }

  const phone = str(body.phone || body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = str(body.fullName);

  // ── create-gym (مدیر کل) ────────────────────────────────────────────────
  if (body.action === 'create-gym') {
    if (caller.role !== 'super_admin') return json(403, { error: 'forbidden' });
    const gymName = str(body.gymName);
    if (!gymName || !fullName) return json(400, { error: 'missing_name' });
    if (!PHONE_RE.test(phone)) return json(400, { error: 'invalid_phone' });
    if (password.length < MIN_PASSWORD) return json(400, { error: 'weak_password' });

    const slug = `${gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gym'}-${crypto.randomUUID().slice(0, 8)}`;
    const { data: tenant, error: tErr } = await admin
      .from('tenants')
      .insert({ name: gymName, slug, timezone: 'Asia/Tehran' })
      .select('id')
      .single();
    if (tErr || !tenant) return json(500, { error: 'create_failed' });
    await admin.from('tenant_settings').insert({ tenant_id: tenant.id, locale: 'fa-IR' });

    const capacity = Number(body.capacity) > 0 ? Math.round(Number(body.capacity)) : 30;
    const { data: gym, error: gErr } = await admin
      .from('app_gyms')
      .insert({ tenant_id: tenant.id, name: gymName, settings: { capacity, currency: 'تومان', noShowDeductsSession: false } })
      .select('id')
      .single();
    if (gErr || !gym) {
      await admin.from('tenants').delete().eq('id', tenant.id);
      return json(500, { error: 'create_failed' });
    }

    const owner = await createAccount({
      tenantId: tenant.id,
      role: 'gym_owner',
      fullName,
      phone,
      password,
      appEntityId: gym.id,
    });
    if (owner instanceof Response) {
      await admin.from('tenants').delete().eq('id', tenant.id);
      return owner;
    }
    return json(200, { gymId: gym.id, ownerId: owner });
  }

  // ── create (مدیر: مربی/ورزشکار؛ مربی: ورزشکار) ─────────────────────────
  if (body.action === 'create') {
    const role = body.role;
    const appEntityId = str(body.appEntityId);
    if (!caller.tenant_id) return json(403, { error: 'forbidden' });
    if (role !== 'trainer' && role !== 'member') return json(400, { error: 'invalid_role' });
    if (caller.role === 'trainer' && role !== 'member') return json(403, { error: 'forbidden' });
    if (caller.role !== 'gym_owner' && caller.role !== 'trainer') return json(403, { error: 'forbidden' });
    if (!fullName) return json(400, { error: 'missing_name' });
    if (!PHONE_RE.test(phone) || !USERNAME_RE.test(phone)) return json(400, { error: 'invalid_phone' });
    if (password.length < MIN_PASSWORD) return json(400, { error: 'weak_password' });
    if (!appEntityId) return json(400, { error: 'missing_record' });

    // رکورد مربی/ورزشکار باید پیش‌تر (با RLS) در باشگاه فراخواننده ذخیره شده باشد
    const { data: gym } = await admin.from('app_gyms').select('id').eq('tenant_id', caller.tenant_id).maybeSingle();
    if (!gym) return json(403, { error: 'forbidden' });
    const { data: record } = await admin
      .from('app_records')
      .select('trainer_id, data')
      .eq('gym_id', gym.id)
      .eq('kind', role)
      .eq('id', appEntityId)
      .maybeSingle();
    if (!record) return json(400, { error: 'missing_record' });
    if (caller.role === 'trainer') {
      const pending = (record.data as Record<string, unknown>)?.packagePending === true;
      if (record.trainer_id !== caller.app_entity_id || !pending) return json(403, { error: 'forbidden' });
    }
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('tenant_id', caller.tenant_id)
      .eq('app_entity_id', appEntityId)
      .maybeSingle();
    if (existing) return json(409, { error: 'username_taken' });

    const created = await createAccount({
      tenantId: caller.tenant_id,
      role,
      fullName,
      phone,
      password,
      appEntityId,
    });
    return created instanceof Response ? created : json(200, { userId: created });
  }

  // ── set-password / set-active ───────────────────────────────────────────
  if (body.action === 'set-password' || body.action === 'set-active') {
    const userId = str(body.userId);
    if (!userId) return json(400, { error: 'missing_target' });
    const { data: target } = await admin
      .from('profiles')
      .select('id, role, tenant_id')
      .eq('id', userId)
      .maybeSingle();
    if (!target) return json(404, { error: 'not_found' });

    const ownerOverStaff =
      caller.role === 'gym_owner' &&
      target.tenant_id === caller.tenant_id &&
      (target.role === 'trainer' || target.role === 'member');
    const adminOverOwner = caller.role === 'super_admin' && target.role === 'gym_owner';
    if (!ownerOverStaff && !adminOverOwner) return json(403, { error: 'forbidden' });

    if (body.action === 'set-password') {
      if (password.length < MIN_PASSWORD) return json(400, { error: 'weak_password' });
      const { error } = await admin.auth.admin.updateUserById(target.id, { password });
      if (error) return json(500, { error: 'update_failed' });
      await audit(target.tenant_id, 'PASSWORD_RESET', target.id);
      return json(200, { userId: target.id });
    }

    const active = body.active === true;
    const { error } = await admin.from('profiles').update({ is_active: active }).eq('id', target.id);
    if (error) return json(500, { error: 'update_failed' });
    // حساب غیرفعال نشست تازه نمی‌گیرد؛ RLS هم با is_active = false هیچ داده‌ای به آن نمی‌دهد
    await admin.auth.admin.updateUserById(target.id, { ban_duration: active ? 'none' : '876000h' });
    await audit(target.tenant_id, active ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED', target.id);
    return json(200, { userId: target.id });
  }

  return json(400, { error: 'unknown_action' });
});
