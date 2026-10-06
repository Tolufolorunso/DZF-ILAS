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
import Divider from '@mui/material/Divider';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import type { IRequisitionItemDTO } from '@/lib/admin/types';

interface RequisitionReviewDialogProps {
  open: boolean;
  requisition: IRequisitionItemDTO | null;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: 'approved' | 'rejected' | 'done',
    comment?: string,
    price?: number
  ) => Promise<void>;
}

export default function RequisitionReviewDialog(props: RequisitionReviewDialogProps) {
  if (!props.open || !props.requisition) return null;
  return <RequisitionReviewDialogContent {...props} requisition={props.requisition} />;
}

function RequisitionReviewDialogContent({
  open,
  requisition,
  onClose,
  onUpdateStatus,
}: RequisitionReviewDialogProps & { requisition: IRequisitionItemDTO }) {
  const [comment, setComment] = React.useState('');
  const [priceInput, setPriceInput] = React.useState(
    requisition.price ? String(requisition.price) : ''
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAction = async (status: 'approved' | 'rejected' | 'done') => {
    try {
      setLoading(true);
      setError(null);
      const parsedPrice = priceInput ? parseFloat(priceInput) : undefined;
      await onUpdateStatus(requisition.id, status, comment.trim() || undefined, parsedPrice);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
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
      slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              Review Requisition Request
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Submitted by {requisition.createdBy} • {new Date(requisition.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <DZFBadge
            variant={
              requisition.status === 'approved'
                ? 'success'
                : requisition.status === 'rejected'
                ? 'error'
                : 'warning'
            }
            label={requisition.status.toUpperCase()}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Requested Item & Quantity:
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
            {requisition.item} (Qty: {requisition.quantity})
          </Typography>
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Staff Justification / Rationale:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              p: 1.5,
              borderRadius: '8px',
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: dzfColors.navy[900],
            }}
          >
            {requisition.rationale}
          </Typography>
        </Box>

        {requisition.description && (
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Specifications / Details:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {requisition.description}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Approved Unit Price (₦)"
            type="number"
            size="small"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            disabled={loading}
            sx={{ width: 200 }}
          />
          <TextField
            label="Administrator Note / Feedback"
            size="small"
            placeholder="Add note for requesting staff..."
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
          />
        </Box>

        {requisition.comments && requisition.comments.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
              Previous Comments:
            </Typography>
            {requisition.comments.map((c, idx) => (
              <Box key={idx} sx={{ p: 1, mb: 1, bgcolor: '#f1f5f9', borderRadius: '6px' }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {c.commenter}:
                </Typography>{' '}
                <Typography variant="caption">{c.comment}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <DZFButton variant="secondary" onClick={onClose} disabled={loading}>
          Close
        </DZFButton>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <DZFButton
            variant="danger"
            onClick={() => handleAction('rejected')}
            disabled={loading}
          >
            Reject Request
          </DZFButton>
          <DZFButton
            variant="primary"
            onClick={() => handleAction('approved')}
            disabled={loading}
          >
            Approve Request
          </DZFButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
