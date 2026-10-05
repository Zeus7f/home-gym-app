import React, { useState, useEffect } from 'react';
import { mockStore } from '../../lib/supabase/mockStore';
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
  X
} from 'lucide-react';
import { DailySession } from '../../lib/domain/gymManagement';

interface MemberWorkspaceProps {
  lang?: Language;
  onOpenAiCoach?: () => void;
}

export function MemberWorkspace({ lang = 'fa' }: MemberWorkspaceProps) {
  const [, setTick] = useState(0);

  // If logged in as member, strictly lock to current member's entity ID (data privacy)
  const isMemberUser = mockStore.currentUser?.role === 'member';
  const loggedMemberId = (mockStore.currentUser?.entityId as string) || 'm-reza';

  const [selectedMemberId, setSelectedMemberId] = useState<string>(loggedMemberId);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayJalaliString());

  useEffect(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
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
  const usedPercent = Math.min(100, Math.round((member.usedSessions / member.totalSessions) * 100));

  const parsedDate = parseJalali(selectedDate);
  const humanDate = parsedDate ? formatJalaliHuman(parsedDate) : selectedDate;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar: Member Info & Identity */}
      <div className="bg-white dark:bg-[#11151A] rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-xl shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {member.name}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  member.status === 'active'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {member.status === 'active' ? (lang === 'fa' ? 'عضو فعال' : 'Active Member') : member.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'fa' ? 'مربی دائم:' : 'Default Trainer:'}{' '}
              <strong className="text-slate-700 dark:text-slate-200">{member.defaultTrainerName}</strong> • {member.phone}
            </p>
          </div>
        </div>

        {/* Member Switcher (Only if Admin is inspecting; locked if logged in as Member) */}
        {!isMemberUser && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            {mockStore.members.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedMemberId === m.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hero Grid: Sessions Balance & Financial Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Remaining Sessions Hero (Spans 2 cols) */}
        <div className="md:col-span-2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                {lang === 'fa' ? 'اعتبار جلسات بسته ورزشی' : 'Package Session Balance'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                {member.packageName}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-6xl sm:text-7xl font-black tracking-tight">
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
                <span>{lang === 'fa' ? 'میزان پیشرفت بسته:' : 'Package usage:'} {usedPercent}%</span>
                <span>
                  {lang === 'fa' ? 'اعتبار تا:' : 'Valid until:'} {member.expirationDate}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-teal-950/50 p-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-300 transition-all duration-500"
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Business Guarantee Badge */}
          <div className="relative z-10 mt-6 pt-4 border-t border-teal-500/40 text-xs text-teal-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal-300" />
            <span>
              {lang === 'fa'
                ? 'قانون شفافیت: جلسات تنها پس از حضور قطعی و پایان تمرین توسط مربی کسر می‌شوند. لغو نوبت بدون کسر جلسه است.'
                : 'Guarantee: Sessions are deducted ONLY upon completed workouts. Cancellations incur zero deduction.'}
            </span>
          </div>

          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Financial Status Card */}
        <div className="bg-white dark:bg-[#11151A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
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
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {member.packagePrice.toLocaleString()} {mockStore.gym.currency}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{lang === 'fa' ? 'مبلغ پرداخت‌شده:' : 'Paid Amount:'}</span>
                <span className="font-bold text-emerald-600">
                  {member.paidAmount.toLocaleString()} {mockStore.gym.currency}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'fa' ? 'مانده بدهی:' : 'Outstanding:'}
                </span>
                <span
                  className={`text-base font-extrabold ${
                    member.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {member.outstandingBalance.toLocaleString()} {mockStore.gym.currency}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl text-xs font-bold text-center ${
              member.outstandingBalance > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
            }`}
          >
            {member.outstandingBalance > 0
              ? lang === 'fa' ? 'دارای بدهی شهریه' : 'Payment Balance Due'
              : lang === 'fa' ? 'تسویه کامل مالی' : 'Fully Paid'}
          </div>
        </div>
      </div>

      {/* PERSIAN CALENDAR & DAILY WORKOUT SCHEDULE WITH ANIMATED GIFS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Member Persian Calendar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-teal-600" />
              {lang === 'fa' ? 'تقویم تمرینات ورزشی شما' : 'Your Workout Calendar'}
            </h3>
            <PersianCalendar
              selectedDate={selectedDate}
              onSelectDate={d => setSelectedDate(d)}
              sessionCounts={sessionCountsForCalendar}
              highlightedDates={highlightedDates}
            />
          </div>
        </div>

        {/* Right 2 Columns: Workout Program on Selected Date with Animated GIFs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-teal-600" />
                    <span>{humanDate}</span>
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    {selectedDate}
                  </span>
                  {dateSession && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dateSession.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : dateSession.status === 'in_progress'
                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {dateSession.status === 'completed'
                        ? lang === 'fa' ? 'جلسه تکمیل شد' : 'Completed'
                        : dateSession.status === 'in_progress'
                        ? lang === 'fa' ? 'در حال برگزاری' : 'In Progress'
                        : lang === 'fa' ? 'برنامه‌ریزی شده' : 'Scheduled'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {dateSession ? (
                    <>
                      {lang === 'fa' ? 'مربی این نوبت:' : 'Session Trainer:'}{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{dateSession.trainerName}</strong>
                      {dateSession.isDailyOverride && (
                        <span className="mr-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {lang === 'fa' ? '(مربی جایگزین این روز)' : '(Substitute)'}
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
                    className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group hover:border-teal-500 transition"
                  >
                    {/* Animated GIF demonstration */}
                    {ex.gifUrl && (
                      <div className="h-44 bg-slate-900 relative overflow-hidden">
                        <img
                          src={ex.gifUrl}
                          alt={ex.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-black/70 text-white backdrop-blur-xs">
                            {ex.bodyPart}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                            {ex.equipment}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-white">
                          {ex.name}
                        </h3>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                            {ex.sets} {lang === 'fa' ? 'ست' : 'sets'} × {ex.reps} {lang === 'fa' ? 'تکرار' : 'reps'}
                          </span>
                          {ex.weightKg && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {ex.weightKg} kg
                            </span>
                          )}
                        </div>

                        {ex.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                            💬 <span className="font-semibold">{lang === 'fa' ? 'دستور مربی:' : 'Trainer tip:'}</span> {ex.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                {dateSession
                  ? (lang === 'fa' ? 'مربی هنوز حرکات این تاریخ را مشخص نکرده است.' : 'Trainer has not added exercises yet.')
                  : (lang === 'fa' ? 'در این تاریخ برنامه ورزشی ندارید. روزهای دیگر را از تقویم انتخاب کنید.' : 'No session on this date.')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAST SESSIONS & ATTENDANCE LOG */}
      <div className="bg-white dark:bg-[#11151A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
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
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                historyFilter === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'fa' ? 'همه سوابق' : 'All'} ({pastSessions.length})
            </button>
            <button
              onClick={() => setHistoryFilter('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                historyFilter === 'month'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'fa' ? 'این ماه جاری' : 'This Month'} (
              {
                pastSessions.filter(s => {
                  const sj = parseJalali(s.date);
                  return sj && todayJ && sj.jy === todayJ.jy && sj.jm === todayJ.jm;
                }).length
              }
              )
            </button>
            <button
              onClick={() => setHistoryFilter('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                historyFilter === 'week'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'fa' ? 'این هفته' : 'This Week'} (
              {
                pastSessions.filter(s => {
                  const sj = parseJalali(s.date);
                  return (
                    sj &&
                    todayJ &&
                    sj.jy === todayJ.jy &&
                    sj.jm === todayJ.jm &&
                    todayJ.jd - sj.jd >= 0 &&
                    todayJ.jd - sj.jd <= 7
                  );
                }).length
              }
              )
            </button>
          </div>
        </div>

        {/* Summary Stat Cards for Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">
                {lang === 'fa' ? 'جلسات در این بازه' : 'Sessions in Range'}
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {filteredPastSessions.length} {lang === 'fa' ? 'جلسه' : 'sessions'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">
                {lang === 'fa' ? 'کل حرکات انجام‌شده' : 'Total Exercises'}
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {totalFilteredExercises} {lang === 'fa' ? 'حرکت' : 'movements'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">
                {lang === 'fa' ? 'مجموع ست‌های ثبت‌شده' : 'Total Sets Executed'}
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {totalFilteredSets} {lang === 'fa' ? 'ست' : 'sets'}
              </span>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {filteredPastSessions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              {lang === 'fa'
                ? 'در بازه زمانی انتخاب‌شده جلسه‌ای یافت نشد. می‌توانید بازه دیگری را انتخاب کنید.'
                : 'No past workouts found in the selected time range.'}
            </div>
          ) : (
            filteredPastSessions.map(s => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-teal-500/50 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      {s.date}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">({s.time})</span>
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                      • {lang === 'fa' ? 'مربی:' : 'Trainer:'} {s.trainerName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {lang === 'fa' ? 'جلسه تکمیل شد' : 'Completed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      -1 {lang === 'fa' ? 'جلسه از بسته' : 'Session'}
                    </span>
                    <button
                      onClick={() => setSelectedSessionDetail(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'fa' ? 'مشاهده جزئیات کامل تمرین' : 'View Full Details'}</span>
                    </button>
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
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <span>{ex.name}</span>
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                        ({ex.sets}×{ex.reps})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: FULL WORKOUT DETAILS DRILLDOWN */}
      {selectedSessionDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#11151A] rounded-2xl max-w-3xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-teal-600" />
                  <span>
                    {lang === 'fa'
                      ? `جزئیات کامل برنامه تمرینی - ${selectedSessionDetail.date}`
                      : `Workout Session Details - ${selectedSessionDetail.date}`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'fa' ? 'مربی مسئول:' : 'Trainer:'}{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{selectedSessionDetail.trainerName}</strong> •{' '}
                  {lang === 'fa' ? 'ساعت برگزاری:' : 'Time:'} {selectedSessionDetail.time}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionDetail(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Banner in Modal */}
            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-teal-800 dark:text-teal-300">
                ✅ {lang === 'fa' ? 'وضعیت: جلسه با موفقیت تکمیل شد' : 'Status: Completed'}
              </span>
              <div className="flex items-center gap-3 text-teal-700 dark:text-teal-400 font-semibold">
                <span>
                  {selectedSessionDetail.exercises.length} {lang === 'fa' ? 'حرکت اجرا شده' : 'exercises'}
                </span>
                <span>•</span>
                <span>
                  {selectedSessionDetail.exercises.reduce((acc, e) => acc + e.sets, 0)} {lang === 'fa' ? 'مجموع ست‌ها' : 'total sets'}
                </span>
              </div>
            </div>

            {/* Grid of All Exercises in this Session */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {selectedSessionDetail.exercises.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group hover:border-teal-500 transition"
                >
                  {/* Demonstration GIF / Photo */}
                  {ex.gifUrl ? (
                    <div className="h-40 bg-slate-900 relative overflow-hidden">
                      <img
                        src={ex.gifUrl}
                        alt={ex.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-black/75 text-white backdrop-blur-xs">
                          {ex.bodyPart}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                          {ex.equipment}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Dumbbell className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {ex.name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="px-2.5 py-1 rounded-md bg-teal-100 dark:bg-teal-950 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                          {ex.sets} {lang === 'fa' ? 'ست' : 'sets'} × {ex.reps} {lang === 'fa' ? 'تکرار' : 'reps'}
                        </span>
                        {ex.weightKg && (
                          <span className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {ex.weightKg} kg
                          </span>
                        )}
                      </div>

                      {ex.notes && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-2.5 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
                          <span className="font-bold text-teal-600 dark:text-teal-400">
                            💬 {lang === 'fa' ? 'دستور مربی:' : 'Trainer Tip:'}
                          </span>{' '}
                          {ex.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSessionDetail(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
              >
                {lang === 'fa' ? 'بستن' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
