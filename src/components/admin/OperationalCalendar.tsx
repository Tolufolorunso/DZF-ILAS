'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Popover from '@mui/material/Popover';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { IEventItemDTO } from '@/lib/admin/types';
import CalendarPdfUploadDialog from './CalendarPdfUploadDialog';
import CalendarCsvUploadDialog from './CalendarCsvUploadDialog';
import EventEditDialog from './EventEditDialog';
import EventFormDialog from './EventFormDialog';

interface OperationalCalendarProps {
  initialEvents?: IEventItemDTO[];
  onRefreshParent?: () => void;
  readOnly?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  assembly: { label: 'Assembly', bg: '#EFF6FF', text: '#1E40AF', dot: '#2563EB' },
  workshop: { label: 'Workshop', bg: '#FFFBEB', text: '#92400E', dot: '#D97706' },
  competition: { label: 'Competition', bg: '#ECFDF5', text: '#065F46', dot: '#059669' },
  holiday: { label: 'Holiday / Recess', bg: '#FEF2F2', text: '#991B1B', dot: '#DC2626' },
  meeting: { label: 'Meeting', bg: '#F5F3FF', text: '#5B21B6', dot: '#7C3AED' },
  general: { label: 'General', bg: '#F3F4F6', text: '#374151', dot: '#6B7280' },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function OperationalCalendar({
  initialEvents,
  onRefreshParent,
  readOnly = false,
}: OperationalCalendarProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear);
  const [viewMode, setViewMode] = React.useState<'matrix' | 'agenda'>('agenda');
  const [events, setEvents] = React.useState<IEventItemDTO[]>(initialEvents || []);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [notificationMsg, setNotificationMsg] = React.useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Dialog states
  const [csvDialogOpen, setCsvDialogOpen] = React.useState<boolean>(false);
  const [pdfDialogOpen, setPdfDialogOpen] = React.useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState<boolean>(false);
  const [editEvent, setEditEvent] = React.useState<IEventItemDTO | null>(null);
  const [evaluatingAlerts, setEvaluatingAlerts] = React.useState<boolean>(false);

  // Day Popover state for Matrix view
  const [popoverAnchor, setPopoverAnchor] = React.useState<HTMLElement | null>(null);
  const [popoverEvents, setPopoverEvents] = React.useState<{ dateStr: string; items: IEventItemDTO[] } | null>(null);

  const fetchEvents = React.useCallback(async (year: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/events?academicYear=${year}&limit=200`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('[FETCH_EVENTS_ERROR]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEvents(selectedYear);
  }, [selectedYear, fetchEvents]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleEvaluateAlerts = async () => {
    try {
      setEvaluatingAlerts(true);
      setNotificationMsg(null);
      const res = await fetch('/api/admin/calendar/check-alerts', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        const { summary } = data;
        setNotificationMsg({
          type: 'success',
          text: `Alert pipeline executed: ${summary.alertsDispatchedCount} milestone alerts sent (${summary.notificationsCreatedCount} unread notices dispatched to active staff).`,
        });
        fetchEvents(selectedYear);
      } else {
        throw new Error(data.error || 'Alert evaluation failed');
      }
    } catch (err) {
      setNotificationMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error evaluating advance alerts',
      });
    } finally {
      setEvaluatingAlerts(false);
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the operational calendar?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setNotificationMsg({ type: 'info', text: `Event "${name}" deleted successfully.` });
        if (onRefreshParent) onRefreshParent();
      } else {
        throw new Error(data.error || 'Failed to delete event');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleCreateSubmit = async (payload: any) => {
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        academicYear: selectedYear,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create event');
    }
    setNotificationMsg({ type: 'success', text: `Event "${payload.eventName}" scheduled successfully.` });
    fetchEvents(selectedYear);
    if (onRefreshParent) onRefreshParent();
  };

  // Filter events
  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => {
      const name = (e.eventName || e.title || '').toLowerCase();
      const loc = (e.location || '').toLowerCase();
      const aud = (e.targetAudience || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesQuery = !q || name.includes(q) || loc.includes(q) || aud.includes(q);

      const matchesCat = categoryFilter === 'all' || (e.category || 'general') === categoryFilter;

      return matchesQuery && matchesCat;
    });
  }, [events, searchQuery, categoryFilter]);

  // Next upcoming event banner
  const nextUpcomingEvent = React.useMemo(() => {
    const now = new Date().getTime();
    const future = events
      .filter((e) => new Date(e.eventDate).getTime() >= now)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    return future[0] || null;
  }, [events]);

  const getDaysRemaining = (isoDate: string) => {
    const diffMs = new Date(isoDate).getTime() - new Date().getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Group events by month for Agenda Stream
  const groupedByMonth = React.useMemo(() => {
    const map: Record<number, IEventItemDTO[]> = {};
    for (let m = 0; m < 12; m++) map[m] = [];

    filteredEvents.forEach((ev) => {
      const d = new Date(ev.eventDate);
      if (!isNaN(d.getTime())) {
        const m = d.getUTCMonth();
        if (map[m]) map[m].push(ev);
      }
    });

    return map;
  }, [filteredEvents]);

  // Map events by date string 'YYYY-MM-DD' for matrix view
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, IEventItemDTO[]> = {};
    events.forEach((ev) => {
      const d = new Date(ev.eventDate);
      if (!isNaN(d.getTime())) {
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    });
    return map;
  }, [events]);

  const handleDayClick = (e: React.MouseEvent<HTMLElement>, dateStr: string, dayEvents: IEventItemDTO[]) => {
    if (dayEvents.length > 0) {
      setPopoverAnchor(e.currentTarget);
      setPopoverEvents({ dateStr, items: dayEvents });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Banner & Multi-Year Control Bar */}
      <Card
        sx={{
          p: 3,
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${dzfColors.navy[900]} 0%, #172554 60%, ${dzfColors.maroon[900]} 100%)`,
          color: '#FFFFFF',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '1.8rem' }}>🏛️</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
                  Foundation Operational Calendar
                </Typography>
                <Chip
                  size="small"
                  label={`${selectedYear} Institutional Session`}
                  sx={{
                    bgcolor: 'rgba(245, 158, 11, 0.2)',
                    color: '#FCD34D',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontWeight: 700,
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5, maxWidth: 680 }}>
                {readOnly
                  ? 'Official foundation operational timeline and milestone schedule for academic, library, and institutional activities.'
                  : 'Master administrative schedule and timeline. Upload annual calendar CSVs or PDFs for instant milestone extraction, inspect matrix or agenda views, and manage automated 30d, 14d, and 7d advance staff alerts.'}
              </Typography>
            </Box>

            {/* Action Buttons (Admin Only) */}
            {!readOnly && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <DZFButton
                  variant="secondary"
                  size="small"
                  onClick={handleEvaluateAlerts}
                  disabled={evaluatingAlerts}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                >
                  {evaluatingAlerts ? (
                    <>
                      <CircularProgress size={14} sx={{ color: '#FFFFFF', mr: 1 }} />
                      Checking Alerts...
                    </>
                  ) : (
                    '🔔 Run Alert Check'
                  )}
                </DZFButton>

                <DZFButton
                  variant="secondary"
                  size="small"
                  onClick={() => setCsvDialogOpen(true)}
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#A7F3D0',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.25)' },
                  }}
                >
                  📊 Import Calendar CSV
                </DZFButton>

                <DZFButton
                  variant="secondary"
                  size="small"
                  onClick={() => setPdfDialogOpen(true)}
                  sx={{
                    bgcolor: 'rgba(245, 158, 11, 0.15)',
                    color: '#FDE68A',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.25)' },
                  }}
                >
                  📄 Import Calendar PDF
                </DZFButton>

                <DZFButton
                  variant="primary"
                  size="small"
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    background: `linear-gradient(135deg, ${dzfColors.gold[500]}, ${dzfColors.gold[700]})`,
                    color: '#1E293B',
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                  }}
                >
                  + Schedule Event
                </DZFButton>
              </Box>
            )}
          </Box>

          {/* Next Upcoming Milestone Countdown Strip */}
          {nextUpcomingEvent && (
            <Box
              sx={{
                p: 1.5,
                px: 2,
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '1.2rem' }}>⚡</Typography>
                <Box>
                  <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
                    Next Institutional Milestone
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                    {nextUpcomingEvent.eventName || nextUpcomingEvent.title} —{' '}
                    {new Date(nextUpcomingEvent.eventDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={`Location: ${nextUpcomingEvent.location || 'Main Campus'}`}
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)', color: '#E2E8F0', fontSize: '0.75rem' }}
                />
                <Chip
                  size="small"
                  label={
                    getDaysRemaining(nextUpcomingEvent.eventDate) === 0
                      ? 'TODAY'
                      : `In ${getDaysRemaining(nextUpcomingEvent.eventDate)} days`
                  }
                  sx={{
                    bgcolor: '#F59E0B',
                    color: '#1E293B',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Year Selector Tabs & View Mode Toggles */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, mr: 0.5 }}>
                YEAR:
              </Typography>
              {[2025, 2026, 2027, 2028, 2029].map((year) => {
                const isSelected = selectedYear === year;
                return (
                  <Box
                    key={year}
                    onClick={() => handleYearChange(year)}
                    sx={{
                      px: 2,
                      py: 0.6,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      transition: 'all 0.2s ease',
                      bgcolor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? dzfColors.navy[900] : '#CBD5E1',
                      border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                      '&:hover': {
                        bgcolor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                      },
                    }}
                  >
                    {year}
                  </Box>
                );
              })}
            </Box>

            {/* View Mode Toggle Buttons */}
            <Box
              sx={{
                display: 'flex',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                p: 0.5,
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box
                onClick={() => setViewMode('agenda')}
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  bgcolor: viewMode === 'agenda' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  color: viewMode === 'agenda' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
              >
                📋 Chronological Agenda
              </Box>
              <Box
                onClick={() => setViewMode('matrix')}
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  bgcolor: viewMode === 'matrix' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  color: viewMode === 'matrix' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
              >
                📅 12-Month Matrix
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Notification Toast */}
      {notificationMsg && (
        <Alert
          severity={notificationMsg.type}
          onClose={() => setNotificationMsg(null)}
          sx={{ borderRadius: '12px' }}
        >
          {notificationMsg.text}
        </Alert>
      )}

      {/* Filter & Search Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 260 }}>
          <TextField
            size="small"
            placeholder="Search milestone title, venue, or audience..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: '100%', maxWidth: 360, bgcolor: '#FFFFFF', borderRadius: '10px' }}
          />

          <TextField
            select
            size="small"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ width: 170, bgcolor: '#FFFFFF', borderRadius: '10px' }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="assembly">Assembly</MenuItem>
            <MenuItem value="workshop">Workshop</MenuItem>
            <MenuItem value="competition">Competition</MenuItem>
            <MenuItem value="holiday">Holiday</MenuItem>
            <MenuItem value="meeting">Meeting</MenuItem>
            <MenuItem value="general">General</MenuItem>
          </TextField>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Showing {filteredEvents.length} of {events.length} events for {selectedYear}
          </Typography>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress sx={{ color: dzfColors.navy[900] }} />
        </Box>
      )}

      {/* VIEW MODE 1: CHRONOLOGICAL AGENDA STREAM */}
      {!loading && viewMode === 'agenda' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredEvents.length === 0 ? (
            <Card
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px dashed #CBD5E1',
                bgcolor: '#F8FAFC',
              }}
            >
              <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📅</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                No Events Scheduled for {selectedYear}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 460, mx: 'auto', mt: 0.5, mb: 2 }}>
                {readOnly
                  ? 'No institutional milestones are scheduled for this academic session yet. Contact administrators for schedule updates.'
                  : 'Import the institutional calendar CSV or PDF using the buttons below or schedule single events to build the operational timeline.'}
              </Typography>
              {!readOnly && (
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <DZFButton
                    variant="primary"
                    onClick={() => setCsvDialogOpen(true)}
                    sx={{
                      background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
                    }}
                  >
                    📊 Import {selectedYear} Calendar CSV
                  </DZFButton>
                  <DZFButton variant="secondary" onClick={() => setPdfDialogOpen(true)}>
                    📄 Import Calendar PDF
                  </DZFButton>
                </Box>
              )}
            </Card>
          ) : (
            MONTH_NAMES.map((monthName, monthIndex) => {
              const monthEvents = groupedByMonth[monthIndex] || [];
              if (monthEvents.length === 0) return null;

              return (
                <Box key={monthName} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Month Separator Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        color: dzfColors.navy[900],
                        letterSpacing: '-0.3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 24,
                          borderRadius: '4px',
                          bgcolor: dzfColors.gold[500],
                          display: 'inline-block',
                        }}
                      />
                      {monthName} {selectedYear}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${monthEvents.length} Milestone${monthEvents.length === 1 ? '' : 's'}`}
                      sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}
                    />
                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
                  </Box>

                  {/* Month Events Cards */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    {monthEvents.map((ev) => {
                      const eventDateObj = new Date(ev.eventDate);
                      const dayNumber = eventDateObj.getUTCDate();
                      const dayOfWeek = eventDateObj.toLocaleDateString('en-GB', { weekday: 'short' });
                      const daysRemaining = getDaysRemaining(ev.eventDate);
                      const catStyle = CATEGORY_MAP[ev.category || 'general'] || CATEGORY_MAP.general;

                      return (
                        <Card
                          key={ev.id}
                          sx={{
                            p: 2.5,
                            borderRadius: '16px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            gap: 2,
                            alignItems: 'flex-start',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                              transform: 'translateY(-2px)',
                              borderColor: '#CBD5E1',
                            },
                          }}
                        >
                          {/* Left Date Badge */}
                          <Box
                            sx={{
                              width: 60,
                              minWidth: 60,
                              p: 1,
                              borderRadius: '12px',
                              bgcolor: dzfColors.navy[50],
                              border: `1px solid ${dzfColors.navy[100]}`,
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: dzfColors.navy[700],
                                textTransform: 'uppercase',
                              }}
                            >
                              {dayOfWeek}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '1.4rem',
                                fontWeight: 900,
                                color: dzfColors.navy[900],
                                lineHeight: 1.1,
                              }}
                            >
                              {dayNumber}
                            </Typography>
                          </Box>

                          {/* Event Content Details */}
                          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900], lineHeight: 1.25 }}>
                                {ev.eventName || ev.title}
                              </Typography>

                              {/* Action Buttons (Admin Only) */}
                              {!readOnly && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Tooltip title="Edit Milestone">
                                    <IconButton
                                      size="small"
                                      onClick={() => setEditEvent(ev)}
                                      sx={{ color: '#64748B', '&:hover': { color: dzfColors.navy[900] } }}
                                    >
                                      ✏️
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Milestone">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteEvent(ev.id, ev.eventName || ev.title || 'Event')}
                                      sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}
                                    >
                                      🗑️
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )}
                            </Box>

                            {/* Tags & Category */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                size="small"
                                label={catStyle.label}
                                sx={{
                                  bgcolor: catStyle.bg,
                                  color: catStyle.text,
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  height: 22,
                                }}
                              />

                              {daysRemaining >= 0 ? (
                                <Chip
                                  size="small"
                                  label={daysRemaining === 0 ? 'Today' : `In ${daysRemaining}d`}
                                  sx={{
                                    bgcolor: daysRemaining <= 7 ? '#FEE2E2' : '#F1F5F9',
                                    color: daysRemaining <= 7 ? '#DC2626' : '#475569',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    height: 22,
                                  }}
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label="Past"
                                  sx={{ bgcolor: '#E2E8F0', color: '#64748B', fontSize: '0.7rem', height: 22 }}
                                />
                              )}

                              {/* Alert Pipeline Badges */}
                              {ev.alertsSent && (
                                <Tooltip title="Advance notifications sent to staff">
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {ev.alertsSent.oneMonth && (
                                      <Chip size="small" label="30d Alert" sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontSize: '0.65rem', height: 18 }} />
                                    )}
                                    {ev.alertsSent.twoWeeks && (
                                      <Chip size="small" label="14d Alert" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontSize: '0.65rem', height: 18 }} />
                                    )}
                                    {ev.alertsSent.oneWeek && (
                                      <Chip size="small" label="7d Alert" sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontSize: '0.65rem', height: 18 }} />
                                    )}
                                  </Box>
                                </Tooltip>
                              )}
                            </Box>

                            {/* Venue & Target Audience */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem', color: '#64748B' }}>
                                <Typography sx={{ fontSize: '0.85rem' }}>📍</Typography>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                                  {ev.location || 'DZF Learning Center'} &bull; Time: {ev.arrivalTime || '09:00 AM'}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem', color: '#64748B' }}>
                                <Typography sx={{ fontSize: '0.85rem' }}>👥</Typography>
                                <Typography variant="caption" sx={{ color: '#64748B' }}>
                                  Participants: {ev.participants || ev.targetAudience || 'All Registered Staff & Patrons'}
                                </Typography>
                              </Box>

                              {ev.focalPerson && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem', color: '#64748B' }}>
                                  <Typography sx={{ fontSize: '0.85rem' }}>👤</Typography>
                                  <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700 }}>
                                    Lead / Focal Person: {ev.focalPerson}
                                  </Typography>
                                </Box>
                              )}

                              {(ev.remarks || ev.description) && (
                                <Box sx={{ mt: 0.5, p: 0.8, px: 1, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                                  <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic', display: 'block' }}>
                                    📝 Directives: {ev.remarks || ev.description}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      )}

      {/* VIEW MODE 2: 12-MONTH MATRIX GRID */}
      {!loading && viewMode === 'matrix' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2.5 }}>
          {MONTH_NAMES.map((monthName, monthIndex) => {
            // Compute days in month
            const firstDayOfWeek = new Date(selectedYear, monthIndex, 1).getDay();
            const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();

            const cells: Array<{ day: number | null; dateStr: string; items: IEventItemDTO[] }> = [];

            // Empty pad cells for start day
            for (let i = 0; i < firstDayOfWeek; i++) {
              cells.push({ day: null, dateStr: '', items: [] });
            }

            // Fill actual calendar days
            for (let d = 1; d <= daysInMonth; d++) {
              const mm = String(monthIndex + 1).padStart(2, '0');
              const dd = String(d).padStart(2, '0');
              const dateStr = `${selectedYear}-${mm}-${dd}`;
              const dayItems = eventsByDate[dateStr] || [];
              cells.push({ day: d, dateStr, items: dayItems });
            }

            return (
              <Card
                key={monthName}
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  bgcolor: '#FFFFFF',
                }}
              >
                {/* Month Title */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                    {monthName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                    {selectedYear}
                  </Typography>
                </Box>

                {/* Days of Week Header */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', mb: 1 }}>
                  {DAYS_SHORT.map((day) => (
                    <Typography key={day} variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8' }}>
                      {day}
                    </Typography>
                  ))}
                </Box>

                {/* Day Matrix Cells */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'center' }}>
                  {cells.map((cell, idx) => {
                    if (cell.day === null) {
                      return <Box key={`empty-${idx}`} sx={{ height: 32 }} />;
                    }

                    const hasEvents = cell.items.length > 0;
                    const primaryEvent = cell.items[0];
                    const catDot = primaryEvent ? (CATEGORY_MAP[primaryEvent.category || 'general']?.dot || '#2563EB') : '#2563EB';

                    return (
                      <Box
                        key={cell.dateStr}
                        onClick={(e) => handleDayClick(e, cell.dateStr, cell.items)}
                        sx={{
                          height: 32,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          cursor: hasEvents ? 'pointer' : 'default',
                          position: 'relative',
                          bgcolor: hasEvents ? '#F0FDF4' : 'transparent',
                          border: hasEvents ? '1px solid #BBF7D0' : 'none',
                          transition: 'all 0.15s ease',
                          '&:hover': hasEvents
                            ? { bgcolor: '#DCFCE7', transform: 'scale(1.1)', zIndex: 2 }
                            : { bgcolor: '#F8FAFC' },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: hasEvents ? 800 : 500,
                            color: hasEvents ? '#15803D' : '#334155',
                            fontSize: '0.75rem',
                          }}
                        >
                          {cell.day}
                        </Typography>

                        {/* Milestone Indicator Dot */}
                        {hasEvents && (
                          <Box
                            sx={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              bgcolor: catDot,
                              position: 'absolute',
                              bottom: 2,
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Popover for Day Events in Matrix View */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={() => setPopoverAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              borderRadius: '16px',
              maxWidth: 320,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            },
          },
        }}
      >
        {popoverEvents && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              📅 {new Date(popoverEvents.dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>

            {popoverEvents.items.map((it) => (
              <Box key={it.id} sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  {it.eventName || it.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  📍 {it.location || 'Main Campus'} &bull; {it.arrivalTime || '09:00 AM'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  👥 {it.participants || it.targetAudience || 'All Staff'}
                </Typography>
                {it.focalPerson && (
                  <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700, display: 'block' }}>
                    👤 {it.focalPerson}
                  </Typography>
                )}
                {it.remarks && (
                  <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                    📝 {it.remarks}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Popover>

      {/* CSV Upload Modal */}
      {!readOnly && (
        <CalendarCsvUploadDialog
          open={csvDialogOpen}
          onClose={() => setCsvDialogOpen(false)}
          initialYear={selectedYear}
          onSuccess={(count) => {
            setNotificationMsg({
              type: 'success',
              text: `Successfully imported ${count} milestones from operational calendar CSV into ${selectedYear} session.`,
            });
            fetchEvents(selectedYear);
            if (onRefreshParent) onRefreshParent();
          }}
        />
      )}

      {/* PDF Upload Modal */}
      {!readOnly && (
        <CalendarPdfUploadDialog
          open={pdfDialogOpen}
          onClose={() => setPdfDialogOpen(false)}
          initialYear={selectedYear}
          onSuccess={(count) => {
            setNotificationMsg({
              type: 'success',
              text: `Successfully imported ${count} milestones from yearly calendar PDF into ${selectedYear} session.`,
            });
            fetchEvents(selectedYear);
            if (onRefreshParent) onRefreshParent();
          }}
        />
      )}

      {/* Edit Event Modal */}
      {!readOnly && (
        <EventEditDialog
          open={Boolean(editEvent)}
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onSuccess={(updated) => {
            setNotificationMsg({
              type: 'success',
              text: `Event "${updated.eventName || updated.title}" updated successfully.`,
            });
            fetchEvents(selectedYear);
            if (onRefreshParent) onRefreshParent();
          }}
        />
      )}

      {/* Schedule Single Event Modal */}
      {!readOnly && (
        <EventFormDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </Box>
  );
}
