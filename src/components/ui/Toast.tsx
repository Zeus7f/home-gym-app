import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useI18n } from '../LanguageProvider';

export interface ToastProps {
  message: string | null;
  onClose: () => void;
  type?: 'success' | 'warning' | 'info';
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onClose,
  type = 'success',
  duration = 4000
}) => {
  const { t } = useI18n();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
      style: 'bg-emerald-950/90 border-emerald-800 text-emerald-100 shadow-emerald-950/20'
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
      style: 'bg-amber-950/90 border-amber-800 text-amber-100 shadow-amber-950/20'
    },
    info: {
      icon: <Info className="w-4 h-4 text-teal-400 shrink-0" />,
      style: 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-slate-950/30'
    }
  };

  const { icon, style } = typeConfig[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-24 md:bottom-6 start-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl text-xs font-bold animate-fade-in max-w-md',
        style
      )}
    >
      {icon}
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={onClose}
        aria-label={t.actions.close}
        className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
