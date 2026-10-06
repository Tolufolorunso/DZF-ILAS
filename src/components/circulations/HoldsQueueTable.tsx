'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  DZFSearchInput,
  DZFDataTable,
  Column,
  Mono,
  CheckCircleIcon,
  RefreshIcon,
} from '@/components';

export interface HoldDTO {
  id: string;
  patronId: string;
  patronBarcode: string;
  patronName: string;
  bookId: string;
  bookBarcode: string;
  bookTitle: string;
  status: 'waiting' | 'ready' | 'fulfilled' | 'cancelled';
  notifiedAt?: string;
  expiresAt?: string;
  fulfilledAt?: string;
  notes?: string;
  createdAt: string;
}

interface HoldsQueueTableProps {
  onDataChanged?: () => void;
}

export function HoldsQueueTable({ onDataChanged }: HoldsQueueTableProps) {
  const [holds, setHolds] = React.useState<HoldDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('active');
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    async function loadHolds() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (statusFilter === 'active') {
          // Default GET without status returns waiting and ready
        } else if (statusFilter !== 'all') {
          params.set('status', statusFilter);
        } else {
          params.set('status', 'all');
        }

        if (search.trim()) {
          params.set('search', search.trim());
        }

        const res = await fetch(`/api/circulations/holds?${params.toString()}`);
        const data = await res.json();

        if (active && res.ok && data.success) {
          setHolds(data.holds || []);
        } else if (active && data.error) {
          setError(data.error);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load holds queue:', err);
          setError('Network error while loading hold reservations.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHolds();

    return () => {
      active = false;
    };
  }, [statusFilter, search, reloadKey]);

  const handleAction = async (holdId: string, action: 'cancel' | 'fulfill') => {
    try {
      setActionId(holdId);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/circulations/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdId, action }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || `Failed to ${action} hold reservation.`);
        return;
      }

      setSuccess(
        action === 'cancel'
          ? 'Hold reservation cancelled.'
          : 'Hold reservation marked as fulfilled.'
      );
      setReloadKey((prev) => prev + 1);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Hold action error:', err);
      setError('Network error during hold operation.');
    } finally {
      setActionId(null);
    }
  };

  const columns: Column<HoldDTO>[] = [
    {
      id: 'book',
      label: 'Book Title & Barcode',
      minWidth: 240,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[950] }}>
            {row.bookTitle}
          </Typography>
          <Mono sx={{ fontSize: '0.75rem', mt: 0.5 }}>{row.bookBarcode}</Mono>
        </Box>
      ),
    },
    {
      id: 'patron',
      label: 'Reserved For (Patron)',
      minWidth: 200,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
            {row.patronName}
          </Typography>
          <Mono sx={{ fontSize: '0.75rem', mt: 0.5 }}>{row.patronBarcode}</Mono>
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: 'Date Placed',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Hold Status',
      minWidth: 140,
      render: (row) => {
        if (row.status === 'ready') {
          return <DZFBadge variant="success" size="small" label="READY FOR PICKUP" solid />;
        }
        if (row.status === 'waiting') {
          return <DZFBadge variant="warning" size="small" label="WAITING IN QUEUE" />;
        }
        if (row.status === 'fulfilled') {
          return <DZFBadge variant="primary" size="small" label="FULFILLED" />;
        }
        return <DZFBadge variant="default" size="small" label="CANCELLED" />;
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 160,
      align: 'right',
      render: (row) => {
        const isPending = row.status === 'waiting' || row.status === 'ready';
        if (!isPending) {
          return (
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Archived
            </Typography>
          );
        }

        const busy = actionId === row.id;

        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {row.status === 'ready' && (
              <DZFButton
                size="small"
                variant="primary"
                loading={busy}
                disabled={busy}
                onClick={() => handleAction(row.id, 'fulfill')}
                startIcon={<CheckCircleIcon size={14} />}
              >
                Fulfill
              </DZFButton>
            )}
            <DZFButton
              size="small"
              variant="danger"
              loading={busy}
              disabled={busy}
              onClick={() => handleAction(row.id, 'cancel')}
            >
              Cancel
            </DZFButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      {/* Alert Banners */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Tabs
          value={statusFilter}
          onChange={(_, val) => setStatusFilter(val)}
          sx={{
            minHeight: 38,
            '& .MuiTab-root': {
              minHeight: 38,
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'none',
              py: 0.5,
              px: 1.5,
            },
          }}
        >
          <Tab value="active" label="Active Holds" />
          <Tab value="ready" label="Ready For Pickup" />
          <Tab value="waiting" label="Waiting In Queue" />
          <Tab value="all" label="All History" />
        </Tabs>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <DZFSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search hold by patron or book..."
            sx={{ width: { xs: '100%', md: 280 } }}
          />
          <DZFButton
            size="small"
            variant="soft"
            onClick={() => setReloadKey((prev) => prev + 1)}
            startIcon={<RefreshIcon size={16} />}
          >
            Refresh
          </DZFButton>
        </Box>
      </Box>

      {/* Holds Data Table */}
      <DZFDataTable
        columns={columns}
        data={holds}
        loading={loading}
        emptyTitle="No hold reservations"
        emptyDescription="No book hold reservations found for the selected filter."
      />
    </Box>
  );
}
