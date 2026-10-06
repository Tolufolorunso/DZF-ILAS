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
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import DZFInput from '@/components/ui/DZFInput';
import { CloseIcon, BookIcon, CheckCircleIcon } from '@/components/ui/DZFIcons';
import { ICataloging } from '@/models/Cataloging';
import { DEWEY_CLASSES, validateClassification } from '@/lib/catalog/constants';

interface BookEditModalProps {
  open: boolean;
  onClose: () => void;
  book: ICataloging | null;
  onSuccess?: (updatedBook: ICataloging) => void;
}

interface BookEditFormProps {
  book: ICataloging;
  onClose: () => void;
  onSuccess?: (updatedBook: ICataloging) => void;
}

function BookEditForm({ book, onClose, onSuccess }: BookEditFormProps) {
  const [mainTitle, setMainTitle] = React.useState(book.title?.mainTitle || '');
  const [subtitle, setSubtitle] = React.useState(book.title?.subtitle || '');
  const [mainAuthor, setMainAuthor] = React.useState(book.author?.mainAuthor || '');
  const [additionalAuthors, setAdditionalAuthors] = React.useState(
    book.author?.additionalAuthors?.join(', ') || ''
  );
  const [publisher, setPublisher] = React.useState(book.publicationInfo?.publisher || '');
  const [place, setPlace] = React.useState(book.publicationInfo?.place || '');
  const [year, setYear] = React.useState(
    book.publicationInfo?.year ? String(book.publicationInfo.year) : ''
  );
  const [ISBN, setISBN] = React.useState(book.ISBN || '');
  const [classification, setClassification] = React.useState(book.classification || '800');
  const [shelfLocation, setShelfLocation] = React.useState(book.shelfLocation || '');
  const [copiesTotal, setCopiesTotal] = React.useState(String(book.copiesTotal || 1));
  const [genre, setGenre] = React.useState(
    Array.isArray(book.indexTermGenre)
      ? book.indexTermGenre.join(', ')
      : book.indexTermGenre || ''
  );
  const [informationSummary, setInformationSummary] = React.useState(
    book.informationSummary || ''
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mainTitle.trim()) {
      setError('Book main title is required.');
      return;
    }
    if (!mainAuthor.trim()) {
      setError('Main author is required.');
      return;
    }
    if (!validateClassification(classification)) {
      setError('Please provide a valid Dewey Decimal classification (e.g. "800", "510", "490.15").');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        mainTitle: mainTitle.trim(),
        subtitle: subtitle.trim(),
        mainAuthor: mainAuthor.trim(),
        additionalAuthors: additionalAuthors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        publisher: publisher.trim(),
        place: place.trim(),
        year: year.trim() ? parseInt(year.trim(), 10) : undefined,
        ISBN: ISBN.trim(),
        classification: classification.trim(),
        shelfLocation: shelfLocation.trim(),
        copiesTotal: Math.max(1, parseInt(copiesTotal.trim(), 10) || 1),
        indexTermGenre: genre
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
        informationSummary: informationSummary.trim(),
      };

      const identifier = book._id ? String(book._id) : book.barcode;
      const res = await fetch(`/api/catalog/${identifier}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update catalog record');
      }

      setSuccessMsg('Catalog record updated successfully!');
      if (onSuccess && data.book) {
        onSuccess(data.book);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'An error occurred while saving changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
              backgroundColor: 'rgba(111, 17, 17, 0.08)',
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
              Edit Catalog Record
            </Typography>
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
              Control No: {book.controlNumber} • Barcode: {book.barcode}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" disabled={saving} sx={{ color: dzfColors.surfaces.textMuted }}>
          <CloseIcon size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert
            icon={<CheckCircleIcon size={20} />}
            severity="success"
            sx={{ mb: 2.5, borderRadius: 2 }}
          >
            {successMsg}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          {/* Bibliographic Details */}
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: dzfColors.navy[900],
                borderBottom: `1px solid ${dzfColors.surfaces.border}`,
                pb: 0.5,
                mb: 1.5,
              }}
            >
              1. Bibliographic Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <DZFInput
              label="Book Main Title"
              required
              fullWidth
              value={mainTitle}
              onChange={(e) => setMainTitle(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <DZFInput
              label="Subtitle (Optional)"
              fullWidth
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <DZFInput
              label="Main Author"
              required
              fullWidth
              value={mainAuthor}
              onChange={(e) => setMainAuthor(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <DZFInput
              label="Additional Authors (Comma Separated)"
              fullWidth
              value={additionalAuthors}
              onChange={(e) => setAdditionalAuthors(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <DZFInput
              label="Publisher"
              fullWidth
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <DZFInput
              label="Place of Publication"
              fullWidth
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <DZFInput
              label="Publication Year"
              type="number"
              fullWidth
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <DZFInput
              label="ISBN"
              fullWidth
              value={ISBN}
              onChange={(e) => setISBN(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <DZFInput
              label="Genre / Tags (Comma Separated)"
              fullWidth
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </Grid>

          {/* Classification & Holdings */}
          <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: dzfColors.navy[900],
                borderBottom: `1px solid ${dzfColors.surfaces.border}`,
                pb: 0.5,
                mb: 1.5,
              }}
            >
              2. Classification & Shelf Location
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <DZFInput
              select
              label="Dewey Decimal Class"
              required
              fullWidth
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
            >
              {DEWEY_CLASSES.map((dc) => (
                <MenuItem key={dc.code} value={dc.code}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                      {dc.code} – {dc.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                      {dc.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </DZFInput>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <DZFInput
              label="Custom Classification (if exact decimal)"
              placeholder="e.g. 490.15 or 890"
              fullWidth
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              helperText="Enter exact Dewey code if different from preset."
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <DZFInput
              label="Shelf Location"
              required
              fullWidth
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <DZFInput
              label="Total Copies"
              type="number"
              required
              fullWidth
              value={copiesTotal}
              onChange={(e) => setCopiesTotal(e.target.value)}
              helperText="Updating total copies also syncs available copies if unborrowed."
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <DZFInput
              label="Summary / Annotation"
              multiline
              rows={3}
              fullWidth
              value={informationSummary}
              onChange={(e) => setInformationSummary(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${dzfColors.surfaces.border}`, gap: 1 }}>
        <DZFButton variant="soft" onClick={onClose} disabled={saving}>
          Cancel
        </DZFButton>
        <DZFButton
          type="submit"
          variant="primary"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <BookIcon size={16} />}
        >
          {saving ? 'Saving Changes...' : 'Save Catalog Record'}
        </DZFButton>
      </DialogActions>
    </form>
  );
}

export default function BookEditModal({
  open,
  onClose,
  book,
  onSuccess,
}: BookEditModalProps) {
  if (!book) return null;

  const key = book._id ? String(book._id) : book.barcode;

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
      <BookEditForm
        key={key}
        book={book}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
}
