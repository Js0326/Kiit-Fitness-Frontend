import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createComplaint, getMyComplaints, uploadComplaintImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, X, Image as ImageIcon } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';

const CATEGORIES = ['Equipment Issue','Cleanliness','Staff Behaviour','Overcrowding','Facility Damage','Other'];

export default function ComplaintsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ issue:'', category:'' });
  const [attachedImages, setAttachedImages] = useState([]);

  const { data: complaints } = useQuery({ queryKey:['myComplaints'], queryFn: getMyComplaints });

  const submit = useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      toast.success('Complaint submitted');
      qc.invalidateQueries(['myComplaints']);
      setShowForm(false);
      setForm({ issue:'', category:'' });
      setAttachedImages([]);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.issue) return toast.error('Describe your issue');
    submit.mutate({
      gymId: profile?.gymId,
      ...form,
      images: attachedImages.map(i => i.url),
    });
  };

  if (!profile?.gymId) return (
    <div className="px-4 pt-5 animate-fadeUp">
      <h2 className="page-header mb-4">Grievance</h2>
      <div className="card text-center py-10">
        <MessageSquare size={36} className="mx-auto text-gray-600 mb-3"/>
        <p className="text-gray-400">Register at a gym to submit complaints</p>
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-5 pb-4 space-y-4 animate-fadeUp">
      <div className="flex items-center justify-between">
        <h2 className="page-header">Grievance</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-primary py-2 px-4 flex items-center gap-1.5 text-sm">
          {showForm ? <X size={16}/> : <Plus size={16}/>}{showForm ? 'Cancel' : 'New'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card border-brand/30 space-y-3 animate-fadeUp">
          <p className="font-semibold text-sm text-brand">Submit Complaint</p>
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              <option value="">Select category</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Describe the Issue</label>
            <textarea rows={4} className="input-field resize-none" placeholder="Explain what happened..."
              value={form.issue} onChange={e=>setForm({...form,issue:e.target.value})} />
          </div>

          {/* Photo attachment */}
          <ImageUploader
            label="Attach Photos (optional)"
            uploadFn={(fd) => uploadComplaintImage(fd).then(r => r)}
            onUploaded={(imgs) => setAttachedImages(prev => [...prev, ...imgs])}
            onRemove={(img) => setAttachedImages(prev => prev.filter(i => i.url !== img.url))}
            existingImages={attachedImages}
            maxImages={3}
            single={false}
          />

          <button type="submit" disabled={submit.isPending} className="btn-primary w-full">
            {submit.isPending ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </form>
      )}

      {complaints?.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={36} className="mx-auto text-gray-600 mb-3"/>
          <p className="text-gray-400">No complaints filed yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints?.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  {c.category && <span className="text-xs font-semibold text-brand">{c.category}</span>}
                  <p className="text-sm mt-0.5">{c.issue}</p>
                </div>
                <span className={c.status==='resolved'?'badge-resolved':'badge-open shrink-0'}>{c.status}</span>
              </div>

              {/* Attached images */}
              {c.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {c.images.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg overflow-hidden aspect-video block">
                      <img src={url} alt="" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}

              {c.adminReply && (
                <div className="mt-2 pt-2 border-t border-surface-border">
                  <p className="text-xs text-gray-500">Admin Response:</p>
                  <p className="text-sm text-gray-300 mt-0.5">{c.adminReply}</p>
                </div>
              )}
              {c.imageUrl && (
                <div className="mt-2">
                  <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={c.imageUrl} alt="Complaint photo" className="w-full max-h-40 object-cover rounded-xl border border-surface-border" />
                  </a>
                </div>
              )}
              <p className="text-xs text-gray-600 mt-2">{format(new Date(c.createdAt), 'dd MMM yyyy, h:mm a')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
