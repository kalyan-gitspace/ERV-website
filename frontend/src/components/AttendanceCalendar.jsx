import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { dateOnly } from '../utils/dateOnly';

const statusColors = {
  Present: 'bg-emerald-500',
  Absent: 'bg-rose-500',
  WFH: 'bg-blue-500',
  Halfday: 'bg-white',
  'On Site Work': 'bg-yellow-400',
  'Paid Holiday': 'bg-orange-500',
  Festival: 'bg-pink-500',
  'Paid Leave': 'bg-purple-500'
};

export default function AttendanceCalendar({ records = [], joiningDate = '', editable = false, selectedDate = '', previewStatus = '', onSelectDate }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const today = useMemo(() => dateOnly(new Date()), []);

  const recordMap = useMemo(
    () => Object.fromEntries(records.map((record) => [dateOnly(record.attendance_date), record.status])),
    [records]
  );

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);

  const moveMonth = (offset) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => moveMonth(-1)} className="cursor-pointer rounded bg-slate-800 p-1.5">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-semibold">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h5>
          <label className="cursor-pointer rounded bg-slate-800 p-1.5" title="Choose month and year">
            <CalendarDays className="h-4 w-4" />
            <input type="month" value={`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`} onChange={(event) => { const [year, monthNumber] = event.target.value.split('-').map(Number); setMonth(new Date(year, monthNumber - 1, 1)); }} className="sr-only" />
          </label>
        </div>
        <button type="button" onClick={() => moveMonth(1)} className="cursor-pointer rounded bg-slate-800 p-1.5">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto mt-3 grid max-w-sm grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span key={day}>{day}</span>
        ))}
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} className="h-7" />;

          const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const weekday = new Date(month.getFullYear(), month.getMonth(), day).getDay();
          const beforeJoining = joiningDate && key < dateOnly(joiningDate);
          const futureDate = key > today;
          const status = beforeJoining ? 'Before Joining' : futureDate ? 'Future' : weekday === 0 ? 'Paid Holiday' : selectedDate === key && previewStatus ? previewStatus : recordMap[key];
          const color = beforeJoining || futureDate ? 'bg-slate-800' : statusColors[status] || 'bg-slate-700';
          const isDisabled = !editable || Boolean(beforeJoining) || futureDate || weekday === 0;

          return (
            <button
              type="button"
              key={key}
              disabled={isDisabled}
              onClick={() => onSelectDate?.(key, recordMap[key] || '')}
              title={beforeJoining ? 'Before joining date' : futureDate ? 'Future date' : weekday === 0 ? 'Paid Holiday' : status || 'Not updated'}
              className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[10px] ${color} ${
                status === 'Halfday' ? 'text-slate-900' : 'text-white'
              } ${isDisabled && !editable ? '' : isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-3 flex max-w-sm flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
        {Object.entries(statusColors).map(([status, color]) => (
          <span key={status} className="inline-flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
