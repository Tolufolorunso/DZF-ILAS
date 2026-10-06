'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Link from 'next/link';
import { dzfColors } from '@/theme/colors';
import { EyeIcon, ClockIcon } from '@/components/ui/DZFIcons';
import { DRNICERPill } from './DRNICERPill';
import type { ITranscommArticleData } from '@/lib/transcomm/types';
import { TRANSCOMM_CATEGORY_CONFIG } from '@/lib/transcomm/types';

export interface ArticleCardProps {
  article: ITranscommArticleData;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const categoryLabel =
    TRANSCOMM_CATEGORY_CONFIG[article.category]?.label || article.category;

  const authorInitials = article.author
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  return (
    <Card
      component={Link}
      href={`/transcomm/${article.slug}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: featured ? dzfColors.maroon[300] : dzfColors.surfaces.border,
        backgroundColor: '#ffffff',
        boxShadow: featured
          ? '0 6px 20px rgba(111, 17, 17, 0.08)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: dzfColors.navy[200],
          boxShadow: '0 10px 24px rgba(23, 50, 77, 0.12)',
        },
      }}
    >
      {featured && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${dzfColors.maroon[700]}, ${dzfColors.gold[500]}, ${dzfColors.navy[700]})`,
          }}
        />
      )}

      <CardContent
        sx={{
          p: 3,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&:last-child': { pb: 3 },
        }}
      >
        {/* Badges / Taxonomy Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={categoryLabel}
              size="small"
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
                backgroundColor: dzfColors.navy[50],
                color: dzfColors.navy[700],
                border: `1px solid ${dzfColors.navy[200]}`,
              }}
            />

            {article.drnicerValue && (
              <DRNICERPill
                pillar={article.drnicerValue}
                size="small"
                variant="subtle"
                showTooltip={false}
              />
            )}
          </Box>

          {/* Read Time */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: dzfColors.surfaces.textMuted,
              fontSize: '0.75rem',
            }}
          >
            <ClockIcon size={14} color={dzfColors.surfaces.textMuted} />
            <span>{article.readTime}</span>
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant={featured ? 'h5' : 'h6'}
          sx={{
            fontWeight: 700,
            color: dzfColors.navy[950],
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.title}
        </Typography>

        {/* Excerpt */}
        <Typography
          variant="body2"
          sx={{
            color: dzfColors.surfaces.textSecondary,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: featured ? 3 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flexGrow: 1,
          }}
        >
          {article.excerpt}
        </Typography>

        {/* Footer: Author & Metrics */}
        <Box
          sx={{
            pt: 1.5,
            mt: 'auto',
            borderTop: `1px solid ${dzfColors.surfaces.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 26,
                height: 26,
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: dzfColors.maroon[800],
                color: '#ffffff',
              }}
            >
              {authorInitials || 'DZ'}
            </Avatar>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: dzfColors.surfaces.textPrimary,
              }}
            >
              {article.author}
            </Typography>
          </Box>

          {/* View Counter */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: dzfColors.surfaces.textMuted,
              fontSize: '0.75rem',
            }}
          >
            <EyeIcon size={14} color={dzfColors.surfaces.textMuted} />
            <span>{article.viewCount} views</span>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ArticleCard;
