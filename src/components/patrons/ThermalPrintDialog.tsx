'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import { CloseIcon, PrinterIcon } from '@/components/ui/DZFIcons';
import ThermalBarcodeLabel, { ThermalLabelData } from './ThermalBarcodeLabel';

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
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Global Print Style Injection strictly targeting 60mm x 40mm thermal rolls */}
      <style jsx global>{`
        @media print {
          @page {
            size: 60mm 40mm !important;
            margin: 0mm !important;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html,
          body {
            width: 60mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          /* Hide everything in the page except the thermal print area */
          body > *:not(.thermal-print-container) {
            display: none !important;
          }
          /* Ensure modal backdrop and layout shells do not appear in print */
          .MuiDialog-root,
          .MuiBackdrop-root {
            display: none !important;
          }
          .thermal-print-container {
            display: block !important;
            position: static !important;
            width: 60mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .thermal-label-card {
            width: 60mm !important;
            height: 40mm !important;
            min-height: 40mm !important;
            max-height: 40mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 2.5mm 2mm !important;
            box-shadow: none !important;
            border: none !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Visual Dialog Modal */}
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
                Standard 60mm × 40mm thermal label paper format
              </Typography>
            </Box>
          </Box>

          <IconButton size="small" onClick={onClose} sx={{ color: dzfColors.surfaces.textMuted }}>
            <CloseIcon size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 3, backgroundColor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <DZFBadge
              variant="default"
              size="small"
              label={`${labels.length} ${labels.length === 1 ? 'Label' : 'Labels'} Queued for Thermal Print`}
            />
          </Box>

          {/* Interactive Visual Preview Area */}
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
            {labels.map((item, idx) => (
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
            ))}
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
            💡 Note: In your browser print dialog, select your thermal barcode printer and ensure margins are set to &quot;None&quot;.
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
          <DZFButton variant="secondary" onClick={onClose}>
            Cancel
          </DZFButton>

          <DZFButton
            variant="primary"
            startIcon={<PrinterIcon size={18} />}
            onClick={handlePrint}
          >
            Print {labels.length === 1 ? 'Label' : `${labels.length} Labels`} (60×40mm)
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* Hidden Thermal Print Container rendered directly into DOM for print target */}
      {open && (
        <div className="thermal-print-container" style={{ display: 'none' }}>
          {labels.map((item, idx) => (
            <ThermalBarcodeLabel key={'print-' + item.barcode + idx} data={item} showBorder={false} />
          ))}
        </div>
      )}
    </>
  );
}
