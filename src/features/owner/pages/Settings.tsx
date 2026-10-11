import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Seg } from '../../../components/ui/Seg';
import { Btn } from '../../../components/ui/Btn';
import { Avatar } from '../../../components/ui/Avatar';
import { fa } from '../../../lib/format';
import { getGym } from '../../../api/gym';
import { getTrainers } from '../../../api/trainers';
import { Gym, Trainer } from '../../../lib/domain/gymManagement';

export interface SettingsProps {
  isMobile?: boolean;
}

export function Settings({ isMobile = false }: SettingsProps) {
  const [gym, setGym] = useState<Gym | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [capacity, setCapacity] = useState(30);
  const [hourlyCapacity, setHourlyCapacity] = useState(6);
  const [noShowDeducts, setNoShowDeducts] = useState(true);

  const [lang, setLang] = useState<'fa' | 'en'>(() => {
    return (localStorage.getItem('hg_lang') as 'fa' | 'en') || 'fa';
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('hg_theme') as 'light' | 'dark' | 'system') || 'system';
  });

  useEffect(() => {
    async function load() {
      try {
        const [gymData, trData] = await Promise.all([getGym(), getTrainers()]);
        setGym(gymData);
        if (gymData.capacity) setCapacity(gymData.capacity);
        setTrainers(trData);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    }
    load();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('hg_theme', newTheme);
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    if (newTheme === 'dark' || (newTheme === 'system' && mediaQuery.matches)) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  };

  const handleLangChange = (newLang: 'fa' | 'en') => {
    setLang(newLang);
    localStorage.setItem('hg_lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'fa' ? 'rtl' : 'ltr';
  };

  const Row = ({
    label,
    subtitle,
    children,
  }: {
    label: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => (
    <div
      style={{ borderColor: 'var(--c-surface-2)' }}
      className={`py-4 border-b last:border-0 flex ${
        isMobile ? 'flex-col gap-2.5' : 'items-center justify-between gap-6'
      }`}
    >
      <div>
        <div
          className="font-bold text-[15px]"
          style={{ color: 'var(--c-deep)' }}
        >
          {label}
        </div>
        {subtitle && (
          <div
            className="text-[13px] mt-0.5"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className={`space-y-6 ${!isMobile ? 'max-w-3xl' : ''}`}>
      {/* ۱. تنظیمات باشگاه */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-5 rounded-2xl border shadow-xs"
      >
        <div
          className="text-[13px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--c-brass)' }}
        >
          مشخصات و ظرفیت سالن
        </div>

        <Row label="نام باشگاه" subtitle="عنوان نمایش‌داده‌شده در سربرگ">
          <div
            style={{
              backgroundColor: 'var(--c-surface-2)',
              borderColor: 'var(--c-border)',
            }}
            className="h-10 px-4 rounded-xl border flex items-center min-w-[220px] text-[14px] font-bold"
          >
            {gym?.name || 'باشگاه آیرون هیون (Iron Haven)'}
          </div>
        </Row>

        <Row label="حداکثر ظرفیت روزانه" subtitle="سقف پذیرش ورزشکار در هر روز">
          <div className="flex items-center gap-2">
            <Btn
              v="soft"
              className="w-9 h-9 p-0"
              onClick={() => setCapacity(c => Math.max(1, c - 1))}
            >
              <Minus size={15} />
            </Btn>
            <span
              style={{ color: 'var(--c-deep)' }}
              className="w-12 text-center font-bold text-[18px] tnum"
            >
              {fa(capacity)}
            </span>
            <Btn
              v="soft"
              className="w-9 h-9 p-0"
              onClick={() => setCapacity(c => c + 1)}
            >
              <Plus size={15} />
            </Btn>
          </div>
        </Row>

        <Row label="ظرفیت همزمان هر ساعت" subtitle="تعداد نوبت‌های مجاز در یک سانس">
          <div className="flex items-center gap-2">
            <Btn
              v="soft"
              className="w-9 h-9 p-0"
              onClick={() => setHourlyCapacity(c => Math.max(1, c - 1))}
            >
              <Minus size={15} />
            </Btn>
            <span
              style={{ color: 'var(--c-deep)' }}
              className="w-12 text-center font-bold text-[18px] tnum"
            >
              {fa(hourlyCapacity)}
            </span>
            <Btn
              v="soft"
              className="w-9 h-9 p-0"
              onClick={() => setHourlyCapacity(c => c + 1)}
            >
              <Plus size={15} />
            </Btn>
          </div>
        </Row>
      </section>

      {/* ۲. قوانین و هشدارها */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-5 rounded-2xl border shadow-xs"
      >
        <div
          className="text-[13px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--c-brass)' }}
        >
          قوانین حضور و جلسات
        </div>

        <Row
          label="کسر جلسه در صورت غیبت (No-Show)"
          subtitle="اگر ورزشکار بدون هماهنگی قبلی حاضر نشود"
        >
          <button
            type="button"
            onClick={() => setNoShowDeducts(!noShowDeducts)}
            style={{
              backgroundColor: noShowDeducts
                ? 'var(--c-ink)'
                : 'var(--c-border-strong)',
            }}
            className="relative h-7 w-12 rounded-full transition-colors duration-200 cursor-pointer select-none"
            aria-label="سیاست غیبت"
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all shadow-xs ${
                noShowDeducts ? 'right-6' : 'right-1'
              }`}
            />
          </button>
        </Row>

        <Row
          label="آستانه هشدار تمدید بسته"
          subtitle="نمایش هشدار رنگی به محض رسیدن به این تعداد"
        >
          <span
            style={{
              backgroundColor: 'var(--c-status-noshow-bg)',
              color: 'var(--c-rubber)',
            }}
            className="h-9 px-4 rounded-xl font-bold text-sm inline-flex items-center"
          >
            ۲ جلسه مانده
          </span>
        </Row>
      </section>

      {/* ۳. ظاهر و پوسته */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-5 rounded-2xl border shadow-xs"
      >
        <div
          className="text-[13px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--c-brass)' }}
        >
          شخصی‌سازی ظاهر
        </div>

        <Row label="زبان سامانه" subtitle="جهت نمایش متون و ارقام">
          <Seg
            value={lang}
            onChange={v => handleLangChange(v as 'fa' | 'en')}
            items={[
              ['fa', 'فارسی (RTL)'],
              ['en', 'English'],
            ]}
          />
        </Row>

        <Row label="پوسته نمایشی" subtitle="پشتیبانی از حالت تیره واقعی (G4)">
          <Seg
            value={theme}
            onChange={v => handleThemeChange(v as 'light' | 'dark' | 'system')}
            items={[
              ['light', 'روشن'],
              ['dark', 'تیره'],
              ['system', 'خودکار'],
            ]}
          />
        </Row>
      </section>

      {/* ۴. حساب‌های کاربری مربیان */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-5 rounded-2xl border shadow-xs"
      >
        <div
          className="text-[13px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--c-brass)' }}
        >
          مربیان و دسترسی‌ها
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {trainers.map(t => (
            <div key={t.id} className="py-3 flex items-center gap-3">
              <Avatar name={t.name} size={36} tone="ink" />
              <div className="flex-1 min-w-0">
                <div
                  className="font-bold text-[14px]"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {t.name}
                </div>
                <div
                  className="text-[12px]"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {t.specialty}
                </div>
              </div>
              <span
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  color: 'var(--c-text-muted)',
                }}
                className="text-xs px-2.5 py-1 rounded-md font-medium"
              >
                مربی
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3">
          <Btn v="ghost" className="text-xs gap-1.5 w-full sm:w-auto">
            <Plus size={15} />
            دعوت مربی جدید
          </Btn>
        </div>
      </section>
    </div>
  );
}
