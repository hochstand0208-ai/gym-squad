type Tab = 'home' | 'calendar' | 'ranking';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-btn ${active === 'home' ? 'active' : ''}`}
        onClick={() => onChange('home')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active === 'home' ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
        HOME
      </button>

      <button
        className={`tab-btn ${active === 'calendar' ? 'active' : ''}`}
        onClick={() => onChange('calendar')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active === 'calendar' ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="8" cy="15" r="1" fill="currentColor" />
          <circle cx="12" cy="15" r="1" fill="currentColor" />
          <circle cx="16" cy="15" r="1" fill="currentColor" />
        </svg>
        カレンダー
      </button>

      <button
        className={`tab-btn ${active === 'ranking' ? 'active' : ''}`}
        onClick={() => onChange('ranking')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active === 'ranking' ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="14" width="5" height="8" rx="1" />
          <rect x="9.5" y="9" width="5" height="13" rx="1" />
          <rect x="17" y="4" width="5" height="18" rx="1" />
        </svg>
        ランキング
      </button>
    </nav>
  );
}
