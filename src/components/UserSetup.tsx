import { useState } from 'react';
import type { User } from '../types';
import { useWorkouts } from '../WorkoutContext';

type Screen = 'select' | 'register';

const AVATAR_GROUPS = [
  { label: '猛獣',     items: ['🦁', '🐯', '🐆', '🦈', '🐊', '🐺'] },
  { label: 'エレメント', items: ['🔥', '⚡', '🌊', '☄️', '🌋', '🌪️'] },
  { label: 'キャラ',   items: ['🥷', '🤖', '👹', '💀', '🦸', '👺'] },
  { label: 'パワー',   items: ['💪', '🥊', '🐉', '👑', '🚀', '🦅'] },
];
const AVATARS = AVATAR_GROUPS.flatMap(g => g.items);

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Props {
  onComplete: (user: User) => void;
}

export function UserSetup({ onComplete }: Props) {
  const { users, usersLoading } = useWorkouts();
  const [screen, setScreen] = useState<Screen>('select');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');

  // ─── ローディング中 ───────────────────────────────
  if (usersLoading) {
    return (
      <div className="modal-overlay">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>読み込み中...</span>
        </div>
      </div>
    );
  }

  // ─── 既存ユーザー選択画面 ─────────────────────────
  if (screen === 'select' && users.length > 0) {
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <div className="modal-title">🏋️ GYM SQUAD</div>
          <div className="modal-subtitle">
            あなたはどれですか？
          </div>

          <div className="existing-users-grid">
            {users.map(u => (
              <button
                key={u.id}
                className="existing-user-btn"
                onClick={() => onComplete(u)}
              >
                <span style={{ fontSize: 38, lineHeight: 1 }}>{u.avatar}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{u.nickname}</span>
              </button>
            ))}
          </div>

          <div className="divider" style={{ margin: '20px 0' }} />

          <button
            className="btn"
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontSize: 14,
              border: '1.5px solid var(--border)',
            }}
            onClick={() => setScreen('register')}
          >
            ＋ 新規登録
          </button>
        </div>
      </div>
    );
  }

  // ─── 新規登録画面 ─────────────────────────────────
  const handleSubmit = () => {
    const name = nickname.trim();
    if (!name) { setError('ニックネームを入力してください'); return; }
    if (name.length > 12) { setError('12文字以内で入力してください'); return; }
    const user: User = { id: generateId(), nickname: name, avatar, createdAt: Date.now() };
    onComplete(user);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {users.length > 0 && (
          <button
            className="back-btn"
            onClick={() => setScreen('select')}
          >
            ← 戻る
          </button>
        )}

        <div className="modal-title" style={{ marginTop: users.length > 0 ? 8 : 0 }}>
          {users.length === 0 ? '🏋️ GYM SQUAD' : '新規登録'}
        </div>
        <div className="modal-subtitle">
          {users.length === 0
            ? 'チームに参加するためにニックネームとアバターを設定してください'
            : 'ニックネームとアバターを設定してください'}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>ニックネーム</div>
          <input
            type="text"
            placeholder="例：たろう、筋肉番長、etc."
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError(''); }}
            maxLength={12}
            autoFocus
          />
          {error && (
            <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 6 }}>{error}</div>
          )}
        </div>

        <div className="form-label" style={{ marginBottom: 8 }}>アバター</div>
        <div className="avatar-groups">
          {AVATAR_GROUPS.map(group => (
            <div key={group.label}>
              <div className="avatar-group-label">{group.label}</div>
              <div className="avatar-grid">
                {group.items.map(em => (
                  <button
                    key={em}
                    className={`avatar-btn ${avatar === em ? 'selected' : ''}`}
                    onClick={() => setAvatar(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          style={{ marginTop: 8 }}
        >
          はじめる！
        </button>
      </div>
    </div>
  );
}
