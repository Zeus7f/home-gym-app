import React, { useState, useEffect } from 'react';
import { mockStore } from '../../lib/supabase/mockStore';
import { translations, Language } from '../../lib/i18n';
import { PersianCalendar } from '../../components/calendar/PersianCalendar';
import { getTodayJalaliString, parseJalali, formatJalaliHuman } from '../../lib/date/jalali';
import {
  Activity,
  UserCheck,
  CheckCircle,
  Plus,
  Trash2,
  Dumbbell,
  Clock,
  Phone,
  AlertCircle,
  Search,
  BookOpen,
  Calendar as CalendarIcon,
  Users,
  Award,
  Sparkles,
  Sliders,
  Check,
  X,
  Pencil
} from 'lucide-react';
import {
  BODY_PARTS,
  EQUIPMENT_TYPES,
  FMS_PATTERNS,
  EXERCISE_POSITIONS,
  BodyPart,
  EquipmentType,
  FmsPattern,
  ExercisePosition,
  ExerciseItem
} from '../../lib/exercises/catalog';
import confetti from 'canvas-confetti';

interface TrainerWorkspaceProps {
  lang?: Language;
}

export function TrainerWorkspace({ lang = 'fa' }: TrainerWorkspaceProps) {
  const [, setTick] = useState(0);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [inputSets, setInputSets] = useState(3);
  const [inputReps, setInputReps] = useState(10);
  const [inputWeight, setInputWeight] = useState<number | undefined>(30);
  const [inputNotes, setInputNotes] = useState('');

  // Exercise catalog editing & adding states for trainer
  const [showAddTrainerExerciseModal, setShowAddTrainerExerciseModal] = useState(false);
  const [editingTrainerExercise, setEditingTrainerExercise] = useState<ExerciseItem | null>(null);

  const [trExNameFa, setTrExNameFa] = useState('');
  const [trExNameEn, setTrExNameEn] = useState('');
  const [trExBodyPart, setTrExBodyPart] = useState<BodyPart>('mobility');
  const [trExEquipment, setTrExEquipment] = useState<EquipmentType>('bodyweight');
  const [trExPattern, setTrExPattern] = useState<FmsPattern>('deep_squat');
  const [trExPosition, setTrExPosition] = useState<ExercisePosition>('standing');
  const [trExGifUrl, setTrExGifUrl] = useState('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80');
  const [trExSets, setTrExSets] = useState(3);
  const [trExReps, setTrExReps] = useState(10);
  const [trExInstructionsFa, setTrExInstructionsFa] = useState('');
  const [trExInstructionsEn, setTrExInstructionsEn] = useState('');

  // Notification / Feedback banner
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  // Sync if logged user changes
  useEffect(() => {
    if (isTrainerUser) {
      setActiveTrainerId(loggedTrainerId);
    }
  }, [isTrainerUser, loggedTrainerId]);

  const trainer = mockStore.trainers.find(tr => tr.id === activeTrainerId) || mockStore.trainers[0];

  // Daily capacity for selected date
  const dayCapacity = mockStore.getTrainerDailyCapacity(selectedDate, activeTrainerId);
  // Sessions scheduled for selected date
  const dateSessions = mockStore.getSessionsForDate(selectedDate, activeTrainerId);
  const completedDateSessions = dateSessions.filter(s => s.status === 'completed').length;
  const capacityPercent = Math.min(100, Math.round((dateSessions.length / dayCapacity) * 100));

  // Members whose default trainer is this trainer
  const myMembers = mockStore.members.filter(m => m.defaultTrainerId === activeTrainerId);

  // Past sessions
  const pastSessions = mockStore.pastSessions.filter(s => s.trainerId === activeTrainerId);

  // Prepare session counts for calendar dots
  const sessionCountsForCalendar: Record<string, number> = {};
  const capacityStatusesForCalendar: Record<string, { used: number; total: number }> = {};

  mockStore.todaySessions
    .filter(s => s.trainerId === activeTrainerId)
    .forEach(s => {
      const d = s.date === 'Today' ? getTodayJalaliString() : s.date;
      sessionCountsForCalendar[d] = (sessionCountsForCalendar[d] || 0) + 1;
      const cap = mockStore.getTrainerDailyCapacity(d, activeTrainerId);
      capacityStatusesForCalendar[d] = {
        used: sessionCountsForCalendar[d],
        total: cap
      };
    });

  function handleCheckIn(sessionId: string) {
    mockStore.checkInSession(sessionId);
    showFeedback(lang === 'fa' ? 'حضور ورزشکار ثبت شد و تمرین آغاز گردید.' : 'Member checked in. Session started.');
  }

  function handleCompleteSession(sessionId: string) {
    try {
      const result = mockStore.completeMemberSession(sessionId);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
      showFeedback(result.message);
    } catch (err: any) {
      alert(err.message);
    }
  }

  function handleSaveCapacity() {
    mockStore.setTrainerDailyCapacity(selectedDate, activeTrainerId, customCapacityInput);
    setEditingCapacity(false);
    showFeedback(
      lang === 'fa'
        ? `ظرفیت مربی برای تاریخ ${selectedDate} با موفقیت به ${customCapacityInput} نفر تغییر یافت.`
        : `Capacity for ${selectedDate} set to ${customCapacityInput}.`
    );
  }

  function handleScheduleMember() {
    if (!scheduleMemberId) return;
    const res = mockStore.scheduleSessionOnDate(
      selectedDate,
      scheduleTime,
      scheduleMemberId,
      activeTrainerId
    );
    if (!res.success) {
      alert(res.message);
      return;
    }
    setShowScheduleModal(false);
    showFeedback(res.message);
  }

  function handleOpenAddExercise(sessionId: string) {
    setModalSessionId(sessionId);
    setSelectedExercise(mockStore.exercises[0] || null);
    setInputSets(3);
    setInputReps(10);
    setInputWeight(30);
    setInputNotes('');
    setSearchQuery('');
    setSelectedBodyPart('all');
  }

  function handleSaveExercise() {
    if (!modalSessionId || !selectedExercise) return;
    mockStore.addExerciseToSession(modalSessionId, {
      exerciseId: selectedExercise.id,
      name: lang === 'fa' ? selectedExercise.nameFa : selectedExercise.name,
      bodyPart: lang === 'fa' ? selectedExercise.bodyPartFa : selectedExercise.bodyPart,
      equipment: lang === 'fa' ? selectedExercise.equipmentFa : selectedExercise.equipment,
      gifUrl: selectedExercise.gifUrl,
      sets: Number(inputSets),
      reps: Number(inputReps),
      weightKg: inputWeight ? Number(inputWeight) : undefined,
      notes: inputNotes || undefined
    });
    setModalSessionId(null);
    showFeedback(lang === 'fa' ? 'حرکت تمرینی به جلسه اضافه شد.' : 'Exercise added to session.');
  }

  function handleRemoveExercise(sessionId: string, recordId: string) {
    mockStore.removeExerciseFromSession(sessionId, recordId);
    showFeedback(lang === 'fa' ? 'حرکت از جلسه حذف شد.' : 'Exercise removed from session.');
  }

  function showFeedback(msg: string) {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  }

  function handleOpenAddTrainerExercise() {
    setEditingTrainerExercise(null);
    setTrExNameFa('');
    setTrExNameEn('');
    setTrExBodyPart('mobility');
    setTrExEquipment('bodyweight');
    setTrExPattern('deep_squat');
    setTrExPosition('standing');
    setTrExGifUrl('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80');
    setTrExSets(3);
    setTrExReps(10);
    setTrExInstructionsFa('');
    setTrExInstructionsEn('');
    setShowAddTrainerExerciseModal(true);
  }

  function handleOpenEditTrainerExercise(ex: ExerciseItem) {
    setEditingTrainerExercise(ex);
    setTrExNameFa(ex.nameFa);
    setTrExNameEn(ex.name);
    setTrExBodyPart(ex.bodyPart);
    setTrExEquipment(ex.equipment);
    setTrExPattern(ex.pattern);
    setTrExPosition(ex.position);
    setTrExGifUrl(ex.gifUrl);
    setTrExSets(ex.defaultSets || 3);
    setTrExReps(ex.defaultReps || 10);
    setTrExInstructionsFa(ex.instructionsFa || '');
    setTrExInstructionsEn(ex.instructionsEn || '');
    setShowAddTrainerExerciseModal(true);
  }

  function handleSaveTrainerExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!trExNameFa.trim() || !trExNameEn.trim()) {
      showFeedback(lang === 'fa' ? 'لطفاً نام فارسی و انگلیسی حرکت را وارد کنید.' : 'Please enter both Persian and English names.');
      return;
    }

    const bpObj = BODY_PARTS.find(b => b.id === trExBodyPart);
    const eqObj = EQUIPMENT_TYPES.find(eq => eq.id === trExEquipment);
    const patObj = FMS_PATTERNS.find(p => p.id === trExPattern);
    const posObj = EXERCISE_POSITIONS.find(pos => pos.id === trExPosition);

    if (editingTrainerExercise) {
      mockStore.updateExercise(editingTrainerExercise.id, {
        name: trExNameEn.trim(),
        nameFa: trExNameFa.trim(),
        bodyPart: trExBodyPart,
        bodyPartFa: bpObj ? bpObj.labelFa : trExBodyPart,
        equipment: trExEquipment,
        equipmentFa: eqObj ? eqObj.labelFa : trExEquipment,
        pattern: trExPattern,
        patternFa: patObj ? patObj.labelFa : trExPattern,
        position: trExPosition,
        positionFa: posObj ? posObj.labelFa : trExPosition,
        gifUrl: trExGifUrl.trim() || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
        instructionsFa: trExInstructionsFa.trim() || 'حرکت را با تمرکز و فرم صحیح اجرا کنید.',
        instructionsEn: trExInstructionsEn.trim() || 'Execute with proper control and alignment.',
        defaultSets: Number(trExSets) || 3,
        defaultReps: Number(trExReps) || 10
      });
      showFeedback(lang === 'fa' ? 'حرکت با موفقیت ویرایش و ذخیره شد.' : 'Exercise updated successfully.');
    } else {
      mockStore.addCustomExercise({
        name: trExNameEn.trim(),
        nameFa: trExNameFa.trim(),
        bodyPart: trExBodyPart,
        bodyPartFa: bpObj ? bpObj.labelFa : trExBodyPart,
        equipment: trExEquipment,
        equipmentFa: eqObj ? eqObj.labelFa : trExEquipment,
        pattern: trExPattern,
        patternFa: patObj ? patObj.labelFa : trExPattern,
        position: trExPosition,
        positionFa: posObj ? posObj.labelFa : trExPosition,
        gifUrl: trExGifUrl.trim() || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
        instructionsFa: trExInstructionsFa.trim() || 'حرکت را با تمرکز و فرم صحیح اجرا کنید.',
        instructionsEn: trExInstructionsEn.trim() || 'Execute with proper control and alignment.',
        defaultSets: Number(trExSets) || 3,
        defaultReps: Number(trExReps) || 10,
        isCustom: true
      });
      showFeedback(lang === 'fa' ? 'حرکت جدید با موفقیت به بانک حرکات اضافه شد.' : 'New exercise added to catalog.');
    }

    setShowAddTrainerExerciseModal(false);
    setEditingTrainerExercise(null);
  }

  const parsedDate = parseJalali(selectedDate);
  const humanDate = parsedDate ? formatJalaliHuman(parsedDate) : selectedDate;

  // Filter exercises in catalog
  const filteredCatalog = mockStore.exercises.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameFa.includes(searchQuery) ||
      item.bodyPartFa.includes(searchQuery);
    const matchesPart = selectedBodyPart === 'all' || item.bodyPart === selectedBodyPart;
    return matchesSearch && matchesPart;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Bar: Active Trainer & Quick Summary */}
      <div className="bg-white dark:bg-[#11151A] rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-xl shadow-inner">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {trainer.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {lang === 'fa' ? 'مربی ورزشی' : 'Fitness Coach'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {trainer.specialty} • {trainer.workingHours}
            </p>
          </div>
        </div>

        {/* Coach Selector (Only if owner is inspecting; if logged in as trainer, locked to their account) */}
        <div className="flex flex-wrap items-center gap-3">
          {!isTrainerUser && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTrainerId('t-ali')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTrainerId === 't-ali'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lang === 'fa' ? 'علی رستمی' : 'Ali Rostami'}
              </button>
              <button
                onClick={() => setActiveTrainerId('t-sara')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTrainerId === 't-sara'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lang === 'fa' ? 'سارا جلالی' : 'Sara Jalali'}
              </button>
            </div>
          )}

          {/* Trainer Compensation Summary */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs">
            <div>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 block font-semibold">
                {lang === 'fa' ? 'حق‌الزحمه هر جلسه' : 'Session Rate'}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {trainer.sessionRate.toLocaleString()} {mockStore.gym.currency}
              </span>
            </div>
            <div className="h-6 w-px bg-teal-200 dark:bg-teal-800" />
            <div>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 block font-semibold">
                {lang === 'fa' ? 'جلسات تکمیل‌شده' : 'Completed'}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {trainer.completedSessions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>{lang === 'fa' ? 'تقویم و برنامه‌ریزی حرکات' : 'Calendar & Daily Workouts'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'calendar' ? 'bg-teal-800 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
            {dateSessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'fa' ? 'ورزشکاران تحت نظر' : 'My Members'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'members' ? 'bg-teal-800 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
            {myMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{lang === 'fa' ? 'سوابق جلسات' : 'Session History'}</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{lang === 'fa' ? 'بانک حرکات با انیمیشن' : 'Exercise Catalog'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
            {mockStore.exercises.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PERSIAN CALENDAR & DAILY WORKLOAD & CAPACITY */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Persian Calendar */}
          <div className="space-y-4">
            <PersianCalendar
              selectedDate={selectedDate}
              onSelectDate={d => setSelectedDate(d)}
              sessionCounts={sessionCountsForCalendar}
              capacityStatuses={capacityStatusesForCalendar}
            />

            {/* Quick capacity definition card for selected day */}
            <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  {lang === 'fa' ? 'ظرفیت مربی در این تاریخ:' : 'Daily Capacity on Date:'}
                </span>

                <button
                  onClick={() => {
                    setCustomCapacityInput(dayCapacity);
                    setEditingCapacity(!editingCapacity);
                  }}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  {editingCapacity ? (lang === 'fa' ? 'بستن' : 'Close') : (lang === 'fa' ? 'تغییر ظرفیت' : 'Change')}
                </button>
              </div>

              {editingCapacity ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                    {lang === 'fa' ? `تعداد حداکثر شاگرد برای تاریخ ${selectedDate}:` : `Max members for ${selectedDate}:`}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={customCapacityInput}
                      onChange={e => setCustomCapacityInput(Number(e.target.value))}
                      className="w-20 p-2 text-center rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    />
                    <button
                      onClick={handleSaveCapacity}
                      className="px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {lang === 'fa' ? 'ثبت ظرفیت' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {lang === 'fa' ? 'سقف مجاز شاگرد در این روز:' : 'Allowed Max Students:'}
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {dayCapacity} {lang === 'fa' ? 'شاگرد' : 'members'}
                  </span>
                </div>
              )}

              {/* Progress */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                  <span>{dateSessions.length} / {dayCapacity} {lang === 'fa' ? 'نوبت ثبت‌شده' : 'scheduled'}</span>
                  <span className={dateSessions.length >= dayCapacity ? 'text-rose-500' : 'text-teal-600'}>
                    {capacityPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      capacityPercent >= 100 ? 'bg-rose-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Scheduled Members on Selected Date & Exercise Workout Program */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header of Date & Action Button */}
            <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {humanDate}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    {selectedDate}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'fa'
                    ? `${dateSessions.length} شاگرد در این روز ثبت شده است (${completedDateSessions} جلسه انجام شد).`
                    : `${dateSessions.length} members scheduled for this date (${completedDateSessions} completed).`}
                </p>
              </div>

              {/* Button to schedule member for this date */}
              <button
                onClick={() => {
                  setScheduleMemberId(myMembers[0]?.id || '');
                  setScheduleTime('10:00');
                  setShowScheduleModal(true);
                }}
                disabled={dateSessions.length >= dayCapacity}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'fa' ? 'تعریف شاگرد در این تاریخ' : '+ Add Member to Date'}</span>
              </button>
            </div>

            {/* List of Sessions for Selected Date */}
            {dateSessions.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#11151A] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <CalendarIcon className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                  {lang === 'fa' ? `هیچ شاگردی برای تاریخ ${selectedDate} ثبت نشده است.` : `No sessions for ${selectedDate}.`}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {lang === 'fa'
                    ? 'روی دکمه «تعریف شاگرد در این تاریخ» کلیک کنید تا شاگرد و حرکات ورزشی او را اضافه نمایید.'
                    : 'Click "+ Add Member to Date" to schedule a workout session.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dateSessions.map(sess => {
                  const member = mockStore.members.find(m => m.id === sess.memberId);
                  const isCompleted = sess.status === 'completed';
                  const isInProgress = sess.status === 'in_progress';
                  const isScheduled = sess.status === 'scheduled';

                  return (
                    <div
                      key={sess.id}
                      className={`bg-white dark:bg-[#11151A] rounded-2xl border transition-all ${
                        isCompleted
                          ? 'border-emerald-200 dark:border-emerald-900/50 shadow-xs'
                          : isInProgress
                          ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Session Top Bar */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-200 dark:border-teal-800">
                            {sess.time}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                {sess.memberName}
                              </h3>
                              {sess.isDailyOverride && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                  {lang === 'fa' ? 'موقت امروز' : 'Override'}
                                </span>
                              )}
                              {isCompleted && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {lang === 'fa' ? 'تکمیل شده' : 'Completed'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              {sess.memberPhone && <span>{sess.memberPhone}</span>}
                              {member && (
                                <span>
                                  {lang === 'fa' ? 'بسته:' : 'Package:'} {member.packageName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Balance Badge & Start Button */}
                        <div className="flex items-center gap-3">
                          {member && (
                            <div className="text-right rtl:text-left px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="text-[10px] text-slate-500 block">
                                {lang === 'fa' ? 'مانده جلسات:' : 'Remaining:'}
                              </span>
                              <span className="font-extrabold text-teal-600">
                                {member.remainingSessions} / {member.totalSessions}
                              </span>
                            </div>
                          )}

                          {isScheduled && (
                            <button
                              onClick={() => handleCheckIn(sess.id)}
                              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{lang === 'fa' ? 'شروع تمرین' : 'Start'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Exercises List for this Member & Date */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Dumbbell className="w-4 h-4 text-teal-600" />
                            {lang === 'fa' ? 'برنامه حرکات این شاگرد:' : 'Exercises in this session:'} (
                            {sess.exercises.length})
                          </span>

                          {!isCompleted && (
                            <button
                              onClick={() => handleOpenAddExercise(sess.id)}
                              className="px-3 py-1.5 rounded-lg border border-dashed border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-xs font-bold transition flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{lang === 'fa' ? 'افزودن حرکت با گیف انیمیشن' : '+ Add Exercise with GIF'}</span>
                            </button>
                          )}
                        </div>

                        {sess.exercises.length === 0 ? (
                          <div className="p-5 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                            {lang === 'fa'
                              ? 'هنوز حرکتی برای این جلسه تعریف نشده است. روی «افزودن حرکت» کلیک کنید.'
                              : 'No exercises added. Click "+ Add Exercise with GIF" to assign workout.'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sess.exercises.map(ex => (
                              <div
                                key={ex.id}
                                className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 items-center"
                              >
                                {ex.gifUrl ? (
                                  <img
                                    src={ex.gifUrl}
                                    alt={ex.name}
                                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-800"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                                    <Dumbbell className="w-6 h-6" />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {ex.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                      {ex.sets} {lang === 'fa' ? 'ست' : 'sets'} × {ex.reps} {lang === 'fa' ? 'تکرار' : 'reps'}
                                    </span>
                                    {ex.weightKg && (
                                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                        {ex.weightKg} kg
                                      </span>
                                    )}
                                  </div>
                                  {ex.notes && (
                                    <p className="text-[10px] text-slate-500 italic mt-1 truncate">
                                      💡 {ex.notes}
                                    </p>
                                  )}
                                </div>

                                {!isCompleted && (
                                  <button
                                    onClick={() => handleRemoveExercise(sess.id, ex.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Complete Session Action */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {lang === 'fa'
                              ? 'با تکمیل جلسه ۱ اعتبار از بسته عضو کسر و به حق‌الزحمه مربی منظور می‌گردد.'
                              : 'Session completion deducts 1 credit and credits trainer compensation.'}
                          </span>

                          {!isCompleted ? (
                            <button
                              onClick={() => handleCompleteSession(sess.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>{lang === 'fa' ? 'تکمیل قطعی جلسه' : 'Complete Session'}</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              {lang === 'fa' ? 'جلسه نهایی و ثبت مالی شد' : 'Finalized & Credited'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY MEMBERS */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {lang === 'fa' ? 'ورزشکاران تحت نظر این مربی' : 'Members Under This Trainer'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'fa'
                  ? 'شاگردانی که مربی دائم آنها ثبت شده‌اید.'
                  : 'Members permanently assigned to your roster.'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              {myMembers.length} {lang === 'fa' ? 'شاگرد' : 'Members'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMembers.map(mem => (
              <div
                key={mem.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{mem.name}</h3>
                    <p className="text-xs text-slate-500">{mem.phone}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {lang === 'fa' ? 'فعال' : 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-lg bg-white dark:bg-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">{lang === 'fa' ? 'کل' : 'Total'}</span>
                    <span className="font-bold">{mem.totalSessions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">{lang === 'fa' ? 'مصرف‌شده' : 'Used'}</span>
                    <span className="font-bold">{mem.usedSessions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">{lang === 'fa' ? 'مانده' : 'Remaining'}</span>
                    <span className={`font-black ${mem.remainingSessions <= 2 ? 'text-rose-600' : 'text-teal-600'}`}>
                      {mem.remainingSessions}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{lang === 'fa' ? 'بسته:' : 'Package:'} {mem.packageName}</span>
                  <span>{lang === 'fa' ? 'انقضا:' : 'Expires:'} {mem.expirationDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SESSION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {lang === 'fa' ? 'سوابق جلسات برگزارشده' : 'Completed Session History'}
          </h2>
          <div className="space-y-3">
            {[...mockStore.todaySessions.filter(s => s.trainerId === activeTrainerId && s.status === 'completed'), ...pastSessions].map(sess => (
              <div
                key={sess.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{sess.memberName}</span>
                    <span className="text-[11px] text-slate-500">• {sess.date} ({sess.time})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {lang === 'fa' ? 'تکمیل شده' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'fa' ? 'حرکات:' : 'Exercises:'}{' '}
                    {sess.exercises.map(e => e.name).join('، ') || (lang === 'fa' ? 'بدون جزییات' : 'None')}
                  </p>
                </div>
                <div className="text-xs font-bold text-teal-600">
                  + {trainer.sessionRate.toLocaleString()} {mockStore.gym.currency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXERCISE CATALOG */}
      {activeTab === 'catalog' && (
        <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-500" />
                <span>{lang === 'fa' ? 'بانک حرکات تمرینی همراه با انیمیشن آموزشی' : 'Exercise Catalog with Animations'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'fa'
                  ? 'مشاهده، ویرایش و افزودن حرکات آموزشی FMS با انیمیشن و گیف برای شاگردان.'
                  : 'Browse, edit, and add FMS movement exercises with animations for members.'}
              </p>
            </div>
            <button
              onClick={handleOpenAddTrainerExercise}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'fa' ? '+ تعریف حرکت جدید' : '+ Add New Exercise'}</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'fa' ? 'جستجوی نام فارسی یا انگلیسی حرکت...' : 'Search exercises by name...'}
                className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <select
              value={selectedBodyPart}
              onChange={e => setSelectedBodyPart(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
            >
              <option value="all">{lang === 'fa' ? 'همه بخش‌های بدن' : 'All Muscle Groups'}</option>
              {BODY_PARTS.map(bp => (
                <option key={bp.id} value={bp.id}>
                  {bp.labelFa} ({bp.labelEn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map(item => (
              <div
                key={item.id}
                className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group hover:border-teal-500 transition"
              >
                <div className="relative h-44 bg-slate-800 overflow-hidden">
                  <img src={item.gifUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white">
                      {item.bodyPartFa}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white">
                      {item.equipmentFa}
                    </span>
                  </div>
                  {item.isCustom && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                      ⭐ {lang === 'fa' ? 'سفارشی' : 'Custom'}
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{item.nameFa}</h3>
                        <span className="text-[10px] text-slate-400 block font-medium">{item.name}</span>
                      </div>
                      <button
                        onClick={() => handleOpenEditTrainerExercise(item)}
                        title={lang === 'fa' ? 'ویرایش مشخصات این حرکت' : 'Edit exercise'}
                        className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold">
                        {item.patternFa}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {item.positionFa}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {lang === 'fa' ? item.instructionsFa : item.instructionsEn}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{lang === 'fa' ? 'پیش‌فرض ست و تکرار:' : 'Default sets/reps:'}</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {item.defaultSets} × {item.defaultReps}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE MEMBER ON SELECTED DATE */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'تعریف نوبت تمرین در تاریخ انتخاب‌شده' : 'Schedule Workout Session'}
                </h3>
                <span className="text-xs text-teal-600 font-bold">{selectedDate}</span>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'fa' ? 'انتخاب شاگرد:' : 'Select Member:'}
                </label>
                <select
                  value={scheduleMemberId}
                  onChange={e => setScheduleMemberId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                >
                  {myMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (مانده: {m.remainingSessions} جلسه)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'fa' ? 'ساعت جلسه:' : 'Session Time:'}
                </label>
                <input
                  type="text"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  placeholder="مثال: 10:30"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>

              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-xs text-teal-800 dark:text-teal-300">
                💡 {lang === 'fa'
                  ? `ظرفیت روزانه شما در این تاریخ ${dayCapacity} نفر است. پس از ثبت نوبت، می‌توانید حرکات ورزشی با انیمیشن را برای شاگرد مشخص کنید.`
                  : `Daily capacity is ${dayCapacity}. After scheduling, attach exercises with animation GIFs.`}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {lang === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleScheduleMember}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
              >
                {lang === 'fa' ? 'تأیید و ثبت در تقویم' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXERCISE WITH ANIMATED GIF TO SESSION */}
      {modalSessionId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'افزودن حرکت تمرینی به این جلسه' : 'Add Exercise to Workout'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'fa' ? 'انتخاب حرکت از کاتالوگ همراه با گیف متحرک' : 'Select exercise with animated demonstration'}
                </p>
              </div>
              <button onClick={() => setModalSessionId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'fa' ? 'انتخاب حرکت:' : 'Choose Exercise:'}
                </label>
                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/50">
                  {mockStore.exercises.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedExercise(item)}
                      className={`w-full text-right rtl:text-right ltr:text-left px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                        selectedExercise?.id === item.id
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{lang === 'fa' ? item.nameFa : item.name}</span>
                      <span className="text-[10px] opacity-75">{item.bodyPartFa}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedExercise && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {lang === 'fa' ? 'انیمیشن اجرای صحیح:' : 'Demonstration GIF:'}
                  </span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-40 bg-slate-900 relative">
                    <img src={selectedExercise.gifUrl} alt={selectedExercise.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                      {selectedExercise.equipmentFa}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    {lang === 'fa' ? selectedExercise.instructionsFa : selectedExercise.instructionsEn}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'fa' ? 'تعداد ست' : 'Sets'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={inputSets}
                  onChange={e => setInputSets(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'fa' ? 'تکرار' : 'Reps'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={inputReps}
                  onChange={e => setInputReps(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'fa' ? 'وزنه (kg)' : 'Weight (kg)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={inputWeight || ''}
                  onChange={e => setInputWeight(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-center"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                {lang === 'fa' ? 'دستور مربی و نکات تکنیکی' : 'Trainer Notes'}
              </label>
              <input
                type="text"
                value={inputNotes}
                onChange={e => setInputNotes(e.target.value)}
                placeholder={lang === 'fa' ? 'مثال: مکث یک ثانیه‌ای در انتهای دامنه حرکتی' : 'e.g. 1s pause at bottom'}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setModalSessionId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {lang === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveExercise}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
              >
                {lang === 'fa' ? 'افزودن حرکت به برنامه' : 'Add Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXERCISE IN CATALOG (TRAINER) */}
      {showAddTrainerExerciseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
                  {editingTrainerExercise ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {editingTrainerExercise
                      ? (lang === 'fa' ? `ویرایش حرکت: ${editingTrainerExercise.nameFa}` : `Edit Exercise: ${editingTrainerExercise.name}`)
                      : (lang === 'fa' ? 'تعریف حرکت جدید در بانک حرکات' : 'Add New Exercise to Catalog')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'fa'
                      ? 'تنظیم مشخصات حرکتی، عضلات، الگوی FMS و انیمیشن آموزشی'
                      : 'Configure movement patterns, muscle groups, and animation GIF'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddTrainerExerciseModal(false);
                  setEditingTrainerExercise(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrainerExercise} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'نام فارسی حرکت' : 'Exercise Name (Persian)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={trExNameFa}
                    onChange={e => setTrExNameFa(e.target.value)}
                    placeholder="مثال: لانج رو به جلو با دمبل"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'نام انگلیسی حرکت' : 'Exercise Name (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={trExNameEn}
                    onChange={e => setTrExNameEn(e.target.value)}
                    placeholder="e.g. Dumbbell Forward Lunge"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'بخش و عضله هدف' : 'Target Body Part'}
                  </label>
                  <select
                    value={trExBodyPart}
                    onChange={e => setTrExBodyPart(e.target.value as BodyPart)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  >
                    {BODY_PARTS.map(bp => (
                      <option key={bp.id} value={bp.id}>
                        {bp.labelFa} ({bp.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'الگوی حرکتی عملکردی (FMS)' : 'FMS Movement Pattern'}
                  </label>
                  <select
                    value={trExPattern}
                    onChange={e => setTrExPattern(e.target.value as FmsPattern)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  >
                    {FMS_PATTERNS.map(fp => (
                      <option key={fp.id} value={fp.id}>
                        {fp.labelFa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'تجهیزات مورد نیاز' : 'Equipment'}
                  </label>
                  <select
                    value={trExEquipment}
                    onChange={e => setTrExEquipment(e.target.value as EquipmentType)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  >
                    {EQUIPMENT_TYPES.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.labelFa} ({eq.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'وضعیت بدنی (Position)' : 'Body Position'}
                  </label>
                  <select
                    value={trExPosition}
                    onChange={e => setTrExPosition(e.target.value as ExercisePosition)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  >
                    {EXERCISE_POSITIONS.map(pos => (
                      <option key={pos.id} value={pos.id}>
                        {pos.labelFa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'تعداد پیش‌فرض ست‌ها' : 'Default Sets'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={trExSets}
                    onChange={e => setTrExSets(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'تعداد پیش‌فرض تکرارها' : 'Default Reps'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={trExReps}
                    onChange={e => setTrExReps(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              {/* Media URL with live preview */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'fa' ? 'آدرس گیف انیمیشن یا عکس راهنما (URL)' : 'Demonstration GIF or Image URL'}
                </label>
                <input
                  type="url"
                  value={trExGifUrl}
                  onChange={e => setTrExGifUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
                {trExGifUrl && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 w-44">
                    <img
                      src={trExGifUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'fa' ? 'راهنما و نکات فنی اجرا (فارسی)' : 'Instructions & Technique Cues (Persian)'}
                </label>
                <textarea
                  rows={2}
                  value={trExInstructionsFa}
                  onChange={e => setTrExInstructionsFa(e.target.value)}
                  placeholder="نکات تنفس، قرارگیری پاها، مفاصل و عضلات درگیر..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'fa' ? 'راهنما و نکات فنی به انگلیسی (اختیاری)' : 'Instructions (English - Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={trExInstructionsEn}
                  onChange={e => setTrExInstructionsEn(e.target.value)}
                  placeholder="Key cues, setup, breathing pattern..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTrainerExerciseModal(false);
                    setEditingTrainerExercise(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-500/20"
                >
                  {editingTrainerExercise
                    ? (lang === 'fa' ? 'ذخیره تغییرات حرکت' : 'Save Changes')
                    : (lang === 'fa' ? 'ثبت و افزودن به بانک' : 'Save Exercise')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
