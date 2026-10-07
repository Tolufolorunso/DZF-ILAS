import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import {
  getSystemSettings,
  getSystemStats,
  listRequisitions,
  listTasks,
  listEvents,
  queryAuditLogs,
} from '@/lib/admin/service';
import AdminControlCenterClient from './AdminControlCenterClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { AlertTriangleIcon } from '@/components/ui/DZFIcons';

export const metadata = {
  title: 'Admin Control Center | DZF-ILAS',
  description: 'Executive administration, circulation overrides, requisition review, and system audit logs.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Enforce Administrator RBAC
  if (!isAdmin(user.role)) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f8fafc',
          p: 3,
        }}
      >
        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            p: 4,
            textAlign: 'center',
            borderRadius: '20px',
            border: `1px solid ${dzfColors.maroon[500]}30`,
            boxShadow: '0 12px 32px rgba(111, 17, 17, 0.08)',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              bgcolor: `${dzfColors.maroon[500]}15`,
              color: dzfColors.maroon[700],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
            }}
          >
            <AlertTriangleIcon size={36} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1 }}>
            Access Restricted
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
            The Admin Control Center and executive override utilities are restricted to Foundation Super
            Administrators and Assistant Administrators. Your current role is <strong>{user.role}</strong>.
          </Typography>

          <DZFButton href="/dashboard" variant="primary" fullWidth>
            Return to Staff Dashboard
          </DZFButton>
        </Card>
      </Box>
    );
  }

  // Load all operational collections concurrently
  const [settings, stats, requisitions, tasks, events, auditData] = await Promise.all([
    getSystemSettings(),
    getSystemStats(),
    listRequisitions({ limit: 50 }),
    listTasks({ limit: 50 }),
    listEvents({ limit: 50 }),
    queryAuditLogs({ limit: 15 }),
  ]);

  return (
    <AdminControlCenterClient
      user={user}
      initialSettings={settings}
      initialStats={stats}
      initialRequisitions={requisitions}
      initialTasks={tasks}
      initialEvents={events}
      initialAuditLogs={auditData.logs}
    />
  );
}
