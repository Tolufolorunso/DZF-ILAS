'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import {
  ActivityIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckIcon,
  UndoIcon,
  RefreshIcon,
  UsersIcon,
  BookIcon,
  BarcodeIcon,
  TrophyIcon,
  LayersIcon,
} from '@/components/ui/DZFIcons';
import type { IDailyActionDTO } from '@/lib/audit/types';
import type { ITokenPayload } from '@/lib/auth/jwt';

interface DailyActionsClientProps {
  user: ITokenPayload;
  initialActions: IDailyActionDTO[];
  initialTotal: number;
  initialDate: string;
}

export default function DailyActionsClient({
  user,
  initialActions,
  initialTotal,
  initialDate,
}: DailyActionsClientProps) {
  const [actions, setActions] = React.useState<IDailyActionDTO[]>(initialActions);
  const [total, setTotal] = React.useState<number>(initialTotal);
  const [selectedDate, setSelectedDate] = React.useState<string>(initialDate);
  const [staffFilter, setStaffFilter] = React.useState<string>('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = React.useState<boolean>(true);
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Undo Dialog State
  const [undoTarget, setUndoTarget] = React.useState<IDailyActionDTO | null>(null);
  const [isUndoing, setIsUndoing] = React.useState<boolean>(false);

  // Nigeria WAT today string
  const todayNigeria = React.useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }, []);

  const isSelectedDayToday = selectedDate === todayNigeria;

  // Fetch actions
  const fetchActions = React.useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const params = new URLSearchParams({
          date: selectedDate,
          page: String(page),
          limit: '25',
        });
        if (staffFilter.trim()) params.append('staff', staffFilter.trim());
        if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);

        const res = await fetch(`/api/admin/daily-actions?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setActions(data.actions || []);
          setTotal(data.total || 0);
        } else {
          setNotification({ type: 'error', message: data.error || 'Failed to fetch actions' });
        }
      } catch (err: unknown) {
        console.error('Fetch actions error:', err);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [selectedDate, staffFilter, typeFilter, page]
  );

  // Refetch when filters or page change
  React.useEffect(() => {
    fetchActions(true);
  }, [fetchActions]);

  // Live Auto-Refresh polling (every 10 seconds if enabled and viewing today)
  React.useEffect(() => {
    if (!autoRefresh || !isSelectedDayToday) return;

    const timer = setInterval(() => {
      fetchActions(false);
    }, 10000);

    return () => clearInterval(timer);
  }, [autoRefresh, isSelectedDayToday, fetchActions]);

  // Handle Undo execution
  const handleConfirmUndo = async () => {
    if (!undoTarget) return;
    setIsUndoing(true);
    try {
      const res = await fetch(`/api/admin/daily-actions/${undoTarget.id}/undo`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: data.message || `Action "${undoTarget.actionTitle}" undone successfully.`,
        });
        // Optimistically update action state
        setActions((prev) =>
          prev.map((a) =>
            a.id === undoTarget.id
              ? { ...a, isUndone: true, undoneAt: new Date().toISOString(), undoneBy: user.username }
              : a
          )
        );
        setUndoTarget(null);
      } else {
        setNotification({ type: 'error', message: data.error || 'Undo operation failed.' });
      }
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error during undo execution',
      });
    } finally {
      setIsUndoing(false);
    }
  };

  const getActionTypeDetails = (type: string) => {
    switch (type) {
      case 'attendance_scan':
        return {
          label: 'Attendance',
          color: '#047857',
          bg: '#ecfdf5',
          icon: <BarcodeIcon size={16} color="#047857" />,
        };
      case 'book_checkout':
        return {
          label: 'Checkout Loan',
          color: '#0e7490',
          bg: '#ecfeff',
          icon: <BookIcon size={16} color="#0e7490" />,
        };
      case 'book_return':
        return {
          label: 'Return Loan',
          color: dzfColors.navy[700],
          bg: '#f0f4f8',
          icon: <ClockIcon size={16} color={dzfColors.navy[700]} />,
        };
      case 'book_create':
      case 'book_update':
      case 'book_delete':
        return {
          label: 'Cataloging',
          color: dzfColors.maroon[700],
          bg: '#fdf2f2',
          icon: <BookIcon size={16} color={dzfColors.maroon[700]} />,
        };
      case 'patron_create':
      case 'patron_update':
      case 'patron_delete':
        return {
          label: 'Patron',
          color: '#6366f1',
          bg: '#eef2ff',
          icon: <UsersIcon size={16} color="#6366f1" />,
        };
      case 'task_create':
      case 'task_status_change':
        return {
          label: 'Operational Task',
          color: '#8b5cf6',
          bg: '#f5f3ff',
          icon: <LayersIcon size={16} color="#8b5cf6" />,
        };
      case 'competition_entry':
        return {
          label: 'Competition',
          color: '#d97706',
          bg: '#fffbeb',
          icon: <TrophyIcon size={16} color="#d97706" />,
        };
      case 'cohort_action':
        return {
          label: 'Cohort',
          color: '#0d9488',
          bg: '#f0fdfa',
          icon: <UsersIcon size={16} color="#0d9488" />,
        };
      default:
        return {
          label: 'Operation',
          color: '#475569',
          bg: '#f8fafc',
          icon: <ActivityIcon size={16} color="#475569" />,
        };
    }
  };

  const getUndoImpactSummary = (action: IDailyActionDTO | null) => {
    if (!action) return '';
    switch (action.actionType) {
      case 'attendance_scan':
        return 'Will completely delete this attendance record and roll back any patron engagement points credited.';
      case 'book_checkout':
        return 'Will cancel the issued loan record and restore the monograph copy status to available on the shelf.';
      case 'book_return':
        return 'Will revert the return, restoring the book back to issued/borrowed status under the borrower and deducting timely return points.';
      case 'book_create':
        return 'Will remove the newly registered monograph from the institutional catalog.';
      case 'book_update':
        return 'Will rollback all monograph attributes and metadata back to their exact snapshot prior to this edit.';
      case 'book_delete':
        return 'Will recreate and restore the deleted monograph back into the active catalog.';
      case 'patron_create':
        return 'Will remove the newly registered patron from the active directory.';
      case 'patron_update':
        return 'Will rollback the patron profile information back to the previous snapshot.';
      case 'patron_delete':
        return 'Will restore the deleted patron profile back into the system.';
      case 'task_create':
        return 'Will delete this operational task from the staff board.';
      case 'task_status_change':
        return 'Will move the task back to its previous Kanban status lane.';
      case 'competition_entry':
        return 'Will delete the competition submission evaluation and retract patron reading points.';
      default:
        return 'Will revert the target entity back to its prior state.';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header Banner */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${dzfColors.navy[950]} 0%, ${dzfColors.navy[900]} 70%, ${dzfColors.maroon[950]} 100%)`,
          color: '#ffffff',
          boxShadow: '0 12px 32px rgba(10, 25, 47, 0.15)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ActivityIcon size={24} color="#60a5fa" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Staff Daily Live Action Stream
              </Typography>
              <DZFBadge variant="warning" label="Live Audit" size="small" />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.75)', maxWidth: 750 }}>
              Live audit stream of staff activities across attendance, circulations, cataloging, patrons, tasks, cohorts, and reading competitions.
              Includes same-day programmatic undo engine strictly enforcing 12:00 AM midnight cutoff (WAT / Nigeria time).
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="warning"
                  size="small"
                />
              }
              label={
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Auto-Refresh (10s)
                </Typography>
              }
            />
            <DZFButton
              variant="secondary"
              size="small"
              onClick={() => fetchActions(true)}
              disabled={isLoading}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
            >
              <RefreshIcon size={16} />
              <Box component="span" sx={{ ml: 1 }}>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Box>
            </DZFButton>
          </Box>
        </Box>
      </Card>

      {/* Midnight Cutoff Notice Banner */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '14px',
          bgcolor: isSelectedDayToday ? '#eff6ff' : '#fffbeb',
          border: `1px solid ${isSelectedDayToday ? '#bfdbfe' : '#fde68a'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ClockIcon size={20} color={isSelectedDayToday ? dzfColors.navy[700] : '#d97706'} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
              {isSelectedDayToday
                ? 'Same-Day Reversible Undo Active (Africa/Lagos WAT)'
                : `Historical Archive: Viewing Actions for ${selectedDate}`}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {isSelectedDayToday
                ? 'All eligible actions logged today can be safely reversed by administrators until 12:00 AM midnight. Historical actions cannot be undone.'
                : '12:00 AM midnight cutoff has expired for this calendar date. Actions on this day are preserved in the permanent institutional ledger and cannot be reversed.'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <DZFButton
            size="small"
            variant={isSelectedDayToday ? 'primary' : 'secondary'}
            onClick={() => setSelectedDate(todayNigeria)}
          >
            Today (WAT)
          </DZFButton>
          <DZFButton
            size="small"
            variant="secondary"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              setSelectedDate(
                new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'Africa/Lagos',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }).format(d)
              );
            }}
          >
            Yesterday
          </DZFButton>
        </Box>
      </Card>

      {/* Feedback Alert */}
      {notification && (
        <Alert
          severity={notification.type}
          onClose={() => setNotification(null)}
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          {notification.message}
        </Alert>
      )}

      {/* Filter Toolbar */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.2fr 1.5fr 1.5fr auto' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            label="Audit Date"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPage(1);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Filter by Staff Username"
            size="small"
            placeholder="e.g. librarian_mary"
            value={staffFilter}
            onChange={(e) => {
              setStaffFilter(e.target.value);
              setPage(1);
            }}
          />

          <FormControl size="small">
            <InputLabel id="action-type-select-label">Action Category</InputLabel>
            <Select
              labelId="action-type-select-label"
              value={typeFilter}
              label="Action Category"
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Operational Categories</MenuItem>
              <MenuItem value="attendance_scan">Attendance Scans</MenuItem>
              <MenuItem value="book_checkout">Book Checkouts</MenuItem>
              <MenuItem value="book_return">Book Returns</MenuItem>
              <MenuItem value="book_create">Book Registrations</MenuItem>
              <MenuItem value="book_update">Book Metadata Edits</MenuItem>
              <MenuItem value="book_delete">Book Deletions</MenuItem>
              <MenuItem value="patron_create">Patron Registrations</MenuItem>
              <MenuItem value="patron_update">Patron Profile Updates</MenuItem>
              <MenuItem value="patron_delete">Patron Deletions</MenuItem>
              <MenuItem value="task_create">Task Creations</MenuItem>
              <MenuItem value="task_status_change">Task Status Progression</MenuItem>
              <MenuItem value="competition_entry">Competition Entries</MenuItem>
              <MenuItem value="cohort_action">Cohort Academy Actions</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Showing {actions.length} of {total} actions
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Action Stream Feed */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: dzfColors.maroon[600] }} />
        </Box>
      ) : actions.length === 0 ? (
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '20px',
            bgcolor: '#ffffff',
            border: '1px dashed #cbd5e1',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <ActivityIcon size={28} color="#94a3b8" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 0.5 }}>
            No Staff Actions Logged
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 450, mx: 'auto' }}>
            There are no recorded staff actions matching your date and category filters for {selectedDate}.
          </Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {actions.map((act) => {
            const cat = getActionTypeDetails(act.actionType);
            const timeStr = new Intl.DateTimeFormat('en-US', {
              timeZone: 'Africa/Lagos',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            }).format(new Date(act.createdAt));

            const isUndoDisabled =
              act.isUndone || act.isCutoffExpired || !act.isReversible;

            return (
              <Card
                key={act.id}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  border: `1px solid ${act.isUndone ? '#e2e8f0' : '#f1f5f9'}`,
                  bgcolor: act.isUndone ? '#f8fafc' : '#ffffff',
                  opacity: act.isUndone ? 0.8 : 1,
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  },
                }}
              >
                {/* Left: Category Icon & Main Info */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flex: 1 }}>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: '12px',
                      bgcolor: cat.bg,
                      color: cat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {cat.icon}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                      <Chip
                        size="small"
                        label={cat.label}
                        sx={{
                          bgcolor: cat.bg,
                          color: cat.color,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          height: 22,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {timeStr} WAT
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        •
                      </Typography>
                      <Chip
                        size="small"
                        label={act.performedByRole.replace('_', ' ').toUpperCase()}
                        sx={{
                          height: 20,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          bgcolor: '#f1f5f9',
                          color: dzfColors.navy[700],
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                        {act.performedByName || act.performedBy}
                      </Typography>
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 0.25 }}>
                      {act.actionTitle}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Target: <strong>{act.targetEntity}</strong> • ID: <code>{act.targetId}</code>
                    </Typography>
                  </Box>
                </Box>

                {/* Right: Status Pill & Undo Action */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexShrink: 0,
                    width: { xs: '100%', md: 'auto' },
                    justifyContent: { xs: 'space-between', md: 'flex-end' },
                    pt: { xs: 1.5, md: 0 },
                    borderTop: { xs: '1px solid #f1f5f9', md: 'none' },
                  }}
                >
                  {act.isUndone ? (
                    <Tooltip title={`Undone by ${act.undoneBy || 'admin'} at ${act.undoneAt ? new Date(act.undoneAt).toLocaleTimeString() : 'N/A'}`}>
                      <Chip
                        icon={<CheckIcon size={14} color="#64748b" />}
                        label="Reversed"
                        size="small"
                        sx={{ bgcolor: '#e2e8f0', color: '#64748b', fontWeight: 700 }}
                      />
                    </Tooltip>
                  ) : act.isCutoffExpired ? (
                    <Tooltip title="Historical action past 12:00 AM midnight cutoff. Reversal is permanently locked.">
                      <Chip
                        icon={<ClockIcon size={14} color="#d97706" />}
                        label="Cutoff Expired"
                        size="small"
                        sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }}
                      />
                    </Tooltip>
                  ) : (
                    <Chip
                      label="Active"
                      size="small"
                      sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }}
                    />
                  )}

                  <Tooltip
                    title={
                      act.isUndone
                        ? 'This action has already been undone.'
                        : act.isCutoffExpired
                        ? 'Undo window expired at 12:00 AM midnight.'
                        : !act.isReversible
                        ? 'Automated reversal is not supported for this action type.'
                        : 'Revert this operational action safely'
                    }
                  >
                    <span>
                      <DZFButton
                        size="small"
                        variant="secondary"
                        disabled={isUndoDisabled}
                        onClick={() => setUndoTarget(act)}
                        sx={{
                          minWidth: 84,
                          borderColor: !isUndoDisabled ? dzfColors.maroon[300] : undefined,
                          color: !isUndoDisabled ? dzfColors.maroon[700] : undefined,
                          '&:hover': {
                            bgcolor: !isUndoDisabled ? '#fef2f2' : undefined,
                          },
                        }}
                      >
                        <UndoIcon size={14} />
                        <Box component="span" sx={{ ml: 0.75 }}>
                          Undo
                        </Box>
                      </DZFButton>
                    </span>
                  </Tooltip>
                </Box>
              </Card>
            );
          })}

          {/* Pagination */}
          {total > 25 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(total / 25)}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Undo Confirmation Modal */}
      <Dialog
        open={Boolean(undoTarget)}
        onClose={() => !isUndoing && setUndoTarget(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '20px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[950], display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: '10px',
              bgcolor: '#fee2e2',
              color: dzfColors.maroon[700],
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <AlertTriangleIcon size={22} />
          </Box>
          Confirm Same-Day Action Reversal
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
          {undoTarget && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                You are about to programmatic revert the following staff action performed today:
              </Typography>

              <Card sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 0.5 }}>
                  {undoTarget.actionTitle}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Performed by: <strong>{undoTarget.performedByName}</strong> ({undoTarget.performedByRole}) • Target: {undoTarget.targetEntity} (ID: {undoTarget.targetId})
                </Typography>
              </Card>

              <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Reversal Impact:
                </Typography>
                <Typography variant="body2">
                  {getUndoImpactSummary(undoTarget)}
                </Typography>
              </Alert>

              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                Note: This reversal will be permanently logged under your administrator account ({user.username}).
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <DZFButton
            variant="secondary"
            onClick={() => setUndoTarget(null)}
            disabled={isUndoing}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="danger"
            onClick={handleConfirmUndo}
            disabled={isUndoing}
          >
            {isUndoing ? (
              <>
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                Reversing...
              </>
            ) : (
              'Confirm & Revert Action'
            )}
          </DZFButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
