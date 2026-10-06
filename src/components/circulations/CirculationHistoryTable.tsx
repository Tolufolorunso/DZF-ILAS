'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { dzfColors } from '@/theme/colors';
import {
  DZFBadge,
  DZFSearchInput,
  DZFDataTable,
  Column,
  Mono,
} from '@/components';
import { ActiveLoanDTO } from '@/lib/circulation/loan';

export function CirculationHistoryTable() {
  const [loans, setLoans] = React.useState<ActiveLoanDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const queryParams = new URLSearchParams({
          page: String(page + 1),
          limit: String(rowsPerPage),
          status: statusFilter,
          search,
        });

        const res = await fetch(`/api/circulations/history?${queryParams.toString()}`);
        const data = await res.json();

        if (active && res.ok && data.success) {
          setLoans(data.loans || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load history:', err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [page, rowsPerPage, statusFilter, search]);

  const columns: Column<ActiveLoanDTO>[] = [
    {
      id: 'book',
      label: 'Book Title & Barcode',
      minWidth: 220,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[950] }}>
            {row.bookTitle}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
            <Mono sx={{ fontSize: '0.75rem' }}>{row.bookBarcode}</Mono>
            {row.eventTitle && (
              <DZFBadge variant="primary" size="small" label={row.eventTitle} />
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'borrower',
      label: 'Patron Borrower',
      minWidth: 180,
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
      id: 'issueDate',
      label: 'Issue Date',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
          {new Date(row.issueDate).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {new Date(row.dueDate).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'returnDate',
      label: 'Returned On',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: row.returnDate ? 'inherit' : dzfColors.surfaces.textMuted }}>
          {row.returnDate ? new Date(row.returnDate).toLocaleDateString() : '—'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status & Points',
      minWidth: 160,
      align: 'right',
      render: (row) => {
        const isReturned = Boolean(row.returnDate) || row.status === 'returned';
        if (isReturned) {
          const pts = row.pointsAwarded ?? 0;
          return (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
              <DZFBadge variant="success" size="small" label="RETURNED" />
              <DZFBadge
                variant={pts > 0 ? 'top10' : 'default'}
                size="small"
                label={pts > 0 ? `+${pts} pts` : '0 pts'}
              />
            </Box>
          );
        }
        if (row.isOverdue || row.status === 'overdue') {
          return <DZFBadge variant="error" size="small" label={`OVERDUE (${row.overdueDays}d)`} solid />;
        }
        return <DZFBadge variant="warning" size="small" label="BORROWED" />;
      },
    },
  ];

  return (
    <Box>
      {/* Controls Bar */}
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
          onChange={(_, val) => {
            setStatusFilter(val);
            setPage(0);
          }}
          sx={{
            minHeight: 38,
            '& .MuiTab-root': {
              minHeight: 38,
              py: 0.5,
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'none',
              color: dzfColors.surfaces.textSecondary,
              '&.Mui-selected': { color: dzfColors.maroon[900] },
            },
            '& .MuiTabs-indicator': { backgroundColor: dzfColors.maroon[900] },
          }}
        >
          <Tab value="all" label="All History" />
          <Tab value="borrowed" label="Active Loans" />
          <Tab value="returned" label="Returned" />
          <Tab value="overdue" label="Overdue" />
        </Tabs>

        <Box sx={{ width: { xs: '100%', sm: 300 } }}>
          <DZFSearchInput
            placeholder="Search book or patron..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(0);
            }}
          />
        </Box>
      </Box>

      {/* Table */}
      <DZFDataTable<ActiveLoanDTO>
        columns={columns}
        data={loans}
        totalCount={total}
        page={page}
        pageSize={rowsPerPage}
        onPageChange={setPage}
        onPageSizeChange={setRowsPerPage}
        loading={loading}
        emptyTitle="No historical circulation records found."
      />
    </Box>
  );
}
