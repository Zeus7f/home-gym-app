import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { useI18n } from '../LanguageProvider';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  summaryItems?: string[];
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'brand';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  summaryItems,
  confirmText,
  cancelText,
  variant = 'brand',
  isLoading = false
}) => {
  const { t } = useI18n();
  const confirmLabel = confirmText ?? t.actions.confirm;
  const cancelLabel = cancelText ?? t.actions.cancel;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
            }`}
          >
            {variant === 'danger' ? <AlertCircle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {summaryItems && summaryItems.length > 0 && (
          <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 rounded-xl border border-teal-200/50 dark:border-teal-900/50 text-xs text-teal-900 dark:text-teal-300 space-y-1">
            <span className="font-bold block text-[11px] mb-1 text-teal-800 dark:text-teal-400">
              {t.actions.changeSummary}
            </span>
            {summaryItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
