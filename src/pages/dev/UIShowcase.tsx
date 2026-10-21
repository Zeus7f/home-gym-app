import React, { useState } from 'react';
import { H } from '../../components/ui/H';
import { Pill, StatusDot, SessionStatus } from '../../components/ui/Pill';
import { Avatar } from '../../components/ui/Avatar';
import { Meter } from '../../components/ui/Meter';
import { Seg } from '../../components/ui/Seg';
import { Chips } from '../../components/ui/Chips';
import { Capacity } from '../../components/ui/Capacity';
import { Button } from '../../components/ui/Button';

export default function UIShowcase() {
  const [segVal, setSegVal] = useState<'all' | 'active' | 'debt'>('all');
  const [chipVal, setChipVal] = useState('all');

  const segItems = [
    ['all', 'همه اعضا'],
    ['active', 'فعال'],
    ['debt', 'بدهکاران'],
  ] as const;

  const chipItems = [
    ['all', 'همه حرکات'],
    ['chest', 'سینه'],
    ['back', 'زیربغل'],
    ['legs', 'پا'],
    ['shoulders', 'سرشانه'],
    ['arms', 'بازو'],
  ] as const;

  const allStatuses: SessionStatus[] = ['done', 'live', 'wait', 'cancel', 'noshow'];

  return (
    <div
      dir="rtl"
      className="max-w-5xl mx-auto space-y-10 py-6"
    >
      <div className="border-b pb-4" style={{ borderColor: 'var(--c-border)' }}>
        <h1 className="text-2xl font-black" style={{ color: 'var(--c-deep)' }}>
          ویترین کامپوننت‌های مشترک UI (فاز ۳)
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-muted)' }}>
          پیش‌نمایش تعاملی کامپوننت‌های ریدیزاین با سیستم توکن‌های طراحی (بدون هگز مستقیم).
        </p>
      </div>

      {/* 1. Header (H) */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          ۱. کامپوننت H (هدر بخش‌ها)
        </h3>
        <div
          className="p-5 rounded-xl border bg-white dark:bg-slate-900"
          style={{ borderColor: 'var(--c-border)' }}
        >
          <H
            sub="مدیریت سانس‌ها و ورزشکاران حاضر"
            action={<Button size="sm">افزودن عضو جدید</Button>}
          >
            برنامه تمرینی امروز
          </H>
        </div>
      </section>

      {/* 2. Avatar */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          ۲. کامپوننت Avatar
        </h3>
        <div
          className="p-5 rounded-xl border flex flex-wrap items-center gap-6 bg-white dark:bg-slate-900"
          style={{ borderColor: 'var(--c-border)' }}
        >
          <div className="flex items-center gap-2">
            <Avatar name="علی محمدی" size={48} tone="ink" />
            <span className="text-xs font-medium">Tone Ink (48px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar name="سارا کریمی" size={40} tone="brass" />
            <span className="text-xs font-medium">Tone Brass (40px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar name="مهدی رحیمی" size={32} tone="mist" />
            <span className="text-xs font-medium">Tone Mist (32px)</span>
          </div>
        </div>
      </section>

      {/* 3. Pill & StatusDot */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          ۳. کامپوننت Pill و StatusDot (وضعیت جلسات)
        </h3>
        <div
          className="p-5 rounded-xl border flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900"
          style={{ borderColor: 'var(--c-border)' }}
        >
          {allStatuses.map(st => (
            <div key={st} className="flex items-center gap-2">
              <StatusDot status={st} />
              <Pill status={st} />
            </div>
          ))}
        </div>
      </section>

      {/* 4. Meter */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          ۴. کامپوننت Meter (تیک‌های جلسات باقیمانده)
        </h3>
        <div
          className="p-5 rounded-xl border space-y-4 max-w-md bg-white dark:bg-slate-900"
          style={{ borderColor: 'var(--c-border)' }}
        >
          <div>
            <div className="text-xs mb-1 font-medium">وضعیت عادی (۸ باقیمانده از ۱۲):</div>
            <Meter total={12} used={4} />
          </div>
          <div>
            <div className="text-xs mb-1 font-medium text-rose-600 font-bold">
              هشدار مانده کم جلسات (۱ باقیمانده از ۸ - رنگ Rubber):
            </div>
            <Meter total={8} used={7} />
          </div>
          <div>
            <div className="text-xs mb-1 font-medium">تکمیل‌شده (۰ باقیمانده از ۱۶):</div>
            <Meter total={16} used={16} />
          </div>
        </div>
      </section>

      {/* 5. Seg & Chips */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          ۵. کامپوننت‌های Seg (Segmented Control) و Chips
        </h3>
        <div
          className="p-5 rounded-xl border space-y-5 bg-white dark:bg-slate-900"
          style={{ borderColor: 'var(--c-border)' }}
        >
          <div>
            <div className="text-xs mb-2 font-medium">Segmented Control انتخابی:</div>
            <Seg<'all' | 'active' | 'debt'>
              items={segItems}
              value={segVal}
              onChange={setSegVal}
            />
          </div>
          <div>
            <div className="text-xs mb-2 font-medium">چیپ‌های فیلتر کاتالوگ حرکات:</div>
            <Chips items={chipItems} value={chipVal} onChange={setChipVal} />
          </div>
        </div>
      </section>

      {/* 6. Capacity */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          ۶. کامپوننت Capacity (شاخص کامل ظرفیت امروز باشگاه)
        </h3>
        <div className="space-y-6">
          <div>
            <div className="text-xs mb-2 font-medium">حالت استاندارد دسکتاپ:</div>
            <Capacity />
          </div>
          <div className="max-w-md">
            <div className="text-xs mb-2 font-medium">حالت فشرده (Compact - مناسب موبایل/سایدبار):</div>
            <Capacity compact />
          </div>
        </div>
      </section>
    </div>
  );
}
