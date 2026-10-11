import React, { useState, useMemo } from 'react';
import { Search, Play, Image as ImageIcon, Dumbbell, X, Film, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { fa } from '../../../lib/format';
import { EXERCISE_CATALOG, ExerciseItem } from '../../../api/exercises';

interface MemberWorkoutItem {
  catalogId: string;
  name: string;
  muscle: string;
  equipment: string;
  sourceUrl?: string | null;
  sourceType?: 'image' | 'video' | 'none';
  sets: Array<{ reps: number | string; weight: number | string }>;
}

// Workout plan using verified items from the new 413 catalog
const MEMBER_CURRENT_PLAN: MemberWorkoutItem[] = [
  {
    catalogId: 'ex-bench-press-dumbbell',
    name: 'پرس سینه دمبل',
    muscle: 'سینه و بالاتنه',
    equipment: 'دمبل',
    sourceUrl: 'https://pump-app.s3.eu-west-2.amazonaws.com/exercise-assets/02891201-Dumbbell-Bench-Press_Chest.mp4',
    sourceType: 'video',
    sets: [
      { reps: 12, weight: 16 },
      { reps: 10, weight: 18 },
      { reps: 8, weight: 20 },
    ],
  },
  {
    catalogId: 'ex-bent-over-row-dumbbell',
    name: 'زیربغل دمبل خم (اره‌ای)',
    muscle: 'پشت و زیربغل',
    equipment: 'دمبل',
    sourceUrl: 'https://pump-app.s3.eu-west-2.amazonaws.com/exercise-assets/02931201-Dumbbell-Bent-Over-Row_Back.mp4',
    sourceType: 'video',
    sets: [
      { reps: 12, weight: 14 },
      { reps: 12, weight: 14 },
      { reps: 10, weight: 16 },
    ],
  },
  {
    catalogId: 'ex-bulgarian-split-squat',
    name: 'اسکات بلغاری با دمبل',
    muscle: 'پا و چهارسر ران',
    equipment: 'دمبل',
    sourceUrl: 'https://pump-app.s3.eu-west-2.amazonaws.com/exercise-assets/22901101-Dumbbell-Bulgarian-Split-Squat-(female)_Thighs_small.jpg',
    sourceType: 'image',
    sets: [
      { reps: 10, weight: 10 },
      { reps: 10, weight: 12 },
      { reps: 10, weight: 12 },
    ],
  },
  {
    catalogId: 'ex-hammer-curl-dumbbell',
    name: 'جلو بازو چکشی دمبل',
    muscle: 'دست و جلو بازو',
    equipment: 'دمبل',
    sourceUrl: 'https://pump-app.s3.eu-west-2.amazonaws.com/exercise-assets/02941201-Dumbbell-Biceps-Curl_Upper-Arms.mp4',
    sourceType: 'video',
    sets: [
      { reps: 12, weight: 8 },
      { reps: 12, weight: 10 },
      { reps: 10, weight: 10 },
    ],
  },
  {
    catalogId: 'ex-plank',
    name: 'پلانک شکم ثابت روی ساعد',
    muscle: 'شکم و مرکز بدن',
    equipment: 'وزن بدن',
    sourceUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&auto=format&fit=crop&q=80',
    sourceType: 'image',
    sets: [
      { reps: '۴۵ ثانیه', weight: '-' },
      { reps: '۴۵ ثانیه', weight: '-' },
      { reps: '۶۰ ثانیه', weight: '-' },
    ],
  },
];

export function Exercises() {
  const [activeTab, setActiveTab] = useState<'my_routine' | 'all_catalog'>('my_routine');
  const [selectedDemo, setSelectedDemo] = useState<ExerciseItem | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('همه');

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return EXERCISE_CATALOG.filter((item) => {
      if (selectedMuscle !== 'همه' && !item.bodyPartFa.includes(selectedMuscle) && !item.primaryMuscleFa?.includes(selectedMuscle)) {
        return false;
      }
      if (q) {
        const inFa = item.nameFa?.toLowerCase().includes(q);
        const inEn = item.name?.toLowerCase().includes(q);
        const inM = item.primaryMuscleFa?.toLowerCase().includes(q);
        return inFa || inEn || inM;
      }
      return true;
    }).slice(0, 30);
  }, [catalogSearch, selectedMuscle]);

  const handleOpenDemo = (catalogId: string) => {
    const found = EXERCISE_CATALOG.find((x) => x.id === catalogId);
    if (found) {
      setSelectedDemo(found);
    }
  };

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
          برنامه تمرینی من ({fa(MEMBER_CURRENT_PLAN.length)} حرکت)
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
          بانک ۴۱۳ حرکت باشگاه
        </button>
      </div>

      {activeTab === 'my_routine' ? (
        <div className="space-y-3.5">
          <div
            className="text-[13px] font-medium flex justify-between items-center"
            style={{ color: 'var(--c-text-muted)' }}
          >
            <span>آخرین برنامه ثبت‌شده توسط سارا کریمی · دوشنبه ۱۳ مهر</span>
            <span className="text-[11px] text-slate-400">کلیک روی هر حرکت برای ویدیو</span>
          </div>

          {MEMBER_CURRENT_PLAN.map((ex) => (
            <section
              key={ex.name}
              onClick={() => handleOpenDemo(ex.catalogId)}
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="p-3.5 sm:p-4 rounded-2xl border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
              aria-label={`حرکت ${ex.name}`}
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
                      style={{ color: 'var(--c-deep)' }}
                    >
                      {ex.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[12px]"
                        style={{ color: 'var(--c-text-muted)' }}
                      >
                        عضله هدف: {ex.muscle}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {ex.equipment}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 font-medium shrink-0 flex items-center gap-1">
                  <span>ویدیو و آموزش</span>
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
                      ست {fa(i + 1)}
                    </div>
                    <div
                      className="font-bold tnum text-[13px] sm:text-[14px] mt-0.5"
                      style={{ color: 'var(--c-deep)' }}
                    >
                      {typeof set.reps === 'number' ? fa(set.reps) : set.reps}
                      {set.weight !== '-' && (
                        <span
                          className="text-[11px] font-normal ms-1"
                          style={{ color: 'var(--c-text-muted)' }}
                        >
                          × {fa(set.weight)}kg
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
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
              placeholder="جستجو در تمام ۴۱۳ حرکت (سینه، اسکات، دمبل، هالتر…)…"
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
                      style={{ color: 'var(--c-deep)' }}
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
                  <div className="text-sm font-medium">نمایش تصویری حرکت</div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedDemo(null)}
                className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                aria-label="بستن"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <h3
                  className="text-lg font-black"
                  style={{ color: 'var(--c-deep)' }}
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
                  عضله اصلی: {selectedDemo.primaryMuscleFa || selectedDemo.bodyPartFa}
                </span>

                <span
                  style={{
                    backgroundColor: 'var(--c-surface-2)',
                    color: 'var(--c-text-muted)',
                  }}
                  className="px-3 py-1 rounded-lg font-medium"
                >
                  تجهیزات: {selectedDemo.equipmentFa}
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
                  <span>توضیح مربی برای اجرای صحیح:</span>
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
                بستن و ادامه تمرین
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
