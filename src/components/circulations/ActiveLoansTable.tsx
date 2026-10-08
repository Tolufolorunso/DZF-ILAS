'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  DZFSearchInput,
  DZFDataTable,
  Column,
  Mono,
  BookIcon,
  CheckCircleIcon,
  RefreshIcon,
} from '@/components';
import { ActiveLoanDTO } from '@/lib/circulation/loan';
import { ReturnConfirmModal } from './ReturnConfirmModal';
import { RenewalModal } from './RenewalModal';

interface ActiveLoansTableProps {
  onDataChanged?: () => void;
}

export function ActiveLoansTable({ onDataChanged }: ActiveLoansTableProps) {
  const [loans, setLoans] = React.useState<ActiveLoanDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');
  const [overdueOnly, setOverdueOnly] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Modal dialog states
  const [returnModalLoan, setReturnModalLoan] = React.useState<ActiveLoanDTO | null>(null);
  const [renewModalLoan, setRenewModalLoan] = React.useState<ActiveLoanDTO | null>(null);
  const [submittingModal, setSubmittingModal] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const endpoint = overdueOnly
          ? '/api/circulations/overdues'
          : '/api/circulations/history?status=borrowed&limit=100';
        const res = await fetch(endpoint);
        const data = await res.json();

        if (active && res.ok && data.success) {
          setLoans(data.loans || []);
        } else if (active && data.error) {
          setError(data.error);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load active loans:', err);
          setError('Network error while loading loans.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [overdueOnly, reloadKey]);

  const handleConfirmReturn = async () => {
    if (!returnModalLoan) return;
    try {
      setSubmittingModal(true);
      setError(null);
      setActionSuccess(null);

      const res = await fetch('/api/circulations/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookBarcode: returnModalLoan.bookBarcode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Check-in failed.');
        return;
      }

      const pts = typeof data.pointsAwarded === 'number' ? data.pointsAwarded : 0;
      let ptsLabel = '';
      if (pts === 3) ptsLabel = ' (+3 Pts for timely return)';
      else if (pts === 1) ptsLabel = ' (+1 Pt: returned late)';
      else ptsLabel = ' (0 Pts: overdue return)';
      const holdNote = data.holdNotice ? ` • ⚠️ Reserved for ${data.holdNotice.patronName}!` : '';

      setActionSuccess(`"${returnModalLoan.bookTitle}" returned successfully!${ptsLabel}${holdNote}`);
      setReturnModalLoan(null);
      setReloadKey((prev) => prev + 1);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Return error:', err);
      setError('Network error during check-in.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleConfirmRenew = async (extendDays: number) => {
    if (!renewModalLoan) return;
    try {
      setSubmittingModal(true);
      setError(null);
      setActionSuccess(null);

      const res = await fetch('/api/circulations/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookBarcode: renewModalLoan.bookBarcode, extendDays }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Renewal failed.');
        return;
      }

      setActionSuccess(`Loan renewed! New due date: ${new Date(data.newDueDate).toLocaleDateString()}.`);
      setRenewModalLoan(null);
      setReloadKey((prev) => prev + 1);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Renewal error:', err);
      setError('Network error during renewal.');
    } finally {
      setSubmittingModal(false);
    }
  };

  // Client-side search filtering
  const filteredLoans = React.useMemo(() => {
    if (!search.trim()) return loans;
    const q = search.toLowerCase();
    return loans.filter(
      (l) =>
        l.bookTitle.toLowerCase().includes(q) ||
        l.bookBarcode.toLowerCase().includes(q) ||
        l.patronName.toLowerCase().includes(q) ||
        l.patronBarcode.toLowerCase().includes(q)
    );
  }, [loans, search]);

  const paginatedLoans = React.useMemo(() => {
    return filteredLoans.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [filteredLoans, page, rowsPerPage]);

  const columns: Column<ActiveLoanDTO>[] = [
    {
      id: 'book',
      label: 'Book Item',
      minWidth: 220,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box
            sx={{
              width: 38,
              height: 52,
              borderRadius: 1,
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {row.bookCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.bookCover} alt={row.bookTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <BookIcon size={20} color={dzfColors.maroon[700]} />
            )}
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[950], lineHeight: 1.2 }}>
              {row.bookTitle}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
              <Mono sx={{ fontSize: '0.75rem' }}>{row.bookBarcode}</Mono>
              {row.shelfLocation && (
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                  • {row.shelfLocation}
                </Typography>
              )}
              {row.eventTitle && (
                <DZFBadge variant="primary" size="small" label={row.eventTitle} />
              )}
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'borrower',
      label: 'Borrower',
      minWidth: 200,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Avatar
            src={row.patronPhoto}
            sx={{ width: 36, height: 36, fontSize: '0.875rem', bgcolor: dzfColors.navy[700] }}
          >
            {row.patronName ? row.patronName.charAt(0) : 'P'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
              {row.patronName || 'Patron'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Mono sx={{ fontSize: '0.75rem' }}>{row.patronBarcode}</Mono>
              {row.patronClass && row.patronClass !== 'N/A' && (
                <DZFBadge variant="default" size="small" label={row.patronClass} />
              )}
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'issueDate',
      label: 'Borrowed',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: dzfColors.surfaces.textSecondary }}>
          {new Date(row.issueDate).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'dueDate',
      label: 'Due Date & Status',
      minWidth: 180,
      render: (row) => {
        const dueFormatted = new Date(row.dueDate).toLocaleDateString();
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
              {dueFormatted}
            </Typography>
            {row.isOverdue ? (
              <DZFBadge
                variant="error"
                solid
                size="small"
                label={`Overdue (${row.overdueDays}d)`}
                sx={{ mt: 0.5 }}
              />
            ) : (
              <DZFBadge
                variant="success"
                size="small"
                label="On Time"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
        );
      },
    },
    {
      id: 'renewals',
      label: 'Renewals',
      minWidth: 100,
      render: (row) => (
        <DZFBadge
          variant={row.renewalsCount >= 2 ? 'warning' : 'default'}
          size="small"
          label={`${row.renewalsCount} / 2`}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 200,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <DZFButton
              variant="primary"
              size="small"
              onClick={() => setReturnModalLoan(row)}
              startIcon={<CheckCircleIcon size={14} />}
            >
              Return
            </DZFButton>

            <DZFButton
              variant="soft"
              size="small"
              disabled={row.renewalsCount >= 2}
              onClick={() => setRenewModalLoan(row)}
              startIcon={<RefreshIcon size={14} />}
            >
              Renew
            </DZFButton>
          </Box>
        ),
    },
  ];

  return (
    <Box>
      {/* Alert Notices */}
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={overdueOnly}
                onChange={(e) => {
                  setOverdueOnly(e.target.checked);
                  setPage(0);
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: dzfColors.maroon[900] },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: dzfColors.maroon[900] },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
                Overdue Delinquencies Only
              </Typography>
            }
          />
        </Box>

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

      {/* Data Table */}
      <DZFDataTable<ActiveLoanDTO>
        columns={columns}
        data={paginatedLoans}
        totalCount={filteredLoans.length}
        page={page}
        pageSize={rowsPerPage}
        onPageChange={setPage}
        onPageSizeChange={setRowsPerPage}
        loading={loading}
        emptyTitle="No active library loans found."
      />

      {/* Modals for Return & Renewal Confirmation */}
      <ReturnConfirmModal
        open={Boolean(returnModalLoan)}
        onClose={() => setReturnModalLoan(null)}
        onConfirm={handleConfirmReturn}
        loading={submittingModal}
        loan={returnModalLoan}
      />

      <RenewalModal
        open={Boolean(renewModalLoan)}
        onClose={() => setRenewModalLoan(null)}
        onConfirm={handleConfirmRenew}
        loading={submittingModal}
        loan={renewModalLoan}
      />
    </Box>
  );
}
