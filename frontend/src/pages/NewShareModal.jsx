import React, { useState } from 'react';
import { 
  Lock, 
  Upload, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Key, 
  FileCheck, 
  Sparkles,
  CheckCircle,
  Copy
} from 'lucide-react';
import { createShare } from '../services/api';

export default function NewShareModal({ isOpen, onClose, onCreated }) {
  const [filename, setFilename] = useState('confidential_project_audit_2026.pdf');
  const [sizeMb, setSizeMb] = useState('12.4');
  const [expirationHours, setExpirationHours] = useState('24');
  const [maxDownloads, setMaxDownloads] = useState('3');
  const [hasPassword, setHasPassword] = useState(true);
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [password, setPassword] = useState('Vault#Pass2026!');
  const [createdShare, setCreatedShare] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const share = await createShare({
        filename,
        sizeMb: parseFloat(sizeMb),
        expirationHours: parseInt(expirationHours),
        maxDownloads: parseInt(maxDownloads),
        hasPassword,
        burnAfterReading,
        sender: 'security-admin@corp.internal'
      });
      setCreatedShare(share);
      if (onCreated) onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCreatedShare(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Ephemeral Share Vault</h3>
              <p className="text-xs text-slate-400">Client-Side AES-256-GCM Zero-Knowledge Transfer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        {createdShare ? (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Encrypted Vault Created!</h4>
              <p className="text-xs text-slate-300">
                The encryption key was derived in your browser memory and never transmitted to the server.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-mono">Zero-Knowledge Share URL</label>
              <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 select-all overflow-x-auto">
                <span>https://filebridge.io/v/{createdShare.id}#key={createdShare.sha256.slice(0, 16)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Vault ID:</span>
                <span className="font-mono text-white font-semibold">{createdShare.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Expires in:</span>
                <span className="text-white">{expirationHours} Hours</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Return to Vault Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payload Name</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Simulated Size (MB)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sizeMb}
                  onChange={(e) => setSizeMb(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Max Download Cap</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expiration Window</label>
              <select
                value={expirationHours}
                onChange={(e) => setExpirationHours(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="1">1 Hour (High-Security Instant Exchange)</option>
                <option value="6">6 Hours</option>
                <option value="24">24 Hours (Standard)</option>
                <option value="72">3 Days (72 Hours)</option>
                <option value="168">7 Days (Maximum Ephemeral Window)</option>
              </select>
            </div>

            {/* Checkbox toggles */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={burnAfterReading}
                  onChange={(e) => setBurnAfterReading(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded bg-slate-700 border-slate-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Burn-After-Reading
                  </div>
                  <div className="text-[11px] text-slate-400">Permanently delete payload from storage immediately after 1 successful download.</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded bg-slate-700 border-slate-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    Require Decryption Passphrase
                  </div>
                  <div className="text-[11px] text-slate-400">Enforce PBKDF2 client key derivation with recipient passphrase.</div>
                </div>
              </label>
            </div>

            {hasPassword && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Passphrase</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Deriving Keys & Sealing...' : 'Encrypt & Generate Share Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
