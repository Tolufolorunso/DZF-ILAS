'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { LayersIcon } from '@/components/ui/DZFIcons';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 540,
          width: '100%',
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${dzfColors.surfaces.border}`,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
          }}
        >
          <LayersIcon size={28} />
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: dzfColors.navy[900],
            mb: 1,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}
        >
          Something Went Wrong
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: dzfColors.surfaces.textMuted, mb: 3, lineHeight: 1.6 }}
        >
          {error.message ||
            'An unexpected error occurred while processing your request. Please try again or return to the home page.'}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <DZFButton variant="primary" onClick={() => reset()}>
            Try Again
          </DZFButton>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <DZFButton variant="secondary">Return Home</DZFButton>
          </Link>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <DZFButton variant="secondary">Go to Dashboard</DZFButton>
          </Link>
        </Box>
      </Card>
    </Box>
  );
}
