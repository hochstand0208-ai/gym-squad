import { useState, useRef } from 'react';
import type { User } from '../types';
import { useWorkouts } from '../WorkoutContext';
import { uploadAvatarPhoto } from '../firebase';
import { AvatarImg } from './AvatarImg';

type Screen = 'select' | 'register';

const AVATAR_GROUPS = [
  { label: '猛獣',      items: ['🦁', '🐯', '🐆', '🦈', '🐊', '🐺'] },
  { label: 'エレメント', items: ['🔥', '⚡', '🌊', '☄️', '🌋', '🌪️'] },
  { label: 'キャラ',    items: ['🥷', '🤖', '👹', '💀', '🦸', '👺'] },
  { label: 'パワー',    items: ['💪', '🥊', '🐉', '👑', '🚀', '🦅'] },
];

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
  const [avatar, setAvatar] = useState(AVATAR_GROUPS[0].items[0]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  // 新規登録用IDを最初に確定させておく（写真アップロードで使用）
  const [userId] = useState(() => generateId());
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatarPhoto(userId, file);
      setAvatar(url);
    } catch (err) {
      console.error(err);
      alert('写真のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

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
          <div className="modal-subtitle">あなたはどれですか？</div>

          <div className="existing-users-grid">
            {users.map(u => (
              <button key={u.id} className="existing-user-btn" onClick={() => onComplete(u)}>
                <AvatarImg avatar={u.avatar} size={48} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{u.nickname}</span>
              </button>
            ))}
          </div>

          <div className="divider" style={{ margin: '20px 0' }} />

          <button
            className="btn"
            style={{ width: '100%', padding: '14px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 14, border: '1.5px solid var(--border)' }}
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
    const user: User = { id: userId, nickname: name, avatar, createdAt: Date.now() };
    onComplete(user);
  };

  const isPhoto = avatar.startsWith('http') || avatar.startsWith('blob:');

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {users.length > 0 && (
          <button className="back-btn" onClick={() => setScreen('select')}>← 戻る</button>
        )}

        <div className="modal-title" style={{ marginTop: users.length > 0 ? 8 : 0 }}>
          {users.length === 0 ? '🏋️ GYM SQUAD' : '新規登録'}
        </div>
        <div className="modal-subtitle">
          {users.length === 0 ? 'チームに参加するためにニックネームとアバターを設定してください' : 'ニックネームとアバターを設定してください'}
        </div>

        {/* ニックネーム */}
        <div style={{ marginBottom: 16 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>ニックネーム</div>
          <input
            type="text"
            placeholder="例：たろう、筋肉番長、etc."
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError(''); }}
            maxLength={12}
            autoFocus
          />
          {error && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 6 }}>{error}</div>}
        </div>

        {/* アバタープレビュー */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <AvatarImg avatar={avatar} size={64} />
        </div>

        {/* 写真アップロード */}
        <div className="form-label" style={{ marginBottom: 8 }}>アバター</div>
        <label className="photo-upload-btn">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
            disabled={uploading}
          />
          {uploading ? 'アップロード中...' : '📷 写真フォルダから選ぶ'}
        </label>

        {/* 区切り */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>または絵文字を選ぶ</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* 絵文字グリッド */}
        <div className="avatar-groups">
          {AVATAR_GROUPS.map(group => (
            <div key={group.label}>
              <div className="avatar-group-label">{group.label}</div>
              <div className="avatar-grid">
                {group.items.map(em => (
                  <button
                    key={em}
                    className={`avatar-btn ${!isPhoto && avatar === em ? 'selected' : ''}`}
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
          disabled={uploading}
          style={{ marginTop: 16 }}
        >
          はじめる！
        </button>
      </div>
    </div>
  );
}
