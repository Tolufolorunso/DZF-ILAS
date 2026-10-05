'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';
import { DZFButton } from '@/components/ui';
import { CloseIcon, BarcodeIcon } from '@/components/ui/DZFIcons';

interface CameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  currentSessionName: string;
}

export default function CameraScannerModal({
  open,
  onClose,
  onScan,
  currentSessionName,
}: CameraScannerModalProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [manualCode, setManualCode] = React.useState('');

  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    let active = true;

    if (open) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          })
          .then((stream) => {
            if (active) {
              streamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
              }
            } else {
              stream.getTracks().forEach((track) => track.stop());
            }
          })
          .catch((err) => {
            console.warn('Camera stream error:', err);
            if (active) {
              setCameraError('Unable to access device camera. Please check camera permissions.');
            }
          });
      } else {
        setTimeout(() => {
          if (active) {
            setCameraError('Camera access is not supported by your browser.');
          }
        }, 0);
      }
    }

    return () => {
      active = false;
      stopCamera();
    };
  }, [open, stopCamera]);

  const handleCloseModal = () => {
    stopCamera();
    setCameraError(null);
    setManualCode('');
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      handleCloseModal();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseModal}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(11,29,46,0.25)',
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
          borderBottom: '1px solid #e2e8f0',
          px: 3,
          py: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', color: dzfColors.maroon[900] }}>
            Mobile Camera Barcode Scanner
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: dzfColors.surfaces.textSecondary, mt: 0.25 }}>
            Session: <strong>{currentSessionName}</strong>
          </Typography>
        </Box>
        <Box
          component="button"
          onClick={handleCloseModal}
          sx={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            p: 0.5,
            borderRadius: 1,
            color: '#94a3b8',
            '&:hover': { color: '#334155', background: '#f1f5f9' },
          }}
        >
          <CloseIcon size={20} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 280,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: '#0b1d2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          {!cameraError ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Target viewfinder box */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '75%',
                  height: 120,
                  border: `2px solid ${dzfColors.gold[400]}`,
                  borderRadius: 2,
                  boxShadow: '0 0 0 9999px rgba(11, 29, 46, 0.45)',
                  pointerEvents: 'none',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                  },
                }}
              />
            </>
          ) : (
            <Box sx={{ p: 3, color: '#ffffff' }}>
              <BarcodeIcon size={40} color={dzfColors.gold[400]} />
              <Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#e2e8f0' }}>
                {cameraError}
              </Typography>
            </Box>
          )}
        </Box>

        <Box component="form" onSubmit={handleManualSubmit} sx={{ display: 'flex', gap: 1 }}>
          <Box
            component="input"
            type="text"
            placeholder="Or enter 8-digit barcode manually..."
            value={manualCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualCode(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <DZFButton type="submit" variant="primary">
            Submit
          </DZFButton>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9' }}>
        <DZFButton variant="soft" onClick={handleCloseModal}>
          Close Scanner
        </DZFButton>
      </DialogActions>
    </Dialog>
  );
}
