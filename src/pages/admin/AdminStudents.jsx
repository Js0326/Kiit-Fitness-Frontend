import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { searchStudent, activateSubscription, unbanStudent, getGymSubscriptions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Search, UserCheck, UserX, ShieldCheck, Clock } from 'lucide-react';

export default function AdminStudents() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const gymId = profile?.gymId;

  const [rollNo, setRollNo]   = useState('');
  const [found, setFound]     = useState(null);
  const [months, setMonths]   = useState(1);
  const [searching, setSrch]  = useState(false);

  const { data: subs } = useQuery({ queryKey:['gymSubs', gymId], queryFn:()=>getGymSubscriptions(gymId), enabled:!!gymId });

  const doSearch = async (e) => {
    e.preventDefault();
    if (!rollNo) return;
    setSrch(true);
    try {
      const student = await searchStudent(rollNo);
      setFound(student);
    } catch (err) {
      toast.error(err.message);
      setFound(null);
    } finally {
      setSrch(false);
    }
  };

  const activateMut = useMutation({
    mutationFn: activateSubscription,
    onSuccess: (data) => {
      toast.success(`Subscription activated until ${data.endDate}`);
      qc.invalidateQueries(['gymSubs']);
      setFound(null); setRollNo('');
    },
    onError: (err) => toast.error(err.message),
  });

  const unbanMut = useMutation({
    mutationFn: unbanStudent,
    onSuccess: () => { toast.success('Student unbanned'); setFound(null); qc.invalidateQueries(['gymSubs']); },
    onError: (err) => toast.error(err.message),
  });

  const activeSubs = subs?.filter((s) => s.status === 'active') || [];

  return (
    <div className="space-y-6 animate-fadeUp max-w-2xl">
      <h2 className="page-header">Student Management</h2>

      {/* Search + Activate */}
      <div className="card space-y-4">
        <p className="section-title">Activate Subscription</p>
        <p className="text-sm text-gray-400">Search by roll number to activate or renew a student's membership.</p>

        <form onSubmit={doSearch} className="flex gap-2">
          <input className="input-field flex-1" placeholder="Enter Roll Number (e.g. 22051234)"
            value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
          <button type="submit" disabled={searching} className="btn-primary px-4 shrink-0 flex items-center gap-1.5">
            {searching ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </form>

        {found && (
          <div className="bg-surface rounded-xl p-4 border border-surface-border space-y-3 animate-fadeUp">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{found.name}</p>
                <p className="text-sm text-gray-400">{found.email}</p>
                <p className="text-xs text-gray-500">{found.rollNo}</p>
              </div>
              <div className="text-right">
                {found.isBanned && <span className="badge-expired mb-1 block">Banned</span>}
                <span className="text-xs text-gray-500">Missed: {found.missedCount}</span>
              </div>
            </div>

            {found.isBanned && (
              <button onClick={() => unbanMut.mutate(found.uid)} disabled={unbanMut.isPending}
                className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5">
                <UserCheck size={16} /> Unban Student
              </button>
            )}

            <div>
              <label className="label">Subscription Duration</label>
              <select className="input-field" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>1 Year</option>
              </select>
            </div>

            <button onClick={() => activateMut.mutate({ userId: found.uid, gymId, durationMonths: months })}
              disabled={activateMut.isPending}
              className="btn-primary w-full flex items-center justify-center gap-1.5">
              {activateMut.isPending
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Activating…</>
                : <><ShieldCheck size={16} />Activate {months}-Month Subscription</>}
            </button>
          </div>
        )}
      </div>

      {/* Active members table */}
      <div className="card">
        <p className="section-title">Active Members ({activeSubs.length})</p>
        {activeSubs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No active members</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-surface-border">
                  <th className="pb-2 pr-4 font-medium">User ID</th>
                  <th className="pb-2 pr-4 font-medium">Start</th>
                  <th className="pb-2 pr-4 font-medium">End</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeSubs.map((s) => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(s.endDate) - new Date()) / 86400000));
                  return (
                    <tr key={s.id} className="border-b border-surface-border last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs text-gray-400">{s.userId?.slice(0,10)}…</td>
                      <td className="py-2 pr-4 text-gray-300">{s.startDate}</td>
                      <td className={`py-2 pr-4 ${daysLeft <= 7 ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {s.endDate} {daysLeft <= 7 && <span className="text-xs">({daysLeft}d)</span>}
                      </td>
                      <td className="py-2"><span className="badge-active">Active</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
