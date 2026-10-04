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
} from '@/components/ui/DZFIcons';
import DZFBadge from '@/components/ui/DZFBadge';

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

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
}

export function AppShell({
  children,
  activeNavId = 'dashboard',
  onNavigate,
  staffName = 'Sister Blessing',
  staffRole = 'Senior Librarian',
}: AppShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const navSections: NavSection[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayersIcon size={20} /> },
        { id: 'catalog', label: 'Library Catalog', icon: <BookIcon size={20} />, badge: '2.3k' },
        { id: 'patrons', label: 'Patron Directory', icon: <UsersIcon size={20} />, badge: '670+' },
        { id: 'attendance', label: 'Barcode Scanner', icon: <BarcodeIcon size={20} /> },
        { id: 'analytics', label: 'Leaderboard & Stats', icon: <TrophyIcon size={20} /> },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'circulations', label: 'Loans & Returns', icon: <ClockIcon size={20} />, badge: '14 due', badgeVariant: 'warning' },
        { id: 'summaries', label: 'Book Summaries', icon: <ActivityIcon size={20} />, badge: '3 new', badgeVariant: 'primary' },
        { id: 'cohorts', label: 'Cohort Academy', icon: <UsersIcon size={20} /> },
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
    onNavigate?.(id);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const sidebarWidth = collapsed && !isMobile ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: dzfColors.navy[700],
        color: '#ffffff',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            backgroundColor: dzfColors.maroon[900],
            border: `1.5px solid ${dzfColors.gold[500]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1rem',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(111, 17, 17, 0.4)',
          }}
        >
          DZF
        </Box>
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
                  color: dzfColors.navy[200],
                  letterSpacing: '0.08em',
                }}
              >
                {section.title}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const isActive = activeNavId === item.id;
                return (
                  <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleItemClick(item.id)}
                      sx={{
                        borderRadius: '8px',
                        py: 1,
                        px: 1.5,
                        backgroundColor: isActive ? dzfColors.maroon[900] : 'transparent',
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.82)',
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
                          color: isActive ? dzfColors.gold[400] : 'inherit',
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
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                                {item.label}
                              </Typography>
                            }
                          />
                          {item.badge && (
                            <DZFBadge
                              label={item.badge}
                              variant={item.badgeVariant || 'default'}
                              solid
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
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
          }}
        >
          {staffName.charAt(0)}
        </Avatar>
        {(!collapsed || isMobile) && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.8125rem' }}
            >
              {staffName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: dzfColors.gold[400], fontSize: '0.6875rem', display: 'block' }}
            >
              {staffRole}
            </Typography>
          </Box>
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
          boxShadow: 'none',
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
                {staffName.charAt(0)}
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
                {staffName.split(' ')[0]}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH },
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
            borderRight: 'none',
            transition: 'width 0.2s ease',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          transition: 'width 0.2s ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default AppShell;
