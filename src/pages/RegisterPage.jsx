import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerStep1, verifyOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft, Dumbbell, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const HOSTELS = [
  'NH-1','NH-2','NH-3','NH-4','NH-5','NH-6','NH-7','NH-8','NH-9',
  'NH-10','NH-11','NH-12','NH-13','NH-14','NH-15','NH-16',
];

const steps = ['Details', 'Verify', 'Done'];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const [form, setForm] = useState({
    name: '', rollNo: '', email: '', phone: '', gender: '', hostel: '', room: '',
  });
  const [otp, setOtp]         = useState('');
  const [password, setPass]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submitStep1 = async (e) => {
    e.preventDefault();
    const { name, rollNo, email, phone, gender, hostel, room } = form;
    if (!name || !rollNo || !email || !phone || !gender || !hostel || !room)
      return toast.error('All fields are required');
    setLoading(true);
    try {
      await registerStep1(form);
      setSavedEmail(email);
      toast.success('OTP sent to your KIIT email!');
      setStep(1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitStep2 = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Enter the OTP');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await verifyOTP({ rollNo: form.rollNo, otp, password });
      toast.success('Account created!');
      // Auto-login
      await login(savedEmail, password);
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-brand/30">
            <Dumbbell size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wider uppercase">Create Account</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand text-white' : 'bg-surface-border text-gray-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-gray-600'}`}>{s}</span>
              {i < steps.length - 1 && <div className="w-6 h-px bg-surface-border" />}
            </div>
          ))}
        </div>

        {/* Step 0: Personal Details */}
        {step === 0 && (
          <form onSubmit={submitStep1} className="space-y-4 animate-fadeUp">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input name="name" className="input-field" placeholder="Rahul Kumar" value={form.name} onChange={handle} />
              </div>
              <div>
                <label className="label">Roll Number</label>
                <input name="rollNo" className="input-field" placeholder="22051234" value={form.rollNo} onChange={handle} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" className="input-field" placeholder="98XXXXXXXX" value={form.phone} onChange={handle} />
              </div>
              <div className="col-span-2">
                <label className="label">KIIT Email</label>
                <input name="email" type="email" className="input-field" placeholder="you@stu.kiit.ac.in" value={form.email} onChange={handle} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select name="gender" className="input-field" value={form.gender} onChange={handle}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="label">Hostel</label>
                <select name="hostel" className="input-field" value={form.hostel} onChange={handle}>
                  <option value="">Select</option>
                  {HOSTELS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Room Number</label>
                <input name="room" className="input-field" placeholder="205" value={form.room} onChange={handle} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending OTP…
              </span> : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 1: OTP + Password */}
        {step === 1 && (
          <form onSubmit={submitStep2} className="space-y-4 animate-fadeUp">
            <div className="card text-center mb-2">
              <p className="text-sm text-gray-400">OTP sent to</p>
              <p className="text-brand font-medium">{savedEmail}</p>
            </div>
            <div>
              <label className="label">OTP (6 digits)</label>
              <input type="text" maxLength={6} className="input-field text-center text-2xl tracking-[0.5em] font-display"
                placeholder="——————" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div>
              <label className="label">Create Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input-field pr-11" placeholder="Min 8 characters"
                  value={password} onChange={(e) => setPass(e.target.value)} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input-field" placeholder="Repeat password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating…
              </span> : 'Create Account'}
            </button>
            <button type="button" onClick={() => setStep(0)} className="btn-ghost w-full flex items-center justify-center gap-1">
              <ChevronLeft size={16} /> Back
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:text-brand-light font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
