import React from 'react';
import { Language } from '../../lib/i18n';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LanguageToggle({ currentLang, onLanguageChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => onLanguageChange('en')}
        title="English"
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
          currentLang === 'en'
            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onLanguageChange('fa')}
        title="فارسی (Persian)"
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
          currentLang === 'fa'
            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        فارسی
      </button>
    </div>
  );
}
