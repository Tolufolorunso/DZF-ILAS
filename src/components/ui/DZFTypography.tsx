'use client';

import * as React from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { dzfColors } from '@/theme/colors';
import { monoFontFamily } from '@/theme/typography';

export interface KickerProps extends TypographyProps {
  children: React.ReactNode;
}

export function Kicker({ children, sx, ...props }: KickerProps) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: dzfColors.gold[700],
        lineHeight: 1.5,
        mb: 0.5,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
}

export interface MonoProps extends TypographyProps {
  children: React.ReactNode;
}

export function Mono({ children, sx, ...props }: MonoProps) {
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: monoFontFamily,
        fontSize: '0.85em',
        letterSpacing: '0.04em',
        px: 0.75,
        py: 0.25,
        borderRadius: '4px',
        backgroundColor: 'rgba(23, 50, 77, 0.06)',
        color: dzfColors.navy[700],
        fontWeight: 600,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
}

export interface PageHeaderProps extends BoxProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  actionSlot?: React.ReactNode;
}

export function PageHeader({
  kicker,
  title,
  subtitle,
  actionSlot,
  sx,
  ...props
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        pb: 3,
        mb: 3,
        borderBottom: `1px solid ${dzfColors.surfaces.border}`,
        ...sx,
      }}
      {...props}
    >
      <Box>
        {kicker && <Kicker>{kicker}</Kicker>}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.875rem' },
            fontWeight: 700,
            color: dzfColors.navy[700],
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              mt: 0.75,
              color: dzfColors.surfaces.textSecondary,
              maxWidth: '720px',
              fontSize: '0.9375rem',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionSlot && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          {actionSlot}
        </Box>
      )}
    </Box>
  );
}
