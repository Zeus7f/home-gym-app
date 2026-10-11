import React, { forwardRef, useState, useId } from 'react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isPassword = false,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute start-3 pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={Boolean(error)}
            className={cn(
              'w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 dark:focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'ps-10',
              (rightIcon || isPassword) && 'pe-10',
              error && 'border-rose-500 dark:border-rose-500 focus:border-rose-500',
              className
            )}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
              className="absolute end-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute end-3 pointer-events-none text-slate-400 dark:text-slate-500">
                {rightIcon}
              </div>
            )
          )}
        </div>

        {error ? (
          <p role="alert" className="text-[11px] font-bold text-rose-600 dark:text-rose-400 animate-fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
