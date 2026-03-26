import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Reusable image uploader using Cloudinary via backend
 * @param {string} endpoint  — backend route e.g. /gyms/campus1-gym/images
 * @param {function} onUploaded  — callback({ url, publicId })
 * @param {string} label
 * @param {boolean} multiple — allow multiple uploads
 */
export function ImageUploader({ endpoint, onUploaded, label = 'Upload Image', accept = 'image/*' }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB');

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const fd = new FormData();
      fd.append('image', file);

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      onUploaded(data.image || data);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => upload(e.target.files[0])} />
      <button type="button" onClick={() => inputRef.current.click()}
        disabled={loading}
        className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
        {loading
          ? <><Loader2 size={16} className="animate-spin" />Uploading…</>
          : <><Upload size={16} />{label}</>
        }
      </button>
    </div>
  );
}

/**
 * Gym photo gallery with upload + delete
 */
export function GymImageManager({ gymId, images = [], onImagesChange, readOnly = false }) {
  const [deleting, setDeleting] = useState(null);

  const handleUploaded = (imageData) => {
    onImagesChange([...images, imageData]);
  };

  const handleDelete = async (publicId) => {
    setDeleting(publicId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/gyms/${gymId}/images/${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      onImagesChange(images.filter(img => img.publicId !== publicId));
      toast.success('Image deleted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <ImageUploader
          endpoint={`/gyms/${gymId}/images`}
          onUploaded={handleUploaded}
          label="Add Gym Photo"
        />
      )}
      {images.length === 0 ? (
        <div className="flex items-center justify-center h-24 border-2 border-dashed border-surface-border rounded-xl">
          <div className="text-center text-gray-600">
            <ImageIcon size={24} className="mx-auto mb-1" />
            <p className="text-xs">No photos yet</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <div key={img.publicId || i} className="relative group rounded-xl overflow-hidden aspect-video bg-surface-border">
              <img src={img.url} alt={img.caption || `Gym photo ${i+1}`}
                className="w-full h-full object-cover" loading="lazy" />
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-white px-2 py-1 truncate">
                  {img.caption}
                </div>
              )}
              {!readOnly && (
                <button onClick={() => handleDelete(img.publicId)}
                  disabled={deleting === img.publicId}
                  className="absolute top-1 right-1 w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {deleting === img.publicId
                    ? <Loader2 size={13} className="animate-spin text-white" />
                    : <X size={13} className="text-white" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Single image upload for complaints — returns URL to parent
 */
export function ComplaintImageUploader({ onUploaded, imageUrl, onRemove }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB');
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_URL}/upload/complaint-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onUploaded(data);
      toast.success('Photo attached!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {imageUrl ? (
        <div className="relative inline-block">
          <img src={imageUrl} alt="Complaint photo" className="w-full max-h-40 object-cover rounded-xl" />
          <button onClick={onRemove} className="absolute top-1 right-1 w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
            <X size={13} className="text-white" />
          </button>
        </div>
      ) : (
        <div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => upload(e.target.files[0])} />
          <button type="button" onClick={() => inputRef.current.click()} disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
            {loading
              ? <><Loader2 size={15} className="animate-spin" />Uploading…</>
              : <><ImageIcon size={15} />Attach Photo (optional)</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
