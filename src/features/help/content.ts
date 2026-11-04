/**
 * src/features/help/content.ts
 * متن راهنما و پرسش‌های پرتکرار، جدا برای هر نقش.
 *
 * هر نقش فقط چیزی را می‌بیند که به کارش می‌آید: مدیر کل مرجع کامل سامانه،
 * مدیر باشگاه رویه‌های عملیاتی و مالی، مربی کار روزانه و برنامه‌نویسی، و
 * ورزشکار پاسخ پرسش‌های خودش.
 *
 * این متن باید با رفتار واقعی کد بخواند. هر بار که قاعده‌ای در
 * `src/lib/domain/` یا منویی در پوسته‌ها عوض شد، همین‌جا هم به‌روز شود.
 */

import type { AppRole } from '../../lib/auth/permissions';

export interface HelpItem {
  /** نام منو، رویه، قاعده — یا متنِ پرسش در بخش پرسش‌های پرتکرار */
  term: string;
  /** توضیح یا پاسخ */
  detail: string;
  /** گام‌های اجرای رویه، به ترتیب */
  steps?: string[];
  /** نکته‌ها و محدودیت‌هایی که سامانه اعمال می‌کند */
  notes?: string[];
}

export interface HelpSection {
  id: string;
  title: string;
  intro?: string;
  items: HelpItem[];
}

type Lang = 'fa' | 'en';

// ── قواعد مشترک ──────────────────────────────────────────────────────────────
// این قواعد در سرور بررسی می‌شوند؛ چند نقش به آن‌ها ارجاع می‌دهند.

const RULES_FA: HelpItem[] = [
  { term: 'ظرفیت سانس', detail: 'سقف نوبت هم‌زمان باشگاه در هر سانس، و سقف روزانهٔ هر مربی.' },
  { term: 'تداخل مربی', detail: 'یک مربی در یک ساعت فقط یک ورزشکار دارد.' },
  { term: 'نوبت تکراری', detail: 'یک ورزشکار در یک ساعت دو نوبت نمی‌گیرد.' },
  { term: 'بستهٔ منتظر تعیین', detail: 'ورزشکاری که مربی ساخته، تا تعیین بسته توسط مدیر رزرو ندارد.' },
  { term: 'اعتبار و انقضا', detail: 'جلسه‌ای که اعتبار ندارد یا بسته‌اش منقضی شده تکمیل نمی‌شود.' },
  { term: 'تعارض منافع', detail: 'مربی نمی‌تواند نوبت خودش را به خودش بدهد و دستمزد بگیرد.' },
  { term: 'جداسازی باشگاه‌ها', detail: 'هیچ باشگاهی دادهٔ باشگاه دیگر را نمی‌بیند و تغییر نمی‌دهد.' },
  { term: 'تغییر رمز اجباری', detail: 'حساب تازه یا رمزِ بازنشانده‌شده، پیش از دسترسی به داده باید رمز را عوض کند.' },
  { term: 'باطل شدن نشست', detail: 'با تغییر رمز یا غیرفعال‌سازی، نشست‌های باز همان حساب از کار می‌افتند.' },
];

const RULES_EN: HelpItem[] = [
  { term: 'Slot capacity', detail: 'The gym’s limit on concurrent bookings, and each trainer’s daily limit.' },
  { term: 'Trainer clash', detail: 'A trainer has one athlete per hour.' },
  { term: 'Duplicate booking', detail: 'An athlete cannot hold two bookings in the same hour.' },
  { term: 'Package pending', detail: 'An athlete created by a trainer cannot be booked until the owner sets a package.' },
  { term: 'Credit and expiry', detail: 'A session cannot be completed without credit or with an expired package.' },
  { term: 'Conflict of interest', detail: 'A trainer cannot book themselves and earn the session fee.' },
  { term: 'Gym isolation', detail: 'No gym can see or change another gym’s data.' },
  { term: 'Forced password change', detail: 'A new or reset account must change its password before reaching any data.' },
  { term: 'Session invalidation', detail: 'Changing a password or deactivating an account ends that account’s open sessions.' },
];

const MULTI_ROLE_FA: HelpItem = {
  term: 'یک نفر با چند نقش',
  detail: 'یک نفر می‌تواند هم‌زمان مربی و ورزشکار باشد — مثل مربی فانکشنالی که زیر نظر مربی یوگا تمرین می‌کند.',
  steps: [
    'در فرم «ورزشکار جدید» شمارهٔ موبایل همان شخص را وارد کنید.',
    'سامانه او را می‌شناسد و به‌جای خطای «موبایل تکراری» پیشنهاد «افزودن نقش» می‌دهد.',
    'مربی و بستهٔ نقش تازه را تعیین کنید و ثبت بزنید.',
    'آن شخص با همان یک حساب وارد می‌شود و از منوی حساب بین نقش‌هایش جابه‌جا می‌شود.',
  ],
  notes: ['مربی نمی‌تواند مربیِ خودش باشد؛ تمرین خودش باید زیر نظر مربی دیگری ثبت شود.'],
};

const MULTI_ROLE_EN: HelpItem = {
  term: 'One person, several roles',
  detail: 'Someone can be a trainer and an athlete at once — a functional trainer training under the yoga trainer, say.',
  steps: [
    'In the new athlete form, enter that person’s mobile number.',
    'The app recognises them and offers to add the role instead of refusing the number.',
    'Pick their trainer and package, then submit.',
    'They sign in with the same login and switch roles from the account menu.',
  ],
  notes: ['A trainer cannot be their own coach; their training goes under someone else.'],
};

// ── مدیر کل سامانه ───────────────────────────────────────────────────────────

const SUPER_ADMIN_FA: HelpSection[] = [
  {
    id: 'roles',
    title: 'نقش‌ها و دسترسی‌ها',
    intro:
      'هر شخص یک حساب ورود دارد (شمارهٔ موبایلش) و می‌تواند چند نقش داشته باشد. نقش فعال تعیین می‌کند چه می‌بیند و چه می‌تواند بکند؛ تعویض نقش از منوی حساب انجام می‌شود.',
    items: [
      {
        term: 'مدیر کل سامانه',
        detail: 'باشگاه‌ها را می‌سازد و مدیر هر باشگاه را تعیین می‌کند. به دادهٔ داخل باشگاه‌ها دست نمی‌زند مگر وارد پنل آن باشگاه شود.',
        notes: ['باشگاه ندارد؛ با هدر باشگاه وارد پنل یک باشگاه می‌شود و آنجا اختیار مدیر باشگاه را دارد.'],
      },
      {
        term: 'مدیر باشگاه',
        detail: 'مربی و ورزشکار می‌سازد، بسته و مبلغ تعیین می‌کند، نوبت می‌دهد، امور مالی و گزارش‌ها را می‌بیند.',
        notes: ['تنها نقشی است که می‌تواند بسته، قیمت و پرداخت را تغییر دهد.'],
      },
      {
        term: 'مربی',
        detail: 'ورزشکاران خودش را می‌بیند، برنامهٔ تمرینی می‌سازد و منتشر می‌کند، جلسه ثبت می‌کند و نوبت می‌دهد.',
        notes: [
          'می‌تواند ورزشکار تازه بسازد، ولی فقط با نام و موبایل؛ بسته را مدیر تعیین می‌کند.',
          'دستمزد مربیان دیگر و امور مالی اعضا را نمی‌بیند.',
        ],
      },
      {
        term: 'ورزشکار',
        detail: 'جلسات، برنامهٔ تمرینی منتشرشده، سوابق و ماندهٔ بستهٔ خودش را می‌بیند.',
        notes: ['فقط دادهٔ خودش را می‌بیند؛ این محدودیت در سرور اعمال می‌شود، نه در مرورگر.'],
      },
      MULTI_ROLE_FA,
    ],
  },
  {
    id: 'sop',
    title: 'رویه‌های کاری (SOP)',
    items: [
      {
        term: 'راه‌اندازی باشگاه تازه',
        detail: 'از پنل مدیر کل، پیش از هر کار دیگری.',
        steps: [
          'در «باشگاه‌ها» باشگاه تازه را با ظرفیت روزانه بسازید.',
          'نام و موبایل مدیر باشگاه را بدهید؛ رمز موقت تعیین کنید.',
          'مدیر در نخستین ورود مجبور به تغییر رمز می‌شود.',
          'مدیر ابتدا مربیان را می‌سازد، بعد ورزشکاران را.',
        ],
      },
      {
        term: 'ورود به پنل یک باشگاه',
        detail: 'برای پشتیبانی یا بررسی مشکل، بدون ساخت حساب تازه.',
        steps: ['در فهرست باشگاه‌ها، «ورود به پنل» آن باشگاه را بزنید.', 'با اختیار مدیر همان باشگاه کار می‌کنید.'],
        notes: ['هر کاری که آنجا می‌کنید در گزارش ممیزی همان باشگاه ثبت می‌شود.'],
      },
      {
        term: 'بازنشانی رمز مدیر باشگاه',
        detail: 'وقتی مدیر باشگاه رمزش را فراموش کرده است.',
        steps: ['در «مدیران باشگاه‌ها» حساب موردنظر را پیدا کنید.', 'رمز تازه بدهید.'],
        notes: ['نشست‌های باز آن حساب بلافاصله باطل می‌شوند و در ورود بعدی باید رمز را عوض کند.'],
      },
      {
        term: 'غیرفعال کردن باشگاه',
        detail: 'وقتی همکاری با یک باشگاه تمام شده است.',
        notes: ['همهٔ حساب‌های آن باشگاه اجازهٔ ورود را از دست می‌دهند؛ داده پاک نمی‌شود.'],
      },
    ],
  },
  { id: 'rules', title: 'قواعدی که سامانه اعمال می‌کند', intro: 'این قواعد در سرور بررسی می‌شوند، پس دور زدنشان از مرورگر ممکن نیست.', items: RULES_FA },
];

const SUPER_ADMIN_EN: HelpSection[] = [
  {
    id: 'roles',
    title: 'Roles and access',
    intro:
      'Each person has one login (their mobile number) and may hold several roles. The active role decides what they see and can do; switching happens in the account menu.',
    items: [
      {
        term: 'System administrator',
        detail: 'Creates gyms and their owners. Does not touch data inside a gym unless they enter that gym’s panel.',
        notes: ['Has no gym of their own; entering a gym panel grants that gym’s owner rights.'],
      },
      {
        term: 'Gym owner',
        detail: 'Creates trainers and athletes, sets packages and prices, books sessions, sees finance and reports.',
        notes: ['The only role that can change a package, its price or a payment.'],
      },
      {
        term: 'Trainer',
        detail: 'Sees their own athletes, builds and publishes programs, records sessions and books slots.',
        notes: [
          'May create an athlete with a name and number only; the owner sets the package.',
          'Cannot see other trainers’ pay or athletes’ finances.',
        ],
      },
      {
        term: 'Athlete',
        detail: 'Sees their own sessions, published program, history and remaining sessions.',
        notes: ['Only their own data — enforced on the server, not in the browser.'],
      },
      MULTI_ROLE_EN,
    ],
  },
  {
    id: 'sop',
    title: 'Standard procedures',
    items: [
      {
        term: 'Setting up a new gym',
        detail: 'From the admin panel, before anything else.',
        steps: [
          'Create the gym with its daily capacity.',
          'Give the owner’s name and number, and set a temporary password.',
          'The owner must change that password on first sign-in.',
          'The owner creates trainers first, then athletes.',
        ],
      },
      {
        term: 'Entering a gym’s panel',
        detail: 'For support or to investigate a problem, without creating an account.',
        steps: ['In the gym list, enter that gym’s panel.', 'You work with that gym owner’s rights.'],
        notes: ['Everything you do there is recorded in that gym’s audit log.'],
      },
      {
        term: 'Resetting an owner’s password',
        detail: 'When a gym owner has forgotten theirs.',
        steps: ['Find the account under gym owners.', 'Set a new password.'],
        notes: ['Their open sessions end at once and they must change it on next sign-in.'],
      },
      {
        term: 'Deactivating a gym',
        detail: 'When work with a gym has ended.',
        notes: ['Every account of that gym loses access; no data is deleted.'],
      },
    ],
  },
  { id: 'rules', title: 'Rules the system enforces', intro: 'These are checked on the server, so they cannot be bypassed from the browser.', items: RULES_EN },
];

// ── مدیر باشگاه ──────────────────────────────────────────────────────────────

const OWNER_FA: HelpSection[] = [
  {
    id: 'menus',
    title: 'منوها',
    items: [
      { term: 'داشبورد عملیات', detail: 'وضعیت امروز باشگاه: ظرفیت، جلسات جاری، بسته‌های رو به اتمام و خلاصهٔ مالی روز.' },
      { term: 'برنامه و حضور غیاب', detail: 'ظرفیت آزاد هفته یا ماه، نوبت‌های هر روز ساعت‌به‌ساعت، و افزودن ورزشکار به یک روز.' },
      { term: 'اعضا و بسته‌ها', detail: 'فهرست ورزشکاران، ماندهٔ بسته، بدهی، و پروندهٔ هر ورزشکار.' },
      { term: 'مربیان و تسویه', detail: 'فهرست مربیان، تعرفهٔ هر جلسه، جلسات تکمیل‌شده و ماندهٔ طلبشان.' },
      { term: 'مالی و پرداخت‌ها', detail: 'دریافتی‌ها، مطالبات از اعضا و بدهی به مربیان.' },
      { term: 'گزارش‌ها', detail: 'گزارش روز، هفته یا ماه؛ با فیلتر کل باشگاه، یک مربی یا یک ورزشکار.' },
      { term: 'تنظیمات باشگاه', detail: 'ظرفیت، ساعت‌ها و تنظیمات عمومی باشگاه.' },
    ],
  },
  {
    id: 'sop',
    title: 'رویه‌های کاری (SOP)',
    intro: 'ترتیب درست کارها. هر رویه از جایی شروع می‌شود که داده‌اش آماده باشد.',
    items: [
      {
        term: 'افزودن مربی',
        detail: 'منوی «مربیان و تسویه».',
        steps: [
          '«مربی جدید» را بزنید و نام و موبایل را وارد کنید.',
          'تخصص را از فهرست انتخاب کنید و بازهٔ ساعت کاری را تعیین کنید.',
          'ظرفیت روزانه (چند جلسه در روز) و دستمزد هر جلسه را وارد کنید.',
          'رمز موقت بدهید؛ مربی در نخستین ورود آن را عوض می‌کند.',
        ],
        notes: ['دستمزد در محاسبهٔ تسویه استفاده می‌شود: جلسات تکمیل‌شده × تعرفه.'],
      },
      {
        term: 'ثبت‌نام ورزشکار',
        detail: 'منوی «اعضا و بسته‌ها».',
        steps: [
          '«ورزشکار جدید» را بزنید و نام، موبایل و رمز را وارد کنید.',
          'مربی پیش‌فرض را انتخاب کنید.',
          'ساعت حضور ثابت را تعیین کنید؛ نوبت‌دهی همین سانس را پیشنهاد می‌دهد.',
          'بسته را از فهرست انتخاب کنید — تعداد جلسه و تاریخ انقضا خودکار پر می‌شوند.',
          'مبلغ بسته و پرداخت اولیه را وارد کنید؛ تفاوتشان بدهی ثبت می‌شود.',
        ],
        notes: ['ورزشکاری که مربی ساخته تا تعیین بسته توسط شما، اجازهٔ رزرو ندارد.'],
      },
      {
        term: 'نوبت‌دهی',
        detail: 'منوی «برنامه و حضور غیاب» یا دکمهٔ «نوبت‌دهی جدید» در بالای هر صفحه.',
        steps: [
          'نمای هفته یا ماه را باز کنید و ظرفیت آزاد روزها را ببینید.',
          'روز موردنظر را انتخاب کنید.',
          '«افزودن ورزشکار به این روز» را بزنید.',
          'ورزشکار را انتخاب کنید؛ مربی و سانسِ ثابت او خودکار می‌آیند.',
          'در صورت نیاز سانس را عوض کنید — جای آزاد هر سانس کنارش نوشته شده.',
        ],
        notes: ['نوبت در تاریخ گذشته ثبت نمی‌شود.'],
      },
      {
        term: 'تمدید بسته',
        detail: 'پروندهٔ ورزشکار را از «اعضا و بسته‌ها» باز کنید.',
        steps: [
          '«تمدید بسته» را بزنید.',
          'بستهٔ تازه را انتخاب کنید و مبلغ و پرداخت را وارد کنید.',
          'تاریخ انقضای تازه را از تقویم بگذارید.',
        ],
        notes: [
          'جلسه‌های استفاده‌نشده از بین نمی‌روند و روی بستهٔ تازه اضافه می‌شوند.',
          'مبلغ تازه به حساب قبلی اضافه می‌شود، جایگزینش نمی‌شود.',
        ],
      },
      {
        term: 'ثبت پرداخت',
        detail: 'پروندهٔ ورزشکار، دکمهٔ ثبت پرداخت.',
        steps: ['مبلغ را وارد کنید.', 'روش پرداخت (کارت، نقدی، انتقال) را انتخاب کنید.'],
        notes: ['بدهی ورزشکار بلافاصله به‌روز می‌شود و پرداخت در گزارش مالی می‌آید.'],
      },
      {
        term: 'تسویه با مربی',
        detail: 'منوی «مربیان و تسویه».',
        notes: ['ماندهٔ طلب هر مربی = جلسات تکمیل‌شده × تعرفه − پرداخت‌های قبلی.'],
      },
      {
        term: 'گزارش‌گیری',
        detail: 'منوی «گزارش‌ها».',
        steps: [
          'بازه را انتخاب کنید: روز، هفته یا ماه.',
          'با «قبلی» و «بعدی» در زمان جابه‌جا شوید.',
          'فیلتر شخص را بگذارید: کل باشگاه، یک مربی، یا یک ورزشکار.',
        ],
        notes: ['نرخ حضور از جلسات تکمیل‌شده نسبت به نوبت‌های لغونشده حساب می‌شود.'],
      },
      MULTI_ROLE_FA,
    ],
  },
  {
    id: 'faq',
    title: 'پرسش‌های پرتکرار',
    items: [
      {
        term: 'چرا نمی‌توانم برای این ورزشکار نوبت بگیرم؟',
        detail: 'یکی از این سه: بسته‌اش هنوز تعیین نشده، سانس یا ظرفیت روز پر است، یا تاریخ انتخابی گذشته است. پیام خطا می‌گوید کدام.',
      },
      {
        term: 'ورزشکاری که مربی ساخته چرا ناقص است؟',
        detail: 'مربی فقط نام و موبایل را ثبت می‌کند. تا شما بسته و مبلغ را تعیین نکنید، آن ورزشکار رزرو ندارد. در فهرست اعضا با نشان «منتظر بسته» دیده می‌شود.',
      },
      {
        term: 'تفاوت «تعیین بسته» و «تمدید بسته» چیست؟',
        detail: 'تعیین بسته، بستهٔ اول را می‌سازد و شمارش جلسات را از صفر شروع می‌کند. تمدید، بستهٔ تازه را روی بستهٔ فعلی اضافه می‌کند و جلسه‌های نرفته را نگه می‌دارد.',
      },
      {
        term: 'جلسه‌ای اشتباه تکمیل شد؛ چه کنم؟',
        detail: 'از پروندهٔ ورزشکار «اصلاح جلسات» را بزنید و تعداد را دستی تصحیح کنید. دلیل اصلاح در گزارش ممیزی ثبت می‌شود.',
      },
      {
        term: 'مربی می‌گوید ورزشکارش را نمی‌بیند.',
        detail: 'مربی فقط ورزشکارانی را می‌بیند که مربی پیش‌فرضشان خودش باشد. از پروندهٔ ورزشکار «تغییر مربی» را بزنید.',
      },
      {
        term: 'یک نفر هم مربی است هم می‌خواهد تمرین کند.',
        detail: 'در فرم ورزشکار جدید شمارهٔ موبایلش را وارد کنید؛ سامانه پیشنهاد «افزودن نقش» می‌دهد. مربی‌اش باید شخص دیگری باشد.',
      },
      {
        term: 'رمز یک مربی یا ورزشکار را چطور عوض کنم؟',
        detail: 'در پروندهٔ او بخش «حساب ورود» رمز تازه بدهید. نشست‌های باز او بسته می‌شوند و در ورود بعدی باید رمز را عوض کند.',
      },
      {
        term: 'عددها چرا با «م» خلاصه نمی‌شوند؟',
        detail: 'مبالغ کامل و با جداکنندهٔ سه‌رقمی نشان داده می‌شوند تا رقم دقیق پیدا باشد. واحد «تومان» کنار عدد می‌آید.',
      },
    ],
  },
  { id: 'rules', title: 'قواعدی که سامانه اعمال می‌کند', intro: 'این قواعد در سرور بررسی می‌شوند، پس دور زدنشان ممکن نیست.', items: RULES_FA },
];

const OWNER_EN: HelpSection[] = [
  {
    id: 'menus',
    title: 'Menus',
    items: [
      { term: 'Operations dashboard', detail: 'Today at the gym: capacity, running sessions, packages about to run out, money collected.' },
      { term: 'Schedule', detail: 'Free capacity by week or month, each day’s sessions hour by hour, and adding athletes to a day.' },
      { term: 'Members and packages', detail: 'The athlete list with sessions left, debt, and each athlete’s record.' },
      { term: 'Trainers and settlement', detail: 'Trainers, their rate per session, completed sessions and what they are owed.' },
      { term: 'Finance', detail: 'Money collected, owed by members, and owed to trainers.' },
      { term: 'Reports', detail: 'A day, week or month, filtered to the whole gym, one trainer or one athlete.' },
      { term: 'Gym settings', detail: 'Capacity, hours and general gym configuration.' },
    ],
  },
  {
    id: 'sop',
    title: 'Standard procedures',
    intro: 'The right order to do things. Each procedure starts where its data is ready.',
    items: [
      {
        term: 'Adding a trainer',
        detail: 'Under trainers and settlement.',
        steps: [
          'Open the new trainer form and enter name and number.',
          'Pick a specialty from the list and set the working-hours range.',
          'Set the daily capacity and the pay per session.',
          'Give a temporary password; the trainer changes it on first sign-in.',
        ],
        notes: ['The rate drives settlement: completed sessions × rate.'],
      },
      {
        term: 'Registering an athlete',
        detail: 'Under members and packages.',
        steps: [
          'Open the new athlete form and enter name, number and password.',
          'Choose the default trainer.',
          'Set the fixed attendance hour; bookings will default to that slot.',
          'Pick a package — sessions and expiry fill in automatically.',
          'Enter the price and anything paid now; the difference is recorded as debt.',
        ],
        notes: ['An athlete created by a trainer cannot be booked until you set a package.'],
      },
      {
        term: 'Booking a session',
        detail: 'From the schedule, or the new booking button at the top of any page.',
        steps: [
          'Open the week or month view and look at free capacity.',
          'Select the day.',
          'Use "add athlete to this day".',
          'Pick the athlete; their trainer and fixed slot come along.',
          'Change the slot if needed — free places are shown next to each one.',
        ],
        notes: ['A session cannot be booked in the past.'],
      },
      {
        term: 'Renewing a package',
        detail: 'Open the athlete from members and packages.',
        steps: ['Choose renew.', 'Pick the new package and enter price and payment.', 'Set the new expiry date from the calendar.'],
        notes: [
          'Unused sessions are not lost — they carry over onto the new package.',
          'The new price is added to the existing balance, not substituted for it.',
        ],
      },
      {
        term: 'Recording a payment',
        detail: 'From the athlete’s record.',
        steps: ['Enter the amount.', 'Choose card, cash or transfer.'],
        notes: ['The athlete’s debt updates at once and the payment appears in finance.'],
      },
      {
        term: 'Settling with a trainer',
        detail: 'Under trainers and settlement.',
        notes: ['Owed = completed sessions × rate − what has already been paid.'],
      },
      {
        term: 'Reporting',
        detail: 'Under reports.',
        steps: ['Choose a day, week or month.', 'Move through time with previous and next.', 'Filter by the whole gym, one trainer or one athlete.'],
        notes: ['Attendance is completed sessions over bookings that were not cancelled.'],
      },
      MULTI_ROLE_EN,
    ],
  },
  {
    id: 'faq',
    title: 'Frequently asked',
    items: [
      {
        term: 'Why can’t I book this athlete?',
        detail: 'One of three: their package is not set yet, the slot or the day is full, or the date is in the past. The error says which.',
      },
      {
        term: 'Why is a trainer-created athlete incomplete?',
        detail: 'A trainer only records a name and number. Until you set the package and price, that athlete cannot be booked; they show as waiting for a package.',
      },
      {
        term: 'What is the difference between setting and renewing a package?',
        detail: 'Setting creates the first package and starts the session count from zero. Renewing adds a new package on top of the current one and keeps the sessions not yet used.',
      },
      {
        term: 'A session was completed by mistake.',
        detail: 'Open the athlete and adjust the session count manually. The reason is recorded in the audit log.',
      },
      {
        term: 'A trainer says they cannot see their athlete.',
        detail: 'Trainers only see athletes whose default trainer is them. Change the trainer from the athlete’s record.',
      },
      {
        term: 'Someone is a trainer and also wants to train.',
        detail: 'Enter their number in the new athlete form; the app offers to add the role. Their coach must be someone else.',
      },
      {
        term: 'How do I change a trainer’s or athlete’s password?',
        detail: 'Set a new one from the sign-in account section of their record. Their open sessions end and they must change it next time.',
      },
      {
        term: 'Why aren’t amounts abbreviated?',
        detail: 'Amounts are shown in full with thousands separators so the exact figure is visible, with the unit beside the number.',
      },
    ],
  },
  { id: 'rules', title: 'Rules the system enforces', intro: 'These are checked on the server, so they cannot be bypassed.', items: RULES_EN },
];

// ── مربی ─────────────────────────────────────────────────────────────────────

const TRAINER_FA: HelpSection[] = [
  {
    id: 'menus',
    title: 'منوها',
    items: [
      { term: 'امروز', detail: 'ورزشکاران و سانس‌های امروزِ شما، با ثبت ورود و تکمیل جلسه.' },
      { term: 'ورزشکاران', detail: 'ورزشکارانی که مربی پیش‌فرضشان شما هستید.' },
      { term: 'برنامه', detail: 'ساخت و انتشار برنامهٔ تمرینی هفتگی بر اساس جلسات باقی‌ماندهٔ ورزشکار.' },
      { term: 'حرکات', detail: 'بانک ۴۱۳ حرکتی باشگاه، به‌علاوهٔ حرکات سفارشی همین باشگاه.' },
      { term: 'تقویم', detail: 'نمای ماهانهٔ نوبت‌های شما.' },
      { term: 'سوابق', detail: 'جلسات تکمیل‌شده و محاسبهٔ دستمزد شما.' },
    ],
  },
  {
    id: 'sop',
    title: 'رویه‌های کاری (SOP)',
    items: [
      {
        term: 'کار روزانه',
        detail: 'منوی «امروز».',
        steps: [
          'هنگام رسیدن ورزشکار «ثبت ورود» را بزنید.',
          'تمرین را اجرا کنید.',
          'در پایان «اتمام» را بزنید تا جلسه تکمیل شود.',
        ],
        notes: [
          'با تکمیل جلسه، یک جلسه از بستهٔ ورزشکار کم و دستمزد شما اضافه می‌شود.',
          'جلسهٔ لغوشده، ورزشکارِ بدون اعتبار و بستهٔ منقضی تکمیل نمی‌شوند.',
        ],
      },
      {
        term: 'تنظیم برنامهٔ تمرینی',
        detail: 'منوی «برنامه».',
        steps: [
          'ورزشکار را انتخاب کنید؛ جلسات باقی‌مانده و تاریخ انقضا بالای تقویم می‌آید.',
          'از تقویم هفته روزهای تمرین را بزنید.',
          'برای هر روز، حرکات را از بانک کاتالوگ اضافه کنید و ست و تکرار و وزنه را تنظیم کنید.',
          '«ذخیره پیش‌نویس» برای نگه داشتن کار نیمه‌تمام.',
          '«انتشار برای ورزشکار» تا برنامه در صفحهٔ تمرینات او دیده شود.',
        ],
        notes: [
          'انتشار خودش اول ذخیره می‌کند؛ یک کلیک کافی است.',
          'برنامهٔ بدون روز، یا روزِ بدون حرکت، منتشر نمی‌شود.',
          'هر ورزشکار در هر لحظه یک برنامهٔ منتشرشده دارد؛ انتشار تازه قبلی را پیش‌نویس می‌کند.',
        ],
      },
      {
        term: 'افزودن ورزشکار تازه',
        detail: 'منوی «ورزشکاران».',
        steps: ['نام، موبایل و رمز را وارد کنید.'],
        notes: [
          'ورزشکار به خود شما وصل می‌شود.',
          'بسته و مبلغ را مدیر باشگاه تعیین می‌کند؛ تا آن موقع رزرو ندارد.',
        ],
      },
      {
        term: 'افزودن نوبت به امروز',
        detail: 'منوی «امروز»، دکمهٔ افزودن ورزشکار.',
        notes: [
          'ظرفیت روزانهٔ شما و سقف سانس باشگاه بررسی می‌شوند.',
          'اگر خودتان ورزشکار همین باشگاه هم هستید، نمی‌توانید نوبت خودتان را بگیرید.',
        ],
      },
    ],
  },
  {
    id: 'faq',
    title: 'پرسش‌های پرتکرار',
    items: [
      {
        term: 'برنامه را ساختم ولی ورزشکار نمی‌بیند.',
        detail: 'برنامه تا وقتی «انتشار برای ورزشکار» نخورده پیش‌نویس است. در فهرست «برنامه‌های من» وضعیتش را ببینید.',
      },
      {
        term: 'چرا انتشار برنامه رد می‌شود؟',
        detail: 'یا هیچ روزی انتخاب نشده، یا یکی از روزها حرکتی ندارد. پیام خطا می‌گوید کدام.',
      },
      {
        term: 'ورزشکاری که ساختم چرا نوبت نمی‌گیرد؟',
        detail: 'شما فقط پروفایلش را ساختید. تا مدیر باشگاه بسته و مبلغ را تعیین نکند، رزرو ندارد.',
      },
      {
        term: 'تکمیل جلسه خطا می‌دهد.',
        detail: 'جلسهٔ لغوشده تکمیل نمی‌شود، و ورزشکاری که جلسه‌ای از بسته‌اش نمانده یا بسته‌اش منقضی شده هم نه. مدیر باید بسته را تمدید کند.',
      },
      {
        term: 'دستمزدم چطور حساب می‌شود؟',
        detail: 'جلسات تکمیل‌شده × تعرفهٔ هر جلسه، منهای آنچه قبلاً تسویه شده. در «سوابق» قابل دیدن است.',
      },
      {
        term: 'چرا دستمزد مربیان دیگر را نمی‌بینم؟',
        detail: 'نقش مربی فقط دادهٔ خودش را می‌بیند. این محدودیت در سرور اعمال می‌شود.',
      },
      {
        term: 'خودم می‌خواهم در همین باشگاه تمرین کنم.',
        detail: 'از مدیر باشگاه بخواهید نقش ورزشکار را به حساب شما اضافه کند. مربی‌تان باید شخص دیگری باشد؛ بعد از منوی حساب بین دو نقش جابه‌جا می‌شوید.',
      },
      {
        term: 'حرکتی در بانک نیست.',
        detail: 'در منوی «حرکات» می‌توانید حرکت سفارشی بسازید؛ فقط برای همین باشگاه ثبت می‌شود.',
      },
    ],
  },
];

const TRAINER_EN: HelpSection[] = [
  {
    id: 'menus',
    title: 'Menus',
    items: [
      { term: 'Today', detail: 'Your athletes and slots for today, with check-in and completion.' },
      { term: 'Athletes', detail: 'The athletes whose default trainer is you.' },
      { term: 'Programs', detail: 'Building and publishing a weekly program sized by the athlete’s remaining sessions.' },
      { term: 'Exercises', detail: 'The gym’s 413-exercise catalog plus this gym’s custom movements.' },
      { term: 'Calendar', detail: 'Monthly view of your bookings.' },
      { term: 'History', detail: 'Completed sessions and your pay.' },
    ],
  },
  {
    id: 'sop',
    title: 'Standard procedures',
    items: [
      {
        term: 'The daily round',
        detail: 'Under today.',
        steps: ['Check the athlete in when they arrive.', 'Run the session.', 'Finish it when training ends.'],
        notes: [
          'Completing deducts one session from the package and credits your pay.',
          'Cancelled sessions, athletes with no credit and expired packages cannot be completed.',
        ],
      },
      {
        term: 'Building a training program',
        detail: 'Under programs.',
        steps: [
          'Pick the athlete; sessions left and expiry appear above the calendar.',
          'Choose the training days from the week calendar.',
          'For each day, add exercises from the catalog and set sets, reps and load.',
          'Save a draft to keep unfinished work.',
          'Publish so it appears in the athlete’s workouts page.',
        ],
        notes: [
          'Publishing saves first, so one click is enough.',
          'A program with no days, or a day with no exercise, cannot be published.',
          'An athlete has one published program at a time; publishing a new one drafts the old.',
        ],
      },
      {
        term: 'Adding a new athlete',
        detail: 'Under athletes.',
        steps: ['Enter name, number and password.'],
        notes: ['The athlete is attached to you.', 'The owner sets the package and price; until then they cannot be booked.'],
      },
      {
        term: 'Adding a session to today',
        detail: 'Under today.',
        notes: [
          'Your daily capacity and the gym’s slot limit are both checked.',
          'If you are also an athlete at this gym, you cannot book yourself.',
        ],
      },
    ],
  },
  {
    id: 'faq',
    title: 'Frequently asked',
    items: [
      {
        term: 'I built a program but the athlete cannot see it.',
        detail: 'It stays a draft until you publish it. Check its status in your program list.',
      },
      { term: 'Why is publishing refused?', detail: 'Either no day is chosen, or one of the days has no exercise. The error says which.' },
      {
        term: 'Why can’t the athlete I created be booked?',
        detail: 'You only created their profile. Until the owner sets the package and price, they cannot be booked.',
      },
      {
        term: 'Completing a session fails.',
        detail: 'A cancelled session cannot be completed, nor one for an athlete with no sessions left or an expired package. The owner needs to renew.',
      },
      {
        term: 'How is my pay calculated?',
        detail: 'Completed sessions × your rate, minus what has already been settled. You can see it under history.',
      },
      { term: 'Why can’t I see other trainers’ pay?', detail: 'The trainer role only sees its own data, enforced on the server.' },
      {
        term: 'I want to train at this gym myself.',
        detail: 'Ask the owner to add the athlete role to your account. Your coach must be someone else; then you switch roles from the account menu.',
      },
      { term: 'An exercise is missing from the catalog.', detail: 'You can add a custom movement under exercises; it is recorded for this gym only.' },
    ],
  },
];

// ── ورزشکار ──────────────────────────────────────────────────────────────────

const MEMBER_FA: HelpSection[] = [
  {
    id: 'menus',
    title: 'بخش‌های برنامه',
    items: [
      { term: 'خانه', detail: 'جلسات باقی‌مانده، تاریخ انقضای بسته، بدهی و نوبت بعدی شما.' },
      { term: 'جلسات', detail: 'نوبت‌های پیش‌رو و امکان لغو نوبت.' },
      { term: 'تمرینات', detail: 'برنامهٔ تمرینی که مربی برایتان منتشر کرده، روزبه‌روز.' },
      { term: 'سوابق', detail: 'جلساتی که تکمیل شده و تمرین‌هایی که انجام داده‌اید.' },
    ],
  },
  {
    id: 'faq',
    title: 'پرسش‌های پرتکرار',
    items: [
      {
        term: 'چند جلسه برایم مانده؟',
        detail: 'عدد بزرگ در صفحهٔ خانه همان ماندهٔ بستهٔ شماست، و تاریخ انقضا زیرش نوشته شده.',
      },
      {
        term: 'جلسه کِی از بسته‌ام کم می‌شود؟',
        detail: 'فقط وقتی مربی در پایان تمرین جلسه را تکمیل کند. رزرو کردن به‌تنهایی چیزی کم نمی‌کند.',
      },
      {
        term: 'صفحهٔ تمرینات خالی است.',
        detail: 'یعنی مربی هنوز برنامه‌ای برایتان منتشر نکرده است. تا انتشار، برنامه پیش‌نویس است و دیده نمی‌شود.',
      },
      {
        term: 'چطور نوبتم را لغو کنم؟',
        detail: 'از بخش «جلسات» نوبت را لغو کنید. لغو به‌موقع جلسه‌ای از بسته‌تان کم نمی‌کند.',
      },
      {
        term: 'بدهی‌ام یعنی چه؟',
        detail: 'تفاوت مبلغ بسته با آنچه پرداخت کرده‌اید. تسویه با مدیر باشگاه انجام می‌شود.',
      },
      {
        term: 'بسته‌ام تمام شده؛ چه کنم؟',
        detail: 'از مدیر باشگاه بخواهید بسته را تمدید کند. جلسه‌های استفاده‌نشده از بین نمی‌روند و به بستهٔ تازه اضافه می‌شوند.',
      },
      {
        term: 'رمزم را فراموش کرده‌ام.',
        detail: 'از مدیر باشگاه بخواهید رمز تازه بدهد. در نخستین ورود، خودتان رمز دلخواهتان را تعیین می‌کنید.',
      },
      {
        term: 'ساعت حضورم را می‌خواهم عوض کنم.',
        detail: 'ساعت ثابت حضور را مدیر باشگاه تعیین می‌کند؛ از او بخواهید تغییرش دهد.',
      },
    ],
  },
];

const MEMBER_EN: HelpSection[] = [
  {
    id: 'menus',
    title: 'Parts of the app',
    items: [
      { term: 'Home', detail: 'Sessions left, package expiry, what you owe and your next booking.' },
      { term: 'Sessions', detail: 'Upcoming bookings, and cancelling one.' },
      { term: 'Workouts', detail: 'The program your trainer published for you, day by day.' },
      { term: 'History', detail: 'Completed sessions and the training you did.' },
    ],
  },
  {
    id: 'faq',
    title: 'Frequently asked',
    items: [
      { term: 'How many sessions do I have left?', detail: 'The large number on the home page, with the expiry date below it.' },
      {
        term: 'When is a session deducted?',
        detail: 'Only when your trainer completes it at the end of training. Booking alone deducts nothing.',
      },
      {
        term: 'My workouts page is empty.',
        detail: 'Your trainer has not published a program yet. Until it is published it stays a draft and is not visible.',
      },
      { term: 'How do I cancel a booking?', detail: 'Cancel it under sessions. Cancelling in time does not cost you a session.' },
      { term: 'What does my balance mean?', detail: 'The difference between the package price and what you have paid. Settle it with the gym owner.' },
      {
        term: 'My package has run out.',
        detail: 'Ask the owner to renew it. Sessions you did not use are not lost — they carry over to the new package.',
      },
      { term: 'I forgot my password.', detail: 'Ask the gym owner for a new one. You choose your own on the next sign-in.' },
      { term: 'I want to change my attendance hour.', detail: 'The gym owner sets the fixed hour; ask them to change it.' },
    ],
  },
];

const BY_ROLE: Record<Lang, Record<AppRole, HelpSection[]>> = {
  fa: { super_admin: SUPER_ADMIN_FA, owner: OWNER_FA, trainer: TRAINER_FA, member: MEMBER_FA },
  en: { super_admin: SUPER_ADMIN_EN, owner: OWNER_EN, trainer: TRAINER_EN, member: MEMBER_EN },
};

/** راهنمای همان نقش و زبان. */
export function helpFor(lang: Lang, role: AppRole): HelpSection[] {
  return BY_ROLE[lang][role] ?? [];
}
