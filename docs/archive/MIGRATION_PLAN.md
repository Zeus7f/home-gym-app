# MIGRATION_PLAN.md — HomeGym Web Redesign → پروژه اصلی

> فاز ۱ طرح انتقال · تاریخ: مهر ۱۴۰۵
> **بدون تغییر کد. فقط برنامه‌ریزی.**

---

## ۱. استک فعلی ریپو

| بُعد | وضعیت |
|---|---|
| **حالت** | ✅ **حالت A** — React وب با Vite |
| Framework | React 19 + TypeScript (`.tsx`) |
| Bundler | Vite 6 (`@vitejs/plugin-react`) |
| CSS | Tailwind 4 (`@tailwindcss/vite`) |
| Routing | ❌ فعلاً state-based toggle؛ react-router نصب نشده |
| State | `mockStore` سفارشی (observer pattern) + Supabase live (اختیاری) |
| Backend | Express.js روی `server.ts` + Supabase PostgreSQL + Firebase Admin |
| Fonts | از CSS در `src/styles/tokens.css` و احتمالاً Google Fonts (نیاز به بررسی) |
| Design Tokens | موجود در `src/styles/tokens.css` — اما **با پالت متفاوت** از پروتوتایپ |
| Jalali | کامل: `src/lib/date/jalali.ts` با تمام توابع لازم |
| Format | موجود: `src/lib/format.ts` (`formatNumber`, `formatCurrency`, `formatDate`) |
| Domain types | کامل: `src/lib/domain/gymManagement.ts` |
| Feature dirs | موجود: `src/features/{owner,trainer,member,auth,exercises}` |
| CI/CD | ندیدم (فقط Vite build) |

---

## ۲. تحلیل شکاف: پروتوتایپ vs ریپو فعلی

### چه چیزهایی از قبل وجود دارند (نگه داشتن + تقویت)

| مورد | محل در ریپو | نکته |
|---|---|---|
| `jalali.ts` | `src/lib/date/jalali.ts` | کامل و با کیفیت؛ از آن استفاده کن |
| `format.ts` | `src/lib/format.ts` | نیاز به افزودن `fa()` و `short()` با سبک پروتوتایپ |
| Domain types | `src/lib/domain/gymManagement.ts` | غنی‌تر از پروتوتایپ — حفظ شود |
| `mockStore` | `src/lib/supabase/mockStore.ts` | داده‌های واقعی‌تر، با Supabase — حفظ و تقویت شود |
| Feature dirs | `src/features/{owner,trainer,member}` | ساختار درست — صفحه‌ها باید منتقل شوند |
| UI Components | `src/components/ui/` | Button, Card, Badge, Input, Modal... موجودند |
| Auth | `src/features/auth/LoginScreen.tsx` | کامل، با موکامپوننت‌های خوب |
| Dark Mode | `src/styles/tokens.css` (`[data-theme="dark"]`) | از قبل آماده، فقط توکن‌ها کامل نیستند |

### چه چیزهایی در پروتوتایپ هستند که باید اضافه شوند

| مورد | محل پیشنهادی | اولویت |
|---|---|---|
| Design tokens پروتوتایپ (Ink/Deep/Steel/Brass/Rubber/Chalk) | ادغام در `src/styles/tokens.css` | **بالا** |
| Responsive shell (sidebar/rail/bottom-tabs) | `src/features/owner/OwnerShell.tsx` | **بالا** |
| `Capacity` widget (stacked bar + hour grid) | `src/components/ui/Capacity.tsx` | **بالا** |
| `Meter` component | `src/components/ui/Meter.tsx` | **بالا** |
| `Seg` / `Chips` | `src/components/ui/Seg.tsx`, `Chips.tsx` | **بالا** |
| `Pill` (session status badge) | `src/components/ui/Pill.tsx` | متوسط |
| Session stepper flow (`useSessionDraft`) | `src/features/trainer/hooks/useSessionDraft.ts` | **بالا** |
| Plate stack hero (member) | `src/features/member/components/PlateHero.tsx` | متوسط |
| `/dev/ui` showcase | `src/pages/dev/UIShowcase.tsx` (dev only) | کم |
| react-router | `npm install react-router` | **بالا** |

### چه چیزهایی نباید از پروتوتایپ کپی شوند

| مورد | دلیل |
|---|---|
| `Stage` + قاب دستگاه | فقط preview؛ G6 |
| `App.jsx` پروتوتایپ | جای آن با `App.tsx` فعلی جایگزین می‌شود |
| Import مستقیم از `data.js` | همه داده‌ها از `mockStore` می‌آیند |
| `GYM.now`, `GYM.date` hard-code | از `jalali.ts` واقعی استفاده می‌شود؛ G7 |
| Google Fonts `@import` | self-host؛ G8 |
| Hex‌های مستقیم در JSX | همه به توکن منتقل می‌شوند؛ G3 |

---

## ۳. برخورد با G1–G10

| شناسه | وضعیت در ریپو | استراتژی |
|---|---|---|
| G1 | `spec.md` خالی | در فاز ۷: یا README واقعی، یا حذف دکمه دانلود |
| G2 | `OwnerWorkspace.tsx` بزرگ اما قابل مدیریت‌تر از پروتوتایپ | تقسیم به صفحه‌های جداگانه در فاز ۴ |
| G3 | رنگ‌ها بخشی token‌اند، بخشی هنوز hard-code | ادغام توکن‌های پروتوتایپ در فاز ۲ |
| G4 | `[data-theme="dark"]` آماده است اما ناقص | تکمیل در فاز ۷ |
| G5 | `OwnerWorkspace.tsx` بهتر از پروتوتایپ؛ `MemberWorkspace` ضعیف | بهبود در هر فاز + تکمیل فاز ۷ |
| G6 | `Stage` در ریپو اصلی نیست | کافی؛ نباید وارد شود |
| G7 | `jalali.ts` واقعی موجود است | جایگزین `GYM.now` و `DAYS` hard-code در فاز ۲ و ۴ |
| G8 | فونت‌ها: باید self-host شوند | فاز ۲ |
| G9 | آفلاین: پیاده‌سازی نشده | تصمیم در فاز ۷؛ پیچیده، اختیاری |
| G10 | `mockStore` وجود دارد؛ Supabase live هم هست | ساختار `src/api/` برای abstraction اضافه می‌شود |

---

## ۴. ساختار پوشه پیشنهادی

```
src/
├── api/                        # ← جدید: abstraction layer
│   ├── sessions.ts             #   getSessions, createSession...
│   ├── members.ts              #   getMembers, getMember...
│   ├── trainers.ts
│   ├── finance.ts
│   └── _client.ts             #   adapter که از mockStore یا Supabase می‌خواند
│
├── components/
│   └── ui/
│       ├── Capacity.tsx        # ← جدید از پروتوتایپ
│       ├── Meter.tsx           # ← جدید از پروتوتایپ
│       ├── Pill.tsx            # ← جدید از پروتوتایپ
│       ├── Seg.tsx             # ← جدید از پروتوتایپ
│       ├── Chips.tsx           # ← جدید از پروتوتایپ
│       ├── Avatar.tsx          # ← جدید از پروتوتایپ
│       ├── Button.tsx          # موجود
│       ├── Card.tsx            # موجود (با Card از پروتوتایپ ادغام)
│       └── ...
│
├── features/
│   ├── auth/                   # موجود
│   ├── exercises/              # موجود
│   ├── owner/
│   │   ├── OwnerShell.tsx      # ← جدید: sidebar/rail/bottom-tabs
│   │   └── pages/             # ← جدید
│   │       ├── Dash.tsx
│   │       ├── Sched.tsx
│   │       ├── Members.tsx
│   │       ├── Trainers.tsx
│   │       ├── Finance.tsx
│   │       ├── Reports.tsx
│   │       └── Settings.tsx
│   │
│   ├── trainer/
│   │   ├── TrainerShell.tsx    # ← جدید: bottom tabs
│   │   ├── hooks/
│   │   │   └── useSessionDraft.ts  # ← جدید: reducer for session flow
│   │   └── pages/
│   │       ├── Today.tsx
│   │       ├── Athletes.tsx
│   │       ├── History.tsx
│   │       └── Catalog.tsx
│   │
│   └── member/
│       ├── MemberShell.tsx     # ← جدید: bottom tabs
│       ├── components/
│       │   └── PlateHero.tsx   # ← جدید از پروتوتایپ
│       └── pages/
│           ├── Home.tsx
│           ├── Sessions.tsx
│           ├── Exercises.tsx
│           └── History.tsx
│
├── lib/
│   ├── date/jalali.ts          # موجود ✅
│   ├── format.ts               # موجود، نیاز به تکمیل
│   ├── domain/                 # موجود ✅
│   ├── supabase/               # موجود ✅
│   └── utils.ts                # موجود ✅
│
└── styles/
    └── tokens.css              # موجود، نیاز به ادغام توکن‌های پروتوتایپ
```

---

## ۵. استراتژی Routing

**وضعیت فعلی:** toggle نقش در `App.tsx` با `useState` — G6/G10

**پیشنهاد:**
```
/                  → redirect بر اساس نقش کاربر لاگین‌شده
/login             → LoginScreen (موجود)
/owner             → redirect به /owner/dashboard
/owner/dashboard
/owner/schedule
/owner/members
/owner/trainers
/owner/finance
/owner/reports
/owner/settings
/trainer           → redirect به /trainer/today
/trainer/today
/trainer/athletes
/trainer/history
/trainer/catalog
/member            → redirect به /member/home
/member/home
/member/sessions
/member/exercises
/member/history
/dev/ui            → UIShowcase (فقط در NODE_ENV=development)
```

**منبع نقش:** از `mockStore.currentUser.role` در حال حاضر؛ بعداً از JWT/Supabase Auth.

**Router:** `react-router-dom` v7 (سازگار با React 19).

**نکته مهم:** تغییر routing نباید به `mockStore` دست بزند — router فقط display layer است.

---

## ۶. لایه داده — استراتژی `src/api/`

```typescript
// src/api/_client.ts
// این فایل تصمیم می‌گیرد از کجا بخواند

import { gymStore } from '../lib/supabase/mockStore';
import { supabase } from '../lib/supabase/client';

export const isLive = () => gymStore.isSupabaseConnected;

// src/api/sessions.ts — نمونه
export async function getSessions(date: string): Promise<DailySession[]> {
  if (isLive()) {
    // در آینده: const { data } = await supabase.from('sessions')...
    return gymStore.getSessions(date); // adapter
  }
  return gymStore.getSessions(date); // mock
}
```

**اصل:** کامپوننت‌ها فقط از `src/api/*` ایمپورت می‌کنند. وقتی بکاند آماده شد، فقط `src/api/_client.ts` تغییر می‌کند.

---

## ۷. تاریخ شمسی و ساعت واقعی

`jalali.ts` موجود کافی است. فقط باید:

1. `GYM.now` را با `new Date().getHours()` جایگزین کرد
2. `GYM.date` را با `formatJalaliHuman(getTodayJalali())` جایگزین کرد
3. آرایه `DAYS` در `Sched` باید از `getCurrentWeekShamsi()` (تابع جدید در `jalali.ts`) بیاید
4. تابع جدید پیشنهادی: `getCurrentWeekShamsi(): Array<{label, dayNum, isToday}>` که شنبه تا جمعه هفته جاری را برمی‌گرداند

---

## ۸. ریسک‌ها و سؤالات

### ریسک‌های مهم

| ریسک | احتمال | راهحل |
|---|---|---|
| تضاد توکن‌های رنگ: ریپو از teal/emerald، پروتوتایپ از ink/brass | **بالا** | دو set توکن در `tokens.css`؛ ابتدا پروتوتایپ override نشود؛ در فاز ۲ تصمیم نهایی گرفته شود |
| کامپوننت‌های `Card`, `Button` ریپو با نسخه پروتوتایپ تداخل دارند | متوسط | کامپوننت‌های پروتوتایپ با prefix `Gym` (مثل `GymCard`) اضافه می‌شوند تا تداخل نباشد |
| `OwnerWorkspace.tsx` فعلی با shell جدید override می‌شود | **بالا** | فعلاً `OwnerWorkspace.tsx` را دست نمی‌زنیم؛ shell جدید را موازی می‌سازیم تا router آماده شود |
| فونت Lalezar در ریپو فعلی وجود ندارد | متوسط | در فاز ۲ self-host می‌شود |
| RTL: ریپو `dir="rtl"` را روی `<html>` می‌گذارد، پروتوتایپ روی `div` | کم | باید در `main.tsx` یا `App.tsx` normalize شود |

### سؤالات برای تصمیم‌گیری قبل از فاز ۲

1. **پالت رنگ نهایی:** آیا می‌خواهی سیستم رنگ ریپو (teal/emerald) را نگه داری یا به پالت پروتوتایپ (ink/brass) منتقل شوی؟ اگر هر دو باشند، UI ناهماهنگ خواهد بود.

2. **کامپوننت‌های UI:** آیا `Button`, `Card` موجود در ریپو را گسترش بدهیم تا variant‌های پروتوتایپ را پشتیبانی کنند، یا کامپوننت‌های جدیدی موازی بسازیم؟

3. **Supabase vs mock:** آیا در این مرحله به Supabase live متصل می‌مانیم یا فقط mock استفاده می‌شود؟ (پیشنهاد: فقط mock در فازهای ۲-۶، Supabase در فاز ۷)

4. **Vitest:** آیا در ریپو فعلی نصب است؟ (در `package.json` ندیدم — باید اضافه شود)

5. **react-router:** نصب در فاز ۲ یا موازی با shell اپ مدیر در فاز ۴؟

---

## ۹. ترتیب پیشنهادی کارها

| فاز | کار اصلی | اندازه | وابستگی |
|---|---|---|---|
| **۲** | توکن‌های رنگ + فونت self-host + `src/api/` abstraction + `format.ts` تکمیل | متوسط | تصمیم سؤال ۱ |
| **۲.۵** | نصب react-router + routing اولیه | کوچک | فاز ۲ |
| **۳** | UI components: Capacity, Meter, Pill, Seg, Chips, Avatar | متوسط | فاز ۲ |
| **۴.۱** | OwnerShell (sidebar/rail/tabs) | متوسط | فاز ۳ |
| **۴.۲-۴.۸** | هر صفحه مدیر جداگانه | کوچک (هر کدام) | فاز ۴.۱ |
| **۵** | TrainerShell + صفحه‌ها + `useSessionDraft` | بزرگ | فاز ۳ |
| **۶** | MemberShell + صفحه‌ها | متوسط | فاز ۳ |
| **۷** | Dark mode کامل، a11y، آفلاین (اختیاری)، review | بزرگ | فاز ۶ |

---

## ۱۰. چه چیزی عیناً ماندنی است (بدون تغییر)

- **رفتار و ظاهر UI**: همه اعداد فارسی، رنگ‌بندی session‌ها، layout responsive
- **منطق تجاری**: ظرفیت ۶ نفر/ساعت، کل ۳۰ نفر، هشدار ≤ ۲ جلسه، گام وزنه ۲.۵ کیلو، گام تکرار ۱
- **متن‌های فارسی**: همه برچسب‌ها و متن‌ها از پروتوتایپ حفظ می‌شوند
- **انیمیشن‌ها**: `motion` برای transitions، `live-pulse` برای جلسات زنده

---

> **مرحله بعد (فاز ۲):** قبل از شروع، لطفاً به سؤالات بخش ۸ پاسخ بده — مخصوصاً **سؤال ۱ (پالت رنگ)** و **سؤال ۲ (استراتژی کامپوننت‌ها)**. این دو تصمیم بیشترین تأثیر را روی بقیه فازها دارند.
