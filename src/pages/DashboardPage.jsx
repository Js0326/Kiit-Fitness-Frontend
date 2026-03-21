import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { getMyQR, getMySubscription, getMyBookings, getGym } from '../services/api';
import { format, isToday } from 'date-fns';
import { Flame, ShieldCheck, AlertTriangle, CalendarCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const SLOT_LABELS = {
  '06-07':'6–7 AM','07-08':'7–8 AM','08-09':'8–9 AM',
  '16-17':'4–5 PM','17-18':'5–6 PM','18-19':'6–7 PM','19-20':'7–8 PM',
};

export default function DashboardPage() {
  const { profile } = useAuth();

  const { data: sub } = useQuery({ queryKey: ['mySub'], queryFn: getMySubscription, refetchInterval: 60_000 });
  const { data: qr, refetch: refetchQR, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ['myQR'],
    queryFn: getMyQR,
    enabled: sub?.status === 'active',
    refetchInterval: 5 * 60_000,
  });
  const { data: bookings } = useQuery({ queryKey: ['myBookings'], queryFn: getMyBookings, refetchInterval: 30_000 });
  const { data: gym } = useQuery({
    queryKey: ['gym', profile?.gymId],
    queryFn: () => getGym(profile.gymId),
    enabled: !!profile?.gymId,
  });

  const todayBooking = bookings?.find((b) => isToday(new Date(b.date)) && b.status === 'booked');
  const subActive    = sub?.status === 'active';
  const daysLeft     = sub ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / 86400000)) : 0;

  return (
    <div className="px-4 pt-5 pb-4 space-y-5 animate-fadeUp">
      {/* Greeting */}
      <div>
        <p className="text-gray-400 text-sm">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},</p>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wider">{profile?.name?.split(' ')[0]} 💪</h2>
      </div>

      {/* Streak card */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="section-title">Current Streak</p>
          <div className="flex items-center gap-2">
            <Flame className="text-brand" size={24} />
            <span className="font-display text-4xl font-bold">{profile?.streak || 0}</span>
            <span className="text-gray-400 text-sm">days</span>
          </div>
        </div>
        <div className="text-right">
          <p className="section-title">Missed</p>
          <span className={`font-display text-4xl font-bold ${(profile?.missedCount || 0) >= 2 ? 'text-red-400' : 'text-gray-300'}`}>
            {profile?.missedCount || 0}
          </span>
          <p className="text-xs text-gray-500">/ 3 ban</p>
        </div>
      </div>

      {/* Ban warning */}
      {profile?.isBanned && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-400">Account Banned</p>
            <p className="text-sm text-gray-400">You missed 3+ slots. Contact your gym admin to get unbanned.</p>
          </div>
        </div>
      )}

      {/* Subscription card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Subscription</p>
          {subActive ? <span className="badge-active"><ShieldCheck size={12} /> Active</span>
            : <span className="badge-expired">Inactive</span>}
        </div>
        {subActive ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Gym</p>
              <p className="font-medium text-white">{gym?.name || profile?.gymId || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Expires</p>
              <p className={`font-medium ${daysLeft <= 7 ? 'text-yellow-400' : 'text-white'}`}>
                {format(new Date(sub.endDate), 'dd MMM yyyy')}
                {daysLeft <= 7 && <span className="text-xs ml-1">({daysLeft}d)</span>}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No active subscription. Visit your gym desk to register and pay.
          </p>
        )}
      </div>

      {/* Today's booking */}
      {todayBooking ? (
        <div className="card border-brand/40">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck size={18} className="text-brand" />
            <p className="section-title mb-0">Today's Slot</p>
          </div>
          <p className="font-display text-xl font-bold">{SLOT_LABELS[todayBooking.slot]}</p>
          <p className="text-sm text-gray-400 mt-1">{gym?.name}</p>
        </div>
      ) : (
        subActive && (
          <Link to="/book" className="card border-dashed border-surface-border hover:border-brand/40 transition-colors flex items-center justify-center py-6">
            <div className="text-center">
              <CalendarCheck size={28} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No booking today — tap to book a slot</p>
            </div>
          </Link>
        )
      )}

      {/* QR Code */}
      {subActive && (
        <div className="card text-center">
          <p className="section-title">Daily Access QR</p>
          {qrLoading ? (
            <div className="w-48 h-48 mx-auto flex items-center justify-center">
              <span className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : qrError ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">{qrError.message}</p>
              <button onClick={() => refetchQR()} className="btn-ghost text-sm flex items-center gap-1 mx-auto">
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : qr ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-2xl">
                <QRCodeSVG value={qr.qrToken} size={192} level="H" />
              </div>
              <p className="text-xs text-gray-500">Scan at the gym entrance • Valid today only</p>
              <button onClick={() => refetchQR()} className="btn-ghost text-xs flex items-center gap-1">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
