// Pure Domain Types for Home Gym Multi-Tenant Platform
// PRD V4.1 Sections 7, 8, 12, 13

export type Role = 'super_admin' | 'gym_owner' | 'trainer' | 'member';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type SegmentStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type SegmentCategory = 'cardio' | 'functional' | 'strength' | 'mobility' | 'hiit' | 'cooldown' | 'rehab';

export interface Muscle {
  id: string;
  name: string;
  region: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';
}

export interface ExerciseMuscleWeight {
  muscleId: string;
  muscleName: string;
  weight: number; // 1.0 = primary, 0.5 = supporting
}

export interface Exercise {
  id: string;
  tenantId?: string | null;
  name: string;
  category: SegmentCategory;
  instructions?: string;
  mediaUrl?: string;
  isCompound: boolean;
  muscles: ExerciseMuscleWeight[];
}

export interface SetLog {
  id?: string;
  setNumber: number;
  reps?: number;
  loadKg?: number;
  durationSeconds?: number;
  rpe?: number; // 0-10
  rir?: number; // Reps In Reserve
  isWarmup: boolean;
  isCompleted: boolean;
  loggedAt?: string;
  notes?: string;
}

export interface SegmentItem {
  id: string;
  segmentId: string;
  exerciseId?: string;
  exerciseName: string;
  category: SegmentCategory;
  itemOrder: number;
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetLoadKg?: number;
  targetDurationSeconds?: number;
  restSeconds?: number;
  notes?: string;
  sets: SetLog[];
}

export interface WorkoutSegment {
  id: string;
  sessionId: string;
  trainerId: string;
  trainerName: string;
  category: SegmentCategory;
  sequenceOrder: number;
  status: SegmentStatus;
  targetDurationSeconds?: number;
  trainerNotes?: string;
  safetyContext?: string;
  items: SegmentItem[];
}

export interface MasterWorkoutSession {
  id: string;
  tenantId: string;
  memberId: string;
  memberName: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  status: SessionStatus;
  notes?: string;
  segments: WorkoutSegment[];
}

export interface CreditLedgerEntry {
  id: string;
  tenantId: string;
  subscriptionId: string;
  sessionId?: string;
  delta: number;
  reason: string;
  createdAt: string;
}

export interface MemberSubscription {
  id: string;
  tenantId: string;
  memberId: string;
  planName: string;
  creditsTotal: number;
  creditsUsed: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  prType: 'max_weight' | 'max_reps' | 'est_1rm';
  value: number;
  achievedAt: string;
}
