import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Seg } from '../../../components/ui/Seg';
import { Btn } from '../../../components/ui/Btn';
import { Avatar } from '../../../components/ui/Avatar';
import { useI18n } from '../../../components/LanguageProvider';
import { displayName, localizedLabel } from '../../../lib/displayName';
import { num } from '../../../lib/format';
import { getGym, updateGymSettings } from '../../../api/gym';
import { Toast } from '../../../components/ui/Toast';
import { getTrainers } from '../../../api/trainers';
import { Gym, Trainer } from '../../../lib/domain/gymManagement';
import { useThemePreference, type ThemePreference } from '../../../lib/theme';

export interface SettingsProps {
  isMobile?: boolean;
}

export function Settings({ isMobile = false }: SettingsProps) {
  const { t, lang, setLang, isFa } = useI18n();
  const [gym, setGym] = useState<Gym | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [capacity, setCapacity] = useState(30);
  const [hourlyCapacity, setHourlyCapacity] = useState(6);
  const [noShowDeducts, setNoShowDeducts] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const [theme, setThemePreference] = useThemePreference();

  useEffect(() => {
    async function load() {
      try {
        const [gymData, trData] = await Promise.all([getGym(), getTrainers()]);
        setGym(gymData);
        if (gymData.capacity) setCapacity(gymData.capacity);
        if (gymData.hourlyCapacity) setHourlyCapacity(gymData.hourlyCapacity);
        setNoShowDeducts(Boolean(gymData.noShowDeductsSession));
        setTrainers(trData);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    }
    load();
  }, []);

  /**
   * B-13: هر تغییر بلافاصله در استور ذخیره می‌شود (و در قوانین رزرو اعمال می‌شود).
   * در صورت خطا، مقدار قبلی برمی‌گردد.
   */
  const persist = async (
    patch: Parameters<typeof updateGymSettings>[0],
    rollback: () => void
  ) => {
    const res = await updateGymSettings(patch);
    if (!res.success) rollback();
    setToast({ message: res.message, ok: res.success });
  };

  const changeCapacity = (next: number) => {
    const prev = capacity;
    const value = Math.max(1, next);
    setCapacity(value);
    persist({ capacity: value }, () => setCapacity(prev));
  };

  const changeHourlyCapacity = (next: number) => {
    const prev = hourlyCapacity;
    const value = Math.max(1, next);
    setHourlyCapacity(value);
    persist({ hourlyCapacity: value }, () => setHourlyCapacity(prev));
  };

  const toggleNoShowDeducts = () => {
    const prev = noShowDeducts;
    setNoShowDeducts(!prev);
    persist({ noShowDeductsSession: !prev }, () => setNoShowDeducts(prev));
  };

  const handleThemeChange = (newTheme: ThemePreference) => {
    setThemePreference(newTheme);
  };

  const handleLangChange = (newLang: 'fa' | 'en') => {
    setLang(newLang);
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
          {t.owner.settings.gymSub}
        </div>

        <Row
          label={t.owner.settings.gymName}
          subtitle={t.owner.settings.displayHint}
        >
          <div
            style={{
              backgroundColor: 'var(--c-surface-2)',
              borderColor: 'var(--c-border)',
            }}
            className="h-10 px-4 rounded-xl border flex items-center min-w-[220px] text-[14px] font-bold"
          >
            {gym?.name || t.owner.settings.gymNamePlaceholder}
          </div>
        </Row>

        <Row
          label={t.owner.settings.maxDailyCapacity}
          subtitle={t.owner.settings.maxDailyCapacityHint}
        >
          <div className="flex items-center gap-2">
            <Btn
              v="soft"
              className="w-9 h-9 p-0"
              onClick={() => changeCapacity(capacity - 1)}
              disabled={capacity <= 1}
              aria-label={`${t.owner.settings.maxDailyCapacity} −1`}
            >
              <Minus size={15} />
            </Btn>
            <span
              style={{ color: 'var(--c-deep)' }}
              className="w-12 text-center font-bold text-[18px] tnum"
            >
              {num(capacity)}
            </span>
            <Btn
              v="soft"
              className="w-9 h-9 p-0"
              onClick={() => changeCapacity(capacity + 1)}
              aria-label={`${t.owner.settings.maxDailyCapacity} +1`}
            >
              <Plus size={15} />
            </Btn>
          </div>
        </Row>

        <Row
          label={t.owner.settings.slotsPerHour}
          subtitle={t.owner.settings.slotsPerHourHint}
        >
          <div className="flex items-center gap-2">
            <Btn
              v="soft"
              className="w-9 h-9 p-0"
              onClick={() => changeHourlyCapacity(hourlyCapacity - 1)}
              disabled={hourlyCapacity <= 1}
              aria-label={`${t.owner.settings.slotsPerHour} −1`}
            >
              <Minus size={15} />
            </Btn>
            <span
              style={{ color: 'var(--c-deep)' }}
              className="w-12 text-center font-bold text-[18px] tnum"
            >
              {num(hourlyCapacity)}
            </span>
            <Btn
              v="soft"
              className="w-9 h-9 p-0"
              onClick={() => changeHourlyCapacity(hourlyCapacity + 1)}
              aria-label={`${t.owner.settings.slotsPerHour} +1`}
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
          {t.owner.settings.rulesSub}
        </div>

        <Row
          label={t.owner.settings.noShowDeduct}
          subtitle={t.owner.settings.noShowHint}
        >
          <button
            type="button"
            onClick={toggleNoShowDeducts}
            role="switch"
            aria-checked={noShowDeducts}
            style={{
              backgroundColor: noShowDeducts
                ? 'var(--c-ink)'
                : 'var(--c-border-strong)',
            }}
            className="relative h-7 w-12 rounded-full transition-colors duration-200 cursor-pointer select-none"
            aria-label={t.owner.settings.noShowPolicyAria}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all shadow-xs ${
                noShowDeducts ? 'right-6' : 'right-1'
              }`}
            />
          </button>
        </Row>

        <Row
          label={t.owner.settings.lowBalanceThreshold}
          subtitle={t.owner.settings.lowBalanceHint}
        >
          <span
            style={{
              backgroundColor: 'var(--c-status-noshow-bg)',
              color: 'var(--c-rubber)',
            }}
            className="h-9 px-4 rounded-xl font-bold text-sm inline-flex items-center"
          >
            {t.owner.settings.lowBalanceExample}
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
          {t.owner.settings.appearanceSub}
        </div>

        <Row
          label={t.owner.settings.language}
          subtitle={t.owner.settings.languageHint}
        >
          <Seg
            value={lang}
            onChange={v => handleLangChange(v as 'fa' | 'en')}
            ariaLabel={t.owner.settings.language}
            items={[
              ['fa', t.owner.settings.persian],
              ['en', t.owner.settings.english],
            ]}
          />
        </Row>

        <Row
          label={t.owner.settings.theme}
          subtitle={t.owner.settings.themeHint}
        >
          <Seg
            value={theme}
            onChange={v => handleThemeChange(v as ThemePreference)}
            ariaLabel={t.owner.settings.theme}
            items={[
              ['light', t.owner.settings.light],
              ['dark', t.owner.settings.dark],
              ['system', t.owner.settings.auto],
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
          {t.owner.settings.trainersAccess}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {trainers.map(trainer => (
            <div key={trainer.id} className="py-3 flex items-center gap-3">
              <Avatar name={displayName(trainer.name, isFa)} size={36} tone="ink" />
              <div className="flex-1 min-w-0">
                <div
                  className="font-bold text-[14px]"
                  style={{ color: 'var(--c-deep)' }}
                >
                  {displayName(trainer.name, isFa)}
                </div>
                <div
                  className="text-[12px]"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {localizedLabel(trainer.specialty, isFa)}
                </div>
              </div>
              <span
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  color: 'var(--c-text-muted)',
                }}
                className="text-xs px-2.5 py-1 rounded-md font-medium"
              >
                {t.owner.members.trainer}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3">
          <Btn v="ghost" className="text-xs gap-1.5 w-full sm:w-auto">
            <Plus size={15} />
            {t.owner.settings.inviteTrainer}
          </Btn>
        </div>
      </section>
      <Toast
        message={toast?.message ?? null}
        type={toast?.ok === false ? 'warning' : 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
