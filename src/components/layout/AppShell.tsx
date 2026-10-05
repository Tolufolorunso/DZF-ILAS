'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { dzfColors } from '@/theme/colors';
import {
  MenuIcon,
  BellIcon,
  SearchIcon,
  BookIcon,
  UsersIcon,
  ClockIcon,
  TrophyIcon,
  ActivityIcon,
  LayersIcon,
  SettingsIcon,
  BarcodeIcon,
  LogOutIcon,
} from '@/components/ui/DZFIcons';
import DZFBadge from '@/components/ui/DZFBadge';

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

import { useRouter, usePathname } from 'next/navigation';
import type { ITokenPayload } from '@/lib/auth/jwt';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  active?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface AppShellProps {
  children: React.ReactNode;
  activeNavId?: string;
  onNavigate?: (id: string) => void;
  staffName?: string;
  staffRole?: string;
  user?: ITokenPayload | null;
  onLogout?: () => void;
}

export function AppShell({
  children,
  activeNavId,
  onNavigate,
  staffName,
  staffRole,
  user,
  onLogout,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const resolvedNavId =
    activeNavId ||
    (pathname.startsWith('/catalog')
      ? 'catalog'
      : pathname.startsWith('/inventory')
      ? 'inventory'
      : pathname.startsWith('/circulations')
      ? 'circulations'
      : pathname.startsWith('/summaries')
      ? 'summaries'
      : pathname.startsWith('/attendance')
      ? 'attendance'
      : pathname.startsWith('/leaderboard')
      ? 'analytics'
      : pathname.startsWith('/cohorts')
      ? 'cohorts'
      : pathname.startsWith('/patrons')
      ? 'patrons'
      : pathname.startsWith('/dashboard')
      ? 'dashboard'
      : 'dashboard');

  const displayName = staffName || user?.name || 'Staff Member';
  const displayRole =
    staffRole ||
    (user?.role ? user.role.replace('_', ' ').toUpperCase() : 'Librarian');

  const navSections: NavSection[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayersIcon size={20} /> },
        { id: 'catalog', label: 'Library Catalog', icon: <BookIcon size={20} />, badge: '1.3k' },
        { id: 'inventory', label: 'Asset Inventory', icon: <LayersIcon size={20} /> },
        { id: 'patrons', label: 'Patron Directory', icon: <UsersIcon size={20} />, badge: '583' },
        { id: 'attendance', label: 'Barcode Scanner', icon: <BarcodeIcon size={20} /> },
        { id: 'analytics', label: 'Leaderboard & Stats', icon: <TrophyIcon size={20} /> },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'circulations', label: 'Loans & Returns', icon: <ClockIcon size={20} />, badge: 'Loans', badgeVariant: 'warning' },
        { id: 'summaries', label: 'Book Summaries', icon: <ActivityIcon size={20} />, badge: 'Reviews', badgeVariant: 'primary' },
        { id: 'cohorts', label: 'Cohort Academy', icon: <UsersIcon size={20} />, badge: 'Academy' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'admin', label: 'Staff Admin & Security', icon: <SettingsIcon size={20} /> },
      ],
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleItemClick = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
    } else {
      if (id === 'dashboard') router.push('/dashboard');
      else if (id === 'catalog') router.push('/catalog');
      else if (id === 'inventory') router.push('/inventory');
      else if (id === 'circulations') router.push('/circulations');
      else if (id === 'summaries') router.push('/summaries');
      else if (id === 'patrons') router.push('/patrons');
      else if (id === 'attendance') router.push('/attendance');
      else if (id === 'analytics') router.push('/leaderboard');
      else if (id === 'cohorts') router.push('/cohorts');
      else if (id === 'admin') router.push('/dashboard');
    }
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogoutAction = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/auth/login');
      router.refresh();
    }
  };

  const sidebarWidth = collapsed && !isMobile ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: dzfColors.navy[950],
        color: '#ffffff',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Box
          component="img"
          src="/images/logo.png"
          alt="Dzuels Educational Foundation Logo"
          sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            p: 0.5,
            objectFit: 'contain',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
          }}
        />
        {(!collapsed || isMobile) && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '0.9375rem',
                lineHeight: 1.2,
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              DZF-ILLS
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: dzfColors.gold[400],
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              Library & Learning
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation Sections */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: 1.5 }}>
        {navSections.map((section) => (
          <Box key={section.title} sx={{ mb: 2.5 }}>
            {(!collapsed || isMobile) && (
              <Typography
                variant="overline"
                sx={{
                  px: 1.5,
                  mb: 0.75,
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: dzfColors.gold[400],
                  letterSpacing: '0.08em',
                }}
              >
                {section.title}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const isActive = resolvedNavId === item.id;
                return (
                  <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleItemClick(item.id)}
                      sx={{
                        borderRadius: '8px',
                        py: 1,
                        px: 1.5,
                        backgroundColor: isActive ? dzfColors.maroon[900] : 'transparent',
                        borderLeft: isActive ? `3px solid ${dzfColors.gold[400]}` : '3px solid transparent',
                        color: isActive ? '#ffffff' : '#e2e8f0',
                        boxShadow: isActive ? '0 2px 8px rgba(111, 17, 17, 0.45)' : 'none',
                        '&:hover': {
                          backgroundColor: isActive
                            ? dzfColors.maroon[800]
                            : 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        },
                        justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed && !isMobile ? 0 : 34,
                          color: isActive ? dzfColors.gold[400] : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {(!collapsed || isMobile) && (
                        <>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#ffffff' : '#f1f5f9' }}>
                                {item.label}
                              </Typography>
                            }
                          />
                          {item.badge && (
                            <DZFBadge
                              label={item.badge}
                              variant={item.badgeVariant || (isActive ? 'top10' : 'default')}
                              solid={isActive}
                              sx={{ height: 20, fontSize: '0.6875rem' }}
                            />
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Staff User Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            backgroundColor: dzfColors.maroon[700],
            border: `1.5px solid ${dzfColors.gold[400]}`,
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#ffffff',
          }}
        >
          {displayName.charAt(0)}
        </Avatar>
        {(!collapsed || isMobile) && (
          <Box sx={{ overflow: 'hidden', flex: 1 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.8125rem' }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: dzfColors.gold[400], fontSize: '0.6875rem', display: 'block', fontWeight: 600 }}
            >
              {displayRole}
            </Typography>
          </Box>
        )}
        {(!collapsed || isMobile) && (
          <IconButton
            size="small"
            onClick={handleLogoutAction}
            title="Log out"
            sx={{
              color: '#cbd5e1',
              '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.15)' },
            }}
          >
            <LogOutIcon size={16} />
          </IconButton>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: dzfColors.surfaces.canvas }}>
      {/* Top Header */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          backgroundColor: '#ffffff',
          color: dzfColors.surfaces.textPrimary,
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          transition: 'width 0.2s ease, margin 0.2s ease',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={isMobile ? handleDrawerToggle : () => setCollapsed(!collapsed)}
              sx={{ color: dzfColors.navy[700] }}
            >
              <MenuIcon size={22} />
            </IconButton>

            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <DZFBadge label="Foundation Station AAoJ" variant="info" dot />
              <DZFBadge label="Active Session" variant="success" dot />
            </Box>
          </Box>

          {/* Quick Actions & Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                backgroundColor: dzfColors.surfaces.canvas,
                border: `1px solid ${dzfColors.surfaces.border}`,
                color: dzfColors.surfaces.textMuted,
                cursor: 'pointer',
              }}
            >
              <SearchIcon size={16} />
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                Global Search (Ctrl + K)
              </Typography>
            </Box>

            <IconButton
              size="small"
              aria-label="notifications"
              sx={{
                p: 1,
                borderRadius: '8px',
                border: `1px solid ${dzfColors.surfaces.border}`,
                color: dzfColors.navy[700],
              }}
            >
              <BellIcon size={18} />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: dzfColors.maroon[900],
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {displayName.charAt(0)}
              </Avatar>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  color: dzfColors.navy[700],
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {displayName.split(' ')[0]}
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={handleLogoutAction}
              title="Log out"
              sx={{
                p: 1,
                borderRadius: '8px',
                border: `1px solid ${dzfColors.surfaces.border}`,
                color: dzfColors.maroon[700],
                '&:hover': {
                  backgroundColor: 'rgba(111, 17, 17, 0.05)',
                },
              }}
            >
              <LogOutIcon size={18} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer Container (Allocates space in flex layout so main content never slips underneath) */}
      <Box
        component="nav"
        sx={{
          width: { md: sidebarWidth },
          flexShrink: { md: 0 },
          transition: 'width 0.2s ease',
        }}
        aria-label="DZF-ILLS staff sidebar"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: SIDEBAR_WIDTH,
              backgroundColor: dzfColors.navy[950],
              color: '#ffffff',
            },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Desktop Persistent Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarWidth,
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: dzfColors.navy[950],
              color: '#ffffff',
              transition: 'width 0.2s ease',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: dzfColors.surfaces.canvas,
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
        }}
      >
        {/* Spacer for fixed AppBar */}
        <Toolbar sx={{ minHeight: '64px' }} />

        {/* Content canvas with professional symmetric margins and padding */}
        <Box
          sx={{
            flex: 1,
            py: { xs: 2.5, sm: 3, md: 4 },
            px: { xs: 2, sm: 3.5, md: 4, lg: 6 },
            maxWidth: '1600px',
            width: '100%',
            mx: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default AppShell;
