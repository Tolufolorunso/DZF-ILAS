'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import { dzfColors } from '@/theme/colors';
import { AppShell } from '@/components/layout/AppShell';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import DZFStatCard from '@/components/ui/DZFStatCard';
import {
  ShieldIcon,
  AlertTriangleIcon,
  CheckIcon,
  UsersIcon,
  BookIcon,
  ClockIcon,
  BarcodeIcon,
  TrophyIcon,
  TrashIcon,
} from '@/components/ui/DZFIcons';
import type { ITokenPayload } from '@/lib/auth/jwt';
import type {
  ISystemStats,
  ISystemSettingsDTO,
  IRequisitionItemDTO,
  ITaskItemDTO,
  IEventItemDTO,
  IAuditLogItemDTO,
} from '@/lib/admin/types';
import {
  EmergencyLockDialog,
  PatronOverrideCard,
  RequisitionReviewDialog,
  TaskFormDialog,
  TaskKanbanBoard,
  TaskEditDialog,
  EventFormDialog,
  AuditLogViewer,
  OperationalCalendar,
  StaffActivationQueue,
} from '@/components/admin';
import type { KanbanStatus } from '@/components/admin/TaskKanbanBoard';
import type { TaskUpdatePayload } from '@/components/admin/TaskEditDialog';


interface AdminControlCenterClientProps {
  user: ITokenPayload;
  initialSettings: ISystemSettingsDTO;
  initialStats: ISystemStats;
  initialRequisitions: IRequisitionItemDTO[];
  initialTasks: ITaskItemDTO[];
  initialEvents: IEventItemDTO[];
  initialAuditLogs: IAuditLogItemDTO[];
}

export default function AdminControlCenterClient({
  user,
  initialSettings,
  initialStats,
  initialRequisitions,
  initialTasks,
  initialEvents,
  initialAuditLogs,
}: AdminControlCenterClientProps) {
  const router = useRouter();
  const [tabIndex, setTabIndex] = React.useState(0);

  // Live state
  const [settings, setSettings] = React.useState<ISystemSettingsDTO>(initialSettings);
  const [stats] = React.useState<ISystemStats>(initialStats);
  const [requisitions, setRequisitions] = React.useState<IRequisitionItemDTO[]>(initialRequisitions);
  const [reqStatusFilter, setReqStatusFilter] = React.useState<string>('all');
  const [tasks, setTasks] = React.useState<ITaskItemDTO[]>(initialTasks);
  const [events, setEvents] = React.useState<IEventItemDTO[]>(initialEvents);

  // Modals state
  const [lockDialogOpen, setLockDialogOpen] = React.useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [selectedEditTask, setSelectedEditTask] = React.useState<ITaskItemDTO | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = React.useState(false);
  const [selectedRequisition, setSelectedRequisition] = React.useState<IRequisitionItemDTO | null>(null);

  // Feedback banner
  const [notification, setNotification] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/auth/login');
      router.refresh();
    }
  };

  const refreshTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks');
      const data = await res.json();
      if (data.success && data.tasks) {
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error('Failed to reload tasks:', e);
    }
  };

  // Lock toggle handler
  const handleToggleLock = async (lock: boolean, reason: string) => {
    const res = await fetch('/api/admin/overrides/circulation-lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lock, reason }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to toggle circulation lock');
    }
    setSettings(data.settings);
    setNotification({
      type: 'success',
      message: data.message,
    });
  };

  // Requisition update handler
  const handleUpdateRequisition = async (
    id: string,
    status: 'approved' | 'rejected' | 'done',
    comment?: string,
    price?: number
  ) => {
    const res = await fetch(`/api/admin/requisitions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment, price }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update requisition');
    }

    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data.requisition } : r))
    );
    setNotification({
      type: 'success',
      message: data.message,
    });
  };

  // Task creation handler
  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    assignedToUsername: string;
    assignedToName: string;
  }) => {
    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create task');
    }

    await refreshTasks();
    setNotification({
      type: 'success',
      message: 'Operational task created and assigned.',
    });
  };

  // Task status transition handler (drag-and-drop or menu move)
  const handleUpdateTaskStatus = async (id: string, newStatus: KanbanStatus) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update task status');
      }
    } catch (err) {
      await refreshTasks();
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Task update failed',
      });
    }
  };

  // Task full details update handler
  const handleSaveEditedTask = async (taskId: string, payload: TaskUpdatePayload) => {
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update task');
    }

    if (data.task) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    } else {
      await refreshTasks();
    }
    setNotification({
      type: 'success',
      message: 'Task details updated successfully.',
    });
  };

  // Task delete handler
  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete task');
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Task deletion failed',
      });
    }
  };


  // Event creation handler
  const handleCreateEvent = async (eventData: {
    eventName: string;
    title?: string;
    eventDate: string;
    location?: string;
    targetAudience?: string;
    arrivalTime?: string;
    description?: string;
  }) => {
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to schedule event');
    }

    setEvents((prev) => [data.event, ...prev]);
    setNotification({
      type: 'success',
      message: 'Foundation event scheduled successfully.',
    });
  };

  // Event delete handler
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to remove this event?')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete event');
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Event deletion failed',
      });
    }
  };

  const filteredRequisitions = requisitions.filter((r) =>
    reqStatusFilter === 'all' ? true : r.status === reqStatusFilter
  );

  return (
    <AppShell
      activeNavId="admin"
      staffName={user.name || user.username}
      staffRole={user.role.toUpperCase()}
      onLogout={handleLogout}
    >
      <Box sx={{ maxWidth: 1300, mx: 'auto', pb: 8 }}>
        {/* Header Executive Banner */}
        <Card
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 3,
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${dzfColors.navy[950]} 0%, ${dzfColors.navy[700]} 60%, ${dzfColors.maroon[900]} 100%)`,
            color: '#ffffff',
            border: `1px solid ${dzfColors.gold[400]}40`,
            boxShadow: '0 16px 36px rgba(11, 29, 46, 0.25)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <DZFBadge variant="warning" size="small" label="SUPER ADMIN CONSOLE" />
                <DZFBadge
                  variant={settings.emergencyCirculationLock ? 'error' : 'success'}
                  size="small"
                  label={settings.emergencyCirculationLock ? 'CIRCULATION LOCKED' : 'NORMAL CIRCULATION'}
                />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  mb: 1,
                  fontSize: { xs: '1.6rem', sm: '2.1rem' },
                }}
              >
                Admin Control Center & Governance
              </Typography>

              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 720 }}>
                Central institutional authority for emergency circulation overrides, procurement review, operational
                task delegation, and system-wide audit integrity.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <DZFButton
                variant={settings.emergencyCirculationLock ? 'danger' : 'secondary'}
                onClick={() => setLockDialogOpen(true)}
              >
                {settings.emergencyCirculationLock ? 'Manage Active Lock' : 'Emergency Lock'}
              </DZFButton>
              <DZFButton variant="primary" onClick={() => setTaskDialogOpen(true)}>
                Assign Task
              </DZFButton>
            </Box>
          </Box>
        </Card>

        {/* Global Lock Alert Notice when locked */}
        {settings.emergencyCirculationLock && (
          <Alert
            severity="error"
            icon={<AlertTriangleIcon size={22} />}
            sx={{ mb: 3, borderRadius: '12px', fontWeight: 600 }}
            action={
              <DZFButton size="small" variant="danger" onClick={() => setLockDialogOpen(true)}>
                Modify Lock
              </DZFButton>
            }
          >
            Emergency Circulation Lock is ACTIVE: &quot;{settings.circulationLockReason || 'All book loans paused'}&quot;
            (Locked by {settings.lockedBy || 'Admin'}).
          </Alert>
        )}

        {/* Action feedback alert */}
        {notification && (
          <Alert
            severity={notification.type}
            onClose={() => setNotification(null)}
            sx={{ mb: 3, borderRadius: '12px' }}
          >
            {notification.message}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '0.875rem',
                textTransform: 'none',
                minHeight: 48,
              },
            }}
          >
            <Tab label="System Analytics & Health" />
            <Tab label="Circulation Locks & Overrides" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Staff Requisitions</span>
                  {stats.pendingRequisitions > 0 && (
                    <Chip size="small" label={stats.pendingRequisitions} color="error" sx={{ height: 20 }} />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Operational Tasks</span>
                  {stats.openTasks > 0 && (
                    <Chip size="small" label={stats.openTasks} color="primary" sx={{ height: 20 }} />
                  )}
                </Box>
              }
            />
            <Tab label="Foundation Calendar Events" />
            <Tab label="System Audit Ledger" />
            <Tab label="Staff Accounts & Activation" />
          </Tabs>
        </Box>

        {/* TAB 0: System Analytics & Health */}
        {tabIndex === 0 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 2 }}>
              Institutional Database KPI Metrics
            </Typography>

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DZFStatCard
                  title="Catalog Monographs"
                  value={stats.books.toLocaleString()}
                  subtitle="Active catalog items"
                  icon={<BookIcon size={24} />}
                  accentColor="maroon"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DZFStatCard
                  title="Registered Patrons"
                  value={stats.patrons.toLocaleString()}
                  subtitle="Verified library patrons"
                  icon={<UsersIcon size={24} />}
                  accentColor="navy"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DZFStatCard
                  title="Active Book Loans"
                  value={stats.activeLoans.toLocaleString()}
                  subtitle={`${stats.overdueLoans} overdue loans`}
                  icon={<ClockIcon size={24} />}
                  accentColor="gold"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DZFStatCard
                  title="Attendance Scans"
                  value={stats.attendanceCount.toLocaleString()}
                  subtitle="Total barcode entries"
                  icon={<BarcodeIcon size={24} />}
                  accentColor="maroon"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DZFStatCard
                  title="Digital Academies"
                  value={stats.cohortsCount.toLocaleString()}
                  subtitle="Enrolled student batches"
                  icon={<UsersIcon size={24} />}
                  accentColor="navy"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DZFStatCard
                  title="DRNICER Articles"
                  value={stats.articlesCount.toLocaleString()}
                  subtitle="Published monographs"
                  icon={<BookIcon size={24} />}
                  accentColor="gold"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DZFStatCard
                  title="Pending Requisitions"
                  value={stats.pendingRequisitions.toLocaleString()}
                  subtitle="Awaiting admin approval"
                  icon={<ShieldIcon size={24} />}
                  accentColor="maroon"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DZFStatCard
                  title="Operational Tasks"
                  value={stats.openTasks.toLocaleString()}
                  subtitle="In-progress staff tasks"
                  icon={<TrophyIcon size={24} />}
                  accentColor="navy"
                />
              </Grid>
            </Grid>

            {/* Public Statistics Feed Link Card */}
            <Card
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                bgcolor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Public Statistics REST API
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Public endpoint consumed by the institutional welcome screen (`/`) and companion Android mobile apps:
                </Typography>
                <Typography
                  variant="caption"
                  component="code"
                  sx={{
                    display: 'inline-block',
                    mt: 0.5,
                    p: '2px 8px',
                    borderRadius: '4px',
                    bgcolor: '#0b1d2e',
                    color: '#f8fafc',
                  }}
                >
                  GET /api/public/stats
                </Typography>
              </Box>
              <Box
                component="a"
                href="/api/public/stats"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                <DZFButton variant="secondary" size="small">
                  Inspect JSON Response
                </DZFButton>
              </Box>
            </Card>
          </Box>
        )}

        {/* TAB 1: Circulation Locks & Overrides */}
        {tabIndex === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Global Lock Card */}
            <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                    Global Emergency Circulation Lock
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Locks all loan checkouts system-wide during inventory stocktakes, audits, or emergencies.
                  </Typography>
                </Box>
                <DZFBadge
                  variant={settings.emergencyCirculationLock ? 'error' : 'success'}
                  label={settings.emergencyCirculationLock ? 'LOCKED' : 'NORMAL CIRCULATION'}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <DZFButton
                  variant={settings.emergencyCirculationLock ? 'danger' : 'primary'}
                  onClick={() => setLockDialogOpen(true)}
                >
                  {settings.emergencyCirculationLock ? 'Deactivate Lock' : 'Activate Emergency Lock'}
                </DZFButton>
                {settings.emergencyCirculationLock && (
                  <Typography variant="caption" sx={{ color: dzfColors.maroon[700] }}>
                    Reason: {settings.circulationLockReason} (Active since {settings.lockedAt ? new Date(settings.lockedAt).toLocaleDateString() : 'N/A'})
                  </Typography>
                )}
              </Box>
            </Card>

            {/* Patron Override Card */}
            <PatronOverrideCard />
          </Box>
        )}

        {/* TAB 2: Staff Requisitions Queue */}
        {tabIndex === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Staff Procurement Requisitions
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Review staff supply and asset requests with budget notes
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <DZFButton
                    key={st}
                    size="small"
                    variant={reqStatusFilter === st ? 'primary' : 'secondary'}
                    onClick={() => setReqStatusFilter(st)}
                  >
                    {st.toUpperCase()}
                  </DZFButton>
                ))}
              </Box>
            </Box>

            {filteredRequisitions.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: '#f8fafc' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No requisitions match status filter &quot;{reqStatusFilter}&quot;.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredRequisitions.map((req) => (
                  <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                    <Card
                      sx={{
                        p: 2.5,
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                            {req.item}
                          </Typography>
                          <DZFBadge
                            variant={
                              req.status === 'approved'
                                ? 'success'
                                : req.status === 'rejected'
                                ? 'error'
                                : 'warning'
                            }
                            size="small"
                            label={req.status.toUpperCase()}
                          />
                        </Box>

                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                          {req.rationale}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Quantity: {req.quantity}
                          </Typography>
                          {req.price && (
                            <Typography variant="caption" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
                              Approved: ₦{req.price.toLocaleString()}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            By: {req.createdBy} • {new Date(req.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ pt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                        <DZFButton
                          size="small"
                          variant="secondary"
                          onClick={() => setSelectedRequisition(req)}
                        >
                          Review & Action
                        </DZFButton>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}        {/* TAB 3: Operational Tasks Board */}
        {tabIndex === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Operational Staff Tasks Kanban
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Drag and drop tasks between lanes to track institutional workflow and maintenance
                </Typography>
              </Box>
              <DZFButton variant="primary" size="small" onClick={() => setTaskDialogOpen(true)}>
                + Assign New Task
              </DZFButton>
            </Box>

            <TaskKanbanBoard
              tasks={tasks}
              onUpdateStatus={handleUpdateTaskStatus}
              onEditTask={(task) => setSelectedEditTask(task)}
              onDeleteTask={handleDeleteTask}
              canManage={user.role === 'admin' || user.role === 'ima' || user.role === 'country_manager'}
              currentUsername={user.username}
            />
          </Box>
        )}

        {/* TAB 4: Foundation Calendar Events */}
        {tabIndex === 4 && (
          <Box>
            <OperationalCalendar
              initialEvents={events}
              onRefreshParent={async () => {
                const res = await fetch('/api/admin/events?limit=200');
                const data = await res.json();
                if (data.success) setEvents(data.events || []);
              }}
            />
          </Box>
        )}

        {/* TAB 5: System Audit Ledger */}
        {tabIndex === 5 && (
          <Box>
            <AuditLogViewer initialLogs={initialAuditLogs} />
          </Box>
        )}

        {/* TAB 6: Staff Accounts & Activation */}
        {tabIndex === 6 && (
          <Box>
            <StaffActivationQueue
              currentUsername={user.username}
              canManage={user.role === 'admin' || user.role === 'ima' || user.role === 'country_manager'}
            />
          </Box>
        )}

        {/* Modals */}
        <EmergencyLockDialog
          open={lockDialogOpen}
          currentLock={settings.emergencyCirculationLock}
          currentReason={settings.circulationLockReason}
          onClose={() => setLockDialogOpen(false)}
          onConfirm={handleToggleLock}
        />

        <RequisitionReviewDialog
          open={Boolean(selectedRequisition)}
          requisition={selectedRequisition}
          onClose={() => setSelectedRequisition(null)}
          onUpdateStatus={handleUpdateRequisition}
        />

        <TaskFormDialog
          open={taskDialogOpen}
          onClose={() => setTaskDialogOpen(false)}
          onSubmit={handleCreateTask}
        />

        <TaskEditDialog
          open={Boolean(selectedEditTask)}
          task={selectedEditTask}
          onClose={() => setSelectedEditTask(null)}
          onSubmit={handleSaveEditedTask}
        />

        <EventFormDialog
          open={eventDialogOpen}
          onClose={() => setEventDialogOpen(false)}
          onSubmit={handleCreateEvent}
        />
      </Box>
    </AppShell>
  );
}
