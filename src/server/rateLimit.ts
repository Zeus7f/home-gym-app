/**
 * محدودکنندهٔ ساده در حافظه (پنجرهٔ ثابت) — برای جلوگیری از حدس رمز روی /api/auth/login.
 * برای چند نمونهٔ سرور پشت load balancer باید با Redis جایگزین شود.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private limit: number,
    private windowMs: number
  ) {}

  private entry(key: string) {
    const now = Date.now();
    let e = this.hits.get(key);
    if (!e || e.resetAt <= now) {
      e = { count: 0, resetAt: now + this.windowMs };
      this.hits.set(key, e);
    }
    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k);
    }
    return e;
  }

  blocked(key: string): boolean {
    return this.entry(key).count >= this.limit;
  }

  hit(key: string) {
    this.entry(key).count += 1;
  }

  reset(key: string) {
    this.hits.delete(key);
  }
}
