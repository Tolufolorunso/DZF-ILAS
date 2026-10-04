import { TypographyVariantsOptions } from '@mui/material/styles';
import { dzfColors } from './colors';

export const fontFamily = [
  'Inter',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  'sans-serif',
].join(',');

export const monoFontFamily = [
  '"SFMono-Regular"',
  'Consolas',
  '"Liberation Mono"',
  'Menlo',
  'Courier',
  'monospace',
].join(',');

export const typography: TypographyVariantsOptions = {
  fontFamily,
  h1: {
    fontSize: '2rem', // 32px
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
    color: dzfColors.navy[700],
  },
  h2: {
    fontSize: '1.5rem', // 24px
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    color: dzfColors.navy[700],
  },
  h3: {
    fontSize: '1.25rem', // 20px
    fontWeight: 600,
    lineHeight: 1.35,
    color: dzfColors.navy[700],
  },
  h4: {
    fontSize: '1.125rem', // 18px
    fontWeight: 600,
    lineHeight: 1.4,
    color: dzfColors.navy[700],
  },
  h5: {
    fontSize: '1rem', // 16px
    fontWeight: 600,
    lineHeight: 1.4,
    color: dzfColors.surfaces.textPrimary,
  },
  h6: {
    fontSize: '0.875rem', // 14px
    fontWeight: 600,
    lineHeight: 1.4,
    color: dzfColors.surfaces.textPrimary,
  },
  body1: {
    fontSize: '0.9375rem', // 15px
    lineHeight: 1.5,
    color: dzfColors.surfaces.textPrimary,
  },
  body2: {
    fontSize: '0.875rem', // 14px
    lineHeight: 1.5,
    color: dzfColors.surfaces.textSecondary,
  },
  subtitle1: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: dzfColors.surfaces.textSecondary,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: dzfColors.surfaces.textMuted,
    lineHeight: 1.4,
  },
  caption: {
    fontSize: '0.75rem', // 12px
    lineHeight: 1.4,
    color: dzfColors.surfaces.textMuted,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: dzfColors.gold[700],
  },
  button: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
};
