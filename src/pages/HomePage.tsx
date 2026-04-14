import { useState, useEffect, useCallback } from 'react';
import type { User, Workout, WorkoutType } from '../types';
import { isStrengthDetail, isCardioDetail } from '../types';
import { saveWorkout, subscribeToDateWorkouts } from '../firebase';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { AvatarImg } from '../components/AvatarImg';
import { useWorkouts } from '../WorkoutContext';

const CARDIO_TYPES = ['ランニング', 'サイクリング', '水泳', 'ウォーキング', '縄跳び', 'その他'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  user: User;
  onUpdateUser: (updated: User) => void;
  onLogout: () => void;
}

interface StrengthForm {
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  memo: string;
}

interface CardioForm {
  exercise: string;
  duration: string;
  distance: string;
  memo: string;
}

const defaultStrength: StrengthForm = { exercise: '', sets: '', reps: '', weight: '', memo: '' };
const defaultCardio: CardioForm = { exercise: CARDIO_TYPES[0], duration: '', distance: '', memo: '' };

export function HomePage({ user, onUpdateUser, onLogout }: Props) {
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [strengthForm, setStrengthForm] = useState<StrengthForm>(defaultStrength);
  const [cardioForm, setCardioForm] = useState<CardioForm>(defaultCardio);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [todayWorkouts, setTodayWorkouts] = useState<Workout[]>([]);
  const { invalidateMonth } = useWorkouts();

  const today = toDateStr(new Date());

  useEffect(() => {
    const unsub = subscribeToDateWorkouts(today, setTodayWorkouts);
    return unsub;
  }, [today]);

  const handleTypeSelect = (type: WorkoutType) => {
    setSelectedType(prev => prev === type ? null : type);
  };

  const validateAndSave = async () => {
    if (!selectedType) return;
    setSaving(true);

    try {
      if (selectedType === 'strength') {
        if (!strengthForm.exercise.trim() || !strengthForm.sets || !strengthForm.reps) {
          alert('種目・セット数・回数を入力してください');
          setSaving(false);
          return;
        }
        await saveWorkout({
          userId: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          type: 'strength',
          details: {
            exercise: strengthForm.exercise.trim(),
            sets: parseInt(strengthForm.sets),
            reps: parseInt(strengthForm.reps),
            ...(strengthForm.weight ? { weight: parseFloat(strengthForm.weight) } : {}),
          },
          memo: strengthForm.memo.trim(),
          date: today,
          createdAt: Date.now(),
        });
        setStrengthForm(defaultStrength);
      } else {
        if (!cardioForm.duration) {
          alert('時間を入力してください');
          setSaving(false);
          return;
        }
        await saveWorkout({
          userId: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          type: 'cardio',
          details: {
            exercise: cardioForm.exercise,
            duration: parseInt(cardioForm.duration),
            ...(cardioForm.distance ? { distance: parseFloat(cardioForm.distance) } : {}),
          },
          memo: cardioForm.memo.trim(),
          date: today,
          createdAt: Date.now(),
        });
        setCardioForm(defaultCardio);
      }
      setSelectedType(null);
      setShowSuccess(true);
      // カレンダー・ランキングのキャッシュを更新
      const now2 = new Date();
      invalidateMonth(now2.getFullYear(), now2.getMonth() + 1);
      // LINE通知（失敗してもワークアウト保存は成功扱い）
      const notifyDetails = selectedType === 'strength'
        ? { exercise: strengthForm.exercise.trim(), sets: parseInt(strengthForm.sets), reps: parseInt(strengthForm.reps), ...(strengthForm.weight ? { weight: parseFloat(strengthForm.weight) } : {}) }
        : { exercise: cardioForm.exercise, duration: parseInt(cardioForm.duration), ...(cardioForm.distance ? { distance: parseFloat(cardioForm.distance) } : {}) };
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: user.nickname,
          avatar: user.avatar,
          type: selectedType,
          details: notifyDetails,
          memo: selectedType === 'strength' ? strengthForm.memo.trim() : cardioForm.memo.trim(),
        }),
      }).catch(console.error);
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました。Firebase の設定を確認してください。');
    } finally {
      setSaving(false);
    }
  };

  const onSuccessComplete = useCallback(() => setShowSuccess(false), []);

  const now = new Date();
  const greetHour = now.getHours();
  const greeting = greetHour < 10 ? 'おはようございます！' : greetHour < 17 ? 'こんにちは！' : 'お疲れ様！';

  return (
    <>
      <SuccessAnimation show={showSuccess} onComplete={onSuccessComplete} />

      {showEditProfile && (
        <ProfileEditModal
          user={user}
          onSave={updated => { onUpdateUser(updated); setShowEditProfile(false); }}
          onClose={() => setShowEditProfile(false)}
          onLogout={onLogout}
        />
      )}

      <div className="page">
        {/* Header */}
        <div className="home-header">
          <button className="home-profile-btn" onClick={() => setShowEditProfile(true)}>
            <AvatarImg avatar={user.avatar} size={52} />
            <div>
              <div className="home-greeting">{greeting}</div>
              <div className="home-name">
                {user.nickname}
                <span className="home-edit-icon">✏️</span>
              </div>
            </div>
          </button>
          <div className="logo-badge">GYM SQUAD</div>
        </div>

        {/* Type selection */}
        <div style={{ padding: '16px 20px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          今日のトレーニング
        </div>
        <div className="workout-type-grid">
          <button
            className={`workout-type-btn strength ${selectedType === 'strength' ? 'active' : ''}`}
            onClick={() => handleTypeSelect('strength')}
          >
            <span className="workout-type-icon">🏋️</span>
            <span className="workout-type-label">筋トレ</span>
          </button>
          <button
            className={`workout-type-btn cardio ${selectedType === 'cardio' ? 'active' : ''}`}
            onClick={() => handleTypeSelect('cardio')}
          >
            <span className="workout-type-icon">🏃</span>
            <span className="workout-type-label">有酸素</span>
          </button>
        </div>

        {/* Form: Strength */}
        {selectedType === 'strength' && (
          <div className="workout-form">
            <div className="form-section">
              <div className="form-group">
                <div className="form-label">種目</div>
                <input
                  type="text"
                  placeholder="例：ベンチプレス、スクワット..."
                  value={strengthForm.exercise}
                  onChange={e => setStrengthForm(p => ({ ...p, exercise: e.target.value }))}
                />
              </div>
              <div className="form-row cols-3">
                <div className="form-group">
                  <div className="form-label">セット</div>
                  <input
                    type="number"
                    placeholder="3"
                    min={1}
                    value={strengthForm.sets}
                    onChange={e => setStrengthForm(p => ({ ...p, sets: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">回数</div>
                  <input
                    type="number"
                    placeholder="10"
                    min={1}
                    value={strengthForm.reps}
                    onChange={e => setStrengthForm(p => ({ ...p, reps: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">重量(kg)</div>
                  <input
                    type="number"
                    placeholder="60"
                    min={0}
                    step={0.5}
                    value={strengthForm.weight}
                    onChange={e => setStrengthForm(p => ({ ...p, weight: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="form-label">メモ（任意）</div>
                <input
                  type="text"
                  placeholder="フォームが安定してきた、など..."
                  value={strengthForm.memo}
                  onChange={e => setStrengthForm(p => ({ ...p, memo: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Form: Cardio */}
        {selectedType === 'cardio' && (
          <div className="workout-form">
            <div className="form-section">
              <div className="form-group">
                <div className="form-label">種目</div>
                <select
                  value={cardioForm.exercise}
                  onChange={e => setCardioForm(p => ({ ...p, exercise: e.target.value }))}
                >
                  {CARDIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <div className="form-label">時間（分）</div>
                  <input
                    type="number"
                    placeholder="30"
                    min={1}
                    value={cardioForm.duration}
                    onChange={e => setCardioForm(p => ({ ...p, duration: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">距離(km)</div>
                  <input
                    type="number"
                    placeholder="5.0"
                    min={0}
                    step={0.1}
                    value={cardioForm.distance}
                    onChange={e => setCardioForm(p => ({ ...p, distance: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="form-label">メモ（任意）</div>
                <input
                  type="text"
                  placeholder="ペース良かった、など..."
                  value={cardioForm.memo}
                  onChange={e => setCardioForm(p => ({ ...p, memo: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {selectedType && (
          <div className="record-btn-wrap">
            <button
              className="btn btn-primary"
              onClick={validateAndSave}
              disabled={saving}
              style={{
                background: selectedType === 'cardio' ? 'var(--green)' : undefined,
              }}
            >
              {saving ? '保存中...' : '記録する！'}
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={{ margin: '4px 20px 0' }}>
          <div className="divider" />
        </div>

        {/* Today's workouts */}
        <div className="today-section" style={{ marginTop: 16 }}>
          <div className="section-title">
            今日の記録
            {todayWorkouts.length > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 700 }}>
                {todayWorkouts.length}件
              </span>
            )}
          </div>

          {todayWorkouts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌅</div>
              <div className="empty-state-text">
                まだ記録がありません<br />今日もトレーニング頑張ろう！
              </div>
            </div>
          ) : (
            todayWorkouts.map(w => (
              <WorkoutCard key={w.id} workout={w} isMe={w.userId === user.id} currentUser={user} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function WorkoutCard({ workout, isMe, currentUser }: { workout: Workout; isMe: boolean; currentUser: User }) {
  const { users } = useWorkouts();
  const { details, type } = workout;
  // 最新のユーザー情報（自分はcurrentUser、他者はcontextのusersから）
  const latestUser = isMe ? currentUser : (users.find(u => u.id === workout.userId) ?? null);
  const displayAvatar = latestUser?.avatar ?? workout.avatar;
  const displayName  = latestUser?.nickname ?? workout.nickname;

  let detailText = '';
  if (isStrengthDetail(details)) {
    detailText = `${details.exercise}  ${details.sets}セット × ${details.reps}回`;
    if (details.weight) detailText += `  ${details.weight}kg`;
  } else if (isCardioDetail(details)) {
    detailText = `${details.exercise}  ${details.duration}分`;
    if (details.distance) detailText += `  ${details.distance}km`;
  }

  return (
    <div className="workout-item" style={isMe ? { borderColor: type === 'cardio' ? 'rgba(0,230,118,0.3)' : 'rgba(255,107,43,0.3)' } : {}}>
      <AvatarImg avatar={displayAvatar} size={40} className="workout-item-avatar" />
      <div className="workout-item-body">
        <div className="workout-item-user">
          {displayName}
          {isMe && <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>（自分）</span>}
        </div>
        <div className={`workout-item-type ${type}`}>
          {type === 'strength' ? '🏋️ 筋トレ' : '🏃 有酸素'}
        </div>
        <div className="workout-item-detail">{detailText}</div>
        {workout.memo && <div className="workout-item-memo">"{workout.memo}"</div>}
      </div>
    </div>
  );
}
