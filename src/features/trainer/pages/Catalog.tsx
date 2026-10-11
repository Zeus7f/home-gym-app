import React, { useState, useMemo } from 'react';
import { Search, Play, Image as ImageIcon, Dumbbell, X, Film, CheckCircle2 } from 'lucide-react';
import { Chips } from '../../../components/ui/Chips';
import { EXERCISE_CATALOG, ExerciseItem } from '../../../api/exercises';
import { fa } from '../../../lib/format';

const CATS = [
  'همه',
  'سینه',
  'پشت',
  'پا',
  'سرشانه',
  'بازو',
  'شکم',
  'هوازی',
  'فیله کمر',
  'ساق پا',
] as const;

const EQUIPMENTS = [
  'همه',
  'هالتر',
  'دمبل',
  'دستگاه',
  'وزن بدن',
  'کش تمرینی',
  'کتل‌بل',
  'تی‌آر‌ایکس',
] as const;

export function Catalog() {
  const [selectedCat, setSelectedCat] = useState<string>('همه');
  const [selectedEq, setSelectedEq] = useState<string>('همه');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Filter exercises
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return EXERCISE_CATALOG.filter((item) => {
      // فیلتر دسته‌بندی عضله
      if (selectedCat !== 'همه') {
        const matchCat =
          item.bodyPartFa.includes(selectedCat) ||
          item.primaryMuscleFa?.includes(selectedCat) ||
          (selectedCat === 'پشت' && (item.bodyPart === 'back' || item.primaryMuscle === 'Upper Back' || item.primaryMuscle === 'Lats')) ||
          (selectedCat === 'بازو' && (item.primaryMuscle === 'Biceps' || item.primaryMuscle === 'Triceps' || item.primaryMuscle === 'Forearms')) ||
          (selectedCat === 'پا' && (item.primaryMuscle === 'Quadriceps' || item.primaryMuscle === 'Hamstrings' || item.primaryMuscle === 'Glutes' || item.primaryMuscle === 'Calves'));
        if (!matchCat) return false;
      }

      // فیلتر تجهیزات
      if (selectedEq !== 'همه') {
        const matchEq =
          item.equipmentFa.includes(selectedEq) ||
          (selectedEq === 'وزن بدن' && (item.equipment === 'bodyweight' || item.equipmentFa === 'وزن بدن'));
        if (!matchEq) return false;
      }

      // جستجو
      if (q) {
        const inFa = item.nameFa?.toLowerCase().includes(q);
        const inEn = item.name?.toLowerCase().includes(q);
        const inMuscle = item.primaryMuscleFa?.toLowerCase().includes(q) || item.primaryMuscle?.toLowerCase().includes(q);
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
          placeholder="جستجوی نام فارسی، انگلیسی یا عضله هدف در بین ۴۱۳ حرکت…"
          className="w-full bg-transparent border-none outline-hidden text-[14px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            پاک کردن
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
          items={CATS.map((x) => [x, x])}
        />

        {/* فیلتر تجهیزات جانبی */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px] no-scrollbar">
          <span className="text-slate-400 shrink-0 me-1">ابزار:</span>
          {EQUIPMENTS.map((eq) => {
            const isActive = selectedEq === eq;
            return (
              <button
                key={eq}
                type="button"
                onClick={() => {
                  setSelectedEq(eq);
                  setVisibleCount(24);
                }}
                style={{
                  backgroundColor: isActive ? 'var(--c-steel)' : 'var(--c-surface-2)',
                  color: isActive ? '#ffffff' : 'var(--c-text-muted)',
                  borderColor: isActive ? 'var(--c-steel)' : 'var(--c-border)',
                }}
                className="px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-colors cursor-pointer"
              >
                {eq}
              </button>
            );
          })}
        </div>
      </div>

      {/* تعداد نتایج */}
      <div className="flex justify-between items-center text-[12px] text-slate-500 px-1">
        <span>
          نمایش {fa(visibleItems.length)} از {fa(filtered.length)} حرکت یافته‌شده
        </span>
        {filtered.length > 0 && (
          <span className="text-[11px] text-slate-400">بانک حرکات: ۴۱۳ تمرین با مدیا</span>
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
                  alt={ex.nameFa}
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
                  <span className="text-[10px] text-slate-400">نمایش گرافیکی</span>
                </div>
              )}

              {/* نشان نوع مدیا */}
              {ex.sourceType === 'video' && (
                <div className="absolute top-2 start-2 px-1.5 py-0.5 rounded-md bg-black/65 text-white text-[10px] flex items-center gap-1 backdrop-blur-xs">
                  <Film size={10} />
                  <span>ویدیو</span>
                </div>
              )}
              {ex.sourceType === 'image' && (
                <div className="absolute top-2 start-2 px-1.5 py-0.5 rounded-md bg-black/65 text-white text-[10px] flex items-center gap-1 backdrop-blur-xs">
                  <ImageIcon size={10} />
                  <span>تصویر</span>
                </div>
              )}
            </div>

            {/* مشخصات حرکت */}
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <div
                  className="font-bold text-[13px] sm:text-[14px] leading-snug line-clamp-2"
                  style={{ color: 'var(--c-deep)' }}
                  title={ex.nameFa}
                >
                  {ex.nameFa}
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
                  {ex.primaryMuscleFa || ex.bodyPartFa}
                </span>
                <span
                  style={{ color: 'var(--c-text-muted)' }}
                  className="truncate max-w-[80px]"
                >
                  {ex.equipmentFa}
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
            <div className="font-bold text-slate-700 dark:text-slate-300">حرکتی با این مشخصات یافت نشد</div>
            <div className="text-xs text-slate-400">لطفاً فیلترها یا عبارت جستجو را تغییر دهید.</div>
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
            نمایش ۲۴ حرکت دیگر ({fa(filtered.length - visibleCount)} باقیمانده)
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
                  alt={selectedExercise.nameFa}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 p-8 space-y-2">
                  <Dumbbell className="w-12 h-12 mx-auto opacity-40 text-slate-300" />
                  <div className="text-sm font-medium">پیش‌نمایش گرافیکی استاندارد</div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                aria-label="بستن"
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
                  {selectedExercise.nameFa}
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
                  عضله اصلی: {selectedExercise.primaryMuscleFa || selectedExercise.bodyPartFa}
                </span>

                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-text-muted)',
                  }}
                  className="px-3 py-1 rounded-lg font-medium"
                >
                  تجهیزات: {selectedExercise.equipmentFa}
                </span>

                {selectedExercise.secondaryMusclesFa && selectedExercise.secondaryMusclesFa.length > 0 && (
                  <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                    عضلات کمکی: {selectedExercise.secondaryMusclesFa.join('، ')}
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
                  <span>راهنمای فنی اجرای حرکت:</span>
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
                  متوجه شدم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
