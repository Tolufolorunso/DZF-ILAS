'use client';

import * as React from 'react';
import Button, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { SxProps, Theme } from '@mui/material/styles';
import { dzfColors } from '@/theme/colors';

export type DZFButtonVariant = 'primary' | 'secondary' | 'danger' | 'soft';

export interface DZFButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: DZFButtonVariant;
  loading?: boolean;
}

export const DZFButton = React.forwardRef<HTMLButtonElement, DZFButtonProps>(function DZFButton(
  {
    variant = 'primary',
    loading = false,
    disabled = false,
    children,
    startIcon,
    endIcon,
    sx,
    ...props
  },
  ref
) {
  const variantStyles: Record<DZFButtonVariant, SxProps<Theme>> = {
    primary: {
      backgroundColor: dzfColors.maroon[900],
      color: '#ffffff',
      '&:hover': {
        backgroundColor: dzfColors.maroon[700],
      },
      '&:active': {
        backgroundColor: dzfColors.maroon[800],
      },
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: dzfColors.surfaces.textPrimary,
      border: `1px solid ${dzfColors.surfaces.border}`,
      '&:hover': {
        borderColor: dzfColors.maroon[700],
        backgroundColor: dzfColors.maroon[50],
        color: dzfColors.maroon[900],
      },
      '&:active': {
        backgroundColor: dzfColors.maroon[100],
      },
    },
    danger: {
      backgroundColor: dzfColors.status.error.button,
      color: '#ffffff',
      '&:hover': {
        backgroundColor: dzfColors.status.error.buttonHover,
      },
      '&:active': {
        backgroundColor: dzfColors.status.error.text,
      },
    },
    soft: {
      backgroundColor: dzfColors.maroon[50],
      color: dzfColors.maroon[900],
      border: `1px solid ${dzfColors.maroon[200]}`,
      '&:hover': {
        backgroundColor: dzfColors.maroon[100],
        borderColor: dzfColors.maroon[400],
      },
    },
  };

  return (
    <Button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      sx={[
        {
          borderRadius: '8px',
          fontWeight: 600,
          textTransform: 'none',
          position: 'relative',
          minHeight: '38px',
          ...(disabled && {
            opacity: 0.55,
            cursor: 'not-allowed !important',
            pointerEvents: 'auto !important',
          }),
        },
        variantStyles[variant],
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <CircularProgress
            size={16}
            color="inherit"
            thickness={4}
            sx={{ display: 'inline-block' }}
          />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
});

export default DZFButton;
