import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, createNotification, deleteNotification } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Bell, Plus, Trash2, X, AlertTriangle, Info, Wrench } from 'lucide-react';

const TYPES = [
  { val:'info',        label:'Info',        icon: Info,          color:'text-blue-400' },
  { val:'warning',     label:'Warning',     icon: AlertTriangle, color:'text-yellow-400' },
  { val:'maintenance', label:'Maintenance', icon: Wrench,        color:'text-orange-400' },
  { val:'holiday',     label:'Holiday/Off', icon: Bell,          color:'text-purple-400' },
];

export default function AdminNotifications() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const gymId = profile?.gymId;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', message:'', type:'info', gymSpecific: true });

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  });

  const createMut = useMutation({
    mutationFn: createNotification,
    onSuccess: () => { toast.success('Notification sent'); qc.invalidateQueries(['notifications']); setShowForm(false); setForm({title:'',message:'',type:'info',gymSpecific:true}); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['notifications']); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error('Title and message required');
    createMut.mutate({ ...form, gymId: form.gymSpecific ? gymId : null });
  };

  const myNotifs = notifs?.filter((n) => !n.gymId || n.gymId === gymId) || [];

  return (
    <div className="space-y-5 animate-fadeUp max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="page-header">Notifications</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
          {showForm ? <X size={15}/> : <Plus size={15}/>}{showForm ? 'Cancel' : 'New'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card border-brand/30 space-y-4 animate-fadeUp">
          <p className="font-semibold text-brand text-sm">Send Notification</p>
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(({ val, label, icon: Icon, color }) => (
                <button key={val} type="button" onClick={() => setForm({...form, type: val})}
                  className={`rounded-lg border-2 p-3 flex items-center gap-2 text-sm transition-all ${form.type===val ? 'border-brand bg-brand/10' : 'border-surface-border'}`}>
                  <Icon size={16} className={color}/>{label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input-field" placeholder="e.g. Gym closed tomorrow" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea rows={3} className="input-field resize-none" placeholder="Details…" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="gymOnly" checked={form.gymSpecific} onChange={e=>setForm({...form,gymSpecific:e.target.checked})} className="w-4 h-4 accent-brand" />
            <label htmlFor="gymOnly" className="text-sm text-gray-300">Send only to my gym's members</label>
          </div>
          <button type="submit" disabled={createMut.isPending} className="btn-primary w-full">
            {createMut.isPending ? 'Sending…' : 'Send Notification'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {myNotifs.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={36} className="mx-auto text-gray-600 mb-3"/>
            <p className="text-gray-400">No notifications yet</p>
          </div>
        ) : myNotifs.map((n) => {
          const TypeIcon = TYPES.find(t=>t.val===n.type)?.icon || Info;
          const color    = TYPES.find(t=>t.val===n.type)?.color || 'text-blue-400';
          return (
            <div key={n.id} className="card flex items-start gap-3">
              <TypeIcon size={18} className={`${color} shrink-0 mt-0.5`}/>
              <div className="flex-1">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-xs text-gray-600">{format(new Date(n.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                  {n.gymId ? <span className="text-xs text-brand">Gym only</span> : <span className="text-xs text-gray-500">All campuses</span>}
                </div>
              </div>
              <button onClick={() => deleteMut.mutate(n.id)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={16}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
