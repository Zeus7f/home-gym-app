/**
 * src/features/admin/AdminShell.tsx
 * پنل مدیر کل سامانه: فهرست باشگاه‌ها، ساخت باشگاه و مدیر، فعال/غیرفعال کردن،
 * تغییر رمز مدیر و ورود به پنل یک باشگاه.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Users, Dumbbell, KeyRound, Power, LogIn, Phone } from 'lucide-react';
import { AppShell } from '../../components/shell/AppShell';
import { Btn } from '../../components/ui/Btn';
import { PageHeader, Panel, StatTile, StatusPill } from '../../components/ui/Page';
import { Field, FieldGrid, FormError, FormSection, FormSheet, PasswordInput, PhoneInput, TextInput } from '../../components/ui/Form';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Toast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { useI18n } from '../../components/LanguageProvider';
import { subscribeToStore } from '../../api/auth';
import { createGym, enterGym, listGyms, resetOwnerPassword, setGymActive, type GymSummary } from '../../api/admin';
import { num } from '../../lib/format';
import { displayName } from '../../lib/displayName';
import { HOME_PATH } from '../../lib/auth/permissions';

export function AdminShell() {
  const { t } = useI18n();
  return (
    <AppShell
      nav={[{ key: 'gyms', icon: Building2, label: t.admin.title }]}
      activeKey="gyms"
      onNavigate={() => {}}
      title={t.admin.title}
      subtitle={t.auth.roleSuper}
      notifications={false}
    >
      <GymsPage />
    </AppShell>
  );
}

function GymsPage() {
  const { t, isFa } = useI18n();
  const navigate = useNavigate();
  const [gyms, setGyms] = useState<GymSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetFor, setResetFor] = useState<GymSummary | null>(null);
  const [confirmOff, setConfirmOff] = useState<GymSummary | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const refresh = useCallback(() => {
    listGyms().then(setGyms);
  }, []);
  useEffect(() => {
    refresh();
    return subscribeToStore(refresh);
  }, [refresh]);

  const totals = (gyms ?? []).reduce(
    (acc, g) => ({ trainers: acc.trainers + g.trainers, members: acc.members + g.members }),
    { trainers: 0, members: 0 }
  );

  const open = async (g: GymSummary) => {
    if (await enterGym(g.gym.id)) navigate(`${HOME_PATH.owner}?preview_role=owner`);
  };

  const toggle = async (g: GymSummary, active: boolean) => {
    const res = await setGymActive(g.gym.id, active);
    setToast({ msg: res.message, ok: res.success });
    refresh();
  };

  return (
    <>
      <PageHeader
        title={t.admin.subtitle}
        actions={
          <Btn v="primary" className="h-11" onClick={() => setCreating(true)}>
            <Plus size={18} /> {t.admin.newGym}
          </Btn>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <StatTile label={t.admin.totalGyms} value={num(gyms?.length ?? 0)} icon={Building2} />
        <StatTile label={t.admin.totalTrainers} value={num(totals.trainers)} icon={Dumbbell} tone="steel" />
        <StatTile label={t.admin.totalMembers} value={num(totals.members)} icon={Users} tone="brass" />
      </div>

      {gyms === null ? (
        <Panel className="text-center text-[14px]" style={{ color: 'var(--c-text-muted)' }}>{t.actions.loading}</Panel>
      ) : gyms.length === 0 ? (
        <Panel className="text-center py-10">
          <Building2 size={28} className="mx-auto mb-3" style={{ color: 'var(--c-steel)' }} />
          <p className="text-[14px] font-semibold" style={{ color: 'var(--c-text-muted)' }}>{t.admin.empty}</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {gyms.map(g => {
            const active = g.gym.isActive !== false;
            return (
              <Panel key={g.gym.id} className="flex flex-col gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="h-12 w-12 rounded-2xl grid place-items-center shrink-0" style={{ backgroundColor: 'var(--c-chrome)', color: 'var(--c-brass)' }}>
                    <Building2 size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[17px] font-extrabold break-words min-w-0" style={{ color: 'var(--c-heading)' }}>
                        {displayName(g.gym.name, isFa)}
                      </h3>
                      <StatusPill tone={active ? 'ok' : 'off'}>{active ? t.admin.active : t.admin.inactive}</StatusPill>
                    </div>
                    <div className="mt-1 text-[13px] flex flex-wrap gap-x-4 gap-y-1" style={{ color: 'var(--c-text-muted)' }}>
                      <span>{num(g.trainers)} {t.admin.trainers}</span>
                      <span>{num(g.members)} {t.admin.members}</span>
                      <span>{t.admin.capacity}: {num(g.gym.capacity)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl px-3 py-2.5 flex items-center gap-3 min-w-0" style={{ backgroundColor: 'var(--c-surface-2)' }}>
                  {g.owner ? (
                    <>
                      <Avatar name={displayName(g.owner.displayName, isFa)} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-bold truncate" style={{ color: 'var(--c-text)' }}>{displayName(g.owner.displayName, isFa)}</div>
                        <div className="text-[12px] flex items-center gap-1 truncate" style={{ color: 'var(--c-text-muted)' }} dir="ltr">
                          <Phone size={11} /> {g.owner.phone ?? g.owner.username}
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>{t.admin.noOwner}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Btn v="primary" className="h-10 flex-1 min-w-[8.5rem]" onClick={() => open(g)} disabled={!active}>
                    <LogIn size={16} className={isFa ? 'rotate-180' : ''} /> {t.admin.enter}
                  </Btn>
                  {g.owner && (
                    <Btn v="soft" className="h-10" onClick={() => setResetFor(g)}>
                      <KeyRound size={16} /> <span className="truncate">{t.admin.resetPassword}</span>
                    </Btn>
                  )}
                  <Btn
                    v={active ? 'ghost' : 'brass'}
                    className="h-10"
                    onClick={() => (active ? setConfirmOff(g) : toggle(g, true))}
                  >
                    <Power size={16} /> {active ? t.admin.deactivate : t.admin.activate}
                  </Btn>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <NewGymSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={msg => {
          setCreating(false);
          setToast({ msg, ok: true });
          refresh();
        }}
      />

      <ResetPasswordSheet
        target={resetFor}
        onClose={() => setResetFor(null)}
        onDone={msg => {
          setResetFor(null);
          setToast({ msg, ok: true });
        }}
      />

      <ConfirmDialog
        isOpen={!!confirmOff}
        onClose={() => setConfirmOff(null)}
        onConfirm={() => {
          if (confirmOff) void toggle(confirmOff, false);
          setConfirmOff(null);
        }}
        title={t.admin.deactivate}
        message={t.admin.confirmDeactivate.replace('{gym}', confirmOff ? displayName(confirmOff.gym.name, isFa) : '')}
        variant="danger"
        confirmText={t.admin.deactivate}
      />

      <Toast message={toast?.msg ?? null} type={toast?.ok === false ? 'warning' : 'success'} onClose={() => setToast(null)} />
    </>
  );
}

function NewGymSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (msg: string) => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', capacity: '30', ownerName: '', ownerPhone: '', ownerPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: '', capacity: '30', ownerName: '', ownerPhone: '', ownerPassword: '' });
      setError(null);
    }
  }, [open]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await createGym({ ...form, capacity: Number(form.capacity) });
    setBusy(false);
    if (res.success) onCreated(res.message);
    else setError(res.message);
  };

  return (
    <FormSheet open={open} onClose={onClose} title={t.admin.newGym} submitLabel={t.accounts.create} busy={busy} onSubmit={submit}>
      <FormError message={error} />
      <FormSection title={t.admin.gymSection}>
        <FieldGrid>
          <Field label={t.admin.gymName} className="sm:col-span-2">
            {id => <TextInput id={id} value={form.name} onChange={set('name')} autoFocus required />}
          </Field>
          <Field label={t.admin.capacity}>
            {id => <TextInput id={id} type="number" inputMode="numeric" min={1} value={form.capacity} onChange={set('capacity')} />}
          </Field>
        </FieldGrid>
      </FormSection>
      <FormSection title={t.admin.ownerSection}>
        <FieldGrid>
          <Field label={t.accounts.fullName} className="sm:col-span-2">
            {id => <TextInput id={id} value={form.ownerName} onChange={set('ownerName')} autoComplete="name" required />}
          </Field>
          <Field label={t.accounts.phone}>
            {id => <PhoneInput id={id} value={form.ownerPhone} onChange={set('ownerPhone')} placeholder={t.auth.phonePlaceholder} required />}
          </Field>
          <Field label={t.accounts.password} hint={t.accounts.passwordHint}>
            {(id, d) => <PasswordInput id={id} aria-describedby={d} value={form.ownerPassword} onChange={set('ownerPassword')} autoComplete="new-password" required />}
          </Field>
        </FieldGrid>
      </FormSection>
    </FormSheet>
  );
}

function ResetPasswordSheet({ target, onClose, onDone }: { target: GymSummary | null; onClose: () => void; onDone: (msg: string) => void }) {
  const { t, isFa } = useI18n();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPassword('');
    setError(null);
  }, [target]);

  const submit = async () => {
    if (!target?.owner) return;
    setBusy(true);
    const res = await resetOwnerPassword(target.owner.id, password);
    setBusy(false);
    if (res.success) onDone(res.message);
    else setError(res.message);
  };

  return (
    <FormSheet
      open={!!target}
      onClose={onClose}
      title={t.admin.resetPassword}
      description={target?.owner ? `${displayName(target.owner.displayName, isFa)} · ${displayName(target.gym.name, isFa)}` : undefined}
      submitLabel={t.accounts.save}
      busy={busy}
      onSubmit={submit}
    >
      <FormError message={error} />
      <Field label={t.accounts.newPassword} hint={t.accounts.passwordHint}>
        {(id, d) => <PasswordInput id={id} aria-describedby={d} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" autoFocus />}
      </Field>
    </FormSheet>
  );
}
