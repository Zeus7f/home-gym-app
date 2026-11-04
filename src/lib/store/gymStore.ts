// High-Fidelity Local State Store implementing Gym Management Operating Model
// PRD Refactor: Gym -> Owner -> Trainers -> Members -> Attendance -> Sessions -> Exercises -> Finance -> Reports

import type {
  Gym,
  Member,
  Trainer,
  DailySession,
  SessionExercise,
  PaymentRecord,
  TrainerPaymentRecord,
  SessionAdjustmentRecord,
  AuditLog,
  UserAccount,
  RoleOption,
  DailyCapacityConfig,
  WorkoutProgram,
  ProgramDay,
  ProgramExercise
} from '../domain/gymManagement';

export type {
  Gym,
  Member,
  Trainer,
  DailySession,
  SessionExercise,
  PaymentRecord,
  TrainerPaymentRecord,
  SessionAdjustmentRecord,
  AuditLog,
  UserAccount,
  DailyCapacityConfig,
  WorkoutProgram,
  ProgramDay,
  ProgramExercise
};
export type { ExerciseItem } from '../exercises/catalog';
import { EXERCISE_CATALOG, loadExerciseCatalog, ExerciseItem } from '../exercises/catalog';
import { getTodayJalaliString, getTodayJalali } from '../date/jalali';
import { isWithinCutoff, RESCHEDULE_CUTOFF_HOURS } from '../domain/sessionPolicy';
import { type StoreResult, type StoreMessageKey, type StoreMessageParams } from '../domain/storeMessages';
import {
  LEGACY_TODAY,
  canonicalDate,
  compareJalaliDates,
  isSameDate,
  validateBooking,
  checkCompletable,
} from '../domain/bookingPolicy';
import { translations } from '../i18n';
import { can } from '../auth/permissions';
import { MIN_PASSWORD_LENGTH } from '../auth/accountRules';
import type { GymSnapshot } from '../data/snapshot';
import { isValidMobile, normalizeLoginId, normalizePhone } from '../phone';

/**
 * تولید شناسهٔ یکتا.
 *
 * `Date.now()` فقط دقت میلی‌ثانیه دارد، بنابراین دو رکورد ساخته‌شده در
 * یک میلی‌ثانیه شناسهٔ یکسان می‌گیرند (مثلاً دو برنامهٔ تمرینی یا دو ورودی
 * پیامِ ممیزی). ترکیب زمان با یک شمارندهٔ یکنوا این برخورد را حذف می‌کند.
 */
/**
 * ساخت نتیجهٔ استور از روی کلید پیام.
 * متن فارسی پیش‌فرض از همان فرهنگ لغت ساخته می‌شود تا دو نسخهٔ متفاوت از یک پیام وجود نداشته باشد.
 */
function storeResult(
  success: boolean,
  messageKey: StoreMessageKey,
  params?: StoreMessageParams
): StoreResult {
  const template = (translations.fa.storeMessages as Record<string, string>)[messageKey] ?? '';
  let message = template;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{${name}\\}`, 'g'), () => String(value));
    }
  }
  return { success, messageKey, params, message };
}

let idCounter = 0;
/** B-03: در حالت ابری شناسهٔ رکوردها UUID است (کلید ردیف در app_records و app_entity_id پروفایل) */
let uuidIds = false;

function nextId(prefix: string): string {
  if (uuidIds && typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/** باشگاه تازه‌ساخته: بدون مربی، عضو و جلسه؛ فقط کاتالوگ حرکات */
export function emptyGymData(gym: Gym) {
  return {
    gym: { ...gym },
    trainers: [] as Trainer[],
    members: [] as Member[],
    todaySessions: [] as DailySession[],
    pastSessions: [] as DailySession[],
    memberPayments: [] as PaymentRecord[],
    trainerPayouts: [] as TrainerPaymentRecord[],
    sessionAdjustments: [] as SessionAdjustmentRecord[],
    auditLogs: [] as AuditLog[],
    exercises: structuredClone(EXERCISE_CATALOG),
    dailyCapacityConfigs: {} as Record<string, DailyCapacityConfig>,
    programs: [] as WorkoutProgram[],
  };
}

/** باشگاه خالی تا وقتی داده از سرور (یا دادهٔ نمونه) بیاید */
const BLANK_GYM: Gym = { id: '', name: '', capacity: 30, currency: 'تومان', noShowDeductsSession: false };

export class GymStore {
  /** همهٔ باشگاه‌های سامانه (برای مدیر کل). دادهٔ تفصیلی فقط برای باشگاه فعال بار می‌شود. */
  gyms: Gym[] = [];
  gym: Gym = BLANK_GYM;
  trainers: Trainer[] = [];
  members: Member[] = [];
  todaySessions: DailySession[] = [];
  pastSessions: DailySession[] = [];
  memberPayments: PaymentRecord[] = [];
  trainerPayouts: TrainerPaymentRecord[] = [];
  sessionAdjustments: SessionAdjustmentRecord[] = [];
  auditLogs: AuditLog[] = [];
  exercises: ExerciseItem[] = [];

  users: UserAccount[] = [];
  currentUser: UserAccount | null = null; // Unauthenticated by default (F3)

  /** آیا وضعیت نشست مشخص شده است؟ (در مرورگر پس از پاسخ /api/auth/me) */
  authReady = false;

  /**
   * B-07: کاربر پیش‌نمایش نقش — فقط وقتی کاربر واقعی مدیر باشگاه است.
   * ذخیره نمی‌شود و هویت داده‌ای همهٔ صفحات (نه فقط پوستهٔ UI) را تعیین می‌کند.
   */
  previewUser: UserAccount | null = null;

  /** باشگاهی که مدیر کل وارد پنلش شده است (برای پیش‌نمایش نقش‌ها) */
  adminGymId: string | null = null;

  /** نقش‌های هویت واردشده؛ بیش از یکی یعنی کلید تعویض نقش نمایش داده می‌شود */
  availableRoles: RoleOption[] = [];

  /** هویتی که صفحات با آن داده می‌خوانند: کاربر پیش‌نمایش یا کاربر واردشده */
  get actingUser(): UserAccount | null {
    return this.previewUser ?? this.currentUser;
  }

  /**
   * تنظیم بی‌صدا و idempotent کاربر پیش‌نمایش (بدون notify، چون در حین render فراخوانی می‌شود).
   * @returns آیا مقدار تغییر کرد؟
   */
  setPreviewUser(userId: string | null): boolean {
    const next =
      userId && can(this.currentUser?.role, 'role.preview')
        ? this.users.find(u => u.id === userId) ?? null
        : null;
    if ((next?.id ?? null) === (this.previewUser?.id ?? null)) return false;
    this.previewUser = next;
    return true;
  }

  dailyCapacityConfigs: Record<string, DailyCapacityConfig> = {};

  /** برنامه‌های تمرینی مربیان که به ورزشکاران منتشر می‌شوند */
  programs: WorkoutProgram[] = [];

  activeTrainerId = 't-ali';
  activeMemberId = 'm-reza';

  listeners = new Set<() => void>();

  /** حساب‌های باشگاه فعال (برای پیش‌نمایش نقش و فهرست کاربران) */
  get gymUsers(): UserAccount[] {
    return this.users.filter(u => (u.gymId ?? this.gym.id) === this.gym.id);
  }

  /**
   * بارگذاری دادهٔ باشگاه دمو — فقط برای تست‌های دامنه و seed.
   *
   * مرورگر این را صدا نمی‌زند؛ داده‌اش از snapshot سرور می‌آید. `import()`
   * پویا باعث می‌شود دادهٔ نمونه و کاتالوگِ همراهش اصلاً وارد باندل نشوند.
   */
  async loadDemoData(): Promise<void> {
    await loadExerciseCatalog();
    const { initialGymData, INITIAL_USERS, withDemoAccounts } = await import('./demoData');
    const data = initialGymData();
    Object.assign(this, data);
    this.gyms = [data.gym];
    this.users = withDemoAccounts(INITIAL_USERS);
    this.notify();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  // ==========================================
  // AUTHENTICATION & USER MANAGEMENT
  // ==========================================
  /**
   * بررسی محلی اعتبار ورود — برای تست‌های واحد. ورود واقعی در سرور است
   * (src/server/auth) و رمز را با hash ذخیره‌شده در PostgreSQL مقایسه می‌کند.
   */
  login(username: string, password: string): StoreResult {
    // ورود با شمارهٔ موبایل (با هر نوع رقم و پیشوند) یا نام کاربری
    const id = normalizeLoginId(username);
    const user = this.users.find(
      u => u.username.toLowerCase() === id || (!!u.phone && normalizePhone(u.phone) === id)
    );
    if (!user) return storeResult(false, 'login.userNotFound');
    if (user.password !== password.trim()) return storeResult(false, 'login.badPassword');
    if (user.isActive === false) return storeResult(false, 'login.inactive');
    if (user.gymId && this.gyms.find(g => g.id === user.gymId)?.isActive === false) {
      return storeResult(false, 'login.gymInactive');
    }
    this.currentUser = user;
    this.previewUser = null;
    this.notify();
    return storeResult(true, 'login.success');
  }

  logout() {
    this.currentUser = null;
    this.previewUser = null;
    this.adminGymId = null;
    this.mustChangePassword = false;
    this.notify();
  }

  /** کاربری که سرور تأیید کرده است (یا null پس از خروج) */
  setAuthenticatedUser(user: UserAccount | null) {
    this.currentUser = user;
    this.previewUser = null;
    this.authReady = true;
    this.notify();
  }

  // ==========================================
  // ACCOUNTS & GYMS (مدیر کل → باشگاه و مدیر؛ مدیر → مربی و ورزشکار؛ مربی → ورزشکار)
  // ==========================================

  /** اعتبارسنجی مشترک ساخت حساب؛ null یعنی معتبر */
  private checkNewAccount(
    name: string,
    phone: string,
    password: string | undefined,
    /** نقش تازه برای شخصی که از قبل حساب دارد — یکتایی موبایل اینجا مانع نیست */
    attachToExisting = false
  ): StoreResult | null {
    if (!name.trim()) return storeResult(false, 'account.invalidName');
    if (!isValidMobile(phone)) return storeResult(false, 'account.invalidPhone');
    if (!attachToExisting && this.users.some(u => u.phone && normalizePhone(u.phone) === phone)) {
      return storeResult(false, 'account.phoneTaken');
    }
    if (password !== undefined && password.trim().length < MIN_PASSWORD_LENGTH) {
      return storeResult(false, 'account.weakPassword');
    }
    return null;
  }

  private audit(action: string, entityType: string, entityId: string, details: string) {
    this.auditLogs.unshift({
      id: nextId('aud'),
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
  }

  resetPassword(userId: string, newPassword: string): StoreResult {
    const user = this.users.find(u => u.id === userId);
    if (!user) return storeResult(false, 'member.notFound');
    if (newPassword.trim().length < MIN_PASSWORD_LENGTH) return storeResult(false, 'account.weakPassword');
    // رمز خام فقط در حافظهٔ موتور سرور می‌ماند تا hash و ذخیره شود؛ به مرورگر فرستاده نمی‌شود
    user.password = newPassword.trim();
    this.audit(
      'PASSWORD_RESET',
      'UserAccount',
      userId,
      `کلمه عبور حساب کاربری ${user.displayName} (${user.username}) تغییر یافت.`
    );
    this.notify();
    return storeResult(true, 'account.passwordChanged');
  }

  /** فعال/غیرفعال کردن حساب. حساب غیرفعال اجازهٔ ورود ندارد. */
  setAccountActive(userId: string, active: boolean): StoreResult {
    const user = this.users.find(u => u.id === userId);
    if (!user) return storeResult(false, 'member.notFound');
    user.isActive = active;
    if (user.role === 'trainer') {
      const trainer = this.trainers.find(t => t.id === user.entityId);
      if (trainer) trainer.status = active ? 'active' : 'inactive';
    }
    if (user.role === 'member') {
      const member = this.members.find(m => m.id === user.entityId);
      if (member) member.status = active ? 'active' : 'inactive';
    }
    this.notify();
    return storeResult(true, active ? 'account.activated' : 'account.deactivated');
  }

  /** حساب ورود یک رکورد مربی/عضو در باشگاه فعال */
  accountFor(role: 'trainer' | 'member', entityId: string): UserAccount | undefined {
    return this.users.find(u => u.role === role && u.entityId === entityId);
  }

  createUserAccount(data: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
    const newUser: UserAccount = {
      gymId: data.role === 'super_admin' ? undefined : this.gym.id,
      ...data,
      id: nextId('u'),
      createdAt: getTodayJalaliString()
    };
    this.users.unshift(newUser);
    this.notify();
    return newUser;
  }

  // ==========================================
  // CALENDAR & DAILY CAPACITY OVERRIDES
  // ==========================================
  setGymDailyCapacity(date: string, capacity: number) {
    const validCap = Math.max(1, Number(capacity) || 1);
    if (!this.dailyCapacityConfigs[date]) {
      this.dailyCapacityConfigs[date] = { date };
    }
    this.dailyCapacityConfigs[date].gymCapacity = validCap;
    this.notify();
  }

  getGymDailyCapacity(date: string): number {
    const cap = this.dailyCapacityConfigs[date]?.gymCapacity ?? this.gym.capacity ?? 30;
    return Math.max(1, cap);
  }

  setTrainerDailyCapacity(date: string, trainerId: string, capacity: number) {
    const validCap = Math.max(1, Number(capacity) || 1);
    if (!this.dailyCapacityConfigs[date]) {
      this.dailyCapacityConfigs[date] = { date, trainerCapacities: {} };
    }
    if (!this.dailyCapacityConfigs[date].trainerCapacities) {
      this.dailyCapacityConfigs[date].trainerCapacities = {};
    }
    this.dailyCapacityConfigs[date].trainerCapacities![trainerId] = validCap;
    this.notify();
  }

  getTrainerDailyCapacity(date: string, trainerId: string): number {
    const override = this.dailyCapacityConfigs[date]?.trainerCapacities?.[trainerId];
    if (override !== undefined) return Math.max(1, override);
    const trainer = this.trainers.find(t => t.id === trainerId);
    return Math.max(1, trainer?.dailyCapacity ?? 6);
  }

  getSessionsForDate(date: string, trainerId?: string, memberId?: string): DailySession[] {
    const today = getTodayJalaliString();
    return this.todaySessions.filter(s => {
      const matchesDate = isSameDate(s.date, date, today);
      const matchesTrainer = !trainerId || s.trainerId === trainerId;
      const matchesMember = !memberId || s.memberId === memberId;
      return matchesDate && matchesTrainer && matchesMember;
    });
  }

  /** همهٔ جلسات (برنامه‌ریزی‌شده و تاریخچه) بدون تکرار — برای validator ظرفیت */
  private allSessions(): DailySession[] {
    const seen = new Set<string>();
    return [...this.todaySessions, ...this.pastSessions].filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }

  /**
   * B-04: validator واحد برای ایجاد، افزودن سریع، جابه‌جایی ساعت و انتقال مربی.
   */
  private checkBooking(
    req: { date: string; time: string; memberId: string; trainerId: string; excludeSessionId?: string },
    names: { trainerName: string; memberName: string },
    options: { allowPastDate?: boolean } = {}
  ) {
    const today = getTodayJalaliString();
    const date = canonicalDate(req.date, today);
    return validateBooking(this.allSessions(), { ...req, date }, {
      today,
      gymDailyCapacity: this.getGymDailyCapacity(date),
      trainerDailyCapacity: this.getTrainerDailyCapacity(date, req.trainerId),
      gymHourlyCapacity: this.gym.hourlyCapacity,
      trainerName: names.trainerName,
      memberName: names.memberName,
      allowPastDate: options.allowPastDate,
      memberPackagePending: this.members.find(m => m.id === req.memberId)?.packagePending === true,
    });
  }

  /** آیا تاریخ ذخیره‌شده امروز است؟ (مقدار قدیمی «Today» هم پشتیبانی می‌شود) */
  private isTodayDate(date: string): boolean {
    const today = getTodayJalaliString();
    return isSameDate(date, today, today);
  }

  getSessionById(sessionId: string): DailySession | undefined {
    return this.todaySessions.find(s => s.id === sessionId) || this.pastSessions.find(s => s.id === sessionId);
  }

  scheduleSessionOnDate(
    date: string,
    time: string,
    memberId: string,
    trainerId: string,
    exercises: SessionExercise[] = []
  ): StoreResult & { session?: DailySession } {
    const member = this.members.find(m => m.id === memberId);
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!member || !trainer) {
      return {
        success: false,
        messageKey: 'session.memberOrTrainerNotFound',
        message: 'ورزشکار یا مربی یافت نشد.',
      };
    }

    // B-04: ظرفیت مربی، ظرفیت باشگاه، تداخل زمانی و نوبت تکراری — لغوشده‌ها ظرفیت نمی‌گیرند
    const check = this.checkBooking(
      { date, time, memberId, trainerId },
      { trainerName: trainer.name, memberName: member.name }
    );
    if (!check.ok) return storeResult(false, check.messageKey!, check.params);

    const newSess: DailySession = {
      id: nextId('sess'),
      date: canonicalDate(date, getTodayJalaliString()),
      time,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      trainerId: trainer.id,
      trainerName: trainer.name,
      isDailyOverride: member.defaultTrainerId !== trainer.id,
      status: 'scheduled',
      exercises
    };

    this.todaySessions.push(newSess);
    this.notify();
    return {
      success: true,
      messageKey: 'session.scheduled',
      message: 'جلسه با موفقیت در تقویم ثبت شد.',
      session: newSess,
    };
  }

  // ==========================================
  // ATOMIC SESSION COMPLETION (Section 65 & 66)
  // ==========================================
  completeMemberSession(
    sessionId: string,
    exercises?: SessionExercise[],
    today: string = getTodayJalaliString()
  ): StoreResult & { idempotent: boolean; remainingSessions: number } {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');

    // 1. Idempotency Check: Calling twice must not deduct twice
    if (session.status === 'completed') {
      const mem = this.members.find(m => m.id === session.memberId);
      if (exercises && exercises.length > 0) {
        session.exercises = exercises;
        this.notify();
      }
      return {
        success: true,
        idempotent: true,
        remainingSessions: mem?.remainingSessions || 0,
        messageKey: 'session.alreadyCompleted',
        message: 'این جلسه قبلاً با موفقیت تکمیل شده و جلسه‌ای مجدداً کسر نگردید.',
      };
    }

    const member = this.members.find(m => m.id === session.memberId);
    if (!member) throw new Error('MEMBER_NOT_FOUND');

    // B-06: جلسهٔ لغوشده/غیبت، عضو بدون اعتبار یا بستهٔ منقضی نباید اعتبار و دستمزد را مصرف کند
    const completable = checkCompletable(session, member, today);
    if (!completable.ok) {
      return {
        ...storeResult(false, completable.messageKey!, completable.params),
        idempotent: false,
        remainingSessions: member.remainingSessions,
      };
    }

    const trainer = this.trainers.find(t => t.id === session.trainerId);

    // 2. Mark session completed and save recorded exercises
    session.status = 'completed';
    session.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (exercises && exercises.length > 0) {
      session.exercises = exercises;
    }

    // 3. Atomically consume exactly 1 session
    member.usedSessions += 1;
    member.remainingSessions = Math.max(0, member.totalSessions - member.usedSessions);

    // 4. Update trainer compensation
    if (trainer) {
      trainer.completedSessions += 1;
      const grossEarned = trainer.completedSessions * trainer.sessionRate;
      trainer.outstandingCompensation = grossEarned - trainer.paidCompensation;
    }

    // 5. Write audit record
    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_COMPLETED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `تکمیل قطعی جلسه ${session.memberName} با مربی ${session.trainerName}. مانده جدید عضو: ${member.remainingSessions} جلسه.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: session.trainerName
    });

    this.notify();

    return {
      success: true,
      idempotent: false,
      remainingSessions: member.remainingSessions,
      messageKey: 'session.completed',
      params: { remaining: member.remainingSessions },
      message: `جلسه با موفقیت تکمیل شد. ۱ جلسه از بسته کسر گردید. مانده فعلی: ${member.remainingSessions} جلسه.`,
    };
  }

  // ==========================================
  // FLEXIBLE DAILY REASSIGNMENT (Section 17 & 39)
  // ==========================================
  reassignDailyTrainer(sessionId: string, newTrainerId: string): StoreResult {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return storeResult(false, 'session.notFound');

    const newTrainer = this.trainers.find(t => t.id === newTrainerId);
    if (!newTrainer) return storeResult(false, 'session.memberOrTrainerNotFound');

    // B-04: فقط نوبت پیش‌رو قابل انتقال است و مربی جدید باید ظرفیت و ساعت آزاد داشته باشد
    if (session.status !== 'scheduled' && session.status !== 'in_progress') {
      return storeResult(false, 'session.notReassignable');
    }
    if (session.trainerId === newTrainer.id) {
      return storeResult(true, 'session.reassigned', { trainer: newTrainer.name });
    }
    const check = this.checkBooking(
      {
        date: session.date,
        time: session.time,
        memberId: session.memberId,
        trainerId: newTrainer.id,
        excludeSessionId: session.id,
      },
      { trainerName: newTrainer.name, memberName: session.memberName },
      { allowPastDate: true }
    );
    if (!check.ok) return storeResult(false, check.messageKey!, check.params);

    const oldTrainerName = session.trainerName;
    session.trainerId = newTrainer.id;
    session.trainerName = newTrainer.name;
    session.isDailyOverride = true; // Daily override flag: Member's default trainer is NOT touched!

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'DAILY_TRAINER_REASSIGNMENT',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `جابجایی روزانه نوبت ${session.memberName}: از ${oldTrainerName} به ${newTrainer.name} (فقط برای امروز). مربی دائم عضو تغییری نکرد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });

    this.notify();
    return storeResult(true, 'session.reassigned', { trainer: newTrainer.name });
  }

  // Attendance check in (Scheduled -> In Progress)
  checkInSession(sessionId: string) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (session && session.status === 'scheduled') {
      session.status = 'in_progress';
      this.notify();
    }
  }

  /**
   * لغو نوبت توسط مربی یا مدیر باشگاه (Does NOT deduct session!).
   * مهلت ۴ ساعته فقط برای درخواست خود ورزشکار است؛ کادر باشگاه می‌تواند در هر زمان لغو کند.
   */
  cancelSession(sessionId: string, reason: string = 'درخواست لغو توسط کاربر'): StoreResult {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return storeResult(false, 'session.notFound');
    if (session.status === 'completed') return storeResult(false, 'session.completedNotChangeable');
    if (session.status === 'cancelled') return storeResult(false, 'session.alreadyCancelled');

    session.status = 'cancelled';
    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_CANCELLED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `لغو نوبت ${session.memberName} (${reason}). هیچ جلسه‌ای از اعتبار عضو کسر نشد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();
    return storeResult(true, 'session.cancelledByStaff');
  }

  /**
   * جابه‌جایی ساعت یک نوبت توسط خود ورزشکار.
   *
   * قوانین:
   *  - نوبت تکمیل‌شده یا لغوشده قابل جابه‌جایی نیست.
   *  - نوبت باید امروز باشد (نوبت‌های آینده توسط مدیر باشگاه جابه‌جا می‌شوند).
   *  - حداقل ۴ ساعت فاصله با شروع سانس لازم است؛ در غیر این صورت لغو به مربی ارجاع می‌شود.
   *  - هیچ جلسه‌ای از اعتبار عضو کسر نمی‌شود.
   */
  rescheduleSession(
    sessionId: string,
    newTime: string,
    reason: string = 'درخواست تغییر ساعت توسط ورزشکار',
    now: Date = new Date()
  ): StoreResult {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) {
      return {
        success: false,
        messageKey: 'session.notFound',
        message: 'نوبت موردنظر یافت نشد.',
      };
    }
    if (session.status === 'completed') {
      return {
        success: false,
        messageKey: 'session.completedNotChangeable',
        message: 'این جلسه تکمیل شده و قابل تغییر نیست.',
      };
    }
    if (session.status === 'cancelled') {
      return {
        success: false,
        messageKey: 'session.alreadyCancelled',
        message: 'این نوبت لغو شده است.',
      };
    }
    // B-05: مقایسه با تاریخ واقعی امروز، نه مقدار ثابت «Today»
    if (!this.isTodayDate(session.date)) {
      const today = getTodayJalaliString();
      return compareJalaliDates(session.date, today, today) < 0
        ? storeResult(false, 'session.pastNotChangeable')
        : storeResult(false, 'session.futureReschedule');
    }

    // بررسی مهلت ۴ ساعته
    if (isWithinCutoff(session.time, now, RESCHEDULE_CUTOFF_HOURS)) {
      return {
        success: false,
        messageKey: 'session.tooSoon',
        message: 'کمتر از ۴ ساعت تا شروع سانس باقی مانده است. لطفاً مستقیماً با مربی تماس بگیرید.',
      };
    }

    // B-04: ساعت جدید — تداخل مربی/عضو و ظرفیت هم‌زمان باشگاه، فقط در همان تاریخ
    const check = this.checkBooking(
      {
        date: session.date,
        time: newTime,
        memberId: session.memberId,
        trainerId: session.trainerId,
        excludeSessionId: session.id,
      },
      { trainerName: session.trainerName, memberName: session.memberName }
    );
    if (!check.ok) return storeResult(false, check.messageKey!, check.params);

    const oldTime = session.time;
    session.time = newTime;

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_RESCHEDULED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `جابه‌جایی ساعت نوبت ${session.memberName} از ${oldTime} به ${newTime} (${reason}). هیچ جلسه‌ای از اعتبار عضو کسر نشد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: session.memberName,
    });

    this.notify();
    return {
      success: true,
      messageKey: 'session.rescheduled',
      params: { oldTime, newTime },
      message: `ساعت نوبت شما از ${oldTime} به ${newTime} تغییر کرد.`,
    };
  }

  /**
   * لغو نوبت توسط خود ورزشکار.
   * هیچ جلسه‌ای از اعتبار کسر نمی‌شود، اما مهلت ۴ ساعته رعایت می‌شود.
   */
  cancelSessionByMember(
    sessionId: string,
    reason: string = 'درخواست لغو توسط ورزشکار',
    now: Date = new Date()
  ): StoreResult {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) {
      return {
        success: false,
        messageKey: 'session.notFound',
        message: 'نوبت موردنظر یافت نشد.',
      };
    }
    if (session.status === 'completed') {
      return {
        success: false,
        messageKey: 'session.completedNotChangeable',
        message: 'این جلسه تکمیل شده و قابل لغو نیست.',
      };
    }
    if (session.status === 'cancelled') {
      return {
        success: false,
        messageKey: 'session.alreadyCancelled',
        message: 'این نوبت قبلاً لغو شده است.',
      };
    }
    if (!this.isTodayDate(session.date)) {
      const today = getTodayJalaliString();
      return compareJalaliDates(session.date, today, today) < 0
        ? storeResult(false, 'session.pastNotChangeable')
        : storeResult(false, 'session.futureCancel');
    }

    if (isWithinCutoff(session.time, now, RESCHEDULE_CUTOFF_HOURS)) {
      return {
        success: false,
        messageKey: 'session.tooSoon',
        message: 'کمتر از ۴ ساعت تا شروع سانس باقی مانده است. لطفاً مستقیماً با مربی تماس بگیرید.',
      };
    }

    session.status = 'cancelled';

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_CANCELLED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `لغو نوبت ${session.memberName} توسط خود ورزشکار (${reason}). هیچ جلسه‌ای از اعتبار عضو کسر نشد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: session.memberName,
    });

    this.notify();
    return {
      success: true,
      messageKey: 'session.cancelled',
      message: 'نوبت شما لغو شد. اعتبار جلسه کسر نشد.',
    };
  }

  /**
   * افزودن ورزشکار به برنامه امروز (سانس فوری).
   * ظرفیت روزانه مربی و تکراری نبودن نوبت بررسی می‌شود.
   */
  addSessionToToday(
    memberId: string,
    trainerId: string,
    time: string = '11:00'
  ): StoreResult & { session?: DailySession } {
    const member = this.members.find(m => m.id === memberId);
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!member || !trainer) {
      return {
        success: false,
        messageKey: 'session.memberOrTrainerNotFound',
        message: 'ورزشکار یا مربی یافت نشد.',
      };
    }

    // B-04: همان validator مسیر تقویم — ظرفیت مربی و باشگاه، تداخل زمانی، نوبت تکراری
    const today = getTodayJalaliString();
    const check = this.checkBooking(
      { date: today, time, memberId, trainerId },
      { trainerName: trainer.name, memberName: member.name }
    );
    if (!check.ok) return storeResult(false, check.messageKey!, check.params);

    const newSession: DailySession = {
      id: nextId('sess'),
      date: today,
      time,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      trainerId: trainer.id,
      trainerName: trainer.name,
      status: 'scheduled',
      exercises: []
    };

    this.todaySessions.push(newSession);
    this.notify();
    return {
      success: true,
      messageKey: 'session.slotAdded',
      params: { time, member: member.name },
      message: `سانس ساعت ${time} برای ${member.name} ثبت شد.`,
      session: newSession,
    };
  }

  // Add exercise to session
  addExerciseToSession(sessionId: string, exerciseData: Omit<SessionExercise, 'id'>) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    const newEx: SessionExercise = {
      ...exerciseData,
      id: nextId('rec')
    };
    session.exercises.push(newEx);
    this.notify();
  }

  // Update exercise in session
  updateExerciseInSession(sessionId: string, recordId: string, patch: Partial<SessionExercise>) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return;
    const ex = session.exercises.find(e => e.id === recordId);
    if (ex) {
      Object.assign(ex, patch);
      this.notify();
    }
  }

  // Remove exercise from session
  removeExerciseFromSession(sessionId: string, recordId: string) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return;
    session.exercises = session.exercises.filter(e => e.id !== recordId);
    this.notify();
  }

  /**
   * افزودن ورزشکار. با رمز، حساب ورود هم ساخته می‌شود (نام کاربری = موبایل).
   * `byTrainerId`: ورزشکار ساختهٔ مربی — به همان مربی وصل می‌شود، بسته و قیمت ندارد
   * و تا تعیین بسته توسط مدیر (`assignMemberPackage`) رزرو ندارد.
   */
  addMember(
    data: Omit<Member, 'id' | 'usedSessions' | 'remainingSessions' | 'outstandingBalance' | 'registrationDate'>,
    initialPassword?: string,
    options: { byTrainerId?: string; attachToExisting?: boolean } = {}
  ): StoreResult & { member?: Member } {
    const phone = normalizePhone(data.phone);
    const invalid = this.checkNewAccount(data.name, phone, initialPassword || undefined, options.attachToExisting);
    if (invalid) return invalid;

    const byTrainer = options.byTrainerId
      ? this.trainers.find(t => t.id === options.byTrainerId)
      : undefined;
    const base = byTrainer
      ? {
          ...data,
          defaultTrainerId: byTrainer.id,
          defaultTrainerName: byTrainer.name,
          packageName: '',
          totalSessions: 0,
          packagePrice: 0,
          paidAmount: 0,
          expirationDate: '',
          packagePending: true,
          createdByTrainerId: byTrainer.id,
        }
      : data;

    const newMember: Member = {
      ...base,
      phone,
      name: base.name.trim(),
      id: nextId('m'),
      usedSessions: 0,
      remainingSessions: base.totalSessions,
      outstandingBalance: Math.max(0, base.packagePrice - base.paidAmount),
      registrationDate: getTodayJalaliString()
    };
    this.members.unshift(newMember);

    // Record payment if initial paid amount > 0
    if (base.paidAmount > 0) {
      this.memberPayments.unshift({
        id: nextId('pay'),
        memberId: newMember.id,
        memberName: newMember.name,
        amount: base.paidAmount,
        date: getTodayJalaliString(),
        method: 'card',
        description: 'پیش‌پرداخت اولیه هنگام ثبت نام',
        recordedBy: this.currentUser?.displayName || 'مدیر باشگاه'
      });
    }

    if (initialPassword && initialPassword.trim()) {
      this.createUserAccount({
        username: phone,
        password: initialPassword.trim(),
        role: 'member',
        entityId: newMember.id,
        displayName: newMember.name,
        phone
      });
    }

    this.audit(
      'MEMBER_CREATED',
      'Member',
      newMember.id,
      byTrainer
        ? `ورزشکار ${newMember.name} توسط مربی ${byTrainer.name} ثبت شد و منتظر تعیین بسته است.`
        : `ورزشکار ${newMember.name} ثبت شد.`
    );
    this.notify();
    return {
      ...storeResult(true, byTrainer ? 'member.createdPending' : 'member.created', { member: newMember.name }),
      member: newMember,
    };
  }

  /** مدیر: تعیین بسته برای ورزشکاری که مربی ساخته (یا تمدید با بستهٔ تازه) */
  assignMemberPackage(
    memberId: string,
    pkg: { packageName: string; totalSessions: number; packagePrice: number; paidAmount: number; startDate: string; expirationDate: string }
  ): StoreResult {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return storeResult(false, 'member.notFound');
    if (!pkg.packageName.trim() || !Number.isFinite(pkg.totalSessions) || pkg.totalSessions < 1) {
      return storeResult(false, 'member.invalidPackage');
    }
    if (pkg.packagePrice < 0 || pkg.paidAmount < 0) return storeResult(false, 'payment.invalidAmount');

    member.packageName = pkg.packageName.trim();
    member.totalSessions = Math.round(pkg.totalSessions);
    member.usedSessions = 0;
    member.remainingSessions = member.totalSessions;
    member.packagePrice = pkg.packagePrice;
    member.paidAmount = pkg.paidAmount;
    member.outstandingBalance = Math.max(0, pkg.packagePrice - pkg.paidAmount);
    member.startDate = pkg.startDate;
    member.expirationDate = pkg.expirationDate;
    member.status = 'active';
    member.packagePending = false;

    if (pkg.paidAmount > 0) {
      this.memberPayments.unshift({
        id: nextId('pay'),
        memberId: member.id,
        memberName: member.name,
        amount: pkg.paidAmount,
        date: getTodayJalaliString(),
        method: 'card',
        description: `پرداخت بستهٔ ${member.packageName}`,
        recordedBy: this.currentUser?.displayName || 'مدیر باشگاه'
      });
    }
    this.audit('PACKAGE_ASSIGNED', 'Member', member.id, `بستهٔ ${member.packageName} برای ${member.name} ثبت شد.`);
    this.notify();
    return storeResult(true, 'member.packageAssigned', { member: member.name });
  }

  /**
   * تمدید بسته: جلسه‌های تازه روی ماندهٔ فعلی اضافه می‌شوند و تاریخ انقضا جلو می‌رود.
   *
   * برخلاف `assignMemberPackage` که بسته را جایگزین می‌کند، اینجا جلسه‌های
   * استفاده‌نشده از بین نمی‌روند و مبلغ تازه به حساب قبلی اضافه می‌شود.
   */
  renewMemberPackage(
    memberId: string,
    pkg: { packageName: string; totalSessions: number; packagePrice: number; paidAmount: number; expirationDate: string }
  ): StoreResult {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return storeResult(false, 'member.notFound');
    if (member.packagePending) return storeResult(false, 'member.invalidPackage');
    if (!pkg.packageName.trim() || !Number.isFinite(pkg.totalSessions) || pkg.totalSessions < 1) {
      return storeResult(false, 'member.invalidPackage');
    }
    if (pkg.packagePrice < 0 || pkg.paidAmount < 0) return storeResult(false, 'payment.invalidAmount');

    const added = Math.round(pkg.totalSessions);
    const carried = member.remainingSessions;

    member.packageName = pkg.packageName.trim();
    member.totalSessions += added;
    // ماندهٔ جلسه‌ها از همین رابطه می‌آید، پس جلسه‌های نرفته خودبه‌خود منتقل می‌شوند
    member.remainingSessions = member.totalSessions - member.usedSessions;
    member.packagePrice += pkg.packagePrice;
    member.paidAmount += pkg.paidAmount;
    member.outstandingBalance = Math.max(0, member.packagePrice - member.paidAmount);
    if (pkg.expirationDate) member.expirationDate = pkg.expirationDate;
    member.status = 'active';

    if (pkg.paidAmount > 0) {
      this.memberPayments.unshift({
        id: nextId('pay'),
        memberId: member.id,
        memberName: member.name,
        amount: pkg.paidAmount,
        date: getTodayJalaliString(),
        method: 'card',
        description: `تمدید بستهٔ ${member.packageName}`,
        recordedBy: this.currentUser?.displayName || 'مدیر باشگاه',
      });
    }
    this.audit(
      'PACKAGE_RENEWED',
      'Member',
      member.id,
      `بستهٔ ${member.name} با ${added} جلسه تمدید شد (${carried} جلسه منتقل شد).`
    );
    this.notify();
    return storeResult(true, 'member.packageRenewed', { member: member.name });
  }

  /**
   * تغییر مربی دائم یک ورزشکار (B-13).
   * نوبت‌های قبلی دست نمی‌خورند؛ فقط مربی پیش‌فرض نوبت‌های بعدی عوض می‌شود.
   */
  changeMemberDefaultTrainer(memberId: string, trainerId: string): StoreResult {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return storeResult(false, 'member.notFound');
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!trainer) return storeResult(false, 'session.memberOrTrainerNotFound');
    if (member.defaultTrainerId === trainer.id) {
      return storeResult(true, 'member.trainerChanged', { trainer: trainer.name });
    }

    const oldTrainerName = member.defaultTrainerName;
    member.defaultTrainerId = trainer.id;
    member.defaultTrainerName = trainer.name;

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'DEFAULT_TRAINER_CHANGED',
      entityType: 'Member',
      entityId: member.id,
      details: `تغییر مربی دائم ${member.name}: از ${oldTrainerName} به ${trainer.name}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });

    this.notify();
    return storeResult(true, 'member.trainerChanged', { trainer: trainer.name });
  }

  /**
   * ذخیرهٔ تنظیمات عملیاتی باشگاه (B-13).
   * ظرفیت روزانه و هم‌زمان مستقیماً در validator رزرو مصرف می‌شوند.
   */
  updateGymSettings(
    patch: Partial<Pick<Gym, 'capacity' | 'hourlyCapacity' | 'noShowDeductsSession' | 'name'>>
  ): StoreResult {
    const isValidCap = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 1;
    if (patch.capacity !== undefined && !isValidCap(patch.capacity)) {
      return storeResult(false, 'gym.invalidCapacity');
    }
    if (patch.hourlyCapacity !== undefined && !isValidCap(patch.hourlyCapacity)) {
      return storeResult(false, 'gym.invalidCapacity');
    }

    const changes = Object.entries(patch)
      .filter(([key, value]) => value !== undefined && (this.gym as any)[key] !== value)
      .map(([key, value]) => `${key}: ${String((this.gym as any)[key])} → ${String(value)}`);

    this.gym = { ...this.gym, ...patch };
    if (changes.length > 0) {
      this.auditLogs.unshift({
        id: nextId('aud'),
        action: 'GYM_SETTINGS_UPDATED',
        entityType: 'Gym',
        entityId: this.gym.id,
        details: `به‌روزرسانی تنظیمات باشگاه — ${changes.join('، ')}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: this.currentUser?.displayName || 'مدیر باشگاه'
      });
    }
    this.notify();
    return storeResult(true, 'gym.settingsSaved');
  }

  // Record Member Payment (with validation)
  recordMemberPayment(memberId: string, amount: number, method: 'card' | 'cash' | 'transfer', description: string) {
    if (amount <= 0) {
      throw new Error('مبلغ پرداختی باید بیشتر از صفر باشد.');
    }

    const member = this.members.find(m => m.id === memberId);
    if (!member) return;

    member.paidAmount += amount;
    member.outstandingBalance = Math.max(0, member.packagePrice - member.paidAmount);

    this.memberPayments.unshift({
      id: nextId('pay'),
      memberId: member.id,
      memberName: member.name,
      amount,
      date: getTodayJalaliString(),
      method,
      description,
      recordedBy: 'مدیر باشگاه'
    });

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'PAYMENT_RECORDED',
      entityType: 'Member',
      entityId: member.id,
      details: `ثبت دریافت ${amount.toLocaleString()} تومان از ${member.name}. مانده بدهی جدید: ${member.outstandingBalance.toLocaleString()} تومان.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  // Adjust Member Session Balance (Section 67 with clamping)
  adjustMemberSessions(memberId: string, delta: number, reason: string) {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return;

    if (member.totalSessions + delta < member.usedSessions) {
      throw new Error('مجموع جلسات نمی‌تواند کمتر از تعداد جلسات استفاده‌شده باشد.');
    }

    member.totalSessions += delta;
    member.remainingSessions = Math.max(0, member.totalSessions - member.usedSessions);

    this.sessionAdjustments.unshift({
      id: nextId('adj'),
      memberId: member.id,
      memberName: member.name,
      delta,
      reason,
      date: getTodayJalaliString(),
      performedBy: 'مدیر باشگاه'
    });

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_BALANCE_ADJUSTED',
      entityType: 'Member',
      entityId: member.id,
      details: `اصلاح دستی اعتبار ${member.name}: ${delta > 0 ? `+${delta}` : delta} جلسه. دلیل: ${reason}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  /** مدیر: افزودن مربی. با رمز، حساب ورود هم ساخته می‌شود (نام کاربری = موبایل). */
  addTrainer(
    data: Omit<Trainer, 'id' | 'completedSessions' | 'paidCompensation' | 'outstandingCompensation'>,
    initialPassword?: string,
    options: { attachToExisting?: boolean } = {}
  ): StoreResult & { trainer?: Trainer } {
    const phone = normalizePhone(data.phone);
    const invalid = this.checkNewAccount(data.name, phone, initialPassword || undefined, options.attachToExisting);
    if (invalid) return invalid;

    const newTrainer: Trainer = {
      ...data,
      phone,
      name: data.name.trim(),
      id: nextId('t'),
      completedSessions: 0,
      paidCompensation: 0,
      outstandingCompensation: 0
    };
    this.trainers.push(newTrainer);

    if (initialPassword && initialPassword.trim()) {
      this.createUserAccount({
        username: phone,
        password: initialPassword.trim(),
        role: 'trainer',
        entityId: newTrainer.id,
        displayName: newTrainer.name,
        phone
      });
    }

    this.audit('TRAINER_CREATED', 'Trainer', newTrainer.id, `مربی ${newTrainer.name} ثبت شد.`);
    this.notify();
    return { ...storeResult(true, 'trainer.created', { trainer: newTrainer.name }), trainer: newTrainer };
  }

  // Record Trainer Payout (Section 13 & 32)
  recordTrainerPayout(trainerId: string, amount: number, method: 'card' | 'transfer' | 'cash', description: string) {
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!trainer) return;

    trainer.paidCompensation += amount;
    trainer.outstandingCompensation = (trainer.completedSessions * trainer.sessionRate) - trainer.paidCompensation;

    this.trainerPayouts.unshift({
      id: nextId('tp'),
      trainerId: trainer.id,
      trainerName: trainer.name,
      amount,
      date: new Date().toLocaleDateString('fa-IR'),
      method,
      description
    });

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'TRAINER_PAYOUT',
      entityType: 'Trainer',
      entityId: trainer.id,
      details: `واریز ${amount.toLocaleString()} تومان دستمزد به حساب ${trainer.name}. مانده طلب: ${trainer.outstandingCompensation.toLocaleString()} تومان.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  // ==========================================
  // EXERCISE CATALOG MANAGEMENT (Owner & Trainers)
  // ==========================================
  addCustomExercise(data: Omit<ExerciseItem, 'id'>): ExerciseItem {
    const newExercise: ExerciseItem = {
      ...data,
      id: nextId('ex-custom'),
      isCustom: true
    };
    this.exercises.unshift(newExercise);
    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'ADD_EXERCISE',
      entityType: 'Exercise',
      entityId: newExercise.id,
      details: `افزودن حرکت جدید "${newExercise.nameFa} (${newExercise.name})" به بانک حرکات باشگاه`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();

    return newExercise;
  }

  deleteCustomExercise(id: string): boolean {
    const index = this.exercises.findIndex(e => e.id === id);
    if (index === -1) return false;
    const removed = this.exercises.splice(index, 1)[0];
    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'DELETE_EXERCISE',
      entityType: 'Exercise',
      entityId: id,
      details: `حذف حرکت "${removed.nameFa}" از بانک حرکات`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();

    return true;
  }

  updateExercise(id: string, updates: Partial<Omit<ExerciseItem, 'id'>>): ExerciseItem | null {
    const exercise = this.exercises.find(e => e.id === id);
    if (!exercise) return null;

    Object.assign(exercise, updates);

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'UPDATE_EXERCISE',
      entityType: 'Exercise',
      entityId: id,
      details: `ویرایش اطلاعات حرکت "${exercise.nameFa} (${exercise.name})" در بانک حرکات`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر / مربی'
    });

    this.notify();

    return exercise;
  }

  // ==========================================
  // WORKOUT PROGRAM PUBLISHER (Trainer → Member)
  // ==========================================

  /** آخرین برنامه منتشرشده یک ورزشکار (اگر وجود داشته باشد) */
  getPublishedProgramForMember(memberId: string): WorkoutProgram | undefined {
    return this.programs
      .filter(p => p.memberId === memberId && p.status === 'published')
      .sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || ''))
      .pop();
  }

  /** همه برنامه‌های یک مربی */
  getProgramsByTrainer(trainerId: string): WorkoutProgram[] {
    return this.programs.filter(p => p.trainerId === trainerId);
  }

  /** برنامه‌های مربی برای یک ورزشکار مشخص */
  getProgramsForMemberByTrainer(memberId: string, trainerId: string): WorkoutProgram[] {
    return this.programs.filter(p => p.memberId === memberId && p.trainerId === trainerId);
  }

  /** ایجاد یا ویرایش برنامه (پیش‌نویس) */
  saveProgram(
    data: Omit<WorkoutProgram, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'publishedAt'> & {
      id?: string;
      status?: 'draft' | 'published';
    }
  ): WorkoutProgram {
    const now = getTodayJalaliString();
    const existing = data.id ? this.programs.find(p => p.id === data.id) : undefined;

    if (existing) {
      Object.assign(existing, {
        memberId: data.memberId,
        memberName: data.memberName,
        trainerId: data.trainerId,
        trainerName: data.trainerName,
        title: data.title,
        description: data.description,
        days: data.days,
        updatedAt: now,
      });
      this.notify();
      return existing;
    }

    const newProgram: WorkoutProgram = {
      id: nextId('prog'),
      memberId: data.memberId,
      memberName: data.memberName,
      trainerId: data.trainerId,
      trainerName: data.trainerName,
      title: data.title,
      description: data.description,
      days: data.days,
      status: data.status || 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === 'published' ? now : undefined,
    };

    this.programs.unshift(newProgram);
    this.notify();
    return newProgram;
  }

  /**
   * انتشار برنامه برای ورزشکار.
   * هر برنامه منتشرشده قبلی برای همان ورزشکار به حالت پیش‌نویس بازمی‌گردد،
   * تا ورزشکار همیشه فقط یک برنامه فعال داشته باشد.
   */
  publishProgram(programId: string): StoreResult {
    const program = this.programs.find(p => p.id === programId);
    if (!program) {
      return {
        success: false,
        messageKey: 'program.notFound',
        message: 'برنامه یافت نشد.',
      };
    }

    if (program.days.length === 0) {
      return {
        success: false,
        messageKey: 'program.noDays',
        message: 'برنامه بدون روز و حرکت قابل انتشار نیست.',
      };
    }

    const hasEmptyDay = program.days.some(d => d.items.length === 0);
    if (hasEmptyDay) {
      return {
        success: false,
        messageKey: 'program.emptyDay',
        message: 'همه روزهای برنامه باید حداقل یک حرکت داشته باشند.',
      };
    }

    for (const other of this.programs) {
      if (other.id !== program.id && other.memberId === program.memberId && other.status === 'published') {
        other.status = 'draft';
      }
    }

    const now = getTodayJalaliString();
    program.status = 'published';
    program.publishedAt = now;
    program.updatedAt = now;

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'PROGRAM_PUBLISHED',
      entityType: 'WorkoutProgram',
      entityId: program.id,
      details: `انتشار برنامه تمرینی «${program.title}» برای ${program.memberName} توسط ${program.trainerName} (${program.days.length} روز).`,
      timestamp: now,
      user: program.trainerName,
    });

    this.notify();
    return {
      success: true,
      messageKey: 'program.published',
      params: { title: program.title, member: program.memberName },
      message: `برنامه «${program.title}» برای ${program.memberName} منتشر شد.`,
    };
  }

  /** بازگرداندن یک برنامه منتشرشده به وضعیت پیش‌نویس */
  unpublishProgram(programId: string): StoreResult {
    const program = this.programs.find(p => p.id === programId);
    if (!program) {
      return {
        success: false,
        messageKey: 'program.notFound',
        message: 'برنامه یافت نشد.',
      };
    }
    program.status = 'draft';
    program.publishedAt = undefined;
    program.updatedAt = getTodayJalaliString();
    this.notify();
    return {
      success: true,
      messageKey: 'program.unpublished',
      message: 'برنامه به وضعیت پیش‌نویس بازگشت.',
    };
  }

  /** حذف برنامه */
  deleteProgram(programId: string): boolean {
    const index = this.programs.findIndex(p => p.id === programId);
    if (index === -1) return false;
    this.programs.splice(index, 1);
    this.notify();
    return true;
  }

  // ==========================================
  // SERVER DATA — دادهٔ باشگاه از سرور (src/server)؛ مرورگر فقط آن را نمایش می‌دهد
  // ==========================================

  /** کاربر واردشده باید پیش از ادامه رمز را عوض کند (اولین ورود یا رمز تعیین‌شده توسط مدیر) */
  mustChangePassword = false;

  /** جایگزینی دادهٔ باشگاه با دادهٔ سرور (فیلترشده برای نقش کاربر) */
  applySnapshot(s: GymSnapshot) {
    const overrides = new Map(s.exerciseOverrides.map(e => [e.id, e]));
    Object.assign(this, emptyGymData(s.gym), {
      gym: s.gym,
      gyms: [s.gym],
      trainers: s.trainers,
      members: s.members,
      todaySessions: s.todaySessions,
      pastSessions: s.pastSessions,
      memberPayments: s.memberPayments,
      trainerPayouts: s.trainerPayouts,
      sessionAdjustments: s.sessionAdjustments,
      auditLogs: s.auditLogs,
      dailyCapacityConfigs: s.dailyCapacityConfigs,
      programs: s.programs,
      exercises: [
        ...EXERCISE_CATALOG.map(e => overrides.get(e.id) ?? e),
        ...s.exerciseOverrides.filter(e => !EXERCISE_CATALOG.some(c => c.id === e.id)),
      ],
    });
    // حساب‌های باشگاه (فقط مدیر می‌بیند)؛ حساب واردشده همیشه در فهرست می‌ماند
    const me = this.currentUser;
    this.users = [...(me ? [me] : []), ...s.users.filter(u => u.id !== me?.id)];
    this.notify();
  }
}

/** نمونهٔ مرورگر: کش خواندنی داده‌ای که از سرور (src/server) می‌آید؛ در تست‌ها موتور محلی */
export const gymStore = new GymStore();

// Backwards compatibility alias for components
export const mockStore = gymStore;
