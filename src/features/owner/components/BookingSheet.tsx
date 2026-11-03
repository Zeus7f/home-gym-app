/**
 * src/features/owner/components/BookingSheet.tsx
 * ثبت نوبت تازه برای یک روز مشخص از تقویم مدیر.
 *
 * ساعت پیشنهادی، ساعت ثابت حضور ورزشکار است (هنگام ثبت‌نام تعیین می‌شود)؛
 * با انتخاب ورزشکار، مربی دائم و همان سانس خودکار پر می‌شوند.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../components/LanguageProvider';
import { Field, FieldGrid, FormError, FormSheet, SelectInput, SLOT_HOURS } from '../../../components/ui/Form';
import { displayName } from '../../../lib/displayName';
import { num } from '../../../lib/format';
import { formatJalaliLocalized } from '../../../lib/date/jalali';
import { scheduleSession } from '../../../api/sessions';
import type { DailySession, Member, Trainer } from '../../../lib/domain/gymManagement';

export interface BookingSheetProps {
  /** تاریخ جلالی «YYYY/MM/DD»؛ null یعنی بسته */
  date: string | null;
  members: Member[];
  trainers: Trainer[];
  /** نوبت‌های همان روز — برای نمایش جای آزاد هر سانس */
  daySessions: DailySession[];
  /** حداکثر نوبت هم‌زمان باشگاه در هر سانس */
  hourlyCapacity: number;
  onClose: () => void;
  onDone: (message: string) => void;
}

export function BookingSheet({
  date,
  members,
  trainers,
  daySessions,
  hourlyCapacity,
  onClose,
  onDone,
}: BookingSheetProps) {
  const { t, isFa } = useI18n();
  const s = t.owner.sched;

  // ورزشکار منتظر بسته هنوز اجازهٔ رزرو ندارد
  const bookable = useMemo(() => members.filter(m => !m.packagePending && m.status === 'active'), [members]);
  const activeTrainers = useMemo(() => trainers.filter(tr => tr.status === 'active'), [trainers]);

  const [memberId, setMemberId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [time, setTime] = useState('18:00');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const member = bookable.find(m => m.id === memberId);

  // باز شدن کشو: اولین ورزشکار و مربی و ساعت ثابت او
  useEffect(() => {
    if (!date) return;
    const first = bookable[0];
    setError(null);
    setMemberId(first?.id ?? '');
    setTrainerId(first?.defaultTrainerId || activeTrainers[0]?.id || '');
    setTime(first?.preferredHour || '18:00');
  }, [date, bookable, activeTrainers]);

  /** انتخاب ورزشکار، مربی دائم و ساعت ثابت او را هم می‌آورد */
  const pickMember = (id: string) => {
    const next = bookable.find(m => m.id === id);
    setMemberId(id);
    if (next?.defaultTrainerId) setTrainerId(next.defaultTrainerId);
    if (next?.preferredHour) setTime(next.preferredHour);
  };

  /** چند نوبت فعال در هر سانس ثبت شده است */
  const usedBySlot = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of daySessions) {
      if (session.status === 'cancelled') continue;
      map.set(session.time, (map.get(session.time) ?? 0) + 1);
    }
    return map;
  }, [daySessions]);

  const used = usedBySlot.get(time) ?? 0;
  const free = Math.max(0, hourlyCapacity - used);

  const submit = async () => {
    if (!date || !memberId || !trainerId) return;
    setBusy(true);
    setError(null);
    const res = await scheduleSession(date, time, memberId, trainerId);
    setBusy(false);
    if (res.success) onDone(s.booked);
    else setError(res.message);
  };

  return (
    <FormSheet
      open={!!date}
      onClose={onClose}
      title={s.bookingTitle}
      description={date ? s.bookingFor.replace('{date}', formatJalaliLocalized(date, isFa)) : undefined}
      submitLabel={s.book}
      busy={busy}
      onSubmit={submit}
    >
      <FormError message={error} />
      {bookable.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
          {s.noAthleteToBook}
        </p>
      ) : (
        <FieldGrid>
          <Field
            label={s.athlete}
            hint={member?.preferredHour ? s.usesFixedHour.replace('{hour}', member.preferredHour) : s.noFixedHour}
            className="sm:col-span-2"
          >
            {(id, d) => (
              <SelectInput id={id} aria-describedby={d} value={memberId} onChange={e => pickMember(e.target.value)}>
                {bookable.map(m => (
                  <option key={m.id} value={m.id}>
                    {displayName(m.name, isFa)}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>

          <Field label={s.trainer}>
            {id => (
              <SelectInput id={id} value={trainerId} onChange={e => setTrainerId(e.target.value)}>
                {activeTrainers.map(tr => (
                  <option key={tr.id} value={tr.id}>
                    {displayName(tr.name, isFa)}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>

          <Field
            label={s.slot}
            hint={free > 0 ? s.slotFree.replace('{free}', num(free)).replace('{total}', num(hourlyCapacity)) : s.slotFull}
            error={free === 0 ? s.slotFull : undefined}
          >
            {(id, d) => (
              <SelectInput
                id={id}
                aria-describedby={d}
                value={time}
                onChange={e => setTime(e.target.value)}
                dir="ltr"
                className="text-center tnum"
              >
                {SLOT_HOURS.map(h => {
                  const slotFree = Math.max(0, hourlyCapacity - (usedBySlot.get(h) ?? 0));
                  return (
                    <option key={h} value={h}>
                      {h} — {slotFree > 0 ? s.freeSlots.replace('{free}', num(slotFree)) : s.fullDay}
                    </option>
                  );
                })}
              </SelectInput>
            )}
          </Field>
        </FieldGrid>
      )}
    </FormSheet>
  );
}
