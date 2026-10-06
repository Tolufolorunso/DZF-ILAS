'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { PageSkeleton } from '@/components/ui/DZFSkeletonLoader';
import { dzfColors } from '@/theme/colors';

export default function GlobalLoading() {
  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Top slim animated loading bar in Academic Gold and Brand Maroon */}
      <LinearProgress
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: 3,
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            background: `linear-gradient(90deg, ${dzfColors.maroon[900]}, ${dzfColors.gold[400]})`,
          },
        }}
      />
      {/* Complete structured page skeleton matching DZF workspace layout */}
      <PageSkeleton hasStats={true} contentType="table" />
    </Box>
  );
}
