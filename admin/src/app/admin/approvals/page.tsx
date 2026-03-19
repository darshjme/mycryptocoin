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

interface WithdrawalApproval {
  adminId: string;
  adminEmail: string;
  action: string;
  comment: string;
  createdAt: string;
}

interface PendingWithdrawal {
  id: string;
  merchantId: string;
  merchantName: string;
  crypto: string;
  amount: string;
  amountUsd: number;
  toAddress: string;
  status: string;
  requiredApprovals: number;
  currentApprovals: number;
  approvals: WithdrawalApproval[];
  coolingEndsAt: string | null;
  createdAt: string;
}

const token = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

export default function ApprovalsPage() {
  const [pending, setPending] = useState<PendingWithdrawal[]>([]);
  const [history, setHistory] = useState<PendingWithdrawal[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [page, setPage] = useState(1);
  const [approveModal, setApproveModal] = useState<PendingWithdrawal | null>(null);
  const [rejectModal, setRejectModal] = useState<PendingWithdrawal | null>(null);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const res = await fetch(`${endpoints.security.withdrawalsPending}?page=${page}&limit=20&sortBy=amount&sortOrder=desc`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) { setPending(data.data.withdrawals); setPendingTotal(data.data.total); }
      } else {
        const res = await fetch(`${endpoints.security.withdrawalsHistory}?page=${page}&limit=20`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) { setHistory(data.data.withdrawals); setHistoryTotal(data.data.total); }
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!approveModal) return;
    setProcessing(true);
    try {
      await fetch(endpoints.security.withdrawalApprove(approveModal.id), {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ comment }),
      });
      setApproveModal(null);
      setComment('');
      fetchData();
    } catch (error) {
      console.error('Approve failed', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(true);
    try {
      await fetch(endpoints.security.withdrawalReject(rejectModal.id), {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason }),
      });
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (error) {
      console.error('Reject failed', error);
    } finally {
      setProcessing(false);
    }
  };

  const truncateAddress = (addr: string) => addr ? `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}` : '-';

  const pendingColumns = [
    { key: 'merchantName', label: 'Merchant', sortable: true, render: (v: unknown) => <span className="text-white font-medium">{String(v)}</span> },
    { key: 'crypto', label: 'Crypto', render: (v: unknown) => <Badge variant="info" size="sm">{String(v)}</Badge> },
    { key: 'amount', label: 'Amount', sortable: true, align: 'right' as const, render: (v: unknown, row: PendingWithdrawal) => (
      <div className="text-right">
        <p className="text-white font-semibold font-mono">{String(v)}</p>
        <p className="text-xs text-white/40">${row.amountUsd?.toLocaleString() || '0'}</p>
      </div>
    )},
    { key: 'toAddress', label: 'Destination', render: (v: unknown) => <span className="text-white/60 font-mono text-xs">{truncateAddress(String(v))}</span> },
    { key: 'currentApprovals', label: 'Approvals', render: (_v: unknown, row: PendingWithdrawal) => (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: row.requiredApprovals }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < row.currentApprovals ? 'bg-emerald-400' : 'bg-white/15'}`} />
          ))}
        </div>
        <span className="text-xs text-white/50">{row.currentApprovals}/{row.requiredApprovals}</span>
      </div>
    )},
    { key: 'coolingEndsAt', label: 'Cooling', render: (v: unknown) => {
      if (!v) return <span className="text-white/30">-</span>;
      const endsAt = new Date(String(v));
      const now = new Date();
      if (endsAt > now) {
        const hours = Math.ceil((endsAt.getTime() - now.getTime()) / 3600000);
        return <Badge variant="warning" size="sm">{hours}h remaining</Badge>;
      }
      return <Badge variant="success" size="sm">Ready</Badge>;
    }},
    { key: 'createdAt', label: 'Requested', sortable: true, render: (v: unknown) => <span className="text-white/50 text-xs">{new Date(String(v)).toLocaleString()}</span> },
    { key: 'id', label: 'Actions', align: 'right' as const, render: (_v: unknown, row: PendingWithdrawal) => (
      <div className="flex gap-2 justify-end">
        <Button variant="success" size="sm" onClick={() => { setApproveModal(row); setComment(''); }}>Approve</Button>
        <Button variant="danger" size="sm" onClick={() => { setRejectModal(row); setRejectReason(''); }}>Reject</Button>
      </div>
    )},
  ];

  const historyColumns = [
    { key: 'merchantName', label: 'Merchant', render: (v: unknown) => <span className="text-white font-medium">{String(v)}</span> },
    { key: 'crypto', label: 'Crypto', render: (v: unknown) => <Badge variant="info" size="sm">{String(v)}</Badge> },
    { key: 'amount', label: 'Amount', align: 'right' as const, render: (v: unknown) => <span className="text-white font-mono">{String(v)}</span> },
    { key: 'status', label: 'Status', render: (v: unknown) => {
      const s = String(v);
      return <Badge variant={s === 'APPROVED' || s === 'COMPLETED' ? 'success' : s === 'REJECTED' ? 'danger' : 'warning'} dot size="sm">{s}</Badge>;
    }},
    { key: 'currentApprovals', label: 'Approvals', render: (_v: unknown, row: PendingWithdrawal) => <span className="text-white/60 text-sm">{row.currentApprovals}/{row.requiredApprovals}</span> },
    { key: 'createdAt', label: 'Date', render: (v: unknown) => <span className="text-white/50 text-xs">{new Date(String(v)).toLocaleString()}</span> },
  ];

  const totalPendingUsd = pending.reduce((acc, w) => acc + (w.amountUsd || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawal Approvals</h1>
        <p className="text-sm text-white/50 mt-1">Review and approve merchant withdrawal requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pending Approvals" value={pendingTotal} icon={<span className="material-icons text-white text-lg">hourglass_top</span>} iconColor="from-amber-600 to-amber-400" />
        <StatCard label="Pending USD Value" value={`$${totalPendingUsd.toLocaleString()}`} icon={<span className="material-icons text-white text-lg">attach_money</span>} iconColor="from-brand-600 to-purple-600" />
        <StatCard label="Multi-Sig Required" value={pending.filter((w) => w.requiredApprovals > 1).length} icon={<span className="material-icons text-white text-lg">verified_user</span>} iconColor="from-blue-600 to-blue-400" />
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setActiveTab('pending'); setPage(1); }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
          Pending Queue ({pendingTotal})
        </button>
        <button onClick={() => { setActiveTab('history'); setPage(1); }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
          History
        </button>
      </div>

      <Card padding="none">
        {activeTab === 'pending' ? (
          <Table columns={pendingColumns} data={pending as any[]} loading={loading} emptyMessage="No pending withdrawals" pagination={{ page, totalPages: Math.ceil(pendingTotal / 20), total: pendingTotal, onPageChange: setPage }} />
        ) : (
          <Table columns={historyColumns} data={history as any[]} loading={loading} emptyMessage="No approval history" pagination={{ page, totalPages: Math.ceil(historyTotal / 20), total: historyTotal, onPageChange: setPage }} />
        )}
      </Card>

      {/* Approve Modal */}
      <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Withdrawal" size="md">
        {approveModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div><p className="text-xs text-white/40">Merchant</p><p className="text-sm text-white font-medium">{approveModal.merchantName}</p></div>
              <div><p className="text-xs text-white/40">Amount</p><p className="text-sm text-white font-mono">{approveModal.amount} {approveModal.crypto}</p></div>
              <div><p className="text-xs text-white/40">USD Value</p><p className="text-sm text-white">${approveModal.amountUsd?.toLocaleString()}</p></div>
              <div><p className="text-xs text-white/40">Destination</p><p className="text-sm text-white font-mono text-xs">{truncateAddress(approveModal.toAddress)}</p></div>
            </div>
            {approveModal.approvals.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2">Previous Approvals</p>
                {approveModal.approvals.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                    <Badge variant="success" size="sm">{a.action}</Badge>
                    <span>{a.adminEmail}</span>
                    <span className="text-white/30">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <Input label="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Approval notes..." />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setApproveModal(null)} className="flex-1">Cancel</Button>
              <Button variant="success" onClick={handleApprove} loading={processing} className="flex-1">Approve Withdrawal</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Withdrawal" size="md">
        {rejectModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-rose-400">Rejecting {rejectModal.amount} {rejectModal.crypto} withdrawal from {rejectModal.merchantName}. Funds will be returned to the merchant.</p>
            </div>
            <Input
              label="Rejection Reason (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Mandatory reason for rejection..."
              error={rejectReason.length > 0 && rejectReason.length < 5 ? 'Minimum 5 characters required' : undefined}
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setRejectModal(null)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleReject} loading={processing} disabled={rejectReason.length < 5} className="flex-1">Reject Withdrawal</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
