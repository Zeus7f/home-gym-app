import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Meter } from '../../../components/ui/Meter';
import { fa } from '../../../lib/format';
import { getMembers } from '../../../api/members';
import { Member } from '../../../lib/domain/gymManagement';
import { mockStore } from '../../../lib/supabase/mockStore';

export function Athletes() {
  const currentTrainerId = mockStore.currentUser?.entityId || 't-1';
  const [members, setMembers] = useState<Member[]>([]);
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
          placeholder="جستجوی ورزشکار من…"
          className="w-full bg-transparent border-none outline-hidden text-[14px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {loading && (
        <div
          className="py-12 text-center text-sm"
          style={{ color: 'var(--c-text-muted)' }}
        >
          در حال بارگذاری لیست ورزشکاران...
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
                  <Avatar name={m.name} size={42} tone="ink" />
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold text-[15px] truncate"
                      style={{ color: 'var(--c-deep)' }}
                    >
                      {m.name}
                    </div>
                    <div
                      className="text-[13px] truncate"
                      style={{ color: 'var(--c-text-muted)' }}
                    >
                      {m.packageName} · آخرین جلسه: ۱۲ مهر
                    </div>
                  </div>
                  <span
                    style={{
                      color: isLow ? 'var(--c-rubber)' : 'var(--c-ink)',
                    }}
                    className="font-display text-[26px] leading-none tnum"
                  >
                    {fa(m.remainingSessions)}
                    <span className="text-[12px] font-sans font-normal opacity-70 ms-1">
                      جلسه
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
              ورزشکاری با این مشخصات یافت نشد.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
