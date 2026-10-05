'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';
import { TrophyIcon } from '@/components/ui/DZFIcons';

export interface RankBadgeProps {
  rank: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function RankBadge({
  rank,
  size = 'medium',
  showLabel = true,
}: RankBadgeProps) {
  // 1st Place: 🥇 Champion
  if (rank === 1) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: size === 'small' ? 1 : size === 'large' ? 1.75 : 1.25,
          py: size === 'small' ? 0.25 : size === 'large' ? 0.75 : 0.5,
          borderRadius: 9999,
          background: 'linear-gradient(135deg, #6f1111, #861b1b)',
          color: '#ffffff',
          boxShadow: '0 2px 6px rgba(111, 17, 17, 0.3)',
          fontWeight: 700,
          fontSize: size === 'small' ? '0.75rem' : size === 'large' ? '0.9rem' : '0.8rem',
        }}
      >
        <span>🥇</span>
        {showLabel && <span>Champion</span>}
      </Box>
    );
  }

  // 2nd Place: 🥈 Runner-up
  if (rank === 2) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: size === 'small' ? 1 : size === 'large' ? 1.75 : 1.25,
          py: size === 'small' ? 0.25 : size === 'large' ? 0.75 : 0.5,
          borderRadius: 9999,
          background: 'linear-gradient(135deg, #4d6070, #64748b)',
          color: '#ffffff',
          boxShadow: '0 2px 6px rgba(77, 96, 112, 0.25)',
          fontWeight: 700,
          fontSize: size === 'small' ? '0.75rem' : size === 'large' ? '0.9rem' : '0.8rem',
        }}
      >
        <span>🥈</span>
        {showLabel && <span>Runner-up</span>}
      </Box>
    );
  }

  // 3rd Place: 🥉 Third Place
  if (rank === 3) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: size === 'small' ? 1 : size === 'large' ? 1.75 : 1.25,
          py: size === 'small' ? 0.25 : size === 'large' ? 0.75 : 0.5,
          borderRadius: 9999,
          background: 'linear-gradient(135deg, #cd7f32, #b45309)',
          color: '#ffffff',
          boxShadow: '0 2px 6px rgba(205, 127, 50, 0.25)',
          fontWeight: 700,
          fontSize: size === 'small' ? '0.75rem' : size === 'large' ? '0.9rem' : '0.8rem',
        }}
      >
        <span>🥉</span>
        {showLabel && <span>3rd Place</span>}
      </Box>
    );
  }

  // Top 10 Rank Badge (Ranks 4-10)
  if (rank <= 10) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: size === 'small' ? 1 : size === 'large' ? 1.5 : 1.25,
          py: size === 'small' ? 0.25 : size === 'large' ? 0.5 : 0.35,
          borderRadius: 9999,
          backgroundColor: '#1b5e20',
          color: '#ffffff',
          boxShadow: '0 1px 4px rgba(27, 94, 32, 0.25)',
          fontWeight: 600,
          fontSize: size === 'small' ? '0.75rem' : size === 'large' ? '0.85rem' : '0.775rem',
        }}
      >
        <TrophyIcon size={size === 'small' ? 14 : 16} color="#ffffff" />
        <span>#{rank} Top 10</span>
      </Box>
    );
  }

  // Standard Rank (11+)
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size === 'small' ? 24 : 32,
        height: size === 'small' ? 24 : 32,
        px: 1,
        borderRadius: 9999,
        backgroundColor: dzfColors.surfaces.canvas,
        color: dzfColors.surfaces.textSecondary,
        border: `1px solid ${dzfColors.surfaces.border}`,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.85rem',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
        #{rank}
      </Typography>
    </Box>
  );
}

export default RankBadge;
