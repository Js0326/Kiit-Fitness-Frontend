import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking, cancelBooking, getMyBookings, getMySubscription, getSlotAvailability, getGym } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, addDays, isMonday } from 'date-fns';
import toast from 'react-hot-toast';
import { CalendarDays, Clock, Users, CheckCircle2, XCircle } from 'lucide-react';

const MORNING_SLOTS = [
  { id:'06-07', label:'6:00 AM – 7:00 AM' },
  { id:'07-08', label:'7:00 AM – 8:00 AM' },
  { id:'08-09', label:'8:00 AM – 9:00 AM' },
];
const EVENING_SLOTS = [
  { id:'16-17', label:'4:00 PM – 5:00 PM' },
  { id:'17-18', label:'5:00 PM – 6:00 PM' },
  { id:'18-19', label:'6:00 PM – 7:00 PM' },
  { id:'19-20', label:'7:00 PM – 8:00 PM' },
];

// Get next 7 bookable dates (not Mondays)
function getBookableDates() {
  const dates = [];
  let d = new Date();
  while (dates.length < 7) {
    if (!isMonday(d)) dates.push(new Date(d));
    d = addDays(d, 1);
  }
  return dates;
}

export default function BookingPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState('');

  const { data: sub }      = useQuery({ queryKey:['mySub'], queryFn: getMySubscription });
  const { data: bookings } = useQuery({ queryKey:['myBookings'], queryFn: getMyBookings, refetchInterval: 30_000 });
  const { data: gym }      = useQuery({ queryKey:['gym', profile?.gymId], queryFn:()=>getGym(profile.gymId), enabled:!!profile?.gymId });
  const { data: avail }    = useQuery({
    queryKey: ['availability', profile?.gymId, selectedDate],
    queryFn: () => getSlotAvailability(profile.gymId, selectedDate),
    enabled: !!profile?.gymId && !!selectedDate,
    refetchInterval: 10_000,
  });

  const todayBooking = bookings?.find((b) => b.date === selectedDate && b.status === 'booked');

  const bookMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success('Slot booked! 🎉');
      qc.invalidateQueries(['myBookings']);
      qc.invalidateQueries(['availability']);
      setSelectedSlot('');
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      toast.success('Booking cancelled');
      qc.invalidateQueries(['myBookings']);
      qc.invalidateQueries(['availability']);
    },
    onError: (err) => toast.error(err.message),
  });

  const dates = getBookableDates();
  const capacity = avail?.capacity || 20;

  const slotStatus = (slotId) => {
    const count = avail?.counts?.[slotId] || 0;
    if (count >= capacity) return 'full';
    if (count / capacity > 0.75) return 'busy';
    return 'available';
  };

  const renderSlot = (slot) => {
    const status = slotStatus(slot.id);
    const count  = avail?.counts?.[slot.id] || 0;
    const isSelected = selectedSlot === slot.id;
    const isFull = status === 'full';

    return (
      <button key={slot.id} disabled={isFull || !!todayBooking}
        onClick={() => setSelectedSlot(isSelected ? '' : slot.id)}
        className={`rounded-xl border-2 p-3 text-left transition-all duration-150 ${
          isFull ? 'border-surface-border opacity-40 cursor-not-allowed'
          : isSelected ? 'border-brand bg-brand/10'
          : 'border-surface-border hover:border-brand/50'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-semibold ${isSelected ? 'text-brand' : 'text-white'}`}>{slot.label}</span>
          <span className={`text-xs font-bold ${status === 'full' ? 'text-red-400' : status === 'busy' ? 'text-yellow-400' : 'text-green-400'}`}>
            {status === 'full' ? 'Full' : status === 'busy' ? 'Busy' : 'Open'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users size={11} /> {count}/{capacity} booked
        </div>
        <div className="w-full bg-surface rounded-full h-1 mt-2">
          <div className={`h-1 rounded-full transition-all ${status === 'full' ? 'bg-red-500' : status === 'busy' ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${(count/capacity)*100}%` }} />
        </div>
      </button>
    );
  };

  if (!sub || sub.status !== 'active') {
    return (
      <div className="px-4 pt-5 animate-fadeUp">
        <h2 className="page-header mb-4">Book a Slot</h2>
        <div className="card text-center py-10">
          <CalendarDays size={36} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">You need an active subscription to book slots.</p>
          <p className="text-gray-500 text-sm mt-1">Visit your gym desk to register and pay.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-5 animate-fadeUp">
      <div>
        <h2 className="page-header">Book a Slot</h2>
        {gym && <p className="text-gray-400 text-sm mt-0.5">{gym.name}</p>}
      </div>

      {/* Date selector */}
      <div>
        <p className="section-title">Select Date</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dates.map((d) => {
            const ds = format(d, 'yyyy-MM-dd');
            const isSelected = ds === selectedDate;
            const hasBooking = bookings?.some((b) => b.date === ds && b.status === 'booked');
            return (
              <button key={ds} onClick={() => { setSelectedDate(ds); setSelectedSlot(''); }}
                className={`shrink-0 w-14 rounded-xl py-2 text-center border transition-all ${
                  isSelected ? 'border-brand bg-brand/10' : 'border-surface-border hover:border-brand/40'}`}>
                <p className="text-xs text-gray-400">{format(d, 'EEE')}</p>
                <p className={`font-display font-bold ${isSelected ? 'text-brand' : 'text-white'}`}>{format(d, 'd')}</p>
                {hasBooking && <div className="w-1.5 h-1.5 bg-brand rounded-full mx-auto mt-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's booking */}
      {todayBooking && (
        <div className="card border-brand/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-400" />
              <div>
                <p className="text-sm font-semibold">Already booked</p>
                <p className="text-xs text-gray-400">{MORNING_SLOTS.concat(EVENING_SLOTS).find((s) => s.id === todayBooking.slot)?.label}</p>
              </div>
            </div>
            <button onClick={() => cancelMutation.mutate(todayBooking.id)} disabled={cancelMutation.isPending}
              className="text-red-400 hover:text-red-300 transition-colors">
              <XCircle size={20} />
            </button>
          </div>
        </div>
      )}

      {!todayBooking && (
        <>
          {/* Morning slots */}
          <div>
            <p className="section-title">🌅 Morning Slots</p>
            <div className="grid grid-cols-1 gap-2">
              {MORNING_SLOTS.map(renderSlot)}
            </div>
          </div>

          {/* Evening slots */}
          <div>
            <p className="section-title">🌆 Evening Slots</p>
            <div className="grid grid-cols-1 gap-2">
              {EVENING_SLOTS.map(renderSlot)}
            </div>
          </div>

          {/* Book button */}
          {selectedSlot && (
            <button onClick={() => bookMutation.mutate({ gymId: profile.gymId, date: selectedDate, slot: selectedSlot })}
              disabled={bookMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 sticky bottom-20">
              {bookMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Booking…</>
              ) : (
                <><Clock size={18} />Confirm Booking</>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
