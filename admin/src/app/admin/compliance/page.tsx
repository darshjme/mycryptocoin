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

interface KYCSubmission {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  currentTier: number;
  requestedTier: number;
  status: string;
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    verified: boolean;
  }>;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
}

const token = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const TIER_LABELS: Record<number, string> = { 0: 'Unverified ($1K)', 1: 'Basic ($10K)', 2: 'Full (Unlimited)' };
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  approved: 'success', pending_review: 'warning', under_review: 'info', rejected: 'danger',
  expired: 'danger', not_submitted: 'neutral', additional_info_required: 'warning',
};

export default function CompliancePage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [reviewModal, setReviewModal] = useState<KYCSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_info'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requirements, setRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (activeFilter) params.set('status', activeFilter);
      const res = await fetch(`${endpoints.security.complianceMerchants}?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data.submissions);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch KYC queue', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const body: any = { action: reviewAction, notes: reviewNotes };
      if (reviewAction === 'reject') body.reason = rejectionReason;
      if (reviewAction === 'request_info') body.requirements = requirements;

      await fetch(endpoints.security.complianceMerchant(reviewModal.id), {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
      });
      setReviewModal(null);
      setReviewNotes('');
      setRejectionReason('');
      setRequirements('');
      fetchSubmissions();
    } catch (error) {
      console.error('Review action failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending_review').length;

  const columns = [
    { key: 'merchantName', label: 'Merchant', sortable: true, render: (v: unknown, row: KYCSubmission) => (
      <div>
        <p className="text-white font-medium">{row.merchantName}</p>
        <p className="text-xs text-white/40">{row.merchantEmail}</p>
      </div>
    )},
    { key: 'currentTier', label: 'Current Tier', render: (v: unknown) => <span className="text-white/70 text-sm">{TIER_LABELS[Number(v)] || `Tier ${v}`}</span> },
    { key: 'requestedTier', label: 'Requested', render: (v: unknown) => <Badge variant="info" size="sm">{TIER_LABELS[Number(v)] || `Tier ${v}`}</Badge> },
    { key: 'status', label: 'Status', render: (v: unknown) => <Badge variant={STATUS_VARIANT[String(v)] || 'neutral'} dot size="sm">{String(v).replace(/_/g, ' ')}</Badge> },
    { key: 'documents', label: 'Documents', render: (_v: unknown, row: KYCSubmission) => <span className="text-white/60 text-sm">{row.documents.length} files</span> },
    { key: 'submittedAt', label: 'Submitted', sortable: true, render: (v: unknown) => <span className="text-white/50 text-xs">{new Date(String(v)).toLocaleDateString()}</span> },
    { key: 'id', label: 'Action', align: 'right' as const, render: (_v: unknown, row: KYCSubmission) => (
      <Button variant="secondary" size="sm" onClick={() => { setReviewModal(row); setReviewAction('approve'); }}>Review</Button>
    )},
  ];

  const filters = [
    { value: '', label: 'All' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">KYC / AML Compliance</h1>
        <p className="text-sm text-white/50 mt-1">Review merchant verification and manage compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pending Reviews" value={pendingCount} icon={<span className="material-icons text-white text-lg">pending_actions</span>} iconColor="from-amber-600 to-amber-400" />
        <StatCard label="Total Submissions" value={total} icon={<span className="material-icons text-white text-lg">description</span>} iconColor="from-blue-600 to-blue-400" />
        <StatCard label="Approved This Month" value={submissions.filter((s) => s.status === 'approved').length} icon={<span className="material-icons text-white text-lg">verified</span>} iconColor="from-emerald-600 to-emerald-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.value} onClick={() => { setActiveFilter(f.value); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeFilter === f.value ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card padding="none">
        <div className="p-6 pb-0"><CardHeader title="KYC Review Queue" subtitle={`${total} submissions`} /></div>
        <Table columns={columns} data={submissions as any[]} loading={loading} emptyMessage="No submissions found" pagination={{ page, totalPages: Math.ceil(total / 20), total, onPageChange: setPage }} />
      </Card>

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title={`Review: ${reviewModal?.merchantName}`} size="lg">
        {reviewModal && (
          <div className="space-y-6">
            {/* Merchant Info */}
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-white/40">Email</p><p className="text-sm text-white">{reviewModal.merchantEmail}</p></div>
              <div><p className="text-xs text-white/40">Current Tier</p><p className="text-sm text-white">{TIER_LABELS[reviewModal.currentTier]}</p></div>
              <div><p className="text-xs text-white/40">Requested Tier</p><p className="text-sm text-white">{TIER_LABELS[reviewModal.requestedTier]}</p></div>
              <div><p className="text-xs text-white/40">Submitted</p><p className="text-sm text-white">{new Date(reviewModal.submittedAt).toLocaleString()}</p></div>
            </div>

            {/* Documents */}
            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-2">Submitted Documents</h4>
              <div className="space-y-2">
                {reviewModal.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-white/40">description</span>
                      <div>
                        <p className="text-sm text-white">{doc.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-white/40">{doc.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.verified ? <Badge variant="success" size="sm">Verified</Badge> : <Badge variant="neutral" size="sm">Unverified</Badge>}
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 text-xs hover:underline">View</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Tabs */}
            <div className="flex gap-2">
              {(['approve', 'reject', 'request_info'] as const).map((a) => (
                <button key={a} onClick={() => setReviewAction(a)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${reviewAction === a ? (a === 'approve' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : a === 'reject' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30') : 'bg-white/5 text-white/50 border border-white/10'}`}>
                  {a === 'approve' ? 'Approve' : a === 'reject' ? 'Reject' : 'Request Info'}
                </button>
              ))}
            </div>

            {reviewAction === 'approve' && <Input label="Notes (optional)" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Approval notes..." />}
            {reviewAction === 'reject' && (
              <>
                <Input label="Rejection Reason (required)" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." error={rejectionReason.length > 0 && rejectionReason.length < 5 ? 'Min 5 characters' : undefined} />
                <Input label="Notes" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Additional notes..." />
              </>
            )}
            {reviewAction === 'request_info' && <Input label="Required Information" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Describe what additional documents or info is needed..." />}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setReviewModal(null)} className="flex-1">Cancel</Button>
              <Button
                variant={reviewAction === 'approve' ? 'success' : reviewAction === 'reject' ? 'danger' : 'primary'}
                onClick={handleReview}
                loading={submitting}
                disabled={reviewAction === 'reject' && rejectionReason.length < 5}
                className="flex-1"
              >
                {reviewAction === 'approve' ? 'Approve KYC' : reviewAction === 'reject' ? 'Reject KYC' : 'Request Info'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
