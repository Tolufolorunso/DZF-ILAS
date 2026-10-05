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
import Link from 'next/link';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  DZFSearchInput,
  PageHeader,
  Mono,
  PrinterIcon,
  IdCardIcon,
  EyeIcon,
} from '@/components';
import { DZFDataTable, Column } from '@/components/ui/DZFDataTable';
import { ITokenPayload } from '@/lib/auth/jwt';
import { IPatron } from '@/models/Patron';
import ThermalPrintDialog from '@/components/patrons/ThermalPrintDialog';
import PatronDetailModal from '@/components/patrons/PatronDetailModal';
import { ThermalLabelData } from '@/components/patrons/ThermalBarcodeLabel';

interface PatronListClientProps {
  initialPatrons: IPatron[];
  initialTotal: number;
  user?: ITokenPayload | null;
}

export default function PatronListClient({
  initialPatrons,
  initialTotal,
}: PatronListClientProps) {
  const [patrons, setPatrons] = React.useState<IPatron[]>(initialPatrons);
  const [totalCount, setTotalCount] = React.useState<number>(initialTotal);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');
  const [patronTypeFilter, setPatronTypeFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState<number>(0);
  const [pageSize, setPageSize] = React.useState<number>(10);

  // Selection for Batch Thermal Label Printing
  const [selectedPatronIds, setSelectedPatronIds] = React.useState<Set<string>>(new Set());

  // Modal Dialogs
  const [detailPatron, setDetailPatron] = React.useState<IPatron | null>(null);
  const [printLabels, setPrintLabels] = React.useState<ThermalLabelData[] | null>(null);

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
  }, [page, pageSize, search, patronTypeFilter]);

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
      minWidth: 220,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.image_url?.secure_url}
            sx={{
              width: 36,
              height: 36,
              fontSize: '0.875rem',
              fontWeight: 700,
              backgroundColor: dzfColors.maroon[900],
              color: '#ffffff',
              border: `1.5px solid ${dzfColors.gold[400]}`,
            }}
          >
            {row.firstname?.charAt(0)}
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
      id: 'status',
      label: 'Status',
      minWidth: 100,
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
      minWidth: 130,
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

            <Link href="/patrons/register" style={{ textDecoration: 'none' }}>
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
          <DZFButton
            variant="secondary"
            size="small"
            startIcon={<PrinterIcon size={16} />}
            onClick={handlePrintBatch}
          >
            Print Thermal Labels ({selectedPatronIds.size})
          </DZFButton>
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
      />

      {/* 60x40mm Thermal Barcode Print Studio Modal */}
      {printLabels && (
        <ThermalPrintDialog
          open={Boolean(printLabels)}
          onClose={() => setPrintLabels(null)}
          labels={printLabels}
        />
      )}
    </Box>
  );
}
