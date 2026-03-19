'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/ui/Table';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import type { Merchant } from '@/lib/api';

interface MerchantTableProps {
  merchants: Merchant[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export default function MerchantTable({ merchants, loading, pagination }: MerchantTableProps) {
  const router = useRouter();

  const columns = [
    {
      key: 'name',
      label: 'Merchant',
      sortable: true,
      render: (_: unknown, row: Merchant) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/10 flex items-center justify-center text-sm font-bold text-brand-300">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-xs text-white/30">{row.businessType}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      render: (_: unknown, row: Merchant) => (
        <div>
          <p className="text-sm text-white/70">{row.email}</p>
          <p className="text-xs text-white/30">{row.whatsapp}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val: unknown) => (
        <Badge variant={getStatusVariant(val as string)} dot>
          {(val as string).charAt(0).toUpperCase() + (val as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'totalVolume',
      label: 'Volume',
      sortable: true,
      align: 'right' as const,
      render: (val: unknown) => (
        <span className="text-white font-medium">
          ${(val as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'totalTransactions',
      label: 'Txns',
      sortable: true,
      align: 'right' as const,
      render: (val: unknown) => (
        <span className="text-white/60">{(val as number).toLocaleString()}</span>
      ),
    },
    {
      key: 'apiKeyCount',
      label: 'API Keys',
      align: 'center' as const,
      render: (val: unknown) => (
        <span className="text-white/40">{val as number}</span>
      ),
    },
    {
      key: 'joinedAt',
      label: 'Joined',
      sortable: true,
      render: (val: unknown) => (
        <span className="text-white/40 text-sm">
          {new Date(val as string).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={merchants as unknown as Record<string, unknown>[]}
      keyField="id"
      loading={loading}
      onRowClick={(row) => router.push(`/admin/merchants/${(row as unknown as Merchant).id}`)}
      emptyMessage="No merchants found"
      pagination={pagination}
    />
  );
}
