import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Meter } from '../../../components/ui/Meter';
import { num } from '../../../lib/format';
import { displayName } from '../../../lib/displayName';
import { useI18n } from '../../../components/LanguageProvider';
import { getMemberSessions } from '../../../api/members';
import { formatJalaliLocalized } from '../../../lib/date/jalali';
import { getMembers } from '../../../api/members';
import { getCurrentUser } from '../../../api/auth';
import { Member } from '../../../lib/domain/gymManagement';

export function Athletes() {
  const { t, isFa } = useI18n();
  const currentTrainerId = getCurrentUser()?.entityId || 't-ali';
  const [members, setMembers] = useState<Member[]>([]);
  const [lastSessionBy, setLastSessionBy] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMembers();
        // فیلتر اعضای این مربی یا تمام اعضا در صورت مربی عمومی
        const mine = data.filter(
          m => !m.defaultTrainerId || m.defaultTrainerId === currentTrainerId
        );
        setMembers(mine);

        // آخرین جلسهٔ هر ورزشکار از داده‌های واقعی استور
        const allSessions = await Promise.all(
          mine.map(m => getMemberSessions(m.id))
        );
        const lastByMember: Record<string, string> = {};
        for (const sessions of allSessions) {
          for (const s of sessions) {
            if (s.status !== 'completed' || s.date === 'Today') continue;
            if (!lastByMember[s.memberId] || s.date > lastByMember[s.memberId]) {
              lastByMember[s.memberId] = s.date;
            }
          }
        }
        setLastSessionBy(lastByMember);
      } catch (err) {
        console.error('Error fetching athletes:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentTrainerId]);

  const filtered = members.filter(m => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return m.name.toLowerCase().includes(q) || m.phone.includes(q);
  });

  return (
    <div className="space-y-3">
      {/* نوار جستجوی ورزشکار */}
      <div
        style={{
          backgroundColor: 'var(--c-surface-1)',
          borderColor: 'var(--c-border)',
        }}
        className="flex items-center gap-2 h-11 px-3 rounded-xl border text-slate-400"
      >
        <Search size={18} className="shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.trainer.athletes.searchPlaceholder}
          className="w-full bg-transparent border-none outline-hidden text-[14px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {loading && (
        <div
          className="py-12 text-center text-sm"
          style={{ color: 'var(--c-text-muted)' }}
        >
          {t.trainer.athletes.loading}
        </div>
      )}

      {/* فهرست کارت‌های ورزشکاران */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map(m => {
            const isLow = m.remainingSessions <= 2;
            return (
              <div
                key={m.id}
                style={{
                  backgroundColor: 'var(--c-surface-1)',
                  borderColor: 'var(--c-border)',
                }}
                className="p-4 rounded-2xl border shadow-xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={displayName(m.name, isFa)} size={42} tone="ink" />
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold text-[15px] truncate"
                      style={{ color: 'var(--c-deep)' }}
                    >
                      displayName(m.name, isFa)
                    </div>
                    <div
                      className="text-[13px] truncate"
                      style={{ color: 'var(--c-text-muted)' }}
                    >
                      {m.packageName} ·{' '}
                      {lastSessionBy[m.id]
                        ? t.trainer.athletes.lastSession.replace(
                            '{date}',
                            formatJalaliLocalized(lastSessionBy[m.id], isFa)
                          )
                        : t.trainer.athletes.noLastSession}
                    </div>
                  </div>
                  <span
                    style={{
                      color: isLow ? 'var(--c-rubber)' : 'var(--c-ink)',
                    }}
                    className="font-display text-[26px] leading-none tnum"
                  >
                    {num(m.remainingSessions)}
                    <span className="text-[12px] font-sans font-normal opacity-70 ms-1">
                      {t.units.sessions}
                    </span>
                  </span>
                </div>

                <div className="mt-3">
                  <Meter total={m.totalSessions} used={m.usedSessions} />
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="py-12 text-center rounded-2xl border text-sm"
            >
              {t.trainer.athletes.empty}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
