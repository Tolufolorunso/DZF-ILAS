'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import { dzfColors } from '@/theme/colors';
import { DZFButton } from '@/components/ui/DZFButton';
import {
  BarcodeIcon,
  UsersIcon,
  CheckIcon,
  CloseIcon,
  RefreshIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@/components/ui/DZFIcons';
import type { EnrichedStudent } from '@/lib/cohorts/service';

interface SessionStudentRow {
  barcode: string;
  firstname: string;
  surname: string;
  schoolClass: string;
  attended: boolean;
  markedBy?: string;
}

interface ScanLogEntry {
  barcode: string;
  name: string;
  status: 'success' | 'error';
  message: string;
  time: string;
}

interface CohortAttendanceStudioModalProps {
  open: boolean;
  onClose: () => void;
  cohortType: string;
  cohortDisplayName: string;
  students: EnrichedStudent[];
  onAttendanceRecorded: () => void;
}

export function CohortAttendanceStudioModal({
  open,
  onClose,
  cohortType,
  cohortDisplayName,
  students,
  onAttendanceRecorded,
}: CohortAttendanceStudioModalProps) {
  // Session configuration
  const todayStr = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [sessionDate, setSessionDate] = React.useState<string>(todayStr);
  const [sessionWeek, setSessionWeek] = React.useState<number>(1);
  const [activeTab, setActiveTab] = React.useState<'scanner' | 'roster'>('scanner');

  // Scanner state
  const [barcodeInput, setBarcodeInput] = React.useState<string>('');
  const [isScanning, setIsScanning] = React.useState<boolean>(false);
  const [scanLogs, setScanLogs] = React.useState<ScanLogEntry[]>([]);
  const [showBulkPaste, setShowBulkPaste] = React.useState<boolean>(false);
  const [bulkBarcodesText, setBulkBarcodesText] = React.useState<string>('');
  const [bulkSubmitting, setBulkSubmitting] = React.useState<boolean>(false);

  // Roster state
  const [rosterRows, setRosterRows] = React.useState<SessionStudentRow[]>([]);
  const [loadingRoster, setLoadingRoster] = React.useState<boolean>(false);
  const [rosterSearch, setRosterSearch] = React.useState<string>('');
  const [savingRowBarcode, setSavingRowBarcode] = React.useState<string | null>(null);
  const [batchUpdating, setBatchUpdating] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus barcode input when modal opens or tab changes to scanner
  React.useEffect(() => {
    if (open && activeTab === 'scanner') {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [open, activeTab]);

  // Audio chime synthesizer for barcode scan feedback
  const playScanSound = React.useCallback((isError = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isError) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }, []);

  // Fetch session attendance whenever session date, week, or cohortType changes
  const fetchSessionAttendance = React.useCallback(async () => {
    if (!cohortType) return;
    setLoadingRoster(true);
    try {
      const res = await fetch(
        `/api/cohorts/${cohortType}/attendance?date=${encodeURIComponent(sessionDate)}&week=${sessionWeek}`
      );
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.students)) {
        setRosterRows(
          data.students.map((st: SessionStudentRow) => ({
            barcode: st.barcode,
            firstname: st.firstname,
            surname: st.surname,
            schoolClass: st.schoolClass || '',
            attended: Boolean(st.attended),
            markedBy: st.markedBy || '',
          }))
        );
      } else {
        // Fallback from props
        setRosterRows(
          students
            .filter((s) => !s.isRemoved)
            .map((s) => {
              const matched = (s.attendance || []).find((a) => a.week === sessionWeek);
              return {
                barcode: s.barcode,
                firstname: s.firstname,
                surname: s.surname,
                schoolClass: s.schoolClass || '',
                attended: Boolean(matched && matched.attended),
                markedBy: matched?.markedBy || '',
              };
            })
        );
      }
    } catch (err) {
      console.error('Failed to load session attendance:', err);
    } finally {
      setLoadingRoster(false);
    }
  }, [cohortType, sessionDate, sessionWeek, students]);

  React.useEffect(() => {
    if (open) {
      fetchSessionAttendance();
    }
  }, [open, fetchSessionAttendance]);

  // Handle single scan via input
  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanBarcode = barcodeInput.trim();
    if (!cleanBarcode || isScanning) return;

    setIsScanning(true);
    setBarcodeInput('');

    try {
      const res = await fetch(`/api/cohorts/${cohortType}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: cleanBarcode,
          date: sessionDate,
          week: sessionWeek,
          attended: true,
        }),
      });

      const data = await res.json();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (res.ok && data.success && data.markedCount > 0) {
        const markedItem = data.marked[0];
        playScanSound(false);
        setScanLogs((prev) => [
          {
            barcode: cleanBarcode,
            name: markedItem?.name || cleanBarcode,
            status: 'success',
            message: `Week ${sessionWeek} Attendance Marked`,
            time: timeStr,
          },
          ...prev,
        ]);

        // Update roster row locally
        setRosterRows((prev) =>
          prev.map((r) =>
            r.barcode === cleanBarcode ? { ...r, attended: true, markedBy: data.markedBy } : r
          )
        );

        onAttendanceRecorded();
      } else {
        playScanSound(true);
        const reason = data.unmatched?.[0]?.reason || data.error || 'Barcode not found in cohort roster';
        setScanLogs((prev) => [
          {
            barcode: cleanBarcode,
            name: 'Unrecognized Student',
            status: 'error',
            message: reason,
            time: timeStr,
          },
          ...prev,
        ]);
      }
    } catch (err: unknown) {
      playScanSound(true);
      const msg = err instanceof Error ? err.message : String(err);
      setScanLogs((prev) => [
        {
          barcode: cleanBarcode,
          name: 'Error',
          status: 'error',
          message: msg,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } finally {
      setIsScanning(false);
      barcodeInputRef.current?.focus();
    }
  };

  // Handle bulk paste submission
  const handleBulkPasteSubmit = async () => {
    const rawTokens = bulkBarcodesText
      .split(/[\s,;\n\r]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (rawTokens.length === 0) {
      setFeedback({ type: 'error', message: 'No barcodes entered in the text box.' });
      return;
    }

    setBulkSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/cohorts/${cohortType}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcodes: rawTokens,
          date: sessionDate,
          week: sessionWeek,
          attended: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit bulk barcodes');
      }

      playScanSound(false);
      setBulkBarcodesText('');
      setShowBulkPaste(false);

      setFeedback({
        type: 'success',
        message: `Successfully processed ${data.markedCount} of ${data.totalSubmitted} students.${
          data.unmatchedCount > 0 ? ` (${data.unmatchedCount} unmatched)` : ''
        }`,
      });

      await fetchSessionAttendance();
      onAttendanceRecorded();
    } catch (err: unknown) {
      playScanSound(true);
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: msg });
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Toggle single student attendance in roster tab
  const handleToggleStudentAttendance = async (student: SessionStudentRow) => {
    setSavingRowBarcode(student.barcode);
    const newAttended = !student.attended;

    try {
      const res = await fetch(`/api/cohorts/${cohortType}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: student.barcode,
          date: sessionDate,
          week: sessionWeek,
          attended: newAttended,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update attendance');
      }

      setRosterRows((prev) =>
        prev.map((r) =>
          r.barcode === student.barcode ? { ...r, attended: newAttended, markedBy: data.markedBy } : r
        )
      );

      onAttendanceRecorded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSavingRowBarcode(null);
    }
  };

  // Mark all present or all absent in session
  const handleBatchMarkAll = async (targetAttended: boolean) => {
    if (rosterRows.length === 0) return;
    setBatchUpdating(true);
    setFeedback(null);

    try {
      const records = rosterRows.map((r) => ({
        barcode: r.barcode,
        attended: targetAttended,
        week: sessionWeek,
      }));

      const res = await fetch(`/api/cohorts/${cohortType}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          date: sessionDate,
          week: sessionWeek,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update roster attendance');
      }

      setRosterRows((prev) =>
        prev.map((r) => ({ ...r, attended: targetAttended, markedBy: data.markedBy }))
      );

      setFeedback({
        type: 'success',
        message: `Marked all students as ${targetAttended ? 'Present' : 'Absent'} for Week ${sessionWeek}.`,
      });

      onAttendanceRecorded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: msg });
    } finally {
      setBatchUpdating(false);
    }
  };

  // Filtered rows for Roster tab
  const filteredRosterRows = React.useMemo(() => {
    if (!rosterSearch.trim()) return rosterRows;
    const q = rosterSearch.toLowerCase();
    return rosterRows.filter(
      (r) =>
        r.barcode.toLowerCase().includes(q) ||
        r.firstname.toLowerCase().includes(q) ||
        r.surname.toLowerCase().includes(q) ||
        r.schoolClass.toLowerCase().includes(q)
    );
  }, [rosterRows, rosterSearch]);

  const presentCount = rosterRows.filter((r) => r.attended).length;
  const attendanceRate = rosterRows.length > 0 ? Math.round((presentCount / rosterRows.length) * 100) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Dialog Header */}
      <DialogTitle sx={{ p: 2.5, backgroundColor: dzfColors.navy[900], color: '#ffffff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarcodeIcon size={20} color="#ffffff" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                Cohort Attendance Studio
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {cohortDisplayName || cohortType} • Interactive Check-In &amp; Barcode Scanner
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>
            <CloseIcon size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {feedback && (
          <Alert
            severity={feedback.type}
            onClose={() => setFeedback(null)}
            sx={{ mb: 2, borderRadius: '10px', fontSize: '0.85rem' }}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Session Horizon Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: 2,
            mb: 2.5,
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], display: 'block', mb: 0.5 }}>
                Session Date
              </Typography>
              <TextField
                type="date"
                size="small"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                sx={{
                  width: 160,
                  '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#ffffff' },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], display: 'block', mb: 0.5 }}>
                Training Week
              </Typography>
              <TextField
                type="number"
                size="small"
                value={sessionWeek}
                onChange={(e) => setSessionWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
                slotProps={{
                  input: {
                    inputProps: { min: 1, max: 52 },
                  },
                }}
                sx={{
                  width: 100,
                  '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#ffffff' },
                }}
              />
            </Box>
          </Box>

          {/* Quick Metrics */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Chip
              label={`${presentCount} / ${rosterRows.length} Present (${attendanceRate}%)`}
              color={attendanceRate >= 75 ? 'success' : attendanceRate >= 50 ? 'warning' : 'default'}
              sx={{ fontWeight: 700, fontSize: '0.8rem' }}
            />
            <Tooltip title="Refresh Session Attendance">
              <IconButton size="small" onClick={fetchSessionAttendance} disabled={loadingRoster}>
                <RefreshIcon size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Tab Selector */}
        <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                minHeight: 44,
                color: '#64748b',
                '&.Mui-selected': { color: dzfColors.navy[900] },
              },
              '& .MuiTabs-indicator': { backgroundColor: dzfColors.navy[900], height: 3 },
            }}
          >
            <Tab
              value="scanner"
              label="Barcode Scanner Check-In"
              icon={<BarcodeIcon size={16} />}
              iconPosition="start"
            />
            <Tab
              value="roster"
              label={`Roster Check-In Table (${rosterRows.length})`}
              icon={<UsersIcon size={16} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* TAB 0: SCANNER */}
        {activeTab === 'scanner' && (
          <Box>
            {/* Fast Barcode Input */}
            <form onSubmit={handleScanSubmit}>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <TextField
                  inputRef={barcodeInputRef}
                  fullWidth
                  placeholder="Scan student card barcode or type number and press Enter..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  disabled={isScanning}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <BarcodeIcon size={20} color={dzfColors.navy[700]} />
                        </InputAdornment>
                      ),
                      endAdornment: isScanning ? (
                        <InputAdornment position="end">
                          <CircularProgress size={18} />
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                    },
                  }}
                />
                <DZFButton
                  type="submit"
                  variant="primary"
                  disabled={!barcodeInput.trim() || isScanning}
                >
                  Check In
                </DZFButton>
              </Box>
            </form>

            {/* Bulk Paste Toggle */}
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setShowBulkPaste(!showBulkPaste)}
                endIcon={showBulkPaste ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
                sx={{ textTransform: 'none', fontWeight: 700, color: dzfColors.navy[900] }}
              >
                {showBulkPaste ? 'Hide Multi-Barcode Paste' : 'Paste Multiple Barcodes in Bulk'}
              </Button>

              <Collapse in={showBulkPaste}>
                <Box
                  sx={{
                    p: 2,
                    mt: 1,
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                    Enter or paste multiple student barcodes separated by spaces, commas, or newlines:
                  </Typography>
                  <TextField
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    placeholder="20260012, 20260015, 20260018..."
                    value={bulkBarcodesText}
                    onChange={(e) => setBulkBarcodesText(e.target.value)}
                    sx={{
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={() => setBulkBarcodesText('')}>
                      Clear
                    </Button>
                    <DZFButton
                      variant="primary"
                      size="small"
                      onClick={handleBulkPasteSubmit}
                      disabled={bulkSubmitting || !bulkBarcodesText.trim()}
                      startIcon={bulkSubmitting ? <CircularProgress size={14} /> : <CheckIcon size={14} />}
                    >
                      {bulkSubmitting ? 'Processing...' : 'Submit Bulk Attendance'}
                    </DZFButton>
                  </Box>
                </Box>
              </Collapse>
            </Box>

            {/* Recent Scans Feed */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1 }}>
                Live Scanner Feed ({scanLogs.length})
              </Typography>

              {scanLogs.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    border: '1px dashed #e2e8f0',
                    borderRadius: '12px',
                    backgroundColor: '#fafbfc',
                  }}
                >
                  <BarcodeIcon size={32} color="#94a3b8" />
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 1, fontWeight: 600 }}>
                    Ready for barcode scan. Connect your USB barcode reader or type a barcode above.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {scanLogs.map((log, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.25,
                        px: 2,
                        borderRadius: '8px',
                        backgroundColor: log.status === 'success' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                        border: '1px solid',
                        borderColor: log.status === 'success' ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {log.status === 'success' ? (
                          <CheckIcon size={16} color="#16a34a" />
                        ) : (
                          <CloseIcon size={16} color="#dc2626" />
                        )}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                            {log.name} <code style={{ fontSize: '0.75rem', color: '#64748b' }}>({log.barcode})</code>
                          </Typography>
                          <Typography variant="caption" sx={{ color: log.status === 'success' ? '#15803d' : '#b91c1c' }}>
                            {log.message}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {log.time}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* TAB 1: ROSTER CHECK-IN TABLE */}
        {activeTab === 'roster' && (
          <Box>
            {/* Roster Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search students..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon size={16} color="#64748b" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: 220,
                  '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleBatchMarkAll(true)}
                  disabled={batchUpdating || rosterRows.length === 0}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#16a34a',
                    color: '#16a34a',
                    '&:hover': { backgroundColor: 'rgba(22, 163, 74, 0.05)', borderColor: '#15803d' },
                  }}
                >
                  Mark All Present
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleBatchMarkAll(false)}
                  disabled={batchUpdating || rosterRows.length === 0}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#dc2626',
                    color: '#dc2626',
                    '&:hover': { backgroundColor: 'rgba(220, 38, 38, 0.05)', borderColor: '#b91c1c' },
                  }}
                >
                  Mark All Absent
                </Button>
              </Box>
            </Box>

            {/* Roster Table */}
            {loadingRoster ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: dzfColors.navy[900] }} />
              </Box>
            ) : filteredRosterRows.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
                <Typography variant="body2">No students match your filter.</Typography>
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 340,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc', color: dzfColors.navy[900] }}>
                        Barcode
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc', color: dzfColors.navy[900] }}>
                        Student Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc', color: dzfColors.navy[900] }}>
                        Class
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc', color: dzfColors.navy[900] }} align="center">
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc', color: dzfColors.navy[900] }} align="right">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRosterRows.map((student) => {
                      const isSaving = savingRowBarcode === student.barcode;
                      return (
                        <TableRow key={student.barcode} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {student.barcode}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                            {student.firstname} {student.surname}
                          </TableCell>
                          <TableCell sx={{ color: '#64748b' }}>
                            {student.schoolClass || '—'}
                          </TableCell>
                          <TableCell align="center">
                            {student.attended ? (
                              <Chip
                                size="small"
                                label="Present"
                                sx={{
                                  backgroundColor: 'rgba(22, 163, 74, 0.15)',
                                  color: '#15803d',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label="Absent"
                                sx={{
                                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                  color: '#b91c1c',
                                  fontSize: '0.72rem',
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant={student.attended ? 'outlined' : 'contained'}
                              color={student.attended ? 'inherit' : 'primary'}
                              onClick={() => handleToggleStudentAttendance(student)}
                              disabled={isSaving || batchUpdating}
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.72rem',
                                py: 0.3,
                                px: 1.2,
                                fontWeight: 700,
                                backgroundColor: student.attended ? 'transparent' : '#17324d',
                                color: student.attended ? '#b91c1c' : '#ffffff',
                                borderColor: student.attended ? '#cbd5e1' : undefined,
                                '&:hover': {
                                  backgroundColor: student.attended ? 'rgba(220, 38, 38, 0.08)' : '#0b1d2e',
                                  borderColor: student.attended ? '#b91c1c' : undefined,
                                },
                              }}
                            >
                              {isSaving ? (
                                <CircularProgress size={12} />
                              ) : student.attended ? (
                                'Mark Absent'
                              ) : (
                                'Mark Present'
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Certificate Eligibility Banner */}
        <Box
          sx={{
            mt: 2.5,
            p: 1.5,
            borderRadius: '10px',
            backgroundColor: 'rgba(23, 50, 77, 0.04)',
            border: '1px solid rgba(23, 50, 77, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.4 }}>
            💡 <strong>Certificate Milestone Tracking:</strong> Cohort session check-ins count toward graduation qualification (75% attendance benchmark). Patrons receive zero library gamification points for academy classes.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CohortAttendanceStudioModal;

