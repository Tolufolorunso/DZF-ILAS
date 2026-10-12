'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import {
  BookIcon,
  UsersIcon,
  BarcodeIcon,
  ClockIcon,
  TrophyIcon,
  RefreshIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@/components/ui/DZFIcons';
import type { IBroadcastBannerDTO } from '@/lib/admin/types';

interface IPresetItem {
  id: string;
  name: string;
  category: string;
  active: boolean;
  metadata?: {
    address?: string;
    month?: number;
    targetAudience?: string;
    defaultPoints?: number;
    description?: string;
    [key: string]: unknown;
  };
}

export function AdminGovernanceStudio() {
  const [subTab, setSubTab] = React.useState<number>(0);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ==========================================
  // SECTION 1: SCHOOL DIRECTORY
  // ==========================================
  const [schools, setSchools] = React.useState<IPresetItem[]>([]);
  const [loadingSchools, setLoadingSchools] = React.useState(false);
  const [schoolSearch, setSchoolSearch] = React.useState('');
  const [schoolModalOpen, setSchoolModalOpen] = React.useState(false);
  const [editingSchool, setEditingSchool] = React.useState<IPresetItem | null>(null);
  const [schoolNameInput, setSchoolNameInput] = React.useState('');
  const [schoolAddressInput, setSchoolAddressInput] = React.useState('');
  const [savingSchool, setSavingSchool] = React.useState(false);

  const fetchSchools = React.useCallback(async () => {
    try {
      setLoadingSchools(true);
      const res = await fetch('/api/foundation-presets?category=school');
      const data = await res.json();
      if (data.success && Array.isArray(data.presets)) {
        setSchools(data.presets);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load school directory.' });
    } finally {
      setLoadingSchools(false);
    }
  }, []);

  // ==========================================
  // SECTION 2: ANNUAL FOUNDATION EVENTS
  // ==========================================
  const [events, setEvents] = React.useState<IPresetItem[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [eventModalOpen, setEventModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<IPresetItem | null>(null);
  const [eventNameInput, setEventNameInput] = React.useState('');
  const [eventMonthInput, setEventMonthInput] = React.useState<number>(1);
  const [eventAudienceInput, setEventAudienceInput] = React.useState('all');
  const [eventPointsInput, setEventPointsInput] = React.useState<number>(5);
  const [eventDescInput, setEventDescInput] = React.useState('');
  const [savingEvent, setSavingEvent] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    try {
      setLoadingEvents(false);
      const res = await fetch('/api/foundation-presets?category=annual_event');
      const data = await res.json();
      if (data.success && Array.isArray(data.presets)) {
        setEvents(data.presets);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load annual event presets.' });
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchSchools();
    fetchEvents();
  }, [fetchSchools, fetchEvents]);

  // Handle Save School
  const handleSaveSchool = async () => {
    if (!schoolNameInput.trim()) return;
    setSavingSchool(true);
    try {
      if (editingSchool) {
        const res = await fetch(`/api/foundation-presets/${editingSchool.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: schoolNameInput.trim(),
            metadata: { address: schoolAddressInput.trim() },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setFeedback({ type: 'success', message: 'School details updated successfully.' });
          fetchSchools();
          setSchoolModalOpen(false);
        } else {
          setFeedback({ type: 'error', message: data.error || 'Failed to update school.' });
        }
      } else {
        const res = await fetch('/api/foundation-presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: schoolNameInput.trim(),
            category: 'school',
            metadata: { address: schoolAddressInput.trim() },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setFeedback({ type: 'success', message: 'New school added to directory.' });
          fetchSchools();
          setSchoolModalOpen(false);
        } else {
          setFeedback({ type: 'error', message: data.error || 'Failed to create school.' });
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error occurred while saving school.' });
    } finally {
      setSavingSchool(false);
    }
  };

  const handleToggleSchoolActive = async (school: IPresetItem) => {
    try {
      const res = await fetch(`/api/foundation-presets/${school.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !school.active }),
      });
      const data = await res.json();
      if (data.success) {
        setSchools((prev) =>
          prev.map((s) => (s.id === school.id ? { ...s, active: !school.active } : s))
        );
        setFeedback({
          type: 'success',
          message: `${school.name} marked ${!school.active ? 'active' : 'inactive'}.`,
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update school status.' });
    }
  };

  const handleDeleteSchool = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the school directory?`)) return;
    try {
      const res = await fetch(`/api/foundation-presets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSchools((prev) => prev.filter((s) => s.id !== id));
        setFeedback({ type: 'success', message: `School "${name}" removed.` });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete school.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error deleting school.' });
    }
  };

  // Handle Save Event Preset
  const handleSaveEvent = async () => {
    if (!eventNameInput.trim()) return;
    setSavingEvent(true);
    try {
      const payload = {
        name: eventNameInput.trim(),
        category: 'annual_event',
        metadata: {
          month: Number(eventMonthInput),
          targetAudience: eventAudienceInput,
          defaultPoints: Number(eventPointsInput),
          description: eventDescInput.trim(),
        },
      };

      if (editingEvent) {
        const res = await fetch(`/api/foundation-presets/${editingEvent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setFeedback({ type: 'success', message: 'Annual event updated successfully.' });
          fetchEvents();
          setEventModalOpen(false);
        } else {
          setFeedback({ type: 'error', message: data.error || 'Failed to update event.' });
        }
      } else {
        const res = await fetch('/api/foundation-presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setFeedback({ type: 'success', message: 'Annual event added to foundation calendar.' });
          fetchEvents();
          setEventModalOpen(false);
        } else {
          setFeedback({ type: 'error', message: data.error || 'Failed to create event.' });
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error saving event preset.' });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleToggleEventActive = async (item: IPresetItem) => {
    try {
      const res = await fetch(`/api/foundation-presets/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === item.id ? { ...e, active: !item.active } : e))
        );
        setFeedback({
          type: 'success',
          message: `${item.name} set to ${!item.active ? 'active' : 'inactive'}.`,
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update event status.' });
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove preset "${name}"?`)) return;
    try {
      const res = await fetch(`/api/foundation-presets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setFeedback({ type: 'success', message: `Event preset "${name}" removed.` });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete event.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error deleting event.' });
    }
  };

  // ==========================================
  // SECTION 3: DATA BACKUP & EXPORTS
  // ==========================================
  const [downloadingEntity, setDownloadingEntity] = React.useState<string | null>(null);
  const [exportFormats, setExportFormats] = React.useState<Record<string, 'csv' | 'json'>>({
    books: 'csv',
    patrons: 'csv',
    attendance: 'csv',
    circulation: 'csv',
    all: 'json',
  });

  const handleDownloadBackup = async (entity: string) => {
    const fmt = exportFormats[entity] || (entity === 'all' ? 'json' : 'csv');
    setDownloadingEntity(entity);
    try {
      // Trigger browser download via native navigation
      const downloadUrl = `/api/admin/backup?entity=${entity}&format=${fmt}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setFeedback({
        type: 'success',
        message: `Export triggered for ${entity.toUpperCase()} in ${fmt.toUpperCase()} format.`,
      });
    } catch {
      setFeedback({ type: 'error', message: `Failed to download ${entity} backup.` });
    } finally {
      setTimeout(() => setDownloadingEntity(null), 1200);
    }
  };

  // ==========================================
  // SECTION 4: BROADCAST ANNOUNCEMENT CENTER
  // ==========================================
  const [broadcastMessage, setBroadcastMessage] = React.useState('');
  const [broadcastSeverity, setBroadcastSeverity] = React.useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [broadcastLink, setBroadcastLink] = React.useState('');
  const [broadcastIsActive, setBroadcastIsActive] = React.useState(false);
  const [broadcastPush, setBroadcastPush] = React.useState(false);
  const [savingBroadcast, setSavingBroadcast] = React.useState(false);
  const [currentBroadcast, setCurrentBroadcast] = React.useState<IBroadcastBannerDTO | null>(null);

  const fetchBroadcast = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/broadcast');
      const data = await res.json();
      if (data.success && data.broadcastBanner) {
        setCurrentBroadcast(data.broadcastBanner);
        setBroadcastMessage(data.broadcastBanner.message || '');
        setBroadcastSeverity(data.broadcastBanner.severity || 'info');
        setBroadcastLink(data.broadcastBanner.link || '');
        setBroadcastIsActive(Boolean(data.broadcastBanner.isActive));
        setBroadcastPush(Boolean(data.broadcastBanner.pushToDesktop));
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchBroadcast();
  }, [fetchBroadcast]);

  const handleSaveBroadcast = async () => {
    setSavingBroadcast(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage.trim(),
          severity: broadcastSeverity,
          link: broadcastLink.trim(),
          isActive: broadcastIsActive,
          pushToDesktop: broadcastPush,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentBroadcast(data.broadcastBanner);
        setFeedback({
          type: 'success',
          message: broadcastIsActive
            ? 'Broadcast published! All active staff sessions notified.'
            : 'Broadcast banner deactivated.',
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update broadcast banner.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error saving broadcast announcement.' });
    } finally {
      setSavingBroadcast(false);
    }
  };

  // ==========================================
  // SECTION 5: DATA HEALTH RECALCULATION
  // ==========================================
  const [recalculatingLeaderboard, setRecalculatingLeaderboard] = React.useState(false);
  const [recalcYear, setRecalcYear] = React.useState(new Date().getFullYear());
  const [recalcMonth, setRecalcMonth] = React.useState(new Date().getMonth() + 1);
  const [leaderboardResult, setLeaderboardResult] = React.useState<string | null>(null);

  const [reconcilingLoans, setReconcilingLoans] = React.useState(false);
  const [reconcileResult, setReconcileResult] = React.useState<{
    monographsAudited: number;
    activeLoansAudited: number;
    discrepanciesRepaired: number;
    overdueLoansCount: number;
    timestamp: string;
  } | null>(null);

  const handleRecalculateLeaderboard = async () => {
    setRecalculatingLeaderboard(true);
    setLeaderboardResult(null);
    try {
      const res = await fetch('/api/leaderboard/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: Number(recalcYear), month: Number(recalcMonth) }),
      });
      const data = await res.json();
      if (data.success) {
        setLeaderboardResult(
          data.message || `Leaderboard recalculation completed: ${data.recalculatedCount ?? 0} patrons evaluated.`
        );
        setFeedback({ type: 'success', message: 'Monthly leaderboard scores recalculated successfully.' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to recalculate leaderboard.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error during leaderboard recalculation.' });
    } finally {
      setRecalculatingLeaderboard(false);
    }
  };

  const handleReconcileLoans = async () => {
    setReconcilingLoans(true);
    setReconcileResult(null);
    try {
      const res = await fetch('/api/admin/health/reconcile', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setReconcileResult(data.data);
        setFeedback({
          type: 'success',
          message: `Reconciliation complete: ${data.data.discrepanciesRepaired} discrepancies repaired.`,
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to reconcile loans.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error during loan reconciliation.' });
    } finally {
      setReconcilingLoans(false);
    }
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      (s.metadata?.address || '').toLowerCase().includes(schoolSearch.toLowerCase())
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Feedback Banner */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Sub navigation bar */}
      <Card
        sx={{
          mb: 3,
          borderRadius: '16px',
          border: `1px solid ${dzfColors.surfaces.border}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Tabs
          value={subTab}
          onChange={(_, val) => setSubTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              py: 2,
              px: 3,
            },
          }}
        >
          <Tab label={`School Directory (${schools.length})`} />
          <Tab label={`Annual Events (${events.length})`} />
          <Tab label="1-Click Data Exports" />
          <Tab label="Broadcast Announcement Center" />
          <Tab label="Data Health & Synchronization" />
        </Tabs>
      </Card>

      {/* ======================================================== */}
      {/* SUB-TAB 0: SCHOOL DIRECTORY                              */}
      {/* ======================================================== */}
      {subTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                Ijero Ekiti School Directory & Affiliated Academies
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>
                Self-service management of participating primary, secondary, and private institutions without hardcoding.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search school or address..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                sx={{ width: { xs: 180, sm: 260 } }}
              />
              <DZFButton variant="secondary" size="small" onClick={fetchSchools} disabled={loadingSchools}>
                <RefreshIcon size={16} />
              </DZFButton>
              <DZFButton
                variant="primary"
                size="small"
                onClick={() => {
                  setEditingSchool(null);
                  setSchoolNameInput('');
                  setSchoolAddressInput('');
                  setSchoolModalOpen(true);
                }}
              >
                <PlusIcon size={16} /> Add School
              </DZFButton>
            </Box>
          </Box>

          {loadingSchools ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={36} sx={{ color: dzfColors.navy[900] }} />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '14px', border: `1px solid ${dzfColors.surfaces.border}`, boxShadow: 'none' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: dzfColors.surfaces.canvas }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: dzfColors.navy[900], py: 1.5 }}>School Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>Physical Address</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: dzfColors.navy[900], width: 120 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: dzfColors.navy[900], textAlign: 'right', width: 140 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: dzfColors.surfaces.textMuted }}>
                        No schools found matching your query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[950] }}>
                          {school.name}
                        </TableCell>
                        <TableCell sx={{ color: dzfColors.surfaces.textSecondary }}>
                          {school.metadata?.address || 'Ijero Ekiti, Ekiti State'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={school.active ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              backgroundColor: school.active ? '#dcfce7' : '#f1f5f9',
                              color: school.active ? '#15803d' : '#64748b',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingSchool(school);
                              setSchoolNameInput(school.name);
                              setSchoolAddressInput(school.metadata?.address || '');
                              setSchoolModalOpen(true);
                            }}
                            title="Edit school"
                            sx={{ color: dzfColors.navy[700] }}
                          >
                            <EditIcon size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleSchoolActive(school)}
                            title={school.active ? 'Deactivate school' : 'Activate school'}
                            sx={{ color: school.active ? '#15803d' : '#64748b' }}
                          >
                            <CheckCircleIcon size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSchool(school.id, school.name)}
                            title="Delete school"
                            sx={{ color: '#dc2626' }}
                          >
                            <TrashIcon size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Dialog: Add/Edit School */}
          <Dialog open={schoolModalOpen} onClose={() => setSchoolModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              {editingSchool ? 'Edit School Directory Entry' : 'Add New Institution to Directory'}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                <TextField
                  label="Official School Name"
                  fullWidth
                  required
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. Doherty Memorial Grammar School, Ijero Ekiti"
                />
                <TextField
                  label="Physical Location / Street Address"
                  fullWidth
                  value={schoolAddressInput}
                  onChange={(e) => setSchoolAddressInput(e.target.value)}
                  placeholder="e.g. Along Ikoro Road, Ijero Ekiti"
                  helperText="Address will automatically populate patron registration forms."
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <DZFButton variant="secondary" onClick={() => setSchoolModalOpen(false)}>
                Cancel
              </DZFButton>
              <DZFButton variant="primary" onClick={handleSaveSchool} disabled={savingSchool || !schoolNameInput.trim()}>
                {savingSchool ? 'Saving...' : editingSchool ? 'Save Changes' : 'Create School'}
              </DZFButton>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 1: FOUNDATION ANNUAL EVENTS                      */}
      {/* ======================================================== */}
      {subTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                Annual Foundation Calendar Presets & Milestone Scoring
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>
                Configure recurring annual academic initiatives, target cohort months, and default literacy award points.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <DZFButton variant="secondary" size="small" onClick={fetchEvents} disabled={loadingEvents}>
                <RefreshIcon size={16} />
              </DZFButton>
              <DZFButton
                variant="primary"
                size="small"
                onClick={() => {
                  setEditingEvent(null);
                  setEventNameInput('');
                  setEventMonthInput(new Date().getMonth() + 1);
                  setEventAudienceInput('all');
                  setEventPointsInput(5);
                  setEventDescInput('');
                  setEventModalOpen(true);
                }}
              >
                <PlusIcon size={16} /> Add Annual Event
              </DZFButton>
            </Box>
          </Box>

          <Grid container spacing={2.5}>
            {events.map((evt) => {
              const monthNames = [
                '',
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ];
              const mName = evt.metadata?.month ? monthNames[evt.metadata.month] : 'All Year';
              return (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={evt.id}>
                  <Card
                    sx={{
                      p: 2.5,
                      borderRadius: '16px',
                      border: `1px solid ${dzfColors.surfaces.border}`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <DZFBadge variant="info" label={mName} size="small" />
                        <Chip
                          label={evt.active ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.6875rem',
                            backgroundColor: evt.active ? '#dcfce7' : '#f1f5f9',
                            color: evt.active ? '#15803d' : '#64748b',
                          }}
                        />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 0.5 }}>
                        {evt.name}
                      </Typography>
                      {evt.metadata?.description && (
                        <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 1.5, fontSize: '0.8125rem' }}>
                          {evt.metadata.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          label={`Audience: ${evt.metadata?.targetAudience || 'All'}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.6875rem', fontWeight: 600 }}
                        />
                        <Chip
                          label={`+${evt.metadata?.defaultPoints ?? 5} pts awarded`}
                          size="small"
                          sx={{
                            backgroundColor: dzfColors.gold[100],
                            color: dzfColors.navy[950],
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2, pt: 1.5, borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingEvent(evt);
                          setEventNameInput(evt.name);
                          setEventMonthInput(evt.metadata?.month || 1);
                          setEventAudienceInput(evt.metadata?.targetAudience || 'all');
                          setEventPointsInput(evt.metadata?.defaultPoints ?? 5);
                          setEventDescInput(evt.metadata?.description || '');
                          setEventModalOpen(true);
                        }}
                        title="Edit Event"
                        sx={{ color: dzfColors.navy[700] }}
                      >
                        <EditIcon size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleEventActive(evt)}
                        title={evt.active ? 'Deactivate' : 'Activate'}
                        sx={{ color: evt.active ? '#15803d' : '#64748b' }}
                      >
                        <CheckCircleIcon size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEvent(evt.id, evt.name)}
                        title="Delete Event"
                        sx={{ color: '#dc2626' }}
                      >
                        <TrashIcon size={16} />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Dialog: Add/Edit Annual Event */}
          <Dialog open={eventModalOpen} onClose={() => setEventModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              {editingEvent ? 'Edit Foundation Calendar Event' : 'Create Annual Calendar Preset'}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                <TextField
                  label="Event Title"
                  fullWidth
                  required
                  value={eventNameInput}
                  onChange={(e) => setEventNameInput(e.target.value)}
                  placeholder="e.g. World Book Day & Storytelling Fest"
                />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Target Calendar Month</InputLabel>
                      <Select
                        value={eventMonthInput}
                        label="Target Calendar Month"
                        onChange={(e) => setEventMonthInput(Number(e.target.value))}
                      >
                        <MenuItem value={1}>January</MenuItem>
                        <MenuItem value={2}>February</MenuItem>
                        <MenuItem value={3}>March</MenuItem>
                        <MenuItem value={4}>April</MenuItem>
                        <MenuItem value={5}>May</MenuItem>
                        <MenuItem value={6}>June</MenuItem>
                        <MenuItem value={7}>July</MenuItem>
                        <MenuItem value={8}>August</MenuItem>
                        <MenuItem value={9}>September</MenuItem>
                        <MenuItem value={10}>October</MenuItem>
                        <MenuItem value={11}>November</MenuItem>
                        <MenuItem value={12}>December</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Default Activity Points"
                      type="number"
                      size="small"
                      fullWidth
                      value={eventPointsInput}
                      onChange={(e) => setEventPointsInput(Number(e.target.value))}
                    />
                  </Grid>
                </Grid>
                <TextField
                  label="Target Audience"
                  fullWidth
                  size="small"
                  value={eventAudienceInput}
                  onChange={(e) => setEventAudienceInput(e.target.value)}
                  placeholder="e.g. Primary, Secondary, Public, All"
                />
                <TextField
                  label="Description / Purpose"
                  fullWidth
                  multiline
                  rows={3}
                  value={eventDescInput}
                  onChange={(e) => setEventDescInput(e.target.value)}
                  placeholder="Brief summary of the foundation event and objectives..."
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <DZFButton variant="secondary" onClick={() => setEventModalOpen(false)}>
                Cancel
              </DZFButton>
              <DZFButton variant="primary" onClick={handleSaveEvent} disabled={savingEvent || !eventNameInput.trim()}>
                {savingEvent ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Preset'}
              </DZFButton>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: ONE-CLICK DATA BACKUPS & EXPORTS              */}
      {/* ======================================================== */}
      {subTab === 2 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              One-Click Institutional Data Backup & Export Studio
            </Typography>
            <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>
              Export sanitized, RFC 4180 compliant CSV tables and comprehensive database snapshot JSON archives on demand.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Card 1: Books */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${dzfColors.surfaces.border}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: dzfColors.maroon[100], color: dzfColors.maroon[900] }}>
                      <BookIcon size={22} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      Books & Monograph Catalog
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2 }}>
                    Comprehensive inventory including barcode numbers, authors, classifications, copy counts, shelf placements, and checkout states.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label="CSV"
                      size="small"
                      clickable
                      onClick={() => setExportFormats((prev) => ({ ...prev, books: 'csv' }))}
                      color={exportFormats.books === 'csv' ? 'primary' : 'default'}
                      variant={exportFormats.books === 'csv' ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="JSON"
                      size="small"
                      clickable
                      onClick={() => setExportFormats((prev) => ({ ...prev, books: 'json' }))}
                      color={exportFormats.books === 'json' ? 'primary' : 'default'}
                      variant={exportFormats.books === 'json' ? 'filled' : 'outlined'}
                    />
                  </Box>
                  <DZFButton
                    variant="primary"
                    size="small"
                    onClick={() => handleDownloadBackup('books')}
                    disabled={downloadingEntity === 'books'}
                  >
                    {downloadingEntity === 'books' ? 'Downloading...' : 'Export Books'}
                  </DZFButton>
                </Box>
              </Card>
            </Grid>

            {/* Card 2: Patrons */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${dzfColors.surfaces.border}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: dzfColors.navy[100], color: dzfColors.navy[900] }}>
                      <UsersIcon size={22} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      Registered Patrons & Students
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2 }}>
                    Student and community directory records including barcodes, names, patron categories, affiliated schools, parent contacts, and points.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label="CSV"
                      size="small"
                      clickable
                      onClick={() => setExportFormats((prev) => ({ ...prev, patrons: 'csv' }))}
                      color={exportFormats.patrons === 'csv' ? 'primary' : 'default'}
                      variant={exportFormats.patrons === 'csv' ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="JSON"
                      size="small"
                      clickable
                      onClick={() => setExportFormats((prev) => ({ ...prev, patrons: 'json' }))}
                      color={exportFormats.patrons === 'json' ? 'primary' : 'default'}
                      variant={exportFormats.patrons === 'json' ? 'filled' : 'outlined'}
                    />
                  </Box>
                  <DZFButton
                    variant="primary"
                    size="small"
                    onClick={() => handleDownloadBackup('patrons')}
                    disabled={downloadingEntity === 'patrons'}
                  >
                    {downloadingEntity === 'patrons' ? 'Downloading...' : 'Export Patrons'}
                  </DZFButton>
                </Box>
              </Card>
            </Grid>

            {/* Card 3: Attendance */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${dzfColors.surfaces.border}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: dzfColors.gold[100], color: dzfColors.navy[950] }}>
                      <BarcodeIcon size={22} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      Attendance Scans & Class Records
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2 }}>
                    Verified scanner logs with patron barcodes, session tracks (cohort, literacy fast-track, library), timestamps, and points credited.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label="CSV"
                      size="small"
                      clickable
                      onClick={() => setExportFormats((prev) => ({ ...prev, attendance: 'csv' }))}
                      color={exportFormats.attendance === 'csv' ? 'primary' : 'default'}
                      variant={exportFormats.attendance === 'csv' ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="JSON"
                      size="small"
                      clickable
                      onClick={() => setExportFormats((prev) => ({ ...prev, attendance: 'json' }))}
                      color={exportFormats.attendance === 'json' ? 'primary' : 'default'}
                      variant={exportFormats.attendance === 'json' ? 'filled' : 'outlined'}
                    />
                  </Box>
                  <DZFButton
                    variant="primary"
                    size="small"
                    onClick={() => handleDownloadBackup('attendance')}
                    disabled={downloadingEntity === 'attendance'}
                  >
                    {downloadingEntity === 'attendance' ? 'Downloading...' : 'Export Attendance'}
                  </DZFButton>
                </Box>
              </Card>
            </Grid>

            {/* Card 4: Circulation */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${dzfColors.surfaces.border}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: dzfColors.navy[100], color: dzfColors.navy[900] }}>
                      <ClockIcon size={22} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      Circulation & Loan History
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2 }}>
                    Complete borrowing transactions, issue timestamps, due dates, return statuses, renewals count, and associated reading competition links.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label="CSV"
                      size="small"
                      clickable
                      onClick={() => setExportFormats((prev) => ({ ...prev, circulation: 'csv' }))}
                      color={exportFormats.circulation === 'csv' ? 'primary' : 'default'}
                      variant={exportFormats.circulation === 'csv' ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="JSON"
                      size="small"
                      clickable
                      onClick={() => setExportFormats((prev) => ({ ...prev, circulation: 'json' }))}
                      color={exportFormats.circulation === 'json' ? 'primary' : 'default'}
                      variant={exportFormats.circulation === 'json' ? 'filled' : 'outlined'}
                    />
                  </Box>
                  <DZFButton
                    variant="primary"
                    size="small"
                    onClick={() => handleDownloadBackup('circulation')}
                    disabled={downloadingEntity === 'circulation'}
                  >
                    {downloadingEntity === 'circulation' ? 'Downloading...' : 'Export Loans'}
                  </DZFButton>
                </Box>
              </Card>
            </Grid>

            {/* Card 5: Full Snapshot Bundle */}
            <Grid size={{ xs: 12 }}>
              <Card
                sx={{
                  p: 3.5,
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${dzfColors.navy[950]} 0%, ${dzfColors.navy[700]} 100%)`,
                  color: '#ffffff',
                  border: `1px solid ${dzfColors.gold[400]}40`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <DZFBadge variant="warning" label="OFFICIAL REPOSITORY SNAPSHOT" size="small" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff' }}>
                        Full Multi-Collection JSON Snapshot Archive
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 800 }}>
                      Complete structured snapshot bundle packaging books, patrons, attendance logs, and circulation ledgers with export metadata and timestamps.
                    </Typography>
                  </Box>
                  <DZFButton
                    variant="primary"
                    size="large"
                    onClick={() => handleDownloadBackup('all')}
                    disabled={downloadingEntity === 'all'}
                  >
                    {downloadingEntity === 'all' ? 'Packaging Snapshot...' : 'Download Full JSON Archive'}
                  </DZFButton>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: BROADCAST ANNOUNCEMENT CENTER                 */}
      {/* ======================================================== */}
      {subTab === 3 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              System-Wide Broadcast Announcement & Push Alerts Center
            </Typography>
            <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>
              Publish persistent workspace announcement marquees and trigger instant audio chimes + HTML5 push alerts to connected staff sessions.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Form Column */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${dzfColors.surfaces.border}` }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 2 }}>
                  Announcement Composer
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Announcement Message"
                    multiline
                    rows={3}
                    fullWidth
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="e.g. Mandatory Library System Maintenance scheduled for Friday at 6:00 PM. Please close active loans."
                    helperText={`${broadcastMessage.length}/300 characters`}
                  />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Alert Severity</InputLabel>
                        <Select
                          value={broadcastSeverity}
                          label="Alert Severity"
                          onChange={(e) =>
                            setBroadcastSeverity(
                              e.target.value as 'info' | 'warning' | 'error' | 'success'
                            )
                          }
                        >
                          <MenuItem value="info">Info (Institutional Blue)</MenuItem>
                          <MenuItem value="warning">Warning (Amber Alert)</MenuItem>
                          <MenuItem value="error">Error / Urgent (Crimson)</MenuItem>
                          <MenuItem value="success">Success (Emerald Green)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Action Link (Optional)"
                        size="small"
                        fullWidth
                        value={broadcastLink}
                        onChange={(e) => setBroadcastLink(e.target.value)}
                        placeholder="e.g. /dashboard/calendar"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '10px', backgroundColor: dzfColors.surfaces.canvas }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                        Activate Announcement Banner
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                        Displays across the top of all authenticated staff views in AppShell
                      </Typography>
                    </Box>
                    <Switch
                      checked={broadcastIsActive}
                      onChange={(e) => setBroadcastIsActive(e.target.checked)}
                      color="primary"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '10px', backgroundColor: dzfColors.surfaces.canvas }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                        Send Urgent Desktop Push Chime (SSE)
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                        Dispatches instant synthesized audio chime and native desktop notification
                      </Typography>
                    </Box>
                    <Switch
                      checked={broadcastPush}
                      onChange={(e) => setBroadcastPush(e.target.checked)}
                      color="warning"
                    />
                  </Box>

                  <DZFButton
                    variant="primary"
                    size="large"
                    onClick={handleSaveBroadcast}
                    disabled={savingBroadcast || (broadcastIsActive && !broadcastMessage.trim())}
                  >
                    {savingBroadcast ? 'Saving Broadcast...' : 'Save & Publish Announcement'}
                  </DZFButton>
                </Box>
              </Card>
            </Grid>

            {/* Preview Column */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${dzfColors.surfaces.border}`, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1.5 }}>
                  Live Workspace Preview
                </Typography>
                <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2 }}>
                  How your announcement will appear to staff across the platform canvas:
                </Typography>

                {/* Banner Simulator */}
                <Box
                  sx={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor:
                        broadcastSeverity === 'error'
                          ? '#dc2626'
                          : broadcastSeverity === 'warning'
                            ? '#d97706'
                            : broadcastSeverity === 'success'
                              ? '#16a34a'
                              : dzfColors.navy[900],
                      color: '#ffffff',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Chip
                        label={broadcastSeverity.toUpperCase()}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          color: '#ffffff',
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                        {broadcastMessage || 'No announcement message entered.'}
                      </Typography>
                    </Box>
                    <Box component="span" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', cursor: 'default' }}>
                      &times;
                    </Box>
                  </Box>
                </Box>

                {/* Current Active Status */}
                <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: dzfColors.surfaces.canvas }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], display: 'block', mb: 0.5 }}>
                    CURRENT PERSISTED BANNER
                  </Typography>
                  {currentBroadcast && currentBroadcast.isActive ? (
                    <Box>
                      <Chip label="Active on Canvas" size="small" color="success" sx={{ mb: 1, fontWeight: 700 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[950] }}>
                        &ldquo;{currentBroadcast.message}&rdquo;
                      </Typography>
                      {currentBroadcast.updatedAt && (
                        <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block', mt: 0.5 }}>
                          Last updated: {new Date(currentBroadcast.updatedAt).toLocaleString()} by @{currentBroadcast.updatedBy}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>
                      No active announcement banner currently running.
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: DATA HEALTH RECALCULATION & RECONCILIATION     */}
      {/* ======================================================== */}
      {subTab === 4 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              Automated Data Health, Scoring Recalculation & Inventory Synchronization
            </Typography>
            <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>
              Audit cross-collection integrity, repair orphaned monograph checkouts, and re-compute monthly patron leaderboards.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Card A: Leaderboard Recalculation */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${dzfColors.surfaces.border}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: dzfColors.gold[100], color: dzfColors.navy[950] }}>
                      <TrophyIcon size={22} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      Monthly Patron Activity Leaderboard
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2.5 }}>
                    Recalculates total activity points across all verified attendance scans, book borrowing returns, and cohort milestones for the selected calendar month.
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Year"
                        type="number"
                        size="small"
                        fullWidth
                        value={recalcYear}
                        onChange={(e) => setRecalcYear(Number(e.target.value))}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Month</InputLabel>
                        <Select
                          value={recalcMonth}
                          label="Month"
                          onChange={(e) => setRecalcMonth(Number(e.target.value))}
                        >
                          <MenuItem value={1}>January</MenuItem>
                          <MenuItem value={2}>February</MenuItem>
                          <MenuItem value={3}>March</MenuItem>
                          <MenuItem value={4}>April</MenuItem>
                          <MenuItem value={5}>May</MenuItem>
                          <MenuItem value={6}>June</MenuItem>
                          <MenuItem value={7}>July</MenuItem>
                          <MenuItem value={8}>August</MenuItem>
                          <MenuItem value={9}>September</MenuItem>
                          <MenuItem value={10}>October</MenuItem>
                          <MenuItem value={11}>November</MenuItem>
                          <MenuItem value={12}>December</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {leaderboardResult && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
                      {leaderboardResult}
                    </Alert>
                  )}
                </Box>

                <DZFButton
                  variant="primary"
                  onClick={handleRecalculateLeaderboard}
                  disabled={recalculatingLeaderboard}
                >
                  {recalculatingLeaderboard ? 'Recalculating Scores...' : 'Recalculate Leaderboard Scores'}
                </DZFButton>
              </Card>
            </Grid>

            {/* Card B: Monograph Loan Reconciliation */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${dzfColors.surfaces.border}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: dzfColors.maroon[100], color: dzfColors.maroon[900] }}>
                      <BookIcon size={22} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      Monograph Loans & Inventory Synchronization
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2.5 }}>
                    Cross-references physical Cataloging monographs marked `isCheckedOut: true` against active loans in the Library ledger. Repairs orphaned availability states and updates overdue flags.
                  </Typography>

                  {reconcileResult && (
                    <Box sx={{ mb: 2, p: 2, borderRadius: '12px', backgroundColor: dzfColors.surfaces.canvas }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], display: 'block', mb: 1 }}>
                        LATEST RECONCILIATION RESULT
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>Monographs Audited:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>{reconcileResult.monographsAudited}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>Active Loans:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>{reconcileResult.activeLoansAudited}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>Discrepancies Repaired:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: reconcileResult.discrepanciesRepaired > 0 ? '#15803d' : dzfColors.navy[900] }}>
                            {reconcileResult.discrepanciesRepaired}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>Overdue Loans:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#dc2626' }}>{reconcileResult.overdueLoansCount}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>

                <DZFButton
                  variant="primary"
                  onClick={handleReconcileLoans}
                  disabled={reconcilingLoans}
                >
                  {reconcilingLoans ? 'Synchronizing Records...' : 'Audit & Reconcile Monograph Loans'}
                </DZFButton>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default AdminGovernanceStudio;
