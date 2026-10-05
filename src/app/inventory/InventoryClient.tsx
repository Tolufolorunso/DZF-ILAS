'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFSearchInput,
  DZFInput,
  DZFBadge,
  DZFBadgeVariant,
  PageHeader,
  Mono,
  PrinterIcon,
  PlusIcon,
  CloseIcon,
  LayersIcon,
} from '@/components';
import { DZFDataTable, Column } from '@/components/ui/DZFDataTable';
import { ITokenPayload } from '@/lib/auth/jwt';
import { IInventory } from '@/models/Inventory';
import { ThermalBookPrintDialog, ThermalBookLabelData } from '@/components/catalog';

interface InventoryClientProps {
  initialItems: IInventory[];
  initialTotal: number;
  user?: ITokenPayload | null;
}

export default function InventoryClient({
  initialItems,
  initialTotal,
}: InventoryClientProps) {
  const [items, setItems] = React.useState<IInventory[]>(initialItems);
  const [totalCount, setTotalCount] = React.useState<number>(initialTotal);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');
  const [deptFilter, setDeptFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState<number>(0);
  const [pageSize, setPageSize] = React.useState<number>(15);

  // Add Asset Modal State
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [dept, setDept] = React.useState('ict');
  const [quantity, setQuantity] = React.useState('1');
  const [customBarcode, setCustomBarcode] = React.useState('');
  const [condition, setCondition] = React.useState('good');
  const [status, setStatus] = React.useState('available');
  const [savingAsset, setSavingAsset] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Thermal Print Dialog State
  const [printLabels, setPrintLabels] = React.useState<ThermalBookLabelData[] | null>(null);

  // Avoid synchronous setState in effect
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
        if (deptFilter !== 'all') params.set('dept', deptFilter);

        const res = await fetch(`/api/inventory?${params.toString()}`);
        const data = await res.json();

        if (active && data.success) {
          setItems(data.items);
          setTotalCount(data.pagination.total);
        }
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
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
  }, [page, pageSize, search, deptFilter]);

  const handlePrintItem = (item: IInventory) => {
    setPrintLabels([
      {
        barcode: item.barcode,
        title: item.name.toUpperCase(),
        controlNumber: `DEPT: ${item.dept.toUpperCase()}`,
        shelfLocation: `QTY: ${item.quantity}`,
      },
    ]);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError('Asset name is required.');
      return;
    }

    setSavingAsset(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          dept,
          quantity: parseInt(quantity, 10) || 1,
          barcode: customBarcode.trim() || undefined,
          condition,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add asset.');
      }

      // Add to list and close
      setItems((prev) => [data.item, ...prev]);
      setTotalCount((c) => c + 1);
      setAddModalOpen(false);

      // Trigger print for the newly registered asset
      handlePrintItem(data.item);

      // Reset form
      setName('');
      setCustomBarcode('');
      setQuantity('1');
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error adding asset.');
    } finally {
      setSavingAsset(false);
    }
  };

  const columns: Column<IInventory>[] = [
    {
      id: 'name',
      label: 'Asset / Equipment Name',
      minWidth: 220,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '6px',
              backgroundColor: 'rgba(23, 50, 77, 0.08)',
              color: dzfColors.navy[700],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LayersIcon size={18} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900], textTransform: 'capitalize' }}>
              {row.name}
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Added by: {row.addedBy || 'Staff'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'dept',
      label: 'Department',
      minWidth: 120,
      render: (row) => (
        <DZFBadge
          variant="default"
          size="small"
          label={row.dept.toUpperCase()}
        />
      ),
    },
    {
      id: 'barcode',
      label: 'Barcode',
      minWidth: 130,
      render: (row) => (
        <Mono sx={{ fontSize: '0.8125rem' }}>{row.barcode}</Mono>
      ),
    },
    {
      id: 'quantity',
      label: 'Qty',
      minWidth: 90,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
          {row.quantity}
        </Typography>
      ),
    },
    {
      id: 'condition',
      label: 'Condition',
      minWidth: 120,
      render: (row) => {
        const cond = row.condition || 'good';
        const variant: DZFBadgeVariant = cond === 'new' ? 'top10' : cond === 'good' ? 'success' : cond === 'fair' ? 'default' : 'error';
        return <DZFBadge variant={variant} size="small" label={cond.toUpperCase()} />;
      },
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 130,
      render: (row) => {
        const st = row.status || 'available';
        const variant: DZFBadgeVariant = st === 'available' ? 'success' : st === 'checked_out' ? 'warning' : 'error';
        return <DZFBadge variant={variant} size="small" label={st.replace('_', ' ').toUpperCase()} />;
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'right',
      render: (row) => (
        <DZFButton
          variant="soft"
          size="small"
          startIcon={<PrinterIcon size={16} />}
          onClick={() => handlePrintItem(row)}
        >
          Print Label
        </DZFButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <PageHeader
        kicker="STATION AAoJ • PHYSICAL ASSET REPOSITORY"
        title="Hardware & Equipment Inventory"
        subtitle="Track institutional assets, laptops, barcode scanners, projectors, audio visual gear, and thermal asset identification labels."
        actionSlot={
          <DZFButton
            variant="primary"
            startIcon={<PlusIcon size={18} />}
            onClick={() => setAddModalOpen(true)}
          >
            Register Equipment Asset
          </DZFButton>
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
          <Tabs
            value={deptFilter}
            onChange={(_, val) => {
              setDeptFilter(val);
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
            <Tab label={`All Assets (${totalCount})`} value="all" />
            <Tab label="ICT Equipment" value="ict" />
            <Tab label="Library Media" value="library" />
            <Tab label="Digital Academy" value="academy" />
            <Tab label="Administration" value="admin" />
          </Tabs>

          <Box sx={{ width: { xs: '100%', md: 320 } }}>
            <DZFSearchInput
              placeholder="Search asset, barcode, dept..."
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

      {/* Main Inventory Data Table */}
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
          data={items}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
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
          emptyTitle="No inventory items found"
          emptyDescription={
            search
              ? `No asset records match "${search}".`
              : 'No hardware assets registered under this department.'
          }
        />
      </Card>

      {/* Add Asset Modal */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <form onSubmit={handleSaveAsset}>
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${dzfColors.surfaces.border}`,
              pb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
              Register Hardware Asset
            </Typography>
            <IconButton onClick={() => setAddModalOpen(false)} size="small">
              <CloseIcon size={18} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            {modalError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {modalError}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <DZFInput
                  label="Asset Name / Description"
                  required
                  placeholder="e.g. Dell Latitude 5420 Laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  select
                  label="Department"
                  required
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="ict">ICT Department</MenuItem>
                  <MenuItem value="library">Library Stacks</MenuItem>
                  <MenuItem value="academy">Digital Academy</MenuItem>
                  <MenuItem value="admin">Administration</MenuItem>
                </DZFInput>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  label="Quantity"
                  type="number"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  select
                  label="Condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                  <MenuItem value="damaged">Damaged</MenuItem>
                </DZFInput>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DZFInput
                  select
                  label="Operational Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="checked_out">Checked Out</MenuItem>
                  <MenuItem value="maintenance">Under Maintenance</MenuItem>
                  <MenuItem value="lost">Lost / Decommissioned</MenuItem>
                </DZFInput>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <DZFInput
                  label="Asset Barcode (Optional)"
                  placeholder="Leave empty for auto-generated sequence"
                  value={customBarcode}
                  onChange={(e) => setCustomBarcode(e.target.value)}
                  helperText="Scan existing barcode label or let the system assign an institutional identifier."
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
            <DZFButton variant="soft" onClick={() => setAddModalOpen(false)}>
              Cancel
            </DZFButton>
            <DZFButton variant="primary" type="submit" disabled={savingAsset}>
              {savingAsset ? 'Saving...' : 'Register Asset & Print Label'}
            </DZFButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Thermal Print Dialog (60×40mm) */}
      <ThermalBookPrintDialog
        open={Boolean(printLabels)}
        onClose={() => setPrintLabels(null)}
        labels={printLabels}
      />
    </Box>
  );
}
