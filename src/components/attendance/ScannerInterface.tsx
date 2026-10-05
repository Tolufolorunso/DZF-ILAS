'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { dzfColors } from '@/theme/colors';
import { DZFBarcodeInput, DZFButton, DZFBadge } from '@/components/ui';
import {
  AlertTriangleIcon,
  SearchIcon,
  TrophyIcon,
  VolumeIcon,
  VolumeMuteIcon,
  CameraIcon,
  LayersIcon,
} from '@/components/ui/DZFIcons';
import ManualCheckinModal from './ManualCheckinModal';
import CameraScannerModal from './CameraScannerModal';
import type { ClassType, IAttendanceDocument } from '@/models/Attendance';
import type { PatronAttendanceDTO, SessionOption } from '@/lib/attendance/service';

export interface ScanFeedback {
  status: 'idle' | 'success' | 'duplicate' | 'error';
  message: string;
  patron?: PatronAttendanceDTO;
  pointsAwarded?: number;
  scanTime?: string;
  existingTime?: string;
}

export interface ScannerInterfaceProps {
  sessions: SessionOption[];
  onScanSuccess: (scanRecord: IAttendanceDocument) => void;
  currentPoints?: number;
}

/**
 * Plays immediate Web Audio API chimes for scan events without external files.
 */
function playTone(type: 'success' | 'duplicate' | 'error') {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.08); // G6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.08);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === 'duplicate') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(196, ctx.currentTime);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Ignored if sound blocked by browser policy
  }
}

export default function ScannerInterface({
  sessions,
  onScanSuccess,
}: ScannerInterfaceProps) {
  // Session Configuration State
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>(
    sessions[0]?.id || 'general-reading'
  );
  const [classType, setClassType] = React.useState<ClassType>('library');
  const [className, setClassName] = React.useState<string>('General Reading & Study');
  const [classDate, setClassDate] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [points, setPoints] = React.useState<number>(2);

  // Sound & Modals
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true);
  const [manualModalOpen, setManualModalOpen] = React.useState<boolean>(false);
  const [cameraModalOpen, setCameraModalOpen] = React.useState<boolean>(false);

  // Scan state
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<ScanFeedback>({
    status: 'idle',
    message: 'Scanner active. Scan patron barcode card or student badge.',
  });

  // When selected session changes, update defaults
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      setClassType(found.classType);
      setClassName(found.name);
      setPoints(found.defaultPoints);
    }
  };

  // Barcode Scan Handler
  const handleBarcodeScan = React.useCallback(
    async (scannedBarcode: string) => {
      const cleanBarcode = scannedBarcode.trim();
      if (!cleanBarcode || isProcessing) return;

      setIsProcessing(true);
      setFeedback({ status: 'idle', message: `Verifying barcode "${cleanBarcode}"...` });

      try {
        const response = await fetch('/api/attendance/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode: cleanBarcode,
            classType,
            className,
            classDate,
            points,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (soundEnabled) playTone('success');
          const scanTimeStr = new Date(data.attendance.attendanceTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          setFeedback({
            status: 'success',
            message: `Check-in confirmed: ${data.patron?.fullName} (+${points} pts)`,
            patron: data.patron,
            pointsAwarded: points,
            scanTime: scanTimeStr,
          });

          onScanSuccess(data.attendance);
        } else if (response.status === 409 && data.alreadyMarked) {
          if (soundEnabled) playTone('duplicate');
          const existingTimeStr = data.existingAttendance?.attendanceTime
            ? new Date(data.existingAttendance.attendanceTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'earlier today';

          setFeedback({
            status: 'duplicate',
            message: data.error || `Already marked present today at ${existingTimeStr}.`,
            patron: data.patron,
            existingTime: existingTimeStr,
          });
        } else {
          if (soundEnabled) playTone('error');
          setFeedback({
            status: 'error',
            message: data.error || 'Barcode scan failed or patron not found.',
          });
        }
      } catch (err) {
        console.error('Scan error:', err);
        if (soundEnabled) playTone('error');
        setFeedback({
          status: 'error',
          message: 'Network error or communication failure with attendance server.',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, classType, className, classDate, points, soundEnabled, onScanSuccess]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Session Configuration Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(11,29,46,0.03)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon size={20} color={dzfColors.maroon[800]} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: dzfColors.maroon[900] }}>
              Active Session Configuration
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
              sx={{
                color: soundEnabled ? dzfColors.navy[700] : '#94a3b8',
                bgcolor: soundEnabled ? '#f1f5f9' : 'transparent',
              }}
            >
              {soundEnabled ? <VolumeIcon size={18} /> : <VolumeMuteIcon size={18} />}
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Preset Session Selector */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="session-select-label">Preset Session</InputLabel>
              <Select
                labelId="session-select-label"
                value={selectedSessionId}
                label="Preset Session"
                onChange={(e) => handleSessionChange(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {sessions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.classType})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Session / Class Name */}
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Session / Class Name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* Session Date */}
          <Grid size={{ xs: 6, md: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Session Date"
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* Points Awarded */}
          <Grid size={{ xs: 6, md: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Points per Scan"
              value={points}
              onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Main Scanner Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(11,29,46,0.05)',
        }}
      >
        {/* Header Action Tools */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
            mb: 3,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: dzfColors.navy[950] }}>
              High-Speed Barcode Scanner
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: dzfColors.surfaces.textSecondary }}>
              Ready for physical USB/Bluetooth scanners, keyboard wedges, or camera feeds.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <DZFButton
              variant="secondary"
              size="small"
              startIcon={<SearchIcon size={16} />}
              onClick={() => setManualModalOpen(true)}
            >
              Manual Search
            </DZFButton>
            <DZFButton
              variant="secondary"
              size="small"
              startIcon={<CameraIcon size={16} />}
              onClick={() => setCameraModalOpen(true)}
            >
              Camera Scanner
            </DZFButton>
          </Box>
        </Box>

        {/* Barcode Input with Auto-focus */}
        <Box sx={{ maxWidth: 720, mx: 'auto', mb: 3 }}>
          <DZFBarcodeInput
            label="Scan Patron Card Barcode"
            placeholder="Scan barcode (e.g. 20230001, 20260584)..."
            onScan={handleBarcodeScan}
            autoSubmitOnEnter
            keepFocused
            disabled={isProcessing}
            debounceMs={120}
          />

          {isProcessing && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={18} sx={{ color: dzfColors.navy[700] }} />
              <Typography sx={{ fontSize: '0.85rem', color: dzfColors.navy[700], fontWeight: 500 }}>
                Logging attendance...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Scan Result Feedback Card */}
        {feedback.status === 'success' && feedback.patron && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #34d399',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={feedback.patron.photo}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: '#059669',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  border: '2px solid #a7f3d0',
                }}
              >
                {feedback.patron.firstname[0]}
              </Avatar>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#064e3b' }}>
                    {feedback.patron.fullName}
                  </Typography>
                  <DZFBadge label="CHECKED IN" variant="success" size="small" />
                  <DZFBadge label={feedback.patron.barcode} variant="info" size="small" />
                </Box>
                <Typography sx={{ fontSize: '0.85rem', color: '#065f46', mt: 0.5 }}>
                  {feedback.patron.schoolClass ? `${feedback.patron.schoolClass} • ` : ''}
                  {feedback.patron.patronType.toUpperCase()} • Recorded at {feedback.scanTime}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: '#ffffff',
                px: 2,
                py: 1.25,
                borderRadius: 2,
                border: '1px solid #a7f3d0',
              }}
            >
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: dzfColors.surfaces.textMuted }}>
                  AWARDED
                </Typography>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                  +{feedback.pointsAwarded} pts
                </Typography>
              </Box>
              <TrophyIcon size={24} color={dzfColors.gold[500]} />
            </Box>
          </Box>
        )}

        {/* Duplicate Scan Warning Card */}
        {feedback.status === 'duplicate' && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <AlertTriangleIcon size={32} color="#d97706" />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#78350f' }}>
                Duplicate Check-In Detected
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#92400e', mt: 0.25 }}>
                {feedback.message}
              </Typography>
              {feedback.patron && (
                <Typography sx={{ fontSize: '0.8rem', color: '#78350f', mt: 0.5 }}>
                  Patron: <strong>{feedback.patron.fullName}</strong> ({feedback.patron.barcode})
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Error Card */}
        {feedback.status === 'error' && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              backgroundColor: '#fef2f2',
              border: '1.5px solid #f87171',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <AlertTriangleIcon size={28} color="#dc2626" />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#7f1d1d' }}>
                Attendance Check-In Failed
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#b91c1c', mt: 0.25 }}>
                {feedback.message}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Idle Status Guide */}
        {feedback.status === 'idle' && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: dzfColors.surfaces.canvas,
              border: '1px dashed #cbd5e1',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.85rem', color: dzfColors.surfaces.textMuted }}>
              {feedback.message}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Manual Checkin Modal */}
      <ManualCheckinModal
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSelectPatron={handleBarcodeScan}
        currentSessionName={className}
      />

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onScan={handleBarcodeScan}
        currentSessionName={className}
      />
    </Box>
  );
}
