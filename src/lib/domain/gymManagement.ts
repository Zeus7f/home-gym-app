// Simplified Domain Models for Gym Management Platform
// PRD Refactor: Gym -> Owner -> Trainers -> Members -> Daily Attendance -> Sessions -> Exercises -> Financials -> Reports

export interface Gym {
  id: string;
  name: string;
  capacity: number; // Daily maximum gym capacity (e.g. 30 members)
  currency: string; // 'تومان' or 'USD'
  noShowDeductsSession: boolean;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  defaultTrainerId: string;
  defaultTrainerName: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number; // Formula: totalSessions - usedSessions
  packagePrice: number;
  paidAmount: number;
  outstandingBalance: number; // Formula: packagePrice - paidAmount
  startDate: string;
  expirationDate: string;
  status: 'active' | 'inactive' | 'expired';
  registrationDate: string;
}

export interface Trainer {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  specialty: string;
  status: 'active' | 'inactive';
  workingDays: string[];
  workingHours: string; // e.g. "09:00 - 15:00"
  dailyCapacity: number; // Maximum members trainer can actively handle (e.g. 6)
  sessionRate: number; // Compensation per completed session (e.g. 150,000)
  completedSessions: number;
  paidCompensation: number;
  outstandingCompensation: number; // Formula: (completedSessions * sessionRate) - paidCompensation
}

export interface SessionExercise {
  id: string;
  exerciseId: string;
  name: string;
  gifUrl?: string;
  imageUrl?: string;
  bodyPart: string;
  equipment: string;
  sets: number;
  reps: number;
  weightKg?: number;
  durationSeconds?: number;
  notes?: string;
}

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface DailySession {
  id: string;
  date: string; // YYYY-MM-DD or 'Today'
  time: string; // e.g. "09:00"
  memberId: string;
  memberName: string;
  memberPhone?: string;
  trainerId: string;
  trainerName: string;
  isDailyOverride?: boolean; // True if reassigned for today only, without changing member default trainer
  status: SessionStatus;
  exercises: SessionExercise[];
  completedAt?: string;
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  method: 'card' | 'cash' | 'transfer';
  description: string;
  recordedBy: string;
}

export interface TrainerPaymentRecord {
  id: string;
  trainerId: string;
  trainerName: string;
  amount: number;
  date: string;
  method: 'card' | 'transfer' | 'cash';
  description: string;
}

export interface SessionAdjustmentRecord {
  id: string;
  memberId: string;
  memberName: string;
  delta: number; // e.g. +2 or -1
  reason: string;
  date: string;
  performedBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
  user: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'trainer' | 'member';
  entityId: string; // 'gym-1', 't-ali', 'm-reza', etc.
  displayName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface DailyCapacityConfig {
  date: string; // YYYY/MM/DD (Jalali)
  gymCapacity?: number;
  trainerCapacities?: Record<string, number>; // trainerId -> capacity for this specific date
}
