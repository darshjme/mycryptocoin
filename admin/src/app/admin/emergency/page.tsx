'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { endpoints } from '@/lib/endpoints';

interface CryptoFreeze {
  crypto: string;
  frozen: boolean;
  frozenAt: string | null;
  frozenBy: string | null;
  reason: string | null;
}

interface MerchantFreeze {
  merchantId: string;
  merchantName: string;
  frozen: boolean;
  frozenAt: string | null;
  frozenBy: string | null;
  reason: string | null;
}

interface FreezeStatus {
  globalFreeze: boolean;
  globalFreezeAt: string | null;
  globalFreezeBy: string | null;
  globalFreezeReason: string | null;
  cryptoFreezes: CryptoFreeze[];
  merchantFreezes: MerchantFreeze[];
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  maintenanceSince: string | null;
}

const token = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

export default function EmergencyPage() {
  const [status, setStatus] = useState<FreezeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState<{ action: string; payload: any } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [merchantFreezeId, setMerchantFreezeId] = useState('');
  const [merchantFreezeReason, setMerchantFreezeReason] = useState('');
  const [cryptoFreezeReason, setCryptoFreezeReason] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(endpoints.security.emergencyStatus, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch (error) {
      console.error('Failed to fetch freeze status', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const executeAction = async (url: string, body: any) => {
    setProcessing(true);
    try {
      await fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      await fetchStatus();
      setOtpModal(null);
      setOtpCode('');
      setFreezeReason('');
    } catch (error) {
      console.error('Emergency action failed', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleGlobalFreeze = () => {
    if (status?.globalFreeze) {
      setOtpModal({ action: 'unfreeze_global', payload: { action: 'unfreeze' } });
    } else {
      setOtpModal({ action: 'freeze_global', payload: { reason: freezeReason } });
    }
  };

  const handleCryptoFreeze = (crypto: string, currentlyFrozen: boolean) => {
    if (currentlyFrozen) {
      setOtpModal({ action: 'unfreeze_crypto', payload: { action: 'unfreeze', crypto } });
    } else {
      setOtpModal({ action: 'freeze_crypto', payload: { reason: cryptoFreezeReason, crypto } });
    }
  };

  const handleMerchantFreeze = (merchantId: string, currentlyFrozen: boolean) => {
    if (currentlyFrozen) {
      setOtpModal({ action: 'unfreeze_merchant', payload: { action: 'unfreeze', merchantId } });
    } else {
      setOtpModal({ action: 'freeze_merchant', payload: { reason: merchantFreezeReason, merchantId } });
    }
  };

  const confirmAction = async () => {
    if (!otpModal) return;
    const { action, payload } = otpModal;

    switch (action) {
      case 'freeze_global':
        await executeAction(endpoints.security.freezeGlobal, { reason: payload.reason });
        break;
      case 'unfreeze_global':
        await executeAction(endpoints.security.freezeGlobal, { action: 'unfreeze' });
        break;
      case 'freeze_crypto':
        await executeAction(endpoints.security.freezeCrypto(payload.crypto), { reason: payload.reason });
        break;
      case 'unfreeze_crypto':
        await executeAction(endpoints.security.freezeCrypto(payload.crypto), { action: 'unfreeze' });
        break;
      case 'freeze_merchant':
        await executeAction(endpoints.security.freezeMerchant(payload.merchantId), { reason: payload.reason });
        break;
      case 'unfreeze_merchant':
        await executeAction(endpoints.security.freezeMerchant(payload.merchantId), { action: 'unfreeze' });
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Emergency Controls</h1>
        <div className="glass-card p-12 animate-pulse"><div className="h-20 bg-white/5 rounded" /></div>
      </div>
    );
  }

  if (!status) return <div className="text-white/60">Failed to load emergency status</div>;

  const anyFreezeActive = status.globalFreeze || status.cryptoFreezes.some((c) => c.frozen) || status.merchantFreezes.length > 0 || status.maintenanceMode;

  return (
    <div className="space-y-6">
      {/* Active Freeze Banner */}
      {anyFreezeActive && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="material-icons text-rose-400 text-2xl">warning</span>
            <div>
              <p className="text-rose-400 font-bold text-lg">FREEZE ACTIVE</p>
              <p className="text-rose-400/70 text-sm">
                {status.globalFreeze && 'Global withdrawal freeze is active. '}
                {status.cryptoFreezes.filter((c) => c.frozen).length > 0 && `${status.cryptoFreezes.filter((c) => c.frozen).map((c) => c.crypto).join(', ')} frozen. `}
                {status.merchantFreezes.length > 0 && `${status.merchantFreezes.length} merchants frozen. `}
                {status.maintenanceMode && 'Maintenance mode active.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Emergency Controls</h1>
        <p className="text-sm text-white/50 mt-1">Critical system controls — all actions require WhatsApp OTP</p>
      </div>

      {/* GLOBAL FREEZE — BIG RED BUTTON */}
      <Card className={`${status.globalFreeze ? 'border-rose-500/30' : 'border-white/5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${status.globalFreeze ? 'bg-rose-500/20' : 'bg-white/5'}`}>
              <span className={`material-icons text-3xl ${status.globalFreeze ? 'text-rose-400' : 'text-white/40'}`}>
                {status.globalFreeze ? 'lock' : 'lock_open'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Global Freeze</h2>
              <p className="text-sm text-white/50">Halt ALL withdrawals across the entire platform instantly</p>
              {status.globalFreeze && (
                <div className="mt-2">
                  <Badge variant="danger" dot>ACTIVE since {new Date(status.globalFreezeAt!).toLocaleString()}</Badge>
                  {status.globalFreezeReason && <p className="text-xs text-rose-400/70 mt-1">Reason: {status.globalFreezeReason}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {!status.globalFreeze && (
              <Input
                placeholder="Reason for freeze..."
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-64"
              />
            )}
            <button
              onClick={handleGlobalFreeze}
              disabled={!status.globalFreeze && freezeReason.length < 3}
              className={`
                px-8 py-4 rounded-2xl text-lg font-bold transition-all
                ${status.globalFreeze
                  ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-rose-600 text-white border-2 border-rose-500 hover:bg-rose-700 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                }
              `}
            >
              {status.globalFreeze ? 'DEACTIVATE GLOBAL FREEZE' : 'ACTIVATE GLOBAL FREEZE'}
            </button>
          </div>
        </div>
      </Card>

      {/* Per-Crypto Freeze */}
      <Card>
        <CardHeader title="Per-Crypto Freeze" subtitle="Halt operations for specific cryptocurrencies" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {status.cryptoFreezes.map((cf) => (
            <div key={cf.crypto} className={`p-4 rounded-xl border ${cf.frozen ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/[0.02] border-white/5'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{cf.crypto}</span>
                  {cf.frozen ? (
                    <Badge variant="danger" dot size="sm">FROZEN</Badge>
                  ) : (
                    <Badge variant="success" dot size="sm">Active</Badge>
                  )}
                </div>
                <button
                  onClick={() => handleCryptoFreeze(cf.crypto, cf.frozen)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    cf.frozen
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  }`}
                >
                  {cf.frozen ? 'Unfreeze' : 'Freeze'}
                </button>
              </div>
              {cf.frozen && cf.reason && <p className="text-xs text-rose-400/60">{cf.reason}</p>}
              {cf.frozen && cf.frozenAt && <p className="text-xs text-white/30 mt-1">Since: {new Date(cf.frozenAt).toLocaleString()}</p>}
            </div>
          ))}
        </div>
        {!status.cryptoFreezes.some((c) => c.frozen) && (
          <div className="mt-4">
            <Input placeholder="Reason for crypto freeze..." value={cryptoFreezeReason} onChange={(e) => setCryptoFreezeReason(e.target.value)} />
          </div>
        )}
      </Card>

      {/* Per-Merchant Freeze */}
      <Card>
        <CardHeader title="Merchant Freezes" subtitle="Currently frozen merchant accounts" />
        {status.merchantFreezes.length > 0 ? (
          <div className="space-y-3">
            {status.merchantFreezes.map((mf) => (
              <div key={mf.merchantId} className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                <div>
                  <p className="text-white font-medium">{mf.merchantName}</p>
                  <p className="text-xs text-rose-400/60">{mf.reason}</p>
                  {mf.frozenAt && <p className="text-xs text-white/30">Since: {new Date(mf.frozenAt).toLocaleString()}</p>}
                </div>
                <Button variant="success" size="sm" onClick={() => handleMerchantFreeze(mf.merchantId, true)}>Unfreeze</Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm">No merchants are currently frozen</p>
        )}
        <div className="mt-4 flex gap-3">
          <Input placeholder="Merchant ID" value={merchantFreezeId} onChange={(e) => setMerchantFreezeId(e.target.value)} className="flex-1" />
          <Input placeholder="Reason" value={merchantFreezeReason} onChange={(e) => setMerchantFreezeReason(e.target.value)} className="flex-1" />
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleMerchantFreeze(merchantFreezeId, false)}
            disabled={!merchantFreezeId || merchantFreezeReason.length < 3}
          >
            Freeze Merchant
          </Button>
        </div>
      </Card>

      {/* Maintenance Mode */}
      <Card className={status.maintenanceMode ? 'border-amber-500/20' : ''}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.maintenanceMode ? 'bg-amber-500/20' : 'bg-white/5'}`}>
              <span className={`material-icons text-xl ${status.maintenanceMode ? 'text-amber-400' : 'text-white/40'}`}>build</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Maintenance Mode</h3>
              <p className="text-sm text-white/50">Gracefully stop accepting new payments</p>
              {status.maintenanceMode && (
                <div className="mt-1">
                  <Badge variant="warning" dot>Active since {status.maintenanceSince ? new Date(status.maintenanceSince).toLocaleString() : 'Unknown'}</Badge>
                  {status.maintenanceMessage && <p className="text-xs text-amber-400/60 mt-1">{status.maintenanceMessage}</p>}
                </div>
              )}
            </div>
          </div>
          <Badge variant={status.maintenanceMode ? 'warning' : 'success'} size="sm" dot>
            {status.maintenanceMode ? 'ACTIVE' : 'Inactive'}
          </Badge>
        </div>
      </Card>

      {/* OTP Confirmation Modal */}
      <Modal isOpen={!!otpModal} onClose={() => { setOtpModal(null); setOtpCode(''); }} title="WhatsApp OTP Confirmation" size="sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons text-amber-400">security</span>
              <span className="text-sm font-medium text-amber-400">2FA Required</span>
            </div>
            <p className="text-sm text-white/60">
              This emergency action requires WhatsApp OTP verification. A code has been sent to your registered number.
            </p>
          </div>
          <Input
            label="OTP Code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setOtpModal(null); setOtpCode(''); }} className="flex-1">Cancel</Button>
            <Button
              variant={otpModal?.action.includes('unfreeze') ? 'success' : 'danger'}
              onClick={confirmAction}
              loading={processing}
              disabled={otpCode.length < 6}
              className="flex-1"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
