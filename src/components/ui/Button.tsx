import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-200 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 dark:bg-teal-500 dark:hover:bg-teal-600 dark:text-slate-950 border border-teal-500/30',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80',
      outline:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-transparent',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 dark:bg-rose-600 dark:hover:bg-rose-700 border border-rose-500/30'
    };

    const sizes = {
      sm: 'text-xs h-9 px-3 rounded-xl gap-1.5 min-w-[36px]',
      md: 'text-xs sm:text-sm h-11 px-4 rounded-xl gap-2 min-h-[44px]', // 44px min touch target
      lg: 'text-sm h-12 px-6 rounded-2xl gap-2.5 min-h-[48px]',
      icon: 'h-11 w-11 p-0 rounded-xl min-h-[44px] min-w-[44px]' // 44px accessible touch target
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
