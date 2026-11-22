import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Globe, 
  Clock, 
  Search, 
  Filter, 
  FileCheck, 
  Key, 
  Download,
  Flame,
  Terminal
} from 'lucide-react';
import { fetchAuditLogs } from '../services/api';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditLogs().then(data => setLogs(data));
  }, []);

  const filteredLogs = logs.filter(log => 
    log.id.toLowerCase().includes(search.toLowerCase()) ||
    log.fileId.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.location.toLowerCase().includes(search.toLowerCase()) ||
    log.ipAddress.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Security & Decryption Forensic Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident append-only ledger tracking all share generations, download decrypts, and invalid access probes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            SOC-2 Type II Compliant
          </span>
          <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
            GDPR Art. 32
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Log ID, File ID, IP, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-emerald-400 font-bold">{filteredLogs.length}</span> security events
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Event ID & Timestamp</th>
                <th className="py-3 px-4">Vault Target</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Origin IP & Geolocation</th>
                <th className="py-3 px-4">Status & Auth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.map((log) => {
                const isUnauthorized = log.status.includes('401');
                const isBurned = log.action.includes('PURGE') || log.status.includes('BURNED');

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-white font-semibold flex items-center gap-1.5">
                        <span>{log.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                        {log.fileId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        {isUnauthorized ? (
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        ) : isBurned ? (
                          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className={`font-mono text-[11px] font-semibold ${
                          isUnauthorized ? 'text-red-400' : isBurned ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-200">{log.ipAddress}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>{log.location}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isUnauthorized 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {log.status}
                        </span>
                        {log.passwordUsed && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded">
                            Passphrase Verified
                          </span>
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
