'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { TranscommPublicHeader } from '@/components/transcomm';
import { dzfColors } from '@/theme/colors';
import { canPublishArticles } from '@/lib/auth/rbac';
import type { ITokenPayload } from '@/lib/auth/jwt';
import type { ITranscommArticleData } from '@/lib/transcomm/types';
import { DRNICER_PILLARS, TRANSCOMM_CATEGORY_CONFIG } from '@/lib/transcomm/types';
import { DRNICERPill } from '@/components/transcomm/DRNICERPill';
import { ArticleCard } from '@/components/transcomm/ArticleCard';
import {
  ClockIcon,
  EyeIcon,
  ArrowLeftIcon,
  EditIcon,
  BookIcon,
  ExternalLinkIcon,
} from '@/components/ui/DZFIcons';

export interface ArticleReaderClientProps {
  user: ITokenPayload | null;
  article: ITranscommArticleData;
  relatedArticles: ITranscommArticleData[];
}

export function ArticleReaderClient({
  user,
  article,
  relatedArticles,
}: ArticleReaderClientProps) {
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const canEdit = user ? canPublishArticles(user.role) : false;
  const pillarMeta = article.drnicerValue ? DRNICER_PILLARS[article.drnicerValue] : null;
  const categoryMeta = TRANSCOMM_CATEGORY_CONFIG[article.category];

  const authorInitials = article.author
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const formattedDate = new Date(article.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Article link copied to clipboard!');
    }
  };

  /**
   * Render markdown formatted content for academic reader
   */
  const renderArticleBody = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let quoteBuffer: string[] = [];

    const flushList = () => {
      if (listBuffer.length > 0 && listType) {
        if (listType === 'ul') {
          elements.push(
            <Box
              component="ul"
              key={`ul-${elements.length}`}
              sx={{
                pl: 3,
                my: 2,
                color: dzfColors.surfaces.textPrimary,
                lineHeight: 1.8,
                fontSize: '1.05rem',
              }}
            >
              {listBuffer.map((item, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                </li>
              ))}
            </Box>
          );
        } else {
          elements.push(
            <Box
              component="ol"
              key={`ol-${elements.length}`}
              sx={{
                pl: 3,
                my: 2,
                color: dzfColors.surfaces.textPrimary,
                lineHeight: 1.8,
                fontSize: '1.05rem',
              }}
            >
              {listBuffer.map((item, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                </li>
              ))}
            </Box>
          );
        }
        listBuffer = [];
        listType = null;
      }
    };

    const flushQuote = () => {
      if (quoteBuffer.length > 0) {
        const rawQuote = quoteBuffer.join('\n');
        const isCallout = rawQuote.includes('[!NOTE]') || rawQuote.includes('[!TIP]');
        const cleanQuote = rawQuote.replace(/\[!(NOTE|TIP|IMPORTANT)\]\s*/g, '');

        elements.push(
          <Box
            key={`quote-${elements.length}`}
            sx={{
              pl: 3,
              pr: 2,
              py: 2,
              my: 3,
              borderLeft: `4px solid ${isCallout ? dzfColors.gold[500] : dzfColors.maroon[600]}`,
              backgroundColor: isCallout
                ? dzfColors.gold[50]
                : dzfColors.surfaces.canvas,
              borderRadius: '0 8px 8px 0',
              fontStyle: isCallout ? 'normal' : 'italic',
              color: dzfColors.navy[900],
              fontSize: '1.05rem',
              lineHeight: 1.7,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: formatInline(cleanQuote) }} />
          </Box>
        );
        quoteBuffer = [];
      }
    };

    const formatInline = (str: string) => {
      return str
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(
          /`(.*?)`/g,
          '<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>'
        );
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith('# ')) {
        flushList();
        flushQuote();
        elements.push(
          <Typography
            key={index}
            variant="h3"
            sx={{
              fontWeight: 800,
              color: dzfColors.navy[950],
              mt: 4,
              mb: 2,
              fontSize: { xs: '1.6rem', md: '2.1rem' },
            }}
          >
            {trimmed.substring(2)}
          </Typography>
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        flushList();
        flushQuote();
        elements.push(
          <Typography
            key={index}
            variant="h4"
            sx={{
              fontWeight: 700,
              color: dzfColors.navy[900],
              mt: 4,
              mb: 1.5,
              fontSize: { xs: '1.35rem', md: '1.7rem' },
              borderBottom: `1px solid ${dzfColors.surfaces.border}`,
              pb: 0.75,
            }}
          >
            {trimmed.substring(3)}
          </Typography>
        );
        return;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        flushList();
        flushQuote();
        elements.push(
          <Typography
            key={index}
            variant="h5"
            sx={{
              fontWeight: 600,
              color: dzfColors.maroon[800],
              mt: 3,
              mb: 1.25,
              fontSize: { xs: '1.15rem', md: '1.35rem' },
            }}
          >
            {trimmed.substring(4)}
          </Typography>
        );
        return;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        flushList();
        quoteBuffer.push(trimmed.substring(2));
        return;
      } else {
        flushQuote();
      }

      // Bullet List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushQuote();
        if (listType !== 'ul') flushList();
        listType = 'ul';
        listBuffer.push(trimmed.substring(2));
        return;
      }

      // Numbered List
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (olMatch) {
        flushQuote();
        if (listType !== 'ol') flushList();
        listType = 'ol';
        listBuffer.push(olMatch[2]);
        return;
      }

      flushList();

      if (!trimmed) {
        return;
      }

      // Paragraph
      elements.push(
        <Typography
          key={index}
          variant="body1"
          sx={{
            my: 2,
            color: dzfColors.surfaces.textPrimary,
            fontSize: { xs: '1rem', md: '1.08rem' },
            lineHeight: 1.8,
            letterSpacing: '0.01em',
          }}
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
        />
      );
    });

    flushList();
    flushQuote();

    return elements;
  };

  const pageContent = (
    <Box sx={{ pb: 10, backgroundColor: '#ffffff', minHeight: '100vh', flex: 1 }}>
      {/* Navigation & Breadcrumbs Bar */}
      <Box
          sx={{
            py: 2,
            borderBottom: `1px solid ${dzfColors.surfaces.border}`,
            backgroundColor: dzfColors.surfaces.canvas,
          }}
        >
          <Container maxWidth="md">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Button
                component={Link}
                href="/transcomm"
                startIcon={<ArrowLeftIcon size={16} />}
                sx={{
                  textTransform: 'none',
                  color: dzfColors.navy[700],
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }}
              >
                Back to Knowledge Hub
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCopyLink}
                  startIcon={<ExternalLinkIcon size={14} />}
                  sx={{ textTransform: 'none', fontSize: '0.78rem' }}
                >
                  Share Link
                </Button>

                {canEdit && (
                  <Button
                    component={Link}
                    href={`/dashboard/transcomm/${article._id}`}
                    size="small"
                    variant="contained"
                    startIcon={<EditIcon size={14} />}
                    sx={{
                      backgroundColor: dzfColors.maroon[800],
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      '&:hover': { backgroundColor: dzfColors.maroon[700] },
                    }}
                  >
                    Edit Article
                  </Button>
                )}
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Article Reading Canvas */}
        <Container maxWidth="md" sx={{ mt: { xs: 3, md: 5 } }}>
          {/* Taxonomy Pills */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={categoryMeta?.label || article.category}
              sx={{
                fontWeight: 600,
                backgroundColor: dzfColors.navy[50],
                color: dzfColors.navy[700],
                border: `1px solid ${dzfColors.navy[200]}`,
              }}
            />

            {article.drnicerValue && (
              <DRNICERPill
                pillar={article.drnicerValue}
                size="medium"
                variant="filled"
              />
            )}
          </Box>

          {/* Article Headline */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              color: dzfColors.navy[950],
              fontSize: { xs: '1.9rem', md: '2.75rem' },
              lineHeight: 1.25,
              mb: 2,
            }}
          >
            {article.title}
          </Typography>

          {/* Metadata Row: Author, Date, Read Time, Views */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              py: 2,
              my: 2,
              borderTop: `1px solid ${dzfColors.surfaces.border}`,
              borderBottom: `1px solid ${dzfColors.surfaces.border}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  fontWeight: 700,
                  backgroundColor: dzfColors.maroon[800],
                  color: '#ffffff',
                }}
              >
                {authorInitials || 'DZ'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[950] }}>
                  {article.author}
                </Typography>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                  Published on {formattedDate}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: dzfColors.surfaces.textMuted }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, fontSize: '0.85rem' }}>
                <ClockIcon size={16} color={dzfColors.surfaces.textMuted} />
                <span>{article.readTime}</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, fontSize: '0.85rem' }}>
                <EyeIcon size={16} color={dzfColors.surfaces.textMuted} />
                <span>{article.viewCount} views</span>
              </Box>
            </Box>
          </Box>

          {/* DRNICER Pillar Highlight Banner */}
          {pillarMeta && (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                my: 3,
                borderRadius: '10px',
                borderColor: pillarMeta.accentColor,
                backgroundColor: pillarMeta.bgLight,
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: pillarMeta.accentColor,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}
              >
                {pillarMeta.letter}
              </Box>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: dzfColors.navy[950], lineHeight: 1.2 }}
                >
                  Pillar of {pillarMeta.title}: {pillarMeta.tagline}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: dzfColors.surfaces.textSecondary, mt: 0.25 }}
                >
                  {pillarMeta.description}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Article Excerpt Callout */}
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: '1.18rem',
              fontWeight: 500,
              color: dzfColors.navy[700],
              lineHeight: 1.6,
              fontStyle: 'italic',
              my: 3,
              pl: 2,
              borderLeft: `3px solid ${dzfColors.maroon[600]}`,
            }}
          >
            {article.excerpt}
          </Typography>

          {/* Formatted Article Body */}
          <Box sx={{ mt: 3, mb: 6 }}>{renderArticleBody(article.content)}</Box>

          {/* Tags */}
          {article.tags.length > 0 && (
            <Box sx={{ pt: 3, borderTop: `1px solid ${dzfColors.surfaces.border}` }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.surfaces.textMuted, display: 'block', mb: 1 }}>
                ARTICLE TAGS
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {article.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={`#${tag}`}
                    size="small"
                    sx={{
                      backgroundColor: dzfColors.surfaces.canvas,
                      color: dzfColors.navy[700],
                      fontSize: '0.78rem',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && (
            <Box sx={{ mt: 8, pt: 4, borderTop: `2px solid ${dzfColors.surfaces.border}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BookIcon size={22} color={dzfColors.maroon[800]} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: dzfColors.navy[950] }}>
                  Related Knowledge & DRNICER Pillars
                </Typography>
              </Box>
              <Grid container spacing={3}>
                {relatedArticles.map((rel) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={rel._id}>
                    <ArticleCard article={rel} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Container>

        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={3000}
          onClose={() => setToastMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setToastMessage(null)}>
            {toastMessage}
          </Alert>
        </Snackbar>
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

export default ArticleReaderClient;
