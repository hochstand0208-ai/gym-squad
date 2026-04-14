import { useState, useEffect, useMemo } from 'react';
import type { Workout } from '../types';
import { isStrengthDetail, isCardioDetail } from '../types';
import { useWorkouts } from '../WorkoutContext';
import { AvatarImg } from '../components/AvatarImg';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS_JP = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function firstDayOfWeek(y: number, m: number) {
  return new Date(y, m - 1, 1).getDay();
}

interface DayData {
  hasStrength: boolean;
  hasCardio: boolean;
  workouts: Workout[];
}

export function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // null = 全員、string = 特定ユーザーのID
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { monthCache, fetchMonth, users } = useWorkouts();

  useEffect(() => {
    fetchMonth(year, month);
  }, [year, month, fetchMonth]);

  const workouts = monthCache[`${year}-${month}`] ?? null;
  const loading = workouts === null;

  // ユーザーフィルター適用後のワークアウト
  const filteredWorkouts = useMemo(() => {
    if (!workouts) return [];
    return selectedUserId ? workouts.filter(w => w.userId === selectedUserId) : workouts;
  }, [workouts, selectedUserId]);

  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // dayMap をフィルター済みワークアウトから構築
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const w of filteredWorkouts) {
      const existing = map.get(w.date) ?? { hasStrength: false, hasCardio: false, workouts: [] };
      if (w.type === 'strength') existing.hasStrength = true;
      else existing.hasCardio = true;
      existing.workouts.push(w);
      map.set(w.date, existing);
    }
    return map;
  }, [filteredWorkouts]);

  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfWeek(year, month);
  const activeDays = dayMap.size;
  const strengthDays = [...dayMap.values()].filter(d => d.hasStrength).length;
  const cardioDays = [...dayMap.values()].filter(d => d.hasCardio).length;

  const todayStr = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const cells = useMemo(() => {
    const arr: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < firstDay; i++) arr.push({ day: null, dateStr: null });
    for (let d = 1; d <= totalDays; d++) arr.push({ day: d, dateStr: toDateStr(year, month, d) });
    return arr;
  }, [year, month, firstDay, totalDays]);

  const selectedWorkouts = selectedDay ? (dayMap.get(selectedDay)?.workouts ?? []) : [];

  return (
    <div className="page">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-title">カレンダー</div>
        <div className="month-nav">
          <button className="month-nav-btn" onClick={prevMonth}>‹</button>
          <div className="month-label">{year}年 {MONTHS_JP[month - 1]}</div>
          <button className="month-nav-btn" onClick={nextMonth}>›</button>
        </div>
      </div>

      {/* ユーザーフィルター */}
      <div className="user-filter-row">
        <button
          className={`user-filter-chip ${selectedUserId === null ? 'active' : ''}`}
          onClick={() => { setSelectedUserId(null); setSelectedDay(null); }}
        >
          <span className="filter-chip-avatar">👥</span>
          <span className="filter-chip-name">全員</span>
        </button>
        {users.map(u => (
          <button
            key={u.id}
            className={`user-filter-chip ${selectedUserId === u.id ? 'active' : ''}`}
            onClick={() => { setSelectedUserId(prev => prev === u.id ? null : u.id); setSelectedDay(null); }}
          >
            <span className="filter-chip-avatar">{u.avatar}</span>
            <span className="filter-chip-name">{u.nickname}</span>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="calendar-summary">
        <div className="summary-card">
          <div className="summary-num white">{loading ? '–' : activeDays}</div>
          <div className="summary-label">運動した日</div>
        </div>
        <div className="summary-card">
          <div className="summary-num orange">{loading ? '–' : strengthDays}</div>
          <div className="summary-label">筋トレ日</div>
        </div>
        <div className="summary-card">
          <div className="summary-num green">{loading ? '–' : cardioDays}</div>
          <div className="summary-label">有酸素日</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid-wrap">
        <div className="cal-weekdays">
          {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
        </div>

        {loading ? (
          <div className="cal-days">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="cal-day" style={{ opacity: 0.15, background: 'var(--bg-elevated)' }} />
            ))}
          </div>
        ) : (
          <div className="cal-days">
            {cells.map((cell, idx) => {
              if (!cell.day || !cell.dateStr) {
                return <div key={`e-${idx}`} className="cal-day empty" />;
              }
              const dayData = dayMap.get(cell.dateStr);
              const dow = (firstDay + cell.day - 1) % 7;
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDay;

              return (
                <button
                  key={cell.dateStr}
                  className={[
                    'cal-day',
                    isToday ? 'today' : '',
                    dow === 0 ? 'sun' : dow === 6 ? 'sat' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedDay(cell.dateStr === selectedDay ? null : cell.dateStr)}
                  style={isSelected && !isToday ? { background: 'var(--bg-elevated)' } : undefined}
                >
                  {cell.day}
                  {dayData && (
                    <div className="cal-dots">
                      {dayData.hasStrength && <span className="cal-dot strength" />}
                      {dayData.hasCardio && <span className="cal-dot cardio" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, padding: '12px 20px 0', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span className="cal-dot strength" style={{ width: 8, height: 8 }} />筋トレ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span className="cal-dot cardio" style={{ width: 8, height: 8 }} />有酸素
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="day-detail-overlay" onClick={() => setSelectedDay(null)}>
          <div className="day-detail-panel" onClick={e => e.stopPropagation()}>
            <div className="day-detail-header">
              <div className="day-detail-title">
                {selectedDay.replace('-', '年').replace('-', '月')}日の記録
                {selectedUserId && users.find(u => u.id === selectedUserId) && (
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 8 }}>
                    {users.find(u => u.id === selectedUserId)?.avatar}
                    {users.find(u => u.id === selectedUserId)?.nickname}
                  </span>
                )}
              </div>
              <button className="close-btn" onClick={() => setSelectedDay(null)}>×</button>
            </div>

            {selectedWorkouts.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>
                記録なし
              </div>
            ) : (
              selectedWorkouts.map(w => <DayDetailItem key={w.id} workout={w} />)
            )}
          </div>
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}

function DayDetailItem({ workout }: { workout: Workout }) {
  const { details, type } = workout;
  let detailText = '';
  if (isStrengthDetail(details)) {
    detailText = `${details.sets}セット × ${details.reps}回`;
    if (details.weight) detailText += ` / ${details.weight}kg`;
  } else if (isCardioDetail(details)) {
    detailText = `${details.duration}分`;
    if (details.distance) detailText += ` / ${details.distance}km`;
  }
  const exerciseName = isStrengthDetail(details)
    ? details.exercise
    : isCardioDetail(details) ? details.exercise : '';

  return (
    <div className="workout-item" style={{ marginBottom: 10 }}>
      <AvatarImg avatar={workout.avatar} size={40} className="workout-item-avatar" />
      <div className="workout-item-body">
        <div className="workout-item-user">{workout.nickname}</div>
        <div className={`workout-item-type ${type}`}>
          {type === 'strength' ? '🏋️ ' : '🏃 '}{exerciseName}
        </div>
        <div className="workout-item-detail">{detailText}</div>
        {workout.memo && <div className="workout-item-memo">"{workout.memo}"</div>}
      </div>
    </div>
  );
}
