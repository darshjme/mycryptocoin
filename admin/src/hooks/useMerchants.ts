'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { type Merchant } from '@/lib/api';
import { endpoints } from '@/lib/endpoints';

interface MerchantFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface MerchantDetail extends Merchant {
  wallets: Array<{
    crypto: string;
    address: string;
    balance: number;
  }>;
  apiKeys: Array<{
    id: string;
    label: string;
    prefix: string;
    createdAt: string;
    lastUsed: string;
    active: boolean;
  }>;
  activityLog: Array<{
    id: string;
    action: string;
    details: string;
    ip: string;
    timestamp: string;
  }>;
}

export function useMerchants(initialFilters?: MerchantFilters) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MerchantFilters>(initialFilters || { page: 1, limit: 20 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchMerchants = useCallback(async (filterOverrides?: MerchantFilters) => {
    setLoading(true);
    setError(null);
    const currentFilters = { ...filters, ...filterOverrides };

    try {
      const response = await api.get<Merchant[]>(endpoints.merchants.list, {
        status: currentFilters.status,
        search: currentFilters.search,
        page: currentFilters.page,
        limit: currentFilters.limit,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
      });
      setMerchants(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch merchants';
      setError(message);
      // Use mock data for development
      setMerchants(getMockMerchants());
      setPagination({ page: 1, limit: 20, total: 5, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const getMerchantDetail = useCallback(async (id: string): Promise<MerchantDetail | null> => {
    try {
      const response = await api.get<MerchantDetail>(endpoints.merchants.detail(id));
      return response.data;
    } catch {
      return getMockMerchantDetail(id);
    }
  }, []);

  const approveMerchant = useCallback(async (id: string) => {
    try {
      await api.post(endpoints.merchants.approve(id));
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'active' as const } : m))
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  const suspendMerchant = useCallback(async (id: string, reason?: string) => {
    try {
      await api.post(endpoints.merchants.suspend(id), { reason });
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'suspended' as const } : m))
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  const activateMerchant = useCallback(async (id: string) => {
    try {
      await api.post(endpoints.merchants.activate(id));
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'active' as const } : m))
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<MerchantFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    merchants,
    loading,
    error,
    filters,
    pagination,
    fetchMerchants,
    getMerchantDetail,
    approveMerchant,
    suspendMerchant,
    activateMerchant,
    updateFilters,
  };
}

// Mock data for development
function getMockMerchants(): Merchant[] {
  return [
    {
      id: 'merch_001',
      name: 'CryptoShop Pro',
      email: 'admin@cryptoshop.pro',
      whatsapp: '+91 98765 43210',
      status: 'active',
      totalVolume: 1250000,
      totalTransactions: 3420,
      joinedAt: '2025-08-15T10:00:00Z',
      lastActive: '2026-03-19T08:30:00Z',
      businessType: 'E-commerce',
      apiKeyCount: 3,
    },
    {
      id: 'merch_002',
      name: 'Digital Vault Exchange',
      email: 'ops@digitalvault.io',
      whatsapp: '+91 87654 32109',
      status: 'active',
      totalVolume: 890000,
      totalTransactions: 2150,
      joinedAt: '2025-09-20T14:30:00Z',
      lastActive: '2026-03-19T07:15:00Z',
      businessType: 'Exchange',
      apiKeyCount: 2,
    },
    {
      id: 'merch_003',
      name: 'BlockPay Solutions',
      email: 'hello@blockpay.dev',
      whatsapp: '+91 76543 21098',
      status: 'pending',
      totalVolume: 0,
      totalTransactions: 0,
      joinedAt: '2026-03-18T16:00:00Z',
      lastActive: '2026-03-18T16:00:00Z',
      businessType: 'SaaS',
      apiKeyCount: 0,
    },
    {
      id: 'merch_004',
      name: 'GameFi Payments',
      email: 'finance@gamefi.gg',
      whatsapp: '+91 65432 10987',
      status: 'active',
      totalVolume: 2340000,
      totalTransactions: 8900,
      joinedAt: '2025-06-10T09:00:00Z',
      lastActive: '2026-03-19T09:45:00Z',
      businessType: 'Gaming',
      apiKeyCount: 5,
    },
    {
      id: 'merch_005',
      name: 'NFT Marketplace Inc',
      email: 'admin@nftmarket.com',
      whatsapp: '+91 54321 09876',
      status: 'suspended',
      totalVolume: 450000,
      totalTransactions: 1200,
      joinedAt: '2025-10-05T11:30:00Z',
      lastActive: '2026-03-10T14:00:00Z',
      businessType: 'NFT Platform',
      apiKeyCount: 1,
    },
  ];
}

function getMockMerchantDetail(id: string): MerchantDetail {
  const merchants = getMockMerchants();
  const merchant = merchants.find((m) => m.id === id) || merchants[0];
  return {
    ...merchant,
    wallets: [
      { crypto: 'BTC', address: 'bc1q...xk4f', balance: 0.5432 },
      { crypto: 'ETH', address: '0x742...8f3b', balance: 12.345 },
      { crypto: 'USDT', address: '0x742...8f3b', balance: 25000.0 },
      { crypto: 'SOL', address: '5Ky7...9a2m', balance: 450.8 },
    ],
    apiKeys: [
      { id: 'key_1', label: 'Production', prefix: 'mcc_live_', createdAt: '2025-08-15T10:00:00Z', lastUsed: '2026-03-19T08:30:00Z', active: true },
      { id: 'key_2', label: 'Testing', prefix: 'mcc_test_', createdAt: '2025-09-01T10:00:00Z', lastUsed: '2026-03-18T15:00:00Z', active: true },
    ],
    activityLog: [
      { id: 'log_1', action: 'API Call', details: 'POST /payments/create', ip: '103.21.58.2', timestamp: '2026-03-19T08:30:00Z' },
      { id: 'log_2', action: 'Withdrawal', details: 'Requested 0.1 BTC withdrawal', ip: '103.21.58.2', timestamp: '2026-03-19T07:00:00Z' },
      { id: 'log_3', action: 'Login', details: 'Dashboard login', ip: '103.21.58.2', timestamp: '2026-03-19T06:45:00Z' },
      { id: 'log_4', action: 'Settings Update', details: 'Updated webhook URL', ip: '103.21.58.2', timestamp: '2026-03-18T20:00:00Z' },
    ],
  };
}

export default useMerchants;
