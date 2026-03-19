'use client';

import React, { useState } from 'react';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import Badge, { getStatusVariant } from '@/components/ui/Badge';

export default function WithdrawalsPage() {
  const { withdrawals, loading, processing, approveWithdrawal, rejectWithdrawal, updateFilters } = useWithdrawals();
  const [statusFilter, setStatusFilter] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);

  const filtered = statusFilter ? withdrawals.filter((w) => w.status === statusFilter) : withdrawals;

  const pendingCount = withdrawals.filter((w) => w.status === 'pending_approval').length;
  const totalPendingUsd = withdrawals.filter((w) => w.status === 'pending_approval').reduce((sum, w) => sum + w.amountUsd, 0);

  const handleApprove = async (id: string) => {
    await approveWithdrawal(id);
    setShowApproveModal(null);
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    await rejectWithdrawal(id, rejectReason);
    setShowRejectModal(null);
    setRejectReason('');
  };

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
          <p className="text-sm text-slate-400 mt-1">Manage withdrawal requests from merchants</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <span className="material-icons text-rose-400 text-lg">priority_high</span>
            <span className="text-sm text-rose-300">
              <strong>{pendingCount}</strong> pending approval (${totalPendingUsd.toLocaleString()})
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="cz-tabs mb-6 inline-flex">
        {[
          { label: 'All', value: '', count: withdrawals.length },
          { label: 'Pending Approval', value: 'pending_approval', count: withdrawals.filter((w) => w.status === 'pending_approval').length },
          { label: 'Processing', value: 'processing', count: withdrawals.filter((w) => w.status === 'processing').length },
          { label: 'Completed', value: 'completed', count: withdrawals.filter((w) => w.status === 'completed').length },
          { label: 'Rejected', value: 'rejected', count: withdrawals.filter((w) => w.status === 'rejected').length },
          { label: 'Failed', value: 'failed', count: withdrawals.filter((w) => w.status === 'failed').length },
        ].map((tab) => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)} className={`cz-tab ${statusFilter === tab.value ? 'active' : ''}`}>
            {tab.label}
            {tab.count > 0 && <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <div className="cz-card overflow-hidden">
        <table className="cz-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Merchant</th>
              <th>Crypto</th>
              <th className="text-right">Amount</th>
              <th className="text-right">USD Value</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Requested</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j}><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-slate-500">No withdrawals found</td></tr>
            ) : (
              filtered.map((wd) => (
                <tr key={wd.id}>
                  <td className="font-mono text-xs text-slate-400">{wd.id}</td>
                  <td className="text-white font-medium">{wd.merchantName}</td>
                  <td>
                    <span className="text-sm font-bold" style={{ color: { BTC: '#f59e0b', ETH: '#818cf8', USDT: '#10b981', SOL: '#e879f9' }[wd.crypto] || '#fff' }}>
                      {wd.crypto}
                    </span>
                  </td>
                  <td className="text-right text-white font-medium">{wd.amount} {wd.crypto}</td>
                  <td className="text-right text-slate-400">${wd.amountUsd.toLocaleString()}</td>
                  <td>
                    <span className="text-xs text-slate-400 font-mono truncate block max-w-[140px]" title={wd.destinationAddress}>
                      {wd.destinationAddress}
                    </span>
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(wd.status)} dot size="sm">
                      {wd.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </td>
                  <td className="text-slate-400 text-sm whitespace-nowrap">
                    {new Date(wd.requestedAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      {wd.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApprove(wd.id)}
                            disabled={processing === wd.id}
                            className="cz-btn-success cz-btn-xs"
                          >
                            {processing === wd.id ? (
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <span className="material-icons text-sm">check</span>
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => { setShowRejectModal(wd.id); setRejectReason(''); }}
                            className="cz-btn-danger cz-btn-xs"
                          >
                            <span className="material-icons text-sm">close</span>
                            Reject
                          </button>
                        </>
                      )}
                      {wd.txHash && (
                        <span className="text-xs text-slate-500 font-mono" title={wd.txHash}>
                          {wd.txHash.substring(0, 10)}...
                        </span>
                      )}
                      {wd.adminNote && (
                        <span className="material-icons text-sm text-slate-500 cursor-help" title={wd.adminNote}>info</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(null)} />
          <div className="relative cz-card p-6 w-full max-w-md animate-in">
            <h3 className="text-lg font-semibold text-white mb-4">Reject Withdrawal</h3>
            <p className="text-sm text-slate-400 mb-4">Please provide a reason for rejecting this withdrawal.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection..."
              className="cz-input resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(null)} className="cz-btn-outline">Cancel</button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason.trim() || processing === showRejectModal}
                className="cz-btn-danger"
              >
                Reject Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
