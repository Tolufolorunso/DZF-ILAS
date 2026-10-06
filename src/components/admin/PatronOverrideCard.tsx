'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import { BarcodeIcon, ShieldIcon, CheckIcon, AlertTriangleIcon } from '@/components/ui/DZFIcons';
import type { PatronOverrideAction } from '@/lib/admin/types';

interface PatronInfo {
  barcode: string;
  name: string;
  patronType: string;
  class?: string;
  active: boolean;
  hasBorrowedBook?: boolean;
  lastBorrowedItem?: { itemTitle?: string; itemBarcode?: string };
  imageUrl?: string;
}

export default function PatronOverrideCard() {
  const [barcodeInput, setBarcodeInput] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [patron, setPatron] = React.useState<PatronInfo | null>(null);
  const [rationale, setRationale] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = barcodeInput.trim();
    if (!clean) return;

    try {
      setSearching(true);
      setFeedback(null);
      setPatron(null);

      const res = await fetch(`/api/patrons/lookup?barcode=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.success && data.patron) {
        setPatron({
          barcode: data.patron.barcode,
          name: `${data.patron.firstname} ${data.patron.surname}`,
          patronType: data.patron.patronType,
          class: data.patron.class,
          active: data.patron.active,
          hasBorrowedBook: data.patron.hasBorrowedBook,
          lastBorrowedItem: data.patron.lastBorrowedItem,
          imageUrl: data.patron.image_url?.secure_url,
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.error || `No patron found matching barcode "${clean}".`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lookup failed',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleExecuteOverride = async (action: PatronOverrideAction) => {
    if (!patron) return;
    if (!rationale.trim()) {
      setFeedback({
        type: 'error',
        message: 'Administrative rationale is required for circulation overrides.',
      });
      return;
    }

    try {
      setActionLoading(true);
      setFeedback(null);

      const res = await fetch('/api/admin/overrides/patron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patronBarcode: patron.barcode,
          action,
          reason: rationale.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply override');
      }

      setFeedback({
        type: 'success',
        message: data.message || 'Override successfully applied.',
      });
      setRationale('');

      // Refresh patron state
      setPatron((prev) =>
        prev
          ? {
              ...prev,
              hasBorrowedBook: false,
              lastBorrowedItem: undefined,
            }
          : null
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Override execution failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(11, 29, 46, 0.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: `${dzfColors.gold[400]}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: dzfColors.navy[700],
          }}
        >
          <ShieldIcon size={20} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
            Patron Circulation Overrides
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Emergency unlocking of patron borrow restrictions with audit logging
          </Typography>
        </Box>
      </Box>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2.5, borderRadius: '8px' }}>
          {feedback.message}
        </Alert>
      )}

      {/* Barcode Search Form */}
      <Box component="form" onSubmit={handleLookup} sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Scan or enter 8-digit patron barcode (e.g. 20260001)..."
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          sx={{ flex: 1 }}
          disabled={searching || actionLoading}
          slotProps={{
            input: {
              startAdornment: (
                <Box sx={{ color: 'text.disabled', mr: 1, display: 'flex' }}>
                  <BarcodeIcon size={18} />
                </Box>
              ),
            },
          }}
        />
        <DZFButton type="submit" variant="primary" disabled={searching || !barcodeInput.trim()}>
          {searching ? <CircularProgress size={18} color="inherit" /> : 'Inspect Patron'}
        </DZFButton>
      </Box>

      {/* Patron Inspection Result */}
      {patron && (
        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              src={patron.imageUrl}
              sx={{ width: 52, height: 52, bgcolor: dzfColors.navy[900], fontSize: '1.2rem', fontWeight: 700 }}
            >
              {patron.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  {patron.name}
                </Typography>
                <Chip size="small" label={`Barcode: ${patron.barcode}`} variant="outlined" />
                <DZFBadge
                  variant={patron.active ? 'success' : 'error'}
                  size="small"
                  label={patron.active ? 'Active' : 'Inactive'}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Type: {patron.patronType.toUpperCase()} {patron.class ? `• Class: ${patron.class}` : ''}
              </Typography>
            </Box>
          </Box>

          {/* Borrow status banner */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              bgcolor: patron.hasBorrowedBook ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${patron.hasBorrowedBook ? '#fecaca' : '#bbf7d0'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 2,
            }}
          >
            {patron.hasBorrowedBook ? (
              <>
                <AlertTriangleIcon size={20} color={dzfColors.maroon[600]} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.maroon[700] }}>
                    Patron Currently Blocked (Active Loan)
                  </Typography>
                  <Typography variant="caption" sx={{ color: dzfColors.maroon[700] }}>
                    Borrowed: {patron.lastBorrowedItem?.itemTitle || 'Unindexed Monograph'} (Barcode: {patron.lastBorrowedItem?.itemBarcode || 'N/A'})
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <CheckIcon size={20} color="#16a34a" />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#15803d' }}>
                  No Active Loan Blocks. Patron is eligible for standard borrowing.
                </Typography>
              </>
            )}
          </Box>

          {/* Rationale Input */}
          <TextField
            label="Administrative Override Rationale"
            placeholder="Explain reason for executive override (e.g. Lost book fee reconciled at front desk, special classroom loan granted)..."
            multiline
            rows={2}
            fullWidth
            size="small"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            disabled={actionLoading}
            sx={{ mb: 2 }}
          />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <DZFButton
              variant="danger"
              disabled={actionLoading || !patron.hasBorrowedBook}
              onClick={() => handleExecuteOverride('clear_borrow_lock')}
            >
              Clear Active Loan Block
            </DZFButton>
            <DZFButton
              variant="secondary"
              disabled={actionLoading}
              onClick={() => handleExecuteOverride('waive_overdues')}
            >
              Waive All Overdues & Penalties
            </DZFButton>
          </Box>
        </Box>
      )}
    </Card>
  );
}
