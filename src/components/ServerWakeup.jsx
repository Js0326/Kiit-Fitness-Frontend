import { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Pings the backend /health endpoint on app load.
 * Shows a branded loading screen while the server wakes up (Render free tier).
 * Once server responds, renders children normally.
 */
export default function ServerWakeup({ children }) {
  const [status, setStatus] = useState('checking'); // checking | ready | slow | failed
  const [dots, setDots]     = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer;
    const start = Date.now();

    // Animated dots
    timer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);

    // Ping health endpoint — up to 90s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const baseUrl = API_URL.replace('/api', '');

    fetch(`${baseUrl}/health`, { signal: controller.signal })
      .then(r => r.json())
      .then(() => {
        clearInterval(timer);
        clearTimeout(timeout);
        setStatus('ready');
      })
      .catch(() => {
        clearInterval(timer);
        clearTimeout(timeout);
        // Still let them try — maybe it woke up
        setStatus('ready');
      });

    // After 8s, show "slow server" message
    const slowTimer = setTimeout(() => setStatus('slow'), 8000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
      clearTimeout(slowTimer);
      controller.abort();
    };
  }, []);

  if (status === 'ready') return children;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      {/* Icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/30 animate-pulse">
          <Dumbbell size={40} className="text-white" />
        </div>
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-brand/30 animate-spin" style={{ animationDuration: '3s' }} />
      </div>

      <h1 className="font-display text-3xl font-bold tracking-wider uppercase mb-2">
        KIIT Fitness
      </h1>

      {status === 'checking' && elapsed < 8 && (
        <p className="text-gray-400 text-sm">Loading{dots}</p>
      )}

      {(status === 'slow' || elapsed >= 8) && (
        <div className="text-center max-w-xs mt-2">
          <p className="text-brand font-semibold text-sm mb-1">Server is waking up{dots}</p>
          <p className="text-gray-500 text-xs leading-relaxed">
            The server was sleeping to save resources. This takes up to 60 seconds on first load. Please wait{dots}
          </p>
          {elapsed >= 20 && (
            <div className="mt-4 bg-surface-raised border border-surface-border rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400">
                {elapsed}s elapsed — almost there, hang tight!
              </p>
              {/* Progress bar */}
              <div className="w-full bg-surface-border rounded-full h-1.5 mt-2">
                <div
                  className="bg-brand h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((elapsed / 70) * 100, 95)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
