'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  Mono,
  BookIcon,
  CheckIcon,
  AlertTriangleIcon,
} from '@/components';

export interface ReturnLoanDetails {
  bookTitle: string;
  bookBarcode: string;
  shelfLocation?: string;
  bookCover?: string;
  author?: string;
  patronName: string;
  patronBarcode: string;
  patronClass?: string;
  patronPhoto?: string;
  dueDate?: string | Date;
}

export interface ReturnConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  loan: ReturnLoanDetails | null;
}

export function ReturnConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  loan,
}: ReturnConfirmModalProps) {
  if (!loan) return null;

  const now = new Date();
  const dueDate = loan.dueDate ? new Date(loan.dueDate) : now;
  const isOverdue = now > dueDate;
  const diffMs = now.getTime() - dueDate.getTime();
  const daysLate = isOverdue ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

  // Timely points breakdown
  let statusBadgeVariant: 'success' | 'warning' | 'error' = 'success';
  let statusLabel = 'ON-TIME RETURN';
  let pointsMessage = '+3 Activity points will be credited to patron';

  if (isOverdue) {
    if (daysLate <= 2) {
      statusBadgeVariant = 'warning';
      statusLabel = `LATE (${daysLate} DAY${daysLate > 1 ? 'S' : ''})`;
      pointsMessage = '+1 Activity point credited (1-2 days grace late)';
    } else {
      statusBadgeVariant = 'error';
      statusLabel = `OVERDUE (${daysLate} DAYS)`;
      pointsMessage = '0 Activity points credited (3+ days late)';
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            border: `1px solid ${dzfColors.surfaces.border}`,
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#fafbfc',
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
          px: 3,
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" sx={{ color: dzfColors.maroon[900], fontWeight: 800, letterSpacing: 1 }}>
              CIRCULATION RESTOCKING
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[950], lineHeight: 1.2 }}>
              Confirm Book Return & Check-In
            </Typography>
          </Box>
          <DZFBadge
            variant={statusBadgeVariant === 'success' ? 'success' : statusBadgeVariant === 'warning' ? 'warning' : 'error'}
            label={statusLabel}
            solid
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Status Alert Banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            mb: 2.5,
            borderRadius: 2,
            backgroundColor: isOverdue ? (daysLate <= 2 ? '#fffbeb' : '#fff1f2') : '#f0fdf4',
            border: `1px solid ${
              isOverdue ? (daysLate <= 2 ? dzfColors.gold[200] : dzfColors.maroon[200]) : '#bbf7d0'
            }`,
          }}
        >
          {isOverdue ? (
            <AlertTriangleIcon size={20} color={daysLate <= 2 ? dzfColors.gold[700] : dzfColors.maroon[700]} />
          ) : (
            <CheckIcon size={20} color={dzfColors.status.success.text} />
          )}
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: isOverdue ? (daysLate <= 2 ? dzfColors.navy[950] : dzfColors.maroon[950]) : '#166534',
              }}
            >
              Loan Due Date: {dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textSecondary, display: 'block' }}>
              {pointsMessage}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Book Summary Card */}
          <Grid size={{ xs: 12 }}>
            <Card
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#ffffff',
                border: `1px solid ${dzfColors.surfaces.border}`,
              }}
            >
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                Monograph Item
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 52,
                    height: 68,
                    borderRadius: 1.5,
                    backgroundColor: dzfColors.navy[50],
                    border: `1px solid ${dzfColors.surfaces.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {loan.bookCover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={loan.bookCover}
                      alt={loan.bookTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <BookIcon size={26} color={dzfColors.maroon[700]} />
                  )}
                </Box>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                    {loan.bookTitle}
                  </Typography>
                  {loan.author && (
                    <Typography variant="caption" noWrap sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                      by {loan.author}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                    <Mono sx={{ fontSize: '0.8125rem' }}>{loan.bookBarcode}</Mono>
                    {loan.shelfLocation && (
                      <Typography variant="caption" sx={{ color: dzfColors.navy[700], fontWeight: 600 }}>
                        • Shelf: {loan.shelfLocation}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Patron Borrower Card */}
          <Grid size={{ xs: 12 }}>
            <Card
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#ffffff',
                border: `1px solid ${dzfColors.surfaces.border}`,
              }}
            >
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                Borrower Information
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1, alignItems: 'center' }}>
                <Avatar
                  src={loan.patronPhoto}
                  alt={loan.patronName}
                  sx={{
                    width: 44,
                    height: 44,
                    backgroundColor: dzfColors.maroon[800],
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                >
                  {loan.patronName.charAt(0)}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                    {loan.patronName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Mono sx={{ fontSize: '0.8125rem' }}>{loan.patronBarcode}</Mono>
                    {loan.patronClass && loan.patronClass !== 'N/A' && (
                      <DZFBadge variant="top10" size="small" label={loan.patronClass} />
                    )}
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          backgroundColor: '#fafbfc',
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        <DZFButton variant="soft" onClick={onClose} disabled={loading}>
          Cancel
        </DZFButton>
        <DZFButton
          variant="primary"
          loading={loading}
          onClick={onConfirm}
          startIcon={<CheckIcon size={18} />}
          sx={{ backgroundColor: dzfColors.maroon[900] }}
        >
          Confirm Return / Restock
        </DZFButton>
      </DialogActions>
    </Dialog>
  );
}
