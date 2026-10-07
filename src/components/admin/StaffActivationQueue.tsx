'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { ALL_ROLES } from '@/lib/auth/rbac';

export interface IStaffUser {
  id: string;
  name: string;
  username: string;
  phone: string;
  role: string;
  active: boolean;
  birthMonth?: number;
  birthDay?: number;
  createdAt?: string;
  updatedAt?: string;
}

function formatStaffBirthday(month?: number, day?: number): string | null {
  if (!month || !day) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mStr = months[month - 1];
  if (!mStr) return null;
  return `${mStr} ${day}`;
}

interface StaffActivationQueueProps {
  currentUsername: string;
  canManage: boolean;
}

const ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  ima: { label: 'IMA (Executive)', bg: '#FDF2F8', text: '#9D174D' },
  country_manager: { label: 'Country Manager', bg: '#EFF6FF', text: '#1E40AF' },
  admin: { label: 'Administrator', bg: '#EEF2FF', text: '#3730A3' },
  asst_admin: { label: 'Assistant Admin', bg: '#F5F3FF', text: '#5B21B6' },
  ict: { label: 'ICT & Systems Lead', bg: '#ECFDF5', text: '#065F46' },
  librarian: { label: 'Librarian', bg: '#FFFBEB', text: '#92400E' },
  cohort_lead: { label: 'Cohort Academic Lead', bg: '#FEF3C7', text: '#78350F' },
  transcomm_author: { label: 'Transcomm Author', bg: '#F0FDF4', text: '#166534' },
  intern: { label: 'Intern / Volunteer', bg: '#F1F5F9', text: '#475569' },
  facility: { label: 'Facility Maintenance', bg: '#F3F4F6', text: '#374151' },
};

export default function StaffActivationQueue({ currentUsername, canManage }: StaffActivationQueueProps) {
  const [users, setUsers] = React.useState<IStaffUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [notification, setNotification] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dialog state for Role Modification / Activation
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [targetUser, setTargetUser] = React.useState<IStaffUser | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('librarian');
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('[FETCH_USERS_ERROR]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const pendingUsers = React.useMemo(() => users.filter((u) => !u.active), [users]);
  const activeUsers = React.useMemo(() => users.filter((u) => u.active), [users]);

  // Activate handler
  const handleActivate = async (user: IStaffUser, overrideRole?: string) => {
    try {
      setProcessingId(user.id);
      setNotification(null);

      const res = await fetch(`/api/admin/users/${user.id}/activate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: overrideRole || user.role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to activate staff account');
      }

      setNotification({
        type: 'success',
        text: `Staff account @${user.username} (${user.name}) has been activated successfully!`,
      });
      fetchUsers();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'Activation failed',
      });
    } finally {
      setProcessingId(null);
      setRoleDialogOpen(false);
      setTargetUser(null);
    }
  };

  // Deactivate handler
  const handleDeactivate = async (user: IStaffUser) => {
    if (!confirm(`Are you sure you want to deactivate @${user.username}? They will no longer be able to sign in.`)) {
      return;
    }

    try {
      setProcessingId(user.id);
      setNotification(null);

      const res = await fetch(`/api/admin/users/${user.id}/deactivate`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to deactivate account');
      }

      setNotification({ type: 'success', text: `Staff account @${user.username} has been deactivated.` });
      fetchUsers();
    } catch (err) {
      setNotification({ type: 'error', text: err instanceof Error ? err.message : 'Deactivation failed' });
    } finally {
      setProcessingId(null);
    }
  };

  // Delete / Reject handler
  const handleDelete = async (user: IStaffUser) => {
    const isPending = !user.active;
    const promptMsg = isPending
      ? `Reject and permanently remove registration application from ${user.name} (@${user.username})?`
      : `Permanently delete staff account @${user.username} (${user.name})? This action cannot be undone.`;

    if (!confirm(promptMsg)) return;

    try {
      setProcessingId(user.id);
      setNotification(null);

      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete account');
      }

      setNotification({
        type: 'success',
        text: isPending
          ? `Registration application from @${user.username} rejected and removed.`
          : `Staff account @${user.username} deleted successfully.`,
      });
      fetchUsers();
    } catch (err) {
      setNotification({ type: 'error', text: err instanceof Error ? err.message : 'Deletion failed' });
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered users for directory table
  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.phone.includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && !u.active) ||
        (statusFilter === 'active' && u.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const openRoleDialog = (user: IStaffUser) => {
    setTargetUser(user);
    setSelectedRole(user.role);
    setRoleDialogOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Banner & Summary Metric Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
        <Card
          sx={{
            p: 2.5,
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            ⏳
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: dzfColors.navy[900], lineHeight: 1.1 }}>
              {pendingUsers.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Pending Staff Activations
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2.5,
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            🛡️
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: dzfColors.navy[900], lineHeight: 1.1 }}>
              {activeUsers.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Active Operational Staff
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2.5,
            borderRadius: '16px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: dzfColors.navy[50],
              color: dzfColors.navy[700],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            👥
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: dzfColors.navy[900], lineHeight: 1.1 }}>
              {users.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Total Registered Records
            </Typography>
          </Box>
        </Card>
      </Box>

      {/* Notification Toast */}
      {notification && (
        <Alert severity={notification.type} onClose={() => setNotification(null)} sx={{ borderRadius: '12px' }}>
          {notification.text}
        </Alert>
      )}

      {/* SECTION 1: PENDING ACTIVATION QUEUE */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              Staff Account Activation Queue
            </Typography>
            {pendingUsers.length > 0 && (
              <Chip
                size="small"
                label={`${pendingUsers.length} Awaiting Activation`}
                sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 800 }}
              />
            )}
          </Box>
          <DZFButton variant="secondary" size="small" onClick={fetchUsers} disabled={loading}>
            🔄 Refresh Queue
          </DZFButton>
        </Box>

        {pendingUsers.length === 0 ? (
          <Card
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: '16px',
              border: '1px dashed #CBD5E1',
              bgcolor: '#F8FAFC',
            }}
          >
            <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>✅</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              All Staff Registrations are Active
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 460, mx: 'auto', mt: 0.5 }}>
              There are no pending staff accounts in the verification queue. When new staff members self-register via
              the registration portal, their applications will appear here for review.
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {pendingUsers.map((pending) => {
              const roleMeta = ROLE_LABELS[pending.role] || { label: pending.role, bg: '#F1F5F9', text: '#475569' };
              const isProcessing = processingId === pending.id;

              return (
                <Card
                  key={pending.id}
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    border: '1px solid #FCD34D',
                    bgcolor: '#FFFDF5',
                    boxShadow: '0 4px 10px rgba(245, 158, 11, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: dzfColors.navy[900],
                        color: dzfColors.gold[400],
                        fontWeight: 800,
                      }}
                    >
                      {pending.name.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                          {pending.name}
                        </Typography>
                        <Chip
                          size="small"
                          label="PENDING"
                          sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                        />
                      </Box>

                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        @{pending.username} &bull; 📞 {pending.phone}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Requested Role:
                        </Typography>
                        <Chip
                          size="small"
                          label={roleMeta.label}
                          sx={{
                            bgcolor: roleMeta.bg,
                            color: roleMeta.text,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 22,
                          }}
                        />
                        {formatStaffBirthday(pending.birthMonth, pending.birthDay) && (
                          <Chip
                            size="small"
                            label={`🎂 ${formatStaffBirthday(pending.birthMonth, pending.birthDay)}`}
                            sx={{
                              bgcolor: '#FEF3C7',
                              color: '#92400E',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              height: 22,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Activation Action Buttons */}
                  <Box
                    sx={{
                      pt: 1.5,
                      borderTop: '1px solid #FEF3C7',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <DZFButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleDelete(pending)}
                      disabled={isProcessing || !canManage}
                      sx={{ color: '#DC2626', borderColor: '#FCA5A5', '&:hover': { bgcolor: '#FEE2E2' } }}
                    >
                      🗑️ Reject & Remove
                    </DZFButton>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <DZFButton
                        variant="secondary"
                        size="small"
                        onClick={() => openRoleDialog(pending)}
                        disabled={isProcessing || !canManage}
                      >
                        ✏️ Adjust Role
                      </DZFButton>

                      <DZFButton
                        variant="primary"
                        size="small"
                        onClick={() => handleActivate(pending)}
                        disabled={isProcessing || !canManage}
                        sx={{
                          background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
                          fontWeight: 800,
                        }}
                      >
                        {isProcessing ? (
                          <>
                            <CircularProgress size={14} sx={{ color: '#FFFFFF', mr: 1 }} />
                            Activating...
                          </>
                        ) : (
                          '✅ Activate Account'
                        )}
                      </DZFButton>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* SECTION 2: ACTIVE STAFF DIRECTORY TABLE */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              Operational Staff Directory
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Manage active credentials, assigned operational roles, and governance permissions
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search by name, username, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 240, bgcolor: '#FFFFFF' }}
            />

            <TextField
              select
              size="small"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ width: 160, bgcolor: '#FFFFFF' }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              {ALL_ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {ROLE_LABELS[r]?.label || r}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ width: 140, bgcolor: '#FFFFFF' }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="pending">Pending Only</MenuItem>
            </TextField>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 800 }}>Staff Member</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Contact Phone</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Assigned Role</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Birthday</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Account Status</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: dzfColors.navy[900] }} />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No staff members match the current filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || { label: u.role, bg: '#F1F5F9', text: '#475569' };
                  const isCurrent = u.username === currentUsername.toLowerCase();
                  const isBusy = processingId === u.id;

                  return (
                    <TableRow key={u.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      {/* Name & Avatar */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: '0.85rem',
                              bgcolor: u.active ? dzfColors.navy[700] : '#94A3B8',
                              color: '#FFFFFF',
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                              {u.name} {isCurrent && '(You)'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Username */}
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                          @{u.username}
                        </Typography>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                          {u.phone}
                        </Typography>
                      </TableCell>

                      {/* Role Badge */}
                      <TableCell>
                        <Chip
                          size="small"
                          label={roleMeta.label}
                          sx={{
                            bgcolor: roleMeta.bg,
                            color: roleMeta.text,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 22,
                          }}
                        />
                      </TableCell>

                      {/* Birthday */}
                      <TableCell>
                        {formatStaffBirthday(u.birthMonth, u.birthDay) ? (
                          <Chip
                            size="small"
                            label={`🎂 ${formatStaffBirthday(u.birthMonth, u.birthDay)}`}
                            sx={{
                              bgcolor: '#FEF3C7',
                              color: '#92400E',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              height: 22,
                            }}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={u.active ? 'ACTIVE' : 'INACTIVE'}
                          sx={{
                            bgcolor: u.active ? '#ECFDF5' : '#F1F5F9',
                            color: u.active ? '#059669' : '#64748B',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            height: 20,
                          }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {/* Role Change */}
                          <Tooltip title="Modify Assigned Role">
                            <IconButton
                              size="small"
                              onClick={() => openRoleDialog(u)}
                              disabled={isBusy || !canManage}
                              sx={{ color: '#64748B' }}
                            >
                              ✏️
                            </IconButton>
                          </Tooltip>

                          {/* Toggle Active Status */}
                          {u.active ? (
                            <Tooltip title={isCurrent ? 'Cannot deactivate yourself' : 'Deactivate Account'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeactivate(u)}
                                  disabled={isBusy || isCurrent || !canManage}
                                  sx={{ color: '#D97706' }}
                                >
                                  ⏸️
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Activate Account">
                              <IconButton
                                size="small"
                                onClick={() => handleActivate(u)}
                                disabled={isBusy || !canManage}
                                sx={{ color: '#059669' }}
                              >
                                ▶️
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Delete Account */}
                          <Tooltip title={isCurrent ? 'Cannot delete yourself' : 'Delete Account'}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(u)}
                                disabled={isBusy || isCurrent || !canManage}
                                sx={{ color: '#EF4444' }}
                              >
                                🗑️
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Role Adjustment / Activation Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
            {targetUser?.active ? 'Modify Staff Role' : 'Activate & Assign Role'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {targetUser ? `Adjusting operational role for ${targetUser.name} (@${targetUser.username})` : ''}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Assigned Operational Role"
            fullWidth
            size="small"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {ALL_ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]?.label || r}
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Role permissions dictate which navigation sections and administrative actions this staff member can access
            within the DZF-ILAS workspace.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 2 }}>
          <DZFButton variant="secondary" onClick={() => setRoleDialogOpen(false)} disabled={Boolean(processingId)}>
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            onClick={() => {
              if (targetUser) {
                if (!targetUser.active) {
                  handleActivate(targetUser, selectedRole);
                } else {
                  // Direct role update
                  fetch(`/api/admin/users/${targetUser.id}/role`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: selectedRole }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.success) {
                        setNotification({ type: 'success', text: `Role updated to ${selectedRole.toUpperCase()}.` });
                        fetchUsers();
                      } else {
                        throw new Error(data.error);
                      }
                    })
                    .catch((err) => {
                      setNotification({ type: 'error', text: err.message || 'Failed to update role' });
                    })
                    .finally(() => {
                      setRoleDialogOpen(false);
                      setTargetUser(null);
                    });
                }
              }
            }}
            disabled={Boolean(processingId)}
            sx={{
              background: `linear-gradient(135deg, ${dzfColors.navy[900]}, ${dzfColors.maroon[800]})`,
            }}
          >
            {targetUser?.active ? 'Save Role Changes' : 'Confirm & Activate Account'}
          </DZFButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
