'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import StatCard from '@/components/ui/StatCard';
import { endpoints } from '@/lib/endpoints';

interface AuditEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminEmail: string;
  action: string;
  target: string;
  targetId: string;
  previousValue: string;
  newValue: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

const token = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const ACTION_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'> = {
  'admin.login': 'info',
  'admin.login_failed': 'danger',
  'admin.logout': 'neutral',
  'withdrawal.approved': 'success',
  'withdrawal.rejected': 'danger',
  'withdrawal.emergency_override': 'danger',
  'emergency.global_freeze': 'danger',
  'emergency.global_unfreeze': 'success',
  'emergency.crypto_freeze': 'danger',
  'emergency.merchant_freeze': 'danger',
  'emergency.maintenance_on': 'warning',
  'emergency.maintenance_off': 'success',
  'settings.updated': 'info',
  'kyc.approved': 'success',
  'kyc.rejected': 'danger',
  'fraud.alert_updated': 'warning',
  'wallet.sweep': 'purple',
  'reconciliation.run': 'info',
  'session.force_logout': 'warning',
};

const ACTION_CATEGORIES = [
  { value: '', label: 'All Actions' },
  { value: 'admin.', label: 'Auth' },
  { value: 'withdrawal.', label: 'Withdrawals' },
  { value: 'emergency.', label: 'Emergency' },
  { value: 'settings.', label: 'Settings' },
  { value: 'kyc.', label: 'KYC' },
  { value: 'fraud.', label: 'Fraud' },
  { value: 'wallet.', label: 'Wallets' },
  { value: 'session.', label: 'Sessions' },
  { value: 'reconciliation.', label: 'Reconciliation' },
];

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionPrefix, setActionPrefix] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      if (actionPrefix) params.set('actionPrefix', actionPrefix);
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const res = await fetch(`${endpoints.security.auditLog}?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setEntries(data.data.entries);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch audit log', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionPrefix, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());
      if (actionPrefix) params.set('actionPrefix', actionPrefix);

      const res = await fetch(`${endpoints.security.auditExport}?${params}`, { headers: authHeaders() });
      const data = await res.json();

      if (data.success) {
        // Convert to CSV
        const csvHeaders = ['Timestamp', 'Admin', 'Action', 'Target', 'IP Address', 'Details'];
        const csvRows = data.data.map((e: AuditEntry) => [
          new Date(e.timestamp).toISOString(),
          e.adminEmail || e.adminId,
          e.action,
          e.target,
          e.ipAddress,
          JSON.stringify(e.metadata),
        ]);

        const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: 'timestamp', label: 'Time', sortable: true, width: 'w-40', render: (v: unknown) => (
      <span className="text-white/60 text-xs font-mono">{new Date(String(v)).toLocaleString()}</span>
    )},
    { key: 'adminEmail', label: 'Admin', sortable: true, render: (v: unknown, row: AuditEntry) => (
      <div>
        <p className="text-white text-sm">{String(v) || row.adminId}</p>
      </div>
    )},
    { key: 'action', label: 'Action', render: (v: unknown) => {
      const action = String(v);
      const variant = ACTION_VARIANTS[action] || 'neutral';
      return <Badge variant={variant} size="sm">{action}</Badge>;
    }},
    { key: 'target', label: 'Target', render: (v: unknown) => <span className="text-white/60 text-xs font-mono">{String(v)}</span> },
    { key: 'ipAddress', label: 'IP', render: (v: unknown) => <span className="text-white/40 text-xs font-mono">{String(v) || '-'}</span> },
    { key: 'newValue', label: 'Details', render: (v: unknown) => {
      const val = String(v);
      if (!val || val === '{}' || val === '') return <span className="text-white/30">-</span>;
      const truncated = val.length > 60 ? val.substring(0, 60) + '...' : val;
      return <span className="text-white/40 text-xs font-mono" title={val}>{truncated}</span>;
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-white/50 mt-1">Immutable record of all admin actions</p>
        </div>
        <Button variant="secondary" onClick={handleExport} loading={exporting} icon={<span className="material-icons text-sm">download</span>}>
          Export CSV
        </Button>
      </div>

      <div className="glass-card p-4 border-blue-500/10">
        <div className="flex items-center gap-2 text-xs text-blue-400">
          <span className="material-icons text-sm">lock</span>
          <span>This log is append-only. Entries cannot be modified or deleted.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Total Entries" value={total.toLocaleString()} icon={<span className="material-icons text-white text-lg">history</span>} iconColor="from-brand-600 to-purple-600" />
        <StatCard label="Today's Actions" value={entries.filter((e) => new Date(e.timestamp).toDateString() === new Date().toDateString()).length} icon={<span className="material-icons text-white text-lg">today</span>} iconColor="from-blue-600 to-blue-400" />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search actions, admins, targets..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              icon={<span className="material-icons text-lg">search</span>}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-brand-500/50 transition-all"
              placeholder="Start date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-brand-500/50 transition-all"
              placeholder="End date"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {ACTION_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setActionPrefix(cat.value); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                actionPrefix === cat.value
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </Card>

      <Card padding="none">
        <Table
          columns={columns}
          data={entries as any[]}
          loading={loading}
          emptyMessage="No audit entries found"
          pagination={{ page, totalPages: Math.ceil(total / 50), total, onPageChange: setPage }}
        />
      </Card>
    </div>
  );
}
