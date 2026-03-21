// ─── ADMIN COMPLAINTS ────────────────────────────────────────
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGymComplaints, updateComplaint } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { MessageSquare, CheckCircle2, Clock } from 'lucide-react';

export function AdminComplaints() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const gymId = profile?.gymId;
  const [reply, setReply]       = useState({});
  const [filter, setFilter]     = useState('open');

  const { data: complaints } = useQuery({
    queryKey: ['gymComplaints', gymId],
    queryFn: () => getGymComplaints(gymId),
    enabled: !!gymId,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateComplaint(id, data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['gymComplaints']); },
    onError: (err) => toast.error(err.message),
  });

  const filtered = complaints?.filter((c) => filter === 'all' || c.status === filter) || [];

  return (
    <div className="space-y-5 animate-fadeUp max-w-2xl">
      <h2 className="page-header">Complaints</h2>

      <div className="flex gap-2">
        {['open','resolved','all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
              filter===f ? 'bg-brand text-white' : 'bg-surface-raised border border-surface-border text-gray-400'}`}>
            {f} {f==='open' && <span className="ml-1">({complaints?.filter(c=>c.status==='open').length||0})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <MessageSquare size={36} className="mx-auto text-gray-600 mb-3"/>
          <p className="text-gray-400">No {filter} complaints</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className={`card ${c.status==='open' ? 'border-yellow-500/20' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  {c.category && <span className="text-xs font-semibold text-brand">{c.category}</span>}
                  <p className="text-sm mt-0.5">{c.issue}</p>
                  <p className="text-xs text-gray-500 mt-1">{format(new Date(c.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                </div>
                <span className={c.status==='resolved' ? 'badge-resolved' : 'badge-open shrink-0'}>{c.status}</span>
              </div>

              {c.adminReply && (
                <div className="text-xs bg-surface rounded-lg p-2 text-gray-300 mb-2">
                  <span className="text-gray-500">Your reply: </span>{c.adminReply}
                </div>
              )}

              {c.status === 'open' && (
                <div className="mt-3 space-y-2">
                  <textarea rows={2} className="input-field text-sm resize-none" placeholder="Type a reply (optional)…"
                    value={reply[c.id]||''} onChange={e=>setReply({...reply,[c.id]:e.target.value})} />
                  <button onClick={()=>updateMut.mutate({id:c.id,data:{status:'resolved',adminReply:reply[c.id]||''}})}
                    disabled={updateMut.isPending}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                    <CheckCircle2 size={15}/> Mark Resolved
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminComplaints;
