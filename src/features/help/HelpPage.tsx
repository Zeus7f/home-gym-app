/**
 * src/features/help/HelpPage.tsx
 * راهنما و پرسش‌های پرتکرار — همین صفحه در هر چهار فضای کاری استفاده می‌شود و
 * محتوایش را از روی نقش فعال می‌گیرد.
 *
 * صفحه بخش‌بندی شده است: در هر لحظه یک بخش دیده می‌شود، نه یک اسکرول بلند.
 * پرسش‌ها و رویه‌ها تاشو هستند و با کلیک باز می‌شوند؛ منوها و قواعد یک‌خطی‌اند
 * و باز نوشته می‌شوند، چون تاکردنِ یک خط فقط یک کلیک اضافه است.
 *
 * جست‌وجو سراسری است: وقتی عبارتی وارد شود، تب‌ها کنار می‌روند و نتیجه‌ها از
 * همهٔ بخش‌ها با برچسب بخش نشان داده می‌شوند.
 *
 * متن در `content.ts` است؛ این فایل فقط آن را نشان می‌دهد.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { PageHeader, Panel } from '../../components/ui/Page';
import { Seg } from '../../components/ui/Seg';
import type { AppRole } from '../../lib/auth/permissions';
import { useI18n } from '../../components/LanguageProvider';
import { num } from '../../lib/format';
import { helpFor, type HelpItem } from './content';

/** آیا این بند با عبارت جست‌وجو می‌خواند؟ */
function matches(item: HelpItem, q: string): boolean {
  if (!q) return true;
  const haystack = [item.term, item.detail, ...(item.steps ?? []), ...(item.notes ?? [])].join(' ').toLowerCase();
  return haystack.includes(q);
}

/**
 * کدام بند تاشو باشد.
 *
 * پرسش‌های پرتکرار و رویه‌ها همیشه تاشو هستند: در «پرسش‌ها» آدم دنبال یک پرسش
 * مشخص می‌گردد، پس باید فهرست پرسش‌ها را یکجا ببیند نه متن همهٔ پاسخ‌ها را.
 * ولی «منوها» و «قواعد» یک‌خطی‌اند و تاکردنشان فقط یک کلیک اضافه است.
 */
const COLLAPSIBLE_SECTIONS = new Set(['faq', 'sop']);

function isExpandable(item: HelpItem, sectionId: string): boolean {
  return COLLAPSIBLE_SECTIONS.has(sectionId) || Boolean(item.steps?.length || item.notes?.length);
}

export function HelpPage({ role }: { role: AppRole }) {
  const { t, lang } = useI18n();
  const h = t.help;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string>('');

  const all = useMemo(() => helpFor(lang, role), [lang, role]);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  /** نتیجه‌های جست‌وجو از همهٔ بخش‌ها */
  const found = useMemo(
    () =>
      searching
        ? all.map(s => ({ ...s, items: s.items.filter(i => matches(i, q)) })).filter(s => s.items.length > 0)
        : [],
    [all, q, searching]
  );

  // با عوض شدن نقش یا زبان، بخش‌ها فرق می‌کنند؛ به بخش اول برگرد
  useEffect(() => {
    if (all.length && !all.some(s => s.id === active)) setActive(all[0].id);
  }, [all, active]);

  const current = all.find(s => s.id === active) ?? all[0];
  const totalFound = found.reduce((sum, s) => sum + s.items.length, 0);

  const tabs = all.map(s => {
    const short = (h.tabs as Record<string, string | undefined>)[s.id] ?? s.title;
    return [
      s.id,
      <span key={s.id} className="flex items-center gap-1.5">
        {short}
        {/* شمارش یک نشانهٔ دیداری است؛ بدون aria-hidden صفحه‌خوان «منوها۷» می‌خواند */}
        <span aria-hidden className="text-[11px] font-bold tnum opacity-60">
          {num(s.items.length)}
        </span>
      </span>,
    ] as const;
  });

  return (
    <>
      <PageHeader title={h.title} description={h.subtitle} />

      <div
        className="flex items-center gap-2 px-3 h-11 rounded-xl border mb-4"
        style={{ backgroundColor: 'var(--c-surface-1)', borderColor: 'var(--c-border-strong)' }}
      >
        <Search size={16} className="shrink-0" style={{ color: 'var(--c-text-muted)' }} />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={h.searchPlaceholder}
          aria-label={h.searchPlaceholder}
          // دکمهٔ پاک‌کردن بومی مرورگر خاموش می‌شود تا کنار دکمهٔ خودمان دوتا نشود
          // (و در فایرفاکس اصلاً وجود ندارد، پس دکمهٔ خودمان یکدست‌تر است)
          className="w-full bg-transparent border-none outline-hidden text-[14px] [&::-webkit-search-cancel-button]:appearance-none"
          style={{ color: 'var(--c-text)' }}
        />
        {searching && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t.actions.clear}
            className="shrink-0 w-6 h-6 grid place-items-center rounded-md cursor-pointer"
            style={{ color: 'var(--c-text-muted)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {searching ? (
        found.length === 0 ? (
          <Panel>
            <p className="text-[13.5px] text-center py-6" style={{ color: 'var(--c-text-muted)' }}>
              {h.noMatch}
            </p>
          </Panel>
        ) : (
          <>
            <p className="text-[12.5px] mb-3" style={{ color: 'var(--c-text-muted)' }}>
              {h.matchCount.replace('{count}', num(totalFound))}
            </p>
            <div className="space-y-4">
              {found.map(section => (
                <Panel key={section.id}>
                  <h3 className="text-[13px] font-bold mb-3" style={{ color: 'var(--c-text-muted)' }}>
                    {section.title}
                  </h3>
                  <ItemList items={section.items} sectionId={section.id} openAll />
                </Panel>
              ))}
            </div>
          </>
        )
      ) : (
        current && (
          <>
            {/* روی صفحهٔ باریک تب‌ها افقی اسکرول می‌شوند، نه اینکه بشکنند */}
            <div className="-mx-1 px-1 overflow-x-auto mb-4">
              <Seg items={tabs} value={current.id} onChange={setActive} ariaLabel={h.title} />
            </div>

            <Panel>
              <h3 className="text-[16px] font-extrabold" style={{ color: 'var(--c-heading)' }}>
                {current.title}
              </h3>
              {current.intro && (
                <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
                  {current.intro}
                </p>
              )}
              <div className="mt-4">
                <ItemList items={current.items} sectionId={current.id} />
              </div>
            </Panel>
          </>
        )
      )}
    </>
  );
}

function ItemList({
  items,
  sectionId,
  openAll = false,
}: {
  items: HelpItem[];
  sectionId: string;
  openAll?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {items.map(item => (
        <HelpItemRow key={item.term} item={item} sectionId={sectionId} openAll={openAll} />
      ))}
    </div>
  );
}

function HelpItemRow({
  item,
  sectionId,
  openAll,
}: {
  item: HelpItem;
  sectionId: string;
  openAll: boolean;
}) {
  const [open, setOpen] = useState(false);
  const expandable = isExpandable(item, sectionId);
  const shown = openAll || open;

  const box = {
    backgroundColor: 'var(--c-surface-2)',
    borderColor: 'var(--c-border)',
  } as const;

  // بند یک‌خطی: تاکردنش فقط یک کلیک اضافه است، پس باز نوشته می‌شود
  if (!expandable) {
    return (
      <article className="rounded-xl border p-3.5" style={box}>
        <h4 className="text-[14px] font-bold" style={{ color: 'var(--c-heading)' }}>
          {item.term}
        </h4>
        <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--c-text)' }}>
          {item.detail}
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-xl border overflow-hidden" style={box}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={shown}
        disabled={openAll}
        className="w-full flex items-start justify-between gap-3 text-start p-3.5 cursor-pointer disabled:cursor-default"
      >
        <div className="min-w-0">
          <h4 className="text-[14px] font-bold" style={{ color: 'var(--c-heading)' }}>
            {item.term}
          </h4>
          {!shown && (
            <p className="text-[12.5px] mt-1 leading-relaxed line-clamp-1" style={{ color: 'var(--c-text-muted)' }}>
              {item.detail}
            </p>
          )}
        </div>
        {!openAll && (
          <ChevronDown
            size={18}
            className="shrink-0 mt-0.5 transition-transform"
            style={{ color: 'var(--c-text-muted)', transform: shown ? 'none' : 'rotate(-90deg)' }}
          />
        )}
      </button>

      {shown && (
        <div className="px-3.5 pb-3.5 -mt-1">
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--c-text)' }}>
            {item.detail}
          </p>

          {item.steps && (
            <ol className="mt-2.5 space-y-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--c-text)' }}>
              {item.steps.map((step, i) => (
                <li key={step} className="flex gap-2.5">
                  <span
                    className="shrink-0 w-5 h-5 rounded-md grid place-items-center text-[11px] font-bold tnum mt-0.5"
                    style={{ backgroundColor: 'var(--c-ink)', color: '#fff' }}
                  >
                    {num(i + 1)}
                  </span>
                  <span className="min-w-0">{step}</span>
                </li>
              ))}
            </ol>
          )}

          {item.notes && (
            <ul className="mt-2.5 space-y-1 text-[12.5px] leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
              {item.notes.map(note => (
                <li key={note} className="flex gap-2">
                  <span
                    aria-hidden
                    className="shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--c-brass)' }}
                  />
                  <span className="min-w-0">{note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
