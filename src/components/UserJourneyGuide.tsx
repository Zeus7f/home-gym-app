import React, { useState } from 'react';
import { translations, Language } from '../lib/i18n';
import { Compass, ArrowRight, ArrowLeft, CheckCircle2, Shield, LayoutDashboard, Activity, User, Sparkles, X, ExternalLink } from 'lucide-react';

interface UserJourneyGuideProps {
  lang: Language;
  onClose: () => void;
  onSelectRole: (role: 'owner' | 'trainer' | 'member') => void;
}

export function UserJourneyGuide({ lang, onClose, onSelectRole }: UserJourneyGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const t = translations[lang].userJourney;
  const step = t.steps[currentStep];

  const roleIcons: Record<'owner' | 'trainer' | 'member', React.ReactNode> = {
    owner: <LayoutDashboard className="w-5 h-5 text-teal-500" />,
    trainer: <Activity className="w-5 h-5 text-sky-500" />,
    member: <User className="w-5 h-5 text-emerald-500" />
  };

  const isLast = currentStep === t.steps.length - 1;
  const isFirst = currentStep === 0;

  function handleJump() {
    onSelectRole(step.role);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#11151A] rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between gap-2">
          {t.steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`flex-1 h-2 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-teal-500'
                  : idx < currentStep
                  ? 'bg-teal-200 dark:bg-teal-900'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Card */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              {t.stepBadge} {currentStep + 1} / {t.steps.length}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {roleIcons[step.role]}
              <span>{translations[lang].roles[step.role]}</span>
            </div>
          </div>

          <h3 className="text-lg font-black text-slate-900 dark:text-white">{step.title}</h3>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{step.description}</p>

          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl text-xs text-teal-900 dark:text-teal-200 font-medium">
            💡 {step.keyRule}
          </div>

          <div className="pt-2">
            <button
              onClick={handleJump}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.jumpToRole} ({translations[lang].roles[step.role]})
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={isFirst}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center gap-1.5"
          >
            {lang === 'fa' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            {t.prev}
          </button>

          {isLast ? (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t.close}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => Math.min(t.steps.length - 1, prev + 1))}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
            >
              {t.next}
              {lang === 'fa' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
