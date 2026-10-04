'use client';

import * as React from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';
import { InboxIcon } from './DZFIcons';
import DZFButton from './DZFButton';

export interface DZFEmptyStateProps extends BoxProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
}

export function DZFEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
  sx,
  ...props
}: DZFEmptyStateProps) {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderRadius: 3,
        border: `1px dashed ${dzfColors.surfaces.border}`,
        backgroundColor: '#ffffff',
        ...sx,
      }}
      {...props}
    >
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: '50%',
          backgroundColor: dzfColors.maroon[50],
          color: dzfColors.maroon[900],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon || <InboxIcon size={32} color={dzfColors.maroon[900]} />}
      </Box>

      <Typography
        variant="h3"
        sx={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: dzfColors.navy[700],
          mb: 0.75,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: dzfColors.surfaces.textSecondary,
          maxWidth: 420,
          mb: actionLabel || secondaryAction ? 3 : 0,
          lineHeight: 1.5,
        }}
      >
        {description}
      </Typography>

      {(actionLabel || secondaryAction) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {actionLabel && (
            <DZFButton variant="primary" onClick={onAction}>
              {actionLabel}
            </DZFButton>
          )}
          {secondaryAction}
        </Box>
      )}
    </Box>
  );
}

export default DZFEmptyState;
