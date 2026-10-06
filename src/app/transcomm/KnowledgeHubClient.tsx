'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { TranscommPublicHeader } from '@/components/transcomm';
import { dzfColors } from '@/theme/colors';
import { canPublishArticles } from '@/lib/auth/rbac';
import type { ITokenPayload } from '@/lib/auth/jwt';
import type {
  ITranscommArticleData,
  DRNICERValue,
  TranscommCategory,
} from '@/lib/transcomm/types';
import { TRANSCOMM_CATEGORY_CONFIG } from '@/lib/transcomm/types';
import { DRNICERPill } from '@/components/transcomm/DRNICERPill';
import { ArticleCard } from '@/components/transcomm/ArticleCard';
import { DZFEmptyState } from '@/components/ui/DZFEmptyState';
import { DZFSearchInput } from '@/components/ui/DZFSearchInput';
import { EditIcon, BookIcon } from '@/components/ui/DZFIcons';

export interface KnowledgeHubClientProps {
  user: ITokenPayload | null;
  initialArticles: ITranscommArticleData[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ALL_DRNICER_KEYS: DRNICERValue[] = [
  'Discipline',
  'Respect',
  'Nobility',
  'Integrity',
  'Compassion',
  'Excellence',
  'Responsibility',
];

export function KnowledgeHubClient({
  user,
  initialArticles,
  initialPagination,
}: KnowledgeHubClientProps) {
  const [articles, setArticles] = React.useState<ITranscommArticleData[]>(initialArticles);
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [selectedPillar, setSelectedPillar] = React.useState<DRNICERValue | 'all'>('all');
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(initialPagination.page);
  const [totalPages, setTotalPages] = React.useState(initialPagination.totalPages);

  const canEdit = user ? canPublishArticles(user.role) : false;

  const fetchArticles = React.useCallback(
    async (
      cat: string,
      pillar: DRNICERValue | 'all',
      searchTerm: string,
      targetPage = 1
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (cat && cat !== 'all') params.set('category', cat);
        if (pillar && pillar !== 'all') params.set('drnicerValue', pillar);
        if (searchTerm && searchTerm.trim()) params.set('search', searchTerm.trim());
        params.set('page', String(targetPage));
        params.set('limit', '12');

        const res = await fetch(`/api/transcomm/articles?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setArticles(json.data);
          setPage(json.pagination.page);
          setTotalPages(json.pagination.totalPages);
        }
      } catch (err) {
        console.error('Failed to load articles:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search / filter trigger
  React.useEffect(() => {
    const handler = setTimeout(() => {
      fetchArticles(selectedCategory, selectedPillar, search, 1);
    }, 250);
    return () => clearTimeout(handler);
  }, [selectedCategory, selectedPillar, search, fetchArticles]);

  const handlePillarClick = (pillar: DRNICERValue) => {
    setSelectedPillar((prev) => (prev === pillar ? 'all' : pillar));
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedPillar('all');
  };

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const remainingArticles = articles.length > 1 ? articles.slice(1) : [];

  const pageContent = (
    <Box sx={{ pb: 8, backgroundColor: '#ffffff', minHeight: '100vh', flex: 1 }}>
      {/* Hero Header Section */}
      <Box
          sx={{
            py: { xs: 4, md: 6 },
            px: { xs: 2, md: 4 },
            background: `linear-gradient(135deg, ${dzfColors.navy[950]} 0%, ${dzfColors.navy[900]} 60%, ${dzfColors.maroon[950]} 100%)`,
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gold accent band */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${dzfColors.gold[400]}, ${dzfColors.gold[500]})`,
            }}
          />

          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: dzfColors.gold[400],
                  }}
                >
                  TRANSCOMM EDITORIAL PLATFORM
                </Typography>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    color: '#ffffff',
                    fontSize: { xs: '1.8rem', md: '2.5rem' },
                    lineHeight: 1.2,
                    mt: 0.5,
                  }}
                >
                  DRNICER Values & Leadership Hub
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: dzfColors.navy[200],
                    maxWidth: 720,
                    mt: 1,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                  }}
                >
                  Fostering intellectual vigor, personal discipline, and ethical
                  leadership through the Dzuels Educational Foundation core pillars.
                </Typography>
              </Box>

              {/* Management Button for Staff */}
              {canEdit && (
                <Button
                  component={Link}
                  href="/transcomm/manage"
                  variant="contained"
                  startIcon={<EditIcon size={18} />}
                  sx={{
                    backgroundColor: dzfColors.maroon[800],
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2.5,
                    py: 1,
                    boxShadow: '0 4px 14px rgba(111, 17, 17, 0.4)',
                    '&:hover': {
                      backgroundColor: dzfColors.maroon[700],
                    },
                  }}
                >
                  Editorial Studio
                </Button>
              )}
            </Box>

            {/* DRNICER Pillars Interactive Filter Bar */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: dzfColors.navy[200],
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  mb: 1.25,
                }}
              >
                FILTER BY INSTITUTIONAL PILLAR
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.25,
                }}
              >
                <Button
                  size="small"
                  onClick={() => setSelectedPillar('all')}
                  sx={{
                    borderRadius: '9999px',
                    px: 1.5,
                    py: 0.4,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor:
                      selectedPillar === 'all'
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  All Pillars
                </Button>

                {ALL_DRNICER_KEYS.map((pillar) => (
                  <DRNICERPill
                    key={pillar}
                    pillar={pillar}
                    size="medium"
                    variant={selectedPillar === pillar ? 'filled' : 'subtle'}
                    selected={selectedPillar === pillar}
                    onClick={() => handlePillarClick(pillar)}
                  />
                ))}
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Content Directory & Filter Controls */}
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {/* Controls Bar: Category Tabs & Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              pb: 2,
              mb: 4,
              borderBottom: `1px solid ${dzfColors.surfaces.border}`,
            }}
          >
            {/* Category Navigation Tabs */}
            <Tabs
              value={selectedCategory}
              onChange={(_, val) => setSelectedCategory(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                maxWidth: { xs: '100%', md: '75%' },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  minHeight: 44,
                  color: dzfColors.surfaces.textSecondary,
                  '&.Mui-selected': {
                    color: dzfColors.navy[900],
                    fontWeight: 700,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: dzfColors.maroon[800],
                  height: 3,
                },
              }}
            >
              <Tab value="all" label="All Knowledge" />
              <Tab value="drnicer-values" label="DRNICER Values" />
              <Tab value="leadership-basics" label="Leadership Basics" />
              <Tab value="communication" label="Communication" />
              <Tab value="teamwork" label="Teamwork" />
              <Tab value="problem-solving" label="Problem Solving" />
              <Tab value="confidence" label="Confidence" />
              <Tab value="inspiration" label="Inspiration" />
            </Tabs>

            {/* Keyword Search */}
            <Box sx={{ width: { xs: '100%', md: 280 } }}>
              <DZFSearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search articles, authors..."
              />
            </Box>
          </Box>

          {/* Active Filter Pill indicator if filtered */}
          {(selectedCategory !== 'all' || selectedPillar !== 'all' || search) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 600 }}>
                Active filters:
              </Typography>
              {selectedCategory !== 'all' && (
                <Typography variant="caption" sx={{ px: 1, py: 0.25, bgcolor: dzfColors.navy[50], borderRadius: 1 }}>
                  Category: {TRANSCOMM_CATEGORY_CONFIG[selectedCategory as TranscommCategory]?.label || selectedCategory}
                </Typography>
              )}
              {selectedPillar !== 'all' && (
                <Typography variant="caption" sx={{ px: 1, py: 0.25, bgcolor: dzfColors.gold[100], borderRadius: 1 }}>
                  Pillar: {selectedPillar}
                </Typography>
              )}
              {search && (
                <Typography variant="caption" sx={{ px: 1, py: 0.25, bgcolor: dzfColors.surfaces.canvas, borderRadius: 1 }}>
                  Search: &quot;{search}&quot;
                </Typography>
              )}
              <Button size="small" onClick={handleClearFilters} sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0 }}>
                Reset
              </Button>
            </Box>
          )}

          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: dzfColors.maroon[800] }} />
            </Box>
          )}

          {/* Empty State */}
          {!loading && articles.length === 0 && (
            <DZFEmptyState
              icon={<BookIcon size={44} color={dzfColors.surfaces.textMuted} />}
              title="No Articles Found"
              description="No published articles match your current category, pillar, or search criteria."
              actionLabel="Reset Filters"
              onAction={handleClearFilters}
            />
          )}

          {/* Article Grid */}
          {!loading && articles.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Featured / Lead Article */}
              {featuredArticle && !search && selectedCategory === 'all' && selectedPillar === 'all' && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: dzfColors.maroon[800],
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    FEATURED PUBLICATION
                  </Typography>
                  <ArticleCard article={featuredArticle} featured />
                </Box>
              )}

              {/* Standard Articles Grid */}
              <Box>
                <Grid container spacing={3}>
                  {(search || selectedCategory !== 'all' || selectedPillar !== 'all'
                    ? articles
                    : remainingArticles
                  ).map((art) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={art._id}>
                      <ArticleCard article={art} />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Pagination Info & Controls */}
              {totalPages > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    pt: 4,
                  }}
                >
                  <Button
                    variant="outlined"
                    disabled={page <= 1}
                    onClick={() => fetchArticles(selectedCategory, selectedPillar, search, page - 1)}
                    sx={{ textTransform: 'none' }}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2" sx={{ color: dzfColors.surfaces.textSecondary }}>
                    Page {page} of {totalPages}
                  </Typography>
                  <Button
                    variant="outlined"
                    disabled={page >= totalPages}
                    onClick={() => fetchArticles(selectedCategory, selectedPillar, search, page + 1)}
                    sx={{ textTransform: 'none' }}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Container>
      </Box>
    );

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
        <TranscommPublicHeader />
        {pageContent}
      </Box>
    );
  }

  return (
    <AppShell user={user} activeNavId="transcomm">
      {pageContent}
    </AppShell>
  );
}

export default KnowledgeHubClient;
