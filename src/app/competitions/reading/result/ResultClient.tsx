'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  keyframes,
} from '@mui/material';
import {
  TrophyIcon,
  RefreshIcon,
  CheckCircleIcon,
  BookIcon as MenuBookIcon,
  StarIcon as GradeIcon,
  ArrowLeftIcon as ArrowBackIcon,
  PauseIcon,
  PlayIcon as PlayArrowIcon,
} from '@/components/ui/DZFIcons';

import {
  ICompetitionResultData,
  ICompetitionLeaderboardEntry,
} from '@/lib/competitions/types';

const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
`;

interface ResultClientProps {
  initialData: ICompetitionResultData;
}

export function ResultClient({ initialData }: ResultClientProps) {
  const [data, setData] = useState<ICompetitionResultData>(initialData);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(60);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchResults = useCallback(
    async (category: string = selectedCategory) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (data.sessionKey) params.set('sessionKey', data.sessionKey);
        if (category && category !== 'ALL') params.set('category', category);

        const res = await fetch(`/api/competitions/results?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
            setLastUpdated(new Date());
          }
        }
      } catch (err) {
        console.error('Failed to refresh competition results:', err);
      } finally {
        setLoading(false);
      }
    },
    [data.sessionKey, selectedCategory]
  );

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchResults(selectedCategory);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, fetchResults, selectedCategory]);

  const handleCategoryChange = (
    _event: React.SyntheticEvent,
    newValue: string
  ) => {
    setSelectedCategory(newValue);
    fetchResults(newValue);
    setCountdown(60);
  };

  // Helper for Category Tones from Section 7.3.7
  const getCategoryColor = (code: string) => {
    switch (code) {
      case 'SS1-3':
        return {
          gradient:
            'linear-gradient(135deg, rgba(255, 226, 152, 0.72), rgba(255, 251, 233, 0.95))',
          border: '#cca349',
          text: '#8d5600',
          badgeBg: '#fef3c7',
        };
      case 'JSS1-3':
        return {
          gradient:
            'linear-gradient(135deg, rgba(148, 229, 223, 0.55), rgba(243, 255, 254, 0.95))',
          border: '#14b8a6',
          text: '#0f766e',
          badgeBg: '#ccfbf1',
        };
      case 'P4-6':
        return {
          gradient:
            'linear-gradient(135deg, rgba(255, 185, 154, 0.55), rgba(255, 248, 243, 0.95))',
          border: '#f97316',
          text: '#c2410c',
          badgeBg: '#ffedd5',
        };
      case 'P1-3':
        return {
          gradient:
            'linear-gradient(135deg, rgba(207, 193, 255, 0.45), rgba(251, 248, 255, 0.95))',
          border: '#8b5cf6',
          text: '#6d28d9',
          badgeBg: '#ede9fe',
        };
      default:
        return {
          gradient:
            'linear-gradient(135deg, rgba(241, 245, 249, 0.8), rgba(255, 255, 255, 0.95))',
          border: '#cbd5e1',
          text: '#334155',
          badgeBg: '#f1f5f9',
        };
    }
  };

  // Helper for Medallion Gradients from Section 7.3.7
  const getMedallion = (rank: number) => {
    if (rank === 1) {
      return {
        bg: 'linear-gradient(135deg, #a56a00, #f3c44f)',
        color: '#ffffff',
        shadow: '0 4px 14px rgba(165, 106, 0, 0.4)',
        label: '🥇',
      };
    }
    if (rank === 2) {
      return {
        bg: 'linear-gradient(135deg, #4d6070, #c1ccd8)',
        color: '#ffffff',
        shadow: '0 4px 12px rgba(77, 96, 112, 0.35)',
        label: '🥈',
      };
    }
    if (rank === 3) {
      return {
        bg: 'linear-gradient(135deg, #7e4f25, #d3915b)',
        color: '#ffffff',
        shadow: '0 4px 12px rgba(126, 79, 37, 0.35)',
        label: '🥉',
      };
    }
    return {
      bg: '#17324d',
      color: '#ffffff',
      shadow: 'none',
      label: `#${rank}`,
    };
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 8 }}>
      {/* Top Header Navigation */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          py: 1.5,
          px: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'serif',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: '#6f1111',
                    fontSize: { xs: '1.1rem', md: '1.35rem' },
                  }}
                >
                  DZUELS
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    bgcolor: '#f1f5f9',
                    borderRadius: 1,
                    color: '#64748b',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    display: { xs: 'none', sm: 'inline-block' },
                  }}
                >
                  EDUCATIONAL FOUNDATION
                </Typography>
              </Link>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Link href="/competitions/reading" style={{ textDecoration: 'none' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ArrowBackIcon fontSize="small" />}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    textTransform: 'none',
                    fontSize: '0.8125rem',
                    '&:hover': { borderColor: '#6f1111', color: '#6f1111' },
                  }}
                >
                  Judge Desk
                </Button>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Dark Panel - Section 7.3.7 */}
      <Box
        sx={{
          background:
            'linear-gradient(180deg, rgba(18, 52, 81, 0.98), rgba(29, 78, 109, 0.94))',
          color: '#ffffff',
          pt: { xs: 5, md: 7 },
          pb: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '4px solid #cca349',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 3,
            }}
          >
            <Box>
              {/* Live Indicator Pill - Section 7.3.7 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.75,
                    py: 0.6,
                    borderRadius: '9999px',
                    bgcolor: 'rgba(255, 184, 63, 0.16)',
                    border: '1px solid rgba(255, 184, 63, 0.4)',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#ffb83f',
                      animation: `${pulse} 1.5s infinite ease-in-out`,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#ffd591',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                    }}
                  >
                    LIVE BROADCAST SCOREBOARD
                  </Typography>
                </Box>

                {!data.isPublished && (
                  <Chip
                    label="PROVISIONAL / EVALUATIONS IN PROGRESS"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.2)',
                      color: '#fca5a5',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  />
                )}
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'serif',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '1.85rem', sm: '2.4rem', md: '2.85rem' },
                  color: '#ffffff',
                }}
              >
                {data.sessionTitle || 'Reading Competition 2026'}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  mt: 0.5,
                  maxWidth: 620,
                  fontSize: { xs: '0.9rem', md: '1.05rem' },
                }}
              >
                Official live leaderboards, evaluator scoring rubrics, and reading metrics across Senior Secondary, Junior Secondary, and Primary schools.
              </Typography>
            </Box>

            {/* Live refresh & stats widget */}
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 2,
                p: 2,
                color: '#ffffff',
                minWidth: { xs: '100%', sm: 280 },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Auto-Refresh: {autoRefresh ? `every ${countdown}s` : 'Paused'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title={autoRefresh ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}>
                    <IconButton
                      size="small"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      sx={{ color: '#ffffff' }}
                    >
                      {autoRefresh ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh Now">
                    <IconButton
                      size="small"
                      onClick={() => fetchResults(selectedCategory)}
                      disabled={loading}
                      sx={{ color: '#ffffff' }}
                    >
                      {loading ? (
                        <CircularProgress size={16} sx={{ color: '#cca349' }} />
                      ) : (
                        <RefreshIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                Updated at {lastUpdated.toLocaleTimeString()}
              </Typography>

              {/* Macro stats quick summary */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1.5,
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Participants
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#fef08a' }}>
                    {data.stats.totalParticipants}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Books Evaluated
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#67e8f9' }}>
                    {data.stats.totalBooksEvaluated}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ mt: -3 }}>
        {/* Unpublished Warning Notice if applicable */}
        {!data.isPublished && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              border: '1px solid #fef08a',
              bgcolor: '#fffbeb',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400e' }}>
              Preliminary Live Scoring Session
            </Typography>
            <Typography variant="body2" sx={{ color: '#78350f', fontSize: '0.85rem' }}>
              Judges are actively scoring participants across categories. Scores and positions update continuously. Final certified rankings will be marked published upon completion.
            </Typography>
          </Alert>
        )}

        {/* Category Navigation Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            mb: 4,
          }}
        >
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTabs-indicator': {
                bgcolor: '#6f1111',
                height: 3,
              },
            }}
          >
            <Tab
              label="All Categories"
              value="ALL"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                minHeight: 56,
                color: selectedCategory === 'ALL' ? '#6f1111' : '#64748b',
              }}
            />
            {data.categories.map((cat) => (
              <Tab
                key={cat.code}
                value={cat.code}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{cat.label}</span>
                    <Chip
                      label={cat.count}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: selectedCategory === cat.code ? '#6f1111' : '#f1f5f9',
                        color: selectedCategory === cat.code ? '#ffffff' : '#64748b',
                      }}
                    />
                  </Box>
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  minHeight: 56,
                  color: selectedCategory === cat.code ? '#6f1111' : '#64748b',
                }}
              />
            ))}
          </Tabs>

          {/* Category Highlight Spotlight */}
          {selectedCategory !== 'ALL' && (
            <Box
              sx={{
                p: 2.5,
                background: getCategoryColor(selectedCategory).gradient,
                borderBottom: `2px solid ${getCategoryColor(selectedCategory).border}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: getCategoryColor(selectedCategory).text,
                    }}
                  >
                    Category Spotlight
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      fontFamily: 'serif',
                      color: '#1e293b',
                    }}
                  >
                    {data.categories.find((c) => c.code === selectedCategory)?.label || selectedCategory}
                  </Typography>
                </Box>
                <Chip
                  label="Tie-breaker: Books Read → Avg Grade → Verified"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.75)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#334155',
                  }}
                />
              </Box>
            </Box>
          )}
        </Paper>

        {/* Top 3 Celebratory Podium */}
        {data.podium.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrophyIcon sx={{ color: '#cca349', fontSize: 28 }} />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontFamily: 'serif',
                  color: '#17324d',
                }}
              >
                Category Podium Leaders
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2.5,
              }}
            >
              {data.podium.map((winner) => {
                const medallion = getMedallion(winner.rank);
                const categoryColor = getCategoryColor(winner.category);

                return (
                  <Card
                    key={winner.patronBarcode}
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      background: winner.rank === 1 ? categoryColor.gradient : '#ffffff',
                      boxShadow:
                        winner.rank === 1
                          ? '0 8px 24px rgba(204, 163, 73, 0.2)'
                          : '0 4px 12px rgba(0, 0, 0, 0.04)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'translateY(-3px)' },
                    }}
                  >
                    <Box
                      sx={{
                        height: 6,
                        background: medallion.bg,
                      }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: medallion.bg,
                            color: medallion.color,
                            boxShadow: medallion.shadow,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            fontWeight: 800,
                          }}
                        >
                          {medallion.label}
                        </Box>

                        <Chip
                          label={winner.category}
                          size="small"
                          sx={{
                            bgcolor: categoryColor.badgeBg,
                            color: categoryColor.text,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        />
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            fontSize: '1.15rem',
                            color: '#1e293b',
                            lineHeight: 1.3,
                          }}
                        >
                          {winner.patronName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: '#64748b',
                            display: 'block',
                            mt: 0.25,
                          }}
                        >
                          Barcode: {winner.patronBarcode}
                        </Typography>
                      </Box>

                      {/* Stat Metrics Box */}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 1,
                          mt: 2.5,
                          pt: 2,
                          borderTop: '1px solid #e2e8f0',
                          textAlign: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                            Books Read
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#6f1111' }}>
                            {winner.booksRead}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                            Avg Grade
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#166534' }}>
                            {winner.averageGrade}%
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                            Verified
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#0369a1' }}>
                            {winner.teacherVerifiedCount}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Full Leaderboard Table */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 2.5,
              borderBottom: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <GradeIcon sx={{ color: '#6f1111' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Official Ranked Standings
              </Typography>
              <Chip
                label={`${data.leaderboard.length} Ranked`}
                size="small"
                sx={{ bgcolor: '#f1f5f9', fontWeight: 600, color: '#475569' }}
              />
            </Box>

            <Typography variant="caption" sx={{ color: '#64748b', display: { xs: 'none', sm: 'block' } }}>
              Max 2 daily check-ins enforced in Africa/Lagos
            </Typography>
          </Box>

          {data.leaderboard.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <MenuBookIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
              <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700 }}>
                No Competition Records Recorded Yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 440, mx: 'auto', mt: 0.5 }}>
                No completed book evaluations match this category. Competition judges can log evaluations from the staff desk.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', width: 80 }}>
                      RANK
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>
                      STUDENT / PATRON
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>
                      CATEGORY
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                      BOOKS READ
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                      AVERAGE GRADE
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>
                      VERIFIED
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                      TOTAL POINTS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.leaderboard.map((row: ICompetitionLeaderboardEntry) => {
                    const medallion = getMedallion(row.rank);
                    const categoryColor = getCategoryColor(row.category);

                    return (
                      <TableRow
                        key={row.patronBarcode}
                        hover
                        sx={{
                          bgcolor: row.rank <= 3 ? 'rgba(255, 251, 235, 0.4)' : 'inherit',
                          '&:hover': {
                            bgcolor: 'rgba(111, 17, 17, 0.03) !important',
                          },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: medallion.bg,
                              color: medallion.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: row.rank <= 3 ? '1.1rem' : '0.8125rem',
                              boxShadow: medallion.shadow,
                            }}
                          >
                            {row.rank <= 3 ? medallion.label : row.rank}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: '#1e293b' }}
                          >
                            {row.patronName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: 'monospace', color: '#64748b' }}
                          >
                            {row.patronBarcode}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={row.category}
                            size="small"
                            sx={{
                              bgcolor: categoryColor.badgeBg,
                              color: categoryColor.text,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0.5,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <MenuBookIcon sx={{ fontSize: 16, color: '#6f1111' }} />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 800, color: '#6f1111' }}
                            >
                              {row.booksRead}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={`${row.averageGrade}%`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.8125rem',
                              bgcolor:
                                row.averageGrade >= 80
                                  ? '#dcfce7'
                                  : row.averageGrade >= 60
                                  ? '#fef3c7'
                                  : '#f1f5f9',
                              color:
                                row.averageGrade >= 80
                                  ? '#166534'
                                  : row.averageGrade >= 60
                                  ? '#92400e'
                                  : '#475569',
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title={`${row.teacherVerifiedCount} Teacher Verified Evaluations`}>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.5,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <CheckCircleIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {row.teacherVerifiedCount}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>

                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              color: '#1e293b',
                            }}
                          >
                            {row.totalGradePoints} pts
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Container>
    </Box>
  );
}
