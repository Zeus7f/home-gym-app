import React, { useState, useEffect } from 'react';
import { Avatar } from '../../../components/ui/Avatar';
import { Btn } from '../../../components/ui/Btn';
import { num, short, toman } from '../../../lib/format';
import { useI18n } from '../../../components/LanguageProvider';
import { displayName, localizedLabel } from '../../../lib/displayName';
import { getTrainers, recordTrainerPayout } from '../../../api/trainers';
import { getTodaySessions } from '../../../api/sessions';
import { Trainer, DailySession } from '../../../lib/domain/gymManagement';

export interface TrainersProps {
  isMobile?: boolean;
}

export function Trainers({ isMobile = false }: TrainersProps) {
  const { t, isFa } = useI18n();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [todaySessions, setTodaySessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [trData, sessData] = await Promise.all([
          getTrainers(),
          getTodaySessions(),
        ]);
        setTrainers(trData);
        setTodaySessions(sessData);
      } catch (err) {
        console.error('Error fetching trainers:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePayout = async (trainerId: string, owed: number) => {
    if (owed <= 0) return;
    await recordTrainerPayout(trainerId, owed, 'card', t.owner.trainers.title);
    const updated = await getTrainers();
    setTrainers(updated);
  };

  if (loading) {
    return (
      <div
        className="py-12 text-center text-sm"
        style={{ color: 'var(--c-text-muted)' }}
      >
        {t.owner.trainers.loading}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {trainers.map(trainer => {
        const mine = todaySessions.filter(
          s => s.trainerId === trainer.id && s.status !== 'cancelled'
        );
        const cap = trainer.dailyCapacity || 6;
        const owed = Math.max(0, trainer.outstandingCompensation);

        return (
          <div
            key={trainer.id}
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="p-5 rounded-2xl border shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* هدر کارت مربی */}
              <div className="flex items-center gap-3">
                <Avatar name={displayName(trainer.name, isFa)} size={48} tone="ink" />
                <div className="min-w-0">
                  <div
                    className="text-[17px] font-bold truncate"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {displayName(trainer.name, isFa)}
                  </div>
                  <div
                    className="text-[13px] truncate"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {localizedLabel(trainer.specialty, isFa)}
                  </div>
                </div>
              </div>

              {/* ظرفیت امروز مربی */}
              <div
                className="mt-4 text-[14px]"
                style={{ color: 'var(--c-text-muted)' }}
              >
                {t.owner.trainers.today} {num(mine.length)} {t.owner.trainers.of}{' '}
                {num(cap)} {t.owner.trainers.slots}
              </div>

              <div className="mt-2 flex gap-1">
                {Array.from({ length: cap }, (_, i) => {
                  const s = mine[i];
                  const isLive = s?.status === 'in_progress';
                  const isDone = s?.status === 'completed';
                  const tickBg = isLive
                    ? 'var(--c-brass)'
                    : isDone
                      ? 'var(--c-ink)'
                      : s
                        ? 'var(--c-steel)'
                        : 'var(--c-surface-2)';

                  return (
                    <span
                      key={i}
                      style={{ backgroundColor: tickBg }}
                      className={`h-7 flex-1 rounded-md transition-colors ${isLive ? 'live-pulse' : ''}`}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>

              {/* جزئیات قرارداد و ساعات */}
              <div
                style={{ borderColor: 'var(--c-surface-2)' }}
                className="mt-4 grid grid-cols-2 gap-3 text-[13px] pt-3 border-t"
              >
                <div>
                  <div style={{ color: 'var(--c-text-muted)' }}>
                    {t.owner.trainers.workingHours}
                  </div>
                  <div
                    className="font-semibold mt-0.5"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {trainer.workingHours || t.owner.trainers.defaultWorkingHours}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--c-text-muted)' }}>
                    {t.owner.trainers.sessionRate}
                  </div>
                  <div
                    className="font-semibold mt-0.5 tnum"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {short(trainer.sessionRate)} {t.units.toman}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--c-text-muted)' }}>
                    {t.owner.trainers.completed}
                  </div>
                  <div
                    className="font-semibold mt-0.5 tnum"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {num(trainer.completedSessions)} {t.owner.trainers.sessions}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--c-text-muted)' }}>
                    {t.owner.trainers.workingDays}
                  </div>
                  <div
                    className="font-semibold mt-0.5"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {trainer.workingDays
                      ? t.owner.trainers.perWeek.replace(
                          '{count}',
                          num(trainer.workingDays.length)
                        )
                      : t.owner.trainers.allWeek}
                  </div>
                </div>
              </div>
            </div>

            {/* مانده طلب و دکمه تسویه */}
            <div
              style={{ backgroundColor: 'var(--c-surface-2)' }}
              className="mt-5 rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div
                  className="text-[13px]"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {t.owner.trainers.outstanding}
                </div>
                <div
                  style={{ color: 'var(--c-ink)' }}
                  className="font-display text-[22px] tnum leading-tight mt-0.5"
                >
                  {toman(owed)}
                </div>
              </div>
              <Btn
                v="brass"
                className="h-9 px-3.5 text-xs font-bold"
                onClick={() => handlePayout(trainer.id, owed)}
                disabled={owed <= 0}
              >
                {t.owner.trainers.recordPayout}
              </Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}
