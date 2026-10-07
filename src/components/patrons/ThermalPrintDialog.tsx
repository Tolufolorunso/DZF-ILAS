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
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import { CloseIcon, PrinterIcon, InfoIcon, CheckCircleIcon } from '@/components/ui/DZFIcons';
import ThermalBarcodeLabel from './ThermalBarcodeLabel';
import { ThermalLabelData, printPatronLabels } from '@/lib/thermal';

interface ThermalPrintDialogProps {
  open: boolean;
  onClose: () => void;
  labels: ThermalLabelData[];
  title?: string;
}

export default function ThermalPrintDialog({
  open,
  onClose,
  labels,
  title = '60×40mm Thermal Barcode Studio',
}: ThermalPrintDialogProps) {
  const [printing, setPrinting] = React.useState<boolean>(false);
  const [printSuccess, setPrintSuccess] = React.useState<boolean>(false);
  const [printError, setPrintError] = React.useState<string | null>(null);
  const [showPrinterTips, setShowPrinterTips] = React.useState<boolean>(false);

  // Reset states when opened
  React.useEffect(() => {
    if (open) {
      setPrinting(false);
      setPrintSuccess(false);
      setPrintError(null);
    }
  }, [open]);

  const handlePrintAll = async () => {
    if (!labels || labels.length === 0) return;
    setPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      const ok = await printPatronLabels(labels);
      if (ok) {
        setPrintSuccess(true);
      } else {
        setPrintError('Print engine did not complete. Please check browser printer permissions.');
      }
    } catch (err: any) {
      setPrintError(err?.message || 'Failed to trigger isolated print job.');
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
      // Print strictly the first label in the batch as a physical test
      const ok = await printPatronLabels([labels[0]]);
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
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              backgroundColor: dzfColors.maroon[50],
              color: dzfColors.maroon[900],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PrinterIcon size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', color: dzfColors.navy[900] }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Isolated POS Roll Print Pipeline • Xprinter XP-365B (60×40mm)
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: dzfColors.surfaces.textMuted }}>
          <CloseIcon size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3, backgroundColor: '#f8fafc' }}>
        {/* Status Alerts */}
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <DZFBadge
            variant="default"
            size="small"
            label={`${labels.length} ${labels.length === 1 ? 'Label' : 'Labels'} Queued`}
          />

          <DZFButton
            variant="secondary"
            size="small"
            onClick={() => setShowPrinterTips(!showPrinterTips)}
            startIcon={<InfoIcon size={14} />}
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            {showPrinterTips ? 'Hide Printer Guide' : 'Printer Setup Tips'}
          </DZFButton>
        </Box>

        {/* Collapsible Xprinter XP-365B Setup Guide */}
        <Collapse in={showPrinterTips}>
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: '#ffffff',
              border: `1px solid ${dzfColors.gold[200] || '#fef08a'}`,
              borderLeft: `4px solid ${dzfColors.gold[500] || '#ca8a04'}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 0.5, fontSize: '0.82rem' }}>
              Optimal Xprinter XP-365B Settings:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: '0.75rem', color: dzfColors.navy[700] }}>
              <li><strong>Paper Size:</strong> 60mm × 40mm (User-Defined / 2.36&quot; × 1.57&quot;)</li>
              <li><strong>Margins:</strong> None (0mm)</li>
              <li><strong>Scale:</strong> 100% or &quot;Actual size&quot;</li>
              <li><strong>Headers & Footers:</strong> Disabled / Unchecked</li>
              <li><strong>Orientation:</strong> Portrait</li>
            </Box>
          </Box>
        </Collapse>

        {/* Interactive Visual Preview Area */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2.5,
            maxHeight: '400px',
            overflowY: 'auto',
            p: 2,
            backgroundColor: '#e2e8f0',
            borderRadius: 2,
            border: `1px solid ${dzfColors.surfaces.border}`,
          }}
        >
          {labels.length === 0 ? (
            <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, py: 4 }}>
              No barcode labels queued for printing.
            </Typography>
          ) : (
            labels.map((item, idx) => (
              <Box
                key={item.barcode + idx}
                sx={{
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  borderRadius: '2px',
                  backgroundColor: '#ffffff',
                }}
              >
                <ThermalBarcodeLabel data={item} showBorder={false} />
              </Box>
            ))
          )}
        </Box>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: dzfColors.surfaces.textMuted,
            mt: 2,
          }}
        >
          ⚡ Isolated POS Engine: Prints in background iframe without modifying main page CSS or hiding dialogs.
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          justifyContent: 'space-between',
        }}
      >
        <DZFButton variant="secondary" onClick={onClose} disabled={printing}>
          Cancel
        </DZFButton>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {labels.length > 1 && (
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
              : `Print ${labels.length === 1 ? 'Label' : `${labels.length} Labels`} (60×40mm)`}
          </DZFButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
