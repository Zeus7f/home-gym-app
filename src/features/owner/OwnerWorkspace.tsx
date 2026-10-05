import React, { useState } from 'react';
import { gymStore } from '../../lib/supabase/mockStore';
import { translations, Language } from '../../lib/i18n';
import { PersianCalendar } from '../../components/calendar/PersianCalendar';
import { getTodayJalaliString, formatJalaliHuman, parseJalali } from '../../lib/date/jalali';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Shield,
  Activity,
  Key,
  Lock,
  Sliders,
  Check,
  Sparkles,
  Dumbbell,
  Trash2,
  BookOpen,
  Search,
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

export function OwnerWorkspace({ lang = 'fa' }: { lang?: Language }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'trainers' | 'schedule' | 'finance' | 'reports' | 'users' | 'exercises' | 'settings'>('dashboard');
  const [, setTick] = useState(0);

  // Exercise catalog & FMS management states
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [filterBodyPart, setFilterBodyPart] = useState<string>('all');
  const [filterFmsPattern, setFilterFmsPattern] = useState<string>('all');

  const [newExNameFa, setNewExNameFa] = useState('');
  const [newExNameEn, setNewExNameEn] = useState('');
  const [newExBodyPart, setNewExBodyPart] = useState<BodyPart>('mobility');
  const [newExEquipment, setNewExEquipment] = useState<EquipmentType>('bodyweight');
  const [newExPattern, setNewExPattern] = useState<FmsPattern>('deep_squat');
  const [newExPosition, setNewExPosition] = useState<ExercisePosition>('standing');
  const [newExGifUrl, setNewExGifUrl] = useState('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState(10);
  const [newExInstructionsFa, setNewExInstructionsFa] = useState('');
  const [newExInstructionsEn, setNewExInstructionsEn] = useState('');

  // Calendar & Capacity on Date states
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>(getTodayJalaliString());
  const [editingGymCap, setEditingGymCap] = useState(false);
  const [customGymCapInput, setCustomGymCapInput] = useState(30);
  const [editingTrainerCapId, setEditingTrainerCapId] = useState<string | null>(null);
  const [customTrainerCapInput, setCustomTrainerCapInput] = useState(6);

  // User management & Password Reset
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<string | null>(null); // userId
  const [newPasswordInput, setNewPasswordInput] = useState('123');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Modals state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null); // memberId
  const [showPayoutModal, setShowPayoutModal] = useState<string | null>(null); // trainerId
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null); // memberId
  const [showReassignModal, setShowReassignModal] = useState<string | null>(null); // sessionId

  // Form states
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberTrainer, setNewMemberTrainer] = useState('t-ali');
  const [newMemberPackage, setNewMemberPackage] = useState('بسته خصوصی ۱۲ جلسه‌ای');
  const [newMemberSessions, setNewMemberSessions] = useState(12);
  const [newMemberPrice, setNewMemberPrice] = useState(12000000);
  const [newMemberPaid, setNewMemberPaid] = useState(8000000);

  const [paymentAmount, setPaymentAmount] = useState(4000000);
  const [payoutAmount, setPayoutAmount] = useState(2000000);
  const [adjustDelta, setAdjustDelta] = useState(2);
  const [adjustReason, setAdjustReason] = useState('جلسات تشویقی / بونوس');
  const [newDailyTrainer, setNewDailyTrainer] = useState('t-sara');

  const [searchQuery, setSearchQuery] = useState('');

  const t = translations[lang];

  // Store references
  const gym = gymStore.gym;
  const members = gymStore.members;
  const trainers = gymStore.trainers;
  const todaySessions = gymStore.todaySessions;

  // KPIs
  const checkedInCount = todaySessions.filter(s => s.status === 'in_progress' || s.status === 'completed').length;
  const remainingTodayCount = todaySessions.filter(s => s.status === 'scheduled').length;
  const completedTodayCount = todaySessions.filter(s => s.status === 'completed').length;
  const totalRemainingSessions = members.reduce((sum, m) => sum + m.remainingSessions, 0);
  const lowBalanceMembers = members.filter(m => m.remainingSessions <= 2);
  const totalGymCapacity = gym.capacity;
  const occupancyPercent = Math.min(100, Math.round((todaySessions.length / totalGymCapacity) * 100));

  function handleCreateMember(e: React.FormEvent) {
    e.preventDefault();
    const trainerObj = trainers.find(t => t.id === newMemberTrainer);
    gymStore.addMember({
      name: newMemberName,
      phone: newMemberPhone,
      defaultTrainerId: newMemberTrainer,
      defaultTrainerName: trainerObj?.name || '',
      packageName: newMemberPackage,
      totalSessions: Number(newMemberSessions),
      packagePrice: Number(newMemberPrice),
      paidAmount: Number(newMemberPaid),
      startDate: new Date().toLocaleDateString('fa-IR'),
      expirationDate: '1403/08/30',
      status: 'active'
    });
    setShowAddMember(false);
    setNewMemberName('');
    setNewMemberPhone('');
    setTick(t => t + 1);
  }

  function handleRecordPayment(memberId: string) {
    gymStore.recordMemberPayment(memberId, Number(paymentAmount), 'card', 'پرداخت شهریه و تسویه');
    setShowPaymentModal(null);
    setTick(t => t + 1);
  }

  function handleRecordPayout(trainerId: string) {
    gymStore.recordTrainerPayout(trainerId, Number(payoutAmount), 'transfer', 'واریز دستمزد');
    setShowPayoutModal(null);
    setTick(t => t + 1);
  }

  function handleAdjustSessions(memberId: string) {
    gymStore.adjustMemberSessions(memberId, Number(adjustDelta), adjustReason);
    setShowAdjustModal(null);
    setTick(t => t + 1);
  }

  function handleDailyReassign(sessionId: string) {
    gymStore.reassignDailyTrainer(sessionId, newDailyTrainer);
    setShowReassignModal(null);
    setTick(t => t + 1);
  }

  function handleCreateExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newExNameFa.trim() || !newExNameEn.trim()) {
      setFeedbackToast('لطفاً نام فارسی و انگلیسی حرکت را وارد کنید.');
      setTimeout(() => setFeedbackToast(null), 3000);
      return;
    }

    const bpObj = BODY_PARTS.find(b => b.id === newExBodyPart);
    const eqObj = EQUIPMENT_TYPES.find(eq => eq.id === newExEquipment);
    const patObj = FMS_PATTERNS.find(p => p.id === newExPattern);
    const posObj = EXERCISE_POSITIONS.find(pos => pos.id === newExPosition);

    gymStore.addCustomExercise({
      name: newExNameEn.trim(),
      nameFa: newExNameFa.trim(),
      bodyPart: newExBodyPart,
      bodyPartFa: bpObj ? bpObj.labelFa : newExBodyPart,
      equipment: newExEquipment,
      equipmentFa: eqObj ? eqObj.labelFa : newExEquipment,
      pattern: newExPattern,
      patternFa: patObj ? patObj.labelFa : newExPattern,
      position: newExPosition,
      positionFa: posObj ? posObj.labelFa : newExPosition,
      gifUrl: newExGifUrl.trim() || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
      instructionsFa: newExInstructionsFa.trim() || 'حرکت را با تمرکز و دامنه کامل اجرا کنید.',
      instructionsEn: newExInstructionsEn.trim() || 'Perform the exercise with controlled form and full range of motion.',
      defaultSets: Number(newExSets) || 3,
      defaultReps: Number(newExReps) || 10
    });

    setShowAddExerciseModal(false);
    setNewExNameFa('');
    setNewExNameEn('');
    setNewExInstructionsFa('');
    setNewExInstructionsEn('');
    setTick(t => t + 1);
    setFeedbackToast(lang === 'fa' ? 'حرکت جدید با موفقیت به بانک حرکات اضافه شد.' : 'Exercise successfully added to catalog.');
    setTimeout(() => setFeedbackToast(null), 4000);
  }

  function handleDeleteExercise(id: string, name: string) {
    if (window.confirm(`آیا از حذف حرکت "${name}" از بانک حرکات مطمئن هستید؟`)) {
      gymStore.deleteCustomExercise(id);
      setTick(t => t + 1);
      setFeedbackToast(lang === 'fa' ? `حرکت "${name}" حذف شد.` : `Exercise "${name}" removed.`);
      setTimeout(() => setFeedbackToast(null), 3500);
    }
  }

  function handleOpenEditExercise(ex: ExerciseItem) {
    setEditingExercise(ex);
    setNewExNameFa(ex.nameFa);
    setNewExNameEn(ex.name);
    setNewExBodyPart(ex.bodyPart);
    setNewExEquipment(ex.equipment);
    setNewExPattern(ex.pattern);
    setNewExPosition(ex.position);
    setNewExGifUrl(ex.gifUrl);
    setNewExSets(ex.defaultSets || 3);
    setNewExReps(ex.defaultReps || 10);
    setNewExInstructionsFa(ex.instructionsFa || '');
    setNewExInstructionsEn(ex.instructionsEn || '');
  }

  function handleSaveEditExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExercise) return;
    if (!newExNameFa.trim() || !newExNameEn.trim()) {
      setFeedbackToast('لطفاً نام فارسی و انگلیسی حرکت را وارد کنید.');
      setTimeout(() => setFeedbackToast(null), 3000);
      return;
    }

    const bpObj = BODY_PARTS.find(b => b.id === newExBodyPart);
    const eqObj = EQUIPMENT_TYPES.find(eq => eq.id === newExEquipment);
    const patObj = FMS_PATTERNS.find(p => p.id === newExPattern);
    const posObj = EXERCISE_POSITIONS.find(pos => pos.id === newExPosition);

    gymStore.updateExercise(editingExercise.id, {
      name: newExNameEn.trim(),
      nameFa: newExNameFa.trim(),
      bodyPart: newExBodyPart,
      bodyPartFa: bpObj ? bpObj.labelFa : newExBodyPart,
      equipment: newExEquipment,
      equipmentFa: eqObj ? eqObj.labelFa : newExEquipment,
      pattern: newExPattern,
      patternFa: patObj ? patObj.labelFa : newExPattern,
      position: newExPosition,
      positionFa: posObj ? posObj.labelFa : newExPosition,
      gifUrl: newExGifUrl.trim() || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
      instructionsFa: newExInstructionsFa.trim() || 'حرکت را با تمرکز و دامنه کامل اجرا کنید.',
      instructionsEn: newExInstructionsEn.trim() || 'Perform the exercise with controlled form and full range of motion.',
      defaultSets: Number(newExSets) || 3,
      defaultReps: Number(newExReps) || 10
    });

    setEditingExercise(null);
    setTick(t => t + 1);
    setFeedbackToast(lang === 'fa' ? 'اطلاعات حرکت با موفقیت ویرایش و ذخیره شد.' : 'Exercise updated successfully.');
    setTimeout(() => setFeedbackToast(null), 4000);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> {t.nav.owner.dashboard}
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'members'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> {t.nav.owner.members}
          </button>
          <button
            onClick={() => setActiveTab('trainers')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'trainers'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" /> {t.nav.owner.trainers}
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'schedule'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" /> {t.nav.owner.schedule}
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'finance'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" /> {t.nav.owner.finance}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reports'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> {t.nav.owner.reports}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'users'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" /> {lang === 'fa' ? 'کاربران و امنیت' : 'Users & Security'}
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'exercises'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>{lang === 'fa' ? 'بانک حرکات (FMS)' : 'Exercise Catalog'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
              {gymStore.exercises.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> {t.members.addMemberBtn}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD TAB */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.dashboard.title}</h1>
            <p className="text-xs text-slate-500 mt-1">{t.dashboard.subtitle}</p>
          </div>

          {/* Level 1: Operational Vital Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gym Capacity / Occupancy */}
            <div className="bg-white dark:bg-[#11151A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">{t.dashboard.gymCapacity}</span>
                <Activity className="w-4 h-4 text-teal-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                  {todaySessions.length} / {totalGymCapacity}
                </span>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{occupancyPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${occupancyPercent}%` }}></div>
              </div>
              <span className="text-[11px] text-slate-400 block mt-2">{t.dashboard.currentOccupancy}</span>
            </div>

            {/* Today's Attendance */}
            <div className="bg-white dark:bg-[#11151A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">{t.dashboard.todayMembers}</span>
                <Users className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {todaySessions.length}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                <span className="text-emerald-600 font-bold">{checkedInCount} {t.dashboard.checkedIn}</span>
                <span>•</span>
                <span>{remainingTodayCount} {t.dashboard.remainingToday}</span>
              </div>
            </div>

            {/* Active Trainers & Capacity */}
            <div className="bg-white dark:bg-[#11151A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">{t.dashboard.activeTrainers}</span>
                <UserCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {trainers.length}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-2">
                {trainers.length} {t.dashboard.availableTrainers}
              </span>
            </div>

            {/* Completed Sessions Today */}
            <div className="bg-white dark:bg-[#11151A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">{t.dashboard.sessionsUsed}</span>
                <CheckCircle className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-3xl font-black text-teal-600 dark:text-teal-400 tabular-nums">
                {completedTodayCount}
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-2">
                {totalRemainingSessions} {t.dashboard.sessionsRemaining}
              </span>
            </div>
          </div>

          {/* Level 2: Low Balance Warning Alert (Section 31) */}
          {lowBalanceMembers.length > 0 && (
            <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>{t.dashboard.lowBalanceAlert}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lowBalanceMembers.map(m => (
                  <div key={m.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">{m.name}</span>
                      <span className="text-[11px] text-slate-500">{m.phone}</span>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-black tabular-nums">
                      {m.remainingSessions} {lang === 'fa' ? 'جلسه' : 'left'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level 3: Today's Arrival & Live Operations Quick Table */}
          <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t.schedule.title}</h3>
                <p className="text-xs text-slate-500">{t.schedule.subtitle}</p>
              </div>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-xs font-bold text-teal-600 hover:underline"
              >
                {lang === 'fa' ? 'مشاهده کامل برنامه →' : 'View Full Schedule →'}
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {todaySessions.map(s => (
                <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                      {s.time}
                    </span>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">{s.memberName}</span>
                      <span className="text-slate-500">{s.trainerName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      s.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : s.status === 'in_progress'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {t.schedule[s.status as keyof typeof t.schedule] || s.status}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {s.exercises.length} {lang === 'fa' ? 'حرکت ثبت‌شده' : 'exercises'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MEMBERS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.members.title}</h1>
              <p className="text-xs text-slate-500">{t.members.subtitle}</p>
            </div>
            <input
              type="text"
              placeholder={t.members.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs w-full sm:w-64"
            />
          </div>

          <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-slate-500">
                  <tr>
                    <th className="p-4">{t.members.name}</th>
                    <th className="p-4">{t.members.trainer}</th>
                    <th className="p-4">{t.members.remaining}</th>
                    <th className="p-4">{t.members.paid}</th>
                    <th className="p-4">{t.members.balance}</th>
                    <th className="p-4">{t.members.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members
                    .filter(m => !searchQuery || m.name.includes(searchQuery) || m.phone.includes(searchQuery))
                    .map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {m.name}
                          <span className="text-[11px] text-slate-400 font-normal block">{m.phone}</span>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                          {m.defaultTrainerName}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg font-black text-xs tabular-nums inline-block ${
                            m.remainingSessions <= 2
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                          }`}>
                            {m.remainingSessions} / {m.totalSessions}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {m.paidAmount.toLocaleString()} {gym.currency}
                        </td>
                        <td className="p-4">
                          {m.outstandingBalance > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono font-bold">
                              {m.outstandingBalance.toLocaleString()} {gym.currency}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold">
                              {lang === 'fa' ? 'تسویه کامل ✓' : 'Settled ✓'}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {m.outstandingBalance > 0 && (
                              <button
                                onClick={() => {
                                  setShowPaymentModal(m.id);
                                  setPaymentAmount(m.outstandingBalance);
                                }}
                                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold"
                              >
                                {t.members.recordPayment}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowAdjustModal(m.id);
                                setAdjustDelta(2);
                              }}
                              className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                            >
                              {t.members.adjustSessions}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRAINERS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'trainers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.trainers.title}</h1>
              <p className="text-xs text-slate-500">{t.trainers.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainers.map(tr => {
              const todayCount = todaySessions.filter(s => s.trainerId === tr.id).length;
              const capacityPercent = Math.min(100, Math.round((todayCount / tr.dailyCapacity) * 100));

              return (
                <div key={tr.id} className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{tr.name}</h3>
                      <p className="text-xs text-slate-500">{tr.specialty}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {tr.workingHours}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>{t.trainers.dailyCapacity}:</span>
                      <span className="tabular-nums">{todayCount} / {tr.dailyCapacity}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          capacityPercent >= 100 ? 'bg-rose-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Compensation Overview (Section 13) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.trainers.sessionRate}</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {tr.sessionRate.toLocaleString()} {gym.currency}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.trainers.totalCompleted}</span>
                      <span className="font-bold font-mono text-teal-600 dark:text-teal-400">
                        {tr.completedSessions} {lang === 'fa' ? 'جلسه' : 'sessions'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.trainers.earned}</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {(tr.completedSessions * tr.sessionRate).toLocaleString()} {gym.currency}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.trainers.outstanding}</span>
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                        {tr.outstandingCompensation.toLocaleString()} {gym.currency}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setShowPayoutModal(tr.id);
                        setPayoutAmount(tr.outstandingCompensation);
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      {t.trainers.recordPayout}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SCHEDULE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (() => {
        const gymCapOnDate = gymStore.getGymDailyCapacity(selectedScheduleDate);
        const dateSessions = gymStore.getSessionsForDate(selectedScheduleDate);
        const parsedDate = parseJalali(selectedScheduleDate);
        const humanDate = parsedDate ? formatJalaliHuman(parsedDate) : selectedScheduleDate;

        // Session counts and capacity statuses for PersianCalendar
        const sessionCounts: Record<string, number> = {};
        const capStatuses: Record<string, { used: number; total: number }> = {};
        gymStore.todaySessions.forEach(s => {
          const d = s.date === 'Today' ? getTodayJalaliString() : s.date;
          sessionCounts[d] = (sessionCounts[d] || 0) + 1;
          capStatuses[d] = {
            used: sessionCounts[d],
            total: gymStore.getGymDailyCapacity(d)
          };
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'تقویم عملیاتی و برنامه‌ریزی باشگاه' : 'Operations Calendar & Schedule'}
                </h1>
                <p className="text-xs text-slate-500">
                  {lang === 'fa'
                    ? 'مشاهده وضعیت نوبت‌ها بر اساس تقویم شمسی و تعیین ظرفیت باشگاه و مربیان برای هر روز.'
                    : 'Schedule and capacity management per date on the Persian calendar.'}
                </p>
              </div>
              <button
                onClick={() => setShowAddSession(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t.schedule.addSessionBtn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Persian Calendar & Gym Capacity */}
              <div className="space-y-4">
                <PersianCalendar
                  selectedDate={selectedScheduleDate}
                  onSelectDate={d => setSelectedScheduleDate(d)}
                  sessionCounts={sessionCounts}
                  capacityStatuses={capStatuses}
                />

                {/* Gym Capacity on Selected Date */}
                <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-teal-600" />
                      {lang === 'fa' ? 'ظرفیت کل باشگاه در این تاریخ:' : 'Gym Capacity on Date:'}
                    </span>
                    <button
                      onClick={() => {
                        setCustomGymCapInput(gymCapOnDate);
                        setEditingGymCap(!editingGymCap);
                      }}
                      className="text-xs font-bold text-teal-600 hover:underline"
                    >
                      {editingGymCap ? (lang === 'fa' ? 'بستن' : 'Close') : (lang === 'fa' ? 'تغییر ظرفیت' : 'Change')}
                    </button>
                  </div>

                  {editingGymCap ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                        {lang === 'fa' ? `ظرفیت کل باشگاه برای تاریخ ${selectedScheduleDate}:` : `Gym capacity for ${selectedScheduleDate}:`}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={customGymCapInput}
                          onChange={e => setCustomGymCapInput(Number(e.target.value))}
                          className="w-24 p-2 text-center rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                        />
                        <button
                          onClick={() => {
                            gymStore.setGymDailyCapacity(selectedScheduleDate, customGymCapInput);
                            setEditingGymCap(false);
                            setFeedbackToast(lang === 'fa' ? 'ظرفیت روزانه باشگاه با موفقیت ذخیره شد.' : 'Gym capacity updated.');
                            setTimeout(() => setFeedbackToast(null), 3000);
                            setTick(t => t + 1);
                          }}
                          className="px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {lang === 'fa' ? 'ذخیره' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{lang === 'fa' ? 'سقف پذیرش کل روز:' : 'Total day limit:'}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {gymCapOnDate} {lang === 'fa' ? 'ورزشکار' : 'members'}
                      </span>
                    </div>
                  )}

                  {/* Trainers Capacity Breakdown on Date */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {lang === 'fa' ? 'ظرفیت مربیان در این روز:' : 'Trainers Capacity on Date:'}
                    </span>
                    {trainers.map(tr => {
                      const trCap = gymStore.getTrainerDailyCapacity(selectedScheduleDate, tr.id);
                      const trSessions = dateSessions.filter(s => s.trainerId === tr.id);
                      const isEditing = editingTrainerCapId === tr.id;

                      return (
                        <div key={tr.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{tr.name}</span>
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  setEditingTrainerCapId(null);
                                } else {
                                  setEditingTrainerCapId(tr.id);
                                  setCustomTrainerCapInput(trCap);
                                }
                              }}
                              className="text-[10px] font-bold text-teal-600 hover:underline"
                            >
                              {isEditing ? (lang === 'fa' ? 'انصراف' : 'Cancel') : (lang === 'fa' ? 'تنظیم ظرفیت' : 'Edit Cap')}
                            </button>
                          </div>

                          {isEditing ? (
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={customTrainerCapInput}
                                onChange={e => setCustomTrainerCapInput(Number(e.target.value))}
                                className="w-16 p-1 text-center rounded bg-white dark:bg-slate-800 border text-xs font-bold"
                              />
                              <button
                                onClick={() => {
                                  gymStore.setTrainerDailyCapacity(selectedScheduleDate, tr.id, customTrainerCapInput);
                                  setEditingTrainerCapId(null);
                                  setTick(t => t + 1);
                                }}
                                className="px-2 py-1 bg-teal-600 text-white rounded text-[10px] font-bold"
                              >
                                {lang === 'fa' ? 'تأیید' : 'OK'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>{trSessions.length} / {trCap} {lang === 'fa' ? 'شاگرد' : 'members'}</span>
                              <span className={trSessions.length >= trCap ? 'text-rose-500 font-bold' : 'text-teal-600 font-bold'}>
                                {Math.round((trSessions.length / trCap) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right 2 Columns: Date Schedule Sessions */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex items-center justify-between shadow-xs">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{humanDate}</h2>
                    <span className="text-xs text-teal-600 font-bold">{selectedScheduleDate}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {dateSessions.length} {lang === 'fa' ? 'جلسه در این تاریخ' : 'Sessions'}
                  </span>
                </div>

                <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  {dateSessions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 space-y-2">
                      <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="font-bold text-sm">
                        {lang === 'fa' ? `هیچ نوبتی برای تاریخ ${selectedScheduleDate} ثبت نشده است.` : `No sessions for ${selectedScheduleDate}.`}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dateSessions.map(session => (
                        <div key={session.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-base font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl">
                              {session.time}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-base text-slate-900 dark:text-white">{session.memberName}</span>
                                {session.isDailyOverride && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    {t.schedule.dailyOverrideBadge}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  session.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : session.status === 'in_progress'
                                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                  {t.schedule[session.status as keyof typeof t.schedule] || session.status}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 block mt-0.5">
                                {lang === 'fa' ? 'مربی مسئول:' : 'Trainer:'} {session.trainerName}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {session.status === 'scheduled' && (
                              <button
                                onClick={() => {
                                  gymStore.checkInSession(session.id);
                                  setTick(t => t + 1);
                                }}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs"
                              >
                                {t.schedule.checkIn}
                              </button>
                            )}

                            {session.status === 'in_progress' && (
                              <button
                                onClick={() => {
                                  gymStore.completeMemberSession(session.id);
                                  setTick(t => t + 1);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                              >
                                {t.schedule.finish}
                              </button>
                            )}

                            {session.status !== 'completed' && (
                              <>
                                <button
                                  onClick={() => {
                                    setShowReassignModal(session.id);
                                  }}
                                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  {t.schedule.reassignTrainer}
                                </button>
                                <button
                                  onClick={() => {
                                    gymStore.cancelSession(session.id);
                                    setTick(t => t + 1);
                                  }}
                                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-medium"
                                >
                                  {t.schedule.cancel}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 5. USERS & PASSWORDS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'fa' ? 'مدیریت کاربران و کلمات عبور' : 'User Accounts & Passwords'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'fa'
                  ? 'مشاهده نام کاربری و امکان ریست کردن کلمه عبور مربیان و شاگردان توسط مدیر باشگاه.'
                  : 'Manage system accounts and reset passwords for trainers and members.'}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'fa' ? 'فهرست حساب‌های کاربری فعال' : 'Active Accounts'} ({gymStore.users.length})
              </span>
              <span className="text-[11px] text-teal-600 font-bold">
                💡 {lang === 'fa' ? 'مدیر امکان تغییر پسورد همه حساب‌ها را دارد.' : 'Admin can reset all passwords.'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">{lang === 'fa' ? 'نام و مشخصات' : 'Name'}</th>
                    <th className="p-3.5 font-bold">{lang === 'fa' ? 'نام کاربری (Login)' : 'Username'}</th>
                    <th className="p-3.5 font-bold">{lang === 'fa' ? 'نقش' : 'Role'}</th>
                    <th className="p-3.5 font-bold">{lang === 'fa' ? 'شماره تماس' : 'Phone'}</th>
                    <th className="p-3.5 font-bold">{lang === 'fa' ? 'عملیات امنیت' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gymStore.users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">{u.displayName}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {u.username}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'owner'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : u.role === 'trainer'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {u.role === 'owner'
                            ? (lang === 'fa' ? 'مدیر باشگاه' : 'Owner')
                            : u.role === 'trainer'
                            ? (lang === 'fa' ? 'مربی' : 'Trainer')
                            : (lang === 'fa' ? 'ورزشکار' : 'Member')}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">{u.phone || '-'}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => {
                            setShowResetPasswordModal(u.id);
                            setNewPasswordInput('123');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Key className="w-3.5 h-3.5 text-teal-600" />
                          <span>{lang === 'fa' ? 'ریست کلمه عبور' : 'Reset Password'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXERCISES & FMS CATALOG TAB */}
      {/* ========================================================================= */}
      {activeTab === 'exercises' && (() => {
        const filteredExercises = gymStore.exercises.filter(item => {
          const matchesSearch =
            item.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
            item.nameFa.includes(exerciseSearchQuery) ||
            item.bodyPartFa.includes(exerciseSearchQuery) ||
            item.patternFa.includes(exerciseSearchQuery) ||
            item.pattern.includes(exerciseSearchQuery);
          const matchesBody = filterBodyPart === 'all' || item.bodyPart === filterBodyPart;
          const matchesFms = filterFmsPattern === 'all' || item.pattern === filterFmsPattern;
          return matchesSearch && matchesBody && matchesFms;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-teal-600" />
                  <span>
                    {lang === 'fa' ? 'بانک جامع حرکات ورزشی و سیستم‌های حرکتی (FMS)' : 'Exercise Catalog & FMS Database'}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'fa'
                    ? 'مدیریت و گسترش دیتابیس حرکات بر اساس سیستم ارزیابی عملکردی (Functional Movement Systems) همراه با گیف‌های متحرک'
                    : 'Manage and expand the exercise database with Functional Movement Systems patterns and animated GIFs.'}
                </p>
              </div>

              <button
                onClick={() => setShowAddExerciseModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'fa' ? 'افزودن حرکت جدید با تنظیمات کامل' : 'Add Exercise with Full Config'}</span>
              </button>
            </div>

            {/* FMS Info Banner */}
            <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-bold text-teal-900 dark:text-teal-200">
                  {lang === 'fa' ? 'متصل به اصول سیستم حرکتی عملکردی (FMS)' : 'Aligned with Functional Movement Systems (FMS)'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'fa'
                    ? 'حرکات ثبت‌شده در این بخش بر پایه ۷ آزمون اصلی FMS (اسکوات عمیق، گام روی مانع، لانژ خطی، موبیلیتی شانه، بالا آوردن پای صاف، پایداری تنه و پایداری چرخشی) و موقعیت‌های اصلاحی (چهار دست و پا، نیمه دو زانو، طاق‌باز) طراحی شده‌اند. هر حرکت جدیدی که اضافه کنید بلافاصله در پنل مربیان برای برنامه‌ریزی جلسات شاگردان قابل استفاده خواهد بود.'
                    : 'Exercises here are modeled after fundamental FMS screens and corrective positions. Any new exercises added will immediately be available to trainers when assigning workouts.'}
                </p>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search Box */}
                <div className="relative sm:col-span-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 rtl:right-3 ltr:left-3" />
                  <input
                    type="text"
                    value={exerciseSearchQuery}
                    onChange={e => setExerciseSearchQuery(e.target.value)}
                    placeholder={lang === 'fa' ? 'جستجوی نام حرکت (فارسی/انگلیسی)...' : 'Search exercises...'}
                    className="w-full pr-9 pl-4 rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>

                {/* Body Part Filter */}
                <div>
                  <select
                    value={filterBodyPart}
                    onChange={e => setFilterBodyPart(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">{lang === 'fa' ? 'همه بخش‌های بدن' : 'All Body Parts'}</option>
                    {BODY_PARTS.map(bp => (
                      <option key={bp.id} value={bp.id}>
                        {lang === 'fa' ? bp.labelFa : bp.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FMS Pattern Filter */}
                <div>
                  <select
                    value={filterFmsPattern}
                    onChange={e => setFilterFmsPattern(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">{lang === 'fa' ? 'همه الگوهای FMS' : 'All FMS Patterns'}</option>
                    {FMS_PATTERNS.map(fp => (
                      <option key={fp.id} value={fp.id}>
                        {lang === 'fa' ? fp.labelFa : fp.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>
                  {lang === 'fa' ? 'تعداد حرکات یافت‌شده:' : 'Exercises found:'}{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{filteredExercises.length}</strong> از{' '}
                  {gymStore.exercises.length}
                </span>
                {(exerciseSearchQuery || filterBodyPart !== 'all' || filterFmsPattern !== 'all') && (
                  <button
                    onClick={() => {
                      setExerciseSearchQuery('');
                      setFilterBodyPart('all');
                      setFilterFmsPattern('all');
                    }}
                    className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                  >
                    {lang === 'fa' ? 'پاک کردن فیلترها' : 'Clear Filters'}
                  </button>
                )}
              </div>
            </div>

            {/* Exercises Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:border-teal-500/60 transition group shadow-xs"
                >
                  {/* Demo GIF preview */}
                  <div className="h-44 bg-slate-900 relative overflow-hidden">
                    <img
                      src={item.gifUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2 flex flex-wrap items-center gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-black/75 text-white backdrop-blur-xs">
                        {item.bodyPartFa}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                        {item.equipmentFa}
                      </span>
                    </div>

                    {item.isCustom && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-sm">
                        ⭐ {lang === 'fa' ? 'افزوده شده توسط مدیر' : 'Custom'}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                            {lang === 'fa' ? item.nameFa : item.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditExercise(item)}
                            title={lang === 'fa' ? 'ویرایش این حرکت' : 'Edit exercise'}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {item.isCustom && (
                            <button
                              onClick={() => handleDeleteExercise(item.id, item.nameFa)}
                              title={lang === 'fa' ? 'حذف این حرکت' : 'Delete exercise'}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Pattern & Position Badges */}
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold">
                          🎯 {item.patternFa}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          📍 {item.positionFa}
                        </span>
                      </div>

                      {/* Instructions */}
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        {lang === 'fa' ? item.instructionsFa : item.instructionsEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                      <span className="font-semibold text-slate-500">
                        {lang === 'fa' ? 'پیش‌فرض ست و تکرار:' : 'Default Protocol:'}
                      </span>
                      <span className="font-extrabold text-teal-600 dark:text-teal-400">
                        {item.defaultSets || 3} {lang === 'fa' ? 'ست' : 'sets'} × {item.defaultReps || 10}{' '}
                        {lang === 'fa' ? 'تکرار' : 'reps'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 5. FINANCE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.finance.title}</h1>
            <p className="text-xs text-slate-500">{t.finance.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#11151A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block mb-1">{t.finance.totalRevenue}</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {members.reduce((s, m) => s + m.packagePrice, 0).toLocaleString()} {gym.currency}
              </span>
            </div>
            <div className="bg-white dark:bg-[#11151A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block mb-1">{t.finance.totalPaid}</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {members.reduce((s, m) => s + m.paidAmount, 0).toLocaleString()} {gym.currency}
              </span>
            </div>
            <div className="bg-white dark:bg-[#11151A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block mb-1">{t.finance.totalOutstanding}</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                {members.reduce((s, m) => s + m.outstandingBalance, 0).toLocaleString()} {gym.currency}
              </span>
            </div>
            <div className="bg-white dark:bg-[#11151A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500 block mb-1">{t.finance.totalTrainerComp}</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {trainers.reduce((s, tr) => s + tr.outstandingCompensation, 0).toLocaleString()} {gym.currency}
              </span>
            </div>
          </div>

          {/* Member Payments Table */}
          <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t.finance.memberPayments}</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto text-xs">
              {gymStore.memberPayments.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{p.memberName}</span>
                    <span className="text-slate-400 block text-[11px]">{p.description} • {p.date}</span>
                  </div>
                  <span className="font-black font-mono text-emerald-600 text-sm">
                    +{p.amount.toLocaleString()} {gym.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REPORTS TAB (Section 27 & 28) */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.reports.title}</h1>
            <p className="text-xs text-slate-500">{t.reports.subtitle}</p>
          </div>

          {/* Report 1: Daily Operations Summary */}
          <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {t.reports.dailyOpsTitle}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block">{t.dashboard.gymCapacity}</span>
                <span className="text-xl font-bold">{todaySessions.length} / {gym.capacity}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block">{t.schedule.completed}</span>
                <span className="text-xl font-bold text-emerald-600">{completedTodayCount}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block">{t.schedule.inProgress}</span>
                <span className="text-xl font-bold text-sky-600">
                  {todaySessions.filter(s => s.status === 'in_progress').length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block">{t.dashboard.activeTrainers}</span>
                <span className="text-xl font-bold">{trainers.length}</span>
              </div>
            </div>
          </div>

          {/* Report 2: Daily Exercise Report ("Who did what with whom today?") */}
          <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {t.reports.dailyExerciseTitle}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {todaySessions.map(sess => (
                <div key={sess.id} className="py-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{sess.memberName}</span>
                      <span className="text-slate-500 mx-2">•</span>
                      <span className="text-teal-600 font-semibold">{sess.trainerName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sess.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sess.status}
                    </span>
                  </div>
                  {sess.exercises.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sess.exercises.map(ex => (
                        <div key={ex.id} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{ex.name}</span>
                          <span className="text-slate-400 font-mono">
                            {ex.sets} × {ex.reps} {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {lang === 'fa' ? 'هنوز حرکتی برای این جلسه ثبت نهایی نشده است.' : 'No exercises logged for this session yet.'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SETTINGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 max-w-2xl">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.nav.owner.settings}</h1>
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'نام باشگاه' : 'Gym Name'}
              </label>
              <input
                type="text"
                defaultValue={gym.name}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'سقف ظرفیت روزانه باشگاه (نفر)' : 'Daily Gym Capacity (members)'}
              </label>
              <input
                type="number"
                defaultValue={gym.capacity}
                onChange={e => {
                  gym.capacity = Number(e.target.value);
                  setTick(t => t + 1);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMBER */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.members.addMemberBtn}</h3>
            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{t.members.name}</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="e.g. رضا کمالی"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{t.members.phone}</label>
                <input
                  type="text"
                  required
                  value={newMemberPhone}
                  onChange={e => setNewMemberPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{t.members.trainer}</label>
                <select
                  value={newMemberTrainer}
                  onChange={e => setNewMemberTrainer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                >
                  {trainers.map(tr => (
                    <option key={tr.id} value={tr.id}>{tr.name} ({tr.specialty})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{lang === 'fa' ? 'تعداد جلسات بسته' : 'Sessions'}</label>
                  <input
                    type="number"
                    value={newMemberSessions}
                    onChange={e => setNewMemberSessions(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">{lang === 'fa' ? 'قیمت بسته (تومان)' : 'Price'}</label>
                  <input
                    type="number"
                    value={newMemberPrice}
                    onChange={e => setNewMemberPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">{lang === 'fa' ? 'پیش‌پرداخت اولیه (تومان)' : 'Paid Amount'}</label>
                <input
                  type="number"
                  value={newMemberPaid}
                  onChange={e => setNewMemberPaid(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border rounded-xl text-slate-500"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl"
                >
                  {lang === 'fa' ? 'ثبت عضو' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-sm w-full p-6 space-y-4 border">
            <h3 className="font-bold text-base">{t.members.recordPayment}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{lang === 'fa' ? 'مبلغ دریافتی (تومان)' : 'Amount'}</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 border rounded-xl"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleRecordPayment(showPaymentModal)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  {lang === 'fa' ? 'ثبت واریز' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST SESSIONS */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-sm w-full p-6 space-y-4 border">
            <h3 className="font-bold text-base">{t.members.adjustSessions}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{lang === 'fa' ? 'تغییر مانده (مثلا ۲+ یا ۱-)' : 'Delta (+/-)'}</label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={e => setAdjustDelta(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{lang === 'fa' ? 'دلیل اصلاح' : 'Reason'}</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAdjustModal(null)} className="px-4 py-2 border rounded-xl">
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
                <button onClick={() => handleAdjustSessions(showAdjustModal)} className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl">
                  {lang === 'fa' ? 'اعمال اصلاح' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REASSIGN DAILY TRAINER (Section 17 & 39) */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-sm w-full p-6 space-y-4 border">
            <h3 className="font-bold text-base">{t.schedule.reassignTrainer}</h3>
            <p className="text-xs text-slate-500">
              {lang === 'fa'
                ? 'توجه: این جابجایی صرفاً برای جلسه امروز اعمال می‌شود و مربی دائم ورزشکار تغییر نخواهد کرد.'
                : 'Note: This change applies to today only. Default assignment remains unchanged.'}
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{lang === 'fa' ? 'انتخاب مربی جایگزین امروز' : 'Select Today Trainer'}</label>
                <select
                  value={newDailyTrainer}
                  onChange={e => setNewDailyTrainer(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900"
                >
                  {trainers.map(tr => (
                    <option key={tr.id} value={tr.id}>{tr.name} ({tr.specialty})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowReassignModal(null)} className="px-4 py-2 border rounded-xl">
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
                <button onClick={() => handleDailyReassign(showReassignModal)} className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl">
                  {lang === 'fa' ? 'ثبت جابجایی روزانه' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK TOAST */}
      {feedbackToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-teal-600 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* MODAL: RESET USER PASSWORD */}
      {showResetPasswordModal && (() => {
        const targetUser = gymStore.users.find(u => u.id === showResetPasswordModal);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-teal-600" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {lang === 'fa' ? 'تغییر و ریست کلمه عبور کاربر' : 'Reset User Password'}
                  </h3>
                </div>
                <button onClick={() => setShowResetPasswordModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {targetUser && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1 border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'fa' ? 'نام کاربر:' : 'User:'}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{targetUser.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'fa' ? 'نام کاربری:' : 'Username:'}</span>
                      <span className="font-mono font-bold text-teal-600">{targetUser.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{lang === 'fa' ? 'نقش:' : 'Role:'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {targetUser.role === 'owner' ? 'مدیر' : targetUser.role === 'trainer' ? 'مربی' : 'شاگرد'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'fa' ? 'کلمه عبور جدید:' : 'New Password:'}
                    </label>
                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={e => setNewPasswordInput(e.target.value)}
                      placeholder="e.g. 123 یا pass2024"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {lang === 'fa'
                      ? 'مدیر باشگاه می‌تواند بدون نیاز به رمز قبلی، کلمه عبور جدید را تعیین نماید. این رمز بلافاصله فعال می‌شود.'
                      : 'Admin can reset password instantly without requiring previous password.'}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowResetPasswordModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    if (showResetPasswordModal && newPasswordInput.trim()) {
                      gymStore.resetPassword(showResetPasswordModal, newPasswordInput.trim());
                      setShowResetPasswordModal(null);
                      setFeedbackToast(lang === 'fa' ? 'کلمه عبور با موفقیت تغییر یافت.' : 'Password reset successfully.');
                      setTimeout(() => setFeedbackToast(null), 4000);
                      setTick(t => t + 1);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
                >
                  {lang === 'fa' ? 'ذخیره کلمه عبور جدید' : 'Save New Password'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: ADD / EDIT EXERCISE WITH FULL CONFIG */}
      {(showAddExerciseModal || editingExercise) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-teal-600" />
                  <span>
                    {editingExercise
                      ? (lang === 'fa' ? `ویرایش حرکت "${editingExercise.nameFa}"` : `Edit Exercise - ${editingExercise.name}`)
                      : (lang === 'fa' ? 'تعریف حرکت جدید در بانک حرکات (با تنظیمات کامل FMS)' : 'Add New Exercise to Catalog (Full FMS Configuration)')}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'fa'
                    ? 'مشخصات، الگوهای عملکردی FMS، وضعیت بدنی و لینک تصویر متحرک را وارد نمایید.'
                    : 'Define movement pattern, corrective position, equipment and demonstration GIF.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddExerciseModal(false);
                  setEditingExercise(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingExercise ? handleSaveEditExercise : handleCreateExercise} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'fa' ? 'نام فارسی حرکت' : 'Exercise Name (Persian)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExNameFa}
                    onChange={e => setNewExNameFa(e.target.value)}
                    placeholder="مثال: اسکوات گابلت با دمبل"
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
                    value={newExNameEn}
                    onChange={e => setNewExNameEn(e.target.value)}
                    placeholder="e.g. Dumbbell Goblet Squat"
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
                    value={newExBodyPart}
                    onChange={e => setNewExBodyPart(e.target.value as BodyPart)}
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
                    {lang === 'fa' ? 'الگوی حرکتی عملکردی (FMS Pattern)' : 'FMS Movement Pattern'}
                  </label>
                  <select
                    value={newExPattern}
                    onChange={e => setNewExPattern(e.target.value as FmsPattern)}
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
                    value={newExEquipment}
                    onChange={e => setNewExEquipment(e.target.value as EquipmentType)}
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
                    value={newExPosition}
                    onChange={e => setNewExPosition(e.target.value as ExercisePosition)}
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
                    value={newExSets}
                    onChange={e => setNewExSets(Number(e.target.value))}
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
                    value={newExReps}
                    onChange={e => setNewExReps(Number(e.target.value))}
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
                  value={newExGifUrl}
                  onChange={e => setNewExGifUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
                {newExGifUrl && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 w-44">
                    <img
                      src={newExGifUrl}
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
                  value={newExInstructionsFa}
                  onChange={e => setNewExInstructionsFa(e.target.value)}
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
                  value={newExInstructionsEn}
                  onChange={e => setNewExInstructionsEn(e.target.value)}
                  placeholder="Key cues, setup, breathing pattern..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExerciseModal(false);
                    setEditingExercise(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-bold"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  {editingExercise
                    ? (lang === 'fa' ? 'ذخیره تغییرات حرکت' : 'Save Changes')
                    : (lang === 'fa' ? 'ذخیره در دیتابیس حرکات' : 'Save to Catalog')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
