'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFBadge from '@/components/ui/DZFBadge';
import { CloseIcon, PrinterIcon, BookIcon, EditIcon, TrashIcon } from '@/components/ui/DZFIcons';
import { ICataloging } from '@/models/Cataloging';

interface BookDetailModalProps {
  open: boolean;
  onClose: () => void;
  book: Partial<ICataloging> | null;
  onPrintLabel: (book: Partial<ICataloging>) => void;
  onEdit?: (book: ICataloging) => void;
  onDelete?: (book: ICataloging) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function BookDetailModal({
  open,
  onClose,
  book,
  onPrintLabel,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: BookDetailModalProps) {
  if (!book) return null;

  const title = book.title?.mainTitle || 'Untitled Book';
  const subtitle = book.title?.subtitle;
  const author = book.author?.mainAuthor || 'Unknown Author';
  const additional = book.author?.additionalAuthors?.join(', ');
  const isAvailable = !book.isCheckedOut;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${dzfColors.surfaces.border}`,
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: 'rgba(128, 0, 32, 0.08)',
              color: dzfColors.maroon[900],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookIcon size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, color: dzfColors.navy[900] }}>
              Bibliographic Catalog Card
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Control No: {book.controlNumber || 'N/A'} • Barcode: {book.barcode || 'N/A'}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: dzfColors.surfaces.textMuted }}>
          <CloseIcon size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
        <Grid container spacing={3}>
          {/* Left Column: Book Cover & Status Pill */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                width: '100%',
                height: 220,
                borderRadius: 2,
                backgroundColor: '#f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: `1.5px solid ${dzfColors.surfaces.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                mb: 2,
              }}
            >
              {book.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.image_url}
                  alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', p: 2, color: dzfColors.surfaces.textMuted }}>
                  <BookIcon size={48} color={dzfColors.gold[500]} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                    No Cover Uploaded
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <DZFBadge
                variant={isAvailable ? 'success' : 'warning'}
                label={isAvailable ? 'AVAILABLE FOR LOAN' : 'CURRENTLY BORROWED'}
                solid
                sx={{ width: '100%', py: 0.5, justifyContent: 'center' }}
              />

              <Box sx={{ p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: `1px solid ${dzfColors.surfaces.border}` }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  Shelf / Physical Location
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                  {book.shelfLocation || 'Main Stacks'}
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: `1px solid ${dzfColors.surfaces.border}` }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  Holdings & Copies
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                  {book.copiesAvailable ?? 1} Available of {book.copiesTotal ?? 1} Total
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right Column: Bibliographic Details */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="overline" sx={{ color: dzfColors.gold[700], fontWeight: 800, letterSpacing: '0.08em' }}>
                DEWEY DECIMAL CLASS: {book.classification || '000'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: dzfColors.navy[900], lineHeight: 1.25, textTransform: 'capitalize' }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body1" sx={{ color: dzfColors.surfaces.textSecondary, mt: 0.5, fontStyle: 'italic' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  Main Author
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900], textTransform: 'capitalize' }}>
                  {author}
                </Typography>
              </Grid>

              {additional && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                    Additional Authors
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: dzfColors.navy[900], textTransform: 'capitalize' }}>
                    {additional}
                  </Typography>
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  Publisher & Year
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: dzfColors.navy[900] }}>
                  {book.publicationInfo?.publisher || 'N/A'}, {book.publicationInfo?.year || 'N/A'} ({book.publicationInfo?.place || 'Nigeria'})
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  ISBN
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[900] }}>
                  {book.ISBN || 'N/A'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  Accession Control Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.maroon[900] }}>
                  {book.controlNumber || 'N/A'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                  System Barcode
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: dzfColors.navy[900] }}>
                  {book.barcode || 'N/A'}
                </Typography>
              </Grid>

              {book.indexTermGenre && book.indexTermGenre.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block', mb: 0.5 }}>
                    Genres & Index Subjects
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {book.indexTermGenre.map((g, idx) => (
                      <DZFBadge key={idx} variant="info" size="small" label={g.trim()} />
                    ))}
                  </Box>
                </Grid>
              )}

              {book.informationSummary && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block', mb: 0.5 }}>
                    Summary / Abstract
                  </Typography>
                  <Typography variant="body2" sx={{ color: dzfColors.navy[700], lineHeight: 1.6, fontSize: '0.875rem' }}>
                    {book.informationSummary}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${dzfColors.surfaces.border}`,
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <DZFButton variant="soft" onClick={onClose}>
            Close Card
          </DZFButton>

          {canDelete && onDelete && (
            <DZFButton
              variant="danger"
              startIcon={<TrashIcon size={16} />}
              onClick={() => {
                onClose();
                onDelete(book as ICataloging);
              }}
            >
              Delete Book
            </DZFButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {canEdit && onEdit && (
            <DZFButton
              variant="secondary"
              startIcon={<EditIcon size={18} />}
              onClick={() => {
                onClose();
                onEdit(book as ICataloging);
              }}
            >
              Edit Book
            </DZFButton>
          )}

          <DZFButton
            variant="primary"
            startIcon={<PrinterIcon size={18} />}
            onClick={() => onPrintLabel(book)}
          >
            Print 60×40mm Thermal Label
          </DZFButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
