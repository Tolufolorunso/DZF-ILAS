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
      '&.Mui-disabled': {
        backgroundColor: loading ? `${dzfColors.maroon[800]} !important` : '#64748b !important',
        color: '#ffffff !important',
        opacity: '1 !important',
      },
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: dzfColors.navy[700],
      border: `1.5px solid ${dzfColors.surfaces.border}`,
      '&:hover': {
        borderColor: dzfColors.maroon[700],
        backgroundColor: dzfColors.maroon[50],
        color: dzfColors.maroon[900],
      },
      '&:active': {
        backgroundColor: dzfColors.maroon[100],
      },
      '&.Mui-disabled': {
        backgroundColor: '#f1f5f9 !important',
        color: '#0f172a !important',
        borderColor: '#94a3b8 !important',
        opacity: '1 !important',
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
      '&.Mui-disabled': {
        backgroundColor: loading ? '#991b1b !important' : '#b91c1c !important',
        color: '#ffffff !important',
        opacity: '1 !important',
      },
    },
    soft: {
      backgroundColor: dzfColors.maroon[50],
      color: dzfColors.maroon[900],
      border: `1.5px solid ${dzfColors.maroon[200]}`,
      '&:hover': {
        backgroundColor: dzfColors.maroon[100],
        borderColor: dzfColors.maroon[400],
      },
      '&.Mui-disabled': {
        backgroundColor: '#e2e8f0 !important',
        color: '#0f172a !important',
        borderColor: '#94a3b8 !important',
        opacity: '1 !important',
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
          '&.Mui-disabled': {
            cursor: loading ? 'wait !important' : 'not-allowed !important',
            pointerEvents: 'auto !important',
            opacity: '1 !important',
            '& *': {
              opacity: '1 !important',
            },
          },
        },
        variantStyles[variant],
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {loading ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'inherit',
            fontWeight: 600,
            opacity: 1,
          }}
        >
          <CircularProgress
            size={16}
            color="inherit"
            thickness={4}
            sx={{ display: 'inline-block', color: 'inherit' }}
          />
          <span style={{ color: 'inherit', opacity: 1 }}>{children}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
});

export default DZFButton;
