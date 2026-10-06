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
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';

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
  const [assignedToUsername, setAssignedToUsername] = React.useState('');
  const [assignedToName, setAssignedToName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedToUsername.trim()) {
      setError('Title and Assigned Staff Username are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        assignedToUsername: assignedToUsername.trim(),
        assignedToName: assignedToName.trim() || assignedToUsername.trim(),
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignedToUsername('');
      setAssignedToName('');
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
      slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
            Create Operational Task
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Assign an internal action item to a library staff member
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
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
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

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Assignee Username"
              required
              size="small"
              placeholder="e.g. librarian1"
              value={assignedToUsername}
              onChange={(e) => setAssignedToUsername(e.target.value)}
              sx={{ flex: 1 }}
              disabled={loading}
            />
            <TextField
              label="Assignee Full Name (Optional)"
              size="small"
              placeholder="e.g. Sister Grace"
              value={assignedToName}
              onChange={(e) => setAssignedToName(e.target.value)}
              sx={{ flex: 1 }}
              disabled={loading}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <DZFButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </DZFButton>
          <DZFButton type="submit" variant="primary" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Task'}
          </DZFButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
