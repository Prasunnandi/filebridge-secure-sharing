import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import VaultDashboard from './pages/VaultDashboard';
import AuditLogsView from './pages/AuditLogsView';
import NewShareModal from './pages/NewShareModal';
import { fetchStats } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('vault');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalShares: 5,
    activeShares: 4,
    totalDownloads: 18,
    burnedShares: 1,
    auditEventsCount: 4
  });

  const refreshStats = () => {
    fetchStats().then(data => {
      if (data) setStats(data);
    });
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'share') {
            setIsModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar stats={stats} />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'vault' && (
            <VaultDashboard onOpenCreate={() => setIsModalOpen(true)} />
          )}
          {activeTab === 'audit' && (
            <AuditLogsView />
          )}
        </main>
      </div>

      <NewShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          refreshStats();
        }}
      />
    </div>
  );
}
