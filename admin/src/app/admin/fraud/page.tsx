'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import StatCard from '@/components/ui/StatCard';
import { endpoints } from '@/lib/endpoints';

interface FraudAlert {
  id: string;
  merchantId: string;
  merchantName: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  recommendedAction: string;
  autoFrozen: boolean;
  createdAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

const token = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const SEVERITY_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  critical: 'danger', high: 'danger', medium: 'warning', low: 'info',
};
const SEVERITY_ICON_COLOR: Record<string, string> = {
  critical: 'text-rose-400', high: 'text-rose-400', medium: 'text-amber-400', low: 'text-blue-400',
};
const STATUS_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
  active: 'danger', acknowledged: 'info', dismissed: 'neutral', escalated: 'warning', auto_resolved: 'success',
};

export default function FraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({ low: 0, medium: 0, high: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [detailModal, setDetailModal] = useState<FraudAlert | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (severityFilter) params.set('severity', severityFilter);
      if (statusFilter) params.set('status', statusFilter);

      const [alertsRes, countsRes] = await Promise.all([
        fetch(`${endpoints.security.fraudAlerts}?${params}`, { headers: authHeaders() }),
        fetch(endpoints.security.fraudAlertCounts, { headers: authHeaders() }),
      ]);
      const [alertsData, countsData] = await Promise.all([alertsRes.json(), countsRes.json()]);
      if (alertsData.success) { setAlerts(alertsData.data.alerts); setTotal(alertsData.data.total); }
      if (countsData.success) setCounts(countsData.data);
    } catch (error) {
      console.error('Failed to fetch fraud alerts', error);
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, statusFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleAction = async (alertId: string, action: 'acknowledged' | 'dismissed' | 'escalated') => {
    setProcessing(true);
    try {
      await fetch(endpoints.security.fraudAlert(alertId), {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ action, notes: actionNotes }),
      });
      setDetailModal(null);
      setActionNotes('');
      fetchAlerts();
    } catch (error) {
      console.error('Action failed', error);
    } finally {
      setProcessing(false);
    }
  };

  const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);

  const columns = [
    { key: 'severity', label: 'Severity', width: 'w-24', render: (v: unknown) => (
      <Badge variant={SEVERITY_VARIANT[String(v)] || 'neutral'} dot size="sm">{String(v).toUpperCase()}</Badge>
    )},
    { key: 'title', label: 'Alert', render: (_v: unknown, row: FraudAlert) => (
      <div>
        <p className="text-white font-medium text-sm">{row.title}</p>
        <p className="text-xs text-white/40 mt-0.5">{row.merchantName}</p>
      </div>
    )},
    { key: 'type', label: 'Type', render: (v: unknown) => <span className="text-white/60 text-xs">{String(v).replace(/_/g, ' ')}</span> },
    { key: 'status', label: 'Status', render: (v: unknown) => <Badge variant={STATUS_VARIANT[String(v)] || 'neutral'} size="sm">{String(v)}</Badge> },
    { key: 'autoFrozen', label: 'Auto-Frozen', render: (v: unknown) => v ? <Badge variant="danger" size="sm">Frozen</Badge> : <span className="text-white/30">-</span> },
    { key: 'createdAt', label: 'Time', sortable: true, render: (v: unknown) => <span className="text-white/50 text-xs">{new Date(String(v)).toLocaleString()}</span> },
    { key: 'id', label: '', align: 'right' as const, render: (_v: unknown, row: FraudAlert) => (
      <Button variant="ghost" size="sm" onClick={() => setDetailModal(row)}>Details</Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fraud Alerts</h1>
        <p className="text-sm text-white/50 mt-1">Monitor suspicious activity and manage alerts</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Critical" value={counts.critical || 0} icon={<span className="material-icons text-white text-lg">error</span>} iconColor="from-rose-600 to-rose-400" />
        <StatCard label="High" value={counts.high || 0} icon={<span className="material-icons text-white text-lg">warning</span>} iconColor="from-orange-600 to-orange-400" />
        <StatCard label="Medium" value={counts.medium || 0} icon={<span className="material-icons text-white text-lg">info</span>} iconColor="from-amber-600 to-amber-400" />
        <StatCard label="Low" value={counts.low || 0} icon={<span className="material-icons text-white text-lg">check_circle</span>} iconColor="from-blue-600 to-blue-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 mr-4">
          {['', 'critical', 'high', 'medium', 'low'].map((s) => (
            <button key={s} onClick={() => { setSeverityFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${severityFilter === s ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
              {s || 'All Severity'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['active', 'acknowledged', 'escalated', 'dismissed', ''].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
              {s || 'All Status'}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none">
        <Table columns={columns} data={alerts as any[]} loading={loading} emptyMessage="No fraud alerts found" pagination={{ page, totalPages: Math.ceil(total / 20), total, onPageChange: setPage }} />
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Fraud Alert Details" size="lg">
        {detailModal && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${detailModal.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20' : detailModal.severity === 'high' ? 'bg-rose-500/5 border-rose-500/15' : 'bg-amber-500/5 border-amber-500/15'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`material-icons ${SEVERITY_ICON_COLOR[detailModal.severity]}`}>
                  {detailModal.severity === 'critical' ? 'error' : 'warning'}
                </span>
                <Badge variant={SEVERITY_VARIANT[detailModal.severity] || 'neutral'} size="sm">{detailModal.severity.toUpperCase()}</Badge>
                {detailModal.autoFrozen && <Badge variant="danger" size="sm">AUTO-FROZEN</Badge>}
              </div>
              <h3 className="text-white font-semibold">{detailModal.title}</h3>
              <p className="text-sm text-white/60 mt-1">{detailModal.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-white/40">Merchant</p><p className="text-sm text-white">{detailModal.merchantName}</p></div>
              <div><p className="text-xs text-white/40">Type</p><p className="text-sm text-white">{detailModal.type.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs text-white/40">Created</p><p className="text-sm text-white">{new Date(detailModal.createdAt).toLocaleString()}</p></div>
              <div><p className="text-xs text-white/40">Status</p><Badge variant={STATUS_VARIANT[detailModal.status]} size="sm">{detailModal.status}</Badge></div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-white/40 mb-1">Recommended Action</p>
              <p className="text-sm text-white">{detailModal.recommendedAction}</p>
            </div>

            {detailModal.metadata && Object.keys(detailModal.metadata).length > 0 && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-xs text-white/40 mb-2">Metadata</p>
                <pre className="text-xs text-white/60 font-mono overflow-x-auto">{JSON.stringify(detailModal.metadata, null, 2)}</pre>
              </div>
            )}

            {detailModal.status === 'active' && (
              <>
                <Input label="Notes" value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Optional notes..." />
                <div className="flex gap-3">
                  <Button variant="success" onClick={() => handleAction(detailModal.id, 'acknowledged')} loading={processing} className="flex-1">
                    Acknowledge
                  </Button>
                  <Button variant="danger" onClick={() => handleAction(detailModal.id, 'escalated')} loading={processing} className="flex-1">
                    Escalate
                  </Button>
                  <Button variant="secondary" onClick={() => handleAction(detailModal.id, 'dismissed')} loading={processing} className="flex-1">
                    Dismiss
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
