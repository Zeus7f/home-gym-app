import React, { useState } from 'react';
import { Dumbbell, Pencil, Trash2, Check, Info } from 'lucide-react';
import { ExerciseItem } from '../../lib/exercises/catalog';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Language } from '../../lib/i18n';
import { cn } from '../../lib/utils';

export interface ExerciseCardProps {
  exercise: ExerciseItem;
  lang?: Language;
  onEdit?: (exercise: ExerciseItem) => void;
  onDelete?: (exercise: ExerciseItem) => void;
  onSelect?: (exercise: ExerciseItem) => void;
  selected?: boolean;
  compact?: boolean;
  showActions?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  lang = 'fa',
  onEdit,
  onDelete,
  onSelect,
  selected = false,
  compact = false,
  showActions = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80';
  const displayName = lang === 'fa' ? exercise.nameFa : exercise.name;
  const secondaryName = lang === 'fa' ? exercise.name : exercise.nameFa;
  const instructions = lang === 'fa' ? (exercise.instructionsFa || exercise.instructionsEn) : (exercise.instructionsEn || exercise.instructionsFa);

  if (compact) {
    return (
      <div
        onClick={() => onSelect && onSelect(exercise)}
        className={cn(
          'group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer',
          'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md',
          selected
            ? 'border-teal-500 bg-teal-500/10 shadow-md ring-2 ring-teal-500/30'
            : 'border-slate-200/80 dark:border-slate-800/80 hover:border-teal-500/50 hover:shadow-sm'
        )}
      >
        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-950">
          <img
            src={imgError ? fallbackImage : (exercise.gifUrl || fallbackImage)}
            alt={displayName}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {selected && (
            <div className="absolute inset-0 bg-teal-600/60 backdrop-blur-xs flex items-center justify-center text-white">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
            {displayName}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {secondaryName}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
              {lang === 'fa' ? exercise.bodyPartFa : exercise.bodyPart}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {exercise.defaultSets || 3} × {exercise.defaultReps || 10}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-200',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md',
        'border-slate-200/80 dark:border-slate-800/80 hover:border-teal-500/50 hover:shadow-lg',
        selected && 'border-teal-500 ring-2 ring-teal-500/30'
      )}
    >
      {/* Media Header */}
      <div className="relative h-44 bg-slate-950 overflow-hidden">
        <img
          src={imgError ? fallbackImage : (exercise.gifUrl || fallbackImage)}
          alt={displayName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges on Top */}
        <div className="absolute top-2.5 start-2.5 end-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex flex-wrap gap-1 pointer-events-auto">
            <Badge variant="neutral" size="sm" className="bg-black/70 backdrop-blur-md text-white border-0">
              {lang === 'fa' ? exercise.bodyPartFa : exercise.bodyPart}
            </Badge>
            <Badge variant="brand" size="sm">
              {lang === 'fa' ? exercise.equipmentFa : exercise.equipment}
            </Badge>
          </div>

          {exercise.isCustom && (
            <Badge variant="warning" size="sm" className="pointer-events-auto font-black shadow-sm">
              ⭐ {lang === 'fa' ? 'سفارشی' : 'Custom'}
            </Badge>
          )}
        </div>

        {/* Default Sets / Reps Pill */}
        <div className="absolute bottom-2.5 start-2.5">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-700/50">
            {exercise.defaultSets || 3} {lang === 'fa' ? 'ست' : 'sets'} × {exercise.defaultReps || 10} {lang === 'fa' ? 'تکرار' : 'reps'}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {displayName}
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {secondaryName}
              </p>
            </div>

            {/* Actions: Edit / Delete */}
            {showActions && (onEdit || onDelete) && (
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(exercise)}
                    aria-label={lang === 'fa' ? 'ویرایش حرکت' : 'Edit exercise'}
                    className="p-1.5 h-8 w-8 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 rounded-xl"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(exercise)}
                    aria-label={lang === 'fa' ? 'حذف حرکت' : 'Delete exercise'}
                    className="p-1.5 h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pattern and Position Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {lang === 'fa' ? exercise.patternFa : exercise.pattern}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {lang === 'fa' ? exercise.positionFa : exercise.position}
            </span>
          </div>

          {/* Instructions collapsible */}
          {instructions && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>{showDetails ? (lang === 'fa' ? 'بستن توضیحات' : 'Hide info') : (lang === 'fa' ? 'نحوه اجرا' : 'Instructions')}</span>
              </button>
              {showDetails && (
                <p className="mt-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200/50 dark:border-slate-800">
                  {instructions}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Select Action (e.g. For Logging workouts) */}
        {onSelect && (
          <div className="pt-2">
            <Button
              variant={selected ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onSelect(exercise)}
              className="w-full text-xs font-bold"
            >
              {selected ? (
                <>
                  <Check className="w-3.5 h-3.5 inline me-1" />
                  {lang === 'fa' ? 'انتخاب شده' : 'Selected'}
                </>
              ) : (
                <>
                  <Dumbbell className="w-3.5 h-3.5 inline me-1" />
                  {lang === 'fa' ? 'افزودن به تمرین' : 'Add to Workout'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
