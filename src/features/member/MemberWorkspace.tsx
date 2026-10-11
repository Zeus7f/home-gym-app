import React, { useState, useEffect } from 'react';
import { mockStore, DailySession } from '../../lib/supabase/mockStore';
import { translations, Language } from '../../lib/i18n';
import { PersianCalendar } from '../../components/calendar/PersianCalendar';
import { getTodayJalaliString, parseJalali, formatJalaliHuman } from '../../lib/date/jalali';
import {
  User,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  CreditCard,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronRight,
  Eye,
  Filter,
  Layers,
  X,
  Phone
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatNumber } from '../../lib/format';
import { cn } from '../../lib/utils';

interface MemberWorkspaceProps {
  lang?: Language;
  onOpenAiCoach?: () => void;
}

export const MemberWorkspace: React.FC<MemberWorkspaceProps> = ({ lang = 'fa' }) => {
  const [, setTick] = useState(0);

  // If logged in as member, strictly lock to current member's entity ID (data privacy)
  const isMemberUser = mockStore.currentUser?.role === 'member';
  const loggedMemberId = (mockStore.currentUser?.entityId as string) || 'm-reza';

  const [selectedMemberId, setSelectedMemberId] = useState<string>(loggedMemberId);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayJalaliString());

  useEffect(() => {
    const unsub = mockStore.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  useEffect(() => {
    if (isMemberUser) {
      setSelectedMemberId(loggedMemberId);
    }
  }, [isMemberUser, loggedMemberId]);

  const member = mockStore.members.find(m => m.id === selectedMemberId) || mockStore.members[0];

  // Session for selected date on Persian calendar
  const dateSession = mockStore.getSessionsForDate(selectedDate, undefined, member.id)[0];

  // Past completed sessions for this member
  const pastSessions = mockStore.pastSessions.filter(s => s.memberId === member.id);

  const [historyFilter, setHistoryFilter] = useState<'all' | 'month' | 'week'>('all');
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<DailySession | null>(null);

  const todayStr = getTodayJalaliString();
  const todayJ = parseJalali(todayStr);

  const filteredPastSessions = pastSessions.filter(s => {
    if (historyFilter === 'all') return true;
    const sJ = parseJalali(s.date);
    if (!sJ || !todayJ) return true;

    if (historyFilter === 'month') {
      return sJ.jy === todayJ.jy && sJ.jm === todayJ.jm;
    }

    if (historyFilter === 'week') {
      if (sJ.jy !== todayJ.jy || sJ.jm !== todayJ.jm) return false;
      const dayDiff = todayJ.jd - sJ.jd;
      return dayDiff >= 0 && dayDiff <= 7;
    }

    return true;
  });

  const totalFilteredExercises = filteredPastSessions.reduce((acc, s) => acc + s.exercises.length, 0);
  const totalFilteredSets = filteredPastSessions.reduce(
    (acc, s) => acc + s.exercises.reduce((exAcc, ex) => exAcc + ex.sets, 0),
    0
  );

  // Collect dates that have workouts for this member
  const sessionCountsForCalendar: Record<string, number> = {};
  const highlightedDates: string[] = [];

  mockStore.todaySessions
    .filter(s => s.memberId === member.id)
    .forEach(s => {
      const d = s.date === 'Today' ? getTodayJalaliString() : s.date;
      sessionCountsForCalendar[d] = (sessionCountsForCalendar[d] || 0) + 1;
      if (!highlightedDates.includes(d)) highlightedDates.push(d);
    });

  // Progress percentage of package
  const usedPercent = Math.min(100, Math.round((member.usedSessions / Math.max(1, member.totalSessions)) * 100));

  const parsedDate = parseJalali(selectedDate);
  const humanDate = parsedDate ? formatJalaliHuman(parsedDate) : selectedDate;

  return (
    <div className="space-y-6">
      {/* Top Bar: Member Info & Identity */}
      <Card hoverElevation className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-xl shadow-inner border border-teal-500/20">
              <User className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {member.name}
                </h1>
                <Badge
                  variant={member.status === 'active' ? 'success' : 'danger'}
                  size="sm"
                >
                  {member.status === 'active' ? (lang === 'fa' ? 'عضو فعال' : 'Active Member') : member.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'fa' ? 'مربی اختصاصی:' : 'Assigned Trainer:'}{' '}
                <strong className="text-teal-600 font-bold">{member.defaultTrainerName}</strong> • {member.phone}
              </p>
            </div>
          </div>

          {/* Member Switcher (Only if Admin is inspecting) */}
          {!isMemberUser && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
              {mockStore.members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                    selectedMemberId === m.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Hero Grid: Sessions Balance & Financial Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Remaining Sessions Hero (Spans 2 cols) */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-linear-to-br from-teal-900 via-teal-800 to-slate-900 text-white border border-teal-500/30 shadow-xl flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                {lang === 'fa' ? 'اعتبار جلسات بسته ورزشی' : 'Package Session Balance'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10">
                {member.packageName}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-6xl sm:text-7xl font-black tracking-tight font-mono">
                {member.remainingSessions}
              </span>
              <div className="text-sm">
                <span className="font-bold block text-teal-100">
                  {lang === 'fa' ? 'جلسه باقیمانده' : 'Sessions Remaining'}
                </span>
                <span className="text-xs text-teal-200/80">
                  {lang === 'fa'
                    ? `از مجموع ${member.totalSessions} جلسه بسته (${member.usedSessions} جلسه استفاده شده)`
                    : `out of ${member.totalSessions} total (${member.usedSessions} used)`}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-teal-100">
                <span>{lang === 'fa' ? 'میزان مصرف بسته:' : 'Package usage:'} {usedPercent}%</span>
                <span>
                  {lang === 'fa' ? 'تاریخ پایان اعتبار:' : 'Valid until:'} {member.expirationDate}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950/60 p-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-400 transition-all duration-500"
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Business Guarantee Badge */}
          <div className="relative z-10 mt-6 pt-4 border-t border-teal-500/30 text-xs text-teal-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal-300" />
            <span>
              {lang === 'fa'
                ? 'قانون شفافیت: جلسات تنها پس از حضور قطعی و تکمیل تمرین توسط مربی کسر می‌شوند. لغو نوبت بدون کسر جلسه است.'
                : 'Guarantee: Sessions are deducted ONLY upon completed workouts. Cancellations incur zero deduction.'}
            </span>
          </div>

          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Financial Status Card */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {lang === 'fa' ? 'وضعیت مالی عضو' : 'Financial Status'}
              </span>
              <CreditCard className="w-4 h-4 text-teal-500" />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{lang === 'fa' ? 'شهریه بسته:' : 'Package Price:'}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(member.packagePrice, mockStore.gym.currency)}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{lang === 'fa' ? 'مبلغ پرداخت‌شده:' : 'Paid Amount:'}</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatCurrency(member.paidAmount, mockStore.gym.currency)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'fa' ? 'مانده بدهی:' : 'Outstanding:'}
                </span>
                <span
                  className={cn(
                    'text-base font-black font-mono',
                    member.outstandingBalance > 0 ? 'text-rose-500' : 'text-emerald-600'
                  )}
                >
                  {formatCurrency(member.outstandingBalance, mockStore.gym.currency)}
                </span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'p-3 rounded-xl text-xs font-bold text-center',
              member.outstandingBalance > 0
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
            )}
          >
            {member.outstandingBalance > 0
              ? (lang === 'fa' ? 'دارای بدهی شهریه' : 'Payment Balance Due')
              : (lang === 'fa' ? 'تسویه کامل مالی' : 'Fully Paid')}
          </div>
        </Card>
      </div>

      {/* PERSIAN CALENDAR & DAILY WORKOUT SCHEDULE WITH ANIMATED GIFS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Member Persian Calendar */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-teal-600" />
              {lang === 'fa' ? 'تقویم تمرینات ورزشی شما' : 'Your Workout Calendar'}
            </h3>
            <PersianCalendar
              selectedDate={selectedDate}
              onSelectDate={d => setSelectedDate(d)}
              sessionCounts={sessionCountsForCalendar}
              highlightedDates={highlightedDates}
            />
          </Card>
        </div>

        {/* Right 2 Columns: Workout Program on Selected Date with Animated GIFs */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-teal-600" />
                    <span>{humanDate}</span>
                  </h2>
                  <Badge variant="primary" size="sm" className="font-mono">
                    {selectedDate}
                  </Badge>
                  {dateSession && (
                    <Badge
                      variant={dateSession.status === 'completed' ? 'success' : 'primary'}
                      size="sm"
                    >
                      {dateSession.status === 'completed'
                        ? (lang === 'fa' ? 'جلسه تکمیل شد' : 'Completed')
                        : dateSession.status === 'in_progress'
                        ? (lang === 'fa' ? 'در حال برگزاری' : 'In Progress')
                        : (lang === 'fa' ? 'برنامه‌ریزی شده' : 'Scheduled')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {dateSession ? (
                    <>
                      {lang === 'fa' ? 'مربی این نوبت:' : 'Session Trainer:'}{' '}
                      <strong className="text-teal-600 font-bold">{dateSession.trainerName}</strong>
                      {dateSession.isDailyOverride && (
                        <span className="ms-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          {lang === 'fa' ? '(مربی جایگزین امروز)' : '(Substitute)'}
                        </span>
                      )}
                      {' • '}{lang === 'fa' ? 'ساعت:' : 'Time:'} {dateSession.time}
                    </>
                  ) : (
                    lang === 'fa' ? 'برای این تاریخ جلسه‌ای ثبت نشده است.' : 'No workout on this date.'
                  )}
                </p>
              </div>
            </div>

            {dateSession && dateSession.exercises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dateSession.exercises.map(ex => (
                  <div
                    key={ex.id}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden flex flex-col group hover:border-teal-500/60 transition"
                  >
                    {/* Animated GIF demonstration */}
                    {ex.gifUrl && (
                      <div className="h-44 bg-slate-950 relative overflow-hidden">
                        <img
                          src={ex.gifUrl}
                          alt={ex.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-2.5 start-2.5 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-black/70 backdrop-blur-md text-white">
                            {ex.bodyPart}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                            {ex.equipment}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                          {ex.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono font-bold text-[11px]">
                            {ex.sets} {lang === 'fa' ? 'ست' : 'sets'} × {ex.reps} {lang === 'fa' ? 'تکرار' : 'reps'}
                          </span>
                          {ex.weightKg && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-mono font-bold text-[11px]">
                              {ex.weightKg} kg
                            </span>
                          )}
                        </div>
                      </div>

                      {ex.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 leading-relaxed">
                          💡 {ex.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                {dateSession
                  ? (lang === 'fa' ? 'مربی هنوز حرکات این جلسه را ثبت نکرده است.' : 'No exercises logged for this session yet.')
                  : (lang === 'fa' ? 'در این تاریخ نوبت تمرینی برای شما ثبت نشده است.' : 'No scheduled workout for this date.')}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* PAST SESSIONS & ATTENDANCE LOG */}
      <Card className="p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-teal-500" />
              <span>{lang === 'fa' ? 'سوابق حضور و تمرینات تکمیل‌شده' : 'Past Attendance & Workout Logs'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'fa'
                ? 'مرور کامل جلسات برگزار شده، مشاهده گیف متحرک حرکات و بررسی ست‌ها و وزنه‌های ثبت‌شده'
                : 'Review completed workouts, inspect demonstration GIFs, sets, reps, and weights'}
            </p>
          </div>

          {/* Time Filter Buttons: All, This Month, This Week */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setHistoryFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                historyFilter === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {lang === 'fa' ? 'همه سوابق' : 'All'} ({pastSessions.length})
            </button>
            <button
              onClick={() => setHistoryFilter('month')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                historyFilter === 'month'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {lang === 'fa' ? 'این ماه' : 'This Month'}
            </button>
            <button
              onClick={() => setHistoryFilter('week')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                historyFilter === 'week'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {lang === 'fa' ? 'این هفته' : 'This Week'}
            </button>
          </div>
        </div>

        {/* Summary Stat Cards for Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">
                {lang === 'fa' ? 'جلسات در این بازه' : 'Sessions in Range'}
              </span>
              <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                {filteredPastSessions.length} {lang === 'fa' ? 'جلسه' : 'sessions'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">
                {lang === 'fa' ? 'کل حرکات انجام‌شده' : 'Total Exercises'}
              </span>
              <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                {totalFilteredExercises} {lang === 'fa' ? 'حرکت' : 'movements'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">
                {lang === 'fa' ? 'مجموع ست‌های ثبت‌شده' : 'Total Sets Executed'}
              </span>
              <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                {totalFilteredSets} {lang === 'fa' ? 'ست' : 'sets'}
              </span>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {filteredPastSessions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              {lang === 'fa'
                ? 'در بازه زمانی انتخاب‌شده جلسه‌ای یافت نشد.'
                : 'No past workouts found in the selected time range.'}
            </div>
          ) : (
            filteredPastSessions.map(s => (
              <div
                key={s.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-teal-500/50 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      {s.date}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">({s.time})</span>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      • {lang === 'fa' ? 'مربی:' : 'Trainer:'} {s.trainerName}
                    </span>
                    <Badge variant="success" size="sm">
                      {lang === 'fa' ? 'جلسه تکمیل شد' : 'Completed'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold">
                      -1 {lang === 'fa' ? 'جلسه از بسته' : 'Session'}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedSessionDetail(s)}
                      className="text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5 me-1" />
                      <span>{lang === 'fa' ? 'مشاهده جزئیات کامل' : 'View Details'}</span>
                    </Button>
                  </div>
                </div>

                {/* Exercise Pills Preview */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    {lang === 'fa' ? 'حرکات انجام‌شده:' : 'Exercises:'}
                  </span>
                  {s.exercises.map((ex, idx) => (
                    <span
                      key={ex.id || idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <span>{ex.name}</span>
                      <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                        ({ex.sets}×{ex.reps})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* MODAL: FULL WORKOUT DETAILS DRILLDOWN */}
      <Modal
        isOpen={Boolean(selectedSessionDetail)}
        onClose={() => setSelectedSessionDetail(null)}
        title={selectedSessionDetail ? `${lang === 'fa' ? 'جزئیات برنامه تمرینی' : 'Workout Details'} - ${selectedSessionDetail.date}` : ''}
        description={selectedSessionDetail ? `${lang === 'fa' ? 'مربی:' : 'Trainer:'} ${selectedSessionDetail.trainerName} • ${selectedSessionDetail.time}` : ''}
      >
        {selectedSessionDetail && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedSessionDetail.exercises.map(ex => (
                <div
                  key={ex.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/40"
                >
                  {ex.gifUrl && (
                    <div className="h-44 bg-slate-950">
                      <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3.5 space-y-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{ex.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm" className="font-mono">
                        {ex.sets} {lang === 'fa' ? 'ست' : 'sets'} × {ex.reps} {lang === 'fa' ? 'تکرار' : 'reps'}
                      </Badge>
                      {ex.weightKg && (
                        <Badge variant="neutral" size="sm" className="font-mono">
                          {ex.weightKg} kg
                        </Badge>
                      )}
                    </div>
                    {ex.notes && (
                      <p className="text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        💡 {ex.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedSessionDetail(null)}>
                {lang === 'fa' ? 'بستن' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
