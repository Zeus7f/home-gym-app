import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  BODY_PARTS,
  EQUIPMENT_TYPES,
  FMS_PATTERNS,
  EXERCISE_POSITIONS,
  BodyPart,
  EquipmentType,
  FmsPattern,
  ExercisePosition,
  ExerciseItem
} from '../../lib/exercises/catalog';
import { Language } from '../../lib/i18n';
import { Plus, Pencil } from 'lucide-react';

export interface ExerciseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exerciseData: Omit<ExerciseItem, 'id'>, id?: string) => void;
  editingExercise?: ExerciseItem | null;
  lang?: Language;
}

export const ExerciseEditorModal: React.FC<ExerciseEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExercise,
  lang = 'fa'
}) => {
  const [nameFa, setNameFa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [bodyPart, setBodyPart] = useState<BodyPart>('mobility');
  const [equipment, setEquipment] = useState<EquipmentType>('bodyweight');
  const [pattern, setPattern] = useState<FmsPattern>('deep_squat');
  const [position, setPosition] = useState<ExercisePosition>('standing');
  const [gifUrl, setGifUrl] = useState('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [instructionsFa, setInstructionsFa] = useState('');
  const [instructionsEn, setInstructionsEn] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingExercise) {
      setNameFa(editingExercise.nameFa || '');
      setNameEn(editingExercise.name || '');
      setBodyPart(editingExercise.bodyPart || 'mobility');
      setEquipment(editingExercise.equipment || 'bodyweight');
      setPattern(editingExercise.pattern || 'deep_squat');
      setPosition(editingExercise.position || 'standing');
      setGifUrl(editingExercise.gifUrl || '');
      setSets(editingExercise.defaultSets || 3);
      setReps(editingExercise.defaultReps || 10);
      setInstructionsFa(editingExercise.instructionsFa || '');
      setInstructionsEn(editingExercise.instructionsEn || '');
    } else {
      setNameFa('');
      setNameEn('');
      setBodyPart('mobility');
      setEquipment('bodyweight');
      setPattern('deep_squat');
      setPosition('standing');
      setGifUrl('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80');
      setSets(3);
      setReps(10);
      setInstructionsFa('');
      setInstructionsEn('');
    }
    setError(null);
  }, [editingExercise, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFa.trim() || !nameEn.trim()) {
      setError(lang === 'fa' ? 'لطفاً نام فارسی و انگلیسی حرکت را وارد کنید.' : 'Please enter both Persian and English names.');
      return;
    }

    const bpObj = BODY_PARTS.find(b => b.id === bodyPart);
    const eqObj = EQUIPMENT_TYPES.find(eq => eq.id === equipment);
    const patObj = FMS_PATTERNS.find(p => p.id === pattern);
    const posObj = EXERCISE_POSITIONS.find(pos => pos.id === position);

    const payload: Omit<ExerciseItem, 'id'> = {
      name: nameEn.trim(),
      nameFa: nameFa.trim(),
      bodyPart,
      bodyPartFa: bpObj ? bpObj.labelFa : bodyPart,
      equipment,
      equipmentFa: eqObj ? eqObj.labelFa : equipment,
      pattern,
      patternFa: patObj ? patObj.labelFa : pattern,
      position,
      positionFa: posObj ? posObj.labelFa : position,
      gifUrl: gifUrl.trim() || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
      instructionsFa: instructionsFa.trim() || 'حرکت را با تمرکز و فرم صحیح اجرا کنید.',
      instructionsEn: instructionsEn.trim() || 'Execute with proper control and alignment.',
      defaultSets: Number(sets) || 3,
      defaultReps: Number(reps) || 10,
      isCustom: true
    };

    onSave(payload, editingExercise?.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingExercise
          ? (lang === 'fa' ? `ویرایش حرکت: ${editingExercise.nameFa}` : `Edit Exercise: ${editingExercise.name}`)
          : (lang === 'fa' ? 'تعریف حرکت جدید در بانک حرکات' : 'Add New Exercise to Catalog')
      }
      description={
        lang === 'fa'
          ? 'تنظیم مشخصات حرکتی، عضلات هدف، الگوی FMS و انیمیشن آموزشی'
          : 'Configure movement patterns, muscle groups, and animation GIF'
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-bold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label={lang === 'fa' ? 'نام فارسی حرکت *' : 'Exercise Name (Persian) *'}
            value={nameFa}
            onChange={e => setNameFa(e.target.value)}
            placeholder="مثال: اسکوات گابلت با کتل‌بل"
            required
          />
          <Input
            label={lang === 'fa' ? 'نام انگلیسی حرکت *' : 'Exercise Name (English) *'}
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            placeholder="e.g. Kettlebell Goblet Squat"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5 text-start">
            <label htmlFor="ex-bodypart" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'fa' ? 'بخش و عضله هدف' : 'Target Muscle Group'}
            </label>
            <select
              id="ex-bodypart"
              value={bodyPart}
              onChange={e => setBodyPart(e.target.value as BodyPart)}
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20"
            >
              {BODY_PARTS.map(bp => (
                <option key={bp.id} value={bp.id}>
                  {bp.labelFa} ({bp.labelEn})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-start">
            <label htmlFor="ex-pattern" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'fa' ? 'الگوی حرکتی عملکردی (FMS)' : 'FMS Movement Pattern'}
            </label>
            <select
              id="ex-pattern"
              value={pattern}
              onChange={e => setPattern(e.target.value as FmsPattern)}
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20"
            >
              {FMS_PATTERNS.map(fp => (
                <option key={fp.id} value={fp.id}>
                  {fp.labelFa}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5 text-start">
            <label htmlFor="ex-equipment" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'fa' ? 'تجهیزات مورد نیاز' : 'Equipment'}
            </label>
            <select
              id="ex-equipment"
              value={equipment}
              onChange={e => setEquipment(e.target.value as EquipmentType)}
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20"
            >
              {EQUIPMENT_TYPES.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.labelFa} ({eq.labelEn})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-start">
            <label htmlFor="ex-position" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'fa' ? 'وضعیت بدنی (Position)' : 'Body Position'}
            </label>
            <select
              id="ex-position"
              value={position}
              onChange={e => setPosition(e.target.value as ExercisePosition)}
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20"
            >
              {EXERCISE_POSITIONS.map(pos => (
                <option key={pos.id} value={pos.id}>
                  {pos.labelFa}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label={lang === 'fa' ? 'پیش‌فرض تعداد ست‌ها' : 'Default Sets'}
            type="number"
            min={1}
            max={10}
            value={sets}
            onChange={e => setSets(Number(e.target.value))}
          />
          <Input
            label={lang === 'fa' ? 'پیش‌فرض تعداد تکرارها' : 'Default Reps'}
            type="number"
            min={1}
            max={100}
            value={reps}
            onChange={e => setReps(Number(e.target.value))}
          />
        </div>

        <div className="space-y-1.5 text-start">
          <Input
            label={lang === 'fa' ? 'آدرس گیف انیمیشن یا عکس راهنما (URL)' : 'Demonstration GIF or Image URL'}
            type="url"
            value={gifUrl}
            onChange={e => setGifUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
          {gifUrl && (
            <div className="mt-2 h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/40 w-48 shadow-sm">
              <img
                src={gifUrl}
                alt="پیش‌نمایش انیمیشن حرکت"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-start">
          <label htmlFor="ex-instructions-fa" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {lang === 'fa' ? 'راهنما و نکات فنی اجرا (فارسی)' : 'Instructions & Technique Cues (Persian)'}
          </label>
          <textarea
            id="ex-instructions-fa"
            rows={2}
            value={instructionsFa}
            onChange={e => setInstructionsFa(e.target.value)}
            placeholder="نکات تنفس، قرارگیری پاها، مفاصل و عضلات درگیر..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            {lang === 'fa' ? 'انصراف' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={editingExercise ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {editingExercise
              ? (lang === 'fa' ? 'ذخیره تغییرات حرکت' : 'Save Changes')
              : (lang === 'fa' ? 'افزودن به بانک حرکات' : 'Save Exercise')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
