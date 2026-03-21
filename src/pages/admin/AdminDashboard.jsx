import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getGym, getGymBookings, getGymAttendance, getGymSubscriptions } from '../../services/api';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, CalendarCheck, ShieldCheck, TrendingUp } from 'lucide-react';

const SLOTS = [
  { id:'06-07', label:'6 AM' },{ id:'07-08', label:'7 AM' },{ id:'08-09', label:'8 AM' },
  { id:'16-17', label:'4 PM' },{ id:'17-18', label:'5 PM' },{ id:'18-19', label:'6 PM' },{ id:'19-20', label:'7 PM' },
];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const gymId = profile?.gymId;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: gym }   = useQuery({ queryKey:['gym', gymId], queryFn:()=>getGym(gymId), enabled:!!gymId });
  const { data: bookings } = useQuery({ queryKey:['gymBookings', gymId, today], queryFn:()=>getGymBookings(gymId, today), enabled:!!gymId, refetchInterval:30_000 });
  const { data: attendance } = useQuery({ queryKey:['gymAtt', gymId, today], queryFn:()=>getGymAttendance(gymId, today), enabled:!!gymId, refetchInterval:30_000 });
  const { data: subs }  = useQuery({ queryKey:['gymSubs', gymId], queryFn:()=>getGymSubscriptions(gymId), enabled:!!gymId, refetchInterval:60_000 });

  const activeToday   = bookings?.filter((b) => b.status === 'booked').length || 0;
  const attendedToday = attendance?.length || 0;
  const activeSubs    = subs?.filter((s) => s.status === 'active').length || 0;

  const slotCounts = SLOTS.map((s) => ({
    name: s.label,
    booked: bookings?.filter((b) => b.slot === s.id && b.status === 'booked').length || 0,
    attended: attendance?.filter((a) => a.slot === s.id).length || 0,
  }));

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h2 className="page-header">Dashboard</h2>
        {gym && <p className="text-gray-400 mt-0.5">{gym.name}</p>}
        <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Today's Bookings",  value: activeToday,   icon: CalendarCheck, color:'text-blue-400'   },
          { label:"Attended Today",    value: attendedToday, icon: TrendingUp,    color:'text-green-400'  },
          { label:"Active Members",    value: activeSubs,    icon: ShieldCheck,   color:'text-brand'      },
          { label:"Capacity/Slot",     value: gym?.capacityPerSlot || 20, icon: Users, color:'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <Icon size={18} className={`${color} mb-2`} />
            <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's slot breakdown */}
      <div className="card">
        <p className="section-title">Today — Bookings by Slot</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={slotCounts} barSize={20} barGap={4}>
            <XAxis dataKey="name" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, fontSize:12 }} />
            <Bar dataKey="booked"   fill="#FF6B00" opacity={0.5} radius={[4,4,0,0]} name="Booked" />
            <Bar dataKey="attended" fill="#FF6B00" radius={[4,4,0,0]} name="Attended" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand/50 inline-block"/>Booked</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand inline-block"/>Attended</span>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="card">
        <p className="section-title">Today's Bookings</p>
        {!bookings?.length ? (
          <p className="text-gray-500 text-sm text-center py-4">No bookings today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-surface-border">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Slot</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings?.slice(0, 10).map((b) => (
                  <tr key={b.id} className="border-b border-surface-border last:border-0">
                    <td className="py-2 text-gray-300 font-mono text-xs">{b.userId?.slice(0,8)}…</td>
                    <td className="py-2 text-gray-300">{b.slot}</td>
                    <td className="py-2">
                      <span className={b.status === 'attended' ? 'badge-active' : b.status === 'missed' ? 'badge-expired' : 'badge-pending'}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
