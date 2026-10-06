'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { ShieldIcon, AlertTriangleIcon } from '@/components/ui/DZFIcons';

interface EmergencyLockDialogProps {
  open: boolean;
  currentLock: boolean;
  currentReason?: string;
  onClose: () => void;
  onConfirm: (lock: boolean, reason: string) => Promise<void>;
}

export default function EmergencyLockDialog(props: EmergencyLockDialogProps) {
  if (!props.open) return null;
  return <EmergencyLockDialogContent {...props} />;
}

function EmergencyLockDialogContent({
  open,
  currentLock,
  currentReason = '',
  onClose,
  onConfirm,
}: EmergencyLockDialogProps) {
  const [reason, setReason] = React.useState(
    currentLock ? '' : currentReason || 'Annual library inventory stocktaking in progress.'
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const targetLockState = !currentLock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetLockState && !reason.trim()) {
      setError('Please provide a reason for activating the emergency circulation lock.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(targetLockState, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update circulation lock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            p: 1,
            border: `1px solid ${targetLockState ? dzfColors.maroon[500] : dzfColors.navy[200]}40`,
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '10px',
                bgcolor: targetLockState ? `${dzfColors.maroon[500]}15` : `${dzfColors.navy[700]}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: targetLockState ? dzfColors.maroon[600] : dzfColors.navy[700],
              }}
            >
              {targetLockState ? <AlertTriangleIcon size={24} /> : <ShieldIcon size={24} />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                {targetLockState ? 'Activate Emergency Circulation Lock' : 'Deactivate Circulation Lock'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                System-Wide Checkout Governance
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {targetLockState ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning" sx={{ borderRadius: '8px' }}>
                Activating this lock will immediately pause all new book checkout loans across both the web app and
                mobile barcode scanners. Existing active loans remain intact.
              </Alert>

              <TextField
                label="Circulation Lock Reason / Banner Notice"
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. End of term inventory audit; all book loans temporarily locked until Monday."
                fullWidth
                required
                disabled={loading}
                helperText="This reason will be displayed to librarians attempting to process loans."
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                Deactivating the circulation lock will restore standard book borrowing privileges for librarians and
                proctors immediately.
              </Alert>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Current Lock Reason:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
                  {currentReason || 'No reason specified'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <DZFButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </DZFButton>
          <DZFButton
            type="submit"
            variant={targetLockState ? 'danger' : 'primary'}
            disabled={loading}
          >
            {loading
              ? 'Applying...'
              : targetLockState
              ? 'Confirm Emergency Lock'
              : 'Resume Normal Circulation'}
          </DZFButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
