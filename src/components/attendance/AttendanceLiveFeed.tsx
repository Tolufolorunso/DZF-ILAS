'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { dzfColors } from '@/theme/colors';
import { DZFBadge, DZFButton } from '@/components/ui';
import { ClockIcon, RefreshIcon, AlertTriangleIcon } from '@/components/ui/DZFIcons';
import type { IAttendanceDocument } from '@/models/Attendance';

export interface AttendanceLiveFeedProps {
  records: IAttendanceDocument[];
  loading?: boolean;
  onUndo: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export default function AttendanceLiveFeed({
  records,
  loading = false,
  onUndo,
  onRefresh,
}: AttendanceLiveFeedProps) {
  const [undoId, setUndoId] = React.useState<string | null>(null);
  const [undoing, setUndoing] = React.useState(false);

  const targetRecord = React.useMemo(
    () => records.find((r) => r._id?.toString() === undoId),
    [records, undoId]
  );

  const confirmUndo = async () => {
    if (!undoId) return;
    setUndoing(true);
    try {
      await onUndo(undoId);
      setUndoId(null);
    } finally {
      setUndoing(false);
    }
  };

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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          pb: 1.5,
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ClockIcon size={20} color={dzfColors.navy[700]} />
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: dzfColors.navy[950] }}>
            Today&apos;s Check-In Feed
          </Typography>
          <DZFBadge
            label={`${records.length} check-in${records.length === 1 ? '' : 's'}`}
            variant="info"
            size="small"
          />
        </Box>

        {onRefresh && (
          <DZFButton
            variant="soft"
            size="small"
            startIcon={<RefreshIcon size={14} />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </DZFButton>
        )}
      </Box>

      {loading && records.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ color: dzfColors.navy[700] }} />
        </Box>
      ) : records.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5, color: dzfColors.surfaces.textMuted }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
            No check-ins recorded for today yet.
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', mt: 0.5 }}>
            Scanned barcodes will stream here in real-time.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            maxHeight: 480,
            overflowY: 'auto',
            pr: 0.5,
          }}
        >
          {records.map((record) => {
            const timeStr = new Date(record.attendanceTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const id = record._id ? record._id.toString() : '';

            return (
              <Box
                key={id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid #f1f5f9',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    backgroundColor: '#f8fafc',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor:
                        record.classType === 'library'
                          ? dzfColors.maroon[900]
                          : dzfColors.navy[700],
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {record.patronName ? record.patronName[0].toUpperCase() : 'P'}
                  </Avatar>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.925rem', color: dzfColors.navy[950] }}>
                        {record.patronName}
                      </Typography>
                      <DZFBadge label={record.patronBarcode} variant="info" size="small" />
                      <Typography sx={{ fontSize: '0.75rem', color: dzfColors.surfaces.textMuted }}>
                        {timeStr}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: dzfColors.surfaces.textSecondary }}>
                        {record.className}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        • Marked by {record.markedBy}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DZFBadge
                    label={`+${record.points} pts`}
                    variant={record.classType === 'library' ? 'default' : 'top10'}
                    size="small"
                  />

                  <DZFButton
                    variant="danger"
                    size="small"
                    onClick={() => setUndoId(id)}
                    sx={{ minWidth: 60, fontSize: '0.75rem', py: 0.5, px: 1 }}
                  >
                    Undo
                  </DZFButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Undo Confirmation Dialog */}
      <Dialog
        open={Boolean(undoId)}
        onClose={() => !undoing && setUndoId(null)}
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
          {targetRecord && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: '0.9rem', color: '#334155' }}>
                Are you sure you want to reverse the attendance check-in for{' '}
                <strong>{targetRecord.patronName}</strong> ({targetRecord.patronBarcode})?
              </Typography>
              <Typography sx={{ fontSize: '0.825rem', color: '#64748b', mt: 1 }}>
                This will delete the attendance log and reverse{' '}
                <strong>{targetRecord.points} points</strong> from their monthly activity and patron score.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <DZFButton variant="soft" onClick={() => setUndoId(null)} disabled={undoing}>
            Cancel
          </DZFButton>
          <DZFButton
            variant="danger"
            onClick={confirmUndo}
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
