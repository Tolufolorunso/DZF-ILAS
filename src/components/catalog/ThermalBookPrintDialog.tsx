'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { CloseIcon, PrinterIcon, CheckCircleIcon } from '@/components/ui/DZFIcons';
import ThermalBookLabel, { ThermalBookLabelData } from './ThermalBookLabel';
import { printBookLabels } from '@/lib/thermal';

interface ThermalBookPrintDialogProps {
  open: boolean;
  onClose: () => void;
  labels: ThermalBookLabelData[] | null;
}

export default function ThermalBookPrintDialog({
  open,
  onClose,
  labels,
}: ThermalBookPrintDialogProps) {
  const [printing, setPrinting] = React.useState<boolean>(false);
  const [printSuccess, setPrintSuccess] = React.useState<boolean>(false);
  const [printError, setPrintError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setPrinting(false);
      setPrintSuccess(false);
      setPrintError(null);
    }
  }, [open]);

  if (!labels || labels.length === 0) return null;

  const isBatch = labels.length > 1;

  const handlePrintAll = async () => {
    setPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      const ok = await printBookLabels(labels);
      if (ok) {
        setPrintSuccess(true);
      } else {
        setPrintError('Print engine did not complete. Please check browser printer permissions.');
      }
    } catch (err: any) {
      setPrintError(err?.message || 'Failed to trigger isolated book label print.');
    } finally {
      setPrinting(false);
    }
  };

  const handleTestPrintSingle = async () => {
    if (!labels || labels.length === 0) return;
    setPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      const ok = await printBookLabels([labels[0]]);
      if (ok) {
        setPrintSuccess(true);
      } else {
        setPrintError('Test print failed to launch.');
      }
    } catch (err: any) {
      setPrintError(err?.message || 'Failed to trigger test label print.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: 'rgba(128, 0, 32, 0.08)',
              color: dzfColors.maroon[900],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PrinterIcon size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[900] }}>
              {isBatch ? `Print ${labels.length} Book Spine Labels` : 'Print Book Spine & Cover Label'}
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Isolated POS Roll Print Pipeline • Standard 60mm × 40mm Adhesive Roll
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: dzfColors.surfaces.textMuted }}>
          <CloseIcon size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        {printError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPrintError(null)}>
            {printError}
          </Alert>
        )}

        {printSuccess && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon size={20} />}
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setPrintSuccess(false)}
          >
            Print dialog dispatched via isolated iframe pipeline. If margins appear, ensure &quot;None&quot; is selected in printer options.
          </Alert>
        )}

        <Alert
          severity="info"
          sx={{
            mb: 2.5,
            borderRadius: 2,
            fontSize: '0.8125rem',
            backgroundColor: 'rgba(23, 50, 77, 0.04)',
            color: dzfColors.navy[900],
            border: `1px solid rgba(23, 50, 77, 0.12)`,
          }}
        >
          For optimal Xprinter XP-365B output: Select <strong>Paper Size: 60mm × 40mm</strong> and <strong>Margins: None</strong>. Headless engine prevents page wrapper hiding issues.
        </Alert>

        {/* Visual Previews */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2.5,
            maxHeight: '420px',
            overflowY: 'auto',
            p: 2,
            backgroundColor: '#e2e8f0',
            borderRadius: 2,
            border: `1px solid ${dzfColors.surfaces.border}`,
          }}
        >
          {labels.map((item, index) => (
            <Box
              key={`${item.barcode}-${index}`}
              sx={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                borderRadius: '2px',
                backgroundColor: '#ffffff',
              }}
            >
              <ThermalBookLabel data={item} scale={1} showBorder={false} />
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          justifyContent: 'space-between',
        }}
      >
        <DZFButton variant="soft" onClick={onClose} disabled={printing}>
          Cancel
        </DZFButton>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {isBatch && (
            <Tooltip title="Print strictly the 1st label to check paper alignment before running the full batch">
              <span>
                <DZFButton
                  variant="secondary"
                  size="medium"
                  disabled={printing || labels.length === 0}
                  onClick={handleTestPrintSingle}
                >
                  Test Print (1 Label)
                </DZFButton>
              </span>
            </Tooltip>
          )}

          <DZFButton
            variant="primary"
            startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrinterIcon size={18} />}
            onClick={handlePrintAll}
            disabled={printing || labels.length === 0}
          >
            {printing
              ? 'Launching Printer...'
              : `Print ${isBatch ? `All (${labels.length}) Labels` : '60×40mm Label'}`}
          </DZFButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
