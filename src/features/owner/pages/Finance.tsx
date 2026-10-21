import React, { useState, useEffect } from 'react';
import { H } from '../../../components/ui/H';
import { Seg } from '../../../components/ui/Seg';
import { Avatar } from '../../../components/ui/Avatar';
import { Btn } from '../../../components/ui/Btn';
import { short } from '../../../lib/format';
import { useI18n } from '../../../components/LanguageProvider';
import { displayName } from '../../../lib/displayName';
import { getMembers, getPaymentRecords } from '../../../api/members';
import { getTrainers } from '../../../api/trainers';
import { Member, PaymentRecord, Trainer } from '../../../lib/domain/gymManagement';

export interface FinanceProps {
  isMobile?: boolean;
}

export function Finance({ isMobile = false }: FinanceProps) {
  const { t, isFa } = useI18n();
  const [tab, setTab] = useState<'debt' | 'led'>('debt');
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [memData, trData, payData] = await Promise.all([
          getMembers(),
          getTrainers(),
          getPaymentRecords(),
        ]);
        setMembers(memData);
        setTrainers(trData);
        setPayments(payData as PaymentRecord[]);
      } catch (err) {
        console.error('Error fetching finance data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const debtors = members.filter(m => m.outstandingBalance > 0);
  const totalReceivables = debtors.reduce((sum, m) => sum + m.outstandingBalance, 0);
  const totalTrainerDebt = trainers.reduce(
    (sum, t) => sum + Math.max(0, t.outstandingCompensation),
    0
  );
  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = [
    {
      label: t.owner.finance.collected,
      val: totalReceived || 29100000,
      color: 'var(--c-ink)',
    },
    {
      label: t.owner.finance.receivables,
      val: totalReceivables,
      color: 'var(--c-rubber)',
    },
    {
      label: t.owner.finance.owedToTrainers,
      val: totalTrainerDebt,
      color: 'var(--c-brass)',
    },
  ];

  // فهرست بدهکاران
  const DebtorsCard = (
    <div
      style={{
        backgroundColor: 'var(--c-surface-1)',
        borderColor: 'var(--c-border)',
      }}
      className="p-5 rounded-2xl border shadow-xs"
    >
      <H sub={t.owner.finance.debtorsSub}>{t.owner.finance.debtorsTitle}</H>
      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        {debtors
          .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
          .map(m => {
            const payPct =
              m.packagePrice > 0 ? (m.paidAmount / m.packagePrice) * 100 : 0;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 py-3 border-b last:border-0"
              >
                <Avatar name={displayName(m.name, isFa)} size={36} tone="mist" />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-[14px]"
                    style={{ color: 'var(--c-heading)' }}
                  >
                    {displayName(m.name, isFa)}
                  </div>
                  <div
                    style={{ backgroundColor: 'var(--c-surface-2)' }}
                    className="h-1.5 mt-1.5 rounded-full overflow-hidden max-w-[180px]"
                  >
                    <div
                      style={{
                        width: `${Math.min(100, payPct)}%`,
                        backgroundColor: 'var(--c-ink)',
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>

                <span
                  style={{ color: 'var(--c-rubber)' }}
                  className="tnum font-bold text-[15px] text-end min-w-[70px]"
                >
                  {short(m.outstandingBalance)}
                </span>

                {!isMobile && (
                  <Btn v="ghost" className="h-8 px-3 text-xs">
                    {t.owner.finance.recordPayment}
                  </Btn>
                )}
              </div>
            );
          })}

        {debtors.length === 0 && (
          <div
            className="py-6 text-center text-sm"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {t.owner.finance.noDebt}
          </div>
        )}
      </div>
    </div>
  );

  // دفتر تراکنش‌ها (Ledger)
  const LedgerCard = (
    <div
      style={{
        backgroundColor: 'var(--c-surface-1)',
        borderColor: 'var(--c-border)',
      }}
      className="p-5 rounded-2xl border shadow-xs"
    >
      <H>{t.owner.finance.lastTransactions}</H>
      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        {payments.slice(0, 8).map((p, i) => (
          <div key={p.id || i} className="flex items-center gap-3 py-3">
            <span
              style={{
                backgroundColor: 'var(--c-avail-bg)',
                color: 'var(--c-avail-fg)',
              }}
              className="h-9 w-9 rounded-full grid place-items-center text-[16px] font-bold shrink-0"
            >
              +
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="font-bold text-[14px] truncate"
                style={{ color: 'var(--c-heading)' }}
              >
                {displayName(p.memberName, isFa)}
              </div>
              <div
                className="text-[13px] truncate"
                style={{ color: 'var(--c-text-muted)' }}
              >
                {p.date} ·{' '}
                {p.method === 'card'
                  ? t.owner.finance.card
                  : p.method === 'cash'
                    ? t.owner.finance.cash
                    : t.owner.finance.transfer}
              </div>
            </div>
            <span
              style={{ color: 'var(--c-avail-fg)' }}
              className="tnum font-bold text-[15px]"
            >
              +{short(p.amount)} {t.owner.finance.toman}
            </span>
          </div>
        ))}

        {payments.length === 0 && (
          <div
            className="py-6 text-center text-sm"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {t.owner.finance.empty}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div
        className="py-12 text-center text-sm"
        style={{ color: 'var(--c-text-muted)' }}
      >
        {t.owner.finance.loading}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ردیف ۳ کارت آمار مالی */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <div
            key={s.label}
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className="p-5 rounded-2xl border shadow-xs"
          >
            <div className="text-[14px]" style={{ color: 'var(--c-text-muted)' }}>
              {s.label}
            </div>
            <div
              style={{ color: s.color }}
              className="font-display tnum text-[32px] leading-tight mt-1"
            >
              {short(s.val)}
              <span className="text-[15px] font-sans font-normal ms-1" style={{ color: 'var(--c-text-muted)' }}>
                {t.owner.finance.toman}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* چیدمان دسکتاپ: ۲ ستون؛ موبایل: تب‌بندی */}
      {isMobile ? (
        <div className="space-y-4">
          <Seg
            full
            value={tab}
            onChange={v => setTab(v as 'debt' | 'led')}
            items={[
              ['debt', t.owner.finance.debtorsTab],
              ['led', t.owner.finance.ledgerTab],
            ]}
          />
          {tab === 'debt' ? DebtorsCard : LedgerCard}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {DebtorsCard}
          {LedgerCard}
        </div>
      )}
    </div>
  );
}
