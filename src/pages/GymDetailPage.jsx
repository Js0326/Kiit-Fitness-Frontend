import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGym, getSlotAvailability } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin, Users, UserCircle2, Dumbbell, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

const SLOTS = [
  { id:'06-07', label:'6 AM' },{ id:'07-08', label:'7 AM' },{ id:'08-09', label:'8 AM' },
  { id:'16-17', label:'4 PM' },{ id:'17-18', label:'5 PM' },{ id:'18-19', label:'6 PM' },{ id:'19-20', label:'7 PM' },
];

const WORKOUT_ROUTINES = [
  {
    level: 'Beginner – Week 1–4',
    days: ['Mon OFF','Tue Push','Wed Pull','Thu Legs','Fri Full Body','Sat Cardio'],
    exercises: [
      { name:'Treadmill Warm-up', sets:'1×10 min', muscle:'Cardio' },
      { name:'Flat Bench Press', sets:'3×8–10', muscle:'Chest' },
      { name:'Lat Pulldown', sets:'3×10–12', muscle:'Back' },
      { name:'Squat (Smith/Free)', sets:'3×8–10', muscle:'Legs' },
      { name:'Dumbbell Shoulder Press', sets:'3×10', muscle:'Shoulders' },
      { name:'Dumbbell Curl', sets:'2×12', muscle:'Biceps' },
      { name:'Tricep Pushdown', sets:'2×12', muscle:'Triceps' },
      { name:'Plank', sets:'3×30 sec', muscle:'Core' },
    ],
  },
];

const CAT_COLORS = { cardio:'bg-blue-500/20 text-blue-400', strength:'bg-orange-500/20 text-orange-400', machine:'bg-purple-500/20 text-purple-400', 'free weights':'bg-yellow-500/20 text-yellow-400', flexibility:'bg-green-500/20 text-green-400', bodyweight:'bg-cyan-500/20 text-cyan-400', functional:'bg-red-500/20 text-red-400' };

export default function GymDetailPage() {
  const { gymId } = useParams();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showRoutine, setShowRoutine] = useState(false);

  const { data: gym, isLoading } = useQuery({ queryKey:['gym', gymId], queryFn:()=>getGym(gymId) });
  const { data: avail } = useQuery({
    queryKey: ['availability', gymId, today],
    queryFn: () => getSlotAvailability(gymId, today),
    refetchInterval: 10_000,
  });

  const chartData = SLOTS.map((s) => ({
    name: s.label,
    count: avail?.counts?.[s.id] || 0,
    capacity: avail?.capacity || 20,
  }));

  if (isLoading) return (
    <div className="px-4 pt-5 space-y-4 animate-fadeUp">
      {[1,2,3].map((i) => <div key={i} className="card animate-pulse h-24" />)}
    </div>
  );

  if (!gym) return <div className="px-4 pt-5 text-gray-400">Gym not found</div>;

  return (
    <div className="px-4 pt-5 pb-6 space-y-5 animate-fadeUp">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold tracking-wider uppercase">{gym.name}</h2>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
          <span className="flex items-center gap-1"><MapPin size={14}/>{gym.location}</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">{gym.description}</p>
      </div>

      {/* Live busy chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Live Busy Hours Today</p>
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />Live
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="name" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, avail?.capacity || 20]} />
            <Tooltip
              contentStyle={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, fontSize:12 }}
              formatter={(val, _, props) => [`${val} / ${props.payload.capacity}`, 'Booked']}
            />
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.count / entry.capacity > 0.8 ? '#ef4444' : entry.count / entry.capacity > 0.5 ? '#f59e0b' : '#FF6B00'} />
            ))}
            <Bar dataKey="count" radius={[4,4,0,0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.count / entry.capacity > 0.8 ? '#ef4444' : entry.count / entry.capacity > 0.5 ? '#f59e0b' : '#FF6B00'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand inline-block"/>Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block"/>Medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"/>Full</span>
        </div>
      </div>

      {/* Equipment */}
      <div className="card">
        <p className="section-title">Equipment ({gym.equipment?.length || 0} items)</p>
        <div className="space-y-2">
          {gym.equipment?.map((e) => (
            <div key={e.name} className="flex items-center justify-between py-1.5 border-b border-surface-border last:border-0">
              <div className="flex items-center gap-2">
                <Dumbbell size={14} className="text-brand" />
                <span className="text-sm">{e.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">×{e.count}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[e.category] || 'bg-surface text-gray-400'}`}>
                  {e.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trainers */}
      {gym.trainers?.length > 0 && (
        <div className="card">
          <p className="section-title">Trainers & Staff</p>
          <div className="space-y-3">
            {gym.trainers.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                  <UserCircle2 size={24} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role} • {t.specialization}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout Routines */}
      <div className="card">
        <button className="w-full flex items-center justify-between" onClick={() => setShowRoutine(!showRoutine)}>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-brand" />
            <p className="section-title mb-0">Beginner Workout Routines</p>
          </div>
          {showRoutine ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>
        {showRoutine && WORKOUT_ROUTINES.map((routine) => (
          <div key={routine.level} className="mt-4">
            <p className="text-brand font-semibold text-sm mb-3">{routine.level}</p>
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {routine.days.map((d) => (
                <div key={d} className={`text-xs text-center py-1.5 rounded-lg ${d.includes('OFF') ? 'bg-surface text-gray-600' : 'bg-brand/10 text-brand'}`}>{d}</div>
              ))}
            </div>
            <div className="space-y-2">
              {routine.exercises.map((ex) => (
                <div key={ex.name} className="flex items-center justify-between text-sm py-1.5 border-b border-surface-border last:border-0">
                  <span>{ex.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-brand font-mono text-xs">{ex.sets}</span>
                    <span className="text-xs text-gray-500">{ex.muscle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Timing info */}
      <div className="card">
        <p className="section-title">Opening Hours</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Morning</p>
            <p className="font-display font-semibold">6:00 – 9:00 AM</p>
          </div>
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Evening</p>
            <p className="font-display font-semibold">4:00 – 8:00 PM</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">Closed on Mondays</p>
      </div>
    </div>
  );
}
