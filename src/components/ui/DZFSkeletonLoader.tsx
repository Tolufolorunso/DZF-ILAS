'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import { dzfColors } from '@/theme/colors';

/**
 * Standard DZF branded Skeleton with smooth wave animation and semantic tones
 */
export function DZFSkeleton({
  sx,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      animation="wave"
      sx={{
        backgroundColor: 'rgba(23, 50, 77, 0.06)',
        borderRadius: 1.5,
        ...sx,
      }}
      {...props}
    />
  );
}

/**
 * Row of stat / metric summary card skeletons
 */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 12 / count }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${dzfColors.surfaces.border}`,
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <DZFSkeleton variant="text" width="50%" height={24} />
              <DZFSkeleton variant="circular" width={38} height={38} />
            </Box>
            <DZFSkeleton variant="text" width="35%" height={40} sx={{ mb: 0.5 }} />
            <DZFSkeleton variant="text" width="60%" height={18} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Modern data table skeleton with search bar and alternating row lines
 */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${dzfColors.surfaces.border}`,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Top search & filter bar skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <DZFSkeleton variant="rounded" width="40%" height={44} sx={{ borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <DZFSkeleton variant="rounded" width={90} height={44} sx={{ borderRadius: 2 }} />
          <DZFSkeleton variant="rounded" width={110} height={44} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>

      {/* Table header row */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          pb: 1.5,
          borderBottom: `2px solid ${dzfColors.surfaces.border}`,
          mb: 1.5,
        }}
      >
        {Array.from({ length: cols }).map((_, c) => (
          <Box key={c} sx={{ flex: c === 0 ? 1.5 : 1 }}>
            <DZFSkeleton variant="text" height={22} width="70%" />
          </Box>
        ))}
      </Box>

      {/* Table body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <Box
          key={r}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 2,
            borderBottom: `1px solid ${dzfColors.surfaces.border}`,
            backgroundColor: r % 2 === 1 ? 'rgba(248, 250, 252, 0.6)' : 'transparent',
            px: 1,
            borderRadius: 1,
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Box key={c} sx={{ flex: c === 0 ? 1.5 : 1 }}>
              {c === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DZFSkeleton variant="circular" width={32} height={32} />
                  <DZFSkeleton variant="text" width="75%" height={20} />
                </Box>
              ) : c === cols - 1 ? (
                <DZFSkeleton variant="rounded" width={70} height={26} sx={{ borderRadius: 4 }} />
              ) : (
                <DZFSkeleton variant="text" width={c % 2 === 0 ? '60%' : '80%'} height={20} />
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Card>
  );
}

/**
 * Grid of card skeletons (useful for articles, books, cohorts)
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${dzfColors.surfaces.border}`,
              backgroundColor: '#ffffff',
            }}
          >
            <DZFSkeleton variant="rectangular" height={160} sx={{ width: '100%' }} />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <DZFSkeleton variant="rounded" width={60} height={22} sx={{ borderRadius: 4 }} />
                <DZFSkeleton variant="rounded" width={80} height={22} sx={{ borderRadius: 4 }} />
              </Box>
              <DZFSkeleton variant="text" height={28} width="90%" sx={{ mb: 1 }} />
              <DZFSkeleton variant="text" height={18} width="100%" />
              <DZFSkeleton variant="text" height={18} width="70%" sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                <DZFSkeleton variant="text" width="40%" height={16} />
                <DZFSkeleton variant="circular" width={28} height={28} />
              </Box>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Standard complete page skeleton with header, stat cards, and content card
 */
export function PageSkeleton({
  hasStats = true,
  contentType = 'table',
}: {
  hasStats?: boolean;
  contentType?: 'table' | 'cards';
}) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '80vh',
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: dzfColors.surfaces.canvas,
      }}
    >
      {/* Breadcrumb & Section kicker */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <DZFSkeleton variant="text" width={70} height={18} />
          <DZFSkeleton variant="text" width={12} height={18} />
          <DZFSkeleton variant="text" width={110} height={18} />
        </Box>

        {/* Page Title & Action Button Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
          }}
        >
          <Box sx={{ width: { xs: '100%', sm: '60%' } }}>
            <DZFSkeleton variant="text" width="65%" height={44} sx={{ mb: 0.5 }} />
            <DZFSkeleton variant="text" width="90%" height={22} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <DZFSkeleton variant="rounded" width={120} height={42} sx={{ borderRadius: 2 }} />
            <DZFSkeleton variant="rounded" width={140} height={42} sx={{ borderRadius: 2 }} />
          </Box>
        </Box>
      </Box>

      {/* Optional Stat Cards */}
      {hasStats && <StatCardsSkeleton count={4} />}

      {/* Main Content Area */}
      {contentType === 'table' ? <TableSkeleton rows={7} cols={5} /> : <CardGridSkeleton count={6} />}
    </Box>
  );
}

export default PageSkeleton;
