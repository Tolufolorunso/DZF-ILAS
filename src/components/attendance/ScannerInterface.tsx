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
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
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
  CheckIcon,
  BookIcon,
} from '@/components/ui/DZFIcons';
import ManualCheckinModal from './ManualCheckinModal';
import CameraScannerModal from './CameraScannerModal';
import type { ClassType, IAttendanceDocument } from '@/models/Attendance';
import type { PatronAttendanceDTO, SessionOption } from '@/lib/attendance/service';
import {
  LITERACY_GRADE_BANDS,
  ANNUAL_FOUNDATION_EVENTS,
} from '@/lib/constants/foundationEvents';

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
  const [isLiteracyMode, setIsLiteracyMode] = React.useState<boolean>(false);
  const [selectedGradeBandId, setSelectedGradeBandId] = React.useState<string>(
    LITERACY_GRADE_BANDS[0].id
  );
  const [literacySessionCount, setLiteracySessionCount] = React.useState<number>(0);
  const barcodeInputRef = React.useRef<HTMLInputElement | null>(null);

  const activeGradeBand = React.useMemo(() => {
    return (
      LITERACY_GRADE_BANDS.find((gb) => gb.id === selectedGradeBandId) ||
      LITERACY_GRADE_BANDS[0]
    );
  }, [selectedGradeBandId]);

  const allAvailableSessions = React.useMemo(() => {
    const eventSessions = ANNUAL_FOUNDATION_EVENTS.map((ev) => ({
      id: `foundation-${ev.slug}`,
      name: `${ev.name} [${ev.monthLabel}]`,
      classType: (ev.category === 'competition'
        ? 'other'
        : ev.category === 'workshop'
        ? 'workshop'
        : 'library') as ClassType,
      defaultPoints: ev.defaultPoints,
      description: ev.description,
    }));
    return [...sessions, ...eventSessions];
  }, [sessions]);

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

  const handleToggleLiteracyMode = (enabled: boolean) => {
    setIsLiteracyMode(enabled);
    if (enabled) {
      const gb =
        LITERACY_GRADE_BANDS.find((g) => g.id === selectedGradeBandId) ||
        LITERACY_GRADE_BANDS[0];
      setClassType('literacy');
      setClassName(`Literacy Class - ${gb.name} (${gb.gradeBand})`);
      setPoints(gb.defaultPoints);
    } else {
      const found =
        allAvailableSessions.find((s) => s.id === selectedSessionId) ||
        allAvailableSessions[0];
      if (found) {
        setClassType(found.classType);
        setClassName(found.name);
        setPoints(found.defaultPoints);
      }
    }
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 60);
  };

  const handleSelectGradeBand = (gradeBandId: string) => {
    setSelectedGradeBandId(gradeBandId);
    const gb = LITERACY_GRADE_BANDS.find((g) => g.id === gradeBandId);
    if (gb) {
      setClassType('literacy');
      setClassName(`Literacy Class - ${gb.name} (${gb.gradeBand})`);
      setPoints(gb.defaultPoints);
    }
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 60);
  };

  // Persistent autofocus retention across window focus
  React.useEffect(() => {
    const handleWindowFocus = () => {
      if (!manualModalOpen && !cameraModalOpen) {
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [manualModalOpen, cameraModalOpen]);

  // When selected session changes, update defaults
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const found = allAvailableSessions.find((s) => s.id === sessionId);
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
          if (isLiteracyMode) {
            setLiteracySessionCount((prev) => prev + 1);
          }
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
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 60);
      }
    },
    [isProcessing, classType, className, classDate, points, soundEnabled, isLiteracyMode, onScanSuccess]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1-Click Literacy Class Studio or Fast-Switch Banner */}
      {isLiteracyMode ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '2px solid #6f1111',
            background: 'linear-gradient(135deg, #fdf8f8 0%, #fff 100%)',
            boxShadow: '0 6px 18px rgba(111,17,17,0.06)',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: 2,
                  bgcolor: '#6f1111',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <BookIcon size={20} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: dzfColors.maroon[900] }}>
                    Literacy Class Fast-Track Studio
                  </Typography>
                  <DZFBadge label="FAST-TRACK ACTIVE" variant="primary" size="small" />
                  <DZFBadge label="+5 PTS / SCAN" variant="warning" size="small" />
                </Box>
                <Typography sx={{ fontSize: '0.825rem', color: dzfColors.surfaces.textSecondary }}>
                  Continuous scanner autofocus enabled for rapid student check-ins.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  px: 2,
                  py: 0.6,
                  borderRadius: 2,
                  bgcolor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: dzfColors.navy[900] }}>
                  Session Attendees:
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: dzfColors.maroon[900] }}>
                  {literacySessionCount}
                </Typography>
                {literacySessionCount > 0 && (
                  <Chip
                    size="small"
                    label="Reset"
                    onClick={() => setLiteracySessionCount(0)}
                    sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }}
                  />
                )}
              </Box>

              <DZFButton
                variant="secondary"
                size="small"
                onClick={() => handleToggleLiteracyMode(false)}
              >
                Switch to Standard Mode
              </DZFButton>
            </Box>
          </Box>

          {/* Grade-Band Preset Selector Pills */}
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: dzfColors.surfaces.textMuted, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Active Grade-Band:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {LITERACY_GRADE_BANDS.map((gb) => {
                const isSelected = gb.id === selectedGradeBandId;
                return (
                  <Chip
                    key={gb.id}
                    label={`${gb.name} (${gb.gradeBand})`}
                    onClick={() => handleSelectGradeBand(gb.id)}
                    icon={isSelected ? <CheckIcon size={16} color="#fff" /> : undefined}
                    sx={{
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.825rem',
                      py: 2.2,
                      px: 1,
                      cursor: 'pointer',
                      borderRadius: 2,
                      bgcolor: isSelected ? dzfColors.maroon[900] : '#ffffff',
                      color: isSelected ? '#ffffff' : dzfColors.navy[900],
                      border: isSelected ? '1px solid #6f1111' : '1px solid #e2e8f0',
                      boxShadow: isSelected ? '0 2px 8px rgba(111,17,17,0.2)' : 'none',
                      '&:hover': {
                        bgcolor: isSelected ? dzfColors.maroon[950] : '#f8fafc',
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        </Paper>
      ) : (
        /* Standard Session Configuration Card with Fast-Track Switch Bar */
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
          {/* Quick-Switch Prompt */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              p: 1.5,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: '#fdf2f2',
              border: '1px solid #fecaca',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookIcon size={18} color={dzfColors.maroon[800]} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: dzfColors.maroon[950] }}>
                Running digital literacy or reading classes today?
              </Typography>
            </Box>
            <DZFButton
              variant="primary"
              size="small"
              onClick={() => handleToggleLiteracyMode(true)}
            >
              ⚡ 1-Click Literacy Class Mode
            </DZFButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LayersIcon size={20} color={dzfColors.maroon[800]} />
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: dzfColors.maroon[900] }}>
                Standard Session Configuration
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
            {/* Preset Session Selector with Annual Foundation Events */}
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="session-select-label">Preset Session / Annual Event</InputLabel>
                <Select
                  labelId="session-select-label"
                  value={selectedSessionId}
                  label="Preset Session / Annual Event"
                  onChange={(e) => handleSessionChange(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {allAvailableSessions.map((s) => (
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
      )}

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
              {isLiteracyMode
                ? `Ready for ${activeGradeBand.name} (${activeGradeBand.gradeBand}) student badges with persistent autofocus.`
                : 'Ready for physical USB/Bluetooth scanners, keyboard wedges, or camera feeds.'}
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
            ref={barcodeInputRef}
            label={
              isLiteracyMode
                ? `Scan Student Barcode for ${activeGradeBand.name} (${activeGradeBand.gradeBand})`
                : 'Scan Patron Card Barcode'
            }
            placeholder={
              isLiteracyMode
                ? `Ready to scan ${activeGradeBand.name} badges (e.g. 20260584)...`
                : 'Scan barcode (e.g. 20230001, 20260584)...'
            }
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
