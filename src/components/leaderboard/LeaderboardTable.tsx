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
import { LeaderboardPatronEntry } from '@/lib/activity/service';
import { DZFDataTable, Column } from '@/components/ui/DZFDataTable';
import { RankBadge } from './PatronRankCard';
import { SearchIcon } from '@/components/ui/DZFIcons';

interface LeaderboardTableProps {
  entries: LeaderboardPatronEntry[];
  loading?: boolean;
  monthYearName: string;
  onFilterChange?: (filters: { patronType: string; search: string }) => void;
}

export function LeaderboardTable({
  entries,
  loading = false,
  monthYearName,
  onFilterChange,
}: LeaderboardTableProps) {
  const [search, setSearch] = React.useState('');
  const [patronType, setPatronType] = React.useState('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onFilterChange?.({ patronType, search: val });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPatronType(val);
    onFilterChange?.({ patronType: val, search });
  };

  // Client-side filtering fallback if server doesn't filter
  const filteredData = React.useMemo(() => {
    return entries.filter((row) => {
      if (patronType !== 'all' && row.patronType !== patronType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = row.patronName.toLowerCase().includes(q);
        const matchesBarcode = row.patronBarcode.toLowerCase().includes(q);
        const matchesClass = (row.class || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesClass) return false;
      }
      return true;
    });
  }, [entries, patronType, search]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      'Rank',
      'Barcode',
      'Name',
      'Patron Type',
      'Class/Grade',
      'Activity Score',
      'Total Points',
      'Books Returned',
      'Books Checked Out',
      'Classes Attended',
      'Summaries Approved',
    ];

    const rows = filteredData.map((d) => [
      d.rank,
      `"${d.patronBarcode}"`,
      `"${d.patronName}"`,
      `"${d.patronType}"`,
      `"${d.class || ''}"`,
      d.activityScore,
      d.totalPoints,
      d.booksReturned,
      d.booksCheckedOut,
      d.classesAttended,
      d.summariesApproved,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dzf-leaderboard-${monthYearName.replace(/\s+/g, '-').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: Column<LeaderboardPatronEntry>[] = [
    {
      id: 'rank',
      label: 'Rank',
      minWidth: 100,
      render: (row) => <RankBadge rank={row.rank} size="small" />,
    },
    {
      id: 'patron',
      label: 'Patron Details',
      minWidth: 260,
      render: (row) => {
        const isTop3 = row.rank <= 3;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={row.imageUrl}
              sx={{
                width: 38,
                height: 38,
                bgcolor: isTop3 ? dzfColors.maroon[900] : dzfColors.navy[700],
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: isTop3 ? '2px solid #f3c44f' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {row.patronName.charAt(0) || 'P'}
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isTop3 ? 700 : 600,
                  color: dzfColors.surfaces.textPrimary,
                  lineHeight: 1.2,
                }}
              >
                {row.patronName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    bgcolor: 'rgba(23, 50, 77, 0.06)',
                    px: 0.75,
                    py: 0.1,
                    borderRadius: 1,
                    color: dzfColors.navy[700],
                  }}
                >
                  {row.patronBarcode}
                </Typography>
                {row.class && (
                  <Chip
                    size="small"
                    label={row.class}
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      bgcolor: 'rgba(111, 17, 17, 0.08)',
                      color: dzfColors.maroon[900],
                    }}
                  />
                )}
                <Chip
                  size="small"
                  label={row.patronType}
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    textTransform: 'capitalize',
                    bgcolor: dzfColors.surfaces.canvas,
                  }}
                />
              </Box>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'activityScore',
      label: 'Activity Score',
      minWidth: 140,
      render: (row) => (
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 800,
              color: '#6f42c1', // Vibrant Violet specified in Section 7.6
              fontFamily: 'monospace',
              fontSize: '1rem',
              lineHeight: 1.2,
            }}
          >
            {row.activityScore.toLocaleString()}{' '}
            <Typography component="span" variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              pts
            </Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textSecondary, fontSize: '0.7rem' }}>
            Score rollup
          </Typography>
        </Box>
      ),
    },
    {
      id: 'totalPoints',
      label: 'Points Earned',
      minWidth: 120,
      render: (row) => (
        <Chip
          size="small"
          label={`+${row.totalPoints} pts`}
          sx={{
            fontWeight: 700,
            bgcolor: dzfColors.gold[100],
            color: dzfColors.gold[900],
            border: `1px solid ${dzfColors.gold[400]}`,
          }}
        />
      ),
    },
    {
      id: 'books',
      label: 'Books Circulated',
      minWidth: 150,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip
            size="small"
            label={`${row.booksReturned} returned`}
            sx={{
              height: 22,
              fontSize: '0.72rem',
              bgcolor: 'rgba(27, 94, 32, 0.08)',
              color: dzfColors.status.success.text,
              fontWeight: 600,
            }}
          />
          {row.booksCheckedOut > 0 && (
            <Chip
              size="small"
              label={`${row.booksCheckedOut} out`}
              sx={{
                height: 22,
                fontSize: '0.72rem',
                bgcolor: dzfColors.surfaces.canvas,
                color: dzfColors.surfaces.textSecondary,
              }}
            />
          )}
        </Box>
      ),
    },
    {
      id: 'classes',
      label: 'Classes Attended',
      minWidth: 130,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
          {row.classesAttended}{' '}
          <Typography component="span" variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
            {row.classesAttended === 1 ? 'session' : 'sessions'}
          </Typography>
        </Typography>
      ),
    },
    {
      id: 'summaries',
      label: 'Book Summaries',
      minWidth: 140,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.surfaces.textPrimary }}>
            {row.summariesApproved}{' '}
            <Typography component="span" variant="caption" sx={{ color: dzfColors.status.success.text }}>
              approved
            </Typography>
          </Typography>
          {row.summariesSubmitted > row.summariesApproved && (
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
              ({row.summariesSubmitted} submitted)
            </Typography>
          )}
        </Box>
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
            placeholder="Search by patron name or barcode..."
            value={search}
            onChange={handleSearchChange}
            sx={{ minWidth: { xs: '100%', sm: 260 } }}
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

          <TextField
            select
            size="small"
            value={patronType}
            onChange={handleTypeChange}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="student">Students</MenuItem>
            <MenuItem value="teacher">Teachers</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="guest">Guests</MenuItem>
          </TextField>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            sx={{
              borderColor: dzfColors.surfaces.border,
              color: dzfColors.navy[700],
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                borderColor: dzfColors.navy[700],
                backgroundColor: 'rgba(23, 50, 77, 0.04)',
              },
            }}
          >
            Export CSV ({filteredData.length})
          </Button>
        </Box>
      </Box>

      {/* Main Data Table */}
      <DZFDataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        pageSize={15}
        keyExtractor={(row) => row._id || `${row.patronBarcode}-${row.rank}`}
        emptyTitle={`No Leaderboard Entries for ${monthYearName}`}
        emptyDescription="Patrons will appear on the leaderboard as reading, attendance, or summary events occur."
      />
    </Card>
  );
}

export default LeaderboardTable;
