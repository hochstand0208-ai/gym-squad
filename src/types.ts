export type WorkoutType = 'strength' | 'cardio';

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  createdAt: number;
}

export interface StrengthDetail {
  exercise: string;
  sets: number;
  reps: number;
  weight?: number;
}

export interface CardioDetail {
  exercise: string;
  duration: number;
  distance?: number;
}

export type WorkoutDetail = StrengthDetail | CardioDetail;

export interface Workout {
  id: string;
  userId: string;
  nickname: string;
  avatar: string;
  type: WorkoutType;
  details: WorkoutDetail;
  memo: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export function isStrengthDetail(d: WorkoutDetail): d is StrengthDetail {
  return 'sets' in d;
}

export function isCardioDetail(d: WorkoutDetail): d is CardioDetail {
  return 'duration' in d;
}
