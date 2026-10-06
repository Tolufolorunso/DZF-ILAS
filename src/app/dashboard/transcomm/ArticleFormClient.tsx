'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { dzfColors } from '@/theme/colors';
import type { ITokenPayload } from '@/lib/auth/jwt';
import type {
  ITranscommArticleData,
  DRNICERValue,
  TranscommCategory,
} from '@/lib/transcomm/types';
import {
  DRNICER_PILLARS,
  TRANSCOMM_CATEGORY_CONFIG,
} from '@/lib/transcomm/types';
import { slugify } from '@/lib/transcomm/utils';
import { RichArticleEditor } from '@/components/transcomm/RichArticleEditor';
import { ArrowLeftIcon, CheckIcon } from '@/components/ui/DZFIcons';

export interface ArticleFormClientProps {
  user: ITokenPayload;
  mode: 'create' | 'edit';
  initialArticle?: ITranscommArticleData;
}

const CATEGORY_KEYS: TranscommCategory[] = [
  'drnicer-values',
  'leadership-basics',
  'communication',
  'teamwork',
  'problem-solving',
  'confidence',
  'inspiration',
];

const DRNICER_KEYS: DRNICERValue[] = [
  'Discipline',
  'Respect',
  'Nobility',
  'Integrity',
  'Compassion',
  'Excellence',
  'Responsibility',
];

export function ArticleFormClient({
  user,
  mode,
  initialArticle,
}: ArticleFormClientProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(initialArticle?.title || '');
  const [slug, setSlug] = React.useState(initialArticle?.slug || '');
  const [slugAuto, setSlugAuto] = React.useState(mode === 'create');
  const [category, setCategory] = React.useState<TranscommCategory>(
    initialArticle?.category || 'drnicer-values'
  );
  const [drnicerValue, setDrnicerValue] = React.useState<DRNICERValue | ''>(
    initialArticle?.drnicerValue || 'Discipline'
  );
  const [author, setAuthor] = React.useState(
    initialArticle?.author || user.name || user.username || 'DZF Editorial'
  );
  const [tags, setTags] = React.useState(
    initialArticle?.tags ? initialArticle.tags.join(', ') : ''
  );
  const [excerpt, setExcerpt] = React.useState(initialArticle?.excerpt || '');
  const [content, setContent] = React.useState(initialArticle?.content || '');
  const [isActive, setIsActive] = React.useState(
    initialArticle !== undefined ? initialArticle.isActive : true
  );

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Auto-slug generation
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (slugAuto) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Article title is required.');
      return;
    }

    if (category === 'drnicer-values' && !drnicerValue) {
      setError('Please select the DRNICER pillar associated with this article.');
      return;
    }

    if (!excerpt.trim()) {
      setError('A short excerpt is required for directory previews.');
      return;
    }

    if (!content.trim() || content.trim().length < 200) {
      setError(
        `Article content must be at least 200 characters long (currently ${content.trim().length}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        category,
        drnicerValue: category === 'drnicer-values' ? drnicerValue : undefined,
        author: author.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        excerpt: excerpt.trim(),
        content: content.trim(),
        isActive,
      };

      const url =
        mode === 'create'
          ? '/api/transcomm/articles'
          : `/api/transcomm/articles/${initialArticle?._id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to save article.');
      }

      router.push('/dashboard/transcomm');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell user={user} activeNavId="transcomm">
      <Box sx={{ pb: 8, backgroundColor: '#ffffff', minHeight: '100vh' }}>
        {/* Top Header */}
        <Box
          sx={{
            py: 3,
            px: { xs: 2, md: 4 },
            borderBottom: `1px solid ${dzfColors.surfaces.border}`,
            backgroundColor: dzfColors.surfaces.canvas,
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Button
                component={Link}
                href="/dashboard/transcomm"
                startIcon={<ArrowLeftIcon size={16} />}
                sx={{
                  textTransform: 'none',
                  color: dzfColors.navy[700],
                  fontWeight: 600,
                }}
              >
                Back to Editorial Studio
              </Button>

              <Typography variant="subtitle2" sx={{ color: dzfColors.surfaces.textMuted }}>
                {mode === 'create' ? 'New Article Draft' : `Editing: ${initialArticle?.title}`}
              </Typography>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: '12px',
                borderColor: dzfColors.surfaces.border,
                mb: 4,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, color: dzfColors.navy[950], mb: 3 }}>
                {mode === 'create' ? 'Author New Article' : 'Edit Article Content'}
              </Typography>

              {/* Title Input */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Article Title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Discipline: The Cornerstone of Scholarly Mastery"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '1.15rem',
                      fontWeight: 700,
                    },
                  }}
                />
              </Box>

              {/* Slug Input */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="URL Slug (Auto-generated or custom)"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugAuto(false);
                  }}
                  helperText={`Public route: /transcomm/${slug || 'article-slug'}`}
                />
              </Box>

              {/* Category & DRNICER Pillar Selectors */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                  mb: 3,
                }}
              >
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={category}
                    label="Category"
                    onChange={(e) => setCategory(e.target.value as TranscommCategory)}
                  >
                    {CATEGORY_KEYS.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {TRANSCOMM_CATEGORY_CONFIG[cat].label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {TRANSCOMM_CATEGORY_CONFIG[category].description}
                  </FormHelperText>
                </FormControl>

                {category === 'drnicer-values' && (
                  <FormControl fullWidth required>
                    <InputLabel>DRNICER Core Pillar</InputLabel>
                    <Select
                      value={drnicerValue}
                      label="DRNICER Core Pillar"
                      onChange={(e) => setDrnicerValue(e.target.value as DRNICERValue)}
                    >
                      {DRNICER_KEYS.map((p) => (
                        <MenuItem key={p} value={p}>
                          {DRNICER_PILLARS[p].letter} — {p}: {DRNICER_PILLARS[p].tagline}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Associates this article with one of the 7 institutional virtues
                    </FormHelperText>
                  </FormControl>
                )}
              </Box>

              {/* Author & Tags */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                  mb: 3,
                }}
              >
                <TextField
                  fullWidth
                  required
                  label="Author / Byline"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Dr. T. Folorunso or DZF Editorial Board"
                />

                <TextField
                  fullWidth
                  label="Tags (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. discipline, study-habits, scholarship"
                />
              </Box>

              {/* Excerpt */}
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={2}
                  label="Article Excerpt / Teaser"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A concise summary (1-2 sentences) displayed on cards and search results..."
                  helperText="Appears on directory cards, previews, and meta description"
                />
              </Box>

              {/* Rich Markdown Article Editor */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: dzfColors.navy[950], mb: 1 }}
                >
                  Article Body (Rich Formatting & Live Preview)
                </Typography>
                <RichArticleEditor
                  content={content}
                  onChange={(val) => setContent(val)}
                  minChars={200}
                />
              </Box>

              {/* Publishing Controls */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  pt: 3,
                  borderTop: `1px solid ${dzfColors.surfaces.border}`,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {isActive ? 'Publish Live' : 'Save as Draft'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                        {isActive
                          ? 'Visible to all patrons and mobile readers immediately'
                          : 'Hidden from public directory; visible in editorial studio only'}
                      </Typography>
                    </Box>
                  }
                />

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    component={Link}
                    href="/dashboard/transcomm"
                    variant="outlined"
                    disabled={submitting}
                    sx={{ textTransform: 'none' }}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    startIcon={
                      submitting ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CheckIcon size={16} />
                      )
                    }
                    sx={{
                      backgroundColor: dzfColors.maroon[800],
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 3,
                      '&:hover': {
                        backgroundColor: dzfColors.maroon[700],
                      },
                    }}
                  >
                    {submitting
                      ? 'Saving...'
                      : mode === 'create'
                      ? isActive
                        ? 'Publish Article Live'
                        : 'Save as Draft'
                      : 'Update Article'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
    </AppShell>
  );
}

export default ArticleFormClient;
