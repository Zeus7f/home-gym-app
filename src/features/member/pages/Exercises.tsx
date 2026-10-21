import React, { useState, useMemo, useEffect } from 'react';
import { Search, Play, Image as ImageIcon, Dumbbell, X, Film, CheckCircle2, ChevronDown, Sparkles, CalendarClock } from 'lucide-react';
import { num } from '../../../lib/format';
import { EXERCISE_CATALOG, ExerciseItem } from '../../../api/exercises';
import { getPublishedProgram } from '../../../api/programs';
import { getCurrentUser, subscribeToStore } from '../../../api/auth';
import { useI18n } from '../../../components/LanguageProvider';
import type { WorkoutProgram } from '../../../api/programs';

interface MemberWorkoutItem {
  catalogId: string;
  name: string;
  muscle: string;
  equipment: string;
  sourceUrl?: string | null;
  sourceType?: 'image' | 'video' | 'none';
  sets: Array<{ reps: number | string; weight: number | string }>;
}

/**
 * برنامهٔ پایهٔ پیشنهادی — فقط زمانی نمایش داده می‌شود که مربی هنوز
 * برنامه‌ای منتشر نکرده باشد. شناسه‌ها به کاتالوگ اشاره می‌کنند تا نام و
 * رسانهٔ حرکت مطابق زبان فعال نمایش داده شود.
 */
const MEMBER_BASE_PLAN: Array<
  Omit<MemberWorkoutItem, 'name' | 'muscle' | 'equipment' | 'sourceUrl' | 'sourceType'>
> = [
  {
    catalogId: 'ex-bench-press-dumbbell',
    sets: [
      { reps: 12, weight: 16 },
      { reps: 10, weight: 18 },
      { reps: 8, weight: 20 },
    ],
  },
  {
    catalogId: 'ex-bent-over-row-dumbbell',
    sets: [
      { reps: 12, weight: 14 },
      { reps: 12, weight: 14 },
      { reps: 10, weight: 16 },
    ],
  },
  {
    catalogId: 'ex-bulgarian-split-squat',
    sets: [
      { reps: 10, weight: 10 },
      { reps: 10, weight: 12 },
      { reps: 10, weight: 12 },
    ],
  },
  {
    catalogId: 'ex-hammer-curl-dumbbell',
    sets: [
      { reps: 12, weight: 8 },
      { reps: 12, weight: 10 },
      { reps: 10, weight: 10 },
    ],
  },
  {
    catalogId: 'ex-plank',
    sets: [
      { reps: 45, weight: '-' },
      { reps: 45, weight: '-' },
      { reps: 60, weight: '-' },
    ],
  },
];

export function Exercises() {
  const { t, isFa } = useI18n();
  const [activeTab, setActiveTab] = useState<'my_routine' | 'all_catalog'>('my_routine');
  const [selectedDemo, setSelectedDemo] = useState<ExerciseItem | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [version, setVersion] = useState(0);
  const [program, setProgram] = useState<WorkoutProgram | undefined>(undefined);

  const memberId = getCurrentUser()?.entityId || '';

  useEffect(() => {
    const unsub = subscribeToStore(() => setVersion(v => v + 1));
    return unsub;
  }, []);

  useEffect(() => {
    getPublishedProgram(memberId).then(setProgram);
  }, [memberId, version]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return EXERCISE_CATALOG.filter((item) => {
      if (q) {
        const inFa = item.nameFa?.toLowerCase().includes(q);
        const inEn = item.name?.toLowerCase().includes(q);
        const inM = item.primaryMuscleFa?.toLowerCase().includes(q);
        return inFa || inEn || inM;
      }
      return true;
    }).slice(0, 30);
  }, [catalogSearch]);

  /** برنامهٔ پایه با نام و رسانهٔ کاتالوگ، مطابق زبان فعال */
  const basePlan = useMemo<MemberWorkoutItem[]>(
    () =>
      MEMBER_BASE_PLAN.map(item => {
        const ex = EXERCISE_CATALOG.find(x => x.id === item.catalogId);
        return {
          ...item,
          name: (isFa ? ex?.nameFa : ex?.name) || ex?.nameFa || item.catalogId,
          muscle: (isFa ? ex?.primaryMuscleFa : ex?.primaryMuscle) || ex?.bodyPartFa || '',
          equipment: (isFa ? ex?.equipmentFa : ex?.equipmentName) || ex?.equipmentFa || '',
          sourceUrl: ex?.source ?? null,
          sourceType: ex?.sourceType ?? 'none',
        };
      }),
    [isFa]
  );

  const handleOpenDemo = (catalogId: string) => {
    const found = EXERCISE_CATALOG.find((x) => x.id === catalogId);
    if (found) {
      setSelectedDemo(found);
    }
  };

  /** تعداد کل حرکات در برنامه منتشرشده */
  const programExerciseCount = useMemo(
    () => (program?.days ?? []).reduce((sum, d) => sum + d.items.length, 0),
    [program]
  );

  return (
    <div className="space-y-4">
      {/* تب‌های جابجایی بین برنامه تمرینی شخصی و بانک حرکات */}
      <div
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="flex items-center p-1 rounded-2xl border"
      >
        <button
          type="button"
          onClick={() => setActiveTab('my_routine')}
          style={{
            backgroundColor: activeTab === 'my_routine' ? 'var(--c-steel)' : 'transparent',
            color: activeTab === 'my_routine' ? '#ffffff' : 'var(--c-text-muted)',
          }}
          className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
        >
          {t.member.exercises.myProgram.replace(
            '{count}',
            num(program ? programExerciseCount : basePlan.length)
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all_catalog')}
          style={{
            backgroundColor: activeTab === 'all_catalog' ? 'var(--c-steel)' : 'transparent',
            color: activeTab === 'all_catalog' ? '#ffffff' : 'var(--c-text-muted)',
          }}
          className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sparkles size={14} />
          {t.member.exercises.catalogTab}
        </button>
      </div>

      {activeTab === 'my_routine' ? (
        program ? (
          /* برنامه منتشرشده توسط مربی */
          <div className="space-y-4">
            <div
              className="text-[13px] font-medium flex justify-between items-center gap-2"
              style={{ color: 'var(--c-text-muted)' }}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <CalendarClock size={14} className="shrink-0" />
                <span className="truncate">
                  {t.member.exercises.publishedBy.replace('{trainer}', program.trainerName)}
                </span>
              </span>
              <span className="text-[11px] text-slate-400 shrink-0">{t.member.exercises.clickForVideo}</span>
            </div>

            {program.days.map(day => (
              <section
                key={day.id}
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-4 rounded-2xl border shadow-xs"
                aria-label={day.title}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-[15px]" style={{ color: 'var(--c-heading)' }}>
                    {day.title}
                  </h3>
                  <span
                    style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-text-muted)' }}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0"
                  >
                    {t.member.exercises.dayExercises.replace('{count}', num(day.items.length))}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {day.items.map((item, idx) => (
                    <div
                      key={`${item.exerciseId}-${idx}`}
                      onClick={() => handleOpenDemo(item.exerciseId)}
                      style={{
                        backgroundColor: 'var(--c-surface-2)',
                        borderColor: 'var(--c-border)',
                      }}
                      className="p-3 rounded-xl border flex items-center gap-3 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer group"
                    >
                      <span
                        style={{ backgroundColor: 'var(--c-surface-1)', color: 'var(--c-steel)' }}
                        className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
                      >
                        <Dumbbell size={17} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div
                          className="font-bold text-[14px] truncate"
                          style={{ color: 'var(--c-heading)' }}
                        >
                          {item.name}
                        </div>
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--c-text-muted)' }}>
                          {t.member.exercises.targetMuscle.replace('{value}', item.bodyPart)} · {item.equipment}
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <div className="text-[12px] font-bold tnum" style={{ color: 'var(--c-ink)' }}>
                          {num(item.sets)} × {num(item.repsMin)}-{num(item.repsMax)}
                        </div>
                        {item.loadKg !== undefined && (
                          <div className="text-[11px] tnum" style={{ color: 'var(--c-text-muted)' }}>
                            {num(item.loadKg)} {t.units.kg}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* حالت بدون برنامه منتشرشده */
          <div className="space-y-3.5">
            <div
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="p-8 rounded-2xl border text-center"
            >
              <Dumbbell size={26} className="mx-auto" style={{ color: 'var(--c-steel)' }} />
              <p className="mt-3 text-[15px] font-bold" style={{ color: 'var(--c-heading)' }}>
                {t.member.exercises.emptyTitle}
              </p>
              <p className="mt-1 text-[13px] leading-6" style={{ color: 'var(--c-text-muted)' }}>
                {t.member.exercises.emptyBody}
              </p>
            </div>

            <div
              className="text-[13px] font-medium flex justify-between items-center"
              style={{ color: 'var(--c-text-muted)' }}
            >
              <span>{t.member.exercises.basePlan}</span>
              <span className="text-[11px] text-slate-400">{t.member.exercises.clickForVideo}</span>
            </div>

            {basePlan.map((ex) => (
              <section
                key={ex.name}
                onClick={() => handleOpenDemo(ex.catalogId)}
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-3.5 sm:p-4 rounded-2xl border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
                aria-label={ex.name}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* پیش‌نمایش بندانگشتی ویدیو/تصویر */}
                    <div
                      style={{ backgroundColor: 'var(--c-surface-2)' }}
                      className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center relative"
                    >
                      {ex.sourceUrl && ex.sourceType === 'image' ? (
                        <img
                          src={ex.sourceUrl}
                          alt={ex.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : ex.sourceUrl && ex.sourceType === 'video' ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                          <video
                            src={ex.sourceUrl}
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play size={14} className="fill-white text-white ms-0.5" />
                          </div>
                        </div>
                      ) : (
                        <Dumbbell size={20} style={{ color: 'var(--c-steel)' }} />
                      )}
                    </div>

                    <div>
                      <h3
                        className="font-bold text-[15px] sm:text-[16px] group-hover:text-sky-600 transition-colors"
                        style={{ color: 'var(--c-heading)' }}
                      >
                        {ex.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[12px]"
                          style={{ color: 'var(--c-text-muted)' }}
                        >
                          {t.member.exercises.targetMuscle.replace('{value}', ex.muscle)}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {ex.equipment}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 font-medium shrink-0 flex items-center gap-1">
                    <span>{t.member.exercises.videoAndGuide}</span>
                  </div>
                </div>

                {/* شبکه ست‌های انجام‌شده */}
                <div className="mt-3.5 grid grid-cols-3 gap-2">
                  {ex.sets.map((set, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: 'var(--c-surface-2)' }}
                      className="rounded-xl py-2 px-2 text-center"
                    >
                      <div
                        className="text-[11px]"
                        style={{ color: 'var(--c-text-muted)' }}
                      >
                        {t.member.exercises.setLabel.replace('{n}', num(i + 1))}
                      </div>
                      <div
                        className="font-bold tnum text-[13px] sm:text-[14px] mt-0.5"
                        style={{ color: 'var(--c-heading)' }}
                      >
                        {typeof set.reps === 'number' ? num(set.reps) : set.reps}
                        {set.weight !== '-' && (
                          <span
                            className="text-[11px] font-normal ms-1"
                            style={{ color: 'var(--c-text-muted)' }}
                          >
                            × {num(set.weight)}{t.units.kg}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        /* تب جستجو در تمام بانک ۴۱۳ حرکت */
        <div className="space-y-3.5">
          <div
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="flex items-center gap-2 h-11 px-3 rounded-xl border text-slate-400"
          >
            <Search size={18} className="shrink-0" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder={t.member.exercises.catalogSearch}
              className="w-full bg-transparent border-none outline-hidden text-[14px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedDemo(item)}
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-3 rounded-2xl border flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    style={{ backgroundColor: 'var(--c-surface-2)' }}
                    className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative"
                  >
                    {item.source && item.sourceType === 'image' ? (
                      <img
                        src={item.source}
                        alt={item.nameFa}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : item.source && item.sourceType === 'video' ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                        <Play size={14} className="fill-white text-white" />
                      </div>
                    ) : (
                      <Dumbbell size={18} style={{ color: 'var(--c-steel)' }} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div
                      className="font-bold text-[13px] sm:text-[14px] truncate"
                      style={{ color: 'var(--c-heading)' }}
                    >
                      {item.nameFa}
                    </div>
                    <div
                      dir="ltr"
                      className="text-[11px] text-slate-400 font-mono truncate text-end"
                    >
                      {item.name}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-steel)',
                  }}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium shrink-0"
                >
                  {item.primaryMuscleFa || item.bodyPartFa}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* مودال نمایش جزئیات و ویدیو حرکت برای ورزشکار */}
      {selectedDemo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedDemo(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="relative w-full bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
              {selectedDemo.source && selectedDemo.sourceType === 'video' ? (
                <video
                  src={selectedDemo.source}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : selectedDemo.source && selectedDemo.sourceType === 'image' ? (
                <img
                  src={selectedDemo.source}
                  alt={selectedDemo.nameFa}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 p-8 space-y-2">
                  <Dumbbell className="w-12 h-12 mx-auto opacity-40 text-slate-300" />
                  <div className="text-sm font-medium">{t.member.exercises.graphicOnly}</div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedDemo(null)}
                className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                aria-label={t.member.exercises.close}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <h3
                  className="text-lg font-black"
                  style={{ color: 'var(--c-heading)' }}
                >
                  {selectedDemo.nameFa}
                </h3>
                <p dir="ltr" className="text-xs text-slate-400 font-mono text-end mt-0.5">
                  {selectedDemo.name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-steel)',
                  }}
                  className="px-3 py-1 rounded-lg font-bold"
                >
                  {t.member.exercises.primaryMuscle.replace(
                  '{value}',
                  selectedDemo.primaryMuscleFa || selectedDemo.bodyPartFa
                )}
                </span>

                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-text-muted)',
                  }}
                  className="px-3 py-1 rounded-lg font-medium"
                >
                  {t.member.exercises.equipment.replace('{value}', selectedDemo.equipmentFa)}
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <CheckCircle2 size={15} style={{ color: 'var(--c-steel)' }} />
                  <span>{t.member.exercises.trainerNote}:</span>
                </div>
                <p style={{ color: 'var(--c-text-muted)' }}>
                  {selectedDemo.instructionsFa}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDemo(null)}
                style={{
                  backgroundColor: 'var(--c-steel)',
                  color: '#ffffff',
                }}
                className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer"
              >
                {t.member.exercises.closeAndContinue}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
