import { useQuery } from '@tanstack/react-query';
import { getMyAttendance, getMyBookings } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, subDays, isToday } from 'date-fns';
import { Flame, TrendingUp, CalendarX2 } from 'lucide-react';

function buildStreakMap(attendance, bookings) {
  const attDates = new Set(attendance?.map((a) => a.date) || []);
  const missDates = new Set(bookings?.filter((b) => b.status === 'missed').map((b) => b.date) || []);
  const map = {};
  for (let i = 89; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (attDates.has(d)) map[d] = 'attended';
    else if (missDates.has(d)) map[d] = 'missed';
    else map[d] = 'none';
  }
  return map;
}

export default function AttendancePage() {
  const { profile } = useAuth();
  const { data: attendance } = useQuery({ queryKey:['myAttendance'], queryFn: getMyAttendance });
  const { data: bookings }   = useQuery({ queryKey:['myBookings'],   queryFn: getMyBookings });

  const streakMap = buildStreakMap(attendance, bookings);
  const days      = Object.entries(streakMap);
  const attended  = Object.values(streakMap).filter((v) => v === 'attended').length;
  const missed    = Object.values(streakMap).filter((v) => v === 'missed').length;

  // Group by week for heatmap
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="px-4 pt-5 pb-4 space-y-5 animate-fadeUp">
      <h2 className="page-header">Attendance & Streak</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <Flame size={20} className="text-brand mx-auto mb-1" />
          <p className="font-display text-3xl font-bold">{profile?.streak || 0}</p>
          <p className="text-xs text-gray-400">Day Streak</p>
        </div>
        <div className="card text-center">
          <TrendingUp size={20} className="text-green-400 mx-auto mb-1" />
          <p className="font-display text-3xl font-bold text-green-400">{attended}</p>
          <p className="text-xs text-gray-400">Attended (90d)</p>
        </div>
        <div className="card text-center">
          <CalendarX2 size={20} className="text-red-400 mx-auto mb-1" />
          <p className="font-display text-3xl font-bold text-red-400">{missed}</p>
          <p className="text-xs text-gray-400">Missed (90d)</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title mb-0">Last 90 Days</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-brand inline-block" />Attended</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/60 inline-block" />Missed</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-surface-border inline-block" />None</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(([date, status]) => (
                  <div key={date}
                    title={`${date}: ${status}`}
                    className={`w-5 h-5 rounded-sm ${
                      status === 'attended' ? 'bg-brand' :
                      status === 'missed' ? 'bg-red-500/60' :
                      isToday(new Date(date)) ? 'bg-brand/30 ring-1 ring-brand' : 'bg-surface-border'}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>90 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Recent attendance log */}
      <div className="card">
        <p className="section-title">Recent Visits</p>
        {attendance?.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No visits recorded yet</p>
        ) : (
          <div className="space-y-2">
            {attendance?.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{format(new Date(a.date), 'EEE, dd MMM yyyy')}</p>
                  <p className="text-xs text-gray-500">
                    Slot: {a.slot?.replace('-', ':00 – ').replace('06','6 AM').replace('07','7 AM').replace('08','8 AM').replace('16','4 PM').replace('17','5 PM').replace('18','6 PM').replace('19','7 PM')}
                  </p>
                </div>
                <span className="badge-active">✓ Attended</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missed log */}
      {missed > 0 && (
        <div className="card border-red-500/20">
          <p className="section-title text-red-400">Missed Slots</p>
          <div className="space-y-2">
            {bookings?.filter((b) => b.status === 'missed').slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <p className="text-sm text-gray-300">{format(new Date(b.date), 'EEE, dd MMM yyyy')}</p>
                <span className="badge-expired">Missed</span>
              </div>
            ))}
          </div>
          {(profile?.missedCount || 0) >= 2 && (
            <div className="mt-3 p-3 bg-red-500/10 rounded-lg text-xs text-red-400">
              ⚠ {3 - (profile?.missedCount || 0)} more miss = account ban. Be consistent!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
