import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      const { profile } = await login(form.email, form.password);
      if (profile.role === 'superadmin') navigate('/superadmin');
      else if (profile.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error(err.message.includes('wrong-password') || err.message.includes('user-not-found')
        ? 'Invalid email or password' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand/30">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wider uppercase">KIIT Fitness</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email / Roll Number</label>
            <input name="email" type="email" placeholder="you@stu.kiit.ac.in"
              className="input-field" value={form.email} onChange={handle} autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input name="password" type={show ? 'text' : 'password'} placeholder="••••••••"
                className="input-field pr-11" value={form.password} onChange={handle} autoComplete="current-password" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in…
            </span> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          New student?{' '}
          <Link to="/register" className="text-brand hover:text-brand-light font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
