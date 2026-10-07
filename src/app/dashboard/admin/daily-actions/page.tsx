import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { listDailyActions, getCurrentNigeriaDateString } from '@/lib/audit/dailyActionService';
import DailyActionsClient from '@/components/admin/DailyActionsClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { AlertTriangleIcon } from '@/components/ui/DZFIcons';

export const metadata = {
  title: 'Daily Actions Audit | DZF-ILAS',
  description: 'Live programmatic staff action audit stream and same-day reversible undo console.',
};

export const dynamic = 'force-dynamic';

export default async function DailyActionsPage() {
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
              borderRadius: '50%',
              bgcolor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              color: dzfColors.maroon[700],
            }}
          >
            <AlertTriangleIcon size={32} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1 }}>
            Access Restricted
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            The Staff Daily Actions Stream and Reversible Undo Console requires Administrative or Leadership credentials.
          </Typography>
          <DZFButton href="/dashboard" variant="primary">
            Return to Dashboard
          </DZFButton>
        </Card>
      </Box>
    );
  }

  const today = getCurrentNigeriaDateString();
  const initialResult = await listDailyActions({
    date: today,
    limit: 25,
    skip: 0,
    currentUserRole: user.role,
  });

  return (
    <DailyActionsClient
      user={user}
      initialActions={initialResult.actions}
      initialTotal={initialResult.total}
      initialDate={today}
    />
  );
}
