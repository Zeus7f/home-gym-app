/**
 * src/features/admin/helpContent.ts
 * متن راهنمای سامانه: نقش‌ها، منوها، رویه‌های کاری (SOP) و قواعدی که سرور اعمال می‌کند.
 *
 * این متن مرجع داخلی تیم است و باید با رفتار واقعی کد بخواند. هر بار که
 * قاعده‌ای در `src/lib/domain/` یا منویی در پوسته‌ها عوض شد، همین‌جا هم به‌روز شود.
 */

export interface HelpItem {
  /** نام منو، رویه یا قاعده */
  term: string;
  /** توضیح یک‌خطی */
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

const fa: HelpSection[] = [
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
      {
        term: 'چند نقش برای یک نفر',
        detail: 'یک نفر می‌تواند هم‌زمان مربی و ورزشکار باشد — مثل مربی فانکشنالی که زیر نظر مربی یوگا تمرین می‌کند.',
        steps: [
          'در فرم «ورزشکار جدید» شمارهٔ موبایل همان شخص را وارد کنید.',
          'سامانه او را می‌شناسد و به‌جای خطای «موبایل تکراری» پیشنهاد «افزودن نقش» می‌دهد.',
          'مربی و بستهٔ نقش تازه را تعیین کنید و ثبت بزنید.',
          'آن شخص با همان یک حساب وارد می‌شود و از منوی حساب بین نقش‌هایش جابه‌جا می‌شود.',
        ],
        notes: ['مربی نمی‌تواند مربیِ خودش باشد؛ تمرین خودش باید زیر نظر مربی دیگری ثبت شود.'],
      },
    ],
  },
  {
    id: 'menus',
    title: 'منوها و معنی هرکدام',
    intro: 'نام منوها در هر فضای کاری و کاری که انجام می‌دهند.',
    items: [
      { term: 'داشبورد عملیات (مدیر)', detail: 'وضعیت امروز باشگاه: ظرفیت، جلسات جاری، بسته‌های رو به اتمام و خلاصهٔ مالی روز.' },
      { term: 'برنامه و حضور غیاب (مدیر)', detail: 'ظرفیت آزاد هفته یا ماه، نوبت‌های هر روز ساعت‌به‌ساعت، و افزودن ورزشکار به یک روز.' },
      { term: 'اعضا و بسته‌ها (مدیر)', detail: 'فهرست ورزشکاران، ماندهٔ بسته، بدهی، و پروندهٔ هر ورزشکار.' },
      { term: 'مربیان و تسویه (مدیر)', detail: 'فهرست مربیان، تعرفهٔ هر جلسه، جلسات تکمیل‌شده و ماندهٔ طلبشان.' },
      { term: 'مالی و پرداخت‌ها (مدیر)', detail: 'دریافتی‌ها، مطالبات از اعضا و بدهی به مربیان.' },
      { term: 'گزارش‌ها (مدیر)', detail: 'گزارش روز، هفته یا ماه؛ با فیلتر کل باشگاه، یک مربی یا یک ورزشکار.' },
      { term: 'تنظیمات باشگاه (مدیر)', detail: 'ظرفیت، ساعت‌ها و تنظیمات عمومی باشگاه.' },
      { term: 'امروز (مربی)', detail: 'ورزشکاران و سانس‌های امروزِ همین مربی، با ثبت ورود و تکمیل جلسه.' },
      { term: 'ورزشکاران (مربی)', detail: 'ورزشکارانی که مربی پیش‌فرضشان همین مربی است.' },
      { term: 'برنامه (مربی)', detail: 'ساخت و انتشار برنامهٔ تمرینی هفتگی بر اساس جلسات باقی‌ماندهٔ ورزشکار.' },
      { term: 'حرکات (مربی)', detail: 'بانک ۴۱۳ حرکتی باشگاه، به‌علاوهٔ حرکات سفارشی همین باشگاه.' },
      { term: 'تقویم و سوابق (مربی)', detail: 'نمای ماهانهٔ نوبت‌ها و تاریخچهٔ جلسات تکمیل‌شده با محاسبهٔ دستمزد.' },
      { term: 'خانه، جلسات، تمرینات، سوابق (ورزشکار)', detail: 'ماندهٔ بسته، نوبت بعدی، برنامهٔ تمرینی منتشرشده و تاریخچهٔ حضور.' },
    ],
  },
  {
    id: 'sop',
    title: 'رویه‌های کاری (SOP)',
    intro: 'ترتیب درست کارها. هر رویه از جایی شروع می‌شود که داده‌اش آماده باشد.',
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
        term: 'افزودن مربی',
        detail: 'مدیر باشگاه، منوی «مربیان و تسویه».',
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
        detail: 'مدیر باشگاه، منوی «اعضا و بسته‌ها».',
        steps: [
          '«ورزشکار جدید» را بزنید و نام، موبایل و رمز را وارد کنید.',
          'مربی پیش‌فرض را انتخاب کنید.',
          'ساعت حضور ثابت را تعیین کنید؛ نوبت‌دهی همین سانس را پیشنهاد می‌دهد.',
          'بسته را از فهرست انتخاب کنید — تعداد جلسه و تاریخ انقضا خودکار پر می‌شوند.',
          'مبلغ بسته و پرداخت اولیه را وارد کنید؛ تفاوتشان بدهی ثبت می‌شود.',
        ],
        notes: ['ورزشکاری که مربی ساخته تا تعیین بسته توسط مدیر، اجازهٔ رزرو ندارد.'],
      },
      {
        term: 'نوبت‌دهی',
        detail: 'مدیر باشگاه، منوی «برنامه و حضور غیاب» یا دکمهٔ «نوبت‌دهی جدید».',
        steps: [
          'نمای هفته یا ماه را باز کنید و ظرفیت آزاد روزها را ببینید.',
          'روز موردنظر را انتخاب کنید.',
          '«افزودن ورزشکار به این روز» را بزنید.',
          'ورزشکار را انتخاب کنید؛ مربی و سانسِ ثابت او خودکار می‌آیند.',
          'در صورت نیاز سانس را عوض کنید — جای آزاد هر سانس کنارش نوشته شده.',
        ],
        notes: [
          'یک مربی در یک سانس بیش از یک نوبت نمی‌گیرد.',
          'سقف نوبت هم‌زمان کل باشگاه و سقف روزانهٔ هر مربی هر دو بررسی می‌شوند.',
          'نوبت در تاریخ گذشته ثبت نمی‌شود.',
        ],
      },
      {
        term: 'تنظیم برنامهٔ تمرینی',
        detail: 'مربی، منوی «برنامه».',
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
        term: 'ثبت و تکمیل جلسه',
        detail: 'مربی، منوی «امروز».',
        steps: [
          'هنگام رسیدن ورزشکار «ثبت ورود» را بزنید.',
          'در پایان تمرین «اتمام» را بزنید تا جلسه تکمیل شود.',
        ],
        notes: [
          'با تکمیل جلسه، یک جلسه از بستهٔ ورزشکار کم و دستمزد مربی اضافه می‌شود.',
          'جلسهٔ لغوشده، ورزشکارِ بدون اعتبار و بستهٔ منقضی تکمیل نمی‌شوند.',
        ],
      },
      {
        term: 'تمدید بسته',
        detail: 'مدیر باشگاه، پروندهٔ ورزشکار.',
        steps: [
          'پروندهٔ ورزشکار را باز کنید و «تمدید بسته» را بزنید.',
          'بستهٔ تازه را انتخاب کنید و مبلغ و پرداخت را وارد کنید.',
          'تاریخ انقضای تازه را از تقویم بگذارید.',
        ],
        notes: [
          'جلسه‌های استفاده‌نشده از بین نمی‌روند و روی بستهٔ تازه اضافه می‌شوند.',
          'مبلغ تازه به حساب قبلی اضافه می‌شود، جایگزینش نمی‌شود.',
          'ورزشکاری که هنوز بستهٔ اول را ندارد تمدید نمی‌شود؛ اول بسته تعیین شود.',
        ],
      },
      {
        term: 'گزارش‌گیری',
        detail: 'مدیر باشگاه، منوی «گزارش‌ها».',
        steps: [
          'بازه را انتخاب کنید: روز، هفته یا ماه.',
          'با «قبلی» و «بعدی» در زمان جابه‌جا شوید.',
          'فیلتر شخص را بگذارید: کل باشگاه، یک مربی، یا یک ورزشکار.',
        ],
        notes: ['نرخ حضور از جلسات تکمیل‌شده نسبت به نوبت‌های لغونشده حساب می‌شود.'],
      },
    ],
  },
  {
    id: 'rules',
    title: 'قواعدی که سامانه اعمال می‌کند',
    intro: 'این قواعد در سرور بررسی می‌شوند، پس دور زدنشان از مرورگر ممکن نیست.',
    items: [
      { term: 'ظرفیت سانس', detail: 'سقف نوبت هم‌زمان باشگاه در هر سانس، و سقف روزانهٔ هر مربی.' },
      { term: 'تداخل مربی', detail: 'یک مربی در یک ساعت فقط یک ورزشکار دارد.' },
      { term: 'نوبت تکراری', detail: 'یک ورزشکار در یک ساعت دو نوبت نمی‌گیرد.' },
      { term: 'بستهٔ منتظر تعیین', detail: 'ورزشکاری که مربی ساخته تا تعیین بسته توسط مدیر رزرو ندارد.' },
      { term: 'اعتبار و انقضا', detail: 'جلسه‌ای که اعتبار ندارد یا بسته‌اش منقضی شده تکمیل نمی‌شود.' },
      { term: 'تعارض منافع', detail: 'مربی نمی‌تواند نوبت خودش را به خودش بدهد و دستمزد بگیرد.' },
      { term: 'جداسازی باشگاه‌ها', detail: 'هیچ باشگاهی دادهٔ باشگاه دیگر را نمی‌بیند و تغییر نمی‌دهد.' },
      { term: 'تغییر رمز اجباری', detail: 'حساب تازه یا رمزِ بازنشانده‌شده، پیش از دسترسی به داده باید رمز را عوض کند.' },
      { term: 'باطل شدن نشست', detail: 'با تغییر رمز یا غیرفعال‌سازی، نشست‌های باز همان حساب از کار می‌افتند.' },
    ],
  },
];

const en: HelpSection[] = [
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
      {
        term: 'One person, several roles',
        detail: 'Someone can be a trainer and an athlete at once — a functional trainer training under the yoga trainer, say.',
        steps: [
          'In the new athlete form, enter that person’s mobile number.',
          'The app recognises them and offers to add the role instead of refusing the number.',
          'Pick their trainer and package, then submit.',
          'They sign in with the same login and switch roles from the account menu.',
        ],
        notes: ['A trainer cannot be their own coach; their training goes under someone else.'],
      },
    ],
  },
  {
    id: 'menus',
    title: 'Menus and what they do',
    intro: 'The menu names in each workspace and the job each one does.',
    items: [
      { term: 'Operations dashboard (owner)', detail: 'Today at the gym: capacity, running sessions, packages about to run out, money collected.' },
      { term: 'Schedule (owner)', detail: 'Free capacity by week or month, each day’s sessions hour by hour, and adding athletes to a day.' },
      { term: 'Members and packages (owner)', detail: 'The athlete list with sessions left, debt, and each athlete’s record.' },
      { term: 'Trainers and settlement (owner)', detail: 'Trainers, their rate per session, completed sessions and what they are owed.' },
      { term: 'Finance (owner)', detail: 'Money collected, owed by members, and owed to trainers.' },
      { term: 'Reports (owner)', detail: 'A day, week or month, filtered to the whole gym, one trainer or one athlete.' },
      { term: 'Gym settings (owner)', detail: 'Capacity, hours and general gym configuration.' },
      { term: 'Today (trainer)', detail: 'This trainer’s athletes and slots for today, with check-in and completion.' },
      { term: 'Athletes (trainer)', detail: 'The athletes whose default trainer is this trainer.' },
      { term: 'Programs (trainer)', detail: 'Building and publishing a weekly program sized by the athlete’s remaining sessions.' },
      { term: 'Exercises (trainer)', detail: 'The gym’s 413-exercise catalog plus this gym’s custom movements.' },
      { term: 'Calendar and history (trainer)', detail: 'Monthly view of bookings, and completed sessions with pay calculated.' },
      { term: 'Home, sessions, workouts, history (athlete)', detail: 'Sessions left, next booking, the published program and attendance history.' },
    ],
  },
  {
    id: 'sop',
    title: 'Standard procedures',
    intro: 'The right order to do things. Each procedure starts where its data is ready.',
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
        term: 'Adding a trainer',
        detail: 'Gym owner, under trainers.',
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
        detail: 'Gym owner, under members and packages.',
        steps: [
          'Open the new athlete form and enter name, number and password.',
          'Choose the default trainer.',
          'Set the fixed attendance hour; bookings will default to that slot.',
          'Pick a package — sessions and expiry fill in automatically.',
          'Enter the price and anything paid now; the difference is recorded as debt.',
        ],
        notes: ['An athlete created by a trainer cannot be booked until the owner sets a package.'],
      },
      {
        term: 'Booking a session',
        detail: 'Gym owner, from the schedule or the new booking button.',
        steps: [
          'Open the week or month view and look at free capacity.',
          'Select the day.',
          'Use "add athlete to this day".',
          'Pick the athlete; their trainer and fixed slot come along.',
          'Change the slot if needed — free places are shown next to each one.',
        ],
        notes: [
          'A trainer takes only one booking per slot.',
          'Both the gym’s per-slot limit and the trainer’s daily limit are checked.',
          'A session cannot be booked in the past.',
        ],
      },
      {
        term: 'Building a training program',
        detail: 'Trainer, under programs.',
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
        term: 'Running and completing a session',
        detail: 'Trainer, under today.',
        steps: ['Check the athlete in when they arrive.', 'Finish the session when training ends.'],
        notes: [
          'Completing deducts one session from the package and credits the trainer’s pay.',
          'Cancelled sessions, athletes with no credit and expired packages cannot be completed.',
        ],
      },
      {
        term: 'Renewing a package',
        detail: 'Gym owner, from the athlete’s record.',
        steps: [
          'Open the athlete and choose renew.',
          'Pick the new package and enter price and payment.',
          'Set the new expiry date from the calendar.',
        ],
        notes: [
          'Unused sessions are not lost — they carry over onto the new package.',
          'The new price is added to the existing balance, not substituted for it.',
          'An athlete without a first package cannot be renewed; set the package instead.',
        ],
      },
      {
        term: 'Reporting',
        detail: 'Gym owner, under reports.',
        steps: [
          'Choose a day, week or month.',
          'Move through time with previous and next.',
          'Filter by the whole gym, one trainer or one athlete.',
        ],
        notes: ['Attendance is completed sessions over bookings that were not cancelled.'],
      },
    ],
  },
  {
    id: 'rules',
    title: 'Rules the system enforces',
    intro: 'These are checked on the server, so they cannot be bypassed from the browser.',
    items: [
      { term: 'Slot capacity', detail: 'The gym’s limit on concurrent bookings, and each trainer’s daily limit.' },
      { term: 'Trainer clash', detail: 'A trainer has one athlete per hour.' },
      { term: 'Duplicate booking', detail: 'An athlete cannot hold two bookings in the same hour.' },
      { term: 'Package pending', detail: 'An athlete created by a trainer cannot be booked until the owner sets a package.' },
      { term: 'Credit and expiry', detail: 'A session cannot be completed without credit or with an expired package.' },
      { term: 'Conflict of interest', detail: 'A trainer cannot book themselves and earn the session fee.' },
      { term: 'Gym isolation', detail: 'No gym can see or change another gym’s data.' },
      { term: 'Forced password change', detail: 'A new or reset account must change its password before reaching any data.' },
      { term: 'Session invalidation', detail: 'Changing a password or deactivating an account ends that account’s open sessions.' },
    ],
  },
];

export const HELP_CONTENT = { fa, en };
