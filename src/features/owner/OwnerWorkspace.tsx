import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  BarChart3,
  Dumbbell,
  Settings,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Shield,
  KeyRound,
  Sliders,
  DollarSign,
  History,
  FileText,
  UserPlus,
  RefreshCw,
  Eye,
  Check,
  X,
  Lock
} from 'lucide-react';
import { gymStore, Member, Trainer, DailySession, ExerciseItem } from '../../lib/supabase/mockStore';
import { Language, translations } from '../../lib/i18n';
import { PersianCalendar } from '../../components/calendar/PersianCalendar';
import {
  getTodayJalaliString,
  parseJalali,
  formatJalaliHuman
} from '../../lib/date/jalali';
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

export type OwnerNavTab =
  | 'dashboard'
  | 'members'
  | 'trainers'
  | 'schedule'
  | 'exercises'
  | 'finance'
  | 'reports'
  | 'settings';

interface OwnerWorkspaceProps {
  lang: Language;
}

export const OwnerWorkspace: React.FC<OwnerWorkspaceProps> = ({ lang }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = gymStore.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const [activeTab, setActiveTab] = useState<OwnerNavTab>('dashboard');
  const t = translations[lang];

  // Exercises Catalog Filter & State
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [filterBodyPart, setFilterBodyPart] = useState<string>('all');
  const [filterFmsPattern, setFilterFmsPattern] = useState<string>('all');
  const [showExerciseEditor, setShowExerciseEditor] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);

  // Calendar & Capacity on Date states
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>(getTodayJalaliString());
  const [editingGymCap, setEditingGymCap] = useState(false);
  const [customGymCapInput, setCustomGymCapInput] = useState(30);
  const [editingTrainerCapId, setEditingTrainerCapId] = useState<string | null>(null);
  const [customTrainerCapInput, setCustomTrainerCapInput] = useState(6);

  // Search & Member Filters
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);

  // Modals state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null); // memberId
  const [showPayoutModal, setShowPayoutModal] = useState<string | null>(null); // trainerId
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null); // memberId
  const [showReassignModal, setShowReassignModal] = useState<string | null>(null); // sessionId
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<string | null>(null); // userId

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

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);

  // Add Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberTrainer, setNewMemberTrainer] = useState(gymStore.trainers[0]?.id || 't-ali');
  const [newMemberPackage, setNewMemberPackage] = useState('بسته خصوصی ۱۲ جلسه‌ای');
  const [newMemberSessions, setNewMemberSessions] = useState(12);
  const [newMemberPrice, setNewMemberPrice] = useState(12000000);
  const [newMemberPaid, setNewMemberPaid] = useState(8000000);
  const [newMemberPassword, setNewMemberPassword] = useState('123');

  // Add Trainer Form State
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerPhone, setNewTrainerPhone] = useState('');
  const [newTrainerSpecialty, setNewTrainerSpecialty] = useState('');
  const [newTrainerCapacity, setNewTrainerCapacity] = useState(6);
  const [newTrainerRate, setNewTrainerRate] = useState(350000);
  const [newTrainerHours, setNewTrainerHours] = useState('08:00 - 16:00');
  const [newTrainerPassword, setNewTrainerPassword] = useState('123');

  // Add Session Form State
  const [newSessionMemberId, setNewSessionMemberId] = useState(gymStore.members[0]?.id || '');
  const [newSessionTrainerId, setNewSessionTrainerId] = useState(gymStore.trainers[0]?.id || '');
  const [newSessionDate, setNewSessionDate] = useState(getTodayJalaliString());
  const [newSessionTime, setNewSessionTime] = useState('11:00');

  // Payment & Payout & Adjust Form State
  const [paymentAmount, setPaymentAmount] = useState(4000000);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer'>('card');
  const [paymentDescription, setPaymentDescription] = useState('واریز قسط شهریه');

  const [payoutAmount, setPayoutAmount] = useState(2000000);
  const [payoutMethod, setPayoutMethod] = useState<'card' | 'cash' | 'transfer'>('transfer');
  const [payoutDescription, setPayoutDescription] = useState('تسویه دستمزد جلسات');

  const [adjustDelta, setAdjustDelta] = useState(1);
  const [adjustReason, setAdjustReason] = useState('جلسات جبرانی / بونوس');
  const [newDailyTrainer, setNewDailyTrainer] = useState(gymStore.trainers[0]?.id || '');

  // Reset Password State
  const [newPasswordInput, setNewPasswordInput] = useState('123');

  // Store data bindings
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
  const todayCap = gymStore.getGymDailyCapacity(getTodayJalaliString());
  const occupancyPercent = Math.min(100, Math.round((todaySessions.length / Math.max(1, todayCap)) * 100));

  // Finance calculations
  const totalRevenueCollected = gymStore.memberPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalOutstandingReceivable = members.reduce((acc, m) => acc + m.outstandingBalance, 0);
  const totalTrainerPayouts = gymStore.trainerPayouts.reduce((acc, p) => acc + p.amount, 0);
  const totalTrainerOutstanding = trainers.reduce((acc, tr) => acc + tr.outstandingCompensation, 0);

  // Filtered lists
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    m.phone.includes(memberSearchQuery) ||
    m.defaultTrainerName.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const filteredExercises = gymStore.exercises.filter(ex => {
    const matchesSearch =
      ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
      ex.nameFa.includes(exerciseSearchQuery) ||
      (ex.instructionsFa && ex.instructionsFa.includes(exerciseSearchQuery));
    const matchesBodyPart = filterBodyPart === 'all' || ex.bodyPart === filterBodyPart;
    const matchesPattern = filterFmsPattern === 'all' || ex.pattern === filterFmsPattern;
    return matchesSearch && matchesBodyPart && matchesPattern;
  });

  // Action Handlers
  function handleCreateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPhone.trim()) {
      setToast({ message: lang === 'fa' ? 'لطفاً نام و شماره تماس را وارد کنید.' : 'Please enter name and phone.', type: 'error' });
      return;
    }

    const trainerObj = trainers.find(t => t.id === newMemberTrainer);
    gymStore.addMember(
      {
        name: newMemberName.trim(),
        phone: newMemberPhone.trim(),
        defaultTrainerId: newMemberTrainer,
        defaultTrainerName: trainerObj?.name || '',
        packageName: newMemberPackage,
        totalSessions: Number(newMemberSessions) || 12,
        packagePrice: Number(newMemberPrice) || 0,
        paidAmount: Number(newMemberPaid) || 0,
        startDate: getTodayJalaliString(),
        expirationDate: '1403/09/30',
        status: 'active'
      },
      newMemberPassword.trim()
    );

    setShowAddMember(false);
    setNewMemberName('');
    setNewMemberPhone('');
    setToast({
      message: lang === 'fa' ? 'عضو جدید با موفقیت اضافه شد و حساب کاربری ایجاد گردید.' : 'Member added successfully with login account.',
      type: 'success'
    });
  }

  function handleCreateTrainer(e: React.FormEvent) {
    e.preventDefault();
    if (!newTrainerName.trim() || !newTrainerPhone.trim()) {
      setToast({ message: lang === 'fa' ? 'نام و شماره تماس مربی الزامی است.' : 'Name and phone required.', type: 'error' });
      return;
    }

    gymStore.addTrainer(
      {
        name: newTrainerName.trim(),
        phone: newTrainerPhone.trim(),
        specialty: newTrainerSpecialty.trim() || 'مربی بدنسازی و فیتنس',
        dailyCapacity: Number(newTrainerCapacity) || 6,
        sessionRate: Number(newTrainerRate) || 350000,
        workingHours: newTrainerHours || '08:00 - 16:00',
        workingDays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'],
        status: 'active'
      },
      newTrainerPassword.trim()
    );

    setShowAddTrainer(false);
    setNewTrainerName('');
    setNewTrainerPhone('');
    setNewTrainerSpecialty('');
    setToast({
      message: lang === 'fa' ? 'مربی جدید با موفقیت به کادر اضافه شد.' : 'Trainer added successfully.',
      type: 'success'
    });
  }

  function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    const res = gymStore.scheduleSessionOnDate(
      newSessionDate,
      newSessionTime,
      newSessionMemberId,
      newSessionTrainerId
    );

    if (res.success) {
      setShowAddSession(false);
      setToast({
        message: lang === 'fa' ? 'نوبت تمرینی با موفقیت در تقویم ثبت شد.' : 'Training session scheduled successfully.',
        type: 'success'
      });
    } else {
      setToast({ message: res.message, type: 'error' });
    }
  }

  function handleRecordPayment(memberId: string) {
    if (paymentAmount <= 0) {
      setToast({ message: lang === 'fa' ? 'مبلغ پرداختی باید بزرگتر از صفر باشد.' : 'Amount must be greater than zero.', type: 'error' });
      return;
    }

    gymStore.recordMemberPayment(memberId, paymentAmount, paymentMethod, paymentDescription);
    setShowPaymentModal(null);
    setToast({
      message: lang === 'fa' ? 'پرداخت با موفقیت ثبت شد.' : 'Payment successfully recorded.',
      type: 'success'
    });
  }

  function handleRecordPayout(trainerId: string) {
    if (payoutAmount <= 0) {
      setToast({ message: lang === 'fa' ? 'مبلغ تسویه باید بزرگتر از صفر باشد.' : 'Payout amount must be greater than zero.', type: 'error' });
      return;
    }

    gymStore.recordTrainerPayout(trainerId, payoutAmount, payoutMethod, payoutDescription);
    setShowPayoutModal(null);
    setToast({
      message: lang === 'fa' ? 'تسویه دستمزد مربی با موفقیت ثبت شد.' : 'Trainer payout successfully recorded.',
      type: 'success'
    });
  }

  function handleAdjustSessions(memberId: string) {
    if (adjustDelta === 0) {
      setToast({ message: lang === 'fa' ? 'تعداد تغییر جلسات نمی‌تواند صفر باشد.' : 'Delta cannot be zero.', type: 'error' });
      return;
    }

    try {
      gymStore.adjustMemberSessions(memberId, adjustDelta, adjustReason);
      setShowAdjustModal(null);
      setToast({
        message: lang === 'fa' ? 'تعداد جلسات با موفقیت اصلاح شد.' : 'Session balance adjusted successfully.',
        type: 'success'
      });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  }

  function handleDailyReassign(sessionId: string) {
    gymStore.reassignDailyTrainer(sessionId, newDailyTrainer);
    setShowReassignModal(null);
    setToast({
      message: lang === 'fa' ? 'جابجایی مربی فقط برای امروز ثبت شد.' : 'Daily trainer reassigned for today.',
      type: 'success'
    });
  }

  function handleSaveExercise(exerciseData: Omit<ExerciseItem, 'id'>, id?: string) {
    if (id) {
      gymStore.updateExercise(id, exerciseData);
      setToast({ message: lang === 'fa' ? 'حرکت با موفقیت ویرایش شد.' : 'Exercise updated.', type: 'success' });
    } else {
      gymStore.addCustomExercise(exerciseData);
      setToast({ message: lang === 'fa' ? 'حرکت جدید به بانک اضافه شد.' : 'Exercise added to catalog.', type: 'success' });
    }
    setShowExerciseEditor(false);
    setEditingExercise(null);
  }

  function handleDeleteExercise(exercise: ExerciseItem) {
    setConfirmDialog({
      isOpen: true,
      title: lang === 'fa' ? 'حذف حرکت از بانک حرکات' : 'Delete Exercise',
      description: lang === 'fa'
        ? `آیا از حذف حرکت "${exercise.nameFa}" مطمئن هستید؟ این عملیات قابل بازگشت نیست.`
        : `Are you sure you want to remove "${exercise.name}" from catalog?`,
      confirmText: lang === 'fa' ? 'حذف حرکت' : 'Delete',
      variant: 'danger',
      onConfirm: () => {
        gymStore.deleteCustomExercise(exercise.id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setToast({
          message: lang === 'fa' ? `حرکت "${exercise.nameFa}" حذف شد.` : `Exercise "${exercise.name}" removed.`,
          type: 'success'
        });
      }
    });
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

      {/* Modern Floating Navigation Bar */}
      <nav aria-label="ناوبری اصلی مدیریت باشگاه" className="glass-panel rounded-2xl p-2 border border-white/60 dark:border-slate-800/80 shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1">
          {[
            { id: 'dashboard', label: t.nav.owner.dashboard, icon: BarChart3 },
            { id: 'members', label: t.nav.owner.members, icon: Users, count: members.length },
            { id: 'trainers', label: t.nav.owner.trainers, icon: UserCheck, count: trainers.length },
            { id: 'schedule', label: t.nav.owner.schedule, icon: Calendar, count: todaySessions.length },
            { id: 'exercises', label: lang === 'fa' ? 'بانک حرکات' : 'Exercise Catalog', icon: Dumbbell, count: gymStore.exercises.length },
            { id: 'finance', label: t.nav.owner.finance, icon: CreditCard },
            { id: 'reports', label: t.nav.owner.reports, icon: FileText },
            { id: 'settings', label: t.nav.owner.settings, icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as OwnerNavTab)}
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
      {/* 1. DASHBOARD TAB */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner with Fast Actions */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-linear-to-r from-teal-900/90 via-slate-900 to-slate-900 text-white border border-teal-500/20 shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    ● {lang === 'fa' ? 'باشگاه فعال است' : 'Gym Operational'}
                  </Badge>
                  <span className="text-xs text-slate-300 font-medium">
                    {formatJalaliHuman(parseJalali(getTodayJalaliString())!)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {lang === 'fa' ? gym.name : 'Iron Haven Club'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  {lang === 'fa'
                    ? 'وضعیت لحظه‌ای حضور اعضا، ظرفیت سالن، مربیان فعال و مدیریت نوبت‌های تمرینی امروز.'
                    : 'Real-time overview of attendance, gym occupancy, active trainers, and today workouts.'}
                </p>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowAddMember(true)}
                  className="font-bold shadow-lg shadow-teal-500/30"
                >
                  <UserPlus className="w-4 h-4 me-1.5" />
                  {t.members.addMemberBtn}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowAddSession(true)}
                  className="font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Calendar className="w-4 h-4 me-1.5" />
                  {t.schedule.addSessionBtn}
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverElevation className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.dashboard.checkedIn}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {formatNumber(checkedInCount)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  / {formatNumber(todaySessions.length)} {lang === 'fa' ? 'نوبت امروز' : 'today'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span>{completedTodayCount} {lang === 'fa' ? 'جلسه نهایی و ثبت شد' : 'completed'}</span>
              </div>
            </Card>

            <Card hoverElevation className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.dashboard.remainingToday}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {formatNumber(remainingTodayCount)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {lang === 'fa' ? 'نوبت در انتظار' : 'scheduled'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-medium">
                {lang === 'fa' ? 'هنوز ثبت ورود نشده‌اند' : 'Awaiting check-in'}
              </div>
            </Card>

            <Card hoverElevation className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.dashboard.gymCapacity}
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {formatNumber(todaySessions.length)} / {formatNumber(todayCap)}
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    occupancyPercent >= 90 ? 'bg-rose-500' : 'bg-teal-500'
                  )}
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </Card>

            <Card hoverElevation className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.dashboard.sessionsRemaining}
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {formatNumber(totalRemainingSessions)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {lang === 'fa' ? 'جلسه در کل بسته‌ها' : 'active sessions'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                {lowBalanceMembers.length} {lang === 'fa' ? 'ورزشکار در آستانه تمدید (≤۲ جلسه)' : 'members need renewal'}
              </div>
            </Card>
          </div>

          {/* Today's Schedule Operational List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t.schedule.title} ({todaySessions.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'fa' ? 'لیست نوبت‌های امروز به همراه مربی و وضعیت نهایی' : 'Today sessions with assigned trainers and status'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSession(true)}
                >
                  <Plus className="w-3.5 h-3.5 me-1" />
                  {t.schedule.addSessionBtn}
                </Button>
              </div>

              <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {todaySessions.length === 0 ? (
                  <EmptyState
                    title={lang === 'fa' ? 'هیچ نوبتی برای امروز ثبت نشده است' : 'No sessions today'}
                    description={lang === 'fa' ? 'می‌توانید با دکمه بالا یک ورزشکار را به نوبت‌های امروز اضافه کنید.' : 'Schedule a workout for today.'}
                    actionLabel={t.schedule.addSessionBtn}
                    onAction={() => setShowAddSession(true)}
                  />
                ) : (
                  todaySessions.map(session => (
                    <div
                      key={session.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                          {session.time}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {session.memberName}
                            </span>
                            <Badge
                              variant={
                                session.status === 'completed'
                                  ? 'success'
                                  : session.status === 'in_progress'
                                  ? 'primary'
                                  : session.status === 'cancelled'
                                  ? 'danger'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {session.status === 'completed'
                                ? t.schedule.completed
                                : session.status === 'in_progress'
                                ? t.schedule.inProgress
                                : session.status === 'cancelled'
                                ? 'لغو شده'
                                : t.schedule.scheduled}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>{lang === 'fa' ? 'مربی:' : 'Trainer:'} <strong className="text-slate-700 dark:text-slate-300">{session.trainerName}</strong></span>
                            {session.isDailyOverride && (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                                {lang === 'fa' ? 'مربی موقت امروز' : 'Daily Override'}
                              </span>
                            )}
                            <span>•</span>
                            <span>{session.exercises.length} {lang === 'fa' ? 'حرکت ثبت‌شده' : 'exercises'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Operations for Owner */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowReassignModal(session.id);
                            setNewDailyTrainer(session.trainerId);
                          }}
                          className="text-xs text-slate-500 hover:text-teal-600"
                        >
                          {lang === 'fa' ? 'تغییر مربی' : 'Reassign'}
                        </Button>
                        {session.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => gymStore.checkInSession(session.id)}
                            className="text-xs text-teal-600 border-teal-500/30 hover:bg-teal-500/10"
                          >
                            <Check className="w-3.5 h-3.5 me-1" />
                            {lang === 'fa' ? 'ورود' : 'Check In'}
                          </Button>
                        )}
                        {session.status !== 'completed' && session.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: lang === 'fa' ? 'لغو نوبت تمرینی' : 'Cancel Session',
                                description: lang === 'fa'
                                  ? `آیا از لغو نوبت ${session.memberName} اطمینان دارید؟ توجه داشته باشید که هیچ جلسه‌ای از اعتبار ورزشکار کسر نخواهد شد.`
                                  : `Cancel session for ${session.memberName}? No session balance will be deducted.`,
                                confirmText: lang === 'fa' ? 'لغو نوبت' : 'Cancel Session',
                                variant: 'danger',
                                onConfirm: () => {
                                  gymStore.cancelSession(session.id);
                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                  setToast({ message: lang === 'fa' ? 'نوبت با موفقیت لغو شد.' : 'Session cancelled.', type: 'info' });
                                }
                              });
                            }}
                            className="text-xs text-rose-500 hover:bg-rose-500/10"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>

            {/* Right Column: Trainers Today Status & Low Balance Alerts */}
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t.dashboard.activeTrainers}
                  </h3>
                  <Badge variant="primary" size="sm">
                    {trainers.length} {lang === 'fa' ? 'مربی' : 'trainers'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {trainers.map(tr => {
                    const trCount = todaySessions.filter(s => s.trainerId === tr.id).length;
                    const trCap = gymStore.getTrainerDailyCapacity(getTodayJalaliString(), tr.id);
                    const pct = Math.min(100, Math.round((trCount / Math.max(1, trCap)) * 100));

                    return (
                      <div key={tr.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-900 dark:text-white">{tr.name}</span>
                          <span className="font-mono text-slate-500">{trCount} / {trCap}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', pct >= 100 ? 'bg-rose-500' : 'bg-teal-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Low Balance Warning */}
              {lowBalanceMembers.length > 0 && (
                <Card className="p-5 border-amber-500/30 bg-amber-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="text-xs font-black">
                      {lang === 'fa' ? 'ورزشکاران نیازمند تمدید بسته' : 'Members Needing Renewal'}
                    </h4>
                  </div>
                  <div className="divide-y divide-amber-500/10 text-xs">
                    {lowBalanceMembers.slice(0, 4).map(m => (
                      <div key={m.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
                          <span className="text-[11px] text-slate-500">{m.phone}</span>
                        </div>
                        <Badge variant="warning" size="sm">
                          {m.remainingSessions} {lang === 'fa' ? 'جلسه مانده' : 'left'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MEMBERS MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{t.members.title}</h1>
              <p className="text-xs text-slate-500">{t.members.subtitle}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddMember(true)}
              className="font-bold shadow-md shadow-teal-500/20"
            >
              <UserPlus className="w-4 h-4 me-1.5" />
              {t.members.addMemberBtn}
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5 pointer-events-none" />
            <input
              type="text"
              value={memberSearchQuery}
              onChange={e => setMemberSearchQuery(e.target.value)}
              placeholder={lang === 'fa' ? 'جستجوی نام، تلفن یا مربی ورزشکار...' : 'Search members by name, phone or trainer...'}
              className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Members Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                    <th className="p-3.5 text-start">{t.members.name}</th>
                    <th className="p-3.5 text-start">{t.members.trainer}</th>
                    <th className="p-3.5 text-start">{t.members.package}</th>
                    <th className="p-3.5 text-center">{t.members.remaining}</th>
                    <th className="p-3.5 text-start">{t.members.paymentStatus}</th>
                    <th className="p-3.5 text-end">{lang === 'fa' ? 'عملیات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="font-black text-slate-900 dark:text-white">{member.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{member.phone}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-teal-600 dark:text-teal-400">{member.defaultTrainerName}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{member.packageName}</div>
                        <div className="text-[10px] text-slate-400">
                          {member.usedSessions} / {member.totalSessions} {lang === 'fa' ? 'استفاده شده' : 'used'}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge
                          variant={member.remainingSessions <= 2 ? 'warning' : 'primary'}
                          size="md"
                          className="font-mono font-black"
                        >
                          {member.remainingSessions}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        {member.outstandingBalance === 0 ? (
                          <Badge variant="success" size="sm">
                            {lang === 'fa' ? 'تسویه کامل' : 'Paid in full'}
                          </Badge>
                        ) : (
                          <div>
                            <span className="font-mono font-bold text-rose-500">
                              {formatCurrency(member.outstandingBalance, gym.currency)}
                            </span>
                            <span className="block text-[10px] text-slate-400">{lang === 'fa' ? 'بدهکار' : 'due'}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Payment */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowPaymentModal(member.id);
                              setPaymentAmount(member.outstandingBalance > 0 ? member.outstandingBalance : 1000000);
                            }}
                            ariaLabel={t.members.recordPayment}
                            className="p-1.5 h-8 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </Button>

                          {/* Adjust Sessions */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAdjustModal(member.id);
                              setAdjustDelta(1);
                            }}
                            ariaLabel={t.members.adjustSessions}
                            className="p-1.5 h-8 text-teal-600 border-teal-500/30 hover:bg-teal-500/10"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>

                          {/* Reset Password */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const user = gymStore.users.find(u => u.entityId === member.id);
                              if (user) {
                                setShowResetPasswordModal(user.id);
                                setNewPasswordInput('123');
                              } else {
                                setToast({ message: lang === 'fa' ? 'حساب کاربری ورود برای این عضو یافت نشد.' : 'User account not found.', type: 'error' });
                              }
                            }}
                            ariaLabel={lang === 'fa' ? 'ریست پسورد' : 'Reset password'}
                            className="p-1.5 h-8 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/10"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>

                          {/* View Detail */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMemberDetail(member)}
                            ariaLabel={lang === 'fa' ? 'مشاهده پرونده' : 'View profile'}
                            className="p-1.5 h-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRAINERS MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'trainers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{t.trainers.title}</h1>
              <p className="text-xs text-slate-500">{t.trainers.subtitle}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddTrainer(true)}
              className="font-bold shadow-md shadow-teal-500/20"
            >
              <UserPlus className="w-4 h-4 me-1.5" />
              {lang === 'fa' ? 'افزودن مربی جدید' : 'Add Trainer'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainers.map(tr => {
              const todayCount = todaySessions.filter(s => s.trainerId === tr.id).length;
              const capPct = Math.min(100, Math.round((todayCount / Math.max(1, tr.dailyCapacity)) * 100));

              return (
                <Card key={tr.id} hoverElevation className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">{tr.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{tr.specialty}</p>
                      <span className="text-[11px] font-mono text-slate-400 block mt-1">{tr.phone}</span>
                    </div>
                    <Badge variant="neutral" size="sm" className="font-mono">
                      {tr.workingHours}
                    </Badge>
                  </div>

                  {/* Daily Capacity indicator */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500">{t.trainers.dailyCapacity}:</span>
                      <span className="font-mono">{todayCount} / {tr.dailyCapacity}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', capPct >= 100 ? 'bg-rose-500' : 'bg-teal-500')}
                        style={{ width: `${capPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block">{t.trainers.sessionRate}</span>
                      <span className="font-black font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(tr.sessionRate, gym.currency)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block">{t.trainers.totalCompleted}</span>
                      <span className="font-black font-mono text-teal-600 dark:text-teal-400">
                        {tr.completedSessions} {lang === 'fa' ? 'جلسه' : 'sessions'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block">{t.trainers.earned}</span>
                      <span className="font-black font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(tr.completedSessions * tr.sessionRate, gym.currency)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block">{t.trainers.outstanding}</span>
                      <span className="font-black font-mono text-amber-600 dark:text-amber-400">
                        {formatCurrency(tr.outstandingCompensation, gym.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Record Payout & Reset Password */}
                  <div className="pt-2 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const user = gymStore.users.find(u => u.entityId === tr.id);
                        if (user) {
                          setShowResetPasswordModal(user.id);
                          setNewPasswordInput('123');
                        } else {
                          setToast({ message: lang === 'fa' ? 'حساب کاربری مربی یافت نشد.' : 'User account not found.', type: 'error' });
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-indigo-600"
                    >
                      <KeyRound className="w-3.5 h-3.5 me-1" />
                      {lang === 'fa' ? 'ریست کلمه عبور' : 'Reset Password'}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowPayoutModal(tr.id);
                        setPayoutAmount(tr.outstandingCompensation > 0 ? tr.outstandingCompensation : 1000000);
                      }}
                      className="font-bold text-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5 me-1" />
                      {t.trainers.recordPayout}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SCHEDULE & PERSIAN CALENDAR TAB */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (() => {
        const gymCapOnDate = gymStore.getGymDailyCapacity(selectedScheduleDate);
        const dateSessions = gymStore.getSessionsForDate(selectedScheduleDate);
        const parsedDate = parseJalali(selectedScheduleDate);
        const humanDate = parsedDate ? formatJalaliHuman(parsedDate) : selectedScheduleDate;

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
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'تقویم عملیاتی و برنامه‌ریزی باشگاه' : 'Operations Calendar & Schedule'}
                </h1>
                <p className="text-xs text-slate-500">
                  {lang === 'fa'
                    ? 'مشاهده وضعیت نوبت‌ها بر اساس تقویم شمسی و تعیین ظرفیت باشگاه و مربیان برای هر روز.'
                    : 'Schedule and capacity management per date on the Persian calendar.'}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setNewSessionDate(selectedScheduleDate);
                  setShowAddSession(true);
                }}
                className="font-bold shadow-md shadow-teal-500/20"
              >
                <Plus className="w-4 h-4 me-1.5" />
                {t.schedule.addSessionBtn}
              </Button>
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
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-teal-600" />
                      {lang === 'fa' ? 'ظرفیت کل باشگاه در این تاریخ:' : 'Gym Capacity on Date:'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomGymCapInput(gymCapOnDate);
                        setEditingGymCap(!editingGymCap);
                      }}
                      className="text-xs text-teal-600"
                    >
                      {editingGymCap ? (lang === 'fa' ? 'بستن' : 'Close') : (lang === 'fa' ? 'تغییر ظرفیت' : 'Change')}
                    </Button>
                  </div>

                  {editingGymCap ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                      <label className="text-[11px] font-bold text-slate-500 block">
                        {lang === 'fa' ? `ظرفیت کل باشگاه برای تاریخ ${selectedScheduleDate}:` : `Gym capacity for ${selectedScheduleDate}:`}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={customGymCapInput}
                          onChange={e => setCustomGymCapInput(Number(e.target.value))}
                          className="w-24 p-2 text-center rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            gymStore.setGymDailyCapacity(selectedScheduleDate, customGymCapInput);
                            setEditingGymCap(false);
                            setToast({ message: lang === 'fa' ? 'ظرفیت روزانه باشگاه به‌روزرسانی شد.' : 'Gym capacity updated.', type: 'success' });
                          }}
                        >
                          <Check className="w-3.5 h-3.5 me-1" />
                          {lang === 'fa' ? 'ذخیره' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{lang === 'fa' ? 'سقف پذیرش کل روز:' : 'Total day limit:'}</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {gymCapOnDate} {lang === 'fa' ? 'ورزشکار' : 'members'}
                      </span>
                    </div>
                  )}

                  {/* Trainers Capacity Breakdown on Date */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {lang === 'fa' ? 'ظرفیت مربیان در این تاریخ:' : 'Trainers Capacity on Date:'}
                    </span>
                    {trainers.map(tr => {
                      const trCap = gymStore.getTrainerDailyCapacity(selectedScheduleDate, tr.id);
                      const trSessions = dateSessions.filter(s => s.trainerId === tr.id);
                      const isEditing = editingTrainerCapId === tr.id;

                      return (
                        <div key={tr.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">{tr.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingTrainerCapId(null);
                                } else {
                                  setEditingTrainerCapId(tr.id);
                                  setCustomTrainerCapInput(trCap);
                                }
                              }}
                              className="text-[10px] text-teal-600 h-6 px-1.5"
                            >
                              {isEditing ? (lang === 'fa' ? 'انصراف' : 'Cancel') : (lang === 'fa' ? 'تنظیم ظرفیت' : 'Edit')}
                            </Button>
                          </div>

                          {isEditing ? (
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={customTrainerCapInput}
                                onChange={e => setCustomTrainerCapInput(Number(e.target.value))}
                                className="w-16 p-1 text-center rounded bg-white dark:bg-slate-900 border text-xs font-bold"
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  gymStore.setTrainerDailyCapacity(selectedScheduleDate, tr.id, customTrainerCapInput);
                                  setEditingTrainerCapId(null);
                                  setToast({ message: lang === 'fa' ? 'ظرفیت مربی ثبت شد.' : 'Trainer capacity saved.', type: 'success' });
                                }}
                                className="h-7 text-[10px]"
                              >
                                {lang === 'fa' ? 'تأیید' : 'OK'}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                              <span>{trSessions.length} / {trCap} {lang === 'fa' ? 'شاگرد' : 'members'}</span>
                              <span className={trSessions.length >= trCap ? 'text-rose-500 font-bold' : 'text-teal-600 font-bold'}>
                                {Math.round((trSessions.length / Math.max(1, trCap)) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Right 2 Columns: Date Schedule Sessions */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">{humanDate}</h2>
                    <span className="text-xs text-teal-600 font-mono font-bold">{selectedScheduleDate}</span>
                  </div>
                  <Badge variant="primary" size="md" className="font-mono">
                    {dateSessions.length} {lang === 'fa' ? 'نوبت در این تاریخ' : 'Sessions'}
                  </Badge>
                </div>

                <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {dateSessions.length === 0 ? (
                    <EmptyState
                      title={lang === 'fa' ? `هیچ نوبتی برای تاریخ ${selectedScheduleDate} ثبت نشده است` : `No sessions for ${selectedScheduleDate}`}
                      description={lang === 'fa' ? 'می‌توانید برای این تاریخ نوبت جدید ایجاد کنید.' : 'Schedule a new session for this date.'}
                      actionLabel={t.schedule.addSessionBtn}
                      onAction={() => {
                        setNewSessionDate(selectedScheduleDate);
                        setShowAddSession(true);
                      }}
                    />
                  ) : (
                    dateSessions.map(sess => (
                      <div key={sess.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono font-bold text-xs">
                            {sess.time}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900 dark:text-white">{sess.memberName}</span>
                              <Badge
                                variant={
                                  sess.status === 'completed'
                                    ? 'success'
                                    : sess.status === 'in_progress'
                                    ? 'primary'
                                    : sess.status === 'cancelled'
                                    ? 'danger'
                                    : 'neutral'
                                }
                                size="sm"
                              >
                                {sess.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {lang === 'fa' ? 'مربی:' : 'Trainer:'} <span className="font-bold text-teal-600">{sess.trainerName}</span>
                            </div>
                          </div>
                        </div>

                        {sess.status !== 'completed' && sess.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              gymStore.cancelSession(sess.id);
                              setToast({ message: lang === 'fa' ? 'نوبت لغو شد.' : 'Session cancelled.', type: 'info' });
                            }}
                            className="text-xs text-rose-500 hover:bg-rose-500/10"
                          >
                            {lang === 'fa' ? 'لغو' : 'Cancel'}
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </Card>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 5. EXERCISE CATALOG TAB */}
      {/* ========================================================================= */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {lang === 'fa' ? 'بانک حرکات و تنظیمات FMS باشگاه' : 'Exercise Catalog & FMS Movement'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'fa'
                  ? 'مدیریت کامل حرکات اصلاحی، الگوهای حرکتی Functional Movement، موبیلیتی و تصاویر متحرک.'
                  : 'Manage corrective movement patterns, body positions, and exercise media.'}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingExercise(null);
                setShowExerciseEditor(true);
              }}
              className="font-bold shadow-md shadow-teal-500/20"
            >
              <Plus className="w-4 h-4 me-1.5" />
              {lang === 'fa' ? 'تعریف حرکت جدید' : 'Add Exercise'}
            </Button>
          </div>

          {/* Search & Filters */}
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={exerciseSearchQuery}
                  onChange={e => setExerciseSearchQuery(e.target.value)}
                  placeholder={lang === 'fa' ? 'جستجوی نام حرکت فارسی یا انگلیسی...' : 'Search exercises...'}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <select
                  value={filterBodyPart}
                  onChange={e => setFilterBodyPart(e.target.value)}
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

              <div>
                <select
                  value={filterFmsPattern}
                  onChange={e => setFilterFmsPattern(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
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
                <strong className="text-slate-900 dark:text-white font-mono">{filteredExercises.length}</strong> از{' '}
                {gymStore.exercises.length}
              </span>
              {(exerciseSearchQuery || filterBodyPart !== 'all' || filterFmsPattern !== 'all') && (
                <button
                  onClick={() => {
                    setExerciseSearchQuery('');
                    setFilterBodyPart('all');
                    setFilterFmsPattern('all');
                  }}
                  className="text-teal-600 font-bold hover:underline cursor-pointer"
                >
                  {lang === 'fa' ? 'پاک کردن فیلترها' : 'Clear Filters'}
                </button>
              )}
            </div>
          </Card>

          {/* Exercise Grid using ExerciseCard */}
          {filteredExercises.length === 0 ? (
            <EmptyState
              title={lang === 'fa' ? 'هیچ حرکتی یافت نشد' : 'No exercises found'}
              description={lang === 'fa' ? 'لطفاً عبارت جستجو را تغییر دهید یا حرکت جدید ثبت کنید.' : 'Try adjusting filters or add a new exercise.'}
              actionLabel={lang === 'fa' ? 'تعریف حرکت جدید' : 'Add Exercise'}
              onAction={() => {
                setEditingExercise(null);
                setShowExerciseEditor(true);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExercises.map(item => (
                <ExerciseCard
                  key={item.id}
                  exercise={item}
                  lang={lang}
                  onEdit={ex => {
                    setEditingExercise(ex);
                    setShowExerciseEditor(true);
                  }}
                  onDelete={ex => handleDeleteExercise(ex)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. COMPLETE FINANCE TAB (All 4 Ledgers + Audit Log) */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{t.finance.title}</h1>
              <p className="text-xs text-slate-500">{t.finance.subtitle}</p>
            </div>
          </div>

          {/* 4 Financial High-Level Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverElevation className="p-5">
              <span className="text-xs font-bold text-slate-500">{t.finance.totalCollected}</span>
              <div className="mt-2 text-2xl font-black font-mono text-emerald-600">
                {formatCurrency(totalRevenueCollected, gym.currency)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {gymStore.memberPayments.length} {lang === 'fa' ? 'تراکنش دریافتی' : 'receipts'}
              </span>
            </Card>

            <Card hoverElevation className="p-5">
              <span className="text-xs font-bold text-slate-500">{t.finance.totalOutstanding}</span>
              <div className="mt-2 text-2xl font-black font-mono text-rose-500">
                {formatCurrency(totalOutstandingReceivable, gym.currency)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {lang === 'fa' ? 'مانده طلب از اعضا' : 'receivables from members'}
              </span>
            </Card>

            <Card hoverElevation className="p-5">
              <span className="text-xs font-bold text-slate-500">{t.finance.trainerCompensationTotal}</span>
              <div className="mt-2 text-2xl font-black font-mono text-sky-600">
                {formatCurrency(totalTrainerPayouts, gym.currency)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {gymStore.trainerPayouts.length} {lang === 'fa' ? 'تسویه واریزی' : 'payouts'}
              </span>
            </Card>

            <Card hoverElevation className="p-5">
              <span className="text-xs font-bold text-slate-500">{t.finance.trainerOutstandingTotal}</span>
              <div className="mt-2 text-2xl font-black font-mono text-amber-500">
                {formatCurrency(totalTrainerOutstanding, gym.currency)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {lang === 'fa' ? 'طلب تسویه‌نشده مربیان' : 'trainer liabilities'}
              </span>
            </Card>
          </div>

          {/* Ledger 1: Member Payments & Ledger 2: Trainer Payouts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Payments Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{t.finance.memberPayments}</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {gymStore.memberPayments.length} {lang === 'fa' ? 'واریز' : 'items'}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto text-xs">
                {gymStore.memberPayments.map(p => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white block">{p.memberName}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{p.description} • {p.date}</span>
                    </div>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      +{formatCurrency(p.amount, gym.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Trainer Payouts Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  <span>{lang === 'fa' ? 'تسویه دستمزد مربیان' : 'Trainer Payouts'}</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {gymStore.trainerPayouts.length} {lang === 'fa' ? 'تسویه' : 'items'}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto text-xs">
                {gymStore.trainerPayouts.map(tp => (
                  <div key={tp.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white block">{tp.trainerName}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{tp.description} • {tp.date}</span>
                    </div>
                    <span className="font-mono font-black text-sky-600 text-sm">
                      -{formatCurrency(tp.amount, gym.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Ledger 3: Session Adjustments Ledger & Ledger 4: System Audit Log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Adjustments Ledger */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-teal-600" />
                  <span>{lang === 'fa' ? 'دفتر اصلاحات اعتبار و جلسات' : 'Session Adjustments Ledger'}</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {gymStore.sessionAdjustments.length} {lang === 'fa' ? 'مورد' : 'logs'}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto text-xs">
                {gymStore.sessionAdjustments.map(adj => (
                  <div key={adj.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white block">{adj.memberName}</span>
                      <span className="text-slate-400 text-[11px]">{adj.reason} • {adj.date}</span>
                    </div>
                    <Badge variant={adj.delta > 0 ? 'success' : 'danger'} size="sm" className="font-mono font-black">
                      {adj.delta > 0 ? `+${adj.delta}` : adj.delta} {lang === 'fa' ? 'جلسه' : 'sess'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Audit Log */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'fa' ? 'لاگ رویدادها و حسابرسی سیستم' : 'System Audit Logs'}</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {gymStore.auditLogs.length} {lang === 'fa' ? 'رویداد' : 'events'}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto text-xs">
                {gymStore.auditLogs.map(log => (
                  <div key={log.id} className="p-3 space-y-1 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[11px] text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{log.details}</p>
                    <span className="text-[10px] text-teal-600 block">{log.user}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. REPORTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{t.reports.title}</h1>
            <p className="text-xs text-slate-500">{t.reports.subtitle}</p>
          </div>

          <Card className="p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {t.reports.dailyOpsTitle}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-slate-400 block">{t.dashboard.gymCapacity}</span>
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {todaySessions.length} / {todayCap}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-slate-400 block">{t.schedule.completed}</span>
                <span className="text-xl font-black font-mono text-emerald-600 mt-1 block">
                  {completedTodayCount}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-slate-400 block">{t.schedule.inProgress}</span>
                <span className="text-xl font-black font-mono text-sky-600 mt-1 block">
                  {todaySessions.filter(s => s.status === 'in_progress').length}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-slate-400 block">{t.dashboard.activeTrainers}</span>
                <span className="text-xl font-black font-mono text-indigo-600 mt-1 block">
                  {trainers.length}
                </span>
              </div>
            </div>
          </Card>

          {/* Daily Exercise Report: Who did what with whom today */}
          <Card className="p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {t.reports.dailyExerciseTitle}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {todaySessions.map(sess => (
                <div key={sess.id} className="py-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-black text-slate-900 dark:text-white text-sm">{sess.memberName}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-teal-600 font-bold">{sess.trainerName}</span>
                    </div>
                    <Badge
                      variant={sess.status === 'completed' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {sess.status}
                    </Badge>
                  </div>
                  {sess.exercises.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sess.exercises.map(ex => (
                        <div key={ex.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs border border-slate-200/50 dark:border-slate-800">
                          <span className="font-black text-slate-900 dark:text-white block">{ex.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {ex.sets} × {ex.reps} {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic block">
                      {lang === 'fa' ? 'هنوز حرکتی برای این جلسه ثبت نشده است.' : 'No exercises logged for this session yet.'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SETTINGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <Card className="p-6 space-y-6 max-w-2xl">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">{t.nav.owner.settings}</h1>
          <div className="space-y-4">
            <Input
              id="gym-name"
              label={lang === 'fa' ? 'نام باشگاه' : 'Gym Name'}
              defaultValue={gym.name}
              onChange={e => {
                gym.name = e.target.value;
                gymStore.notify();
              }}
            />
            <Input
              id="gym-capacity"
              type="number"
              label={lang === 'fa' ? 'سقف ظرفیت روزانه پیش‌فرض باشگاه (نفر)' : 'Default Gym Daily Capacity'}
              defaultValue={gym.capacity.toString()}
              onChange={e => {
                gym.capacity = Math.max(1, Number(e.target.value) || 1);
                gymStore.notify();
              }}
            />
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MEMBER (F17: with login account password) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title={t.members.addMemberBtn}
        description={lang === 'fa' ? 'ثبت اطلاعات ورزشکار و ایجاد خودکار حساب کاربری جهت ورود به پورتال' : 'Add member and provision login credentials'}
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <Input
            id="new-member-name"
            label={t.members.name}
            value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
            placeholder="e.g. رضا کمالی"
            required
          />

          <Input
            id="new-member-phone"
            label={t.members.phone}
            value={newMemberPhone}
            onChange={e => setNewMemberPhone(e.target.value)}
            placeholder="0912..."
            required
          />

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {t.members.trainer}
            </label>
            <select
              value={newMemberTrainer}
              onChange={e => setNewMemberTrainer(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              {trainers.map(tr => (
                <option key={tr.id} value={tr.id}>
                  {tr.name} ({tr.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="new-member-sessions"
              type="number"
              label={lang === 'fa' ? 'تعداد جلسات بسته' : 'Sessions'}
              value={newMemberSessions.toString()}
              onChange={e => setNewMemberSessions(Number(e.target.value))}
            />
            <Input
              id="new-member-price"
              type="number"
              label={lang === 'fa' ? 'قیمت بسته (تومان)' : 'Price'}
              value={newMemberPrice.toString()}
              onChange={e => setNewMemberPrice(Number(e.target.value))}
            />
          </div>

          <Input
            id="new-member-paid"
            type="number"
            label={lang === 'fa' ? 'پیش‌پرداخت اولیه (تومان)' : 'Paid Amount'}
            value={newMemberPaid.toString()}
            onChange={e => setNewMemberPaid(Number(e.target.value))}
          />

          <Input
            id="new-member-password"
            label={lang === 'fa' ? 'کلمه عبور ورود به سامانه' : 'Login Password'}
            value={newMemberPassword}
            onChange={e => setNewMemberPassword(e.target.value)}
            showPasswordToggle
            helperText={lang === 'fa' ? 'نام کاربری این شخص شماره تلفن او خواهد بود.' : 'Username will be the phone number.'}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowAddMember(false)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit">
              {lang === 'fa' ? 'ثبت و ایجاد حساب' : 'Save & Provision'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD TRAINER (F1 & F17) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showAddTrainer}
        onClose={() => setShowAddTrainer(false)}
        title={lang === 'fa' ? 'افزودن مربی جدید' : 'Add New Trainer'}
        description={lang === 'fa' ? 'ثبت مربی در کادر فنی و ایجاد دسترسی ورود به سیستم' : 'Provision trainer credentials and schedule capacity'}
      >
        <form onSubmit={handleCreateTrainer} className="space-y-4">
          <Input
            id="new-trainer-name"
            label={lang === 'fa' ? 'نام مربی' : 'Trainer Name'}
            value={newTrainerName}
            onChange={e => setNewTrainerName(e.target.value)}
            placeholder="e.g. محمد رادمنش"
            required
          />

          <Input
            id="new-trainer-phone"
            label={lang === 'fa' ? 'شماره تماس' : 'Phone'}
            value={newTrainerPhone}
            onChange={e => setNewTrainerPhone(e.target.value)}
            placeholder="0912..."
            required
          />

          <Input
            id="new-trainer-spec"
            label={lang === 'fa' ? 'تخصص و گرایش' : 'Specialty'}
            value={newTrainerSpecialty}
            onChange={e => setNewTrainerSpecialty(e.target.value)}
            placeholder="e.g. کراس‌فیت و توانبخشی حرکتی"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="new-trainer-cap"
              type="number"
              label={lang === 'fa' ? 'ظرفیت روزانه (شاگرد)' : 'Daily Capacity'}
              value={newTrainerCapacity.toString()}
              onChange={e => setNewTrainerCapacity(Number(e.target.value))}
            />
            <Input
              id="new-trainer-rate"
              type="number"
              label={lang === 'fa' ? 'دستمزد هر جلسه (تومان)' : 'Session Rate'}
              value={newTrainerRate.toString()}
              onChange={e => setNewTrainerRate(Number(e.target.value))}
            />
          </div>

          <Input
            id="new-trainer-hours"
            label={lang === 'fa' ? 'ساعات کاری' : 'Working Hours'}
            value={newTrainerHours}
            onChange={e => setNewTrainerHours(e.target.value)}
            placeholder="08:00 - 16:00"
          />

          <Input
            id="new-trainer-password"
            label={lang === 'fa' ? 'کلمه عبور ورود' : 'Login Password'}
            value={newTrainerPassword}
            onChange={e => setNewTrainerPassword(e.target.value)}
            showPasswordToggle
            helperText={lang === 'fa' ? 'مربی با شماره تلفن و این رمز می‌تواند وارد شود.' : 'Trainer can log in using phone and this password.'}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowAddTrainer(false)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit">
              {lang === 'fa' ? 'ثبت مربی' : 'Save Trainer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD SESSION (F1) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showAddSession}
        onClose={() => setShowAddSession(false)}
        title={t.schedule.addSessionBtn}
        description={lang === 'fa' ? 'ثبت نوبت تمرینی برای ورزشکار در تاریخ مورد نظر' : 'Schedule training session for member'}
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'fa' ? 'انتخاب ورزشکار' : 'Select Member'}
            </label>
            <select
              value={newSessionMemberId}
              onChange={e => {
                setNewSessionMemberId(e.target.value);
                const mem = members.find(m => m.id === e.target.value);
                if (mem) setNewSessionTrainerId(mem.defaultTrainerId);
              }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.remainingSessions} جلسه مانده)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'fa' ? 'انتخاب مربی' : 'Select Trainer'}
            </label>
            <select
              value={newSessionTrainerId}
              onChange={e => setNewSessionTrainerId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              {trainers.map(tr => (
                <option key={tr.id} value={tr.id}>
                  {tr.name} ({tr.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="new-session-date"
              label={lang === 'fa' ? 'تاریخ نوبت (شمسی)' : 'Date'}
              value={newSessionDate}
              onChange={e => setNewSessionDate(e.target.value)}
              placeholder="1403/07/15"
              required
            />
            <Input
              id="new-session-time"
              label={lang === 'fa' ? 'ساعت نوبت' : 'Time'}
              value={newSessionTime}
              onChange={e => setNewSessionTime(e.target.value)}
              placeholder="11:00"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowAddSession(false)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit">
              {lang === 'fa' ? 'ثبت نوبت' : 'Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RECORD PAYMENT (F12: validated > 0) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(showPaymentModal)}
        onClose={() => setShowPaymentModal(null)}
        title={t.members.recordPayment}
        description={lang === 'fa' ? 'ثبت دریافت شهریه از ورزشکار و به‌روزرسانی مانده بدهی' : 'Record payment receipt'}
      >
        <div className="space-y-4">
          <Input
            id="payment-amount"
            type="number"
            min="1000"
            label={lang === 'fa' ? 'مبلغ دریافتی (تومان)' : 'Amount'}
            value={paymentAmount.toString()}
            onChange={e => setPaymentAmount(Number(e.target.value))}
            required
          />

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'fa' ? 'روش پرداخت' : 'Payment Method'}
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="card">{lang === 'fa' ? 'کارتخوان / کارت به کارت' : 'Card / POS'}</option>
              <option value="cash">{lang === 'fa' ? 'نقدی' : 'Cash'}</option>
              <option value="transfer">{lang === 'fa' ? 'حواله بانکی پایا/ساتنا' : 'Bank Transfer'}</option>
            </select>
          </div>

          <Input
            id="payment-desc"
            label={lang === 'fa' ? 'توضیحات و بابت' : 'Description'}
            value={paymentDescription}
            onChange={e => setPaymentDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowPaymentModal(null)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={() => showPaymentModal && handleRecordPayment(showPaymentModal)}
            >
              {lang === 'fa' ? 'ثبت واریز' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RECORD TRAINER PAYOUT (F1) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(showPayoutModal)}
        onClose={() => setShowPayoutModal(null)}
        title={t.trainers.recordPayout}
        description={lang === 'fa' ? 'تسویه دستمزد مربی و کسر از مانده طلب او' : 'Record trainer compensation payout'}
      >
        <div className="space-y-4">
          <Input
            id="payout-amount"
            type="number"
            min="1000"
            label={lang === 'fa' ? 'مبلغ تسویه (تومان)' : 'Payout Amount'}
            value={payoutAmount.toString()}
            onChange={e => setPayoutAmount(Number(e.target.value))}
            required
          />

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'fa' ? 'روش تسویه' : 'Payout Method'}
            </label>
            <select
              value={payoutMethod}
              onChange={e => setPayoutMethod(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="transfer">{lang === 'fa' ? 'انتقال شبا / ساتنا' : 'Bank Transfer'}</option>
              <option value="card">{lang === 'fa' ? 'کارت به کارت' : 'Card Transfer'}</option>
              <option value="cash">{lang === 'fa' ? 'نقدی' : 'Cash'}</option>
            </select>
          </div>

          <Input
            id="payout-desc"
            label={lang === 'fa' ? 'شرح تسویه' : 'Description'}
            value={payoutDescription}
            onChange={e => setPayoutDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowPayoutModal(null)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={() => showPayoutModal && handleRecordPayout(showPayoutModal)}
            >
              {lang === 'fa' ? 'ثبت تسویه' : 'Confirm Payout'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADJUST SESSIONS (F4) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(showAdjustModal)}
        onClose={() => setShowAdjustModal(null)}
        title={t.members.adjustSessions}
        description={lang === 'fa' ? 'اصلاح دستی اعتبار جلسات عضو به همراه دلیل مستند' : 'Manually adjust session balance'}
      >
        <div className="space-y-4">
          <Input
            id="adjust-delta"
            type="number"
            label={lang === 'fa' ? 'تغییر مانده (مثلا ۱+ یا ۱-)' : 'Delta (+/-)'}
            value={adjustDelta.toString()}
            onChange={e => setAdjustDelta(Number(e.target.value))}
            required
          />

          <Input
            id="adjust-reason"
            label={lang === 'fa' ? 'دلیل اصلاح' : 'Reason'}
            value={adjustReason}
            onChange={e => setAdjustReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowAdjustModal(null)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={() => showAdjustModal && handleAdjustSessions(showAdjustModal)}
            >
              {lang === 'fa' ? 'اعمال اصلاح' : 'Apply'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: REASSIGN DAILY TRAINER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(showReassignModal)}
        onClose={() => setShowReassignModal(null)}
        title={t.schedule.reassignTrainer}
        description={lang === 'fa' ? 'این جابجایی صرفاً برای امروز اعمال می‌شود و مربی دائم تغییر نمی‌کند.' : 'Applies to today session only.'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'fa' ? 'انتخاب مربی جایگزین امروز' : 'Select Today Trainer'}
            </label>
            <select
              value={newDailyTrainer}
              onChange={e => setNewDailyTrainer(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              {trainers.map(tr => (
                <option key={tr.id} value={tr.id}>
                  {tr.name} ({tr.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowReassignModal(null)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={() => showReassignModal && handleDailyReassign(showReassignModal)}
            >
              {lang === 'fa' ? 'ثبت جابجایی' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD (F18) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(showResetPasswordModal)}
        onClose={() => setShowResetPasswordModal(null)}
        title={lang === 'fa' ? 'تغییر کلمه عبور کاربر' : 'Reset User Password'}
        description={lang === 'fa' ? 'مدیر می‌تواند رمز جدید را مستقیماً تعیین نماید.' : 'Admin can reset password without old password'}
      >
        <div className="space-y-4">
          <Input
            id="new-password"
            label={lang === 'fa' ? 'کلمه عبور جدید' : 'New Password'}
            value={newPasswordInput}
            onChange={e => setNewPasswordInput(e.target.value)}
            showPasswordToggle
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowResetPasswordModal(null)}>
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (showResetPasswordModal && newPasswordInput.trim()) {
                  gymStore.resetPassword(showResetPasswordModal, newPasswordInput.trim());
                  setShowResetPasswordModal(null);
                  setToast({ message: lang === 'fa' ? 'کلمه عبور با موفقیت به‌روزرسانی شد.' : 'Password reset successfully.', type: 'success' });
                }
              }}
            >
              {lang === 'fa' ? 'ذخیره کلمه عبور' : 'Save Password'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: MEMBER PROFILE DETAIL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedMemberDetail)}
        onClose={() => setSelectedMemberDetail(null)}
        title={selectedMemberDetail ? selectedMemberDetail.name : ''}
        description={selectedMemberDetail ? `${selectedMemberDetail.phone} • ${selectedMemberDetail.packageName}` : ''}
      >
        {selectedMemberDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div>
                <span className="text-slate-400 block">{lang === 'fa' ? 'مربی دائم:' : 'Trainer:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMemberDetail.defaultTrainerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{lang === 'fa' ? 'تاریخ ثبت‌نام:' : 'Registered:'}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedMemberDetail.registrationDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{lang === 'fa' ? 'مانده جلسات:' : 'Remaining:'}</span>
                <span className="font-mono font-bold text-teal-600">{selectedMemberDetail.remainingSessions} / {selectedMemberDetail.totalSessions}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{lang === 'fa' ? 'مانده بدهی:' : 'Due Balance:'}</span>
                <span className="font-mono font-bold text-rose-500">
                  {formatCurrency(selectedMemberDetail.outstandingBalance, gym.currency)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedMemberDetail(null)}>
                {lang === 'fa' ? 'بستن' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* SHARED EXERCISE EDITOR MODAL (F35) */}
      {/* ========================================================================= */}
      <ExerciseEditorModal
        isOpen={showExerciseEditor}
        onClose={() => {
          setShowExerciseEditor(false);
          setEditingExercise(null);
        }}
        onSave={handleSaveExercise}
        editingExercise={editingExercise}
        lang={lang}
      />
    </div>
  );
};
