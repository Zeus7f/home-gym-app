import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { Chips } from '../../../components/ui/Chips';
import { Avatar } from '../../../components/ui/Avatar';
import { Meter } from '../../../components/ui/Meter';
import { MemberData } from '../components/MemberSheet';
import { num, short, toman } from '../../../lib/format';
import { useI18n } from '../../../components/LanguageProvider';
import { displayName, localizedLabel } from '../../../lib/displayName';
import { getMembers } from '../../../api/members';
import { Member } from '../../../lib/domain/gymManagement';

export interface MembersProps {
  onOpenMember?: (member: MemberData) => void;
  isMobile?: boolean;
}

export function Members({ onOpenMember, isMobile = false }: MembersProps) {
  const { t, isFa } = useI18n();
  const [filter, setFilter] = useState<'all' | 'low' | 'debt' | 'exp'>('all');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMembers();
        setMembers(data);
      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = members.filter(m => {
    // جستجو بر اساس نام یا شماره تماس
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchPhone = m.phone.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    if (filter === 'low') return m.status === 'active' && m.remainingSessions <= 2;
    if (filter === 'debt') return m.outstandingBalance > 0;
    if (filter === 'exp') return m.status === 'expired';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* ردیف جستجو و فیلترها */}
      <div
        className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-3`}
      >
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className={`flex items-center gap-2 h-11 px-3 rounded-xl border text-slate-400 ${isMobile ? 'w-full' : 'w-80'}`}
        >
          <Search size={18} className="shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.owner.members.searchPlaceholder}
            className="w-full bg-transparent border-none outline-hidden text-[14px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <Chips<'all' | 'low' | 'debt' | 'exp'>
          value={filter}
          onChange={setFilter}
          items={[
            ['all', `${t.owner.members.filterAll} · ${num(members.length)}`],
            ['low', t.owner.members.filterLow],
            ['debt', t.owner.members.filterDebtor],
            ['exp', t.owner.members.filterExpired],
          ]}
        />
      </div>

      {loading && (
        <div
          className="py-12 text-center text-sm"
          style={{ color: 'var(--c-text-muted)' }}
        >
          {t.owner.members.loading}
        </div>
      )}

      {/* نمایش موبایل: کارت‌های عمودی */}
      {!loading && isMobile && (
        <div className="space-y-2.5">
          {filtered.map(m => (
            <div
              key={m.id}
              onClick={() => onOpenMember?.(m)}
              style={{
                backgroundColor: 'var(--c-surface-1)',
                borderColor: 'var(--c-border)',
              }}
              className="p-4 rounded-xl border transition-all active:scale-[0.99] cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <Avatar name={displayName(m.name, isFa)} size={42} tone="ink" />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-[15px]"
                    style={{ color: 'var(--c-deep)' }}
                  >
                    {displayName(m.name, isFa)}
                  </div>
                  <div
                    className="text-[13px] truncate"
                    style={{ color: 'var(--c-text-muted)' }}
                  >
                    {displayName(m.defaultTrainerName, isFa)} · {localizedLabel(m.packageName, isFa)}
                  </div>
                </div>
                <div
                  style={{
                    color:
                      m.remainingSessions <= 2
                        ? 'var(--c-rubber)'
                        : 'var(--c-ink)',
                  }}
                  className="font-display text-[26px] leading-none tnum"
                >
                  {num(m.remainingSessions)}
                </div>
              </div>

              <div className="mt-3">
                <Meter total={m.totalSessions} used={m.usedSessions} />
              </div>

              {m.outstandingBalance > 0 && (
                <div
                  className="mt-2 text-[13px] font-semibold"
                  style={{ color: 'var(--c-rubber)' }}
                >
                  {t.owner.members.debt} {toman(m.outstandingBalance)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* نمایش تبلت و دسکتاپ: جدول کامل */}
      {!loading && !isMobile && (
        <div
          style={{
            backgroundColor: 'var(--c-surface-1)',
            borderColor: 'var(--c-border)',
          }}
          className="rounded-2xl border overflow-hidden shadow-xs"
        >
          <table className="w-full text-[15px]">
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--c-surface-2)',
                  borderColor: 'var(--c-border)',
                }}
                className="text-[14px] border-b"
              >
                <th
                  className="text-right font-medium px-5 py-3"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {t.owner.members.member}
                </th>
                <th
                  className="text-right font-medium py-3"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {t.owner.members.trainer}
                </th>
                <th
                  className="text-right font-medium py-3 w-[34%]"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {t.owner.members.packageLeft}
                </th>
                <th
                  className="text-right font-medium py-3"
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  {t.owner.members.debt}
                </th>
                <th className="py-3 px-5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr
                  key={m.id}
                  onClick={() => onOpenMember?.(m)}
                  style={{ borderColor: 'var(--c-surface-2)' }}
                  className="border-b last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={displayName(m.name, isFa)} size={38} tone="ink" />
                      <div>
                        <div
                          className="font-bold text-[15px]"
                          style={{ color: 'var(--c-deep)' }}
                        >
                          {displayName(m.name, isFa)}
                        </div>
                        <div
                          className="text-[13px] tnum"
                          style={{ color: 'var(--c-text-muted)' }}
                        >
                          {m.phone}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 text-[14px]" style={{ color: 'var(--c-text)' }}>
                    {displayName(m.defaultTrainerName, isFa)}
                  </td>

                  <td className="py-3 pe-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Meter total={m.totalSessions} used={m.usedSessions} />
                      </div>
                      <span
                        style={{
                          color:
                            m.remainingSessions <= 2
                              ? 'var(--c-rubber)'
                              : 'var(--c-deep)',
                        }}
                        className="w-14 tnum text-[13px] font-bold text-left"
                      >
                        {num(m.remainingSessions)}/{num(m.totalSessions)}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 tnum text-[14px]">
                    {m.outstandingBalance > 0 ? (
                      <span
                        className="font-bold"
                        style={{ color: 'var(--c-rubber)' }}
                      >
                        {short(m.outstandingBalance)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--c-text-faint)' }}>
                        {t.owner.members.settled}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-5 text-left">
                    <ChevronLeft size={18} className="text-slate-400 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div
              className="py-12 text-center text-sm"
              style={{ color: 'var(--c-text-muted)' }}
            >
              {t.owner.members.empty}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
