'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { dzfColors } from '@/theme/colors';
import {
  DZFDataTable,
  Column,
  DZFBadge,
  DZFSearchInput,
  DZFButton,
} from '@/components/ui';
import {
  RefreshIcon,
  AlertTriangleIcon,
} from '@/components/ui/DZFIcons';
import type { IAttendanceDocument } from '@/models/Attendance';

export interface AttendanceHistoryTableProps {
  onDataChanged?: () => void;
  refreshTrigger?: number;
}

export default function AttendanceHistoryTable({
  onDataChanged,
  refreshTrigger = 0,
}: AttendanceHistoryTableProps) {
  const [attendances, setAttendances] = React.useState<IAttendanceDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);
  const [search, setSearch] = React.useState('');
  const [classTypeFilter, setClassTypeFilter] = React.useState<string>('all');
  const [dateFilter, setDateFilter] = React.useState<string>('');

  // Undo dialog state
  const [undoItem, setUndoItem] = React.useState<IAttendanceDocument | null>(null);
  const [undoing, setUndoing] = React.useState(false);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });

      if (search.trim()) params.set('search', search.trim());
      if (classTypeFilter !== 'all') params.set('classType', classTypeFilter);
      if (dateFilter) params.set('date', dateFilter);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, classTypeFilter, dateFilter]);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        const params = new URLSearchParams({
          page: String(page + 1),
          limit: String(rowsPerPage),
        });

        if (search.trim()) params.set('search', search.trim());
        if (classTypeFilter !== 'all') params.set('classType', classTypeFilter);
        if (dateFilter) params.set('date', dateFilter);

        const res = await fetch(`/api/attendance?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setAttendances(data.attendances || []);
            setTotal(data.total || 0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch attendance history:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [page, rowsPerPage, search, classTypeFilter, dateFilter, refreshTrigger]);

  const handleConfirmUndo = async () => {
    if (!undoItem || !undoItem._id) return;
    setUndoing(true);
    try {
      const res = await fetch(`/api/attendance/${undoItem._id.toString()}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUndoItem(null);
        fetchLogs();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error('Error undoing attendance:', err);
    } finally {
      setUndoing(false);
    }
  };

  const handleExportCSV = () => {
    if (attendances.length === 0) return;

    const headers = [
      'Date & Time',
      'Patron Barcode',
      'Patron Name',
      'Session Type',
      'Class Name',
      'Points Awarded',
      'Marked By',
      'Notes',
    ];

    const csvRows = attendances.map((row) => [
      `"${new Date(row.attendanceTime).toISOString()}"`,
      `"${row.patronBarcode || ''}"`,
      `"${(row.patronName || '').replace(/"/g, '""')}"`,
      `"${row.classType || ''}"`,
      `"${(row.className || '').replace(/"/g, '""')}"`,
      row.points || 0,
      `"${(row.markedBy || '').replace(/"/g, '""')}"`,
      `"${(row.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `dzf_attendance_logs_${dateFilter || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<IAttendanceDocument>[] = [
    {
      id: 'attendanceTime',
      label: 'Timestamp',
      minWidth: 150,
      render: (row) => {
        const d = new Date(row.attendanceTime);
        return (
          <Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: dzfColors.navy[950] }}>
              {d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textMuted }}>
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'patronName',
      label: 'Patron',
      minWidth: 200,
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: dzfColors.navy[950] }}>
            {row.patronName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <DZFBadge label={row.patronBarcode} variant="info" size="small" />
          </Box>
        </Box>
      ),
    },
    {
      id: 'className',
      label: 'Session / Class',
      minWidth: 180,
      render: (row) => (
        <Box>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
            {row.className}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
            <DZFBadge
              label={row.classType.toUpperCase()}
              variant={row.classType === 'library' ? 'default' : 'primary'}
              size="small"
            />
          </Box>
        </Box>
      ),
    },
    {
      id: 'points',
      label: 'Points',
      minWidth: 100,
      render: (row) => (
        <DZFBadge
          label={`+${row.points} pts`}
          variant={row.classType === 'library' ? 'default' : 'top10'}
          size="small"
        />
      ),
    },
    {
      id: 'markedBy',
      label: 'Staff Proctor',
      minWidth: 140,
      render: (row) => (
        <Typography sx={{ fontSize: '0.85rem', color: dzfColors.surfaces.textSecondary }}>
          {row.markedBy}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 90,
      render: (row) => (
        <DZFButton
          variant="danger"
          size="small"
          onClick={() => setUndoItem(row)}
          sx={{ fontSize: '0.75rem', py: 0.5, px: 1.25 }}
        >
          Undo
        </DZFButton>
      ),
    },
  ];

  return (
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
      {/* Header and Filter Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: dzfColors.navy[950] }}>
            Historical Attendance Audit Ledger
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: dzfColors.surfaces.textSecondary, mt: 0.25 }}>
            Audit log of all student and library visitor attendance check-ins.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <DZFButton
            variant="secondary"
            size="small"
            startIcon={<RefreshIcon size={14} />}
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            Refresh
          </DZFButton>
          <DZFButton
            variant="soft"
            size="small"
            onClick={handleExportCSV}
            disabled={attendances.length === 0}
          >
            Export CSV
          </DZFButton>
        </Box>
      </Box>

      {/* Filter Row */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box sx={{ flex: 1, width: '100%' }}>
          <DZFSearchInput
            placeholder="Search by patron name, barcode, or class..."
            value={search}
            onChange={(val: string) => {
              setSearch(val);
              setPage(0);
            }}
            onClear={() => {
              setSearch('');
              setPage(0);
            }}
          />
        </Box>

        {/* Session Type Filter */}
        <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}>
          <InputLabel id="type-filter-label">Session Type</InputLabel>
          <Select
            labelId="type-filter-label"
            value={classTypeFilter}
            label="Session Type"
            onChange={(e) => {
              setClassTypeFilter(e.target.value);
              setPage(0);
            }}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">All Sessions</MenuItem>
            <MenuItem value="library">General Library</MenuItem>
            <MenuItem value="literacy">Digital Literacy</MenuItem>
            <MenuItem value="cohort">Cohort Class</MenuItem>
            <MenuItem value="reading_club">Reading Club</MenuItem>
            <MenuItem value="workshop">STEM Workshop</MenuItem>
            <MenuItem value="other">Other Event</MenuItem>
          </Select>
        </FormControl>

        {/* Date Filter */}
        <TextField
          size="small"
          type="date"
          label="Filter by Date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(0);
          }}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{
            minWidth: 160,
            width: { xs: '100%', sm: 'auto' },
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />

        {dateFilter && (
          <DZFButton
            variant="soft"
            size="small"
            onClick={() => {
              setDateFilter('');
              setPage(0);
            }}
          >
            Clear Date
          </DZFButton>
        )}
      </Box>

      {/* Main Data Table */}
      <DZFDataTable<IAttendanceDocument>
        columns={columns}
        data={attendances}
        loading={loading}
        totalCount={total}
        page={page}
        pageSize={rowsPerPage}
        onPageChange={setPage}
        onPageSizeChange={(newRpp: number) => {
          setRowsPerPage(newRpp);
          setPage(0);
        }}
        keyExtractor={(row) => (row._id ? row._id.toString() : Math.random().toString())}
        emptyTitle="No attendance records found"
        emptyDescription="No attendance records match your filter criteria."
      />

      {/* Undo Confirmation Dialog */}
      <Dialog
        open={Boolean(undoItem)}
        onClose={() => !undoing && setUndoItem(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AlertTriangleIcon size={24} color="#dc2626" />
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#991b1b' }}>
            Undo Attendance Check-In?
          </Typography>
        </DialogTitle>

        <DialogContent>
          {undoItem && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: '0.9rem', color: '#334155' }}>
                Reverse attendance check-in for <strong>{undoItem.patronName}</strong> (
                {undoItem.patronBarcode}) on {undoItem.className}?
              </Typography>
              <Typography sx={{ fontSize: '0.825rem', color: '#64748b', mt: 1 }}>
                This action deletes the record and deducts{' '}
                <strong>{undoItem.points} points</strong> from the patron.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <DZFButton variant="soft" onClick={() => setUndoItem(null)} disabled={undoing}>
            Cancel
          </DZFButton>
          <DZFButton
            variant="danger"
            onClick={handleConfirmUndo}
            disabled={undoing}
            startIcon={undoing ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {undoing ? 'Reversing...' : 'Confirm Undo'}
          </DZFButton>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
