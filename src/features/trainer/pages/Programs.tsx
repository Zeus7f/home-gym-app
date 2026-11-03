/**
 * src/features/trainer/pages/Programs.tsx
 * ساخت و انتشار برنامهٔ تمرینی برای ورزشکاران همین مربی.
 *
 * جریان کار: انتخاب ورزشکار → تقویم هفته بر اساس جلسات باقی‌ماندهٔ بسته →
 * انتخاب روز تمرین → افزودن حرکت‌های آن روز → ذخیرهٔ پیش‌نویس → انتشار.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  Send,
  Search,
  Undo2,
  FileText,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import { H } from '../../../components/ui/H';
import { Btn } from '../../../components/ui/Btn';
import { Modal } from '../../../components/ui/Modal';
import { Field, TextInput } from '../../../components/ui/Form';
import { num } from '../../../lib/format';
import { displayName } from '../../../lib/displayName';
import { useI18n } from '../../../components/LanguageProvider';
import { getCurrentUser, subscribeToStore } from '../../../api/auth';
import { getTrainer } from '../../../api/trainers';
import { EXERCISE_CATALOG, type ExerciseItem } from '../../../lib/exercises/catalog';
import {
  getTrainerPrograms,
  saveProgram,
  publishProgram,
  unpublishProgram,
  deleteProgram,
  type ProgramDay,
  type ProgramExercise,
  type WorkoutProgram,
} from '../../../api/programs';
import { getMembers } from '../../../api/members';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_MONTH_NAMES_EN,
  PERSIAN_WEEK_DAYS,
  PERSIAN_WEEK_DAYS_EN,
  formatJalaliLocalized,
  getTodayJalaliString,
  getWeekShamsi,
  toPersianDigits,
  type WeekDay,
} from '../../../lib/date/jalali';
import type { Member } from '../../../lib/domain/gymManagement';

/**
 * عنوان پیش‌فرض یک روز تقویمی: «سه‌شنبه ۱۲ آبان».
 *
 * عنوان همراه برنامه ذخیره می‌شود، پس از «امروز»ِ `formatJalaliDisplay` استفاده
 * نمی‌کنیم؛ وگرنه برنامهٔ دیروز هم فردا «امروز» خوانده می‌شود.
 */
function dayTitleFor(day: WeekDay, index: number, isFa: boolean): string {
  const weekday = isFa ? PERSIAN_WEEK_DAYS[index] : PERSIAN_WEEK_DAYS_EN[index];
  const month = isFa ? PERSIAN_MONTH_NAMES[day.monthNum - 1] : PERSIAN_MONTH_NAMES_EN[day.monthNum - 1];
  return `${weekday} ${isFa ? toPersianDigits(day.dayNum) : day.dayNum} ${month}`;
}

/** روزهای برنامه به ترتیب تاریخ؛ روزهای بدون تاریخ (برنامه‌های قدیمی) آخر می‌آیند. */
function sortDays(days: ProgramDay[]): ProgramDay[] {
  return [...days].sort((a, b) => (a.date ?? '￿').localeCompare(b.date ?? '￿'));
}

export function Programs() {
  const { t, isFa } = useI18n();
  const currentTrainerId = getCurrentUser()?.entityId || '';
  const [trainerName, setTrainerName] = useState('Trainer');

  const [version, setVersion] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);

  // برنامه در حال ویرایش
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [editingProgramId, setEditingProgramId] = useState<string | undefined>(undefined);

  // تقویم هفته
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  const [exercisePicker, setExercisePicker] = useState<{ open: boolean; dayId: string }>({ open: false, dayId: '' });
  const [pickerSearch, setPickerSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToStore(() => setVersion(v => v + 1));
    return unsub;
  }, []);

  useEffect(() => {
    getTrainer(currentTrainerId).then(tr => {
      if (tr) setTrainerName(tr.name);
    });
  }, [currentTrainerId]);

  // فهرست ورزشکاران با هر تغییر داده تازه می‌شود تا ورزشکار تازه‌ساخته هم دیده شود
  useEffect(() => {
    getMembers().then(setMembers);
  }, [version]);

  useEffect(() => {
    getTrainerPrograms(currentTrainerId).then(setPrograms);
  }, [currentTrainerId, version]);

  const myMembers = useMemo(
    () => members.filter(m => m.defaultTrainerId === currentTrainerId),
    [members, currentTrainerId]
  );

  const selectedMember = myMembers.find(m => m.id === selectedMemberId);
  const remaining = selectedMember?.remainingSessions ?? 0;

  const week = useMemo(() => getWeekShamsi(weekOffset), [weekOffset]);
  const dayByDate = useMemo(() => new Map(days.filter(d => d.date).map(d => [d.date as string, d])), [days]);
  const selectedDay = days.find(d => d.id === selectedDayId);
  const overBudget = remaining > 0 && days.length > remaining;
  const today = getTodayJalaliString();

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3600);
  };

  const resetEditor = () => {
    setSelectedMemberId('');
    setTitle('');
    setDescription('');
    setDays([]);
    setSelectedDayId('');
    setWeekOffset(0);
    setEditingProgramId(undefined);
  };

  /** بارگذاری یک برنامه موجود در ویرایشگر */
  const loadProgram = (program: WorkoutProgram) => {
    const loaded = sortDays(program.days.map(d => ({ ...d, items: [...d.items] })));
    setSelectedMemberId(program.memberId);
    setTitle(program.title);
    setDescription(program.description || '');
    setDays(loaded);
    setSelectedDayId(loaded[0]?.id ?? '');
    setWeekOffset(0);
    setEditingProgramId(program.id);
  };

  const selectMember = (member: Member) => {
    setSelectedMemberId(member.id);
    setEditingProgramId(undefined);
    setDays([]);
    setSelectedDayId('');
    setWeekOffset(0);
    if (!title) setTitle(`${t.trainer.programs.title} — ${displayName(member.name, isFa)}`);
  };

  /** کلیک روی یک روز تقویم: اگر روز در برنامه نیست اضافه می‌شود، وگرنه فقط انتخاب */
  const pickDay = (day: WeekDay, index: number) => {
    const existing = dayByDate.get(day.dateKey);
    if (existing) {
      setSelectedDayId(existing.id);
      return;
    }
    const fresh: ProgramDay = {
      // شناسهٔ روز در کل باشگاه یکتاست، پس تاریخ به‌تنهایی کافی نیست:
      // دو ورزشکار می‌توانند یک روز مشترک داشته باشند.
      id: `day-${day.dateKey.replace(/\//g, '')}-${Math.random().toString(36).slice(2, 8)}`,
      title: dayTitleFor(day, index, isFa),
      date: day.dateKey,
      items: [],
    };
    setDays(prev => sortDays([...prev, fresh]));
    setSelectedDayId(fresh.id);
  };

  const removeDay = (dayId: string) => {
    setDays(prev => prev.filter(d => d.id !== dayId));
    if (selectedDayId === dayId) setSelectedDayId('');
  };

  const addExerciseToDay = (dayId: string, item: ExerciseItem) => {
    const programExercise: ProgramExercise = {
      exerciseId: item.id,
      name: item.nameFa,
      bodyPart: item.primaryMuscleFa || item.bodyPartFa,
      equipment: item.equipmentFa,
      sets: item.defaultSets || 3,
      repsMin: item.defaultReps || 10,
      repsMax: (item.defaultReps || 10) + 2,
      loadKg: item.equipment === 'bodyweight' ? undefined : 20,
    };
    setDays(prev => prev.map(d => (d.id === dayId ? { ...d, items: [...d.items, programExercise] } : d)));
  };

  const removeExerciseFromDay = (dayId: string, index: number) => {
    setDays(prev => prev.map(d => (d.id === dayId ? { ...d, items: d.items.filter((_, i) => i !== index) } : d)));
  };

  const updateExercise = (dayId: string, index: number, patch: Partial<ProgramExercise>) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId ? { ...d, items: d.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) } : d
      )
    );
  };

  /** ذخیرهٔ پیش‌نویس — شناسهٔ برنامه را برمی‌گرداند تا انتشار بتواند پشت سرش اجرا شود */
  const persistDraft = async (): Promise<string | null> => {
    if (!selectedMember) {
      showToast('err', t.trainer.today.errorNoAthlete);
      return null;
    }
    if (!title.trim()) {
      showToast('err', t.trainer.programs.needsTitle);
      return null;
    }
    try {
      const saved = await saveProgram({
        id: editingProgramId,
        memberId: selectedMember.id,
        memberName: displayName(selectedMember.name, isFa),
        trainerId: currentTrainerId,
        trainerName,
        title: title.trim(),
        description: description.trim() || undefined,
        days,
      });
      setEditingProgramId(saved.id);
      return saved.id;
    } catch (err) {
      // خطای شبکه یا رد شدن از سمت سرور نباید بی‌صدا بماند
      showToast('err', err instanceof Error ? err.message : t.storeMessages['server.unavailable']);
      return null;
    }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    const id = await persistDraft();
    setBusy(false);
    if (id) showToast('ok', t.trainer.programs.saved);
  };

  /** انتشار: ابتدا همین حالت ذخیره می‌شود تا تغییرهای ذخیره‌نشده از قلم نیفتند */
  const handlePublish = async () => {
    if (days.length === 0) {
      showToast('err', t.trainer.programs.needsDays);
      return;
    }
    if (days.some(d => d.items.length === 0)) {
      showToast('err', t.trainer.programs.emptyDay);
      return;
    }
    setBusy(true);
    const id = await persistDraft();
    if (!id) {
      setBusy(false);
      return;
    }
    const res = await publishProgram(id);
    setBusy(false);
    showToast(res.success ? 'ok' : 'err', res.message);
  };

  const handleUnpublish = async (programId: string) => {
    const res = await unpublishProgram(programId);
    showToast(res.success ? 'ok' : 'err', res.message);
  };

  const handleDelete = async (programId: string) => {
    await deleteProgram(programId);
    if (editingProgramId === programId) resetEditor();
    showToast('ok', t.trainer.programs.deleted);
  };

  const filteredCatalog = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return EXERCISE_CATALOG.slice(0, 30);
    return EXERCISE_CATALOG.filter(
      item =>
        item.nameFa.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.primaryMuscleFa?.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [pickerSearch]);

  const p = t.trainer.programs;
  const surface = { backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border)' };

  return (
    <div className="space-y-4">
      {/* انتخاب ورزشکار */}
      <section style={surface} className="p-4 rounded-2xl border shadow-xs">
        <H sub={p.subtitle}>{p.title}</H>

        {myMembers.length === 0 ? (
          <p className="mt-3 text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            {p.noAthletes}
          </p>
        ) : (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {myMembers.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMember(m)}
                style={{
                  backgroundColor: selectedMemberId === m.id ? 'var(--c-ink)' : 'var(--c-surface-2)',
                  color: selectedMemberId === m.id ? '#ffffff' : 'var(--c-text-muted)',
                }}
                className="px-3 py-1.5 rounded-xl text-[13px] font-bold border border-transparent transition-colors cursor-pointer"
                aria-pressed={selectedMemberId === m.id}
              >
                {displayName(m.name, isFa)}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedMember && (
        <>
          {/* تقویم هفته بر اساس جلسات باقی‌مانده */}
          <section style={surface} className="p-4 rounded-2xl border shadow-xs space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[15px] font-extrabold" style={{ color: 'var(--c-heading)' }}>
                  {p.weekTitle}
                </h3>
                <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
                  {p.weekHint}
                </p>
              </div>
              <span
                style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-steel)' }}
                className="px-2.5 py-1 rounded-lg text-[12px] font-bold shrink-0"
              >
                {selectedMember.expirationDate
                  ? p.remainingUntil
                      .replace('{count}', num(remaining))
                      .replace('{date}', formatJalaliLocalized(selectedMember.expirationDate, isFa))
                  : p.remaining.replace('{count}', num(remaining))}
              </span>
            </div>

            {remaining === 0 ? (
              <p
                role="status"
                className="rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold"
                style={{ backgroundColor: 'var(--c-status-noshow-bg)', borderColor: 'var(--c-rubber)', color: 'var(--c-rubber)' }}
              >
                {p.noSessionsLeft}
              </p>
            ) : (
              <>
                {/* پیمایش هفته */}
                <div className="flex items-center justify-between gap-2">
                  <Btn v="ghost" className="h-9 px-2.5 text-[12px] gap-1" onClick={() => setWeekOffset(w => w - 1)}>
                    <ChevronRight size={14} />
                    <span>{p.prevWeek}</span>
                  </Btn>
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="text-[12.5px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                    style={{ color: weekOffset === 0 ? 'var(--c-steel)' : 'var(--c-text-muted)' }}
                  >
                    <CalendarDays size={14} />
                    {p.thisWeek}
                  </button>
                  <Btn v="ghost" className="h-9 px-2.5 text-[12px] gap-1" onClick={() => setWeekOffset(w => w + 1)}>
                    <span>{p.nextWeek}</span>
                    <ChevronLeft size={14} />
                  </Btn>
                </div>

                {/* هفت روز هفته */}
                <div className="grid grid-cols-7 gap-1.5">
                  {week.map((day, index) => {
                    const planned = dayByDate.get(day.dateKey);
                    const isSelected = planned?.id === selectedDayId;
                    const isPast = day.dateKey < today;
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => pickDay(day, index)}
                        disabled={isPast && !planned}
                        aria-pressed={!!planned}
                        aria-label={`${dayTitleFor(day, index, isFa)}${planned ? ` — ${p.dayCountLabel.replace('{count}', num(planned.items.length))}` : ''}`}
                        className="rounded-xl border p-1.5 text-center transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: planned ? 'var(--c-ink)' : 'var(--c-surface-2)',
                          borderColor: isSelected ? 'var(--c-brass)' : day.isToday ? 'var(--c-steel)' : 'transparent',
                          borderWidth: isSelected || day.isToday ? 2 : 1,
                          color: planned ? '#ffffff' : 'var(--c-text-muted)',
                        }}
                      >
                        <div className="text-[10.5px] font-bold">{day.labelShort}</div>
                        <div className="text-[15px] font-extrabold tnum leading-snug">{num(day.dayNum)}</div>
                        <div className="text-[9.5px] h-3 leading-3">
                          {planned ? (planned.items.length > 0 ? `${num(planned.items.length)}●` : '—') : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <span style={{ color: 'var(--c-text-muted)' }}>
                    {p.plannedCount.replace('{planned}', num(days.length)).replace('{total}', num(remaining))}
                  </span>
                  {overBudget && (
                    <span className="inline-flex items-center gap-1 font-bold" style={{ color: 'var(--c-rubber)' }}>
                      <AlertTriangle size={13} />
                      {p.overBudget}
                    </span>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ویرایشگر برنامه */}
          <section style={surface} className="p-4 rounded-2xl border shadow-xs space-y-3.5">
            <Field label={p.programTitle}>
              {id => (
                <TextInput
                  id={id}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={p.programTitlePlaceholder}
                />
              )}
            </Field>
            <Field label={p.description}>
              {id => (
                <TextInput
                  id={id}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={p.descriptionPlaceholder}
                />
              )}
            </Field>

            {days.length === 0 ? (
              <p className="text-[13px] py-3 text-center" style={{ color: 'var(--c-text-muted)' }}>
                {p.pickDayFirst}
              </p>
            ) : (
              <div className="space-y-2.5">
                {/* نوار روزهای انتخاب‌شده */}
                <div className="flex flex-wrap gap-1.5">
                  {days.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setSelectedDayId(day.id)}
                      aria-pressed={day.id === selectedDayId}
                      style={{
                        backgroundColor: day.id === selectedDayId ? 'var(--c-steel)' : 'var(--c-surface-2)',
                        color: day.id === selectedDayId ? '#ffffff' : 'var(--c-text-muted)',
                      }}
                      className="px-2.5 py-1 rounded-lg text-[12px] font-bold cursor-pointer"
                    >
                      {day.title}
                      {day.items.length > 0 && <span className="ms-1 tnum">({num(day.items.length)})</span>}
                    </button>
                  ))}
                </div>

                {selectedDay && (
                  <div style={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)' }} className="rounded-2xl border overflow-hidden">
                    <div className="flex items-center gap-2 p-3">
                      <span className="flex-1 text-[14px] font-bold truncate min-w-0" style={{ color: 'var(--c-heading)' }}>
                        {p.selectedDay.replace('{day}', selectedDay.title)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDay(selectedDay.id)}
                        className="h-8 w-8 rounded-lg grid place-items-center shrink-0 cursor-pointer"
                        style={{ color: 'var(--c-rubber)' }}
                        aria-label={p.removeDay}
                        title={p.removeDay}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="px-3 pb-3 space-y-1.5">
                      {selectedDay.items.length === 0 ? (
                        <p className="text-[12px] py-1" style={{ color: 'var(--c-text-muted)' }}>
                          {p.emptyDayHint}
                        </p>
                      ) : (
                        selectedDay.items.map((item, idx) => (
                          <div
                            key={`${item.exerciseId}-${idx}`}
                            style={surface}
                            className="rounded-xl border p-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex-1 text-[13px] font-bold truncate min-w-0" style={{ color: 'var(--c-heading)' }}>
                                {item.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeExerciseFromDay(selectedDay.id, idx)}
                                className="h-7 w-7 rounded-lg grid place-items-center shrink-0 cursor-pointer"
                                style={{ color: 'var(--c-rubber)' }}
                                aria-label={p.removeExercise.replace('{name}', item.name)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div className="text-[11px] mt-1" style={{ color: 'var(--c-text-muted)' }}>
                              {item.bodyPart} · {item.equipment}
                            </div>

                            <div className="mt-2 grid grid-cols-4 gap-1.5">
                              {(
                                [
                                  [p.setCount, item.sets, 1, (v: number) => ({ sets: Math.max(1, v) })],
                                  [p.repsMin, item.repsMin, 1, (v: number) => ({ repsMin: Math.max(1, v) })],
                                  [p.repsMax, item.repsMax, 1, (v: number) => ({ repsMax: Math.max(1, v) })],
                                ] as const
                              ).map(([label, value, min, patch]) => (
                                <label key={label} className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                                  {label}
                                  <input
                                    type="number"
                                    min={min}
                                    value={value}
                                    onChange={e => updateExercise(selectedDay.id, idx, patch(Number(e.target.value) || min))}
                                    className="w-full mt-0.5 h-8 px-2 rounded-lg text-[12px] text-center tnum"
                                    style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}
                                  />
                                </label>
                              ))}
                              <label className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                                {p.load}
                                <input
                                  type="number"
                                  min={0}
                                  step={2.5}
                                  value={item.loadKg ?? ''}
                                  onChange={e =>
                                    updateExercise(selectedDay.id, idx, {
                                      loadKg: e.target.value === '' ? undefined : Number(e.target.value),
                                    })
                                  }
                                  placeholder="—"
                                  className="w-full mt-0.5 h-8 px-2 rounded-lg text-[12px] text-center tnum"
                                  style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-ink)', border: '1px solid var(--c-border)' }}
                                />
                              </label>
                            </div>
                          </div>
                        ))
                      )}

                      <Btn
                        v="soft"
                        className="w-full h-9 text-[12px] gap-1.5"
                        onClick={() => {
                          setExercisePicker({ open: true, dayId: selectedDay.id });
                          setPickerSearch('');
                        }}
                      >
                        <Plus size={14} />
                        <span>{p.addExercise}</span>
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* دکمه‌های ذخیره و انتشار */}
            <div className="flex gap-2 pt-1">
              <Btn v="soft" className="flex-1 text-[13px] gap-1.5" disabled={busy} onClick={handleSaveDraft}>
                <FileText size={15} />
                <span>{p.saveDraft}</span>
              </Btn>
              <Btn v="primary" className="flex-1 text-[13px] gap-1.5" disabled={busy} onClick={handlePublish}>
                <Send size={15} />
                <span>{p.publish}</span>
              </Btn>
            </div>
          </section>
        </>
      )}

      {/* فهرست برنامه‌های این مربی */}
      {programs.length > 0 && (
        <section style={surface} className="p-4 rounded-2xl border shadow-xs">
          <H sub={p.title}>{p.myPrograms}</H>

          <div className="mt-3 space-y-2">
            {programs.map(program => (
              <div key={program.id} style={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)' }} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-[14px] font-bold truncate min-w-0" style={{ color: 'var(--c-heading)' }}>
                    {program.title}
                  </span>
                  <span
                    style={{
                      backgroundColor: program.status === 'published' ? 'var(--c-avail-fg)' : 'var(--c-text-faint)',
                      color: program.status === 'published' ? '#ffffff' : 'var(--c-text-muted)',
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                  >
                    {program.status === 'published' ? p.published : p.draft}
                  </span>
                </div>

                <div className="text-[12px] mt-1" style={{ color: 'var(--c-text-muted)' }}>
                  {p.programMeta
                    .replace('{member}', program.memberName)
                    .replace('{days}', num(program.days.length))
                    .replace('{exercises}', num(program.days.reduce((sum, d) => sum + d.items.length, 0)))}
                </div>

                <div className="flex gap-1.5 mt-2.5">
                  <Btn v="ghost" className="h-8 px-2.5 text-[11px]" onClick={() => loadProgram(program)}>
                    {p.edit}
                  </Btn>
                  {program.status === 'published' && (
                    <Btn v="soft" className="h-8 px-2.5 text-[11px] gap-1" onClick={() => handleUnpublish(program.id)}>
                      <Undo2 size={12} />
                      <span>{p.unpublish}</span>
                    </Btn>
                  )}
                  <Btn
                    v="ghost"
                    className="h-8 px-2.5 text-[11px] ms-auto"
                    onClick={() => handleDelete(program.id)}
                    style={{ color: 'var(--c-rubber)' }}
                    aria-label={p.delete}
                  >
                    <Trash2 size={12} />
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* پیام وضعیت */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: toast.type === 'ok' ? 'var(--c-avail-fg)' : 'var(--c-rubber)', color: '#ffffff' }}
          className="fixed top-20 inset-x-4 z-50 mx-auto max-w-md rounded-xl px-4 py-3 text-[13px] font-bold text-center shadow-lg"
          role="status"
        >
          {toast.text}
        </motion.div>
      )}

      {/* مودال انتخاب حرکت از کاتالوگ */}
      <Modal
        isOpen={exercisePicker.open}
        onClose={() => setExercisePicker({ open: false, dayId: '' })}
        title={p.catalogTitle}
        description={p.catalogDesc.replace('{count}', num(EXERCISE_CATALOG.length))}
        maxWidth="lg"
      >
        <div
          style={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)' }}
          className="flex items-center gap-2 px-3 h-11 rounded-xl border text-slate-400"
        >
          <Search size={16} className="shrink-0" />
          <input
            type="text"
            value={pickerSearch}
            onChange={e => setPickerSearch(e.target.value)}
            placeholder={p.catalogSearch}
            className="w-full bg-transparent border-none outline-hidden text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            autoFocus
          />
        </div>

        <div className="mt-3 space-y-1.5 max-h-[50vh] overflow-y-auto thin-scroll">
          {filteredCatalog.length === 0 ? (
            <p className="text-[13px] text-center py-6" style={{ color: 'var(--c-text-muted)' }}>
              {p.catalogEmpty}
            </p>
          ) : (
            filteredCatalog.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  addExerciseToDay(exercisePicker.dayId, item);
                  setExercisePicker({ open: false, dayId: '' });
                  setPickerSearch('');
                }}
                style={surface}
                className="w-full p-3 rounded-xl border flex items-center justify-between gap-3 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer text-start"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[13px] truncate" style={{ color: 'var(--c-heading)' }}>
                    {item.nameFa}
                  </div>
                  <div dir="ltr" className="text-[11px] text-slate-400 font-mono truncate text-end">
                    {item.name}
                  </div>
                </div>
                <span
                  style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-steel)' }}
                  className="px-2 py-1 rounded-md text-[11px] font-medium shrink-0"
                >
                  {item.primaryMuscleFa || item.bodyPartFa}
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
