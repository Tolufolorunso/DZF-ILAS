'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { dzfColors } from '@/theme/colors';
import { LeaderboardPatronEntry } from '@/lib/activity/service';
import { TrophyIcon } from '@/components/ui/DZFIcons';

interface LeaderboardPodiumProps {
  top3: LeaderboardPatronEntry[];
  monthYearName: string;
}

export function LeaderboardPodium({
  top3,
  monthYearName,
}: LeaderboardPodiumProps) {
  if (!top3 || top3.length === 0) {
    return (
      <Card
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f8f8f8, #ffffff)',
          border: `1px dashed ${dzfColors.surfaces.border}`,
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            p: 2,
            borderRadius: '50%',
            backgroundColor: dzfColors.gold[50],
            color: dzfColors.gold[700],
            mb: 1.5,
          }}
        >
          <TrophyIcon size={36} color={dzfColors.gold[700]} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: dzfColors.navy[700] }}>
          No Active Readers Logged for {monthYearName}
        </Typography>
        <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary, mt: 0.5 }}>
          Activity points will automatically populate the podium as patrons borrow books, attend classes, or submit book summaries.
        </Typography>
      </Card>
    );
  }

  const champion = top3[0];
  const runnerUp = top3.length > 1 ? top3[1] : null;
  const thirdPlace = top3.length > 2 ? top3[2] : null;

  return (
    <Card
      sx={{
        mb: 4,
        p: { xs: 2.5, md: 4 },
        background: 'linear-gradient(135deg, #17324d 0%, #0b1d2e 100%)',
        borderRadius: 3,
        boxShadow: '0 8px 30px rgba(11, 29, 46, 0.25)',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient aura */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204, 163, 73, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.5,
            borderRadius: 9999,
            backgroundColor: 'rgba(204, 163, 73, 0.15)',
            border: '1px solid rgba(204, 163, 73, 0.35)',
            color: '#cca349',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 1,
          }}
        >
          <TrophyIcon size={16} color="#cca349" />
          <span>Celebratory Readers Podium • {monthYearName}</span>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Top Academic Library Readers
        </Typography>
        <Typography variant="body2" sx={{ color: '#bed8e9', mt: 0.5, maxWidth: 600, mx: 'auto' }}>
          Honoring patrons with the highest reading and attendance engagement calculated via the DZF gamification engine.
        </Typography>
      </Box>

      {/* 3-Step Podium Grid */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'flex-end' },
          justifyContent: 'center',
          gap: { xs: 3, md: 2.5 },
          pt: { xs: 1, md: 4 },
          pb: { xs: 1, md: 2 },
          maxWidth: 960,
          mx: 'auto',
        }}
      >
        {/* 2nd Place: Runner-up (Left) */}
        {runnerUp ? (
          <Box
            sx={{
              flex: 1,
              order: { xs: 2, md: 1 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Patron Card */}
            <Box
              sx={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px 16px 0 0',
                p: 2.5,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <Avatar
                src={runnerUp.imageUrl}
                sx={{
                  width: 68,
                  height: 68,
                  mx: 'auto',
                  border: '3px solid #cbd5e1',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  bgcolor: '#334155',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  mb: 1.5,
                }}
              >
                {runnerUp.patronName?.charAt(0) || 'P'}
              </Avatar>

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.3, mb: 0.25 }}
              >
                {runnerUp.patronName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#94a3b8', display: 'block', mb: 1, fontFamily: 'monospace' }}
              >
                {runnerUp.patronBarcode} {runnerUp.class ? `• ${runnerUp.class}` : ''}
              </Typography>

              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#c084fc',
                    fontFamily: 'monospace',
                  }}
                >
                  {runnerUp.activityScore.toLocaleString()}{' '}
                  <Typography component="span" variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                    pts
                  </Typography>
                </Typography>
              </Box>

              {/* Activity Chips */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={`${runnerUp.booksReturned} returned`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
                <Chip
                  size="small"
                  label={`${runnerUp.classesAttended} classes`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              </Box>
            </Box>

            {/* Podium Pedestal */}
            <Box
              sx={{
                width: '100%',
                height: { xs: 48, md: 140 },
                background: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)',
                borderTop: '3px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0 0 12px 12px',
                boxShadow: 'inset 0 4px 12px rgba(255, 255, 255, 0.2)',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: 'rgba(255, 255, 255, 0.45)',
                  letterSpacing: '0.05em',
                }}
              >
                2
              </Typography>
            </Box>
          </Box>
        ) : null}

        {/* 1st Place: Champion (Center / Elevated) */}
        <Box
          sx={{
            flex: 1.15,
            order: { xs: 1, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Floating Champion Crown Ribbon */}
          <Box
            sx={{
              position: 'absolute',
              top: -14,
              px: 2,
              py: 0.5,
              borderRadius: 9999,
              background: 'linear-gradient(135deg, #dc3545, #fd7e14)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(220, 53, 69, 0.5)',
              fontWeight: 800,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              zIndex: 3,
            }}
          >
            <span>👑</span>
            <span>#1 Ranked Champion</span>
          </Box>

          {/* Patron Card */}
          <Box
            sx={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #f3c44f',
              borderRadius: '20px 20px 0 0',
              pt: 3.5,
              pb: 3,
              px: 3,
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(243, 196, 79, 0.25)',
            }}
          >
            <Avatar
              src={champion.imageUrl}
              sx={{
                width: 86,
                height: 86,
                mx: 'auto',
                border: '4px solid #f3c44f',
                boxShadow: '0 0 20px rgba(243, 196, 79, 0.45)',
                bgcolor: '#8b5e0b',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.6rem',
                mb: 1.5,
              }}
            >
              {champion.patronName?.charAt(0) || 'C'}
            </Avatar>

            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.25, mb: 0.25 }}
            >
              {champion.patronName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#fde047', display: 'block', mb: 1.5, fontFamily: 'monospace', fontWeight: 600 }}
            >
              {champion.patronBarcode} {champion.class ? `• ${champion.class}` : ''}
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: '#e879f9',
                  fontFamily: 'monospace',
                }}
              >
                {champion.activityScore.toLocaleString()}{' '}
                <Typography component="span" variant="body2" sx={{ color: '#fef08a', fontWeight: 700 }}>
                  pts
                </Typography>
              </Typography>
            </Box>

            {/* Activity Chips */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={`${champion.booksReturned} returned`}
                sx={{
                  bgcolor: 'rgba(253, 224, 71, 0.2)',
                  color: '#fef08a',
                  border: '1px solid rgba(253, 224, 71, 0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              />
              <Chip
                size="small"
                label={`${champion.classesAttended} classes`}
                sx={{
                  bgcolor: 'rgba(253, 224, 71, 0.2)',
                  color: '#fef08a',
                  border: '1px solid rgba(253, 224, 71, 0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              />
              <Chip
                size="small"
                label={`${champion.summariesApproved} summaries`}
                sx={{
                  bgcolor: 'rgba(253, 224, 71, 0.2)',
                  color: '#fef08a',
                  border: '1px solid rgba(253, 224, 71, 0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>

          {/* Podium Pedestal */}
          <Box
            sx={{
              width: '100%',
              height: { xs: 56, md: 190 },
              background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
              borderTop: '4px solid #fde047',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0 0 16px 16px',
              boxShadow: 'inset 0 4px 16px rgba(253, 224, 71, 0.35)',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.55)',
                letterSpacing: '0.05em',
              }}
            >
              1
            </Typography>
          </Box>
        </Box>

        {/* 3rd Place: Bronze (Right) */}
        {thirdPlace ? (
          <Box
            sx={{
              flex: 1,
              order: { xs: 3, md: 3 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Patron Card */}
            <Box
              sx={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px 16px 0 0',
                p: 2.5,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <Avatar
                src={thirdPlace.imageUrl}
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  border: '3px solid #cd7f32',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  bgcolor: '#78350f',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  mb: 1.5,
                }}
              >
                {thirdPlace.patronName?.charAt(0) || 'P'}
              </Avatar>

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.3, mb: 0.25 }}
              >
                {thirdPlace.patronName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#94a3b8', display: 'block', mb: 1, fontFamily: 'monospace' }}
              >
                {thirdPlace.patronBarcode} {thirdPlace.class ? `• ${thirdPlace.class}` : ''}
              </Typography>

              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#c084fc',
                    fontFamily: 'monospace',
                  }}
                >
                  {thirdPlace.activityScore.toLocaleString()}{' '}
                  <Typography component="span" variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                    pts
                  </Typography>
                </Typography>
              </Box>

              {/* Activity Chips */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={`${thirdPlace.booksReturned} returned`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
                <Chip
                  size="small"
                  label={`${thirdPlace.classesAttended} classes`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              </Box>
            </Box>

            {/* Podium Pedestal */}
            <Box
              sx={{
                width: '100%',
                height: { xs: 40, md: 100 },
                background: 'linear-gradient(180deg, #cd7f32 0%, #78350f 100%)',
                borderTop: '3px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0 0 12px 12px',
                boxShadow: 'inset 0 4px 12px rgba(255, 255, 255, 0.2)',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: 'rgba(255, 255, 255, 0.45)',
                  letterSpacing: '0.05em',
                }}
              >
                3
              </Typography>
            </Box>
          </Box>
        ) : null}
      </Box>
    </Card>
  );
}

export default LeaderboardPodium;
