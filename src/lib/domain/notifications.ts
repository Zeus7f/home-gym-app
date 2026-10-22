import type { AppRole } from '../auth/permissions';
// Pure Domain Logic: Role-aware Notification Engine
// Derives user-facing alerts from live store data — no hardcoded notification lists.
//
// Every notification is computed, never stored, so it can never go stale.

import type { DailySession, Member, Trainer, WorkoutProgram } from './gymManagement';
import { getTodayJalali, parseJalali, jalaliToGregorian } from '../date/jalali';

/** زبان متن اعلان‌ها. */
export type NotificationLang = 'fa' | 'en';

/**
 * قالب‌بندی عدد بر اساس زبان فعال (ارقام فارسی یا لاتین).
 * لایه دامنه به فرمت‌ده رابط کاربری وابسته نیست، پس تبدیل ارقام اینجا انجام می‌شود.
 */
export function formatNotificationNumber(n: number, lang: NotificationLang = 'fa'): string {
  const tag = lang === 'fa' ? 'fa-IR' : 'en-US';
  if (!isFinite(n)) return new Intl.NumberFormat(tag).format(0);
  return new Intl.NumberFormat(tag).format(n);
}

/**
 * مقصد اعلان‌ها — بخش استاندارد مسیر هر نقش (src/lib/routes.ts)، مثلاً /owner/memberships.
 * B-08: مقصد باید دقیقاً یکی از بخش‌های واقعی همان نقش باشد.
 */
export const NOTIFICATION_TABS = {
  member: { sessions: 'sessions', exercises: 'workouts' },
  trainer: { today: 'today', members: 'athletes', programs: 'programs', history: 'history' },
  owner: { members: 'memberships', finance: 'finance', trainers: 'trainers', reports: 'analytics' },
} as const;

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export type NotificationKind =
  | 'low_balance'
  | 'expiring_package'
  | 'upcoming_session'
  | 'session_cancelled'
  | 'session_completed'
  | 'program_published'
  | 'payment_due'
  | 'trainer_payout_due'
  | 'no_show'
  | 'package_exhausted'
  | 'package_pending';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  body: string;
  /** زمان ثبت اعلان (جلالی) */
  timestamp: string;
  /** لینک داخلی به تب مقصد (مثلاً 'ses' برای جلسات) */
  targetTab?: string;
}

/**
 * برچسب‌های متنی اعلان‌ها.
 *
 * موتور اعلان یک ماژول خالص دامنه است و نباید به فرهنگ لغت رابط کاربری
 * وابسته باشد؛ بنابراین لایهٔ API برچسب‌های زبان فعال را به آن تزریق می‌کند.
 */
export interface NotificationLabels {
  lowBalance: { title: string; body: string };
  packageExhausted: { title: string; body: string };
  expiringPackage: { title: string; bodyToday: string; bodyDays: string };
  upcomingSession: { title: string; body: string; liveTitle: string; liveBody: string };
  sessionCancelled: { title: string; body: string };
  programPublished: { title: string; body: string };
  sessionCompleted: { title: string; body: string };
  sessionsWaiting: { title: string; body: string };
  trainerLowBalance: { title: string; body: string };
  draftProgram: { title: string; body: string };
  ownerLowBalance: { title: string; body: string };
  ownerExpiring: { title: string; body: string };
  paymentDue: { title: string; body: string };
  trainerPayoutDue: { title: string; body: string };
  noShow: { title: string; body: string };
  ownerPendingPackage: { title: string; body: string };
}

export interface NotificationInput {
  /** کاربر واردشده */
  currentUser: { role: AppRole; entityId: string } | null;
  members: Member[];
  trainers: Trainer[];
  todaySessions: DailySession[];
  pastSessions: DailySession[];
  programs: WorkoutProgram[];
  /** کلید عددی تاریخ امروز (YYYYMMDD جلالی) */
  todayKey: number;
  /** برچسب‌های متنی زبان فعال */
  labels: NotificationLabels;
  /** زبان فعال برای ارقام و جداکننده‌ها (پیش‌فرض فارسی) */
  lang?: NotificationLang;
  /** تبدیل نام ذخیره‌شده به نام قابل‌نمایش در زبان فعال */
  nameOf?: (raw: string) => string;
}

/** تعداد روز باقیمانده تا یک تاریخ جلالی (بدون در نظر گرفتن ساعت) */
export function daysUntilJalali(targetDate: string, todayKey: number): number | null {
  const parsed = parseJalali(targetDate);
  if (!parsed) return null;

  const target = jalaliToGregorian(parsed.jy, parsed.jm, parsed.jd);
  const today = getTodayJalali();
  const todayG = jalaliToGregorian(today.jy, today.jm, today.jd);

  const targetMs = Date.UTC(target.gy, target.gm - 1, target.gd);
  const todayMs = Date.UTC(todayG.gy, todayG.gm - 1, todayG.gd);

  return Math.round((targetMs - todayMs) / 86400000);
}

/** وضعیت اعتبار یک عضو: عادی، رو به اتمام، تمام‌شده */
export function packageStatus(
  member: Member,
  todayKey: number
): 'healthy' | 'low' | 'exhausted' {
  if (member.remainingSessions <= 0) return 'exhausted';
  if (member.remainingSessions <= 2) return 'low';
  return 'healthy';
}

/**
 * محاسبه اعلان‌های نقش‌محور از روی داده‌های زنده.
 */
export function buildNotifications({
  currentUser,
  members,
  trainers,
  todaySessions,
  pastSessions,
  programs,
  todayKey,
  labels,
  lang = 'fa',
  nameOf = (raw: string) => raw,
}: NotificationInput): AppNotification[] {
  if (!currentUser) return [];

  const fa = (n: number) => formatNotificationNumber(n, lang);
  const sep = lang === 'fa' ? '، ' : ', ';
  const notifications: AppNotification[] = [];
  const nowLabel = lang === 'fa' ? 'همین حالا' : 'Just now';

  const add = (
    n: Omit<AppNotification, 'id' | 'timestamp'> & { id?: string }
  ) => {
    notifications.push({
      ...n,
      id: n.id ?? `${n.kind}-${notifications.length}`,
      timestamp: nowLabel,
    });
  };

  if (currentUser.role === 'member') {
    const member = members.find(m => m.id === currentUser.entityId);
    // ورزشکارِ منتظر بسته هنوز اعتباری ندارد؛ بنر صفحه کافی است
    if (member && !member.packagePending) {
      // اعتبار رو به اتمام
      const status = packageStatus(member, todayKey);
      if (status === 'exhausted') {
        add({
          kind: 'package_exhausted',
          severity: 'critical',
          title: labels.packageExhausted.title,
          body: labels.packageExhausted.body,
          targetTab: NOTIFICATION_TABS.member.sessions,
        });
      } else if (status === 'low') {
        add({
          kind: 'low_balance',
          severity: 'warning',
          title: labels.lowBalance.title,
          body: labels.lowBalance.body
            .replace('{remaining}', fa(member.remainingSessions))
            .replace('{total}', fa(member.totalSessions)),
          targetTab: NOTIFICATION_TABS.member.sessions,
        });
      }

      // نزدیک شدن به انقضا
      const daysLeft = daysUntilJalali(member.expirationDate, todayKey);
      if (daysLeft !== null && daysLeft <= 7 && daysLeft >= 0) {
        add({
          kind: 'expiring_package',
          severity: daysLeft <= 3 ? 'critical' : 'warning',
          title: labels.expiringPackage.title,
          body:
            daysLeft === 0
              ? labels.expiringPackage.bodyToday
              : labels.expiringPackage.bodyDays.replace('{days}', fa(daysLeft)),
          targetTab: NOTIFICATION_TABS.member.sessions,
        });
      }

      // نوبت پیش‌رو
      const upcoming = todaySessions.find(
        s => s.memberId === member.id && (s.status === 'scheduled' || s.status === 'in_progress')
      );
      if (upcoming) {
        add({
          kind: 'upcoming_session',
          severity: 'info',
          title:
            upcoming.status === 'in_progress'
              ? labels.upcomingSession.liveTitle
              : labels.upcomingSession.title,
          body:
            upcoming.status === 'in_progress'
              ? labels.upcomingSession.liveBody
                  .replace('{trainer}', nameOf(upcoming.trainerName))
                  .replace('{time}', upcoming.time)
              : labels.upcomingSession.body
                  .replace('{trainer}', nameOf(upcoming.trainerName))
                  .replace('{time}', upcoming.time),
          targetTab: NOTIFICATION_TABS.member.sessions,
        });
      }

      // لغو شدن نوبت
      const cancelled = todaySessions.find(
        s => s.memberId === member.id && s.status === 'cancelled'
      );
      if (cancelled) {
        add({
          kind: 'session_cancelled',
          severity: 'warning',
          title: labels.sessionCancelled.title,
          body: labels.sessionCancelled.body
            .replace('{time}', cancelled.time)
            .replace('{trainer}', nameOf(cancelled.trainerName)),
          targetTab: NOTIFICATION_TABS.member.sessions,
        });
      }

      // برنامه جدید منتشر شده
      const program = programs.find(
        p => p.memberId === member.id && p.status === 'published'
      );
      if (program) {
        const exerciseCount = program.days.reduce((sum, d) => sum + d.items.length, 0);
        add({
          kind: 'program_published',
          severity: 'success',
          title: labels.programPublished.title,
          body: labels.programPublished.body
            .replace('{trainer}', nameOf(program.trainerName))
            .replace('{title}', program.title)
            .replace('{count}', fa(exerciseCount)),
          targetTab: NOTIFICATION_TABS.member.exercises,
        });
      }
    }
  }

  if (currentUser.role === 'trainer') {
    const trainer = trainers.find(t => t.id === currentUser.entityId);

    // سانس‌های امروز
    const mySessions = todaySessions.filter(
      s => s.trainerId === currentUser.entityId && s.status !== 'cancelled'
    );
    const live = mySessions.filter(s => s.status === 'in_progress');
    const waiting = mySessions.filter(s => s.status === 'scheduled');

    if (live.length > 0) {
      add({
        kind: 'session_completed',
        severity: 'info',
        title: labels.sessionCompleted.title,
        body: labels.sessionCompleted.body.replace(
          '{members}',
          live.map(s => `${nameOf(s.memberName)} — ${s.time}`).join(sep)
        ),
        targetTab: NOTIFICATION_TABS.trainer.today,
      });
    }
    if (waiting.length > 0) {
      add({
        kind: 'upcoming_session',
        severity: 'info',
        title: labels.sessionsWaiting.title,
        body: labels.sessionsWaiting.body.replace(
          '{members}',
          waiting.map(s => `${nameOf(s.memberName)} — ${s.time}`).join(sep)
        ),
        targetTab: NOTIFICATION_TABS.trainer.today,
      });
    }

    // ورزشکاران با اعتبار رو به اتمام
    const myMembers = members.filter(m => m.defaultTrainerId === currentUser.entityId);
    const lowMembers = myMembers.filter(m => !m.packagePending && packageStatus(m, todayKey) !== 'healthy');
    if (lowMembers.length > 0) {
      add({
        kind: 'low_balance',
        severity: 'warning',
        title: labels.trainerLowBalance.title,
        body: labels.trainerLowBalance.body.replace(
          '{members}',
          lowMembers.map(m => `${nameOf(m.name)} (${fa(m.remainingSessions)})`).join(sep)
        ),
        targetTab: NOTIFICATION_TABS.trainer.members,
      });
    }

    // غیبت ورزشکاران همین مربی (قبلاً فقط به مالک اطلاع داده می‌شد)
    const myNoShows = pastSessions.filter(
      s => s.trainerId === currentUser.entityId && s.status === 'no_show'
    );
    if (myNoShows.length > 0) {
      add({
        kind: 'no_show',
        severity: 'info',
        title: labels.noShow.title,
        body: labels.noShow.body.replace(
          '{members}',
          myNoShows.map(s => nameOf(s.memberName)).join(sep)
        ),
        targetTab: NOTIFICATION_TABS.trainer.history,
      });
    }

    // برنامه منتشرنشده
    const draftPrograms = programs.filter(
      p => p.trainerId === currentUser.entityId && p.status === 'draft'
    );
    if (draftPrograms.length > 0) {
      add({
        kind: 'program_published',
        severity: 'info',
        title: labels.draftProgram.title,
        body: labels.draftProgram.body.replace(
          '{titles}',
          draftPrograms.map(p => p.title).join(sep)
        ),
        targetTab: NOTIFICATION_TABS.trainer.programs,
      });
    }
  }

  if (currentUser.role === 'owner') {
    // ورزشکارانی که مربی ساخته و منتظر تعیین بسته‌اند
    const pending = members.filter(m => m.packagePending);
    if (pending.length > 0) {
      add({
        kind: 'package_pending',
        severity: 'critical',
        title: labels.ownerPendingPackage.title,
        body: labels.ownerPendingPackage.body.replace('{members}', pending.map(m => nameOf(m.name)).join(sep)),
        targetTab: NOTIFICATION_TABS.owner.members,
      });
    }

    // اعضای با اعتبار رو به اتمام
    const lowMembers = members.filter(m => !m.packagePending && packageStatus(m, todayKey) !== 'healthy');
    if (lowMembers.length > 0) {
      add({
        kind: 'low_balance',
        severity: 'warning',
        title: labels.ownerLowBalance.title,
        body: labels.ownerLowBalance.body.replace(
          '{members}',
          lowMembers.map(m => `${nameOf(m.name)} (${fa(m.remainingSessions)})`).join(sep)
        ),
        targetTab: NOTIFICATION_TABS.owner.members,
      });
    }

    // بسته‌های در شرف انقضا
    const expiring = members.filter(m => {
      const d = daysUntilJalali(m.expirationDate, todayKey);
      return d !== null && d <= 7 && d >= 0;
    });
    if (expiring.length > 0) {
      add({
        kind: 'expiring_package',
        severity: 'warning',
        title: labels.ownerExpiring.title,
        body: labels.ownerExpiring.body.replace(
          '{members}',
          expiring.map(m => nameOf(m.name)).join(sep)
        ),
        targetTab: NOTIFICATION_TABS.owner.members,
      });
    }

    // بدهی اعضا
    const debtors = members.filter(m => m.outstandingBalance > 0);
    if (debtors.length > 0) {
      const total = debtors.reduce((sum, m) => sum + m.outstandingBalance, 0);
      add({
        kind: 'payment_due',
        severity: 'warning',
        title: labels.paymentDue.title,
        body: labels.paymentDue.body
          .replace('{count}', fa(debtors.length))
          .replace('{total}', fa(total)),
        targetTab: NOTIFICATION_TABS.owner.finance,
      });
    }

    // مانده دستمزد مربیان
    const owing = trainers.filter(t => t.outstandingCompensation > 0);
    if (owing.length > 0) {
      const total = owing.reduce((sum, t) => sum + t.outstandingCompensation, 0);
      add({
        kind: 'trainer_payout_due',
        severity: 'info',
        title: labels.trainerPayoutDue.title,
        body: labels.trainerPayoutDue.body
          .replace('{count}', fa(owing.length))
          .replace('{total}', fa(total)),
        targetTab: NOTIFICATION_TABS.owner.trainers,
      });
    }

    // غیبت‌ها
    const noShows = pastSessions.filter(s => s.status === 'no_show');
    if (noShows.length > 0) {
      add({
        kind: 'no_show',
        severity: 'info',
        title: labels.noShow.title,
        body: labels.noShow.body.replace(
          '{members}',
          noShows.map(s => nameOf(s.memberName)).join(sep)
        ),
        targetTab: NOTIFICATION_TABS.owner.reports,
      });
    }
  }

  return notifications;
}
