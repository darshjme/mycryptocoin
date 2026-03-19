'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import StatCard from '@/components/ui/StatCard';
import { endpoints } from '@/lib/endpoints';

interface AdminSession {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

interface IPEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  ipAddress: string;
  label: string;
  addedAt: string;
  addedBy: string;
}

const token = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

export default function SecurityPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginAttempt[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState<IPEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'logins' | 'whitelist'>('sessions');
  const [addIpModal, setAddIpModal] = useState(false);
  const [newIp, setNewIp] = useState({ adminId: '', ipAddress: '', label: '' });

  const fetchData = useCallback(async () => {
    try {
      const [sessRes, loginRes, ipRes] = await Promise.all([
        fetch(endpoints.security.sessions, { headers: authHeaders() }),
        fetch(endpoints.security.loginHistory, { headers: authHeaders() }),
        fetch(endpoints.security.ipWhitelist, { headers: authHeaders() }),
      ]);
      const [sessData, loginData, ipData] = await Promise.all([sessRes.json(), loginRes.json(), ipRes.json()]);
      if (sessData.success) setSessions(sessData.data);
      if (loginData.success) setLoginHistory(loginData.data.attempts || loginData.data);
      if (ipData.success) setIpWhitelist(ipData.data);
    } catch (error) {
      console.error('Failed to fetch security data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const forceLogout = async (sessionId: string) => {
    try {
      await fetch(endpoints.security.sessionDelete(sessionId), { method: 'DELETE', headers: authHeaders() });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Force logout failed', error);
    }
  };

  const removeIp = async (entryId: string) => {
    try {
      await fetch(endpoints.security.ipWhitelistDelete(entryId), { method: 'DELETE', headers: authHeaders() });
      setIpWhitelist((prev) => prev.filter((e) => e.id !== entryId));
    } catch (error) {
      console.error('Remove IP failed', error);
    }
  };

  const addIp = async () => {
    try {
      await fetch(endpoints.security.ipWhitelist, { method: 'POST', headers: authHeaders(), body: JSON.stringify(newIp) });
      setAddIpModal(false);
      setNewIp({ adminId: '', ipAddress: '', label: '' });
      fetchData();
    } catch (error) {
      console.error('Add IP failed', error);
    }
  };

  const failedLogins = loginHistory.filter((l) => !l.success);
  const activeSessions = sessions.filter((s) => s.isActive);

  const sessionColumns = [
    { key: 'adminEmail', label: 'Admin', sortable: true, render: (v: unknown) => <span className="text-white font-medium">{String(v)}</span> },
    { key: 'adminRole', label: 'Role', render: (v: unknown) => <Badge variant="info" size="sm">{String(v)}</Badge> },
    { key: 'ipAddress', label: 'IP Address', render: (v: unknown) => <span className="text-white/70 font-mono text-xs">{String(v)}</span> },
    { key: 'device', label: 'Device', render: (v: unknown) => <span className="text-white/60">{String(v)}</span> },
    { key: 'lastActiveAt', label: 'Last Active', sortable: true, render: (v: unknown) => <span className="text-white/50 text-xs">{new Date(String(v)).toLocaleString()}</span> },
    { key: 'id', label: 'Action', align: 'right' as const, render: (_v: unknown, row: AdminSession) => (
      <Button variant="danger" size="sm" onClick={() => forceLogout(row.id)}>Force Logout</Button>
    )},
  ];

  const loginColumns = [
    { key: 'email', label: 'Email', sortable: true, render: (v: unknown) => <span className="text-white font-medium">{String(v)}</span> },
    { key: 'success', label: 'Status', render: (v: unknown) => <Badge variant={v ? 'success' : 'danger'} dot size="sm">{v ? 'Success' : 'Failed'}</Badge> },
    { key: 'ipAddress', label: 'IP', render: (v: unknown) => <span className="text-white/70 font-mono text-xs">{String(v)}</span> },
    { key: 'failureReason', label: 'Reason', render: (v: unknown) => <span className="text-white/50 text-xs">{v ? String(v) : '-'}</span> },
    { key: 'createdAt', label: 'Time', sortable: true, render: (v: unknown) => <span className="text-white/50 text-xs">{new Date(String(v)).toLocaleString()}</span> },
  ];

  const ipColumns = [
    { key: 'adminEmail', label: 'Admin', render: (v: unknown) => <span className="text-white font-medium">{String(v)}</span> },
    { key: 'ipAddress', label: 'IP Address', render: (v: unknown) => <span className="text-white/70 font-mono">{String(v)}</span> },
    { key: 'label', label: 'Label', render: (v: unknown) => <span className="text-white/60">{String(v) || '-'}</span> },
    { key: 'addedAt', label: 'Added', render: (v: unknown) => <span className="text-white/50 text-xs">{new Date(String(v)).toLocaleDateString()}</span> },
    { key: 'id', label: 'Action', align: 'right' as const, render: (_v: unknown, row: IPEntry) => (
      <Button variant="danger" size="sm" onClick={() => removeIp(row.id)}>Remove</Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">Monitor sessions, login activity, and IP access</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Active Sessions" value={activeSessions.length} icon={<span className="material-icons text-white text-lg">devices</span>} iconColor="from-blue-600 to-blue-400" />
        <StatCard label="Failed Logins (24h)" value={failedLogins.length} icon={<span className="material-icons text-white text-lg">lock</span>} iconColor="from-rose-600 to-rose-400" />
        <StatCard label="IP Whitelist Entries" value={ipWhitelist.length} icon={<span className="material-icons text-white text-lg">vpn_lock</span>} iconColor="from-emerald-600 to-emerald-400" />
        <StatCard label="Total Admins Active" value={new Set(activeSessions.map((s) => s.adminId)).size} icon={<span className="material-icons text-white text-lg">admin_panel_settings</span>} iconColor="from-purple-600 to-purple-400" />
      </div>

      <div className="flex gap-2">
        {(['sessions', 'logins', 'whitelist'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
            {tab === 'sessions' ? 'Active Sessions' : tab === 'logins' ? 'Login History' : 'IP Whitelist'}
          </button>
        ))}
      </div>

      {activeTab === 'sessions' && (
        <Card padding="none">
          <div className="p-6 pb-0"><CardHeader title="Active Admin Sessions" subtitle={`${activeSessions.length} active sessions`} /></div>
          <Table columns={sessionColumns} data={activeSessions as any[]} loading={loading} emptyMessage="No active sessions" />
        </Card>
      )}

      {activeTab === 'logins' && (
        <Card padding="none">
          <div className="p-6 pb-0"><CardHeader title="Login Attempts" subtitle="Recent login history" /></div>
          <Table columns={loginColumns} data={loginHistory as any[]} loading={loading} emptyMessage="No login records" />
        </Card>
      )}

      {activeTab === 'whitelist' && (
        <Card padding="none">
          <div className="p-6 pb-0">
            <CardHeader title="IP Whitelist" subtitle="Restrict admin access to specific IPs" action={<Button variant="primary" size="sm" onClick={() => setAddIpModal(true)}><span className="material-icons text-sm mr-1">add</span>Add IP</Button>} />
          </div>
          <Table columns={ipColumns} data={ipWhitelist as any[]} loading={loading} emptyMessage="No IP whitelist entries — all IPs allowed" />
        </Card>
      )}

      <Modal isOpen={addIpModal} onClose={() => setAddIpModal(false)} title="Add IP to Whitelist" size="sm">
        <div className="space-y-4">
          <Input label="Admin ID" value={newIp.adminId} onChange={(e) => setNewIp((p) => ({ ...p, adminId: e.target.value }))} placeholder="Admin user ID" />
          <Input label="IP Address" value={newIp.ipAddress} onChange={(e) => setNewIp((p) => ({ ...p, ipAddress: e.target.value }))} placeholder="192.168.1.1" />
          <Input label="Label" value={newIp.label} onChange={(e) => setNewIp((p) => ({ ...p, label: e.target.value }))} placeholder="Office VPN" />
          <Button variant="primary" fullWidth onClick={addIp}>Add to Whitelist</Button>
        </div>
      </Modal>
    </div>
  );
}
