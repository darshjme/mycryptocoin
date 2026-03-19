'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import type { Withdrawal } from '@/lib/api';

interface WithdrawalQueueProps {
  withdrawals: Withdrawal[];
  processing: string | null;
  onApprove: (id: string, note?: string) => Promise<boolean>;
  onReject: (id: string, reason: string) => Promise<boolean>;
}

export default function WithdrawalQueue({
  withdrawals,
  processing,
  onApprove,
  onReject,
}: WithdrawalQueueProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNote, setApproveNote] = useState('');

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending_approval');

  const handleApprove = async () => {
    if (!selectedId) return;
    await onApprove(selectedId, approveNote || undefined);
    setShowApproveModal(false);
    setSelectedId(null);
    setApproveNote('');
  };

  const handleReject = async () => {
    if (!selectedId || !rejectReason.trim()) return;
    await onReject(selectedId, rejectReason);
    setShowRejectModal(false);
    setSelectedId(null);
    setRejectReason('');
  };

  if (pendingWithdrawals.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pending Approvals</h3>
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <p className="text-white/40">No pending withdrawals</p>
          <p className="text-xs text-white/20 mt-1">All withdrawal requests have been processed</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Pending Approvals</h3>
          <Badge variant="warning" dot>
            {pendingWithdrawals.length} pending
          </Badge>
        </div>

        <div className="space-y-3">
          {pendingWithdrawals.map((wd) => (
            <div
              key={wd.id}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-brand-300">
                    {wd.crypto}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{wd.merchantName}</p>
                    <p className="text-xs text-white/30">
                      {new Date(wd.requestedAt).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {wd.amount} {wd.crypto}
                  </p>
                  <p className="text-xs text-white/30">${wd.amountUsd.toLocaleString()}</p>
                </div>
              </div>

              {/* Destination */}
              <div className="mb-3 p-2 rounded-lg bg-white/[0.02]">
                <p className="text-xs text-white/30 mb-0.5">Destination Address</p>
                <p className="text-xs text-white/60 font-mono truncate">{wd.destinationAddress}</p>
              </div>

              {/* Fee */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-white/30">Network Fee</span>
                <span className="text-white/50">
                  {wd.fee} {wd.crypto}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="success"
                  size="sm"
                  className="flex-1"
                  loading={processing === wd.id}
                  onClick={() => {
                    setSelectedId(wd.id);
                    setShowApproveModal(true);
                  }}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedId(wd.id);
                    setShowRejectModal(true);
                  }}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approve Modal */}
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve Withdrawal">
        <div className="space-y-4">
          <p className="text-white/60">
            Confirm approval of this withdrawal. The transaction will be processed immediately.
          </p>
          <Input
            label="Admin Note (optional)"
            placeholder="Add a note..."
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowApproveModal(false)}>Cancel</Button>
            <Button variant="success" onClick={handleApprove} loading={processing === selectedId}>
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Withdrawal">
        <div className="space-y-4">
          <p className="text-white/60">
            Please provide a reason for rejecting this withdrawal request.
          </p>
          <Input
            label="Rejection Reason"
            placeholder="Enter reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            error={!rejectReason.trim() ? 'Reason is required' : undefined}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              loading={processing === selectedId}
            >
              Reject Withdrawal
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
