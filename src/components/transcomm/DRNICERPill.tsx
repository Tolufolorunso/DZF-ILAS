'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import type { DRNICERValue } from '@/models/TranscommArticle';
import { DRNICER_PILLARS } from '@/lib/transcomm/types';

export interface DRNICERPillProps {
  pillar: DRNICERValue;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'subtle';
  selected?: boolean;
  onClick?: () => void;
  showTooltip?: boolean;
}

export function DRNICERPill({
  pillar,
  size = 'medium',
  variant = 'filled',
  selected = false,
  onClick,
  showTooltip = true,
}: DRNICERPillProps) {
  const meta = DRNICER_PILLARS[pillar] || {
    pillar,
    letter: pillar.charAt(0),
    title: pillar,
    tagline: pillar,
    description: '',
    accentColor: '#17324d',
    bgLight: 'rgba(23, 50, 77, 0.08)',
  };

  const isClickable = Boolean(onClick);

  const getDimensions = () => {
    switch (size) {
      case 'small':
        return {
          px: 1,
          py: 0.25,
          fontSize: '0.72rem',
          letterSize: 16,
          letterFont: '0.65rem',
          gap: 0.6,
        };
      case 'large':
        return {
          px: 2,
          py: 0.75,
          fontSize: '0.9rem',
          letterSize: 26,
          letterFont: '0.82rem',
          gap: 1.2,
        };
      case 'medium':
      default:
        return {
          px: 1.5,
          py: 0.5,
          fontSize: '0.8rem',
          letterSize: 20,
          letterFont: '0.72rem',
          gap: 0.8,
        };
    }
  };

  const dim = getDimensions();

  let bgColor = meta.bgLight;
  let textColor = meta.accentColor;
  let borderColor = 'transparent';

  if (variant === 'filled' || selected) {
    bgColor = meta.accentColor;
    textColor = '#ffffff';
    borderColor = meta.accentColor;
  } else if (variant === 'outlined') {
    bgColor = 'transparent';
    textColor = meta.accentColor;
    borderColor = meta.accentColor;
  }

  const pillNode = (
    <Box
      component={isClickable ? 'button' : 'div'}
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dim.gap,
        px: dim.px,
        py: dim.py,
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor,
        border: `1.5px solid ${borderColor}`,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        textDecoration: 'none',
        userSelect: 'none',
        boxShadow: selected
          ? `0 2px 8px ${meta.accentColor}40`
          : 'none',
        '&:hover': isClickable
          ? {
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 10px ${meta.accentColor}30`,
              filter: 'brightness(1.05)',
            }
          : undefined,
        '&:active': isClickable
          ? {
              transform: 'translateY(0)',
            }
          : undefined,
      }}
    >
      {/* Pillar Initial Badge */}
      <Box
        sx={{
          width: dim.letterSize,
          height: dim.letterSize,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            variant === 'filled' || selected
              ? 'rgba(255, 255, 255, 0.25)'
              : meta.accentColor,
          color: '#ffffff',
          fontWeight: 800,
          fontSize: dim.letterFont,
          fontFamily: 'monospace',
          lineHeight: 1,
        }}
      >
        {meta.letter}
      </Box>

      {/* Pillar Title */}
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: dim.fontSize,
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        {meta.title}
      </Typography>
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip title={`${meta.title} — ${meta.tagline}`} arrow placement="top">
        {pillNode}
      </Tooltip>
    );
  }

  return pillNode;
}

export default DRNICERPill;
