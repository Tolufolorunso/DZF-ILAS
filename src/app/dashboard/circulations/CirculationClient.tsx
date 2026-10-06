'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';

import { dzfColors } from '@/theme/colors';
import {
  PageHeader,
  DZFStatCard,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  BookIcon,
  BarcodeIcon,
  UsersIcon,
} from '@/components';
import { ITokenPayload } from '@/lib/auth/jwt';
import {
  ScannerTerminal,
  ActiveLoansTable,
  CirculationHistoryTable,
  HoldsQueueTable,
} from '@/components/circulations';

interface CirculationStats {
  activeLoansCount: number;
  overdueLoansCount: number;
  returnedTodayCount: number;
  monthlyCheckoutsCount: number;
}

interface CirculationClientProps {
  user: ITokenPayload | null;
  initialStats: CirculationStats;
}

export default function CirculationClient({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  user,
  initialStats,
}: CirculationClientProps) {
  const [tab, setTab] = React.useState<number>(0);
  const [stats, setStats] = React.useState<CirculationStats>(initialStats);

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await fetch('/api/circulations/stats');
      const data = await res.json();
      if (res.ok && data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to update stats:', err);
    }
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3.5 } }}>
      {/* Page Header */}
      <PageHeader
        kicker="LIVE SYSTEM"
        title="Circulation & Loan Operations"
        subtitle="Fast barcode scanning terminal for book checkouts, returns, loan renewals, holds reservations, and delinquency tracking."
      />

      {/* 1. Summary Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DZFStatCard
            title="Active Book Loans"
            value={stats.activeLoansCount}
            subtitle="Currently in circulation"
            icon={<BookIcon size={22} color={dzfColors.navy[700]} />}
            accentColor="navy"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DZFStatCard
            title="Overdue Loans"
            value={stats.overdueLoansCount}
            subtitle={stats.overdueLoansCount > 0 ? 'Requires patron follow-up' : 'All loans on time'}
            icon={<AlertTriangleIcon size={22} color={stats.overdueLoansCount > 0 ? dzfColors.maroon[900] : dzfColors.status.success.text} />}
            accentColor={stats.overdueLoansCount > 0 ? 'maroon' : 'success'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DZFStatCard
            title="Returned Today"
            value={stats.returnedTodayCount}
            subtitle="Restocked to shelves"
            icon={<CheckCircleIcon size={22} color={dzfColors.status.success.text} />}
            accentColor="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DZFStatCard
            title="Monthly Checkouts"
            value={stats.monthlyCheckoutsCount}
            subtitle="Current calendar month"
            icon={<ClockIcon size={22} color={dzfColors.gold[700]} />}
            accentColor="gold"
          />
        </Grid>
      </Grid>

      {/* 2. Main Tabbed Navigation */}
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${dzfColors.surfaces.border}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          mb: 3,
          overflow: 'visible',
        }}
      >
        <Box
          sx={{
            borderBottom: `1px solid ${dzfColors.surfaces.border}`,
            backgroundColor: '#fafbfc',
            px: { xs: 1.5, md: 2.5 },
            pt: 1,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, newVal) => setTab(newVal)}
            sx={{
              minHeight: 46,
              '& .MuiTab-root': {
                minHeight: 46,
                fontSize: '0.9375rem',
                fontWeight: 700,
                textTransform: 'none',
                color: dzfColors.surfaces.textSecondary,
                '&.Mui-selected': { color: dzfColors.maroon[900] },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: dzfColors.maroon[900],
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              label="Desk Terminal"
              icon={<BarcodeIcon size={18} />}
              iconPosition="start"
            />
            <Tab
              label={`Active Loans (${stats.activeLoansCount})`}
              icon={<BookIcon size={18} />}
              iconPosition="start"
            />
            <Tab
              label="Circulation History & Logs"
              icon={<ClockIcon size={18} />}
              iconPosition="start"
            />
            <Tab
              label="Holds Queue"
              icon={<UsersIcon size={18} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && (
            <Box>
              <ScannerTerminal onTransactionComplete={fetchStats} />
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5 }}>
                Active Library Loans
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, mb: 3 }}>
                Monitor items currently checked out to patrons, track loan duration, process returns, and grant renewals.
              </Typography>
              <ActiveLoansTable onDataChanged={fetchStats} />
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5 }}>
                Circulation History Audit Log
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, mb: 3 }}>
                Historical record of all library borrowings, check-ins, return dates, competition tags, and timely activity points.
              </Typography>
              <CirculationHistoryTable />
            </Box>
          )}

          {tab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5 }}>
                Book Hold Reservations Queue
              </Typography>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, mb: 3 }}>
                Monitor and manage patron reservation requests for popular or currently checked-out monographs.
              </Typography>
              <HoldsQueueTable onDataChanged={fetchStats} />
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}
