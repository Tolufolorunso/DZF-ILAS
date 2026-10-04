export const dzfColors = {
  maroon: {
    50: '#fdf4f4',
    100: '#fae8e8',
    200: '#f6d5d5',
    300: '#eeb5b5',
    400: '#e28888',
    500: '#d15b5b',
    600: '#ba3737',
    700: '#a32121', // hover / brand accent
    800: '#861b1b', // active
    900: '#6f1111', // brand primary
    950: '#3c0606',
  },
  navy: {
    50: '#f0f6fa',
    100: '#dceaf3',
    200: '#bed8e9',
    500: '#1f5873',
    700: '#17324d', // Cohort & Admin Deep Navy
    900: '#123451', // Dark panel background
    950: '#0b1d2e',
  },
  gold: {
    50: '#fefbee',
    100: '#fdf4cf', // soft gold fill
    200: '#fbe89d',
    400: '#f3c44f', // podium gold
    500: '#cca349', // academic / certificate gold
    700: '#8b5e0b', // kicker gold
    900: '#533704',
  },
  surfaces: {
    canvas: '#f8f8f8',
    paper: '#ffffff',
    border: '#e5e5e5',
    borderSubtle: '#f0f0f0',
    textPrimary: '#171717',
    textSecondary: '#465569',
    textMuted: '#64748b',
    headerBg: '#ffffff',
    sidebarBg: '#17324d',
    sidebarText: '#f0f6fa',
    sidebarTextMuted: '#bed8e9',
    sidebarActive: '#6f1111',
  },
  status: {
    success: {
      bg: '#e6f4ea',
      text: '#1b5e20',
      badge: '#1b5e20',
      button: '#16a34a',
      buttonHover: '#15803d',
    },
    warning: {
      bg: '#fff8e1',
      text: '#7b5e00',
      badge: '#f57f17',
    },
    error: {
      bg: '#fdecea',
      text: '#b71c1c',
      badge: '#b71c1c',
      button: '#dc2626',
      buttonHover: '#b91c1c',
    },
    info: {
      bg: '#f4f7fb',
      text: '#17324d',
      badge: '#1f5873',
    },
  },
  interactive: {
    focusRing: '0 0 0 3px rgba(111, 17, 17, 0.3)',
    selectionBg: 'rgba(111, 17, 17, 0.3)',
  },
} as const;

export type DZFColors = typeof dzfColors;
