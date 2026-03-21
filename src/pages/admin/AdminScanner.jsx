import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { scanQR } from '../../services/api';
import { CheckCircle2, XCircle, QrCode, Camera, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const SLOT_LABELS = {
  '06-07':'6–7 AM','07-08':'7–8 AM','08-09':'8–9 AM',
  '16-17':'4–5 PM','17-18':'5–6 PM','18-19':'6–7 PM','19-20':'7–8 PM',
};

export default function AdminScanner() {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult]     = useState(null); // { success, ...data }
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const html5QrRef = useRef(null);

  const startScanner = async () => {
    setResult(null);
    setError('');
    setScanning(true);
    try {
      html5QrRef.current = new Html5Qrcode('qr-reader');
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current?.isScanning) {
      await html5QrRef.current.stop();
    }
    setScanning(false);
  };

  useEffect(() => () => { html5QrRef.current?.isScanning && html5QrRef.current.stop(); }, []);

  const handleScan = async (qrToken) => {
    await stopScanner();
    setLoading(true);
    try {
      const data = await scanQR(qrToken);
      setResult({ success: true, ...data });
      toast.success(`✅ ${data.userName} — Entry approved!`);
    } catch (err) {
      setResult({ success: false, message: err.message });
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual token input fallback
  const [manual, setManual]   = useState('');
  const handleManual = async (e) => {
    e.preventDefault();
    if (!manual) return;
    setLoading(true);
    try {
      const data = await scanQR(manual);
      setResult({ success: true, ...data });
      toast.success(`✅ ${data.userName} — Entry approved!`);
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
      setManual('');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fadeUp">
      <div>
        <h2 className="page-header">QR Scanner</h2>
        <p className="text-gray-400 text-sm mt-0.5">Scan student QR code to mark attendance</p>
      </div>

      {/* Scanner box */}
      <div className="card overflow-hidden">
        <div id="qr-reader" className="w-full" style={{ minHeight: scanning ? 280 : 0 }} />
        {!scanning && !loading && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-brand/10 flex items-center justify-center">
              <QrCode size={40} className="text-brand" />
            </div>
            <p className="text-gray-400 text-sm text-center">Tap to start scanning student QR codes</p>
            <button onClick={startScanner} className="btn-primary flex items-center gap-2">
              <Camera size={18} /> Start Scanner
            </button>
          </div>
        )}
        {loading && (
          <div className="flex flex-col items-center py-10 gap-3">
            <span className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Validating QR…</p>
          </div>
        )}
        {scanning && (
          <button onClick={stopScanner} className="w-full mt-3 btn-ghost text-sm flex items-center justify-center gap-1">
            Cancel
          </button>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`card border ${result.success ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
          <div className="flex items-center gap-3 mb-3">
            {result.success
              ? <CheckCircle2 size={28} className="text-green-400 shrink-0" />
              : <XCircle     size={28} className="text-red-400 shrink-0" />}
            <div>
              <p className={`font-display font-bold text-lg ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'Entry Approved' : 'Entry Denied'}
              </p>
              {result.success
                ? <p className="text-sm text-gray-300">{result.userName}</p>
                : <p className="text-sm text-gray-400">{result.message}</p>}
            </div>
          </div>
          {result.success && (
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="bg-surface rounded-lg p-2">
                <p className="text-gray-500">Date</p>
                <p className="text-white font-medium">{result.date}</p>
              </div>
              <div className="bg-surface rounded-lg p-2">
                <p className="text-gray-500">Slot</p>
                <p className="text-white font-medium">{SLOT_LABELS[result.slot] || result.slot || '—'}</p>
              </div>
              <div className="bg-surface rounded-lg p-2">
                <p className="text-gray-500">Streak</p>
                <p className="text-brand font-bold">🔥 {result.streak}</p>
              </div>
            </div>
          )}
          <button onClick={() => { setResult(null); startScanner(); }}
            className="btn-secondary w-full mt-3 flex items-center justify-center gap-1.5 text-sm">
            <RefreshCw size={15} /> Scan Next
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div className="card border-red-500/30 bg-red-500/5 text-red-400 text-sm">{error}</div>}

      {/* Manual fallback */}
      <details className="card">
        <summary className="cursor-pointer text-sm text-gray-400 font-medium select-none">Manual Token Entry (fallback)</summary>
        <form onSubmit={handleManual} className="mt-3 flex gap-2">
          <input className="input-field flex-1 text-xs" placeholder="Paste JWT token here…"
            value={manual} onChange={(e) => setManual(e.target.value)} />
          <button type="submit" disabled={loading} className="btn-primary px-4 py-2 text-sm shrink-0">Verify</button>
        </form>
      </details>
    </div>
  );
}
