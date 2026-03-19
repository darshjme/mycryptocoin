'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { endpoints } from '@/lib/endpoints';

interface CryptoReserve {
  crypto: string;
  cryptoName: string;
  totalLiabilities: string;
  totalAssets: string;
  coverageRatio: number;
  surplus: string;
  status: 'fully_covered' | 'under_covered' | 'critical';
}

interface ProofOfReserves {
  timestamp: string;
  cryptos: CryptoReserve[];
  overallStatus: 'healthy' | 'warning' | 'critical';
  lastReconciliation: string | null;
}

const token = () => typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

const STATUS_COLOR: Record<string, string> = {
  fully_covered: 'text-emerald-400', under_covered: 'text-amber-400', critical: 'text-rose-400',
  healthy: 'text-emerald-400', warning: 'text-amber-400',
};
const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger'> = {
  fully_covered: 'success', under_covered: 'warning', critical: 'danger',
};

export default function ReservesPage() {
  const [reserves, setReserves] = useState<ProofOfReserves | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconRunning, setReconRunning] = useState(false);

  const fetchReserves = useCallback(async () => {
    try {
      const res = await fetch(endpoints.security.proofOfReserves, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setReserves(data.data);
    } catch (error) {
      console.error('Failed to fetch reserves', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReserves(); }, [fetchReserves]);

  const runReconciliation = async () => {
    setReconRunning(true);
    try {
      await fetch(endpoints.security.reconciliationRun, { method: 'POST', headers: authHeaders() });
      await fetchReserves();
    } catch (error) {
      console.error('Reconciliation failed', error);
    } finally {
      setReconRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Proof of Reserves</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="glass-card p-6 animate-pulse"><div className="h-20 bg-white/5 rounded" /></div>)}
        </div>
      </div>
    );
  }

  if (!reserves) return <div className="text-white/60">Failed to load reserves data</div>;

  const totalLiabilities = reserves.cryptos.reduce((acc, c) => acc + Number(c.totalLiabilities), 0);
  const totalAssets = reserves.cryptos.reduce((acc, c) => acc + Number(c.totalAssets), 0);
  const overallCoverage = totalLiabilities > 0 ? (totalAssets / totalLiabilities * 100).toFixed(1) : '100.0';
  const discrepancyCount = reserves.cryptos.filter((c) => c.status !== 'fully_covered').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proof of Reserves</h1>
          <p className="text-sm text-white/50 mt-1">Verify total assets cover all merchant liabilities</p>
        </div>
        <div className="flex items-center gap-3">
          {reserves.lastReconciliation && (
            <span className="text-xs text-white/40">
              Last reconciliation: {new Date(reserves.lastReconciliation).toLocaleString()}
            </span>
          )}
          <Button variant="secondary" onClick={runReconciliation} loading={reconRunning} icon={<span className="material-icons text-sm">sync</span>}>
            Run Reconciliation
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`glass-card p-6 border ${
        reserves.overallStatus === 'healthy' ? 'border-emerald-500/20' : reserves.overallStatus === 'warning' ? 'border-amber-500/20' : 'border-rose-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              reserves.overallStatus === 'healthy' ? 'bg-emerald-500/15' : reserves.overallStatus === 'warning' ? 'bg-amber-500/15' : 'bg-rose-500/15'
            }`}>
              <span className={`material-icons text-2xl ${STATUS_COLOR[reserves.overallStatus]}`}>
                {reserves.overallStatus === 'healthy' ? 'verified' : reserves.overallStatus === 'warning' ? 'warning' : 'error'}
              </span>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${STATUS_COLOR[reserves.overallStatus]}`}>
                {reserves.overallStatus === 'healthy' ? 'Fully Solvent' : reserves.overallStatus === 'warning' ? 'Under-Covered' : 'CRITICAL - Assets Deficit'}
              </h3>
              <p className="text-sm text-white/50">Overall coverage: {overallCoverage}%</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">As of</p>
            <p className="text-sm text-white/60">{new Date(reserves.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Discrepancy Alerts" value={discrepancyCount} icon={<span className="material-icons text-white text-lg">warning</span>} iconColor={discrepancyCount > 0 ? 'from-rose-600 to-rose-400' : 'from-emerald-600 to-emerald-400'} />
        <StatCard label="Cryptos Tracked" value={reserves.cryptos.length} icon={<span className="material-icons text-white text-lg">currency_bitcoin</span>} iconColor="from-brand-600 to-purple-600" />
        <StatCard label="Overall Coverage" value={`${overallCoverage}%`} icon={<span className="material-icons text-white text-lg">shield</span>} iconColor="from-blue-600 to-blue-400" />
      </div>

      {/* Per-Crypto Reserves */}
      <Card>
        <CardHeader title="Reserves by Cryptocurrency" subtitle="Liabilities vs Assets per crypto" />
        <div className="space-y-4">
          {reserves.cryptos.map((crypto) => {
            const liabilities = Number(crypto.totalLiabilities);
            const assets = Number(crypto.totalAssets);
            const maxVal = Math.max(liabilities, assets, 1);
            const liabWidth = (liabilities / maxVal) * 100;
            const assetWidth = (assets / maxVal) * 100;

            return (
              <div key={crypto.crypto} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{crypto.crypto}</span>
                    <span className="text-xs text-white/40">{crypto.cryptoName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-white/70">{(crypto.coverageRatio * 100).toFixed(1)}%</span>
                    <Badge variant={STATUS_BADGE[crypto.status]} size="sm" dot>
                      {crypto.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-16">Liabilities</span>
                    <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500/40 to-amber-500/60 rounded-full transition-all" style={{ width: `${liabWidth}%` }} />
                    </div>
                    <span className="text-xs text-white/60 font-mono w-28 text-right">{Number(crypto.totalLiabilities).toFixed(6)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-16">Assets</span>
                    <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500/40 to-emerald-500/60 rounded-full transition-all" style={{ width: `${assetWidth}%` }} />
                    </div>
                    <span className="text-xs text-white/60 font-mono w-28 text-right">{Number(crypto.totalAssets).toFixed(6)}</span>
                  </div>
                </div>

                {Number(crypto.surplus) < 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="text-xs text-rose-400">Deficit: {crypto.surplus} {crypto.crypto}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
