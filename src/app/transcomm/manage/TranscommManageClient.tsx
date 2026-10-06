'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { dzfColors } from '@/theme/colors';
import type { ITokenPayload } from '@/lib/auth/jwt';
import type { ITranscommArticleData } from '@/lib/transcomm/types';
import { TRANSCOMM_CATEGORY_CONFIG } from '@/lib/transcomm/types';
import { DRNICERPill } from '@/components/transcomm/DRNICERPill';
import { DZFStatCard } from '@/components/ui/DZFStatCard';
import { DZFDataTable, Column } from '@/components/ui/DZFDataTable';
import { DZFSearchInput } from '@/components/ui/DZFSearchInput';
import {
  BookIcon,
  PlusIcon,
  EditIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  ActivityIcon,
  ClockIcon,
  RefreshIcon,
} from '@/components/ui/DZFIcons';

export interface TranscommManageClientProps {
  user: ITokenPayload;
  initialArticles: ITranscommArticleData[];
}

export function TranscommManageClient({
  user,
  initialArticles,
}: TranscommManageClientProps) {
  const [articles, setArticles] = React.useState<ITranscommArticleData[]>(initialArticles);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'draft'>('all');
  const [loading, setLoading] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  // Deletion dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<ITranscommArticleData | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const stats = React.useMemo(() => {
    const total = articles.length;
    const active = articles.filter((a) => a.isActive).length;
    const drafts = total - active;
    const views = articles.reduce((acc, a) => acc + (a.viewCount || 0), 0);
    return { total, active, drafts, views };
  }, [articles]);

  const refreshList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transcomm/articles?status=all&limit=100');
      const json = await res.json();
      if (json.success) {
        setArticles(json.data);
      }
    } catch (err) {
      console.error('Failed to refresh articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (article: ITranscommArticleData) => {
    try {
      const res = await fetch(`/api/transcomm/articles/${article._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus' }),
      });
      const json = await res.json();
      if (json.success) {
        setArticles((prev) =>
          prev.map((a) => (a._id === article._id ? json.data : a))
        );
        setToastSeverity('success');
        setToastMessage(json.message);
      } else {
        setToastSeverity('error');
        setToastMessage(json.error || 'Failed to toggle status.');
      }
    } catch {
      setToastSeverity('error');
      setToastMessage('Error toggling status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transcomm/articles/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setArticles((prev) => prev.filter((a) => a._id !== deleteTarget._id));
        setToastSeverity('success');
        setToastMessage('Article removed from database.');
        setDeleteTarget(null);
      } else {
        setToastSeverity('error');
        setToastMessage(json.error || 'Failed to delete article.');
      }
    } catch {
      setToastSeverity('error');
      setToastMessage('Error executing delete.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered dataset
  const filteredArticles = React.useMemo(() => {
    return articles.filter((art) => {
      if (statusFilter === 'active' && !art.isActive) return false;
      if (statusFilter === 'draft' && art.isActive) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = art.title.toLowerCase().includes(query);
        const matchesAuthor = art.author.toLowerCase().includes(query);
        const matchesExcerpt = art.excerpt.toLowerCase().includes(query);
        const matchesPillar = art.drnicerValue?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAuthor && !matchesExcerpt && !matchesPillar) {
          return false;
        }
      }

      return true;
    });
  }, [articles, statusFilter, search]);

  const columns: Column<ITranscommArticleData>[] = [
    {
      id: 'title',
      label: 'Title & Reading Link',
      minWidth: 260,
      render: (row) => (
        <Box>
          <Typography
            component={Link}
            href={`/transcomm/${row.slug}`}
            sx={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: dzfColors.navy[950],
              textDecoration: 'none',
              '&:hover': {
                color: dzfColors.maroon[800],
                textDecoration: 'underline',
              },
            }}
          >
            {row.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: dzfColors.surfaces.textMuted,
              fontFamily: 'monospace',
              fontSize: '0.72rem',
            }}
          >
            /{row.slug}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Category / Pillar',
      minWidth: 180,
      render: (row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
          <Chip
            label={TRANSCOMM_CATEGORY_CONFIG[row.category]?.label || row.category}
            size="small"
            sx={{
              fontSize: '0.72rem',
              fontWeight: 600,
              bgcolor: dzfColors.navy[50],
              color: dzfColors.navy[700],
            }}
          />
          {row.drnicerValue && (
            <DRNICERPill pillar={row.drnicerValue} size="small" variant="subtle" showTooltip={false} />
          )}
        </Box>
      ),
    },
    {
      id: 'author',
      label: 'Author',
      minWidth: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.surfaces.textPrimary }}>
          {row.author}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      render: (row) => (
        <Tooltip title="Click to toggle Active / Draft status" arrow>
          <Chip
            label={row.isActive ? 'Active' : 'Draft'}
            size="small"
            onClick={() => handleToggleStatus(row)}
            sx={{
              fontWeight: 700,
              fontSize: '0.74rem',
              cursor: 'pointer',
              bgcolor: row.isActive ? '#dcfce7' : '#f1f5f9',
              color: row.isActive ? '#15803d' : '#64748b',
              border: `1px solid ${row.isActive ? '#86efac' : '#cbd5e1'}`,
              '&:hover': {
                filter: 'brightness(0.95)',
              },
            }}
          />
        </Tooltip>
      ),
    },
    {
      id: 'views',
      label: 'Reads',
      minWidth: 90,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: dzfColors.surfaces.textMuted }}>
          <EyeIcon size={14} color={dzfColors.surfaces.textMuted} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.viewCount}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: 'Published',
      minWidth: 120,
      render: (row) => (
        <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
          {new Date(row.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 130,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Read Live">
            <IconButton
              component={Link}
              href={`/transcomm/${row.slug}`}
              size="small"
              sx={{ color: dzfColors.navy[700] }}
            >
              <EyeIcon size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Article">
            <IconButton
              component={Link}
              href={`/transcomm/manage/${row._id}`}
              size="small"
              sx={{ color: dzfColors.navy[700] }}
            >
              <EditIcon size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => setDeleteTarget(row)}
              sx={{ color: dzfColors.status.error.badge }}
            >
              <TrashIcon size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <AppShell user={user} activeNavId="transcomm">
      <Box sx={{ pb: 8, backgroundColor: '#ffffff', minHeight: '100vh' }}>
        {/* Management Header Banner */}
        <Box
          sx={{
            py: 4,
            px: { xs: 2, md: 4 },
            background: `linear-gradient(135deg, ${dzfColors.navy[950]} 0%, ${dzfColors.navy[900]} 70%, ${dzfColors.maroon[950]} 100%)`,
            color: '#ffffff',
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="overline" sx={{ color: dzfColors.gold[400], fontWeight: 800 }}>
                  EDITORIAL ADMINISTRATION
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff' }}>
                  Knowledge Hub Management Studio
                </Typography>
                <Typography variant="body2" sx={{ color: dzfColors.navy[200], mt: 0.5 }}>
                  Author, edit, review, and manage DRNICER values and leadership monographs.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  onClick={refreshList}
                  variant="outlined"
                  disabled={loading}
                  startIcon={<RefreshIcon size={16} />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': {
                      borderColor: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  Refresh
                </Button>

                <Button
                  component={Link}
                  href="/transcomm"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': {
                      borderColor: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  View Public Hub
                </Button>

                <Button
                  component={Link}
                  href="/transcomm/manage/new"
                  variant="contained"
                  startIcon={<PlusIcon size={18} />}
                  sx={{
                    backgroundColor: dzfColors.maroon[800],
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '8px',
                    boxShadow: '0 4px 14px rgba(111, 17, 17, 0.4)',
                    '&:hover': {
                      backgroundColor: dzfColors.maroon[700],
                    },
                  }}
                >
                  Write New Article
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {/* Summary Metric Cards */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DZFStatCard
                title="Total Articles"
                value={stats.total}
                subtitle="Monographs in database"
                icon={<BookIcon size={22} />}
                accentColor="navy"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DZFStatCard
                title="Live Published"
                value={stats.active}
                subtitle="Visible to scholars & readers"
                icon={<CheckCircleIcon size={22} />}
                accentColor="maroon"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DZFStatCard
                title="Draft Articles"
                value={stats.drafts}
                subtitle="Unpublished revisions"
                icon={<ClockIcon size={22} />}
                accentColor="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DZFStatCard
                title="Total Reads"
                value={stats.views}
                subtitle="Scholarly article impressions"
                icon={<ActivityIcon size={22} />}
                accentColor="gold"
              />
            </Grid>
          </Grid>

          {/* Filtering and Search Controls */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 3,
            }}
          >
            <Tabs
              value={statusFilter}
              onChange={(_, val) => setStatusFilter(val)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: dzfColors.maroon[800],
                },
              }}
            >
              <Tab value="all" label={`All Articles (${stats.total})`} />
              <Tab value="active" label={`Published (${stats.active})`} />
              <Tab value="draft" label={`Drafts (${stats.drafts})`} />
            </Tabs>

            <Box sx={{ width: { xs: '100%', sm: 280 } }}>
              <DZFSearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search title, author, pillar..."
              />
            </Box>
          </Box>

          {/* Data Table */}
          <DZFDataTable
            columns={columns}
            data={filteredArticles}
            loading={loading}
            emptyTitle="No articles found"
            emptyDescription="No articles match your search or filter criteria in the management studio."
            keyExtractor={(row) => row._id}
          />
        </Container>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={Boolean(deleteTarget)}
          onClose={() => !deleting && setDeleteTarget(null)}
        >
          <DialogTitle sx={{ fontWeight: 800, color: dzfColors.navy[950] }}>
            Delete Article?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to permanently delete{' '}
              <strong>&quot;{deleteTarget?.title}&quot;</strong>? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              color="error"
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {deleting ? 'Deleting...' : 'Delete Article'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Snackbar */}
        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={3500}
          onClose={() => setToastMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={toastSeverity}
            onClose={() => setToastMessage(null)}
            sx={{ width: '100%' }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AppShell>
  );
}

export default TranscommManageClient;
