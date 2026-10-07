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
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
  AwardIcon,
} from '@/components/ui/DZFIcons';
import DZFBadge from '@/components/ui/DZFBadge';

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

import { useRouter, usePathname } from 'next/navigation';
import type { ITokenPayload } from '@/lib/auth/jwt';
import {
  isAdmin,
  canManageCirculation,
  canManageCohorts,
  canManageCompetitions,
  canManageCertificates,
  canPublishArticles,
} from '@/lib/auth/rbac';

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

export interface NotificationItem {
  id: string;
  recipientUsername: string;
  senderUsername: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
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

const AppShellContext = React.createContext<boolean>(false);

export function AppShell({
  children,
  activeNavId,
  onNavigate,
  staffName,
  staffRole,
  user,
  onLogout,
}: AppShellProps) {
  const isInsideShell = React.useContext(AppShellContext);
  const router = useRouter();
  const pathname = usePathname() || '';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  // Notifications State & Polling
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [notifAnchor, setNotifAnchor] = React.useState<HTMLElement | null>(null);
  const [isUpdatingNotifs, setIsUpdatingNotifs] = React.useState<boolean>(false);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch {
      // non-blocking polling catch
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(event.currentTarget);
    fetchNotifications();
  };

  const handleCloseNotifications = () => {
    setNotifAnchor(null);
  };

  const handleMarkAllRead = async () => {
    try {
      setIsUpdatingNotifs(true);
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    } finally {
      setIsUpdatingNotifs(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification read', err);
      }
    }
    if (notif.link) {
      handleCloseNotifications();
      router.push(notif.link);
    }
  };

  if (isInsideShell) {
    return <>{children}</>;
  }

  const resolvedNavId =
    activeNavId ||
    (pathname === '/dashboard'
      ? 'dashboard'
      : pathname.startsWith('/dashboard/catalog') || pathname.startsWith('/catalog')
      ? 'catalog'
      : pathname.startsWith('/dashboard/inventory') || pathname.startsWith('/inventory')
      ? 'inventory'
      : pathname.startsWith('/dashboard/circulations') || pathname.startsWith('/circulations')
      ? 'circulations'
      : pathname.startsWith('/dashboard/summaries') || pathname.startsWith('/summaries')
      ? 'summaries'
      : pathname.startsWith('/dashboard/attendance') || pathname.startsWith('/attendance')
      ? 'attendance'
      : pathname.startsWith('/dashboard/leaderboard') || pathname.startsWith('/leaderboard')
      ? 'analytics'
      : pathname.startsWith('/dashboard/cohorts') || pathname.startsWith('/cohorts')
      ? 'cohorts'
      : pathname.startsWith('/dashboard/competitions') || pathname.startsWith('/competitions')
      ? 'competitions'
      : pathname.startsWith('/dashboard/certificates') || pathname.startsWith('/certificates')
      ? 'certificates'
      : pathname.startsWith('/dashboard/transcomm') || pathname.startsWith('/transcomm/manage')
      ? 'transcomm'
      : pathname.startsWith('/dashboard/admin') || pathname.startsWith('/admin')
      ? 'admin'
      : pathname.startsWith('/dashboard/patrons') || pathname.startsWith('/patrons')
      ? 'patrons'
      : 'dashboard');

  const displayName = staffName || user?.name || 'Staff Member';
  const displayRole =
    staffRole ||
    (user?.role ? user.role.replace('_', ' ').toUpperCase() : 'Librarian');

  const userRole = user?.role || (staffRole ? staffRole.toLowerCase().replace(' ', '_') : 'librarian');
  const isSuperOrAdmin = isAdmin(userRole);

  const workspaceItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayersIcon size={20} /> },
    { id: 'catalog', label: 'Library Catalog', icon: <BookIcon size={20} />, badge: '1.3k' },
    { id: 'inventory', label: 'Asset Inventory', icon: <LayersIcon size={20} /> },
    { id: 'patrons', label: 'Patron Directory', icon: <UsersIcon size={20} />, badge: '583' },
    { id: 'attendance', label: 'Attendant', icon: <BarcodeIcon size={20} /> },
    { id: 'analytics', label: 'Leaderboard & Stats', icon: <TrophyIcon size={20} /> },
  ];

  const managementItems: NavItem[] = [];
  if (isSuperOrAdmin || canManageCirculation(userRole)) {
    managementItems.push({ id: 'circulations', label: 'Loans & Returns', icon: <ClockIcon size={20} />, badge: 'Loans', badgeVariant: 'warning' });
    managementItems.push({ id: 'summaries', label: 'Book Summaries', icon: <ActivityIcon size={20} />, badge: 'Reviews', badgeVariant: 'primary' });
  }
  if (isSuperOrAdmin || canManageCohorts(userRole)) {
    managementItems.push({ id: 'cohorts', label: 'Cohort Academy', icon: <UsersIcon size={20} />, badge: 'Academy' });
  }
  if (isSuperOrAdmin || canManageCompetitions(userRole)) {
    managementItems.push({ id: 'competitions', label: 'Reading Competition', icon: <TrophyIcon size={20} />, badge: 'Contest', badgeVariant: 'warning' });
  }
  if (isSuperOrAdmin || canManageCertificates(userRole)) {
    managementItems.push({ id: 'certificates', label: 'Certificate Studio', icon: <AwardIcon size={20} />, badge: 'Studio', badgeVariant: 'primary' });
  }
  if (isSuperOrAdmin || canPublishArticles(userRole)) {
    managementItems.push({ id: 'transcomm', label: 'Transcomm Hub', icon: <BookIcon size={20} />, badge: 'Values', badgeVariant: 'primary' });
  }

  const systemItems: NavItem[] = [];
  if (isSuperOrAdmin) {
    systemItems.push({ id: 'admin', label: 'Staff Admin & Security', icon: <SettingsIcon size={20} /> });
  }

  const navSections: NavSection[] = [
    {
      title: 'WORKSPACE',
      items: workspaceItems,
    },
    ...(managementItems.length > 0
      ? [
          {
            title: 'MANAGEMENT',
            items: managementItems,
          },
        ]
      : []),
    ...(systemItems.length > 0
      ? [
          {
            title: 'SYSTEM',
            items: systemItems,
          },
        ]
      : []),
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleItemClick = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
    } else {
      if (id === 'dashboard') router.push('/dashboard');
      else if (id === 'catalog') router.push('/dashboard/catalog');
      else if (id === 'inventory') router.push('/dashboard/inventory');
      else if (id === 'circulations') router.push('/dashboard/circulations');
      else if (id === 'summaries') router.push('/dashboard/summaries');
      else if (id === 'patrons') router.push('/dashboard/patrons');
      else if (id === 'attendance') router.push('/dashboard/attendance');
      else if (id === 'analytics') router.push('/dashboard/leaderboard');
      else if (id === 'cohorts') router.push('/dashboard/cohorts');
      else if (id === 'competitions') router.push('/dashboard/competitions/reading');
      else if (id === 'certificates') router.push('/dashboard/certificates');
      else if (id === 'transcomm') router.push('/dashboard/transcomm');
      else if (id === 'admin') router.push('/dashboard/admin');
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
    <AppShellContext.Provider value={true}>
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
              onClick={handleOpenNotifications}
              sx={{
                p: 1,
                borderRadius: '8px',
                border: `1px solid ${dzfColors.surfaces.border}`,
                color: dzfColors.navy[700],
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.625rem',
                    height: 16,
                    minWidth: 16,
                    px: 0.5,
                  },
                }}
              >
                <BellIcon size={18} />
              </Badge>
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

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleCloseNotifications}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 320, sm: 380 },
              maxHeight: 520,
              borderRadius: '16px',
              boxShadow: '0 12px 36px rgba(11, 29, 46, 0.2)',
              border: `1px solid ${dzfColors.surfaces.border}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Popover Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${dzfColors.surfaces.border}`,
            backgroundColor: dzfColors.surfaces.canvas,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: dzfColors.navy[900] }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} new`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: dzfColors.maroon[900],
                  color: '#ffffff',
                }}
              />
            )}
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              disabled={isUpdatingNotifs}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: dzfColors.navy[700],
                textTransform: 'none',
                p: 0.5,
                minWidth: 0,
                '&:hover': { backgroundColor: 'transparent', color: dzfColors.navy[950], textDecoration: 'underline' },
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* Notifications List */}
        <Box sx={{ overflowY: 'auto', flex: 1, maxHeight: 420 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: dzfColors.surfaces.canvas,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: dzfColors.surfaces.textMuted,
                  mb: 0.5,
                }}
              >
                <BellIcon size={22} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                No notifications yet
              </Typography>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, maxWidth: 220 }}>
                You&apos;ll be alerted when operational tasks are assigned to you.
              </Typography>
            </Box>
          ) : (
            notifications.map((notif) => (
              <Box
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  p: 1.75,
                  borderBottom: `1px solid ${dzfColors.surfaces.border}`,
                  cursor: 'pointer',
                  backgroundColor: notif.read ? '#ffffff' : 'rgba(2, 132, 199, 0.04)',
                  borderLeft: notif.read ? '3px solid transparent' : `3px solid ${dzfColors.gold[500]}`,
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: notif.read ? '#f8fafc' : 'rgba(2, 132, 199, 0.08)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, gap: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: notif.read ? 600 : 800,
                      color: notif.read ? dzfColors.navy[700] : dzfColors.navy[950],
                      fontSize: '0.8125rem',
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {notif.title}
                  </Typography>
                  {!notif.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: dzfColors.gold[500],
                        flexShrink: 0,
                        mt: 0.5,
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: dzfColors.surfaces.textSecondary,
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    mb: 0.75,
                  }}
                >
                  {notif.message}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: dzfColors.navy[700], fontWeight: 600 }}>
                    From: @{notif.senderUsername}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: dzfColors.surfaces.textMuted }}>
                    {new Date(notif.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Popover>
    </Box>
  </AppShellContext.Provider>
);
}

export default AppShell;
