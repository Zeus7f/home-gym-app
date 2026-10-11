import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'cyan';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'brand',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    brand: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
    neutral: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20'
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-bold rounded-lg',
    md: 'text-xs px-2.5 py-1 font-bold rounded-xl'
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 leading-none select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
