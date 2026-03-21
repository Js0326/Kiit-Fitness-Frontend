import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getGyms } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Users, ChevronRight, Dumbbell } from 'lucide-react';

const GENDER_LABELS = { male: '♂ Boys', female: '♀ Girls', both: '⚧ All' };
const GENDER_COLORS = { male: 'text-blue-400', female: 'text-pink-400', both: 'text-purple-400' };
const CAMPUS_COLORS = ['bg-blue-500/10','bg-orange-500/10','bg-green-500/10','bg-pink-500/10','bg-purple-500/10','bg-cyan-500/10'];

export default function GymsPage() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState('all');

  const { data: gyms, isLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => getGyms(),
    staleTime: 60_000,
  });

  const filtered = gyms?.filter((g) => {
    if (filter === 'my') return g.id === profile?.gymId;
    if (filter === 'male') return g.gender === 'male' || g.gender === 'both';
    if (filter === 'female') return g.gender === 'female' || g.gender === 'both';
    return true;
  });

  return (
    <div className="px-4 pt-5 pb-4 animate-fadeUp">
      <h2 className="page-header mb-5">Fitness Centers</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { val: 'all', label: 'All Campuses' },
          { val: 'male', label: '♂ Boys' },
          { val: 'female', label: '♀ Girls' },
          { val: 'my', label: 'My Gym' },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === val ? 'bg-brand text-white' : 'bg-surface-raised border border-surface-border text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 w-48 bg-surface-border rounded mb-3" />
              <div className="h-4 w-32 bg-surface-border rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((gym, idx) => (
            <Link key={gym.id} to={`/gyms/${gym.id}`}
              className="card hover:border-brand/40 transition-all block group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${CAMPUS_COLORS[idx % CAMPUS_COLORS.length]}`}>
                      <Dumbbell size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold tracking-wide text-white group-hover:text-brand transition-colors">
                        {gym.name}
                      </h3>
                      {gym.id === profile?.gymId && (
                        <span className="text-xs text-brand font-semibold">✓ My Gym</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {gym.campus}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> Cap: {gym.capacityPerSlot}/slot
                    </span>
                    <span className={`font-semibold ${GENDER_COLORS[gym.gender]}`}>
                      {GENDER_LABELS[gym.gender]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-1">{gym.description}</p>
                </div>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-brand transition-colors shrink-0 mt-1" />
              </div>
              {/* Equipment preview */}
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {gym.equipment?.slice(0, 4).map((e) => (
                  <span key={e.name} className="px-2 py-0.5 bg-surface rounded-full text-xs text-gray-400">
                    {e.name}
                  </span>
                ))}
                {gym.equipment?.length > 4 && (
                  <span className="px-2 py-0.5 bg-surface rounded-full text-xs text-gray-500">
                    +{gym.equipment.length - 4} more
                  </span>
                )}
              </div>
            </Link>
          ))}
          {filtered?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Dumbbell size={32} className="mx-auto mb-3 opacity-30" />
              <p>No gyms found for this filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
