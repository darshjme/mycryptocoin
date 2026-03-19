import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'fee';
  crypto: string;
  amount: number;
  amountUsd: number;
  status: 'confirmed' | 'pending' | 'failed';
  description: string;
  txHash: string;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

interface TransactionFilters {
  type?: string;
  crypto?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
}

export function useTransactions(filters: TransactionFilters & { page?: number } = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value));
        }
      });
      const { data } = await api.get<TransactionsResponse>(
        `${ENDPOINTS.TRANSACTIONS.LIST}?${params.toString()}`
      );
      return data;
    },
    staleTime: 30 * 1000,
  });
}

export function useInfiniteTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.append('page', String(pageParam));
      params.append('limit', String(filters.limit || 20));
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'limit' && value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value));
        }
      });
      const { data } = await api.get<TransactionsResponse>(
        `${ENDPOINTS.TRANSACTIONS.LIST}?${params.toString()}`
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
}
