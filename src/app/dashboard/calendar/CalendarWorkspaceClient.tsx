'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ITokenPayload } from '@/lib/auth/jwt';
import { IEventItemDTO } from '@/lib/admin/types';
import { AppShell } from '@/components/layout/AppShell';
import OperationalCalendar from '@/components/admin/OperationalCalendar';
import { dzfColors } from '@/theme/colors';

interface CalendarWorkspaceClientProps {
  user: ITokenPayload;
  initialEvents: IEventItemDTO[];
}

export default function CalendarWorkspaceClient({
  user,
  initialEvents,
}: CalendarWorkspaceClientProps) {
  return (
    <AppShell user={user} activeNavId="calendar">
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3.5 } }}>
        {/* Workspace Breadcrumb & Header Title */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Workspace
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              /
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.navy[900], fontWeight: 700 }}>
              Operational Calendar
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: dzfColors.navy[900], letterSpacing: '-0.5px' }}>
            Institutional Operational Calendar
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Official foundation schedule, multi-stage competition milestones, workshops, assemblies, and term timelines.
          </Typography>
        </Box>

        {/* Read-Only Operational Calendar Matrix & Agenda Stream */}
        <OperationalCalendar initialEvents={initialEvents} readOnly={true} />
      </Box>
    </AppShell>
  );
}
