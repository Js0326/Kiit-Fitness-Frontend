import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGym, updateGym } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Dumbbell, UserCircle2, Settings, Navigation2, Image as ImageIcon } from 'lucide-react';
import { GymImageManager } from '../../components/ImageUpload';

const CAT_OPTIONS = ['cardio','strength','machine','free weights','bodyweight','flexibility','functional'];

export default function AdminGymEdit() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const gymId = profile?.gymId;

  const { data: gym, isLoading } = useQuery({ queryKey:['gym',gymId], queryFn:()=>getGym(gymId), enabled:!!gymId });

  const [description, setDesc]    = useState('');
  const [capacity,    setCap]     = useState(20);
  const [equipment,   setEquip]   = useState([]);
  const [trainers,    setTrainers]= useState([]);
  const [mapLink,     setMapLink] = useState('');
  const [images,      setImages]  = useState([]);

  useEffect(() => {
    if (gym) {
      setDesc(gym.description || '');
      setCap(gym.capacityPerSlot || 20);
      setEquip(gym.equipment || []);
      setTrainers(gym.trainers || []);
      setMapLink(gym.mapLink || '');
      setImages(gym.images || []);
    }
  }, [gym]);

  const saveMut = useMutation({
    mutationFn: (data) => updateGym(gymId, data),
    onSuccess: () => { toast.success('Gym updated!'); qc.invalidateQueries(['gym', gymId]); },
    onError:   (e) => toast.error(e.message),
  });

  const addEquip      = () => setEquip([...equipment, { name:'', count:1, category:'strength' }]);
  const removeEquip   = (i) => setEquip(equipment.filter((_,j) => j!==i));
  const updateEquip   = (i, f, v) => setEquip(equipment.map((e,j) => j===i ? {...e,[f]:v} : e));
  const addTrainer    = () => setTrainers([...trainers, { name:'', role:'Trainer', specialization:'', phone:'' }]);
  const removeTrainer = (i) => setTrainers(trainers.filter((_,j) => j!==i));
  const updateTrainer = (i, f, v) => setTrainers(trainers.map((t,j) => j===i ? {...t,[f]:v} : t));

  const save = () => saveMut.mutate({ description, capacityPerSlot: Number(capacity), equipment, trainers, mapLink });

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i=><div key={i} className="card h-20"/>)}</div>;

  return (
    <div className="space-y-6 animate-fadeUp max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="page-header">Manage Gym</h2>
        <button onClick={save} disabled={saveMut.isPending}
          className="btn-primary flex items-center gap-1.5 py-2 px-4 text-sm">
          {saveMut.isPending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save size={16}/>}
          Save
        </button>
      </div>

      {/* General */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={16} className="text-brand"/>
          <p className="section-title mb-0">General Info</p>
        </div>
        <div>
          <label className="label">Gym Name</label>
          <input className="input-field bg-surface opacity-60 cursor-not-allowed" value={gym?.name||''} readOnly />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input-field resize-none" value={description} onChange={e=>setDesc(e.target.value)} />
        </div>
        <div>
          <label className="label">Max Capacity Per Slot</label>
          <input type="number" min={1} max={100} className="input-field" value={capacity} onChange={e=>setCap(e.target.value)} />
        </div>
      </div>

      {/* Map link */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Navigation2 size={16} className="text-brand"/>
          <p className="section-title mb-0">Google Maps Link</p>
        </div>
        <p className="text-xs text-gray-500">Paste the Google Maps link so students can navigate to the gym.</p>
        <input className="input-field" placeholder="https://maps.google.com/?q=..." value={mapLink} onChange={e=>setMapLink(e.target.value)} />
        {mapLink && (
          <a href={mapLink} target="_blank" rel="noopener noreferrer"
            className="text-brand text-sm flex items-center gap-1 hover:underline">
            <Navigation2 size={14}/> Test link
          </a>
        )}
      </div>

      {/* Gym Photos */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={16} className="text-brand"/>
          <p className="section-title mb-0">Gym Photos ({images.length})</p>
        </div>
        <p className="text-xs text-gray-500">Add photos of the gym, equipment, and facilities. Max 5MB per image.</p>
        <GymImageManager gymId={gymId} images={images} onImagesChange={setImages} />
      </div>

      {/* Equipment */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-brand"/>
            <p className="section-title mb-0">Equipment ({equipment.length})</p>
          </div>
          <button onClick={addEquip} className="btn-ghost text-xs flex items-center gap-1 px-3 py-1.5">
            <Plus size={14}/> Add
          </button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {equipment.map((e,i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input className="input-field col-span-5 text-sm py-2" placeholder="Equipment name"
                value={e.name} onChange={ev=>updateEquip(i,'name',ev.target.value)} />
              <select className="input-field col-span-4 text-sm py-2" value={e.category} onChange={ev=>updateEquip(i,'category',ev.target.value)}>
                {CAT_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min={1} className="input-field col-span-2 text-sm py-2 text-center" value={e.count} onChange={ev=>updateEquip(i,'count',ev.target.value)} />
              <button onClick={()=>removeEquip(i)} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center"><Trash2 size={15}/></button>
            </div>
          ))}
          {equipment.length===0 && <p className="text-gray-500 text-sm text-center py-3">No equipment added</p>}
        </div>
      </div>

      {/* Trainers */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircle2 size={16} className="text-brand"/>
            <p className="section-title mb-0">Trainers ({trainers.length})</p>
          </div>
          <button onClick={addTrainer} className="btn-ghost text-xs flex items-center gap-1 px-3 py-1.5">
            <Plus size={14}/> Add
          </button>
        </div>
        <div className="space-y-3">
          {trainers.map((t,i) => (
            <div key={i} className="bg-surface rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field text-sm py-2" placeholder="Full name"         value={t.name}           onChange={e=>updateTrainer(i,'name',e.target.value)} />
                <input className="input-field text-sm py-2" placeholder="Role"              value={t.role}           onChange={e=>updateTrainer(i,'role',e.target.value)} />
                <input className="input-field text-sm py-2" placeholder="Specialization"   value={t.specialization} onChange={e=>updateTrainer(i,'specialization',e.target.value)} />
                <input className="input-field text-sm py-2" placeholder="Phone"             value={t.phone}          onChange={e=>updateTrainer(i,'phone',e.target.value)} />
              </div>
              <button onClick={()=>removeTrainer(i)} className="text-red-400 text-xs flex items-center gap-1"><Trash2 size={12}/> Remove</button>
            </div>
          ))}
          {trainers.length===0 && <p className="text-gray-500 text-sm text-center py-3">No trainers added</p>}
        </div>
      </div>

      <button onClick={save} disabled={saveMut.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
        {saveMut.isPending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</> : <><Save size={18}/>Save All Changes</>}
      </button>
    </div>
  );
}
