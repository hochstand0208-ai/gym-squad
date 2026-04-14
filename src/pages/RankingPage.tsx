import { useState, useEffect } from 'react';
import type { User, Workout } from '../types';
import { getAllUsers, getWorkoutsForMonth } from '../firebase';

const MONTHS_JP = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const FINE_PER_DAY = 100;

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

function calcMissedDays(workouts: Workout[], year: number, month: number): { missedDays: number; workedDays: number } {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const lastDay = isCurrentMonth ? now.getDate() : daysInMonth(year, month);

  const workedSet = new Set<string>();
  for (const w of workouts) workedSet.add(w.date);

  let missed = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = toDateStr(year, month, d);
    if (!workedSet.has(dateStr)) missed++;
  }

  return { missedDays: missed, workedDays: workedSet.size };
}

export function RankingPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllUsers(), getWorkoutsForMonth(year, month)])
      .then(([users, allWorkouts]) => {
        const result: UserRank[] = users.map(user => {
          const userWorkouts = allWorkouts.filter(w => w.userId === user.id);
          const { missedDays, workedDays } = calcMissedDays(userWorkouts, year, month);
          return {
            user,
            missedDays,
            fine: missedDays * FINE_PER_DAY,
            workedDays,
          };
        });
        // Sort: most fines first (most missed days = most fine)
        result.sort((a, b) => b.fine - a.fine);
        setRanks(result);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

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

  const totalPool = ranks.reduce((s, r) => s + r.fine, 0);

  const isNextDisabled = (() => {
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    return nextY > now.getFullYear() || (nextY === now.getFullYear() && nextM > now.getMonth() + 1);
  })();

  return (
    <div className="page">
      {/* Header */}
      <div className="ranking-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="ranking-title">💰 罰金ランキング</div>
            <div className="ranking-subtitle">運動しなかった日 × ¥{FINE_PER_DAY.toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="month-nav-btn" onClick={prevMonth}>‹</button>
            <div style={{ fontSize: 13, fontWeight: 700, minWidth: 80, textAlign: 'center' }}>
              {year}年{MONTHS_JP[month - 1]}
            </div>
            <button className="month-nav-btn" onClick={nextMonth} disabled={isNextDisabled} style={{ opacity: isNextDisabled ? 0.3 : 1 }}>›</button>
          </div>
        </div>
      </div>

      {/* Pool total */}
      <div className="pool-card">
        <div className="pool-label">合計罰金プール</div>
        <div className="pool-amount">
          <span>¥</span>{totalPool.toLocaleString()}
        </div>
        <div className="pool-note">
          {year}年{MONTHS_JP[month - 1]} 累計
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>集計中...</span>
        </div>
      ) : ranks.length === 0 ? (
        <div className="loading-state">
          <span style={{ fontSize: 40 }}>👤</span>
          <span>まだユーザーがいません</span>
        </div>
      ) : (
        <div className="ranking-list">
          {ranks.map((r, idx) => (
            <RankItem key={r.user.id} rank={r} position={idx + 1} />
          ))}
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
      <div className="rank-avatar">{rank.user.avatar}</div>
      <div className="rank-info">
        <div className="rank-name">{rank.user.nickname}</div>
        <div className="rank-detail">
          {rank.missedDays > 0
            ? `サボった日：${rank.missedDays}日 / 運動：${rank.workedDays}日`
            : `全日運動！🎉 運動：${rank.workedDays}日`}
        </div>
      </div>
      <div className="rank-fine">
        <div className="rank-fine-amount">
          ¥{rank.fine.toLocaleString()}
        </div>
        <div className="rank-fine-label">
          {rank.fine === 0 ? '罰金なし' : '罰金'}
        </div>
      </div>
    </div>
  );
}
