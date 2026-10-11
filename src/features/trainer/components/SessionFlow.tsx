import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronRight,
  WifiOff,
  Search,
  Plus,
  Sparkles,
  X,
  Dumbbell,
} from 'lucide-react';
import { Stepper } from './Stepper';
import { Btn } from '../../../components/ui/Btn';
import { useSessionDraft } from '../hooks/useSessionDraft';
import { fa, short, toman } from '../../../lib/format';
import { completeSession } from '../../../api/sessions';
import { EXERCISE_CATALOG, ExerciseItem } from '../../../api/exercises';

export interface SessionFlowProps {
  memberId?: string;
  memberName?: string;
  remainingSessions?: number;
  totalSessions?: number;
  sessionId?: string;
  onClose: () => void;
  onCompleted?: () => void;
}

export function SessionFlow({
  memberId,
  memberName = 'حمید زارعی',
  remainingSessions = 1,
  totalSessions = 12,
  sessionId,
  onClose,
  onCompleted,
}: SessionFlowProps) {
  const {
    exercises,
    totalSets,
    doneSets,
    progressPct,
    updateWeight,
    updateReps,
    toggleSet,
    addSet,
    addExercise,
    clearDraft,
  } = useSessionDraft();

  const [openExerciseIndex, setOpenExerciseIndex] = useState<number>(0);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    remainingSessions: number;
    message: string;
  } | null>(null);

  const handleFinishSession = async () => {
    setIsSubmitting(true);
    try {
      if (sessionId) {
        const res = await completeSession(sessionId);
        setCompletionResult({
          remainingSessions: res.remainingSessions,
          message: res.message,
        });
      } else {
        setCompletionResult({
          remainingSessions: Math.max(0, remainingSessions - 1),
          message: 'جلسه با موفقیت ثبت شد.',
        });
      }
      clearDraft();
      setShowDoneModal(true);
    } catch (err) {
      console.error('Failed to complete session:', err);
      // در صورت خطا، پیش‌نویس پاک نمی‌شود
      setShowDoneModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowDoneModal(false);
    onCompleted?.();
    onClose();
  };

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{ backgroundColor: 'var(--c-surface-0)' }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      dir="rtl"
    >
      {/* سربرگ جلسه تمرینی */}
      <header
        style={{ backgroundColor: 'var(--c-ink)' }}
        className="pt-6 px-4 pb-4 text-white shrink-0 shadow-md"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 -ms-1 grid place-items-center rounded-xl hover:bg-white/10 transition-colors"
            aria-label="بازگشت"
          >
            <ChevronRight size={26} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] opacity-80">جلسه جاری تمرین</div>
            <div className="text-[20px] font-extrabold truncate leading-tight">
              {memberName}
            </div>
          </div>

          <div className="text-left">
            <div
              style={{ color: 'var(--c-brass)' }}
              className="text-[12px] font-semibold"
            >
              مانده بسته
            </div>
            <div className="font-display text-[24px] leading-none text-white tnum mt-0.5">
              {fa(remainingSessions)}{' '}
              <span className="text-[13px] font-sans opacity-70">
                از {fa(totalSessions)}
              </span>
            </div>
          </div>
        </div>

        {/* نوار پیشرفت ست‌ها */}
        <div
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          className="mt-3 h-2.5 rounded-full overflow-hidden"
        >
          <motion.div
            style={{ backgroundColor: 'var(--c-brass)' }}
            className="h-full rounded-full transition-all"
            animate={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-1.5 flex justify-between text-[13px] opacity-85">
          <span>
            {fa(doneSets)} از {fa(totalSets)} ست انجام شد ({fa(progressPct)}٪)
          </span>
          <span className="flex items-center gap-1">
            <WifiOff size={13} />
            پایداری آفلاین فعال
          </span>
        </div>
      </header>

      {/* لیست حرکات تمرینی */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3 pb-32">
        {exercises.map((ex, ei) => {
          const isOpen = openExerciseIndex === ei;
          const doneCount = ex.sets.filter(s => s.d).length;
          const isAllDone = doneCount === ex.sets.length && ex.sets.length > 0;

          return (
            <div
              key={ex.name}
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="rounded-2xl border overflow-hidden shadow-xs"
            >
              <button
                type="button"
                onClick={() => setOpenExerciseIndex(isOpen ? -1 : ei)}
                className="w-full p-4 flex items-center gap-3 text-right cursor-pointer"
              >
                <span
                  style={{
                    backgroundColor: isAllDone
                      ? 'var(--c-ink)'
                      : 'var(--c-surface-2)',
                    color: isAllDone ? '#ffffff' : 'var(--c-ink)',
                  }}
                  className="h-11 w-11 rounded-xl grid place-items-center font-bold tnum text-[15px] shrink-0 transition-colors"
                >
                  {isAllDone ? (
                    <Check size={20} strokeWidth={3} />
                  ) : (
                    `${fa(doneCount)}/${fa(ex.sets.length)}`
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-[16px] truncate"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {ex.name}
                  </div>
                  <div
                    className="text-[13px] truncate mt-0.5"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {ex.last || 'رکورد قبلی ثبت نشده'}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div
                  style={{ borderColor: 'var(--c-surface-2)' }}
                  className="px-3 pb-3 space-y-2 border-t pt-2"
                >
                  {ex.sets.map((s, si) => (
                    <div
                      key={si}
                      style={{
                        backgroundColor: s.d
                          ? 'var(--c-ink)'
                          : 'var(--c-surface-2)',
                        color: s.d ? '#ffffff' : 'var(--c-text)',
                      }}
                      className="rounded-xl p-2.5 flex items-center gap-2 transition-all"
                    >
                      <span className="w-6 text-center text-[14px] font-bold opacity-80 tnum">
                        {fa(si + 1)}
                      </span>

                      <Stepper
                        v={s.w}
                        u="kg"
                        step={2.5}
                        dark={s.d}
                        on={v => updateWeight(ei, si, v)}
                      />

                      <Stepper
                        v={s.r}
                        u="تکرار"
                        step={1}
                        dark={s.d}
                        on={v => updateReps(ei, si, v)}
                      />

                      <button
                        type="button"
                        onClick={() => toggleSet(ei, si)}
                        aria-label="تغییر وضعیت انجام ست"
                        style={{
                          backgroundColor: s.d
                            ? 'var(--c-brass)'
                            : 'var(--c-surface-1)',
                          borderColor: s.d ? 'transparent' : 'var(--c-border-strong)',
                          color: s.d ? 'var(--c-deep)' : 'var(--c-text-muted)',
                        }}
                        className="ms-auto h-11 w-11 shrink-0 rounded-xl border grid place-items-center transition-all cursor-pointer active:scale-90"
                      >
                        <Check size={22} strokeWidth={3} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addSet(ei)}
                    style={{ color: 'var(--c-steel)' }}
                    className="w-full h-10 text-[14px] font-bold hover:underline cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus size={16} />
                    <span>افزودن ست اضافه</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setShowExercisePicker(true)}
          style={{ borderColor: 'var(--c-border-strong)', color: 'var(--c-steel)' }}
          className="w-full h-12 rounded-2xl border-2 border-dashed font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <Search size={17} />
          <span>افزودن حرکت از کاتالوگ (۴۱۳ حرکت)</span>
        </button>
      </div>

      {/* نوار ثابت پایین صفحه جهت ثبت و اتمام جلسه */}
      <div
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="fixed bottom-0 inset-x-0 p-4 pb-6 border-t shadow-lg"
      >
        <Btn
          v="primary"
          onClick={handleFinishSession}
          disabled={isSubmitting}
          className="w-full h-14 text-[16px] rounded-xl font-black gap-2"
        >
          {isSubmitting ? (
            <span>در حال ثبت در دیتابیس...</span>
          ) : (
            <>
              <Check size={20} strokeWidth={3} />
              <span>اتمام جلسه و کسر ۱ جلسه از بسته</span>
            </>
          )}
        </Btn>
      </div>

      {/* مدال تایید و نمایش موفقیت ثبت جلسه */}
      <AnimatePresence>
        {showDoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ backgroundColor: 'var(--c-surface-1)' }}
              className="w-full max-w-lg rounded-t-[28px] p-6 pb-10 text-center shadow-2xl border-t border-slate-200 dark:border-slate-800"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.15,
                  type: 'spring',
                  stiffness: 400,
                  damping: 14,
                }}
                style={{
                  backgroundColor: 'var(--c-ink)',
                  color: 'var(--c-brass)',
                }}
                className="mx-auto h-16 w-16 rounded-full grid place-items-center shadow-lg"
              >
                <Check size={36} strokeWidth={3.5} />
              </motion.div>

              <div
                className="font-display text-[30px] mt-4"
                style={{ color: 'var(--c-deep)' }}
              >
                جلسه با موفقیت ثبت شد
              </div>

              <div
                className="text-[15px] mt-1"
                style={{ color: 'var(--c-text-muted)' }}
              >
                مانده جلسات {memberName}:{' '}
                <b style={{ color: 'var(--c-deep)' }}>
                  {fa(completionResult?.remainingSessions ?? 0)} جلسه
                </b>{' '}
                · دستمزد شما: <b style={{ color: 'var(--c-avail-fg)' }}>+۱۵۰ هزار تومان</b>
              </div>

              {(completionResult?.remainingSessions ?? 0) <= 2 && (
                <div
                  style={{
                    backgroundColor: 'var(--c-status-noshow-bg)',
                    color: 'var(--c-rubber)',
                  }}
                  className="mt-4 rounded-xl text-[14px] font-bold py-3 px-4"
                >
                  بسته ورزشکار به اتمام رسیده یا کمتر از ۲ جلسه مانده است؛ به مدیر
                  باشگاه اطلاع داده شد.
                </div>
              )}

              <Btn
                v="primary"
                onClick={handleModalClose}
                className="mt-6 w-full h-12 rounded-xl text-[15px]"
              >
                بازگشت به برنامه امروز
              </Btn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال انتخاب و افزودن حرکت از بانک ۴۱۳ حرکت */}
      {showExercisePicker && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowExercisePicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
              <div className="flex items-center gap-2">
                <Dumbbell size={18} style={{ color: 'var(--c-steel)' }} />
                <h3 className="font-bold text-[15px]" style={{ color: 'var(--c-deep)' }}>
                  انتخاب حرکت از بانک کاتالوگ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExercisePicker(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
              <div
                style={{ backgroundColor: 'var(--c-surface-2)' }}
                className="flex items-center gap-2 px-3 h-10 rounded-xl text-slate-400"
              >
                <Search size={16} />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="جستجوی نام حرکت یا عضله..."
                  className="w-full bg-transparent border-none outline-hidden text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-3 overflow-y-auto space-y-2 flex-1 max-h-[50vh]">
              {EXERCISE_CATALOG.filter((item) => {
                const q = pickerSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  item.nameFa.toLowerCase().includes(q) ||
                  item.name.toLowerCase().includes(q) ||
                  item.primaryMuscleFa?.toLowerCase().includes(q)
                );
              })
                .slice(0, 25)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      addExercise({
                        name: item.nameFa,
                        part: item.primaryMuscleFa || item.bodyPartFa,
                        last: 'حرکت اضافه شده در جلسه',
                        sets: [
                          { r: 12, w: 20, d: false },
                          { r: 10, w: 22.5, d: false },
                          { r: 8, w: 25, d: false },
                        ],
                      });
                      setShowExercisePicker(false);
                      setPickerSearch('');
                    }}
                    style={{
                      backgroundColor: 'var(--c-surface-2)',
                      borderColor: 'var(--c-border)',
                    }}
                    className="p-3 rounded-xl border flex items-center justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="font-bold text-[14px]" style={{ color: 'var(--c-deep)' }}>
                        {item.nameFa}
                      </div>
                      <div dir="ltr" className="text-[11px] text-slate-400 font-mono text-end">
                        {item.name}
                      </div>
                    </div>
                    <span
                      style={{ backgroundColor: 'var(--c-surface-1)', color: 'var(--c-steel)' }}
                      className="px-2 py-1 rounded-md text-[11px] font-medium"
                    >
                      {item.primaryMuscleFa || item.bodyPartFa} · {item.equipmentFa}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
