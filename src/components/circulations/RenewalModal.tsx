'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  Mono,
  BookIcon,
  RefreshIcon,
  ClockIcon,
} from '@/components';

export interface RenewalLoanDetails {
  bookTitle: string;
  bookBarcode: string;
  patronName: string;
  patronBarcode: string;
  dueDate?: string | Date;
  renewalsCount?: number;
}

export interface RenewalModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (extendDays: number) => Promise<void> | void;
  loading?: boolean;
  loan: RenewalLoanDetails | null;
}

export function RenewalModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  loan,
}: RenewalModalProps) {
  const [extendDays, setExtendDays] = React.useState<number>(5);

  React.useEffect(() => {
    if (open) {
      setExtendDays(5);
    }
  }, [open]);

  if (!loan) return null;

  const currentRenewals = loan.renewalsCount || 0;
  const isLimitReached = currentRenewals >= 2;

  const now = new Date();
  const currentDueDate = loan.dueDate ? new Date(loan.dueDate) : now;
  const baseDate = currentDueDate > now ? currentDueDate : now;
  const calculatedNewDueDate = new Date(baseDate.getTime() + (extendDays || 5) * 24 * 60 * 60 * 1000);

  const quickPicks = [
    { label: '+3 Days', days: 3 },
    { label: '+5 Days (Default)', days: 5 },
    { label: '+7 Days (1 Wk)', days: 7 },
    { label: '+14 Days (2 Wks)', days: 14 },
  ];

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
            <Typography variant="overline" sx={{ color: dzfColors.navy[700], fontWeight: 800, letterSpacing: 1 }}>
              LOAN EXTENSION
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[950], lineHeight: 1.2 }}>
              Renew Active Book Loan
            </Typography>
          </Box>
          <DZFBadge
            variant={isLimitReached ? 'error' : currentRenewals === 1 ? 'warning' : 'top10'}
            label={`${currentRenewals} of 2 Renewals Used`}
            solid
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Maximum renewal limit alert */}
        {isLimitReached ? (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            This book loan has already reached the maximum 2 renewals permitted by institutional policy. The book must be checked in and returned to the library.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
            Institutional default loan period is <strong>5 calendar days</strong>. You may select a quick preset or specify a custom number of days.
          </Alert>
        )}

        {/* Loan Context Card */}
        <Card
          variant="outlined"
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 2,
            backgroundColor: '#ffffff',
            border: `1px solid ${dzfColors.surfaces.border}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700 }}>
              BOOK TITLE
            </Typography>
            <Mono sx={{ fontSize: '0.8125rem' }}>{loan.bookBarcode}</Mono>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 1.5 }}>
            {loan.bookTitle}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${dzfColors.surfaces.borderSubtle}` }}>
            <Box>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                BORROWER
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                {loan.patronName} ({loan.patronBarcode})
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                CURRENT DUE DATE
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.maroon[900] }}>
                {currentDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Extension Days Selector */}
        {!isLimitReached && (
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 1 }}>
              Days to Extend Loan:
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {quickPicks.map((p) => {
                const isSelected = extendDays === p.days;
                return (
                  <Chip
                    key={p.days}
                    label={p.label}
                    onClick={() => setExtendDays(p.days)}
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 700,
                      cursor: 'pointer',
                      ...(isSelected && {
                        backgroundColor: dzfColors.navy[900],
                        color: '#ffffff',
                      }),
                    }}
                  />
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                type="number"
                size="small"
                label="Custom Days"
                value={extendDays}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(60, Number(e.target.value) || 1));
                  setExtendDays(val);
                }}
                slotProps={{
                  input: {
                    inputProps: { min: 1, max: 60 },
                  },
                }}
                sx={{ width: 140 }}
              />
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textSecondary }}>
                Enter between 1 and 60 days.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Calculated Preview Banner */}
        {!isLimitReached && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              border: `1.5px dashed ${dzfColors.navy[200]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ClockIcon size={20} color={dzfColors.navy[700]} />
              <Box>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700 }}>
                  NEW TARGET DUE DATE
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
                  {calculatedNewDueDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              </Box>
            </Box>
            <DZFBadge variant="top10" label={`+${extendDays} Days`} solid />
          </Box>
        )}
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
          disabled={isLimitReached}
          onClick={() => onConfirm(extendDays)}
          startIcon={<RefreshIcon size={18} />}
        >
          Confirm Renewal
        </DZFButton>
      </DialogActions>
    </Dialog>
  );
}
