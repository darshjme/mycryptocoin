'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

interface ApprovalActionsProps {
  merchantId: string;
  merchantName: string;
  status: 'active' | 'suspended' | 'pending';
  onApprove: (id: string) => Promise<boolean>;
  onSuspend: (id: string, reason?: string) => Promise<boolean>;
  onActivate: (id: string) => Promise<boolean>;
}

export default function ApprovalActions({
  merchantId,
  merchantName,
  status,
  onApprove,
  onSuspend,
  onActivate,
}: ApprovalActionsProps) {
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(merchantId);
    setLoading(false);
    setShowApproveModal(false);
  };

  const handleSuspend = async () => {
    setLoading(true);
    await onSuspend(merchantId, suspendReason);
    setLoading(false);
    setShowSuspendModal(false);
    setSuspendReason('');
  };

  const handleActivate = async () => {
    setLoading(true);
    await onActivate(merchantId);
    setLoading(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {status === 'pending' && (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowApproveModal(true)}
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
              onClick={() => setShowSuspendModal(true)}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              }
            >
              Reject
            </Button>
          </>
        )}

        {status === 'active' && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowSuspendModal(true)}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            }
          >
            Suspend
          </Button>
        )}

        {status === 'suspended' && (
          <Button
            variant="success"
            size="sm"
            onClick={handleActivate}
            loading={loading}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            }
          >
            Reactivate
          </Button>
        )}
      </div>

      {/* Approve Modal */}
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve Merchant">
        <div className="space-y-4">
          <p className="text-white/60">
            Are you sure you want to approve <span className="text-white font-semibold">{merchantName}</span>?
            They will be able to create payment links and receive crypto payments.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleApprove} loading={loading}>
              Approve Merchant
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal isOpen={showSuspendModal} onClose={() => setShowSuspendModal(false)} title="Suspend Merchant">
        <div className="space-y-4">
          <p className="text-white/60">
            Suspending <span className="text-white font-semibold">{merchantName}</span> will immediately
            disable their API access and pause all pending payments.
          </p>
          <Input
            label="Reason for suspension"
            placeholder="Enter reason..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowSuspendModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSuspend} loading={loading}>
              Suspend Merchant
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
