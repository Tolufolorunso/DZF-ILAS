'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Chip, { ChipProps } from '@mui/material/Chip';
import { dzfColors } from '@/theme/colors';

export type DZFBadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'top10';

export interface DZFBadgeProps extends Omit<ChipProps, 'variant' | 'color'> {
  variant?: DZFBadgeVariant;
  solid?: boolean;
  dot?: boolean;
}

export function DZFBadge({
  label,
  variant = 'default',
  solid = false,
  dot = false,
  sx,
  ...props
}: DZFBadgeProps) {
  const getBadgeColors = () => {
    switch (variant) {
      case 'primary':
        return solid
          ? { bg: dzfColors.maroon[900], text: '#ffffff', border: 'transparent' }
          : { bg: dzfColors.maroon[50], text: dzfColors.maroon[900], border: dzfColors.maroon[200] };
      case 'success':
        return solid
          ? { bg: dzfColors.status.success.badge, text: '#ffffff', border: 'transparent' }
          : { bg: dzfColors.status.success.bg, text: dzfColors.status.success.text, border: 'rgba(27, 94, 32, 0.2)' };
      case 'warning':
        return solid
          ? { bg: dzfColors.status.warning.badge, text: '#ffffff', border: 'transparent' }
          : { bg: dzfColors.status.warning.bg, text: dzfColors.status.warning.text, border: 'rgba(245, 127, 23, 0.25)' };
      case 'error':
        return solid
          ? { bg: dzfColors.status.error.badge, text: '#ffffff', border: 'transparent' }
          : { bg: dzfColors.status.error.bg, text: dzfColors.status.error.text, border: 'rgba(183, 28, 28, 0.25)' };
      case 'info':
        return solid
          ? { bg: dzfColors.navy[700], text: '#ffffff', border: 'transparent' }
          : { bg: dzfColors.status.info.bg, text: dzfColors.status.info.text, border: 'rgba(23, 50, 77, 0.15)' };
      case 'top10':
        return solid
          ? { bg: dzfColors.gold[500], text: '#ffffff', border: 'transparent' }
          : { bg: dzfColors.gold[100], text: dzfColors.gold[700], border: dzfColors.gold[400] };
      case 'default':
      default:
        return {
          bg: dzfColors.surfaces.canvas,
          text: dzfColors.surfaces.textPrimary,
          border: dzfColors.surfaces.border,
        };
    }
  };

  const style = getBadgeColors();

  return (
    <Chip
      label={
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          {dot && (
            <Box
              component="span"
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: style.text,
              }}
            />
          )}
          <span>{label}</span>
        </Box>
      }
      sx={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 24,
        borderRadius: '6px',
        '& .MuiChip-label': {
          px: 1,
        },
        ...sx,
      }}
      {...props}
    />
  );
}

export default DZFBadge;
