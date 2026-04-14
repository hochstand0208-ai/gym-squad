import { useState, useEffect } from 'react';
import type { User } from './types';
import { saveUser } from './firebase';
import { WorkoutProvider } from './WorkoutContext';
import { UserSetup } from './components/UserSetup';
import { TabBar } from './components/TabBar';
import { HomePage } from './pages/HomePage';
import { CalendarPage } from './pages/CalendarPage';
import { RankingPage } from './pages/RankingPage';

type Tab = 'home' | 'calendar' | 'ranking';

const USER_KEY = 'gymsquad_user';

function loadUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function saveUserToStorage(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadUserFromStorage();
    setUser(stored);
    setReady(true);
    // localStorageにユーザーがいれば Firestore に再同期
    // （初回登録時にルール未設定で保存失敗していた場合の救済）
    if (stored) {
      saveUser(stored).catch(console.error);
    }
  }, []);

  const handleUserComplete = async (newUser: User) => {
    saveUserToStorage(newUser);
    setUser(newUser);
    saveUser(newUser).catch(console.error);
  };

  const handleUpdateUser = (updated: User) => {
    saveUserToStorage(updated);
    setUser(updated);
    saveUser(updated).catch(console.error);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  if (!ready) {
    return (
      <div className="app">
        <div className="loading-state" style={{ height: '100%' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <WorkoutProvider>
      <div className="app">
        {!user && <UserSetup onComplete={handleUserComplete} />}

        {user && (
          <>
            {tab === 'home' && <HomePage user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />}
            {tab === 'calendar' && <CalendarPage />}
            {tab === 'ranking' && <RankingPage user={user} />}
            <TabBar active={tab} onChange={setTab} />
          </>
        )}
      </div>
    </WorkoutProvider>
  );
}
