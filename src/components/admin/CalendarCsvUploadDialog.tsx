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
import { IParsedCsvEvent } from '@/lib/calendar/csv-parser';

interface CalendarCsvUploadDialogProps {
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

export default function CalendarCsvUploadDialog({
  open,
  onClose,
  onSuccess,
  initialYear = new Date().getFullYear(),
}: CalendarCsvUploadDialogProps) {
  const [selectedYear, setSelectedYear] = React.useState<number>(initialYear);
  const [file, setFile] = React.useState<File | null>(null);
  const [parsing, setParsing] = React.useState<boolean>(false);
  const [importing, setImporting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const [parsedEvents, setParsedEvents] = React.useState<IParsedCsvEvent[]>([]);
  const [rawRowsCount, setRawRowsCount] = React.useState<number>(0);
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
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a valid CSV file (.csv).');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const csvContent = `Date,Event,Participants,Focal Person,Remarks
January 4th,Organization Resumes,All team members,CM,Resumption directives & term preparation
January 24th,World Education day,General Public,"Librarian PM: Mrs Funmi","Librarians to come up with impact driven plan. Event will hold on Friday the 22nd"
"February 17th– Finale Feb. 6 th – Stage1&2 Jnr Elem Feb.9th – Stage1&2 Snr Elem",Spelling Bee - Elementary,Library Members,Librarian PM: Nifemi,PM to suggest gifts
"March 19th Finale Mar.11th– Stage 1&2 Jnr High Mar.15th – Stage 1&2 Snr High",Spelling Bee – High Sch.,Library Members,Librarian PM: Mr Isaac,Preparation for inter-school finals
April 14th,Digital Literacy Masterclass,Staff & Students,Coordinator Mark,Interactive workshop on document processing
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DZF_Operational_Calendar_Template_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleParseCsv = async () => {
    if (!file) {
      setError('Please select a calendar CSV file first.');
      return;
    }

    try {
      setParsing(true);
      setError(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetYear', String(selectedYear));

      const res = await fetch('/api/admin/calendar/parse-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract calendar milestones from CSV');
      }

      setParsedEvents(data.events || []);
      setRawRowsCount(data.rawRowsCount || 0);

      if (!data.events || data.events.length === 0) {
        setError(
          'No valid milestone dates could be extracted. Please ensure the CSV contains a "Date" column with valid calendar dates.'
        );
      }
    } catch (err) {
      console.error('[CSV_PARSE_ERROR]', err);
      setError(err instanceof Error ? err.message : 'Error processing CSV file');
    } finally {
      setParsing(false);
    }
  };

  const handleFieldChange = (index: number, field: keyof IParsedCsvEvent, value: any) => {
    setParsedEvents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveRow = (index: number) => {
    setParsedEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    const todayStr = `${selectedYear}-01-15`;
    const newEvt: IParsedCsvEvent = {
      id: `manual-evt-${Date.now()}`,
      eventName: 'New Foundation Milestone',
      eventDate: todayStr,
      academicYear: selectedYear,
      category: 'general',
      location: 'DZF Learning Center',
      targetAudience: 'All Team Members & Patrons',
      arrivalTime: '09:00 AM',
      description: '',
      participants: 'All Team Members',
      focalPerson: 'CM',
      remarks: '',
      confidence: 'high',
    };
    setParsedEvents((prev) => [...prev, newEvt]);
  };

  const handleBatchImport = async () => {
    if (parsedEvents.length === 0) {
      setError('No milestones available to import.');
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
          location: e.location || 'DZF Learning Center',
          targetAudience: e.targetAudience || 'All Patrons',
          arrivalTime: e.arrivalTime || '09:00 AM',
          description: e.description || e.remarks,
          participants: e.participants,
          focalPerson: e.focalPerson,
          remarks: e.remarks,
        })),
      };

      const res = await fetch('/api/admin/events/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to batch save calendar events.');
      }

      setSuccessMsg(data.message || `Successfully imported ${data.count} milestones.`);
      onSuccess(data.count || parsedEvents.length);

      setTimeout(() => {
        handleReset();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('[BATCH_IMPORT_ERROR]', err);
      setError(err instanceof Error ? err.message : 'Batch save failed');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedEvents([]);
    setRawRowsCount(0);
    setError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog
      open={open}
      onClose={parsing || importing ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '20px',
            p: 1,
            maxHeight: '92vh',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '1.6rem' }}>📊</Typography>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                Import Foundation Operational Calendar (CSV)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Automated multi-date and multi-stage milestone extraction, attendee/lead mapping & confirmation review
              </Typography>
            </Box>
          </Box>
          <DZFButton
            variant="secondary"
            size="small"
            onClick={handleDownloadSampleTemplate}
            sx={{ fontSize: '0.8rem', py: 0.5 }}
          >
            📥 Download Sample Template
          </DZFButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: '10px' }}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ borderRadius: '10px' }}>
            {successMsg}
          </Alert>
        )}

        {parsedEvents.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Guidance Alert */}
            <Alert
              severity="info"
              sx={{
                borderRadius: '12px',
                border: '1px solid #BAE6FD',
                bgcolor: '#F0F9FF',
                color: '#0369A1',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Recommended CSV Structure & Smart Multi-Date Capability:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Ensure your CSV has headers: <strong>Date, Event, Participants, Focal Person, Remarks</strong>.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#0284C7' }}>
                💡 <em>Smart Multi-Date Extraction:</em> A single date cell containing multi-stage events (e.g.{' '}
                <code>Feb 6 – Stage 1 Jnr Elem; Feb 9 – Stage 2 Snr Elem; Feb 17 – Finale</code>) will be automatically
                decomposed into separate chronological milestone entries!
              </Typography>
            </Alert>

            {/* Target Year and File Selector */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                select
                label="Target Institutional Year"
                size="small"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{ width: 220 }}
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map((yr) => (
                  <MenuItem key={yr} value={yr}>
                    Session {yr}
                  </MenuItem>
                ))}
              </TextField>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="calendar-csv-upload-input"
              />
              <label htmlFor="calendar-csv-upload-input">
                <DZFButton
                  component="span"
                  variant="secondary"
                  size="medium"
                  sx={{ borderStyle: 'dashed', borderWidth: '2px' }}
                >
                  📁 {file ? 'Change CSV File' : 'Choose Calendar CSV (.csv)'}
                </DZFButton>
              </label>

              {file && (
                <Chip
                  label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                  onDelete={() => setFile(null)}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>

            {/* Ingestion Trigger Button */}
            <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <DZFButton
                variant="primary"
                onClick={handleParseCsv}
                disabled={!file || parsing}
                sx={{
                  background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
                  px: 4,
                  py: 1.2,
                }}
              >
                {parsing ? (
                  <>
                    <CircularProgress size={18} sx={{ color: '#FFFFFF', mr: 1.5 }} />
                    Parsing CSV & Extracting Milestones...
                  </>
                ) : (
                  '⚡ Parse & Extract Calendar Milestones'
                )}
              </DZFButton>
            </Box>
          </Box>
        ) : (
          /* Step 2: Interactive Editable Review Table */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${parsedEvents.length} Milestones Extracted`}
                  sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 800 }}
                />
                <Chip
                  label={`From ${rawRowsCount} Spreadsheet Rows`}
                  sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }}
                />
                <Chip
                  label={`Session ${selectedYear}`}
                  sx={{ bgcolor: '#FFFBEB', color: '#92400E', fontWeight: 700 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <DZFButton variant="secondary" size="small" onClick={handleAddRow}>
                  ➕ Add Milestone
                </DZFButton>
                <DZFButton variant="secondary" size="small" onClick={handleReset}>
                  🔄 Upload Different CSV
                </DZFButton>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              Verify extracted dates, titles, categories, participants, focal persons, and directives. Click any cell to make manual adjustments prior to database ingestion.
            </Typography>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ maxHeight: '50vh', borderRadius: '12px', border: '1px solid #E2E8F0' }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 800, width: 40 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>Event Title</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 140 }}>Date (YYYY-MM-DD)</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 160 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 150 }}>Participants</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 150 }}>Focal Person</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Remarks / Directives</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 60, textAlign: 'center' }}>Del</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedEvents.map((evt, idx) => (
                    <TableRow key={evt.id || idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#FBFDFF' } }}>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={evt.eventName}
                          onChange={(e) => handleFieldChange(idx, 'eventName', e.target.value)}
                          slotProps={{ htmlInput: { style: { fontSize: '0.85rem', padding: '4px 8px' } } }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="date"
                          size="small"
                          fullWidth
                          value={evt.eventDate}
                          onChange={(e) => handleFieldChange(idx, 'eventDate', e.target.value)}
                          slotProps={{ htmlInput: { style: { fontSize: '0.85rem', padding: '4px 6px' } } }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={evt.category}
                          onChange={(e) => handleFieldChange(idx, 'category', e.target.value)}
                          slotProps={{ htmlInput: { style: { fontSize: '0.85rem', padding: '4px 8px' } } }}
                        >
                          {CATEGORIES.map((c) => (
                            <MenuItem key={c.value} value={c.value} sx={{ fontSize: '0.85rem' }}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={evt.participants || ''}
                          onChange={(e) => handleFieldChange(idx, 'participants', e.target.value)}
                          placeholder="e.g. All Team Members"
                          slotProps={{ htmlInput: { style: { fontSize: '0.85rem', padding: '4px 8px' } } }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={evt.focalPerson || ''}
                          onChange={(e) => handleFieldChange(idx, 'focalPerson', e.target.value)}
                          placeholder="e.g. CM, Mrs Funmi"
                          slotProps={{ htmlInput: { style: { fontSize: '0.85rem', padding: '4px 8px' } } }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={evt.remarks || ''}
                          onChange={(e) => handleFieldChange(idx, 'remarks', e.target.value)}
                          placeholder="Directives or notes"
                          slotProps={{ htmlInput: { style: { fontSize: '0.85rem', padding: '4px 8px' } } }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Tooltip title="Remove milestone">
                          <IconButton size="small" color="error" onClick={() => handleRemoveRow(idx)}>
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

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0' }}>
        <DZFButton variant="secondary" onClick={onClose} disabled={parsing || importing}>
          Cancel
        </DZFButton>
        {parsedEvents.length > 0 && (
          <DZFButton
            variant="primary"
            onClick={handleBatchImport}
            disabled={importing}
            sx={{
              background: `linear-gradient(135deg, ${dzfColors.gold[500]}, ${dzfColors.gold[700]})`,
              color: '#1E293B',
              fontWeight: 800,
              px: 3,
            }}
          >
            {importing ? (
              <>
                <CircularProgress size={16} sx={{ color: '#1E293B', mr: 1 }} />
                Saving to Database...
              </>
            ) : (
              `💾 Batch Save ${parsedEvents.length} Milestones`
            )}
          </DZFButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
