import { createTheme } from '@mui/material/styles';
import { dzfColors } from './colors';
import { typography } from './typography';
import { components } from './components';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: dzfColors.maroon[900],
      light: dzfColors.maroon[500],
      dark: dzfColors.maroon[950],
      contrastText: '#ffffff',
    },
    secondary: {
      main: dzfColors.navy[700],
      light: dzfColors.navy[500],
      dark: dzfColors.navy[900],
      contrastText: '#ffffff',
    },
    success: {
      main: dzfColors.status.success.button,
      light: dzfColors.status.success.bg,
      dark: dzfColors.status.success.text,
      contrastText: '#ffffff',
    },
    warning: {
      main: dzfColors.status.warning.badge,
      light: dzfColors.status.warning.bg,
      dark: dzfColors.status.warning.text,
      contrastText: '#ffffff',
    },
    error: {
      main: dzfColors.status.error.button,
      light: dzfColors.status.error.bg,
      dark: dzfColors.status.error.text,
      contrastText: '#ffffff',
    },
    info: {
      main: dzfColors.status.info.badge,
      light: dzfColors.status.info.bg,
      dark: dzfColors.status.info.text,
      contrastText: '#ffffff',
    },
    background: {
      default: dzfColors.surfaces.canvas,
      paper: dzfColors.surfaces.paper,
    },
    text: {
      primary: dzfColors.surfaces.textPrimary,
      secondary: dzfColors.surfaces.textSecondary,
    },
    divider: dzfColors.surfaces.border,
  },
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
});

export * from './colors';
export * from './typography';
export * from './components';
export default theme;
