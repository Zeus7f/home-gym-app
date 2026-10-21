import React, { useState, useMemo } from 'react';
import { Search, Play, Image as ImageIcon, Dumbbell, X, Film, CheckCircle2 } from 'lucide-react';
import { Chips } from '../../../components/ui/Chips';
import { EXERCISE_CATALOG, ExerciseItem } from '../../../api/exercises';
import { num } from '../../../lib/format';
import { useI18n } from '../../../components/LanguageProvider';

/**
 * دسته‌بندی عضلات.
 *
 * کلیدها مستقل از زبان‌اند و منطق تطبیق روی داده‌های انگلیسی کاتالوگ
 * انجام می‌شود تا فیلتر در هر دو زبان نتیجهٔ یکسان بدهد.
 */
const CATS: Array<{
  key: string;
  fa: string;
  en: string;
  match: (item: ExerciseItem) => boolean;
}> = [
  { key: 'all', fa: 'همه', en: 'All', match: () => true },
  {
    key: 'chest',
    fa: 'سینه',
    en: 'Chest',
    match: i => i.bodyPart === 'chest',
  },
  {
    key: 'back',
    fa: 'پشت',
    en: 'Back',
    match: i =>
      i.bodyPart === 'back' ||
      ['Upper Back', 'Lats', 'Traps'].includes(i.primaryMuscle || ''),
  },
  {
    key: 'legs',
    fa: 'پا',
    en: 'Legs',
    match: i =>
      i.bodyPart === 'legs' ||
      ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'].includes(
        i.primaryMuscle || ''
      ),
  },
  {
    key: 'shoulders',
    fa: 'سرشانه',
    en: 'Shoulders',
    match: i => i.bodyPart === 'shoulders',
  },
  {
    key: 'arms',
    fa: 'بازو',
    en: 'Arms',
    match: i =>
      i.bodyPart === 'arms' ||
      ['Biceps', 'Triceps', 'Forearms'].includes(i.primaryMuscle || ''),
  },
  {
    key: 'core',
    fa: 'شکم',
    en: 'Core',
    match: i => i.bodyPart === 'core' || i.primaryMuscle === 'Abdominals',
  },
  {
    key: 'cardio',
    fa: 'هوازی',
    en: 'Cardio',
    match: i => i.bodyPart === 'cardio' || i.primaryMuscle === 'Cardio',
  },
  {
    key: 'lowerback',
    fa: 'فیله کمر',
    en: 'Lower Back',
    match: i => i.primaryMuscle === 'Lower Back',
  },
  {
    key: 'calves',
    fa: 'ساق پا',
    en: 'Calves',
    match: i => i.primaryMuscle === 'Calves',
  },
];

const EQUIPMENTS: Array<{
  key: string;
  fa: string;
  en: string;
  match: (item: ExerciseItem) => boolean;
}> = [
  { key: 'all', fa: 'همه', en: 'All', match: () => true },
  {
    key: 'barbell',
    fa: 'هالتر',
    en: 'Barbell',
    match: i => i.equipment === 'barbell',
  },
  {
    key: 'dumbbell',
    fa: 'دمبل',
    en: 'Dumbbell',
    match: i => i.equipment === 'dumbbell',
  },
  {
    key: 'machine',
    fa: 'دستگاه',
    en: 'Machine',
    match: i => i.equipment === 'machine' || i.equipment === 'cable',
  },
  {
    key: 'bodyweight',
    fa: 'وزن بدن',
    en: 'Bodyweight',
    match: i => i.equipment === 'bodyweight',
  },
  {
    key: 'band',
    fa: 'کش تمرینی',
    en: 'Band',
    match: i => i.equipment === 'band',
  },
  {
    key: 'kettlebell',
    fa: 'کتل‌بل',
    en: 'Kettlebell',
    match: i => i.equipment === 'kettlebell',
  },
  {
    key: 'trx',
    fa: 'تی‌آر‌ایکس',
    en: 'Suspension',
    match: i => i.equipment === 'foam_roller',
  },
];

export function Catalog() {
  const { t, isFa } = useI18n();
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedEq, setSelectedEq] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  const exName = (e: ExerciseItem) => (isFa ? e.nameFa : e.name) || e.nameFa;
  const exMuscle = (e: ExerciseItem) =>
    (isFa ? e.primaryMuscleFa : e.primaryMuscle) || e.bodyPartFa;
  const exEquipment = (e: ExerciseItem) =>
    (isFa ? e.equipmentFa : e.equipmentName) || e.equipmentFa;
  const exSecondary = (e: ExerciseItem) =>
    (isFa ? e.secondaryMusclesFa : e.secondaryMuscles) ?? e.secondaryMusclesFa ?? [];

  const catLabel = (c: (typeof CATS)[number]) => (isFa ? c.fa : c.en);
  const eqLabel = (e: (typeof EQUIPMENTS)[number]) => (isFa ? e.fa : e.en);

  // Filter exercises
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cat = CATS.find(c => c.key === selectedCat) ?? CATS[0];
    const eq = EQUIPMENTS.find(e => e.key === selectedEq) ?? EQUIPMENTS[0];

    return EXERCISE_CATALOG.filter((item) => {
      // فیلتر دسته‌بندی عضله
      if (!cat.match(item)) return false;

      // فیلتر تجهیزات
      if (!eq.match(item)) return false;

      // جستجو
      if (q) {
        const inFa = item.nameFa?.toLowerCase().includes(q);
        const inEn = item.name?.toLowerCase().includes(q);
        const inMuscle =
          item.primaryMuscleFa?.toLowerCase().includes(q) ||
          item.primaryMuscle?.toLowerCase().includes(q);
        const inEq = item.equipmentFa?.toLowerCase().includes(q);
        if (!inFa && !inEn && !inMuscle && !inEq) return false;
      }

      return true;
    });
  }, [selectedCat, selectedEq, search]);

  const visibleItems = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  return (
    <div className="space-y-4">
      {/* سرچ‌بار جستجوی کاتالوگ */}
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
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisibleCount(24);
          }}
          placeholder={t.trainer.catalog.searchPlaceholder}
          className="w-full bg-transparent border-none outline-hidden text-[14px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            {isFa ? 'پاک کردن' : 'Clear'}
          </button>
        )}
      </div>

      {/* چیپ‌های دسته‌بندی عضلات */}
      <div className="space-y-2">
        <Chips
          value={selectedCat}
          onChange={(cat) => {
            setSelectedCat(cat);
            setVisibleCount(24);
          }}
          items={CATS.map((x) => [x.key, catLabel(x)] as const)}
        />

        {/* فیلتر تجهیزات جانبی */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px] no-scrollbar">
          <span className="text-slate-400 shrink-0 me-1">{t.trainer.catalog.toolLabel}</span>
          {EQUIPMENTS.map((eq) => {
            const isActive = selectedEq === eq.key;
            return (
              <button
                key={eq.key}
                type="button"
                onClick={() => {
                  setSelectedEq(eq.key);
                  setVisibleCount(24);
                }}
                style={{
                  backgroundColor: isActive ? 'var(--c-steel)' : 'var(--c-surface-2)',
                  color: isActive ? '#ffffff' : 'var(--c-text-muted)',
                  borderColor: isActive ? 'var(--c-steel)' : 'var(--c-border)',
                }}
                className="px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-colors cursor-pointer"
              >
                {eqLabel(eq)}
              </button>
            );
          })}
        </div>
      </div>

      {/* تعداد نتایج */}
      <div className="flex justify-between items-center text-[12px] text-slate-500 px-1">
        <span>
          {t.trainer.catalog.showing
            .replace('{shown}', num(visibleItems.length))
            .replace('{total}', num(filtered.length))}
        </span>
        {filtered.length > 0 && (
          <span className="text-[11px] text-slate-400">{t.trainer.catalog.bankNote}</span>
        )}
      </div>

      {/* گرید حرکات ورزشی */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleItems.map((ex) => (
          <div
            key={ex.id}
            onClick={() => setSelectedExercise(ex)}
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="rounded-2xl border overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all select-none cursor-pointer flex flex-col justify-between group"
          >
            {/* مدیا: تصویر یا ویدیو یا آیکون هالتر */}
            <div
              style={{
                backgroundColor: 'var(--c-surface-2)',
                color: 'var(--c-steel)',
              }}
              className="h-28 sm:h-32 w-full relative overflow-hidden flex items-center justify-center"
            >
              {ex.source && ex.sourceType === 'image' ? (
                <img
                  src={ex.source}
                  alt={exName(ex)}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder on broken link
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : ex.source && ex.sourceType === 'video' ? (
                <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                  <video
                    src={ex.source}
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => {
                      const v = e.target as HTMLVideoElement;
                      v.pause();
                      v.currentTime = 0;
                    }}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity bg-black/20">
                    <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs">
                      <Play size={14} className="fill-white ms-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 opacity-70">
                  <svg width="48" height="30" viewBox="0 0 30 20" aria-hidden="true">
                    <rect x="0" y="4" width="4" height="12" rx="1" fill="currentColor" />
                    <rect x="5" y="1" width="4" height="18" rx="1" fill="currentColor" />
                    <rect x="9" y="9" width="12" height="2" fill="currentColor" />
                    <rect x="21" y="1" width="4" height="18" rx="1" fill="currentColor" />
                    <rect x="26" y="4" width="4" height="12" rx="1" fill="currentColor" />
                  </svg>
                  <span className="text-[10px] text-slate-400">{t.trainer.catalog.mediaGraphic}</span>
                </div>
              )}

              {/* نشان نوع مدیا */}
              {ex.sourceType === 'video' && (
                <div className="absolute top-2 start-2 px-1.5 py-0.5 rounded-md bg-black/65 text-white text-[10px] flex items-center gap-1 backdrop-blur-xs">
                  <Film size={10} />
                  <span>{t.trainer.catalog.mediaVideo}</span>
                </div>
              )}
              {ex.sourceType === 'image' && (
                <div className="absolute top-2 start-2 px-1.5 py-0.5 rounded-md bg-black/65 text-white text-[10px] flex items-center gap-1 backdrop-blur-xs">
                  <ImageIcon size={10} />
                  <span>{t.trainer.catalog.mediaImage}</span>
                </div>
              )}
            </div>

            {/* مشخصات حرکت */}
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <div
                  className="font-bold text-[13px] sm:text-[14px] leading-snug line-clamp-2"
                  style={{ color: 'var(--c-deep)' }}
                  title={exName(ex)}
                >
                  {exName(ex)}
                </div>
                <div
                  dir="ltr"
                  className="text-[11px] text-slate-400 font-mono truncate mt-0.5"
                  title={ex.name}
                >
                  {ex.name}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-steel)',
                  }}
                  className="px-2 py-0.5 rounded-md font-medium truncate max-w-[90px]"
                >
                  {exMuscle(ex)}
                </span>
                <span
                  style={{ color: 'var(--c-text-muted)' }}
                  className="truncate max-w-[80px]"
                >
                  {exEquipment(ex)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="col-span-2 md:col-span-3 lg:col-span-4 py-16 text-center rounded-2xl border text-sm space-y-2"
          >
            <Dumbbell className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
            <div className="font-bold text-slate-700 dark:text-slate-300">{t.trainer.catalog.notFound}</div>
            <div className="text-xs text-slate-400">{t.trainer.catalog.notFoundHint}</div>
          </div>
        )}
      </div>

      {/* دکمه بارگذاری بیشتر */}
      {visibleCount < filtered.length && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 24)}
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
              color: 'var(--c-steel)',
            }}
            className="px-6 py-2.5 rounded-xl border text-[13px] font-bold hover:shadow-xs transition-shadow cursor-pointer"
          >
            {t.trainer.catalog.loadMore.replace('{count}', num(24))} ({num(filtered.length - visibleCount)} {t.actions.none === 'هیچ' ? 'باقیمانده' : 'left'})
          </button>
        </div>
      )}

      {/* مودال جزئیات حرکت ورزشی */}
      {selectedExercise && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* مدیا پلیر اصلی */}
            <div className="relative w-full bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
              {selectedExercise.source && selectedExercise.sourceType === 'video' ? (
                <video
                  src={selectedExercise.source}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : selectedExercise.source && selectedExercise.sourceType === 'image' ? (
                <img
                  src={selectedExercise.source}
                  alt={exName(selectedExercise)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 p-8 space-y-2">
                  <Dumbbell className="w-12 h-12 mx-auto opacity-40 text-slate-300" />
                  <div className="text-sm font-medium">{t.trainer.catalog.mediaGraphic}</div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                aria-label={t.actions.close}
              >
                <X size={16} />
              </button>
            </div>

            {/* اطلاعات حرکت */}
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <h3
                  className="text-lg font-black"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {exName(selectedExercise)}
                </h3>
                <p dir="ltr" className="text-xs text-slate-400 font-mono text-end mt-0.5">
                  {selectedExercise.name}
                </p>
              </div>

              {/* برچسب‌های عضله و تجهیزات */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-steel)',
                  }}
                  className="px-3 py-1 rounded-lg font-bold"
                >
                  {t.trainer.catalog.primaryMuscle.replace(
                    '{value}',
                    exMuscle(selectedExercise)
                  )}
                </span>

                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-text-muted)',
                  }}
                  className="px-3 py-1 rounded-lg font-medium"
                >
                  {t.trainer.catalog.equipment.replace(
                    '{value}',
                    exEquipment(selectedExercise)
                  )}
                </span>

                {exSecondary(selectedExercise).length > 0 && (
                  <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                    {t.trainer.catalog.secondaryMuscles.replace(
                      '{value}',
                      exSecondary(selectedExercise).join(isFa ? '، ' : ', ')
                    )}
                  </span>
                )}
              </div>

              {/* دستورالعمل و راهنمای اجرا */}
              <div
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <CheckCircle2 size={15} style={{ color: 'var(--c-steel)' }} />
                  <span>{t.trainer.catalog.howTo}:</span>
                </div>
                <p style={{ color: 'var(--c-text-muted)' }}>
                  {selectedExercise.instructionsFa}
                </p>
              </div>

              {/* دکمه بستن */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedExercise(null)}
                  style={{
                    backgroundColor: 'var(--c-steel)',
                    color: '#ffffff',
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer shadow-xs"
                >
                  {t.trainer.catalog.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
