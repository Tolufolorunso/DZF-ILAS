'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import { dzfColors } from '@/theme/colors';
import {
  AppShell,
  PageHeader,
  DZFStatCard,
  CheckCircleIcon,
  BookIcon,
  UsersIcon,
  TrophyIcon,
  BarcodeIcon,
  ClockIcon,
} from '@/components';
import { ITokenPayload } from '@/lib/auth/jwt';
import type {
  AttendanceStatsDTO,
  SessionOption,
} from '@/lib/attendance/service';
import type { IAttendanceDocument } from '@/models/Attendance';
import ScannerInterface from '@/components/attendance/ScannerInterface';
import AttendanceLiveFeed from '@/components/attendance/AttendanceLiveFeed';
import AttendanceHistoryTable from '@/components/attendance/AttendanceHistoryTable';

interface AttendanceClientProps {
  user: ITokenPayload | null;
  initialStats: AttendanceStatsDTO;
  initialSessions: SessionOption[];
  initialLogs: IAttendanceDocument[];
}

export default function AttendanceClient({
  user,
  initialStats,
  initialSessions,
  initialLogs,
}: AttendanceClientProps) {
  const [tab, setTab] = React.useState<number>(0);
  const [stats, setStats] = React.useState<AttendanceStatsDTO>(initialStats);
  const [liveLogs, setLiveLogs] = React.useState<IAttendanceDocument[]>(initialLogs);
  const [logsLoading, setLogsLoading] = React.useState<boolean>(false);
  const [historyRefreshKey, setHistoryRefreshKey] = React.useState<number>(0);

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to refresh attendance stats:', err);
    }
  }, []);

  const refreshLiveFeed = React.useCallback(async () => {
    setLogsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?date=${todayStr}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.attendances) {
          setLiveLogs(data.attendances);
        }
      }
    } catch (err) {
      console.error('Failed to refresh live feed:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleScanSuccess = React.useCallback(
    (newAttendance: IAttendanceDocument) => {
      // Prepend to live stream
      setLiveLogs((prev) => [newAttendance, ...prev]);

      // Optimistically update counts
      setStats((prev) => ({
        ...prev,
        totalToday: prev.totalToday + 1,
        libraryVisitsToday:
          newAttendance.classType === 'library'
            ? prev.libraryVisitsToday + 1
            : prev.libraryVisitsToday,
        academyClassesToday:
          newAttendance.classType !== 'library'
            ? prev.academyClassesToday + 1
            : prev.academyClassesToday,
        totalPointsAwardedToday: prev.totalPointsAwardedToday + (newAttendance.points || 0),
      }));

      // Background re-fetch to ensure exact unique patrons and grouping
      fetchStats();
      setHistoryRefreshKey((k) => k + 1);
    },
    [fetchStats]
  );

  const handleUndo = React.useCallback(
    async (attendanceId: string) => {
      const res = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLiveLogs((prev) => prev.filter((r) => r._id?.toString() !== attendanceId));
        fetchStats();
        setHistoryRefreshKey((k) => k + 1);
      }
    },
    [fetchStats]
  );

  return (
    <AppShell activeNavId="attendance" user={user}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <PageHeader
          title="Barcode Attendance & Class Session Tracking"
          subtitle="High-speed barcode scanner desk for daily physical library visitors and digital academy cohort sessions."
          kicker="STUDENT & PATRON ENGAGEMENT"
        />

        {/* 5 Top Summary Metric Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <DZFStatCard
              title="Today's Check-ins"
              value={stats.totalToday}
              subtitle="Total verified entries"
              icon={<CheckCircleIcon size={22} />}
              accentColor="navy"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <DZFStatCard
              title="Library Reading"
              value={stats.libraryVisitsToday}
              subtitle="Reading room patrons"
              icon={<BookIcon size={22} />}
              accentColor="maroon"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <DZFStatCard
              title="Academy Classes"
              value={stats.academyClassesToday}
              subtitle="Cohort & workshop attendance"
              icon={<UsersIcon size={22} />}
              accentColor="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <DZFStatCard
              title="Unique Patrons"
              value={stats.uniquePatronsToday}
              subtitle="Distinct members today"
              icon={<UsersIcon size={22} />}
              accentColor="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <DZFStatCard
              title="Points Awarded"
              value={`+${stats.totalPointsAwardedToday}`}
              subtitle="Credited to monthly rank"
              icon={<TrophyIcon size={22} />}
              accentColor="gold"
            />
          </Grid>
        </Grid>

        {/* Workspace Navigation Tabs */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            sx={{
              px: 2,
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '0.925rem',
                textTransform: 'none',
                py: 2,
                color: dzfColors.surfaces.textSecondary,
                '&.Mui-selected': {
                  color: dzfColors.maroon[900],
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: dzfColors.maroon[900],
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<BarcodeIcon size={18} />}
              iconPosition="start"
              label="Live Scanner & Feed"
            />
            <Tab
              icon={<ClockIcon size={18} />}
              iconPosition="start"
              label="Audit History Ledger"
            />
          </Tabs>
        </Card>

        {/* Tab 0: Live Scanner & Feed */}
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <ScannerInterface
                sessions={initialSessions}
                onScanSuccess={handleScanSuccess}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <AttendanceLiveFeed
                records={liveLogs}
                loading={logsLoading}
                onUndo={handleUndo}
                onRefresh={refreshLiveFeed}
              />
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Historical Audit Ledger */}
        {tab === 1 && (
          <AttendanceHistoryTable
            onDataChanged={fetchStats}
            refreshTrigger={historyRefreshKey}
          />
        )}
      </Box>
    </AppShell>
  );
}
