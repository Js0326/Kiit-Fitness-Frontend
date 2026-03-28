import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Shield, LogOut, LayoutDashboard, Dumbbell, Users, UserCog,
  CreditCard, MessageSquare, Settings, BarChart3, Activity,
  Plus, Trash2, X, Eye, Ban, UserCheck, RefreshCw, Key,
  ChevronRight, AlertTriangle, CheckCircle2, RotateCcw,
  TrendingUp, DollarSign, Building2, UserX, Edit3, Save,
  Navigation2, Image as GymImageIcon,
} from 'lucide-react';
import { GymImageManager } from '../../components/ImageUpload';
import {
  saGetStats, saGetConfig, saUpdateConfig,
  saCreateGym, saDeleteGym, saReactivateGym,
  saGetAdmins, saCreateAdmin, saRevokeAdmin, saReinstateAdmin,
  saResetAdminPass, saReassignAdmin,
  saGetUsers, saGetUser, saBanUser, saUnbanUser, saResetUserStats,
  saGetSubscriptions, saGetComplaints, saResolveComplaint,
  getGyms, updateGym,
} from '../../services/api';

// ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',       label: 'Overview',       icon: LayoutDashboard },
  { id: 'gyms',           label: 'Gyms',           icon: Dumbbell },
  { id: 'admins',         label: 'Admins',         icon: UserCog },
  { id: 'users',          label: 'Users',          icon: Users },
  { id: 'subscriptions',  label: 'Subscriptions',  icon: CreditCard },
  { id: 'complaints',     label: 'Complaints',     icon: MessageSquare },
  { id: 'config',         label: 'Config',         icon: Settings },
];

const GENDER_COLORS = { male: 'text-blue-400', female: 'text-pink-400', both: 'text-purple-400' };
const PIE_COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-raised border border-surface-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeUp">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h3 className="font-display font-bold tracking-wide uppercase">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TAB: OVERVIEW
// ─────────────────────────────────────────────────────────────────
function OverviewTab({ gyms }) {
  const { data: stats, isLoading } = useQuery({ queryKey: ['sa-stats'], queryFn: saGetStats, refetchInterval: 60_000 });

  const slotData = stats ? Object.entries(stats.slotDistribution || {}).map(([slot, count]) => ({
    name: slot.replace('-', '–'), count,
  })) : [];

  const gymPieData = stats && gyms ? Object.entries(stats.gymBookingMap || {}).map(([gymId, count]) => ({
    name: gyms.find(g => g.id === gymId)?.campus || gymId,
    value: count,
  })) : [];

  if (isLoading) return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse" />)}</div>;

  const statCards = [
    { label: 'Total Students',     value: stats?.totalStudents,    icon: Users,       color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    { label: 'Active Memberships', value: stats?.totalActiveSubs,  icon: CreditCard,  color: 'text-green-400',  bg: 'bg-green-500/10' },
    { label: 'Gym Admins',         value: stats?.totalAdmins,      icon: UserCog,     color: 'text-brand',      bg: 'bg-brand/10' },
    { label: 'Open Complaints',    value: stats?.openComplaints,   icon: MessageSquare, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Banned Users',       value: stats?.bannedUsers,      icon: Ban,         color: 'text-red-400',    bg: 'bg-red-500/10' },
    { label: 'Total Bookings',     value: stats?.totalBookings,    icon: Activity,    color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Gyms',         value: stats?.totalGyms,        icon: Building2,   color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
    { label: 'Est. Revenue (₹)',   value: `₹${(stats?.revenueEstimate||0).toLocaleString()}`, icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-header">System Overview</h2>
        <p className="text-gray-400 text-sm mt-0.5">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <p className={`font-display text-2xl font-bold ${color}`}>{value ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <p className="section-title">Bookings by Time Slot</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={slotData} barSize={24}>
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#FF6B00" radius={[4, 4, 0, 0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="section-title">Bookings by Campus</p>
          {gymPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={gymPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {gymPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-sm text-center py-10">No booking data yet</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB: GYMS
// ─────────────────────────────────────────────────────────────────
function GymsTab() {
  const qc = useQueryClient();
  const { data: gyms, isLoading } = useQuery({ queryKey: ['gyms'], queryFn: getGyms });
  const [showCreate, setShowCreate] = useState(false);
  const [editGym, setEditGym] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', campus: '', gender: 'male', capacityPerSlot: 20, description: '', location: '', mapLink: '' });
  const [newGymId, setNewGymId] = useState('');

  const createMut = useMutation({
    mutationFn: saCreateGym,
    onSuccess: (data) => { toast.success('Gym created!'); qc.invalidateQueries(['gyms']); setNewGymId(form.id); setShowCreate(false); setForm({ id:'', name:'', campus:'', gender:'male', capacityPerSlot:20, description:'', location:'', mapLink:'' }); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: saDeleteGym,
    onSuccess: () => { toast.success('Gym deactivated'); qc.invalidateQueries(['gyms']); },
    onError: (e) => toast.error(e.message),
  });

  const reactivateMut = useMutation({
    mutationFn: saReactivateGym,
    onSuccess: () => { toast.success('Gym reactivated'); qc.invalidateQueries(['gyms']); },
    onError: (e) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: ({ gymId, data }) => updateGym(gymId, data),
    onSuccess: () => { toast.success('Gym updated!'); qc.invalidateQueries(['gyms']); setEditGym(null); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="page-header">Gyms ({gyms?.length || 0})</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 py-2 px-4 text-sm">
          <Plus size={15} /> New Gym
        </button>
      </div>

      {isLoading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="card h-20 animate-pulse"/>)}</div> : (
        <div className="space-y-3">
          {gyms?.map((g) => (
            <div key={g.id} className={`card ${g.active === false ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold tracking-wide">{g.name}</span>
                    {g.active === false && <span className="badge-expired text-xs">Inactive</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{g.campus}</span>
                    <span className={GENDER_COLORS[g.gender]}>{g.gender === 'both' ? 'Co-ed' : g.gender === 'male' ? 'Boys' : 'Girls'}</span>
                    <span>Cap: {g.capacityPerSlot}/slot</span>
                    <span>{g.equipment?.length || 0} equipment</span>
                    <span>{g.trainers?.length || 0} trainers</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditGym(g)} className="btn-ghost p-2 text-gray-400 hover:text-brand"><Edit3 size={15} /></button>
                  {g.active === false
                    ? <button onClick={() => reactivateMut.mutate(g.id)} className="btn-ghost p-2 text-green-400"><RefreshCw size={15} /></button>
                    : <button onClick={() => { if (window.confirm(`Deactivate ${g.name}?`)) deleteMut.mutate(g.id); }} className="btn-ghost p-2 text-red-400"><Trash2 size={15} /></button>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Gym Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Gym">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Gym ID (unique, no spaces)</label>
              <input className="input-field" placeholder="e.g. campus6-gym" value={form.id} onChange={e=>setForm({...form,id:e.target.value.toLowerCase().replace(/\s/g,'-')})} /></div>
            <div className="col-span-2"><label className="label">Full Name</label>
              <input className="input-field" placeholder="Campus 6 Fitness Center" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="label">Campus</label>
              <input className="input-field" placeholder="Campus 6" value={form.campus} onChange={e=>setForm({...form,campus:e.target.value})} /></div>
            <div><label className="label">Gender</label>
              <select className="input-field" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                <option value="male">Boys</option><option value="female">Girls</option><option value="both">Co-ed</option>
              </select></div>
            <div><label className="label">Capacity/Slot</label>
              <input type="number" className="input-field" value={form.capacityPerSlot} onChange={e=>setForm({...form,capacityPerSlot:e.target.value})} /></div>
            <div className="col-span-2"><label className="label">Location</label>
              <input className="input-field" placeholder="Building/block details" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></div>
            <div className="col-span-2"><label className="label">Description</label>
              <textarea rows={2} className="input-field resize-none" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
            <div className="col-span-2"><label className="label">Google Maps Link (optional)</label>
              <input className="input-field" placeholder="https://maps.google.com/?q=..." value={form.mapLink||''} onChange={e=>setForm({...form,mapLink:e.target.value})} /></div>
          </div>
          <button onClick={() => createMut.mutate(form)} disabled={createMut.isPending} className="btn-primary w-full">
            {createMut.isPending ? 'Creating…' : 'Create Gym'}
          </button>
        </div>
      </Modal>

      {/* Edit Gym Modal */}
      <Modal open={!!editGym} onClose={() => setEditGym(null)} title={`Edit — ${editGym?.name}`}>
        {editGym && (
          <div className="space-y-3">
            <div><label className="label">Description</label>
              <textarea rows={3} className="input-field resize-none" defaultValue={editGym.description}
                onChange={e => setEditGym({ ...editGym, description: e.target.value })} /></div>
            <div><label className="label">Capacity Per Slot</label>
              <input type="number" className="input-field" defaultValue={editGym.capacityPerSlot}
                onChange={e => setEditGym({ ...editGym, capacityPerSlot: Number(e.target.value) })} /></div>
            <div><label className="label">Gender</label>
              <select className="input-field" defaultValue={editGym.gender}
                onChange={e => setEditGym({ ...editGym, gender: e.target.value })}>
                <option value="male">Boys</option><option value="female">Girls</option><option value="both">Co-ed</option>
              </select></div>
            <div><label className="label">Google Maps Link</label>
              <input className="input-field" placeholder="https://maps.google.com/?q=..." defaultValue={editGym.mapLink||''}
                onChange={e => setEditGym({ ...editGym, mapLink: e.target.value })} /></div>
            <div><label className="label">📷 Gym Photos</label>
              <GymImageManager gymId={editGym.id} images={editGym.images||[]} onImagesChange={(imgs)=>setEditGym({...editGym,images:imgs})} /></div>
            <button onClick={() => editMut.mutate({ gymId: editGym.id, data: { description: editGym.description, capacityPerSlot: editGym.capacityPerSlot, gender: editGym.gender, mapLink: editGym.mapLink || '' } })}
              disabled={editMut.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
              <Save size={16} />{editMut.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB: ADMINS
// ─────────────────────────────────────────────────────────────────
function AdminsTab() {
  const qc = useQueryClient();
  const { data: gyms } = useQuery({ queryKey: ['gyms'], queryFn: getGyms });
  const { data: admins, isLoading } = useQuery({ queryKey: ['sa-admins'], queryFn: saGetAdmins });
  const [showCreate, setShowCreate] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [reassignModal, setReassignModal] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [newGym, setNewGym] = useState('');
  const [form, setForm] = useState({ name:'', email:'', password:'', gymId:'', employeeId:'' });

  const createMut = useMutation({
    mutationFn: saCreateAdmin,
    onSuccess: () => { toast.success('Admin created!'); qc.invalidateQueries(['sa-admins']); setShowCreate(false); setForm({ name:'',email:'',password:'',gymId:'',employeeId:'' }); },
    onError: (e) => toast.error(e.message),
  });
  const revokeMut = useMutation({
    mutationFn: saRevokeAdmin,
    onSuccess: () => { toast.success('Access revoked'); qc.invalidateQueries(['sa-admins']); },
    onError: (e) => toast.error(e.message),
  });
  const reinstateMut = useMutation({
    mutationFn: saReinstateAdmin,
    onSuccess: () => { toast.success('Admin reinstated'); qc.invalidateQueries(['sa-admins']); },
    onError: (e) => toast.error(e.message),
  });
  const passMut = useMutation({
    mutationFn: ({ uid, pass }) => saResetAdminPass(uid, { newPassword: pass }),
    onSuccess: () => { toast.success('Password reset'); setResetModal(null); setNewPass(''); },
    onError: (e) => toast.error(e.message),
  });
  const reassignMut = useMutation({
    mutationFn: ({ uid, gymId }) => saReassignAdmin(uid, { gymId }),
    onSuccess: () => { toast.success('Admin reassigned'); qc.invalidateQueries(['sa-admins']); setReassignModal(null); },
    onError: (e) => toast.error(e.message),
  });

  const gymName = (id) => gyms?.find(g => g.id === id)?.name || id || '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="page-header">Gym Admins ({admins?.length || 0})</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 py-2 px-4 text-sm">
          <Plus size={15} /> Create Admin
        </button>
      </div>

      {/* Admins grouped by gym */}
      {isLoading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="card h-16 animate-pulse"/>)}</div> : (
        <div className="space-y-3">
          {admins?.length === 0 && <div className="card text-center py-8 text-gray-400">No admins created yet</div>}
          {admins?.map((a) => (
            <div key={a.uid} className={`card ${!a.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{a.name}</p>
                    {!a.active && <span className="badge-expired text-xs">Revoked</span>}
                  </div>
                  <p className="text-xs text-gray-400">{a.email}</p>
                  <p className="text-xs text-brand mt-0.5">{gymName(a.gymId)}</p>
                  {a.employeeId && <p className="text-xs text-gray-500">ID: {a.employeeId}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { setReassignModal(a); setNewGym(a.gymId||''); }} title="Reassign gym" className="btn-ghost p-2 text-gray-400 hover:text-brand"><RefreshCw size={14} /></button>
                  <button onClick={() => { setResetModal(a); setNewPass(''); }} title="Reset password" className="btn-ghost p-2 text-gray-400 hover:text-yellow-400"><Key size={14} /></button>
                  {a.active
                    ? <button onClick={() => { if (window.confirm(`Revoke ${a.name}'s access?`)) revokeMut.mutate(a.uid); }} title="Revoke access" className="btn-ghost p-2 text-red-400"><UserX size={14} /></button>
                    : <button onClick={() => reinstateMut.mutate(a.uid)} title="Reinstate" className="btn-ghost p-2 text-green-400"><UserCheck size={14} /></button>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Admin Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Gym Admin">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Admin name" /></div>
            <div><label className="label">Email</label><input type="email" className="input-field" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="admin@kiit.ac.in" /></div>
            <div><label className="label">Employee ID</label><input className="input-field" value={form.employeeId} onChange={e=>setForm({...form,employeeId:e.target.value})} placeholder="EMP001" /></div>
            <div><label className="label">Temp Password</label><input type="password" className="input-field" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 8 chars" /></div>
            <div><label className="label">Assign Gym</label>
              <select className="input-field" value={form.gymId} onChange={e=>setForm({...form,gymId:e.target.value})}>
                <option value="">Select gym…</option>
                {gyms?.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => { if(!form.name||!form.email||!form.password||!form.gymId) return toast.error('All fields required'); createMut.mutate(form); }} disabled={createMut.isPending} className="btn-primary w-full">
            {createMut.isPending ? 'Creating…' : 'Create Admin Account'}
          </button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!resetModal} onClose={() => setResetModal(null)} title={`Reset Password — ${resetModal?.name}`}>
        <div className="space-y-3">
          <div><label className="label">New Password</label><input type="password" className="input-field" placeholder="Min 8 characters" value={newPass} onChange={e=>setNewPass(e.target.value)} /></div>
          <button onClick={() => passMut.mutate({ uid: resetModal.uid, pass: newPass })} disabled={passMut.isPending} className="btn-primary w-full">
            {passMut.isPending ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      </Modal>

      {/* Reassign Modal */}
      <Modal open={!!reassignModal} onClose={() => setReassignModal(null)} title={`Reassign — ${reassignModal?.name}`}>
        <div className="space-y-3">
          <div><label className="label">Assign to Gym</label>
            <select className="input-field" value={newGym} onChange={e=>setNewGym(e.target.value)}>
              <option value="">Select gym…</option>
              {gyms?.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <button onClick={() => reassignMut.mutate({ uid: reassignModal.uid, gymId: newGym })} disabled={reassignMut.isPending || !newGym} className="btn-primary w-full">
            {reassignMut.isPending ? 'Reassigning…' : 'Confirm Reassignment'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB: USERS
// ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const qc = useQueryClient();
  const { data: gyms } = useQuery({ queryKey: ['gyms'], queryFn: getGyms });
  const [filter, setFilter] = useState({ role: 'student', banned: '', gymId: '', search: '' });
  const [detail, setDetail] = useState(null);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['sa-users', filter],
    queryFn: () => saGetUsers({ ...filter }),
  });

  const { data: userDetail } = useQuery({
    queryKey: ['sa-user', detail],
    queryFn: () => saGetUser(detail),
    enabled: !!detail,
  });

  const banMut    = useMutation({ mutationFn: ({ uid, reason }) => saBanUser(uid, { reason }), onSuccess: () => { toast.success('Banned'); qc.invalidateQueries(['sa-users']); }, onError: e => toast.error(e.message) });
  const unbanMut  = useMutation({ mutationFn: saUnbanUser,    onSuccess: () => { toast.success('Unbanned'); qc.invalidateQueries(['sa-users']); }, onError: e => toast.error(e.message) });
  const resetMut  = useMutation({ mutationFn: ({ uid, ...d }) => saResetUserStats(uid, d), onSuccess: () => { toast.success('Stats reset'); qc.invalidateQueries(['sa-users']); }, onError: e => toast.error(e.message) });

  return (
    <div className="space-y-5">
      <h2 className="page-header">User Management</h2>

      {/* Filters */}
      <div className="card space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Role</label>
            <select className="input-field" value={filter.role} onChange={e=>setFilter({...filter,role:e.target.value})}>
              <option value="">All</option><option value="student">Students</option><option value="admin">Admins</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={filter.banned} onChange={e=>setFilter({...filter,banned:e.target.value})}>
              <option value="">All</option><option value="true">Banned</option><option value="false">Active</option>
            </select>
          </div>
          <div>
            <label className="label">Gym</label>
            <select className="input-field" value={filter.gymId} onChange={e=>setFilter({...filter,gymId:e.target.value})}>
              <option value="">All Gyms</option>
              {gyms?.map(g=><option key={g.id} value={g.id}>{g.campus}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Search</label>
            <input className="input-field" placeholder="Name / email / roll no" value={filter.search} onChange={e=>setFilter({...filter,search:e.target.value})} />
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? <div className="card animate-pulse h-40" /> : (
        <div className="card overflow-x-auto">
          <p className="section-title mb-3">{users?.length || 0} users</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-surface-border">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Roll / Email</th>
                <th className="pb-2 pr-4 font-medium">Gym</th>
                <th className="pb-2 pr-4 font-medium">Streak</th>
                <th className="pb-2 pr-4 font-medium">Missed</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.uid} className="border-b border-surface-border last:border-0 hover:bg-surface/50">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{u.name}</p>
                      {u.isBanned && <span className="badge-expired">Banned</span>}
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">
                    <p>{u.rollNo || '—'}</p>
                    <p className="truncate max-w-[140px]">{u.email}</p>
                  </td>
                  <td className="py-2 pr-4 text-xs text-brand">{gyms?.find(g=>g.id===u.gymId)?.campus || '—'}</td>
                  <td className="py-2 pr-4 text-brand font-bold">🔥{u.streak||0}</td>
                  <td className={`py-2 pr-4 font-bold ${(u.missedCount||0)>=2?'text-red-400':'text-gray-300'}`}>{u.missedCount||0}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetail(u.uid)} className="btn-ghost p-1.5 text-gray-400 hover:text-brand" title="View details"><Eye size={14} /></button>
                      {u.isBanned
                        ? <button onClick={() => unbanMut.mutate(u.uid)} className="btn-ghost p-1.5 text-green-400" title="Unban"><UserCheck size={14} /></button>
                        : <button onClick={() => { const r = window.prompt('Ban reason (optional):'); banMut.mutate({ uid: u.uid, reason: r||'' }); }} className="btn-ghost p-1.5 text-red-400" title="Ban"><Ban size={14} /></button>
                      }
                      <button onClick={() => { if(window.confirm('Reset streak and missed count?')) resetMut.mutate({ uid: u.uid, resetStreak: true, resetMissed: true }); }} className="btn-ghost p-1.5 text-yellow-400" title="Reset stats"><RotateCcw size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No users found</p>}
        </div>
      )}

      {/* User Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="User Details">
        {userDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Name', userDetail.name], ['Roll No', userDetail.rollNo || '—'],
                ['Email', userDetail.email], ['Phone', userDetail.phone || '—'],
                ['Hostel', userDetail.hostel || '—'], ['Room', userDetail.room || '—'],
                ['Gender', userDetail.gender || '—'], ['Streak', `🔥 ${userDetail.streak || 0}`],
                ['Missed', userDetail.missedCount || 0], ['Banned', userDetail.isBanned ? 'Yes' : 'No'],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface rounded-lg p-2.5">
                  <p className="text-xs text-gray-500">{k}</p>
                  <p className="font-medium text-white">{v}</p>
                </div>
              ))}
            </div>
            {userDetail.recentBookings?.length > 0 && (
              <div>
                <p className="section-title">Recent Bookings</p>
                <div className="space-y-1.5">
                  {userDetail.recentBookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between text-xs bg-surface rounded-lg px-3 py-2">
                      <span className="text-gray-300">{b.date} · {b.slot}</span>
                      <span className={b.status==='attended'?'text-green-400':b.status==='missed'?'text-red-400':'text-yellow-400'}>{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB: SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const { data: gyms } = useQuery({ queryKey: ['gyms'], queryFn: getGyms });
  const [filter, setFilter] = useState({ status: 'active', gymId: '' });

  const { data: subs, isLoading } = useQuery({
    queryKey: ['sa-subs', filter],
    queryFn: () => saGetSubscriptions(filter),
  });

  const activeCount  = subs?.filter(s=>s.status==='active').length  || 0;
  const expiredCount = subs?.filter(s=>s.status==='expired').length || 0;

  return (
    <div className="space-y-5">
      <h2 className="page-header">Subscription Oversight</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center"><p className="font-display text-3xl font-bold text-green-400">{activeCount}</p><p className="text-xs text-gray-400 mt-1">Active</p></div>
        <div className="card text-center"><p className="font-display text-3xl font-bold text-red-400">{expiredCount}</p><p className="text-xs text-gray-400 mt-1">Expired</p></div>
        <div className="card text-center"><p className="font-display text-3xl font-bold text-brand">₹{(activeCount*500).toLocaleString()}</p><p className="text-xs text-gray-400 mt-1">Est. Revenue</p></div>
      </div>

      <div className="flex gap-3">
        <select className="input-field flex-1" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}>
          <option value="">All</option><option value="active">Active</option><option value="expired">Expired</option>
        </select>
        <select className="input-field flex-1" value={filter.gymId} onChange={e=>setFilter({...filter,gymId:e.target.value})}>
          <option value="">All Gyms</option>
          {gyms?.map(g=><option key={g.id} value={g.id}>{g.campus}</option>)}
        </select>
      </div>

      {isLoading ? <div className="card animate-pulse h-40" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-surface-border">
                <th className="pb-2 pr-4 font-medium">User ID</th>
                <th className="pb-2 pr-4 font-medium">Gym</th>
                <th className="pb-2 pr-4 font-medium">Start</th>
                <th className="pb-2 pr-4 font-medium">End</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {subs?.map((s) => {
                const daysLeft = Math.max(0, Math.ceil((new Date(s.endDate)-new Date())/86400000));
                return (
                  <tr key={s.id} className="border-b border-surface-border last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-gray-400">{s.userId?.slice(0,12)}…</td>
                    <td className="py-2 pr-4 text-xs text-brand">{gyms?.find(g=>g.id===s.gymId)?.campus||s.gymId}</td>
                    <td className="py-2 pr-4 text-xs text-gray-300">{s.startDate}</td>
                    <td className={`py-2 pr-4 text-xs ${s.status==='active'&&daysLeft<=7?'text-yellow-400':'text-gray-300'}`}>{s.endDate}{s.status==='active'&&daysLeft<=7&&<span className="ml-1">({daysLeft}d)</span>}</td>
                    <td className="py-2"><span className={s.status==='active'?'badge-active':'badge-expired'}>{s.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!subs||subs.length===0) && <p className="text-gray-500 text-sm text-center py-6">No subscriptions found</p>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB: COMPLAINTS
// ─────────────────────────────────────────────────────────────────
function ComplaintsTab() {
  const qc = useQueryClient();
  const { data: gyms } = useQuery({ queryKey: ['gyms'], queryFn: getGyms });
  const [filter, setFilter] = useState({ status: 'open', gymId: '' });
  const [reply, setReply] = useState({});

  const { data: complaints } = useQuery({ queryKey: ['sa-complaints', filter], queryFn: () => saGetComplaints(filter) });

  const resolveMut = useMutation({
    mutationFn: ({ id, data }) => saResolveComplaint(id, data),
    onSuccess: () => { toast.success('Complaint resolved'); qc.invalidateQueries(['sa-complaints']); },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <h2 className="page-header">All Complaints</h2>
      <div className="flex gap-3">
        {['open','resolved','all'].map(s=>(
          <button key={s} onClick={()=>setFilter({...filter,status:s==='all'?'':s})}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${filter.status===(s==='all'?'':s)?'bg-brand text-white':'bg-surface-raised border border-surface-border text-gray-400'}`}>
            {s}
          </button>
        ))}
        <select className="input-field flex-1 ml-auto" value={filter.gymId} onChange={e=>setFilter({...filter,gymId:e.target.value})}>
          <option value="">All Gyms</option>
          {gyms?.map(g=><option key={g.id} value={g.id}>{g.campus}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {complaints?.length === 0 && <div className="card text-center py-10 text-gray-400">No complaints found</div>}
        {complaints?.map((c) => (
          <div key={c.id} className={`card ${c.status==='open'?'border-yellow-500/20':''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2"><span className="text-xs font-semibold text-brand">{c.category}</span><span className="text-xs text-gray-500">{gyms?.find(g=>g.id===c.gymId)?.name||c.gymId}</span></div>
                <p className="text-sm mt-0.5">{c.issue}</p>
                <p className="text-xs text-gray-500 mt-1">{c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy, h:mm a') : '—'}</p>
              </div>
              <span className={c.status==='resolved'?'badge-resolved':'badge-open shrink-0'}>{c.status}</span>
            </div>
            {c.adminReply && <div className="text-xs bg-surface rounded-lg p-2 text-gray-300 mb-2"><span className="text-gray-500">Reply: </span>{c.adminReply}</div>}
            {c.status === 'open' && (
              <div className="space-y-2 mt-2">
                <textarea rows={2} className="input-field text-sm resize-none" placeholder="Reply (optional)…" value={reply[c.id]||''} onChange={e=>setReply({...reply,[c.id]:e.target.value})} />
                <button onClick={()=>resolveMut.mutate({id:c.id,data:{status:'resolved',adminReply:reply[c.id]||'Resolved by Super Admin'}})} disabled={resolveMut.isPending} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                  <CheckCircle2 size={15}/> Resolve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB: CONFIG
// ─────────────────────────────────────────────────────────────────
function ConfigTab() {
  const qc = useQueryClient();
  const { data: cfg } = useQuery({ queryKey: ['sa-config'], queryFn: saGetConfig });
  const [local, setLocal] = useState(null);

  const saveMut = useMutation({
    mutationFn: saUpdateConfig,
    onSuccess: () => { toast.success('Config saved!'); qc.invalidateQueries(['sa-config']); },
    onError: e => toast.error(e.message),
  });

  const vals = local || cfg || {};

  const cfgFields = [
    { key: 'defaultCapacityPerSlot', label: 'Default Capacity Per Slot', type: 'number', hint: 'Max students per time slot per gym' },
    { key: 'maxMissedBeforeBan',     label: 'Missed Slots Before Ban',   type: 'number', hint: 'Student gets banned after this many missed slots' },
    { key: 'subscriptionPriceMo',    label: 'Monthly Subscription Price (₹)', type: 'number', hint: 'Used for revenue estimation' },
    { key: 'bookingCutoffMinutes',   label: 'Booking Cutoff (minutes before slot)', type: 'number', hint: 'How many minutes before slot start to close booking' },
    { key: 'allowSelfBooking',       label: 'Allow Self Booking',        type: 'boolean', hint: 'Students can book their own slots' },
  ];

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center justify-between">
        <h2 className="page-header">System Config</h2>
        <button onClick={() => saveMut.mutate(local || cfg)} disabled={saveMut.isPending || !local} className="btn-primary flex items-center gap-1.5 py-2 px-4 text-sm disabled:opacity-40">
          <Save size={15} />{saveMut.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {cfgFields.map(({ key, label, type, hint }) => (
          <div key={key} className="card">
            <label className="label">{label}</label>
            <p className="text-xs text-gray-500 mb-2">{hint}</p>
            {type === 'boolean'
              ? <div className="flex items-center gap-3">
                  <button onClick={() => setLocal({ ...(local||cfg), [key]: true })} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${vals[key]===true?'bg-green-500/20 text-green-400 border border-green-500/30':'bg-surface border border-surface-border text-gray-400'}`}>Enabled</button>
                  <button onClick={() => setLocal({ ...(local||cfg), [key]: false })} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${vals[key]===false?'bg-red-500/20 text-red-400 border border-red-500/30':'bg-surface border border-surface-border text-gray-400'}`}>Disabled</button>
                </div>
              : <input type="number" className="input-field" value={vals[key] || ''} onChange={e => setLocal({ ...(local||cfg), [key]: Number(e.target.value) })} />
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────────
export default function SuperAdminPage() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const { data: gyms } = useQuery({ queryKey: ['gyms'], queryFn: getGyms });

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const ActiveTab = {
    overview:      () => <OverviewTab gyms={gyms} />,
    gyms:          () => <GymsTab />,
    admins:        () => <AdminsTab />,
    users:         () => <UsersTab />,
    subscriptions: () => <SubscriptionsTab />,
    complaints:    () => <ComplaintsTab />,
    config:        () => <ConfigTab />,
  }[tab] || (() => null);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-surface-border bg-surface-raised shrink-0">
        <div className="p-5 border-b border-surface-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-display font-bold tracking-wider uppercase text-sm">Super Admin</span>
          </div>
          <p className="text-xs text-gray-500 truncate pl-10">{profile?.name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                ${tab === id ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white hover:bg-surface'}`}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-surface-border">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white px-3 py-2 w-full">
            <LogOut size={16} />Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-surface-border px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold tracking-wider text-sm flex items-center gap-1.5">
              <Shield size={18} className="text-brand" />Super Admin
            </span>
            <button onClick={handleLogout} className="btn-ghost p-2"><LogOut size={18} className="text-gray-500" /></button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${tab===id?'bg-brand text-white':'bg-surface-raised border border-surface-border text-gray-400'}`}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <ActiveTab />
        </main>
      </div>
    </div>
  );
}
