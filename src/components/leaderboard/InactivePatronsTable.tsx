'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import { dzfColors } from '@/theme/colors';
import { InactivePatronResult } from '@/lib/activity/service';
import { DZFDataTable, Column } from '@/components/ui/DZFDataTable';
import { SearchIcon, PhoneIcon } from '@/components/ui/DZFIcons';

interface InactivePatronsTableProps {
  patrons: InactivePatronResult[];
  loading?: boolean;
  monthYearName: string;
}

export function InactivePatronsTable({
  patrons,
  loading = false,
  monthYearName,
}: InactivePatronsTableProps) {
  const [search, setSearch] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('all');

  // Extract unique classes present in patrons list for filter
  const availableClasses = React.useMemo(() => {
    const set = new Set<string>();
    patrons.forEach((p) => {
      if (p.class) set.add(p.class);
    });
    return Array.from(set).sort();
  }, [patrons]);

  const filteredData = React.useMemo(() => {
    return patrons.filter((p) => {
      if (classFilter !== 'all' && p.class !== classFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        const matchesClass = (p.class || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesClass) return false;
      }
      return true;
    });
  }, [patrons, classFilter, search]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      'Barcode',
      'Full Name',
      'Role',
      'Class/Grade',
      'Phone Number',
      'Last Active Month',
      'Lifetime Points',
    ];

    const rows = filteredData.map((d) => [
      `"${d.barcode}"`,
      `"${d.name}"`,
      `"${d.patronType}"`,
      `"${d.class || ''}"`,
      `"${d.phone || ''}"`,
      `"${d.lastActiveMonth || ''}"`,
      d.points,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dzf-inactive-patrons-${monthYearName.replace(/\s+/g, '-').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: Column<InactivePatronResult>[] = [
    {
      id: 'barcode',
      label: 'Barcode ID',
      minWidth: 120,
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontWeight: 700,
            color: dzfColors.maroon[900],
            bgcolor: 'rgba(111, 17, 17, 0.06)',
            px: 1,
            py: 0.25,
            borderRadius: 1,
            display: 'inline-block',
          }}
        >
          {row.barcode}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Patron',
      minWidth: 220,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.imageUrl}
            sx={{
              width: 36,
              height: 36,
              bgcolor: dzfColors.navy[700],
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {row.name.charAt(0) || 'P'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.surfaces.textPrimary }}>
              {row.name}
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, textTransform: 'capitalize' }}>
              {row.patronType} {row.gender ? `• ${row.gender}` : ''}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'class',
      label: 'Class / Grade',
      minWidth: 120,
      render: (row) =>
        row.class ? (
          <Chip
            size="small"
            label={row.class}
            sx={{
              bgcolor: 'rgba(23, 50, 77, 0.08)',
              color: dzfColors.navy[700],
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        ) : (
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
            —
          </Typography>
        ),
    },
    {
      id: 'phone',
      label: 'Contact Phone',
      minWidth: 160,
      render: (row) =>
        row.phone ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PhoneIcon size={14} color={dzfColors.surfaces.textMuted} />
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {row.phone}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
            No phone recorded
          </Typography>
        ),
    },
    {
      id: 'lastActive',
      label: 'Last Recorded Activity',
      minWidth: 180,
      render: (row) => (
        <Chip
          size="small"
          label={row.lastActiveMonth || 'Never active'}
          sx={{
            height: 24,
            fontSize: '0.75rem',
            fontWeight: 500,
            bgcolor:
              row.lastActiveMonth && row.lastActiveMonth !== 'Never active'
                ? dzfColors.gold[100]
                : 'rgba(183, 28, 28, 0.08)',
            color:
              row.lastActiveMonth && row.lastActiveMonth !== 'Never active'
                ? dzfColors.gold[900]
                : dzfColors.status.error.text,
          }}
        />
      ),
    },
    {
      id: 'points',
      label: 'Lifetime Points',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.surfaces.textSecondary }}>
          {row.points.toLocaleString()} pts
        </Typography>
      ),
    },
  ];

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${dzfColors.surfaces.border}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Table Toolbar */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search inactive patrons by name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 280 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={18} color={dzfColors.surfaces.textMuted} />
                  </InputAdornment>
                ),
              },
            }}
          />

          {availableClasses.length > 0 && (
            <TextField
              select
              size="small"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All Classes</MenuItem>
              {availableClasses.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            sx={{
              borderColor: dzfColors.surfaces.border,
              color: dzfColors.maroon[900],
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                borderColor: dzfColors.maroon[900],
                backgroundColor: 'rgba(111, 17, 17, 0.04)',
              },
            }}
          >
            Export Outreach CSV ({filteredData.length})
          </Button>
        </Box>
      </Box>

      {/* Main Data Table */}
      <DZFDataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        pageSize={15}
        keyExtractor={(row) => row._id || row.barcode}
        emptyTitle={`No Inactive Patrons Found for ${monthYearName}`}
        emptyDescription="All registered patrons in this scope had recorded engagement during the selected month!"
      />
    </Card>
  );
}

export default InactivePatronsTable;
