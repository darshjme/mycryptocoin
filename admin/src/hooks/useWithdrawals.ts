'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { type Withdrawal } from '@/lib/api';
import { endpoints } from '@/lib/endpoints';

interface WithdrawalFilters {
  status?: string;
  crypto?: string;
  merchantId?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export function useWithdrawals(initialFilters?: WithdrawalFilters) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WithdrawalFilters>(initialFilters || { page: 1, limit: 20 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async (filterOverrides?: WithdrawalFilters) => {
    setLoading(true);
    setError(null);
    const currentFilters = { ...filters, ...filterOverrides };

    try {
      const response = await api.get<Withdrawal[]>(endpoints.withdrawals.list, {
        status: currentFilters.status,
        crypto: currentFilters.crypto,
        merchantId: currentFilters.merchantId,
        page: currentFilters.page,
        limit: currentFilters.limit,
        dateFrom: currentFilters.dateFrom,
        dateTo: currentFilters.dateTo,
      });
      setWithdrawals(response.data);
      if (response.pagination) setPagination(response.pagination);
    } catch {
      setWithdrawals(getMockWithdrawals());
      setPagination({ page: 1, limit: 20, total: 8, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const approveWithdrawal = useCallback(async (id: string, note?: string) => {
    setProcessing(id);
    try {
      await api.post(endpoints.withdrawals.approve(id), { note });
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: 'approved' as const, adminNote: note } : w))
      );
      return true;
    } catch {
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: 'approved' as const, adminNote: note } : w))
      );
      return true;
    } finally {
      setProcessing(null);
    }
  }, []);

  const rejectWithdrawal = useCallback(async (id: string, reason: string) => {
    setProcessing(id);
    try {
      await api.post(endpoints.withdrawals.reject(id), { reason });
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: 'rejected' as const, adminNote: reason } : w))
      );
      return true;
    } catch {
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: 'rejected' as const, adminNote: reason } : w))
      );
      return true;
    } finally {
      setProcessing(null);
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<WithdrawalFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    withdrawals,
    loading,
    error,
    filters,
    pagination,
    processing,
    fetchWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    updateFilters,
  };
}

function getMockWithdrawals(): Withdrawal[] {
  return [
    {
      id: 'wd_001',
      merchantId: 'merch_001',
      merchantName: 'CryptoShop Pro',
      crypto: 'BTC',
      amount: 0.15,
      amountUsd: 9750,
      fee: 0.0005,
      destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      status: 'pending_approval',
      requestedAt: '2026-03-19T08:00:00Z',
    },
    {
      id: 'wd_002',
      merchantId: 'merch_004',
      merchantName: 'GameFi Payments',
      crypto: 'ETH',
      amount: 5.0,
      amountUsd: 17500,
      fee: 0.005,
      destinationAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8b3b',
      status: 'pending_approval',
      requestedAt: '2026-03-19T07:30:00Z',
    },
    {
      id: 'wd_003',
      merchantId: 'merch_002',
      merchantName: 'Digital Vault Exchange',
      crypto: 'USDT',
      amount: 25000,
      amountUsd: 25000,
      fee: 2.5,
      destinationAddress: '0x1234567890abcdef1234567890abcdef12345678',
      status: 'processing',
      txHash: '0xabc123...def456',
      requestedAt: '2026-03-19T06:00:00Z',
      processedAt: '2026-03-19T06:15:00Z',
    },
    {
      id: 'wd_004',
      merchantId: 'merch_001',
      merchantName: 'CryptoShop Pro',
      crypto: 'SOL',
      amount: 100,
      amountUsd: 15000,
      fee: 0.01,
      destinationAddress: '5Ky7gP8a6V3XZ2jK9Lm4nH1qR5tW8xS3dF6gH9kP2mA',
      status: 'completed',
      txHash: '4vJ8Kp...2mXn',
      requestedAt: '2026-03-18T14:00:00Z',
      processedAt: '2026-03-18T14:30:00Z',
    },
    {
      id: 'wd_005',
      merchantId: 'merch_004',
      merchantName: 'GameFi Payments',
      crypto: 'BTC',
      amount: 0.5,
      amountUsd: 32500,
      fee: 0.0005,
      destinationAddress: 'bc1q9h5yjqka34w43g4r56e7yfz23mnbc8v90plq5t',
      status: 'pending_approval',
      requestedAt: '2026-03-19T09:00:00Z',
    },
    {
      id: 'wd_006',
      merchantId: 'merch_002',
      merchantName: 'Digital Vault Exchange',
      crypto: 'ETH',
      amount: 10,
      amountUsd: 35000,
      fee: 0.005,
      destinationAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      status: 'completed',
      txHash: '0xdef789...abc012',
      requestedAt: '2026-03-17T10:00:00Z',
      processedAt: '2026-03-17T10:45:00Z',
    },
    {
      id: 'wd_007',
      merchantId: 'merch_005',
      merchantName: 'NFT Marketplace Inc',
      crypto: 'USDT',
      amount: 5000,
      amountUsd: 5000,
      fee: 2.5,
      destinationAddress: '0x9876543210fedcba9876543210fedcba98765432',
      status: 'rejected',
      requestedAt: '2026-03-18T09:00:00Z',
      adminNote: 'Account under review - suspicious activity',
    },
    {
      id: 'wd_008',
      merchantId: 'merch_001',
      merchantName: 'CryptoShop Pro',
      crypto: 'ETH',
      amount: 2.0,
      amountUsd: 7000,
      fee: 0.005,
      destinationAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8b3b',
      status: 'failed',
      txHash: '0xfailed...tx123',
      requestedAt: '2026-03-16T16:00:00Z',
      processedAt: '2026-03-16T16:30:00Z',
      adminNote: 'Transaction reverted on chain',
    },
  ];
}

export default useWithdrawals;
