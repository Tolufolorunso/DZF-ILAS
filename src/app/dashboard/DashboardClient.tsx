'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import { dzfColors } from '@/theme/colors';
import { AppShell } from '@/components/layout/AppShell';
import DZFStatCard from '@/components/ui/DZFStatCard';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import {
  UsersIcon,
  BookIcon,
  ClockIcon,
  BarcodeIcon,
  CheckIcon,
} from '@/components/ui/DZFIcons';
import type { ITokenPayload } from '@/lib/auth/jwt';

interface DashboardClientProps {
  user: ITokenPayload;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [activeNav, setActiveNav] = React.useState('dashboard');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/auth/login');
      router.refresh();
    }
  };

  const formattedRole = user.role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <AppShell
      activeNavId={activeNav}
      onNavigate={setActiveNav}
      staffName={user.name || user.username}
      staffRole={formattedRole}
      onLogout={handleLogout}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Welcome Banner */}
        <Card
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 4,
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${dzfColors.navy[900]} 0%, ${dzfColors.navy[700]} 60%, ${dzfColors.maroon[900]} 100%)`,
            color: '#ffffff',
            border: `1px solid ${dzfColors.gold[400]}40`,
            boxShadow: '0 12px 32px rgba(23, 50, 77, 0.18)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <DZFBadge
                variant="warning"
                size="small"
                label="Academic Session 2026/2027"
              />
              <DZFBadge
                variant="default"
                size="small"
                label={`Role: ${formattedRole}`}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Welcome back, {user.name || user.username}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.85)',
                maxWidth: 680,
                fontSize: '0.9375rem',
                lineHeight: 1.6,
              }}
            >
              Dzuels Integrated Library & Learning System central workspace. Circulation
              desks, barcode attendance scanners, and digital academy cohorts are operating normally.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
              <DZFButton
                variant="primary"
                size="medium"
                startIcon={<BarcodeIcon size={18} />}
                onClick={() => setActiveNav('attendance')}
              >
                Launch Barcode Scanner
              </DZFButton>
              <DZFButton
                variant="secondary"
                size="medium"
                startIcon={<BookIcon size={18} />}
                onClick={() => setActiveNav('catalog')}
              >
                Catalog Repository
              </DZFButton>
            </Box>
          </Box>
        </Card>

        {/* Operational Statistics */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: dzfColors.navy[900],
            mb: 2,
            letterSpacing: '-0.01em',
          }}
        >
          Library & Academy Vital Statistics
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DZFStatCard
              title="Registered Patrons"
              value="674"
              subtitle="Active Patrons"
              trend={{ value: "+12 this month", positive: true }}
              accentColor="navy"
              icon={<UsersIcon size={24} color={dzfColors.navy[700]} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DZFStatCard
              title="Cataloged Volumes"
              value="2,342"
              subtitle="Dewey System Active"
              trend={{ value: "+45 new acquisitions", positive: true }}
              accentColor="maroon"
              icon={<BookIcon size={24} color={dzfColors.maroon[700]} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DZFStatCard
              title="Active Loans"
              value="148"
              subtitle="Circulating Copies"
              trend={{ value: "6 due today", neutral: true }}
              accentColor="gold"
              icon={<ClockIcon size={24} color={dzfColors.gold[500]} />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DZFStatCard
              title="Today's Attendance"
              value="56"
              subtitle="High-Speed Scanner"
              trend={{ value: "+18% vs last week", positive: true }}
              accentColor="success"
              icon={<BarcodeIcon size={24} color={dzfColors.status.success.badge} />}
            />
          </Grid>
        </Grid>

        {/* System & Session Health Card */}
        <Card
          sx={{
            p: 3,
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: `1px solid ${dzfColors.surfaces.border}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: dzfColors.status.success.badge,
                  boxShadow: `0 0 0 3px ${dzfColors.status.success.bg}`,
                }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
                  Dual-Mode Authentication Active
                </Typography>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                  Staff session verified via Edge JWT & HTTP-only secure cookie
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon size={16} color={dzfColors.status.success.badge} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
                Authenticated as: {user.username} ({user.role})
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>
    </AppShell>
  );
}
