// Pure Domain Logic: Session change policy
// Rules for when a member may still move or cancel their own appointment.

/**
 * حداقل فاصله (ساعت) بین زمان فعلی و شروع سانس که هنوز اجازهٔ
 * تغییر ساعت یا لغو نوبت توسط خود ورزشکار را می‌دهد.
 */
export const RESCHEDULE_CUTOFF_HOURS = 4;

/**
 * آیا سانس در بازهٔ ممنوعه (کمتر از cutoffHours ساعت تا شروع) قرار دارد؟
 *
 * @param sessionTime  ساعت سانس به فرمت "HH:MM"
 * @param now          زمان مرجع (قابل تزریق برای تست)
 * @param cutoffHours  حداقل فاصله مجاز به ساعت
 */
export function isWithinCutoff(
  sessionTime: string,
  now: Date,
  cutoffHours: number = RESCHEDULE_CUTOFF_HOURS
): boolean {
  const [h, m] = sessionTime.split(':').map(Number);
  const sessionMinutes = (h || 0) * 60 + (m || 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return sessionMinutes - nowMinutes < cutoffHours * 60;
}
