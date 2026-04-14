import { useState, useEffect } from 'react';
import type { Workout } from '../types';
import { isStrengthDetail, isCardioDetail } from '../types';
import { getWorkoutsForMonth } from '../firebase';

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
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setSelectedDay(null);
    getWorkoutsForMonth(year, month)
      .then(setWorkouts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // Build day map
  const dayMap = new Map<string, DayData>();
  for (const w of workouts) {
    const existing = dayMap.get(w.date) ?? { hasStrength: false, hasCardio: false, workouts: [] };
    if (w.type === 'strength') existing.hasStrength = true;
    else existing.hasCardio = true;
    existing.workouts.push(w);
    dayMap.set(w.date, existing);
  }

  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfWeek(year, month);
  const activeDays = dayMap.size;
  const strengthDays = [...dayMap.values()].filter(d => d.hasStrength).length;
  const cardioDays = [...dayMap.values()].filter(d => d.hasCardio).length;

  const todayStr = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const cells: Array<{ day: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: null });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, dateStr: toDateStr(year, month, d) });
  }

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

      {/* Summary */}
      <div className="calendar-summary">
        <div className="summary-card">
          <div className="summary-num white">{activeDays}</div>
          <div className="summary-label">運動した日</div>
        </div>
        <div className="summary-card">
          <div className="summary-num orange">{strengthDays}</div>
          <div className="summary-label">筋トレ日</div>
        </div>
        <div className="summary-card">
          <div className="summary-num green">{cardioDays}</div>
          <div className="summary-label">有酸素日</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>読み込み中...</span>
        </div>
      ) : (
        <div className="calendar-grid-wrap">
          {/* Weekday headers */}
          <div className="cal-weekdays">
            {WEEKDAYS.map(d => (
              <div key={d} className="cal-weekday">{d}</div>
            ))}
          </div>

          {/* Days */}
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
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, padding: '12px 20px 0', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span className="cal-dot strength" style={{ width: 8, height: 8 }} />
          筋トレ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span className="cal-dot cardio" style={{ width: 8, height: 8 }} />
          有酸素
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="day-detail-overlay" onClick={() => setSelectedDay(null)}>
          <div className="day-detail-panel" onClick={e => e.stopPropagation()}>
            <div className="day-detail-header">
              <div className="day-detail-title">
                {selectedDay.replace('-', '年').replace('-', '月')}日の記録
              </div>
              <button className="close-btn" onClick={() => setSelectedDay(null)}>×</button>
            </div>

            {selectedWorkouts.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>
                記録なし
              </div>
            ) : (
              selectedWorkouts.map(w => (
                <DayDetailItem key={w.id} workout={w} />
              ))
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

  const exerciseName = isStrengthDetail(details) ? details.exercise : isCardioDetail(details) ? details.exercise : '';

  return (
    <div className="workout-item" style={{ marginBottom: 10 }}>
      <div className="workout-item-avatar">{workout.avatar}</div>
      <div className="workout-item-body">
        <div className="workout-item-user">{workout.nickname}</div>
        <div className={`workout-item-type ${type}`}>
          {type === 'strength' ? '🏋️ ' : '🏃 '}
          {exerciseName}
        </div>
        <div className="workout-item-detail">{detailText}</div>
        {workout.memo && <div className="workout-item-memo">"{workout.memo}"</div>}
      </div>
    </div>
  );
}
