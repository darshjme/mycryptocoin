'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { endpoints } from '@/lib/endpoints';

interface PlatformSettings {
  fees: {
    platformFeePercent: number;
    perCryptoOverrides: Record<string, number>;
  };
  withdrawals: {
    minimumAmounts: Record<string, string>;
    maximumAmounts: Record<string, Record<number, string>>;
  };
  hotWallet: {
    thresholds: Record<string, {
      hotMinAmount: string;
      hotMaxAmount: string;
      hotMaxPercent: number;
      autoSweepEnabled: boolean;
    }>;
  };
  multiSig: {
    autoApproveLimit: number;
    singleApprovalLimit: number;
    requiredApprovals: number;
    coolingPeriodHours: number;
  };
  fraud: {
    velocityMaxPerHour: number;
    velocityMaxPerDay: number;
    amountAnomalyMultiplier: number;
    autoFreezeEnabled: boolean;
    newAddressFlag: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
}

const CRYPTOS = ['BTC', 'ETH', 'USDT_ERC20', 'USDT_TRC20', 'BNB', 'SOL', 'MATIC', 'LTC', 'DOGE', 'XRP'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('fees');
  const [confirmModal, setConfirmModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Partial<PlatformSettings> | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(endpoints.security.settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = (changes: Partial<PlatformSettings>) => {
    setPendingChanges(changes);
    setConfirmModal(true);
  };

  const confirmSave = async () => {
    if (!pendingChanges) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(endpoints.security.settingsUpdate, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingChanges),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setSaveMessage({ type: 'success', text: 'Settings saved successfully' });
        setConfirmModal(false);
        setOtpCode('');
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Failed to save settings' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'fees', label: 'Fee Configuration', icon: 'percent' },
    { id: 'withdrawals', label: 'Withdrawal Limits', icon: 'account_balance_wallet' },
    { id: 'hotWallet', label: 'Hot Wallet Config', icon: 'local_fire_department' },
    { id: 'multiSig', label: 'Multi-Sig Config', icon: 'verified_user' },
    { id: 'fraud', label: 'Fraud Rules', icon: 'shield' },
    { id: 'maintenance', label: 'Maintenance', icon: 'build' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-white/5 rounded" />
                <div className="h-10 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!settings) return <div className="text-white/60">Failed to load settings</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-sm text-white/50 mt-1">Configure platform fees, limits, and security rules</p>
        </div>
      </div>

      {saveMessage && (
        <div className={`px-4 py-3 rounded-xl border ${
          saveMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSection === s.id
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
            }`}
          >
            <span className="material-icons text-lg">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'fees' && <FeeSection settings={settings} onSave={handleSave} />}
      {activeSection === 'withdrawals' && <WithdrawalSection settings={settings} onSave={handleSave} />}
      {activeSection === 'hotWallet' && <HotWalletSection settings={settings} onSave={handleSave} />}
      {activeSection === 'multiSig' && <MultiSigSection settings={settings} onSave={handleSave} />}
      {activeSection === 'fraud' && <FraudSection settings={settings} onSave={handleSave} />}
      {activeSection === 'maintenance' && <MaintenanceSection settings={settings} onSave={handleSave} />}

      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="Confirm Settings Change" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            Settings changes require 2FA confirmation. Enter your WhatsApp OTP code.
          </p>
          <Input
            label="OTP Code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setConfirmModal(false); setOtpCode(''); }} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmSave} loading={saving} disabled={otpCode.length < 6} className="flex-1">
              Confirm Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FeeSection({ settings, onSave }: { settings: PlatformSettings; onSave: (c: Partial<PlatformSettings>) => void }) {
  const [platformFee, setPlatformFee] = useState(String(settings.fees.platformFeePercent));
  const [overrides, setOverrides] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(settings.fees.perCryptoOverrides).map(([k, v]) => [k, String(v)])),
  );

  return (
    <Card>
      <CardHeader title="Fee Configuration" subtitle="Platform fees charged on each transaction" />
      <div className="space-y-6">
        <Input label="Default Platform Fee (%)" type="number" step="0.01" min="0" max="10" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} hint="Applied to all cryptos unless overridden" />
        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">Per-Crypto Overrides</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {CRYPTOS.map((c) => (
              <div key={c} className="flex flex-col gap-1">
                <span className="text-xs text-white/40">{c}</span>
                <input type="number" step="0.01" min="0" max="10" placeholder={platformFee} value={overrides[c] || ''} onChange={(e) => setOverrides((p) => ({ ...p, [c]: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 bg-white/5 border border-white/10 outline-none focus:border-brand-500/50 transition-all" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button variant="primary" onClick={() => onSave({ fees: { platformFeePercent: Number(platformFee), perCryptoOverrides: Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])) } })}>
            Save Fee Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}

function WithdrawalSection({ settings, onSave }: { settings: PlatformSettings; onSave: (c: Partial<PlatformSettings>) => void }) {
  const [minAmounts, setMinAmounts] = useState({ ...settings.withdrawals.minimumAmounts });
  const [maxAmounts, setMaxAmounts] = useState(JSON.parse(JSON.stringify(settings.withdrawals.maximumAmounts)) as Record<string, Record<number, string>>);

  return (
    <Card>
      <CardHeader title="Withdrawal Limits" subtitle="Minimum and maximum per crypto and KYC tier" />
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-white/80 mb-3">Minimum Withdrawal Amounts</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {CRYPTOS.map((c) => (
              <div key={c} className="flex flex-col gap-1">
                <span className="text-xs text-white/40">{c}</span>
                <input type="text" value={minAmounts[c] || ''} onChange={(e) => setMinAmounts((p) => ({ ...p, [c]: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-brand-500/50 transition-all" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white/80 mb-3">Maximum per Tier</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">Crypto</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">Tier 0</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">Tier 1</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">Tier 2</th>
              </tr></thead>
              <tbody>
                {CRYPTOS.map((c) => (
                  <tr key={c} className="border-b border-white/5">
                    <td className="px-3 py-2 text-sm text-white font-medium">{c}</td>
                    {[0, 1, 2].map((t) => (
                      <td key={t} className="px-3 py-2">
                        <input type="text" value={maxAmounts[c]?.[t] || ''} onChange={(e) => { const u = { ...maxAmounts }; if (!u[c]) u[c] = {}; u[c][t] = e.target.value; setMaxAmounts(u); }} className="w-full px-3 py-1.5 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-brand-500/50 transition-all" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button variant="primary" onClick={() => onSave({ withdrawals: { minimumAmounts: minAmounts, maximumAmounts: maxAmounts } })}>Save Withdrawal Limits</Button>
        </div>
      </div>
    </Card>
  );
}

function HotWalletSection({ settings, onSave }: { settings: PlatformSettings; onSave: (c: Partial<PlatformSettings>) => void }) {
  const [thresholds, setThresholds] = useState(JSON.parse(JSON.stringify(settings.hotWallet.thresholds)));
  const update = (crypto: string, field: string, value: string | boolean) => {
    setThresholds((prev: any) => ({ ...prev, [crypto]: { ...prev[crypto], [field]: value } }));
  };

  return (
    <Card>
      <CardHeader title="Hot Wallet Configuration" subtitle="Auto-sweep and balance thresholds" />
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/10">
              <th className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">Crypto</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">Min Amount</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">Max Amount</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">Max %</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-white/40 uppercase">Auto-Sweep</th>
            </tr></thead>
            <tbody>
              {CRYPTOS.map((c) => (
                <tr key={c} className="border-b border-white/5">
                  <td className="px-3 py-2 text-sm text-white font-medium">{c}</td>
                  <td className="px-3 py-2"><input type="text" value={thresholds[c]?.hotMinAmount || ''} onChange={(e) => update(c, 'hotMinAmount', e.target.value)} className="w-full px-3 py-1.5 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-brand-500/50 transition-all" /></td>
                  <td className="px-3 py-2"><input type="text" value={thresholds[c]?.hotMaxAmount || ''} onChange={(e) => update(c, 'hotMaxAmount', e.target.value)} className="w-full px-3 py-1.5 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-brand-500/50 transition-all" /></td>
                  <td className="px-3 py-2"><input type="number" min="1" max="50" value={thresholds[c]?.hotMaxPercent || 15} onChange={(e) => update(c, 'hotMaxPercent', e.target.value)} className="w-20 px-3 py-1.5 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-brand-500/50 transition-all" /></td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => update(c, 'autoSweepEnabled', !thresholds[c]?.autoSweepEnabled)} className={`relative w-11 h-6 rounded-full transition-colors ${thresholds[c]?.autoSweepEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${thresholds[c]?.autoSweepEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button variant="primary" onClick={() => onSave({ hotWallet: { thresholds } })}>Save Hot Wallet Config</Button>
        </div>
      </div>
    </Card>
  );
}

function MultiSigSection({ settings, onSave }: { settings: PlatformSettings; onSave: (c: Partial<PlatformSettings>) => void }) {
  const [config, setConfig] = useState({ ...settings.multiSig });

  return (
    <Card>
      <CardHeader title="Multi-Signature Approval" subtitle="Configure withdrawal approval thresholds" />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Auto-Approve Limit (USD)" type="number" value={String(config.autoApproveLimit)} onChange={(e) => setConfig((p) => ({ ...p, autoApproveLimit: Number(e.target.value) }))} hint="Below this: auto-approved" />
          <Input label="Single Approval Limit (USD)" type="number" value={String(config.singleApprovalLimit)} onChange={(e) => setConfig((p) => ({ ...p, singleApprovalLimit: Number(e.target.value) }))} hint="1 admin approval needed" />
          <Input label="Required Approvals" type="number" min="2" max="5" value={String(config.requiredApprovals)} onChange={(e) => setConfig((p) => ({ ...p, requiredApprovals: Number(e.target.value) }))} hint="For large withdrawals" />
          <Input label="Cooling Period (hours)" type="number" min="1" max="72" value={String(config.coolingPeriodHours)} onChange={(e) => setConfig((p) => ({ ...p, coolingPeriodHours: Number(e.target.value) }))} hint="Mandatory delay" />
        </div>
        <div className="glass-card p-4 border-amber-500/20">
          <div className="flex items-start gap-3">
            <span className="material-icons text-amber-400">info</span>
            <div className="text-sm text-white/60">
              <p className="font-medium text-amber-400 mb-1">Approval Flow</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Below ${config.autoApproveLimit.toLocaleString()}: Auto-approved</li>
                <li>${config.autoApproveLimit.toLocaleString()} - ${config.singleApprovalLimit.toLocaleString()}: 1 admin</li>
                <li>Above ${config.singleApprovalLimit.toLocaleString()}: {config.requiredApprovals} admins + {config.coolingPeriodHours}h cooling</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button variant="primary" onClick={() => onSave({ multiSig: config })}>Save Multi-Sig Config</Button>
        </div>
      </div>
    </Card>
  );
}

function FraudSection({ settings, onSave }: { settings: PlatformSettings; onSave: (c: Partial<PlatformSettings>) => void }) {
  const [config, setConfig] = useState({ ...settings.fraud });

  return (
    <Card>
      <CardHeader title="Fraud Detection Rules" subtitle="Automated monitoring and auto-freeze behavior" />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Max Withdrawals / Hour" type="number" min="1" value={String(config.velocityMaxPerHour)} onChange={(e) => setConfig((p) => ({ ...p, velocityMaxPerHour: Number(e.target.value) }))} />
          <Input label="Max Withdrawals / Day" type="number" min="1" value={String(config.velocityMaxPerDay)} onChange={(e) => setConfig((p) => ({ ...p, velocityMaxPerDay: Number(e.target.value) }))} />
          <Input label="Amount Anomaly Multiplier" type="number" step="0.5" min="1.5" value={String(config.amountAnomalyMultiplier)} onChange={(e) => setConfig((p) => ({ ...p, amountAnomalyMultiplier: Number(e.target.value) }))} hint="Alert if > Nx average" />
        </div>
        <div className="space-y-3">
          <ToggleRow label="Auto-Freeze on Critical Alerts" description="Automatically freeze accounts that trigger critical fraud alerts" enabled={config.autoFreezeEnabled} onChange={(v) => setConfig((p) => ({ ...p, autoFreezeEnabled: v }))} />
          <ToggleRow label="Flag New Withdrawal Addresses" description="Flag first-time withdrawal addresses for review" enabled={config.newAddressFlag} onChange={(v) => setConfig((p) => ({ ...p, newAddressFlag: v }))} />
        </div>
        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button variant="primary" onClick={() => onSave({ fraud: config })}>Save Fraud Rules</Button>
        </div>
      </div>
    </Card>
  );
}

function MaintenanceSection({ settings, onSave }: { settings: PlatformSettings; onSave: (c: Partial<PlatformSettings>) => void }) {
  const [enabled, setEnabled] = useState(settings.maintenance.enabled);
  const [message, setMessage] = useState(settings.maintenance.message);

  return (
    <Card>
      <CardHeader title="Maintenance Mode" subtitle="Temporarily disable the platform" />
      <div className="space-y-6">
        <ToggleRow label="Maintenance Mode" description="When enabled, new payments are rejected" enabled={enabled} onChange={setEnabled} />
        <Input label="Maintenance Message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="System is under maintenance..." />
        {enabled && (
          <div className="glass-card p-4 border-rose-500/20">
            <div className="flex items-center gap-3">
              <span className="material-icons text-rose-400">warning</span>
              <p className="text-sm text-rose-400">Maintenance mode is ACTIVE.</p>
            </div>
          </div>
        )}
        <div className="flex justify-end pt-4 border-t border-white/5">
          <Button variant={enabled ? 'danger' : 'primary'} onClick={() => onSave({ maintenance: { enabled, message } })}>
            {enabled ? 'Save & Enable Maintenance' : 'Save Maintenance Settings'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ToggleRow({ label, description, enabled, onChange }: { label: string; description: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange(!enabled)} className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-white/20'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}
