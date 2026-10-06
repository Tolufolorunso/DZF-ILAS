'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Link from 'next/link';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFInput,
  DZFBadge,
  DZFSearchInput,
  PageHeader,
  Mono,
  PrinterIcon,
  IdCardIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
} from '@/components';
import { DZFDataTable, Column } from '@/components/ui/DZFDataTable';
import { ITokenPayload } from '@/lib/auth/jwt';
import { IPatron } from '@/models/Patron';
import ThermalPrintDialog from '@/components/patrons/ThermalPrintDialog';
import PatronDetailModal from '@/components/patrons/PatronDetailModal';
import PatronEditModal from '@/components/patrons/PatronEditModal';
import { ThermalLabelData } from '@/components/patrons/ThermalBarcodeLabel';
import { canUpdatePatron, canDeletePatron } from '@/lib/auth/rbac';

interface PatronListClientProps {
  initialPatrons: IPatron[];
  initialTotal: number;
  user?: ITokenPayload | null;
}

export default function PatronListClient({
  initialPatrons,
  initialTotal,
  user,
}: PatronListClientProps) {
  const [patrons, setPatrons] = React.useState<IPatron[]>(initialPatrons);
  const [totalCount, setTotalCount] = React.useState<number>(initialTotal);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');
  const [patronTypeFilter, setPatronTypeFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState<number>(0);
  const [pageSize, setPageSize] = React.useState<number>(10);

  // Sorting State (default: barcode ascending)
  const [sortColumn, setSortColumn] = React.useState<string>('barcode');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // Selection for Batch Thermal Label Printing and Bulk Actions
  const [selectedPatronIds, setSelectedPatronIds] = React.useState<Set<string>>(new Set());

  // Modal Dialogs
  const [detailPatron, setDetailPatron] = React.useState<IPatron | null>(null);
  const [printLabels, setPrintLabels] = React.useState<ThermalLabelData[] | null>(null);

  // RBAC Privileges
  const canEdit = user ? canUpdatePatron(user.role) : false;
  const canDelete = user ? canDeletePatron(user.role) : false;

  // Edit & Delete Modal States
  const [editPatron, setEditPatron] = React.useState<IPatron | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<IPatron | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState<string>('');

  // Bulk Delete Modal States (Admin Only)
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState<boolean>(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = React.useState<string>('');
  const [bulkDeleting, setBulkDeleting] = React.useState<boolean>(false);
  const [bulkDeleteError, setBulkDeleteError] = React.useState<string | null>(null);

  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  const handlePatronUpdated = (updated: IPatron) => {
    setPatrons((prev) =>
      prev.map((p) => (String(p._id) === String(updated._id) ? updated : p))
    );
    setFeedbackMessage(`Patron ${updated.firstname} ${updated.surname} updated successfully.`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleteConfirmText.trim() !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/patrons/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete patron.');
      }
      setPatrons((prev) => prev.filter((p) => String(p._id) !== String(deleteTarget._id)));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setFeedbackMessage(`Patron ${deleteTarget.firstname} ${deleteTarget.surname} removed successfully.`);
      setDeleteTarget(null);
      setDeleteConfirmText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting patron';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPatronIds.size === 0 || bulkDeleteConfirmText.trim() !== 'DELETE') return;
    setBulkDeleting(true);
    setBulkDeleteError(null);
    try {
      const res = await fetch('/api/patrons/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patronIds: Array.from(selectedPatronIds) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete selected patrons.');
      }
      const count = data.deletedCount || selectedPatronIds.size;
      setPatrons((prev) => prev.filter((p) => !selectedPatronIds.has(String(p._id))));
      setTotalCount((prev) => Math.max(0, prev - count));
      setSelectedPatronIds(new Set());
      setFeedbackMessage(`Successfully deleted ${count} patron record${count > 1 ? 's' : ''}.`);
      setBulkDeleteOpen(false);
      setBulkDeleteConfirmText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error in bulk deletion';
      setBulkDeleteError(msg);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
    setPage(0);
    setLoading(true);
  };

  // Avoid synchronous setState inside initial effect
  const isFirstMount = React.useRef(true);

  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    let active = true;

    async function loadData() {
      try {
        const params = new URLSearchParams();
        params.set('page', String(page + 1));
        params.set('limit', String(pageSize));
        if (search.trim()) params.set('search', search.trim());
        if (patronTypeFilter !== 'all') params.set('patronType', patronTypeFilter);
        params.set('sortBy', sortColumn);
        params.set('sortOrder', sortDirection);

        const res = await fetch(`/api/patrons?${params.toString()}`);
        const data = await res.json();

        if (active && data.success) {
          setPatrons(data.patrons);
          setTotalCount(data.pagination.total);
        }
      } catch (err) {
        console.error('Failed to fetch patrons:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [page, pageSize, search, patronTypeFilter, sortColumn, sortDirection]);

  // Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(patrons.map((p) => String(p._id)));
      setSelectedPatronIds(allIds);
    } else {
      setSelectedPatronIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedPatronIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Thermal Print Handlers
  const handlePrintSingle = (patron: Partial<IPatron>) => {
    const fullName = `${patron.firstname || ''} ${patron.surname || ''}`.trim();
    setPrintLabels([
      {
        barcode: patron.barcode || '00000000',
        name: fullName,
        patronType: patron.patronType,
      },
    ]);
  };

  const handlePrintBatch = () => {
    const selected = patrons.filter((p) => selectedPatronIds.has(String(p._id)));
    if (selected.length === 0) return;

    const labels: ThermalLabelData[] = selected.map((p) => ({
      barcode: p.barcode,
      name: `${p.firstname} ${p.surname}`,
      patronType: p.patronType,
    }));

    setPrintLabels(labels);
  };

  const isAllSelected = patrons.length > 0 && selectedPatronIds.size === patrons.length;
  const isSomeSelected = selectedPatronIds.size > 0 && selectedPatronIds.size < patrons.length;

  const columns: Column<IPatron>[] = [
    {
      id: 'select',
      label: '',
      minWidth: 48,
      render: (row) => (
        <Checkbox
          size="small"
          checked={selectedPatronIds.has(String(row._id))}
          onChange={() => handleToggleSelect(String(row._id))}
          sx={{
            color: dzfColors.surfaces.textMuted,
            '&.Mui-checked': { color: dzfColors.maroon[900] },
          }}
        />
      ),
    },
    {
      id: 'patron',
      label: 'Patron',
      minWidth: 230,
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.image_url?.secure_url}
            alt={`${row.firstname} ${row.surname}`}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 800,
              backgroundColor: dzfColors.maroon[900],
              color: '#ffffff',
              border: `2px solid ${dzfColors.gold[400]}`,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
              '&:hover': {
                transform: 'scale(1.18)',
                boxShadow: '0 6px 14px rgba(184, 134, 11, 0.4)',
                zIndex: 2,
              },
            }}
          >
            {row.firstname?.charAt(0)}{row.surname?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900], lineHeight: 1.2 }}>
              {row.firstname} {row.surname}
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              {row.phoneNumber || 'No phone'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'barcode',
      label: 'Barcode ID',
      minWidth: 140,
      sortable: true,
      render: (row) => (
        <Mono
          sx={{
            fontWeight: 800,
            color: dzfColors.maroon[900],
            backgroundColor: dzfColors.maroon[50],
            px: 1,
            py: 0.3,
            borderRadius: 1,
            fontSize: '0.8125rem',
            border: `1px solid ${dzfColors.maroon[200]}`,
          }}
        >
          {row.barcode}
        </Mono>
      ),
    },
    {
      id: 'type',
      label: 'Classification',
      minWidth: 120,
      render: (row) => {
        const typeVariants: Record<string, 'default' | 'success' | 'warning' | 'info' | 'top10'> = {
          student: 'top10',
          teacher: 'info',
          staff: 'success',
          guest: 'default',
        };
        return (
          <DZFBadge
            variant={typeVariants[row.patronType] || 'default'}
            label={row.patronType.toUpperCase()}
            size="small"
            solid
          />
        );
      },
    },
    {
      id: 'academic',
      label: 'School / Level',
      minWidth: 160,
      sortable: true,
      render: (row) => {
        if (row.patronType === 'student' && row.studentSchoolInfo) {
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900], fontSize: '0.8125rem' }}>
                {row.studentSchoolInfo.currentClass || 'Student'}
              </Typography>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.studentSchoolInfo.schoolName || 'DZF Academy'}
              </Typography>
            </Box>
          );
        }
        return (
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
            {row.employerInfo?.employerName || row.patronType}
          </Typography>
        );
      },
    },
    {
      id: 'gender',
      label: 'Gender',
      minWidth: 100,
      sortable: true,
      render: (row) => (
        <Typography variant="body2" sx={{ color: dzfColors.navy[700], textTransform: 'capitalize', fontWeight: 500 }}>
          {row.gender || '—'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      render: (row) => (
        <DZFBadge
          variant={row.active ? 'success' : 'default'}
          label={row.active ? 'Active' : 'Inactive'}
          size="small"
          dot
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 170,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View Profile">
            <IconButton
              size="small"
              onClick={() => setDetailPatron(row)}
              sx={{ color: dzfColors.navy[700], '&:hover': { color: dzfColors.maroon[900] } }}
            >
              <EyeIcon size={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Print 60x40mm Thermal Label">
            <IconButton
              size="small"
              onClick={() => handlePrintSingle(row)}
              sx={{ color: dzfColors.gold[700], '&:hover': { color: dzfColors.gold[900] } }}
            >
              <PrinterIcon size={18} />
            </IconButton>
          </Tooltip>

          {canEdit && (
            <Tooltip title="Edit Patron Profile (Admin / ICT)">
              <IconButton
                size="small"
                onClick={() => setEditPatron(row)}
                sx={{
                  color: '#2563eb',
                  '&:hover': { color: '#1d4ed8', backgroundColor: 'rgba(37, 99, 235, 0.08)' },
                }}
              >
                <EditIcon size={18} />
              </IconButton>
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip title="Delete Patron Record (Admin Only)">
              <IconButton
                size="small"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteConfirmText('');
                  setDeleteTarget(row);
                }}
                sx={{
                  color: '#dc2626',
                  '&:hover': { color: '#b91c1c', backgroundColor: 'rgba(220, 38, 38, 0.08)' },
                }}
              >
                <TrashIcon size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header and Quick Registration CTA */}
      <PageHeader
        kicker="STATION AAoJ • MEMBERSHIP REPOSITORY"
        title="Patron Management & Barcode Studio"
        subtitle="Manage student, teacher, staff, and guest memberships. Print high-density 60×40mm thermal roll labels and capture live webcam passport identity photos."
        actionSlot={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            {selectedPatronIds.size > 0 && (
              <DZFButton
                variant="secondary"
                startIcon={<PrinterIcon size={18} />}
                onClick={handlePrintBatch}
              >
                Print Selected ({selectedPatronIds.size}) Labels
              </DZFButton>
            )}

            {canDelete && selectedPatronIds.size > 0 && (
              <DZFButton
                variant="danger"
                startIcon={<TrashIcon size={18} />}
                onClick={() => {
                  setBulkDeleteError(null);
                  setBulkDeleteConfirmText('');
                  setBulkDeleteOpen(true);
                }}
              >
                Delete Selected ({selectedPatronIds.size})
              </DZFButton>
            )}

            <Link href="/dashboard/patrons/register" style={{ textDecoration: 'none' }}>
              <DZFButton variant="primary" startIcon={<IdCardIcon size={18} />}>
                Register New Patron
              </DZFButton>
            </Link>
          </Box>
        }
      />

      {/* Filter and Search Bar */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: '#ffffff',
          border: `1px solid ${dzfColors.surfaces.border}`,
          borderRadius: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
          }}
        >
          {/* Classification Tabs */}
          <Tabs
            value={patronTypeFilter}
            onChange={(_, val) => {
              setPatronTypeFilter(val);
              setPage(0);
              setLoading(true);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: dzfColors.surfaces.textSecondary,
                '&.Mui-selected': {
                  color: dzfColors.maroon[900],
                  fontWeight: 700,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: dzfColors.maroon[900],
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab label={`All Patrons (${totalCount})`} value="all" />
            <Tab label="Students" value="student" />
            <Tab label="Teachers" value="teacher" />
            <Tab label="Staff" value="staff" />
            <Tab label="Community Guests" value="guest" />
          </Tabs>

          {/* Search Box */}
          <Box sx={{ width: { xs: '100%', md: 320 } }}>
            <DZFSearchInput
              placeholder="Search barcode, name, phone..."
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(0);
                setLoading(true);
              }}
              onClear={() => {
                setSearch('');
                setPage(0);
                setLoading(true);
              }}
              size="small"
              fullWidth
            />
          </Box>
        </Box>
      </Card>

      {/* Batch Thermal Printing Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox
            size="small"
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            sx={{
              p: 0.5,
              color: dzfColors.surfaces.textMuted,
              '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: dzfColors.maroon[900] },
            }}
          />
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: dzfColors.navy[700], fontWeight: 600 }}>
            Select Page Patrons ({selectedPatronIds.size} selected)
          </Typography>
        </Box>
        {selectedPatronIds.size > 0 && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <DZFButton
              variant="secondary"
              size="small"
              startIcon={<PrinterIcon size={16} />}
              onClick={handlePrintBatch}
            >
              Print Thermal Labels ({selectedPatronIds.size})
            </DZFButton>
            {canDelete && (
              <DZFButton
                variant="danger"
                size="small"
                startIcon={<TrashIcon size={16} />}
                onClick={() => {
                  setBulkDeleteError(null);
                  setBulkDeleteConfirmText('');
                  setBulkDeleteOpen(true);
                }}
              >
                Delete Selected ({selectedPatronIds.size})
              </DZFButton>
            )}
          </Box>
        )}
      </Box>

      {/* Main Patron Data Table */}
      <Card
        sx={{
          backgroundColor: '#ffffff',
          border: `1px solid ${dzfColors.surfaces.border}`,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        <DZFDataTable
          columns={columns}
          data={patrons}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onPageChange={(newPage) => {
            setPage(newPage);
            setLoading(true);
          }}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
            setLoading(true);
          }}
          keyExtractor={(row) => String(row._id)}
          emptyTitle="No patrons found"
          emptyDescription={
            search
              ? `No patron records match "${search}". Try searching by barcode or a different keyword.`
              : 'No patrons found under this classification category.'
          }
        />
      </Card>

      {/* Patron Detail / Profile Modal */}
      <PatronDetailModal
        open={Boolean(detailPatron)}
        onClose={() => setDetailPatron(null)}
        patron={detailPatron}
        onPrintLabel={(p) => {
          handlePrintSingle(p);
        }}
        onEdit={canEdit ? (p) => setEditPatron(p as IPatron) : undefined}
      />

      {/* Patron Edit Profile Modal (Admin/ICT Only) */}
      <PatronEditModal
        open={Boolean(editPatron)}
        patron={editPatron}
        onClose={() => setEditPatron(null)}
        onPatronUpdated={handlePatronUpdated}
      />

      {/* Patron Deletion Confirmation Dialog (Admin Only) */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteConfirmText('');
          }
        }}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiDialog-paper': { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900], pb: 1 }}>
          Confirm Patron Deletion
        </DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2 }}>
            Are you sure you want to delete patron{' '}
            <strong>
              {deleteTarget?.firstname} {deleteTarget?.surname}
            </strong>{' '}
            (<Mono sx={{ color: dzfColors.maroon[900], fontWeight: 700 }}>{deleteTarget?.barcode}</Mono>)?
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.8125rem' }}>
            Active loan protection: Deletion will be blocked if this patron has any unreturned borrowed books in the library ledger.
          </Alert>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5, display: 'block' }}>
              To confirm deletion, type <Mono sx={{ color: '#dc2626', fontWeight: 800 }}>DELETE</Mono> in the box below:
            </Typography>
            <DZFInput
              placeholder='Type "DELETE" to confirm'
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <DZFButton
            variant="secondary"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteConfirmText('');
            }}
            disabled={deleting}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            onClick={handleConfirmDelete}
            loading={deleting}
            disabled={deleting || deleteConfirmText.trim() !== 'DELETE'}
            sx={{
              backgroundColor: '#dc2626 !important',
              '&:hover': { backgroundColor: '#b91c1c !important' },
            }}
          >
            Delete Patron
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* Bulk Patron Deletion Confirmation Dialog (Admin Only) */}
      <Dialog
        open={bulkDeleteOpen}
        onClose={() => {
          if (!bulkDeleting) {
            setBulkDeleteOpen(false);
            setBulkDeleteConfirmText('');
          }
        }}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiDialog-paper': { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[900], pb: 1 }}>
          Confirm Bulk Patron Deletion
        </DialogTitle>
        <DialogContent>
          {bulkDeleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {bulkDeleteError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2 }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: dzfColors.navy[900] }}>
              {selectedPatronIds.size} selected patron{selectedPatronIds.size > 1 ? 's' : ''}
            </strong>?
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.8125rem', mb: 2 }}>
            Active loan protection: If any selected patron has active unreturned borrowed books, the bulk deletion will be safely aborted.
          </Alert>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5, display: 'block' }}>
              To confirm bulk deletion, type <Mono sx={{ color: '#dc2626', fontWeight: 800 }}>DELETE</Mono> in the box below:
            </Typography>
            <DZFInput
              placeholder='Type "DELETE" to confirm'
              value={bulkDeleteConfirmText}
              onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <DZFButton
            variant="secondary"
            onClick={() => {
              setBulkDeleteOpen(false);
              setBulkDeleteConfirmText('');
            }}
            disabled={bulkDeleting}
          >
            Cancel
          </DZFButton>
          <DZFButton
            variant="primary"
            onClick={handleBulkDelete}
            loading={bulkDeleting}
            disabled={bulkDeleting || bulkDeleteConfirmText.trim() !== 'DELETE'}
            sx={{
              backgroundColor: '#dc2626 !important',
              '&:hover': { backgroundColor: '#b91c1c !important' },
            }}
          >
            Delete {selectedPatronIds.size} Patrons
          </DZFButton>
        </DialogActions>
      </Dialog>

      {/* 60x40mm Thermal Barcode Print Studio Modal */}
      {printLabels && (
        <ThermalPrintDialog
          open={Boolean(printLabels)}
          onClose={() => setPrintLabels(null)}
          labels={printLabels}
        />
      )}

      {/* Feedback Notification Snackbar */}
      <Snackbar
        open={Boolean(feedbackMessage)}
        autoHideDuration={5000}
        onClose={() => setFeedbackMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setFeedbackMessage(null)}
          severity="success"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
        >
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
