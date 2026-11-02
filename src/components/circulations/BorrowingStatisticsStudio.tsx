'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';

import { dzfColors } from '@/theme/colors';
import {
  DZFStatCard,
  DZFBadge,
  DZFButton,
  DZFEmptyState,
  BookIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  CalendarIcon,
  AwardIcon,
  RefreshIcon,
  ActivityIcon,
  UsersIcon,
} from '@/components';

export interface CirculationAnalyticsData {
  timeHorizon: {
    unit: 'weeks' | 'months' | 'all';
    amount: number;
    granularity?: 'month' | 'week' | 'day';
    fromDate: string;
    toDate: string;
  };
  summary: {
    totalCheckouts: number;
    totalReturns: number;
    onTimeReturns: number;
    lateReturns: number;
    onTimeRate: number;
    activeOverdues: number;
    delinquencyRate: number;
    averageLoanDays: number;
  };
  trends: Array<{
    dateKey: string;
    label: string;
    checkouts: number;
    returns: number;
  }>;
  topBooks: Array<{
    bookId: string;
    title: string;
    author: string;
    barcode: string;
    classification: string;
    checkoutCount: number;
    copiesAvailable: number;
    copiesTotal: number;
  }>;
  patronDemographics: {
    byType: Array<{ type: string; label: string; count: number; percentage: number }>;
    byGradeLevel: Array<{ classGrade: string; count: number }>;
  };
  deweyCategories: Array<{
    deweyClass: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  gamificationPoints: {
    onTime3Pts: number;
    grace1Pt: number;
    overdue0Pts: number;
  };
}

type PresetKey = '1w' | '2w' | '1m' | '3m' | '6m' | 'all' | 'custom';

export function BorrowingStatisticsStudio() {
  const [preset, setPreset] = React.useState<PresetKey>('1m');
  const [unit, setUnit] = React.useState<'weeks' | 'months'>('months');
  const [amount, setAmount] = React.useState<number>(1);
  const [granularity, setGranularity] = React.useState<'auto' | 'month' | 'week' | 'day'>('auto');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<CirculationAnalyticsData | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let queryUrl = '/api/circulations/analytics';
      if (preset === 'all') {
        queryUrl += '?unit=all&amount=1';
      } else {
        queryUrl += `?unit=${unit}&amount=${amount}`;
      }
      if (granularity !== 'auto') {
        queryUrl += `&granularity=${granularity}`;
      }

      const res = await fetch(queryUrl);
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to fetch circulation borrowing statistics.');
      }
    } catch (err) {
      console.error('Failed to load circulation analytics:', err);
      setError('Network error while loading borrowing statistics.');
    } finally {
      setLoading(false);
    }
  }, [preset, unit, amount, granularity]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSelectPreset = (key: PresetKey) => {
    setPreset(key);
    setGranularity('auto');
    if (key === '1w') {
      setUnit('weeks');
      setAmount(1);
    } else if (key === '2w') {
      setUnit('weeks');
      setAmount(2);
    } else if (key === '1m') {
      setUnit('months');
      setAmount(1);
    } else if (key === '3m') {
      setUnit('months');
      setAmount(3);
    } else if (key === '6m') {
      setUnit('months');
      setAmount(6);
    } else if (key === 'all') {
      setAmount(1);
    }
  };

  const formattedDateRange = React.useMemo(() => {
    if (!data?.timeHorizon) return '';
    const from = new Date(data.timeHorizon.fromDate);
    const to = new Date(data.timeHorizon.toDate);
    if (data.timeHorizon.unit === 'all') {
      return `All-Time Records up to ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [data?.timeHorizon]);

  const maxTrendVolume = React.useMemo(() => {
    if (!data?.trends || data.trends.length === 0) return 1;
    return Math.max(
      1,
      ...data.trends.map((t) => Math.max(t.checkouts, t.returns))
    );
  }, [data?.trends]);

  const activeGranularity = data?.timeHorizon?.granularity || (granularity !== 'auto' ? granularity : (unit === 'months' || preset === 'all' ? 'month' : 'week'));

  const granularityOptions = React.useMemo<{ key: 'month' | 'week' | 'day'; label: string }[]>(() => {
    if (preset === 'all' || unit === 'months' || (unit === 'weeks' && amount >= 4)) {
      return [
        { key: 'month', label: 'By Month' },
        { key: 'week', label: 'By Week' },
      ];
    }
    if (unit === 'weeks' && amount > 1) {
      return [
        { key: 'week', label: 'By Week' },
        { key: 'day', label: 'By Day' },
      ];
    }
    return [
      { key: 'day', label: 'By Day' },
      { key: 'week', label: 'By Week' },
    ];
  }, [preset, unit, amount]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* 1. Header Toolbar with Flexible Time Horizon Controls */}
      <Card
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3,
          borderRadius: 2.5,
          border: `1px solid ${dzfColors.surfaces.border}`,
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'flex-start', lg: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ActivityIcon size={20} color={dzfColors.maroon[900]} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                Borrowing Statistics & Loan Analytics
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>
              Continuous multi-period borrowing tracking, catalog demand distributions, and patron readership patterns.
            </Typography>
            {formattedDateRange && (
              <Typography variant="caption" sx={{ color: dzfColors.gold[700], fontWeight: 700, mt: 0.5, display: 'inline-block' }}>
                Window: {formattedDateRange}
              </Typography>
            )}
          </Box>

          {/* Time Horizon Toolbar */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1.5,
              width: { xs: '100%', lg: 'auto' },
            }}
          >
            {/* Quick Presets */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {(['1w', '2w', '1m', '3m', '6m', 'all'] as PresetKey[]).map((key) => {
                const labels: Record<string, string> = {
                  '1w': '1 Wk',
                  '2w': '2 Wks',
                  '1m': '1 Mo',
                  '3m': '3 Mos',
                  '6m': '6 Mos',
                  all: 'All Time',
                };
                const isSelected = preset === key;
                return (
                  <Chip
                    key={key}
                    label={labels[key]}
                    size="small"
                    clickable
                    onClick={() => handleSelectPreset(key)}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      borderRadius: 1.5,
                      backgroundColor: isSelected ? dzfColors.maroon[900] : '#f1f4f8',
                      color: isSelected ? '#ffffff' : dzfColors.navy[900],
                      '&:hover': {
                        backgroundColor: isSelected ? dzfColors.maroon[700] : '#e2e7ef',
                      },
                    }}
                  />
                );
              })}
            </Box>

            {/* Unconstrained Custom Amount & Unit Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                type="number"
                value={amount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (Number.isFinite(val) && val > 0) {
                    setAmount(val);
                    setPreset('custom');
                    setGranularity('auto');
                  }
                }}
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: 99,
                    style: { width: 44, textAlign: 'center', padding: '6px 8px', fontWeight: 700 },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    backgroundColor: '#fafbfc',
                  },
                }}
              />
              <TextField
                select
                size="small"
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value as 'weeks' | 'months');
                  setPreset('custom');
                  setGranularity('auto');
                }}
                sx={{
                  minWidth: 95,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    backgroundColor: '#fafbfc',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                  },
                }}
              >
                <MenuItem value="weeks">Weeks</MenuItem>
                <MenuItem value="months">Months</MenuItem>
              </TextField>

              <DZFButton
                variant="secondary"
                size="small"
                onClick={fetchAnalytics}
                loading={loading}
                startIcon={<RefreshIcon size={16} />}
                sx={{ minWidth: 38, px: 1 }}
              >
                Refresh
              </DZFButton>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Error state */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <DZFButton size="small" variant="secondary" onClick={fetchAnalytics}>
              Retry
            </DZFButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={38} sx={{ color: dzfColors.maroon[900], mb: 2 }} />
          <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 600 }}>
            Compiling borrowing analytics across library records...
          </Typography>
        </Box>
      )}

      {/* Loaded State */}
      {data && (
        <>
          {/* 2. 5 KPI Summary Stat Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <DZFStatCard
                title="Loans Issued"
                value={data.summary.totalCheckouts}
                subtitle="Books checked out"
                icon={<BookIcon size={22} color={dzfColors.navy[700]} />}
                accentColor="navy"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <DZFStatCard
                title="Returns Processed"
                value={data.summary.totalReturns}
                subtitle="Shelved back"
                icon={<CheckCircleIcon size={22} color={dzfColors.status.success.text} />}
                accentColor="success"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <DZFStatCard
                title="On-Time Rate"
                value={`${data.summary.onTimeRate}%`}
                subtitle={`${data.summary.onTimeReturns} returned on time`}
                icon={<ClockIcon size={22} color={dzfColors.gold[700]} />}
                accentColor="gold"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <DZFStatCard
                title="Delinquency Rate"
                value={`${data.summary.delinquencyRate}%`}
                subtitle={`${data.summary.activeOverdues} active overdue`}
                icon={<AlertTriangleIcon size={22} color={data.summary.activeOverdues > 0 ? dzfColors.maroon[900] : dzfColors.status.success.text} />}
                accentColor={data.summary.activeOverdues > 0 ? 'maroon' : 'success'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <DZFStatCard
                title="Avg Loan Duration"
                value={`${data.summary.averageLoanDays}d`}
                subtitle="Average days borrowed"
                icon={<CalendarIcon size={22} color={dzfColors.navy[500]} />}
                accentColor="navy"
              />
            </Grid>
          </Grid>

          {/* Empty state when zero checkouts & returns */}
          {data.summary.totalCheckouts === 0 && data.summary.totalReturns === 0 && (
            <Card sx={{ p: 4, mb: 3, borderRadius: 2.5, border: `1px solid ${dzfColors.surfaces.border}` }}>
              <DZFEmptyState
                icon={<BookIcon size={44} color={dzfColors.surfaces.textMuted} />}
                title="No Borrowing Activity In This Period"
                description="No books were checked out or returned during the selected timeframe. Try expanding the time horizon or choosing a wider preset."
              />
            </Card>
          )}

          {/* 3. Chronological Borrowing & Return Volume Trend Stream */}
          {data.trends.length > 0 && (
            <Card
              sx={{
                p: { xs: 2, md: 2.5 },
                mb: 3,
                borderRadius: 2.5,
                border: `1px solid ${dzfColors.surfaces.border}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      Circulation Activity Trend
                    </Typography>
                    <DZFBadge
                      variant="info"
                      size="small"
                      label={`${data.trends.length} ${activeGranularity === 'day' ? 'Days' : activeGranularity === 'week' ? 'Weeks' : 'Months'}`}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                    Chronological distribution of loans issued vs. returns completed across all constituent {activeGranularity}s
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {/* Granularity Switcher Chips */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, backgroundColor: '#f1f4f8', p: 0.4, borderRadius: 1.8 }}>
                    {granularityOptions.map((opt) => {
                      const isSelected = activeGranularity === opt.key;
                      return (
                        <Chip
                          key={opt.key}
                          label={opt.label}
                          size="small"
                          clickable
                          onClick={() => setGranularity(opt.key)}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            borderRadius: 1.4,
                            height: 24,
                            backgroundColor: isSelected ? dzfColors.navy[900] : 'transparent',
                            color: isSelected ? '#ffffff' : dzfColors.navy[700],
                            boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                            '&:hover': {
                              backgroundColor: isSelected ? dzfColors.navy[700] : '#e2e7ef',
                            },
                          }}
                        />
                      );
                    })}
                  </Box>

                  {/* Legend */}
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: 0.5, backgroundColor: dzfColors.navy[700] }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.surfaces.textSecondary }}>
                        Checkouts
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: 0.5, backgroundColor: dzfColors.status.success.button }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.surfaces.textSecondary }}>
                        Returns
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Horizontal Bars Container */}
              <Box sx={{ overflowX: 'auto', pt: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 420 }}>
                  {data.trends.map((point) => {
                    const checkoutPct = Math.round((point.checkouts / maxTrendVolume) * 100);
                    const returnPct = Math.round((point.returns / maxTrendVolume) * 100);
                    return (
                      <Box key={point.dateKey}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], width: 130 }}>
                            {point.label}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Typography variant="caption" sx={{ color: dzfColors.navy[700], fontWeight: 700 }}>
                              {point.checkouts} loans
                            </Typography>
                            <Typography variant="caption" sx={{ color: dzfColors.status.success.text, fontWeight: 700 }}>
                              {point.returns} returns
                            </Typography>
                          </Box>
                        </Box>

                        {/* Comparative Stacked Visual Bars */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Tooltip title={`${point.checkouts} loans issued`} arrow>
                            <Box sx={{ width: '100%', height: 10, borderRadius: 1, backgroundColor: '#f1f4f8', overflow: 'hidden' }}>
                              <Box
                                sx={{
                                  width: `${checkoutPct}%`,
                                  minWidth: point.checkouts > 0 ? 6 : 0,
                                  height: '100%',
                                  backgroundColor: dzfColors.navy[700],
                                  borderRadius: 1,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </Box>
                          </Tooltip>
                          <Tooltip title={`${point.returns} returns processed`} arrow>
                            <Box sx={{ width: '100%', height: 8, borderRadius: 1, backgroundColor: '#f1f4f8', overflow: 'hidden' }}>
                              <Box
                                sx={{
                                  width: `${returnPct}%`,
                                  minWidth: point.returns > 0 ? 6 : 0,
                                  height: '100%',
                                  backgroundColor: dzfColors.status.success.button,
                                  borderRadius: 1,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Card>
          )}

          {/* 4. Two-Column Intelligence Grid: Top Books & Category/Gamification */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Column 1: Top Borrowed Monographs Leaderboard */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card
                sx={{
                  p: { xs: 2, md: 2.5 },
                  height: '100%',
                  borderRadius: 2.5,
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                      Top Borrowed Books
                    </Typography>
                    <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                      Most circulated monographs and shelf availability in this period
                    </Typography>
                  </Box>
                  <AwardIcon size={20} color={dzfColors.gold[700]} />
                </Box>

                {data.topBooks.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>
                      No book checkouts recorded in this time range.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 800, color: dzfColors.surfaces.textSecondary, fontSize: '0.75rem', py: 1 } }}>
                          <TableCell sx={{ width: 40 }}>#</TableCell>
                          <TableCell>Monograph</TableCell>
                          <TableCell>Classification</TableCell>
                          <TableCell align="center">Loans</TableCell>
                          <TableCell align="right">Availability</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.topBooks.map((book, idx) => (
                          <TableRow key={book.barcode || idx} hover sx={{ '& td': { py: 1.2 } }}>
                            <TableCell sx={{ fontWeight: 800, color: idx < 3 ? dzfColors.gold[700] : dzfColors.surfaces.textMuted }}>
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900], lineHeight: 1.2 }}>
                                {book.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                                {book.author}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <DZFBadge
                                label={book.classification || 'General'}
                                variant="info"
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${book.checkoutCount}x`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  backgroundColor: dzfColors.navy[50],
                                  color: dzfColors.navy[900],
                                  height: 22,
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" sx={{ fontWeight: 700, color: book.copiesAvailable > 0 ? dzfColors.status.success.text : dzfColors.maroon[900] }}>
                                {book.copiesAvailable} / {book.copiesTotal} on shelf
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Grid>

            {/* Column 2: Dewey Decimal Categories & Gamification Distribution */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Dewey Decimal Classification Breakdown */}
                <Card
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 2.5,
                    border: `1px solid ${dzfColors.surfaces.border}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 0.5 }}>
                    Dewey Decimal Subject Spread
                  </Typography>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block', mb: 2 }}>
                    Proportion of borrowings across academic disciplines
                  </Typography>

                  {data.deweyCategories.length === 0 ? (
                    <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, py: 2 }}>
                      No subject data available for this range.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                      {data.deweyCategories.slice(0, 6).map((cat) => (
                        <Box key={cat.deweyClass}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                              {cat.deweyClass} – {cat.label}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: dzfColors.navy[700] }}>
                              {cat.count} ({cat.percentage}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={cat.percentage}
                            sx={{
                              height: 6,
                              borderRadius: 1,
                              backgroundColor: '#f1f4f8',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: dzfColors.maroon[700],
                                borderRadius: 1,
                              },
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Card>

                {/* Gamified Timely Return Points Breakdown */}
                <Card
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 2.5,
                    border: `1px solid ${dzfColors.surfaces.border}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 0.5 }}>
                    Return Gamification Points
                  </Typography>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block', mb: 2 }}>
                    Student reward points credited upon book return check-in
                  </Typography>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: '#f4fbf6',
                          border: `1px solid ${dzfColors.status.success.bg}`,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.status.success.text }}>
                          {data.gamificationPoints.onTime3Pts}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.status.success.text, display: 'block' }}>
                          +3 Pts (On-Time)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: '#fefbf3',
                          border: `1px solid ${dzfColors.gold[100]}`,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.gold[700] }}>
                          {data.gamificationPoints.grace1Pt}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.gold[700], display: 'block' }}>
                          +1 Pt (Grace)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: '#fdf3f3',
                          border: `1px solid ${dzfColors.status.error.bg}`,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.maroon[900] }}>
                          {data.gamificationPoints.overdue0Pts}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.maroon[900], display: 'block' }}>
                          0 Pts (Late)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Box>
            </Grid>
          </Grid>

          {/* 5. Patron Demographics & Grade-Level Borrowing Distribution */}
          <Card
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 2.5,
              border: `1px solid ${dzfColors.surfaces.border}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <UsersIcon size={20} color={dzfColors.navy[700]} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
                  Patron Demographic Borrowing Spread
                </Typography>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                  Distribution of circulation loans by patron membership category and student academic grade levels
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Category Breakdown */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 1.5 }}>
                  Patron Membership Groups
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {data.patronDemographics.byType.map((item) => (
                    <Box key={item.type}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.surfaces.textPrimary }}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: dzfColors.navy[700] }}>
                          {item.count} loans ({item.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.percentage}
                        sx={{
                          height: 6,
                          borderRadius: 1,
                          backgroundColor: '#f1f4f8',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: dzfColors.navy[700],
                            borderRadius: 1,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* Grade-Level Breakdown */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 1.5 }}>
                  Student Grade Classes (Top Circulating)
                </Typography>
                {data.patronDemographics.byGradeLevel.length === 0 ? (
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                    No student grade records tagged in this borrowing period.
                  </Typography>
                ) : (
                  <Grid container spacing={1}>
                    {data.patronDemographics.byGradeLevel.map((grade) => (
                      <Grid size={{ xs: 6, sm: 4 }} key={grade.classGrade}>
                        <Box
                          sx={{
                            p: 1.2,
                            borderRadius: 1.5,
                            border: `1px solid ${dzfColors.surfaces.border}`,
                            backgroundColor: '#fafbfc',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[900], display: 'block' }}>
                            {grade.classGrade}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: dzfColors.gold[700], lineHeight: 1.2 }}>
                            {grade.count}
                          </Typography>
                          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontSize: '0.6875rem' }}>
                            books borrowed
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Card>
        </>
      )}
    </Box>
  );
}
