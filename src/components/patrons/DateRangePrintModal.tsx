'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFInput,
  DZFBadge,
  Mono,
  PrinterIcon,
  CloseIcon,
  CalendarIcon,
  IdCardIcon,
} from '@/components';
import { IPatron } from '@/models/Patron';
import { ThermalLabelData } from './ThermalBarcodeLabel';

interface DateRangePrintModalProps {
  open: boolean;
  onClose: () => void;
  onLaunchPrint: (labels: ThermalLabelData[]) => void;
}

export default function DateRangePrintModal({
  open,
  onClose,
  onLaunchPrint,
}: DateRangePrintModalProps) {
  // Format today's date as YYYY-MM-DD in local time
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getPastDaysStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = React.useState<string>(() => getPastDaysStr(30));
  const [endDate, setEndDate] = React.useState<string>(() => getTodayStr());
  const [patronTypeFilter, setPatronTypeFilter] = React.useState<string>('all');

  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [matchedPatrons, setMatchedPatrons] = React.useState<IPatron[]>([]);
  const [hasQueried, setHasQueried] = React.useState<boolean>(false);

  // Quick preset helpers
  const handleSetPreset = (preset: 'today' | '7days' | '30days' | '90days') => {
    const today = getTodayStr();
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      setStartDate(getPastDaysStr(7));
      setEndDate(today);
    } else if (preset === '30days') {
      setStartDate(getPastDaysStr(30));
      setEndDate(today);
    } else if (preset === '90days') {
      setStartDate(getPastDaysStr(90));
      setEndDate(today);
    }
    setHasQueried(false);
  };

  const handleQuery = async () => {
    if (!startDate || !endDate) {
      setError('Please select both a start date and an end date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('startDate', startDate);
      params.set('endDate', endDate);
      params.set('limit', '1000');
      params.set('sortBy', 'barcode');
      params.set('sortOrder', 'asc');
      if (patronTypeFilter !== 'all') {
        params.set('patronType', patronTypeFilter);
      }

      const res = await fetch(`/api/patrons?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch patrons for date range.');
      }

      setMatchedPatrons(data.patrons || []);
      setHasQueried(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching patrons';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (matchedPatrons.length === 0) return;
    const labels: ThermalLabelData[] = matchedPatrons.map((p) => ({
      barcode: p.barcode,
      firstname: p.firstname,
      surname: p.surname,
      name: `${p.firstname} ${p.surname}`,
      patronType: p.patronType,
      orgName: 'Dzuels Foundation',
    }));

    onClose();
    onLaunchPrint(labels);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1,
            maxHeight: '90vh',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1.5,
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              backgroundColor: dzfColors.maroon[50],
              color: dzfColors.maroon[900],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarIcon size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: dzfColors.navy[900] }}>
              Date-Range Bulk Thermal Print Studio
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Generate and continuous roll print 60mm × 40mm barcode labels targeting Xprinter XP-365B
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: dzfColors.surfaces.textMuted }}>
          <CloseIcon size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Date Filter & Presets Section */}
        <Box
          sx={{
            p: 2,
            mb: 2.5,
            backgroundColor: '#f8fafc',
            borderRadius: 2.5,
            border: `1px solid ${dzfColors.surfaces.border}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 1.5 }}>
            1. Select Registration Date Range
          </Typography>

          {/* Quick Presets */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Typography variant="caption" sx={{ alignSelf: 'center', color: dzfColors.surfaces.textMuted, mr: 0.5 }}>
              Presets:
            </Typography>
            <DZFButton variant="soft" size="small" onClick={() => handleSetPreset('today')}>
              Today
            </DZFButton>
            <DZFButton variant="soft" size="small" onClick={() => handleSetPreset('7days')}>
              Past 7 Days
            </DZFButton>
            <DZFButton variant="soft" size="small" onClick={() => handleSetPreset('30days')}>
              Past 30 Days
            </DZFButton>
            <DZFButton variant="soft" size="small" onClick={() => handleSetPreset('90days')}>
              Past 90 Days
            </DZFButton>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
              gap: 2,
              alignItems: 'flex-end',
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: dzfColors.navy[700], mb: 0.5, display: 'block' }}>
                Start Date (From)
              </Typography>
              <DZFInput
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setHasQueried(false);
                }}
                fullWidth
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: dzfColors.navy[700], mb: 0.5, display: 'block' }}>
                End Date (To)
              </Typography>
              <DZFInput
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setHasQueried(false);
                }}
                fullWidth
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: dzfColors.navy[700], mb: 0.5, display: 'block' }}>
                Classification
              </Typography>
              <DZFInput
                select
                value={patronTypeFilter}
                onChange={(e) => {
                  setPatronTypeFilter(e.target.value);
                  setHasQueried(false);
                }}
                fullWidth
                size="small"
              >
                <MenuItem value="all">All Classifications</MenuItem>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="guest">Guest</MenuItem>
              </DZFInput>
            </Box>

            <Box>
              <DZFButton
                variant="primary"
                fullWidth
                onClick={handleQuery}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <IdCardIcon size={18} />}
              >
                {loading ? 'Finding Patrons...' : 'Find Patrons'}
              </DZFButton>
            </Box>
          </Box>
        </Box>

        {/* Results Section */}
        {hasQueried && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                2. Matching Patron Records
              </Typography>
              <DZFBadge
                variant={matchedPatrons.length > 0 ? 'success' : 'default'}
                label={`${matchedPatrons.length} Patron${matchedPatrons.length === 1 ? '' : 's'} Found`}
                size="small"
              />
            </Box>

            {matchedPatrons.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  borderRadius: 2,
                  border: `1px dashed ${dzfColors.surfaces.border}`,
                }}
              >
                <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, mb: 1 }}>
                  No patrons were registered between <strong>{startDate}</strong> and <strong>{endDate}</strong>.
                </Typography>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textSecondary }}>
                  Try selecting a broader date range or adjusting the filters above.
                </Typography>
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  maxHeight: 260,
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  borderRadius: 2,
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900], fontSize: '0.75rem' }}>
                        Barcode
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900], fontSize: '0.75rem' }}>
                        Patron Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900], fontSize: '0.75rem' }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900], fontSize: '0.75rem' }}>
                        Registered Date
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matchedPatrons.map((p) => {
                      const regDate = p.registeredDate || p.createdAt;
                      const dateStr = regDate ? new Date(regDate).toLocaleDateString() : '—';
                      return (
                        <TableRow key={String(p._id)} hover>
                          <TableCell sx={{ py: 1 }}>
                            <Mono sx={{ fontSize: '0.8rem', color: dzfColors.maroon[900], fontWeight: 700 }}>
                              {p.barcode}
                            </Mono>
                          </TableCell>
                          <TableCell sx={{ py: 1, fontWeight: 600, color: dzfColors.navy[900], fontSize: '0.8125rem' }}>
                            {p.firstname} {p.surname}
                          </TableCell>
                          <TableCell sx={{ py: 1, fontSize: '0.75rem', textTransform: 'capitalize' }}>
                            {p.patronType}
                          </TableCell>
                          <TableCell sx={{ py: 1, fontSize: '0.75rem', color: dzfColors.surfaces.textSecondary }}>
                            {dateStr}
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
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          justifyContent: 'space-between',
        }}
      >
        <DZFButton variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </DZFButton>

        <DZFButton
          variant="primary"
          startIcon={<PrinterIcon size={18} />}
          onClick={handlePrint}
          disabled={loading || matchedPatrons.length === 0}
        >
          {matchedPatrons.length > 0
            ? `Print ${matchedPatrons.length} Thermal Labels (60×40mm)`
            : 'Print Thermal Labels'}
        </DZFButton>
      </DialogActions>
    </Dialog>
  );
}
