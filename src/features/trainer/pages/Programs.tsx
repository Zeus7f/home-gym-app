import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  Send,
  Search,
  Undo2,
  FileText,
} from 'lucide-react';
import { H } from '../../../components/ui/H';
import { Btn } from '../../../components/ui/Btn';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
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
import type { Member } from '../../../lib/domain/gymManagement';

/** نام‌های پیشنهادی روزهای تمرینی */
const DAY_TITLES_FA = [
  'روز ۱ — بالاتنه',
  'روز ۲ — پایین‌تنه',
  'روز ۳ — بالاتنه و کول',
  'روز ۴ — پایین‌تنه و شکم',
  'روز ۵ — تمام بدن',
];

const DAY_TITLES_EN = [
  'Day 1 — Upper body',
  'Day 2 — Lower body',
  'Day 3 — Upper body & traps',
  'Day 4 — Lower body & core',
  'Day 5 — Full body',
];

function emptyDay(index: number, isFa: boolean): ProgramDay {
  const titles = isFa ? DAY_TITLES_FA : DAY_TITLES_EN;
  return {
    id: `day-${Date.now()}-${index}`,
    title: titles[index] || (isFa ? `روز ${index + 1}` : `Day ${index + 1}`),
    items: [],
  };
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

  const [exercisePicker, setExercisePicker] = useState<{
    open: boolean;
    dayId: string;
  }>({ open: false, dayId: '' });
  const [pickerSearch, setPickerSearch] = useState('');

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToStore(() => setVersion(v => v + 1));
    return unsub;
  }, []);

  useEffect(() => {
    getTrainer(currentTrainerId).then(t => {
      if (t) setTrainerName(t.name);
    });
  }, [currentTrainerId]);

  useEffect(() => {
    getMembers().then(setMembers);
  }, []);

  useEffect(() => {
    getTrainerPrograms(currentTrainerId).then(setPrograms);
  }, [currentTrainerId, version]);

  const myMembers = useMemo(
    () => members.filter(m => m.defaultTrainerId === currentTrainerId),
    [members, currentTrainerId]
  );

  const selectedMember = myMembers.find(m => m.id === selectedMemberId);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  };

  const resetEditor = () => {
    setSelectedMemberId('');
    setTitle('');
    setDescription('');
    setDays([]);
    setEditingProgramId(undefined);
  };

  /** بارگذاری یک برنامه موجود در ویرایشگر */
  const loadProgram = (program: WorkoutProgram) => {
    setSelectedMemberId(program.memberId);
    setTitle(program.title);
    setDescription(program.description || '');
    setDays(program.days.map(d => ({ ...d, items: [...d.items] })));
    setEditingProgramId(program.id);
  };

  const addDay = () => {
    setDays(prev => [...prev, emptyDay(prev.length, isFa)]);
  };

  const removeDay = (dayId: string) => {
    setDays(prev => prev.filter(d => d.id !== dayId));
  };

  const updateDayTitle = (dayId: string, dayTitle: string) => {
    setDays(prev => prev.map(d => (d.id === dayId ? { ...d, title: dayTitle } : d)));
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

    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? { ...d, items: [...d.items, programExercise] }
          : d
      )
    );
  };

  const removeExerciseFromDay = (dayId: string, index: number) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId ? { ...d, items: d.items.filter((_, i) => i !== index) } : d
      )
    );
  };

  const updateExercise = (
    dayId: string,
    index: number,
    patch: Partial<ProgramExercise>
  ) => {
    setDays(prev =>
      prev.map(d =>
        d.id === dayId
          ? {
              ...d,
              items: d.items.map((item, i) =>
                i === index ? { ...item, ...patch } : item
              ),
            }
          : d
      )
    );
  };

  const handleSaveDraft = async () => {
    if (!selectedMember) {
      showToast('err', t.trainer.today.errorNoAthlete);
      return;
    }
    if (!title.trim()) {
      showToast('err', t.trainer.programs.needsTitle);
      return;
    }

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
    showToast('ok', t.trainer.programs.saved);
  };

  const handlePublish = async () => {
    if (!editingProgramId) {
      showToast('err', t.trainer.programs.needsSave);
      return;
    }
    const res = await publishProgram(editingProgramId);
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

  return (
    <div className="space-y-4">
      {/* انتخاب ورزشکار */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
      >
        <H sub={t.trainer.programs.subtitle}>{t.trainer.programs.title}</H>

        {myMembers.length === 0 ? (
          <p className="mt-3 text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            {t.trainer.programs.noAthletes}
          </p>
        ) : (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {myMembers.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMemberId(m.id);
                  setEditingProgramId(undefined);
                  if (!title) setTitle(`${t.trainer.programs.title} — ${displayName(m.name, isFa)}`);
                }}
                style={{
                  backgroundColor: selectedMemberId === m.id ? 'var(--c-ink)' : 'var(--c-surface-2)',
                  color: selectedMemberId === m.id ? '#ffffff' : 'var(--c-text-muted)',
                }}
                className="px-3 py-1.5 rounded-xl text-[13px] font-bold border border-transparent transition-colors cursor-pointer"
              >
                {displayName(m.name, isFa)}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ویرایشگر برنامه */}
      {selectedMember && (
        <section
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs space-y-3.5"
        >
          <Input
            label={t.trainer.programs.programTitle}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t.trainer.programs.programTitlePlaceholder}
          />

          <Input
            label={t.trainer.programs.description}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t.trainer.programs.descriptionPlaceholder}
          />

          {/* روزها */}
          <div className="space-y-2.5">
            {days.map(day => (
              <div
                key={day.id}
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  borderColor: 'var(--c-border)',
                }}
                className="rounded-2xl border overflow-hidden"
              >
                <div className="flex items-center gap-2 p-3">
                  <input
                    type="text"
                    value={day.title}
                    onChange={e => updateDayTitle(day.id, e.target.value)}
                    className="flex-1 bg-transparent border-none outline-hidden text-[14px] font-bold"
                    style={{ color: 'var(--c-heading)' }}
                    aria-label={t.trainer.programs.dayTitle}
                  />
                  <button
                    type="button"
                    onClick={() => removeDay(day.id)}
                    className="h-8 w-8 rounded-lg grid place-items-center shrink-0 cursor-pointer"
                    style={{ color: 'var(--c-rubber)' }}
                    aria-label={t.trainer.programs.removeDay}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="px-3 pb-3 space-y-1.5">
                  {day.items.length === 0 ? (
                    <p className="text-[12px] py-1" style={{ color: 'var(--c-text-muted)' }}>
                      {t.trainer.programs.noExerciseInDay}
                    </p>
                  ) : (
                    day.items.map((item, idx) => (
                      <div
                        key={`${item.exerciseId}-${idx}`}
                        style={{
                          backgroundColor: 'var(--c-surface-1)',
                          borderColor: 'var(--c-border)',
                        }}
                        className="rounded-xl border p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="flex-1 text-[13px] font-bold truncate min-w-0"
                            style={{ color: 'var(--c-heading)' }}
                          >
                            {item.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExerciseFromDay(day.id, idx)}
                            className="h-7 w-7 rounded-lg grid place-items-center shrink-0 cursor-pointer"
                            style={{ color: 'var(--c-rubber)' }}
                            aria-label={t.trainer.programs.removeExercise.replace('{name}', item.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="text-[11px] mt-1" style={{ color: 'var(--c-text-muted)' }}>
                          {item.bodyPart} · {item.equipment}
                        </div>

                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          <label className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                            {t.trainer.programs.setCount}
                            <input
                              type="number"
                              min={1}
                              value={item.sets}
                              onChange={e =>
                                updateExercise(day.id, idx, {
                                  sets: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-full mt-0.5 h-8 px-2 rounded-lg text-[12px] text-center tnum"
                              style={{
                                backgroundColor: 'var(--c-surface-2)',
                                color: 'var(--c-ink)',
                                border: '1px solid var(--c-border)',
                              }}
                            />
                          </label>
                          <label className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                            {t.trainer.programs.repsMin}
                            <input
                              type="number"
                              min={1}
                              value={item.repsMin}
                              onChange={e =>
                                updateExercise(day.id, idx, {
                                  repsMin: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-full mt-0.5 h-8 px-2 rounded-lg text-[12px] text-center tnum"
                              style={{
                                backgroundColor: 'var(--c-surface-2)',
                                color: 'var(--c-ink)',
                                border: '1px solid var(--c-border)',
                              }}
                            />
                          </label>
                          <label className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                            {t.trainer.programs.repsMax}
                            <input
                              type="number"
                              min={1}
                              value={item.repsMax}
                              onChange={e =>
                                updateExercise(day.id, idx, {
                                  repsMax: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-full mt-0.5 h-8 px-2 rounded-lg text-[12px] text-center tnum"
                              style={{
                                backgroundColor: 'var(--c-surface-2)',
                                color: 'var(--c-ink)',
                                border: '1px solid var(--c-border)',
                              }}
                            />
                          </label>
                          <label className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                            {t.trainer.programs.load}
                            <input
                              type="number"
                              min={0}
                              step={2.5}
                              value={item.loadKg ?? ''}
                              onChange={e =>
                                updateExercise(day.id, idx, {
                                  loadKg: e.target.value === '' ? undefined : Number(e.target.value),
                                })
                              }
                              placeholder="—"
                              className="w-full mt-0.5 h-8 px-2 rounded-lg text-[12px] text-center tnum"
                              style={{
                                backgroundColor: 'var(--c-surface-2)',
                                color: 'var(--c-ink)',
                                border: '1px solid var(--c-border)',
                              }}
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
                      setExercisePicker({ open: true, dayId: day.id });
                      setPickerSearch('');
                    }}
                  >
                    <Plus size={14} />
                    <span>{t.trainer.programs.addExercise}</span>
                  </Btn>
                </div>
              </div>
            ))}

            <Btn v="ghost" className="w-full h-10 text-[13px] gap-1.5" onClick={addDay}>
              <Plus size={15} />
              <span>{t.trainer.programs.addDay}</span>
            </Btn>
          </div>

          {/* دکمه‌های ذخیره و انتشار */}
          <div className="flex gap-2 pt-1">
            <Btn v="soft" className="flex-1 text-[13px] gap-1.5" onClick={handleSaveDraft}>
              <FileText size={15} />
              <span>{t.trainer.programs.saveDraft}</span>
            </Btn>
            <Btn v="primary" className="flex-1 text-[13px] gap-1.5" onClick={handlePublish}>
              <Send size={15} />
              <span>{t.trainer.programs.publish}</span>
            </Btn>
          </div>
        </section>
      )}

      {/* فهرست برنامه‌های این مربی */}
      {programs.length > 0 && (
        <section
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="p-4 rounded-2xl border shadow-xs"
        >
          <H sub={t.trainer.programs.title}>{t.trainer.programs.myPrograms}</H>

          <div className="mt-3 space-y-2">
            {programs.map(program => (
              <div
                key={program.id}
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  borderColor: 'var(--c-border)',
                }}
                className="rounded-xl border p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex-1 text-[14px] font-bold truncate min-w-0"
                    style={{ color: 'var(--c-heading)' }}
                  >
                    {program.title}
                  </span>
                  <span
                    style={{
                      backgroundColor:
                        program.status === 'published'
                          ? 'var(--c-avail-fg)'
                          : 'var(--c-text-faint)',
                      color: program.status === 'published' ? '#ffffff' : 'var(--c-text-muted)',
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                  >
                    {program.status === 'published'
                      ? t.trainer.programs.published
                      : t.trainer.programs.draft}
                  </span>
                </div>

                <div className="text-[12px] mt-1" style={{ color: 'var(--c-text-muted)' }}>
                  {t.trainer.programs.programMeta
                    .replace('{member}', program.memberName)
                    .replace('{days}', num(program.days.length))
                    .replace('{exercises}', num(program.days.reduce((sum, d) => sum + d.items.length, 0)))}
                </div>

                <div className="flex gap-1.5 mt-2.5">
                  <Btn
                    v="ghost"
                    className="h-8 px-2.5 text-[11px]"
                    onClick={() => loadProgram(program)}
                  >
                    {t.trainer.programs.edit}
                  </Btn>
                  {program.status === 'published' ? (
                    <Btn
                      v="soft"
                      className="h-8 px-2.5 text-[11px] gap-1"
                      onClick={() => handleUnpublish(program.id)}
                    >
                      <Undo2 size={12} />
                      <span>{t.trainer.programs.unpublish}</span>
                    </Btn>
                  ) : (
                    <Btn
                      v="soft"
                      className="h-8 px-2.5 text-[11px] gap-1"
                      onClick={() => {
                        setEditingProgramId(program.id);
                        loadProgram(program);
                        setTimeout(handlePublish, 0);
                      }}
                    >
                      <Send size={12} />
                      <span>{t.trainer.programs.publish}</span>
                    </Btn>
                  )}
                  <Btn
                    v="ghost"
                    className="h-8 px-2.5 text-[11px] ms-auto"
                    onClick={() => handleDelete(program.id)}
                    style={{ color: 'var(--c-rubber)' }}
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
          style={{
            backgroundColor:
              toast.type === 'ok' ? 'var(--c-avail-fg)' : 'var(--c-rubber)',
            color: '#ffffff',
          }}
          className="fixed top-4 inset-x-4 z-50 mx-auto max-w-md rounded-xl px-4 py-3 text-[13px] font-bold text-center shadow-lg"
          role="status"
        >
          {toast.text}
        </motion.div>
      )}

      {/* مودال انتخاب حرکت از کاتالوگ */}
      <Modal
        isOpen={exercisePicker.open}
        onClose={() => setExercisePicker({ open: false, dayId: '' })}
        title={t.trainer.programs.catalogTitle}
        description={t.trainer.programs.catalogDesc.replace('{count}', num(EXERCISE_CATALOG.length))}
        maxWidth="lg"
      >
        <div
          style={{
            backgroundColor: 'var(--c-surface-2)',
            borderColor: 'var(--c-border)',
          }}
          className="flex items-center gap-2 px-3 h-11 rounded-xl border text-slate-400"
        >
          <Search size={16} className="shrink-0" />
          <input
            type="text"
            value={pickerSearch}
            onChange={e => setPickerSearch(e.target.value)}
            placeholder={t.trainer.programs.catalogSearch}
            className="w-full bg-transparent border-none outline-hidden text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            autoFocus
          />
        </div>

        <div className="mt-3 space-y-1.5 max-h-[50vh] overflow-y-auto thin-scroll">
          {filteredCatalog.length === 0 ? (
            <p className="text-[13px] text-center py-6" style={{ color: 'var(--c-text-muted)' }}>
              {t.trainer.programs.catalogEmpty}
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
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
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
