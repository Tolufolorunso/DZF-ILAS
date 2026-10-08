'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { IParsedCalendarEvent } from '@/lib/calendar/pdf-parser';

interface CalendarPdfUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  initialYear?: number;
}

const CATEGORIES = [
  { value: 'assembly', label: 'Assembly / Induction', color: '#1E3A8A' },
  { value: 'workshop', label: 'Workshop / Training', color: '#D97706' },
  { value: 'competition', label: 'Competition / Sports', color: '#059669' },
  { value: 'holiday', label: 'Holiday / Recess', color: '#DC2626' },
  { value: 'meeting', label: 'Meeting / Council', color: '#7C3AED' },
  { value: 'general', label: 'General Milestone', color: '#4B5563' },
];

export default function CalendarPdfUploadDialog({
  open,
  onClose,
  onSuccess,
  initialYear = new Date().getFullYear(),
}: CalendarPdfUploadDialogProps) {
  const [selectedYear, setSelectedYear] = React.useState<number>(initialYear);
  const [file, setFile] = React.useState<File | null>(null);
  const [parsing, setParsing] = React.useState<boolean>(false);
  const [importing, setImporting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const [parsedEvents, setParsedEvents] = React.useState<IParsedCalendarEvent[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync initialYear when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedYear(initialYear);
      setError(null);
      setSuccessMsg(null);
    }
  }, [open, initialYear]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file (.pdf).');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleParsePdf = async () => {
    if (!file) {
      setError('Please select a calendar PDF file first.');
      return;
    }

    try {
      setParsing(true);
      setError(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetYear', String(selectedYear));

      const res = await fetch('/api/admin/calendar/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract text from calendar PDF.');
      }

      if (!data.events || data.events.length === 0) {
        setError(
          'No calendar events could be automatically recognized in this PDF. You can add items manually below or check the file format.'
        );
        setParsedEvents([]);
      } else {
        setParsedEvents(data.events);
        setSuccessMsg(
          `Extracted ${data.events.length} milestones across ${data.totalPages || 1} page(s). Please review and adjust below before importing.`
        );
      }
    } catch (err) {
      console.error('[PARSE_PDF_ERROR]', err);
      setError(err instanceof Error ? err.message : 'Error processing calendar PDF.');
    } finally {
      setParsing(false);
    }
  };

  const handleRowChange = <K extends keyof IParsedCalendarEvent>(
    index: number,
    field: K,
    value: IParsedCalendarEvent[K]
  ) => {
    setParsedEvents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteRow = (index: number) => {
    setParsedEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    const newEvent: IParsedCalendarEvent = {
      id: `manual-${Date.now()}`,
      eventName: 'New Calendar Milestone',
      eventDate: `${selectedYear}-01-15`,
      academicYear: selectedYear,
      category: 'general',
      location: 'DZF Learning Center',
      targetAudience: 'All Staff & Patrons',
      arrivalTime: '09:00 AM',
      description: 'Manually added operational milestone',
      confidence: 'high',
    };
    setParsedEvents((prev) => [newEvent, ...prev]);
  };

  const handleConfirmImport = async () => {
    if (parsedEvents.length === 0) {
      setError('There are no events to import.');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const payload = {
        events: parsedEvents.map((e) => ({
          eventName: e.eventName,
          title: e.eventName,
          eventDate: e.eventDate,
          academicYear: e.academicYear || selectedYear,
          category: e.category,
          location: e.location,
          targetAudience: e.targetAudience,
          arrivalTime: e.arrivalTime,
          description: e.description,
        })),
      };

      const res = await fetch('/api/admin/events/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import calendar events.');
      }

      onSuccess(data.count || parsedEvents.length);
      handleReset();
      onClose();
    } catch (err) {
      console.error('[IMPORT_EVENTS_ERROR]', err);
      setError(err instanceof Error ? err.message : 'Failed to import events to database.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedEvents([]);
    setError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={importing || parsing ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '20px',
            p: 1.5,
            bgcolor: '#FFFFFF',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '1.4rem' }}>📄</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              Institutional Operational Calendar PDF Ingestion
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Upload the official yearly foundation calendar PDF (e.g. 2027 calendar). Review and refine the extracted
            milestones in the interactive table before bulk importing.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            select
            size="small"
            label="Target Academic Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            sx={{ width: 140 }}
          >
            {[2025, 2026, 2027, 2028, 2029].map((year) => (
              <MenuItem key={year} value={year}>
                {year} Calendar
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ borderRadius: '10px' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ borderRadius: '10px' }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {/* Upload Dropzone / File Picker */}
        {parsedEvents.length === 0 && (
          <Box
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: file ? dzfColors.gold[500] : '#E2E8F0',
              borderRadius: '16px',
              textAlign: 'center',
              bgcolor: file ? '#FFFDF5' : '#F8FAFC',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="calendar-pdf-input"
            />
            <label htmlFor="calendar-pdf-input" style={{ cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: file ? dzfColors.gold[100] : '#EEF2F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                  }}
                >
                  📁
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                  {file ? file.name : 'Select or Drop Institutional Calendar PDF'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 460 }}>
                  {file
                    ? `Size: ${(file.size / 1024).toFixed(1)} KB — Click "Extract & Parse Milestones" to begin.`
                    : 'Supported formats: Standard PDF calendar documents. Year context will default to ' +
                      selectedYear +
                      '.'}
                </Typography>
              </Box>
            </label>

            {file && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                <DZFButton
                  variant="primary"
                  onClick={handleParsePdf}
                  disabled={parsing}
                  sx={{
                    px: 3,
                    py: 1,
                    background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
                  }}
                >
                  {parsing ? (
                    <>
                      <CircularProgress size={16} sx={{ color: '#FFFFFF', mr: 1 }} />
                      Extracting & Parsing PDF...
                    </>
                  ) : (
                    '🚀 Extract & Parse Milestones'
                  )}
                </DZFButton>
                <DZFButton variant="secondary" onClick={handleReset} disabled={parsing}>
                  Cancel Selection
                </DZFButton>
              </Box>
            )}
          </Box>
        )}

        {/* Interactive Editable Preview Table */}
        {parsedEvents.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Extracted Milestones Review ({parsedEvents.length} Items)
                </Typography>
                <Chip
                  size="small"
                  label={`${selectedYear} Operational Schedule`}
                  sx={{ bgcolor: dzfColors.navy[50], color: dzfColors.navy[700], fontWeight: 700 }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DZFButton variant="secondary" size="small" onClick={handleAddRow}>
                  + Add Row
                </DZFButton>
                <DZFButton variant="secondary" size="small" onClick={handleReset} sx={{ color: dzfColors.maroon[700] }}>
                  🔄 Upload Different PDF
                </DZFButton>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420, borderRadius: '12px' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                    <TableCell sx={{ fontWeight: 800, minWidth: 140 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Event / Milestone Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Location / Venue</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 150 }}>Target Audience</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 110 }}>Arrival Time</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 50, textAlign: 'center' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedEvents.map((event, idx) => (
                    <TableRow key={event.id || idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      {/* Date */}
                      <TableCell>
                        <TextField
                          type="date"
                          size="small"
                          value={event.eventDate}
                          onChange={(e) => handleRowChange(idx, 'eventDate', e.target.value)}
                          fullWidth
                          sx={{ '& input': { py: 0.8, fontSize: '0.85rem' } }}
                        />
                      </TableCell>

                      {/* Event Name */}
                      <TableCell>
                        <TextField
                          size="small"
                          value={event.eventName}
                          onChange={(e) => handleRowChange(idx, 'eventName', e.target.value)}
                          fullWidth
                          sx={{ '& input': { py: 0.8, fontSize: '0.85rem' } }}
                        />
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={event.category || 'general'}
                          onChange={(e) => handleRowChange(idx, 'category', e.target.value as IParsedCalendarEvent['category'])}
                          fullWidth
                          sx={{ '& .MuiSelect-select': { py: 0.8, fontSize: '0.85rem' } }}
                        >
                          {CATEGORIES.map((cat) => (
                            <MenuItem key={cat.value} value={cat.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color }} />
                                {cat.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <TextField
                          size="small"
                          value={event.location || ''}
                          onChange={(e) => handleRowChange(idx, 'location', e.target.value)}
                          fullWidth
                          sx={{ '& input': { py: 0.8, fontSize: '0.85rem' } }}
                        />
                      </TableCell>

                      {/* Target Audience */}
                      <TableCell>
                        <TextField
                          size="small"
                          value={event.targetAudience || ''}
                          onChange={(e) => handleRowChange(idx, 'targetAudience', e.target.value)}
                          fullWidth
                          sx={{ '& input': { py: 0.8, fontSize: '0.85rem' } }}
                        />
                      </TableCell>

                      {/* Arrival Time */}
                      <TableCell>
                        <TextField
                          size="small"
                          value={event.arrivalTime || ''}
                          onChange={(e) => handleRowChange(idx, 'arrivalTime', e.target.value)}
                          fullWidth
                          sx={{ '& input': { py: 0.8, fontSize: '0.85rem' } }}
                        />
                      </TableCell>

                      {/* Action */}
                      <TableCell align="center">
                        <Tooltip title="Delete row">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRow(idx)}
                            sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}
                          >
                            🗑️
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {parsedEvents.length > 0
            ? `Ready to import ${parsedEvents.length} events into ${selectedYear} calendar.`
            : 'Select PDF file to initiate extraction.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <DZFButton variant="secondary" onClick={onClose} disabled={importing || parsing}>
            Close
          </DZFButton>

          {parsedEvents.length > 0 && (
            <DZFButton
              variant="primary"
              onClick={handleConfirmImport}
              disabled={importing || parsing}
              sx={{
                px: 3,
                background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
              }}
            >
              {importing ? (
                <>
                  <CircularProgress size={16} sx={{ color: '#FFFFFF', mr: 1 }} />
                  Importing to Database...
                </>
              ) : (
                `✅ Confirm & Import ${parsedEvents.length} Events`
              )}
            </DZFButton>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
