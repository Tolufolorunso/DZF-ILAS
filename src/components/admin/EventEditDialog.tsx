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
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { IEventItemDTO } from '@/lib/admin/types';

interface EventEditDialogProps {
  open: boolean;
  event: IEventItemDTO | null;
  onClose: () => void;
  onSuccess: (updated: IEventItemDTO) => void;
}

const CATEGORIES = [
  { value: 'assembly', label: 'Assembly / Induction' },
  { value: 'workshop', label: 'Workshop / Training' },
  { value: 'competition', label: 'Competition / Sports' },
  { value: 'holiday', label: 'Holiday / Recess' },
  { value: 'meeting', label: 'Meeting / Council' },
  { value: 'general', label: 'General Milestone' },
];

export default function EventEditDialog({ open, event, onClose, onSuccess }: EventEditDialogProps) {
  const [eventName, setEventName] = React.useState('');
  const [eventDate, setEventDate] = React.useState('');
  const [academicYear, setAcademicYear] = React.useState<number>(new Date().getFullYear());
  const [category, setCategory] = React.useState<string>('general');
  const [location, setLocation] = React.useState('');
  const [targetAudience, setTargetAudience] = React.useState('');
  const [arrivalTime, setArrivalTime] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [participants, setParticipants] = React.useState('');
  const [focalPerson, setFocalPerson] = React.useState('');
  const [remarks, setRemarks] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (event) {
      setEventName(event.eventName || event.title || '');
      const d = new Date(event.eventDate);
      setEventDate(isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]);
      setAcademicYear(event.academicYear || d.getFullYear() || new Date().getFullYear());
      setCategory(event.category || 'general');
      setLocation(event.location || '');
      setTargetAudience(event.targetAudience || '');
      setArrivalTime(event.arrivalTime || '');
      setDescription(event.description || '');
      setParticipants(event.participants || '');
      setFocalPerson(event.focalPerson || '');
      setRemarks(event.remarks || '');
      setError(null);
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (!eventName.trim() || !eventDate) {
      setError('Event Name and Date are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventName.trim(),
          title: eventName.trim(),
          eventDate,
          academicYear,
          category,
          location: location.trim(),
          targetAudience: targetAudience.trim(),
          arrivalTime: arrivalTime.trim(),
          description: description.trim() || undefined,
          participants: participants.trim() || undefined,
          focalPerson: focalPerson.trim() || undefined,
          remarks: remarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update foundation event');
      }

      onSuccess(data.event);
      onClose();
    } catch (err) {
      console.error('[EDIT_EVENT_ERROR]', err);
      setError(err instanceof Error ? err.message : 'Error updating event');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

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
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
            ✏️ Edit Foundation Event
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Modify scheduled details, location, audience, or date for this milestone
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
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Event Date"
              type="date"
              required
              fullWidth
              size="small"
              value={eventDate}
              onChange={(e) => {
                setEventDate(e.target.value);
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) setAcademicYear(d.getFullYear());
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Academic Year"
              type="number"
              required
              fullWidth
              size="small"
              value={academicYear}
              onChange={(e) => setAcademicYear(Number(e.target.value))}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Category"
              fullWidth
              size="small"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Arrival / Start Time"
              fullWidth
              size="small"
              placeholder="e.g. 09:00 AM"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
            />
          </Box>

          <TextField
            label="Location / Venue"
            fullWidth
            size="small"
            placeholder="e.g. DZF Central Learning Center"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <TextField
            label="Target Audience"
            fullWidth
            size="small"
            placeholder="e.g. All Registered Patrons & Staff"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Participants"
              fullWidth
              size="small"
              placeholder="e.g. All Team Members, Library Members"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />

            <TextField
              label="Focal Person"
              fullWidth
              size="small"
              placeholder="e.g. CM, Librarian PM: Mrs Funmi"
              value={focalPerson}
              onChange={(e) => setFocalPerson(e.target.value)}
            />
          </Box>

          <TextField
            label="Remarks / Activity Directives"
            fullWidth
            multiline
            rows={2}
            size="small"
            placeholder="e.g. Librarians to come up with impact-driven plan"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <TextField
            label="Description / Operational Notes"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <DZFButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </DZFButton>
          <DZFButton
            type="submit"
            variant="primary"
            disabled={loading}
            sx={{
              background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={16} sx={{ color: '#FFFFFF', mr: 1 }} />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </DZFButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
