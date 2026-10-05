'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import { dzfColors } from '@/theme/colors';
import { ITokenPayload } from '@/lib/auth/jwt';
import {
  MonthlyLeaderboardResult,
  InactivePatronResult,
} from '@/lib/activity/service';
import { AppShell } from '@/components/layout/AppShell';
import { DZFStatCard } from '@/components/ui/DZFStatCard';
import {
  TrophyIcon,
  UsersIcon,
  BookIcon,
  RefreshIcon,
} from '@/components/ui/DZFIcons';
import { LeaderboardPodium } from '@/components/leaderboard/LeaderboardPodium';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { InactivePatronsTable } from '@/components/leaderboard/InactivePatronsTable';

interface LeaderboardClientProps {
  user: ITokenPayload;
  initialYear: number;
  initialMonth: number;
  initialLeaderboard: MonthlyLeaderboardResult;
  initialInactive: {
    inactivePatrons: InactivePatronResult[];
    total: number;
  };
}

const MONTH_NAMES = [
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

export function LeaderboardClient({
  user,
  initialYear,
  initialMonth,
  initialLeaderboard,
  initialInactive,
}: LeaderboardClientProps) {
  const [selectedYear, setSelectedYear] = React.useState(initialYear);
  const [selectedMonth, setSelectedMonth] = React.useState(initialMonth);
  const [leaderboardData, setLeaderboardData] = React.useState<MonthlyLeaderboardResult>(initialLeaderboard);
  const [inactiveData, setInactiveData] = React.useState(initialInactive);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  // Recalculate dialog state
  const [recalcDialogOpen, setRecalcDialogOpen] = React.useState(false);
  const [recalculating, setRecalculating] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Month selector options (past 18 months from now)
  const monthOptions = React.useMemo(() => {
    const list: Array<{ label: string; year: number; month: number }> = [];
    const now = new Date();
    for (let i = 0; i < 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      list.push({
        label: `${MONTH_NAMES[m - 1]} ${y}`,
        year: y,
        month: m,
      });
    }
    return list;
  }, []);

  const currentMonthYearName = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const fetchMonthData = React.useCallback(
    async (year: number, month: number) => {
      setLoading(true);
      setFeedback(null);
      try {
        const [resLb, resInact] = await Promise.all([
          fetch(`/api/leaderboard?year=${year}&month=${month}`),
          fetch(`/api/leaderboard/inactive?year=${year}&month=${month}&limit=50`),
        ]);

        const lbJson = await resLb.json();
        const inactJson = await resInact.json();

        if (lbJson.success && lbJson.data) {
          setLeaderboardData(lbJson.data);
        }
        if (inactJson.success && inactJson.data) {
          setInactiveData(inactJson.data);
        }
      } catch (err) {
        console.error('Failed to load month data:', err);
        setFeedback({
          type: 'error',
          message: 'Failed to refresh leaderboard for selected month.',
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleMonthSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [yStr, mStr] = event.target.value.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    setSelectedYear(y);
    setSelectedMonth(m);
    fetchMonthData(y, m);
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/leaderboard/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, month: selectedMonth }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Recalculation failed');
      }

      setFeedback({
        type: 'success',
        message: data.message || `Successfully recalculated scores for ${currentMonthYearName}.`,
      });
      setRecalcDialogOpen(false);
      // Refresh current month
      await fetchMonthData(selectedYear, selectedMonth);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error recalculating scores.',
      });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <AppShell user={user} activeNavId="analytics">
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3.5 } }}>
        {/* Workspace Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: dzfColors.navy[700] }}>
                Monthly Activity Leaderboard
              </Typography>
              <Chip
                label="Gamified Rollup"
                size="small"
                sx={{
                  bgcolor: dzfColors.maroon[50],
                  color: dzfColors.maroon[900],
                  fontWeight: 700,
                  border: `1px solid ${dzfColors.maroon[200]}`,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary }}>
              Tracking monthly reading volume, class attendance, and book summary points across all library patrons.
            </Typography>
          </Box>

          {/* Action Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
            <TextField
              select
              size="small"
              value={`${selectedYear}-${selectedMonth}`}
              onChange={handleMonthSelect}
              sx={{ minWidth: 200, bgcolor: '#ffffff', borderRadius: 2 }}
            >
              {monthOptions.map((opt) => (
                <MenuItem key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              size="small"
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon size={16} />}
              onClick={() => fetchMonthData(selectedYear, selectedMonth)}
              disabled={loading}
              sx={{
                borderRadius: 2,
                borderColor: dzfColors.surfaces.border,
                color: dzfColors.navy[700],
                fontWeight: 600,
                textTransform: 'none',
                height: 40,
                '&:hover': {
                  borderColor: dzfColors.navy[700],
                  bgcolor: 'rgba(23, 50, 77, 0.04)',
                },
              }}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={() => setRecalcDialogOpen(true)}
              sx={{
                borderRadius: 2,
                bgcolor: dzfColors.maroon[900],
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                height: 40,
                px: 2,
                '&:hover': {
                  bgcolor: dzfColors.maroon[700],
                },
              }}
            >
              Recalculate Scores
            </Button>
          </Box>
        </Box>

        {/* Global Feedback Banner */}
        {feedback && (
          <Alert
            severity={feedback.type}
            onClose={() => setFeedback(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Overview Stat Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2,
            mb: 4,
          }}
        >
          <DZFStatCard
            title="Top Reader of the Month"
            value={leaderboardData.stats?.topReader?.score ? `${leaderboardData.stats.topReader.score.toLocaleString()} pts` : '—'}
            subtitle={leaderboardData.stats?.topReader?.name || 'No readers yet'}
            color="maroon"
            icon={<TrophyIcon size={24} />}
          />
          <DZFStatCard
            title="Active Readers This Month"
            value={leaderboardData.stats?.activePatronsCount || 0}
            subtitle={`In ${currentMonthYearName}`}
            color="navy"
            icon={<UsersIcon size={24} />}
          />
          <DZFStatCard
            title="Total Points Generated"
            value={`+${(leaderboardData.stats?.totalPointsAwarded || 0).toLocaleString()} pts`}
            subtitle="Books, attendance & summaries"
            color="gold"
            icon={<TrophyIcon size={24} />}
          />
          <DZFStatCard
            title="Books Returned"
            value={leaderboardData.stats?.totalBooksCirculated || 0}
            subtitle={`${leaderboardData.stats?.totalSummariesApproved || 0} summaries approved`}
            color="success"
            icon={<BookIcon size={24} />}
          />
        </Box>

        {/* Celebratory 3-Step Podium */}
        <LeaderboardPodium
          top3={leaderboardData.top3}
          monthYearName={currentMonthYearName}
        />

        {/* Workspace Tabs */}
        <Box sx={{ borderBottom: `1px solid ${dzfColors.surfaces.border}`, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: dzfColors.maroon[900],
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Leaderboard Rankings</span>
                  <Chip
                    size="small"
                    label={leaderboardData.total}
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: activeTab === 0 ? dzfColors.maroon[900] : dzfColors.surfaces.canvas,
                      color: activeTab === 0 ? '#ffffff' : dzfColors.surfaces.textSecondary,
                    }}
                  />
                </Box>
              }
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: activeTab === 0 ? dzfColors.maroon[900] : dzfColors.surfaces.textSecondary,
              }}
            />

            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Inactive Patrons Outreach</span>
                  <Chip
                    size="small"
                    label={inactiveData.total}
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: activeTab === 1 ? dzfColors.status.error.badge : dzfColors.surfaces.canvas,
                      color: activeTab === 1 ? '#ffffff' : dzfColors.surfaces.textSecondary,
                    }}
                  />
                </Box>
              }
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: activeTab === 1 ? dzfColors.status.error.badge : dzfColors.surfaces.textSecondary,
              }}
            />
          </Tabs>
        </Box>

        {/* Tab 0: Main Leaderboard Table */}
        {activeTab === 0 && (
          <LeaderboardTable
            entries={leaderboardData.leaderboard}
            loading={loading}
            monthYearName={currentMonthYearName}
          />
        )}

        {/* Tab 1: Inactive Patrons Table */}
        {activeTab === 1 && (
          <InactivePatronsTable
            patrons={inactiveData.inactivePatrons}
            loading={loading}
            monthYearName={currentMonthYearName}
          />
        )}

        {/* Recalculate Confirmation Dialog */}
        <Dialog
          open={recalcDialogOpen}
          onClose={() => !recalculating && setRecalcDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: { borderRadius: 3, p: 1 },
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[700] }}>
            Recalculate Monthly Rankings & Scores
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2 }}>
              Are you sure you want to recalculate the leaderboard for{' '}
              <strong>{currentMonthYearName}</strong>?
            </Typography>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              This executes the canonical DZF Foundation scoring formula across all circulation checkouts, returns, class attendance sessions, and approved summaries:
              <Box sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>
                Score = (CheckedOut × 10) + (Returned × 15) + (Classes × 20) + (Summaries × 25) + (Points × 1)
              </Box>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setRecalcDialogOpen(false)}
              disabled={recalculating}
              sx={{ textTransform: 'none', color: dzfColors.surfaces.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleRecalculate}
              disabled={recalculating}
              sx={{
                bgcolor: dzfColors.maroon[900],
                '&:hover': { bgcolor: dzfColors.maroon[700] },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              {recalculating ? <CircularProgress size={20} color="inherit" /> : 'Confirm & Recalculate'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppShell>
  );
}

export default LeaderboardClient;
