import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User, Workout } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyA1FhQS3DNXMIMSqODnQa7vU2-u2ZOcBZU",
  authDomain: "gym-squad-44ee1.firebaseapp.com",
  projectId: "gym-squad-44ee1",
  storageBucket: "gym-squad-44ee1.firebasestorage.app",
  messagingSenderId: "1008145950257",
  appId: "1:1008145950257:web:5389edef4ebaefe8ce1710",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const storage = getStorage(app);

// ─── Storage ─────────────────────────────────────
/** 写真をリサイズして Firebase Storage にアップロードし、ダウンロードURLを返す */
export async function uploadAvatarPhoto(userId: string, file: File): Promise<string> {
  const blob = await resizeImage(file, 300);
  const storageRef = ref(storage, `avatars/${userId}`);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── User ────────────────────────────────────────────────
export async function saveUser(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.id), {
    nickname: user.nickname,
    avatar: user.avatar,
    createdAt: user.createdAt,
  });
}

export async function getUser(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { id: snap.id, nickname: d.nickname, avatar: d.avatar, createdAt: d.createdAt };
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({
    id: d.id,
    nickname: d.data().nickname as string,
    avatar: d.data().avatar as string,
    createdAt: d.data().createdAt as number,
  }));
}

// ─── Workout ─────────────────────────────────────────────
export async function saveWorkout(workout: Omit<Workout, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'workouts'), {
    userId: workout.userId,
    nickname: workout.nickname,
    avatar: workout.avatar,
    type: workout.type,
    details: workout.details,
    memo: workout.memo,
    date: workout.date,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToDateWorkouts(
  date: string,
  callback: (workouts: Workout[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'workouts'),
    where('date', '==', date),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const workouts: Workout[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        nickname: data.nickname,
        avatar: data.avatar,
        type: data.type,
        details: data.details,
        memo: data.memo ?? '',
        date: data.date,
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      };
    });
    callback(workouts);
  });
}

// ─── Settings ────────────────────────────────────────────
const SETTINGS_DOC = doc(db, 'settings', 'global');

export async function getFineRate(): Promise<number> {
  const snap = await getDoc(SETTINGS_DOC);
  if (!snap.exists()) return 100;
  return (snap.data().fineRate as number) ?? 100;
}

export async function setFineRate(rate: number): Promise<void> {
  await setDoc(SETTINGS_DOC, { fineRate: rate }, { merge: true });
}

// ─── Workout ─────────────────────────────────────────────
export async function getWorkoutsForMonth(year: number, month: number): Promise<Workout[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  const q = query(
    collection(db, 'workouts'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      nickname: data.nickname,
      avatar: data.avatar,
      type: data.type,
      details: data.details,
      memo: data.memo ?? '',
      date: data.date,
      createdAt: data.createdAt?.toMillis?.() ?? 0,
    };
  });
}
