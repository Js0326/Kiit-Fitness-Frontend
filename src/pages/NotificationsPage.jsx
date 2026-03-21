// ─── NOTIFICATIONS PAGE ───────────────────────────────────────
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Bell, AlertTriangle, Info, Wrench } from 'lucide-react';

const TYPE_ICONS = {
  info:        <Info size={18} className="text-blue-400" />,
  warning:     <AlertTriangle size={18} className="text-yellow-400" />,
  maintenance: <Wrench size={18} className="text-orange-400" />,
  holiday:     <span className="text-lg">🎉</span>,
};

export function NotificationsPage() {
  const { profile } = useAuth();
  const { data: notifs, isLoading } = useQuery({
    queryKey: ['notifications', profile?.gymId],
    queryFn: () => getNotifications(profile?.gymId),
    refetchInterval: 30_000,
  });

  return (
    <div className="px-4 pt-5 pb-4 animate-fadeUp">
      <h2 className="page-header mb-5">Notifications</h2>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : notifs?.length === 0 ? (
        <div className="text-center py-14">
          <Bell size={36} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs?.map((n) => (
            <div key={n.id} className="card">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{TYPE_ICONS[n.type] || TYPE_ICONS.info}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-600 mt-1.5">{format(new Date(n.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
