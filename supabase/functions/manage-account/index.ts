// Supabase Edge Function: manage-account
//
// B-01: ساخت حساب و تغییر رمز مربی/عضو با service role.
// مرورگر هرگز کلید service role را نمی‌بیند؛ این تابع JWT فراخواننده را بررسی می‌کند
// و فقط به مدیر فعال یک باشگاه اجازه می‌دهد روی حساب‌های همان باشگاه کار کند.
//
// استقرار:
//   supabase functions deploy manage-account
//   supabase secrets set AUTH_EMAIL_DOMAIN=<همان VITE_AUTH_EMAIL_DOMAIN>
// (SUPABASE_URL، SUPABASE_ANON_KEY و SUPABASE_SERVICE_ROLE_KEY را خود Supabase تزریق می‌کند.)
//
// درخواست‌ها (POST با هدر Authorization: Bearer <access token کاربر>):
//   { action: 'create', username, password, fullName, role: 'trainer'|'member', appEntityId?, phone? }
//   { action: 'set-password', appEntityId | userId, password }

import { createClient } from 'npm:@supabase/supabase-js@2';

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

  // هویت فراخواننده با توکن خودش؛ نقش و باشگاه از profiles خوانده می‌شود، نه از بدنهٔ درخواست.
  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userData.user) return json(401, { error: 'unauthorized' });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: caller } = await admin
    .from('profiles')
    .select('id, role, tenant_id, is_active')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (!caller || !caller.is_active || caller.role !== 'gym_owner' || !caller.tenant_id) {
    return json(403, { error: 'forbidden' });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < MIN_PASSWORD) return json(400, { error: 'weak_password' });

  if (body.action === 'create') {
    const username = String(body.username ?? '').trim().toLowerCase();
    const fullName = String(body.fullName ?? '').trim();
    const role = body.role;
    const appEntityId = typeof body.appEntityId === 'string' ? body.appEntityId : null;
    const phone = typeof body.phone === 'string' ? body.phone : null;
    if (!USERNAME_RE.test(username)) return json(400, { error: 'invalid_username' });
    if (!fullName) return json(400, { error: 'missing_name' });
    if (role !== 'trainer' && role !== 'member') return json(400, { error: 'invalid_role' });

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: `${username}@${emailDomain}`,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created.user) {
      const taken = /already|registered|exists/i.test(createErr?.message ?? '');
      return json(taken ? 409 : 500, { error: taken ? 'username_taken' : 'create_failed' });
    }

    const { error: profileErr } = await admin.from('profiles').insert({
      id: created.user.id,
      full_name: fullName,
      phone,
      role,
      tenant_id: caller.tenant_id,
      username,
      app_entity_id: appEntityId,
    });
    if (profileErr) {
      // بدون پروفایل، حساب Auth بی‌استفاده است؛ پاکش می‌کنیم تا نام کاربری آزاد شود.
      await admin.auth.admin.deleteUser(created.user.id);
      return json(500, { error: 'profile_failed' });
    }

    await admin.from('audit_events').insert({
      tenant_id: caller.tenant_id,
      actor_id: caller.id,
      action: 'ACCOUNT_CREATED',
      entity_type: 'profile',
      entity_id: created.user.id,
      metadata: { role, username },
    });

    return json(200, { userId: created.user.id, username });
  }

  if (body.action === 'set-password') {
    let query = admin.from('profiles').select('id, role, tenant_id').eq('tenant_id', caller.tenant_id);
    if (typeof body.userId === 'string') query = query.eq('id', body.userId);
    else if (typeof body.appEntityId === 'string') query = query.eq('app_entity_id', body.appEntityId);
    else return json(400, { error: 'missing_target' });

    const { data: target } = await query.maybeSingle();
    if (!target || (target.role !== 'trainer' && target.role !== 'member')) {
      return json(404, { error: 'not_found' });
    }

    const { error: pwErr } = await admin.auth.admin.updateUserById(target.id, { password });
    if (pwErr) return json(500, { error: 'update_failed' });

    await admin.from('audit_events').insert({
      tenant_id: caller.tenant_id,
      actor_id: caller.id,
      action: 'PASSWORD_RESET',
      entity_type: 'profile',
      entity_id: target.id,
      metadata: {},
    });

    return json(200, { userId: target.id });
  }

  return json(400, { error: 'unknown_action' });
});
