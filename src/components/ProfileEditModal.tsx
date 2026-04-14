import { useState } from 'react';
import type { User } from '../types';

const AVATAR_GROUPS = [
  { label: '猛獣',      items: ['🦁', '🐯', '🐆', '🦈', '🐊', '🐺'] },
  { label: 'エレメント', items: ['🔥', '⚡', '🌊', '☄️', '🌋', '🌪️'] },
  { label: 'キャラ',    items: ['🥷', '🤖', '👹', '💀', '🦸', '👺'] },
  { label: 'パワー',    items: ['💪', '🥊', '🐉', '👑', '🚀', '🦅'] },
];

interface Props {
  user: User;
  onSave: (updated: User) => void;
  onClose: () => void;
}

export function ProfileEditModal({ user, onSave, onClose }: Props) {
  const [nickname, setNickname] = useState(user.nickname);
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState('');

  const handleSave = () => {
    const name = nickname.trim();
    if (!name) { setError('ニックネームを入力してください'); return; }
    if (name.length > 12) { setError('12文字以内で入力してください'); return; }
    onSave({ ...user, nickname: name, avatar });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box profile-edit-box" onClick={e => e.stopPropagation()}>
        {/* プレビュー */}
        <div className="profile-preview">
          <div className="profile-preview-avatar">{avatar}</div>
          <div className="profile-preview-name">{nickname || '…'}</div>
        </div>

        {/* ニックネーム */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>ニックネーム</div>
          <input
            type="text"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError(''); }}
            maxLength={12}
            autoFocus
          />
          {error && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 6 }}>{error}</div>}
        </div>

        {/* アバター */}
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

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            className="btn"
            style={{
              flex: 1, padding: '14px',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1.5px solid var(--border)',
              fontSize: 14,
            }}
            onClick={onClose}
          >
            キャンセル
          </button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
