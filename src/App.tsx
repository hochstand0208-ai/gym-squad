import { useState, useEffect } from 'react';
import type { User } from './types';
import { saveUser } from './firebase';
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
  }, []);

  const handleUserComplete = async (newUser: User) => {
    saveUserToStorage(newUser);
    setUser(newUser);
    // Save to Firestore in background (best-effort)
    saveUser(newUser).catch(console.error);
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
    <div className="app">
      {!user && <UserSetup onComplete={handleUserComplete} />}

      {user && (
        <>
          {tab === 'home' && <HomePage user={user} />}
          {tab === 'calendar' && <CalendarPage />}
          {tab === 'ranking' && <RankingPage />}
          <TabBar active={tab} onChange={setTab} />
        </>
      )}
    </div>
  );
}
