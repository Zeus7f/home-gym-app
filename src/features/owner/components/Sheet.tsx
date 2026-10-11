import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  isMobile?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Sheet — منوی کشویی جانبی برای دسکتاپ/تبلت و پایین‌برگ (Bottom Sheet) برای موبایل.
 *
 * G5: مجهز به بستن با کلید Escape
 * G3: متصل به توکن‌های طراحی
 */
export function Sheet({
  open,
  onClose,
  isMobile = false,
  children,
  className,
}: SheetProps) {
  // بستن با Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          {/* پس‌زمینه نیمه‌شفاف */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* بدنه محتوا */}
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            style={{
              backgroundColor: 'var(--c-surface-1)',
              borderColor: 'var(--c-border)',
            }}
            className={cn(
              'absolute z-10 overflow-y-auto no-scrollbar shadow-2xl',
              isMobile
                ? 'inset-x-0 bottom-0 max-h-[88%] rounded-t-[28px] px-5 pt-3 pb-8 border-t'
                : 'top-0 right-0 bottom-0 w-[420px] max-w-full p-6 border-s',
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {isMobile && (
              <div
                style={{ backgroundColor: 'var(--c-border-strong)' }}
                className="mx-auto mb-4 h-1.5 w-12 rounded-full"
                aria-hidden="true"
              />
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
