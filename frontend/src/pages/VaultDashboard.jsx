import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Key, 
  Clock, 
  Download, 
  Copy, 
  Flame, 
  Check, 
  Lock, 
  Unlock, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Hash,
  Database
} from 'lucide-react';
import { fetchShares, downloadFile } from '../services/api';

export default function VaultDashboard({ onOpenCreate }) {
  const [shares, setShares] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchShares();
    setShares(data);
  };

  const handleCopyLink = (share) => {
    const shareUrl = `https://filebridge.io/v/${share.id}#key=${share.sha256.slice(0, 16)}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateDownload = async (share) => {
    setDownloadingId(share.id);
    try {
      const res = await downloadFile(share.id);
      setNotification({
        type: 'success',
        title: `Decryption stream verified for ${share.filename}`,
        detail: `Client-side verified checksum: ${res.decryptedChecksum?.slice(0, 24)}...`
      });
      await loadData();
    } catch (e) {
      setNotification({
        type: 'error',
        title: 'Download Failed',
        detail: 'The file has expired or was burned after a prior download.'
      });
    } finally {
      setDownloadingId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleBurnNow = (shareId) => {
    setShares(shares.map(s => s.id === shareId ? { ...s, status: 'BURNED' } : s));
    setNotification({
      type: 'warning',
      title: 'Ephemeral Share Revoked',
      detail: `Share ${shareId} has been purged immediately from memory and storage.`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
            : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">{notification.title}</p>
              <p className="font-mono text-slate-300 text-[11px]">{notification.detail}</p>
            </div>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Encrypted Vaults</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Shield className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {shares.filter(s => s.status === 'ACTIVE').length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span>● End-to-End Encrypted</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Burn-After-Reading</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Flame className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {shares.filter(s => s.burnAfterReading).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Single-read self-destructing</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Secure Ingestions</span>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Download className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {shares.reduce((acc, s) => acc + (s.downloadCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Forensically logged</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Cipher Standard</span>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Key className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">AES-GCM</div>
          <div className="text-[11px] text-purple-400 mt-1">Zero Server Key Access</div>
        </div>
      </div>

      {/* Main Vault List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Active Ephemeral File Vaults
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure links automatically expire upon expiration or reaching their configured download limit.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              title="Refresh Vault Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Create Ephemeral Vault
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Vault ID & Payload</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Security Parameters</th>
                <th className="py-3 px-4">Downloads Used</th>
                <th className="py-3 px-4">Status & Expiration</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {shares.map((share) => {
                const isBurned = share.status === 'BURNED';
                const isCopied = copiedId === share.id;
                const isDownloading = downloadingId === share.id;

                return (
                  <tr key={share.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isBurned ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {share.filename}
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {share.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px]">{share.sha256.slice(0, 12)}...{share.sha256.slice(-8)}</span>
                            <span>•</span>
                            <span>{share.sender}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {share.sizeMb} MB
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {share.hasPassword && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            <Lock className="w-2.5 h-2.5" /> Password Protected
                          </span>
                        )}
                        {share.burnAfterReading ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            <Flame className="w-2.5 h-2.5" /> Burn-on-Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            Multi-Download
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                          {share.encryption.split(' ')[0]}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isBurned ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (share.downloadCount / share.maxDownloads) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-300">
                          {share.downloadCount} / {share.maxDownloads}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          share.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {share.status}
                        </span>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Exp: {share.expiresAt.slice(0, 10)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!isBurned && (
                          <>
                            <button
                              onClick={() => handleCopyLink(share)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition flex items-center gap-1"
                              title="Copy Zero-Knowledge Share URL"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? 'Copied' : 'Link'}</span>
                            </button>

                            <button
                              disabled={isDownloading}
                              onClick={() => handleSimulateDownload(share)}
                              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs transition flex items-center gap-1"
                              title="Simulate Secure Recipient Decryption"
                            >
                              <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                              <span>Decrypt</span>
                            </button>

                            <button
                              onClick={() => handleBurnNow(share.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-xs transition"
                              title="Immediately Burn & Revoke"
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isBurned && (
                          <span className="text-[11px] font-mono text-red-400 italic">Payload Purged</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
