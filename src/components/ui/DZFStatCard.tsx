'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card, { CardProps } from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';

export type DZFStatCardColor = 'maroon' | 'navy' | 'gold' | 'success' | 'warning' | 'error' | 'default';

export interface DZFStatCardProps extends CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  accentColor?: DZFStatCardColor;
}

export function DZFStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'maroon',
  sx,
  ...props
}: DZFStatCardProps) {
  const getAccentStyles = () => {
    switch (accentColor) {
      case 'maroon':
        return {
          iconBg: dzfColors.maroon[50],
          iconColor: dzfColors.maroon[900],
          borderTop: `3px solid ${dzfColors.maroon[900]}`,
        };
      case 'navy':
        return {
          iconBg: dzfColors.navy[50],
          iconColor: dzfColors.navy[700],
          borderTop: `3px solid ${dzfColors.navy[700]}`,
        };
      case 'gold':
        return {
          iconBg: dzfColors.gold[100],
          iconColor: dzfColors.gold[700],
          borderTop: `3px solid ${dzfColors.gold[500]}`,
        };
      case 'success':
        return {
          iconBg: dzfColors.status.success.bg,
          iconColor: dzfColors.status.success.text,
          borderTop: `3px solid ${dzfColors.status.success.badge}`,
        };
      case 'warning':
        return {
          iconBg: dzfColors.status.warning.bg,
          iconColor: dzfColors.status.warning.text,
          borderTop: `3px solid ${dzfColors.status.warning.badge}`,
        };
      case 'error':
        return {
          iconBg: dzfColors.status.error.bg,
          iconColor: dzfColors.status.error.text,
          borderTop: `3px solid ${dzfColors.status.error.badge}`,
        };
      default:
        return {
          iconBg: dzfColors.surfaces.canvas,
          iconColor: dzfColors.surfaces.textSecondary,
          borderTop: `3px solid ${dzfColors.surfaces.border}`,
        };
    }
  };

  const accent = getAccentStyles();

  return (
    <Card
      sx={[
        {
          p: 2.5,
          borderRadius: 3.5,
          border: `1px solid ${dzfColors.surfaces.border}`,
          borderTop: accent.borderTop,
          backgroundColor: '#ffffff',
          position: 'relative',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: dzfColors.surfaces.textSecondary,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </Typography>
        {icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: accent.iconBg,
              color: accent.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Typography
        variant="h2"
        sx={{
          fontSize: '1.875rem',
          fontWeight: 700,
          color: dzfColors.navy[700],
          lineHeight: 1.2,
          mb: 0.5,
        }}
      >
        {value}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {trend && (
          <Box
            component="span"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              px: 0.75,
              py: 0.25,
              borderRadius: '4px',
              backgroundColor: trend.neutral
                ? dzfColors.surfaces.canvas
                : trend.positive
                ? dzfColors.status.success.bg
                : dzfColors.status.error.bg,
              color: trend.neutral
                ? dzfColors.surfaces.textSecondary
                : trend.positive
                ? dzfColors.status.success.text
                : dzfColors.status.error.text,
            }}
          >
            {trend.value}
          </Box>
        )}
        {subtitle && (
          <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

export default DZFStatCard;
