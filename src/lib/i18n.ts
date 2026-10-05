// Bilingual Dictionary (English & Persian) for Gym Management Operating Model

export type Language = 'en' | 'fa';

export const translations = {
  en: {
    appName: 'HomeGym Ops',
    appBadge: 'Gym Management',
    appSubtitle: 'Operational System for Gym Owners & Trainers',
    roles: {
      owner: 'Gym Owner',
      trainer: 'Trainer',
      member: 'Member'
    },
    nav: {
      owner: {
        dashboard: 'Dashboard',
        members: 'Members',
        trainers: 'Trainers',
        schedule: 'Schedule',
        finance: 'Finance',
        reports: 'Reports',
        settings: 'Settings'
      },
      trainer: {
        today: "Today's Workload",
        members: 'My Members',
        history: 'Training History',
        exercises: 'Exercise Catalog'
      },
      member: {
        home: 'Home',
        sessions: 'My Sessions',
        exercises: 'My Exercises',
        history: 'History'
      }
    },
    dashboard: {
      title: "Today's Gym Operations",
      subtitle: 'Real-time overview of attendance, trainer capacity, and daily sessions',
      gymCapacity: 'Gym Capacity',
      currentOccupancy: 'Current Occupancy',
      todayMembers: "Today's Members",
      checkedIn: 'Checked In',
      remainingToday: 'Remaining Today',
      activeTrainers: 'Active Trainers',
      availableTrainers: 'Available Trainers',
      sessionsUsed: 'Sessions Completed Today',
      sessionsRemaining: 'Active Sessions Remaining',
      lowBalanceAlert: 'Members with Low Session Balance (<= 2 left)',
      quickActions: 'Quick Operations',
      addMember: '+ Add Member',
      addTrainer: '+ Add Trainer',
      addSession: '+ Schedule Session',
      viewFinance: 'Review Finances'
    },
    members: {
      title: 'Member Roster & Packages',
      subtitle: 'Manage memberships, remaining session counts, and payment balances',
      searchPlaceholder: 'Search member by name or phone...',
      addMemberBtn: '+ Add New Member',
      name: 'Member Name',
      phone: 'Phone',
      trainer: 'Assigned Trainer',
      package: 'Package',
      remaining: 'Remaining Sessions',
      paid: 'Paid Amount',
      balance: 'Outstanding Balance',
      status: 'Status',
      actions: 'Actions',
      active: 'Active',
      inactive: 'Inactive',
      lowBalance: 'Low Balance',
      recordPayment: 'Record Payment',
      adjustSessions: 'Adjust Balance',
      changeTrainer: 'Change Trainer'
    },
    trainers: {
      title: 'Trainer Management & Compensation',
      subtitle: 'Monitor working capacity, completed sessions, and payouts',
      addTrainerBtn: '+ Add New Trainer',
      searchPlaceholder: 'Search trainers...',
      name: 'Trainer Name',
      specialty: 'Specialty',
      dailyCapacity: 'Daily Capacity',
      sessionRate: 'Rate / Session',
      completedToday: 'Completed Today',
      totalCompleted: 'Total Completed',
      earned: 'Calculated Earnings',
      paid: 'Paid Out',
      outstanding: 'Outstanding Compensation',
      recordPayout: 'Record Payout',
      setHours: 'Set Working Hours'
    },
    schedule: {
      title: "Today's Training Schedule",
      subtitle: 'Manage daily arrivals, flexible reassignments, and attendance check-in',
      date: 'Today',
      addSessionBtn: '+ Add Member to Today',
      timeSlot: 'Time',
      member: 'Member',
      trainer: 'Trainer',
      status: 'Status',
      actions: 'Actions',
      scheduled: 'Scheduled',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      noShow: 'No Show',
      checkIn: 'Check In',
      start: 'Start Session',
      finish: 'Finish Session',
      cancel: 'Cancel',
      reassignTrainer: 'Move Trainer (Today Only)',
      dailyOverrideBadge: 'Daily Override'
    },
    finance: {
      title: 'Operational Financials',
      subtitle: 'Track member payments, outstanding balances, and trainer payouts',
      filterAll: 'All',
      filterPaid: 'Paid',
      filterOutstanding: 'Has Outstanding Balance',
      filterLowBalance: 'Low Sessions (<=2)',
      totalRevenue: 'Total Package Revenue',
      totalPaid: 'Collected Payments',
      totalOutstanding: 'Outstanding Receivables',
      totalTrainerComp: 'Trainer Compensation Owed',
      memberPayments: 'Member Payment Ledger',
      trainerPayouts: 'Trainer Compensation Ledger'
    },
    reports: {
      title: 'Operational Reports',
      subtitle: 'Clear daily and weekly summaries without bloated analytics',
      tabDailyOps: 'Daily Operations',
      tabDailyExercises: 'Daily Exercise Report',
      tabTrainerComp: 'Trainer Compensation Report',
      tabWeekly: 'Weekly Summary',
      dailyOpsTitle: 'Daily Operations Summary',
      dailyExerciseTitle: 'Daily Exercise Log: "Who Did What With Whom Today?"',
      trainerCompTitle: 'Trainer Compensation Breakdown',
      memberHeader: 'Member',
      trainerHeader: 'Trainer',
      exercisesHeader: 'Exercises Performed',
      statusHeader: 'Session Status',
      completedCount: 'Completed Sessions',
      rateHeader: 'Rate',
      grossHeader: 'Gross Compensation',
      paidHeader: 'Paid',
      balanceHeader: 'Balance Owed'
    },
    trainerConsole: {
      title: "Today's Training Console",
      capacityBadge: 'Workload Capacity',
      addMemberToday: '+ Add Member to Today',
      openMember: 'Open Session',
      statusInSession: 'Currently Training',
      sessionReady: 'Ready for Check-In',
      sessionDone: 'Completed',
      activeSessionTitle: 'Active Training Session',
      addExerciseBtn: '+ Add Exercise',
      completeSessionBtn: 'Complete Session & Deduct 1 Credit',
      exerciseSearch: 'Search exercise catalog...',
      sets: 'Sets',
      reps: 'Reps',
      weight: 'Weight (kg)',
      notes: 'Notes',
      saveAndComplete: 'Finish & Confirm (Atomic Deduction)',
      historyTab: 'Member History'
    },
    memberConsole: {
      greeting: 'Welcome back',
      remainingSessionsBadge: 'Remaining Sessions',
      packageNotice: 'Sessions update automatically upon confirmed completion',
      todayWorkout: "Today's Completed Exercises",
      noWorkoutToday: 'No session logged yet today.',
      weeklyTitle: 'Weekly Activity',
      historyTitle: 'Training Session History',
      totalVisits: 'Total Gym Visits'
    },
    userJourney: {
      button: 'Tour & User Journey',
      title: 'Interactive Gym Management Walkthrough',
      subtitle: 'Understand how the owner, trainers, and members interact in 5 simple steps',
      stepBadge: 'Step',
      jumpToRole: 'Go to this Screen',
      next: 'Next',
      prev: 'Previous',
      close: 'Close',
      steps: [
        {
          title: '1. Owner Dashboard & Capacity',
          role: 'owner' as const,
          description: 'The owner opens the dashboard to instantly answer: "How full is the gym today? Who is checked in? How many trainers are available?"',
          keyRule: 'Rule: Daily capacity (e.g. 24/30) gives immediate operational awareness with zero clutter.'
        },
        {
          title: '2. Member Packages & Session Balance',
          role: 'owner' as const,
          description: 'Every member has a package (e.g. 12 sessions). The formula is strictly: remaining_sessions = total_sessions - used_sessions. Remaining balances update only when a session is finished.',
          keyRule: 'Rule: Adding a member to the daily schedule does NOT consume a session. Cancellation = 0 deduction.'
        },
        {
          title: '3. Flexible Daily Trainer Assignment',
          role: 'owner' as const,
          description: 'Reza default trainer is Ali. If Ali has reached his capacity of 6 members, the owner can move Reza to Sara for today only without changing Reza permanent assignment.',
          keyRule: 'Rule: Daily override applies only to the current day; tomorrow Reza automatically returns to Ali.'
        },
        {
          title: '4. Trainer Logs Exercises with Animated GIFs',
          role: 'trainer' as const,
          description: 'Trainer Ali opens Reza with one click, taps "+ Add Exercise" (e.g. Bench Press), checks the animated demonstration GIF directly on the card, logs 3 sets x 10 reps @ 40kg, and hits "Complete Session".',
          keyRule: 'Rule: Atomic completion: Reza used_sessions +1, Ali completed_sessions +1, trainer earnings +150,000.'
        },
        {
          title: '5. Financials & Operational Daily Reports',
          role: 'owner' as const,
          description: 'The owner views the Daily Exercise Report ("Which member did what exercise with which trainer?") and monitors who owes money and how much each trainer has earned.',
          keyRule: 'Rule: Operational financial tracking (payments and trainer compensation) without bloated accounting journals.'
        }
      ]
    }
  },
  fa: {
    appName: 'مدیریت باشگاه هوم‌جیم',
    appBadge: 'سامانه عملیاتی باشگاه',
    appSubtitle: 'مدیریت سریع، ساده و کاربردی برای مدیر باشگاه و مربیان',
    roles: {
      owner: 'مدیر باشگاه',
      trainer: 'مربی',
      member: 'ورزشکار'
    },
    nav: {
      owner: {
        dashboard: 'داشبورد عملیات',
        members: 'اعضا و بسته‌ها',
        trainers: 'مربیان و تسویه',
        schedule: 'برنامه و حضور غیاب',
        finance: 'مالی و پرداخت‌ها',
        reports: 'گزارش‌های روزانه',
        settings: 'تنظیمات باشگاه'
      },
      trainer: {
        today: 'اعضای امروز من',
        members: 'ورزشکاران تحت نظر',
        history: 'سوابق تمرینات',
        exercises: 'کاتالوگ تمرینات'
      },
      member: {
        home: 'صفحه اصلی',
        sessions: 'جلسات من',
        exercises: 'تمرینات امروز',
        history: 'سوابق ورزشی'
      }
    },
    dashboard: {
      title: 'داشبورد عملیات امروز باشگاه',
      subtitle: 'وضعیت لحظه‌ای اعضا، حضور و غیاب، ظرفیت باشگاه و مربیان فعال',
      gymCapacity: 'ظرفیت کل باشگاه',
      currentOccupancy: 'تکمیل ظرفیت امروز',
      todayMembers: 'ورزشکاران امروز',
      checkedIn: 'حاضر شده (ورود زده)',
      remainingToday: 'در انتظار مراجعه',
      activeTrainers: 'مربیان شاغل امروز',
      availableTrainers: 'مربیان آماده پذیرش',
      sessionsUsed: 'جلسات تکمیل‌شده امروز',
      sessionsRemaining: 'کل جلسات فعال باقیمانده',
      lowBalanceAlert: 'اعضای با مانده جلسه اندک (۲ جلسه یا کمتر)',
      quickActions: 'عملیات سریع',
      addMember: '+ ثبت عضو جدید',
      addTrainer: '+ ثبت مربی جدید',
      addSession: '+ نوبت‌دهی امروز',
      viewFinance: 'بررسی مالی و تسویه'
    },
    members: {
      title: 'فهرست ورزشکاران و بسته‌ها',
      subtitle: 'مدیریت اعتبار جلسات، مربی پیش‌فرض، مبالغ پرداختی و مانده حساب',
      searchPlaceholder: 'جستجوی عضو با نام یا شماره تماس...',
      addMemberBtn: '+ ثبت عضو جدید',
      name: 'نام ورزشکار',
      phone: 'شماره تماس',
      trainer: 'مربی تخصیص‌یافته',
      package: 'نوع بسته',
      remaining: 'مانده جلسات',
      paid: 'مبلغ پرداختی',
      balance: 'بدهی / مانده',
      status: 'وضعیت',
      actions: 'عملیات',
      active: 'فعال',
      inactive: 'غیرفعال',
      lowBalance: 'جلسات رو به اتمام',
      recordPayment: 'ثبت پرداخت',
      adjustSessions: 'اصلاح مانده جلسات',
      changeTrainer: 'تغییر مربی دائم'
    },
    trainers: {
      title: 'مدیریت مربیان و دستمزد',
      subtitle: 'پایش سقف پذیرش روزانه، جلسات انجام‌شده و تسویه‌حساب',
      addTrainerBtn: '+ ثبت مربی جدید',
      searchPlaceholder: 'جستجوی مربی...',
      name: 'نام مربی',
      specialty: 'تخصص',
      dailyCapacity: 'ظرفیت روزانه',
      sessionRate: 'تعرفه هر جلسه',
      completedToday: 'انجام‌شده امروز',
      totalCompleted: 'کل جلسات موفق',
      earned: 'کل کارکرد محاسبه‌شده',
      paid: 'مبلغ واریزشده',
      outstanding: 'مانده طلب مربی',
      recordPayout: 'ثبت واریز دستمزد',
      setHours: 'تنظیم ساعت کاری'
    },
    schedule: {
      title: 'برنامه تمرینی و حضور و غیاب روزانه',
      subtitle: 'مدیریت ساعت ورود ورزشکاران، جابجایی سریع بین مربیان و ثبت اتمام جلسه',
      date: 'برنامه امروز',
      addSessionBtn: '+ افزودن ورزشکار به امروز',
      timeSlot: 'ساعت',
      member: 'ورزشکار',
      trainer: 'مربی مسئول',
      status: 'وضعیت',
      actions: 'عملیات',
      scheduled: 'در انتظار ورود',
      inProgress: 'در حال تمرین',
      completed: 'تکمیل شده',
      cancelled: 'لغو شده',
      noShow: 'غیبت',
      checkIn: 'ثبت ورود (حضور)',
      start: 'شروع تمرین',
      finish: 'اتمام و کسر جلسه',
      cancel: 'لغو نوبت',
      reassignTrainer: 'انتقال به مربی دیگر (فقط امروز)',
      dailyOverrideBadge: 'جابجایی روزانه'
    },
    finance: {
      title: 'امور مالی و دریافت/پرداخت',
      subtitle: 'ردیابی سریع اینکه چه کسی پرداخت کرده، چه کسی بدهکار است و مربیان چقدر طلبکارند',
      filterAll: 'همه اعضا',
      filterPaid: 'تسویه‌شده',
      filterOutstanding: 'دارای بدهی',
      filterLowBalance: 'جلسات رو به اتمام (<=۲)',
      totalRevenue: 'کل فروش بسته‌ها',
      totalPaid: 'کل دریافتی از اعضا',
      totalOutstanding: 'کل مطالبات از اعضا',
      totalTrainerComp: 'کل بدهی به مربیان',
      memberPayments: 'سوابق پرداختی اعضا',
      trainerPayouts: 'سوابق واریز به مربیان'
    },
    reports: {
      title: 'گزارش‌های عملیاتی باشگاه',
      subtitle: 'گزارش‌های شفاف روزانه بدون پیچیدگی و آمارهای گیج‌کننده',
      tabDailyOps: 'عملیات روزانه',
      tabDailyExercises: 'گزارش تمرینات روزانه',
      tabTrainerComp: 'گزارش دستمزد مربیان',
      tabWeekly: 'خلاصه هفتگی',
      dailyOpsTitle: 'خلاصه عملیات و حضور و غیاب امروز',
      dailyExerciseTitle: 'گزارش تمرینات: "امروز کدام ورزشکار چه تمریناتی با کدام مربی انجام داد؟"',
      trainerCompTitle: 'محاسبه کارکرد و طلب مربیان',
      memberHeader: 'ورزشکار',
      trainerHeader: 'مربی',
      exercisesHeader: 'تمرینات ثبت‌شده همراه با رکورد',
      statusHeader: 'وضعیت جلسه',
      completedCount: 'جلسات انجام‌شده',
      rateHeader: 'تعرفه جلسه',
      grossHeader: 'مجموع کارکرد',
      paidHeader: 'پرداخت‌شده',
      balanceHeader: 'مانده طلب'
    },
    trainerConsole: {
      title: 'کنسول تمرینی مربی',
      capacityBadge: 'ظرفیت پذیرش امروز',
      addMemberToday: '+ افزودن ورزشکار به امروز',
      openMember: 'ورود به جلسه تمرین',
      statusInSession: 'در حال تمرین',
      sessionReady: 'منتظر ورود',
      sessionDone: 'تکمیل شد',
      activeSessionTitle: 'جلسه تمرینی جاری',
      addExerciseBtn: '+ افزودن حرکت تمرینی',
      completeSessionBtn: 'اتمام جلسه و ثبت قطعی کسر ۱ جلسه',
      exerciseSearch: 'جستجوی نام حرکت یا عضله...',
      sets: 'ست‌ها',
      reps: 'تکرار',
      weight: 'وزنه (kg)',
      notes: 'یادداشت',
      saveAndComplete: 'اتمام تمرین و کسر ۱ جلسه (تراکنش قطعی)',
      historyTab: 'سوابق تمرینی ورزشکار'
    },
    memberConsole: {
      greeting: 'ورزشکار گرامی، خوش آمدید',
      remainingSessionsBadge: 'جلسات باقیمانده از بسته',
      packageNotice: 'کسر جلسه بلافاصله پس از اتمام تمرین توسط مربی اعمال می‌شود',
      todayWorkout: 'تمرینات انجام‌شده امروز شما',
      noWorkoutToday: 'امروز هنوز جلسه‌ای برای شما ثبت نهایی نشده است.',
      weeklyTitle: 'فعالیت هفتگی شما',
      historyTitle: 'تاریخچه جلسات و حرکات انجام‌شده',
      totalVisits: 'کل دفعات مراجعه به باشگاه'
    },
    userJourney: {
      button: 'راهنمای تعاملی مسیر برنامه',
      title: 'راهنمای تعاملی چرخه کارکرد سامانه هوم‌جیم',
      subtitle: 'آشنایی با نحوه تعامل مدیر، مربیان و ورزشکاران در ۵ گام ساده',
      stepBadge: 'گام',
      jumpToRole: 'رفتن به این بخش',
      next: 'گام بعدی',
      prev: 'گام قبلی',
      close: 'بستن راهنما',
      steps: [
        {
          title: '۱. داشبورد و ظرفیت روزانه باشگاه',
          role: 'owner' as const,
          description: 'مدیر باشگاه با یک نگاه پاسخ می‌گیرد: "امروز باشگاه چقدر پر است؟ چه کسانی حاضر شده‌اند؟ چند مربی فعالند؟"',
          keyRule: 'قانون: ظرفیت باشگاه (مثلاً ۱۸ از ۳۰ نفر) اشراف لحظه‌ای بدون گزارش‌های پیچیده فراهم می‌کند.'
        },
        {
          title: '۲. بسته‌ها و مانده جلسات ورزشکاران',
          role: 'owner' as const,
          description: 'فرمول مانده جلسات بسیار ساده است: مانده = کل جلسات - جلسات استفاده‌شده. جلسه تنها زمانی کم می‌شود که تمرین تمام شده باشد.',
          keyRule: 'قانون: افزودن ورزشکار به نوبت‌های امروز یا لغو نوبت به هیچ عنوان اعتباری کم نمی‌کند.'
        },
        {
          title: '۳. جابجایی منعطف روزانه بین مربیان',
          role: 'owner' as const,
          description: 'مربی پیش‌فرض رضا، علی است. اگر علی امروز به سقف ظرفیت خود (۶ نفر) رسیده باشد، مدیر می‌تواند رضا را فقط برای امروز به سارا بسپارد.',
          keyRule: 'قانون: جابجایی روزانه به مربی پیش‌فرض عضو دست نمی‌زند و فردا مجدداً مربی رضا همان علی خواهد بود.'
        },
        {
          title: '۴. ثبت حرکات با گیف متحرک توسط مربی',
          role: 'trainer' as const,
          description: 'مربی با یک کلیک عضو را باز کرده، حرکت پرس سینه را همراه با گیف متحرک نحوه اجرا می‌بیند، ست‌ها و وزنه را ثبت و دکمه اتمام را می‌زند.',
          keyRule: 'قانون تراکنش: همزمان مانده ورزشکار ۱ عدد کم شده، تعداد جلسات مربی ۱ عدد اضافه و دستمزدش محاسبه می‌شود.'
        },
        {
          title: '۵. امور مالی و گزارش روزانه تمرینات',
          role: 'owner' as const,
          description: 'مدیر باشگاه در صفحه مالی می‌بیند چه کسی بدهکار است، چقدر به مربیان بدهکار است و در گزارش تمرینات می‌بیند امروز دقیقا چه حرکاتی انجام شده است.',
          keyRule: 'قانون: گزارش شفاف روزانه بر اساس نیازهای واقعی سالن بدنسازی بدون پیچیدگی‌های حسابداری ثقیل.'
        }
      ]
    }
  }
};
