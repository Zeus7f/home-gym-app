export const fa = (n) => Number(n).toLocaleString("fa-IR");
export const toman = (n) => fa(n) + " تومان";
export const short = (n) => (n >= 1e6 ? fa(Math.round(n / 1e5) / 10) + " م" : fa(Math.round(n / 1e3)) + " هزار");

export const GYM = { name: "باشگاه آیرون هیون", capacity: 30, hourCap: 6, date: "سه‌شنبه ۱۴ مهر ۱۴۰۵", now: 20 };

export const TRAINERS = [
  { id: "ali", name: "علی محمدی", spec: "قدرتی", cap: 6, rate: 150000, done: 42, paid: 4050000, hours: "۱۶ تا ۲۲", days: "ش، د، س، چ" },
  { id: "sara", name: "سارا کریمی", spec: "فانکشنال", cap: 6, rate: 140000, done: 38, paid: 3640000, hours: "۰۸ تا ۱۴ و ۱۷ تا ۲۱", days: "همه روزه" },
  { id: "mahdi", name: "مهدی رحیمی", spec: "هوازی و اصلاحی", cap: 5, rate: 120000, done: 27, paid: 2280000, hours: "۰۸ تا ۱۲ و ۱۸ تا ۲۲", days: "ی، س، پ" },
];
export const tName = (id) => TRAINERS.find((t) => t.id === id)?.name;

// s: done | live | wait | cancel | noshow
export const SESSIONS = [
  { id: 1, t: "۰۸:۰۰", h: 8, m: "رضا احمدی", tr: "sara", s: "done" },
  { id: 2, t: "۰۸:۰۰", h: 8, m: "نیلوفر صادقی", tr: "sara", s: "done" },
  { id: 3, t: "۰۹:۰۰", h: 9, m: "امیر حسینی", tr: "mahdi", s: "done" },
  { id: 4, t: "۱۰:۰۰", h: 10, m: "مریم جعفری", tr: "mahdi", s: "done" },
  { id: 5, t: "۱۰:۰۰", h: 10, m: "کیان نوری", tr: "sara", s: "noshow" },
  { id: 6, t: "۱۷:۰۰", h: 17, m: "پارسا موسوی", tr: "ali", s: "done" },
  { id: 7, t: "۱۸:۰۰", h: 18, m: "شیما رستمی", tr: "mahdi", s: "done" },
  { id: 8, t: "۱۸:۰۰", h: 18, m: "بهراد شریفی", tr: "ali", s: "done" },
  { id: 9, t: "۱۹:۰۰", h: 19, m: "مهسا فتحی", tr: "sara", s: "done" },
  { id: 10, t: "۲۰:۰۰", h: 20, m: "حمید زارعی", tr: "ali", s: "live" },
  { id: 11, t: "۲۰:۰۰", h: 20, m: "الهام کاظمی", tr: "sara", s: "live", ov: true },
  { id: 12, t: "۲۰:۰۰", h: 20, m: "سینا قاسمی", tr: "mahdi", s: "live" },
  { id: 13, t: "۲۰:۰۰", h: 20, m: "ترانه یزدانی", tr: "ali", s: "live" },
  { id: 14, t: "۲۱:۰۰", h: 21, m: "آیدا مرادی", tr: "ali", s: "wait" },
  { id: 15, t: "۲۱:۰۰", h: 21, m: "آرش بهرامی", tr: "ali", s: "wait" },
  { id: 16, t: "۲۱:۰۰", h: 21, m: "یاسمن اکبری", tr: "mahdi", s: "wait" },
  { id: 17, t: "۲۱:۰۰", h: 21, m: "دانیال رضایی", tr: "mahdi", s: "wait" },
  { id: 18, t: "۲۲:۰۰", h: 22, m: "فرهاد عباسی", tr: "ali", s: "cancel" },
  { id: 19, t: "۲۲:۰۰", h: 22, m: "نگار امینی", tr: "mahdi", s: "wait" },
];

export const STATUS = {
  done: { l: "تکمیل شد", cls: "bg-[#06314e] text-white", dot: "bg-[#06314e]" },
  live: { l: "در حال تمرین", cls: "bg-[#d1b252] text-[#041d2c]", dot: "bg-[#d1b252]" },
  wait: { l: "در انتظار ورود", cls: "bg-[#e3ecf3] text-[#18527e]", dot: "bg-[#8fb0c8]" },
  cancel: { l: "لغو شده", cls: "bg-[#eef2f5] text-[#6b7d8a] line-through", dot: "bg-[#c9d3db]" },
  noshow: { l: "غیبت", cls: "bg-[#fbeae5] text-[#a8381f]", dot: "bg-[#c4472c]" },
};

export const MEMBERS = [
  { id: "m1", m: "حمید زارعی", ph: "۰۹۱۲ ۳۴۵ ۶۷۸۹", tr: "ali", pkg: "۱۲ جلسه قدرتی", total: 12, used: 11, price: 4800000, paid: 4800000, exp: "۳۰ مهر", st: "active" },
  { id: "m2", m: "آیدا مرادی", ph: "۰۹۳۵ ۱۱۲ ۴۴۵۰", tr: "ali", pkg: "۸ جلسه", total: 8, used: 6, price: 3200000, paid: 2000000, exp: "۲۲ مهر", st: "active" },
  { id: "m3", m: "کیان نوری", ph: "۰۹۱۹ ۸۰۰ ۲۲۱۳", tr: "sara", pkg: "۱۲ جلسه فانکشنال", total: 12, used: 10, price: 4500000, paid: 4500000, exp: "۲۵ مهر", st: "active" },
  { id: "m4", m: "رضا احمدی", ph: "۰۹۱۲ ۷۶۵ ۰۰۹۱", tr: "ali", pkg: "۱۶ جلسه", total: 16, used: 7, price: 6000000, paid: 6000000, exp: "۲۰ آبان", st: "active" },
  { id: "m5", m: "نیلوفر صادقی", ph: "۰۹۰۱ ۲۳۴ ۵۵۶۶", tr: "sara", pkg: "۱۲ جلسه فانکشنال", total: 12, used: 8, price: 4500000, paid: 3000000, exp: "۳۰ آبان", st: "active" },
  { id: "m6", m: "الهام کاظمی", ph: "۰۹۱۲ ۴۴۴ ۱۲۱۲", tr: "ali", pkg: "۸ جلسه", total: 8, used: 3, price: 3200000, paid: 3200000, exp: "۱۵ آبان", st: "active" },
  { id: "m7", m: "سینا قاسمی", ph: "۰۹۳۹ ۵۵۰ ۷۸۷۸", tr: "mahdi", pkg: "۱۲ جلسه اصلاحی", total: 12, used: 5, price: 4200000, paid: 4200000, exp: "۲ آذر", st: "active" },
  { id: "m8", m: "ترانه یزدانی", ph: "۰۹۱۷ ۹۸۰ ۳۳۴۴", tr: "ali", pkg: "۱۶ جلسه", total: 16, used: 12, price: 6000000, paid: 4000000, exp: "۱۸ آبان", st: "active" },
  { id: "m9", m: "امیر حسینی", ph: "۰۹۱۲ ۰۰۹ ۸۸۷۶", tr: "mahdi", pkg: "۱۲ جلسه", total: 12, used: 9, price: 4200000, paid: 4200000, exp: "۲۸ مهر", st: "active" },
  { id: "m10", m: "فرهاد عباسی", ph: "۰۹۳۶ ۲۲۱ ۰۰۱۰", tr: "ali", pkg: "۸ جلسه", total: 8, used: 8, price: 3200000, paid: 3200000, exp: "۵ مهر", st: "expired" },
];
export const left = (x) => x.total - x.used;
export const debt = (x) => x.price - x.paid;

export const PAYMENTS = [
  { who: "نیلوفر صادقی", amt: 1500000, d: "امروز ۱۸:۴۰", how: "کارت‌خوان", in: true },
  { who: "علی محمدی", amt: 1800000, d: "امروز ۱۴:۰۰", how: "کارت به کارت", in: false },
  { who: "ترانه یزدانی", amt: 2000000, d: "دیروز", how: "نقدی", in: true },
  { who: "آیدا مرادی", amt: 2000000, d: "۱۱ مهر", how: "کارت‌خوان", in: true },
  { who: "سارا کریمی", amt: 1400000, d: "۱۰ مهر", how: "کارت به کارت", in: false },
  { who: "سینا قاسمی", amt: 4200000, d: "۹ مهر", how: "انتقال بانکی", in: true },
];

export const WEEK = [
  { d: "شنبه", n: 24 }, { d: "یکشنبه", n: 19 }, { d: "دوشنبه", n: 27 }, { d: "سه‌شنبه", n: 17, today: true },
  { d: "چهارشنبه", n: 0 }, { d: "پنجشنبه", n: 0 }, { d: "جمعه", n: 0 },
];

export const CATS = ["همه", "سینه", "پشت", "پا", "سرشانه", "بازو", "شکم", "هوازی"];
export const CATALOG = [
  { n: "پرس سینه هالتر", c: "سینه", eq: "هالتر" }, { n: "پرس بالاسینه دمبل", c: "سینه", eq: "دمبل" },
  { n: "زیربغل سیم‌کش", c: "پشت", eq: "دستگاه" }, { n: "ددلیفت", c: "پشت", eq: "هالتر" },
  { n: "اسکات پشت", c: "پا", eq: "هالتر" }, { n: "لانج با دمبل", c: "پا", eq: "دمبل" },
  { n: "پرس سرشانه", c: "سرشانه", eq: "دمبل" }, { n: "نشر از جانب", c: "سرشانه", eq: "دمبل" },
  { n: "جلوبازو هالتر", c: "بازو", eq: "هالتر" }, { n: "پشت‌بازو سیم‌کش", c: "بازو", eq: "دستگاه" },
  { n: "پلانک", c: "شکم", eq: "وزن بدن" }, { n: "دوچرخه ثابت", c: "هوازی", eq: "دستگاه" },
];

export const WORKOUT = [
  { name: "پرس سینه هالتر", part: "سینه", last: "هفته قبل: ۳×۱۰ با ۴۰", sets: [{ r: 10, w: 42.5, d: true }, { r: 10, w: 45, d: true }, { r: 8, w: 47.5, d: false }] },
  { name: "اسکات پشت", part: "پا", last: "هفته قبل: ۳×۸ با ۵۵", sets: [{ r: 8, w: 60, d: false }, { r: 8, w: 60, d: false }, { r: 6, w: 65, d: false }] },
  { name: "زیربغل سیم‌کش", part: "پشت", last: "اولین بار", sets: [{ r: 12, w: 35, d: false }, { r: 12, w: 35, d: false }] },
];
