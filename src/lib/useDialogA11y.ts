/**
 * src/lib/useDialogA11y.ts
 * رفتار دسترس‌پذیر مشترک برای همهٔ overlayها (Modal، Sheet، راهنما، کشوی اعلان).
 *
 * B-12: قبلاً فوکوس هنگام باز بودن پنجره به کنترل‌های پشت آن فرار می‌کرد
 * و بعضی overlayها با Escape بسته نمی‌شدند.
 *
 * - focus-on-open: اولین عنصر قابل‌فوکوس (یا خود پنجره) فوکوس می‌گیرد
 * - focus trap: Tab و Shift+Tab داخل پنجره می‌چرخند
 * - Escape: پنجره را می‌بندد
 * - بازگرداندن فوکوس به عنصری که پنجره را باز کرده بود
 */
import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    el => !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export function useDialogA11y(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
) {
  // onClose در هر render ممکن است تابع تازه‌ای باشد؛ با ref نگه داشته می‌شود
  // تا effect با هر render دوباره اجرا نشود و فوکوس پرش نکند.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // پنجره ممکن است با انیمیشن mount شود؛ فوکوس در frame بعدی انجام می‌شود.
    const frame = requestAnimationFrame(() => {
      const root = ref.current;
      if (!root) return;
      if (root.contains(document.activeElement)) return;
      const [first] = focusableIn(root);
      if (first) {
        first.focus();
      } else {
        if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '-1');
        root.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // اگر فوکوس داخل پنجرهٔ دیگری (لایهٔ بالاتر) است، آن پنجره مسئول کلید است.
      const current = document.activeElement as HTMLElement | null;
      const owner = ref.current;
      if (owner && current && !owner.contains(current) && current.closest('[aria-modal="true"]')) {
        return;
      }
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = ref.current;
      if (!root) return;
      const items = focusableIn(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!active && root.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function' && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open, ref]);
}
