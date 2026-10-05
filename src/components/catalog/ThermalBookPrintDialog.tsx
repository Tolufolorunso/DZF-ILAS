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
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { CloseIcon, PrinterIcon } from '@/components/ui/DZFIcons';
import ThermalBookLabel, { ThermalBookLabelData } from './ThermalBookLabel';

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
  if (!labels || labels.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const isBatch = labels.length > 1;

  return (
    <>
      {/* 1. Interactive On-Screen Modal */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        className="no-print"
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
                Standard 60mm × 40mm Thermal Adhesive Label Paper Roll
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={onClose} size="small" sx={{ color: dzfColors.surfaces.textMuted }}>
            <CloseIcon size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, backgroundColor: '#f8fafc' }}>
          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: 2,
              fontSize: '0.8125rem',
              backgroundColor: 'rgba(23, 50, 77, 0.04)',
              color: dzfColors.navy[900],
              border: `1px solid rgba(23, 50, 77, 0.12)`,
            }}
          >
            In your browser print dialog, set <strong>Destination</strong> to your 60×40 thermal printer, <strong>Paper Size</strong> to <strong>60mm × 40mm</strong> (or 2.36&quot; × 1.57&quot;), and <strong>Margins</strong> to <strong>None</strong>.
          </Alert>

          {/* Visual Previews */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2.5,
              maxHeight: '50vh',
              overflowY: 'auto',
              p: 2,
              backgroundColor: '#e2e8f0',
              borderRadius: 2,
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
          <DZFButton variant="soft" onClick={onClose}>
            Cancel
          </DZFButton>

          <DZFButton
            variant="primary"
            startIcon={<PrinterIcon size={18} />}
            onClick={handlePrint}
          >
            Print {isBatch ? `All (${labels.length}) Labels` : '60×40mm Label'}
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* 2. Print-Only Container (Rendered when printing) */}
      <Box
        className="print-only-container"
        sx={{
          display: 'none',
          '@media print': {
            display: 'block !important',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '60mm',
            margin: 0,
            padding: 0,
          },
        }}
      >
        {labels.map((item, index) => (
          <ThermalBookLabel key={`print-${item.barcode}-${index}`} data={item} showBorder={false} />
        ))}
      </Box>

      {/* CSS Styles for Continuous Thermal Label Rolls */}
      <style jsx global>{`
        @media print {
          @page {
            size: 60mm 40mm;
            margin: 0;
          }
          html, body {
            width: 60mm;
            height: 40mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .no-print,
          header,
          nav,
          aside,
          footer,
          .MuiDialog-root {
            display: none !important;
          }
          .print-only-container {
            display: block !important;
          }
          .thermal-book-label-card {
            width: 60mm !important;
            height: 40mm !important;
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </>
  );
}
