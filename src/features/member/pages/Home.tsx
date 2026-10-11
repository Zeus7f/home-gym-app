import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { H } from '../../../components/ui/H';
import { PlateHero } from '../components/PlateHero';
import { fa, toman } from '../../../lib/format';
import { mockStore } from '../../../lib/supabase/mockStore';
import { getMember } from '../../../api/members';
import { Member } from '../../../lib/domain/gymManagement';

export interface HomeProps {
  onNavigateTab: (tab: string) => void;
}

export function Home({ onNavigateTab }: HomeProps) {
  const currentUser = mockStore.currentUser;
  const memberName = currentUser?.displayName || 'نیلوفر صادقی';
  const gymName = mockStore.gym?.name || 'باشگاه آیرون هیون';

  const [memberData, setMemberData] = useState<Member | null>(null);

  useEffect(() => {
    async function load() {
      if (currentUser?.entityId) {
        const mem = await getMember(currentUser.entityId);
        if (mem) setMemberData(mem);
      }
    }
    load();
  }, [currentUser]);

  const total = memberData?.totalSessions || 12;
  const used = memberData?.usedSessions || 8;
  const remaining = memberData?.remainingSessions ?? Math.max(0, total - used);
  const debt = memberData?.outstandingBalance || 0;
  const expDate = memberData?.expirationDate || '۳۰ آبان ۱۴۰۵';

  // روزهای حضور در هفته جاری (شنبه تا جمعه)
  const weekVisits = [
    { label: 'ش', status: 1 }, // ۱ = حضور
    { label: 'ی', status: 0 },
    { label: 'د', status: 1 },
    { label: 'س', status: 0 },
    { label: 'چ', status: 0 },
    { label: 'پ', status: 2 }, // ۲ = امروز یا نوبت رزرو شده
    { label: 'ج', status: 0 },
  ];

  return (
    <div className="space-y-4">
      {/* ۱. هیرو کارت سرمه‌ای وضعیت بسته ورزشکار */}
      <section
        style={{
          backgroundColor: 'var(--c-ink)',
          color: '#ffffff',
        }}
        className="px-5 pt-8 pb-6 rounded-3xl shadow-md select-none -mx-4 -mt-5 sm:mx-0 sm:mt-0"
        aria-label="وضعیت بسته تمرینی"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] opacity-80">سلام {memberName}</div>
            <div className="font-display text-[26px] leading-tight text-white mt-0.5">
              {gymName}
            </div>
          </div>

          <button
            type="button"
            style={{ backgroundColor: 'var(--c-deep)' }}
            className="h-10 w-10 rounded-full grid place-items-center relative text-white hover:opacity-90 transition-opacity"
            aria-label="اعلان‌های ورزشی"
          >
            <Bell size={18} />
            <span
              style={{ backgroundColor: 'var(--c-brass)' }}
              className="absolute top-2 left-2.5 h-2 w-2 rounded-full"
            />
          </button>
        </div>

        {/* جلسات باقیمانده و صفحات وزنه PlateHero */}
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[13px] opacity-80">جلسات باقیمانده</div>
            <div
              style={{
                color: remaining <= 2 ? 'var(--c-rubber)' : 'var(--c-brass)',
              }}
              className="font-display text-[64px] sm:text-[72px] leading-[0.85] tnum mt-1"
            >
              {fa(remaining)}
            </div>
            <div className="text-[13px] opacity-80 mt-2">
              از {fa(total)} جلسه · انقضا تا {expDate}
            </div>
          </div>

          <PlateHero total={total} remaining={remaining} height={76} plateWidth={9} />
        </div>

        {/* نوار وضعیت بدهی (در صورت وجود بدهی) */}
        {debt > 0 && (
          <div
            style={{ backgroundColor: 'var(--c-deep)' }}
            className="mt-4 rounded-xl px-3.5 py-2.5 text-[14px] flex items-center justify-between text-slate-100"
          >
            <span className="opacity-90">بدهی باقیمانده بسته</span>
            <b style={{ color: 'var(--c-rubber)' }} className="tnum font-bold">
              {toman(debt)}
            </b>
          </div>
        )}
      </section>

      {/* ۲. کارت نوبت بعدی */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border flex items-center gap-4 shadow-xs"
        aria-label="نوبت بعدی"
      >
        <div className="text-center w-14 shrink-0">
          <div className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            پنجشنبه
          </div>
          <div
            style={{ color: 'var(--c-ink)' }}
            className="font-display text-[32px] leading-none mt-0.5"
          >
            {fa(16)}
          </div>
        </div>

        <div
          style={{ borderColor: 'var(--c-border)' }}
          className="flex-1 border-r pr-4"
        >
          <div
            style={{ color: 'var(--c-brass)' }}
            className="text-[13px] font-bold"
          >
            نوبت بعدی سالن
          </div>
          <div
            className="font-extrabold text-[15px] mt-0.5"
            style={{ color: 'var(--c-deep)' }}
          >
            ساعت ۰۸:۰۰ با سارا کریمی
          </div>
        </div>
      </section>

      {/* ۳. آخرین تمرین انجام‌شده */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
        aria-label="خلاصه آخرین تمرین"
      >
        <H
          action={
            <button
              type="button"
              onClick={() => onNavigateTab('ex')}
              style={{ color: 'var(--c-steel)' }}
              className="text-[14px] font-bold hover:underline cursor-pointer"
            >
              مشاهده جزئیات
            </button>
          }
        >
          آخرین تمرین
        </H>

        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {[
            ['اسکات گابلت', '۳ × ۱۲ · ۱۶ کیلوگرم'],
            ['لانج با دمبل', '۳ × ۱۰ · ۱۰ کیلوگرم'],
            ['پلانک شکم', '۳ × ۴۵ ثانیه'],
          ].map(([name, desc]) => (
            <div
              key={name}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <span className="font-semibold" style={{ color: 'var(--c-deep)' }}>
                {name}
              </span>
              <span className="tnum font-medium" style={{ color: 'var(--c-text-muted)' }}>
                {desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ۴. نوار روزهای حضور در هفته جاری */}
      <section
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="p-4 rounded-2xl border shadow-xs"
        aria-label="آمار حضور هفتگی"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-[15px]" style={{ color: 'var(--c-deep)' }}>
            حضور در این هفته
          </span>
          <span className="text-[13px]" style={{ color: 'var(--c-text-muted)' }}>
            ۲ مراجعه ثبت‌شده
          </span>
        </div>

        <div className="flex justify-between items-end pt-1">
          {weekVisits.map((item, index) => {
            const barBg =
              item.status === 1
                ? 'var(--c-ink)'
                : item.status === 2
                  ? 'var(--c-brass)'
                  : 'var(--c-surface-2)';

            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1.5 flex-1"
              >
                <span
                  style={{ backgroundColor: barBg }}
                  className="h-10 w-3 rounded-sm transition-colors"
                  aria-hidden="true"
                />
                <span
                  style={{
                    color:
                      item.status === 2
                        ? 'var(--c-brass)'
                        : 'var(--c-text-muted)',
                  }}
                  className={`text-[13px] ${item.status === 2 ? 'font-bold' : ''}`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
