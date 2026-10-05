export type UserRole = 'super_admin' | 'gym_owner' | 'trainer' | 'member';

export interface User {
  id: string;
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  gymId: string | null;
}

export interface Gym {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface WorkoutSegment {
  id: string;
  sessionId: string;
  trainerId: string;
  category: 'cardio' | 'functional' | 'strength' | 'mobility' | 'hiit' | 'cooldown';
  sequenceOrder: number;
  targetDurationMinutes: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}
