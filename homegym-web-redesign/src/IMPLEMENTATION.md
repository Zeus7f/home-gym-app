# HomeGym Web · طراحی و پیاده‌سازی

## 1. فایل‌های اصلی

### `index.css`
```css
@import url("https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&family=Lalezar&display=swap");
html, body { background: #e6ecf0; }
body { font-family: Vazirmatn, system-ui, sans-serif; color: #24323d; }
button { font-family: inherit; }
.font-display { font-family: Lalezar, Vazirmatn, sans-serif; font-weight: 400; }
.tnum { font-variant-numeric: tabular-nums; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
.thin-scroll::-webkit-scrollbar { width: 6px; }
.thin-scroll::-webkit-scrollbar-thumb { background: #cfd9e1; border-radius: 9px; }
@keyframes pulse2 { 0%,100% { filter: brightness(1) } 50% { filter: brightness(1.18) } }
.live-pulse { animation: pulse2 2.2s ease-in-out infinite; }
```

### `data.js` (شامل تمام داده‌های نمونه و helper functions)
- شامل GYM, TRAINERS, SESSIONS, MEMBERS, PAYMENTS, WEEK, CATALOG
- تابع‌های fa(), toman(), short() برای عددی‌سازی فارسی
- تمام ثابت‌های رنگ و الگو

### `ui.jsx` (کامپوننت‌های بازپذیری‌شده)
- Card, H (هدر با زیرعنوان), Pill, Btn, Avatar
- Chips, Seg (segmented control)
- Meter (نوار مانده جلسات)
- **Capacity**: شاخص ظرفیت امروز (stacked bar + ساعت به ساعت)

### `owner.jsx` (دسکتاپ / تبلت / موبایل)
- OwnerApp: کامپوننت اصلی سایدبار + صفحات
- 7 صفحه: Dash, Sched, Members, Trainers, Finance, Reports, SettingsScr
- responsive: desktop (sایدبار راست) / tablet (rail icon) / mobile (bottom tabs + FAB)
- Sheet component: detail drawer برای موبایل/تبلت
- هر صفحه داده‌های نمونه‌ای دارد

### `trainer.jsx` (موبایل محور)
- TrainerApp: bottom tabs (امروز، ورزشکاران، سوابق، کاتالوگ)
- Today: ظرفیت مربی + داخل سالن + بعدی + تمام‌شده
- Session: full-screen flow برای ثبت حرکات با stepper، progress bar، نتیجه‌ی atomic
- MyMembers, Hist, Catalog tabs

### `member.jsx` (موبایل محور)
- MemberApp: bottom tabs (خانه، جلسات، تمرینات، سوابق)
- MHome: hero section با plate stack (جلسات باقیمانده)، نوبت بعدی، هفتگی
- MSessions: تب پیش رو و گذشته
- MEx: تمرینات ثبت‌شده‌ی امروز
- MHist: رکوردها و روند پیشرفت

### `App.jsx` (اپ اصلی)
- Toggle role (مدیر، مربی، ورزشکار)
- Toggle device: desktop (کامل)، tablet (desktop/tablet)، mobile (موبایل)
- Stage: responsive rendering با scale + browser chrome
- دکمه دانلود Markdown

---

## 2. طراحی و رنگ‌بندی

### رنگ‌های اصلی
- **Ink (#06314e)**: رنگ اصلی، دکمه‌ها، متن‌های مهم
- **Deep (#041d2c)**: سایدبار، پس‌زمینه‌های تیره
- **Steel (#18527e)**: لینک‌ها، متن‌های فرعی
- **Brass (#d1b252)**: "الان"، FAB، button variant, نشانگر
- **Rubber (#c4472c)**: بدهکار، low balance، خطر
- **Chalk (#f7f9fb)**: پس‌زمینه روشن

### فونت‌ها
- **Lalezar**: اعداد بزرگ (headline، metric)
- **Vazirmatn**: تمام UI
- پایه: 14px (کلیدی)

---

## 3. کامپوننت‌های کلیدی

### Capacity (شاخص ظرفیت امروز)
- **Stacked bar**: done / live (breathing) / wait / noshow / free
- **Hour-by-hour floor**: 8 صبح تا 22 شب، 6 نفر ظرفیت هر ساعت
- "الان" ring و highlight ساعت جاری
- Meter scale: شامل حالت‌های "پر" و "کمی" پر

### Session Flow (مربی)
- Slide-in از چپ
- Set stepper: کم/زیاد دکمه + display
- Stepper رنگی: سفید (انجام نشده) / سرمه‌ای (انجام شده)
- Progress bar متحرک
- Modal "جلسه ثبت شد" با notification

### Member Home (ورزشکار)
- Hero: plate stack (جلسات باقیمانده برایس)
- بدهی نمایش‌ داده شود
- هفتگی: شنبه تا جمعه

---

## 4. Responsive و Navigation

### Owner (مدیر)
- **Desktop (1280×820)**: سایدبار دائم (260px)، محتوا سمت چپ
- **Tablet (820×1080)**: rail icon (84px)
- **Mobile (390×844)**: bottom tabs (4 tabs) + more button برای بقیه

### Trainer & Member
- **موبایل محور**: bottom tabs فقط
- No desktop/tablet modes

### Drawer/Sheet
- Desktop/Tablet: side drawer (خطی از راست)
- Mobile: bottom sheet (از پایین، 85%)
- Member detail: نمایش تمام اطلاعات + عملیات

---

## 5. کلیدی حالت‌ها (States)

### Session Status
- `done`: نشاندهنده رنگ ink، تاریخ نمایش
- `live`: brass color، breathing animation
- `wait`: light blue ring
- `cancel`: dashed border، gray text
- `noshow`: red color

### Package Meter
- تیکه‌های سفید = used
- تیکه‌های ink = remaining
- تیکه‌های red = low balance (≤2)

### Trainer Capacity
- Progress bar ink/red بر اساس full بودن
- Full = capacity reached

---

## 6. توابع و Utilities

### شماره‌سازی فارسی
```javascript
fa(n) = عدد فارسی
short(n) = abbreviated (۱۵۰۰۰ → "۱۵۰ هزار")
toman(n) = n + " تومان"
```

### Data helpers
- `tName(id)`: نام مربی از ID
- `left(m)`: جلسات باقیمانده
- `debt(m)`: بدهی اعضا

---

## 7. نکات پیاده‌سازی

### Dark Mode (آماده برای اضافه شدن)
- CSS custom properties برای رنگ‌ها
- theme toggle در Settings

### Offline Support
- مربی می‌تواند آفلاین ثبت کند (notification نمایش‌ داده شود)

### Accessibility
- aria-label برای دکمه‌های icon
- Semantic HTML (button, nav, section)
- Color not only

---

## 8. فایل‌های تکمیل‌شده برای ویبه‌کدینگ

تمام فایل‌های زیر آماده‌اند:
1. **src/index.css** - styles
2. **src/data.js** - data + utilities
3. **src/ui.jsx** - reusable components
4. **src/owner.jsx** - owner dashboard (3 devices)
5. **src/trainer.jsx** - trainer mobile app
6. **src/member.jsx** - member mobile app
7. **src/App.jsx** - main app shell

شامل:
- ✅ تمام منوها (7 صفحه برای مدیر)
- ✅ سه نقش
- ✅ سه دستگاه (desktop/tablet/mobile)
- ✅ Responsive design
- ✅ Interactive flows (session، payment، scheduling)
- ✅ Design tokens (رنگ، فونت، spacing)
