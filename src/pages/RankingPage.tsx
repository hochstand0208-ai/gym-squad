import { useState, useEffect, useMemo } from 'react';
import type { User, Workout } from '../types';
import { useWorkouts } from '../WorkoutContext';
import { AvatarImg } from '../components/AvatarImg';
import { getFineRateSettings, setFineRate } from '../firebase';
import type { FineRateSettings } from '../firebase';

const MONTHS_JP = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const RATE_OPTIONS = [50, 100, 200];

interface UserRank {
  user: User;
  missedDays: number;
  fine: number;
  workedDays: number;
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function calcStats(workouts: Workout[], user: User, year: number, month: number) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const lastDay = isCurrentMonth ? now.getDate() : daysInMonth(year, month);

  const reg = new Date(user.createdAt);
  const regYear = reg.getFullYear();
  const regMonth = reg.getMonth() + 1;
  const regDay = reg.getDate();

  if (regYear > year || (regYear === year && regMonth > month)) {
    return { missedDays: 0, workedDays: 0 };
  }

  const startDay = (regYear === year && regMonth === month) ? regDay : 1;

  const workedSet = new Set<string>();
  for (const w of workouts) workedSet.add(w.date);

  let missed = 0;
  for (let d = startDay; d <= lastDay; d++) {
    if (!workedSet.has(toDateStr(year, month, d))) missed++;
  }
  return { missedDays: missed, workedDays: workedSet.size };
}

function formatChangedAt(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface Props {
  user: User;
}

export function RankingPage({ user }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [settings, setSettings] = useState<FineRateSettings>({ rate: 100, previousRate: null, changedBy: null, changedByAvatar: null, changedAt: null });
  const [rateLoading, setRateLoading] = useState(true);
  const [pendingRate, setPendingRate] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const { users, usersLoading, monthCache, fetchMonth } = useWorkouts();

  useEffect(() => {
    getFineRateSettings().then(s => { setSettings(s); setRateLoading(false); });
  }, []);

  useEffect(() => {
    fetchMonth(year, month);
  }, [year, month, fetchMonth]);

  const workouts = monthCache[`${year}-${month}`] ?? null;
  const loading = workouts === null || usersLoading;

  const finePerDay = settings.rate;

  const ranks = useMemo<UserRank[]>(() => {
    if (!workouts || users.length === 0) return [];
    return users
      .map(u => {
        const uw = workouts.filter(w => w.userId === u.id);
        const { missedDays, workedDays } = calcStats(uw, u, year, month);
        return { user: u, missedDays, fine: missedDays * finePerDay, workedDays };
      })
      .sort((a, b) => b.fine - a.fine);
  }, [workouts, users, year, month, finePerDay]);

  const totalPool = ranks.reduce((s, r) => s + r.fine, 0);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    if (nextY > now.getFullYear() || (nextY === now.getFullYear() && nextM > now.getMonth() + 1)) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const isNextDisabled = (() => {
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    return nextY > now.getFullYear() || (nextY === now.getFullYear() && nextM > now.getMonth() + 1);
  })();

  const handleConfirmRate = async () => {
    if (pendingRate === null) return;
    setSaving(true);
    await setFineRate(pendingRate, settings.rate, user.nickname, user.avatar);
    setSettings({
      rate: pendingRate,
      previousRate: settings.rate,
      changedBy: user.nickname,
      changedByAvatar: user.avatar,
      changedAt: Date.now(),
    });
    setPendingRate(null);
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="ranking-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="ranking-title">💰 罰金ランキング</div>
            <div className="ranking-subtitle">運動しなかった日 × ¥{finePerDay.toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="month-nav-btn" onClick={prevMonth}>‹</button>
            <div style={{ fontSize: 13, fontWeight: 700, minWidth: 80, textAlign: 'center' }}>
              {year}年{MONTHS_JP[month - 1]}
            </div>
            <button className="month-nav-btn" onClick={nextMonth} disabled={isNextDisabled} style={{ opacity: isNextDisabled ? 0.3 : 1 }}>›</button>
          </div>
        </div>

        {/* レート選択 */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>罰金レート</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {RATE_OPTIONS.map(rate => (
              <button
                key={rate}
                className={`rate-btn ${finePerDay === rate ? 'active' : ''}`}
                onClick={() => { if (rate !== finePerDay) setPendingRate(rate); }}
                disabled={rateLoading}
              >
                ¥{rate}
              </button>
            ))}
          </div>
        </div>

        {/* 変更履歴 */}
        {!rateLoading && settings.changedBy && settings.changedAt && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
            <AvatarImg avatar={settings.changedByAvatar ?? ''} size={16} />
            <span>
              {settings.changedBy}が
              {settings.previousRate != null ? ` ¥${settings.previousRate} → ` : ' '}
              ¥{settings.rate} に変更（{formatChangedAt(settings.changedAt)}）
            </span>
          </div>
        )}
      </div>

      {/* Pool total */}
      <div className="pool-card">
        <div className="pool-label">合計罰金プール</div>
        <div className="pool-amount">
          <span>¥</span>{loading ? '–' : totalPool.toLocaleString()}
        </div>
        <div className="pool-note">{year}年{MONTHS_JP[month - 1]} 累計</div>
      </div>

      {loading ? (
        <div className="ranking-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rank-item" style={{ opacity: 0.2 }}>
              <div className="rank-num other">{i + 1}</div>
              <div className="rank-avatar" style={{ background: 'var(--bg-elevated)' }} />
              <div className="rank-info">
                <div style={{ height: 14, width: 80, background: 'var(--bg-elevated)', borderRadius: 6 }} />
                <div style={{ height: 11, width: 120, background: 'var(--bg-elevated)', borderRadius: 6, marginTop: 6 }} />
              </div>
              <div style={{ height: 20, width: 50, background: 'var(--bg-elevated)', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : ranks.length === 0 ? (
        <div className="loading-state">
          <span style={{ fontSize: 40 }}>👤</span>
          <span>まだユーザーがいません</span>
        </div>
      ) : (
        <div className="ranking-list">
          {ranks.map((r, idx) => <RankItem key={r.user.id} rank={r} position={idx + 1} />)}
        </div>
      )}

      {/* レート変更確認モーダル */}
      {pendingRate !== null && (
        <div className="modal-overlay" onClick={() => setPendingRate(null)}>
          <div className="modal-box" style={{ maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ fontSize: 18 }}>罰金レートの変更</div>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>
                ¥{settings.rate} → ¥{pendingRate}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                全員に即座に適用されます
              </div>
            </div>

            {settings.changedBy && settings.changedAt && (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AvatarImg avatar={settings.changedByAvatar ?? ''} size={20} />
                <span>
                  前回：{settings.changedBy}が
                  {settings.previousRate != null ? ` ¥${settings.previousRate} → ` : ' '}
                  ¥{settings.rate} に変更（{formatChangedAt(settings.changedAt)}）
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn"
                style={{ flex: 1, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}
                onClick={() => setPendingRate(null)}
                disabled={saving}
              >
                キャンセル
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleConfirmRate}
                disabled={saving}
              >
                {saving ? '変更中...' : '変更する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RankItem({ rank, position }: { rank: UserRank; position: number }) {
  const rankClass = position === 1 ? 'r1' : position === 2 ? 'r2' : position === 3 ? 'r3' : 'other';
  return (
    <div className={`rank-item ${rank.fine === 0 ? 'rank-zero' : ''}`}>
      <div className={`rank-num ${rankClass}`}>{position}</div>
      <AvatarImg avatar={rank.user.avatar} size={44} className="rank-avatar" />
      <div className="rank-info">
        <div className="rank-name">{rank.user.nickname}</div>
        <div className="rank-detail">
          {rank.missedDays > 0
            ? `サボった日：${rank.missedDays}日 / 運動：${rank.workedDays}日`
            : `全日運動！🎉 運動：${rank.workedDays}日`}
        </div>
      </div>
      <div className="rank-fine">
        <div className="rank-fine-amount">¥{rank.fine.toLocaleString()}</div>
        <div className="rank-fine-label">{rank.fine === 0 ? '罰金なし' : '罰金'}</div>
      </div>
    </div>
  );
}
