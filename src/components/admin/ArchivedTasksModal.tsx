'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';

import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { DZFBadge, ArchiveIcon, UndoIcon, TrashIcon, ClockIcon, UsersIcon } from '@/components';
import type { ITaskItemDTO } from '@/lib/admin/types';

interface ArchivedTasksModalProps {
  open: boolean;
  onClose: () => void;
  tasks: ITaskItemDTO[];
  loading?: boolean;
  onRestoreTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  currentUsername?: string;
  canManage?: boolean;
}

export default function ArchivedTasksModal({
  open,
  onClose,
  tasks,
  loading = false,
  onRestoreTask,
  onDeleteTask,
  currentUsername,
  canManage = true,
}: ArchivedTasksModalProps) {
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = React.useState<ITaskItemDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState<number>(0);

  React.useEffect(() => {
    setNow(Date.now());
  }, [open]);

  const calculateDaysRemaining = (archivedAt?: string | null): number => {
    if (!archivedAt) return 30;
    const archivedDate = new Date(archivedAt).getTime();
    const referenceTime = now || archivedDate;
    const elapsedMs = Math.max(0, referenceTime - archivedDate);
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - elapsedDays);
  };

  const handleRestore = async (taskId: string) => {
    try {
      setActionLoadingId(taskId);
      setError(null);
      await onRestoreTask(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore task');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      setActionLoadingId(taskToDelete.id);
      setError(null);
      await onDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              p: 1,
              maxHeight: 'calc(100vh - 48px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'rgba(180, 83, 9, 0.1)',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArchiveIcon size={20} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Archived Operational Tasks
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Archived tasks are preserved in a 30-day retention pool before automatic system purge.
                </Typography>
              </Box>
            </Box>

            <Chip
              size="small"
              label={`${tasks.length} in archive`}
              sx={{
                bgcolor: 'rgba(180, 83, 9, 0.12)',
                color: '#92400e',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            />
          </Box>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            py: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            flex: '1 1 auto',
            overflowY: 'auto',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                Loading archived retention pool...
              </Typography>
            </Box>
          ) : tasks.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 2,
                textAlign: 'center',
                bgcolor: 'rgba(100, 116, 139, 0.04)',
                borderRadius: 3,
                border: `1px dashed ${dzfColors.surfaces.border}`,
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  bgcolor: 'rgba(100, 116, 139, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  color: dzfColors.surfaces.textMuted,
                }}
              >
                <ArchiveIcon size={26} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                Archive is Currently Empty
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 440, mt: 0.5 }}>
                Completed operational tasks that are archived will be retained here for 30 days. You can restore them back to the active board anytime before the automatic deletion window expires.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {tasks.map((task) => {
                const daysLeft = calculateDaysRemaining(task.archivedAt);
                const isAuthor = Boolean(
                  currentUsername &&
                    task.assignedBy?.username &&
                    task.assignedBy.username.toLowerCase() === currentUsername.toLowerCase()
                );
                const canDelete = Boolean(canManage || isAuthor);
                const isProcessing = actionLoadingId === task.id;

                return (
                  <Card
                    key={task.id}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: `1px solid ${dzfColors.surfaces.border}`,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                      opacity: isProcessing ? 0.6 : 1,
                      transition: 'border-color 0.2s ease',
                      '&:hover': {
                        borderColor: dzfColors.navy[500],
                      },
                    }}
                  >
                    {/* Header: Title, Retention Chip, and Badges */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 240 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            label={`⏳ Auto-purges in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                            sx={{
                              height: 22,
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              bgcolor: daysLeft <= 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.12)',
                              color: daysLeft <= 3 ? '#b91c1c' : '#854d0e',
                              border: `1px solid ${daysLeft <= 3 ? '#fca5a5' : '#fde047'}`,
                            }}
                          />

                          {task.isPrivate && (
                            <Chip
                              size="small"
                              label="🔒 Private Task"
                              sx={{
                                height: 22,
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                bgcolor: '#fef9c3',
                                color: '#854d0e',
                                border: '1px solid #fde047',
                              }}
                            />
                          )}

                          <DZFBadge
                            variant={
                              task.priority === 'high'
                                ? 'error'
                                : task.priority === 'medium'
                                ? 'warning'
                                : 'default'
                            }
                            size="small"
                            label={task.priority}
                          />
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontSize: '0.8125rem' }}>
                            {task.description}
                          </Typography>
                        )}
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Restore to Active Board (Completed lane)">
                          <span>
                            <DZFButton
                              variant="secondary"
                              size="small"
                              onClick={() => handleRestore(task.id)}
                              disabled={isProcessing}
                              startIcon={<UndoIcon size={14} />}
                              sx={{ fontWeight: 700 }}
                            >
                              Restore
                            </DZFButton>
                          </span>
                        </Tooltip>

                        {canDelete && (
                          <Tooltip title="Permanently delete now">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => setTaskToDelete(task)}
                                disabled={isProcessing}
                                sx={{
                                  color: '#dc2626',
                                  p: 0.75,
                                  border: '1px solid rgba(220, 38, 38, 0.2)',
                                  borderRadius: 1.5,
                                  '&:hover': {
                                    bgcolor: 'rgba(220, 38, 38, 0.08)',
                                  },
                                }}
                              >
                                <TrashIcon size={16} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Metadata Footer */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                        pt: 1,
                        borderTop: `1px solid ${dzfColors.surfaces.canvas}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <UsersIcon size={14} color={dzfColors.navy[700]} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                            Assigned to: @{task.assignedTo?.username || 'unknown'}
                          </Typography>
                        </Box>

                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          By: @{task.assignedBy?.username || 'admin'}
                        </Typography>
                      </Box>

                      {task.archivedAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ClockIcon size={14} color={dzfColors.surfaces.textMuted} />
                          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                            Archived: {new Date(task.archivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, flexShrink: 0 }}>
          <DZFButton variant="secondary" onClick={onClose}>
            Close
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Permanent Deletion */}
      <Dialog
        open={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: '16px', p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#b91c1c' }}>
          Permanently Delete Task?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: dzfColors.navy[900] }}>
            Are you sure you want to permanently delete <strong>&ldquo;{taskToDelete?.title}&rdquo;</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
            This action cannot be undone. The task will be immediately purged from database retention.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <DZFButton variant="secondary" onClick={() => setTaskToDelete(null)}>
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            onClick={handleConfirmDelete}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
          >
            Delete Permanently
          </DZFButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
