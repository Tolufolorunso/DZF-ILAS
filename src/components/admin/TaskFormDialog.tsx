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

interface AssigneeOption {
  username: string;
  name: string;
  role: string;
  isGroup: boolean;
}

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    assignedToUsername: string;
    assignedToName: string;
  }) => Promise<void>;
}

export default function TaskFormDialog({ open, onClose, onSubmit }: TaskFormDialogProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = React.useState('');
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>('');
  const [assignees, setAssignees] = React.useState<AssigneeOption[]>([]);
  const [groups, setGroups] = React.useState<AssigneeOption[]>([]);
  const [loadingAssignees, setLoadingAssignees] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load assignable staff and groups whenever dialog opens
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
            if (data.assignees?.length > 0 && !selectedAssignee) {
              setSelectedAssignee(data.assignees[0].username);
            }
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
  }, [open, selectedAssignee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedAssignee) {
      setError('Title and Assigned Staff or Group are required.');
      return;
    }

    // Resolve name
    const allOptions = [...groups, ...assignees];
    const matched = allOptions.find((o) => o.username === selectedAssignee);
    const assignedName = matched ? matched.name : selectedAssignee;

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        assignedToUsername: selectedAssignee,
        assignedToName: assignedName,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setSelectedAssignee('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
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
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxHeight: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }}
      >
        <DialogTitle sx={{ pb: 1, flexShrink: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
            Create Operational Task
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Assign an internal action item to an individual staff member or group
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5, display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 auto', overflowY: 'auto' }}>
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
            placeholder="e.g. Recalibrate barcode scanners in ICT Lab"
            disabled={loading}
          />

          <TextField
            label="Description / Context"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed instructions for the assigned staff member..."
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Priority"
              select
              size="small"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              sx={{ width: 160 }}
              disabled={loading}
            >
              <MenuItem value="low">Low Priority</MenuItem>
              <MenuItem value="medium">Medium Priority</MenuItem>
              <MenuItem value="high">High Priority</MenuItem>
            </TextField>

            <TextField
              label="Target Due Date"
              type="date"
              size="small"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
              disabled={loading}
            />
          </Box>

          <TextField
            label="Assignee (Staff Member or Role Group)"
            select
            required
            fullWidth
            size="small"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            disabled={loading || loadingAssignees}
            helperText={loadingAssignees ? 'Loading authorized staff...' : 'Select a team member or entire group to delegate to'}
          >
            {loadingAssignees ? (
              <MenuItem disabled value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <span>Loading staff from database...</span>
                </Box>
              </MenuItem>
            ) : null}

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

        <DialogActions sx={{ p: 2, flexShrink: 0 }}>
          <DZFButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </DZFButton>
          <DZFButton type="submit" variant="primary" disabled={loading || loadingAssignees}>
            {loading ? 'Assigning...' : 'Assign Task'}
          </DZFButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
