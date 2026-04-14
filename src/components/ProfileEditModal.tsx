import { useState, useRef } from 'react';
import type { User } from '../types';
import { uploadAvatarPhoto } from '../firebase';
import { AvatarImg } from './AvatarImg';

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
  onLogout: () => void;
}

export function ProfileEditModal({ user, onSave, onClose, onLogout }: Props) {
  const [nickname, setNickname] = useState(user.nickname);
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatarPhoto(user.id, file);
      setAvatar(url);
    } catch (err) {
      console.error(err);
      alert('写真のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = () => {
    const name = nickname.trim();
    if (!name) { setError('ニックネームを入力してください'); return; }
    if (name.length > 12) { setError('12文字以内で入力してください'); return; }
    onSave({ ...user, nickname: name, avatar });
  };

  const isPhoto = avatar.startsWith('http') || avatar.startsWith('blob:');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box profile-edit-box" onClick={e => e.stopPropagation()}>

        {/* プレビュー */}
        <div className="profile-preview">
          <div className="profile-preview-avatar-wrap">
            <AvatarImg avatar={avatar} size={80} />
            {uploading && (
              <div className="avatar-upload-overlay">
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
              </div>
            )}
          </div>
          <div className="profile-preview-name">{nickname || '…'}</div>
        </div>

        {/* ニックネーム */}
        <div style={{ marginBottom: 16 }}>
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

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            className="btn"
            style={{ flex: 1, padding: '14px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', fontSize: 14 }}
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handleSave}
            disabled={uploading}
          >
            保存する
          </button>
        </div>

        {/* ログアウト */}
        <button
          style={{ width: '100%', marginTop: 16, padding: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
          onClick={() => setShowLogoutConfirm(true)}
        >
          アカウントを切り替える
        </button>

        {/* ログアウト確認 */}
        {showLogoutConfirm && (
          <div style={{ marginTop: 8, background: 'var(--bg-elevated)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>
              このデバイスからログアウトします。<br />データは削除されません。
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn"
                style={{ flex: 1, background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 13 }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                戻る
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: '#ff4444', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700 }}
                onClick={onLogout}
              >
                ログアウト
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
