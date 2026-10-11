import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  Plus,
  Trash2,
  Dumbbell,
  Clock,
  Search,
  BookOpen,
  Calendar as CalendarIcon,
  Users,
  Sliders,
  Check,
  X,
  Pencil,
  Sparkles,
  Phone,
  Flame,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { mockStore, DailySession, ExerciseItem } from '../../lib/supabase/mockStore';
import { translations, Language } from '../../lib/i18n';
import { PersianCalendar } from '../../components/calendar/PersianCalendar';
import { getTodayJalaliString, parseJalali, formatJalaliHuman } from '../../lib/date/jalali';
import {
  BODY_PARTS,
  FMS_PATTERNS
} from '../../lib/exercises/catalog';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Toast } from '../../components/ui/Toast';
import { ExerciseCard } from '../exercises/ExerciseCard';
import { ExerciseEditorModal } from '../exercises/ExerciseEditorModal';
import { formatCurrency, formatNumber } from '../../lib/format';
import { cn } from '../../lib/utils';

interface TrainerWorkspaceProps {
  lang?: Language;
}

export const TrainerWorkspace: React.FC<TrainerWorkspaceProps> = ({ lang = 'fa' }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = mockStore.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  // If logged in user is a trainer, strictly lock to their own ID
  const isTrainerUser = mockStore.currentUser?.role === 'trainer';
  const loggedTrainerId = (mockStore.currentUser?.entityId as 't-ali' | 't-sara') || 't-ali';

  const [activeTrainerId, setActiveTrainerId] = useState<'t-ali' | 't-sara'>(loggedTrainerId);
  const [activeTab, setActiveTab] = useState<'calendar' | 'members' | 'history' | 'catalog'>('calendar');

  // Selected date on Persian Calendar
  const [selectedDate, setSelectedDate] = useState<string>(getTodayJalaliString());

  // Capacity editing modal
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [customCapacityInput, setCustomCapacityInput] = useState<number>(6);

  // Add Member to Date modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMemberId, setScheduleMemberId] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState('10:00');

  // Modal for adding exercise to a specific session
  const [modalSessionId, setModalSessionId] = useState<string | null>(null);
  const [searchExerciseQuery, setSearchExerciseQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [inputSets, setInputSets] = useState(3);
  const [inputReps, setInputReps] = useState(10);
  const [inputWeight, setInputWeight] = useState<number | undefined>(30);
  const [inputNotes, setInputNotes] = useState('');

  // Exercise catalog editing & adding states for trainer
  const [showExerciseEditor, setShowExerciseEditor] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogFilterBodyPart, setCatalogFilterBodyPart] = useState('all');

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  // Sync if logged user changes
  useEffect(() => {
    if (isTrainerUser) {
      setActiveTrainerId(loggedTrainerId);
    }
  }, [isTrainerUser, loggedTrainerId]);

  const trainer = mockStore.trainers.find(tr => tr.id === activeTrainerId) || mockStore.trainers[0];

  // Daily capacity for selected date
  const dayCapacity = mockStore.getTrainerDailyCapacity(selectedDate, activeTrainerId);
  const dateSessions = mockStore.getSessionsForDate(selectedDate, activeTrainerId);
  const completedDateSessions = dateSessions.filter(s => s.status === 'completed').length;
  const capacityPercent = Math.min(100, Math.round((dateSessions.length / Math.max(1, dayCapacity)) * 100));

  // Members whose default trainer is this trainer
  const myMembers = mockStore.members.filter(m => m.defaultTrainerId === activeTrainerId);

  // Past sessions
  const pastSessions = mockStore.pastSessions.filter(s => s.trainerId === activeTrainerId);

  // Capacity statuses for calendar highlights
  const sessionCountsForCalendar: Record<string, number> = {};
  const capacityStatusesForCalendar: Record<string, { used: number; total: number }> = {};
  mockStore.todaySessions.forEach(s => {
    if (s.trainerId === activeTrainerId) {
      const d = s.date === 'Today' ? getTodayJalaliString() : s.date;
      sessionCountsForCalendar[d] = (sessionCountsForCalendar[d] || 0) + 1;
      capacityStatusesForCalendar[d] = {
        used: sessionCountsForCalendar[d],
        total: mockStore.getTrainerDailyCapacity(d, activeTrainerId)
      };
    }
  });

  // Filtered exercises for workout modal
  const filteredExercisesForSession = mockStore.exercises.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchExerciseQuery.toLowerCase()) ||
      item.nameFa.includes(searchExerciseQuery) ||
      item.bodyPartFa.includes(searchExerciseQuery);
    const matchesPart = selectedBodyPart === 'all' || item.bodyPart === selectedBodyPart;
    return matchesSearch && matchesPart;
  });

  // Filtered exercises for catalog tab
  const filteredCatalog = mockStore.exercises.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
      item.nameFa.includes(catalogSearchQuery);
    const matchesPart = catalogFilterBodyPart === 'all' || item.bodyPart === catalogFilterBodyPart;
    return matchesSearch && matchesPart;
  });

  const parsedDate = parseJalali(selectedDate);
  const humanDate = parsedDate ? formatJalaliHuman(parsedDate) : selectedDate;

  // Handlers
  function handleSaveCapacity() {
    mockStore.setTrainerDailyCapacity(selectedDate, activeTrainerId, customCapacityInput);
    setEditingCapacity(false);
    setToast({
      message: lang === 'fa' ? `ظرفیت کاری شما برای تاریخ ${selectedDate} ذخیره شد.` : 'Daily capacity updated.',
      type: 'success'
    });
  }

  function handleScheduleMember() {
    if (!scheduleMemberId) {
      setToast({ message: lang === 'fa' ? 'لطفاً شاگرد را انتخاب کنید.' : 'Please select a member.', type: 'error' });
      return;
    }

    const res = mockStore.scheduleSessionOnDate(
      selectedDate,
      scheduleTime,
      scheduleMemberId,
      activeTrainerId
    );

    if (res.success) {
      setShowScheduleModal(false);
      setToast({ message: res.message, type: 'success' });
    } else {
      setToast({ message: res.message, type: 'error' });
    }
  }

  function handleCompleteSession(sessionId: string, memberName: string) {
    setConfirmDialog({
      isOpen: true,
      title: lang === 'fa' ? 'تکمیل نهایی جلسه تمرینی' : 'Complete Workout Session',
      description: lang === 'fa'
        ? `آیا تمام حرکات تمرینی شاگرد "${memberName}" انجام شده است؟ با تأیید نهایی، دقیقاً ۱ جلسه از بسته شاگرد کسر و به حساب دستمزد شما افزوده می‌شود.`
        : `Complete workout for ${memberName}? Exactly 1 session will be deducted from package and added to your earned compensation.`,
      confirmText: lang === 'fa' ? 'ثبت نهایی و کسر جلسه' : 'Complete Session',
      variant: 'primary',
      onConfirm: () => {
        try {
          const res = mockStore.completeMemberSession(sessionId);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
          setToast({ message: res.message, type: 'success' });
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      }
    });
  }

  function handleAddExerciseToSession() {
    if (!modalSessionId || !selectedExercise) {
      setToast({ message: lang === 'fa' ? 'لطفاً یک حرکت را انتخاب کنید.' : 'Please select an exercise.', type: 'error' });
      return;
    }

    mockStore.addExerciseToSession(modalSessionId, {
      exerciseId: selectedExercise.id,
      name: lang === 'fa' ? selectedExercise.nameFa : selectedExercise.name,
      bodyPart: selectedExercise.bodyPartFa,
      equipment: selectedExercise.equipmentFa,
      gifUrl: selectedExercise.gifUrl,
      sets: Number(inputSets),
      reps: Number(inputReps),
      weightKg: inputWeight ? Number(inputWeight) : undefined,
      notes: inputNotes || undefined
    });

    setModalSessionId(null);
    setSelectedExercise(null);
    setInputNotes('');
    setToast({
      message: lang === 'fa' ? 'حرکت تمرینی به جلسه اضافه شد.' : 'Exercise added to workout session.',
      type: 'success'
    });
  }

  function handleRemoveExercise(sessionId: string, recordId: string) {
    mockStore.removeExerciseFromSession(sessionId, recordId);
    setToast({
      message: lang === 'fa' ? 'حرکت از جلسه حذف شد.' : 'Exercise removed from session.',
      type: 'info'
    });
  }

  function handleSaveExerciseFromEditor(exerciseData: Omit<ExerciseItem, 'id'>, id?: string) {
    if (id) {
      mockStore.updateExercise(id, exerciseData);
      setToast({ message: lang === 'fa' ? 'حرکت با موفقیت ویرایش شد.' : 'Exercise updated.', type: 'success' });
    } else {
      mockStore.addCustomExercise(exerciseData);
      setToast({ message: lang === 'fa' ? 'حرکت جدید به بانک اضافه شد.' : 'Exercise added to catalog.', type: 'success' });
    }
    setShowExerciseEditor(false);
    setEditingExercise(null);
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />

      {/* Top Bar: Active Trainer Card with Antigravity Glow */}
      <Card hoverElevation className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-xl shadow-inner border border-teal-500/20">
              <Activity className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {trainer.name}
                </h1>
                <Badge variant="success" size="sm">
                  {lang === 'fa' ? 'مربی ورزشی' : 'Fitness Coach'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {trainer.specialty} • {trainer.workingHours}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Coach Switcher (when owner inspects) */}
            {!isTrainerUser && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTrainerId('t-ali')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    activeTrainerId === 't-ali'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  {lang === 'fa' ? 'علی رستمی' : 'Ali'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTrainerId('t-sara')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    activeTrainerId === 't-sara'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  {lang === 'fa' ? 'سارا جلالی' : 'Sara'}
                </button>
              </div>
            )}

            {/* Compensation Summary Pill */}
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs">
              <div>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 block font-bold">
                  {lang === 'fa' ? 'دستمزد هر جلسه' : 'Session Rate'}
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  {formatCurrency(trainer.sessionRate, mockStore.gym.currency)}
                </span>
              </div>
              <div className="h-6 w-px bg-teal-500/20" />
              <div>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 block font-bold">
                  {lang === 'fa' ? 'جلسات تکمیل‌شده' : 'Completed'}
                </span>
                <span className="font-mono font-black text-emerald-600">
                  {trainer.completedSessions}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modern Navigation Tabs */}
      <nav aria-label="ناوبری مربی" className="glass-panel rounded-2xl p-2 border border-white/60 dark:border-slate-800/80 shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1">
          {[
            { id: 'calendar', label: lang === 'fa' ? 'تقویم و برنامه‌ریزی' : 'Calendar & Workouts', icon: CalendarIcon, count: dateSessions.length },
            { id: 'members', label: lang === 'fa' ? 'ورزشکاران تحت نظر' : 'My Members', icon: Users, count: myMembers.length },
            { id: 'history', label: lang === 'fa' ? 'سوابق جلسات' : 'Session History', icon: Clock, count: pastSessions.length },
            { id: 'catalog', label: lang === 'fa' ? 'بانک حرکات و گیف‌ها' : 'Exercise Catalog', icon: Dumbbell, count: mockStore.exercises.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0',
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-500')} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* TAB 1: PERSIAN CALENDAR & SESSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Calendar & Daily Capacity */}
          <div className="space-y-4">
            <PersianCalendar
              selectedDate={selectedDate}
              onSelectDate={d => setSelectedDate(d)}
              sessionCounts={sessionCountsForCalendar}
              capacityStatuses={capacityStatusesForCalendar}
            />

            {/* Capacity Setting Card */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  {lang === 'fa' ? 'ظرفیت کاری در این تاریخ:' : 'Daily Capacity on Date:'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomCapacityInput(dayCapacity);
                    setEditingCapacity(!editingCapacity);
                  }}
                  className="text-xs text-teal-600"
                >
                  {editingCapacity ? (lang === 'fa' ? 'بستن' : 'Close') : (lang === 'fa' ? 'تغییر ظرفیت' : 'Change')}
                </Button>
              </div>

              {editingCapacity ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    {lang === 'fa' ? `حداکثر تعداد شاگرد برای ${selectedDate}:` : `Max members for ${selectedDate}:`}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={customCapacityInput}
                      onChange={e => setCustomCapacityInput(Number(e.target.value))}
                      className="w-20 p-2 text-center rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                    />
                    <Button variant="primary" size="sm" onClick={handleSaveCapacity}>
                      <Check className="w-3.5 h-3.5 me-1" />
                      {lang === 'fa' ? 'ثبت' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">{lang === 'fa' ? 'تکمیل ظرفیت:' : 'Occupancy:'}</span>
                    <span className="font-mono">{dateSessions.length} / {dayCapacity}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', capacityPercent >= 100 ? 'bg-rose-500' : 'bg-teal-500')}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right 2 Columns: Scheduled Sessions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">{humanDate}</h2>
                <span className="text-xs text-teal-600 font-mono font-bold">{selectedDate}</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setScheduleMemberId(myMembers[0]?.id || '');
                  setShowScheduleModal(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 me-1" />
                {lang === 'fa' ? 'تعریف نوبت در این تاریخ' : 'Add Session'}
              </Button>
            </div>

            {dateSessions.length === 0 ? (
              <EmptyState
                title={lang === 'fa' ? `هیچ نوبتی برای ${selectedDate} ثبت نشده است` : `No sessions for ${selectedDate}`}
                description={lang === 'fa' ? 'با دکمه بالا می‌توانید یک شاگرد را به این تاریخ اضافه کنید.' : 'Schedule a workout for this date.'}
                actionLabel={lang === 'fa' ? 'تعریف نوبت' : 'Add Session'}
                onAction={() => {
                  setScheduleMemberId(myMembers[0]?.id || '');
                  setShowScheduleModal(true);
                }}
              />
            ) : (
              <div className="space-y-4">
                {dateSessions.map(sess => (
                  <Card key={sess.id} className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 font-mono font-black text-xs flex items-center justify-center">
                          {sess.time}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-slate-900 dark:text-white">{sess.memberName}</h3>
                            <Badge
                              variant={sess.status === 'completed' ? 'success' : 'primary'}
                              size="sm"
                            >
                              {sess.status === 'completed' ? (lang === 'fa' ? 'تکمیل‌شده' : 'Completed') : (lang === 'fa' ? 'در انتظار اجرا' : 'Scheduled')}
                            </Badge>
                          </div>
                          {sess.memberPhone && (
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{sess.memberPhone}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sess.status !== 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setModalSessionId(sess.id);
                                setSelectedExercise(null);
                              }}
                              className="text-xs text-teal-600 border-teal-500/30 hover:bg-teal-500/10"
                            >
                              <Plus className="w-3.5 h-3.5 me-1" />
                              {lang === 'fa' ? 'افزودن حرکت' : 'Add Exercise'}
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleCompleteSession(sess.id, sess.memberName)}
                              className="text-xs font-bold shadow-md shadow-teal-500/20"
                            >
                              <CheckCircle className="w-3.5 h-3.5 me-1" />
                              {lang === 'fa' ? 'ثبت نهایی تمرین' : 'Complete Workout'}
                            </Button>
                          </>
                        )}
                        {sess.status === 'completed' && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {lang === 'fa' ? 'جلسه کسر و ثبت شد' : 'Session Recorded'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Exercises logged in this session */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500">
                        {lang === 'fa' ? 'حرکات ورزشی این جلسه:' : 'Exercises for this workout:'}
                      </h4>

                      {sess.exercises.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          {lang === 'fa' ? 'هنوز حرکتی اضافه نشده است. دکمه "افزودن حرکت" را بزنید.' : 'No exercises logged yet.'}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {sess.exercises.map(ex => (
                            <div
                              key={ex.id}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-950">
                                <img
                                  src={ex.gifUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80'}
                                  alt={ex.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-black text-xs text-slate-900 dark:text-white block truncate">
                                  {ex.name}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 block">
                                  {ex.sets} × {ex.reps} {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}
                                </span>
                                {ex.notes && (
                                  <span className="text-[10px] text-teal-600 truncate block mt-0.5">{ex.notes}</span>
                                )}
                              </div>
                              {sess.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExercise(sess.id, ex.id)}
                                  className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                                  title={lang === 'fa' ? 'حذف حرکت' : 'Remove'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY MEMBERS */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {lang === 'fa' ? 'ورزشکاران تحت نظر شما' : 'My Assigned Members'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'fa' ? 'مدیریت شاگردان اختصاصی و مانده جلسات هر ورزشکار' : 'Members assigned to you'}
              </p>
            </div>
            <Badge variant="primary" size="md" className="font-mono font-bold">
              {myMembers.length} {lang === 'fa' ? 'شاگرد' : 'members'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myMembers.map(mem => (
              <Card key={mem.id} hoverElevation className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">{mem.name}</h3>
                    <span className="text-xs text-slate-400 font-mono mt-0.5 block">{mem.phone}</span>
                  </div>
                  <Badge variant={mem.remainingSessions <= 2 ? 'warning' : 'primary'} size="sm" className="font-mono">
                    {mem.remainingSessions} / {mem.totalSessions} {lang === 'fa' ? 'مانده' : 'left'}
                  </Badge>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>{lang === 'fa' ? 'بسته فعلی:' : 'Package:'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{mem.packageName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>{lang === 'fa' ? 'جلسات مصرف‌شده:' : 'Used:'}</span>
                    <span className="font-mono font-bold text-teal-600">{mem.usedSessions}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(getTodayJalaliString());
                    setScheduleMemberId(mem.id);
                    setShowScheduleModal(true);
                  }}
                  className="w-full text-xs font-bold text-teal-600 border-teal-500/30 hover:bg-teal-500/10"
                >
                  <Plus className="w-3.5 h-3.5 me-1" />
                  {lang === 'fa' ? 'تعریف نوبت تمرین' : 'Schedule Workout'}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SESSION HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {lang === 'fa' ? 'سوابق جلسات و تمرینات گذشته' : 'Past Session History'}
            </h1>
            <p className="text-xs text-slate-500">
              {lang === 'fa' ? 'مرور جلسات تکمیل‌شده و حرکات انجام‌شده توسط شاگردان' : 'Completed training sessions history'}
            </p>
          </div>

          <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {pastSessions.length === 0 ? (
              <EmptyState
                title={lang === 'fa' ? 'هنوز سابقه جلسه‌ای ثبت نشده است' : 'No past sessions recorded'}
                description={lang === 'fa' ? 'پس از پایان و تکمیل هر تمرین، رکورد آن در این قسمت ذخیره می‌شود.' : 'Completed sessions appear here.'}
              />
            ) : (
              pastSessions.map(sess => (
                <div key={sess.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white text-sm">{sess.memberName}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="font-mono font-bold text-teal-600">{sess.date} - ساعت {sess.time}</span>
                    </div>
                    <Badge variant="success" size="sm">
                      {lang === 'fa' ? 'تکمیل‌شده' : 'Completed'}
                    </Badge>
                  </div>

                  {sess.exercises.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sess.exercises.map(ex => (
                        <div
                          key={ex.id}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs border border-slate-200/50 dark:border-slate-800 flex items-center gap-2"
                        >
                          <img
                            src={ex.gifUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80'}
                            alt={ex.name}
                            className="w-6 h-6 rounded-md object-cover"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">{ex.name}</span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {ex.sets} × {ex.reps} {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EXERCISE CATALOG (Using ExerciseCard and ExerciseEditorModal) */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {lang === 'fa' ? 'بانک حرکات ورزشی و تصاویر متحرک' : 'Exercise Catalog with GIF Demos'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'fa' ? 'مشاهده و ویرایش حرکات ورزشی با انیمیشن‌های آموزشی استاندارد' : 'Browse and customize exercise catalog'}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingExercise(null);
                setShowExerciseEditor(true);
              }}
            >
              <Plus className="w-4 h-4 me-1.5" />
              {lang === 'fa' ? 'افزودن حرکت جدید' : 'Add Exercise'}
            </Button>
          </div>

          {/* Filter Bar */}
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={catalogSearchQuery}
                  onChange={e => setCatalogSearchQuery(e.target.value)}
                  placeholder={lang === 'fa' ? 'جستجوی نام حرکت...' : 'Search exercises...'}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <select
                  value={catalogFilterBodyPart}
                  onChange={e => setCatalogFilterBodyPart(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="all">{lang === 'fa' ? 'همه بخش‌های بدن' : 'All Body Parts'}</option>
                  {BODY_PARTS.map(bp => (
                    <option key={bp.id} value={bp.id}>
                      {lang === 'fa' ? bp.labelFa : bp.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Exercises Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCatalog.map(item => (
              <ExerciseCard
                key={item.id}
                exercise={item}
                lang={lang}
                onEdit={ex => {
                  setEditingExercise(ex);
                  setShowExerciseEditor(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCHEDULE MEMBER ON SELECTED DATE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={lang === 'fa' ? 'تعریف نوبت تمرین در تاریخ انتخاب‌شده' : 'Schedule Workout Session'}
        description={`${lang === 'fa' ? 'تاریخ:' : 'Date:'} ${selectedDate}`}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'fa' ? 'انتخاب شاگرد:' : 'Select Member:'}
            </label>
            <select
              value={scheduleMemberId}
              onChange={e => setScheduleMemberId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              {myMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.remainingSessions} جلسه مانده)
                </option>
              ))}
            </select>
          </div>

          <Input
            id="schedule-time"
            label={lang === 'fa' ? 'ساعت نوبت' : 'Session Time'}
            value={scheduleTime}
            onChange={e => setScheduleTime(e.target.value)}
            placeholder="10:30"
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowScheduleModal(false)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button variant="primary" onClick={handleScheduleMember}>
              {lang === 'fa' ? 'تأیید و ثبت در تقویم' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD EXERCISE WITH GIF TO SESSION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(modalSessionId)}
        onClose={() => {
          setModalSessionId(null);
          setSelectedExercise(null);
        }}
        title={lang === 'fa' ? 'افزودن حرکت تمرینی به این جلسه' : 'Add Exercise to Workout'}
        description={lang === 'fa' ? 'انتخاب حرکت از بانک به همراه گیف آموزشی و تعیین ست/تکرار' : 'Select exercise and define sets/reps'}
      >
        <div className="space-y-4">
          {/* Search and body part filter */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={searchExerciseQuery}
              onChange={e => setSearchExerciseQuery(e.target.value)}
              placeholder={lang === 'fa' ? 'جستجوی حرکت...' : 'Search...'}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-bold"
            />
            <select
              value={selectedBodyPart}
              onChange={e => setSelectedBodyPart(e.target.value)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-bold"
            >
              <option value="all">{lang === 'fa' ? 'همه بخش‌ها' : 'All parts'}</option>
              {BODY_PARTS.map(bp => (
                <option key={bp.id} value={bp.id}>{lang === 'fa' ? bp.labelFa : bp.labelEn}</option>
              ))}
            </select>
          </div>

          {/* Exercise list compact picker */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
            {filteredExercisesForSession.map(item => (
              <ExerciseCard
                key={item.id}
                exercise={item}
                lang={lang}
                compact
                selected={selectedExercise?.id === item.id}
                onSelect={ex => {
                  setSelectedExercise(ex);
                  setInputSets(ex.defaultSets || 3);
                  setInputReps(ex.defaultReps || 10);
                }}
              />
            ))}
          </div>

          {/* Sets, Reps, Weight, Notes */}
          {selectedExercise && (
            <div className="space-y-3 p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <span className="text-xs font-black text-teal-700 dark:text-teal-300 block">
                {lang === 'fa' ? 'تنظیمات اجرای حرکت:' : 'Execution Parameters:'} {selectedExercise.nameFa}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  id="ex-sets"
                  type="number"
                  label={lang === 'fa' ? 'ست' : 'Sets'}
                  value={inputSets.toString()}
                  onChange={e => setInputSets(Number(e.target.value))}
                />
                <Input
                  id="ex-reps"
                  type="number"
                  label={lang === 'fa' ? 'تکرار' : 'Reps'}
                  value={inputReps.toString()}
                  onChange={e => setInputReps(Number(e.target.value))}
                />
                <Input
                  id="ex-weight"
                  type="number"
                  label={lang === 'fa' ? 'وزنه (kg)' : 'Weight (kg)'}
                  value={inputWeight?.toString() || ''}
                  onChange={e => setInputWeight(Number(e.target.value) || undefined)}
                />
              </div>
              <Input
                id="ex-notes"
                label={lang === 'fa' ? 'نکات فنی مربی' : 'Coach Notes'}
                value={inputNotes}
                onChange={e => setInputNotes(e.target.value)}
                placeholder="مثال: کنترل کامل در دامنه پایین"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={() => {
                setModalSessionId(null);
                setSelectedExercise(null);
              }}
            >
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              disabled={!selectedExercise}
              onClick={handleAddExerciseToSession}
            >
              {lang === 'fa' ? 'افزودن به نوبت' : 'Add to Workout'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* SHARED EXERCISE EDITOR MODAL */}
      {/* ========================================================================= */}
      <ExerciseEditorModal
        isOpen={showExerciseEditor}
        onClose={() => {
          setShowExerciseEditor(false);
          setEditingExercise(null);
        }}
        onSave={handleSaveExerciseFromEditor}
        editingExercise={editingExercise}
        lang={lang}
      />
    </div>
  );
};
