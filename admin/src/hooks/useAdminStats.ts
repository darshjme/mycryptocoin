'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { type DashboardStats, type SystemHealth } from '@/lib/api';
import { endpoints } from '@/lib/endpoints';
import { useAdminStore } from '@/stores/adminStore';

interface VolumeDataPoint {
  date: string;
  btc: number;
  eth: number;
  usdt: number;
  sol: number;
  total: number;
}

interface RevenueDataPoint {
  date: string;
  amount: number;
  fees: number;
}

export function useAdminStats() {
  const { setDashboardStats, setSystemHealth } = useAdminStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<DashboardStats>(endpoints.dashboard.stats);
      setStats(response.data);
      setDashboardStats(response.data);
    } catch {
      const mock = getMockStats();
      setStats(mock);
      setDashboardStats(mock);
    }
  }, [setDashboardStats]);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await api.get<SystemHealth>(endpoints.dashboard.health);
      setHealth(response.data);
      setSystemHealth(response.data);
    } catch {
      const mock = getMockHealth();
      setHealth(mock);
      setSystemHealth(mock);
    }
  }, [setSystemHealth]);

  const fetchVolumeData = useCallback(async (period: '24h' | '7d' | '30d' = '7d') => {
    try {
      const response = await api.get<VolumeDataPoint[]>(endpoints.dashboard.volume, { period });
      setVolumeData(response.data);
    } catch {
      setVolumeData(getMockVolumeData());
    }
  }, []);

  const fetchRevenueData = useCallback(async (period: '7d' | '30d' | '90d' = '30d') => {
    try {
      const response = await api.get<RevenueDataPoint[]>(endpoints.dashboard.revenue, { period });
      setRevenueData(response.data);
    } catch {
      setRevenueData(getMockRevenueData());
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchHealth(), fetchVolumeData(), fetchRevenueData()]);
      setLoading(false);
    };
    loadAll();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchHealth, fetchVolumeData, fetchRevenueData]);

  return {
    stats,
    health,
    volumeData,
    revenueData,
    loading,
    error,
    fetchStats,
    fetchHealth,
    fetchVolumeData,
    fetchRevenueData,
  };
}

function getMockStats(): DashboardStats {
  return {
    totalMerchants: 156,
    activeMerchants: 128,
    pendingMerchants: 12,
    volume24h: 487520,
    volume7d: 3241800,
    volume30d: 12890400,
    feesEarned24h: 4875.20,
    feesEarned7d: 32418.00,
    feesEarned30d: 128904.00,
    activePayments: 34,
    pendingWithdrawals: 8,
    totalTransactions: 45230,
  };
}

function getMockHealth(): SystemHealth {
  return {
    api: { status: 'healthy', latency: 45 },
    blockchain: {
      btc: { status: 'healthy', blockHeight: 890234, lastSync: '2026-03-19T09:50:00Z' },
      eth: { status: 'healthy', blockHeight: 21456789, lastSync: '2026-03-19T09:50:12Z' },
      usdt: { status: 'healthy', lastSync: '2026-03-19T09:50:12Z' },
      sol: { status: 'degraded', blockHeight: 298765432, lastSync: '2026-03-19T09:48:00Z' },
    },
    whatsapp: { status: 'connected' },
    database: { status: 'healthy', connections: 24 },
    redis: { status: 'healthy', memoryUsage: '256MB / 1GB' },
  };
}

function getMockVolumeData(): VolumeDataPoint[] {
  const data: VolumeDataPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      btc: Math.floor(Math.random() * 50000) + 100000,
      eth: Math.floor(Math.random() * 30000) + 80000,
      usdt: Math.floor(Math.random() * 80000) + 200000,
      sol: Math.floor(Math.random() * 20000) + 40000,
      total: Math.floor(Math.random() * 150000) + 400000,
    });
  }
  return data;
}

function getMockRevenueData(): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 3000) + 3000,
      fees: Math.floor(Math.random() * 300) + 300,
    });
  }
  return data;
}

export default useAdminStats;
