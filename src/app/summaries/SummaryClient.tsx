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
  AppShell,
  PageHeader,
  DZFStatCard,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  ActivityIcon,
  DZFButton,
} from '@/components';
import { ITokenPayload } from '@/lib/auth/jwt';
import type { SummaryStatsDTO } from '@/lib/summaries/service';
import {
  ModerationQueue,
  SummaryHistoryTable,
  SubmitSummaryModal,
} from '@/components/summaries';

interface SummaryClientProps {
  user: ITokenPayload | null;
  initialStats: SummaryStatsDTO;
}

export default function SummaryClient({
  user,
  initialStats,
}: SummaryClientProps) {
  const [tab, setTab] = React.useState<number>(0);
  const [stats, setStats] = React.useState<SummaryStatsDTO>(initialStats);
  const [modalOpen, setModalOpen] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await fetch('/api/summaries/stats');
      const data = await res.json();
      if (res.ok && data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to update stats:', err);
    }
  }, []);

  return (
    <AppShell activeNavId="summaries" user={user}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
        {/* Header with quick action */}
        <PageHeader
          title="Book Summary Moderation"
          subtitle="Review student reading comprehension, award gamified literacy points (+2 to +10 Pts), and provide constructive feedback."
          kicker="GAMIFICATION & LITERACY"
          actionSlot={
            <DZFButton
              variant="primary"
              size="medium"
              startIcon={<ActivityIcon size={18} />}
              onClick={() => setModalOpen(true)}
            >
              Submit Paper Summary
            </DZFButton>
          }
        />

        {/* 4 Top Summary Metrics */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DZFStatCard
              title="Pending Review"
              value={stats.pendingCount}
              subtitle="Submissions awaiting scoring"
              icon={<ClockIcon size={24} />}
              accentColor="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DZFStatCard
              title="Approved Summaries"
              value={stats.approvedCount}
              subtitle="Scored & points credited"
              icon={<CheckCircleIcon size={24} />}
              accentColor="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DZFStatCard
              title="Rejected Summaries"
              value={stats.rejectedCount}
              subtitle="Feedback sent for revision"
              icon={<ActivityIcon size={24} />}
              accentColor="default"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DZFStatCard
              title="Points Awarded"
              value={`+${stats.totalPointsAwarded}`}
              subtitle="Credited to patron balances"
              icon={<TrophyIcon size={24} />}
              accentColor="gold"
            />
          </Grid>
        </Grid>

        {/* Navigation Tabs */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${dzfColors.surfaces.border}`,
            bgcolor: dzfColors.surfaces.paper,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            sx={{
              px: 2,
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'none',
                color: dzfColors.surfaces.textSecondary,
                '&.Mui-selected': {
                  color: dzfColors.maroon[800],
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: dzfColors.maroon[800],
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Moderation Queue</span>
                  {stats.pendingCount > 0 && (
                    <Box
                      component="span"
                      sx={{
                        px: 1,
                        py: 0.2,
                        borderRadius: 10,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        bgcolor: dzfColors.status.warning.bg,
                        color: dzfColors.status.warning.text,
                      }}
                    >
                      {stats.pendingCount}
                    </Box>
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>All Submissions & History</span>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                    ({stats.totalSummaries})
                  </Typography>
                </Box>
              }
            />
          </Tabs>
        </Card>

        {/* Tab 0: Moderation Queue */}
        {tab === 0 && (
          <ModerationQueue
            onQueueUpdated={fetchStats}
            onRequestNewSummary={() => setModalOpen(true)}
          />
        )}

        {/* Tab 1: All Submissions & History */}
        {tab === 1 && (
          <SummaryHistoryTable onDataChanged={fetchStats} />
        )}

        {/* Manual Paper Summary Submission Modal */}
        <SubmitSummaryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmitted={() => {
            fetchStats();
            setTab(0); // Switch to moderation queue to see the new item
          }}
        />
      </Box>
    </AppShell>
  );
}
