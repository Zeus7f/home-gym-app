/**
 * src/lib/i18n/calendar.ts
 * Strings for the shared Jalali month calendar.
 */

export { PERSIAN_MONTH_NAMES_EN, PERSIAN_WEEK_DAYS_SHORT_EN } from '../date/jalali';

export const calendarDict = {
  en: {
    today: 'Today',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    monthLabel: '{month} {year}',
    selected: 'Selected: {date}',
    legendSession: 'Has sessions',
    legendFull: 'At capacity',
    legendFree: 'Free day',
    legendVisited: 'Attended',
    legendBooked: 'Booked',
    sessionsCount: '{count} sessions',
    goToToday: 'Today',
  },
  fa: {
    today: 'امروز',
    prevMonth: 'ماه قبل',
    nextMonth: 'ماه بعد',
    monthLabel: '{month} {year}',
    selected: 'انتخاب: {date}',
    legendSession: 'دارای برنامه',
    legendFull: 'تکمیل ظرفیت',
    legendFree: 'روز خالی',
    legendVisited: 'مراجعه‌شده',
    legendBooked: 'رزرو‌شده',
    sessionsCount: '{count} جلسه',
    goToToday: 'امروز',
  },
};

