'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
} from '@mui/material';
import { dzfColors } from '@/theme/colors';
import {
  DZFDataTable,
  Column,
  DZFBadge,
  Mono,
  DZFSearchInput,
  DZFButton,
  RefreshIcon,
} from '@/components';
import type { SummaryItemDTO } from '@/lib/summaries/service';

interface SummaryHistoryTableProps {
  onDataChanged?: () => void;
}

export function SummaryHistoryTable({ onDataChanged }: SummaryHistoryTableProps) {
  const [summaries, setSummaries] = React.useState<SummaryItemDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Detail Modal state
  const [viewItem, setViewItem] = React.useState<SummaryItemDTO | null>(null);

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

        const res = await fetch(`/api/summaries?${queryParams.toString()}`);
        const data = await res.json();

        if (active && res.ok && data.success) {
          setSummaries(data.summaries || []);
          setTotal(data.total || 0);
        } else if (active && data.error) {
          setError(data.error);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load summary history:', err);
          setError('Network error while loading summaries.');
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

  const columns: Column<SummaryItemDTO>[] = [
    {
      id: 'book',
      label: 'Book Title & Barcode',
      minWidth: 220,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[950] }}>
            {row.bookTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Mono sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textSecondary }}>
              {row.bookBarcode}
            </Mono>
            {row.bookAuthor && (
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                • {row.bookAuthor}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'student',
      label: 'Student Patron',
      minWidth: 180,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
            {row.patronName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Mono sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textSecondary }}>
              {row.patronBarcode}
            </Mono>
            {row.patronClass && (
              <DZFBadge variant="default" size="small" label={row.patronClass} />
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'rating',
      label: 'Rating',
      minWidth: 110,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ color: dzfColors.gold[500], fontSize: '0.85rem' }}>
            {'★'.repeat(row.rating)}
          </Typography>
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textSecondary, fontWeight: 700 }}>
            {row.rating}/5
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      render: (row) => {
        if (row.status === 'approved') {
          return <DZFBadge variant="success" size="small" label="Approved" />;
        }
        if (row.status === 'rejected') {
          return <DZFBadge variant="error" size="small" label="Rejected" />;
        }
        return <DZFBadge variant="warning" size="small" label="Pending" />;
      },
    },
    {
      id: 'points',
      label: 'Points',
      minWidth: 100,
      render: (row) => {
        if (row.status === 'approved' && row.points > 0) {
          return (
            <Chip
              label={`+${row.points} Pts`}
              size="small"
              sx={{
                bgcolor: dzfColors.status.success.bg,
                color: dzfColors.status.success.text,
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            />
          );
        }
        return <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>—</Typography>;
      },
    },
    {
      id: 'date',
      label: 'Submission & Review',
      minWidth: 180,
      render: (row) => (
        <Box>
          <Typography variant="caption" sx={{ display: 'block', color: dzfColors.surfaces.textPrimary }}>
            Submitted: {new Date(row.submissionDate).toLocaleDateString()}
          </Typography>
          {row.reviewDate && (
            <Typography variant="caption" sx={{ display: 'block', color: dzfColors.surfaces.textMuted, mt: 0.25 }}>
              Reviewed by {row.reviewedBy || 'Staff'} ({new Date(row.reviewDate).toLocaleDateString()})
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 110,
      align: 'right',
      render: (row) => (
        <DZFButton
          variant="secondary"
          size="small"
          onClick={() => setViewItem(row)}
        >
          View Details
        </DZFButton>
      ),
    },
  ];

  return (
    <Box>
      {/* Search & Status Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${dzfColors.surfaces.border}`,
          bgcolor: dzfColors.surfaces.paper,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ width: { xs: '100%', md: 360 } }}>
          <DZFSearchInput
            placeholder="Search by student, book, or barcode..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(0);
            }}
          />
        </Box>

        {/* Status Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'all', label: 'All Submissions' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <Chip
              key={tab.id}
              label={tab.label}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(0);
              }}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor:
                  statusFilter === tab.id
                    ? dzfColors.maroon[800]
                    : '#f1f5f9',
                color:
                  statusFilter === tab.id ? '#FFFFFF' : dzfColors.surfaces.textSecondary,
                '&:hover': {
                  bgcolor:
                    statusFilter === tab.id
                      ? dzfColors.maroon[900]
                      : '#e2e8f0',
                },
              }}
            />
          ))}

          <IconButton
            size="small"
            onClick={() => {
              setPage(0);
              if (onDataChanged) onDataChanged();
            }}
            title="Refresh Table"
            sx={{ ml: 1 }}
          >
            <RefreshIcon size={18} />
          </IconButton>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Table */}
      <DZFDataTable
        columns={columns}
        data={summaries}
        loading={loading}
        page={page}
        pageSize={rowsPerPage}
        totalCount={total}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newSize) => {
          setRowsPerPage(newSize);
          setPage(0);
        }}
        emptyTitle="No Book Summaries Found"
        emptyDescription="No summaries matched the selected filters or search terms."
      />

      {/* Summary View Modal */}
      {viewItem && (
        <Dialog
          open={Boolean(viewItem)}
          onClose={() => setViewItem(null)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: { sx: { borderRadius: 3, p: 1 } },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${dzfColors.surfaces.border}`,
              pb: 2,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                Book Summary Details
              </Typography>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                Submitted on {new Date(viewItem.submissionDate).toLocaleString()}
              </Typography>
            </Box>
            <IconButton onClick={() => setViewItem(null)} size="small">
              ✕
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ py: 3 }}>
            {/* Header badges */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
              {viewItem.status === 'approved' ? (
                <DZFBadge variant="success" size="medium" label={`Approved (+${viewItem.points} Points)`} />
              ) : viewItem.status === 'rejected' ? (
                <DZFBadge variant="error" size="medium" label="Rejected (0 Points)" />
              ) : (
                <DZFBadge variant="warning" size="medium" label="Pending Moderation" />
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ color: dzfColors.gold[500], fontSize: '1rem' }}>
                  {'★'.repeat(viewItem.rating)}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.surfaces.textSecondary }}>
                  {viewItem.rating}/5 Stars
                </Typography>
              </Box>
            </Box>

            {/* Context Grid: Student & Book */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mb: 3,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                }}
              >
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700 }}>
                  STUDENT BORROWER
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                  {viewItem.patronName}
                </Typography>
                <Mono sx={{ fontSize: '0.8rem', color: dzfColors.surfaces.textSecondary, mt: 0.5 }}>
                  Barcode: {viewItem.patronBarcode}
                </Mono>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                }}
              >
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700 }}>
                  BOOK
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                  {viewItem.bookTitle}
                </Typography>
                <Mono sx={{ fontSize: '0.8rem', color: dzfColors.surfaces.textSecondary, mt: 0.5 }}>
                  Barcode: {viewItem.bookBarcode}
                </Mono>
              </Paper>
            </Box>

            {/* Summary Text */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 1 }}>
                Student Summary Content ({viewItem.summary.length} characters)
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#FAFBFD',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  maxHeight: 250,
                  overflowY: 'auto',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: dzfColors.navy[950],
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    fontSize: '0.95rem',
                  }}
                >
                  {viewItem.summary}
                </Typography>
              </Paper>
            </Box>

            {viewItem.keyLearnings && (
              <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: dzfColors.gold[50], border: `1px solid ${dzfColors.gold[200]}` }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: dzfColors.navy[900], display: 'block', mb: 0.5 }}>
                  KEY TAKEAWAYS / LEARNINGS:
                </Typography>
                <Typography variant="body2" sx={{ color: dzfColors.navy[900], fontStyle: 'italic' }}>
                  {viewItem.keyLearnings}
                </Typography>
              </Box>
            )}

            {/* Librarian Feedback */}
            {viewItem.feedback && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: viewItem.status === 'rejected' ? dzfColors.status.error.bg : dzfColors.status.success.bg,
                  border: `1px solid ${
                    viewItem.status === 'rejected' ? dzfColors.status.error.badge : dzfColors.status.success.badge
                  }`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: viewItem.status === 'rejected' ? dzfColors.status.error.text : dzfColors.status.success.text,
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  LIBRARIAN FEEDBACK:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: viewItem.status === 'rejected' ? dzfColors.status.error.text : dzfColors.status.success.text,
                  }}
                >
                  {viewItem.feedback}
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
            <DZFButton variant="secondary" size="small" onClick={() => setViewItem(null)}>
              Close
            </DZFButton>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
