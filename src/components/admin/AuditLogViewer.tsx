'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { DZFBadge, type DZFBadgeVariant } from '@/components/ui/DZFBadge';
import { ShieldIcon } from '@/components/ui/DZFIcons';
import type { IAuditLogItemDTO } from '@/lib/admin/types';

interface AuditLogViewerProps {
  initialLogs?: IAuditLogItemDTO[];
}

export default function AuditLogViewer({ initialLogs = [] }: AuditLogViewerProps) {
  const [logs, setLogs] = React.useState<IAuditLogItemDTO[]>(initialLogs);
  const [actionFilter, setActionFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState<IAuditLogItemDTO | null>(null);

  const fetchLogs = React.useCallback(async (targetPage: number, action: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', '15');
      if (action) params.set('action', action);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    if (initialLogs.length === 0) {
      fetch('/api/admin/audit-logs?page=1&limit=15')
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.success) {
            setLogs(data.logs || []);
            setTotalPages(data.totalPages || 1);
            setPage(data.page || 1);
          }
        })
        .catch((err) => console.error('Failed to load audit logs:', err));
    }
    return () => {
      isMounted = false;
    };
  }, [initialLogs.length]);

  const handleFilterChange = (newAction: string) => {
    setActionFilter(newAction);
    setPage(1);
    fetchLogs(1, newAction);
  };

  const getActionBadgeVariant = (action: string): DZFBadgeVariant => {
    if (action.includes('LOCK')) return 'error';
    if (action.includes('OVERRIDE')) return 'warning';
    if (action.includes('REQUISITION')) return 'primary';
    if (action.includes('TASK') || action.includes('EVENT')) return 'success';
    return 'default';
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(11, 29, 46, 0.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: `${dzfColors.navy[700]}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: dzfColors.navy[700],
            }}
          >
            <ShieldIcon size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              System Audit Ledger
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tamper-evident operational audit trail with actor timestamps
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={actionFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            sx={{ width: 220 }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value="">All System Actions</MenuItem>
            <MenuItem value="CIRCULATION_LOCK_TOGGLED">Circulation Locks</MenuItem>
            <MenuItem value="PATRON_OVERRIDE_GRANTED">Patron Overrides</MenuItem>
            <MenuItem value="REQUISITION_STATUS_UPDATED">Requisition Approvals</MenuItem>
            <MenuItem value="TASK_CREATED">Task Creation</MenuItem>
            <MenuItem value="EVENT_CREATED">Event Scheduling</MenuItem>
          </TextField>

          <DZFButton
            variant="secondary"
            size="small"
            onClick={() => fetchLogs(page, actionFilter)}
            disabled={loading}
          >
            Refresh
          </DZFButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : logs.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '12px' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No audit ledger records match the selected criteria.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>Actor</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>Target Entity</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DZFBadge
                        variant={getActionBadgeVariant(log.action)}
                        size="small"
                        label={log.action.replace(/_/g, ' ')}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8125rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {log.performedBy}
                        </Typography>
                        <Chip size="small" label={log.performedByRole} sx={{ height: 18, fontSize: '0.65rem' }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8125rem' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
                        {log.targetEntity}
                      </Typography>
                      {log.targetId && (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          ID: {log.targetId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8125rem', color: 'text.secondary', maxWidth: 220 }}>
                      <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                        {log.details ? JSON.stringify(log.details) : 'None'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => {
                  setPage(p);
                  fetchLogs(p, actionFilter);
                }}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
            Audit Log Inspection
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ID: {selectedLog?.id}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Action:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedLog.action}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Actor:</Typography>
                <Typography variant="body2">{selectedLog.performedBy} ({selectedLog.performedByRole})</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Target:</Typography>
                <Typography variant="body2">{selectedLog.targetEntity} {selectedLog.targetId ? `(ID: ${selectedLog.targetId})` : ''}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Timestamp:</Typography>
                <Typography variant="body2">{new Date(selectedLog.createdAt).toUTCString()}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Event Payload:</Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    bgcolor: '#0b1d2e',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(selectedLog.details, null, 2)}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <DZFButton variant="secondary" onClick={() => setSelectedLog(null)}>
            Close
          </DZFButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
