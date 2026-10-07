'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Link from 'next/link';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFBadge,
  Mono,
  UsersIcon,
  ClockIcon,
  TrophyIcon,
  LayersIcon,
} from '@/components';
import { ITokenPayload } from '@/lib/auth/jwt';

export interface HomeStatData {
  books: number;
  patrons: number;
  cohorts: number;
  staff: number;
}

export interface RealBookItem {
  id: string;
  title: string;
  author: string;
  barcode: string;
  classification: string;
}

export interface StaffItem {
  id: string;
  name: string;
  role: string;
  username: string;
  isToday?: boolean;
  birthdayText?: string;
}

interface HomePageClientProps {
  stats: HomeStatData;
  recentBooks: RealBookItem[];
  staffList: StaffItem[];
  user: ITokenPayload | null;
}

export default function HomePageClient({
  stats,
  recentBooks,
  staffList,
  user,
}: HomePageClientProps) {
  // Select single celebrating or upcoming birthday staff member
  const birthdayStaff = React.useMemo(() => {
    if (!staffList || staffList.length === 0) return null;
    return staffList[0];
  }, [staffList]);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: dzfColors.surfaces.canvas,
        color: dzfColors.surfaces.textPrimary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
        {/* Top Academic Navigation Bar */}
        <Box
          component="header"
          sx={{
            backgroundColor: '#ffffff',
            borderBottom: `1px solid ${dzfColors.surfaces.border}`,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            position: 'sticky',
            top: 0,
            zIndex: 1100,
          }}
        >
          <Container sx={{ maxWidth: '1200px !important', px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.5,
            }}
          >
            {/* Brand Logo & Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src="/images/logo.png"
                alt="Dzuels Educational Foundation Logo"
                sx={{
                  width: 44,
                  height: 44,
                  objectFit: 'contain',
                  p: 0.5,
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                }}
              />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    lineHeight: 1.2,
                    color: dzfColors.navy[700],
                    letterSpacing: '-0.01em',
                  }}
                >
                  DZF-ILAS
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: dzfColors.gold[700],
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'block',
                  }}
                >
                  Dzuels Integrated Library & Administrative System
                </Typography>
              </Box>
            </Box>

            {/* Quick Links & Auth CTA */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2.5 }}>
                <Link href="#instructions" style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: dzfColors.navy[700],
                      '&:hover': { color: dzfColors.maroon[900] },
                    }}
                  >
                    Instructions & Policies
                  </Typography>
                </Link>
                <Link href="#notices" style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: dzfColors.navy[700],
                      '&:hover': { color: dzfColors.maroon[900] },
                    }}
                  >
                    Notices & News
                  </Typography>
                </Link>
                <Link href="#birthdays" style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: dzfColors.gold[700],
                      '&:hover': { color: dzfColors.gold[900] },
                    }}
                  >
                    Staff Birthdays 🎂
                  </Typography>
                </Link>
                <Link href="#acquisitions" style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: dzfColors.navy[700],
                      '&:hover': { color: dzfColors.maroon[900] },
                    }}
                  >
                    New Acquisitions
                  </Typography>
                </Link>
              </Box>

              {user ? (
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <DZFButton variant="primary" startIcon={<LayersIcon size={16} />}>
                    Enter Dashboard ({user.name.split(' ')[0]})
                  </DZFButton>
                </Link>
              ) : (
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <DZFButton variant="primary">
                    Staff Sign In
                  </DZFButton>
                </Link>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Welcome Banner */}
      <Box
        sx={{
          backgroundColor: dzfColors.navy[950],
          color: '#ffffff',
          pt: { xs: 5, md: 7 },
          pb: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          borderBottom: `4px solid ${dzfColors.gold[500]}`,
        }}
      >
        <Container sx={{ maxWidth: '1200px !important', px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DZFBadge label="Foundation Station AAoJ" variant="top10" solid />
                <DZFBadge label="Live Institutional Database" variant="success" dot />
              </Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '1.875rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 800,
                  lineHeight: 1.15,
                  mb: 2,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                }}
              >
                Welcome to Dzuels Integrated Library & Administrative System
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  color: '#e2e8f0',
                  lineHeight: 1.6,
                  maxWidth: 780,
                  mb: 3.5,
                }}
              >
                The centralized operational workspace and digital platform for Dzuels Educational
                Foundation. Managing monograph cataloging, barcode identity, book circulation, and community digital literacy academies with academic precision and integrity.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Link href={user ? '/dashboard' : '/auth/login'} style={{ textDecoration: 'none' }}>
                  <DZFButton variant="primary" size="large">
                    {user ? 'Open Staff Workspace' : 'Sign In to Staff Workspace'}
                  </DZFButton>
                </Link>
                <Link href="#instructions" style={{ textDecoration: 'none' }}>
                  <DZFButton
                    variant="secondary"
                    size="large"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.12) !important',
                      color: '#ffffff !important',
                      border: `1.5px solid ${dzfColors.gold[400]} !important`,
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                      '&:hover': {
                        backgroundColor: `${dzfColors.gold[500]} !important`,
                        color: `${dzfColors.navy[950]} !important`,
                        borderColor: `${dzfColors.gold[400]} !important`,
                        boxShadow: '0 4px 14px rgba(204, 163, 73, 0.4)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    View Operating Instructions
                  </DZFButton>
                </Link>
              </Box>
            </Grid>

            {/* Live Database Key Metrics (Real DB Data!) */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    display: 'block',
                    fontWeight: 700,
                    color: dzfColors.gold[400],
                    letterSpacing: '0.08em',
                    mb: 2,
                  }}
                >
                  LIVE INSTITUTIONAL METRICS
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Monographs
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff' }}>
                        {stats.books.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.gold[400], fontSize: '0.6875rem' }}>
                        Cataloged volumes
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Active Patrons
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff' }}>
                        {stats.patrons.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.gold[400], fontSize: '0.6875rem' }}>
                        Students & Teachers
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Academy Cohorts
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff' }}>
                        {stats.cohorts.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.gold[400], fontSize: '0.6875rem' }}>
                        Digital sessions
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        Active Staff
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff' }}>
                        {stats.staff.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.gold[400], fontSize: '0.6875rem' }}>
                        Educators & Leads
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content Container with balanced professional margins, strictly capped at 1200px */}
      <Container sx={{ maxWidth: '1200px !important', py: 5, px: { xs: 2, sm: 3 } }}>
        
        {/* SECTION 1: Staff Birthday Greetings & Spotlight (Single Staff Member) */}
        {birthdayStaff && (
          <Box id="birthdays" sx={{ mb: 6 }}>
            <Card
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                border: `1.5px solid ${dzfColors.gold[400]}`,
                background: 'linear-gradient(135deg, #ffffff 0%, #fefbee 100%)',
                boxShadow: '0 4px 20px rgba(204, 163, 73, 0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(204, 163, 73, 0.1)',
                  pointerEvents: 'none',
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Chip
                  label={birthdayStaff.isToday ? "🎉 TODAY'S BIRTHDAY CELEBRANT" : "📅 UPCOMING STAFF BIRTHDAY"}
                  size="small"
                  sx={{
                    backgroundColor: birthdayStaff.isToday ? dzfColors.gold[500] : dzfColors.navy[700],
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.04em',
                  }}
                />
                <Typography variant="caption" sx={{ color: dzfColors.gold[900], fontWeight: 700 }}>
                  {birthdayStaff.isToday ? 'Celebrating Today' : (birthdayStaff.birthdayText || 'Upcoming Celebrant')}
                </Typography>
              </Box>

              <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Avatar
                    sx={{
                      width: { xs: 64, sm: 80 },
                      height: { xs: 64, sm: 80 },
                      backgroundColor: dzfColors.maroon[900],
                      border: `3px solid ${dzfColors.gold[400]}`,
                      fontWeight: 800,
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(111, 17, 17, 0.25)',
                    }}
                  >
                    {birthdayStaff.name.charAt(0)}
                  </Avatar>
                </Grid>

                <Grid size={{ xs: 12, sm: 'grow' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        fontWeight: 800,
                        color: dzfColors.navy[700],
                        lineHeight: 1.2,
                      }}
                    >
                      {birthdayStaff.isToday
                        ? `Happy Birthday, ${birthdayStaff.name}! 🎂`
                        : `Upcoming Birthday: ${birthdayStaff.name} 🎈`}
                    </Typography>
                    <DZFBadge
                      label={birthdayStaff.role.replace('_', ' ').toUpperCase()}
                      variant="top10"
                      solid
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: dzfColors.gold[700],
                      fontWeight: 700,
                      display: 'block',
                      mb: 1.5,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {birthdayStaff.isToday
                      ? 'Dzuels Educational Foundation Staff Celebrant'
                      : `Next in line for birthday celebrations at Dzuels Educational Foundation (${birthdayStaff.birthdayText || 'Upcoming'})`}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: dzfColors.surfaces.textSecondary,
                      lineHeight: 1.6,
                      maxWidth: 800,
                    }}
                  >
                    {birthdayStaff.isToday
                      ? 'The leadership, colleagues, and student community of Dzuels Educational Foundation celebrate your dedicated service, mentorship, and vital contributions to our academic mission. May your new year be blessed with divine wisdom, sound health, joy, and fulfilling achievements!'
                      : `Sending advance felicitations and warm thoughts to ${birthdayStaff.name} as their birthday approaches! We honor your ongoing dedication and vital contributions to our library and learning community.`}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Box>
        )}

        {/* SECTION 2: Institutional Notices & Information Board */}
        <Box id="notices" sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  color: dzfColors.maroon[900],
                  letterSpacing: '0.08em',
                }}
              >
                OFFICIAL BULLETIN BOARD
              </Typography>
              <Typography variant="h2" sx={{ fontSize: '1.65rem', fontWeight: 800, color: dzfColors.navy[700] }}>
                Institutional Notices & Information
              </Typography>
            </Box>
            <DZFBadge label="Station AAoJ Active" variant="info" dot />
          </Box>

          <Grid container spacing={3}>
            {/* Notice 1: Operating Hours */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: '100%', borderTop: `4px solid ${dzfColors.navy[700]}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <ClockIcon size={20} color={dzfColors.navy[700]} />
                  <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[700] }}>
                    Library Operating Hours
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2, lineHeight: 1.5 }}>
                  The academic library at Foundation Station AAoJ is open to all registered patrons, educators, and literacy fellows:
                </Typography>
                <Box sx={{ pl: 1, borderLeft: `2px solid ${dzfColors.surfaces.border}`, mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
                    Monday – Friday: 8:00 AM – 5:00 PM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
                    Saturday Cohorts: 10:00 AM – 2:00 PM
                  </Typography>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                    Sunday: Closed for maintenance
                  </Typography>
                </Box>
                <DZFBadge label="Regular Term Session" variant="success" dot />
              </Card>
            </Grid>

            {/* Notice 2: Reading Competitions */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: '100%', borderTop: `4px solid ${dzfColors.gold[500]}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TrophyIcon size={20} color={dzfColors.gold[700]} />
                  <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[700] }}>
                    Reading Competition 2026
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2, lineHeight: 1.5 }}>
                  Student category assessments are underway across Senior Secondary (SS1-3), Junior Secondary (JSS1-3), and Primary (P1-6) brackets.
                </Typography>
                <Box sx={{ pl: 1, borderLeft: `2px solid ${dzfColors.gold[200]}`, mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
                    Scoring Rubric: Reading Speed & Comprehension
                  </Typography>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                    Monitored by designated staff evaluators
                  </Typography>
                </Box>
                <DZFBadge label="Active Evaluation" variant="top10" dot />
              </Card>
            </Grid>

            {/* Notice 3: Cohort Digital Literacy Academy */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: '100%', borderTop: `4px solid ${dzfColors.maroon[900]}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <UsersIcon size={20} color={dzfColors.maroon[900]} />
                  <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[700] }}>
                    Digital Academy & Cohorts
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mb: 2, lineHeight: 1.5 }}>
                  Attendance check-in for digital literacy students is strictly via barcode scan at the door. Roster synchronization with Google Cloud runs automatically.
                </Typography>
                <Box sx={{ pl: 1, borderLeft: `2px solid ${dzfColors.maroon[200]}`, mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700] }}>
                    Scanner Station 1 & 2 Active
                  </Typography>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                    Instructor sign-off required for lab credit
                  </Typography>
                </Box>
                <DZFBadge label="121 Batches Enrolled" variant="primary" dot />
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* SECTION 3: Library Staff & Member Operating Guidelines (Instructions) */}
        <Box id="instructions" sx={{ mb: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                fontWeight: 700,
                color: dzfColors.gold[700],
                letterSpacing: '0.08em',
              }}
            >
              OPERATING PROTOCOL
            </Typography>
            <Typography variant="h2" sx={{ fontSize: '1.65rem', fontWeight: 800, color: dzfColors.navy[700] }}>
              Library Staff Instructions & Circulation Rules
            </Typography>
            <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, maxWidth: 800 }}>
              Standard operating procedures for desk librarians, roving attendants, instructors, and registered patrons.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Rule 1: Circulation Limits */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      backgroundColor: dzfColors.maroon[50],
                      border: `1.5px solid ${dzfColors.maroon[300]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: dzfColors.maroon[900],
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </Box>
                  <Box>
                    <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[700], mb: 0.5 }}>
                      Circulation Limits & Loan Duration
                    </Typography>
                    <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, lineHeight: 1.6 }}>
                      • <strong>Student Patrons:</strong> Up to <strong>2 books</strong> simultaneously for <strong>14 calendar days</strong>.<br />
                      • <strong>Teachers & Staff:</strong> Up to <strong>5 books</strong> simultaneously for <strong>30 calendar days</strong>.<br />
                      • <strong>Renewals:</strong> Allowed once per book, provided no active hold exists in the reservation queue.
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Rule 2: Barcode Thermal Labels */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      backgroundColor: dzfColors.gold[100],
                      border: `1.5px solid ${dzfColors.gold[400]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: dzfColors.gold[900],
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </Box>
                  <Box>
                    <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[700], mb: 0.5 }}>
                      60mm × 40mm Thermal Barcode Label Standards
                    </Typography>
                    <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, lineHeight: 1.6 }}>
                      • All patron cards and catalog labels are output on <strong>60×40mm thermal label paper</strong>.<br />
                      • <strong>Hierarchy:</strong> Organization name on top, barcode graphic + number at center, patron/item name at bottom with uniform vertical gaps.<br />
                      • Laser and CCD scanners must auto-submit transactions without manual keyboard Enter.
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Rule 3: Attendance Scanner Protocol */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      backgroundColor: dzfColors.navy[50],
                      border: `1.5px solid ${dzfColors.navy[200]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: dzfColors.navy[700],
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </Box>
                  <Box>
                    <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[700], mb: 0.5 }}>
                      Daily Attendance & Cohort Check-In
                    </Typography>
                    <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, lineHeight: 1.6 }}>
                      • Every visitor must present their thermal barcode card upon entering the library or computer laboratory.<br />
                      • Attendance scans immediately update patron monthly activity score and digital literacy progress.<br />
                      • Unregistered visitors must be routed to the registration desk for instant photo capture.
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Rule 4: Monograph Shelving & Dewey Classification */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      backgroundColor: dzfColors.status.success.bg,
                      border: `1.5px solid ${dzfColors.status.success.badge}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: dzfColors.status.success.text,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    4
                  </Box>
                  <Box>
                    <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[700], mb: 0.5 }}>
                      Preservation & Dewey Decimal Shelving
                    </Typography>
                    <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, lineHeight: 1.6 }}>
                      • Returned monographs must be inspected for physical damage before reshelving.<br />
                      • Shelving order follows Dewey Decimal call numbers (e.g., 400 for Languages, 500 for Pure Sciences, 800 for Literature).<br />
                      • Damaged copies must be flagged in the inventory ledger for repair or replacement.
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* SECTION 4: Real Database Catalog Acquisitions (Zero Mock Data!) */}
        <Box id="acquisitions" sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  color: dzfColors.maroon[900],
                  letterSpacing: '0.08em',
                }}
              >
                LIVE MONOGRAPH COLLECTION
              </Typography>
              <Typography variant="h2" sx={{ fontSize: '1.65rem', fontWeight: 800, color: dzfColors.navy[700] }}>
                Recent Catalog Acquisitions & Verified Holdings
              </Typography>
            </Box>
            <DZFBadge label="Direct Mongoose Feed" variant="primary" dot />
          </Box>

          <Grid container spacing={2.5}>
            {recentBooks.map((book) => (
              <Grid key={book.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    p: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: `1px solid ${dzfColors.surfaces.border}`,
                    '&:hover': {
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06)',
                      borderColor: dzfColors.gold[400],
                    },
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Mono sx={{ fontSize: '0.8125rem', color: dzfColors.navy[700] }}>
                        {book.barcode}
                      </Mono>
                      <DZFBadge label={`Class ${book.classification || '800'}`} variant="info" />
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: dzfColors.navy[700],
                        lineHeight: 1.3,
                        mb: 0.5,
                      }}
                    >
                      {book.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted, mb: 2 }}>
                      By {book.author || 'Author on file'}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 1.5, borderTop: `1px solid ${dzfColors.surfaces.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <DZFBadge label="Verified In DB" variant="success" dot />
                    <Typography variant="caption" sx={{ color: dzfColors.gold[700], fontWeight: 600 }}>
                      DZF Library
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Institutional Academic Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: dzfColors.navy[950],
          color: '#ffffff',
          py: 5,
          borderTop: `1px solid rgba(255, 255, 255, 0.12)`,
        }}
      >
        <Container sx={{ maxWidth: '1200px !important', px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Box
                  component="img"
                  src="/images/logo.png"
                  alt="Dzuels Logo"
                  sx={{
                    width: 36,
                    height: 36,
                    objectFit: 'contain',
                    backgroundColor: '#ffffff',
                    p: 0.5,
                    borderRadius: '8px',
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff' }}>
                  Dzuels Educational Foundation (DZF)
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 460 }}>
                Integrated Library & Administrative System (DZF-ILAS) — Station AAoJ. Fostering literacy, academic discipline, and technological empowerment.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                All Rights Reserved &copy; {new Date().getFullYear()} Dzuels Educational Foundation.
              </Typography>
              <Typography variant="caption" sx={{ color: dzfColors.gold[400], fontWeight: 600 }}>
                Version 1.0 Rebuild • Dual-Mode Web & Mobile REST API
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
