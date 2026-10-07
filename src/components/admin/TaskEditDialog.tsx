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
import ListSubheader from '@mui/material/ListSubheader';

import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import type { ITaskItemDTO } from '@/lib/admin/types';

interface AssigneeOption {
  username: string;
  name: string;
  role: string;
  isGroup: boolean;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'inProgress' | 'completed' | 'archived';
  dueDate?: string | null;
  assignedToUsername?: string;
  assignedToName?: string;
}

interface TaskEditDialogProps {
  open: boolean;
  task: ITaskItemDTO | null;
  onClose: () => void;
  onSubmit: (taskId: string, payload: TaskUpdatePayload) => Promise<void>;
}

export default function TaskEditDialog({
  open,
  task,
  onClose,
  onSubmit,
}: TaskEditDialogProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = React.useState<'todo' | 'inProgress' | 'completed'>('todo');
  const [dueDate, setDueDate] = React.useState('');
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>('');
  const [assignees, setAssignees] = React.useState<AssigneeOption[]>([]);
  const [groups, setGroups] = React.useState<AssigneeOption[]>([]);
  const [loadingAssignees, setLoadingAssignees] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus((task.status as 'todo' | 'inProgress' | 'completed') || 'todo');
      setDueDate(
        task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : ''
      );
      setSelectedAssignee(task.assignedTo?.username || '');
    }
  }, [task]);

  // Load assignable staff options
  React.useEffect(() => {
    if (open) {
      let isMounted = true;
      setLoadingAssignees(true);
      fetch('/api/admin/users/assignees')
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.success) {
            setAssignees(data.assignees || []);
            setGroups(data.groups || []);
          }
        })
        .catch((err) => {
          console.error('Failed to load assignees:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingAssignees(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    const allOptions = [...groups, ...assignees];
    const matched = allOptions.find((o) => o.username === selectedAssignee);
    const assignedName = matched ? matched.name : selectedAssignee;

    try {
      setLoading(true);
      setError(null);
      await onSubmit(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate ? dueDate : null,
        assignedToUsername: selectedAssignee || undefined,
        assignedToName: assignedName || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
            Edit Operational Task
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Assigned by: @{task.assignedBy?.username || 'admin'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Task Title"
            required
            fullWidth
            size="small"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Description / Instructions"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Priority"
              select
              size="small"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              sx={{ flex: 1 }}
              disabled={loading}
            >
              <MenuItem value="low">Low Priority</MenuItem>
              <MenuItem value="medium">Medium Priority</MenuItem>
              <MenuItem value="high">High Priority</MenuItem>
            </TextField>

            <TextField
              label="Status"
              select
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'todo' | 'inProgress' | 'completed')}
              sx={{ flex: 1 }}
              disabled={loading}
            >
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="inProgress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Box>

          <TextField
            label="Target Due Date"
            type="date"
            size="small"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Reassign To (Staff Member or Group)"
            select
            fullWidth
            size="small"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            disabled={loading || loadingAssignees}
            helperText={loadingAssignees ? 'Loading authorized staff...' : 'Leave unchanged to keep current assignee'}
          >
            {loadingAssignees ? (
              <MenuItem disabled value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <span>Loading staff...</span>
                </Box>
              </MenuItem>
            ) : null}

            {/* Current Assignee if not in fetched list */}
            {task.assignedTo?.username && !assignees.some((a) => a.username === task.assignedTo.username) && (
              <MenuItem value={task.assignedTo.username}>
                Current: {task.assignedTo.name} (@{task.assignedTo.username})
              </MenuItem>
            )}

            {groups.length > 0 && <ListSubheader sx={{ fontWeight: 800 }}>Teams & Role Groups</ListSubheader>}
            {groups.map((g) => (
              <MenuItem key={g.username} value={g.username} sx={{ fontWeight: 600, color: dzfColors.maroon[900] }}>
                👥 {g.name}
              </MenuItem>
            ))}

            {assignees.length > 0 && <ListSubheader sx={{ fontWeight: 800 }}>Individual Staff Members</ListSubheader>}
            {assignees.map((a) => (
              <MenuItem key={a.username} value={a.username}>
                👤 {a.name} (@{a.username}) — <span style={{ textTransform: 'capitalize', color: '#64748b', marginLeft: 4 }}>{a.role.replace('_', ' ')}</span>
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <DZFButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </DZFButton>
          <DZFButton type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </DZFButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
