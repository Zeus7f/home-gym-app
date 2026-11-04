/**
 * src/features/admin/HelpPage.tsx
 * راهنمای سامانه در پنل مدیر کل: نقش‌ها، منوها، رویه‌های کاری و قواعد.
 *
 * جست‌وجو روی همهٔ متن‌ها کار می‌کند تا پیدا کردن یک قاعده سریع باشد.
 * متن در `helpContent.ts` است؛ این فایل فقط آن را نشان می‌دهد.
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { PageHeader, Panel } from '../../components/ui/Page';
import { useI18n } from '../../components/LanguageProvider';
import { num } from '../../lib/format';
import { HELP_CONTENT, type HelpItem, type HelpSection } from './helpContent';

/** آیا این بند با عبارت جست‌وجو می‌خواند؟ */
function matches(item: HelpItem, q: string): boolean {
  if (!q) return true;
  const haystack = [item.term, item.detail, ...(item.steps ?? []), ...(item.notes ?? [])].join(' ').toLowerCase();
  return haystack.includes(q);
}

export function HelpPage() {
  const { t, lang } = useI18n();
  const h = t.admin.help;
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HELP_CONTENT[lang]
      .map(section => ({ ...section, items: section.items.filter(item => matches(item, q)) }))
      .filter(section => section.items.length > 0);
  }, [lang, query]);

  const total = sections.reduce((sum, s) => sum + s.items.length, 0);

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
          className="w-full bg-transparent border-none outline-hidden text-[14px]"
          style={{ color: 'var(--c-text)' }}
        />
      </div>

      {sections.length === 0 ? (
        <Panel>
          <p className="text-[13.5px] text-center py-6" style={{ color: 'var(--c-text-muted)' }}>
            {h.noMatch}
          </p>
        </Panel>
      ) : (
        <>
          {query && (
            <p className="text-[12.5px] mb-3" style={{ color: 'var(--c-text-muted)' }}>
              {h.matchCount.replace('{count}', num(total))}
            </p>
          )}
          <div className="space-y-4">
            {sections.map(section => (
              <HelpSectionPanel
                key={section.id}
                section={section}
                collapsed={!query && collapsed[section.id]}
                onToggle={() => setCollapsed(c => ({ ...c, [section.id]: !c[section.id] }))}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function HelpSectionPanel({
  section,
  collapsed,
  onToggle,
}: {
  section: HelpSection;
  collapsed?: boolean;
  onToggle: () => void;
}) {
  return (
    <Panel>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="w-full flex items-start justify-between gap-3 text-start cursor-pointer"
      >
        <div className="min-w-0">
          <h3 className="text-[16px] font-extrabold" style={{ color: 'var(--c-heading)' }}>
            {section.title}
          </h3>
          {section.intro && (
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
              {section.intro}
            </p>
          )}
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 mt-1 transition-transform"
          style={{ color: 'var(--c-text-muted)', transform: collapsed ? 'rotate(-90deg)' : 'none' }}
        />
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-4">
          {section.items.map(item => (
            <article
              key={item.term}
              className="rounded-xl border p-3.5"
              style={{ backgroundColor: 'var(--c-surface-2)', borderColor: 'var(--c-border)' }}
            >
              <h4 className="text-[14px] font-bold" style={{ color: 'var(--c-heading)' }}>
                {item.term}
              </h4>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--c-text)' }}>
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
                      <span aria-hidden className="shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--c-brass)' }} />
                      <span className="min-w-0">{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
