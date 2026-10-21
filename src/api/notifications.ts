/**
 * src/api/notifications.ts
 * Notification API — components import ONLY from here.
 * Notifications are derived from live store data, never stored.
 */

import { gymStore } from './_client';
import {
  buildNotifications,
  type AppNotification,
  type NotificationLabels,
} from '../lib/domain/notifications';
import { getTodayJalaliKey } from '../lib/date/jalali';
import { translations, type Language } from '../lib/i18n';

/**
 * اعلان‌های نقش‌محور برای کاربر واردشده.
 *
 * برچسب‌های متنی از فرهنگ لغت زبان فعال تزریق می‌شوند تا موتور خالص
 * دامنه به زبان وابسته نباشد.
 */
export async function getNotifications(lang: Language = 'fa'): Promise<AppNotification[]> {
  return buildNotifications({
    currentUser: gymStore.currentUser,
    members: gymStore.members,
    trainers: gymStore.trainers,
    todaySessions: gymStore.todaySessions,
    pastSessions: gymStore.pastSessions,
    programs: gymStore.programs,
    todayKey: getTodayJalaliKey(),
    labels: translations[lang].notifications as NotificationLabels,
  });
}

export type { AppNotification, NotificationSeverity, NotificationKind } from '../lib/domain/notifications';
