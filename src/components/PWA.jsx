import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X, Smartphone } from 'lucide-react';

// ── Install Prompt ─────────────────────────────────────────────
export function InstallPrompt() {
  const [deferredPrompt, setDeferred] = useState(null);
  const [show, setShow]               = useState(false);
  const [dismissed, setDismissed]     = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa-install-dismissed')) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      // Show after 30 seconds of use
      setTimeout(() => setShow(true), 30_000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferred(null);
  };

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto animate-fadeUp">
      <div className="bg-surface-raised border border-brand/40 rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shrink-0">
            <Smartphone size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold tracking-wide text-sm">Install App</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Add KIIT Fitness to your home screen for faster access and offline support.
            </p>
          </div>
          <button onClick={dismiss} className="text-gray-500 hover:text-gray-300 shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={install} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1.5">
            <Download size={15} /> Install
          </button>
          <button onClick={dismiss} className="btn-secondary py-2 px-4 text-sm">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Update Notification ────────────────────────────────────────
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      r && setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto animate-fadeUp">
      <div className="bg-surface-raised border border-brand/40 rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand/20 rounded-lg flex items-center justify-center shrink-0">
            <RefreshCw size={16} className="text-brand" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Update Available</p>
            <p className="text-xs text-gray-400">A new version of the app is ready.</p>
          </div>
          <button onClick={() => updateServiceWorker(true)}
            className="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Offline Banner ─────────────────────────────────────────────
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 backdrop-blur text-black text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
      <span className="w-2 h-2 bg-black rounded-full" />
      You're offline — showing cached data
    </div>
  );
}
