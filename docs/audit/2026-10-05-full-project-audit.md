# گزارش بررسی کامل پروژه — Home Gym App V.1

**تاریخ:** ۱۴ مهر ۱۴۰۵ (2026-10-05)
**دامنه:** کل ۳۰ فایل `src/` + `server.ts` + ۴ migration Supabase + بیلد `dist/`
**نوع بازبینی:** ممیزی معماری، امنیت، درستکاری داده، دسترس‌پذیری و تجربه کاربری

---

## خلاصه وضعیت

`tsc --noEmit` و `vite build` پاس می‌شوند و ۱۳ تست دامنه سبز است. اما این یک **پروتوتایپ با لباس استک تولیدی** است:

- سه بک‌اند رقیب که هیچ‌کدام در runtime در دسترس نیستند
- حدود ۳.۶٪ پوشش تست، بدون فریم‌ورک و بدون CI
- بدون git (۹۳۰۰ خط کار با یک `rm` از بین می‌رود)
- یک دیتابیس زنده با کلید anon روی دیسک که جداول مالی و کاربرانش برای همه باز است

**مقیاس:** ۹٬۳۰۸ خط در ۳۰ فایل TypeScript/TSX
**یافته‌ها:** ۶ امنیتی بحرانی · ۶ مشکل معماری بک‌اند · ۴۱ مشکل فرانت‌اند

---

## فهرست یافته‌ها

| کد | یافته | شدت |
|---|---|---|
| [S1](#s1) | جدول `app_users` و جداول مالی با `anon` کاملاً باز | بحرانی |
| [S2](#s2) | جداول migration 0003 اصلاً RLS ندارند | بحرانی |
| [S3](#s3) | کلید واقعی Supabase روی دیسک و داخل باندل | بحرانی |
| [S4](#s4) | ورود plaintext با رمز سراسری `'123'` | بحرانی |
| [S5](#s5) | کلید Firebase در سورس، بدون rules | بحرانی |
| [S6](#s6) | سرور Express بدون middleware امنیتی | بحرانی |
| [A1](#a1) | سه مدل داده رقیب و متداخل | بحرانی |
| [A2](#a2) | کل بک‌اند در runtime غیرقابل‌دسترس است | بحرانی |
| [A3](#a3) | `firebase` + `firebase-admin`: ۷۰MB نصب، ۰ بایت باندل | بالا |
| [A4](#a4) | ناسازگاری نام role بین لایه‌ها | بالا |
| [A5](#a5) | RPC `complete_workout` روی schema دیگری کار می‌کند | بالا |
| [A6](#a6) | بدهی فنی ~۴۸MB با صفر import | بالا |
| [A7](#a7) | `strict` در TypeScript خاموش است | متوسط |
| [F1](#f1) | دو دکمه اصلی کاملاً مرده‌اند | بحرانی |
| [F2](#f2) | صفر ماندگاری — هر F5 همه‌چیز را پاک می‌کند | بحرانی |
| [F3](#f3) | اپ پیش‌فرض لوگین‌شده به‌عنوان Owner باز می‌شود | بحرانی |
| [F4](#f4) | «تنظیم موجودی» پیش‌فرض ۲ جلسه هدیه می‌دهد | بحرانی |
| [F5](#f5) | هیچ حالت loading/error/empty واقعی وجود ندارد | بحرانی |
| [F6](#f6) | هیچ لایه state وجود ندارد | بالا |
| [F7](#f7) | state اشتقاقی به state تبدیل شده (باگ درِپ) | بالا |
| [F8](#f8) | تایمرها پاک نمی‌شوند | متوسط |
| [F9](#f9) | نقش، state کپی است نه مشتق | متوسط |
| [F10](#f10) | تمام state در تعویض نقش نابود می‌شود | متوسط |
| [F11](#f11) | Supabase نیمه‌وصل و خلاف واقع | بالا |
| [F12](#f12) | منفی بودن پرداخت دفتر مالی را خراب می‌کند | بالا |
| [F13](#f13) | تقسیم بر صفر → `NaN%` | بالا |
| [F14](#f14) | داشبورد ظرفیت per-date را نادیده می‌گیرد | متوسط |
| [F15](#f15) | هیچ Audit trail ای نمایش داده نمی‌شود | متوسط |
| [F16](#f16) | تب Finance استامپ است | متوسط |
| [F17](#f17) | اعضای جدید هرگز نمی‌توانند لاگین کنند | متوسط |
| [F18](#f18) | رمز جدید به‌صورت `type="text"` | متوسط |
| [F19](#f19) | ۲۸۰ شرط سه‌تایی، دیکشنری دور زده شده | بالا |
| [F20](#f20) | ۶۳ کلید دیکشنری مرده | بالا |
| [F21](#f21) | لایه داده پیام فارسی تولید می‌کند | بالا |
| [F22](#f22) | دو سیستم رقم هم‌زمان | بالا |
| [F23](#f23) | RTL دلبخواهی | بالا |
| [F24](#f24) | تاریخ انقضای هاردکد و منقضی‌شده | متوسط |
| [F25](#f25) | صفر ARIA، صفر role، صفر `onKeyDown` | بالا |
| [F26](#f26) | ۴۶ `<label>` و صفر `htmlFor` | بالا |
| [F27](#f27) | دکمه‌های آیکونی فقط `title` دارند | بالا |
| [F28](#f28) | هدف لمسی زیر ۴۴px | بالا |
| [F29](#f29) | zoom غیرفعال و متن بسیار ریز | بالا |
| [F30](#f30) | تضاد رنگ نامطلوب | بالا |
| [F31](#f31) | فوکوس نامرئی | متوسط |
| [F32](#f32) | `tokens.css` تزئینی است | بالا |
| [F33](#f33) | هیچ primitive مشترک UI وجود ندارد | بالا |
| [F34](#f34) | انیمیشن‌های مرده | متوسط |
| [F35](#f35) | ادیتور تمرین ۲۴۰ خط تکراری | بالا |
| [F36](#f36) | پوشش تست ۳.۶٪ بدون فریم‌ورک | بالا |
| [F37](#f37) | `npm run lint` فقط `tsc --noEmit` است | متوسط |
| [F38](#f38) | پروژه اصلاً git repo نیست | بحرانی |
| [F39](#f39) | README متعلق به اپ دیگری است | متوسط |
| [F40](#f40) | `.env.example` متغیرهای اشتباه | متوسط |
| [F41](#f41) | بدون deploy config و build تکرارپذیر | متوسط |

---

# بخش ۱ — BACKEND

## امنیت

### S1. جدول `app_users` (شامل `password_hash`) و جداول مالی با `anon` کاملاً باز

`supabase/full_schema_setup.sql:147-179`

همه سیاست‌ها به این شکل نوشته شده‌اند:

```sql
CREATE POLICY "Public access for app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);
```

دو ایراد:
1. **`USING (true)`** یعنی هر کسی هر ردیفی را می‌خواند/می‌نویسد
2. **بدون کلاس `TO`** — پس به `PUBLIC` می‌چسبد که `anon` را هم شامل می‌شود

**جداول در معرض:** `app_users` (شامل `password_hash` و `role`)، `financial_records`، `audit_logs`، `members` (شماره تلفن ورزشکاران)، `trainers`، `gyms`، `exercises`، `daily_sessions`، `session_exercises`.

سیاست‌های دقیق و tenant-aware در `supabase/migrations/20260921000001_rls_policies.sql` برای **مجموعه‌ای کاملاً متفاوت و بدون هم‌پوشانی** از جداول نوشته شده‌اند.

**راه‌حل:** هر سیاست را با `TO authenticated` محدود کنید و predicate واقعی tenant بگذارید. `full_schema_setup.sql` را به‌عنوان فایل خصمانه حذف کنید.

---

### S2. جداول migration 0003 اصلاً RLS ندارند

`supabase/migrations/20260921000003_gym_management_refactor.sql`

این migration جداول زیر را می‌سازد و هیچ `ENABLE ROW LEVEL SECURITY` یا `CREATE POLICY` ندارد:

`gyms` · `trainers` · `members` · `daily_sessions` · `session_exercises` · `payments` · `trainer_payments`

یعنی اگر فقط migration‌ها را اجرا کنی، همین جداول هم باز می‌مانند. (RLS غیرفعال یعنی grantهای پیش‌فرض `anon` در Supabase اعمال می‌شود که روی schema `public` تمام است.)

**راه‌حل:** روی هر ۷ جدول `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + سیاست، یا حداقل `REVOKE ALL FROM anon`.

---

### S3. کلید واقعی Supabase روی دیسک و داخل باندل

`.env:2-4` — کلید JWT واقعی + `sb_publishable__…` برای پروژه `avpjfdkuqrglrmcscaso`.

چون `VITE_` prefix دارد، Vite آن را داخل JS اینلین می‌کند. تأیید:

```
$ grep -o "sb_publishable__[A-Za-z0-9_-]*" dist/assets/*.js
sb_publishable__-xQaYUB-NyYj9Bjmu4dkA_0_MB-WCD
```

ترکیب S1+S2 یعنی این کلید = دسترسی کامل خواندن/نوشتن روی یک دیتابیس زنده.

**راه‌حل:** همین حالا هر دو کلید را rotate کنید. سپس تمام دسترسی DB را از پشت سرور proxy کنید تا هیچ کلیدی به کلاینت نرسد.

---

### S4. ورود رمز عبور به‌صورت plaintext با رمز سراسری `'123'`

`src/lib/supabase/mockStore.ts:1210-1223`

```ts
if (user.password !== password.trim()) { ... }
```

۷ حساب نمونه با `password: '123'` در `mockStore.ts:1107-1167`. `LoginScreen.tsx:145-184` هم آن‌ها را روی صفحه با یک‌کلیک autofill می‌گذارد. این تنها مسیر ورودِ کارآمد اپ است.

**راه‌حل:** تا قبل از پیاده‌سازی auth واقعی، دمو را پشت `import.meta.env.DEV` قفل کنید.

---

### S5. کلید Firebase در سورس

`firebase-applet-config.json:4` — `AIzaSyDiihJgGEwjMr97NLkvLWjLUZlQ6qNGKxw` برای پروژه `plucky-inverter-pt8c4`.

شدت کمتر از S3 چون کلیدهای وب Firebase ذاتاً عمومی و با Security Rules محدود می‌شوند — **اما هیچ فایل `firestore.rules` یا `storage.rules` در ریپو وجود ندارد**، پس هیچ‌چیزی آن را محدود نمی‌کند.

**راه‌حل:** کلید را در Google Cloud Console محدود کنید؛ اگر Firebase بماند، فایل rules اضافه کنید.

---

### S6. سرور Express بدون middleware امنیتی

`server.ts:11-14` فقط `express.json()` + `cookieParser()`:

- بدون `helmet` یا CSP
- بدون rate limiting روی `/api/auth/sync`
- بدون error handler مرکزی (هر مسیر `catch` خودش را دارد)
- `app.listen(PORT, "0.0.0.0")` روی همه اینترفیس‌ها

---

## معماری

### A1. سه مدل داده رقیب و متداخل

| جدول | `full_schema_setup.sql` | `migrations/` | `src/db/schema.ts` (Drizzle) |
|---|---|---|---|
| `gyms`, `exercises` | ✅ | — | ✅ **تعارض** |
| `member_subscriptions`, `workout_sessions`, `workout_segments` | — | ✅ | ✅ **تعارض** |
| `members`, `trainers` | ✅ | ✅ (در 0003) | — |
| **جدول کاربر** | `app_users` | `profiles` | `users` |

- سه نام مختلف برای جدول کاربر
- دو جدول یکسان (`workout_sessions`، `exercises`، ...) با ستون‌های متفاوت، تعریف‌شده در دو جا
- `gym_id` (SQL) در برابر `gymId` (Drizzle) در برابر `tenant_id` (migrations)

**هیچ منبع حقیقت واحدی وجود ندارد.**

**راه‌حل:** یکی را canonical کنید و دو تای دیگر را حذف کنید.

---

### A2. کل بک‌اند در runtime غیرقابل‌دسترس است

`src/components/AuthProvider.tsx` — که **تنها `fetch()` به API در کل اپ** را در خط 46 دارد — **هیچ‌جا import یا mount نمی‌شود**.

```
$ grep -rn "AuthProvider" src
src/components/AuthProvider.tsx:3:  import { auth, ... } from '../lib/firebase';
src/components/AuthProvider.tsx:35: export const AuthProvider = ...
```

`App.tsx:44` مستقیم `<LoginScreen>` را رندر می‌کند بدون هیچ provider.

**نتیجه:** `server.ts`، Drizzle، `pg`، `firebase-admin` و ۵ از ۶ مسیر API همه dead code هستند. تأیید بیشتر:

```
$ grep -c "firebase" dist/assets/*.js
0
```

---

### A3. `firebase` + `firebase-admin` = ~۷۰MB نصب‌شده، ۰ بایت در باندل

فقط توسط `AuthProvider` یتیم import می‌شود، پس tree-shake و کاملاً حذف می‌شود.

**راه‌حل:** در صورت تصمیم بر Supabase-first، حذف کنید.

---

### A4. ناسازگاری نام role بین لایه‌ها

| لایه | مقادیر role |
|---|---|
| `mockStore` (فرانت) | `'owner'` \| `'trainer'` \| `'member'` |
| `server.ts:57,68` | `requireRole(["gym_owner"])` |
| `src/db/schema.ts:17` | `'super_admin' \| 'gym_owner' \| 'trainer' \| 'member'` |

حتی اگر `AuthProvider` وصل شود، `requireRole` **همیشه** 403 می‌دهد.

---

### A5. RPC `complete_workout` روی schema دیگری کار می‌کند

`supabase/migrations/20260921000002_complete_workout_rpc.sql`

به `private.current_tenant_id()` و جداول `member_subscriptions` متعلق به migration `0000` وابسته است، ولی `0003` جدول‌ها را دوباره با ساختار دیگری می‌سازد و `workout_sessions` را هم دوباره تعریف می‌کند.

**نکته مثبت:** منطق این RPC (قفل `FOR UPDATE`، idempotency guard، دفتر immutable) طراحی درستی دارد و ارزش حفظ کردن دارد.

---

### A6. بدهی فنی ~۴۸MB

| بسته | حجم | وضعیت |
|---|---|---|
| `date-fns` | ۲۶MB | صفر import — با `lib/date/jalali.ts` دست‌ساز جایگزین شده |
| `@google/genai` | ۲۰MB | صفر import — بازمانده Google AI Studio |
| `tailwind-merge` | ۱MB | صفر import |
| `motion` | ۷۷۲KB | صفر import (۲ تطابق grep فقط متن «range of motion» است) |
| `clsx` | ۴۰KB | صفر import |

واقعاً استفاده‌شده: `react`، `react-dom`، `lucide-react`، `canvas-confetti`، `dotenv`، `@tailwindcss/vite`، `@vitejs/plugin-react`

`src/db/drizzle.config.ts` هم یتیم است — هیچ‌جا import نمی‌شود.

---

### A7. `strict` در TypeScript خاموش است

`tsconfig.json` نه `strict` دارد، نه `noImplicitAny`، نه `noUnusedLocals`، نه `noUnusedParameters`، نه `noUncheckedIndexedAccess`.

نتیجه: «۰ خطا» سیگنال ضعیفی است. کد پر از unchecked index access و `any` است — مثلاً `server.ts:39` و `mockStore.ts:1786`.

**راه‌حل:** `"strict": true` را روشن کنید و انتظار بروز تعداد خطای واقعی داشته باشید. **تدریجی fix کنید، نه در یک commit.**

---

# بخش ۲ — FRONTEND

## بلاکرهای درستکاری

### F1. دو دکمه اصلی کاملاً مرده‌اند

**تأیید مستقیم با grep:**

```
$ rg -n "showPayoutModal" src
src/features/owner/OwnerWorkspace.tsx:86:  const [showPayoutModal, setShowPayoutModal] = useState<string | null>(null);
```

`setShowPayoutModal(tr.id)` در `OwnerWorkspace.tsx:694` صدا زده می‌شود، ولی **هیچ بلوک `{showPayoutModal && ...}` در فایل وجود ندارد**.

```
$ rg -n "showAddSession" src
src/features/owner/OwnerWorkspace.tsx:84:  const [showAddSession, setShowAddSession] = useState(false);
```

`setShowAddSession(true)` در `OwnerWorkspace.tsx:744` صدا زده می‌شود، بدون بلوک رندر. `mockStore.addSessionToToday` (`mockStore.ts:1465`) از هیچ کامپوننتی صدا زده نمی‌شود.

**نتیجه:**

| قابلیت | وضعیت |
|---|---|
| پرداخت دستمزد مربی | **غیرممکن** از UI |
| ساخت جلسه توسط مالک | **غیرممکن** |
| افزودن مربی | **هیچ UI‌ای وجود ندارد** (`showAddTrainer` در `:83` هرگز set نمی‌شود) |

**راه‌حل:** دو مودال گم‌شده را بسازید و مودال «افزودن مربی» را به فرم وصل کنید.

---

### F2. صفر ماندگاری — هر F5 همه‌چیز را پاک می‌کند

در کل اپ فقط ۲ کلید localStorage وجود دارد:

- `hg_lang` — `App.tsx:17, 29`
- `hg_theme` — `ThemeToggle.tsx:8, 24`

هر پرداخت، تکمیل جلسه، تمرین سفارشی، تغییر رمز و override ظرفیت بی‌بازگشت است.

**راه‌حل:** `GymStore` را در بوت از localStorage یا Supabase هیدراته کنید و روی `notify()` با debounce بنویسید.

---

### F3. اپ به‌صورت پیش‌فرض لوگین‌شده به‌عنوان Owner باز می‌شود

`mockStore.ts:1189` → `currentUser = INITIAL_USERS[0]`

یعنی شرط `App.tsx:42` در بارگذاری اول **هرگز** صفحه Login را نشان نمی‌دهد. صفحه Login فقط بعد از logout قابل‌دسترس است.

**راه‌حل:** `currentUser = null` + session ماندگار در `sessionStorage`.

---

### F4. «تنظیم موجودی» پیش‌فرض ۲ جلسه هدیه می‌دهد

`OwnerWorkspace.tsx:101` → `useState(2)`
`OwnerWorkspace.tsx:600` → هر بار باز شدن مودال: `setAdjustDelta(2)`

سریع‌ترین مسیر «اعمال» = دو جلسه رایگان. دلتاهای منفی هم بی‌حدند و در `mockStore.ts:1581-1586` می‌توانند `totalSessions < usedSessions` بسازند.

**راه‌حل:** پیش‌فرض `0`، نیاز به علامت صریح، کلمپ `totalSessions >= usedSessions`، و دلیل الزامی.

---

### F5. هیچ حالت loading/error/empty واقعی وجود ندارد

- تنها «loading» یک `setTimeout(200)` جعلی در لاگین (`LoginScreen.tsx:17, 31-37`)
- تنها UI خطا `alert()` (`TrainerWorkspace.tsx:152, 175`) و `window.confirm()` (`OwnerWorkspace.tsx:212`)
- حتی `alert("SESSION_NOT_FOUND")` به کاربر نشان داده می‌شود — کد داخلی که از `mockStore.ts:1357, 1370` پرتاب می‌شود
- مودال افزودن تمرین می‌تواند خطای hardcoded فارسی را به کاربر انگلیسی‌زبان نشان دهد (`mockStore.ts:1215`)

---

## معماری فرانت‌اند

### F6. هیچ لایه state وجود ندارد

یک singleton قابل‌mutable با ۱۸۶۵ خط (`mockStore.ts:1176-1865`) که در زمان import نمونه‌سازی می‌شود (`:1857-1865`) و `syncWithSupabase()` همان‌جا fire-and-forget اجرا می‌شود.

**re-render با تایر کهنه:**

```ts
const [, setTick] = useState(0);
```

در ۴ جا: `App.tsx:19`، `OwnerWorkspace.tsx:48`، `TrainerWorkspace.tsx:45`، `MemberWorkspace.tsx:31`

**ناسازگاری topology:** `OwnerWorkspace` اصلاً subscribe نشده — فقط چون والدش (`App`) render می‌شود کار می‌کند. بعد خودش ۱۵ بار دستی `setTick` می‌زند (`:143, 149, 155, 161, 167, 206, 214, 268, 800, 861, 940, 952, 973, 1461, 1744`) → **رندر دوبل** و یک coupling پنهان.

**بزرگ‌ترین کامپوننت ۳۰ `useState` دارد:** `OwnerWorkspace.tsx:47-105`

---

### F7. state اشتقاقی به state تبدیل شده (باگ درِپ)

`PersianCalendar.tsx:31-35` مقدار prop `selectedDate` را یک‌بار در `useState` کپی می‌کند و **هرگز دوباره sync نمی‌کند**. هر تغییر برنامه‌ای تاریخ (مثلاً «برو به امروز») grid را روی ماه اشتباه نگه می‌دارد.

---

### F8. تایمرها پاک نمی‌شوند

→ نشت حافظه و cancel شدن متقابل toastها

`OwnerWorkspace.tsx:174, 208, 216, 240, 270, 799, 1743` · `TrainerWorkspace.tsx:215-220` · `LoginScreen.tsx:31`

---

### F9. نقش، state کپی است نه مشتق

`App.tsx:14` (`useState`) + `App.tsx:35-39` (sync در effect) → بعد از لاگین یک فریم workspace کاربر قبلی با مجوز session جدید رندر می‌شود.

**راه‌حل:** `const activeRole = currentUser.role` — state و effect را حذف کنید.

---

### F10. تمام state در تعویض نقش نابود می‌شود

`App.tsx:199-201` — به دلیل conditional render، `activeTab`، همه مودال‌ها، فیلترها و تمرین در حال ویرایش هر بار owner→trainer→owner از بین می‌روند. هیچ routerی وجود ندارد.

---

### F11. Supabase نیمه‌وصل و خلاف واقع

- فقط جدول `exercises` نوشته می‌شود (`mockStore.ts:1676-1769`)
- بقیه فقط در boot خوانده می‌شوند (`:1779-1854`)
- **هیچ خطایی نمایش داده نمی‌شود** — فقط `if (!exErr && exData)` بررسی می‌شود، پس خطای RLS دقیقاً شبیه دیتابیس خالی به نظر می‌رسد
- `isSupabaseConnected` در `mockStore.ts:1777` هاردکد `false` است → نشان سبز «دیتابیس ابری متصل» در `App.tsx:65-73` **هرگز رندر نمی‌شود**

---

## درستکاری مالی و داده

### F12. منفی بودن پرداخت پذیرفته می‌شود و دفتر مالی را خراب می‌کند

`OwnerWorkspace.tsx:1567-1572` — ورودی مبلغ هیچ `min` یا اعتبارسنجی ندارد (پیش‌فرض `4000000` در `:99`)
`mockStore.ts:1549-1565` — مقدار خام به `paidAmount` اضافه و یک ردیف منفی در دفتر نوشته می‌شود

خروجی در `OwnerWorkspace.tsx:1345-1347` به شکل `+-2,000,000` رندر می‌شود.

**راه‌حل:** `min={1}`، رد مقدار `> outstandingBalance` مگر صریحاً مجاز، و فرمت صحیح منفی.

---

### F13. تقسیم بر صفر → `NaN%` و عرض CSS نامعتبر

ورودی ظرفیت `0` را قبول می‌کند (`Number('') === 0`) و در `mockStore.ts:1273, 1288` راحت ذخیره می‌شود. فیلد ظرفیت باشگاه اصلاً `min` ندارد.

تقسیم در `OwnerWorkspace.tsx:871-873` و `:1373` · `TrainerWorkspace.tsx:113`

**راه‌حل:** اعتبارسنجی هنگام commit (`Math.max(1, n)`) و گارد در رندر: `capacity > 0 ? … : '—'`

---

### F14. داشبورد ظرفیت per-date را نادیده می‌گیرد

`OwnerWorkspace.tsx:121-122` و `:1373` از `gym.capacity` سراسری استفاده می‌کنند، ولی تب Schedule یک override مخصوص هر تاریخ می‌نویسد (`:713` از `getGymDailyCapacity(selectedScheduleDate)`).

**نتیجه:** نقش‌ها درباره «ظرفیت پر است» با هم اختلاف دارند — کنسول مربی از override استفاده می‌کند (`TrainerWorkspace.tsx:109`) ولی داشبورد مالک نه.

---

### F15. هیچ Audit trail ای نمایش داده نمی‌شود

`mockStore.ts:1390-1398, 1567-1575, 1598-1606, 1642-1650` — همه اکشن‌های حساس (از جمله reset رمز) `AuditLog` می‌نویسند.

**صفر ارجاع از هر `.tsx`.**

---

### F16. تب Finance استامپ است

داده موجود در store: `trainerPayouts`، `sessionAdjustments`، `auditLogs` (`mockStore.ts:1061-1080, 1184, 1185`)
کلیدهای موجود در i18n: `filterAll`/`filterPaid`/`filterOutstanding`/`filterLowBalance`، `trainerPayouts`، و یک گزارش کامل دستمزد مربی

**هیچ‌کدام رندر نمی‌شوند.** ضمناً `OwnerWorkspace.tsx:1308-1311` مجموع *قیمت قراردادها* را «کل فروش بسته‌ها / Total Package Revenue» صدا می‌زند — این پول دریافتی نیست (کارت بعدی درست `totalPaid` را نشان می‌دهد).

**راه‌حل:** سه دفتر + چهار فیلتر را رندر کنید و کارت را به «Total Contracted Value» تغییر نام دهید.

---

### F17. اعضای جدید هرگز نمی‌توانند لاگین کنند

`createUserAccount` (`mockStore.ts:1255-1264`) از هیچ‌جا صدا زده نمی‌شود و فرم «افزودن عضو» (`OwnerWorkspace.tsx:1471-1557`) فیلد نام‌کاربری یا رمز ندارد.

---

### F18. رمز جدید به‌صورت `type="text"`

`OwnerWorkspace.tsx:1713-1719` — رمز در حال تایپ به‌صورت متن کرم روی صفحه نمایش داده می‌شود. پیش‌فرض `'123'` (`:78`) و دکمه reset هم `'123'` را پیش‌پر می‌کند (`:1058-1067`).

---

## بین‌المللی‌سازی و RTL

### F19. ۲۸۰ شرط سه‌تایی inline، دیکشنری دور زده شده

| فایل | تعداد |
|---|---|
| `OwnerWorkspace.tsx` | ۱۰۴ |
| `TrainerWorkspace.tsx` | ۱۰۰ |
| `MemberWorkspace.tsx` | ۵۲ |
| `LoginScreen.tsx` | ۱۶ |
| `App.tsx` | ۸ |

`MemberWorkspace.tsx:3` و `TrainerWorkspace.tsx:3` `translations` را import می‌کنند ولی **هرگز استفاده نمی‌کنند**.

---

### F20. ۶۳ کلید دیکشنری مرده

از جمله **کل بخش‌های `trainerConsole` و `memberConsole`** (`i18n.ts:151-179, 368-396`) — متن نوشته شده ولی UI هرگز وصل نشده.

همچنین: `filterAll/filterPaid/filterOutstanding/trainerPayouts/tab*/trainerCompTitle/*Header` (`i18n.ts:120-129, 134-137, 144-149, 337-340, 351-354, 362-366`)

---

### F21. لایه داده پیام فارسی تولید می‌کند که در UI انگلیسی خام نمایش داده می‌شود

`mockStore.ts:1215, 1218, 1318, 1325, 1345, 1365, 1405`
نمایش در `LoginScreen.tsx:35` و `TrainerWorkspace.tsx:150, 175`

**راه‌حل:** لایه داده i18n key + params برگرداند، mapping در لایه view. هرگز کد داخلی را به کاربر پرتاب نکنید.

---

### F22. دو سیستم رقم هم‌زمان

`toLocaleString()` لاتین در کنار تاریخ‌های فارسی:

| محل | نمونه |
|---|---|
| `OwnerWorkspace.tsx:571, 576, 667, 679, 685, 1310, 1316, 1322, 1328, 1346` | اعداد لاتین |
| `TrainerWorkspace.tsx:381, 879` · `MemberWorkspace.tsx:230, 237, 250` | اعداد لاتین |
| `mockStore.ts:1527, 1538, 1561, 1594, 1637` · `OwnerWorkspace.tsx:136` | ارقام فارسی |

**یک لیست پرداخت هم `"1403/06/01"` و هم `"۱۴۰۵/۷/۱۴"` نشان می‌دهد.**

**راه‌حل:** یک `formatCurrency`/`formatNumber`/`formatDate` واحد با `Intl.NumberFormat('fa-IR')`. یکی را انتخاب کنید و همه‌جا استفاده کنید.

---

### F23. RTL دلبخواهی

فقط ۱۵ مورد `rtl:`/`ltr:` در برابر ۱٬۵۵۲ کلاس. مشکلات مشخص:

| محل | مشکل |
|---|---|
| `OwnerWorkspace.tsx:1668` | toast با `fixed bottom-6 left-6` در RTL برعکس می‌شود |
| `TrainerWorkspace.tsx:914` | آیکون جست‌وجو هندل RTL ندارد (`OwnerWorkspace.tsx:1140` درست انجام داده) |
| `MemberWorkspace.tsx:213` | تزئینات `-bottom-16 -right-16` |
| `MemberWorkspace.tsx:325, 628` | `mr-2`, `pr-1` |
| `OwnerWorkspace.tsx:538` | `text-left rtl:text-right` — در RTL بی‌اثر است |

**موارد دیگر:** `PersianCalendar` کاملاً فارسی قفل شده (`dir="rtl"`، نام ماه/روز، legend فارسی، `title` فارسی) حتی در حالت انگلیسی (`:76, 83, 92, 98, 105, 114-123, 170, 187-198`). تاریخ‌های خام داخل UI در کنار نسخه انسانی‌شده نشت می‌کنند (`:888`, `TrainerWorkspace.tsx:563`, `MemberWorkspace.tsx:299`). `TrainerWorkspace.tsx:1028` برچسب فارسی `'(مانده: X جلسه)'` را داخل `<option>` هاردکد کرده که باید انگلیسی هم رندر شود.

**راه‌حل:** ابزارهای منطقی (`ps-`/`pe-`/`ms-`/`me-`/`text-start`/`text-end`) جایگزین همه ابزارهای فیزیکی، و حذف واریانت‌های `rtl:`/`ltr:`.

---

### F24. تاریخ انقضای هاردکد و منقضی‌شده

`OwnerWorkspace.tsx:137` مقدار `'1403/08/30'` را برای **هر** عضو جدید می‌گذارد، در حالی که امروز ۱۴۰۵ است.

**هر عضو جدید قبل از تولدش منقضی می‌شود.**

---

## دسترس‌پذیری

### F25. صفر ARIA، صفر role، صفر `onKeyDown` در کل اپ

```
grep -rE "aria-|role=|tabIndex|onKeyDown|htmlFor" src/**/*.tsx
→ هیچ تطابقی
```

**۱۱ مودال overlay** که همه `<div className="fixed inset-0 …">` ساده هستند:

`OwnerWorkspace.tsx:1472, 1561, 1595, 1632, 1678, 1759` · `TrainerWorkspace.tsx:1004, 1074, 1207` · `MemberWorkspace.tsx:585` · `UserJourneyGuide.tsx:31`

بدون: `role="dialog"` · `aria-modal` · focus trap · Escape-to-close · backdrop-click · scroll lock · بازگرداندن فوکوس

---

### F26. ۴۶ `<label>` و صفر `htmlFor`/`id`

screen reader ورودی‌ها را بی‌برچسب اعلام می‌کند و کلیک روی label فوکوس نمی‌کند.

`OwnerWorkspace.tsx:1477, 1488, 1499, 1512, 1521, 1531, 1566, 1600, 1609, 1642, 1710, 1791, 1805, 1821, 1838, 1857, 1874, 1893, 1907, 1923, 1949, 1962` · `LoginScreen.tsx:97, 113` · `TrainerWorkspace.tsx:1018, 1035, 1090, 1131, 1145, 1159, 1175, 1241, 1271, 1288, 1307, 1324, 1343, 1357, 1373, 1399, 1412`

---

### F27. دکمه‌های آیکونی فقط `title` دارند

بدون `aria-label`، بدون `aria-pressed`:

`App.tsx:156-162` (خروج) · `OwnerWorkspace.tsx:1244-1258` (ویرایش/حذف) · `TrainerWorkspace.tsx:966-972` · `ThemeToggle.tsx:35-67` (سه‌حالته، بدون `aria-pressed`) · `UserJourneyGuide.tsx:44-46` (**بستن، بدون هیچ برچسبی**) · دکمه‌های گلیف `✕` در `OwnerWorkspace.tsx:1687, 1782` و `TrainerWorkspace.tsx:1013, 1085, 1234` · نقطه‌های پیشرفت `UserJourneyGuide.tsx:52-62`

---

### F28. هدف لمسی زیر ۴۴px

`p-1.5` + آیکون ۱۴px ≈ **۲۸×۲۸ پیکسل**

`OwnerWorkspace.tsx:1247, 1255` · `TrainerWorkspace.tsx:969, 748` · سلول‌های تقویم `h-10` (`PersianCalendar.tsx:130, 149`) · `ThemeToggle.tsx:38, 49, 60` · `UserJourneyGuide.tsx:55` (نقطه‌ها `h-2` کلیک‌پذیر)

---

### F29. zoom غیرفعال و متن بسیار ریز

`index.html:5` شامل `user-scalable=no, maximum-scale=1.0` → **نقض WCAG 1.4.4**

**۱۱۰ مورد** `text-[9px]`/`[10px]`/`[11px]` در فایل‌های `.tsx`

---

### F30. تضاد رنگ نامطلوب

| ترکیب | نسبت | نیاز |
|---|---|---|
| `text-slate-400` روی سفید | **۲.۵۶:۱** | ۴.۵:۱ |
| `text-teal-600` (#0D9488) روی سفید | **۳.۶۶:۱** | ۴.۵:۱ |
| `text-rose-500` | **۳.۶۷:۱** | ۴.۵:۱ |

هر سه برای متن ۱۰–۱۲ پیکسلی متادیتا استفاده شده‌اند. نمونه‌ها در `OwnerWorkspace.tsx:75, 399, 441, 556, 1343` و `App.tsx:123, 147`.

---

### F31. فوکوس نامرئی

`focus:outline-none` با حلقه ۱px — و آن هم **فقط در فرم لاگین** (`LoginScreen.tsx:107, 123`). بقیه ورودی‌ها هیچ استایل فوکوسی ندارند.

**راه‌حل:** حلقه `:focus-visible` سراسری در `tokens.css`.

---

### موارد دیگر

- **تب‌ها بدون semantic tab:** `OwnerWorkspace.tsx:276-361` (۸ تب)، `TrainerWorkspace.tsx:409-465` (۴ تب)، `App.tsx:83-119`، `UserJourneyGuide.tsx:52-62` — بدون `role="tablist"`/`aria-selected`، بدون ناوبری با کلید جهت‌دار
- **فرم لاگین:** بدون `autoComplete`/`name`/`id`، بدون نمایش رمز، بدون `role="alert"`، بدون `aria-invalid` (`LoginScreen.tsx:95-136`)
- **`html lang="en"` هاردکد بدون `dir`** (`index.html:2`) → اولین paint انگلیسی/LTR است و بعد فلیپ می‌خورد

---

## سیستم طراحی

### F32. `tokens.css` تزئینی است

| اندازه‌گیری | مقدار |
|---|---|
| کلاس‌های رنگ خام Tailwind | **۱٬۵۵۲** |
| مقادیر hex هاردکد | **۴۶** |
| استفاده از `var(--color-*)` | **۱** |

OwnerWorkspace: ۶۰۰ · TrainerWorkspace: ۴۲۰ · MemberWorkspace: ۲۵۰ · LoginScreen: ۷۷ · App: ۷۲

مثال hex: `dark:bg-[#11151A]` (۳۵ بار)، `dark:bg-[#0B0D10]` (`App.tsx:51`)، `dark:bg-[#07090C]` (`LoginScreen.tsx:48`)

**توکن‌های تعریف‌شده ولی صفر ارجاع:** `--color-brand`، `--color-danger`، `--color-cardio/functional/strength`، تمام `--radius-*`

UI به‌جای آن‌ها از `teal-600` برای brand، `rose-500` برای danger و `rounded-xl`/`rounded-2xl` استفاده می‌کند. دو سطح روشن (`bg-white` + `bg-slate-50`/`slate-100`) و سه سطح تاریک (`#0B0D10`، `#11151A`، `slate-900`، `slate-800`) بدون مدل elevation.

---

### F33. هیچ primitive مشترک UI وجود ندارد

در کل ریپو هیچ `Button`، `Card`، `Modal`، `Table`، `Badge`، `Input`، `Toast`، `EmptyState` یا تابع `cn()` وجود ندارد.

- **۱۱ پوسته مودال کپی‌پیست** شده
- **۸ دکمه تب کپی‌پیست** شده
- کلاس کارت تکراری `bg-white dark:bg-[#11151A] rounded-2xl border … shadow-sm` **۴۶ بار**
- `clsx` و `tailwind-merge` نصب شده‌اند ولی **هرگز import نشده‌اند** — primitive موردنظر `cn()` هرگز ساخته نشد

**راه‌حل:** ۷ primitive + `cn()` بسازید و migrate کنید — این به‌تنهایی حدود ۴۰٪ JSX را حذف می‌کند و هزینه F25/F26/F27 را کم می‌کند.

---

### F34. انیمیشن‌های مرده

`animate-shake` (`LoginScreen.tsx:89`) و `animate-fadeIn` (`TrainerWorkspace.tsx:399`) هیچ `@keyframes` ندارند (grep در `index.css` + `tokens.css` → هیچ). این affordanceها بی‌صدا کار نمی‌کنند.

`animate-bounce` روی toast ۳-۴ ثانیه‌ای (`OwnerWorkspace.tsx:1668`) بلند و حلقوی است.

`prefers-reduced-motion` هم پشتیبانی نمی‌شود.

---

### F35. کد تکراری

| مورد | نسخه‌ها |
|---|---|
| ادیتور تمرین (~۲۴۰ خط) | `OwnerWorkspace.tsx:1757-1997` و `TrainerWorkspace.tsx:1205-1447` — فیلدها، پیام اعتبارسنجی و fallback `onError` یکسان |
| کارت کاتالوگ تمرین | `OwnerWorkspace.tsx:1206-1291` · `TrainerWorkspace.tsx:938-997` · `MemberWorkspace.tsx:629-685` |
| ساخت شمارش جلسه تقویم | `OwnerWorkspace.tsx:719-728` · `TrainerWorkspace.tsx:122-135` · `MemberWorkspace.tsx:89-98` |
| منطق فیلتر | `OwnerWorkspace.tsx:1082-1092` · `TrainerWorkspace.tsx:315-322` |

---

## تست و ابزار

### F36. پوشش تست ۳.۶٪

`domain.test.ts` فقط ۳ ماژول را import می‌کند (`oneRm`، `progression`، `muscleBalance`) = ۳۳۰ خط از ۹٬۲۲۹ خط.

- ۳ از ۲۸ فایل تولیدی (۱۰.۸٪) تست دارد؛ ۸۹.۲٪ هیچ‌کدام
- **بدون تست:** `mockStore.ts` (۱٬۸۶۵ خط — کل لایه داده اپ)، `OwnerWorkspace.tsx` (۲٬۰۰۰)، `TrainerWorkspace.tsx` (۱٬۴۵۰)، `MemberWorkspace.tsx` (۷۰۲)، `i18n.ts` (۴۴۰)، `catalog.ts` (۴۱۴)، `jalali.ts` (۱۹۶)، و حتی `gymManagement.ts` (۱۳۷)

**`run-tests.ts` یک runner دستی ۱۵ خطی است:** `assert` مبتنی بر closure که فقط شمارنده را زیاد می‌کند؛ بدون `describe`/`it`، بدون جداسازی هر case، بدون setup/teardown، **بدون پشتیبانی async**، بدون mock، بدون coverage، بدون watch.

همه ۱۳ assert در یک بدنه تابع هستند، پس اولین استثنا بقیه را حذف می‌کند و به‌عنوان crash گزارش می‌شود نه failure. ضمناً فایل تست بدون پسوند import می‌کند (`'../oneRm'`) در حالی که سورس اپ پسوند صریح `.ts` دارد.

**اولویت تست:** `jalali.ts` (تبدیل جلالی↔میلادی به‌راحتی اشتباه می‌شود و کاملاً بدون تست است)، بعد `mockStore`.

---

### F37. `npm run lint` فقط `tsc --noEmit` است

`package.json:12` → `"lint": "tsc --noEmit"`

هیچ `.eslintrc*`، `eslint.config.js` یا `.prettierrc` وجود ندارد. دقیقاً به همین دلیل وابستگی‌های مرده (A6)، `AuthProvider` یتیم (A2) و `drizzle.config.ts` یتیم دیده نشدند.

**راه‌حل:** ESLint flat config با قانون `unused-imports`؛ اسکریپت typecheck را rename کنید.

---

### F38. پروژه اصلاً git repo نیست

```
$ git rev-parse --is-inside-work-tree
fatal: not a git repository (or any of the parent directories): .git
```

**بدون تاریخچه، بدون rollback، بدون review.** حدود ۹٬۳۰۰ خط کار ذخیره‌نشده، یک `rm` تا نابودی کامل فاصله دارد.

`.gitignore` فقط آرزو است. `dist/` با `server.cjs` + **`server.cjs.map`** (سورس‌مپ سرور — در صورت آپلود، schema کامل سرور را افشا می‌کند) و `.DS_Store` (۱۴٬۳۴۰ بایت) روی دیسک هستند.

---

### F39. README متعلق به اپ دیگری است

متن عیناً Google AI Studio boilerplate: `# Run and deploy your AI Studio app`، اشاره به `ai.studio/apps/9cafcf1b-…` و دستور `Set the GEMINI_API_KEY in .env.local`. هیچ ذکری از پلتفرم باشگاه، Supabase یا Postgres نشده.

---

### F40. `.env.example` متغیرهای اشتباه

فقط `GEMINI_API_KEY` و `APP_URL` دارد. اپ واقعی به این‌ها نیاز دارد:

| متغیر | محل استفاده |
|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase/client.ts:4` |
| `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | `src/lib/supabase/client.ts:5` |
| `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME` | `src/db/index.ts:12-15` |
| Firebase service account | `src/lib/firebase-admin.ts` |

هرکسی طبق example پیش برود، اپ کار نمی‌کند.

---

### F41. بدون deploy config و build تکرارپذیر

- فقط `bun.lock` — هیچ `package-lock.json` → `npm ci` غیرممکن و `npm install` نسخه‌ها را تازه resolve می‌کند
- هیچ `Dockerfile`، `docker-compose.yml`، `Procfile`، `fly.toml`، `render.yaml` یا CI
- `npm start` فرض می‌کند `node dist/server.cjs` در production با `process.cwd()/dist` سرو می‌شود — مستندنشده و آزمایش‌نشده
- `dist/assets/index-*.js` = **۶۸۶KB** (gzip: ۱۷۸KB) — هشدار Vite برای chunk بالای ۵۰۰KB بی‌پاسخ مانده؛ بدون `manualChunks` یا `import()`
- `public/manifest.json` کامل و سالم است ولی در `index.html` بارگذاری نمی‌شود → اپ installable نیست
- `metadata.json` هنوز `{"name":"Untitled","majorCapabilities":["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]}` است — اپ اصلاً Gemini ندارد
- `.agents/` (۵۹۲KB) و `.antigravity/` (۴۹۲KB) مستندات Firebase را داخل درخت اپ حمل می‌کنند

---

# اکشن‌پلن

فازها را به ترتیب اجرا کنید. هر فاز یک PR مستقل و قابل‌بازگشت است.

⚠️ **قبل از هر کاری `git init` کنید.**

---

## فاز ۰ — توقف خون‌ریزی (۲–۳ ساعت) 🚨

| # | کار |
|---|---|
| 0.1 | `git init && git add -A && git commit -m "chore: baseline commit of prototype"` — **اولین و مهم‌ترین قدم** |
| 0.2 | کلید Supabase را در پنل **rotate** کنید (کلید در `.env` و `dist/` لو رفته) — [S3](#s3) |
| 0.3 | `supabase/full_schema_setup.sql` را حذف کنید (خصمانه است) و جداولش را drop کنید — [S1](#s1) |
| 0.4 | روی ۷ جدول `migrations/0003` سیاست RLS بنویسید یا حداقل `REVOKE ALL FROM anon` — [S2](#s2) |
| 0.5 | `dist/` و `.DS_Store` را حذف کنید (به‌ویژه `dist/server.cjs.map`) |

---

## فاز ۱ — رفع بلاکرهای درستکاری (۱–۲ روز)

چون F1 باگ آشکار است و F4/F12 فساد مالی می‌سازند، این‌ها باید قبل از هر کار زیبایی‌شناختی درست شوند.

| # | کار | فایل |
|---|---|---|
| 1.1 | دو مودال گم‌شده را بسازید: «ثبت واریز دستمزد» و «افزودن جلسه امروز»؛ مودال «افزودن مربی» را هم به فرم وصل کنید | `OwnerWorkspace.tsx` · [F1](#f1) |
| 1.2 | `<ConfirmDialog>` مشترک بسازید و برای **همه** اکشن‌های برگشت‌ناپذیر (تکمیل جلسه، لغو جلسه، ثبت پرداخت، تنظیم موجودی) بگذارید؛ خلاصه تغییر نشان دهید («−۱ جلسه، +۱۵۰٬۰۰۰ تومان») | [F1](#f1) |
| 1.3 | `adjustDelta` پیش‌فرض `0`، نیاز به علامت صریح، کلمپ `totalSessions >= usedSessions`، و دلیل الزامی | `:101, :600, :1594` · [F4](#f4) |
| 1.4 | اعتبارسنجی مالی: `paymentAmount` باید `min={1}` و `<= outstandingBalance` باشد؛ `capacity` باید `>=1`؛ `capacity > 0 ? … : '—'` در رندر | [F12](#f12) · [F13](#f13) |
| 1.5 | `currentUser = null` در بوت + session ماندگار؛ اپ دیگر پیش‌فرض owner لوگین‌شده باز نشود | `mockStore.ts:1189` · [F3](#f3) |
| 1.6 | `expirationDate` را از پکیج محاسبه کنید، `'1403/08/30'` را حذف کنید | `:137` · [F24](#f24) |

---

## فاز ۲ — تصمیم معماری بک‌اند (۱ روز، بدون کدنویسی)

این تصمیم همه فازهای بعدی را بلاک می‌کند.

**پیشنهاد: Supabase-first** — RLS + Auth + Postgres را نگه دارید، Express/Drizzle/Firebase را حذف کنید.

**دلیل:** schema و RPC و RLS از قبل نوشته شده و کیفیتشان خوب است. `complete_workout` (قفل `FOR UPDATE`، idempotency guard، دفتر immutable) طراحی درستی دارد که معادلی در `0003` ندارد. Supabase RLS چندمستاجری را رایگان می‌دهد.

| # | کار |
|---|---|
| 2.1 | تصمیم بگیرید: **Supabase-first** یا **Express + Drizzle**. نگه‌داشتن دو مدل یعنی سه مدل باقی می‌ماند |
| 2.2 | schema برنده را canonical کنید. پیشنهاد: `migrations/0000 + 0002` (tenant/credit-ledger-centric) — [A1](#a1) |
| 2.3 | `0003` را به‌عنوان migration بازنویسی‌شده **روی** schema برنده ادغام کنید، نه در کنارش |
| 2.4 | `src/db/schema.ts` + `src/db/` را به `server/` منتقل کنید تا از باندل کلاینت خارج شوند |
| 2.5 | `firebase`، `firebase-admin`، `firebase-applet-config.json`، `AuthProvider.tsx`، `middleware/auth.ts` را حذف کنید (≈۷۰MB) — [A2](#a2) · [A3](#a3) |
| 2.6 | `@google/genai` را حذف کنید (بازمانده AI Studio، ۲۰MB، صفر استفاده) — [A6](#a6) |

---

## فاز ۳ — پایه فرانت‌اند (۲–۳ روز)

همه کارهای بعدی روی این بنا می‌شوند، پس اول از همه.

| # | کار |
|---|---|
| 3.1 | Vitest + اسکریپت `npm test` + GitHub Actions (`lint && test && build`) — [F36](#f36) |
| 3.2 | تست `jalali.ts` — پرریسک‌ترین منطق اپ، صفر پوشش |
| 3.3 | تست `mockStore` برای اتمیک بودن `completeMemberSession` و `adjustMemberSessions` |
| 3.4 | Zustand را جایگزین singleton + تایر `setTick` کنید؛ `useSyncExternalStore` — [F6](#f6) |
| 3.5 | لایه persistence: هیدراته از localStorage در بوت + نوشتن debounce در `notify()` — [F2](#f2) |
| 3.6 | **۷ primitive مشترک بسازید**: `Button`، `Card`، `Modal` (با focus trap)، `Input`، `Table`، `Badge`، `EmptyState` + تابع `cn()` با `clsx`+`tailwind-merge` که نصب شده‌اند — [F33](#f33) |
| 3.7 | `strict: true` + `noUnusedLocals` را روشن کنید؛ انتظار خطاهای واقعی ببینید — [A7](#a7) |
| 3.8 | ESLint flat config با قانون `unused-imports` — ۲۶ import مرده را پاک می‌کند — [F37](#f37) |
| 3.9 | state کپی را مشتق کنید: `currentUser.role`، `expirationDate`، `remainingSessions` — [F9](#f9) · [F4](#f4) |

---

## فاز ۴ — دسترس‌پذیری و RTL (۲ روز)

| # | کار |
|---|---|
| 4.1 | قفل viewport را از `index.html:5` حذف کنید (`user-scalable=no`) — نقض WCAG 1.4.4 — [F29](#f29) |
| 4.2 | `Modal` را کامل کنید: `role="dialog"`, `aria-modal`, focus trap, Escape, scroll lock، بازگرداندن فوکوس؛ ۱۱ مودال را تبدیل کنید — [F25](#f25) |
| 4.3 | `htmlFor`/`id` برای هر ۴۶ label؛ `aria-label` روی همه دکمه‌های آیکونی؛ `role="alert"` روی خطاها — [F26](#f26) · [F27](#f27) |
| 4.4 | `<IconButton>` با `min-h-11 min-w-11` (۴۴px) — [F28](#f28) |
| 4.5 | حلقه `:focus-visible` سراسری در `tokens.css` — [F31](#f31) |
| 4.6 | کف ۱۲px برای متن + تیره کردن رنگ‌های فراگیر تا کنتراست ۴.۵:۱ بدهد — [F30](#f30) |
| 4.7 | `tokens.css` را واقعی کنید: `@theme` بسازید و ۱٬۵۵۲ کلاس سخت را codemod کنید؛ `rtl:`/`ltr:` را با ابزارهای منطقی (`ps-/pe-/ms-/me-/text-start`) جایگزین کنید — [F32](#f32) · [F23](#f23) |

---

## فاز ۵ — یکسان‌سازی فرمت و i18n (۲ روز)

| # | کار |
|---|---|
| 5.1 | یک نقطه حقیقت واحد برای فرمت: `Intl.NumberFormat('fa-IR')` + یک `formatDate`/`formatCurrency`. همین الان دو سیستم رقم در یک لیست پرداخت قاطی شده — [F22](#f22) |
| 5.2 | ۲۸۰ شرط سه‌تایی را به `i18n.ts` منتقل کنید؛ ۶۳ کلید مرده را یا وصل کنید یا حذف کنید — [F19](#f19) · [F20](#f20) |
| 5.3 | لایه داده به‌جای رشته فارسی، i18n key + params برگرداند؛ `alert("SESSION_NOT_FOUND")` حذف شود — [F21](#f21) · [F5](#f5) |
| 5.4 | `PersianCalendar` پارامتر `lang` بگیرد؛ نام ماه/روز هفته انگلیسی اضافه شود — [F23](#f23) |
| 5.5 | یک اسکریپت inline در `index.html` که `lang`/`dir` را قبل از first paint تنظیم کند — [F23](#f23) |

---

## فاز ۶ — کامل‌کردن قابلیت‌های نیمه‌کاره (۳–۴ روز)

| # | کار |
|---|---|
| 6.1 | تب Finance: سه دفتر (`trainerPayouts`/`sessionAdjustments`/`auditLogs`) + ۴ فیلتر موجود در i18n را رندر کنید؛ کارت درآمد را به «Total Contracted Value» تغییر نام دهید — [F15](#f15) · [F16](#f16) |
| 6.2 | تب Audit (ورود امروز را مشروع می‌کند) |
| 6.3 | داشبورد ظرفیت per-date را رعایت کند و با زمان‌بندی سازگار شود — [F14](#f14) |
| 6.4 | فرم عضو/مربی: نام‌کاربری + رمز اولیه + `createUserAccount` — [F17](#f17) |
| 6.5 | مودال «افزودن تمرین»: جست‌وجو/فیلتر را از کاتالوگ بازاستفاده کند (`filteredCatalog` همین حالا در همان کامپوننت هست) |
| 6.6 | حذف تمرین در Trainer هم تأیید بگیرد (الان ندارد) |
| 6.7 | ابزار مشترک `ExerciseEditor` (۲۴۰ خط تکراری) + `ExerciseCard` (۳ کپی) + `buildSessionCounts` (۳ کپی) — [F35](#f35) |
| 6.8 | جدول اعضا: مرتب‌سازی، فیلتر وضعیت/موجودی، صفحه‌بندی، عملیات گروهی |

---

## فاز ۷ — بهداشت پروژه (۱ روز)

| # | کار |
|---|---|
| 7.1 | حذف وابستگی‌های مرده: `date-fns`, `@google/genai`, `motion` (≈۴۷MB، صفر ریسک)؛ سپس تصمیم جداگانه روی استک سرور — [A6](#a6) |
| 7.2 | `bun.lock` یا `package-lock.json` — یکی را انتخاب کنید تا build تکرارپذیر شود |
| 7.3 | README و `.env.example` را با متغیرهای واقعی بازنویسی کنید؛ `metadata.json` را اصلاح کنید — [F39](#f39) · [F40](#f40) |
| 7.4 | `<link rel="manifest">` را در `index.html` اضافه کنید |
| 7.5 | `manualChunks` برای شکستن chunk ۶۸۶KB |
| 7.6 | `type="password"` + تأیید برای تغییر رمز؛ دیالوگ لاگین دمویی پشت `import.meta.env.DEV` — [F18](#f18) · [S4](#s4) |
| 7.7 | gate کردن role-switcher مالک پشت `__DEV__` (الان هر owner می‌تواند نقش مربی/عضو را جعل کند) |
| 7.8 | `helmmet` + rate-limit + error handler مرکزی به سرور — [S6](#s6) |

---

## اولویت‌بندی

| اولویت | فازها | دلیل |
|---|---|---|
| **آنی (امروز)** | ۰ | دیتابیس زنده با کلید لو‌رفته + بدون git |
| **چرخه ۱** | ۱ | باگ آشکار + فساد مالی |
| **چرخه ۲** | ۲ | تصمیم معماری که بقیه را بلاک می‌کند |
| **چرخه ۳–۴** | ۳، ۴ | primitive و تست‌ها؛ همه‌چیز بعدی ارزان می‌شود |
| **چرخه ۵–۶** | ۵، ۶ | کیفیت محصول |
| **چرخه ۷** | ۷ | بهداشت |

---

## نکات مثبت

برای انصاف، این‌ها هم درست هستند:

- typecheck و build کاملاً پاس می‌شوند
- محاسبات دامنه (1RM / progression / muscle balance) خوب جدا شده و تست شده‌اند — `src/lib/domain/` یک نمونه معماری تمیز است
- `complete_workout` RPC (`migrations/0002`) از نظر قفل‌گذاری، idempotency و دفتر immutable طراحی درستی دارد
- سیاست‌های RLS در `migrations/0001` از نظر جداسازی tenant و کمک‌کننده‌های `private.has_role`/`private.current_tenant_id` درست نوشته شده‌اند — مشکل این است که به جداول اشتباه وصل‌اند
- RTL در جاها درست کار می‌کند (`App.tsx:26-30`، `index.css`، `dir` روی تقویم)
- پوشش تست برای یک پروتوتایپ با ~۹٬۳۰۰ خط، از صفر بودن بهتر است
