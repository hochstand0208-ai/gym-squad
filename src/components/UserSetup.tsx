import { useState } from 'react';
import type { User } from '../types';

const AVATARS = ['💪', '🦁', '🐯', '🐺', '🦊', '🐻', '🐼', '🦄', '🐸', '🦅', '🐉', '⚡', '🔥', '🌟', '👑', '🚀'];

interface Props {
  onComplete: (user: User) => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function UserSetup({ onComplete }: Props) {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const name = nickname.trim();
    if (!name) {
      setError('ニックネームを入力してください');
      return;
    }
    if (name.length > 12) {
      setError('12文字以内で入力してください');
      return;
    }
    setSubmitting(true);
    const user: User = {
      id: generateId(),
      nickname: name,
      avatar,
      createdAt: Date.now(),
    };
    onComplete(user);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">🏋️ GYM SQUAD</div>
        <div className="modal-subtitle">
          チームに参加するために<br />ニックネームとアバターを設定してください
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>ニックネーム</div>
          <input
            type="text"
            placeholder="例：たろう、筋肉番長、etc."
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(''); }}
            maxLength={12}
            autoFocus
          />
          {error && (
            <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 6 }}>{error}</div>
          )}
        </div>

        <div className="form-label" style={{ marginBottom: 8 }}>アバター</div>
        <div className="avatar-grid">
          {AVATARS.map((em) => (
            <button
              key={em}
              className={`avatar-btn ${avatar === em ? 'selected' : ''}`}
              onClick={() => setAvatar(em)}
            >
              {em}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ marginTop: 8 }}
        >
          {submitting ? '登録中...' : 'はじめる！'}
        </button>
      </div>
    </div>
  );
}
