import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User, Workout } from './types';
import { getAllUsers, getWorkoutsForMonth } from './firebase';

interface WorkoutContextType {
  users: User[];
  usersLoading: boolean;
  /** key: "YYYY-M" → Workout[]. null = まだ未取得（ロード中） */
  monthCache: Record<string, Workout[]>;
  /** 未取得なら Firestore から取得してキャッシュに追加 */
  fetchMonth: (year: number, month: number) => void;
  /** キャッシュを破棄して再取得（ワークアウト保存後に呼ぶ） */
  invalidateMonth: (year: number, month: number) => void;
  /** ユーザー一覧を再取得 */
  refreshUsers: () => void;
}

const WorkoutContext = createContext<WorkoutContextType>(null!);
export const useWorkouts = () => useContext(WorkoutContext);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [monthCache, setMonthCache] = useState<Record<string, Workout[]>>({});
  // リクエスト済みキーを追跡（二重フェッチ防止）
  const requested = useRef<Set<string>>(new Set());

  const fetchMonth = useCallback((year: number, month: number) => {
    const key = `${year}-${month}`;
    if (requested.current.has(key)) return;
    requested.current.add(key);

    getWorkoutsForMonth(year, month)
      .then(ws => setMonthCache(prev => ({ ...prev, [key]: ws })))
      .catch(err => {
        console.error('fetchMonth error:', err);
        requested.current.delete(key); // 失敗時はリトライ可能にする
      });
  }, []);

  const invalidateMonth = useCallback(
    (year: number, month: number) => {
      const key = `${year}-${month}`;
      requested.current.delete(key);
      setMonthCache(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      fetchMonth(year, month);
    },
    [fetchMonth],
  );

  const refreshUsers = useCallback(() => {
    setUsersLoading(true);
    getAllUsers()
      .then(u => { setUsers(u); setUsersLoading(false); })
      .catch(() => setUsersLoading(false));
  }, []);

  // 起動時に今月 + ユーザー一覧を先読み
  useEffect(() => {
    const now = new Date();
    fetchMonth(now.getFullYear(), now.getMonth() + 1);
    refreshUsers();
  }, [fetchMonth, refreshUsers]);

  const value = useMemo(
    () => ({ users, usersLoading, monthCache, fetchMonth, invalidateMonth, refreshUsers }),
    [users, usersLoading, monthCache, fetchMonth, invalidateMonth, refreshUsers],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}
