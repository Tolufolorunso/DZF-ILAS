'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: {
    eventName: string;
    title?: string;
    eventDate: string;
    location?: string;
    targetAudience?: string;
    arrivalTime?: string;
    description?: string;
  }) => Promise<void>;
}

export default function EventFormDialog({ open, onClose, onSubmit }: EventFormDialogProps) {
  const [eventName, setEventName] = React.useState('');
  const [eventDate, setEventDate] = React.useState('');
  const [location, setLocation] = React.useState('DZF Central Learning Center');
  const [targetAudience, setTargetAudience] = React.useState('All Registered Patrons & Staff');
  const [arrivalTime, setArrivalTime] = React.useState('09:00 AM');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) {
      setError('Event Name and Event Date are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        eventName: eventName.trim(),
        title: eventName.trim(),
        eventDate,
        location: location.trim(),
        targetAudience: targetAudience.trim(),
        arrivalTime: arrivalTime.trim(),
        description: description.trim() || undefined,
      });
      setEventName('');
      setEventDate('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule event');
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
            Schedule Foundation Event
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Publish an institutional activity or library session to the institutional calendar
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Event Name / Title"
            required
            fullWidth
            size="small"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. Annual Literacy Gala & DRNICER Honors"
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Event Date"
              type="date"
              required
              size="small"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
              disabled={loading}
            />

            <TextField
              label="Arrival Time"
              size="small"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              sx={{ flex: 1 }}
              disabled={loading}
            />
          </Box>

          <TextField
            label="Venue / Location"
            fullWidth
            size="small"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Target Audience"
            fullWidth
            size="small"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Event Description / Agenda"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Program schedule, guest speakers, or guidelines..."
            disabled={loading}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <DZFButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </DZFButton>
          <DZFButton type="submit" variant="primary" disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Event'}
          </DZFButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
