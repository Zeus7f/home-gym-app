// Comprehensive Exercise Catalog with Functional Movement Systems (FMS) Patterns & Demonstration Media
// Inspired by https://www.functionalmovement.com/exercises

export type BodyPart = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'mobility';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'foam_roller';

export type FmsPattern =
  | 'deep_squat'
  | 'hurdle_step'
  | 'inline_lunge'
  | 'shoulder_mobility'
  | 'aslr' // Active Straight Leg Raise
  | 'trunk_stability'
  | 'rotary_stability'
  | 'power_carry'
  | 'general_strength';

export type ExercisePosition =
  | 'standing'
  | 'half_kneeling'
  | 'tall_kneeling'
  | 'quadruped'
  | 'supine'
  | 'prone'
  | 'plank';

export interface ExerciseItem {
  id: string;
  name: string;
  nameFa: string;
  bodyPart: BodyPart;
  bodyPartFa: string;
  equipment: EquipmentType;
  equipmentFa: string;
  pattern: FmsPattern;
  patternFa: string;
  position: ExercisePosition;
  positionFa: string;
  gifUrl: string;
  instructionsEn: string;
  instructionsFa: string;
  defaultSets?: number;
  defaultReps?: number;
  isCustom?: boolean;
}

export const BODY_PARTS: { id: BodyPart; labelEn: string; labelFa: string }[] = [
  { id: 'mobility', labelEn: 'Mobility & Rehab', labelFa: 'موبیلیتی و اصلاحی' },
  { id: 'core', labelEn: 'Core & Stability', labelFa: 'شکم و مرکز بدن' },
  { id: 'legs', labelEn: 'Legs & Lower Body', labelFa: 'پا و پایین‌تنه' },
  { id: 'back', labelEn: 'Back & Posterior Chain', labelFa: 'پشت و زیربغل' },
  { id: 'chest', labelEn: 'Chest & Pectorals', labelFa: 'سینه و بالاتنه' },
  { id: 'shoulders', labelEn: 'Shoulders & Scapula', labelFa: 'سرشانه و کمربند شانه‌ای' },
  { id: 'arms', labelEn: 'Arms (Biceps/Triceps)', labelFa: 'دست و بازو' },
  { id: 'cardio', labelEn: 'Cardio & Conditioning', labelFa: 'هوازی و استقامت' }
];

export const EQUIPMENT_TYPES: { id: EquipmentType; labelEn: string; labelFa: string }[] = [
  { id: 'bodyweight', labelEn: 'Bodyweight', labelFa: 'وزن بدن' },
  { id: 'kettlebell', labelEn: 'Kettlebell', labelFa: 'کتل‌بل' },
  { id: 'dumbbell', labelEn: 'Dumbbell', labelFa: 'دمبل' },
  { id: 'barbell', labelEn: 'Barbell', labelFa: 'هالتر' },
  { id: 'cable', labelEn: 'Cable Machine', labelFa: 'سیم‌کش' },
  { id: 'band', labelEn: 'Resistance Band', labelFa: 'کش تمرینی' },
  { id: 'foam_roller', labelEn: 'Foam Roller', labelFa: 'فوم‌رولر' },
  { id: 'machine', labelEn: 'Weight Machine', labelFa: 'دستگاه' }
];

export const FMS_PATTERNS: { id: FmsPattern; labelEn: string; labelFa: string }[] = [
  { id: 'deep_squat', labelEn: 'Deep Squat (FMS 1)', labelFa: 'اسکوات عمیق (FMS 1)' },
  { id: 'hurdle_step', labelEn: 'Hurdle Step (FMS 2)', labelFa: 'گام روی مانع (FMS 2)' },
  { id: 'inline_lunge', labelEn: 'Inline Lunge (FMS 3)', labelFa: 'لانژ خطی (FMS 3)' },
  { id: 'shoulder_mobility', labelEn: 'Shoulder Mobility (FMS 4)', labelFa: 'موبیلیتی شانه (FMS 4)' },
  { id: 'aslr', labelEn: 'Active Straight Leg Raise (FMS 5)', labelFa: 'بالا آوردن پای صاف / ASLR (FMS 5)' },
  { id: 'trunk_stability', labelEn: 'Trunk Stability Push-up (FMS 6)', labelFa: 'پایداری تنه و شنا (FMS 6)' },
  { id: 'rotary_stability', labelEn: 'Rotary Stability (FMS 7)', labelFa: 'پایداری چرخشی (FMS 7)' },
  { id: 'power_carry', labelEn: 'Carry & Loaded Movement', labelFa: 'حمل بار و انتقال نیرو' },
  { id: 'general_strength', labelEn: 'General Strength & Conditioning', labelFa: 'قدرت عمومی و تناسب اندام' }
];

export const EXERCISE_POSITIONS: { id: ExercisePosition; labelEn: string; labelFa: string }[] = [
  { id: 'standing', labelEn: 'Standing', labelFa: 'ایستاده' },
  { id: 'half_kneeling', labelEn: 'Half-Kneeling', labelFa: 'نیمه دو زانو (یک زانو روی زمین)' },
  { id: 'tall_kneeling', labelEn: 'Tall-Kneeling', labelFa: 'دو زانو کامل' },
  { id: 'quadruped', labelEn: 'Quadruped (All Fours)', labelFa: 'چهار دست و پا' },
  { id: 'supine', labelEn: 'Supine (Back on Ground)', labelFa: 'طاق‌باز (خوابیده به پشت)' },
  { id: 'prone', labelEn: 'Prone (Stomach on Ground)', labelFa: 'دمر (خوابیده روی شکم)' },
  { id: 'plank', labelEn: 'Plank Position', labelFa: 'وضعیت پلانک' }
];

export const EXERCISE_CATALOG: ExerciseItem[] = [
  // ==========================================
  // FUNCTIONAL MOVEMENT SYSTEMS (FMS) SPECIALIZED
  // ==========================================
  {
    id: 'fms-cat-camel',
    name: 'Cat-Camel Spine Mobility',
    nameFa: 'حرکت گربه-شتر (موبیلیتی ستون فقرات)',
    bodyPart: 'mobility',
    bodyPartFa: 'موبیلیتی و اصلاحی',
    equipment: 'bodyweight',
    equipmentFa: 'وزن بدن',
    pattern: 'rotary_stability',
    patternFa: 'تحرک ستون فقرات و پایداری تنه',
    position: 'quadruped',
    positionFa: 'چهار دست و پا',
    gifUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'In quadruped position, slowly arch your back upward tucking chin, then smoothly depress spine looking slightly upward with controlled diaphragmatic breathing.',
    instructionsFa: 'در وضعیت چهار دست و پا، ستون فقرات را به آرامی به سمت سقف گرد کرده (گربه)، سپس مهره به مهره به سمت پایین قوس دهید (شتر)؛ همراه با تنفس عمیق دیافراگمی.',
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: 'fms-bird-dog',
    name: 'Bird-Dog Rotary Stability',
    nameFa: 'پرنده-سگ چهار دست و پا (پایداری چرخشی)',
    bodyPart: 'core',
    bodyPartFa: 'شکم و مرکز بدن',
    equipment: 'bodyweight',
    equipmentFa: 'وزن بدن',
    pattern: 'rotary_stability',
    patternFa: 'پایداری چرخشی و زنجیره ضربدری',
    position: 'quadruped',
    positionFa: 'چهار دست و پا',
    gifUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'From hands and knees, simultaneously extend opposite arm forward and opposite leg straight back. Maintain neutral spine without tilting hips. Hold 2s and return.',
    instructionsFa: 'دست راست را به جلو و پای چپ را به صورت موازی با زمین به عقب بکشید. لگن را کاملاً تراز نگه داشته و از چرخش کمر جلوگیری کنید. ۲ ثانیه مکث و تعویض سمت.',
    defaultSets: 3,
    defaultReps: 12
  },
  {
    id: 'fms-deadbug',
    name: 'Deadbug Core Control',
    nameFa: 'ددباگ (کنترل ضد اکستنشن عضلات مرکزی)',
    bodyPart: 'core',
    bodyPartFa: 'شکم و مرکز بدن',
    equipment: 'bodyweight',
    equipmentFa: 'وزن بدن',
    pattern: 'trunk_stability',
    patternFa: 'پایداری تنه و کنترل لگن',
    position: 'supine',
    positionFa: 'به پشت خوابیده',
    gifUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Lie on back with knees bent at 90 degrees and arms raised. Press lower back firmly into floor. Lower opposite arm and leg toward floor without arching lower back.',
    instructionsFa: 'به پشت دراز بکشید، زانوها در زاویه ۹۰ درجه. گودی کمر را به زمین بچسبانید. دست و پای مخالف را همزمان به سمت زمین پایین بیاورید بدون اینکه کمر از زمین جدا شود.',
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: 'fms-chop-lift',
    name: 'Half-Kneeling Cable/Band Chop',
    nameFa: 'چاپ نیمه‌زانو با کش/سیم‌کش (Chop & Lift)',
    bodyPart: 'core',
    bodyPartFa: 'شکم و مرکز بدن',
    equipment: 'band',
    equipmentFa: 'کش تمرینی',
    pattern: 'rotary_stability',
    patternFa: 'پایداری روتاری و انتقال نیرو',
    position: 'half_kneeling',
    positionFa: 'نیمه‌زانو',
    gifUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'In half-kneeling stance (inside knee down), pull band or cable diagonally across body from high to low. Keep pelvis solid with zero torso sway.',
    instructionsFa: 'یک زانو روی زمین و پای دیگر با زاویه ۹۰ درجه جلو. کش یا سیم‌کش را به صورت مورب از بالا به سمت پهلوی مخالف بکشید بدون اینکه لگن یا تنه تکان بخورد.',
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: 'fms-goblet-squat',
    name: 'Kettlebell Goblet Squat',
    nameFa: 'اسکوات گابلت با کتل‌بل/دمبل (اصلاح اسکوات عمیق)',
    bodyPart: 'legs',
    bodyPartFa: 'پا و ران',
    equipment: 'kettlebell',
    equipmentFa: 'کتل‌بل',
    pattern: 'deep_squat',
    patternFa: 'الگوی اسکوات عمیق و تحرک مچ پا',
    position: 'standing',
    positionFa: 'ایستاده',
    gifUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Hold kettlebell at chest height with elbows tucked. Squat down between knees while keeping chest upright and heels glued to floor, reaching full deep squat depth.',
    instructionsFa: 'کتل‌بل را جلوی سینه نگه دارید. با قفسه سینه صاف و پاشنه‌های چسبیده به زمین، بین زانوها به آرامی تا پایین‌ترین نقطه اسکوات نشسته و بالا بیایید.',
    defaultSets: 3,
    defaultReps: 12
  },
  {
    id: 'fms-bear-crawl',
    name: 'Quadruped Bear Crawl',
    nameFa: 'خزیدن خرس چهار دست و پا (Bear Crawl)',
    bodyPart: 'core',
    bodyPartFa: 'شکم و مرکز بدن',
    equipment: 'bodyweight',
    equipmentFa: 'وزن بدن',
    pattern: 'rotary_stability',
    patternFa: 'هماهنگی کرال و کنترل ستون فقرات',
    position: 'quadruped',
    positionFa: 'چهار دست و پا',
    gifUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Hover knees 2 inches above ground from all-fours. Crawl forward and backward in opposite hand/foot synchronization keeping back completely flat like a table.',
    instructionsFa: 'در حالت چهار دست و پا زانوها را ۲ سانتیمتر از زمین بالا بیاورید. با دست و پای متقاطع به جلو و عقب گام بردارید در حالی که پشت شما مثل میز صاف بماند.',
    defaultSets: 3,
    defaultReps: 20 // meters/seconds
  },
  {
    id: 'fms-brettzel',
    name: 'Brettzel Thoracic Stretch',
    nameFa: 'کشش برتزل (موبیلیتی ستون فقرات و چرخش ران)',
    bodyPart: 'mobility',
    bodyPartFa: 'موبیلیتی و اصلاحی',
    equipment: 'bodyweight',
    equipmentFa: 'وزن بدن',
    pattern: 'shoulder_mobility',
    patternFa: 'موبیلیتی توراسیک و انعطاف زنجیره قدامی',
    position: 'supine',
    positionFa: 'به پهلو / پشت',
    gifUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Lie on side with top leg flexed forward to 90 degrees held by opposite hand. Bend bottom knee backward and hold ankle with top hand. Rotate shoulders toward floor on exhale.',
    instructionsFa: 'روی پهلو دراز کشیده، زانوی بالا را با زاویه ۹۰ درجه بگیرید و مچ پای زیرین را به عقب خم کرده و نگه دارید. با بازدم شانه‌ها را به سمت زمین بچرخانید.',
    defaultSets: 2,
    defaultReps: 8 // breaths
  },
  {
    id: 'fms-single-leg-rdl',
    name: 'Single-Leg Romanian Deadlift',
    nameFa: 'ددلیفت رومانیایی تک‌پا (ثبات پلویک و همسترینگ)',
    bodyPart: 'legs',
    bodyPartFa: 'پا و ران',
    equipment: 'dumbbell',
    equipmentFa: 'دمبل',
    pattern: 'aslr',
    patternFa: 'الگوی هینج تک‌پا و انعطاف خلفی',
    position: 'standing',
    positionFa: 'ایستاده',
    gifUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Balance on one leg with soft knee. Hinge at hips sending back leg straight back while lowering torso parallel to floor with flat back. Squeeze glute to stand.',
    instructionsFa: 'روی یک پا بایستید، زانو کمی آزاد. با عقب فرستادن پای دیگر از مفصل ران خم شوید تا بالاتنه موازی زمین شود. با فشار باسن پای تکیه‌گاه به حالت ایستاده برگردید.',
    defaultSets: 3,
    defaultReps: 8
  },
  {
    id: 'fms-glute-bridge',
    name: 'Glute Bridge with Isometric Hold',
    nameFa: 'پل باسن با مکث ایزومتریک (Glute Bridge)',
    bodyPart: 'legs',
    bodyPartFa: 'پا و ران',
    equipment: 'bodyweight',
    equipmentFa: 'وزن بدن',
    pattern: 'aslr',
    patternFa: 'فعال‌سازی سرینی و اکستنشن ران',
    position: 'supine',
    positionFa: 'به پشت خوابیده',
    gifUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Lie supine with feet flat and hip-width. Drive through heels to lift hips until thighs and torso align. Squeeze glutes intensely at top for 3 seconds.',
    instructionsFa: 'به پشت دراز بکشید، زانوها خم و کف پا روی زمین. با فشار پاشنه باسن را بالا بیاورید تا خط صافی از شانه تا زانو ایجاد شود. ۳ ثانیه انقباض شدید باسن در بالا.',
    defaultSets: 3,
    defaultReps: 12
  },
  {
    id: 'fms-pallof-press',
    name: 'Pallof Press Anti-Rotation',
    nameFa: 'پرس پالوف ضد چرخش با کش (Pallof Press)',
    bodyPart: 'core',
    bodyPartFa: 'شکم و مرکز بدن',
    equipment: 'band',
    equipmentFa: 'کش تمرینی',
    pattern: 'rotary_stability',
    patternFa: 'ثبات ایزومتریک ضد چرخش',
    position: 'standing',
    positionFa: 'ایستاده',
    gifUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Stand perpendicular to band anchor holding handle at chest. Press arms straight out, resisting the rotational pull of the band. Hold 2s, bring back to chest.',
    instructionsFa: 'به پهلو نسبت به تکیه‌گاه کش بایستید. دستگیره را جلوی سینه بگیرید و صاف به جلو پرس کنید، در برابر چرخش تنه مقاومت کامل کنید. ۲ ثانیه مکث و بازگشت.',
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: 'fms-farmer-carry',
    name: "Farmer's Walk (Heavy Carry)",
    nameFa: 'حمل کشاورز / حمل چمدانی (Farmer Carry)',
    bodyPart: 'core',
    bodyPartFa: 'شکم و مرکز بدن',
    equipment: 'kettlebell',
    equipmentFa: 'کتل‌بل',
    pattern: 'power_carry',
    patternFa: 'حمل بار سنگین و پایداری دینامیک',
    position: 'standing',
    positionFa: 'ایستاده',
    gifUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Hold heavy kettlebells or dumbbells at your sides. Stand tall with shoulders back and core braced. Walk in measured, steady steps without swaying side-to-side.',
    instructionsFa: 'دو کتل‌بل یا دمبل سنگین را در طرفین بگیرید. شانه به عقب، سینه فراخ و شکم کاملاً منقبض. با گام‌های استوار و بدون کج شدن به طرفین راه بروید.',
    defaultSets: 3,
    defaultReps: 30 // seconds
  },
  {
    id: 'fms-wall-angel',
    name: 'Wall Angel Scapular Mobility',
    nameFa: 'فرشته دیواری (موبیلیتی کتف و باز شدن شانه)',
    bodyPart: 'mobility',
    bodyPartFa: 'موبیلیتی و اصلاحی',
    equipment: 'bodyweight',
    equipmentFa: 'وزن بدن',
    pattern: 'shoulder_mobility',
    patternFa: 'موبیلیتی مفصل شانه و کتف',
    position: 'standing',
    positionFa: 'ایستاده تکیه به دیوار',
    gifUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Stand against wall with head, upper back, and sacrum contacting. Place elbows and wrists on wall in W position. Slide arms up into Y overhead without lower back arching.',
    instructionsFa: 'پشت به دیوار بایستید، سر، شانه و گودی کمر به دیوار چسبیده. آرنج‌ها و مچ دست را به دیوار تکیه داده و به آرامی دست‌ها را به بالا بلغزانید بدون جدا شدن مچ‌ها.',
    defaultSets: 3,
    defaultReps: 10
  },

  // ==========================================
  // HYPERTROPHY & TRADITIONAL STRENGTH
  // ==========================================
  {
    id: 'ex-bench-press',
    name: 'Barbell Bench Press',
    nameFa: 'پرس سینه با هالتر',
    bodyPart: 'chest',
    bodyPartFa: 'سینه',
    equipment: 'barbell',
    equipmentFa: 'هالتر',
    pattern: 'general_strength',
    patternFa: 'قدرت عمومی و پرس بالاتنه',
    position: 'supine',
    positionFa: 'به پشت خوابیده روی نیمکت',
    gifUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Lie on bench, grip bar slightly wider than shoulders, lower bar to mid-chest, press upward locked.',
    instructionsFa: 'روی نیمکت دراز بکشید، هالتر را کمی بازتر از عرض شانه بگیرید، تا وسط سینه پایین آورده و به بالا پرس کنید.',
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: 'ex-incline-dumbbell',
    name: 'Incline Dumbbell Press',
    nameFa: 'پرس بالا سینه با دمبل',
    bodyPart: 'chest',
    bodyPartFa: 'سینه',
    equipment: 'dumbbell',
    equipmentFa: 'دمبل',
    pattern: 'general_strength',
    patternFa: 'قدرت عمومی بالاتنه',
    position: 'supine',
    positionFa: 'نیمکت شیبدار ۳۰ درجه',
    gifUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Set bench to 30 degrees, press dumbbells overhead in a smooth arc, lower with control.',
    instructionsFa: 'نیمکت را روی شیب ۳۰ درجه تنظیم کنید، دمبل‌ها را به سمت بالا برده و با کنترل کامل پایین بیاورید.',
    defaultSets: 3,
    defaultReps: 10
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Cable Lat Pulldown',
    nameFa: 'زیربغل سیم‌کش از جلو (لت)',
    bodyPart: 'back',
    bodyPartFa: 'پشت و زیربغل',
    equipment: 'cable',
    equipmentFa: 'سیم‌کش',
    pattern: 'general_strength',
    patternFa: 'کشش عمودی بالاتنه',
    position: 'standing',
    positionFa: 'نشسته روی دستگاه',
    gifUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Grip wide bar, pull bar down towards upper chest while arching back slightly and squeezing lats.',
    instructionsFa: 'میله را باز بگیرید، با کمی متمایل شدن به عقب میله را تا بالای سینه پایین کشیده و عضلات زیربغل را منقبض کنید.',
    defaultSets: 3,
    defaultReps: 12
  },
  {
    id: 'ex-barbell-squat',
    name: 'Barbell Back Squat',
    nameFa: 'اسکوات پشت با هالتر',
    bodyPart: 'legs',
    bodyPartFa: 'پا و ران',
    equipment: 'barbell',
    equipmentFa: 'هالتر',
    pattern: 'deep_squat',
    patternFa: 'اسکوات قدرتی زنجیره قدامی و خلفی',
    position: 'standing',
    positionFa: 'ایستاده',
    gifUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Rest bar across traps, brace core, bend knees and hips back until thighs break parallel, drive upwards through feet.',
    instructionsFa: 'هالتر را روی عضلات کول قرار دهید، با منقبض کردن شکم تا موازی شدن ران‌ها با زمین بنشینید و با فشار پاها بایستید.',
    defaultSets: 4,
    defaultReps: 8
  },
  {
    id: 'ex-plank',
    name: 'Forearm Core Plank',
    nameFa: 'پلانک ساعد (استقامت ایزومتریک)',
    bodyPart: 'core',
    bodyPartFa: 'شکم و مرکز بدن',
    equipment: 'bodyweight',
    equipmentFa: 'وزن بدن',
    pattern: 'trunk_stability',
    patternFa: 'پایداری ایزومتریک تنه',
    position: 'plank',
    positionFa: 'پلانک روی ساعد',
    gifUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&auto=format&fit=crop&q=80',
    instructionsEn: 'Rest on elbows and toes, hold rigid straight line from shoulders to heels, engage glutes and abs.',
    instructionsFa: 'روی ساعدها و پنجه پا قرار بگیرید، بدن در یک خط مستقیم از سر تا پاشنه، باسن و شکم کاملاً سفت.',
    defaultSets: 3,
    defaultReps: 45 // seconds
  }
];
