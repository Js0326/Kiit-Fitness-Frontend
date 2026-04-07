import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { registerStep1, verifyOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft, Dumbbell, Eye, EyeOff, Copy, CheckCircle2, Mail, Hash } from 'lucide-react';

// Boys hostels: KP-1 to KP-18 | Girls hostels: QC-1 to QC-16
const HOSTELS_BOYS  = Array.from({length:18}, (_,i) => `KP-${i+1}`);
const HOSTELS_GIRLS = Array.from({length:16}, (_,i) => `QC-${i+1}`);
const HOSTELS = [...HOSTELS_BOYS, ...HOSTELS_GIRLS];
const steps = ['Details', 'Verify', 'Done'];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [step, setStep]           = useState(0);
  const [loading, setLoading]     = useState(false);
  const [show, setShow]           = useState(false);
  const [copied, setCopied]       = useState(false);
  const [method, setMethod]       = useState('otp');

  const [form, setForm] = useState({
    name:'', rollNo:'', email:'', phone:'', gender:'', hostel:'', room:'',
  });
  const [otp, setOtp]           = useState('');
  const [shownOtp, setShownOtp] = useState('');
  const [password, setPass]     = useState('');
  const [confirm, setConfirm]   = useState('');
  const [savedEmail, setSaved]  = useState('');
  const [pendingUid, setPendingUid] = useState('');
  const [emailSent, setEmailSent]   = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submitStep1 = async (e) => {
    e.preventDefault();
    const { name, rollNo, email, phone, gender, hostel, room } = form;
    if (!name || !rollNo || !email || !phone || !gender || !hostel || !room)
      return toast.error('All fields are required');
    setLoading(true);
    try {
      const data = await registerStep1({ ...form, verificationMethod: method });
      setSaved(email);

      if (method === 'link') {
        // Backend created user with tempPassword — sign in and trigger Firebase email
        setPendingUid(data.uid);
        try {
          const cred = await signInWithEmailAndPassword(auth, email, data.tempPassword);
          await sendEmailVerification(cred.user, {
            url: `${window.location.origin}/login`,
            handleCodeInApp: false,
          });
          await signOut(auth); // sign out immediately — user isn't registered yet
          setEmailSent(true);
          toast.success('Verification email sent by Firebase! Check your inbox.');
        } catch (firebaseErr) {
          console.error('sendEmailVerification error:', firebaseErr.message);
          toast.error('Could not send verification email: ' + firebaseErr.message);
        }
      } else {
        // OTP method
        if (data.otp) { setShownOtp(data.otp); setOtp(data.otp); }
        toast.success('OTP ready!');
      }
      setStep(1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitStep2 = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');

    if (method === 'link') {
      // User has clicked the Firebase verification link — now set real password
      // The backend completeLinkVerification endpoint handles this
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: pendingUid, password }),
        });
        const data = await res.json();
        if (!res.ok) return toast.error(data.error || 'Failed to complete registration');
        toast.success('Account created! Logging you in…');
        await login(savedEmail, password);
        navigate('/');
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // OTP method
    if (!otp) return toast.error('Enter the OTP');
    setLoading(true);
    try {
      await verifyOTP({ rollNo: form.rollNo, otp, password });
      toast.success('Account created!');
      await login(savedEmail, password);
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(shownOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resendVerification = async () => {
    // Re-send Firebase verification email
    toast('Resending verification email…');
    // We need to sign in with temp password again — not stored for security
    // Direct user to re-register if needed
    toast('Please go back and register again if you did not receive the email.');
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

        {/* ── Step 0: Details ── */}
        {step === 0 && (
          <form onSubmit={submitStep1} className="space-y-4 animate-fadeUp">
            {/* Verification method */}
            <div>
              <label className="label">Verification Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMethod('otp')}
                  className={`rounded-xl border-2 p-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    method === 'otp' ? 'border-brand bg-brand/10 text-brand' : 'border-surface-border text-gray-400'}`}>
                  <Hash size={16} /> OTP Code
                </button>
                <button type="button" onClick={() => setMethod('link')}
                  className={`rounded-xl border-2 p-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    method === 'link' ? 'border-brand bg-brand/10 text-brand' : 'border-surface-border text-gray-400'}`}>
                  <Mail size={16} /> Email Link
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {method === 'otp'
                  ? 'A 6-digit OTP will be shown on screen instantly'
                  : 'Firebase will send a verification link to your KIIT email'}
              </p>
            </div>

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
                  {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Room Number</label>
                <input name="room" className="input-field" placeholder="205" value={form.room} onChange={handle} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {method === 'otp' ? 'Generating OTP…' : 'Sending verification email…'}
                  </span>
                : method === 'otp' ? 'Get OTP' : 'Send Verification Email'}
            </button>
          </form>
        )}

        {/* ── Step 1: Verify ── */}
        {step === 1 && (
          <form onSubmit={submitStep2} className="space-y-4 animate-fadeUp">

            {method === 'link' ? (
              /* Email link sent by Firebase */
              <div className="card border-brand/40 text-center space-y-3">
                <div className="w-14 h-14 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto">
                  {emailSent
                    ? <CheckCircle2 size={28} className="text-green-400" />
                    : <Mail size={28} className="text-brand" />}
                </div>
                <div>
                  <p className="font-semibold">{emailSent ? 'Email Sent!' : 'Sending…'}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Firebase sent a verification link to:
                  </p>
                  <p className="text-brand font-medium text-sm">{savedEmail}</p>
                </div>
                <div className="bg-surface rounded-xl p-3 text-xs text-gray-400 text-left space-y-1.5">
                  <p>1. 📧 Open your KIIT email inbox (check spam too)</p>
                  <p>2. 🔗 Click <strong className="text-white">"Verify your email"</strong></p>
                  <p>3. ✅ Come back here and set your password below</p>
                </div>
                <p className="text-xs text-gray-500">
                  Sent from: <span className="text-white">noreply@kiit-gym-prod.firebaseapp.com</span>
                </p>
              </div>
            ) : (
              /* OTP shown on screen */
              shownOtp && (
                <div className="card border-brand/40 text-center">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Your OTP</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-display text-4xl font-bold tracking-[0.3em] text-brand">{shownOtp}</span>
                    <button type="button" onClick={copyOtp} className="text-gray-400 hover:text-brand transition-colors">
                      {copied ? <CheckCircle2 size={20} className="text-green-400" /> : <Copy size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Valid for 10 minutes</p>
                </div>
              )
            )}

            {/* OTP input — only for OTP method */}
            {method === 'otp' && (
              <div>
                <label className="label">Enter OTP</label>
                <input type="text" maxLength={6}
                  className="input-field text-center text-2xl tracking-[0.5em] font-display"
                  placeholder="——————"
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
              </div>
            )}

            {/* Password fields */}
            <div>
              <label className="label">
                {method === 'link' ? 'Set Your Password (after verifying email)' : 'Create Password'}
              </label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input-field pr-11"
                  placeholder="Min 8 characters" value={password} onChange={(e) => setPass(e.target.value)} />
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

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating…
                  </span>
                : method === 'link' ? 'Complete Registration' : 'Create Account'}
            </button>

            <button type="button"
              onClick={() => { setStep(0); setShownOtp(''); setOtp(''); setEmailSent(false); setPendingUid(''); }}
              className="btn-ghost w-full flex items-center justify-center gap-1">
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
