import { Components, Theme } from '@mui/material/styles';
import { dzfColors } from './colors';

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: dzfColors.surfaces.canvas,
        color: dzfColors.surfaces.textPrimary,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '::selection': {
        backgroundColor: dzfColors.interactive.selectionBg,
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 8,
        padding: '8px 16px',
        transition: 'all 0.15s ease-in-out',
        '&:focus-visible': {
          outline: 'none',
          boxShadow: dzfColors.interactive.focusRing,
        },
        '&.Mui-disabled': {
          cursor: 'not-allowed !important',
          pointerEvents: 'auto !important',
          opacity: '1 !important',
          color: '#475569 !important', // Slate 600 - crisp, high-contrast, fully legible
        },
      },
      contained: {
        backgroundColor: dzfColors.maroon[900],
        color: '#ffffff',
        '&:hover': {
          backgroundColor: dzfColors.maroon[700],
        },
        '&:active': {
          backgroundColor: dzfColors.maroon[800],
        },
        '&.Mui-disabled': {
          backgroundColor: '#94a3b8 !important', // Slate 400 - distinct disabled fill
          color: '#ffffff !important', // Crisp white text with 100% opacity
          opacity: '1 !important',
        },
      },
      outlined: {
        borderColor: dzfColors.surfaces.border,
        color: dzfColors.surfaces.textPrimary,
        backgroundColor: '#ffffff',
        '&:hover': {
          borderColor: dzfColors.maroon[900],
          backgroundColor: dzfColors.maroon[50],
          color: dzfColors.maroon[900],
        },
        '&.Mui-disabled': {
          borderColor: '#94a3b8 !important',
          color: '#0f172a !important', // Deep slate text - 100% legible
          backgroundColor: '#f1f5f9 !important',
          opacity: '1 !important',
        },
      },
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: 14,
        border: `1px solid ${dzfColors.surfaces.border}`,
        backgroundColor: dzfColors.surfaces.paper,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        backgroundColor: '#ffffff',
        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: dzfColors.surfaces.border,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: dzfColors.maroon[500],
        },
        '&.Mui-focused': {
          boxShadow: dzfColors.interactive.focusRing,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: dzfColors.maroon[900],
            borderWidth: '1px',
          },
        },
        '&.Mui-error': {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: dzfColors.status.error.badge,
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(183, 28, 28, 0.2)',
          },
        },
      },
      input: {
        padding: '10px 14px',
        fontSize: '0.875rem',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: 6,
        height: 24,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: '#f5f7fa',
        '& th': {
          fontWeight: 600,
          color: dzfColors.navy[700],
          fontSize: '0.8125rem',
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
          padding: '12px 16px',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderColor: dzfColors.surfaces.border,
        fontSize: '0.875rem',
        padding: '12px 16px',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: 'background-color 0.1s ease',
        '&:hover': {
          backgroundColor: 'rgba(111, 17, 17, 0.03) !important',
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        border: `1px solid ${dzfColors.surfaces.border}`,
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
      },
    },
  },
};
