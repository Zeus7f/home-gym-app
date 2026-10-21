/**
 * src/lib/i18n/common.ts
 * Labels shared by every role: units, session statuses, generic actions,
 * and the strings produced by the notification engine.
 */

export const commonDict = {
  en: {
    units: {
      session: 'session',
      sessions: 'sessions',
      kg: 'kg',
      reps: 'reps',
      set: 'set',
      sets: 'sets',
      second: 'sec',
      toman: 'Toman',
      minutes: 'min',
    },
    sessionStatus: {
      done: 'Completed',
      live: 'In progress',
      wait: 'Awaiting check-in',
      cancel: 'Cancelled',
      noshow: 'No show',
    },
    actions: {
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      loading: 'Loading...',
      retry: 'Try again',
      back: 'Back',
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      all: 'All',
      none: 'None',
      chooseOption: 'Choose an option',
      yes: 'Yes',
      no: 'No',
    },
    trainer: 'Trainer',
    member: 'Member',
    /** پیام‌هایی که از لایهٔ استور برمی‌گردند و در رابط کاربری نمایش داده می‌شوند */
    storeMessages: {
      'login.success': 'Signed in successfully.',
      'login.userNotFound': 'That username was not found.',
      'login.badPassword': 'Incorrect password.',
      'session.notFound': 'That slot was not found.',
      'session.memberOrTrainerNotFound': 'Athlete or trainer not found.',
      'session.capacityFull':
        "{trainer}'s capacity is full for {date} (max {capacity} slots).",
      'session.scheduled': 'The session was added to the schedule.',
      'session.alreadyCompleted':
        'This session was already completed and was not deducted again.',
      'session.completed':
        'Session completed. 1 session deducted. Balance: {remaining} sessions.',
      'session.alreadyCancelled': 'This slot was already cancelled.',
      'session.completedNotChangeable':
        'This session is completed and can no longer be changed.',
      'session.futureReschedule':
        'Future slots can only be rescheduled by the gym owner.',
      'session.futureCancel': 'Future slots can only be cancelled by the gym owner.',
      'session.tooSoon':
        'Less than 4 hours until the slot starts. Please contact the trainer directly.',
      'session.timeTaken':
        '{time} is already booked for {member} with {trainer}.',
      'session.rescheduled': 'Your slot moved from {oldTime} to {newTime}.',
      'session.cancelled': 'Your slot was cancelled. No session credit was deducted.',
      'session.duplicateSlot':
        '{member} already has a slot at {time}.',
      'session.slotAdded': 'Slot at {time} booked for {member}.',
      'program.notFound': 'Program not found.',
      'program.noDays': 'A program with no days or exercises cannot be published.',
      'program.emptyDay': 'Every day of the program needs at least one exercise.',
      'program.published': 'Program "{title}" published for {member}.',
      'program.unpublished': 'The program was returned to draft.',
      'payment.invalidAmount': 'The payment amount must be greater than zero.',
      'session.adjustTooLow':
        'The total cannot be lower than the number of sessions already used.',
    },
    notifications: {
      title: 'Notifications',
      empty: 'No notifications',
      emptyHint: 'Everything is up to date.',
      lowBalance: {
        title: 'Package balance is running low',
        body: 'Only {remaining} of {total} sessions left in your package.',
      },
      packageExhausted: {
        title: 'Your package has run out',
        body: 'There are no sessions left in your package. Contact the gym owner to continue training.',
      },
      expiringPackage: {
        title: 'Your package is about to expire',
        bodyToday: 'Your training package expires today. Contact the gym owner to renew it.',
        bodyDays: '{days} days left before your training package expires.',
      },
      upcomingSession: {
        title: 'Your session today',
        body: 'Today at {time} with {trainer}',
        liveTitle: 'Your session is in progress',
        liveBody: 'With {trainer} in the {time} slot',
      },
      sessionCancelled: {
        title: 'Your session was cancelled',
        body: 'Your {time} slot with {trainer} was cancelled. No session credit was deducted.',
      },
      programPublished: {
        title: 'A new training program was published for you',
        body: '{trainer} published the program "{title}" with {count} exercises for you.',
      },
      sessionCompleted: {
        title: 'Session in progress',
        body: '{members}',
      },
      sessionsWaiting: {
        title: "Today's upcoming slots",
        body: '{members}',
      },
      trainerLowBalance: {
        title: 'Athlete with a low balance',
        body: '{members}',
      },
      draftProgram: {
        title: 'Unpublished draft program',
        body: '{titles}',
      },
      ownerLowBalance: {
        title: 'Member balances are running low',
        body: '{members}',
      },
      ownerExpiring: {
        title: 'Packages expiring soon',
        body: '{members}',
      },
      paymentDue: {
        title: 'Outstanding member balances',
        body: '{count} members owe {total} Toman in total.',
      },
      trainerPayoutDue: {
        title: 'Outstanding trainer compensation',
        body: '{count} trainers are owed {total} Toman in total.',
      },
      noShow: {
        title: 'No-shows in past sessions',
        body: '{members}',
      },
    },
  },
  fa: {
    units: {
      session: 'جلسه',
      sessions: 'جلسه',
      kg: 'کیلوگرم',
      reps: 'تکرار',
      set: 'ست',
      sets: 'ست',
      second: 'ثانیه',
      toman: 'تومان',
      minutes: 'دقیقه',
    },
    sessionStatus: {
      done: 'تکمیل شد',
      live: 'در حال تمرین',
      wait: 'در انتظار ورود',
      cancel: 'لغو شده',
      noshow: 'غیبت',
    },
    actions: {
      cancel: 'انصراف',
      confirm: 'تایید',
      close: 'بستن',
      save: 'ذخیره',
      delete: 'حذف',
      edit: 'ویرایش',
      search: 'جستجو',
      loading: 'در حال بارگذاری...',
      retry: 'تلاش دوباره',
      back: 'بازگشت',
      today: 'امروز',
      yesterday: 'دیروز',
      tomorrow: 'فردا',
      all: 'همه',
      none: 'هیچ',
      chooseOption: 'انتخاب گزینه',
      yes: 'بله',
      no: 'خیر',
    },
    trainer: 'مربی',
    member: 'ورزشکار',
    /** پیام‌هایی که از لایهٔ استور برمی‌گردند و در رابط کاربری نمایش داده می‌شوند */
    storeMessages: {
      'login.success': 'ورود با موفقیت انجام شد.',
      'login.userNotFound': 'نام کاربری وارد شده یافت نشد.',
      'login.badPassword': 'کلمه عبور وارد شده نادرست است.',
      'session.notFound': 'نوبت موردنظر یافت نشد.',
      'session.memberOrTrainerNotFound': 'ورزشکار یا مربی یافت نشد.',
      'session.capacityFull':
        'ظرفیت مربی {trainer} برای تاریخ {date} تکمیل است (حداکثر {capacity} نفر).',
      'session.scheduled': 'جلسه با موفقیت در تقویم ثبت شد.',
      'session.alreadyCompleted':
        'این جلسه قبلاً با موفقیت تکمیل شده و جلسه‌ای مجدداً کسر نگردید.',
      'session.completed':
        'جلسه با موفقیت تکمیل شد. ۱ جلسه از بسته کسر گردید. مانده فعلی: {remaining} جلسه.',
      'session.alreadyCancelled': 'این نوبت قبلاً لغو شده است.',
      'session.completedNotChangeable': 'این جلسه تکمیل شده و قابل تغییر نیست.',
      'session.futureReschedule':
        'تغییر ساعت نوبت‌های آینده از طریق مدیر باشگاه انجام می‌شود.',
      'session.futureCancel': 'لغو نوبت‌های آینده از طریق مدیر باشگاه انجام می‌شود.',
      'session.tooSoon':
        'کمتر از ۴ ساعت تا شروع سانس باقی مانده است. لطفاً مستقیماً با مربی تماس بگیرید.',
      'session.timeTaken':
        'ساعت {time} برای {trainer} قبلاً به {member} اختصاص داده شده است.',
      'session.rescheduled': 'ساعت نوبت شما از {oldTime} به {newTime} تغییر کرد.',
      'session.cancelled': 'نوبت شما لغو شد. اعتبار جلسه کسر نشد.',
      'session.duplicateSlot': 'برای {member} در ساعت {time} نوبتی ثبت شده است.',
      'session.slotAdded': 'سانس ساعت {time} برای {member} ثبت شد.',
      'program.notFound': 'برنامه یافت نشد.',
      'program.noDays': 'برنامه بدون روز و حرکت قابل انتشار نیست.',
      'program.emptyDay': 'همه روزهای برنامه باید حداقل یک حرکت داشته باشند.',
      'program.published': 'برنامه «{title}» برای {member} منتشر شد.',
      'program.unpublished': 'برنامه به وضعیت پیش‌نویس بازگشت.',
      'payment.invalidAmount': 'مبلغ پرداختی باید بیشتر از صفر باشد.',
      'session.adjustTooLow':
        'مجموع جلسات نمی‌تواند کمتر از تعداد جلسات استفاده‌شده باشد.',
    },
    notifications: {
      title: 'اعلان‌ها',
      empty: 'اعلانی ندارید',
      emptyHint: 'همه چیز به‌روز است.',
      lowBalance: {
        title: 'اعتبار بسته رو به اتمام است',
        body: 'تنها {remaining} جلسه از {total} جلسه بسته شما باقی مانده است.',
      },
      packageExhausted: {
        title: 'بسته شما تمام شده است',
        body: 'هیچ جلسه باقیمانده‌ای در بسته شما نیست. برای ادامه تمرین با مدیر باشگاه تماس بگیرید.',
      },
      expiringPackage: {
        title: 'بسته تمرینی شما به زودی منقضی می‌شود',
        bodyToday: 'بسته تمرینی شما امروز منقضی می‌شود. برای تمدید با مدیر باشگاه تماس بگیرید.',
        bodyDays: '{days} روز تا انقضای بسته تمرینی باقی مانده است.',
      },
      upcomingSession: {
        title: 'نوبت جلسه امروز شما',
        body: 'امروز ساعت {time} با {trainer}',
        liveTitle: 'جلسه شما در حال برگزاری است',
        liveBody: 'با {trainer} در سانس ساعت {time}',
      },
      sessionCancelled: {
        title: 'نوبت شما لغو شد',
        body: 'نوبت ساعت {time} با {trainer} لغو شد. اعتبار جلسه کسر نشده است.',
      },
      programPublished: {
        title: 'برنامه تمرینی جدید برای شما منتشر شد',
        body: '{trainer} برنامه «{title}» با {count} حرکت برای شما ثبت کرد.',
      },
      sessionCompleted: {
        title: 'جلسه در حال برگزاری',
        body: '{members}',
      },
      sessionsWaiting: {
        title: 'سانس‌های در انتظار امروز',
        body: '{members}',
      },
      trainerLowBalance: {
        title: 'ورزشکار با اعتبار رو به اتمام',
        body: '{members}',
      },
      draftProgram: {
        title: 'برنامه پیش‌نویس منتشر نشده',
        body: '{titles}',
      },
      ownerLowBalance: {
        title: 'اعتبار اعضا رو به اتمام است',
        body: '{members}',
      },
      ownerExpiring: {
        title: 'بسته‌های در شرف انقضا',
        body: '{members}',
      },
      paymentDue: {
        title: 'بهدهی باز اعضا',
        body: '{count} عضو مجموعاً {total} تومان بدهکار هستند.',
      },
      trainerPayoutDue: {
        title: 'مانده دستمزد مربیان',
        body: '{count} مربی مجموعاً {total} تومان طلب دارند.',
      },
      noShow: {
        title: 'غیبت در جلسات گذشته',
        body: '{members}',
      },
    },
  },
};
